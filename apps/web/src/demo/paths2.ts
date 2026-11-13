/**
 * نسخهٔ نمایشی — منطق مسیر (نسخهٔ ۲):
 * برگزارکنندگان، مسیر در سه اندازه (خرد/میانه/کلان) با پله‌ها، مسیر اصلی بر پایهٔ نقش کنشگر،
 * کتابخانهٔ مشترک، میدان (تکلیف‌ها و روایت‌ها)، کارنامهٔ چندمسیری، مسجد روی نقشه، پنل برگزارکننده و بازبینی ستاد.
 * شکل پاسخ‌ها همان است که apps/api در ماژول paths2 خواهد داشت.
 */
type Any = any;
const DAY = 864e5;
const iso = (ms: number) => new Date(ms).toISOString();
export type ActorRole = 'IMAM' | 'SHARIK' | 'BAZU' | 'HASTEH' | 'OTHER';
export const ACTOR_ROLES: [ActorRole, string][] = [['IMAM', 'امام'], ['SHARIK', 'شریکة‌الامام'], ['BAZU', 'بازو'], ['HASTEH', 'عضو هسته'], ['OTHER', 'دیگر']];
const SIZE_FA: Record<string, string> = { micro: 'مسیر خرد', mid: 'مسیر میانه', macro: 'مسیر کلان' };

