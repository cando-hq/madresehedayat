import { Injectable, Logger } from '@nestjs/common';
import { config } from '../config';

export abstract class SmsSender {
  abstract sendOtp(mobile: string, code: string): Promise<void>;
}

/** برای توسعه: کد را در لاگ می‌نویسد و چیزی نمی‌فرستد. */
@Injectable()
export class ConsoleSms extends SmsSender {
  private readonly log = new Logger('SMS');
  async sendOtp(mobile: string, code: string) {
    this.log.warn(`کد ورود برای ${mobile}: ${code} (ارسال واقعی خاموش است)`);
  }
}

/**
 * کاوه‌نگار — سرویس Verify Lookup با قالب از پیش تأییدشده.
 * مستند: https://kavenegar.com/rest.html (verify/lookup)
 */
@Injectable()
export class KavenegarSms extends SmsSender {
  private readonly log = new Logger('Kavenegar');
  async sendOtp(mobile: string, code: string) {
    const url = new URL(`https://api.kavenegar.com/v1/${config.kavenegarApiKey}/verify/lookup.json`);
    url.searchParams.set('receptor', mobile);
    url.searchParams.set('token', code);
    url.searchParams.set('template', config.kavenegarTemplate);
    const res = await fetch(url, { method: 'POST', signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      this.log.error(`ارسال پیامک ناموفق بود: ${res.status}`);
      throw new Error('sms_failed');
    }
  }
}

/**
 * سفیر بله: کد ورود به همان شمارهٔ موبایل در پیام‌رسان بله می‌رود (از بات رسمی تأییدشدهٔ کسب‌وکار).
 * لازم نیست کاربر قبلاً بات ما را شروع کرده باشد؛ فقط باید با همین شماره در بله حساب داشته باشد.
 * رابط: POST {BALE_SAFIR_URL}/send_message، سرآیند api-access-key، بدنه با bot_id، phone_number (98912…) و message_data.otp_message.otp.
 * پاسخ ۲۰۰ ممکن است error_data داشته باشد (مثلاً کد ۱۷ = این شماره در بله حساب ندارد) که شکست حساب می‌شود.
 */
@Injectable()
export class BaleSafir {
  private readonly log = new Logger('BaleSafir');
  get enabled() { return !!(config.baleSafirKey && config.baleSafirBotId); }
  /** true یعنی رفت؛ false یعنی نشد (حساب بله ندارد، اعتبار تمام شده، در دسترس نیست) تا پیامک برود */
  async sendOtp(mobile: string, code: string): Promise<boolean> {
    if (!this.enabled) return false;
    const phone = '98' + mobile.replace(/^0/, '');
    try {
      const res = await fetch(config.baleSafirUrl.replace(/\/$/, '') + '/send_message', {
        method: 'POST', signal: AbortSignal.timeout(8000),
        headers: { 'content-type': 'application/json', 'api-access-key': config.baleSafirKey },
        body: JSON.stringify({ request_id: `otp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, bot_id: Number(config.baleSafirBotId) || config.baleSafirBotId, phone_number: phone, message_data: { otp_message: { otp: code } } }),
      });
      const j = (await res.json().catch(() => ({}))) as { message_id?: unknown; error_data?: { code?: number; description?: string }[] | null };
      if (!res.ok || (Array.isArray(j.error_data) && j.error_data.length)) {
        const e = Array.isArray(j.error_data) ? j.error_data[0] : undefined;
        this.log.warn(`کد ورود با بله نرفت: ${res.status} ${e?.code ?? ''} ${e?.description ?? ''}`);
        return false;
      }
      return true;
    } catch (e: any) {
      this.log.warn(`کد ورود با بله نرفت: ${e?.message}`);
      return false;
    }
  }
}
