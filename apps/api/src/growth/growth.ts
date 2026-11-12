/**
 * راهبردهای یادگیری فردی: مراحل رشد (بی‌رقابت)، ریتم هفتگی، مرور با فاصله، تسلط، داستان میدان.
 * هیچ‌کدام کنشگر را با دیگران مقایسه نمی‌کند و هیچ‌کدام جریمه ندارد.
 */
import { BadRequestException, Body, Controller, ForbiddenException, Get, HttpCode, Injectable, NotFoundException, Param, Post, Put } from '@nestjs/common';
import { IsInt, IsObject, Max, Min, ValidateIf } from 'class-validator';
import { and, asc, desc, eq, gte, inArray, isNotNull, isNull, lte, sql } from 'drizzle-orm';
import { randomInt } from 'node:crypto';
import { AuthUser, CurrentUser } from '../common/auth.decorators';
import { Db, InjectDb } from '../db/db.module';
import { certificates, courses, enrollments, lessonProgress, lessons, missionSamples, modules, reviews, weeklyGoals } from '../db/schema';
import { gradeQuiz, publicContent, reviewPool, skillStates } from '../learning/lesson-content';
import { Notifier } from '../notifications/notifications';

const DAY = 86400_000;
const TEHRAN_OFFSET = 3.5 * 3600_000; // ایران ساعت تابستانی ندارد
/** مرور پس از پایان دوره: ۳ و ۱۰ روز بعد */
const REVIEW_ROUNDS = [{ round: 1, afterDays: 3 }, { round: 2, afterDays: 10 }];
const REVIEW_SIZE = 3;

/** مراحل رشد کنشگر؛ فقط با کار خود او جلو می‌رود */
export const STAGES = [
  { key: 'SEED', title: 'دانه', courses: 0, missions: 0 },
  { key: 'SPROUT', title: 'جوانه', courses: 1, missions: 0 },
  { key: 'SAPLING', title: 'نهال', courses: 3, missions: 1 },
  { key: 'TREE', title: 'درخت', courses: 6, missions: 3 },
] as const;

/** آغاز هفته (شنبه، به وقت تهران) */
export function weekStart(at = new Date()) {
  const t = new Date(at.getTime() + TEHRAN_OFFSET);
  const sinceSat = (t.getUTCDay() + 1) % 7;
  return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate() - sinceSat) - TEHRAN_OFFSET);
}

class GoalDto { @ValidateIf((_o, v) => v !== null) @IsInt() @Min(1) @Max(21) lessonsPerWeek: number | null; }
class AnswersDto { @IsObject() answers: Record<string, string[]>; }

@Injectable()
export class GrowthService {
  constructor(@InjectDb() private readonly db: Db, private readonly notify: Notifier) {}

  // ───────── مراحل رشد و تسلط ─────────

  async growth(userId: string) {
    const [{ c }] = await this.db.select({ c: sql<number>`count(*)::int` }).from(enrollments).where(and(eq(enrollments.userId, userId), isNotNull(enrollments.completedAt)));
    const [{ m }] = await this.db.select({ m: sql<number>`count(*)::int` }).from(lessonProgress).innerJoin(lessons, eq(lessons.id, lessonProgress.lessonId))
      .where(and(eq(lessonProgress.userId, userId), isNotNull(lessonProgress.completedAt), eq(lessons.type, 'MISSION')));
    const [{ k }] = await this.db.select({ k: sql<number>`count(*)::int` }).from(certificates).where(and(eq(certificates.userId, userId), isNull(certificates.revokedAt)));
    let i = 0;
    STAGES.forEach((s, idx) => { if (c >= s.courses && m >= s.missions) i = idx; });
    const next = STAGES[i + 1];
    const skills = await this.skills(userId);
    return {
      stage: STAGES[i].key, stageTitle: STAGES[i].title, index: i,
      coursesDone: c, missionsDone: m, certificates: k,
      next: next ? { key: next.key, title: next.title, coursesLeft: Math.max(0, next.courses - c), missionsLeft: Math.max(0, next.missions - m) } : null,
      stages: STAGES.map((s) => ({ key: s.key, title: s.title, courses: s.courses, missions: s.missions })),
      skills: { mastered: skills.filter((s) => s.mastered).length, total: skills.length, list: skills.filter((s) => s.mastered).slice(0, 24) },
    };
  }