export function seedPaths2(db: Any) {
  const t = Date.now();
  db.publishers = [
    { id: 'pub-hedayat', name: 'بنیاد هدایت', color: '#1E3A9E', status: 'ACTIVE', kind: 'بنیاد', referrer: 'ستاد', createdAt: iso(t - 400 * DAY) },
    { id: 'org-barakat', name: 'مؤسسهٔ برکت', color: '#0E9F5A', status: 'ACTIVE', kind: 'مؤسسهٔ ثبت‌شده', referrer: 'بنیاد هدایت', createdAt: iso(t - 200 * DAY) },
    { id: 'pub-banovan', name: 'مجمع بانوان مسجدی', color: '#D64A6A', status: 'ACTIVE', kind: 'شبکهٔ مردمی', referrer: 'ستاد استان', createdAt: iso(t - 150 * DAY) },
    { id: 'pub-shahr', name: 'شبکهٔ مساجد شهر', color: '#F08C1A', status: 'ACTIVE', kind: 'ستاد شهری', referrer: 'ستاد', createdAt: iso(t - 120 * DAY) },
    { id: 'pub-kanoon', name: 'کانون نوجوانان مسجد', color: '#1BA3C6', status: 'ACTIVE', kind: 'کانون', referrer: 'شبکهٔ مساجد شهر', createdAt: iso(t - 60 * DAY) },
    { id: 'pub-noor', name: 'مؤسسهٔ فرهنگی نورالهدی', color: '#8C93B5', status: 'PENDING', kind: 'مؤسسه', referrer: 'ستاد استان فارس', createdAt: iso(t - 2 * DAY) },
  ];
  // مدیر محتوای بنیاد (برگزارکنندهٔ مسیر اصلی)
  const kashan = db.counties.find((c: Any) => c.name === 'کاشان');
  db.users.push({ id: 'p-pub', mobile: '09127777777', firstName: 'امیر', lastName: 'رستمی', gender: 'MALE', countyId: kashan?.id, mosqueId: null, nearMosque: null, nationalId: null, isActive: true, createdAt: iso(t - 300 * DAY), actorRole: 'OTHER' });
  db.roles.push({ userId: 'p-pub', role: 'ORG_ADMIN', networkId: 'pub-hedayat' });
  if (!db.networks.some((n: Any) => n.id === 'pub-hedayat')) db.networks.push({ id: 'pub-hedayat', kind: 'ORGANIZATION', name: 'بنیاد هدایت', underRahyar: false });
  // سازندهٔ هر دوره
  const pubOfSlug = (s: string) => s.startsWith('rs') ? 'pub-shahr' : ['tr4', 'tr5', 'tr6'].includes(s) ? 'pub-banovan' : s === 'nj3' ? 'org-barakat' : 'pub-hedayat';
  for (const c of db.courses) { c.publisherId = c.publisherId ?? pubOfSlug(c.slug); c.libraryShare = c.libraryShare ?? 'all'; c.version = c.version ?? 1; }
  const cid = (slug: string) => db.courses.find((c: Any) => c.slug === slug)?.id;
  const cs = (...slugs: string[]) => slugs.map((s) => ({ kind: 'course', refId: cid(s) })).filter((x) => x.refId);
  const oldPath = (slug: string) => db.paths.find((p: Any) => p.slug === slug);
  const itemsOf = (slug: string) => { const p = oldPath(slug); return p ? db.pathItems.filter((i: Any) => i.pathId === p.id).sort((a: Any, b: Any) => a.order - b.order).map((i: Any) => ({ kind: 'course', refId: i.courseId })) : []; };
  const P = (x: Any) => ({ status: 'PUBLISHED', hasRahyar: true, createdAt: iso(t - 90 * DAY), returnNote: null, ...x });
  db.paths2 = [
    // مسیرهای اصلی
    P({ id: 'pt-taayon', slug: 'taayon-emamat', title: 'تعیّن امامت', size: 'macro', publisherId: 'pub-hedayat', audience: ['IMAM'], mainFor: ['IMAM'], color: '#1E3A9E',
      description: 'چهار پله از امام خانه تا امام مسجد؛ هر پله با دوره، کار میدانی و دیدار راهیار بالا می‌رود، نه با تمام کردن ویدیو.',
      steps: [
        { id: 's1', title: 'امام خانه', rule: 'دیدار راهیار', items: [...cs('tr1', 'gf1'), { kind: 'assess', refId: 'L1', title: 'دیدار میدانی راهیار' }] },
        { id: 's2', title: 'امام جماعت', rule: 'دیدار راهیار', items: [...cs('mq1'), { kind: 'path', refId: 'pt-daftar' }, { kind: 'assess', refId: 'L2', title: 'دیدار میدانی راهیار' }] },
        { id: 's3', title: 'امام محله', rule: 'دیدار راهیار', items: [{ kind: 'path', refId: 'pt-barname' }, ...cs('mq2'), { kind: 'live', refId: 'ev-online', optional: true }, { kind: 'assess', refId: 'L3', title: 'دیدار میدانی راهیار' }] },
        { id: 's4', title: 'امام مسجد', rule: 'دیدار راهیار', items: [...cs('mq3', 'mq4'), { kind: 'course', refId: cid('nj3'), optional: true }, { kind: 'assess', refId: 'L4', title: 'دیدار میدانی راهیار' }] },
      ] }),
    P({ id: 'pt-sharik', slug: 'sharikat-ol-imam', title: 'شریکة‌الامام', size: 'macro', publisherId: 'pub-hedayat', audience: ['SHARIK'], mainFor: ['SHARIK'], color: '#D64A6A',
      description: 'همراهی امام در خانه، حلقه و محله؛ سه پله با راهیار.',
      steps: [
        { id: 's1', title: 'خانه', rule: '۲ روایت تأییدشده', items: cs('tr1', 'tr2') },
        { id: 's2', title: 'حلقه', rule: 'دیدار راهیار', items: [{ kind: 'path', refId: 'pt-halghe' }, ...cs('nj3')] },
        { id: 's3', title: 'محله', rule: 'دیدار راهیار', items: [{ kind: 'path', refId: 'pt-tarbiat' }, ...cs('tr3')] },
      ] }),
    P({ id: 'pt-hasteh', slug: 'ozv-ta-morabbi', title: 'از عضو تا مربی هسته', size: 'macro', publisherId: 'pub-kanoon', audience: ['BAZU', 'HASTEH'], mainFor: ['BAZU', 'HASTEH'], color: '#1BA3C6',
      description: 'سه پله برای بازوها و اعضای هسته؛ با مربی هسته به‌عنوان راهیار. دوره‌هایی از بنیاد هدایت و مؤسسهٔ برکت هم داخلش هست.',
      steps: [
        { id: 's1', title: 'عضو هسته', rule: '۲ روایت تأییدشده', items: [...cs('nojavan-1'), { kind: 'path', refId: 'pt-jazb' }, { kind: 'live', refId: 'ev-online', optional: true }] },
        { id: 's2', title: 'بازوی فعال', rule: 'ارزیابی مربی هسته', items: [...cs('nj3', 'rs1')] },
        { id: 's3', title: 'مربی هسته', rule: 'ادارهٔ یک هستهٔ ۵ نفره', items: [{ kind: 'path', refId: 'pt-barname' }, ...cs('br2')] },
      ] }),
    // مسیرهای خرد
    P({ id: 'pt-jazb', slug: 'jazb-nojavan', title: 'جذب نوجوان در یک ماه', size: 'micro', publisherId: 'pub-hedayat', audience: ['IMAM', 'BAZU', 'HASTEH'], mainFor: [], color: '#12A58E',
      description: 'هر هفته یک درس کوتاه و یک کار کوچک با نوجوانان مسجد. آخر ماه سه نوجوان تازه را به نام می‌شناسی.',
      steps: [{ id: 'w1', title: 'دیدن و شنیدن', items: cs('nojavan-1') }, { id: 'w2', title: 'اعتماد', items: cs('nojavan-2') }, { id: 'w3', title: 'اولین دعوت', items: cs('nj1') }, { id: 'w4', title: 'قرار ثابت', items: cs('nj2') }] }),
    P({ id: 'pt-halghe', slug: 'avalin-halghe', title: 'اولین حلقهٔ خانگی', size: 'micro', publisherId: 'pub-banovan', audience: ['SHARIK'], mainFor: [], color: '#D64A6A',
      description: 'از دعوت چهار همسایه تا قرار ثابت هفتگی، در سه هفته.',
      steps: [{ id: 'w1', title: 'دعوت', items: cs('tr4') }, { id: 'w2', title: 'اولین نشست', items: cs('tr5') }, { id: 'w3', title: 'قرار ثابت', items: cs('tr6') }] }),
    P({ id: 'pt-daftar', slug: 'daftar-nam', title: 'دفتر نام و احوال محله', size: 'micro', publisherId: 'pub-shahr', audience: ['IMAM', 'BAZU'], mainFor: [], color: '#F08C1A', hasRahyar: false,
      description: 'شناختن چهل خانواده با روش ساده، در دو هفته. خودآموز.',
      steps: [{ id: 'w1', title: 'گفت‌وگو', items: cs('gf1') }, { id: 'w2', title: 'دفتر', items: cs('qb1') }] }),
    // مسیرهای میانه (از کاتالوگ قبلی)
    P({ id: 'pt-nojavanan', slug: 'nojavanan', title: 'همراهی نوجوانان مسجد', size: 'mid', publisherId: 'pub-hedayat', audience: ['IMAM', 'BAZU', 'HASTEH'], mainFor: [], color: '#12A58E', description: oldPath('nojavanan')?.description ?? null, steps: [{ id: 's1', title: 'دوره‌ها', items: itemsOf('nojavanan') }] }),
    P({ id: 'pt-barname', slug: 'barname', title: 'برنامه‌ریزی و اجرا', size: 'mid', publisherId: 'pub-hedayat', audience: ['IMAM', 'BAZU', 'HASTEH'], mainFor: [], color: '#F5B700', description: oldPath('barname')?.description ?? null, steps: [{ id: 's1', title: 'دوره‌ها', items: itemsOf('barname') }] }),
    P({ id: 'pt-masjed', slug: 'masjed', title: 'مدیریت و ادارهٔ مسجد', size: 'mid', publisherId: 'pub-hedayat', audience: ['IMAM'], mainFor: [], color: '#1E3A9E', description: oldPath('masjed')?.description ?? null, steps: [{ id: 's1', title: 'دوره‌ها', items: itemsOf('masjed') }] }),
    P({ id: 'pt-tarbiat', slug: 'tarbiat', title: 'تربیت کودک و نوجوان', size: 'mid', publisherId: 'pub-banovan', audience: ['SHARIK', 'HASTEH'], mainFor: [], color: '#D64A6A', description: oldPath('tarbiat')?.description ?? null, steps: [{ id: 's1', title: 'دوره‌ها', items: itemsOf('tarbiat') }] }),
    P({ id: 'pt-resane', slug: 'resane', title: 'رسانهٔ مسجد', size: 'mid', publisherId: 'pub-shahr', audience: ['BAZU', 'HASTEH'], mainFor: [], color: '#F08C1A', hasRahyar: false, description: oldPath('resane')?.description ?? null, steps: [{ id: 's1', title: 'دوره‌ها', items: itemsOf('resane') }] }),
    P({ id: 'pt-tabligh', slug: 'tabligh', title: 'تبلیغ و پاسخ به پرسش‌ها', size: 'mid', publisherId: 'pub-hedayat', audience: ['IMAM', 'SHARIK'], mainFor: [], color: '#0E9F5A', description: oldPath('tabligh')?.description ?? null, steps: [{ id: 's1', title: 'دوره‌ها', items: itemsOf('tabligh') }] }),
    // در بازبینی ستاد
    P({ id: 'pt-kanoon-new', slug: 'rah-andazi-kanoon', title: 'راه‌اندازی کانون نوجوانان', size: 'mid', publisherId: 'pub-kanoon', audience: ['BAZU', 'HASTEH'], mainFor: [], color: '#1BA3C6', status: 'IN_REVIEW', submittedAt: iso(t - 3 * DAY), description: 'از صفر تا یک کانون با برنامهٔ هفتگی، در یک فصل.', steps: [{ id: 's1', title: 'دوره‌ها', items: cs('br1', 'nj1') }] }),
  ];
  // پخش زندهٔ مستقل (منتظر بازبینی)
  db.events.push({ id: 'ev-live-mehmani', title: 'مهمانی محله؛ تجربهٔ ۴۵۰۰ محله', kind: 'ONLINE', isLive: true, publisherId: 'pub-shahr', startsAt: iso(t + 9 * DAY), endsAt: iso(t + 9 * DAY + 2 * 3600e3), location: null, mapUrl: null, onlineUrl: 'https://example.org/live', hostName: 'حجت‌الاسلام قاسمی', capacity: 300, waitlist: false, requiresApproval: false, registrationDeadline: null, audienceGender: null, audienceProvinceId: null, audienceCountyId: null, description: 'تجربهٔ چهار هزار و پانصد محله در برگزاری مهمانی محله.', agenda: null, bring: null, status: 'DRAFT', reviewStatus: 'IN_REVIEW', submittedAt: iso(t - 2 * DAY), cancelReason: null, createdById: 'p-pub' });
  const evOnline = db.events.find((e: Any) => e.id === 'ev-online'); if (evOnline) { evOnline.isLive = true; evOnline.publisherId = 'pub-hedayat'; evOnline.title = 'اخلاق امامت محله، جلسهٔ ۶'; }
  // نقش کنشگر، مسیر اصلی، مسجد روی نقشه
  const setA = (id: string, actorRole: ActorRole, main: string | null) => { const u = db.users.find((x: Any) => x.id === id); if (u) { u.actorRole = actorRole; u.mainPathId = main; } };
  setA('p-imam', 'IMAM', 'pt-taayon'); setA('p-imam2', 'IMAM', 'pt-taayon'); setA('p-imam3', 'IMAM', 'pt-taayon');
  setA('sample3', 'HASTEH', 'pt-hasteh'); setA('sample1', 'SHARIK', 'pt-sharik'); setA('sample0', 'BAZU', 'pt-hasteh'); setA('sample2', 'BAZU', 'pt-hasteh');
  db.pathEnr = [];
  const E2 = (userId: string, pathId: string, d: number) => db.pathEnr.push({ userId, pathId, enrolledAt: iso(t - d * DAY), completedAt: null });
  E2('p-imam', 'pt-taayon', 80); E2('p-imam', 'pt-jazb', 20); E2('p-imam', 'pt-daftar', 60);
  E2('p-imam2', 'pt-taayon', 50); E2('p-imam3', 'pt-taayon', 30);
  E2('sample3', 'pt-hasteh', 40); E2('sample3', 'pt-jazb', 15); E2('sample0', 'pt-hasteh', 40); E2('sample2', 'pt-jazb', 15);
  E2('sample1', 'pt-sharik', 30); E2('sample1', 'pt-halghe', 10);
  // پیشرفت نمونه: امام محله در پلهٔ ۳، عضو هسته در پلهٔ ۲، شریکة‌الامام در پلهٔ ۲
  const doneCourse = (uid: string, slug: string, d: number) => { const c = db.courses.find((x: Any) => x.slug === slug); if (!c) return; if (!db.enrollments.some((e: Any) => e.userId === uid && e.courseId === c.id)) db.enrollments.push({ userId: uid, courseId: c.id, courseVersion: 1, enrolledAt: iso(t - (d + 20) * DAY), completedAt: iso(t - d * DAY), archivedAt: null, lastLessonId: null }); else { const e = db.enrollments.find((e: Any) => e.userId === uid && e.courseId === c.id); e.completedAt = e.completedAt ?? iso(t - d * DAY); } };
  const startCourse = (uid: string, slug: string, d: number) => { const c = db.courses.find((x: Any) => x.slug === slug); if (c && !db.enrollments.some((e: Any) => e.userId === uid && e.courseId === c.id)) db.enrollments.push({ userId: uid, courseId: c.id, courseVersion: 1, enrolledAt: iso(t - d * DAY), completedAt: null, archivedAt: null, lastLessonId: null }); };
  ['tr1', 'gf1', 'mq1', 'qb1'].forEach((s, i) => doneCourse('p-imam', s, 60 - i * 10)); startCourse('p-imam', 'mq2', 5); ['nojavan-1', 'nojavan-2'].forEach((s, i) => doneCourse('p-imam', s, 12 - i * 5)); startCourse('p-imam', 'nj1', 3);
  ['nojavan-1', 'nojavan-2'].forEach((s, i) => doneCourse('sample3', s, 25 - i * 7)); startCourse('sample3', 'nj1', 4); startCourse('sample3', 'nj3', 2);
  ['tr1'].forEach((s) => doneCourse('sample1', s, 15)); startCourse('sample1', 'tr2', 6); startCourse('sample1', 'tr4', 3);
  // مسجدها روی نقشه (کاشان)
  let k = 0;
  for (const m of db.mosques) { const a = (k * 137) % 360; const r = 0.004 + ((k * 53) % 17) / 1000; m.lat = m.lat ?? 33.985 + Math.sin(a) * r; m.lng = m.lng ?? 51.41 + Math.cos(a) * r; m.address = m.address ?? ['خیابان امام، کوچهٔ ۱۲', 'میدان شهدا', 'بلوار هاشمی‌نژاد', 'خیابان باباافضل', 'محلهٔ پشت مشهد'][k % 5]; k++; }
  const pim = db.users.find((u: Any) => u.id === 'p-imam'); if (pim) { pim.mosqueId = db.mosques[0]?.id; pim.lat = db.mosques[0]?.lat; pim.lng = db.mosques[0]?.lng; }
  // همهٔ کاربران نمونه، نخستین ورود را گذرانده‌اند
  for (const u of db.users) u.onboardedAt = u.onboardedAt ?? u.createdAt;
  // راهیاران مسیرها
  db.pathRahyars = [{ pathId: 'pt-taayon', userId: 'p-mrah' }, { pathId: 'pt-jazb', userId: 'p-mrah' }, { pathId: 'pt-sharik', userId: 'p-cty' }, { pathId: 'pt-halghe', userId: 'p-cty' }, { pathId: 'pt-hasteh', userId: 'p-cty' }];
}

