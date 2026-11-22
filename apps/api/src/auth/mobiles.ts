import { eq, inArray } from 'drizzle-orm';
import type { Db } from '../db/db.module';
import { userMobiles, users } from '../db/schema';
import { mobileKey } from '../common/crypto';

/**
 * پیدا کردن حساب با شماره: شمارهٔ اصلی یا شمارهٔ دوم حساب.
 * هر جا کسی را با شماره پیدا می‌کنیم (ورود، دعوت، سپردن نقش) از این‌جا بگذرد تا هر دو شماره یک آدم باشند.
 */
export async function userIdByMobile(db: Db, mobile: string): Promise<string | null> {
  const k = mobileKey(mobile);
  const [u] = await db.select({ id: users.id }).from(users).where(eq(users.mobile, k)).limit(1);
  if (u) return u.id;
  const [a] = await db.select({ id: userMobiles.userId }).from(userMobiles).where(eq(userMobiles.mobile, k)).limit(1);
  return a?.id ?? null;
}

/** چند شماره با هم: نقشهٔ «شمارهٔ عادی‌شده ← شناسهٔ حساب» برای آن‌هایی که حساب دارند */
export async function userIdsByMobiles(db: Db, mobiles: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!mobiles.length) return out;
  const byKey = new Map(mobiles.map((m) => [mobileKey(m), m]));
  const keys = [...byKey.keys()];
  for (const r of await db.select({ id: users.id, k: users.mobile }).from(users).where(inArray(users.mobile, keys))) out.set(byKey.get(r.k)!, r.id);
  for (const r of await db.select({ id: userMobiles.userId, k: userMobiles.mobile }).from(userMobiles).where(inArray(userMobiles.mobile, keys))) if (!out.has(byKey.get(r.k)!)) out.set(byKey.get(r.k)!, r.id);
  return out;
}