  /** مهارت‌های همهٔ دوره‌هایی که کنشگر در آن‌ها ثبت‌نام کرده */
  async skills(userId: string) {
    const ens = await this.db.select({ courseId: enrollments.courseId }).from(enrollments).where(eq(enrollments.userId, userId));
    if (!ens.length) return [];
    const cs = await this.db.select({ id: courses.id, title: courses.title, slug: courses.slug, skills: courses.skills }).from(courses).where(inArray(courses.id, ens.map((e) => e.courseId)));
    const withSkills = cs.filter((c) => (c.skills ?? []).length);
    if (!withSkills.length) return [];
    const ls = await this.db.select({ id: lessons.id, skillIds: lessons.skillIds, courseId: modules.courseId }).from(lessons)
      .innerJoin(modules, eq(modules.id, lessons.moduleId)).where(inArray(modules.courseId, withSkills.map((c) => c.id)));
    const done = new Set((await this.db.select({ id: lessonProgress.lessonId }).from(lessonProgress)
      .where(and(eq(lessonProgress.userId, userId), isNotNull(lessonProgress.completedAt), inArray(lessonProgress.lessonId, ls.map((l) => l.id))))).map((r) => r.id));
    return withSkills.flatMap((c) => skillStates(c.skills, ls.filter((l) => l.courseId === c.id), done).map((s) => ({ ...s, course: { title: c.title, slug: c.slug } })));
  }

  // ───────── ریتم هفتگی ─────────

  async rhythm(userId: string) {
    const g = await this.db.query.weeklyGoals.findFirst({ where: eq(weeklyGoals.userId, userId) });
    const start = weekStart();
    const from = new Date(start.getTime() - 7 * 7 * DAY);
    const rows = await this.db.select({ at: lessonProgress.completedAt }).from(lessonProgress)
      .where(and(eq(lessonProgress.userId, userId), gte(lessonProgress.completedAt, from)));
    const times = rows.map((r) => r.at!.getTime());
    const days = Array.from({ length: 7 }, (_, d) => times.filter((t) => t >= start.getTime() + d * DAY && t < start.getTime() + (d + 1) * DAY).length);
    const goal = g?.lessonsPerWeek ?? null;
    const weeks = Array.from({ length: 8 }, (_, w) => {
      const ws = start.getTime() - (7 - w) * 7 * DAY;
      const n = times.filter((t) => t >= ws && t < ws + 7 * DAY).length;
      return { weekStart: new Date(ws), count: n, met: goal != null && n >= goal };
    });
    const doneThisWeek = days.reduce((a, b) => a + b, 0);
    const today = Math.min(6, Math.floor((Date.now() - start.getTime()) / DAY));
    return { goal, weekStart: start, doneThisWeek, days, today, weeks };
  }

  async setGoal(userId: string, n: number | null) {
    if (n === null) { await this.db.delete(weeklyGoals).where(eq(weeklyGoals.userId, userId)); return this.rhythm(userId); }
    await this.db.insert(weeklyGoals).values({ userId, lessonsPerWeek: n }).onConflictDoUpdate({ target: weeklyGoals.userId, set: { lessonsPerWeek: n, updatedAt: new Date() } });
    return this.rhythm(userId);
  }

  // ───────── مرور با فاصله ─────────

  private async courseLessons(courseId: string) {
    return this.db.select({ type: lessons.type, isFinalQuiz: lessons.isFinalQuiz, content: lessons.content }).from(lessons)
      .innerJoin(modules, eq(modules.id, lessons.moduleId)).where(eq(modules.courseId, courseId)).orderBy(asc(modules.order), asc(lessons.order));
  }