export function registerPaths2(X: Any) {
  const { on, E, me, maybeMe, rolesOf, rid, now, notify, nm, U, C, enr, prog, allLessons, staff } = X;
  const DB = () => X.db;
  const pub = (id: string) => DB().publishers.find((p: Any) => p.id === id);
  const pubCard = (id: string) => { const p = pub(id); return p ? { id: p.id, name: p.name, color: p.color } : null; };
  const PATH = (key: string) => { const p = DB().paths2.find((x: Any) => x.id === key || x.slug === key); if (!p) throw E(404, 'no_path', 'این مسیر پیدا نشد'); return p; };
  const penr = (uid: string, pid: string) => DB().pathEnr.find((e: Any) => e.userId === uid && e.pathId === pid);
  const courseState = (uid: string | undefined, c: Any) => { if (!uid) return null; const e = enr(uid, c.id); if (!e) return null; const req = allLessons(c.id).filter((l: Any) => l.required); const pct = e.completedAt ? 100 : req.length ? Math.round(req.filter((l: Any) => prog(uid, l.id)?.completedAt).length / req.length * 100) : 0; return { enrolledAt: e.enrolledAt, completedAt: e.completedAt, percent: pct, lastLessonId: e.lastLessenId ?? e.lastLessonId }; };
  const assessLevel = (uid: string) => DB().imamat?.find((x: Any) => x.userId === uid)?.level ?? 0;
  const rahyarOf = (pid: string) => { const r = DB().pathRahyars.find((x: Any) => x.pathId === pid); return r ? { id: r.userId, name: nm(r.userId) } : null; };
  const gaadeNext = (uid: string) => { const g = (DB().gaade ?? []).find((x: Any) => (DB().gaadeMembers ?? []).some((m: Any) => m.gaadeId === x.id && m.userId === uid) && x.next); return g ? { id: g.id, title: g.title, at: g.next.at, where: g.next.where, topic: g.next.topic } : null; };

  /** پیشرفت یک آیتم مسیر: دوره، مسیر تو در تو، پخش زنده، ارزیابی */
  function itemView(it: Any, uid: string | undefined, depth = 0, p?: Any, stepId?: string): Any {
    if (it.kind === 'course') {
      const c = DB().courses.find((x: Any) => x.id === it.refId); if (!c) return null;
      const st = courseState(uid, c); const ls = allLessons(c.id);
      return { kind: 'course', id: c.id, slug: c.slug, title: c.title, color: c.color, icon: c.icon, publisher: pubCard(c.publisherId), optional: !!it.optional, lessonCount: ls.length, durationSec: ls.reduce((s: number, l: Any) => s + l.durationSec, 0), percent: st?.percent ?? 0, done: !!st?.completedAt, started: !!st, to: st?.lastLessonId ? `/lessons/${st.lastLessonId}` : `/courses/${c.slug}` };
    }
    if (it.kind === 'path' && depth < 2) {
      const p = DB().paths2.find((x: Any) => x.id === it.refId); if (!p) return null;
      const v = pathView(p, uid, depth + 1);
      return { kind: 'path', id: p.id, slug: p.slug, title: p.title, size: p.size, sizeFa: SIZE_FA[p.size], color: p.color, publisher: pubCard(p.publisherId), optional: !!it.optional, percent: v.percent, done: v.percent >= 100, started: v.me.enrolled, to: `/paths/${p.slug}` };
    }
    if (it.kind === 'live') {
      const e = DB().events.find((x: Any) => x.id === it.refId); if (!e) return null;
      const r = uid ? DB().regs.find((x: Any) => x.eventId === e.id && x.userId === uid) : null;
      const past = new Date(e.endsAt).getTime() < Date.now();
      return { kind: 'live', id: e.id, title: e.title, startsAt: e.startsAt, publisher: pubCard(e.publisherId), optional: !!it.optional, percent: r?.attendedAt || (past && r) ? 100 : 0, done: !!(r?.attendedAt || (past && r)), started: !!r, to: `/events/${e.id}` };
    }
    if (it.kind === 'assess') {
      const need = Number(String(it.refId).replace('L', '')) || 1;
      const lv = uid ? assessLevel(uid) : 0;
      const ok = lv >= need || (!!uid && (DB().pathAssess ?? []).some((a: Any) => p && a.pathId === p.id && a.stepId === stepId && a.userId === uid));
      return { kind: 'assess', id: it.refId, title: it.title ?? 'دیدار میدانی راهیار', optional: false, percent: ok ? 100 : 0, done: ok, started: false, to: '/imamat' };
    }
    return null;
  }
  function pathView(p: Any, uid: string | undefined, depth = 0) {
    const steps = p.steps.map((s: Any) => { const items = s.items.map((it: Any) => itemView(it, uid, depth, p, s.id)).filter(Boolean); const req = items.filter((i: Any) => !i.optional); const done = req.length > 0 && req.every((i: Any) => i.done); const pct = req.length ? Math.round(req.reduce((a: number, i: Any) => a + i.percent, 0) / req.length) : 0; return { id: s.id, title: s.title, rule: s.rule ?? null, items, done, percent: pct }; });
    const total = steps.length ? Math.round(steps.reduce((a: number, s: Any) => a + s.percent, 0) / steps.length) : 0;
    const curIdx = steps.findIndex((s: Any) => !s.done);
    const e = uid ? penr(uid, p.id) : null;
    const u = uid ? U(uid) : null;
    const growth = uid ? growthSteps(uid, p) : 0;
    return { id: p.id, slug: p.slug, title: p.title, size: p.size, sizeFa: SIZE_FA[p.size], description: p.description, color: p.color, publisher: pubCard(p.publisherId), audience: p.audience, hasRahyar: !!p.hasRahyar, status: p.status, isMain: !!u && u.mainPathId === p.id, mainFor: p.mainFor ?? [],
      steps, percent: total, currentStep: curIdx < 0 ? steps.length - 1 : curIdx, stepCount: steps.length, enrolledCount: DB().pathEnr.filter((x: Any) => x.pathId === p.id).length,
      rahyar: p.hasRahyar ? rahyarOf(p.id) : null, gaade: uid && e ? gaadeNext(uid) : null, growthSteps: growth,
      me: { enrolled: !!e, enrolledAt: e?.enrolledAt ?? null, completedAt: e?.completedAt ?? null } };
  }
  /** گام‌های رشد یک مسیر = روایت‌های تأییدشده در دوره‌های آن مسیر (+ ارزیابی‌های راهیار برای مسیر اصلی امام) */
  const pathCourseIds = (p: Any, depth = 0): string[] => p.steps.flatMap((s: Any) => s.items.flatMap((it: Any) => it.kind === 'course' ? [it.refId] : it.kind === 'path' && depth < 2 ? (() => { const q = DB().paths2.find((x: Any) => x.id === it.refId); return q ? pathCourseIds(q, depth + 1) : []; })() : []));
  function growthSteps(uid: string, p: Any) {
    const ids = new Set(pathCourseIds(p));
    const lessons = new Set(DB().lessons.filter((l: Any) => l.type === 'MISSION' && ids.has(DB().modules.find((m: Any) => m.id === l.moduleId)?.courseId)).map((l: Any) => l.id));
    const approved = DB().progress.filter((x: Any) => x.userId === uid && lessons.has(x.lessonId) && x.data?.status === 'approved').length;
    const assess = p.id === 'pt-taayon' ? (DB().assessments ?? []).filter((a: Any) => a.userId === uid).length : 0;
    return approved + assess;
  }
  const visible = (p: Any) => p.status === 'PUBLISHED';
  const mainFor = (role: ActorRole | null | undefined) => DB().paths2.find((p: Any) => visible(p) && (p.mainFor ?? []).includes(role));

  // ── مسیرها
  on('GET', '/v2/paths', (_m: Any, _b: Any, q: URLSearchParams) => {
    const u = maybeMe(); const who = q.get('who'); const kind = q.get('kind'); const pb = q.get('pub');
    return DB().paths2.filter(visible).filter((p: Any) => (!who || who === 'all' || p.audience.includes(who)) && (!kind || kind === 'all' || p.size === kind) && (!pb || pb === 'all' || p.publisherId === pb)).map((p: Any) => pathView(p, u?.id));
  });
  on('GET', '/v2/paths/([^/]+)', (m: Any) => { const p = PATH(m[1]); const u = maybeMe(); if (!visible(p) && !(u && (rolesOf(u.id).includes('HQ_ADMIN') || pubOf(u.id) === p.publisherId))) throw E(404, 'no_path', 'این مسیر منتشر نشده'); return pathView(p, u?.id); });
  on('POST', '/v2/paths/([^/]+)/enroll', (m: Any) => { const u = me(); const p = PATH(m[1]); if (!penr(u.id, p.id)) DB().pathEnr.push({ userId: u.id, pathId: p.id, enrolledAt: now(), completedAt: null }); return pathView(p, u.id); });
  on('POST', '/v2/paths/([^/]+)/leave', (m: Any) => { const u = me(); const p = PATH(m[1]); DB().pathEnr = DB().pathEnr.filter((e: Any) => !(e.userId === u.id && e.pathId === p.id)); return { ok: true }; });
  on('GET', '/v2/publishers', () => DB().publishers.filter((p: Any) => p.status === 'ACTIVE').map((p: Any) => ({ id: p.id, name: p.name, color: p.color })));

  // ── یادگیری من: مسیر اصلی، مسیرهای من، پیشنهادها، قدم بعدی
  function nextOf(uid: string, mine: Any[]) {
    const u = U(uid);
    const order = [...mine].sort((a, b) => (a.isMain ? -1 : b.isMain ? 1 : 0));
    // ۱) روایتی که برگشته یا منتظر نوشتن است، در مسیر اصلی اول
    for (const p of order) {
      const ids = new Set(pathCourseIds(DB().paths2.find((x: Any) => x.id === p.id)));
      for (const l of DB().lessons.filter((l: Any) => l.type === 'MISSION')) {
        const c = DB().courses.find((x: Any) => x.id === DB().modules.find((m: Any) => m.id === l.moduleId)?.courseId); if (!c || !ids.has(c.id) || !enr(uid, c.id)) continue;
        const d = prog(uid, l.id)?.data;
        if (d?.status === 'needs_revision') return { kind: 'back', kicker: `${p.title}، ${c.title}`, title: `روایت «${l.title}» با یک نکته برگشته`, cta: 'اصلاح کن و بفرست', to: `/lessons/${l.id}`, color: p.color };
        if (d && !d.status) return { kind: 'narrate', kicker: `${p.title}، ${c.title}`, title: `روایت تکلیف «${l.title}» را بنویس`, cta: 'روایت بنویس', to: `/lessons/${l.id}`, color: p.color };
      }
    }
    // ۲) درس بعدی در پلهٔ جاری
    for (const p of order) {
      const st = p.steps[p.currentStep]; if (!st) continue;
      const it = st.items.find((i: Any) => !i.done && !i.optional && i.kind === 'course');
      if (it) return { kind: 'lesson', kicker: `${p.title}، ${p.size === 'micro' ? 'هفتهٔ' : 'پلهٔ'} ${st.title}`, title: it.title, cta: it.started ? 'ادامه بده' : 'شروع کن', to: it.to, color: p.color, pct: it.percent };
    }
    const main = mainFor(u?.actorRole);
    if (main && !penr(uid, main.id)) return { kind: 'start', kicker: 'مسیر اصلی برای تو', title: main.title, cta: 'مسیر را بردار', to: `/paths/${main.slug}`, color: main.color };
    return { kind: 'explore', kicker: 'یادگیری', title: 'یک مسیر کوتاه بردار', cta: 'کاوش', to: '/learn?tab=explore', color: '#1E3A9E' };
  }
  on('GET', '/v2/learning', () => {
    const u = me();
    const mine = DB().pathEnr.filter((e: Any) => e.userId === u.id).map((e: Any) => DB().paths2.find((p: Any) => p.id === e.pathId)).filter((p: Any) => p && visible(p)).map((p: Any) => pathView(p, u.id));
    const main = u.mainPathId ? DB().paths2.find((p: Any) => p.id === u.mainPathId) : mainFor(u.actorRole);
    const mineIds = new Set(mine.map((p: Any) => p.id));
    const sug = DB().paths2.filter((p: Any) => visible(p) && !mineIds.has(p.id) && (!u.actorRole || u.actorRole === 'OTHER' || p.audience.includes(u.actorRole))).sort((a: Any, b: Any) => (a.size === 'micro' ? 0 : 1) - (b.size === 'micro' ? 0 : 1)).slice(0, 3).map((p: Any) => pathView(p, u.id));
    return { actorRole: u.actorRole ?? null, main: main ? pathView(main, u.id) : null, mine, suggestions: sug, next: nextOf(u.id, mine), gaade: gaadeNext(u.id) };
  });

  // ── میدان: تکلیف‌ها و روایت‌ها
  on('GET', '/v2/field', () => {
    const u = me(); const out: Any[] = [];
    const myPaths = DB().pathEnr.filter((e: Any) => e.userId === u.id).map((e: Any) => DB().paths2.find((p: Any) => p.id === e.pathId)).filter(Boolean);
    const pathOfCourse = (cid: string) => myPaths.find((p: Any) => pathCourseIds(p).includes(cid));
    for (const e of DB().enrollments.filter((x: Any) => x.userId === u.id)) {
      const c = DB().courses.find((x: Any) => x.id === e.courseId); if (!c) continue;
      for (const l of allLessons(c.id).filter((l: Any) => l.type === 'MISSION')) {
        const d = prog(u.id, l.id)?.data; const p = pathOfCourse(c.id);
        const status = d?.status === 'approved' ? 'done' : d?.status === 'needs_revision' ? 'back' : d?.status === 'submitted' || d?.status === 'pending' ? 'wait' : d ? 'need' : 'open';
        const last = DB().mmsgs.filter((x: Any) => x.learnerId === u.id && x.lessonId === l.id).slice(-1)[0];
        out.push({ lessonId: l.id, title: l.title, goal: l.content?.goal ?? null, course: { slug: c.slug, title: c.title }, path: p ? { slug: p.slug, title: p.title, color: p.color } : null, status, submittedAt: d?.submittedAt ?? null, reviewedAt: d?.reviewedAt ?? null, note: status === 'back' && last?.kind === 'REVISE' ? last.body : null, to: `/lessons/${l.id}` });
      }
    }
    const rank: Record<string, number> = { back: 0, need: 1, wait: 2, open: 3, done: 4 };
    out.sort((a, b) => rank[a.status] - rank[b.status]);
    return { tasks: out, counts: { need: out.filter((t) => t.status === 'need').length, wait: out.filter((t) => t.status === 'wait').length, back: out.filter((t) => t.status === 'back').length, done: out.filter((t) => t.status === 'done').length } };
  });

  // ── کارنامه
  on('GET', '/v2/karname', () => {
    const u = me();
    const mine = DB().pathEnr.filter((e: Any) => e.userId === u.id).map((e: Any) => DB().paths2.find((p: Any) => p.id === e.pathId)).filter(Boolean).map((p: Any) => pathView(p, u.id));
    const main = mine.find((p: Any) => p.isMain) ?? null;
    const certs = DB().certificates.filter((c: Any) => c.userId === u.id && !c.revokedAt).map((c: Any) => ({ code: c.code, title: c.courseTitle, issuedAt: c.issuedAt, score: c.score, publisher: pubCard(DB().courses.find((x: Any) => x.id === c.courseId)?.publisherId) }));
    const imam = DB().imamat?.find((x: Any) => x.userId === u.id) ?? null;
    return { main, paths: mine, certs, total: mine.reduce((a: number, p: Any) => a + p.growthSteps, 0), imamat: imam ? { level: imam.level, petals: imam.petals } : null };
  });

  // ── مسجد روی نقشه
  const dist = (a: number, b: number, c: number, d: number) => { const R = 6371e3, p1 = a * Math.PI / 180, p2 = c * Math.PI / 180, dp = (c - a) * Math.PI / 180, dl = (d - b) * Math.PI / 180; const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
  on('GET', '/v2/mosques/near', (_m: Any, _b: Any, q: URLSearchParams) => {
    const lat = Number(q.get('lat')), lng = Number(q.get('lng')); const s = (q.get('q') ?? '').trim(); const county = q.get('county'); const here = q.get('lat') != null && q.get('lng') != null;
    const cn = (id: string) => DB().counties?.find((c: Any) => c.id === id);
    return DB().mosques.filter((m: Any) => (!s || m.name.includes(s)) && (!county || m.countyId === county)).map((m: Any) => ({ id: m.id, name: m.name, address: m.address ?? null, lat: m.lat, lng: m.lng, verified: m.verified !== false, countyId: m.countyId, county: cn(m.countyId)?.name ?? '', provinceId: cn(m.countyId)?.provinceId ?? '', distance: here && isFinite(lat) && isFinite(lng) && m.lat ? Math.round(dist(lat, lng, m.lat, m.lng)) : null }))
      .sort((a: Any, b: Any) => (a.distance ?? 1e12) - (b.distance ?? 1e12)).slice(0, Number(q.get('limit')) || 8);
  });
  on('POST', '/v2/mosques', (_m: Any, b: Any) => {
    const u = me(); if (!b.name?.trim()) throw E(400, 'no_name', 'نام مسجد را بنویس');
    let countyId = b.countyId || null;
    if (!countyId && b.lat != null) { const n = DB().mosques.filter((m: Any) => m.lat).map((m: Any) => ({ m, d: dist(b.lat, b.lng, m.lat, m.lng) })).sort((x: Any, y: Any) => x.d - y.d)[0]; if (n && n.d <= 25000) countyId = n.m.countyId; }
    countyId ??= u.countyId; if (!countyId) throw E(400, 'no_county', 'شهرستان این مسجد را نتوانستیم بفهمیم؛ استان و شهرستانش را انتخاب کن');
    const m = { id: rid(), name: b.name.trim(), address: b.address?.trim() || null, countyId, lat: b.lat ?? null, lng: b.lng ?? null, verified: false, proposedBy: u.id, createdAt: now() };
    DB().mosques.push(m); return { id: m.id, name: m.name, address: m.address, verified: false, countyId, lat: m.lat, lng: m.lng, distance: 0 };
  });
  // ── نخستین ورود
  on('POST', '/v2/onboard', (_m: Any, b: Any) => {
    const u = me();
    if (b.firstName?.trim()) u.firstName = b.firstName.trim(); if (b.lastName?.trim()) u.lastName = b.lastName.trim();
    if (b.actorRole) u.actorRole = b.actorRole;
    if (b.mosqueId !== undefined) { u.mosqueId = b.mosqueId || null; const mq = DB().mosques.find((m: Any) => m.id === b.mosqueId); if (mq) { u.lat = mq.lat; u.lng = mq.lng; u.countyId = mq.countyId; } }
    if (b.lat != null && b.lng != null) { u.lat = b.lat; u.lng = b.lng; }
    if (b.relation) u.mosqueRelation = b.relation;
    else if (b.mosqueId && b.actorRole) u.mosqueRelation = ({ IMAM: 'امام جماعت', SHARIK: 'شریکة‌الامام', BAZU: 'بازو', HASTEH: 'عضو هسته', OTHER: 'نمازگزار' } as Record<string, string>)[b.actorRole];
    if (!u.countyId && b.countyId) u.countyId = b.countyId;
    if (!u.countyId) throw E(400, 'no_county', 'مسجدت را انتخاب کن یا دست‌کم شهرستانت را بگو');
    const main = mainFor(u.actorRole);
    u.mainPathId = main?.id ?? null;
    if (main && b.enrollMain !== false && !penr(u.id, main.id)) DB().pathEnr.push({ userId: u.id, pathId: main.id, enrolledAt: now(), completedAt: null });
    u.onboardedAt = now();
    return { ok: true, main: main ? pathView(main, u.id) : null };
  });
  on('GET', '/v2/onboard', () => { const u = me(); return { actorRole: u.actorRole ?? null, onboarded: !!u.onboardedAt || !!u.actorRole, mosque: u.mosqueId ? DB().mosques.find((m: Any) => m.id === u.mosqueId)?.name ?? null : null, mains: ACTOR_ROLES.map(([r, fa]) => { const p = mainFor(r); return { role: r, roleFa: fa, path: p ? { slug: p.slug, title: p.title, publisher: pubCard(p.publisherId)?.name, description: p.description, steps: p.steps.length, color: p.color } : null }; }) }; });

  // ── پنل برگزارکننده
  const pubOf = (uid: string) => DB().roles.find((r: Any) => r.userId === uid && r.role === 'ORG_ADMIN' && DB().publishers.some((p: Any) => p.id === r.networkId))?.networkId ?? null;
  const needPub = () => { const u = me(); const pid = pubOf(u.id); if (!pid) throw E(403, 'forbidden', 'این بخش برای برگزارکنندگان است'); return { u, pid }; };
  const statusFa: Record<string, string> = { DRAFT: 'پیش‌نویس', IN_REVIEW: 'در بازبینی', PUBLISHED: 'منتشرشده', RETURNED: 'نیاز به اصلاح', ARCHIVED: 'بایگانی' };
  const activeIn = (pid: string, cids: Set<string>) => DB().pathEnr.filter((e: Any) => e.pathId === pid).filter((e: Any) => DB().progress.some((x: Any) => x.userId === e.userId && new Date(x.updatedAt ?? 0).getTime() > Date.now() - 21 * DAY && cids.has(DB().modules.find((m: Any) => m.id === DB().lessons.find((l: Any) => l.id === x.lessonId)?.moduleId)?.courseId))).length;
  on('GET', '/v2/pub', () => {
    const { pid } = needPub(); const p = pub(pid);
    const paths = DB().paths2.filter((x: Any) => x.publisherId === pid).map((x: Any) => ({ id: x.id, slug: x.slug, title: x.title, size: x.size, sizeFa: SIZE_FA[x.size], status: x.status, statusFa: statusFa[x.status], returnNote: x.returnNote ?? null, enrolled: DB().pathEnr.filter((e: Any) => e.pathId === x.id).length, steps: x.steps.length, hasRahyar: !!x.hasRahyar, rahyar: rahyarOf(x.id), submittedAt: x.submittedAt ?? null }));
    const courses = DB().courses.filter((c: Any) => c.publisherId === pid).map((c: Any) => ({ id: c.id, slug: c.slug, title: c.title, status: c.reviewStatus ?? (c.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'), statusFa: statusFa[c.reviewStatus ?? (c.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT')], lessonCount: allLessons(c.id).length, learners: DB().enrollments.filter((e: Any) => e.courseId === c.id).length, libraryShare: c.libraryShare ?? 'all', version: c.version ?? 1, usedIn: DB().paths2.filter((x: Any) => x.publisherId !== pid && pathCourseIds(x).includes(c.id)).map((x: Any) => x.title) }));
    const lives = DB().events.filter((e: Any) => e.publisherId === pid && e.isLive).map((e: Any) => ({ id: e.id, title: e.title, startsAt: e.startsAt, status: e.reviewStatus ?? (e.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'), statusFa: statusFa[e.reviewStatus ?? (e.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT')], registered: DB().regs.filter((r: Any) => r.eventId === e.id).length }));
    const growth = DB().paths2.filter((x: Any) => x.publisherId === pid).reduce((a: number, x: Any) => a + DB().pathEnr.filter((e: Any) => e.pathId === x.id).reduce((s: number, e: Any) => s + growthSteps(e.userId, x), 0), 0);
    return { publisher: { id: p.id, name: p.name, color: p.color, status: p.status }, paths, courses, lives, stats: { enrolled: paths.reduce((a: number, x: Any) => a + x.enrolled, 0), growth, inReview: paths.filter((x: Any) => x.status === 'IN_REVIEW').length + courses.filter((c: Any) => c.status === 'IN_REVIEW').length + lives.filter((l: Any) => l.status === 'IN_REVIEW').length } };
  });
  on('GET', '/v2/pub/library', () => {
    const { pid } = needPub();
    const courses = DB().courses.filter((c: Any) => c.status === 'PUBLISHED' && (c.publisherId === pid || c.libraryShare !== 'none')).map((c: Any) => ({ kind: 'course', id: c.id, title: c.title, publisher: pubCard(c.publisherId), mine: c.publisherId === pid, needsApproval: c.publisherId !== pid && c.libraryShare === 'approve', version: c.version ?? 1 }));
    const paths = DB().paths2.filter((p: Any) => visible(p) && p.size !== 'macro').map((p: Any) => ({ kind: 'path', id: p.id, title: p.title, sizeFa: SIZE_FA[p.size], publisher: pubCard(p.publisherId), mine: p.publisherId === pid }));
    const lives = DB().events.filter((e: Any) => e.isLive && e.status === 'PUBLISHED').map((e: Any) => ({ kind: 'live', id: e.id, title: e.title, publisher: pubCard(e.publisherId), mine: e.publisherId === pid }));
    return { courses, paths, lives };
  });
  on('GET', '/v2/pub/paths/([^/]+)', (m: Any) => { const { pid } = needPub(); const p = PATH(m[1]); if (p.publisherId !== pid) throw E(403, 'forbidden', 'این مسیر مال برگزارکنندهٔ دیگری است'); return { ...p, view: pathView(p, undefined) }; });
  on('POST', '/v2/pub/paths', (_m: Any, b: Any) => {
    const { pid } = needPub();
    if (!b.title?.trim()) throw E(400, 'no_title', 'عنوان مسیر را بنویس');
    if (!['micro', 'mid', 'macro'].includes(b.size)) throw E(400, 'bad_size', 'اندازهٔ مسیر را انتخاب کن');
    const steps = (b.steps ?? []).map((s: Any, i: number) => ({ id: s.id ?? 's' + (i + 1), title: s.title?.trim() || (b.size === 'micro' ? `هفتهٔ ${i + 1}` : `پلهٔ ${i + 1}`), rule: s.rule ?? null, items: (s.items ?? []).filter((it: Any) => it.refId).map((it: Any) => ({ kind: it.kind, refId: it.refId, optional: !!it.optional, title: it.title })) }));
    let p = b.id ? DB().paths2.find((x: Any) => x.id === b.id && x.publisherId === pid) : null;
    if (!p) { p = { id: rid(), slug: 'path-' + rid().slice(0, 5), publisherId: pid, createdAt: now(), status: 'DRAFT', returnNote: null, mainFor: [] }; DB().paths2.push(p); }
    if (p.status === 'PUBLISHED' && b.title) { /* ویرایش مسیر منتشرشده: متن و پله‌ها به‌روز می‌شود؛ انتشار می‌ماند */ }
    Object.assign(p, { title: b.title.trim(), size: b.size, description: b.description?.trim() || null, audience: b.audience?.length ? b.audience : ['IMAM', 'SHARIK', 'BAZU', 'HASTEH'], color: b.color || pub(pid)?.color, hasRahyar: b.hasRahyar !== false, steps, updatedAt: now() });
    if (p.status === 'RETURNED') p.status = 'DRAFT';
    return { id: p.id, slug: p.slug, status: p.status };
  });
  on('POST', '/v2/pub/paths/([^/]+)/submit', (m: Any) => {
    const { pid } = needPub(); const p = PATH(m[1]); if (p.publisherId !== pid) throw E(403, 'forbidden', 'این مسیر مال شما نیست');
    const probs: string[] = [];
    if (!p.steps.length || p.steps.every((s: Any) => !s.items.length)) probs.push('مسیر دست‌کم یک دوره یا پخش زنده لازم دارد');
    if (p.hasRahyar && !pathCourseIds(p).some((cid) => allLessons(cid).some((l: Any) => l.type === 'MISSION'))) probs.push('مسیرِ با راهیار دست‌کم یک تکلیف میدانی لازم دارد');
    if (!p.description) probs.push('یک جمله برای کنشگر بنویس');
    if (probs.length) throw E(400, 'not_ready', probs.join('؛ '), { problems: probs });
    p.status = 'IN_REVIEW'; p.submittedAt = now();
    notify(DB().roles.filter((r: Any) => r.role === 'HQ_ADMIN').map((r: Any) => r.userId), { kind: 'review', title: `مسیر تازه برای بازبینی: ${p.title}`, body: pub(pid)?.name, link: '/admin/review' });
    return { ok: true, status: p.status };
  });
  on('POST', '/v2/pub/paths/([^/]+)/withdraw', (m: Any) => { const { pid } = needPub(); const p = PATH(m[1]); if (p.publisherId !== pid) throw E(403, 'forbidden', ''); p.status = 'DRAFT'; return { ok: true }; });
  on('POST', '/v2/pub/courses', (_m: Any, b: Any) => {
    const { pid } = needPub(); if (!b.title?.trim()) throw E(400, 'no_title', 'عنوان دوره را بنویس'); const t = now();
    const c = { id: rid(), slug: 'course-' + rid().slice(0, 5), title: b.title.trim(), subtitle: null, about: null, level: null, instructor: pub(pid)?.name ?? null, color: 'green', icon: 'book-open', status: 'DRAFT', isRestricted: false, passScore: 60, missionRule: 'ON_APPROVAL', hasCertificate: false, outcomes: [], version: 1, publishedAt: null, createdAt: t, updatedAt: t, publisherId: pid, libraryShare: b.libraryShare ?? 'all' };
    DB().courses.push(c); DB().modules.push({ id: rid(), courseId: c.id, title: 'درس‌ها', order: 0 }); return c;
  });
  on('PATCH', '/v2/pub/courses/([^/]+)', (m: Any, b: Any) => { const { pid } = needPub(); const c = C(m[1]); if (c.publisherId !== pid) throw E(403, 'forbidden', ''); if (b.libraryShare) c.libraryShare = b.libraryShare; if (b.proposeTo !== undefined) c.proposeTo = b.proposeTo; return { ok: true }; });
  on('POST', '/v2/pub/courses/([^/]+)/submit', (m: Any) => {
    const { pid } = needPub(); const c = C(m[1]); if (c.publisherId !== pid) throw E(403, 'forbidden', '');
    if (!allLessons(c.id).length) throw E(400, 'not_ready', 'دوره هنوز درسی ندارد');
    c.reviewStatus = 'IN_REVIEW'; c.submittedAt = now(); notify(DB().roles.filter((r: Any) => r.role === 'HQ_ADMIN').map((r: Any) => r.userId), { kind: 'review', title: `دورهٔ تازه برای بازبینی: ${c.title}`, body: pub(pid)?.name, link: '/admin/review' }); return { ok: true };
  });
  on('GET', '/v2/rahyar/learners/:id/paths', (_b: Any, prm: Any) => {
    const u = me(); const lid = prm.id;
    const paths = DB().pathEnr.filter((e: Any) => e.userId === lid).map((e: Any) => DB().paths2.find((x: Any) => x.id === e.pathId)).filter((p: Any) => p && (staff() || DB().pathRahyars.some((r: Any) => r.pathId === p.id && r.userId === u.id)))
      .map((p: Any) => ({ ...pathView(p, lid), canAssess: true, assessments: (DB().pathAssess ?? []).filter((a: Any) => a.pathId === p.id && a.userId === lid) }));
    return { learner: nm(lid), paths };
  });
  on('POST', '/v2/rahyar/assess/:id', (b: Any, prm: Any) => {
    const u = me(); const p = PATH(b.pathId);
    if (!staff() && !DB().pathRahyars.some((r: Any) => r.pathId === p.id && r.userId === u.id)) throw E(403, 'forbidden', 'فقط راهیار این مسیر دیدار میدانی را ثبت می‌کند');
    const db = DB(); db.pathAssess = db.pathAssess ?? []; db.pathAssess.push({ pathId: p.id, stepId: b.stepId, userId: prm.id, byId: u.id, note: b.note || null, at: new Date().toISOString() });
    notify(prm.id, { kind: 'GROWTH', title: `گام رشدت در «${p.title}» تأیید شد`, link: `/paths/${p.slug}` });
    return { ok: true };
  });
  on('GET', '/v2/pub/rahyars', () => {
    const { pid } = needPub();
    const paths = DB().paths2.filter((p: Any) => p.publisherId === pid && p.hasRahyar);
    const rows = DB().pathRahyars.filter((r: Any) => paths.some((p: Any) => p.id === r.pathId)).map((r: Any) => { const u = U(r.userId); const p = paths.find((x: Any) => x.id === r.pathId); const learners = DB().pathEnr.filter((e: Any) => e.pathId === r.pathId).length; return { userId: r.userId, name: nm(r.userId), mobile: u ? u.mobile.slice(0, 4) + '…' + u.mobile.slice(-3) : '', path: { id: p.id, title: p.title }, learners, avgDays: 1.8 }; });
    const missing = paths.filter((p: Any) => !DB().pathRahyars.some((r: Any) => r.pathId === p.id)).map((p: Any) => ({ id: p.id, title: p.title, learners: DB().pathEnr.filter((e: Any) => e.pathId === p.id).length }));
    return { rows, missing, paths: paths.map((p: Any) => ({ id: p.id, title: p.title })) };
  });
  on('POST', '/v2/pub/rahyars', (_m: Any, b: Any) => {
    const { pid } = needPub(); const p = PATH(b.pathId); if (p.publisherId !== pid) throw E(403, 'forbidden', '');
    const mob = X.normMobile(b.mobile); if (!mob) throw E(400, 'bad_mobile', 'شماره باید ۱۱ رقم باشد و با ۰۹ شروع شود');
    let u = DB().users.find((x: Any) => x.mobile === mob);
    if (!u) { u = { id: rid(), mobile: mob, firstName: 'راهیار', lastName: 'دعوت‌شده', gender: null, countyId: null, mosqueId: null, nearMosque: null, nationalId: null, isActive: true, createdAt: now(), invited: true }; DB().users.push(u); }
    if (!rolesOf(u.id).includes('RAHYAR')) DB().roles.push({ userId: u.id, role: 'RAHYAR' });
    DB().pathRahyars = DB().pathRahyars.filter((r: Any) => r.pathId !== p.id).concat({ pathId: p.id, userId: u.id });
    notify(u.id, { kind: 'rahyar', title: `${pub(pid)?.name} تو را راهیار مسیر «${p.title}» کرد`, link: '/rahyar' });
    return { ok: true };
  });
  on('GET', '/v2/pub/impact', () => {
    const { pid } = needPub();
    const rows = DB().paths2.filter((p: Any) => p.publisherId === pid && p.status === 'PUBLISHED').map((p: Any) => { const cids = new Set(pathCourseIds(p)); const en = DB().pathEnr.filter((e: Any) => e.pathId === p.id); const active = activeIn(p.id, cids); return { id: p.id, title: p.title, sizeFa: SIZE_FA[p.size], enrolled: en.length, active, growth: en.reduce((s: number, e: Any) => s + growthSteps(e.userId, p), 0), dropped: Math.max(0, en.length - active), rahyar: rahyarOf(p.id)?.name ?? null }; });
    const others = DB().courses.filter((c: Any) => c.publisherId === pid).map((c: Any) => ({ title: c.title, paths: DB().paths2.filter((x: Any) => x.publisherId !== pid && visible(x) && pathCourseIds(x).includes(c.id)).map((x: Any) => ({ title: x.title, publisher: pubCard(x.publisherId)?.name })) })).filter((x: Any) => x.paths.length);
    return { rows, others, totals: { enrolled: rows.reduce((a: number, r: Any) => a + r.enrolled, 0), active: rows.reduce((a: number, r: Any) => a + r.active, 0), growth: rows.reduce((a: number, r: Any) => a + r.growth, 0) } };
  });

  // ── ستاد: بازبینی و برگزارکنندگان
  on('GET', '/v2/admin/review', () => {
    staff();
    const items: Any[] = [];
    for (const p of DB().paths2.filter((x: Any) => x.status === 'IN_REVIEW')) items.push({ kind: 'path', id: p.id, title: p.title, kindFa: SIZE_FA[p.size], publisher: pubCard(p.publisherId), submittedAt: p.submittedAt ?? p.createdAt, facts: [['اندازه', `${p.steps.length} ${p.size === 'micro' ? 'هفته' : 'پله'}`], ['محتوا', `${pathCourseIds(p).length} دوره`], ['راهیار', p.hasRahyar ? (rahyarOf(p.id)?.name ?? 'تعیین نشده') : 'ندارد']], checks: ['مخاطب و پله‌ها روشن است', 'هر پله دست‌کم یک کار میدانی دارد', 'محتوای دیگران با نام سازنده آمده', 'حریم: کاربرگ‌ها نکتهٔ آبرویی نمی‌خواهند'], preview: `/paths/${p.slug}` });
    for (const c of DB().courses.filter((x: Any) => x.reviewStatus === 'IN_REVIEW')) items.push({ kind: 'course', id: c.id, title: c.title, kindFa: 'دوره', publisher: pubCard(c.publisherId), submittedAt: c.submittedAt, facts: [['درس‌ها', String(allLessons(c.id).length)], ['کتابخانه', c.libraryShare === 'none' ? 'خصوصی' : c.libraryShare === 'approve' ? 'با تأیید سازنده' : 'عمومی']], checks: ['هر درس یک کار دارد', 'تکلیف میدانی روشن است'], preview: `/courses/${c.slug}` });
    for (const e of DB().events.filter((x: Any) => x.reviewStatus === 'IN_REVIEW')) items.push({ kind: 'live', id: e.id, title: e.title, kindFa: 'پخش زنده', publisher: pubCard(e.publisherId), submittedAt: e.submittedAt, facts: [['زمان', e.startsAt], ['ظرفیت', e.capacity ? String(e.capacity) : 'بی‌سقف']], checks: ['عنوان و زمان درست است', 'مجری معرفی شده'], preview: null });
    for (const p of DB().publishers.filter((x: Any) => x.status === 'PENDING')) items.push({ kind: 'publisher', id: p.id, title: p.name, kindFa: 'برگزارکنندهٔ تازه', publisher: null, submittedAt: p.createdAt, facts: [['نوع', p.kind], ['معرف', p.referrer]], checks: ['هویت تأیید شده', 'معرف معتبر', 'تعهد حریم امضا شده'], preview: null });
    items.sort((a, b) => String(a.submittedAt).localeCompare(String(b.submittedAt)));
    return { items, stats: { queue: items.length, publishers: DB().publishers.filter((p: Any) => p.status === 'ACTIVE').length, growthThisSeason: DB().pathEnr.reduce((s: number, e: Any) => s + growthSteps(e.userId, DB().paths2.find((p: Any) => p.id === e.pathId)), 0) } };
  });
  on('POST', '/v2/admin/review/([^/]+)/([^/]+)', (m: Any, b: Any) => {
    const u = staff(); const [, kind, id] = m; const ok = b.action === 'publish';
    if (!ok && !b.note?.trim()) throw E(400, 'need_note', 'برای برگرداندن، دلیل را بنویس');
    let title = '', owner: string[] = [];
    if (kind === 'path') { const p = PATH(id); p.status = ok ? 'PUBLISHED' : 'RETURNED'; p.returnNote = ok ? null : b.note; p.reviewedAt = now(); title = p.title; owner = adminsOf(p.publisherId); }
    else if (kind === 'course') { const c = C(id); c.reviewStatus = ok ? 'PUBLISHED' : 'RETURNED'; if (ok) { c.status = 'PUBLISHED'; c.publishedAt = now(); } c.returnNote = ok ? null : b.note; title = c.title; owner = adminsOf(c.publisherId); }
    else if (kind === 'live') { const e = DB().events.find((x: Any) => x.id === id); if (!e) throw E(404, 'no_event', ''); e.reviewStatus = ok ? 'PUBLISHED' : 'RETURNED'; if (ok) e.status = 'PUBLISHED'; e.returnNote = ok ? null : b.note; title = e.title; owner = adminsOf(e.publisherId); }
    else if (kind === 'publisher') { const p = pub(id); if (!p) throw E(404, 'no_pub', ''); p.status = ok ? 'ACTIVE' : 'REJECTED'; p.note = b.note ?? null; title = p.name; }
    if (owner.length) notify(owner, { kind: 'review', title: ok ? `«${title}» منتشر شد` : `«${title}» برگشت: ${b.note}`, link: '/pub' });
    DB().audit.unshift({ id: rid(), actorId: u.id, action: ok ? 'review.publish' : 'review.return', target: id, createdAt: now() });
    return { ok: true };
  });
  const adminsOf = (pid: string) => DB().roles.filter((r: Any) => r.role === 'ORG_ADMIN' && r.networkId === pid).map((r: Any) => r.userId);
  on('GET', '/v2/admin/publishers', () => { staff(); return DB().publishers.map((p: Any) => ({ ...p, paths: DB().paths2.filter((x: Any) => x.publisherId === p.id && x.status === 'PUBLISHED').length, courses: DB().courses.filter((c: Any) => c.publisherId === p.id).length, learners: DB().pathEnr.filter((e: Any) => DB().paths2.find((x: Any) => x.id === e.pathId)?.publisherId === p.id).length, admins: adminsOf(p.id).map(nm) })); });
  on('POST', '/v2/admin/publishers', (_m: Any, b: Any) => { staff(); if (!b.name?.trim()) throw E(400, 'no_name', 'نام برگزارکننده را بنویس'); const p = { id: rid(), name: b.name.trim(), color: b.color || '#8C93B5', status: 'ACTIVE', kind: b.kind ?? 'مؤسسه', referrer: b.referrer ?? 'ستاد', createdAt: now() }; DB().publishers.push(p); if (!DB().networks.some((n: Any) => n.id === p.id)) DB().networks.push({ id: p.id, kind: 'ORGANIZATION', name: p.name, underRahyar: false }); return p; });
  on('PATCH', '/v2/admin/publishers/([^/]+)', (m: Any, b: Any) => { staff(); const p = pub(m[1]); if (!p) throw E(404, 'no_pub', ''); if (b.status) { if (b.status === 'BLOCKED' && !b.note?.trim()) throw E(400, 'need_note', 'دلیل مسدود کردن را بنویس'); p.status = b.status; p.note = b.note ?? p.note; } if (b.adminMobile) { const mob = X.normMobile(b.adminMobile); const u = DB().users.find((x: Any) => x.mobile === mob); if (!u) throw E(404, 'no_user', 'کاربری با این شماره نیست'); DB().roles.push({ userId: u.id, role: 'ORG_ADMIN', networkId: p.id }); } return { ok: true }; });

  // ── نمایهٔ کاربر: نقش و مسیر اصلی در /auth/me
  X.wrap('GET', '/auth/me', (orig: Any) => (m: Any, b: Any, q: Any) => { const r = orig(m, b, q); const u = me(); const pid = pubOf(u.id); return { ...r, actorRole: u.actorRole ?? null, mainPathId: u.mainPathId ?? null, onboarded: !!(u.onboardedAt || u.actorRole), publisher: pid ? pubCard(pid) : null, location: u.lat != null ? { lat: u.lat, lng: u.lng } : null }; });
  X.wrap('POST', '/auth/register', (orig: Any) => (m: Any, b: Any, q: Any) => { const r = orig(m, b, q); return { ...r, user: { ...r.user, onboarded: false, actorRole: null } }; });
}

