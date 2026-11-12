/**
 * دورهٔ گروهی هم‌زمان: یک هسته یک مسیر را با هم و با تاریخ شروع مشترک می‌گذراند.
 * هر ایستگاه (دوره) در هفتهٔ خودش باز می‌شود. پیشرفت گروه فقط با شمار نشان داده می‌شود؛ نام و رتبه نه.
 */
import { BadRequestException, Body, ConflictException, Controller, ForbiddenException, Get, HttpCode, Injectable, NotFoundException, Param, Post } from '@nestjs/common';
import { IsDateString, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { and, asc, eq, inArray, isNotNull, isNull, or } from 'drizzle-orm';
import { AuthUser, CurrentUser } from '../common/auth.decorators';
import { isUnique } from '../common/errors';
import { Db, InjectDb } from '../db/db.module';
import { cohortMembers, cohorts, coreMemberships, cores, courses, enrollments, mosques, pathItems, paths } from '../db/schema';
import { Notifier } from '../notifications/notifications';
import { RahyarService } from '../rahyar/rahyar.service';

const DAY = 86400_000;
const err = (code: string, message: string) => ({ code, message });
const faDate = (d: Date) => new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day: 'numeric', month: 'long', timeZone: 'Asia/Tehran' }).format(d);

class CohortDto {
  @IsString() coreId: string;
  @IsString() @Length(1, 80) pathSlug: string;
  @IsDateString() startsAt: string;
  @IsOptional() @IsInt() @Min(1) @Max(4) weeksPerStation?: number;
  @IsOptional() @IsString() @Length(0, 300) note?: string;
}

@Injectable()
export class CohortsService {
  constructor(@InjectDb() private readonly db: Db, private readonly notify: Notifier, private readonly rahyar: RahyarService) {}

  /** چه کسی هسته را می‌بیند و چه کسی برایش دورهٔ گروهی می‌سازد */
  private async coreAccess(u: AuthUser, coreId: string) {
    const c = await this.db.query.cores.findFirst({ where: eq(cores.id, coreId) });
    if (!c) throw new NotFoundException(err('no_core', 'هسته پیدا نشد'));
    const mosque = c.mosqueId ? await this.db.query.mosques.findFirst({ where: eq(mosques.id, c.mosqueId) }) : undefined;
    const isLeader = c.leaderId === u.id;
    const isImam = !!mosque && mosque.imamId === u.id;
    const isHq = u.roles.includes('HQ_ADMIN') || u.roles.includes('HQ_OPERATOR');
    const member = !!(await this.db.query.coreMemberships.findFirst({ where: and(eq(coreMemberships.coreId, c.id), eq(coreMemberships.userId, u.id)) }));
    let isRahyar = false;
    if (!isLeader && !isImam && !isHq && c.leaderId) isRahyar = await this.rahyar.canSeeLearner(u.id, c.leaderId, u.roles);
    return { c, member: member || isLeader, canManage: isLeader || isImam || isHq || isRahyar };
  }

  private async coreUserIds(coreId: string, leaderId: string | null) {
    const ms = await this.db.select({ id: coreMemberships.userId }).from(coreMemberships).where(eq(coreMemberships.coreId, coreId));
    return [...new Set([...ms.map((m) => m.id), ...(leaderId ? [leaderId] : [])])];
  }

  private async pathCourses(pathId: string) {
    return this.db.select({ id: courses.id, slug: courses.slug, title: courses.title, status: courses.status }).from(pathItems)
      .innerJoin(courses, eq(courses.id, pathItems.courseId)).where(eq(pathItems.pathId, pathId)).orderBy(asc(pathItems.order));
  }

  async create(u: AuthUser, d: CohortDto) {
    const { c, canManage } = await this.coreAccess(u, d.coreId);
    if (!canManage) throw new ForbiddenException(err('not_manager', 'دورهٔ گروهی را مسئول هسته، امام مسجد یا راهیار هسته راه می‌اندازد'));
    const p = await this.db.query.paths.findFirst({ where: and(eq(paths.slug, d.pathSlug), eq(paths.published, true)) });
    if (!p) throw new NotFoundException(err('no_path', 'این مسیر پیدا نشد یا هنوز منتشر نشده است'));
    const cs = (await this.pathCourses(p.id)).filter((x) => x.status === 'PUBLISHED');
    if (!cs.length) throw new BadRequestException(err('empty_path', 'این مسیر هنوز دورهٔ منتشرشده‌ای ندارد'));
    const startsAt = new Date(d.startsAt);
    const today = Date.now() - DAY;
    if (startsAt.getTime() < today) throw new BadRequestException(err('past_start', 'تاریخ شروع گذشته است؛ امروز یا روزی در آینده را انتخاب کنید'));
    if (startsAt.getTime() > Date.now() + 90 * DAY) throw new BadRequestException(err('far_start', 'تاریخ شروع حداکثر تا سه ماه دیگر می‌تواند باشد'));
    let row: typeof cohorts.$inferSelect;
    try {
      [row] = await this.db.insert(cohorts).values({ pathId: p.id, coreId: c.id, startsAt, weeksPerStation: d.weeksPerStation ?? 1, note: d.note?.trim() || null, createdById: u.id }).returning();
    } catch (e: any) {
      if (isUnique(e)) throw new ConflictException(err('cohort_exists', 'این هسته همین حالا این مسیر را گروهی پیش می‌برد'));
      throw e;
    }
    const people = await this.coreUserIds(c.id, c.leaderId);
    if (people.includes(u.id)) await this.db.insert(cohortMembers).values({ cohortId: row.id, userId: u.id }).onConflictDoNothing();
    const weeks = row.weeksPerStation === 1 ? 'هر هفته یک ایستگاه' : `هر ${row.weeksPerStation} هفته یک ایستگاه`;
    await this.notify.send(people.filter((x) => x !== u.id), {
      kind: 'COHORT', title: `هستهٔ «${c.name}» مسیر «${p.title}» را با هم شروع می‌کند`,
      body: `از ${faDate(startsAt)}، ${weeks}. اگر همراه می‌شوید، در صفحهٔ دوره «همراه می‌شوم» را بزنید.`, link: `/cohorts/${row.id}`,
    });
    return this.detail(u, row.id);
  }