  /** پس از پایان یک دوره صدا زده می‌شود؛ اگر دوره پرسشی ندارد، مروری هم ندارد */
  async scheduleReviews(userId: string, courseId: string, at = new Date()) {
    const pool = reviewPool(await this.courseLessons(courseId));
    if (!pool.length) return;
    const ids = pool.map((q) => q.id);
    for (let i = ids.length - 1; i > 0; i--) { const j = randomInt(i + 1); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    for (const [k, r] of REVIEW_ROUNDS.entries()) {
      // هر دور تا جای ممکن پرسش‌های تازه
      const pick = ids.length >= REVIEW_SIZE * 2 ? ids.slice(k * REVIEW_SIZE, (k + 1) * REVIEW_SIZE) : ids.slice(0, REVIEW_SIZE);
      await this.db.insert(reviews).values({ userId, courseId, round: r.round, dueAt: new Date(at.getTime() + r.afterDays * DAY), questionIds: pick }).onConflictDoNothing();
    }
  }

  async myReviews(userId: string) {
    const now = new Date();
    const rows = await this.db.select({ r: reviews, title: courses.title, slug: courses.slug }).from(reviews).innerJoin(courses, eq(courses.id, reviews.courseId))
      .where(and(eq(reviews.userId, userId), isNull(reviews.doneAt))).orderBy(asc(reviews.dueAt));
    const due = rows.filter((x) => x.r.dueAt <= now);
    const upcoming = rows.filter((x) => x.r.dueAt > now);
    return {
      due: due.map((x) => ({ id: x.r.id, round: x.r.round, dueAt: x.r.dueAt, questionCount: x.r.questionIds.length, course: { title: x.title, slug: x.slug } })),
      next: upcoming[0] ? { dueAt: upcoming[0].r.dueAt, course: { title: upcoming[0].title, slug: upcoming[0].slug } } : null,
    };
  }

  private async ownReview(userId: string, id: string) {
    const r = await this.db.query.reviews.findFirst({ where: eq(reviews.id, id) });
    if (!r || r.userId !== userId) throw new NotFoundException({ code: 'no_review', message: 'این مرور پیدا نشد' });
    const c = (await this.db.query.courses.findFirst({ where: eq(courses.id, r.courseId) }))!;
    const pool = reviewPool(await this.courseLessons(r.courseId));
    const qs = r.questionIds.map((qid) => pool.find((q) => q.id === qid)).filter(Boolean) as ReturnType<typeof reviewPool>;
    return { r, c, qs };
  }

  async review(userId: string, id: string) {
    const { r, c, qs } = await this.ownReview(userId, id);
    return {
      id: r.id, round: r.round, dueAt: r.dueAt, doneAt: r.doneAt, score: r.score, open: r.dueAt <= new Date() && !r.doneAt,
      course: { title: c.title, slug: c.slug },
      questions: publicContent('QUIZ', { questions: qs }).questions,
    };
  }

  async submitReview(userId: string, id: string, answers: Record<string, string[]>) {
    const { r, qs } = await this.ownReview(userId, id);
    if (r.doneAt) throw new BadRequestException({ code: 'review_done', message: 'این مرور را قبلاً انجام داده‌اید' });
    if (r.dueAt > new Date()) throw new ForbiddenException({ code: 'review_early', message: 'وقت این مرور هنوز نرسیده است' });
    if (!qs.length) {
      // پرسش‌ها از دوره برداشته شده‌اند؛ مرور بی‌پرسش بسته می‌شود
      await this.db.update(reviews).set({ doneAt: new Date(), score: null }).where(eq(reviews.id, id));
      return { score: null, results: [] };
    }
    const { score, results } = gradeQuiz({ questions: qs }, answers ?? {});
    await this.db.update(reviews).set({ doneAt: new Date(), score }).where(eq(reviews.id, id));
    return { score, results };
  }

  /** زمان‌بند: ساعتی یک بار، مرورهایی که وقتشان رسیده یک بار اعلان می‌شوند */
  async notifyDueReviews() {
    const rows = await this.db.select({ id: reviews.id, userId: reviews.userId, title: courses.title }).from(reviews).innerJoin(courses, eq(courses.id, reviews.courseId))
      .where(and(isNull(reviews.doneAt), isNull(reviews.notifiedAt), lte(reviews.dueAt, new Date()))).limit(500);
    for (const x of rows) {
      await this.notify.send(x.userId, { kind: 'REVIEW', title: `وقت مرور «${x.title}» است`, body: 'سه پرسش کوتاه، کمتر از دو دقیقه. همین مرور کوتاه است که آموخته‌ها را ماندگار می‌کند.', link: `/review/${x.id}` });
      await this.db.update(reviews).set({ notifiedAt: new Date() }).where(eq(reviews.id, x.id));
    }
  }

  // ───────── داستان میدان ─────────

  /** تازه‌ترین گزارش‌های نمونهٔ منتشرشده؛ متن فقط با اجازهٔ خود کنشگر منتشر شده است */
  async stories() {
    const rows = await this.db.select({ text: missionSamples.text, authorLabel: missionSamples.authorLabel, publishedAt: missionSamples.publishedAt,
      lessonId: lessons.id, lessonTitle: lessons.title, courseTitle: courses.title, courseSlug: courses.slug })
      .from(missionSamples).innerJoin(lessons, eq(lessons.id, missionSamples.lessonId)).innerJoin(modules, eq(modules.id, lessons.moduleId))
      .innerJoin(courses, eq(courses.id, modules.courseId))
      .where(and(eq(missionSamples.status, 'PUBLISHED'), eq(courses.status, 'PUBLISHED'), isNotNull(missionSamples.text)))
      .orderBy(desc(missionSamples.publishedAt)).limit(6);
    return rows.map((r) => ({ text: r.text!, authorLabel: r.authorLabel ?? 'یک کنشگر', publishedAt: r.publishedAt, mission: { id: r.lessonId, title: r.lessonTitle }, course: { title: r.courseTitle, slug: r.courseSlug } }));
  }
}

@Controller()
export class GrowthController {
  constructor(private readonly g: GrowthService) {}

  @Get('me/growth') growth(@CurrentUser() u: AuthUser) { return this.g.growth(u.id); }
  @Get('me/skills') skills(@CurrentUser() u: AuthUser) { return this.g.skills(u.id); }
  @Get('me/rhythm') rhythm(@CurrentUser() u: AuthUser) { return this.g.rhythm(u.id); }
  @Put('me/rhythm') setGoal(@CurrentUser() u: AuthUser, @Body() d: GoalDto) { return this.g.setGoal(u.id, d.lessonsPerWeek ?? null); }
  @Get('me/reviews') myReviews(@CurrentUser() u: AuthUser) { return this.g.myReviews(u.id); }
  @Get('reviews/:id') review(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.g.review(u.id, id); }
  @Post('reviews/:id') @HttpCode(200) submit(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() d: AnswersDto) { return this.g.submitReview(u.id, id, d.answers); }
  @Get('stories') stories() { return this.g.stories(); }
}
