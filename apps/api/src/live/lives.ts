/*
 * پخش زنده به‌عنوان واحد مستقل (۱.۹) — روی جدول برنامه‌ها (events.is_live = true)، جدا از برنامه‌های حضوری.
 *
 * سازنده‌ها: ستاد (مستقیم یا به نام یک برگزارکننده)، تیم برگزارکننده (به نام خودش)، استاد (فقط برای دوره‌های خودش).
 * مخاطب: همه | کنشگران یک مسیر | شرکت‌کنندگان یک دوره. بی‌بازبینی منتشر می‌شود؛ ستاد هر وقت لازم شد متوقف می‌کند.
 * مخاطب «یادم بینداز» می‌زند (همان ثبت‌نام) و از ۱۵ دقیقه پیش با یک ضربه وارد می‌شود؛ ورود خودش ثبت‌نام هم هست.
 */
import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, HttpCode, Injectable, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Length, Max, MaxLength, Min } from 'class-validator';
import { and, desc, eq, gt, inArray, isNull, lte, or, sql } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import { userIdByMobile } from '../auth/mobiles';
import { AuthUser, CurrentUser, Roles } from '../common/auth.decorators';
import { normalizeMobile } from '../common/mobile';
import { config } from '../config';
import { Db, InjectDb } from '../db/db.module';
import { auditLogs, courses, enrollments, events, liveRecordings, pathEnrollments, paths2, publisherAdmins, publishers, registrations, users } from '../db/schema';
import { Notifier } from '../notifications/notifications';
import { bbbEnabled, LiveService } from './live';

const err = (code: string, message: string) => ({ code, message });
const MIN = 60_000;
const OPEN_BEFORE = 15 * MIN; // ورود مخاطب از ۱۵ دقیقه پیش از شروع
const HQ = (u: AuthUser) => u.roles.includes('HQ_ADMIN') || u.roles.includes('HQ_OPERATOR');
type Ev = typeof events.$inferSelect;
const checkCode = () => randomBytes(4).toString('hex').toUpperCase();

export class LiveCreateDto {
  @IsString() @Length(3, 120) title: string;
  @IsOptional() @IsString() @MaxLength(1000) about?: string;
  @IsOptional() @IsBoolean() now?: boolean;
  @IsOptional() @IsString() startsAt?: string;
  @IsInt() @Min(15) @Max(240) minutes: number;
  @IsIn(['ALL', 'PATH', 'COURSE']) audience: 'ALL' | 'PATH' | 'COURSE';
  @IsOptional() @IsString() pathId?: string;
  @IsOptional() @IsString() courseId?: string;
  @IsOptional() @IsString() publisherId?: string; // فقط ستاد: به نام کدام برگزارکننده (خالی = ستاد)
  @IsOptional() @IsString() hostMobile?: string; // میزبان دیگر (مثلاً یک استاد)؛ خالی = خودم
  @IsOptional() @IsBoolean() record?: boolean;
  @IsOptional() @IsString() @MaxLength(500) onlineUrl?: string; // وقتی سرور کلاس مدرسه راه نیفتاده
}
export class LivePatchDto {
  @IsOptional() @IsString() @Length(3, 120) title?: string;
  @IsOptional() @IsString() @MaxLength(1000) about?: string;
  @IsOptional() @IsString() startsAt?: string;
  @IsOptional() @IsInt() @Min(15) @Max(240) minutes?: number;
  @IsOptional() @IsBoolean() record?: boolean;
  @IsOptional() @IsString() @MaxLength(500) onlineUrl?: string;
}
class StopDto { @IsString() @Length(2, 300) reason: string }

@Injectable()
export class LivesService {
  constructor(@InjectDb() private readonly db: Db, private readonly live: LiveService, private readonly notify: Notifier) {}

