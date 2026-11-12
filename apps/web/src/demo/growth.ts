/**
 * نسخهٔ نمایشی — راهبردهای یادگیری: رشد، مهارت، ریتم هفتگی، مرور با فاصله، پرسش وسط درس،
 * دورهٔ گروهی هم‌زمان و داستان میدان. همان شکل پاسخ‌های apps/api (growth.ts و cohorts.ts).
 */
type Any = any;
const DAY = 864e5;
const TEHRAN = 3.5 * 3600_000;
const STAGES = [
  { key: 'SEED', title: 'دانه', courses: 0, missions: 0 },
  { key: 'SPROUT', title: 'جوانه', courses: 1, missions: 0 },
  { key: 'SAPLING', title: 'نهال', courses: 3, missions: 1 },
  { key: 'TREE', title: 'درخت', courses: 6, missions: 3 },
];
export function weekStart(at = new Date()) {
  const t = new Date(at.getTime() + TEHRAN);
  const sinceSat = (t.getUTCDay() + 1) % 7;
  return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate() - sinceSat) - TEHRAN);
}
const iso = (ms: number) => new Date(ms).toISOString();

/* ───────── دادهٔ نمونه ───────── */
export function seedGrowth(db: Any) {
  Object.assign(db, { weeklyGoals: [], reviews: [], cohorts: [], cohortMembers: [] });
  const course = (slug: string) => db.courses.find((c: Any) => c.slug === slug);
  const lessonsOf = (cid: string) => db.modules.filter((m: Any) => m.courseId === cid).sort((a: Any, b: Any) => a.order - b.order)
    .flatMap((m: Any) => db.lessons.filter((l: Any) => l.moduleId === m.id).sort((a: Any, b: Any) => a.order - b.order));

  // مهارت‌ها و پرسش‌های کوتاه دورهٔ «همراهی نوجوانان در مسجد»
  const nj = course('nojavan-1');
  if (nj) {
    nj.skills = [{ id: 'needs01', title: 'شناختن نیاز نوجوان' }, { id: 'talk01', title: 'شروع گفت‌وگو' }, { id: 'role01', title: 'سپردن مسئولیت کوچک' }];
    const ls = lessonsOf(nj.id);
    const by = (t: string) => ls.find((l: Any) => l.title.includes(t));
    const set = (l: Any, ids: string[]) => { if (l) l.skillIds = ids; };
    set(by('دنبال چه'), ['needs01']); set(by('گفت‌وگوی اول'), ['talk01']); set(by('مسئولیت کوچک'), ['role01']);
    set(ls.find((l: Any) => l.type === 'WORKSHEET'), ['needs01', 'role01']); set(ls.find((l: Any) => l.type === 'MISSION'), ['talk01']);
    const l1 = by('دنبال چه');
    if (l1) l1.content.checks = [{ id: 'c1', text: 'وقتی اسم نوجوانی را در مسجد صدا می‌زنید، به کدام نیازش پاسخ داده‌اید؟', options: [{ id: 'a', text: 'دیده شدن' }, { id: 'b', text: 'سرگرمی' }, { id: 'c', text: 'جایزه' }], correct: ['a'], explain: 'صدا زدن با اسم یعنی «تو را می‌بینم»؛ ساده‌ترین پاسخ به نیاز دیده شدن.' }];
    const l2 = by('گفت‌وگوی اول');
    if (l2) l2.content.checks = [{ id: 'c1', text: 'گفت‌وگوی اول بهتر است از کجا شروع شود؟', options: [{ id: 'a', text: 'از یک نصیحت کوتاه' }, { id: 'b', text: 'از چیزی که برای خودش مهم است' }, { id: 'c', text: 'از برنامه‌های مسجد' }], correct: ['b'], explain: 'از دنیای خودش شروع کنید: مدرسه، ورزش، دوستان. نصیحت بعداً جا دارد، اگر لازم شد.' }];
  }

  // زینب: دو درس این هفته، هدف ۳، یک دورهٔ تمام‌شده با مرور آماده
  const z = 'sample3';
  const ws = weekStart().getTime();
  if (nj) {
    const ls = lessonsOf(nj.id);
    [[0, ws + 0.4 * DAY], [1, ws + 1.5 * DAY], [2, Date.now() - 2 * 3600_000]].forEach(([i, at]) => {
      const l = ls[i]; if (!l) return;
      if (!db.progress.some((p: Any) => p.userId === z && p.lessonId === l.id)) db.progress.push({ userId: z, lessonId: l.id, positionSec: 0, completedAt: iso(Math.min(at, Date.now() - 60_000)), updatedAt: iso(at), data: null });
    });
    const e = db.enrollments.find((x: Any) => x.userId === z && x.courseId === nj.id); if (e) e.lastLessonId = ls[3]?.id ?? null;
  }
  db.weeklyGoals.push({ userId: z, lessonsPerWeek: 3 });
  // هفته‌های گذشته (برای نمودار هشت هفته)
  const hist = [2, 0, 3, 4, 1, 3, 3];
  // درس‌های هفته‌های پیش (شناسهٔ ساختگی؛ فقط برای نمودار ریتم)
  hist.forEach((n, w) => { for (let j = 0; j < n; j++) db.progress.push({ userId: z, lessonId: `hist-${w}-${j}`, positionSec: 0, completedAt: iso(ws - (7 - w) * 7 * DAY + (j + 1) * DAY), updatedAt: iso(ws - (7 - w) * 7 * DAY), data: null }); });

  // دورهٔ تمام‌شده با مرور آماده
  const done = db.courses.find((c: Any) => c.status === 'PUBLISHED' && c.slug !== 'nojavan-1' && lessonsOf(c.id).some((l: Any) => l.type === 'QUIZ' && (l.content?.questions?.length ?? 0) >= 2));
  if (done) {
    const ls = lessonsOf(done.id);
    db.enrollments.push({ userId: z, courseId: done.id, courseVersion: 1, enrolledAt: iso(Date.now() - 20 * DAY), completedAt: iso(Date.now() - 4 * DAY), archivedAt: null, lastLessonId: ls[ls.length - 1]?.id ?? null });
    ls.forEach((l: Any) => db.progress.push({ userId: z, lessonId: l.id, positionSec: 0, completedAt: iso(Date.now() - 4 * DAY - 3600_000), updatedAt: iso(Date.now() - 4 * DAY), data: null }));
    const pool = reviewPool(ls);
    db.reviews.push({ id: 'rv-demo1', userId: z, courseId: done.id, round: 1, dueAt: iso(Date.now() - 3600_000), questionIds: pool.slice(0, 3).map((q) => q.id), score: null, doneAt: null, notifiedAt: iso(Date.now() - 3600_000), createdAt: iso(Date.now() - 4 * DAY) });
    db.reviews.push({ id: 'rv-demo2', userId: z, courseId: done.id, round: 2, dueAt: iso(Date.now() + 6 * DAY), questionIds: pool.slice(3, 6).map((q) => q.id), score: null, doneAt: null, notifiedAt: null, createdAt: iso(Date.now() - 4 * DAY) });
    db.notifs.push({ id: 'n-rv1', userId: z, kind: 'REVIEW', title: `وقت مرور «${done.title}» است`, body: 'سه پرسش کوتاه، کمتر از دو دقیقه. همین مرور کوتاه است که آموخته‌ها را ماندگار می‌کند.', link: '/review/rv-demo1', readAt: null, createdAt: iso(Date.now() - 3600_000) });
  }

  // دورهٔ گروهی هستهٔ ریحانه (مسئول: زینب) روی مسیر نوجوانان
  const path = db.paths.find((p: Any) => p.slug === 'nojavanan');
  if (path) {
    db.cohorts.push({ id: 'coh-rey', pathId: path.id, coreId: 'core-rey', startsAt: iso(weekStart().getTime() - 2 * DAY), weeksPerStation: 1, note: 'جمعه‌ها بعد از نماز مغرب، ده دقیقه دربارهٔ ایستگاه هفته حرف می‌زنیم.', createdById: z, cancelledAt: null, createdAt: iso(Date.now() - 9 * DAY) });
    db.cohortMembers.push({ cohortId: 'coh-rey', userId: z, joinedAt: iso(Date.now() - 9 * DAY) });
  }

  // داستان میدان: دو گزارش نمونهٔ منتشرشده با اجازهٔ کنشگر
  const ml = db.lessons.find((l: Any) => l.type === 'MISSION');
  if (ml && db.samples) {
    db.samples.push({ learnerId: 'sample0', lessonId: ml.id, proposedById: 'p-cty', status: 'PUBLISHED', named: false, authorLabel: 'یک کنشگر از کاشان', createdAt: iso(Date.now() - 12 * DAY), publishedAt: iso(Date.now() - 10 * DAY),
      text: 'بعد از نماز عشا از سه نوجوان خواستم صدای مسجد را در مراسم شب جمعه به عهده بگیرند. اول خجالت می‌کشیدند، ولی آخر شب خودشان پرسیدند هفتهٔ بعد هم هستند یا نه.' });
    db.samples.push({ learnerId: 'sample2', lessonId: ml.id, proposedById: 'p-cty', status: 'PUBLISHED', named: true, authorLabel: 'حسین رستمی', createdAt: iso(Date.now() - 6 * DAY), publishedAt: iso(Date.now() - 5 * DAY),
      text: 'به‌جای اینکه برای نوجوان‌ها برنامه بچینیم، از خودشان پرسیدیم چه می‌خواهند. فهرستشان را روی تابلوی مسجد زدیم و اولین برنامه را خودشان اجرا کردند.' });
  }
}

