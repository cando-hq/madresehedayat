/**
 * نسخهٔ نمایشی — یادگیری از همتا و فرایند تعیّن امامت:
 * گعده، پرسش از همتایان، درخواست نظر همتا روی گزارش، و سطح و شایستگی‌های امام با ارزیابی میدانی راهیار.
 * همان شکل پاسخ‌های apps/api (peers/peers.ts).
 */
type Any = any;
const DAY = 864e5;
const iso = (ms: number) => new Date(ms).toISOString();
export const PETAL_IDS = ['manavi', 'akhlagh', 'ertebat', 'orfi', 'tashkilat', 'modiriat', 'resane', 'sharika', 'bazovan', 'halghe', 'sahne', 'omid', 'tamadon', 'rahkar', 'eghdam', 'ejra', 'arzyabi', 'tabyin', 'khish', 'okhovat', 'vefagh', 'ettehad', 'tavazo', 'fotovat'];

export function seedPeers(db: Any) {
  const t = Date.now();
  const kashan = db.counties.find((c: Any) => c.name === 'کاشان');
  const person = (id: string, mobile: string, firstName: string, lastName: string, gender: string) => db.users.push({ id, mobile, firstName, lastName, gender, countyId: kashan?.id, mosqueId: null, nearMosque: null, nationalId: null, isActive: true, createdAt: iso(t - 90 * DAY) });
  person('p-imam2', '09126666661', 'محمد', 'کریمی', 'MALE'); db.roles.push({ userId: 'p-imam2', role: 'IMAM' });
  person('p-imam3', '09126666662', 'حسین', 'امینی', 'MALE'); db.roles.push({ userId: 'p-imam3', role: 'IMAM' });
  person('p-mrah', '09125555555', 'مهدی', 'محمدی', 'MALE'); db.roles.push({ userId: 'p-mrah', role: 'RAHYAR' });
  db.positions.push({ id: 'm-cty', gender: 'MALE', layer: 'COUNTY', title: `راهیار شهرستانی ${kashan?.name ?? ''}`, parentId: 'm-dep', holderId: 'p-mrah', provinceId: null, countyId: kashan?.id });

  db.imamat = [
    { userId: 'p-imam', level: 3, spiral: 3, petals: { manavi: 3, akhlagh: 3, ertebat: 2, orfi: 3, tashkilat: 2, modiriat: 2, resane: 1, sharika: 2, bazovan: 3, halghe: 2, sahne: 3, omid: 2, tamadon: 1, rahkar: 2, eghdam: 1, ejra: 1, arzyabi: 0, tabyin: 1, khish: 3, okhovat: 3, vefagh: 4, ettehad: 3, tavazo: 4, fotovat: 2 } },
    { userId: 'p-imam2', level: 2, spiral: 2, petals: {} }, { userId: 'p-imam3', level: 1, spiral: 1, petals: {} },
  ];
  db.assessments = [{ id: 'as1', userId: 'p-imam', byId: 'p-mrah', level: 3, spiral: 3, note: 'محله را می‌شناسد و تیم دارد؛ «ارزیابی» و «جهت‌گیری تمدنی» هنوز کم است.', createdAt: iso(t - 40 * DAY) }];

  db.gaade = [
    { id: 'g-imam', title: 'گعدهٔ امامان محلهٔ کاشان', kind: 'IMAMS', hostId: 'p-imam', rhythm: 'ماهی دو بار، پنجشنبه بعد از نماز مغرب', place: 'به نوبت در مساجد', createdAt: iso(t - 60 * DAY),
      next: { at: iso(t + 2 * DAY), where: 'مسجد امام رضا(ع)', topic: 'جذب نوجوانان در زمستان' } },
    { id: 'g-banou', title: 'حلقهٔ مسئولان هستهٔ بانور کاشان', kind: 'CUSTOM', hostId: 'sample3', rhythm: 'هفتگی، دوشنبه صبح', place: 'آنلاین', createdAt: iso(t - 30 * DAY),
      next: { at: iso(t + 4 * DAY), where: 'کلاس آنلاین مدرسه', topic: 'حلقه‌های خانگی' } },
  ];
  db.gaadeMembers = [['g-imam', 'p-imam'], ['g-imam', 'p-imam2'], ['g-imam', 'p-imam3'], ['g-banou', 'sample3'], ['g-banou', 'sample1']].map(([gaadeId, userId]) => ({ gaadeId, userId, rsvp: userId === 'p-imam2' ? 'YES' : null }));
  db.gaadeNotes = [
    { id: 'gn1', gaadeId: 'g-imam', session: 'آبان', topic: 'جلسهٔ ماهانهٔ ارکان', userId: 'p-imam2', experience: 'جلسه را با برگهٔ «چه کسی، چه کاری، تا کی» اداره کردم؛ هیئت امنا همراه شد.', knot: 'خادم مسجد با برنامه‌های شبانه مخالف است.', promise: 'منشور همکاری را تا گعدهٔ بعد بنویسم.', createdAt: iso(t - 12 * DAY) },
    { id: 'gn2', gaadeId: 'g-imam', session: 'آبان', topic: 'جلسهٔ ماهانهٔ ارکان', userId: 'p-imam', experience: 'دفتر نام و احوال به ۳۲ نام رسید.', knot: 'وقت پیگیری غایبان کم است.', promise: 'پیگیری را به یکی از جوان‌ها بسپارم.', createdAt: iso(t - 12 * DAY) },
  ];
  db.questions = [
    { id: 'q1', userId: 'p-imam2', courseId: null, lessonId: null, title: 'هیئت امنای مسجد ما با برنامهٔ نوجوانان مخالف است؛ چه کنم؟', body: 'می‌گویند فرش‌ها خراب می‌شود.', createdAt: iso(t - 3 * DAY) },
    { id: 'q2', userId: 'sample1', courseId: null, lessonId: null, title: 'حلقهٔ خانگی را از چند نفر شروع کنیم؟', body: '', createdAt: iso(t - DAY) },
  ];
  db.answers = [
    { id: 'a1', questionId: 'q1', userId: 'p-imam', body: 'ما یک فرش جدا برای برنامهٔ نوجوانان خریدیم و مسئولش را خود نوجوان‌ها گذاشتیم. مخالفت تمام شد.', best: true, createdAt: iso(t - 2 * DAY) },
    { id: 'a2', questionId: 'q1', userId: 'p-mrah', body: 'یک جلسه با خود هیئت امنا و دو نوجوان بگذارید؛ وقتی چهره‌ها را ببینند، نگرانی کم می‌شود.', best: false, createdAt: iso(t - 2 * DAY) },
  ];
  db.votes = [{ kind: 'Q', targetId: 'q1', userId: 'p-imam3' }, { kind: 'A', targetId: 'a1', userId: 'p-imam3' }, { kind: 'A', targetId: 'a1', userId: 'p-imam2' }];
  db.peerRequests = [{ id: 'pr1', userId: 'sample1', gaadeId: 'g-banou', title: 'گزارش نخستین حلقهٔ خانگی', body: 'با چهار همسایه نخستین حلقه را گذاشتم. موضوع: تربیت فرزند در فضای مجازی. نظرتان دربارهٔ اینکه هفته‌ای یک بار باشد یا دو هفته یک بار؟', createdAt: iso(t - 2 * DAY) }];
  db.peerReplies = [{ id: 'pp1', requestId: 'pr1', userId: 'sample3', body: 'دو هفته یک بار شروع کن تا خسته نشوند؛ بعد اگر خواستند بیشترش کن.', createdAt: iso(t - DAY) }];
}

