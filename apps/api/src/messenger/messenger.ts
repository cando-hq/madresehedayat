import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Injectable, Logger, Post } from '@nestjs/common';
import { and, eq, inArray, lt } from 'drizzle-orm';
import { randomInt } from 'node:crypto';
import { config } from '../config';
import { AuthUser, CurrentUser } from '../common/auth.decorators';
import { Db, InjectDb } from '../db/db.module';
import { kv, messengerCodes, messengerLinks, users } from '../db/schema';
import { eitaaEnabled, eitaaEscape, eitaaSend } from '../eitaa/eitaa';

export interface PushMessage { title: string; body?: string; link?: string }

/**
 * اعلان‌ها در پیام‌رسان‌های داخلی (۲.۱): بات بله.
 * رابط بات بله همانند تلگرام است: https://tapi.bale.ai/bot<token>/<method>
 * کاربر از «تنظیمات» کد اتصال می‌گیرد و آن را برای بات می‌فرستد؛ بات شناسهٔ گفت‌وگو را نگه می‌دارد.
 * شمارهٔ همراه هرگز به بله فرستاده نمی‌شود. متن اعلان کوتاه است و جزئیات دادهٔ قرمز در آن نمی‌آید.
 * ایتا: رابط رسمی ارسال پیام به تک‌تک کاربران هنوز در دسترس ما نیست؛ جایش آماده است (provider = EITAA).
 */
@Injectable()
export class Messenger {
  private readonly log = new Logger('Messenger');
  private queue: { provider: string; chatId: string; text: string; link?: string }[] = [];
  private draining = false;
  constructor(@InjectDb() private readonly db: Db) {}

  get baleEnabled() { return !!config.baleToken; }
  /** نشانی بات برای «کد را از بات بله بگیر» */
  get baleBotUrl() { return config.baleToken && config.baleBotUsername ? `https://ble.ir/${config.baleBotUsername.replace(/^@/, '')}?start=login` : null; }
  /** ورود با بات: شماره‌ای که بله تأیید کرده می‌رسد، متن پاسخ (کد ورود) برمی‌گردد. AuthService آن را می‌گذارد. */
  onContact?: (mobile: string, chatId: string) => Promise<string>;

