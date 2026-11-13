/**
 * منطق مسیر، نسخهٔ ۲ — سمت سرور.
 * برگزارکنندگان مسیر (خرد/میانه/کلان)، دوره یا فقط پخش زنده منتشر می‌کنند؛ ستاد بازبین است.
 * هر کنشگر بر پایهٔ نقشش یک مسیر اصلی پیش‌فرض دارد (اجبار نیست)، مسجدش را روی نقشه انتخاب می‌کند،
 * و «گام رشد» فقط روایتِ تأییدشده یا دیدار میدانی راهیار است.
 * همان پاسخ‌هایی که نسخهٔ نمایشی (apps/web/src/demo/paths2.ts) می‌دهد.
 */
import { BadRequestException, Body, Controller, ForbiddenException, Get, HttpCode, Injectable, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsNumber, IsOptional, IsString, Length } from 'class-validator';
import { and, asc, desc, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import { AuthUser, CurrentUser, MaybeUser, Public, Roles } from '../common/auth.decorators';
import { decJson, mobileKey } from '../common/crypto';
import { normalizeMobile } from '../common/mobile';
import { Db, InjectDb } from '../db/db.module';
import { createId } from '../db/id';
import { answers, auditLogs, counties, courses, enrollments, events, lessonProgress, lessons, modules, mosques, pathAssessments, pathEnrollments, pathRahyars, paths2, publisherAdmins, publishers, questions, registrations, roleGrants, users, type PathStep } from '../db/schema';
import { Notifier } from '../notifications/notifications';

type ActorRole = 'IMAM' | 'SHARIK' | 'BAZU' | 'HASTEH' | 'OTHER';
const ROLES: ActorRole[] = ['IMAM', 'SHARIK', 'BAZU', 'HASTEH', 'OTHER'];
const ROLE_FA: Record<ActorRole, string> = { IMAM: 'امام', SHARIK: 'شریکة‌الامام', BAZU: 'بازو', HASTEH: 'عضو هسته', OTHER: 'دیگر' };
const SIZE_FA: Record<string, string> = { micro: 'مسیر خرد', mid: 'مسیر میانه', macro: 'مسیر کلان' };
const STATUS_FA: Record<string, string> = { DRAFT: 'پیش‌نویس', IN_REVIEW: 'در بازبینی', PUBLISHED: 'منتشرشده', RETURNED: 'نیاز به اصلاح', ARCHIVED: 'بایگانی' };
const err = (code: string, message: string, extra: Record<string, unknown> = {}) => ({ code, message, ...extra });
const pubCard = (p?: { id: string; name: string; color: string } | null) => (p ? { id: p.id, name: p.name, color: p.color } : null);

class PathDto {
  @IsOptional() @IsString() id?: string;
  @IsString() @Length(2, 80) title: string;
  @IsIn(['micro', 'mid', 'macro']) size: 'micro' | 'mid' | 'macro';
  @IsOptional() @IsString() @Length(0, 400) description?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(4) audience?: ActorRole[];
  @IsOptional() @IsBoolean() hasRahyar?: boolean;
  @IsOptional() @IsString() color?: string;
  @IsArray() @ArrayMaxSize(24) steps: { id?: string; title?: string; rule?: string | null; items?: { kind: string; refId: string; optional?: boolean }[] }[];
}
class OnboardDto {
  @IsOptional() @IsString() @Length(2, 40) firstName?: string;
  @IsOptional() @IsString() @Length(2, 40) lastName?: string;
  @IsOptional() @IsIn(ROLES) actorRole?: ActorRole;
  @IsOptional() @IsString() mosqueId?: string | null;
  @IsOptional() @IsString() countyId?: string;
  @IsOptional() @IsNumber() lat?: number;
  @IsOptional() @IsNumber() lng?: number;
  @IsOptional() @IsString() @Length(0, 30) relation?: string;
  @IsOptional() @IsBoolean() enrollMain?: boolean;
}
class MosqueDto { @IsString() @Length(3, 80) name: string; @IsOptional() @IsString() countyId?: string; @IsOptional() @IsString() @Length(0, 160) address?: string; @IsOptional() @IsNumber() lat?: number; @IsOptional() @IsNumber() lng?: number }
class ReviewDto { @IsIn(['publish', 'return']) action: 'publish' | 'return'; @IsOptional() @IsString() @Length(0, 500) note?: string }
class InviteDto { @IsString() mobile: string; @IsString() pathId: string }
class InviteMobileDto { @IsString() mobile: string }
class CourseDto { @IsString() @Length(2, 80) title: string; @IsOptional() @IsIn(['all', 'approve', 'none']) libraryShare?: string }
class CoursePatchDto { @IsOptional() @IsIn(['all', 'approve', 'none']) libraryShare?: string }
class PublisherDto { @IsString() @Length(2, 80) name: string; @IsOptional() @IsString() color?: string; @IsOptional() @IsString() kind?: string; @IsOptional() @IsString() referrer?: string }
class PublisherPatchDto { @IsOptional() @IsIn(['ACTIVE', 'BLOCKED', 'PENDING']) status?: string; @IsOptional() @IsString() note?: string; @IsOptional() @IsString() adminMobile?: string }
class AssessDto { @IsString() pathId: string; @IsString() stepId: string; @IsOptional() @IsString() @Length(0, 400) note?: string }

type Path2 = typeof paths2.$inferSelect;

@Injectable()
export class Paths2Service {
  constructor(@InjectDb() private readonly db: Db, private readonly notify: Notifier) {}

  // ───────── کمکی‌ها
  private async path(key: string) {
    const p = await this.db.query.paths2.findFirst({ where: key.startsWith('pt-') || key.length > 16 ? eq(paths2.id, key) : eq(paths2.slug, key) }) ?? await this.db.query.paths2.findFirst({ where: eq(paths2.slug, key) }) ?? await this.db.query.paths2.findFirst({ where: eq(paths2.id, key) });
    if (!p) throw new NotFoundException(err('no_path', 'این مسیر پیدا نشد'));
    return p;
  }
  private isStaff(u: AuthUser) { return u.roles.includes('HQ_ADMIN') || u.roles.includes('HQ_OPERATOR'); }
  private async pubOf(uid: string) {
    const r = await this.db.select({ id: publishers.id, name: publishers.name, color: publishers.color, status: publishers.status }).from(publisherAdmins).innerJoin(publishers, eq(publishers.id, publisherAdmins.publisherId)).where(eq(publisherAdmins.userId, uid));
    return r.find((x) => x.status === 'ACTIVE') ?? null;
  }
  private async needPub(u: AuthUser) {
    const p = await this.pubOf(u.id);
    if (!p) throw new ForbiddenException(err('forbidden', 'این بخش برای برگزارکنندگان است'));
    return p;
  }
  private async pubById(id: string) { return this.db.query.publishers.findFirst({ where: eq(publishers.id, id) }); }
  private async name(id: string) { const u = await this.db.query.users.findFirst({ where: eq(users.id, id), columns: { firstName: true, lastName: true } }); return u ? `${u.firstName} ${u.lastName}` : '—'; }
  private async rahyarOf(pid: string) { const r = await this.db.query.pathRahyars.findFirst({ where: eq(pathRahyars.pathId, pid) }); return r ? { id: r.userId, name: await this.name(r.userId) } : null; }
  private async courseLessons(cid: string) {
    return this.db.select({ id: lessons.id, title: lessons.title, type: lessons.type, durationSec: lessons.durationSec, required: lessons.required, content: lessons.content }).from(lessons).innerJoin(modules, eq(modules.id, lessons.moduleId)).where(eq(modules.courseId, cid)).orderBy(asc(modules.order), asc(lessons.order));
  }
  /** شناسهٔ همهٔ دوره‌های یک مسیر، با مسیرهای تو در تو (تا دو لایه) */
  private async pathCourseIds(p: Path2, depth = 0): Promise<string[]> {
    const out: string[] = [];
    for (const s of p.steps) for (const it of s.items) {
      if (it.kind === 'course') out.push(it.refId);
      else if (it.kind === 'path' && depth < 2) { const q = await this.db.query.paths2.findFirst({ where: eq(paths2.id, it.refId) }); if (q) out.push(...(await this.pathCourseIds(q, depth + 1))); }
    }
    return out;
  }
  private async courseState(uid: string | undefined, cid: string) {
    if (!uid) return null;
    const e = await this.db.query.enrollments.findFirst({ where: and(eq(enrollments.userId, uid), eq(enrollments.courseId, cid)) });
    if (!e) return null;
    if (e.completedAt) return { percent: 100, completedAt: e.completedAt, lastLessonId: e.lastLessonId };
    const ls = (await this.courseLessons(cid)).filter((l) => l.required);
    if (!ls.length) return { percent: 0, completedAt: null, lastLessonId: e.lastLessonId };
    const done = await this.db.select({ id: lessonProgress.lessonId }).from(lessonProgress).where(and(eq(lessonProgress.userId, uid), inArray(lessonProgress.lessonId, ls.map((l) => l.id)), isNotNull(lessonProgress.completedAt)));
    return { percent: Math.round(done.length / ls.length * 100), completedAt: null, lastLessonId: e.lastLessonId };
  }
  private async itemView(p: Path2, it: PathStep['items'][number], uid: string | undefined, depth = 0): Promise<any> {
    if (it.kind === 'course') {
      const c = await this.db.query.courses.findFirst({ where: eq(courses.id, it.refId) }); if (!c) return null;
      const st = await this.courseState(uid, c.id); const ls = await this.courseLessons(c.id);
      return { kind: 'course', id: c.id, slug: c.slug, title: c.title, color: c.color, icon: c.icon, publisher: pubCard(c.publisherId ? await this.pubById(c.publisherId) : null), optional: !!it.optional, lessonCount: ls.length, durationSec: ls.reduce((s, l) => s + l.durationSec, 0), percent: st?.percent ?? 0, done: !!st?.completedAt, started: !!st, to: st?.lastLessonId ? `/lessons/${st.lastLessonId}` : `/courses/${c.slug}` };
    }
    if (it.kind === 'path' && depth < 2) {
      const q = await this.db.query.paths2.findFirst({ where: eq(paths2.id, it.refId) }); if (!q) return null;
      const v = await this.pathView(q, uid, depth + 1);
      return { kind: 'path', id: q.id, slug: q.slug, title: q.title, size: q.size, sizeFa: SIZE_FA[q.size], color: q.color, publisher: pubCard(await this.pubById(q.publisherId)), optional: !!it.optional, percent: v.percent, done: v.percent >= 100, started: v.me.enrolled, to: `/paths/${q.slug}` };
    }
    if (it.kind === 'live') {
      const e = await this.db.query.events.findFirst({ where: eq(events.id, it.refId) }); if (!e) return null;
      const r = uid ? await this.db.query.registrations.findFirst({ where: and(eq(registrations.eventId, e.id), eq(registrations.userId, uid)) }) : null;
      const past = e.endsAt.getTime() < Date.now(); const done = !!(r && (r.attendedAt || past));
      return { kind: 'live', id: e.id, title: e.title, startsAt: e.startsAt, publisher: pubCard(e.publisherId ? await this.pubById(e.publisherId) : null), optional: !!it.optional, percent: done ? 100 : 0, done, started: !!r, to: `/events/${e.id}` };
    }
    if (it.kind === 'assess') {
      const stepId = p.steps.find((s) => s.items.includes(it))?.id ?? '';
      const a = uid ? await this.db.query.pathAssessments.findFirst({ where: and(eq(pathAssessments.userId, uid), eq(pathAssessments.pathId, p.id), eq(pathAssessments.stepId, stepId)) }) : null;
      return { kind: 'assess', id: it.refId, title: it.title ?? 'دیدار میدانی راهیار', optional: false, percent: a ? 100 : 0, done: !!a, started: false, to: '/me' };
    }
    return null;
  }
  async pathView(p: Path2, uid: string | undefined, depth = 0): Promise<any> {
    const steps = [] as any[];
    for (const s of p.steps) {
      const items = (await Promise.all(s.items.map((it) => this.itemView(p, it, uid, depth)))).filter(Boolean);
      const req = items.filter((i) => !i.optional); const done = req.length > 0 && req.every((i) => i.done);
      steps.push({ id: s.id, title: s.title, rule: s.rule ?? null, items, done, percent: req.length ? Math.round(req.reduce((a, i) => a + i.percent, 0) / req.length) : 0 });
    }
    const total = steps.length ? Math.round(steps.reduce((a, s) => a + s.percent, 0) / steps.length) : 0;
    const curIdx = steps.findIndex((s) => !s.done);
    const e = uid ? await this.db.query.pathEnrollments.findFirst({ where: and(eq(pathEnrollments.userId, uid), eq(pathEnrollments.pathId, p.id)) }) : null;
    const u = uid ? await this.db.query.users.findFirst({ where: eq(users.id, uid), columns: { mainPathId: true } }) : null;
    const enrolledCount = await this.db.select({ n: sql<number>`count(*)::int` }).from(pathEnrollments).where(eq(pathEnrollments.pathId, p.id)).then((r) => r[0]?.n ?? 0);
    return { id: p.id, slug: p.slug, title: p.title, size: p.size, sizeFa: SIZE_FA[p.size], description: p.description, color: p.color, publisher: pubCard(await this.pubById(p.publisherId)), audience: p.audience, hasRahyar: p.hasRahyar, status: p.status, isMain: !!u && u.mainPathId === p.id, mainFor: p.mainFor,
      steps, percent: total, currentStep: curIdx < 0 ? Math.max(0, steps.length - 1) : curIdx, stepCount: steps.length, enrolledCount,
      rahyar: p.hasRahyar ? await this.rahyarOf(p.id) : null, gaade: null, growthSteps: uid ? await this.growthSteps(uid, p) : 0,
      me: { enrolled: !!e, enrolledAt: e?.enrolledAt ?? null, completedAt: e?.completedAt ?? null } };
  }
  /** گام رشد = روایت تأییدشده در دوره‌های مسیر + دیدار میدانی راهیار در همان مسیر */
  private async growthSteps(uid: string, p: Path2) {
    const cids = await this.pathCourseIds(p);
    let approved = 0;
    if (cids.length) {
      const ml = await this.db.select({ id: lessons.id }).from(lessons).innerJoin(modules, eq(modules.id, lessons.moduleId)).where(and(inArray(modules.courseId, cids), eq(lessons.type, 'MISSION')));
      if (ml.length) {
        const rows = await this.db.select({ data: lessonProgress.data }).from(lessonProgress).where(and(eq(lessonProgress.userId, uid), inArray(lessonProgress.lessonId, ml.map((l) => l.id))));
        approved = rows.filter((r) => decJson<any>(r.data)?.status === 'approved').length;
      }
    }
    const assess = await this.db.select({ n: sql<number>`count(*)::int` }).from(pathAssessments).where(and(eq(pathAssessments.userId, uid), eq(pathAssessments.pathId, p.id))).then((r) => r[0]?.n ?? 0);
    return approved + assess;
  }
  private async mainFor(role: string | null | undefined) {
    if (!role || role === 'OTHER') return null;
    return (await this.db.select().from(paths2).where(and(eq(paths2.status, 'PUBLISHED'), sql`${role} = ANY(${paths2.mainFor})`)).limit(1))[0] ?? null;
  }

  // ───────── مسیرها
  async list(u: AuthUser | undefined, q: { who?: string; kind?: string; pub?: string }) {
    const rows = await this.db.select().from(paths2).where(eq(paths2.status, 'PUBLISHED')).orderBy(asc(paths2.createdAt));
    const f = rows.filter((p) => (!q.who || q.who === 'all' || p.audience.includes(q.who)) && (!q.kind || q.kind === 'all' || p.size === q.kind) && (!q.pub || q.pub === 'all' || p.publisherId === q.pub));
    return Promise.all(f.map((p) => this.pathView(p, u?.id)));
  }
  async detail(u: AuthUser | undefined, key: string) {
    const p = await this.path(key);
    if (p.status !== 'PUBLISHED') { const pub = u ? await this.pubOf(u.id) : null; if (!u || !(this.isStaff(u) || pub?.id === p.publisherId)) throw new NotFoundException(err('no_path', 'این مسیر منتشر نشده')); }
    return this.pathView(p, u?.id);
  }
  async enroll(u: AuthUser, key: string) {
    const p = await this.path(key);
    if (p.status !== 'PUBLISHED') throw new NotFoundException(err('no_path', 'این مسیر منتشر نشده'));
    await this.db.insert(pathEnrollments).values({ userId: u.id, pathId: p.id }).onConflictDoNothing();
    return this.pathView(p, u.id);
  }
  async leave(u: AuthUser, key: string) { const p = await this.path(key); await this.db.delete(pathEnrollments).where(and(eq(pathEnrollments.userId, u.id), eq(pathEnrollments.pathId, p.id))); return { ok: true }; }
  async publishersList() { return (await this.db.select().from(publishers).where(eq(publishers.status, 'ACTIVE'))).map(pubCard); }

  // ───────── یادگیری من
  private async nextOf(uid: string, mine: any[], actorRole: string | null) {
    const order = [...mine].sort((a, b) => (a.isMain ? -1 : b.isMain ? 1 : 0));
    for (const v of order) {
      const p = await this.db.query.paths2.findFirst({ where: eq(paths2.id, v.id) }); if (!p) continue;
      const cids = await this.pathCourseIds(p); if (!cids.length) continue;
      const ml = await this.db.select({ id: lessons.id, title: lessons.title, courseId: modules.courseId }).from(lessons).innerJoin(modules, eq(modules.id, lessons.moduleId)).where(and(inArray(modules.courseId, cids), eq(lessons.type, 'MISSION')));
      for (const l of ml) {
        const e = await this.db.query.enrollments.findFirst({ where: and(eq(enrollments.userId, uid), eq(enrollments.courseId, l.courseId)) }); if (!e) continue;
        const pr = await this.db.query.lessonProgress.findFirst({ where: and(eq(lessonProgress.userId, uid), eq(lessonProgress.lessonId, l.id)) });
        const d = decJson<any>(pr?.data);
        const c = await this.db.query.courses.findFirst({ where: eq(courses.id, l.courseId), columns: { title: true } });
        if (d?.status === 'needs_revision') return { kind: 'back', kicker: `${v.title}، ${c?.title ?? ''}`, title: `روایت «${l.title}» با یک نکته برگشته`, cta: 'اصلاح کن و بفرست', to: `/lessons/${l.id}`, color: v.color };
        if (pr && !d?.status) return { kind: 'narrate', kicker: `${v.title}، ${c?.title ?? ''}`, title: `روایت تکلیف «${l.title}» را بنویس`, cta: 'روایت بنویس', to: `/lessons/${l.id}`, color: v.color };
      }
    }
    for (const v of order) {
      const st = v.steps[v.currentStep]; if (!st) continue;
      const it = st.items.find((i: any) => !i.done && !i.optional && i.kind === 'course');
      if (it) return { kind: 'lesson', kicker: `${v.title}، ${v.size === 'micro' ? 'هفتهٔ' : 'پلهٔ'} ${st.title}`, title: it.title, cta: it.started ? 'ادامه بده' : 'شروع کن', to: it.to, color: v.color, pct: it.percent };
    }
    const main = await this.mainFor(actorRole);
    if (main && !mine.some((m) => m.id === main.id)) return { kind: 'start', kicker: 'مسیر اصلی برای تو', title: main.title, cta: 'مسیر را بردار', to: `/paths/${main.slug}`, color: main.color };
    return { kind: 'explore', kicker: 'یادگیری', title: 'یک مسیر کوتاه بردار', cta: 'کاوش', to: '/learn?tab=explore', color: '#1E3A9E' };
  }
  async learning(u: AuthUser) {
    const me = (await this.db.query.users.findFirst({ where: eq(users.id, u.id), columns: { actorRole: true, mainPathId: true } }))!;
    const enr = await this.db.select({ p: paths2 }).from(pathEnrollments).innerJoin(paths2, eq(paths2.id, pathEnrollments.pathId)).where(and(eq(pathEnrollments.userId, u.id), eq(paths2.status, 'PUBLISHED'))).orderBy(desc(pathEnrollments.enrolledAt));
    const mine = await Promise.all(enr.map((r) => this.pathView(r.p, u.id)));
    const main = me.mainPathId ? await this.db.query.paths2.findFirst({ where: eq(paths2.id, me.mainPathId) }) : await this.mainFor(me.actorRole);
    const mineIds = new Set(mine.map((p) => p.id));
    const all = await this.db.select().from(paths2).where(eq(paths2.status, 'PUBLISHED'));
    const sug = all.filter((p) => !mineIds.has(p.id) && (!me.actorRole || me.actorRole === 'OTHER' || p.audience.includes(me.actorRole))).sort((a, b) => (a.size === 'micro' ? 0 : 1) - (b.size === 'micro' ? 0 : 1)).slice(0, 3);
    return { actorRole: me.actorRole ?? null, main: main ? await this.pathView(main, u.id) : null, mine, suggestions: await Promise.all(sug.map((p) => this.pathView(p, u.id))), next: await this.nextOf(u.id, mine, me.actorRole), gaade: null };
  }

  // ───────── میدان
  async field(u: AuthUser) {
    const enr = await this.db.select({ c: courses }).from(enrollments).innerJoin(courses, eq(courses.id, enrollments.courseId)).where(eq(enrollments.userId, u.id));
    const myPaths = (await this.db.select({ p: paths2 }).from(pathEnrollments).innerJoin(paths2, eq(paths2.id, pathEnrollments.pathId)).where(eq(pathEnrollments.userId, u.id))).map((r) => r.p);
    const pathCourses = new Map<string, string[]>(); for (const p of myPaths) pathCourses.set(p.id, await this.pathCourseIds(p));
    const out: any[] = [];
    for (const { c } of enr) {
      const ls = (await this.courseLessons(c.id)).filter((l) => l.type === 'MISSION');
      const p = myPaths.find((x) => pathCourses.get(x.id)?.includes(c.id));
      for (const l of ls) {
        const pr = await this.db.query.lessonProgress.findFirst({ where: and(eq(lessonProgress.userId, u.id), eq(lessonProgress.lessonId, l.id)) });
        const d = decJson<any>(pr?.data);
        const status = d?.status === 'approved' ? 'done' : d?.status === 'needs_revision' ? 'back' : d?.status === 'submitted' || d?.status === 'pending' ? 'wait' : pr ? 'need' : 'open';
        out.push({ lessonId: l.id, title: l.title, goal: (l.content as any)?.goal ?? null, course: { slug: c.slug, title: c.title }, path: p ? { slug: p.slug, title: p.title, color: p.color } : null, status, submittedAt: d?.submittedAt ?? null, reviewedAt: d?.reviewedAt ?? null, note: null, to: `/lessons/${l.id}` });
      }
    }
    const rank: Record<string, number> = { back: 0, need: 1, wait: 2, open: 3, done: 4 };
    out.sort((a, b) => rank[a.status] - rank[b.status]);
    return { tasks: out, counts: { need: out.filter((t) => t.status === 'need').length, wait: out.filter((t) => t.status === 'wait').length, back: out.filter((t) => t.status === 'back').length, done: out.filter((t) => t.status === 'done').length } };
  }

  // ───────── کارنامه
  async karname(u: AuthUser) {
    const enr = await this.db.select({ p: paths2 }).from(pathEnrollments).innerJoin(paths2, eq(paths2.id, pathEnrollments.pathId)).where(eq(pathEnrollments.userId, u.id));
    const mine = await Promise.all(enr.map((r) => this.pathView(r.p, u.id)));
    const certs = await this.db.execute(sql`select c.code, c.course_title as title, c.issued_at as "issuedAt", c.score, k.publisher_id as pid from certificates c left join courses k on k.id = c.course_id where c.user_id = ${u.id} and c.revoked_at is null order by c.issued_at desc`);
    const rows = (certs as any).rows ?? certs;
    const out = [] as any[];
    for (const r of rows as any[]) out.push({ code: r.code, title: r.title, issuedAt: r.issuedAt, score: r.score, publisher: pubCard(r.pid ? await this.pubById(r.pid) : null) });
    return { main: mine.find((p) => p.isMain) ?? null, paths: mine, certs: out, total: mine.reduce((a, p) => a + p.growthSteps, 0), imamat: null };
  }

  // ───────── مسجد روی نقشه و نخستین ورود
  /** مسجدهای نزدیک یک نقطه (یا یک شهرستان)، نزدیک‌ترین اول؛ شهرستان هر مسجد هم می‌آید تا شهرستان کاربر از مسجدش معلوم شود */
  async near(q: { lat?: string; lng?: string; q?: string; county?: string; limit?: string }) {
    const lat = Number(q.lat), lng = Number(q.lng); const s = (q.q ?? '').trim(); const limit = Math.min(Math.max(Number(q.limit) || 8, 1), 30);
    const conds = [s ? sql`${mosques.name} ilike ${'%' + s + '%'}` : undefined, q.county ? eq(mosques.countyId, q.county) : undefined].filter(Boolean) as any[];
    const rows = await this.db.select({ id: mosques.id, name: mosques.name, address: mosques.address, lat: mosques.lat, lng: mosques.lng, verified: mosques.verified, countyId: mosques.countyId, county: counties.name, provinceId: counties.provinceId })
      .from(mosques).innerJoin(counties, eq(counties.id, mosques.countyId)).where(conds.length ? and(...conds) : undefined).limit(2000);
    const dist = (a: number, b: number, c: number, d: number) => { const R = 6371e3, p1 = a * Math.PI / 180, p2 = c * Math.PI / 180, dp = (c - a) * Math.PI / 180, dl = (d - b) * Math.PI / 180; const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
    const here = isFinite(lat) && isFinite(lng) && q.lat != null && q.lng != null;
    return rows.map((m) => ({ ...m, distance: here && m.lat != null && m.lng != null ? Math.round(dist(lat, lng, m.lat, m.lng)) : null }))
      .sort((a, b) => (a.distance ?? 1e12) - (b.distance ?? 1e12) || a.name.localeCompare(b.name, 'fa')).slice(0, limit);
  }
  async proposeMosque(u: AuthUser, d: MosqueDto) {
    const me = (await this.db.query.users.findFirst({ where: eq(users.id, u.id), columns: { countyId: true } }))!;
    // شهرستان مسجد تازه: آنچه کاربر انتخاب کرده ← شهرستان نزدیک‌ترین مسجد به پین ← شهرستان خود کاربر
    let countyId = d.countyId && (await this.db.query.counties.findFirst({ where: eq(counties.id, d.countyId), columns: { id: true } })) ? d.countyId : null;
    // شهرستان از نزدیک‌ترین مسجدِ ثبت‌شده در شعاع ۲۵ کیلومتری پین؛ دورتر از آن مطمئن نیست و از کاربر می‌پرسیم
    if (!countyId && d.lat != null && d.lng != null) { const n = (await this.near({ lat: String(d.lat), lng: String(d.lng), limit: '1' }))[0]; if (n?.distance != null && n.distance <= 25_000) countyId = n.countyId; }
    countyId ??= me.countyId;
    if (!countyId) throw new BadRequestException(err('no_county', 'شهرستان این مسجد را نتوانستیم بفهمیم؛ استان و شهرستانش را انتخاب کن'));
    const [m] = await this.db.insert(mosques).values({ name: d.name.trim(), address: d.address?.trim() || null, countyId, lat: d.lat ?? null, lng: d.lng ?? null, verified: false, proposedBy: u.id }).returning();
    return { id: m.id, name: m.name, address: m.address, verified: false, countyId, lat: m.lat, lng: m.lng, distance: 0 };
  }
  async onboardInfo(u: AuthUser) {
    const me = (await this.db.query.users.findFirst({ where: eq(users.id, u.id) }))!;
    const mosque = me.mosqueId ? await this.db.query.mosques.findFirst({ where: eq(mosques.id, me.mosqueId), columns: { name: true } }) : null;
    const mains = [] as any[];
    for (const r of ROLES) { const p = await this.mainFor(r); mains.push({ role: r, roleFa: ROLE_FA[r], path: p ? { slug: p.slug, title: p.title, publisher: (await this.pubById(p.publisherId))?.name, description: p.description, steps: p.steps.length, color: p.color } : null }); }
    return { actorRole: me.actorRole ?? null, onboarded: !!me.onboardedAt, mosque: mosque?.name ?? null, mains };
  }
  async onboard(u: AuthUser, d: OnboardDto) {
    const patch: Partial<typeof users.$inferInsert> = { onboardedAt: new Date() };
    if (d.firstName) patch.firstName = d.firstName.trim(); if (d.lastName) patch.lastName = d.lastName.trim();
    if (d.actorRole) patch.actorRole = d.actorRole;
    if (d.mosqueId !== undefined) { patch.mosqueId = d.mosqueId || null; if (d.mosqueId) { const m = await this.db.query.mosques.findFirst({ where: eq(mosques.id, d.mosqueId) }); if (!m) throw new NotFoundException(err('no_mosque', 'مسجد پیدا نشد')); patch.lat = m.lat; patch.lng = m.lng; patch.countyId = m.countyId; patch.nearMosque = null; } }
    if (d.lat != null && d.lng != null) { patch.lat = d.lat; patch.lng = d.lng; }
    if (d.relation) patch.mosqueRelation = d.relation;
    if (!patch.countyId && d.countyId) {
      if (!(await this.db.query.counties.findFirst({ where: eq(counties.id, d.countyId), columns: { id: true } }))) throw new BadRequestException(err('bad_county', 'شهرستان پیدا نشد'));
      patch.countyId = d.countyId;
    }
    // شهرستان برای شبکهٔ راهیاری لازم است: از مسجد، یا انتخاب دستی
    if (!patch.countyId && !(await this.db.query.users.findFirst({ where: eq(users.id, u.id), columns: { countyId: true } }))?.countyId) throw new BadRequestException(err('no_county', 'مسجدت را انتخاب کن یا دست‌کم شهرستانت را بگو'));
    const role = d.actorRole ?? (await this.db.query.users.findFirst({ where: eq(users.id, u.id), columns: { actorRole: true } }))?.actorRole;
    const main = await this.mainFor(role);
    patch.mainPathId = main?.id ?? null;
    await this.db.update(users).set(patch).where(eq(users.id, u.id));
    if (main && d.enrollMain !== false) await this.db.insert(pathEnrollments).values({ userId: u.id, pathId: main.id }).onConflictDoNothing();
    return { ok: true, main: main ? await this.pathView(main, u.id) : null };
  }

  // ───────── پنل برگزارکننده
  async pubHome(u: AuthUser) {
    const pub = await this.needPub(u);
    const ps = await this.db.select().from(paths2).where(eq(paths2.publisherId, pub.id)).orderBy(desc(paths2.updatedAt));
    const paths = [] as any[];
    for (const x of ps) paths.push({ id: x.id, slug: x.slug, title: x.title, size: x.size, sizeFa: SIZE_FA[x.size], status: x.status, statusFa: STATUS_FA[x.status], returnNote: x.returnNote, enrolled: await this.db.select({ n: sql<number>`count(*)::int` }).from(pathEnrollments).where(eq(pathEnrollments.pathId, x.id)).then((r) => r[0]?.n ?? 0), steps: x.steps.length, hasRahyar: x.hasRahyar, rahyar: await this.rahyarOf(x.id), submittedAt: x.submittedAt });
    const cs = await this.db.select().from(courses).where(eq(courses.publisherId, pub.id)).orderBy(desc(courses.updatedAt));
    const others = await this.db.select().from(paths2).where(sql`${paths2.publisherId} <> ${pub.id}`);
    const otherCourseIds = new Map<string, string[]>(); for (const o of others) otherCourseIds.set(o.title, await this.pathCourseIds(o));
    const cl = [] as any[];
    for (const c of cs) { const st = c.reviewStatus ?? (c.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'); cl.push({ id: c.id, slug: c.slug, title: c.title, status: st, statusFa: STATUS_FA[st], lessonCount: (await this.courseLessons(c.id)).length, learners: await this.db.select({ n: sql<number>`count(*)::int` }).from(enrollments).where(eq(enrollments.courseId, c.id)).then((r) => r[0]?.n ?? 0), libraryShare: c.libraryShare, version: c.version, instructor: c.instructorId ? await this.name(c.instructorId) : null, usedIn: [...otherCourseIds.entries()].filter(([, ids]) => ids.includes(c.id)).map(([t]) => t) }); }
    const ev = await this.db.select().from(events).where(and(eq(events.publisherId, pub.id), eq(events.isLive, true))).orderBy(desc(events.startsAt));
    const lives = [] as any[];
    for (const e of ev) { const st = e.reviewStatus ?? (e.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'); lives.push({ id: e.id, title: e.title, startsAt: e.startsAt, status: st, statusFa: STATUS_FA[st], registered: await this.db.select({ n: sql<number>`count(*)::int` }).from(registrations).where(eq(registrations.eventId, e.id)).then((r) => r[0]?.n ?? 0) }); }
    let growth = 0; for (const x of ps) { const en = await this.db.select({ userId: pathEnrollments.userId }).from(pathEnrollments).where(eq(pathEnrollments.pathId, x.id)); for (const e of en) growth += await this.growthSteps(e.userId, x); }
    return { publisher: pubCard(pub), paths, courses: cl, lives, stats: { enrolled: paths.reduce((a, x) => a + x.enrolled, 0), growth, inReview: paths.filter((x) => x.status === 'IN_REVIEW').length + cl.filter((c) => c.status === 'IN_REVIEW').length + lives.filter((l) => l.status === 'IN_REVIEW').length } };
  }
  async library(u: AuthUser) {
    const pub = await this.needPub(u);
    const cs = await this.db.select().from(courses).where(and(eq(courses.status, 'PUBLISHED'), sql`(${courses.publisherId} = ${pub.id} or ${courses.libraryShare} <> 'none')`));
    const ps = await this.db.select().from(paths2).where(and(eq(paths2.status, 'PUBLISHED'), sql`${paths2.size} <> 'macro'`));
    const ev = await this.db.select().from(events).where(and(eq(events.isLive, true), eq(events.status, 'PUBLISHED')));
    const pc = async (id: string | null) => pubCard(id ? await this.pubById(id) : null);
    return {
      courses: await Promise.all(cs.map(async (c) => ({ kind: 'course', id: c.id, title: c.title, publisher: await pc(c.publisherId), mine: c.publisherId === pub.id, needsApproval: c.publisherId !== pub.id && c.libraryShare === 'approve', version: c.version }))),
      paths: await Promise.all(ps.map(async (p) => ({ kind: 'path', id: p.id, title: p.title, sizeFa: SIZE_FA[p.size], publisher: await pc(p.publisherId), mine: p.publisherId === pub.id }))),
      lives: await Promise.all(ev.map(async (e) => ({ kind: 'live', id: e.id, title: e.title, publisher: await pc(e.publisherId), mine: e.publisherId === pub.id }))),
    };
  }
  async pubPath(u: AuthUser, id: string) { const pub = await this.needPub(u); const p = await this.path(id); if (p.publisherId !== pub.id) throw new ForbiddenException(err('forbidden', 'این مسیر مال برگزارکنندهٔ دیگری است')); return { ...p, view: await this.pathView(p, undefined) }; }
  async savePath(u: AuthUser, d: PathDto) {
    const pub = await this.needPub(u);
    const steps: PathStep[] = d.steps.map((s, i) => ({ id: s.id ?? 's' + (i + 1), title: s.title?.trim() || (['یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه', 'ده'][i] ?? String(i + 1)), rule: s.rule?.trim() || null, items: (s.items ?? []).filter((it) => it.refId && ['course', 'path', 'live', 'assess'].includes(it.kind)).map((it) => ({ kind: it.kind as any, refId: it.refId, optional: !!it.optional })) }));
    // آیتم‌های دیگران فقط از کتابخانهٔ مشترک
    for (const s of steps) for (const it of s.items) {
      if (it.kind === 'course') { const c = await this.db.query.courses.findFirst({ where: eq(courses.id, it.refId), columns: { publisherId: true, libraryShare: true, title: true } }); if (!c) throw new BadRequestException(err('no_course', 'دوره پیدا نشد')); if (c.publisherId !== pub.id && c.libraryShare === 'none') throw new BadRequestException(err('not_shared', `«${c.title}» در کتابخانهٔ مشترک نیست`)); }
      if (it.kind === 'path') { const q = await this.db.query.paths2.findFirst({ where: eq(paths2.id, it.refId), columns: { size: true, status: true, id: true } }); if (!q || q.size === 'macro' || (q.status !== 'PUBLISHED' && q.id !== d.id)) throw new BadRequestException(err('bad_subpath', 'فقط مسیر خرد یا میانهٔ منتشرشده داخل مسیر می‌نشیند')); }
    }
    const base = { title: d.title.trim(), size: d.size, description: d.description?.trim() || null, audience: d.audience?.length ? d.audience : ['IMAM', 'SHARIK', 'BAZU', 'HASTEH'], color: d.color || pub.color, hasRahyar: d.hasRahyar !== false, steps };
    let p = d.id ? await this.db.query.paths2.findFirst({ where: and(eq(paths2.id, d.id), eq(paths2.publisherId, pub.id)) }) : undefined;
    if (p) { if (p.status === 'IN_REVIEW') throw new BadRequestException(err('in_review', 'در بازبینی ستاد؛ تا پاسخ، ویرایش بسته است')); await this.db.update(paths2).set({ ...base, status: p.status === 'RETURNED' ? 'DRAFT' : p.status }).where(eq(paths2.id, p.id)); p = (await this.db.query.paths2.findFirst({ where: eq(paths2.id, p.id) }))!; }
    else { [p] = await this.db.insert(paths2).values({ ...base, slug: 'path-' + createId().slice(0, 6), publisherId: pub.id, status: 'DRAFT' }).returning(); }
    return { id: p.id, slug: p.slug, status: p.status };
  }
  async submitPath(u: AuthUser, id: string) {
    const pub = await this.needPub(u); const p = await this.path(id); if (p.publisherId !== pub.id) throw new ForbiddenException(err('forbidden', 'این مسیر مال شما نیست'));
    const problems: string[] = [];
    if (!p.steps.length || p.steps.every((s) => !s.items.length)) problems.push('مسیر دست‌کم یک دوره یا پخش زنده لازم دارد');
    if (p.hasRahyar) { const cids = await this.pathCourseIds(p); const hasMission = cids.length ? (await this.db.select({ id: lessons.id }).from(lessons).innerJoin(modules, eq(modules.id, lessons.moduleId)).where(and(inArray(modules.courseId, cids), eq(lessons.type, 'MISSION'))).limit(1)).length > 0 : false; if (!hasMission) problems.push('مسیرِ با راهیار دست‌کم یک تکلیف میدانی لازم دارد'); }
    if (!p.description) problems.push('یک جمله برای کنشگر بنویس');
    if (problems.length) throw new BadRequestException(err('not_ready', problems.join('؛ '), { problems }));
    await this.db.update(paths2).set({ status: 'IN_REVIEW', submittedAt: new Date() }).where(eq(paths2.id, p.id));
    await this.notifyStaff(`مسیر تازه برای بازبینی: ${p.title}`, pub.name);
    return { ok: true, status: 'IN_REVIEW' };
  }
  async withdrawPath(u: AuthUser, id: string) { const pub = await this.needPub(u); const p = await this.path(id); if (p.publisherId !== pub.id) throw new ForbiddenException(err('forbidden', '')); if (p.status === 'IN_REVIEW') await this.db.update(paths2).set({ status: 'DRAFT' }).where(eq(paths2.id, p.id)); return { ok: true }; }
  async createCourse(u: AuthUser, d: CourseDto) {
    const pub = await this.needPub(u);
    const [c] = await this.db.insert(courses).values({ slug: 'course-' + createId().slice(0, 6), title: d.title.trim(), instructor: pub.name, status: 'DRAFT', missionRule: 'ON_APPROVAL', hasCertificate: false, publisherId: pub.id, libraryShare: d.libraryShare ?? 'all' }).returning();
    await this.db.insert(modules).values({ courseId: c.id, title: 'درس‌ها', order: 0 });
    return c;
  }
  async patchCourse(u: AuthUser, id: string, d: CoursePatchDto) { const pub = await this.needPub(u); const c = await this.db.query.courses.findFirst({ where: eq(courses.id, id) }); if (!c || c.publisherId !== pub.id) throw new ForbiddenException(err('forbidden', 'این دوره مال شما نیست')); if (d.libraryShare) await this.db.update(courses).set({ libraryShare: d.libraryShare }).where(eq(courses.id, id)); return { ok: true }; }
  async submitCourse(u: AuthUser, id: string) {
    const pub = await this.needPub(u); const c = await this.db.query.courses.findFirst({ where: eq(courses.id, id) }); if (!c || c.publisherId !== pub.id) throw new ForbiddenException(err('forbidden', 'این دوره مال شما نیست'));
    if (!(await this.courseLessons(c.id)).length) throw new BadRequestException(err('not_ready', 'دوره هنوز درسی ندارد'));
    await this.db.update(courses).set({ reviewStatus: 'IN_REVIEW', submittedAt: new Date() }).where(eq(courses.id, c.id));
    await this.notifyStaff(`دورهٔ تازه برای بازبینی: ${c.title}`, pub.name); return { ok: true };
  }
  async rahyars(u: AuthUser) {
    const pub = await this.needPub(u);
    const ps = await this.db.select().from(paths2).where(and(eq(paths2.publisherId, pub.id), eq(paths2.hasRahyar, true)));
    const rows = [] as any[]; const missing = [] as any[];
    for (const p of ps) {
      const rs = await this.db.select().from(pathRahyars).where(eq(pathRahyars.pathId, p.id));
      const learners = await this.db.select({ n: sql<number>`count(*)::int` }).from(pathEnrollments).where(eq(pathEnrollments.pathId, p.id)).then((r) => r[0]?.n ?? 0);
      if (!rs.length) missing.push({ id: p.id, title: p.title, learners });
      for (const r of rs) rows.push({ userId: r.userId, name: await this.name(r.userId), mobile: '', path: { id: p.id, title: p.title }, learners, avgDays: null });
    }
    return { rows, missing, paths: ps.map((p) => ({ id: p.id, title: p.title })) };
  }
  async invite(u: AuthUser, d: InviteDto) {
    const pub = await this.needPub(u); const p = await this.path(d.pathId); if (p.publisherId !== pub.id) throw new ForbiddenException(err('forbidden', ''));
    const mob = normalizeMobile(d.mobile); if (!mob) throw new BadRequestException(err('bad_mobile', 'شماره باید ۱۱ رقم باشد و با ۰۹ شروع شود'));
    const target = await this.db.query.users.findFirst({ where: eq(users.mobile, mobileKey(mob)), columns: { id: true } });
    if (!target) throw new NotFoundException(err('no_user', 'کسی با این شماره هنوز وارد مدرسه نشده؛ بگو یک بار با همین شماره وارد شود، بعد دعوتش کن'));
    await this.db.insert(roleGrants).values({ userId: target.id, role: 'RAHYAR', grantedById: u.id } as any).onConflictDoNothing();
    await this.db.delete(pathRahyars).where(eq(pathRahyars.pathId, p.id));
    await this.db.insert(pathRahyars).values({ pathId: p.id, userId: target.id });
    await this.notify.send(target.id, { kind: 'RAHYAR', title: `${pub.name} تو را راهیار مسیر «${p.title}» کرد`, link: '/rahyar' });
    return { ok: true };
  }
  async impact(u: AuthUser) {
    const pub = await this.needPub(u);
    const ps = await this.db.select().from(paths2).where(and(eq(paths2.publisherId, pub.id), eq(paths2.status, 'PUBLISHED')));
    const rows = [] as any[];
    for (const p of ps) {
      const en = await this.db.select({ userId: pathEnrollments.userId }).from(pathEnrollments).where(eq(pathEnrollments.pathId, p.id));
      const cids = await this.pathCourseIds(p);
      let active = 0, growth = 0;
      for (const e of en) {
        growth += await this.growthSteps(e.userId, p);
        if (cids.length) { const recent = await this.db.select({ id: lessonProgress.lessonId }).from(lessonProgress).innerJoin(lessons, eq(lessons.id, lessonProgress.lessonId)).innerJoin(modules, eq(modules.id, lessons.moduleId)).where(and(eq(lessonProgress.userId, e.userId), inArray(modules.courseId, cids), sql`${lessonProgress.updatedAt} > now() - interval '21 days'`)).limit(1); if (recent.length) active++; }
      }
      rows.push({ id: p.id, title: p.title, sizeFa: SIZE_FA[p.size], enrolled: en.length, active, growth, dropped: Math.max(0, en.length - active), rahyar: (await this.rahyarOf(p.id))?.name ?? null });
    }
    const mine = await this.db.select({ id: courses.id, title: courses.title }).from(courses).where(eq(courses.publisherId, pub.id));
    const others = await this.db.select().from(paths2).where(and(eq(paths2.status, 'PUBLISHED'), sql`${paths2.publisherId} <> ${pub.id}`));
    const used = [] as any[];
    for (const c of mine) { const ins = [] as any[]; for (const o of others) if ((await this.pathCourseIds(o)).includes(c.id)) ins.push({ title: o.title, publisher: (await this.pubById(o.publisherId))?.name }); if (ins.length) used.push({ title: c.title, paths: ins }); }
    return { rows, others: used, totals: { enrolled: rows.reduce((a, r) => a + r.enrolled, 0), active: rows.reduce((a, r) => a + r.active, 0), growth: rows.reduce((a, r) => a + r.growth, 0) } };
  }

  // ───────── راهیار: دیدار میدانی برای پلهٔ مسیر
  /** مسیرهای یک کنشگر از نگاه راهیارش: فقط مسیرهایی که این راهیار بر آن‌ها گمارده شده (ستاد همه را می‌بیند) */
  async learnerPaths(u: AuthUser, learnerId: string) {
    const enr = await this.db.select({ p: paths2 }).from(pathEnrollments).innerJoin(paths2, eq(paths2.id, pathEnrollments.pathId)).where(eq(pathEnrollments.userId, learnerId));
    const out = [] as any[];
    for (const { p } of enr) {
      const isRahyar = !!(await this.db.query.pathRahyars.findFirst({ where: and(eq(pathRahyars.pathId, p.id), eq(pathRahyars.userId, u.id)) }));
      if (!isRahyar && !this.isStaff(u)) continue;
      const v = await this.pathView(p, learnerId);
      const ass = await this.db.select().from(pathAssessments).where(and(eq(pathAssessments.pathId, p.id), eq(pathAssessments.userId, learnerId)));
      out.push({ ...v, canAssess: true, assessments: ass.map((a) => ({ stepId: a.stepId, note: a.note, at: a.createdAt })) });
    }
    return { learner: await this.name(learnerId), paths: out };
  }
  async assess(u: AuthUser, learnerId: string, d: AssessDto) {
    const p = await this.path(d.pathId);
    const isRahyar = !!(await this.db.query.pathRahyars.findFirst({ where: and(eq(pathRahyars.pathId, p.id), eq(pathRahyars.userId, u.id)) }));
    if (!isRahyar && !this.isStaff(u)) throw new ForbiddenException(err('forbidden', 'فقط راهیار این مسیر دیدار میدانی را ثبت می‌کند'));
    if (!p.steps.some((s) => s.id === d.stepId)) throw new BadRequestException(err('bad_step', 'این پله در مسیر نیست'));
    await this.db.insert(pathAssessments).values({ pathId: p.id, stepId: d.stepId, userId: learnerId, byId: u.id, note: d.note?.trim() || null });
    await this.notify.send(learnerId, { kind: 'GROWTH', title: `گام رشدت در «${p.title}» تأیید شد`, body: d.note?.trim() || undefined, link: `/paths/${p.slug}` });
    return { ok: true };
  }

  // ───────── استودیوی استاد
  private async needOstad(u: AuthUser) { if (!u.roles.includes('INSTRUCTOR') && !this.isStaff(u)) throw new ForbiddenException(err('forbidden', 'این بخش برای استادهاست')); }
  async studio(u: AuthUser) {
    await this.needOstad(u);
    const cs = await this.db.select().from(courses).where(eq(courses.instructorId, u.id)).orderBy(desc(courses.updatedAt));
    const list = [] as any[]; const lessonIds: string[] = []; const analytics = [] as any[];
    for (const c of cs) {
      const ls = await this.courseLessons(c.id); lessonIds.push(...ls.map((l) => l.id));
      const learners = await this.db.select({ completedAt: enrollments.completedAt }).from(enrollments).where(eq(enrollments.courseId, c.id));
      const st = c.reviewStatus ?? (c.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT');
      list.push({ id: c.id, slug: c.slug, title: c.title, status: st, statusFa: STATUS_FA[st], returnNote: c.returnNote, lessonCount: ls.length, learners: learners.length, completed: learners.filter((e) => e.completedAt).length, publisher: c.publisherId ? (await this.pubById(c.publisherId))?.name ?? null : null, missing: ls.filter((l) => (l.type === 'AUDIO' || l.type === 'VIDEO') && !Object.keys((l.content as any) ?? {}).length).length });
      for (const l of ls) {
        const ps = await this.db.select({ completedAt: lessonProgress.completedAt, positionSec: lessonProgress.positionSec }).from(lessonProgress).where(eq(lessonProgress.lessonId, l.id));
        if (ps.length) analytics.push({ course: c.title, lesson: l.title, type: l.type, durationSec: l.durationSec, started: ps.length, done: ps.filter((p) => p.completedAt).length, avgPos: l.durationSec ? Math.round(ps.reduce((a, p) => a + Math.min(1, (p.positionSec ?? 0) / l.durationSec), 0) / ps.length * 100) : null });
      }
    }
    analytics.sort((a, b) => a.done / a.started - b.done / b.started);
    const qs = lessonIds.length ? await this.db.select().from(questions).where(inArray(questions.lessonId, lessonIds)).orderBy(desc(questions.createdAt)) : [];
    const qlist = await Promise.all(qs.map(async (q) => { const as = await this.db.select({ userId: answers.userId }).from(answers).where(eq(answers.questionId, q.id)); const l = await this.db.query.lessons.findFirst({ where: eq(lessons.id, q.lessonId!), columns: { title: true } }); return { id: q.id, title: q.title, body: q.body, by: await this.name(q.userId), lesson: l?.title ?? '', createdAt: q.createdAt, answers: as.length, answeredByMe: as.some((a) => a.userId === u.id) }; }));
    qlist.sort((a, b) => Number(a.answeredByMe) - Number(b.answeredByMe));
    const ev = await this.db.select().from(events).where(and(eq(events.isLive, true), sql`(${events.instructorId} = ${u.id} or ${events.createdById} = ${u.id})`)).orderBy(desc(events.startsAt));
    const lives = await Promise.all(ev.map(async (e) => { const rs = await this.db.select({ attendedAt: registrations.attendedAt }).from(registrations).where(eq(registrations.eventId, e.id)); return { id: e.id, title: e.title, startsAt: e.startsAt, endsAt: e.endsAt, status: e.reviewStatus ?? e.status, registered: rs.length, attended: rs.filter((r) => r.attendedAt).length, record: e.record, past: e.endsAt.getTime() < Date.now() }; }));
    return { courses: list, questions: qlist, lives, analytics: analytics.slice(0, 8), totals: { learners: list.reduce((a, c) => a + c.learners, 0), unanswered: qlist.filter((q) => !q.answeredByMe).length, nextLive: lives.find((l) => !l.past) ?? null } };
  }
  async studioCreateCourse(u: AuthUser, d: CourseDto) {
    await this.needOstad(u);
    const pub = (await this.pubOf(u.id)) ?? (await this.db.query.courses.findFirst({ where: eq(courses.instructorId, u.id), columns: { publisherId: true } }))?.publisherId ?? 'pub-hedayat';
    const pid = typeof pub === 'string' ? pub : pub.id;
    const [c] = await this.db.insert(courses).values({ slug: 'course-' + createId().slice(0, 6), title: d.title.trim(), instructor: await this.name(u.id), instructorId: u.id, status: 'DRAFT', missionRule: 'ON_APPROVAL', hasCertificate: false, publisherId: pid, libraryShare: d.libraryShare ?? 'all' }).returning();
    await this.db.insert(modules).values({ courseId: c.id, title: 'درس‌ها', order: 0 });
    return c;
  }
  async studioSubmit(u: AuthUser, id: string) {
    await this.needOstad(u); const c = await this.db.query.courses.findFirst({ where: eq(courses.id, id) }); if (!c || c.instructorId !== u.id) throw new ForbiddenException(err('forbidden', 'این دوره مال شما نیست'));
    if (!(await this.courseLessons(c.id)).length) throw new BadRequestException(err('not_ready', 'دوره هنوز درسی ندارد'));
    await this.db.update(courses).set({ reviewStatus: 'IN_REVIEW', submittedAt: new Date() }).where(eq(courses.id, c.id));
    await this.notifyStaff(`دورهٔ تازه برای بازبینی: ${c.title}`, await this.name(u.id)); return { ok: true };
  }
  async assignInstructor(u: AuthUser, id: string, mobile: string) {
    const pub = await this.needPub(u); const c = await this.db.query.courses.findFirst({ where: eq(courses.id, id) }); if (!c || c.publisherId !== pub.id) throw new ForbiddenException(err('forbidden', 'این دوره مال شما نیست'));
    const mob = normalizeMobile(mobile); if (!mob) throw new BadRequestException(err('bad_mobile', 'شماره باید ۱۱ رقم باشد و با ۰۹ شروع شود'));
    const t = await this.db.query.users.findFirst({ where: eq(users.mobile, mobileKey(mob)), columns: { id: true } });
    if (!t) throw new NotFoundException(err('no_user', 'کسی با این شماره هنوز وارد مدرسه نشده؛ بگو یک بار با همین شماره وارد شود، بعد دوره را بسپار'));
    await this.db.insert(roleGrants).values({ userId: t.id, role: 'INSTRUCTOR' } as any).onConflictDoNothing();
    await this.db.update(courses).set({ instructorId: t.id, instructor: await this.name(t.id) }).where(eq(courses.id, c.id));
    await this.notify.send(t.id, { kind: 'STUDIO', title: `دورهٔ «${c.title}» به استودیوی تو سپرده شد`, link: '/studio' });
    return { ok: true, instructor: await this.name(t.id) };
  }
  /** چه کسی اجازهٔ ویرایش یک دوره را در ویرایشگر دارد: ستاد، مدیرِ برگزارکنندهٔ سازنده، یا استادِ آن دوره */
  async canEditCourse(u: AuthUser, courseId: string) {
    if (this.isStaff(u)) return true;
    const c = await this.db.query.courses.findFirst({ where: eq(courses.id, courseId), columns: { publisherId: true, instructorId: true } }); if (!c) return false;
    if (c.instructorId === u.id) return true;
    const pub = await this.pubOf(u.id); return !!pub && pub.id === c.publisherId;
  }

  // ───────── ستاد
  private async notifyStaff(title: string, body?: string) {
    const ids = (await this.db.select({ userId: roleGrants.userId }).from(roleGrants).where(eq(roleGrants.role, 'HQ_ADMIN'))).map((r) => r.userId);
    if (ids.length) await this.notify.send(ids, { kind: 'REVIEW', title, body, link: '/admin/review' });
  }
  private async adminsOf(pid: string | null) { if (!pid) return []; return (await this.db.select({ userId: publisherAdmins.userId }).from(publisherAdmins).where(eq(publisherAdmins.publisherId, pid))).map((r) => r.userId); }
  async reviewQueue() {
    const items = [] as any[];
    for (const p of await this.db.select().from(paths2).where(eq(paths2.status, 'IN_REVIEW'))) items.push({ kind: 'path', id: p.id, title: p.title, kindFa: SIZE_FA[p.size], publisher: pubCard(await this.pubById(p.publisherId)), submittedAt: p.submittedAt ?? p.createdAt, facts: [['اندازه', `${p.steps.length} ${p.size === 'micro' ? 'هفته' : 'پله'}`], ['محتوا', `${(await this.pathCourseIds(p)).length} دوره`], ['راهیار', p.hasRahyar ? ((await this.rahyarOf(p.id))?.name ?? 'تعیین نشده') : 'ندارد']], checks: ['مخاطب و پله‌ها روشن است', 'هر پله دست‌کم یک کار میدانی دارد', 'محتوای دیگران با نام سازنده آمده', 'حریم: کاربرگ‌ها نکتهٔ آبرویی نمی‌خواهند'], preview: `/paths/${p.slug}` });
    for (const c of await this.db.select().from(courses).where(eq(courses.reviewStatus, 'IN_REVIEW'))) items.push({ kind: 'course', id: c.id, title: c.title, kindFa: 'دوره', publisher: pubCard(c.publisherId ? await this.pubById(c.publisherId) : null), submittedAt: c.submittedAt ?? c.createdAt, facts: [['درس‌ها', String((await this.courseLessons(c.id)).length)], ['کتابخانه', c.libraryShare === 'none' ? 'خصوصی' : c.libraryShare === 'approve' ? 'با تأیید سازنده' : 'عمومی']], checks: ['هر درس یک کار دارد', 'تکلیف میدانی روشن است'], preview: `/courses/${c.slug}` });
    for (const e of await this.db.select().from(events).where(eq(events.reviewStatus, 'IN_REVIEW'))) items.push({ kind: 'live', id: e.id, title: e.title, kindFa: 'پخش زنده', publisher: pubCard(e.publisherId ? await this.pubById(e.publisherId) : null), submittedAt: e.submittedAt ?? e.createdAt, facts: [['زمان', e.startsAt.toISOString()], ['ظرفیت', e.capacity ? String(e.capacity) : 'بی‌سقف']], checks: ['عنوان و زمان درست است', 'مجری معرفی شده'], preview: null });
    for (const p of await this.db.select().from(publishers).where(eq(publishers.status, 'PENDING'))) items.push({ kind: 'publisher', id: p.id, title: p.name, kindFa: 'برگزارکنندهٔ تازه', publisher: null, submittedAt: p.createdAt, facts: [['نوع', p.kind ?? '—'], ['معرف', p.referrer ?? '—']], checks: ['هویت تأیید شده', 'معرف معتبر', 'تعهد حریم امضا شده'], preview: null });
    items.sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
    const activePubs = await this.db.select({ n: sql<number>`count(*)::int` }).from(publishers).where(eq(publishers.status, 'ACTIVE')).then((r) => r[0]?.n ?? 0);
    return { items, stats: { queue: items.length, publishers: activePubs, growthThisSeason: 0 } };
  }
  async review(u: AuthUser, kind: string, id: string, d: ReviewDto) {
    const ok = d.action === 'publish';
    if (!ok && !d.note?.trim()) throw new BadRequestException(err('need_note', 'برای برگرداندن، دلیل را بنویس'));
    let title = '', owners: string[] = [];
    if (kind === 'path') { const p = await this.path(id); await this.db.update(paths2).set({ status: ok ? 'PUBLISHED' : 'RETURNED', returnNote: ok ? null : d.note, reviewedAt: new Date() }).where(eq(paths2.id, p.id)); title = p.title; owners = await this.adminsOf(p.publisherId); }
    else if (kind === 'course') { const c = await this.db.query.courses.findFirst({ where: eq(courses.id, id) }); if (!c) throw new NotFoundException(err('no_course', 'دوره پیدا نشد')); await this.db.update(courses).set({ reviewStatus: ok ? 'PUBLISHED' : 'RETURNED', returnNote: ok ? null : d.note, ...(ok ? { status: 'PUBLISHED' as const, publishedAt: new Date() } : {}) }).where(eq(courses.id, c.id)); title = c.title; owners = await this.adminsOf(c.publisherId); }
    else if (kind === 'live') { const e = await this.db.query.events.findFirst({ where: eq(events.id, id) }); if (!e) throw new NotFoundException(err('no_event', 'برنامه پیدا نشد')); await this.db.update(events).set({ reviewStatus: ok ? 'PUBLISHED' : 'RETURNED', returnNote: ok ? null : d.note, ...(ok ? { status: 'PUBLISHED' as const } : {}) }).where(eq(events.id, e.id)); title = e.title; owners = await this.adminsOf(e.publisherId); }
    else if (kind === 'publisher') { const p = await this.pubById(id); if (!p) throw new NotFoundException(err('no_pub', 'برگزارکننده پیدا نشد')); await this.db.update(publishers).set({ status: ok ? 'ACTIVE' : 'REJECTED', note: d.note ?? null }).where(eq(publishers.id, id)); title = p.name; }
    else throw new BadRequestException(err('bad_kind', 'نوع نامعتبر'));
    if (owners.length) await this.notify.send(owners, { kind: 'REVIEW', title: ok ? `«${title}» منتشر شد` : `«${title}» برگشت: ${d.note}`, link: '/pub' });
    await this.db.insert(auditLogs).values({ actorId: u.id, action: ok ? 'review.publish' : 'review.return', target: id } as any);
    return { ok: true };
  }
  async publishersAdmin() {
    const ps = await this.db.select().from(publishers).orderBy(asc(publishers.createdAt));
    const out = [] as any[];
    for (const p of ps) out.push({ ...p, paths: await this.db.select({ n: sql<number>`count(*)::int` }).from(paths2).where(and(eq(paths2.publisherId, p.id), eq(paths2.status, 'PUBLISHED'))).then((r) => r[0]?.n ?? 0), courses: await this.db.select({ n: sql<number>`count(*)::int` }).from(courses).where(eq(courses.publisherId, p.id)).then((r) => r[0]?.n ?? 0), learners: await this.db.select({ n: sql<number>`count(distinct ${pathEnrollments.userId})::int` }).from(pathEnrollments).innerJoin(paths2, eq(paths2.id, pathEnrollments.pathId)).where(eq(paths2.publisherId, p.id)).then((r) => r[0]?.n ?? 0), admins: await Promise.all((await this.adminsOf(p.id)).map((id) => this.name(id))) });
    return out;
  }
  async createPublisher(d: PublisherDto) { const [p] = await this.db.insert(publishers).values({ name: d.name.trim(), color: d.color || '#8C93B5', status: 'ACTIVE', kind: d.kind ?? 'مؤسسه', referrer: d.referrer ?? 'ستاد' }).returning(); return p; }
  async patchPublisher(id: string, d: PublisherPatchDto) {
    const p = await this.pubById(id); if (!p) throw new NotFoundException(err('no_pub', 'برگزارکننده پیدا نشد'));
    if (d.status) { if (d.status === 'BLOCKED' && !d.note?.trim()) throw new BadRequestException(err('need_note', 'دلیل مسدود کردن را بنویس')); await this.db.update(publishers).set({ status: d.status, note: d.note ?? p.note }).where(eq(publishers.id, id)); }
    if (d.adminMobile) { const mob = normalizeMobile(d.adminMobile); if (!mob) throw new BadRequestException(err('bad_mobile', 'شماره درست نیست')); const t = await this.db.query.users.findFirst({ where: eq(users.mobile, mobileKey(mob)), columns: { id: true } }); if (!t) throw new NotFoundException(err('no_user', 'کاربری با این شماره نیست')); await this.db.insert(publisherAdmins).values({ publisherId: id, userId: t.id }).onConflictDoNothing(); await this.db.insert(roleGrants).values({ userId: t.id, role: 'ORG_ADMIN', networkId: null } as any).onConflictDoNothing(); }
    return { ok: true };
  }
}

@Controller('v2')
export class Paths2Controller {
  constructor(private readonly s: Paths2Service) {}
  @Get('paths') @Public() list(@MaybeUser() u: AuthUser | undefined, @Query() q: any) { return this.s.list(u, q); }
  @Get('paths/:key') @Public() detail(@MaybeUser() u: AuthUser | undefined, @Param('key') key: string) { return this.s.detail(u, key); }
  @Post('paths/:key/enroll') @HttpCode(200) enroll(@CurrentUser() u: AuthUser, @Param('key') key: string) { return this.s.enroll(u, key); }
  @Post('paths/:key/leave') @HttpCode(200) leave(@CurrentUser() u: AuthUser, @Param('key') key: string) { return this.s.leave(u, key); }
  @Get('publishers') @Public() publishers() { return this.s.publishersList(); }
  @Get('learning') learning(@CurrentUser() u: AuthUser) { return this.s.learning(u); }
  @Get('field') field(@CurrentUser() u: AuthUser) { return this.s.field(u); }
  @Get('karname') karname(@CurrentUser() u: AuthUser) { return this.s.karname(u); }
  @Get('mosques/near') @Public() near(@Query() q: any) { return this.s.near(q); }
  @Post('mosques') proposeMosque(@CurrentUser() u: AuthUser, @Body() d: MosqueDto) { return this.s.proposeMosque(u, d); }
  @Get('onboard') onboardInfo(@CurrentUser() u: AuthUser) { return this.s.onboardInfo(u); }
  @Post('onboard') @HttpCode(200) onboard(@CurrentUser() u: AuthUser, @Body() d: OnboardDto) { return this.s.onboard(u, d); }
  // برگزارکننده
  @Get('pub') pub(@CurrentUser() u: AuthUser) { return this.s.pubHome(u); }
  @Get('pub/library') library(@CurrentUser() u: AuthUser) { return this.s.library(u); }
  @Get('pub/paths/:id') pubPath(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.s.pubPath(u, id); }
  @Post('pub/paths') @HttpCode(200) savePath(@CurrentUser() u: AuthUser, @Body() d: PathDto) { return this.s.savePath(u, d); }
  @Post('pub/paths/:id/submit') @HttpCode(200) submitPath(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.s.submitPath(u, id); }
  @Post('pub/paths/:id/withdraw') @HttpCode(200) withdraw(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.s.withdrawPath(u, id); }
  @Post('pub/courses') createCourse(@CurrentUser() u: AuthUser, @Body() d: CourseDto) { return this.s.createCourse(u, d); }
  @Patch('pub/courses/:id') patchCourse(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() d: CoursePatchDto) { return this.s.patchCourse(u, id, d); }
  @Post('pub/courses/:id/submit') @HttpCode(200) submitCourse(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.s.submitCourse(u, id); }
  @Get('pub/rahyars') rahyars(@CurrentUser() u: AuthUser) { return this.s.rahyars(u); }
  @Post('pub/rahyars') @HttpCode(200) invite(@CurrentUser() u: AuthUser, @Body() d: InviteDto) { return this.s.invite(u, d); }
  @Get('pub/impact') impact(@CurrentUser() u: AuthUser) { return this.s.impact(u); }
  // استاد
  @Get('studio') studio(@CurrentUser() u: AuthUser) { return this.s.studio(u); }
  @Post('studio/courses') studioCreate(@CurrentUser() u: AuthUser, @Body() d: CourseDto) { return this.s.studioCreateCourse(u, d); }
  @Post('studio/courses/:id/submit') @HttpCode(200) studioSubmit(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.s.studioSubmit(u, id); }
  @Post('pub/courses/:id/instructor') @HttpCode(200) assignInstructor(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() d: InviteMobileDto) { return this.s.assignInstructor(u, id, d.mobile); }
  // راهیار
  @Get('rahyar/learners/:id/paths') @Roles('RAHYAR', 'HQ_ADMIN', 'HQ_OPERATOR') learnerPaths(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.s.learnerPaths(u, id); }
  @Post('rahyar/assess/:learnerId') @HttpCode(200) @Roles('RAHYAR', 'HQ_ADMIN', 'HQ_OPERATOR') assess(@CurrentUser() u: AuthUser, @Param('learnerId') learnerId: string, @Body() d: AssessDto) { return this.s.assess(u, learnerId, d); }
  // ستاد
  @Get('admin/review') @Roles('HQ_ADMIN', 'HQ_OPERATOR') reviewQueue() { return this.s.reviewQueue(); }
  @Post('admin/review/:kind/:id') @HttpCode(200) @Roles('HQ_ADMIN', 'HQ_OPERATOR') review(@CurrentUser() u: AuthUser, @Param('kind') kind: string, @Param('id') id: string, @Body() d: ReviewDto) { return this.s.review(u, kind, id, d); }
  @Get('admin/publishers') @Roles('HQ_ADMIN', 'HQ_OPERATOR') publishersAdmin() { return this.s.publishersAdmin(); }
  @Post('admin/publishers') @Roles('HQ_ADMIN') createPublisher(@Body() d: PublisherDto) { return this.s.createPublisher(d); }
  @Patch('admin/publishers/:id') @Roles('HQ_ADMIN') patchPublisher(@Param('id') id: string, @Body() d: PublisherPatchDto) { return this.s.patchPublisher(id, d); }
}