  // ───────── دسترسی
  private async myPublisherIds(userId: string) {
    const r = await this.db.select({ id: publishers.id }).from(publisherAdmins).innerJoin(publishers, eq(publishers.id, publisherAdmins.publisherId))
      .where(and(eq(publisherAdmins.userId, userId), eq(publishers.status, 'ACTIVE')));
    return r.map((x) => x.id);
  }
  private async myCourses(userId: string) {
    return this.db.select({ id: courses.id, title: courses.title, publisherId: courses.publisherId }).from(courses).where(eq(courses.instructorId, userId));
  }
  /** میزبان: سازنده، میزبان تعیین‌شده، تیم برگزارکننده، ستاد */
  async isHost(u: AuthUser, e: Ev) {
    if (HQ(u) || e.createdById === u.id || e.instructorId === u.id) return true;
    return !!e.publisherId && (await this.myPublisherIds(u.id)).includes(e.publisherId);
  }
  /** مخاطب این پخش هست؟ (میزبان همیشه) */
  private async inAudience(u: AuthUser, e: Ev) {
    if (await this.isHost(u, e)) return true;
    if (e.audiencePathId) return !!(await this.db.query.pathEnrollments.findFirst({ where: and(eq(pathEnrollments.pathId, e.audiencePathId), eq(pathEnrollments.userId, u.id)) }));
    if (e.courseId && e.audienceCourseOnly) return !!(await this.db.query.enrollments.findFirst({ where: and(eq(enrollments.courseId, e.courseId), eq(enrollments.userId, u.id)) }));
    return true;
  }
  private async get(id: string) {
    const e = await this.db.query.events.findFirst({ where: and(eq(events.id, id), eq(events.isLive, true)) });
    if (!e) throw new NotFoundException(err('no_live', 'این پخش زنده پیدا نشد'));
    return e;
  }

  async options(u: AuthUser) {
    const pubIds = await this.myPublisherIds(u.id);
    const mine = await this.myCourses(u.id);
    const hq = HQ(u);
    const canCreate = hq || pubIds.length > 0 || mine.length > 0;
    const pubs = hq ? await this.db.select({ id: publishers.id, name: publishers.name }).from(publishers).where(eq(publishers.status, 'ACTIVE')).orderBy(publishers.name)
      : pubIds.length ? await this.db.select({ id: publishers.id, name: publishers.name }).from(publishers).where(inArray(publishers.id, pubIds)) : [];
    const ps = hq ? await this.db.select({ id: paths2.id, title: paths2.title, publisherId: paths2.publisherId }).from(paths2).where(eq(paths2.status, 'PUBLISHED')).orderBy(paths2.title)
      : pubIds.length ? await this.db.select({ id: paths2.id, title: paths2.title, publisherId: paths2.publisherId }).from(paths2).where(inArray(paths2.publisherId, pubIds)).orderBy(paths2.title) : [];
    const cs = hq ? await this.db.select({ id: courses.id, title: courses.title, publisherId: courses.publisherId }).from(courses).where(eq(courses.status, 'PUBLISHED')).orderBy(courses.title)
      : [...(pubIds.length ? await this.db.select({ id: courses.id, title: courses.title, publisherId: courses.publisherId }).from(courses).where(inArray(courses.publisherId, pubIds)) : []), ...mine]
        .filter((c, i, a) => a.findIndex((x) => x.id === c.id) === i);
    return {
      canCreate, bbb: bbbEnabled(), hq,
      // استادی که برگزارکننده نیست، فقط برای دوره‌های خودش پخش می‌سازد
      onlyCourses: !hq && !pubIds.length,
      publishers: pubs, paths: ps, courses: cs,
    };
  }

