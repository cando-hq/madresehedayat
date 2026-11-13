import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CircleAlert, KeyRound, ShieldCheck, Smartphone } from 'lucide-react';
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
      if (!contact) { setErr('شماره از ایتا دریافت نشد؛ با کد پیامکی وارد شوید.'); return; }
      const r = await api<{ needsRegistration: boolean; regToken?: string; user?: any }>('/auth/eitaa/contact', { body: { contact } });
      if (r.needsRegistration) { setRegToken(r.regToken!); setStep('register'); } else setMe(r.user);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait((w) => w - 1), 1000); return () => clearTimeout(t); }, [wait]);

  async function sendCode(e?: FormEvent, via?: 'sms' | 'bale') {
    e?.preventDefault();
    const m = normMobile(mobile);
    if (!/^09\d{9}$/.test(m)) { setErr('شماره باید ۱۱ رقم باشد و با ۰۹ شروع شود.'); return; }
    setBusy(true); setErr('');
    try {
      const r = await api<{ resendIn: number; isNew: boolean; devCode?: string; channel: 'SMS' | 'BALE' | 'EITAA'; alt?: 'SMS' | 'BALE' | null }>('/auth/otp', { body: { mobile: m, ...(via ? { via } : {}) } });
      setMobile(m); setIsNew(r.isNew); setChannel(r.channel ?? 'SMS'); setAlt(r.alt ?? (r.channel && r.channel !== 'SMS' ? 'SMS' : null)); setDevCode(r.devCode ?? null); setWait(r.resendIn); setCode(''); setStep('code');
      setTimeout(() => codeRef.current?.focus(), 50);
    } catch (e) {
      const a = e as ApiError;
      if (a.code === 'otp_wait' && step === 'mobile') { setStep('code'); setWait(a.data?.wait ?? 60); }
      setErr(a.message);
    } finally { setBusy(false); }
  }

  async function verify(e?: FormEvent) {
    e?.preventDefault();
    const c = toEn(code).replace(/\D/g, '');
    if (c.length !== 5) { setErr('کد ۵ رقمی را کامل وارد کنید.'); return; }
    setBusy(true); setErr('');
    try {
      const r = await api<{ needsRegistration: boolean; regToken?: string; user?: Me }>('/auth/verify', { body: { mobile, code: c } });
      if (r.needsRegistration) { setRegToken(r.regToken!); setStep('register'); }
      else { setMe(r.user!); welcome(`خوش برگشتی، ${r.user!.firstName}`); nav(next, { replace: true }); }
    } catch (e) {
      const a = e as ApiError; const left = a.code === 'otp_wrong' ? Number(a.data?.left) : NaN;
      setErr(Number.isFinite(left) && left > 0 ? `${a.message}؛ ${fa(left)} بار دیگر می‌توانید امتحان کنید.` : a.message); setCode(''); codeRef.current?.focus();
    } finally { setBusy(false); }
  }

  useEffect(() => { if (step === 'code' && toEn(code).replace(/\D/g, '').length === 5) verify(); /* ارسال خودکار وقتی ۵ رقم کامل شد */ // eslint-disable-next-line
  }, [code]);

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex items-start justify-center px-4 py-10 sm:items-center" style={{ paddingTop: 'max(40px, env(safe-area-inset-top))' }}>
        <div className="w-full max-w-[440px]">
          <img src="/brand/logo-full.png" alt="مدرسهٔ هدایت" className="mb-6 h-20 w-auto" />
          {step === 'mobile' && (
            <form onSubmit={sendCode} noValidate className="rise">
              <h1 className="text-[clamp(24px,3vw,30px)] font-extrabold">به مدرسه خوش آمدید</h1>
              {expired && <p className="mt-3 rounded-xl bg-flame-soft px-3 py-2 text-sm text-flame-ink" role="status">نشست شما تمام شده بود؛ برای امنیت حساب، دوباره وارد شوید. بعد از ورود به همان صفحه برمی‌گردید.</p>}
              <p className="mt-1.5 text-muted">شمارهٔ موبایلتان را بنویسید. اگر بار اول است، حسابتان همین‌جا ساخته می‌شود.</p>
              <div className="field mt-6">
                <label htmlFor="mobile">شمارهٔ موبایل</label>
                <div className="relative">
                  <Smartphone className="pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-muted" />
                  <input id="mobile" className="input ltr tnum h-[52px] !pr-11 text-lg tracking-wider" inputMode="numeric" autoComplete="tel" placeholder="۰۹۱۲ ۳۴۵ ۶۷۸۹"
                    value={mobile} onChange={(e) => { setMobile(e.target.value); setErr(''); }} autoFocus />
                </div>
                {err && <p className="err"><CircleAlert className="size-4" />{err}</p>}
              </div>
              {eitaa && <div className="mt-6 grid gap-2 rounded-2xl bg-leaf-soft p-4">
                <b className="text-ink">سلام{eitaa.name ? ` ${eitaa.name}` : ''}! از ایتا آمده‌اید.</b>
                <p className="text-sm text-body">با شمارهٔ حساب ایتایتان، بدون کد پیامکی وارد شوید. یک‌بار که وارد شوید، دفعه‌های بعد خودکار وارد می‌شوید و اعلان‌ها در ایتا هم می‌رسد.</p>
                <button type="button" className="btn btn-primary" disabled={busy} onClick={withEitaaPhone}>ورود با شمارهٔ ایتا</button>
              </div>}
              <button className={`btn btn-lg mt-6 w-full ${eitaa ? 'btn-secondary' : 'btn-primary'}`} disabled={busy}>{busy ? 'در حال ارسال…' : 'دریافت کد'}</button>
              <SsoButton />
              <p className="mt-4 text-center text-sm text-muted">ادامه یعنی پذیرفتن <Link to="/terms" className="inline-block py-3 font-semibold text-leaf-ink">شرایط استفاده و حریم خصوصی</Link>.</p>
            </form>
          )}
          {step === 'code' && (
            <form onSubmit={verify} noValidate className="rise">
              <button type="button" className="btn btn-ghost btn-sm -ms-3 mb-2" onClick={() => { setStep('mobile'); setErr(''); }}><ArrowRight className="size-4" />تغییر شماره</button>
              <h1 className="text-[clamp(24px,3vw,30px)] font-extrabold">کد تأیید را وارد کنید</h1>
              {channel === 'SMS'
                ? <p className="mt-1.5 text-muted">کد ۵ رقمی به <b dir="ltr" className="tnum text-ink">{maskMobile(mobile)}</b> پیامک شد.</p>
                : <p className="mt-1.5 text-muted">کد ۵ رقمی در پیام‌رسان <b className="text-ink">{channel === 'BALE' ? 'بله' : 'ایتا'}</b> برای <b dir="ltr" className="tnum text-ink">{maskMobile(mobile)}</b> آمد؛ {channel === 'BALE' ? 'بله' : 'ایتا'} را باز کنید و کد را این‌جا بزنید.</p>}
              <div className="field mt-6">
                <label htmlFor="code" className="sr-only">کد تأیید</label>
                <input id="code" ref={codeRef} className="input ltr tnum h-16 text-center text-3xl font-extrabold tracking-[0.6em]" inputMode="numeric" autoComplete="one-time-code" maxLength={5}
                  placeholder="•••••" value={fa(toEn(code).replace(/\D/g, ''))} onChange={(e) => { setCode(toEn(e.target.value).replace(/\D/g, '').slice(0, 5)); setErr(''); }} />
                {err && <p className="err justify-center"><CircleAlert className="size-4" />{err}</p>}
                {devCode && <p className="hint text-center">نسخهٔ توسعه: کد <b className="tnum">{fa(devCode)}</b> است (پیامک واقعی خاموش است).</p>}
              </div>
              <button className="btn btn-primary btn-lg mt-6 w-full" disabled={busy}>{busy ? 'در حال بررسی…' : isNew ? 'ادامهٔ ثبت‌نام' : 'ورود'}</button>
              <div className="mt-4 text-center text-sm">
                {wait > 0 ? <span className="text-muted">ارسال دوباره تا <b className="tnum">{fa(wait)}</b> ثانیهٔ دیگر</span>
                  : <button type="button" className="font-bold text-leaf-ink" onClick={() => sendCode()} disabled={busy}>ارسال دوبارهٔ کد</button>}
                {alt && wait <= 0 && <button type="button" className="ms-4 font-bold text-muted" onClick={() => sendCode(undefined, alt === 'BALE' ? 'bale' : 'sms')} disabled={busy}>{alt === 'BALE' ? 'کد را در بله بفرست' : 'با پیامک بفرست'}</button>}
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

function Register({ regToken, mobile, invite, onDone }: { regToken: string; mobile: string; invite: string; onDone: (u: Me) => void }) {
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
    if (f.firstName.trim().length < 2) er.firstName = 'نام را بنویسید';
    if (f.lastName.trim().length < 2) er.lastName = 'نام خانوادگی را بنویسید';
    if (!f.gender) er.gender = 'یکی را انتخاب کنید';
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

  const E = ({ k }: { k: string }) => errs[k] ? <p className="err"><CircleAlert className="size-4" />{errs[k]}</p> : null;
  return (
    <form onSubmit={submit} noValidate className="rise">
      <h1 className="text-[clamp(24px,3vw,30px)] font-extrabold">به مدرسهٔ هدایت خوش آمدید</h1>
      <p className="mt-1.5 text-muted">سه چیز برای ساختن حسابتان. شماره: <b dir="ltr" className="tnum">{maskMobile(mobile)}</b></p>
      {invite && <p className="mt-4 flex items-center gap-2 rounded-xl bg-leaf-soft px-3 py-2 text-sm text-leaf-ink"><ShieldCheck className="size-4 shrink-0" />با پیوند دعوت آمده‌اید؛ بعد از ثبت‌نام عضو همان هسته یا مسجد می‌شوید.</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="field"><label htmlFor="fn">نام</label><input id="fn" className="input" value={f.firstName} onChange={(e) => set('firstName', e.target.value)} autoComplete="given-name" autoFocus /><E k="firstName" /></div>
        <div className="field"><label htmlFor="ln">نام خانوادگی</label><input id="ln" className="input" value={f.lastName} onChange={(e) => set('lastName', e.target.value)} autoComplete="family-name" /><E k="lastName" /></div>
      </div>
      <fieldset className="field mt-4">
        <legend className="mb-1.5 text-sm font-bold text-ink">جنسیت</legend>
        <div className="seg">{[['MALE', 'برادر'], ['FEMALE', 'خواهر']].map(([v, t]) => <button type="button" key={v} aria-pressed={f.gender === v} onClick={() => set('gender', v)}>{t}</button>)}</div>
        <p className="hint">شبکهٔ راهیاری برادران و بانوان جداست؛ راهیارتان بر همین اساس تعیین می‌شود.</p><E k="gender" />
      </fieldset>
      <p className="hint mt-4">مسجد و شهرستانت را در قدم بعد، از روی نقشه پیدا می‌کنیم.</p>
      {showInvite
        ? <div className="field mt-4"><label htmlFor="inv">کد دعوت <span className="font-normal text-muted">(اختیاری)</span></label>
            <input id="inv" className="input ltr" value={f.inviteCode} onChange={(e) => set('inviteCode', e.target.value)} placeholder="کدی که امام محله یا مسئول هسته داده" /></div>
        : <button type="button" className="mt-3 inline-block py-2 text-sm font-bold text-leaf-ink" onClick={() => setShowInvite(true)}>کد دعوت دارم</button>}
      {err && <p className="err mt-4"><CircleAlert className="size-4" />{err}</p>}
      <button className="btn btn-primary btn-lg mt-6 w-full" disabled={busy}>{busy ? 'در حال ساخت حساب…' : 'ساخت حساب و ورود'}</button>
    </form>
  );
}

function Art() {
  return (
    <div className="relative hidden overflow-hidden bg-[#1B2150] lg:block">
      <img src="/brand/poster.jpg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: '50% 40%' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgb(20 36 110 / .8), rgb(20 36 110 / .15) 55%, rgb(20 36 110 / .6))' }} />
      <div className="absolute inset-x-12 top-14 z-10 grid gap-3 stagger">
        <b className="text-[clamp(28px,3vw,40px)] font-extrabold leading-snug text-white">فَلیُبَلِّغِ الحاضِرُ الغائبَ</b>
        <p className="text-base leading-loose text-white/85">مدرسهٔ آموزش مجازی امامان، شریکة‌الامام‌ها و بازوان مسجد؛ از درس تا میدان، همراه راهیار و همتایان.</p>
        <ul className="mt-2 flex flex-wrap gap-4">
          {([[ShieldCheck, 'گواهی با شناسهٔ استعلام'], [Smartphone, 'روی هر گوشی، بدون نصب']] as const).map(([I, t]) => (
            <li key={t} className="flex items-center gap-2 text-sm text-white/85"><I className="size-5 shrink-0 text-flame" />{t}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