  private async bale(method: string, body: Record<string, unknown>) {
    const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 15_000);
    try {
      const r = await fetch(`${config.baleBotApi}/bot${config.baleToken}/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: ac.signal });
      const j = (await r.json().catch(() => ({}))) as any;
      if (!j.ok) throw new Error(j.description ?? `HTTP ${r.status}`);
      return j.result;
    } finally { clearTimeout(t); }
  }

  /** برای کسانی که بله را وصل کرده‌اند و اعلان پیام‌رسان را خاموش نکرده‌اند */
  async push(userIds: string[], m: PushMessage) {
    const providers = [...(this.baleEnabled ? ['BALE'] : []), ...(eitaaEnabled() ? ['EITAA'] : [])];
    if (!providers.length || !userIds.length) return;
    for (let i = 0; i < userIds.length; i += 500) {
      const rows = await this.db.select({ chatId: messengerLinks.chatId, provider: messengerLinks.provider }).from(messengerLinks).innerJoin(users, eq(users.id, messengerLinks.userId))
        .where(and(inArray(messengerLinks.userId, userIds.slice(i, i + 500)), inArray(messengerLinks.provider, providers), eq(users.notifyMessenger, true)));
      const text = `${m.title}${m.body ? '\n' + m.body : ''}`;
      for (const r of rows) this.queue.push({ provider: r.provider, chatId: r.chatId, text, link: m.link });
    }
    this.drain();
  }

  /**
   * فرستادن فوری یک پیام به خود کاربر (کد ورود). اول بله، بعد ایتا. بی‌توجه به خاموش بودن اعلان‌ها،
   * چون کاربر خودش کد خواسته. اگر نشد null برمی‌گرداند تا پیامک برود.
   */
  async sendDirect(userId: string, text: string): Promise<'BALE' | 'EITAA' | null> {
    const links = await this.db.select().from(messengerLinks).where(eq(messengerLinks.userId, userId));
    for (const p of ['BALE', 'EITAA'] as const) {
      const l = links.find((x) => x.provider === p);
      if (!l || (p === 'BALE' && !this.baleEnabled) || (p === 'EITAA' && !eitaaEnabled())) continue;
      try {
        if (p === 'BALE') await this.bale('sendMessage', { chat_id: l.chatId, text });
        else await eitaaSend(l.chatId, eitaaEscape(text));
        return p;
      } catch (e: any) { this.log.warn(`کد ورود با ${p === 'BALE' ? 'بله' : 'ایتا'} نرفت: ${e?.message}`); }
    }
    return null;
  }

  /** حدود ۲۰ پیام در ثانیه تا محدودیت بله رعایت شود */
  private async drain() {
    if (this.draining) return;
    this.draining = true;
    try {
      while (this.queue.length) {
        const m = this.queue.shift()!;
        const url = m.link ? config.publicUrl.replace(/\/$/, '') + m.link : undefined;
        try {
          if (m.provider === 'EITAA') { await eitaaSend(m.chatId, `**${eitaaEscape(m.text.split('\n')[0])}**${m.text.includes('\n') ? '\n' + eitaaEscape(m.text.split('\n').slice(1).join('\n')) : ''}${url ? `\n\n[باز کردن در مدرسه](${url})` : ''}`); continue; }
          await this.bale('sendMessage', { chat_id: m.chatId, text: m.text, ...(url && url.startsWith('https://') ? { reply_markup: { inline_keyboard: [[{ text: 'باز کردن در مدرسه', url }]] } } : {}) });
        } catch (e: any) { this.log.warn(`ارسال ${m.provider === 'EITAA' ? 'ایتا' : 'بله'} نشد: ${e?.message}`); }
        finally { await new Promise((r) => setTimeout(r, 60)); }
      }
    } finally { this.draining = false; }
  }

  /**
   * کاربر دکمهٔ «شماره‌ام را بفرست» را زده است. فقط شمارهٔ خود فرستنده پذیرفته می‌شود
   * (contact.user_id باید همان فرستنده باشد)؛ کارت تماس کس دیگری کد ورود او را نمی‌گیرد.
   */
  private async contact(msg: any) {
    const chatId = msg.chat.id;
    const own = msg.contact?.user_id != null && msg.from?.id != null && String(msg.contact.user_id) === String(msg.from.id);
    if (!own) {
      this.log.warn(`بله: شماره پذیرفته نشد (user_id ${msg.contact?.user_id ?? 'ندارد'}، فرستنده ${msg.from?.id ?? 'ندارد'})`);
      await this.bale('sendMessage', { chat_id: chatId, text: 'فقط شمارهٔ خودت را می‌شود فرستاد؛ دکمهٔ «شماره‌ام را بفرست» را بزن.', reply_markup: CONTACT_KEYBOARD }); return;
    }
    const mobile = normalizeIranMobile(msg.contact.phone_number);
    if (!mobile) { await this.bale('sendMessage', { chat_id: chatId, text: 'این شماره همراه ایران نیست؛ ورود با شمارهٔ ۰۹… است.' }); return; }
    if (!this.onContact) return;
    const text = await this.onContact(mobile, String(chatId));
    await this.bale('sendMessage', { chat_id: chatId, text, reply_markup: { remove_keyboard: true } });
  }

  /** خواندن پیام‌های تازهٔ بات (کد اتصال) — هر چند ثانیه از زمان‌بند */
  async poll() {
    if (!this.baleEnabled) return;
    const off = await this.db.query.kv.findFirst({ where: eq(kv.key, 'bale_offset') });
    const updates: any[] = await this.bale('getUpdates', { offset: off ? Number(off.value) : undefined, timeout: 0, limit: 100 });
    let last = off ? Number(off.value) - 1 : 0;
    for (const u of updates ?? []) {
      last = Math.max(last, u.update_id);
      const msg = u.message; if (!msg?.chat?.id) continue;
      if (msg.contact) { await this.contact(msg).catch((e) => this.log.warn(`بله، شماره: ${e?.message ?? e}`)); continue; }
      const text = String(msg.text ?? '').trim();
      const code = (/^\/start\s+([A-Za-z0-9]{6})$/.exec(text)?.[1] ?? (/^[A-Za-z0-9]{6}$/.test(text) ? text : '')).toUpperCase();
      if (code) {
        const c = await this.db.query.messengerCodes.findFirst({ where: and(eq(messengerCodes.code, code), eq(messengerCodes.provider, 'BALE')) });
        if (c && c.expiresAt > new Date()) {
          await this.db.delete(messengerLinks).where(and(eq(messengerLinks.provider, 'BALE'), eq(messengerLinks.chatId, String(msg.chat.id))));
          await this.db.insert(messengerLinks).values({ userId: c.userId, provider: 'BALE', chatId: String(msg.chat.id) })
            .onConflictDoUpdate({ target: [messengerLinks.userId, messengerLinks.provider], set: { chatId: String(msg.chat.id), linkedAt: new Date() } });
          await this.db.delete(messengerCodes).where(eq(messengerCodes.code, code));
          await this.bale('sendMessage', { chat_id: msg.chat.id, text: 'بله‌ات به مدرسهٔ هدایت وصل شد. از این پس کد ورود، یادآوری برنامه‌ها، پاسخ راهیار و خبرهای هسته را این‌جا هم می‌گیری.\nبرای قطع: مدرسه ← تنظیمات ← پیام‌رسان' }).catch(() => {});
          continue;
        }
        await this.bale('sendMessage', { chat_id: msg.chat.id, text: 'این کد پیدا نشد یا وقتش تمام شده. از «تنظیمات» مدرسه کد تازه بگیر.' }).catch(() => {});
        continue;
      }
      await this.bale('sendMessage', { chat_id: msg.chat.id, text: 'سلام! این‌جا کد ورود «مدرسهٔ هدایت» را می‌گیری.\nدکمهٔ «شماره‌ام را بفرست» را پایین صفحه بزن؛ کد چند ثانیه بعد همین‌جا می‌آید.', reply_markup: CONTACT_KEYBOARD }).catch(() => {});
    }
    if (updates?.length) await this.db.insert(kv).values({ key: 'bale_offset', value: String(last + 1) }).onConflictDoUpdate({ target: kv.key, set: { value: String(last + 1) } });
    await this.db.delete(messengerCodes).where(lt(messengerCodes.expiresAt, new Date()));
  }
}

const CONTACT_KEYBOARD = { keyboard: [[{ text: 'شماره‌ام را بفرست', request_contact: true }]], resize_keyboard: true, one_time_keyboard: true };

/** ۹۸۹۱۲…، +۹۸۹۱۲…، ۰۹۱۲…، ۹۱۲… ← ۰۹۱۲… */
export function normalizeIranMobile(raw: unknown): string | null {
  const d = String(raw ?? '').replace(/[۰-۹]/g, (c) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/\D/g, '');
  const m = /^(?:0098|98|0)?(9\d{9})$/.exec(d);
  return m ? '0' + m[1] : null;
}

const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

@Controller('me/messenger')
export class MessengerController {
  constructor(@InjectDb() private readonly db: Db, private readonly m: Messenger) {}

  @Get()
  async status(@CurrentUser() u: AuthUser) {
    const links = await this.db.select().from(messengerLinks).where(eq(messengerLinks.userId, u.id));
    return {
      bale: { available: this.m.baleEnabled, linked: links.some((l) => l.provider === 'BALE'), botUrl: config.baleBotUsername ? `https://ble.ir/${config.baleBotUsername}` : null, botName: config.baleBotUsername || null },
      eitaa: { available: eitaaEnabled(), linked: links.some((l) => l.provider === 'EITAA'), appUrl: config.eitaaAppUrl || null },
    };
  }

