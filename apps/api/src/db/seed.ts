/**
 * دادهٔ اولیه.
 * - همیشه: استان‌ها و شهرستان‌های مرکزی، شبکه‌های برادران و بانور.
 * - فقط با SEED_DEMO=true: چند دورهٔ نمونه، مسیر نمونه و چند مسجد نمونه برای آزمایش.
 * اجرای دوباره بی‌خطر است (چیزی تکراری ساخته نمی‌شود).
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { and, eq } from 'drizzle-orm';
import { Pool } from 'pg';
import { config } from '../config';
import * as s from './schema';

const GEO: Record<string, string[]> = {
  'آذربایجان شرقی': ['تبریز', 'مراغه', 'مرند'], 'آذربایجان غربی': ['ارومیه', 'خوی', 'مهاباد'], 'اردبیل': ['اردبیل', 'مشگین‌شهر'],
  'اصفهان': ['اصفهان', 'کاشان', 'نجف‌آباد', 'خمینی‌شهر', 'شاهین‌شهر'], 'البرز': ['کرج', 'فردیس', 'نظرآباد'], 'ایلام': ['ایلام', 'دهلران'],
  'بوشهر': ['بوشهر', 'برازجان'], 'تهران': ['تهران', 'ری', 'شهریار', 'اسلامشهر', 'ورامین'], 'چهارمحال و بختیاری': ['شهرکرد', 'بروجن'],
  'خراسان جنوبی': ['بیرجند', 'قائن'], 'خراسان رضوی': ['مشهد', 'نیشابور', 'سبزوار'], 'خراسان شمالی': ['بجنورد', 'شیروان'],
  'خوزستان': ['اهواز', 'دزفول', 'آبادان'], 'زنجان': ['زنجان', 'ابهر'], 'سمنان': ['سمنان', 'شاهرود'], 'سیستان و بلوچستان': ['زاهدان', 'زابل', 'چابهار'],
  'فارس': ['شیراز', 'مرودشت', 'کازرون'], 'قزوین': ['قزوین', 'تاکستان'], 'قم': ['قم'], 'کردستان': ['سنندج', 'سقز'], 'کرمان': ['کرمان', 'رفسنجان', 'سیرجان'],
  'کرمانشاه': ['کرمانشاه', 'اسلام‌آباد غرب'], 'کهگیلویه و بویراحمد': ['یاسوج', 'گچساران'], 'گلستان': ['گرگان', 'گنبد کاووس'], 'گیلان': ['رشت', 'لاهیجان', 'انزلی'],
  'لرستان': ['خرم‌آباد', 'بروجرد'], 'مازندران': ['ساری', 'بابل', 'آمل'], 'مرکزی': ['اراک', 'ساوه'], 'هرمزگان': ['بندرعباس', 'میناب'], 'همدان': ['همدان', 'ملایر'], 'یزد': ['یزد', 'میبد'],
};

/** برگزارکننده‌ها و مسیرهای اصلیِ هر نقش. همیشه اجرا می‌شود (نه فقط با SEED_DEMO)؛ اگر از قبل باشد دست نمی‌زند. */
async function paths2Seed(db: ReturnType<typeof drizzle<typeof s>>) {
  const pubs = [
    { id: 'pub-hedayat', name: 'بنیاد هدایت', color: '#1E3A9E', kind: 'بنیاد' },
    { id: 'pub-kanoon', name: 'کانون نوجوانان مسجد', color: '#2E7D4F', kind: 'مؤسسه' },
  ];
  for (const p of pubs) await db.insert(s.publishers).values({ ...p, status: 'ACTIVE' }).onConflictDoNothing();

  const skel = async (slug: string, publisherId: string, d: Partial<typeof s.courses.$inferInsert>, body: string) => {
    const found = await db.query.courses.findFirst({ where: eq(s.courses.slug, slug) });
    if (found) return found;
    const [c] = await db.insert(s.courses).values({ slug, title: d.title!, instructor: 'گروه مدرسان', missionRule: 'ON_APPROVAL', ...d, publisherId, libraryShare: 'all', status: 'PUBLISHED', reviewStatus: 'PUBLISHED', publishedAt: new Date() }).returning();
    const [mod] = await db.insert(s.modules).values({ courseId: c.id, title: 'جلسهٔ ۱', order: 0 }).returning();
    await db.insert(s.lessons).values({ moduleId: mod.id, order: 0, title: 'شروع', type: 'TEXT', durationSec: 300, content: { body } });
    return c;
  };
  const imam = [
    await skel('taayon-1', 'pub-hedayat', { title: 'امام کیست؟', subtitle: 'جایگاه امام در محله', level: 'مقدماتی', color: 'blue', icon: 'landmark' }, 'امامت یک جایگاه است، نه یک شغل. در این دوره با سه نقش امام در محله آشنا می‌شوید: پیش‌نماز، مربی، و گره‌گشای اهالی.'),
    await skel('taayon-2', 'pub-hedayat', { title: 'نگاه به محله', subtitle: 'شناخت اهالی و نیازها', level: 'مقدماتی', color: 'blue', icon: 'map' }, 'پیش از هر برنامه، محله را ببینید: کوچه‌ها، خانواده‌ها، نوجوان‌ها، سالمندان. این دوره روش ساده‌ای برای نقشهٔ محله می‌دهد.'),
    await skel('taayon-3', 'pub-hedayat', { title: 'برنامهٔ سال اول', subtitle: 'از منبر تا دیدار خانگی', level: 'میانی', color: 'blue', icon: 'calendar' }, 'سال اول امامت با یک برنامهٔ کوچک و قابل اجرا شروع می‌شود، نه با وعده‌های بزرگ.'),
  ];
  const sharik = [
    await skel('sharik-1', 'pub-hedayat', { title: 'شریکة‌الامام یعنی چه؟', subtitle: 'نقش بانوی امام در محله', level: 'مقدماتی', color: 'rose', icon: 'heart' }, 'شریکة‌الامام شریکِ رسالت است، نه فقط همسر. در این دوره نقش او در ارتباط با بانوان و خانواده‌های محله مرور می‌شود.'),
    await skel('sharik-2', 'pub-hedayat', { title: 'حلقهٔ بانوان', subtitle: 'راه‌اندازی اولین حلقه', level: 'میانی', color: 'rose', icon: 'users' }, 'اولین حلقهٔ بانوان با سه نفر شروع می‌شود. اینجا یاد می‌گیرید چطور دعوت کنید، جلسه را بگردانید و ادامه بدهید.'),
  ];
  const kanoon = await db.query.courses.findFirst({ where: eq(s.courses.slug, 'nojavan-1') });
  const kanoon2 = await db.query.courses.findFirst({ where: eq(s.courses.slug, 'nojavan-2') });
  const hasteh = [
    kanoon ?? await skel('hasteh-1', 'pub-kanoon', { title: 'عضو هسته', subtitle: 'اولین قدم در کانون نوجوانان', level: 'مقدماتی', color: 'green', icon: 'users' }, 'هستهٔ نوجوانان مسجد با چند نفر که به هم اعتماد دارند شروع می‌شود. این دوره قواعد سادهٔ یک هستهٔ خوب را می‌گوید.'),
    kanoon2 ?? await skel('hasteh-2', 'pub-kanoon', { title: 'از عضو تا مربی', subtitle: 'مسئولیت گرفتن در هسته', level: 'میانی', color: 'green', icon: 'flag' }, 'مربی هسته کسی است که خودش عضو بوده و حالا جمع را نگه می‌دارد. اینجا تمرین مسئولیت‌پذیری است.'),
  ];
  for (const c of [...imam, ...sharik, ...hasteh]) if (!c.publisherId) await db.update(s.courses).set({ publisherId: c.slug.startsWith('nojavan') ? 'pub-kanoon' : 'pub-hedayat', libraryShare: 'all', reviewStatus: 'PUBLISHED' }).where(eq(s.courses.id, c.id));

  const step = (id: string, title: string, cs: { id: string; title: string }[], rule: string | null = null, assess = false): s.PathStep =>
    ({ id, title, rule, items: [...cs.map((c) => ({ kind: 'course' as const, refId: c.id, title: c.title })), ...(assess ? [{ kind: 'assess' as const, refId: 'rahyar', title: 'تأیید راهیار' }] : [])] });
  const path = async (slug: string, d: Omit<typeof s.paths2.$inferInsert, 'slug' | 'steps'>, steps: s.PathStep[]) => {
    if (await db.query.paths2.findFirst({ where: eq(s.paths2.slug, slug) })) return;
    await db.insert(s.paths2).values({ slug, ...d, steps, status: 'PUBLISHED', reviewedAt: new Date() });
  };
  await path('taayon-emamat', { title: 'تعیّن امامت', size: 'macro', publisherId: 'pub-hedayat', audience: ['IMAM'], mainFor: ['IMAM'], color: '#1E3A9E', description: 'مسیر اصلی امام محله: از شناخت جایگاه امامت تا برنامهٔ سال اول، با همراهی راهیار.' },
    [step('s1', 'شناخت', [imam[0]]), step('s2', 'محله', [imam[1]], 'پس از پلهٔ یک', true), step('s3', 'برنامه', [imam[2]], 'پس از تأیید راهیار', true)]);
  await path('sharikat-ol-emam', { title: 'شریکة‌الامام', size: 'macro', publisherId: 'pub-hedayat', audience: ['SHARIK'], mainFor: ['SHARIK'], color: '#B2456E', description: 'مسیر اصلی بانوی امام: نقش شریکة‌الامام و راه‌اندازی حلقهٔ بانوان محله.' },
    [step('s1', 'نقش', [sharik[0]]), step('s2', 'حلقه', [sharik[1]], 'پس از پلهٔ یک', true)]);
  await path('ozv-ta-morabbi', { title: 'از عضو تا مربی هسته', size: 'macro', publisherId: 'pub-kanoon', audience: ['BAZU', 'HASTEH'], mainFor: ['BAZU', 'HASTEH'], color: '#2E7D4F', description: 'مسیر اصلی بازوها و اعضای هسته: از عضویت در هستهٔ نوجوانان تا مربی‌گری.' },
    [step('s1', 'عضو', [hasteh[0]]), step('s2', 'مربی', [hasteh[1]], 'پس از پلهٔ یک', true)]);
  console.log('مسیرهای اصلی آماده است');
}