  async create(u: AuthUser, d: LiveCreateDto) {
    const o = await this.options(u);
    if (!o.canCreate) throw new ForbiddenException(err('forbidden', 'پخش زنده را ستاد، برگزارکنندگان و استادها می‌سازند'));
    let publisherId: string | null = null;
    let courseId: string | null = null, pathId: string | null = null;
    if (o.onlyCourses && d.audience !== 'COURSE') throw new BadRequestException(err('only_course', 'استاد پخش زنده را برای یکی از دوره‌های خودش می‌سازد'));
    if (d.audience === 'COURSE') {
      const c = o.courses.find((x) => x.id === d.courseId);
      if (!c) throw new BadRequestException(err('no_course', 'دوره را از فهرست انتخاب کن'));
      courseId = c.id; publisherId = c.publisherId;
    } else if (d.audience === 'PATH') {
      const p = o.paths.find((x) => x.id === d.pathId);
      if (!p) throw new BadRequestException(err('no_path', 'مسیر را از فهرست انتخاب کن'));
      pathId = p.id; publisherId = p.publisherId;
    }
    if (!publisherId) {
      if (o.hq) publisherId = d.publisherId ? (o.publishers.find((p) => p.id === d.publisherId)?.id ?? null) : null;
      else publisherId = (d.publisherId && o.publishers.some((p) => p.id === d.publisherId)) ? d.publisherId : o.publishers[0]?.id ?? null;
    }
    const start = d.now ? new Date() : d.startsAt ? new Date(d.startsAt) : null;
    if (!start || isNaN(start.getTime())) throw new BadRequestException(err('no_time', 'زمان شروع را بگو یا «همین الان» را بزن'));
    if (!d.now && start.getTime() < Date.now() - 5 * MIN) throw new BadRequestException(err('past', 'زمان شروع گذشته است'));
    const useBbb = bbbEnabled();
    const url = d.onlineUrl?.trim() || null;
    if (!useBbb && !url) throw new BadRequestException(err('need_link', 'سرور کلاس مدرسه هنوز راه نیفتاده؛ پیوند کلاس (اسکای‌روم، گوگل‌میت…) را بگذار'));
    if (url && !/^https?:\/\/\S+$/i.test(url)) throw new BadRequestException(err('bad_link', 'پیوند کلاس باید با https:// شروع شود'));
    let hostId: string | null = null;
    if (d.hostMobile?.trim()) {
      const m = normalizeMobile(d.hostMobile); if (!m) throw new BadRequestException(err('bad_mobile', 'شمارهٔ میزبان درست نیست'));
      hostId = await userIdByMobile(this.db, m);
      if (!hostId) throw new BadRequestException(err('no_host', 'میزبان باید یک بار با همین شماره وارد مدرسه شده باشد'));
    }
    const host = hostId ? await this.db.query.users.findFirst({ where: eq(users.id, hostId), columns: { firstName: true, lastName: true } }) : await this.db.query.users.findFirst({ where: eq(users.id, u.id), columns: { firstName: true, lastName: true } });
    const [e] = await this.db.insert(events).values({
      title: d.title.trim(), description: d.about?.trim() || null, kind: 'ONLINE', startsAt: start, endsAt: new Date(start.getTime() + d.minutes * MIN),
      onlineUrl: useBbb ? null : url, useBbb, record: useBbb && d.record !== false, isLive: true, publisherId, instructorId: hostId ?? u.id,
      hostName: host ? `${host.firstName} ${host.lastName}`.trim() : null, courseId, audiencePathId: pathId, audienceCourseOnly: d.audience === 'COURSE',
      status: 'PUBLISHED', reviewStatus: 'PUBLISHED', waitlist: false, createdById: u.id,
    } as any).returning();
    await this.db.insert(auditLogs).values({ actorId: u.id, action: 'live.create', target: e.id, meta: { title: e.title } } as any);
    // مخاطبان مسیر یا دوره همان لحظه خبر می‌گیرند؛ پخش «همه» فقط در صفحه‌ها دیده می‌شود
    const ids = await this.audienceIds(e);
    if (ids.length) await this.notify.send(ids.filter((x) => x !== u.id), { kind: 'event_reminder', title: d.now ? `الان زنده: «${e.title}»` : `پخش زندهٔ تازه: «${e.title}»`, body: d.now ? 'با یک ضربه وارد شو' : 'یادت می‌اندازیم؛ از ربع ساعت پیش از شروع وارد شو', link: `/live/${e.id}` });
    return { id: e.id };
  }

