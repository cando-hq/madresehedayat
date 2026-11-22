/*
 * برگزارکنندگان: پروفایل، تیم (مدیرهای پنل)، دعوت با شمارهٔ بی‌حساب، و تاریخچه.
 * ستاد همه را می‌بیند و می‌سازد؛ خود برگزارکننده تیم و معرفی‌اش را اداره می‌کند.
 * همهٔ اعضای تیم دسترسی برابر دارند؛ برای کار روی یک دوره «سپردن به استاد» در پنل برگزارکننده است.
 */
import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, HttpCode, Injectable, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { userIdByMobile } from '../auth/mobiles';
import { AuthUser, CurrentUser, Roles } from '../common/auth.decorators';
import { dec, enc, mobileKey } from '../common/crypto';
import { normalizeMobile } from '../common/mobile';
import { Db, InjectDb } from '../db/db.module';
import { auditLogs, courses, pathEnrollments, paths2, pendingInvites, publisherAdmins, publishers, roleGrants, sessions, users } from '../db/schema';
import { Notifier } from '../notifications/notifications';

const err = (code: string, message: string) => ({ code, message });
const STATUS_FA: Record<string, string> = { DRAFT: 'پیش‌نویس', IN_REVIEW: 'در بازبینی', PUBLISHED: 'منتشرشده', RETURNED: 'نیاز به اصلاح', ARCHIVED: 'بایگانی' };
const PUB_STATUS_FA: Record<string, string> = { ACTIVE: 'فعال', PENDING: 'در انتظار پذیرش', BLOCKED: 'مسدود', REJECTED: 'رد شده' };
const ACTION_FA: Record<string, string> = {
  'publisher.create': 'برگزارکننده ساخته شد', 'publisher.update': 'مشخصات ویرایش شد', 'publisher.status': 'وضعیت عوض شد',
  'publisher.admin.add': 'به تیم اضافه شد', 'publisher.admin.invite': 'دعوت شد (منتظر اولین ورود)', 'publisher.admin.remove': 'از تیم برداشته شد',
  'publisher.invite.cancel': 'دعوت برداشته شد',
};
const COLOR = /^#[0-9a-fA-F]{6}$/;

export class PublisherCreateDto {
  @IsString() @Length(2, 80) name: string;
  @IsOptional() @IsString() @Matches(COLOR) color?: string;
  @IsOptional() @IsString() @Length(0, 40) kind?: string;
  @IsOptional() @IsString() @Length(0, 80) referrer?: string;
  @IsOptional() @IsString() @Length(0, 600) about?: string;
  @IsOptional() @IsString() adminMobile?: string;
}
export class PublisherUpdateDto {
  @IsOptional() @IsString() @Length(2, 80) name?: string;
  @IsOptional() @IsString() @Matches(COLOR) color?: string;
  @IsOptional() @IsString() @Length(0, 40) kind?: string;
  @IsOptional() @IsString() @Length(0, 80) referrer?: string;
  @IsOptional() @IsString() @Length(0, 600) about?: string;
  @IsOptional() @IsIn(['ACTIVE', 'BLOCKED', 'PENDING']) status?: string;
  @IsOptional() @IsString() note?: string;
  /** سازگاری با نسخهٔ ۱.۶: افزودن مدیر و برداشتن دعوت از همین مسیر */
  @IsOptional() @IsString() adminMobile?: string;
  @IsOptional() @IsString() cancelPending?: string;
}
export class PubProfileDto {
  @IsOptional() @IsString() @Matches(COLOR) color?: string;
  @IsOptional() @IsString() @Length(0, 600) about?: string;
}
class MobileDto { @IsString() mobile: string }

@Injectable()
export class PublishersService {
  constructor(@InjectDb() private readonly db: Db, private readonly notify: Notifier) {}