/** همان reviewPool سرور: پرسش‌های آزمون دوره، آزمون پایانی اول */
function reviewPool(ls: Any[]) {
  const quizzes = ls.filter((l) => l.type === 'QUIZ').sort((a, b) => Number(b.isFinalQuiz) - Number(a.isFinalQuiz));
  const out: Any[] = []; const seen = new Set<string>();
  for (const l of quizzes) for (const q of l.content?.questions ?? []) { const id = `${l.id}:${q.id}`; if (!seen.has(id)) { seen.add(id); out.push({ ...q, id }); } }
  return out;
}

export function registerGrowth(X: Any) {
  const { on, wrap, E, me, rolesOf, rid, now, notify, allLessons, enr, prog } = X;
  const DB = () => X.db;
  const C = (id: string) => DB().courses.find((c: Any) => c.id === id);

  // ── پیش‌نیاز: مهارت‌ها در صفحهٔ دوره، و پرسش‌های وسط درس بی‌پاسخ
  const skillStates = (c: Any, uid?: string) => {
    const ls = allLessons(c.id);
    return (c.skills ?? []).map((s: Any) => {
      const mine = ls.filter((l: Any) => (l.skillIds ?? []).includes(s.id));
      const d = uid ? mine.filter((l: Any) => prog(uid, l.id)?.completedAt).length : 0;
      return { id: s.id, title: s.title, lessonCount: mine.length, doneCount: d, mastered: mine.length > 0 && d === mine.length };
    });
  };
  wrap('GET', '/courses/([^/]+)', (orig: Any) => (m: Any, b: Any, q: Any) => {
    const r = orig(m, b, q); const c = DB().courses.find((x: Any) => x.id === r.id); const u = DB().users.find((x: Any) => x.id === DB().session);
    const ids = new Map(allLessons(c.id).map((l: Any) => [l.id, l.skillIds ?? []]));
    return { ...r, skills: skillStates(c, u?.id), modules: r.modules.map((md: Any) => ({ ...md, lessons: md.lessons.map((l: Any) => ({ ...l, skillIds: ids.get(l.id) ?? [] })) })) };
  });
  wrap('GET', '/lessons/([^/]+)', (orig: Any) => (m: Any, b: Any, q: Any) => {
    const r = orig(m, b, q);
    if (Array.isArray(r.content?.checks)) r.content = { ...r.content, checks: r.content.checks.map(({ correct: _c, explain: _e, ...x }: Any) => x) };
    return r;
  });
  on('POST', '/lessons/([^/]+)/check', (m: Any, b: Any) => {
    const u = me(); const l = DB().lessons.find((x: Any) => x.id === m[1]); if (!l) throw E(404, 'no_lesson', 'این درس پیدا نشد');
    const md = DB().modules.find((x: Any) => x.id === l.moduleId); if (!enr(u.id, md.courseId)) throw E(403, 'not_enrolled', 'اول در دوره ثبت‌نام کنید');
    const qq = (l.content?.checks ?? []).find((x: Any) => x.id === b.checkId);
    if (!qq) throw E(404, 'no_check', 'این پرسش در درس نیست؛ صفحه را تازه کنید');
    const g = [...new Set<string>(b.answer ?? [])].sort(); const w = [...qq.correct].sort();
    return { ok: g.length === w.length && g.every((x, i) => x === w[i]), correct: qq.correct, explain: qq.explain ?? '' };
  });

  // ── مرور با فاصله: پس از پایان دوره، دو مرور در روز ۳ و ۱۰
  X.onCourseComplete = (uid: string, cid: string) => {
    const pool = reviewPool(allLessons(cid)); if (!pool.length) return;
    const ids = pool.map((q) => q.id).sort(() => Math.random() - 0.5);
    [[1, 3], [2, 10]].forEach(([round, days], i) => {
      if (DB().reviews.some((r: Any) => r.userId === uid && r.courseId === cid && r.round === round)) return;
      DB().reviews.push({ id: rid(), userId: uid, courseId: cid, round, dueAt: iso(Date.now() + days * DAY), questionIds: ids.length >= 6 ? ids.slice(i * 3, i * 3 + 3) : ids.slice(0, 3), score: null, doneAt: null, notifiedAt: null, createdAt: now() });
    });
  };
  on('GET', '/me/reviews', () => {
    const u = me(); const t = Date.now();
    const rows = DB().reviews.filter((r: Any) => r.userId === u.id && !r.doneAt).sort((a: Any, b: Any) => a.dueAt.localeCompare(b.dueAt));
    const c = (r: Any) => { const x = C(r.courseId); return { title: x?.title, slug: x?.slug }; };
    const due = rows.filter((r: Any) => +new Date(r.dueAt) <= t); const up = rows.filter((r: Any) => +new Date(r.dueAt) > t);
    return { due: due.map((r: Any) => ({ id: r.id, round: r.round, dueAt: r.dueAt, questionCount: r.questionIds.length, course: c(r) })), next: up[0] ? { dueAt: up[0].dueAt, course: c(up[0]) } : null };
  });
  const own = (id: string) => {
    const u = me(); const r = DB().reviews.find((x: Any) => x.id === id);
    if (!r || r.userId !== u.id) throw E(404, 'no_review', 'این مرور پیدا نشد');
    const pool = reviewPool(allLessons(r.courseId));
    return { r, c: C(r.courseId), qs: r.questionIds.map((q: string) => pool.find((p) => p.id === q)).filter(Boolean) };
  };
  on('GET', '/reviews/([^/]+)', (m: Any) => {
    const { r, c, qs } = own(m[1]);
    return { id: r.id, round: r.round, dueAt: r.dueAt, doneAt: r.doneAt, score: r.score, open: +new Date(r.dueAt) <= Date.now() && !r.doneAt, course: { title: c.title, slug: c.slug },
      questions: qs.map(({ correct: _c, explain: _e, ...q }: Any) => q) };
  });
  on('POST', '/reviews/([^/]+)', (m: Any, b: Any) => {
    const { r, qs } = own(m[1]);
    if (r.doneAt) throw E(400, 'review_done', 'این مرور را قبلاً انجام داده‌اید');
    if (+new Date(r.dueAt) > Date.now()) throw E(403, 'review_early', 'وقت این مرور هنوز نرسیده است');
    const results = qs.map((q: Any) => { const g = [...new Set<string>(b.answers?.[q.id] ?? [])].sort(); const w = [...q.correct].sort(); return { id: q.id, ok: g.length === w.length && g.every((x, i) => x === w[i]), correct: q.correct, explain: q.explain ?? '' }; });
    const score = qs.length ? Math.round((results.filter((x: Any) => x.ok).length / qs.length) * 100) : null;
    r.doneAt = now(); r.score = score;
    DB().notifs.filter((n: Any) => n.link === `/review/${r.id}`).forEach((n: Any) => (n.readAt ??= now()));
    return { score, results };
  });

  // ── رشد و مهارت
  const mySkills = (uid: string) => DB().enrollments.filter((e: Any) => e.userId === uid).map((e: Any) => C(e.courseId)).filter((c: Any) => c?.skills?.length)
    .flatMap((c: Any) => skillStates(c, uid).map((s: Any) => ({ ...s, course: { title: c.title, slug: c.slug } })));
  on('GET', '/me/skills', () => mySkills(me().id));
  on('GET', '/me/growth', () => {
    const u = me();
    const c = DB().enrollments.filter((e: Any) => e.userId === u.id && e.completedAt).length;
    const mi = DB().progress.filter((p: Any) => p.userId === u.id && p.completedAt && DB().lessons.find((l: Any) => l.id === p.lessonId)?.type === 'MISSION').length;
    const k = DB().certificates.filter((x: Any) => x.userId === u.id && !x.revokedAt).length;
    let i = 0; STAGES.forEach((s, idx) => { if (c >= s.courses && mi >= s.missions) i = idx; });
    const n = STAGES[i + 1]; const sk = mySkills(u.id);
    return { stage: STAGES[i].key, stageTitle: STAGES[i].title, index: i, coursesDone: c, missionsDone: mi, certificates: k,
      next: n ? { key: n.key, title: n.title, coursesLeft: Math.max(0, n.courses - c), missionsLeft: Math.max(0, n.missions - mi) } : null,
      stages: STAGES, skills: { mastered: sk.filter((s: Any) => s.mastered).length, total: sk.length, list: sk.filter((s: Any) => s.mastered).slice(0, 24) } };
  });

  // ── ریتم هفتگی
  const rhythm = (uid: string) => {
    const g = DB().weeklyGoals.find((x: Any) => x.userId === uid);
    const start = weekStart().getTime();
    const times = DB().progress.filter((p: Any) => p.userId === uid && p.completedAt && +new Date(p.completedAt) >= start - 49 * DAY).map((p: Any) => +new Date(p.completedAt));
    const days = Array.from({ length: 7 }, (_, d) => times.filter((t: number) => t >= start + d * DAY && t < start + (d + 1) * DAY).length);
    const goal = g?.lessonsPerWeek ?? null;
    const weeks = Array.from({ length: 8 }, (_, w) => { const s = start - (7 - w) * 7 * DAY; const n = times.filter((t: number) => t >= s && t < s + 7 * DAY).length; return { weekStart: iso(s), count: n, met: goal != null && n >= goal }; });
    return { goal, weekStart: iso(start), doneThisWeek: days.reduce((a, b) => a + b, 0), days, today: Math.min(6, Math.floor((Date.now() - start) / DAY)), weeks };
  };
  on('GET', '/me/rhythm', () => rhythm(me().id));
  on('PUT', '/me/rhythm', (_m: Any, b: Any) => {
    const u = me(); const n = b.lessonsPerWeek;
    if (n !== null && !(Number.isInteger(n) && n >= 1 && n <= 21)) throw E(400, 'invalid', 'هدف هفتگی باید بین ۱ تا ۲۱ درس باشد');
    DB().weeklyGoals = DB().weeklyGoals.filter((x: Any) => x.userId !== u.id);
    if (n !== null) DB().weeklyGoals.push({ userId: u.id, lessonsPerWeek: n });
    return rhythm(u.id);
  });

  // ── داستان میدان
  on('GET', '/stories', () => DB().samples.filter((s: Any) => s.status === 'PUBLISHED' && s.text).sort((a: Any, b: Any) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '')).slice(0, 6).map((s: Any) => {
    const l = DB().lessons.find((x: Any) => x.id === s.lessonId); const md = DB().modules.find((x: Any) => x.id === l?.moduleId); const c = C(md?.courseId);
    return { text: s.text, authorLabel: s.authorLabel ?? 'یک کنشگر', publishedAt: s.publishedAt, mission: { id: l?.id, title: l?.title }, course: { title: c?.title, slug: c?.slug } };
  }));

  // ── دورهٔ گروهی هم‌زمان
  const core = (id: string) => { const c = DB().cores.find((x: Any) => x.id === id); if (!c) throw E(404, 'no_core', 'هسته پیدا نشد'); return c; };
  const people = (c: Any) => [...new Set([...DB().coreMembers.filter((x: Any) => x.coreId === c.id).map((x: Any) => x.userId), ...(c.leaderId ? [c.leaderId] : [])])] as string[];
  const access = (u: Any, c: Any) => {
    const mq = DB().mosques.find((m: Any) => m.id === c.mosqueId); const r = rolesOf(u.id);
    const canManage = c.leaderId === u.id || mq?.imamId === u.id || r.includes('HQ_ADMIN') || r.includes('HQ_OPERATOR') || r.includes('RAHYAR');
    return { member: people(c).includes(u.id), canManage };
  };
  const pathCourses = (pid: string) => DB().pathItems.filter((i: Any) => i.pathId === pid).sort((a: Any, b: Any) => a.order - b.order).map((i: Any) => C(i.courseId)).filter((c: Any) => c?.status === 'PUBLISHED');
  const detail = (u: Any, id: string) => {
    const h = DB().cohorts.find((x: Any) => x.id === id); if (!h) throw E(404, 'no_cohort', 'این دورهٔ گروهی پیدا نشد');
    const c = core(h.coreId); const a = access(u, c);
    const joined = DB().cohortMembers.some((x: Any) => x.cohortId === id && x.userId === u.id);
    if (!a.member && !a.canManage && !joined) throw E(403, 'forbidden', 'این دورهٔ گروهی برای هستهٔ دیگری است');
    const p = DB().paths.find((x: Any) => x.id === h.pathId); const cs = pathCourses(p.id);
    const mids = DB().cohortMembers.filter((x: Any) => x.cohortId === id).map((x: Any) => x.userId);
    const span = h.weeksPerStation * 7 * DAY; const s0 = +new Date(h.startsAt); const t = Date.now();
    const cur = t < s0 ? -1 : Math.min(cs.length - 1, Math.floor((t - s0) / span)); const ends = s0 + cs.length * span;
    return { id: h.id, startsAt: h.startsAt, endsAt: iso(ends), weeksPerStation: h.weeksPerStation, note: h.note, cancelled: !!h.cancelledAt,
      path: { slug: p.slug, title: p.title, color: p.color }, core: { id: c.id, name: c.name },
      joined, canJoin: a.member && !joined && !h.cancelledAt, canManage: a.canManage, memberCount: mids.length, coreSize: people(c).length,
      currentStation: cur, finished: t >= ends,
      stations: cs.map((x: Any, i: number) => ({ course: { slug: x.slug, title: x.title }, opensAt: iso(s0 + i * span),
        doneCount: mids.filter((uid: string) => enr(uid, x.id)?.completedAt).length, doneByMe: !!enr(u.id, x.id)?.completedAt })) };
  };
  on('GET', '/cohorts/mine', () => {
    const u = me();
    const cores = new Set([...DB().coreMembers.filter((x: Any) => x.userId === u.id).map((x: Any) => x.coreId), ...DB().cores.filter((c: Any) => c.leaderId === u.id).map((c: Any) => c.id)]);
    const joined = new Set(DB().cohortMembers.filter((x: Any) => x.userId === u.id).map((x: Any) => x.cohortId));
    return DB().cohorts.filter((h: Any) => !h.cancelledAt && (cores.has(h.coreId) || joined.has(h.id))).map((h: Any) => detail(u, h.id)).sort((a: Any, b: Any) => a.startsAt.localeCompare(b.startsAt));
  });
  on('GET', '/cores/([^/]+)/cohorts', (m: Any) => {
    const u = me(); const c = core(m[1]); const a = access(u, c);
    if (!a.member && !a.canManage) throw E(403, 'forbidden', 'به این هسته دسترسی ندارید');
    return DB().cohorts.filter((h: Any) => h.coreId === c.id && !h.cancelledAt).map((h: Any) => detail(u, h.id));
  });
  on('GET', '/cohorts/([^/]+)', (m: Any) => detail(me(), m[1]));
  on('POST', '/cohorts', (_m: Any, b: Any) => {
    const u = me(); const c = core(b.coreId);
    if (!access(u, c).canManage) throw E(403, 'not_manager', 'دورهٔ گروهی را مسئول هسته، امام مسجد یا راهیار هسته راه می‌اندازد');
    const p = DB().paths.find((x: Any) => x.slug === b.pathSlug && x.published);
    if (!p) throw E(404, 'no_path', 'این مسیر پیدا نشد یا هنوز منتشر نشده است');
    if (!pathCourses(p.id).length) throw E(400, 'empty_path', 'این مسیر هنوز دورهٔ منتشرشده‌ای ندارد');
    const s = +new Date(b.startsAt);
    if (!s) throw E(400, 'invalid', 'تاریخ شروع را انتخاب کنید');
    if (s < Date.now() - DAY) throw E(400, 'past_start', 'تاریخ شروع گذشته است؛ امروز یا روزی در آینده را انتخاب کنید');
    if (s > Date.now() + 90 * DAY) throw E(400, 'far_start', 'تاریخ شروع حداکثر تا سه ماه دیگر می‌تواند باشد');
    if (DB().cohorts.some((h: Any) => h.coreId === c.id && h.pathId === p.id && !h.cancelledAt)) throw E(409, 'cohort_exists', 'این هسته همین حالا این مسیر را گروهی پیش می‌برد');
    const h = { id: rid(), pathId: p.id, coreId: c.id, startsAt: iso(s), weeksPerStation: b.weeksPerStation ?? 1, note: b.note?.trim() || null, createdById: u.id, cancelledAt: null, createdAt: now() };
    DB().cohorts.push(h);
    const ppl = people(c);
    if (ppl.includes(u.id)) DB().cohortMembers.push({ cohortId: h.id, userId: u.id, joinedAt: now() });
    const fd = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day: 'numeric', month: 'long' }).format(new Date(s));
    notify(ppl.filter((x) => x !== u.id), { kind: 'COHORT', title: `هستهٔ «${c.name}» مسیر «${p.title}» را با هم شروع می‌کند`, body: `از ${fd}، ${h.weeksPerStation === 1 ? 'هر هفته یک ایستگاه' : `هر ${h.weeksPerStation} هفته یک ایستگاه`}. اگر همراه می‌شوید، در صفحهٔ دوره «همراه می‌شوم» را بزنید.`, link: `/cohorts/${h.id}` });
    return detail(u, h.id);
  });
  on('POST', '/cohorts/([^/]+)/join', (m: Any) => {
    const u = me(); const h = DB().cohorts.find((x: Any) => x.id === m[1]);
    if (!h || h.cancelledAt) throw E(404, 'no_cohort', 'این دورهٔ گروهی پیدا نشد یا لغو شده است');
    if (!access(u, core(h.coreId)).member) throw E(403, 'not_member', 'این دورهٔ گروهی برای اعضای هسته است');
    if (!DB().cohortMembers.some((x: Any) => x.cohortId === h.id && x.userId === u.id)) DB().cohortMembers.push({ cohortId: h.id, userId: u.id, joinedAt: now() });
    return detail(u, h.id);
  });
  on('POST', '/cohorts/([^/]+)/leave', (m: Any) => { const u = me(); DB().cohortMembers = DB().cohortMembers.filter((x: Any) => !(x.cohortId === m[1] && x.userId === u.id)); return detail(u, m[1]); });
  on('POST', '/cohorts/([^/]+)/cancel', (m: Any) => {
    const u = me(); const h = DB().cohorts.find((x: Any) => x.id === m[1]); if (!h) throw E(404, 'no_cohort', 'این دورهٔ گروهی پیدا نشد');
    const c = core(h.coreId);
    if (!access(u, c).canManage) throw E(403, 'not_manager', 'فقط کسی که دورهٔ گروهی را راه انداخته یا مسئول هسته است می‌تواند لغوش کند');
    if (h.cancelledAt) return { ok: true };
    h.cancelledAt = now();
    const p = DB().paths.find((x: Any) => x.id === h.pathId);
    notify(DB().cohortMembers.filter((x: Any) => x.cohortId === h.id && x.userId !== u.id).map((x: Any) => x.userId), { kind: 'COHORT', title: `دورهٔ گروهی «${p.title}» در هستهٔ «${c.name}» لغو شد`, body: 'پیشرفت خودتان در دوره‌ها سر جایش می‌ماند و می‌توانید مسیر را تنها ادامه دهید.', link: `/paths/${p.slug}` });
    return { ok: true };
  });
}