  /** کنشگران مسیر یا دورهٔ مخاطب (برای خبر و یادآوری) */
  async audienceIds(e: Ev): Promise<string[]> {
    if (e.audiencePathId) return (await this.db.select({ u: pathEnrollments.userId }).from(pathEnrollments).where(and(eq(pathEnrollments.pathId, e.audiencePathId), isNull(pathEnrollments.completedAt)))).map((r) => r.u);
    if (e.courseId && e.audienceCourseOnly) return (await this.db.select({ u: enrollments.userId }).from(enrollments).where(eq(enrollments.courseId, e.courseId))).map((r) => r.u);
    return [];
  }

  private state(e: Ev) {
    const now = Date.now();
    if (e.status === 'CANCELLED') return 'STOPPED';
    if (now > e.endsAt.getTime()) return 'ENDED';
    if (now >= e.startsAt.getTime()) return 'LIVE';
    return 'SOON';
  }
  private async card(e: Ev, u: AuthUser, extra = false) {
    const pub = e.publisherId ? await this.db.query.publishers.findFirst({ where: eq(publishers.id, e.publisherId), columns: { id: true, name: true, color: true } }) : null;
    const reg = await this.db.query.registrations.findFirst({ where: and(eq(registrations.eventId, e.id), eq(registrations.userId, u.id)) });
    const recs = await this.db.select({ n: sql<number>`count(*)::int` }).from(liveRecordings).where(and(eq(liveRecordings.eventId, e.id), isNull(liveRecordings.deletedAt)));
    const aud = e.audiencePathId ? (await this.db.query.paths2.findFirst({ where: eq(paths2.id, e.audiencePathId), columns: { title: true } }))?.title
      : e.courseId && e.audienceCourseOnly ? (await this.db.query.courses.findFirst({ where: eq(courses.id, e.courseId), columns: { title: true } }))?.title : null;
    return {
      id: e.id, title: e.title, about: e.description, startsAt: e.startsAt, endsAt: e.endsAt, state: this.state(e), host: e.hostName,
      publisher: pub ?? { id: null, name: 'ستاد مدرسهٔ هدایت', color: '#1E3A9E' },
      audience: e.audiencePathId ? { kind: 'PATH', title: aud } : e.courseId && e.audienceCourseOnly ? { kind: 'COURSE', title: aud } : { kind: 'ALL', title: null },
      reminded: reg?.status === 'REGISTERED', hasRecording: (recs[0]?.n ?? 0) > 0, record: e.record, useBbb: e.useBbb,
      joinOpensAt: new Date(e.startsAt.getTime() - OPEN_BEFORE), canManage: extra ? await this.isHost(u, e) : undefined,
      stopReason: e.status === 'CANCELLED' ? e.cancelReason : undefined,
    };
  }

  /** زبانهٔ «پخش زنده» در یادگیری: الان، به‌زودی، ضبط‌ها */
  async list(u: AuthUser) {
    const now = new Date();
    const rows = await this.db.select().from(events).where(and(eq(events.isLive, true), eq(events.status, 'PUBLISHED'), gt(events.endsAt, new Date(now.getTime() - 180 * 86400_000)))).orderBy(events.startsAt);
    const vis: Ev[] = [];
    for (const e of rows) if (await this.inAudience(u, e)) vis.push(e);
    const live = vis.filter((e) => e.startsAt <= now && e.endsAt > now);
    const soon = vis.filter((e) => e.startsAt > now).slice(0, 30);
    const past = vis.filter((e) => e.endsAt <= now).reverse();
    const recorded = [] as any[];
    for (const e of past) { const c = await this.card(e, u); if (c.hasRecording) recorded.push(c); if (recorded.length >= 30) break; }
    return { now: await Promise.all(live.map((e) => this.card(e, u))), soon: await Promise.all(soon.map((e) => this.card(e, u))), recorded };
  }
  /** نوار «الان زنده است»: پخش‌های در جریان (و ربع ساعت مانده به شروع) که من مخاطبشان هستم */
  async nowBar(u: AuthUser) {
    const now = Date.now();
    const rows = await this.db.select().from(events).where(and(eq(events.isLive, true), eq(events.status, 'PUBLISHED'), lte(events.startsAt, new Date(now + OPEN_BEFORE)), gt(events.endsAt, new Date(now))));
    const out = [] as { id: string; title: string; startsAt: Date; live: boolean }[];
    for (const e of rows) if (await this.inAudience(u, e)) out.push({ id: e.id, title: e.title, startsAt: e.startsAt, live: e.startsAt.getTime() <= now });
    return out;
  }