  /** دوره‌های گروهی هسته‌هایی که در آن‌ها هستم */
  async mine(u: AuthUser) {
    const coreIds = [
      ...(await this.db.select({ id: coreMemberships.coreId }).from(coreMemberships).where(eq(coreMemberships.userId, u.id))).map((r) => r.id),
      ...(await this.db.select({ id: cores.id }).from(cores).where(eq(cores.leaderId, u.id))).map((r) => r.id),
    ];
    const joined = (await this.db.select({ id: cohortMembers.cohortId }).from(cohortMembers).where(eq(cohortMembers.userId, u.id))).map((r) => r.id);
    if (!coreIds.length && !joined.length) return [];
    const rows = await this.db.select({ id: cohorts.id }).from(cohorts)
      .where(and(isNull(cohorts.cancelledAt), or(coreIds.length ? inArray(cohorts.coreId, coreIds) : undefined, joined.length ? inArray(cohorts.id, joined) : undefined)));
    const out = [];
    for (const r of rows) out.push(await this.detail(u, r.id));
    return out.sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
  }

  async forCore(u: AuthUser, coreId: string) {
    const { member, canManage } = await this.coreAccess(u, coreId);
    if (!member && !canManage) throw new ForbiddenException(err('forbidden', 'به این هسته دسترسی ندارید'));
    const rows = await this.db.select({ id: cohorts.id }).from(cohorts).where(and(eq(cohorts.coreId, coreId), isNull(cohorts.cancelledAt)));
    const out = [];
    for (const r of rows) out.push(await this.detail(u, r.id));
    return out;
  }

  async detail(u: AuthUser, id: string) {
    const h = await this.db.query.cohorts.findFirst({ where: eq(cohorts.id, id) });
    if (!h) throw new NotFoundException(err('no_cohort', 'این دورهٔ گروهی پیدا نشد'));
    const { c, member, canManage } = await this.coreAccess(u, h.coreId);
    const joined = !!(await this.db.query.cohortMembers.findFirst({ where: and(eq(cohortMembers.cohortId, h.id), eq(cohortMembers.userId, u.id)) }));
    if (!member && !canManage && !joined) throw new ForbiddenException(err('forbidden', 'این دورهٔ گروهی برای هستهٔ دیگری است'));
    const p = (await this.db.query.paths.findFirst({ where: eq(paths.id, h.pathId) }))!;
    const cs = (await this.pathCourses(p.id)).filter((x) => x.status === 'PUBLISHED');
    const memberIds = (await this.db.select({ id: cohortMembers.userId }).from(cohortMembers).where(eq(cohortMembers.cohortId, h.id))).map((r) => r.id);
    const done = memberIds.length && cs.length ? await this.db.select({ userId: enrollments.userId, courseId: enrollments.courseId }).from(enrollments)
      .where(and(inArray(enrollments.userId, memberIds), inArray(enrollments.courseId, cs.map((x) => x.id)), isNotNull(enrollments.completedAt))) : [];
    const coreSize = (await this.coreUserIds(c.id, c.leaderId)).length;
    const span = h.weeksPerStation * 7 * DAY;
    const now = Date.now();
    const current = now < h.startsAt.getTime() ? -1 : Math.min(cs.length - 1, Math.floor((now - h.startsAt.getTime()) / span));
    const ends = new Date(h.startsAt.getTime() + cs.length * span);
    return {
      id: h.id, startsAt: h.startsAt, endsAt: ends, weeksPerStation: h.weeksPerStation, note: h.note, cancelled: !!h.cancelledAt,
      path: { slug: p.slug, title: p.title, color: p.color },
      core: { id: c.id, name: c.name },
      joined, canJoin: member && !joined && !h.cancelledAt, canManage, memberCount: memberIds.length, coreSize,
      currentStation: current, finished: now >= ends.getTime(),
      stations: cs.map((x, i) => ({
        course: { slug: x.slug, title: x.title },
        opensAt: new Date(h.startsAt.getTime() + i * span),
        doneCount: done.filter((d) => d.courseId === x.id).length,
        doneByMe: done.some((d) => d.courseId === x.id && d.userId === u.id),
      })),
    };
  }

