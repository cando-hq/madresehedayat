/**
 * ورود فهرست مسجدهای ایران (data/mosques.json.gz، ساخته با tools/mosques/build.py) — نسخهٔ ۱.۱۰.
 * با هر بالا آمدن برنامه از seed صدا زده می‌شود و فقط یک بار برای هر نسخهٔ فهرست کار می‌کند (همه در یک تراکنش).
 * - استان و شهرستان با نام سنجیده می‌شوند (بی‌فاصله و نیم‌فاصله، ی/ک فارسی)؛ شهرستانی که نیست ساخته می‌شود.
 * - مسجدی که پیش‌تر دستی یا به پیشنهاد کاربر در فاصلهٔ ۵۰ متری ثبت شده، دوباره ساخته نمی‌شود.
 * - مسجد فهرست با همان مختصات (source_ref) در نسخهٔ تازه فقط نامش به‌روز می‌شود.
 * اجرای دستی: node dist/db/mosques-import.js [مسیر فایل]  (MOSQUE_REIMPORT=true برای اجرای دوباره همان نسخه)
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { and, count, eq, isNotNull, isNull, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { config } from '../config';
import * as s from './schema';

type Db = ReturnType<typeof drizzle<typeof s>>;
type Row = [province: string, county: string, name: string, lat: number, lng: number];

export const DEFAULT_FILE = join(__dirname, '../../data/mosques.json.gz');
const norm = (x: string) => x.replace(/[‌\s]/g, '').replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/ۀ/g, 'ه').replace(/هٔ/g, 'ه');
/** نام‌های دیگر یا بریده‌شدهٔ شهرستان در فهرست ← نامی که مدرسه از قبل دارد */
const ALIAS: Record<string, string> = { 'چاه بهار': 'چابهار', 'بندرلنزلی': 'انزلی', 'بندر انزلی': 'انزلی', 'شاهین شهر و می': 'شاهین‌شهر', 'شاهین شهر و میمه': 'شاهین‌شهر', 'اسلام آباد غر': 'اسلام‌آباد غرب', 'قائنات': 'قائن', 'دشتستان': 'برازجان', 'بویراحمد': 'یاسوج' };
const dist = (a: number, b: number, c: number, d: number) => { const R = 6371e3, p1 = a * Math.PI / 180, p2 = c * Math.PI / 180, dp = (c - a) * Math.PI / 180, dl = (d - b) * Math.PI / 180; const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };

export async function importMosques(db: Db, file = DEFAULT_FILE, force = false) {
  if (!existsSync(file)) return { skipped: 'no-file' as const };
  const { version, rows } = JSON.parse(gunzipSync(readFileSync(file)).toString('utf8')) as { version: string; rows: Row[] };
  const [{ n: have }] = await db.select({ n: count() }).from(s.mosques).where(eq(s.mosques.source, version));
  if (have > 0 && !force) return { skipped: 'done' as const, version, have };

  return db.transaction(async (tx) => {
    const provs = new Map((await tx.select().from(s.provinces)).map((p) => [norm(p.name), p.id]));
    const counties = new Map((await tx.select().from(s.counties)).map((c) => [`${c.provinceId}|${norm(c.name)}`, c.id]));
    let newCounties = 0;
    const countyOf = async (pn: string, cn0: string) => {
      const cn = ALIAS[cn0] ?? cn0;
      let pid = provs.get(norm(pn));
      if (!pid) { const [p] = await tx.insert(s.provinces).values({ name: pn }).returning(); pid = p.id; provs.set(norm(pn), pid); }
      const k = `${pid}|${norm(cn)}`; let cid = counties.get(k);
      if (!cid) { const [c] = await tx.insert(s.counties).values({ name: cn, provinceId: pid }).returning(); cid = c.id; counties.set(k, cid); newCounties++; }
      return cid;
    };
    // مسجدهای دستی/پیشنهادی، در شبکهٔ تقریباً ۱۰۰ متری برای سنجش فاصله
    const grid = new Map<string, { lat: number; lng: number }[]>();
    const cell = (lat: number, lng: number) => `${Math.floor(lat * 1000)}|${Math.floor(lng * 1000)}`;
    for (const m of await tx.select({ lat: s.mosques.lat, lng: s.mosques.lng }).from(s.mosques).where(and(isNull(s.mosques.source), isNotNull(s.mosques.lat), isNotNull(s.mosques.lng)))) {
      const k = cell(m.lat!, m.lng!); (grid.get(k) ?? grid.set(k, []).get(k)!).push({ lat: m.lat!, lng: m.lng! });
    }
    const nearManual = (lat: number, lng: number) => {
      const a = Math.floor(lat * 1000), b = Math.floor(lng * 1000);
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const m of grid.get(`${a + i}|${b + j}`) ?? []) if (dist(lat, lng, m.lat, m.lng) <= 50) return true;
      return false;
    };
    const vals: (typeof s.mosques.$inferInsert)[] = []; let nearSkip = 0;
    for (const [pn, cn, name, lat, lng] of rows) {
      if (nearManual(lat, lng)) { nearSkip++; continue; }
      vals.push({ name, countyId: await countyOf(pn, cn), lat, lng, verified: true, source: version, sourceRef: `${lat.toFixed(5)},${lng.toFixed(5)}` });
    }
    for (let i = 0; i < vals.length; i += 1000) {
      await tx.insert(s.mosques).values(vals.slice(i, i + 1000))
        .onConflictDoUpdate({ target: s.mosques.sourceRef, set: { name: sql`excluded.name`, source: sql`excluded.source` } });
    }
    return { version, imported: vals.length, nearSkip, newCounties };
  });
}

if (require.main === module) {
  const pool = new Pool({ connectionString: config.databaseUrl });
  importMosques(drizzle(pool, { schema: s }), process.argv[2] || DEFAULT_FILE, process.env.MOSQUE_REIMPORT === 'true')
    .then((r) => { console.log('مسجدها:', JSON.stringify(r)); return pool.end(); })
    .catch((e) => { console.error(e); process.exit(1); });
}