  async detail(u: AuthUser, id: string) {
    const e = await this.get(id);
    if (e.status !== 'PUBLISHED' && !(await this.isHost(u, e))) throw new NotFoundException(err('no_live', 'این پخش زنده دیگر در دسترس نیست'));
    const inA = await this.inAudience(u, e);
    return { ...(await this.card(e, u, true)), inAudience: inA, audienceNote: inA ? null : e.audiencePathId ? 'این پخش برای کنشگران یک مسیر است؛ آن مسیر را بردار تا وارد شوی' : 'این پخش برای شرکت‌کنندگان یک دوره است؛ آن دوره را شروع کن تا وارد شوی' };
  }

  async remind(u: AuthUser, id: string, on: boolean) {
    const e = await this.get(id);
    if (e.status !== 'PUBLISHED') throw new BadRequestException(err('closed', 'این پخش متوقف شده است'));
    if (!(await this.inAudience(u, e))) throw new ForbiddenException(err('audience', 'این پخش برای گروه دیگری است'));
    if (on) await this.db.insert(registrations).values({ eventId: e.id, userId: u.id, status: 'REGISTERED', checkInCode: checkCode() } as any)
      .onConflictDoUpdate({ target: [registrations.eventId, registrations.userId], set: { status: 'REGISTERED', updatedAt: new Date() } });
    else await this.db.update(registrations).set({ status: 'CANCELLED', updatedAt: new Date() } as any).where(and(eq(registrations.eventId, e.id), eq(registrations.userId, u.id), isNull(registrations.attendedAt)));
    return { reminded: on };
  }

  /** ورود با یک ضربه: مخاطب خودکار «ثبت‌نام» می‌شود و حضورش حساب می‌شود */
  async join(u: AuthUser, id: string) {
    const e = await this.get(id);
    const host = await this.isHost(u, e);
    if (e.status === 'CANCELLED') throw new BadRequestException(err('stopped', 'این پخش متوقف شده است'));
    if (!host) {
      if (!(await this.inAudience(u, e))) throw new ForbiddenException(err('audience', 'این پخش برای گروه دیگری است'));
      if (Date.now() < e.startsAt.getTime() - OPEN_BEFORE) throw new BadRequestException(err('early', 'ورود از ربع ساعت پیش از شروع باز می‌شود'));
      if (Date.now() > e.endsAt.getTime() + 30 * MIN) throw new BadRequestException(err('ended', 'این پخش تمام شده است؛ اگر ضبط شده باشد، همین‌جا می‌بینی'));
      await this.db.insert(registrations).values({ eventId: e.id, userId: u.id, status: 'REGISTERED', checkInCode: checkCode() } as any)
        .onConflictDoUpdate({ target: [registrations.eventId, registrations.userId], set: { status: 'REGISTERED', updatedAt: new Date() } });
    }
    if (e.useBbb) return this.live.join(u, e, host);
    if (!e.onlineUrl) throw new BadRequestException(err('no_link', 'پیوند کلاس هنوز گذاشته نشده است'));
    if (!host) await this.db.update(registrations).set({ attendedAt: new Date(), attendanceMethod: 'ONLINE' }).where(and(eq(registrations.eventId, e.id), eq(registrations.userId, u.id), isNull(registrations.attendedAt)));
    return { url: e.onlineUrl };
  }

