import { useQuery } from '@tanstack/react-query';
import { CircleAlert, KeyRound, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { eitaaApp, eitaaContact, inEitaa } from '../lib/eitaa';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { fa, maskMobile, toEn } from '../lib/fa';
import type { Me } from '../lib/types';
import { useToast } from '../components/ui';

type Step = 'mobile' | 'code' | 'register';

const normMobile = (v: string) => {
  const s = toEn(v).replace(/[\s\-()]/g, '').replace(/^\+98/, '0').replace(/^0098/, '0');
  return s.length === 10 && s.startsWith('9') ? '0' + s : s;
};

export default function Login() {
  const { me, setMe } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/';
  const [step, setStep] = useState<Step>('mobile');
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  // کد ورود اگر بله یا ایتا وصل باشد رایگان همان‌جا می‌رود (مدل کسب‌وکار: کم کردن پیامک)
  const [channel, setChannel] = useState<'SMS' | 'BALE' | 'EITAA'>('SMS');
  const [alt, setAlt] = useState<'SMS' | 'BALE' | null>(null);
  const [info, setInfo] = useState('');
  const welcome = useToast();
  const [isNew, setIsNew] = useState(false);
  const [regToken, setRegToken] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);
  // اگر نشست در میانهٔ کار تمام شده بود، یک بار توضیح می‌دهیم
  const [expired] = useState(() => { try { const x = sessionStorage.getItem('mh-expired'); sessionStorage.removeItem('mh-expired'); return !!x; } catch { return false; } });

  useEffect(() => { if (me) nav(next, { replace: true }); }, [me, nav, next]);
  // داخل ایتا: اگر حساب ایتا پیش‌تر وصل شده، بی‌کد وارد می‌شویم
  const [eitaa, setEitaa] = useState<{ name: string } | null>(null);
  useEffect(() => {
    if (!inEitaa()) return;
    eitaaApp().then(async (w) => {
      if (!w?.initData) return;
      try {
        const r = await api<{ linked: boolean; user?: any; firstName?: string; lastName?: string }>('/auth/eitaa', { body: { initData: w.initData } });
        if (r.linked && r.user) setMe(r.user); else setEitaa({ name: `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim() });
      } catch { /* ورود معمولی */ }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  async function withEitaaPhone() {
    setErr(''); setBusy(true);
    try {
      const contact = await eitaaContact();
      if (!contact) { setErr('شماره از ایتا نرسید؛ با کد پیامکی وارد شو.'); return; }
      const r = await api<{ needsRegistration: boolean; regToken?: string; user?: any }>('/auth/eitaa/contact', { body: { contact } });
      if (r.needsRegistration) { setRegToken(r.regToken!); setStep('register'); } else setMe(r.user);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait((w) => w - 1), 1000); return () => clearTimeout(t); }, [wait]);

  async function sendCode(e?: FormEvent, via?: 'sms' | 'bale') {
    e?.preventDefault();
    const m = normMobile(mobile);
    if (!/^09\d{9}$/.test(m)) { setErr('شماره ۱۱ رقم است و با ۰۹ شروع می‌شود؛ مثل ۰۹۱۲۳۴۵۶۷۸۹'); return; }
    setBusy(true); setErr('');
    try {
      const r = await api<{ resendIn: number; isNew: boolean; devCode?: string; channel: 'SMS' | 'BALE' | 'EITAA'; alt?: 'SMS' | 'BALE' | null }>('/auth/otp', { body: { mobile: m, ...(via ? { via } : {}) } });
      setMobile(m); setIsNew(r.isNew); setChannel(r.channel ?? 'SMS'); setAlt(r.alt ?? (r.channel && r.channel !== 'SMS' ? 'SMS' : null)); setDevCode(r.devCode ?? null); setWait(r.resendIn); setCode(''); setInfo(''); setStep('code');
      setTimeout(() => codeRef.current?.focus(), 50);
    } catch (e) {
      const a = e as ApiError;
      if (a.code === 'otp_wait') { setMobile(m); setStep('code'); setWait(a.data?.wait ?? 60); setInfo(a.message); setTimeout(() => codeRef.current?.focus(), 50); return; }
      setErr(a.message);
    } finally { setBusy(false); }
  }

  async function verify(e?: FormEvent) {
    e?.preventDefault();
    const c = toEn(code).replace(/\D/g, '');
    if (c.length !== 5) { setErr('کد ۵ رقم است؛ همه‌اش را بزن.'); return; }
    setBusy(true); setErr('');
    try {
      const r = await api<{ needsRegistration: boolean; regToken?: string; user?: Me }>('/auth/verify', { body: { mobile, code: c } });
      if (r.needsRegistration) { setRegToken(r.regToken!); setStep('register'); }
      else { setMe(r.user!); welcome(`خوش برگشتی، ${r.user!.firstName}`); nav(next, { replace: true }); }
    } catch (e) {
      const a = e as ApiError; const left = a.code === 'otp_wrong' ? Number(a.data?.left) : NaN;
      setErr(Number.isFinite(left) && left > 0 ? `${a.message} (${fa(left)} فرصت دیگر)` : a.message); setCode(''); codeRef.current?.focus();
    } finally { setBusy(false); }
  }

  useEffect(() => { if (step === 'code' && toEn(code).replace(/\D/g, '').length === 5) verify(); /* ارسال خودکار وقتی ۵ رقم کامل شد */ // eslint-disable-next-line
  }, [code]);

  const digits = toEn(code).replace(/\D/g, '');
  const back = () => { setStep('mobile'); setErr(''); setInfo(''); };
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex justify-center px-6 sm:items-center" style={{ paddingTop: 'max(48px, env(safe-area-inset-top))', paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}>
        <div className="flex w-full max-w-[400px] flex-col">
          <div className="mb-10 flex items-center gap-3" role="img" aria-label="مدرسهٔ هدایت">
            <img src="/brand/logo-mark.png" alt="" className="h-10 w-auto" />
            <img src="/brand/logo-type-ink.png" alt="" className="h-3.5 w-auto dark:hidden" />
            <img src="/brand/logo-type-white.png" alt="" className="hidden h-3.5 w-auto dark:block" />
          </div>
          {step === 'mobile' && (
            <form onSubmit={sendCode} noValidate className="rise flex flex-1 flex-col sm:flex-none">
              <h1 className="text-[26px] font-extrabold leading-tight">ورود به مدرسه</h1>
              <p className="mt-2 text-[15px] text-muted">شماره‌ات را بزن تا کد ورود برایت بفرستیم.</p>
              {expired && <p className="mt-4 rounded-xl bg-flame-soft px-3 py-2 text-sm text-flame-ink" role="status">برای امنیت حسابت دوباره وارد شو؛ بعد به همان صفحه برمی‌گردی.</p>}
              <div className="field mt-8">
                <label htmlFor="mobile" className="sr-only">شمارهٔ موبایل</label>
                <input id="mobile" className="input ltr tnum h-14 text-center text-xl tracking-[0.12em]" inputMode="numeric" autoComplete="tel" placeholder="۰۹۱۲ ۳۴۵ ۶۷۸۹"
                  value={mobile} onChange={(e) => { setMobile(e.target.value); setErr(''); }} autoFocus aria-describedby={err ? 'mobile-err' : undefined} />
                {err && <p id="mobile-err" className="err justify-center" role="alert"><CircleAlert className="size-4" />{err}</p>}
              </div>
              {eitaa && <div className="mt-6 grid gap-3 rounded-2xl bg-leaf-soft p-4">
                <p className="text-sm text-body"><b className="text-ink">سلام{eitaa.name ? ` ${eitaa.name}` : ''}!</b> از ایتا آمده‌ای؛ با شمارهٔ ایتایت بدون کد وارد شو.</p>
                <button type="button" className="btn btn-primary" disabled={busy} onClick={withEitaaPhone}>ورود با شمارهٔ ایتا</button>
              </div>}
              <button className={`btn btn-lg mt-6 w-full ${eitaa ? 'btn-secondary' : 'btn-primary'}`} disabled={busy}>{busy ? 'در حال فرستادن…' : 'کد را بفرست'}</button>
              <SsoButton />
              <p className="mt-auto pt-10 text-center text-[13px] text-muted sm:mt-8 sm:pt-0">ورود یعنی پذیرفتن <Link to="/terms" className="inline-block py-2 font-semibold text-leaf-ink">شرایط و حریم خصوصی</Link></p>
            </form>
          )}
          {step === 'code' && (
            <form onSubmit={verify} noValidate className="rise">
              <h1 className="text-[26px] font-extrabold leading-tight">کد را بزن</h1>
              <p className="mt-2 text-[15px] text-muted">
                {channel === 'SMS' ? 'پیامک شد به ' : `در ${channel === 'BALE' ? 'بله' : 'ایتا'} رفت برای `}
                <b dir="ltr" className="tnum text-ink">{maskMobile(mobile)}</b>
                <button type="button" className="ms-2 inline-block py-1 font-bold text-leaf-ink" onClick={back}>عوض کن</button>
              </p>
              <OtpBoxes inputRef={codeRef} value={digits} invalid={!!err} onChange={(v) => { setCode(v); setErr(''); }} />
              <div className="mt-3 min-h-6 text-center" aria-live="polite">
                {err ? <p className="err justify-center" role="alert"><CircleAlert className="size-4" />{err}</p> : info ? <p className="hint">{info}</p> : devCode ? <p className="hint">آزمایشی: کد <b className="tnum">{fa(devCode)}</b></p> : null}
              </div>
              <button className="btn btn-primary btn-lg mt-6 w-full" disabled={busy || digits.length < 5}>{busy ? 'در حال بررسی…' : isNew ? 'ادامه' : 'ورود'}</button>
              <div className="mt-5 grid justify-items-center gap-1 text-sm">
                {wait > 0 ? <span className="tnum py-2 text-muted">کد تازه تا {fa(Math.floor(wait / 60))}:{fa(String(wait % 60).padStart(2, '0'))}</span>
                  : <button type="button" className="py-2 font-bold text-leaf-ink" onClick={() => sendCode()} disabled={busy}>کد تازه بگیر</button>}
                {/* اگر کد از یک راه نیامد، بعد از ده ثانیه می‌شود از راه دیگر گرفت (بی‌انتظار یک دقیقه) */}
                {alt && wait <= 50 && <button type="button" className="py-2 font-bold text-muted" onClick={() => sendCode(undefined, alt === 'BALE' ? 'bale' : 'sms')} disabled={busy}>{alt === 'BALE' ? 'پیامک نیامد؟ در بله بفرست' : `در ${channel === 'EITAA' ? 'ایتا' : 'بله'} نیامد؟ با پیامک بفرست`}</button>}
              </div>
            </form>
          )}
          {step === 'register' && <Register regToken={regToken} mobile={mobile} invite={params.get('invite') ?? ''} onDone={(u) => { setMe(u); nav(next, { replace: true }); }} />}
        </div>
      </div>
      <Art />
    </div>
  );
}

/** پنج خانهٔ کد: یک input واقعی (برای پر شدن خودکار کد پیامکی و صفحه‌خوان) روی پنج خانهٔ نمایشی */
function OtpBoxes({ value, onChange, invalid, inputRef }: { value: string; onChange: (v: string) => void; invalid: boolean; inputRef: React.RefObject<HTMLInputElement | null> }) {
  const [focus, setFocus] = useState(false);
  return (
    <div className="relative mt-8" dir="ltr">
      <label htmlFor="code" className="sr-only">کد ۵ رقمی ورود</label>
      <input id="code" ref={inputRef} inputMode="numeric" autoComplete="one-time-code" maxLength={5} value={value}
        onChange={(e) => onChange(toEn(e.target.value).replace(/\D/g, '').slice(0, 5))} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0" aria-invalid={invalid} />
      <div className="grid grid-cols-5 gap-2.5" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => {
          const on = focus && (i === value.length || (i === 4 && value.length === 5));
          return <div key={i} className={`grid h-14 place-items-center rounded-xl border bg-card text-2xl font-extrabold tnum text-ink transition-colors ${invalid ? 'border-rose' : on ? 'border-leaf ring-2 ring-leaf/25' : value[i] ? 'border-line-strong' : 'border-line'}`}>{value[i] ? fa(value[i]) : on ? <span className="h-6 w-0.5 animate-pulse bg-leaf" /> : ''}</div>;
        })}
      </div>
    </div>
  );
}

function SsoButton() {
  const [msg, setMsg] = useState('');
  const opts = useQuery({ queryKey: ['auth-options'], queryFn: () => api<{ sso: boolean; bale: boolean }>('/auth/options'), staleTime: 3600_000, retry: false });
  if (!opts.data?.sso) return null; // تا «ورود با سامانهٔ پایه» وصل نشده، دکمه‌اش هم نیست
  return (
    <>
      <div className="my-5 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />یا<span className="h-px flex-1 bg-line" /></div>
      <button type="button" className="btn btn-secondary w-full" onClick={async () => {
        try { await api('/auth/sso/core'); } catch (e) { setMsg((e as Error).message); }
      }}><KeyRound className="size-4" />ورود با سامانهٔ پایهٔ هدایت</button>
      {msg && <p className="hint mt-2 text-center">{msg}</p>}
    </>
  );
}

function Register({ regToken, invite, onDone }: { regToken: string; mobile: string; invite: string; onDone: (u: Me) => void }) {
  // فقط سه چیز: نام، نام خانوادگی، برادر یا خواهر. شهرستان در قدم بعد از مسجدِ روی نقشه گرفته می‌شود.
  const [f, setF] = useState({ firstName: '', lastName: '', gender: '', inviteCode: invite });
  const [showInvite, setShowInvite] = useState(!!invite);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const toast = useToast();
  const set = (k: keyof typeof f, v: string) => { setF((x) => ({ ...x, [k]: v })); setErrs((e) => ({ ...e, [k]: '' })); };

  async function submit(e: FormEvent) {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.firstName.trim().length < 2) er.firstName = 'نامت را بنویس';
    if (f.lastName.trim().length < 2) er.lastName = 'نام خانوادگی‌ات را بنویس';
    if (!f.gender) er.gender = 'برادر یا خواهر را انتخاب کن';
    setErrs(er); if (Object.keys(er).length) return;
    setBusy(true); setErr('');
    try {
      const r = await api<{ user: Me; notice?: string | null }>('/auth/register', { body: {
        regToken, firstName: f.firstName, lastName: f.lastName, gender: f.gender, inviteCode: f.inviteCode.trim() || undefined,
      } });
      if (r.notice) toast(r.notice, 'err');
      onDone(r.user);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  const E = ({ k }: { k: string }) => errs[k] ? <p className="err" role="alert"><CircleAlert className="size-4" />{errs[k]}</p> : null;
  return (
    <form onSubmit={submit} noValidate className="rise">
      <h1 className="text-[26px] font-extrabold leading-tight">خوش آمدی</h1>
      <p className="mt-2 text-[15px] text-muted">سه چیز برای ساختن حسابت.</p>
      {invite && <p className="mt-4 flex items-center gap-2 rounded-xl bg-leaf-soft px-3 py-2 text-sm text-leaf-ink"><ShieldCheck className="size-4 shrink-0" />با دعوت آمده‌ای؛ بعد از ثبت‌نام عضو همان هسته یا مسجد می‌شوی.</p>}
      <div className="mt-8 grid gap-4">
        <div className="field"><label htmlFor="fn">نام</label><input id="fn" className="input h-12" value={f.firstName} onChange={(e) => set('firstName', e.target.value)} autoComplete="given-name" autoFocus /><E k="firstName" /></div>
        <div className="field"><label htmlFor="ln">نام خانوادگی</label><input id="ln" className="input h-12" value={f.lastName} onChange={(e) => set('lastName', e.target.value)} autoComplete="family-name" /><E k="lastName" /></div>
        <fieldset className="field">
          <legend className="mb-2 text-sm font-bold text-ink">برادر هستی یا خواهر؟</legend>
          <div className="grid grid-cols-2 gap-2.5">{[['MALE', 'برادر'], ['FEMALE', 'خواهر']].map(([v, t]) => (
            <button type="button" key={v} aria-pressed={f.gender === v} onClick={() => set('gender', v)} className={`h-12 rounded-xl border text-[15px] font-bold transition-colors ${f.gender === v ? 'border-leaf bg-leaf-soft text-leaf-ink' : 'border-line bg-card text-body hover:border-line-strong'}`}>{t}</button>
          ))}</div>
          <E k="gender" />
        </fieldset>
        {showInvite && <div className="field"><label htmlFor="inv">کد دعوت</label><input id="inv" className="input ltr h-12" value={f.inviteCode} onChange={(e) => set('inviteCode', e.target.value)} placeholder="از امام محله یا مسئول هسته" /></div>}
      </div>
      {err && <p className="err mt-4" role="alert"><CircleAlert className="size-4" />{err}</p>}
      <button className="btn btn-primary btn-lg mt-8 w-full" disabled={busy}>{busy ? 'در حال ساختن حساب…' : 'حسابم را بساز'}</button>
      {!showInvite && <button type="button" className="mx-auto mt-4 block py-2 text-sm font-bold text-muted" onClick={() => setShowInvite(true)}>کد دعوت دارم</button>}
    </form>
  );
}

function Art() {
  // تصویر آزاد نفس بکشد؛ نوشته پایین، روی سایهٔ ملایم، دور از گنبد و نشان
  return (
    <div className="relative m-3 hidden overflow-hidden rounded-[28px] bg-[#1B2150] lg:block">
      <img src="/brand/poster.jpg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: '50% 45%' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 45%, rgb(16 24 72 / .88))' }} />
      <div className="absolute inset-x-12 bottom-12 z-10 grid max-w-[460px] gap-2">
        <b className="text-[34px] font-extrabold leading-snug text-white">فَلیُبَلِّغِ الحاضِرُ الغائبَ</b>
        <p className="text-[15px] leading-loose text-white/80">مدرسهٔ امامان، شریکة‌الامام‌ها و بازوان مسجد؛ از درس تا میدان، همراه راهیار و همتایان.</p>
      </div>
    </div>
  );
}
