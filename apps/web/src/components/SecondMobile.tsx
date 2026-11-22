import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { api } from '../lib/api';
import { maskMobile, toEn } from '../lib/fa';
import type { Me } from '../lib/types';
import { ask } from './Confirm';
import { useToast } from './ui';

type OtpRes = { channel: 'SMS' | 'BALE' | 'EITAA' | 'BALE_BOT'; botUrl?: string | null; devCode?: string };

/**
 * شمارهٔ دوم حساب: کسی که دو خط دارد با هر دو به همین حساب وارد می‌شود (یک کارنامه، یک اعلان‌خانه).
 * کد را همان شمارهٔ دوم می‌گیرد؛ وقتی ورود با بله است، از بلهٔ همان خط و دکمهٔ «شماره‌ام را بفرست».
 */
export function SecondMobile({ me }: { me: Me }) {
  const qc = useQueryClient(); const toast = useToast();
  const [step, setStep] = useState<'idle' | 'number' | 'code'>('idle');
  const [mobile, setMobile] = useState(''); const [code, setCode] = useState('');
  const [otp, setOtp] = useState<OtpRes | null>(null);
  const done = () => { setStep('idle'); setMobile(''); setCode(''); setOtp(null); qc.invalidateQueries({ queryKey: ['me'] }); };
  const send = useMutation({ mutationFn: () => api<OtpRes>('/auth/mobile2/otp', { body: { mobile: toEn(mobile) } }), onSuccess: (r) => { setOtp(r); setStep('code'); }, onError: (e) => toast((e as Error).message, 'err') });
  const link = useMutation({ mutationFn: () => api('/auth/mobile2', { body: { mobile: toEn(mobile), code: toEn(code) } }), onSuccess: () => { toast('شمارهٔ دوم وصل شد'); done(); }, onError: (e) => toast((e as Error).message, 'err') });
  const remove = useMutation({ mutationFn: () => api('/auth/mobile2', { method: 'DELETE' }), onSuccess: () => { toast('شمارهٔ دوم برداشته شد'); done(); } });

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><b className="block text-ink">شمارهٔ دوم</b>
          <span className="text-sm text-muted">{me.mobile2 ? <>با <b dir="ltr" className="tnum text-body">{maskMobile(me.mobile2)}</b> هم به همین حساب وارد می‌شوی</> : 'اگر دو خط داری، با هر دو به همین حساب وارد شو'}</span></div>
        {step === 'idle' && (me.mobile2
          ? <button type="button" className="btn btn-ghost btn-sm" onClick={async () => { if (await ask({ title: 'شمارهٔ دوم برداشته شود؟', body: 'از این به بعد فقط با شمارهٔ اصلی وارد می‌شوی.', ok: 'بردار', danger: true })) remove.mutate(); }}>برداشتن</button>
          : <button type="button" className="btn btn-secondary btn-sm" onClick={() => setStep('number')}><Smartphone className="size-4" />افزودن شمارهٔ دوم</button>)}
      </div>
      {step === 'number' && (
        <form className="grid gap-3 rounded-2xl bg-sunken p-4" onSubmit={(e) => { e.preventDefault(); send.mutate(); }}>
          <label className="field"><span>شمارهٔ دوم</span><input className="input" dir="ltr" inputMode="tel" autoComplete="tel" placeholder="09…" value={mobile} onChange={(e) => setMobile(e.target.value)} autoFocus /></label>
          <p className="text-sm text-muted">برای اطمینان، کد را خودِ همین شماره می‌گیرد.</p>
          <div className="flex gap-2"><button className="btn btn-primary" disabled={send.isPending || toEn(mobile).replace(/\D/g, '').length < 10}>کد را بگیر</button><button type="button" className="btn btn-ghost" onClick={done}>انصراف</button></div>
        </form>
      )}
      {step === 'code' && (
        <form className="grid gap-3 rounded-2xl bg-sunken p-4" onSubmit={(e) => { e.preventDefault(); link.mutate(); }}>
          {otp?.channel === 'BALE_BOT' ? <>
            <p className="text-[15px] text-body">در گوشی‌ای که شمارهٔ <b dir="ltr" className="tnum">{maskMobile(toEn(mobile))}</b> را دارد، بات مدرسه را در بله باز کن و «شماره‌ام را بفرست» را بزن. کد را این‌جا بنویس.</p>
            {otp.botUrl && <a href={otp.botUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary"><Send className="size-4" />باز کردن بات در بله</a>}
          </> : <p className="text-[15px] text-body">کد برای <b dir="ltr" className="tnum">{maskMobile(toEn(mobile))}</b> رفت.</p>}
          <label className="field"><span>کد</span><input className="input tnum" dir="ltr" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={code} onChange={(e) => setCode(e.target.value)} /></label>
          <div className="flex gap-2"><button className="btn btn-primary" disabled={link.isPending || toEn(code).length < 4}>وصل کن</button><button type="button" className="btn btn-ghost" onClick={done}>انصراف</button></div>
        </form>
      )}
    </div>
  );
}