/* ───────── استودیوی استاد: دوره‌های من، پرسش‌ها، پخش‌های زنده، تحلیل ───────── */
export function seedStudio(db: Any) {
  const t = Date.now();
  const kashan = db.counties.find((c: Any) => c.name === 'کاشان');
  db.users.push({ id: 'p-ostad', mobile: '09128888888', firstName: 'حجت‌الاسلام', lastName: 'قاسمی', gender: 'MALE', countyId: kashan?.id, mosqueId: null, nearMosque: null, nationalId: null, isActive: true, createdAt: iso(t - 200 * DAY), actorRole: 'OTHER', onboardedAt: iso(t - 200 * DAY) });
  db.roles.push({ userId: 'p-ostad', role: 'INSTRUCTOR' });
  for (const slug of ['nojavan-1', 'nojavan-2', 'nj1', 'nj2', 'mq1']) { const c = db.courses.find((x: Any) => x.slug === slug); if (c) { c.instructorId = 'p-ostad'; c.instructor = 'حجت‌الاسلام قاسمی'; } }
  for (const e of db.events) if (e.isLive && e.publisherId === 'pub-hedayat') e.instructorId = 'p-ostad';
  const l = db.lessons.find((x: Any) => db.modules.find((m: Any) => m.id === x.moduleId)?.courseId === db.courses.find((c: Any) => c.slug === 'nojavan-1')?.id);
  if (l && db.questions) db.questions.push({ id: 'q-ostad1', userId: 'sample3', courseId: db.modules.find((m: Any) => m.id === l.moduleId)?.courseId, lessonId: l.id, title: 'نوجوانی که دعوت را رد کرد، دوباره دعوت کنم؟', body: 'یک بار گفت نه. چند روز صبر کنم؟', createdAt: iso(t - DAY) });
}