async function main() {
  const pool = new Pool({ connectionString: config.databaseUrl });
  const db = drizzle(pool, { schema: s });

  for (const [pname, cs] of Object.entries(GEO)) {
    await db.insert(s.provinces).values({ name: pname }).onConflictDoNothing();
    const p = (await db.query.provinces.findFirst({ where: eq(s.provinces.name, pname) }))!;
    for (const c of cs) await db.insert(s.counties).values({ name: c, provinceId: p.id }).onConflictDoNothing();
  }
  for (const [kind, name] of [['BROTHERS', 'شبکهٔ راهیاری برادران'], ['BANOUR', 'شبکهٔ بانور']] as const) {
    if (!(await db.query.networks.findFirst({ where: eq(s.networks.kind, kind) }))) await db.insert(s.networks).values({ kind, name });
  }
  console.log('دادهٔ پایه آماده است');

  if (process.env.SEED_DEMO === 'true') await demo(db);
  await paths2Seed(db);
  await pool.end();
}

async function demo(db: ReturnType<typeof drizzle<typeof s>>) {
  const county = async (n: string) => (await db.query.counties.findFirst({ where: eq(s.counties.name, n) }))!;
  for (const [m, c] of [['مسجد جامع', 'کاشان'], ['مسجد امام حسن (ع)', 'اصفهان'], ['مسجد الغدیر', 'قم'], ['مسجد امام رضا (ع)', 'کاشان']] as const) {
    const ct = await county(c);
    if (!(await db.query.mosques.findFirst({ where: and(eq(s.mosques.name, m), eq(s.mosques.countyId, ct.id)) }))) {
      await db.insert(s.mosques).values({ name: m, countyId: ct.id, verified: true });
    }
  }

  const course = async (slug: string, d: Partial<typeof s.courses.$inferInsert>, mods: { title: string; lessons: Partial<typeof s.lessons.$inferInsert>[] }[]) => {
    const found = await db.query.courses.findFirst({ where: eq(s.courses.slug, slug) });
    if (found) return found;
    const [c] = await db.insert(s.courses).values({ slug, title: d.title!, ...d, status: 'PUBLISHED', publishedAt: new Date() }).returning();
    for (const [mi, m] of mods.entries()) {
      const [mod] = await db.insert(s.modules).values({ courseId: c.id, title: m.title, order: mi }).returning();
      for (const [li, l] of m.lessons.entries()) await db.insert(s.lessons).values({ moduleId: mod.id, order: li, title: l.title!, type: l.type!, ...l });
    }
    return c;
  };

  const quiz = (qs: [string, string[], number, string][]) => ({
    questions: qs.map(([text, opts, right, explain], i) => ({
      id: 'q' + (i + 1), kind: 'single', text, options: opts.map((o, j) => ({ id: 'o' + (j + 1), text: o })), correct: ['o' + (right + 1)], explain,
    })),
  });

  const nj1 = await course('nojavan-1', {
    title: 'همراهی نوجوانان در مسجد', subtitle: 'از اولین سلام تا سپردن مسئولیت', level: 'مقدماتی', instructor: 'گروه مدرسان', color: 'green', icon: 'users',
    about: 'نوجوان وقتی در مسجد می‌ماند که دیده شود و نقشی داشته باشد. این دوره قدم‌به‌قدم نشان می‌دهد چطور با نوجوان‌های محله ارتباط بگیرید، اعتمادشان را جلب کنید و کم‌کم مسئولیت بسپارید.',
    outcomes: ['اولین گفت‌وگو با یک نوجوان را بدون تکلف شروع کنید', 'نشانه‌های بی‌علاقگی را زود ببینید', 'یک مسئولیت کوچک و واقعی به نوجوان بسپارید'],
  }, [
    { title: 'شناخت نوجوان امروز', lessons: [
      { title: 'نوجوان دنبال چه می‌گردد؟', type: 'TEXT', durationSec: 420, content: { body: 'نوجوان امروز بیش از هر چیز دنبال دیده شدن است. در مسجد هم همین‌طور: اگر کسی اسمش را بداند، احوالش را بپرسد و نظرش را جدی بگیرد، دوباره می‌آید.\n\nسه نیاز اصلی را به خاطر بسپارید: دیده شدن، تعلق داشتن و نقش داشتن. هر برنامه‌ای که برای نوجوان‌ها می‌چینید، دست‌کم یکی از این سه را باید جواب بدهد.', keyPoints: ['دیده شدن، تعلق و نقش؛ سه نیاز اصلی نوجوان', 'اسم نوجوان را به خاطر بسپارید'] } },
      { title: 'گفت‌وگوی اول', type: 'TEXT', durationSec: 360, content: { body: 'گفت‌وگوی اول قرار نیست موعظه باشد. از چیزی شروع کنید که برای خودش مهم است: مدرسه، ورزش، بازی. سؤال باز بپرسید و بیشتر گوش بدهید تا حرف بزنید.\n\nبعد از نماز، کنار در مسجد، بهترین زمان است؛ کوتاه، صمیمی و بدون عجله.' } },
    ] },
    { title: 'سپردن مسئولیت', lessons: [
      { title: 'مسئولیت کوچک، اثر بزرگ', type: 'TEXT', durationSec: 300, content: { body: 'اولین مسئولیت باید کوچک، روشن و قابل انجام باشد: مسئول صدا در یک برنامه، پذیرایی یک شب، یا عکاسی. کار را روشن تحویل بدهید و بعد از برنامه حتماً از او تشکر کنید؛ جلوی جمع.' } },
      { title: 'برگهٔ کار: نوجوان‌های محلهٔ من', type: 'WORKSHEET', durationSec: 600, content: { prompt: 'سه نوجوانی را که این هفته در مسجد دیدید در نظر بیاورید.', fields: [{ id: 'f1', label: 'اسم و یک ویژگی هر کدام' }, { id: 'f2', label: 'چه مسئولیت کوچکی به هر کدام می‌شود سپرد؟' }] } },
      { title: 'مأموریت: یک گفت‌وگوی واقعی', type: 'MISSION', durationSec: 0, required: false, content: { goal: 'این هفته با یک نوجوان مسجد گفت‌وگوی کوتاهی داشته باشید و گزارشش را بنویسید.', steps: ['یک نوجوان را انتخاب کنید', 'بعد از نماز چند دقیقه با او حرف بزنید', 'در گزارش بنویسید چه شنیدید و چه یاد گرفتید'] } },
      { title: 'آزمون پایانی', type: 'QUIZ', isFinalQuiz: true, durationSec: 300, content: quiz([
        ['کدام یک از نیازهای اصلی نوجوان در این دوره نیست؟', ['دیده شدن', 'تعلق داشتن', 'نقش داشتن', 'تنها ماندن'], 3, 'سه نیاز اصلی دیده شدن، تعلق و نقش است.'],
        ['بهترین شروع گفت‌وگوی اول چیست؟', ['نصیحت دربارهٔ نماز', 'پرسیدن دربارهٔ چیزی که برایش مهم است', 'دعوت به کلاس اخلاق', 'سکوت'], 1, 'از علاقه‌های خودش شروع کنید و گوش بدهید.'],
        ['اولین مسئولیتی که به نوجوان می‌سپارید باید چطور باشد؟', ['بزرگ و چالشی', 'کوچک و روشن', 'بدون توضیح', 'فقط نمادین'], 1, 'کار کوچک و روشن، احتمال موفقیت و اعتمادبه‌نفس را بالا می‌برد.'],
      ]) },
    ] },
  ]);

  const nj2 = await course('nojavan-2', {
    title: 'طراحی برنامه با نوجوانان', subtitle: 'برنامه‌ای که نوجوان‌ها خودشان می‌سازند', level: 'میانه', instructor: 'گروه مدرسان', color: 'peri', icon: 'sparkles',
    about: 'در این دوره یاد می‌گیرید برنامه را «با» نوجوان‌ها طراحی کنید، نه «برای» آن‌ها: از جلسهٔ ایده‌پردازی تا تقسیم کار و مرور بعد از اجرا.',
    outcomes: ['یک جلسهٔ ایده‌پردازی با نوجوان‌ها برگزار کنید', 'کارها را بین نوجوان‌ها تقسیم کنید', 'بعد از برنامه مرور کوتاه بگیرید'],
  }, [
    { title: 'از ایده تا اجرا', lessons: [
      { title: 'جلسهٔ ایده‌پردازی', type: 'TEXT', durationSec: 480, content: { body: 'جلسه را کوتاه نگه دارید: ده دقیقه ایده‌های آزاد، ده دقیقه انتخاب و ده دقیقه تقسیم کار. همهٔ ایده‌ها را بنویسید، حتی آن‌هایی که عملی به نظر نمی‌رسند.' } },
      { title: 'آزمون پایانی', type: 'QUIZ', isFinalQuiz: true, durationSec: 240, content: quiz([
        ['در طراحی برنامه با نوجوانان، نقش مربی چیست؟', ['همهٔ تصمیم‌ها را می‌گیرد', 'تسهیل‌گر است و تصمیم را با نوجوان‌ها می‌گیرد', 'فقط تماشا می‌کند', 'بودجه می‌دهد'], 1, 'مربی تسهیل‌گر است؛ تصمیم با خود نوجوان‌هاست.'],
        ['در جلسهٔ ایده‌پردازی با ایده‌های غیرعملی چه کنیم؟', ['رد کنیم', 'بنویسیم', 'مسخره کنیم', 'نادیده بگیریم'], 1, 'همه را بنویسید؛ ایدهٔ خوب گاهی از دل ایدهٔ عجیب درمی‌آید.'],
      ]) },
    ] },
  ]);
  await db.insert(s.courseDependencies).values({ courseId: nj2.id, requiresId: nj1.id, kind: 'PREREQUISITE' }).onConflictDoNothing();

  await course('masjed-modiriat', {
    title: 'مدیریت مسجد', subtitle: 'اصول ادارهٔ مسجد به‌عنوان کانون محله', level: 'مقدماتی', instructor: 'گروه مدرسان', color: 'amber', icon: 'landmark',
    about: 'این دوره اصول ادارهٔ مسجد را مرور می‌کند: نقش هیئت امنا، برنامه‌ریزی سالانه و ارتباط با اهالی محله.',
    outcomes: ['نقش هیئت امنا را بشناسید', 'یک برنامهٔ سالانهٔ ساده بنویسید'],
  }, [
    { title: 'جلسهٔ ۱', lessons: [
      { title: 'مسجد، کانون محله', type: 'TEXT', durationSec: 600, content: { body: 'مسجد وقتی کانون محله می‌شود که اهالی آن را خانهٔ خودشان بدانند. این یعنی درهای باز، برنامه برای همهٔ سنین و شنیدن صدای اهالی در تصمیم‌ها.' } },
      { title: 'آزمون پایانی', type: 'QUIZ', isFinalQuiz: true, durationSec: 180, content: quiz([
        ['مسجد چه وقت کانون محله می‌شود؟', ['وقتی فقط نماز برگزار شود', 'وقتی اهالی آن را خانهٔ خود بدانند', 'وقتی بزرگ باشد', 'وقتی بودجهٔ زیاد داشته باشد'], 1, 'احساس تعلق اهالی، مسجد را کانون محله می‌کند.'],
      ]) },
    ] },
  ]);

  if (!(await db.query.paths.findFirst({ where: eq(s.paths.slug, 'nojavanan') }))) {
    const [p] = await db.insert(s.paths).values({ slug: 'nojavanan', title: 'همراهی نوجوانان مسجد', description: 'از اولین گفت‌وگو تا برنامه‌ای که خود نوجوان‌ها می‌سازند.', published: true, icon: 'users', color: 'green' }).returning();
    await db.insert(s.pathItems).values([{ pathId: p.id, courseId: nj1.id, order: 0 }, { pathId: p.id, courseId: nj2.id, order: 1 }]);
  }
  console.log('دادهٔ نمونه آماده است');
}

main().catch((e) => { console.error(e); process.exit(1); });