export function registerPeers(X: Any) {
  const { on, E, me, rolesOf, rid, now, notify, nm, U } = X;
  const DB = () => X.db;
  const name = (id: string) => nm ? nm(id) : (() => { const u = DB().users.find((x: Any) => x.id === id); return u ? `${u.firstName} ${u.lastName}` : ''; })();
  const person = (id: string) => { const u = DB().users.find((x: Any) => x.id === id); const r = rolesOf(id); return { id, name: u ? `${u.firstName} ${u.lastName}` : '', gender: u?.gender ?? null, role: r.includes('RAHYAR') ? 'RAHYAR' : r.includes('IMAM') ? 'IMAM' : null }; };
  const members = (gid: string) => DB().gaadeMembers.filter((m: Any) => m.gaadeId === gid);
  const isMember = (gid: string, uid: string) => members(gid).some((m: Any) => m.userId === uid);
  const G = (id: string) => { const g = DB().gaade.find((x: Any) => x.id === id); if (!g) throw E(404, 'not_found', 'گعده پیدا نشد'); return g; };
  const card = (g: Any, uid: string) => { const ms = members(g.id); const mine = ms.find((m: Any) => m.userId === uid); return { id: g.id, title: g.title, kind: g.kind, rhythm: g.rhythm, place: g.place, host: person(g.hostId), memberCount: ms.length, members: ms.slice(0, 6).map((m: Any) => person(m.userId)), next: g.next, joined: !!mine, rsvp: mine?.rsvp ?? null, yes: ms.filter((m: Any) => m.rsvp === 'YES').length }; };

  // ── گعده
  on('GET', '/gaade', () => { const u = me(); const r = rolesOf(u.id); const all = DB().gaade;
    const mine = all.filter((g: Any) => isMember(g.id, u.id)).map((g: Any) => card(g, u.id));
    const near = all.filter((g: Any) => !isMember(g.id, u.id) && (g.kind !== 'IMAMS' || r.includes('IMAM'))).map((g: Any) => card(g, u.id));
    return { mine, near }; });
  on('POST', '/gaade', (_m: Any, b: Any) => { const u = me(); if (!b.title?.trim() || !b.topic?.trim()) throw E(400, 'invalid', 'نام گعده و موضوع جلسهٔ اول را بنویسید', { fields: { title: !b.title?.trim() ? 'نام را بنویسید' : undefined, topic: !b.topic?.trim() ? 'موضوع را بنویسید' : undefined } });
    const id = rid(); DB().gaade.push({ id, title: b.title.trim(), kind: 'CUSTOM', hostId: u.id, rhythm: b.rhythm || 'ماهانه', place: b.place || 'مسجد', createdAt: now(), next: { at: b.at || new Date(Date.now() + 7 * DAY).toISOString(), where: b.place || 'مسجد', topic: b.topic.trim() } });
    DB().gaadeMembers.push({ gaadeId: id, userId: u.id, rsvp: 'YES' });
    (b.invite ?? []).forEach((x: string) => { if (x !== u.id && !isMember(id, x)) { DB().gaadeMembers.push({ gaadeId: id, userId: x, rsvp: null }); notify(x, { kind: 'gaade_invite', title: `دعوت به «${b.title.trim()}»`, body: `${u.firstName} ${u.lastName} شما را به گعده دعوت کرد`, link: `/gaade/${id}` }); } });
    return { id }; });
  on('GET', '/gaade/candidates', () => { const u = me(); return DB().users.filter((x: Any) => x.id !== u.id && x.gender === u.gender && x.countyId === u.countyId && !rolesOf(x.id).includes('HQ_ADMIN')).map((x: Any) => person(x.id)); });
  on('GET', '/gaade/([^/]+)', (m: Any) => { const u = me(); const g = G(m[1]); const joined = isMember(g.id, u.id);
    const notes = joined ? DB().gaadeNotes.filter((n: Any) => n.gaadeId === g.id).sort((a: Any, b: Any) => b.createdAt.localeCompare(a.createdAt)).map((n: Any) => ({ ...n, user: person(n.userId) })) : [];
    const reqs = joined ? DB().peerRequests.filter((r: Any) => r.gaadeId === g.id).map((r: Any) => r.id) : [];
    return { ...card(g, u.id), members: members(g.id).map((x: Any) => ({ ...person(x.userId), rsvp: x.rsvp })), notes, isHost: g.hostId === u.id, requestIds: reqs }; });
  on('POST', '/gaade/([^/]+)/join', (m: Any) => { const u = me(); const g = G(m[1]); if (g.kind === 'IMAMS' && !rolesOf(u.id).includes('IMAM')) throw E(403, 'forbidden', 'این گعده ویژهٔ امامان است'); if (!isMember(g.id, u.id)) { DB().gaadeMembers.push({ gaadeId: g.id, userId: u.id, rsvp: null }); notify(g.hostId, { kind: 'gaade_join', title: `عضو تازه در «${g.title}»`, body: `${u.firstName} ${u.lastName}`, link: `/gaade/${g.id}` }); } return { ok: true }; });
  on('POST', '/gaade/([^/]+)/leave', (m: Any) => { const u = me(); const g = G(m[1]); if (g.hostId === u.id) throw E(400, 'host', 'میزبان نمی‌تواند گعده را ترک کند؛ اول میزبانی را به عضو دیگری بسپارید'); DB().gaadeMembers = DB().gaadeMembers.filter((x: Any) => !(x.gaadeId === g.id && x.userId === u.id)); return { ok: true }; });
  on('POST', '/gaade/([^/]+)/rsvp', (m: Any, b: Any) => { const u = me(); const x = members(m[1]).find((y: Any) => y.userId === u.id); if (!x) throw E(403, 'forbidden', 'عضو این گعده نیستید'); x.rsvp = b.rsvp === 'NO' ? 'NO' : 'YES'; return { ok: true }; });
  on('PUT', '/gaade/([^/]+)/next', (m: Any, b: Any) => { const u = me(); const g = G(m[1]); if (g.hostId !== u.id) throw E(403, 'forbidden', 'فقط میزبان جلسه را تنظیم می‌کند'); g.next = { at: b.at, where: b.where, topic: b.topic }; members(g.id).forEach((x: Any) => { x.rsvp = x.userId === u.id ? 'YES' : null; if (x.userId !== u.id) notify(x.userId, { kind: 'gaade_next', title: `جلسهٔ تازهٔ «${g.title}»`, body: b.topic, link: `/gaade/${g.id}` }); }); return g.next; });
  on('POST', '/gaade/([^/]+)/notes', (m: Any, b: Any) => { const u = me(); const g = G(m[1]); if (!isMember(g.id, u.id)) throw E(403, 'forbidden', 'عضو این گعده نیستید'); if (!b.experience?.trim() || !b.promise?.trim()) throw E(400, 'invalid', 'تجربه و قرار را بنویسید', { fields: { experience: !b.experience?.trim() ? 'تجربه را بنویسید' : undefined, promise: !b.promise?.trim() ? 'قرار را بنویسید' : undefined } });
    DB().gaadeNotes.push({ id: rid(), gaadeId: g.id, session: g.next?.topic ?? '', topic: g.next?.topic ?? '', userId: u.id, experience: b.experience.trim(), knot: (b.knot ?? '').trim(), promise: b.promise.trim(), createdAt: now() }); return { ok: true }; });
  on('POST', '/gaade/([^/]+)/invite', (m: Any, b: Any) => { const u = me(); const g = G(m[1]); if (g.hostId !== u.id) throw E(403, 'forbidden', 'فقط میزبان دعوت می‌کند'); (b.userIds ?? []).forEach((x: string) => { if (!isMember(g.id, x)) { DB().gaadeMembers.push({ gaadeId: g.id, userId: x, rsvp: null }); notify(x, { kind: 'gaade_invite', title: `دعوت به «${g.title}»`, link: `/gaade/${g.id}` }); } }); return { ok: true }; });

  // ── پرسش از همتایان
  const votes = (k: string, id: string) => DB().votes.filter((v: Any) => v.kind === k && v.targetId === id);
  const qView = (q: Any, uid: string) => { const as = DB().answers.filter((a: Any) => a.questionId === q.id); return { id: q.id, title: q.title, body: q.body, createdAt: q.createdAt, author: person(q.userId), courseId: q.courseId, lessonId: q.lessonId, lessonTitle: q.lessonId ? DB().lessons.find((l: Any) => l.id === q.lessonId)?.title ?? null : null, votes: votes('Q', q.id).length, voted: votes('Q', q.id).some((v: Any) => v.userId === uid), answerCount: as.length, hasBest: as.some((a: Any) => a.best), mine: q.userId === uid }; };
  on('GET', '/questions', (_m: Any, _b: Any, qs: URLSearchParams) => { const u = me(); const lesson = qs.get('lesson'); const q = (qs.get('q') ?? '').trim();
    return DB().questions.filter((x: Any) => (!lesson || x.lessonId === lesson) && (!q || (x.title + x.body).includes(q))).map((x: Any) => qView(x, u.id)).sort((a: Any, b: Any) => b.votes - a.votes || b.createdAt.localeCompare(a.createdAt)); });
  on('POST', '/questions', (_m: Any, b: Any) => { const u = me(); if (!b.title?.trim()) throw E(400, 'invalid', 'پرسش را بنویسید', { fields: { title: 'پرسش را بنویسید' } }); const id = rid(); const l = b.lessonId ? DB().lessons.find((x: Any) => x.id === b.lessonId) : null; const mod = l ? DB().modules.find((m: Any) => m.id === l.moduleId) : null;
    DB().questions.push({ id, userId: u.id, courseId: mod?.courseId ?? null, lessonId: b.lessonId ?? null, title: b.title.trim().slice(0, 160), body: (b.body ?? '').trim(), createdAt: now() }); return { id }; });
  on('GET', '/questions/([^/]+)', (m: Any) => { const u = me(); const q = DB().questions.find((x: Any) => x.id === m[1]); if (!q) throw E(404, 'not_found', 'پرسش پیدا نشد');
    const as = DB().answers.filter((a: Any) => a.questionId === q.id).map((a: Any) => ({ id: a.id, body: a.body, best: a.best, createdAt: a.createdAt, author: person(a.userId), votes: votes('A', a.id).length, voted: votes('A', a.id).some((v: Any) => v.userId === u.id), mine: a.userId === u.id }))
      .sort((a: Any, b: Any) => Number(b.best) - Number(a.best) || b.votes - a.votes);
    return { ...qView(q, u.id), answers: as }; });
  on('POST', '/questions/([^/]+)/answers', (m: Any, b: Any) => { const u = me(); const q = DB().questions.find((x: Any) => x.id === m[1]); if (!q) throw E(404, 'not_found', 'پرسش پیدا نشد'); if (!b.body?.trim()) throw E(400, 'invalid', 'پاسخ را بنویسید', { fields: { body: 'پاسخ را بنویسید' } });
    DB().answers.push({ id: rid(), questionId: q.id, userId: u.id, body: b.body.trim(), best: false, createdAt: now() }); if (q.userId !== u.id) notify(q.userId, { kind: 'question_answer', title: 'پاسخ تازه به پرسش شما', body: q.title, link: `/questions/${q.id}` }); return { ok: true }; });
  const toggle = (k: string, id: string) => { const u = me(); const i = DB().votes.findIndex((v: Any) => v.kind === k && v.targetId === id && v.userId === u.id); if (i >= 0) DB().votes.splice(i, 1); else DB().votes.push({ kind: k, targetId: id, userId: u.id }); return { ok: true }; };
  on('POST', '/questions/([^/]+)/vote', (m: Any) => toggle('Q', m[1]));
  on('POST', '/answers/([^/]+)/vote', (m: Any) => toggle('A', m[1]));
  on('POST', '/answers/([^/]+)/best', (m: Any) => { const u = me(); const a = DB().answers.find((x: Any) => x.id === m[1]); const q = a && DB().questions.find((x: Any) => x.id === a.questionId); if (!q) throw E(404, 'not_found', 'پاسخ پیدا نشد'); if (q.userId !== u.id) throw E(403, 'forbidden', 'فقط پرسشگر پاسخ برگزیده را انتخاب می‌کند');
    DB().answers.filter((x: Any) => x.questionId === q.id).forEach((x: Any) => (x.best = x.id === a.id)); if (a.userId !== u.id) notify(a.userId, { kind: 'answer_best', title: 'پاسخ شما برگزیده شد', body: q.title, link: `/questions/${q.id}` }); return { ok: true }; });

  // ── نظر همتا
  on('GET', '/peer-requests', () => { const u = me(); const gs = DB().gaadeMembers.filter((m: Any) => m.userId === u.id).map((m: Any) => m.gaadeId);
    return DB().peerRequests.filter((r: Any) => gs.includes(r.gaadeId)).sort((a: Any, b: Any) => b.createdAt.localeCompare(a.createdAt)).map((r: Any) => ({ id: r.id, title: r.title, body: r.body, createdAt: r.createdAt, author: person(r.userId), gaade: DB().gaade.find((g: Any) => g.id === r.gaadeId)?.title ?? '', mine: r.userId === u.id,
      replies: DB().peerReplies.filter((x: Any) => x.requestId === r.id).map((x: Any) => ({ id: x.id, body: x.body, createdAt: x.createdAt, author: person(x.userId) })) })); });
  on('POST', '/peer-requests', (_m: Any, b: Any) => { const u = me(); if (!isMember(b.gaadeId, u.id)) throw E(403, 'forbidden', 'عضو این گعده نیستید'); if (!b.title?.trim() || !b.body?.trim()) throw E(400, 'invalid', 'عنوان و متن را بنویسید');
    const id = rid(); DB().peerRequests.push({ id, userId: u.id, gaadeId: b.gaadeId, title: b.title.trim(), body: b.body.trim(), createdAt: now() });
    members(b.gaadeId).forEach((x: Any) => x.userId !== u.id && notify(x.userId, { kind: 'peer_request', title: 'همتایتان نظر شما را خواسته', body: b.title.trim(), link: '/peers?tab=peer' })); return { id }; });
  on('POST', '/peer-requests/([^/]+)/replies', (m: Any, b: Any) => { const u = me(); const r = DB().peerRequests.find((x: Any) => x.id === m[1]); if (!r || !isMember(r.gaadeId, u.id)) throw E(404, 'not_found', 'درخواست پیدا نشد'); if (!b.body?.trim()) throw E(400, 'invalid', 'نظر را بنویسید');
    DB().peerReplies.push({ id: rid(), requestId: r.id, userId: u.id, body: b.body.trim(), createdAt: now() }); if (r.userId !== u.id) notify(r.userId, { kind: 'peer_reply', title: 'همتایتان نظر داد', body: r.title, link: '/peers?tab=peer' }); return { ok: true }; });

  // ── فرایند تعیّن امامت
  const imamat = (uid: string) => { let x = DB().imamat.find((i: Any) => i.userId === uid); if (!x) { x = { userId: uid, level: 1, spiral: 1, petals: {} }; DB().imamat.push(x); } return x; };
  const view = (uid: string) => { const x = imamat(uid); return { isImam: rolesOf(uid).includes('IMAM'), level: x.level, spiral: x.spiral, petals: Object.fromEntries(PETAL_IDS.map((p) => [p, x.petals[p] ?? 0])),
    assessments: DB().assessments.filter((a: Any) => a.userId === uid).sort((a: Any, b: Any) => b.createdAt.localeCompare(a.createdAt)).map((a: Any) => ({ id: a.id, level: a.level, spiral: a.spiral, note: a.note, createdAt: a.createdAt, by: person(a.byId) })) }; };
  on('GET', '/me/imamat', () => view(me().id));
  const canAssess = (uid: string) => { const r = rolesOf(me().id); if (!r.includes('RAHYAR') && !r.includes('HQ_ADMIN')) throw E(403, 'forbidden', 'ارزیابی میدانی کار راهیار است'); if (!rolesOf(uid).includes('IMAM')) throw E(400, 'not_imam', 'ارزیابی سطح فقط برای امامان است'); };
  on('GET', '/rahyar/learners/([^/]+)/imamat', (m: Any) => { const r = rolesOf(me().id); if (!r.includes('RAHYAR') && !r.includes('HQ_ADMIN')) throw E(403, 'forbidden', 'دسترسی ندارید'); return view(m[1]); });
  on('POST', '/rahyar/learners/([^/]+)/assess', (m: Any, b: Any) => { canAssess(m[1]); const lv = +b.level; if (!(lv >= 1 && lv <= 4)) throw E(400, 'invalid', 'سطح را انتخاب کنید'); if (!b.note?.trim()) throw E(400, 'invalid', 'یادداشت دیدار را بنویسید', { fields: { note: 'یادداشت دیدار را بنویسید' } });
    const x = imamat(m[1]); x.level = lv; x.spiral = Math.min(5, Math.max(1, +b.spiral || x.spiral)); if (b.petals) PETAL_IDS.forEach((p) => { const v = b.petals[p]; if (v != null) x.petals[p] = Math.min(4, Math.max(0, +v)); });
    DB().assessments.push({ id: rid(), userId: m[1], byId: me().id, level: lv, spiral: x.spiral, note: b.note.trim(), createdAt: now() });
    notify(m[1], { kind: 'imamat_assessed', title: 'ارزیابی میدانی راهیار ثبت شد', body: ['امام جماعت', 'امام مسجد', 'امام محله', 'امام میانی'][lv - 1], link: '/imamat' });
    DB().audit.unshift({ id: rid(), actorId: me().id, action: 'imamat.assess', target: m[1], createdAt: now() }); return view(m[1]); });
  void U; void name;
}