  /** اتاق پخش (میزبان) */
  async room(u: AuthUser, id: string) {
    const e = await this.get(id);
    if (!(await this.isHost(u, e))) throw new ForbiddenException(err('forbidden', 'اتاق پخش برای میزبان و برگزارکننده است'));
    const regs = await this.db.select({ id: users.id, first: users.firstName, last: users.lastName, at: registrations.attendedAt, status: registrations.status })
      .from(registrations).innerJoin(users, eq(users.id, registrations.userId)).where(eq(registrations.eventId, e.id));
    const mins = await this.live.attendanceMap(e.id);
    const audience = await this.audienceIds(e);
    const link = `${config.publicUrl.replace(/\/$/, '')}/live/${e.id}`;
    const card = await this.card(e, u, true);
    const when = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tehran' }).format(e.startsAt);
    return {
      ...card, onlineUrl: e.onlineUrl, minutes: Math.round((e.endsAt.getTime() - e.startsAt.getTime()) / MIN), link,
      invite: `پخش زندهٔ «${e.title}»\n${card.state === 'LIVE' ? 'همین الان' : when}${card.publisher ? ` — ${card.publisher.name}` : ''}\n${e.description ? e.description + '\n' : ''}ورود با یک ضربه در مدرسهٔ هدایت:\n${link}`,
      audienceSize: audience.length || null,
      remindedCount: regs.filter((r) => r.status === 'REGISTERED').length,
      attendees: regs.filter((r) => r.at || mins.has(r.id)).map((r) => ({ name: `${r.first} ${r.last}`.trim(), minutes: mins.get(r.id) ?? null })).sort((a, b) => (b.minutes ?? 0) - (a.minutes ?? 0)),
      finalized: !!e.liveFinalizedAt,
    };
  }

  async update(u: AuthUser, id: string, d: LivePatchDto) {
    const e = await this.get(id);
    if (!(await this.isHost(u, e))) throw new ForbiddenException(err('forbidden', 'فقط میزبان و برگزارکننده'));
    const set: Record<string, unknown> = {};
    if (d.title) set.title = d.title.trim();
    if (d.about !== undefined) set.description = d.about.trim() || null;
    const start = d.startsAt ? new Date(d.startsAt) : e.startsAt;
    if (d.startsAt && isNaN(start.getTime())) throw new BadRequestException(err('no_time', 'زمان شروع درست نیست'));
    const minutes = d.minutes ?? Math.round((e.endsAt.getTime() - e.startsAt.getTime()) / MIN);
    if (d.startsAt || d.minutes) { set.startsAt = start; set.endsAt = new Date(start.getTime() + minutes * MIN); }
    if (d.record !== undefined) set.record = e.useBbb && d.record;
    if (d.onlineUrl !== undefined && !e.useBbb) { if (!/^https?:\/\/\S+$/i.test(d.onlineUrl.trim())) throw new BadRequestException(err('bad_link', 'پیوند کلاس باید با https:// شروع شود')); set.onlineUrl = d.onlineUrl.trim(); }
    if (Object.keys(set).length) await this.db.update(events).set(set as any).where(eq(events.id, id));
    if (d.startsAt && Math.abs(start.getTime() - e.startsAt.getTime()) > MIN) {
      const ids = (await this.db.select({ u: registrations.userId }).from(registrations).where(and(eq(registrations.eventId, id), eq(registrations.status, 'REGISTERED')))).map((r) => r.u);
      if (ids.length) await this.notify.send(ids, { kind: 'event_reminder', title: `زمان «${e.title}» عوض شد`, link: `/live/${id}` });
    }
    return { ok: true };
  }

  /** توقف: میزبان (لغو) یا ستاد (با دلیل) */
  async stop(u: AuthUser, id: string, reason: string) {
    const e = await this.get(id);
    if (!(await this.isHost(u, e))) throw new ForbiddenException(err('forbidden', 'فقط میزبان، برگزارکننده یا ستاد'));
    await this.db.update(events).set({ status: 'CANCELLED', cancelReason: reason.trim() }).where(eq(events.id, id));
    await this.db.insert(auditLogs).values({ actorId: u.id, action: 'live.stop', target: id, meta: { reason } } as any);
    const ids = (await this.db.select({ u: registrations.userId }).from(registrations).where(and(eq(registrations.eventId, id), eq(registrations.status, 'REGISTERED')))).map((r) => r.u);
    if (ids.length && e.endsAt > new Date()) await this.notify.send(ids, { kind: 'event_reminder', title: `«${e.title}» برگزار نمی‌شود`, body: reason.trim(), link: `/live/${id}` });
    if (HQ(u) && e.createdById !== u.id) await this.notify.send(e.createdById, { kind: 'event_reminder', title: `ستاد پخش «${e.title}» را متوقف کرد`, body: reason.trim(), link: `/live/${id}/room` });
    return { ok: true };
  }