export function registerStudio(X: Any) {
  const { on, E, me, rolesOf, rid, now, notify, nm, U, C, allLessons, normMobile } = X;
  const DB = () => X.db;
  const needOstad = () => { const u = me(); if (!rolesOf(u.id).includes('INSTRUCTOR') && !rolesOf(u.id).includes('HQ_ADMIN')) throw E(403, 'forbidden', 'این بخش برای استادهاست'); return u; };
  const myCourses = (uid: string) => DB().courses.filter((c: Any) => c.instructorId === uid);
  const lessonStats = (l: Any) => { const ps = DB().progress.filter((p: Any) => p.lessonId === l.id); const done = ps.filter((p: Any) => p.completedAt).length; const avgPos = ps.length && l.durationSec ? Math.round(ps.reduce((a: number, p: Any) => a + Math.min(1, (p.positionSec ?? 0) / l.durationSec), 0) / ps.length * 100) : null; return { started: ps.length, done, avgPos }; };
  on('GET', '/v2/studio', () => {
    const u = needOstad();
    const courses = myCourses(u.id).map((c: Any) => { const ls = allLessons(c.id); const learners = DB().enrollments.filter((e: Any) => e.courseId === c.id); const completed = learners.filter((e: Any) => e.completedAt).length; const st = c.reviewStatus ?? (c.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'); return { id: c.id, slug: c.slug, title: c.title, status: st, statusFa: { DRAFT: 'پیش‌نویس', IN_REVIEW: 'در بازبینی', PUBLISHED: 'منتشرشده', RETURNED: 'نیاز به اصلاح' }[st as string], returnNote: c.returnNote ?? null, lessonCount: ls.length, learners: learners.length, completed, publisher: DB().publishers.find((p: Any) => p.id === c.publisherId)?.name ?? null, missing: ls.filter((l: Any) => l.type === 'AUDIO' || l.type === 'VIDEO').filter((l: Any) => !l.content || !Object.keys(l.content).length).length }; });
    const myLessonIds = new Set(myCourses(u.id).flatMap((c: Any) => allLessons(c.id).map((l: Any) => l.id)));
    const qs = (DB().questions ?? []).filter((q: Any) => q.lessonId && myLessonIds.has(q.lessonId)).map((q: Any) => { const l = DB().lessons.find((x: Any) => x.id === q.lessonId); const answers = (DB().answers ?? []).filter((a: Any) => a.questionId === q.id); return { id: q.id, title: q.title, body: q.body, by: nm(q.userId), lesson: l?.title ?? '', createdAt: q.createdAt, answers: answers.length, answeredByMe: answers.some((a: Any) => a.userId === u.id) }; }).sort((a: Any, b: Any) => Number(a.answeredByMe) - Number(b.answeredByMe) || b.createdAt.localeCompare(a.createdAt));
    const lives = DB().events.filter((e: Any) => e.isLive && (e.instructorId === u.id || e.createdById === u.id)).map((e: Any) => ({ id: e.id, title: e.title, startsAt: e.startsAt, endsAt: e.endsAt, status: e.reviewStatus ?? e.status, registered: DB().regs.filter((r: Any) => r.eventId === e.id).length, attended: DB().regs.filter((r: Any) => r.eventId === e.id && r.attendedAt).length, record: !!e.record, past: new Date(e.endsAt).getTime() < Date.now() }));
    const analytics = myCourses(u.id).flatMap((c: Any) => allLessons(c.id).map((l: Any) => ({ course: c.title, lesson: l.title, type: l.type, durationSec: l.durationSec, ...lessonStats(l) }))).filter((x: Any) => x.started > 0).sort((a: Any, b: Any) => (a.done / a.started) - (b.done / b.started)).slice(0, 8);
    return { courses, questions: qs, lives, analytics, totals: { learners: courses.reduce((a: number, c: Any) => a + c.learners, 0), unanswered: qs.filter((q: Any) => !q.answeredByMe).length, nextLive: lives.find((l: Any) => !l.past) ?? null } };
  });
  on('POST', '/v2/studio/courses', (_m: Any, b: Any) => {
    const u = needOstad(); if (!b.title?.trim()) throw E(400, 'no_title', 'عنوان دوره را بنویس'); const t = now();
    const pid = DB().roles.find((r: Any) => r.userId === u.id && r.role === 'ORG_ADMIN')?.networkId ?? myCourses(u.id)[0]?.publisherId ?? 'pub-hedayat';
    const c = { id: rid(), slug: 'course-' + rid().slice(0, 5), title: b.title.trim(), subtitle: null, about: null, level: null, instructor: nm(u.id), instructorId: u.id, color: 'green', icon: 'book-open', status: 'DRAFT', isRestricted: false, passScore: 60, missionRule: 'ON_APPROVAL', hasCertificate: false, outcomes: [], version: 1, publishedAt: null, createdAt: t, updatedAt: t, publisherId: pid, libraryShare: 'all' };
    DB().courses.push(c); DB().modules.push({ id: rid(), courseId: c.id, title: 'درس‌ها', order: 0 }); return c;
  });
  on('POST', '/v2/studio/courses/([^/]+)/submit', (m: Any) => { const u = needOstad(); const c = C(m[1]); if (c.instructorId !== u.id) throw E(403, 'forbidden', 'این دوره مال شما نیست'); if (!allLessons(c.id).length) throw E(400, 'not_ready', 'دوره هنوز درسی ندارد'); c.reviewStatus = 'IN_REVIEW'; c.submittedAt = now(); notify(DB().roles.filter((r: Any) => r.role === 'HQ_ADMIN').map((r: Any) => r.userId), { kind: 'review', title: `دورهٔ تازه برای بازبینی: ${c.title}`, body: nm(u.id), link: '/admin/review' }); return { ok: true }; });
  // برگزارکننده استاد را به دوره می‌سپارد
  on('POST', '/v2/pub/courses/([^/]+)/instructor', (m: Any, b: Any) => {
    const u = me(); const pid = DB().roles.find((r: Any) => r.userId === u.id && r.role === 'ORG_ADMIN')?.networkId; const c = C(m[1]); if (!pid || c.publisherId !== pid) throw E(403, 'forbidden', 'این دوره مال شما نیست');
    const mob = normMobile(b.mobile); if (!mob) throw E(400, 'bad_mobile', 'شماره باید ۱۱ رقم باشد و با ۰۹ شروع شود');
    let t = DB().users.find((x: Any) => x.mobile === mob);
    if (!t) { t = { id: rid(), mobile: mob, firstName: 'استاد', lastName: 'دعوت‌شده', gender: null, countyId: null, mosqueId: null, nearMosque: null, nationalId: null, isActive: true, createdAt: now(), invited: true, onboardedAt: now() }; DB().users.push(t); }
    if (!rolesOf(t.id).includes('INSTRUCTOR')) DB().roles.push({ userId: t.id, role: 'INSTRUCTOR' });
    c.instructorId = t.id; c.instructor = nm(t.id); notify(t.id, { kind: 'studio', title: `دورهٔ «${c.title}» به استودیوی تو سپرده شد`, link: '/studio' }); return { ok: true, instructor: nm(t.id) };
  });
  X.wrap('GET', '/v2/pub', (orig: Any) => (m: Any, b: Any, q: Any) => { const r = orig(m, b, q); return { ...r, courses: r.courses.map((c: Any) => ({ ...c, instructor: DB().courses.find((x: Any) => x.id === c.id)?.instructorId ? nm(DB().courses.find((x: Any) => x.id === c.id).instructorId) : null })) }; });
  void U;
}