  private async audit(actor: string | null, action: string, target: string, meta?: Record<string, unknown>) {
    await this.db.insert(auditLogs).values({ actorId: actor, action, target, meta: meta ?? null } as any);
  }
  private async pub(id: string) {
    const p = await this.db.query.publishers.findFirst({ where: eq(publishers.id, id) });
    if (!p) throw new NotFoundException(err('no_pub', 'برگزارکننده پیدا نشد'));
    return p;
  }
  /** برگزارکنندهٔ فعالِ این کاربر (برای پنل خود برگزارکننده) */
  private async myPub(u: AuthUser) {
    const r = await this.db.select({ p: publishers }).from(publisherAdmins).innerJoin(publishers, eq(publishers.id, publisherAdmins.publisherId)).where(eq(publisherAdmins.userId, u.id));
    const p = r.map((x) => x.p).find((x) => x.status === 'ACTIVE');
    if (!p) throw new ForbiddenException(err('forbidden', 'این بخش برای برگزارکنندگان است'));
    return p;
  }

  async team(pid: string) {
    const rows = await this.db.select({ id: users.id, first: users.firstName, last: users.lastName, enc: users.mobileEnc, active: users.isActive })
      .from(publisherAdmins).innerJoin(users, eq(users.id, publisherAdmins.userId)).where(eq(publisherAdmins.publisherId, pid));
    const seen = new Map<string, Date>();
    if (rows.length) for (const s of await this.db.select({ u: sessions.userId, at: sql<Date>`max(${sessions.lastSeenAt})` }).from(sessions).where(inArray(sessions.userId, rows.map((r) => r.id))).groupBy(sessions.userId)) seen.set(s.u, s.at);
    const admins = rows.map((r) => ({ id: r.id, name: `${r.first} ${r.last}`.trim(), mobile: dec(r.enc) ?? '', active: r.active, lastSeenAt: seen.get(r.id) ?? null }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fa'));
    const inv = await this.db.select().from(pendingInvites).where(and(eq(pendingInvites.kind, 'PUBLISHER_ADMIN'), eq(pendingInvites.targetId, pid))).orderBy(desc(pendingInvites.createdAt));
    const pending = inv.map((r) => ({ id: r.id, mobile: dec(r.mobileEnc) ?? '', createdAt: r.createdAt }));
    return { admins, pending };
  }

  private async counts(pid: string) {
    const n = (q: Promise<{ n: number }[]>) => q.then((r) => r[0]?.n ?? 0);
    return {
      paths: await n(this.db.select({ n: sql<number>`count(*)::int` }).from(paths2).where(eq(paths2.publisherId, pid))),
      published: await n(this.db.select({ n: sql<number>`count(*)::int` }).from(paths2).where(and(eq(paths2.publisherId, pid), eq(paths2.status, 'PUBLISHED')))),
      courses: await n(this.db.select({ n: sql<number>`count(*)::int` }).from(courses).where(eq(courses.publisherId, pid))),
      learners: await n(this.db.select({ n: sql<number>`count(distinct ${pathEnrollments.userId})::int` }).from(pathEnrollments).innerJoin(paths2, eq(paths2.id, pathEnrollments.pathId)).where(eq(paths2.publisherId, pid))),
      inReview: await n(this.db.select({ n: sql<number>`count(*)::int` }).from(paths2).where(and(eq(paths2.publisherId, pid), eq(paths2.status, 'IN_REVIEW'))))
        + await n(this.db.select({ n: sql<number>`count(*)::int` }).from(courses).where(and(eq(courses.publisherId, pid), eq(courses.reviewStatus, 'IN_REVIEW')))),
    };
  }

  async list() {
    const ps = await this.db.select().from(publishers).orderBy(desc(publishers.createdAt));
    const out = [] as any[];
    for (const p of ps) {
      const t = await this.team(p.id);
      out.push({ ...p, statusFa: PUB_STATUS_FA[p.status] ?? p.status, ...(await this.counts(p.id)), admins: t.admins.map((a) => a.name), team: t.admins.length, pending: t.pending });
    }
    return out;
  }

  async profile(pid: string) {
    const p = await this.pub(pid);
    const ps = await this.db.select({ id: paths2.id, slug: paths2.slug, title: paths2.title, status: paths2.status, updatedAt: paths2.updatedAt }).from(paths2).where(eq(paths2.publisherId, pid)).orderBy(desc(paths2.updatedAt));
    const cs = await this.db.select({ id: courses.id, title: courses.title, status: courses.status, review: courses.reviewStatus, instructor: courses.instructor, instructorId: courses.instructorId, updatedAt: courses.updatedAt }).from(courses).where(eq(courses.publisherId, pid)).orderBy(desc(courses.updatedAt));
    const ins = await this.db.select().from(pendingInvites).where(and(eq(pendingInvites.kind, 'COURSE_INSTRUCTOR'), inArray(pendingInvites.targetId, cs.length ? cs.map((c) => c.id) : ['-'])));
    const pendIns = new Map(ins.map((i) => [i.targetId, dec(i.mobileEnc) ?? '']));
    const hist = await this.db.select({ action: auditLogs.action, meta: auditLogs.meta, at: auditLogs.createdAt, first: users.firstName, last: users.lastName })
      .from(auditLogs).leftJoin(users, eq(users.id, auditLogs.actorId)).where(and(eq(auditLogs.target, pid), sql`${auditLogs.action} like 'publisher.%'`)).orderBy(desc(auditLogs.createdAt)).limit(30);
    return {
      publisher: { ...p, statusFa: PUB_STATUS_FA[p.status] ?? p.status },
      stats: await this.counts(pid),
      ...(await this.team(pid)),
      paths: ps.map((x) => ({ ...x, statusFa: STATUS_FA[x.status] ?? x.status })),
      courses: cs.map((c) => { const st = c.review ?? (c.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'); return { id: c.id, title: c.title, status: st, statusFa: STATUS_FA[st], instructor: c.instructorId ? c.instructor : null, instructorPending: pendIns.get(c.id) ?? null, updatedAt: c.updatedAt }; }),
      history: hist.map((h) => ({ at: h.at, by: h.first ? `${h.first} ${h.last}` : null, text: ACTION_FA[h.action] ?? h.action, detail: (h.meta as any)?.who ?? (h.meta as any)?.detail ?? null })),
    };
  }

  async create(actor: string, d: PublisherCreateDto) {
    const [p] = await this.db.insert(publishers).values({ name: d.name.trim(), color: d.color || '#8C93B5', status: 'ACTIVE', kind: d.kind?.trim() || 'مؤسسه', referrer: d.referrer?.trim() || 'ستاد', about: d.about?.trim() || null } as any).returning();
    await this.audit(actor, 'publisher.create', p.id, { detail: p.name });
    const r = d.adminMobile?.trim() ? await this.addAdmin(actor, p.id, d.adminMobile) : null;
    return { ...p, pending: !!r?.pending };
  }

  async update(actor: string, pid: string, d: PublisherUpdateDto) {
    const p = await this.pub(pid);
    const set: Record<string, unknown> = {};
    if (d.name !== undefined) set.name = d.name.trim();
    if (d.color !== undefined) set.color = d.color;
    if (d.kind !== undefined) set.kind = d.kind.trim() || null;
    if (d.referrer !== undefined) set.referrer = d.referrer.trim() || null;
    if (d.about !== undefined) set.about = d.about.trim() || null;
    if (Object.keys(set).length) { await this.db.update(publishers).set(set as any).where(eq(publishers.id, pid)); await this.audit(actor, 'publisher.update', pid, { detail: Object.keys(set).map((k) => ({ name: 'نام', color: 'رنگ', kind: 'نوع', referrer: 'معرف', about: 'معرفی' } as any)[k]).join('، ') }); }
    if (d.status && d.status !== p.status) {
      if (d.status === 'BLOCKED' && !d.note?.trim()) throw new BadRequestException(err('need_note', 'دلیل مسدود کردن را بنویس'));
      await this.db.update(publishers).set({ status: d.status, note: d.status === 'BLOCKED' ? d.note!.trim() : d.note?.trim() || null }).where(eq(publishers.id, pid));
      await this.audit(actor, 'publisher.status', pid, { detail: `${PUB_STATUS_FA[p.status] ?? p.status} ← ${PUB_STATUS_FA[d.status]}${d.note?.trim() ? `: ${d.note.trim()}` : ''}` });
      const t = await this.team(pid);
      if (t.admins.length) await this.notify.send(t.admins.map((a) => a.id), { kind: 'REVIEW', title: d.status === 'ACTIVE' ? `«${p.name}» در مدرسه فعال شد` : d.status === 'BLOCKED' ? `«${p.name}» مسدود شد: ${d.note!.trim()}` : `وضعیت «${p.name}»: ${PUB_STATUS_FA[d.status]}`, link: '/pub' });
    }
    let pending = false;
    if (d.adminMobile) pending = !!(await this.addAdmin(actor, pid, d.adminMobile)).pending;
    if (d.cancelPending) await this.cancelInvite(actor, pid, d.cancelPending);
    return { ok: true, pending };
  }

  /** افزودن به تیم: اگر حساب هست همان لحظه، وگرنه منتظر اولین ورود */
  async addAdmin(actor: string, pid: string, mobile: string) {
    const p = await this.pub(pid);
    const mob = normalizeMobile(mobile);
    if (!mob) throw new BadRequestException(err('bad_mobile', 'شماره ۱۱ رقم است و با ۰۹ شروع می‌شود'));
    const uid = await userIdByMobile(this.db, mob);
    if (!uid) {
      await this.db.insert(pendingInvites).values({ mobile: mobileKey(mob), mobileEnc: enc(mob)!, kind: 'PUBLISHER_ADMIN', targetId: pid, createdBy: actor }).onConflictDoNothing();
      await this.audit(actor, 'publisher.admin.invite', pid, { who: mob });
      return { ok: true, pending: true };
    }
    const had = await this.db.query.publisherAdmins.findFirst({ where: and(eq(publisherAdmins.publisherId, pid), eq(publisherAdmins.userId, uid)) });
    if (had) throw new BadRequestException(err('already', 'این شماره همین الان در تیم است'));
    await this.db.insert(publisherAdmins).values({ publisherId: pid, userId: uid }).onConflictDoNothing();
    await this.db.insert(roleGrants).values({ userId: uid, role: 'ORG_ADMIN', networkId: null } as any).onConflictDoNothing();
    const u = await this.db.query.users.findFirst({ where: eq(users.id, uid), columns: { firstName: true, lastName: true } });
    await this.audit(actor, 'publisher.admin.add', pid, { who: `${u?.firstName} ${u?.lastName}` });
    await this.notify.send(uid, { kind: 'REVIEW', title: `به تیم «${p.name}» در مدرسه اضافه شدی`, body: 'پنل برگزارکننده از منوی حساب باز می‌شود.', link: '/pub' });
    return { ok: true, pending: false };
  }

  async removeAdmin(actor: string, pid: string, uid: string, fromPanel = false) {
    await this.pub(pid);
    const t = await this.team(pid);
    const who = t.admins.find((a) => a.id === uid);
    if (!who) throw new NotFoundException(err('not_member', 'این نفر در تیم نیست'));
    if (fromPanel && t.admins.length === 1) throw new BadRequestException(err('last_admin', 'آخرین نفر تیم نمی‌تواند خودش را بردارد؛ اول یک نفر دیگر اضافه کن یا از ستاد بخواه'));
    await this.db.delete(publisherAdmins).where(and(eq(publisherAdmins.publisherId, pid), eq(publisherAdmins.userId, uid)));
    const other = await this.db.query.publisherAdmins.findFirst({ where: eq(publisherAdmins.userId, uid) });
    if (!other) await this.db.delete(roleGrants).where(and(eq(roleGrants.userId, uid), eq(roleGrants.role, 'ORG_ADMIN')));
    await this.audit(actor, 'publisher.admin.remove', pid, { who: who.name });
    return { ok: true };
  }

  async cancelInvite(actor: string, pid: string, inviteId: string) {
    const r = await this.db.delete(pendingInvites).where(and(eq(pendingInvites.id, inviteId), eq(pendingInvites.targetId, pid), eq(pendingInvites.kind, 'PUBLISHER_ADMIN'))).returning();
    if (r.length) await this.audit(actor, 'publisher.invite.cancel', pid, { who: dec(r[0].mobileEnc) });
    return { ok: true };
  }

  // ───────── پنل خود برگزارکننده
  async myTeam(u: AuthUser) {
    const p = await this.myPub(u);
    return { publisher: { id: p.id, name: p.name, color: p.color, kind: p.kind, about: (p as any).about ?? null, status: p.status, statusFa: PUB_STATUS_FA[p.status] }, me: u.id, ...(await this.team(p.id)) };
  }
  async myAdd(u: AuthUser, mobile: string) { const p = await this.myPub(u); return this.addAdmin(u.id, p.id, mobile); }
  async myRemove(u: AuthUser, uid: string) { const p = await this.myPub(u); return this.removeAdmin(u.id, p.id, uid, true); }
  async myCancel(u: AuthUser, id: string) { const p = await this.myPub(u); return this.cancelInvite(u.id, p.id, id); }
  async myProfile(u: AuthUser, d: PubProfileDto) {
    const p = await this.myPub(u);
    return this.update(u.id, p.id, { color: d.color, about: d.about });
  }
}

@Controller('v2')
export class PublishersController {
  constructor(private readonly s: PublishersService) {}
  @Get('admin/publishers') @Roles('HQ_ADMIN', 'HQ_OPERATOR') list() { return this.s.list(); }
  @Get('admin/publishers/:id') @Roles('HQ_ADMIN', 'HQ_OPERATOR') profile(@Param('id') id: string) { return this.s.profile(id); }
  @Post('admin/publishers') @Roles('HQ_ADMIN') create(@CurrentUser() u: AuthUser, @Body() d: PublisherCreateDto) { return this.s.create(u.id, d); }
  @Patch('admin/publishers/:id') @Roles('HQ_ADMIN') update(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() d: PublisherUpdateDto) { return this.s.update(u.id, id, d); }
  @Post('admin/publishers/:id/team') @HttpCode(200) @Roles('HQ_ADMIN') add(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() d: MobileDto) { return this.s.addAdmin(u.id, id, d.mobile); }
  @Delete('admin/publishers/:id/team/:uid') @Roles('HQ_ADMIN') remove(@CurrentUser() u: AuthUser, @Param('id') id: string, @Param('uid') uid: string) { return this.s.removeAdmin(u.id, id, uid); }
  @Delete('admin/publishers/:id/invites/:inv') @Roles('HQ_ADMIN') cancel(@CurrentUser() u: AuthUser, @Param('id') id: string, @Param('inv') inv: string) { return this.s.cancelInvite(u.id, id, inv); }

  @Get('pub/team') myTeam(@CurrentUser() u: AuthUser) { return this.s.myTeam(u); }
  @Post('pub/team') @HttpCode(200) myAdd(@CurrentUser() u: AuthUser, @Body() d: MobileDto) { return this.s.myAdd(u, d.mobile); }
  @Delete('pub/team/:uid') myRemove(@CurrentUser() u: AuthUser, @Param('uid') uid: string) { return this.s.myRemove(u, uid); }
  @Delete('pub/invites/:inv') myCancel(@CurrentUser() u: AuthUser, @Param('inv') inv: string) { return this.s.myCancel(u, inv); }
  @Patch('pub/profile') myProfile(@CurrentUser() u: AuthUser, @Body() d: PubProfileDto) { return this.s.myProfile(u, d); }
}
