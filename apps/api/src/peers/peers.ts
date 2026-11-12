/**
 * همتایان — سمت سرور: گعده (برنامه، عضویت، حضور، خلاصه)، پرسش از همتا، نظر همتا روی روایت، فرایند تعیّن امامت (سطح و شایستگی با ارزیابی میدانی راهیار).
 * همان پاسخ‌هایی که نسخهٔ نمایشی (apps/web/src/demo/peers.ts) می‌دهد.
 */
import { BadRequestException, Body, Controller, ForbiddenException, Get, HttpCode, Injectable, NotFoundException, Param, Post, Put, Query } from '@nestjs/common';
import { IsArray, IsIn, IsInt, IsObject, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { AuthUser, CurrentUser, Roles } from '../common/auth.decorators';
import { Db, InjectDb } from '../db/db.module';
import { answers, auditLogs, gaade, gaadeMembers, gaadeNotes, imamat, imamatAssessments, lessons, modules, peerReplies, peerRequests, questions, roleGrants, users, votes } from '../db/schema';
import { Notifier } from '../notifications/notifications';
import { RahyarService } from '../rahyar/rahyar.service';

export const PETAL_IDS = ['manavi', 'akhlagh', 'ertebat', 'orfi', 'tashkilat', 'modiriat', 'resane', 'sharika', 'bazovan', 'halghe', 'sahne', 'omid', 'tamadon', 'rahkar', 'eghdam', 'ejra', 'arzyabi', 'tabyin', 'khish', 'okhovat', 'vefagh', 'ettehad', 'tavazo', 'fotovat'];
const LEVEL_FA = ['امام جماعت', 'امام مسجد', 'امام محله', 'امام میانی'];
const DAY = 86400_000;
const err = (code: string, message: string, extra: Record<string, unknown> = {}) => ({ code, message, ...extra });

class GaadeDto { @IsString() @Length(2, 80) title: string; @IsString() @Length(2, 160) topic: string; @IsOptional() @IsString() rhythm?: string; @IsOptional() @IsString() place?: string; @IsOptional() @IsString() at?: string; @IsOptional() @IsArray() invite?: string[] }
class NextDto { @IsString() at: string; @IsString() @Length(1, 120) where: string; @IsString() @Length(2, 160) topic: string }
class NoteDto { @IsString() @Length(2, 1500) experience: string; @IsOptional() @IsString() @Length(0, 800) knot?: string; @IsString() @Length(2, 500) promise: string }
class RsvpDto { @IsIn(['YES', 'NO']) rsvp: 'YES' | 'NO' }
class InviteDto { @IsArray() userIds: string[] }
class QuestionDto { @IsString() @Length(3, 160) title: string; @IsOptional() @IsString() @Length(0, 2000) body?: string; @IsOptional() @IsString() lessonId?: string }
class AnswerDto { @IsString() @Length(2, 3000) body: string }
class PeerReqDto { @IsString() gaadeId: string; @IsString() @Length(2, 120) title: string; @IsString() @Length(2, 3000) body: string }
class AssessDto { @IsInt() @Min(1) @Max(4) level: number; @IsOptional() @IsInt() @Min(1) @Max(5) spiral?: number; @IsString() @Length(3, 1000) note: string; @IsOptional() @IsObject() petals?: Record<string, number> }

@Injectable()
export class PeersService {
  constructor(@InjectDb() private readonly db: Db, private readonly notify: Notifier, private readonly rahyar: RahyarService) {}

  private async rolesOf(uid: string) { return (await this.db.select({ role: roleGrants.role }).from(roleGrants).where(eq(roleGrants.userId, uid))).map((r) => r.role as string); }
  private async person(id: string) {
    const u = await this.db.query.users.findFirst({ where: eq(users.id, id), columns: { firstName: true, lastName: true, gender: true } });
    const r = await this.rolesOf(id);
    return { id, name: u ? `${u.firstName} ${u.lastName}` : '', gender: u?.gender ?? null, role: r.includes('RAHYAR') ? 'RAHYAR' : r.includes('IMAM') ? 'IMAM' : null };
  }
  private members(gid: string) { return this.db.select().from(gaadeMembers).where(eq(gaadeMembers.gaadeId, gid)); }
  private async isMember(gid: string, uid: string) { return !!(await this.db.query.gaadeMembers.findFirst({ where: and(eq(gaadeMembers.gaadeId, gid), eq(gaadeMembers.userId, uid)) })); }
  private async G(id: string) { const g = await this.db.query.gaade.findFirst({ where: eq(gaade.id, id) }); if (!g) throw new NotFoundException(err('not_found', 'گعده پیدا نشد')); return g; }
  private async card(g: typeof gaade.$inferSelect, uid: string) {
    const ms = await this.members(g.id); const mine = ms.find((m) => m.userId === uid);
    return { id: g.id, title: g.title, kind: g.kind, rhythm: g.rhythm, place: g.place, host: await this.person(g.hostId), memberCount: ms.length, members: await Promise.all(ms.slice(0, 6).map((m) => this.person(m.userId))), next: g.next, joined: !!mine, rsvp: mine?.rsvp ?? null, yes: ms.filter((m) => m.rsvp === 'YES').length };
  }

  // ── گعده
  async list(u: AuthUser) {
    const r = await this.rolesOf(u.id);
    const all = await this.db.select().from(gaade).orderBy(desc(gaade.createdAt));
    const mine = [] as any[], near = [] as any[];
    for (const g of all) { const m = await this.isMember(g.id, u.id); if (m) mine.push(await this.card(g, u.id)); else if (g.kind !== 'IMAMS' || r.includes('IMAM')) near.push(await this.card(g, u.id)); }
    return { mine, near: near.slice(0, 12) };
  }
  async create(u: AuthUser, d: GaadeDto) {
    const me = (await this.db.query.users.findFirst({ where: eq(users.id, u.id) }))!;
    const [g] = await this.db.insert(gaade).values({ title: d.title.trim(), kind: 'CUSTOM', hostId: u.id, rhythm: d.rhythm || 'ماهانه', place: d.place || 'مسجد', next: { at: d.at || new Date(Date.now() + 7 * DAY).toISOString(), where: d.place || 'مسجد', topic: d.topic.trim() } }).returning();
    await this.db.insert(gaadeMembers).values({ gaadeId: g.id, userId: u.id, rsvp: 'YES' });
    for (const x of (d.invite ?? []).filter((x) => x !== u.id)) { await this.db.insert(gaadeMembers).values({ gaadeId: g.id, userId: x, rsvp: null }).onConflictDoNothing(); await this.notify.send(x, { kind: 'GAADE', title: `دعوت به «${g.title}»`, body: `${me.firstName} ${me.lastName} شما را به گعده دعوت کرد`, link: `/gaade/${g.id}` }); }
    return { id: g.id };
  }
  async candidates(u: AuthUser) {
    const me = (await this.db.query.users.findFirst({ where: eq(users.id, u.id) }))!;
    const rows = await this.db.select({ id: users.id }).from(users).where(and(sql`${users.id} <> ${u.id}`, me.gender ? eq(users.gender, me.gender) : sql`true`, me.countyId ? eq(users.countyId, me.countyId) : sql`true`, eq(users.isActive, true))).limit(60);
    const out = [] as any[];
    for (const x of rows) { const p = await this.person(x.id); if (!(await this.rolesOf(x.id)).includes('HQ_ADMIN')) out.push(p); }
    return out;
  }
  async detail(u: AuthUser, id: string) {
    const g = await this.G(id); const joined = await this.isMember(g.id, u.id);
    const ms = await this.members(g.id);
    const notes = joined ? await Promise.all((await this.db.select().from(gaadeNotes).where(eq(gaadeNotes.gaadeId, g.id)).orderBy(desc(gaadeNotes.createdAt))).map(async (n) => ({ ...n, session: n.topic, user: await this.person(n.userId) }))) : [];
    const reqs = joined ? (await this.db.select({ id: peerRequests.id }).from(peerRequests).where(eq(peerRequests.gaadeId, g.id))).map((r) => r.id) : [];
    return { ...(await this.card(g, u.id)), members: await Promise.all(ms.map(async (x) => ({ ...(await this.person(x.userId)), rsvp: x.rsvp }))), notes, isHost: g.hostId === u.id, requestIds: reqs };
  }
  async join(u: AuthUser, id: string) {
    const g = await this.G(id); const r = await this.rolesOf(u.id);
    if (g.kind === 'IMAMS' && !r.includes('IMAM')) throw new ForbiddenException(err('forbidden', 'این گعده ویژهٔ امامان است'));
    if (!(await this.isMember(g.id, u.id))) { await this.db.insert(gaadeMembers).values({ gaadeId: g.id, userId: u.id, rsvp: null }); const me = (await this.db.query.users.findFirst({ where: eq(users.id, u.id) }))!; await this.notify.send(g.hostId, { kind: 'GAADE', title: `عضو تازه در «${g.title}»`, body: `${me.firstName} ${me.lastName}`, link: `/gaade/${g.id}` }); }
    return { ok: true };
  }
  async leave(u: AuthUser, id: string) { const g = await this.G(id); if (g.hostId === u.id) throw new BadRequestException(err('host', 'میزبان نمی‌تواند گعده را ترک کند؛ اول میزبانی را به عضو دیگری بسپارید')); await this.db.delete(gaadeMembers).where(and(eq(gaadeMembers.gaadeId, g.id), eq(gaadeMembers.userId, u.id))); return { ok: true }; }
  async rsvp(u: AuthUser, id: string, d: RsvpDto) { if (!(await this.isMember(id, u.id))) throw new ForbiddenException(err('forbidden', 'عضو این گعده نیستید')); await this.db.update(gaadeMembers).set({ rsvp: d.rsvp }).where(and(eq(gaadeMembers.gaadeId, id), eq(gaadeMembers.userId, u.id))); return { ok: true }; }
  async setNext(u: AuthUser, id: string, d: NextDto) {
    const g = await this.G(id); if (g.hostId !== u.id) throw new ForbiddenException(err('forbidden', 'فقط میزبان جلسه را تنظیم می‌کند'));
    if (new Date(d.at).getTime() < Date.now() - DAY) throw new BadRequestException(err('past', 'زمان گذشته است. تاریخ را درست کن.'));
    const next = { at: d.at, where: d.where, topic: d.topic.trim() };
    await this.db.update(gaade).set({ next }).where(eq(gaade.id, g.id));
    await this.db.update(gaadeMembers).set({ rsvp: null }).where(and(eq(gaadeMembers.gaadeId, g.id), sql`${gaadeMembers.userId} <> ${u.id}`));
    await this.db.update(gaadeMembers).set({ rsvp: 'YES' }).where(and(eq(gaadeMembers.gaadeId, g.id), eq(gaadeMembers.userId, u.id)));
    const ms = (await this.members(g.id)).filter((m) => m.userId !== u.id).map((m) => m.userId);
    if (ms.length) await this.notify.send(ms, { kind: 'GAADE', title: `جلسهٔ تازهٔ «${g.title}»`, body: next.topic, link: `/gaade/${g.id}` });
    return next;
  }
  async addNote(u: AuthUser, id: string, d: NoteDto) { const g = await this.G(id); if (!(await this.isMember(g.id, u.id))) throw new ForbiddenException(err('forbidden', 'عضو این گعده نیستید')); await this.db.insert(gaadeNotes).values({ gaadeId: g.id, userId: u.id, topic: g.next?.topic ?? null, experience: d.experience.trim(), knot: d.knot?.trim() || null, promise: d.promise.trim() }); return { ok: true }; }
  async invite(u: AuthUser, id: string, d: InviteDto) { const g = await this.G(id); if (g.hostId !== u.id) throw new ForbiddenException(err('forbidden', 'فقط میزبان دعوت می‌کند')); for (const x of d.userIds) { if (!(await this.isMember(g.id, x))) { await this.db.insert(gaadeMembers).values({ gaadeId: g.id, userId: x, rsvp: null }).onConflictDoNothing(); await this.notify.send(x, { kind: 'GAADE', title: `دعوت به «${g.title}»`, link: `/gaade/${g.id}` }); } } return { ok: true }; }

  // ── پرسش از همتایان
  private async voteCount(kind: string, id: string, uid: string) { const vs = await this.db.select({ userId: votes.userId }).from(votes).where(and(eq(votes.kind, kind), eq(votes.targetId, id))); return { votes: vs.length, voted: vs.some((v) => v.userId === uid) }; }
  private async qView(q: typeof questions.$inferSelect, uid: string) {
    const as = await this.db.select({ best: answers.best }).from(answers).where(eq(answers.questionId, q.id));
    const l = q.lessonId ? await this.db.query.lessons.findFirst({ where: eq(lessons.id, q.lessonId), columns: { title: true } }) : null;
    return { id: q.id, title: q.title, body: q.body, createdAt: q.createdAt, author: await this.person(q.userId), courseId: q.courseId, lessonId: q.lessonId, lessonTitle: l?.title ?? null, ...(await this.voteCount('Q', q.id, uid)), answerCount: as.length, hasBest: as.some((a) => a.best), mine: q.userId === uid };
  }
  async listQuestions(u: AuthUser, lesson?: string, q?: string) {
    const rows = await this.db.select().from(questions).where(and(lesson ? eq(questions.lessonId, lesson) : sql`true`, q?.trim() ? sql`(${questions.title} || ' ' || ${questions.body}) ilike ${'%' + q.trim() + '%'}` : sql`true`)).orderBy(desc(questions.createdAt)).limit(100);
    const out = await Promise.all(rows.map((x) => this.qView(x, u.id)));
    return out.sort((a, b) => b.votes - a.votes || (b.createdAt > a.createdAt ? 1 : -1));
  }
  async ask(u: AuthUser, d: QuestionDto) {
    const l = d.lessonId ? await this.db.query.lessons.findFirst({ where: eq(lessons.id, d.lessonId) }) : null;
    const m = l ? await this.db.query.modules.findFirst({ where: eq(modules.id, l.moduleId) }) : null;
    const [q] = await this.db.insert(questions).values({ userId: u.id, courseId: m?.courseId ?? null, lessonId: d.lessonId ?? null, title: d.title.trim().slice(0, 160), body: (d.body ?? '').trim() }).returning();
    return { id: q.id };
  }
  async question(u: AuthUser, id: string) {
    const q = await this.db.query.questions.findFirst({ where: eq(questions.id, id) }); if (!q) throw new NotFoundException(err('not_found', 'پرسش پیدا نشد'));
    const as = await Promise.all((await this.db.select().from(answers).where(eq(answers.questionId, q.id))).map(async (a) => ({ id: a.id, body: a.body, best: a.best, createdAt: a.createdAt, author: await this.person(a.userId), ...(await this.voteCount('A', a.id, u.id)), mine: a.userId === u.id })));
    as.sort((a, b) => Number(b.best) - Number(a.best) || b.votes - a.votes);
    return { ...(await this.qView(q, u.id)), answers: as };
  }
  async answer(u: AuthUser, id: string, d: AnswerDto) { const q = await this.db.query.questions.findFirst({ where: eq(questions.id, id) }); if (!q) throw new NotFoundException(err('not_found', 'پرسش پیدا نشد')); await this.db.insert(answers).values({ questionId: q.id, userId: u.id, body: d.body.trim() }); if (q.userId !== u.id) await this.notify.send(q.userId, { kind: 'QUESTION', title: 'پاسخ تازه به پرسش شما', body: q.title, link: `/questions/${q.id}` }); return { ok: true }; }
  async toggleVote(u: AuthUser, kind: string, id: string) { const ex = await this.db.query.votes.findFirst({ where: and(eq(votes.kind, kind), eq(votes.targetId, id), eq(votes.userId, u.id)) }); if (ex) await this.db.delete(votes).where(and(eq(votes.kind, kind), eq(votes.targetId, id), eq(votes.userId, u.id))); else await this.db.insert(votes).values({ kind, targetId: id, userId: u.id }); return { ok: true }; }
  async best(u: AuthUser, id: string) {
    const a = await this.db.query.answers.findFirst({ where: eq(answers.id, id) }); const q = a ? await this.db.query.questions.findFirst({ where: eq(questions.id, a.questionId) }) : null;
    if (!a || !q) throw new NotFoundException(err('not_found', 'پاسخ پیدا نشد')); if (q.userId !== u.id) throw new ForbiddenException(err('forbidden', 'فقط پرسشگر پاسخ برگزیده را انتخاب می‌کند'));
    await this.db.update(answers).set({ best: false }).where(eq(answers.questionId, q.id)); await this.db.update(answers).set({ best: true }).where(eq(answers.id, a.id));
    if (a.userId !== u.id) await this.notify.send(a.userId, { kind: 'QUESTION', title: 'پاسخ شما برگزیده شد', body: q.title, link: `/questions/${q.id}` });
    return { ok: true };
  }

  // ── نظر همتا
  async peerRequestsList(u: AuthUser) {
    const gs = (await this.db.select({ id: gaadeMembers.gaadeId }).from(gaadeMembers).where(eq(gaadeMembers.userId, u.id))).map((r) => r.id);
    if (!gs.length) return [];
    const rows = await this.db.select().from(peerRequests).where(inArray(peerRequests.gaadeId, gs)).orderBy(desc(peerRequests.createdAt));
    return Promise.all(rows.map(async (r) => ({ id: r.id, title: r.title, body: r.body, createdAt: r.createdAt, author: await this.person(r.userId), gaade: (await this.db.query.gaade.findFirst({ where: eq(gaade.id, r.gaadeId), columns: { title: true } }))?.title ?? '', mine: r.userId === u.id,
      replies: await Promise.all((await this.db.select().from(peerReplies).where(eq(peerReplies.requestId, r.id))).map(async (x) => ({ id: x.id, body: x.body, createdAt: x.createdAt, author: await this.person(x.userId) }))) })));
  }
  async peerRequest(u: AuthUser, d: PeerReqDto) {
    if (!(await this.isMember(d.gaadeId, u.id))) throw new ForbiddenException(err('forbidden', 'عضو این گعده نیستید'));
    const [r] = await this.db.insert(peerRequests).values({ userId: u.id, gaadeId: d.gaadeId, title: d.title.trim(), body: d.body.trim() }).returning();
    const ms = (await this.members(d.gaadeId)).filter((m) => m.userId !== u.id).map((m) => m.userId);
    if (ms.length) await this.notify.send(ms, { kind: 'PEER', title: 'همتایتان نظر شما را خواسته', body: r.title, link: '/peers?tab=peer' });
    return { id: r.id };
  }
  async peerReply(u: AuthUser, id: string, d: AnswerDto) { const r = await this.db.query.peerRequests.findFirst({ where: eq(peerRequests.id, id) }); if (!r || !(await this.isMember(r.gaadeId, u.id))) throw new NotFoundException(err('not_found', 'درخواست پیدا نشد')); await this.db.insert(peerReplies).values({ requestId: r.id, userId: u.id, body: d.body.trim() }); if (r.userId !== u.id) await this.notify.send(r.userId, { kind: 'PEER', title: 'همتایتان نظر داد', body: r.title, link: '/peers?tab=peer' }); return { ok: true }; }

  // ── فرایند تعیّن امامت
  private async im(uid: string) { let x = await this.db.query.imamat.findFirst({ where: eq(imamat.userId, uid) }); if (!x) { [x] = await this.db.insert(imamat).values({ userId: uid }).returning(); } return x; }
  async view(uid: string) {
    const x = await this.im(uid); const r = await this.rolesOf(uid);
    const as = await this.db.select().from(imamatAssessments).where(eq(imamatAssessments.userId, uid)).orderBy(desc(imamatAssessments.createdAt));
    return { isImam: r.includes('IMAM'), level: x.level, spiral: x.spiral, petals: Object.fromEntries(PETAL_IDS.map((p) => [p, x.petals[p] ?? 0])), assessments: await Promise.all(as.map(async (a) => ({ id: a.id, level: a.level, spiral: a.spiral, note: a.note, createdAt: a.createdAt, by: await this.person(a.byId) }))) };
  }
  async rahyarView(u: AuthUser, learnerId: string) { if (!(u.roles.includes('HQ_ADMIN') || u.roles.includes('HQ_OPERATOR') || await this.rahyar.canSeeLearner(u.id, learnerId, u.roles))) throw new ForbiddenException(err('forbidden', 'این کنشگر در دامنهٔ شما نیست')); return this.view(learnerId); }
  async assess(u: AuthUser, learnerId: string, d: AssessDto) {
    if (!(u.roles.includes('HQ_ADMIN') || await this.rahyar.canSeeLearner(u.id, learnerId, u.roles))) throw new ForbiddenException(err('forbidden', 'این کنشگر در دامنهٔ شما نیست'));
    if (!(await this.rolesOf(learnerId)).includes('IMAM')) throw new BadRequestException(err('not_imam', 'ارزیابی سطح فقط برای امامان است'));
    const x = await this.im(learnerId);
    const petals = { ...x.petals }; if (d.petals) for (const p of PETAL_IDS) { const v = d.petals[p]; if (v != null) petals[p] = Math.min(4, Math.max(0, Number(v) || 0)); }
    const spiral = Math.min(5, Math.max(1, d.spiral ?? x.spiral));
    await this.db.update(imamat).set({ level: d.level, spiral, petals }).where(eq(imamat.userId, learnerId));
    await this.db.insert(imamatAssessments).values({ userId: learnerId, byId: u.id, level: d.level, spiral, note: d.note.trim() });
    await this.notify.send(learnerId, { kind: 'IMAMAT', title: 'ارزیابی میدانی راهیار ثبت شد', body: LEVEL_FA[d.level - 1], link: '/imamat' });
    await this.db.insert(auditLogs).values({ actorId: u.id, action: 'imamat.assess', target: learnerId } as any);
    return this.view(learnerId);
  }
}

@Controller()
export class PeersController {
  constructor(private readonly s: PeersService) {}
  @Get('gaade') list(@CurrentUser() u: AuthUser) { return this.s.list(u); }
  @Post('gaade') create(@CurrentUser() u: AuthUser, @Body() d: GaadeDto) { return this.s.create(u, d); }
  @Get('gaade/candidates') candidates(@CurrentUser() u: AuthUser) { return this.s.candidates(u); }
  @Get('gaade/:id') detail(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.s.detail(u, id); }
  @Post('gaade/:id/join') @HttpCode(200) join(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.s.join(u, id); }
  @Post('gaade/:id/leave') @HttpCode(200) leave(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.s.leave(u, id); }
  @Post('gaade/:id/rsvp') @HttpCode(200) rsvp(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() d: RsvpDto) { return this.s.rsvp(u, id, d); }
  @Put('gaade/:id/next') next(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() d: NextDto) { return this.s.setNext(u, id, d); }
  @Post('gaade/:id/notes') @HttpCode(200) note(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() d: NoteDto) { return this.s.addNote(u, id, d); }
  @Post('gaade/:id/invite') @HttpCode(200) invite(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() d: InviteDto) { return this.s.invite(u, id, d); }
  @Get('questions') questions(@CurrentUser() u: AuthUser, @Query('lesson') lesson?: string, @Query('q') q?: string) { return this.s.listQuestions(u, lesson, q); }
  @Post('questions') ask(@CurrentUser() u: AuthUser, @Body() d: QuestionDto) { return this.s.ask(u, d); }
  @Get('questions/:id') question(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.s.question(u, id); }
  @Post('questions/:id/answers') @HttpCode(200) answer(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() d: AnswerDto) { return this.s.answer(u, id, d); }
  @Post('questions/:id/vote') @HttpCode(200) voteQ(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.s.toggleVote(u, 'Q', id); }
  @Post('answers/:id/vote') @HttpCode(200) voteA(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.s.toggleVote(u, 'A', id); }
  @Post('answers/:id/best') @HttpCode(200) best(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.s.best(u, id); }
  @Get('peer-requests') peerRequests(@CurrentUser() u: AuthUser) { return this.s.peerRequestsList(u); }
  @Post('peer-requests') peerRequest(@CurrentUser() u: AuthUser, @Body() d: PeerReqDto) { return this.s.peerRequest(u, d); }
  @Post('peer-requests/:id/replies') @HttpCode(200) peerReply(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() d: AnswerDto) { return this.s.peerReply(u, id, d); }
  @Get('me/imamat') myImamat(@CurrentUser() u: AuthUser) { return this.s.view(u.id); }
  @Get('rahyar/learners/:id/imamat') @Roles('RAHYAR', 'HQ_ADMIN', 'HQ_OPERATOR') learnerImamat(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.s.rahyarView(u, id); }
  @Post('rahyar/learners/:id/assess') @HttpCode(200) @Roles('RAHYAR', 'HQ_ADMIN') assess(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() d: AssessDto) { return this.s.assess(u, id, d); }
}