  @Post('bale/code') @HttpCode(200)
  async code(@CurrentUser() u: AuthUser) {
    if (!this.m.baleEnabled) throw new BadRequestException({ code: 'bale_off', message: 'بات بله هنوز راه نیفتاده است' });
    const code = Array.from({ length: 6 }, () => ALPHA[randomInt(ALPHA.length)]).join('');
    await this.db.delete(messengerCodes).where(and(eq(messengerCodes.userId, u.id), eq(messengerCodes.provider, 'BALE')));
    await this.db.insert(messengerCodes).values({ code, userId: u.id, provider: 'BALE', expiresAt: new Date(Date.now() + 15 * 60_000) });
    return { code, expiresInMin: 15 };
  }

  @Delete('bale')
  async unlink(@CurrentUser() u: AuthUser) {
    await this.db.delete(messengerLinks).where(and(eq(messengerLinks.userId, u.id), eq(messengerLinks.provider, 'BALE')));
    return { ok: true };
  }

  @Delete('eitaa')
  async unlinkEitaa(@CurrentUser() u: AuthUser) {
    await this.db.delete(messengerLinks).where(and(eq(messengerLinks.userId, u.id), eq(messengerLinks.provider, 'EITAA')));
    return { ok: true };
  }

  @Post('prefs') @HttpCode(200)
  async prefs(@CurrentUser() u: AuthUser, @Body() d: { notifyMessenger?: boolean }) {
    await this.db.update(users).set({ notifyMessenger: !!d.notifyMessenger }).where(eq(users.id, u.id));
    return { ok: true };
  }
}