  async join(u: AuthUser, id: string) {
    const h = await this.db.query.cohorts.findFirst({ where: eq(cohorts.id, id) });
    if (!h || h.cancelledAt) throw new NotFoundException(err('no_cohort', 'این دورهٔ گروهی پیدا نشد یا لغو شده است'));
    const { member } = await this.coreAccess(u, h.coreId);
    if (!member) throw new ForbiddenException(err('not_member', 'این دورهٔ گروهی برای اعضای هسته است'));
    await this.db.insert(cohortMembers).values({ cohortId: id, userId: u.id }).onConflictDoNothing();
    return this.detail(u, id);
  }

  async leave(u: AuthUser, id: string) {
    await this.db.delete(cohortMembers).where(and(eq(cohortMembers.cohortId, id), eq(cohortMembers.userId, u.id)));
    return this.detail(u, id);
  }

  /** زمان‌بند: ساعتی یک بار، بازشدن ایستگاه تازهٔ هر دورهٔ گروهی را به همراهانش اعلان می‌کند */
  async notifyStations() {
    const now = Date.now();
    const rows = await this.db.select().from(cohorts).where(isNull(cohorts.cancelledAt));
    for (const h of rows) {
      if (h.startsAt.getTime() > now) continue;
      const cs = (await this.pathCourses(h.pathId)).filter((x) => x.status === 'PUBLISHED');
      if (!cs.length) continue;
      const span = h.weeksPerStation * 7 * DAY;
      const cur = Math.floor((now - h.startsAt.getTime()) / span);
      if (cur >= cs.length || cur <= h.notifiedStation) continue;
      await this.db.update(cohorts).set({ notifiedStation: cur }).where(eq(cohorts.id, h.id));
      const ids = (await this.db.select({ id: cohortMembers.userId }).from(cohortMembers).where(eq(cohortMembers.cohortId, h.id))).map((r) => r.id);
      const c = await this.db.query.cores.findFirst({ where: eq(cores.id, h.coreId) });
      await this.notify.send(ids, {
        kind: 'COHORT', title: cur === 0 ? `مسیر گروهی «${c?.name ?? 'هسته'}» شروع شد` : `ایستگاه ${cur + 1} باز شد`,
        body: `این هفته: «${cs[cur].title}». جلوتر رفتن آزاد است؛ عقب ماندن هم جریمه ندارد.`, link: `/courses/${cs[cur].slug}`,
      });
    }
  }

  async cancel(u: AuthUser, id: string) {
    const h = await this.db.query.cohorts.findFirst({ where: eq(cohorts.id, id) });
    if (!h) throw new NotFoundException(err('no_cohort', 'این دورهٔ گروهی پیدا نشد'));
    const { c, canManage } = await this.coreAccess(u, h.coreId);
    if (!canManage) throw new ForbiddenException(err('not_manager', 'فقط کسی که دورهٔ گروهی را راه انداخته یا مسئول هسته است می‌تواند لغوش کند'));
    if (h.cancelledAt) return { ok: true };
    await this.db.update(cohorts).set({ cancelledAt: new Date() }).where(eq(cohorts.id, id));
    const p = (await this.db.query.paths.findFirst({ where: eq(paths.id, h.pathId) }))!;
    const memberIds = (await this.db.select({ id: cohortMembers.userId }).from(cohortMembers).where(eq(cohortMembers.cohortId, id))).map((r) => r.id).filter((x) => x !== u.id);
    await this.notify.send(memberIds, { kind: 'COHORT', title: `دورهٔ گروهی «${p.title}» در هستهٔ «${c.name}» لغو شد`, body: 'پیشرفت خودتان در دوره‌ها سر جایش می‌ماند و می‌توانید مسیر را تنها ادامه دهید.', link: `/paths/${p.slug}` });
    return { ok: true };
  }
}

@Controller()
export class CohortsController {
  constructor(private readonly s: CohortsService) {}
  @Get('cohorts/mine') mine(@CurrentUser() u: AuthUser) { return this.s.mine(u); }
  @Get('cores/:id/cohorts') forCore(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.s.forCore(u, id); }
  @Get('cohorts/:id') detail(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.s.detail(u, id); }
  @Post('cohorts') @HttpCode(200) create(@CurrentUser() u: AuthUser, @Body() d: CohortDto) { return this.s.create(u, d); }
  @Post('cohorts/:id/join') @HttpCode(200) join(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.s.join(u, id); }
  @Post('cohorts/:id/leave') @HttpCode(200) leave(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.s.leave(u, id); }
  @Post('cohorts/:id/cancel') @HttpCode(200) cancel(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.s.cancel(u, id); }
}
