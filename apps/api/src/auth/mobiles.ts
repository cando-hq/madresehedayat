import { eq, inArray } from 'drizzle-orm';
import type { Db } from '../db/db.module';
import { courses, pendingInvites, publisherAdmins, roleGrants, userMobiles, users } from '../db/schema';
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

/**
 * نقش‌هایی که پیش از ساخت حساب برای این شماره گذاشته شده بود را به حساب می‌دهد و از صف برمی‌دارد.
 * پس از ثبت‌نام و پس از افزودن شمارهٔ دوم صدا زده می‌شود.
 */
export async function applyPendingInvites(db: Db, userId: string, mobile: string): Promise<number> {
  const rows = await db.select().from(pendingInvites).where(eq(pendingInvites.mobile, mobileKey(mobile)));
  for (const r of rows) {
    if (r.kind === 'PUBLISHER_ADMIN') {
      await db.insert(publisherAdmins).values({ publisherId: r.targetId, userId }).onConflictDoNothing();
      await db.insert(roleGrants).values({ userId, role: 'ORG_ADMIN', networkId: null } as any).onConflictDoNothing();
    } else if (r.kind === 'COURSE_INSTRUCTOR') {
      const [u] = await db.select({ f: users.firstName, l: users.lastName }).from(users).where(eq(users.id, userId)).limit(1);
      await db.insert(roleGrants).values({ userId, role: 'INSTRUCTOR' } as any).onConflictDoNothing();
      await db.update(courses).set({ instructorId: userId, instructor: u ? `${u.f} ${u.l}` : null } as any).where(eq(courses.id, r.targetId));
    }
    await db.delete(pendingInvites).where(eq(pendingInvites.id, r.id));
  }
  return rows.length;
}