  /** ستاد: همهٔ پخش‌ها */
  async adminList() {
    const rows = await this.db.select().from(events).where(and(eq(events.isLive, true), gt(events.endsAt, new Date(Date.now() - 60 * 86400_000)))).orderBy(desc(events.startsAt)).limit(200);
    const pubs = new Map((await this.db.select({ id: publishers.id, name: publishers.name }).from(publishers)).map((p) => [p.id, p.name]));
    const by = new Map((rows.length ? await this.db.select({ id: users.id, f: users.firstName, l: users.lastName }).from(users).where(inArray(users.id, [...new Set(rows.map((r) => r.createdById))])) : []).map((x) => [x.id, `${x.f} ${x.l}`]));
    const cnt = new Map((rows.length ? await this.db.select({ e: registrations.eventId, n: sql<number>`count(*) filter (where ${registrations.status} = 'REGISTERED')::int`, a: sql<number>`count(${registrations.attendedAt})::int` }).from(registrations).where(inArray(registrations.eventId, rows.map((r) => r.id))).groupBy(registrations.eventId) : []).map((r) => [r.e, r]));
    return rows.map((e) => ({ id: e.id, title: e.title, startsAt: e.startsAt, endsAt: e.endsAt, state: this.state(e), publisher: e.publisherId ? pubs.get(e.publisherId) ?? null : 'ستاد', by: by.get(e.createdById) ?? null, host: e.hostName, reminded: cnt.get(e.id)?.n ?? 0, attended: cnt.get(e.id)?.a ?? 0, stopReason: e.cancelReason }));
  }

  /** پخش‌هایی که من میزبانم (برای پنل برگزارکننده و استودیو) */
  async mine(u: AuthUser) {
    const pubIds = await this.myPublisherIds(u.id);
    const cond = [eq(events.createdById, u.id), eq(events.instructorId, u.id), ...(pubIds.length ? [inArray(events.publisherId, pubIds)] : [])];
    const rows = await this.db.select().from(events).where(and(eq(events.isLive, true), or(...cond))).orderBy(desc(events.startsAt)).limit(100);
    return Promise.all(rows.map((e) => this.card(e, u)));
  }
}

@Controller('v2')
export class LivesController {
  constructor(private readonly s: LivesService) {}
  @Get('lives') list(@CurrentUser() u: AuthUser) { return this.s.list(u); }
  @Get('lives/now') now(@CurrentUser() u: AuthUser) { return this.s.nowBar(u); }
  @Get('lives/options') options(@CurrentUser() u: AuthUser) { return this.s.options(u); }
  @Get('lives/mine') mine(@CurrentUser() u: AuthUser) { return this.s.mine(u); }
  @Post('lives') create(@CurrentUser() u: AuthUser, @Body() d: LiveCreateDto) { return this.s.create(u, d); }
  @Get('lives/:id') detail(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.s.detail(u, id); }
  @Get('lives/:id/room') room(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.s.room(u, id); }
  @Patch('lives/:id') update(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() d: LivePatchDto) { return this.s.update(u, id, d); }
  @Post('lives/:id/remind') @HttpCode(200) remind(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.s.remind(u, id, true); }
  @Delete('lives/:id/remind') unremind(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.s.remind(u, id, false); }
  @Post('lives/:id/join') @HttpCode(200) join(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.s.join(u, id); }
  @Post('lives/:id/stop') @HttpCode(200) stop(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() d: StopDto) { return this.s.stop(u, id, d.reason); }
  @Get('admin/lives') @Roles('HQ_ADMIN', 'HQ_OPERATOR') admin() { return this.s.adminList(); }
}
