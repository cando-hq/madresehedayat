/*
 * ورود با رمز ثابت (۱.۸): برای برگزارکنندگان و استادها که روزی چند بار و از لپ‌تاپ وارد می‌شوند.
 * رمز را فقط کسی که با بله (یا پیامک) وارد شده می‌گذارد؛ ورود با رمز فقط تا وقتی کار می‌کند که آن نقش را دارد.
 * scrypt با نمک تصادفی؛ پنج رمز اشتباه پشت سر هم، ورود با رمز آن شماره را ۱۵ دقیقه می‌بندد.
 */
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb) as (p: string, s: Buffer, n: number, o: object) => Promise<Buffer>;
const OPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };


export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(pw.normalize('NFC'), salt, 64, OPT);
  return `scrypt$${salt.toString('base64url')}$${key.toString('base64url')}`;
}
export async function checkPassword(pw: string, stored: string | null | undefined): Promise<boolean> {
  const [alg, s, k] = (stored ?? 'scrypt$AAAAAAAAAAAAAAAAAAAAAA$').split('$');
  const key = await scrypt(pw.normalize('NFC'), Buffer.from(s ?? '', 'base64url'), 64, OPT); // برای حساب بی‌رمز هم همین‌قدر کار می‌کند
  const want = Buffer.from(k ?? '', 'base64url');
  return alg === 'scrypt' && !!stored && want.length === key.length && timingSafeEqual(want, key);
}

/** رمز خوب: دست‌کم ۸ نویسه، نه فقط یک نویسهٔ تکراری، نه خود شماره */
export function passwordProblem(pw: string, mobiles: string[]): string | null {
  if (pw.length < 8) return 'رمز دست‌کم ۸ نویسه است';
  if (pw.length > 128) return 'رمز خیلی بلند است';
  if (/^(.)\1+$/.test(pw)) return 'رمز نمی‌تواند یک نویسهٔ تکراری باشد';
  if (/^(0123456789|1234567890|12345678|123456789|87654321)$/.test(pw)) return 'این رمز را همه حدس می‌زنند';
  const d = pw.replace(/\D/g, '');
  if (d.length >= 8 && mobiles.some((m) => m && (m.includes(d) || d.includes(m.slice(-8))))) return 'رمز نباید شمارهٔ موبایلت باشد';
  return null;
}

/** قفل ورود با رمز: در حافظهٔ همین API (یک نمونه اجرا می‌شود) */
const fails = new Map<string, { n: number; until: number }>();
export const LOCK_TRIES = 5, LOCK_MS = 15 * 60_000;
export function lockedFor(key: string): number {
  const f = fails.get(key); const left = f ? f.until - Date.now() : 0;
  return left > 0 ? Math.ceil(left / 60_000) : 0;
}
export function failed(key: string) {
  const f = fails.get(key) ?? { n: 0, until: 0 };
  f.n += 1;
  if (f.n >= LOCK_TRIES) { f.until = Date.now() + LOCK_MS; f.n = 0; fails.set(key, f); return 0; }
  fails.set(key, f);
  return LOCK_TRIES - f.n;
}
export const succeeded = (key: string) => fails.delete(key);
