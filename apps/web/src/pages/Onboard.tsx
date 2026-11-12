/*
 * نخستین ورود، سه قدم: نقش تو در مسجد (→ مسیر اصلی پیشنهادی)، مسجد تو روی نقشه، و شروع.
 * نقشه در نسخهٔ نمایشی ترسیمی است (بی‌نیاز از اینترنت)؛ در سامانه با کاشی‌های نقشهٔ داخلی جایگزین می‌شود، همین رابط می‌ماند.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Crosshair, MapPin, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Brand } from '../components/Shell';
import { ROLE_FA, Toranj } from '../components/Path2';
import { InlineSpinner, useToast } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { fa } from '../lib/fa';
import type { ActorRole } from '../lib/types';

interface Near { id: string; name: string; address: string | null; lat: number; lng: number; verified: boolean; distance: number | null }
interface OnboardInfo { actorRole: ActorRole | null; onboarded: boolean; mosque: string | null; mains: { role: ActorRole; roleFa: string; path: { slug: string; title: string; publisher: string; description: string | null; steps: number; color: string } | null }[] }
const ROLES: ActorRole[] = ['IMAM', 'SHARIK', 'BAZU', 'HASTEH', 'OTHER'];
const CENTER = { lat: 33.985, lng: 51.41 }; // کاشان؛ در سامانه از شهرستان کاربر
const dist = (m: number | null) => m == null ? '' : m < 1000 ? `${fa(m)} متر` : `${fa((m / 1000).toFixed(1))} کیلومتر`;

export default function Onboard() {
  const { me, setMe } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const info = useQuery({ queryKey: ['v2', 'onboard'], queryFn: () => api<OnboardInfo>('/v2/onboard') });
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<ActorRole>(me?.actorRole ?? 'IMAM');
  const [pin, setPin] = useState<{ lat: number; lng: number }>(me?.location ?? CENTER);
  const [q, setQ] = useState('');
  const [mosqueId, setMosqueId] = useState<string | null>(me?.mosque?.id ?? null);
  const [relation, setRelation] = useState('');
  const [proposing, setProposing] = useState(false);
  const [newName, setNewName] = useState('');
  const near = useQuery({ queryKey: ['v2', 'near', pin.lat.toFixed(4), pin.lng.toFixed(4), q], queryFn: () => api<Near[]>(`/v2/mosques/near?lat=${pin.lat}&lng=${pin.lng}&q=${encodeURIComponent(q)}`) });
  const propose = useMutation({ mutationFn: () => api<Near>('/v2/mosques', { body: { name: newName, lat: pin.lat, lng: pin.lng } }), onSuccess: (m) => { setMosqueId(m.id); setProposing(false); qc.invalidateQueries({ queryKey: ['v2', 'near'] }); toast('ثبت شد؛ ستاد یک بار تأیید می‌کند'); } });
  const finish = useMutation({
    mutationFn: () => api<{ main: { slug: string } | null }>('/v2/onboard', { body: { actorRole: role, mosqueId, lat: pin.lat, lng: pin.lng, relation } }),
    onSuccess: async () => { const m = await api('/auth/me'); setMe(m); qc.invalidateQueries({ queryKey: ['v2'] }); nav('/', { replace: true }); },
  });
  const main = info.data?.mains.find((m) => m.role === role)?.path ?? null;
  const locate = () => { if (!navigator.geolocation) return toast('گوشی موقعیت نمی‌دهد؛ پین را دستی بگذار', 'err'); navigator.geolocation.getCurrentPosition((p) => setPin({ lat: p.coords.latitude, lng: p.coords.longitude }), () => toast('موقعیت گرفته نشد؛ پین را دستی بگذار', 'err'), { timeout: 6000 }); };
  const stepsUi = ['نقش تو', 'مسجد تو', 'شروع'];
  return (
    <div className="min-h-dvh bg-bg">
      <header className="wrap flex h-16 items-center justify-between"><Brand /><ol className="flex items-center gap-1.5 text-[13px]" aria-label="قدم‌ها">{stepsUi.map((t, i) => <li key={t} className={`rounded-full px-3 py-1 font-bold ${i === step ? 'bg-deep text-white' : i < step ? 'bg-deep-soft text-deep' : 'bg-sunken text-muted'}`}>{fa(i + 1)} {t}</li>)}</ol></header>
      <main className="wrap grid max-w-3xl gap-8 py-8">
        {step === 0 && (
          <section className="rise grid gap-6">
            <div><h1 className="text-[clamp(24px,3vw,32px)] font-extrabold">خوش آمدی، {me?.firstName}. نقشت در مسجد چیست؟</h1><p className="mt-1 text-muted">برای این‌که مسیر مناسب‌تر را اول نشانت بدهیم. بعداً از تنظیمات عوض می‌شود.</p></div>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="نقش">{ROLES.map((r) => <button key={r} type="button" role="radio" aria-checked={role === r} onClick={() => setRole(r)} className={`h-12 rounded-full border px-5 text-[15px] font-bold transition-colors ${role === r ? 'border-deep bg-deep-soft text-deep' : 'border-line bg-card text-body hover:border-line-strong'}`}>{ROLE_FA[r]}</button>)}</div>
            <div className="card grid gap-3 p-5" style={main ? { borderInlineStartWidth: 8, borderInlineStartColor: main.color } : undefined}>
              <span className="text-[13px] font-bold text-deep">مسیر اصلی برای تو</span>
              {main ? (<><b className="text-2xl font-extrabold text-ink">{main.title}</b><p className="text-body">{main.description}</p><span className="text-sm text-muted">{main.publisher}، {fa(main.steps)} پله. پیش‌فرض است، اجبار نیست؛ از «کاوش» هر چیز دیگری را برمی‌داری.</span></>)
                : (<><b className="text-xl font-extrabold text-ink">بی مسیر اصلی</b><p className="text-body">از کاوش شروع کن؛ هر وقت نقشت را گفتی، مسیر اصلی پیشنهاد می‌شود.</p></>)}
            </div>
            <div className="flex items-center gap-3"><button className="btn btn-primary btn-lg" onClick={() => setStep(1)}>ادامه<ChevronLeft className="size-5" /></button><button className="btn btn-ghost" onClick={() => finish.mutate()}>بعداً</button></div>
          </section>
        )}
        {step === 1 && (
          <section className="rise grid gap-5">
            <div><h1 className="text-[clamp(24px,3vw,32px)] font-extrabold">مسجد تو کجاست؟</h1><p className="mt-1 text-muted">برای گعده‌های نزدیک، تیم‌های همین مسجد و گزارش منطقه‌ای. فقط راهیار و ستاد می‌بینند.</p></div>
            <Map pin={pin} onPin={setPin} marks={near.data ?? []} selected={mosqueId} onPick={setMosqueId} />
            <div className="flex flex-wrap gap-2">
              <div className="relative min-w-[220px] flex-1"><Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted" /><input className="input pe-9" placeholder="نام مسجد" value={q} onChange={(e) => setQ(e.target.value)} aria-label="جست‌وجوی مسجد" /></div>
              <button type="button" className="btn btn-secondary" onClick={locate}><Crosshair className="size-4" />موقعیت فعلی من</button>
            </div>
            <div className="grid gap-2" role="radiogroup" aria-label="مسجدهای نزدیک پین">
              {near.isLoading && <InlineSpinner />}
              {(near.data ?? []).map((m) => <button key={m.id} type="button" role="radio" aria-checked={mosqueId === m.id} onClick={() => setMosqueId(m.id)} className={`flex items-center gap-3 rounded-2xl border p-3 text-start transition-colors ${mosqueId === m.id ? 'border-deep bg-deep-soft' : 'border-line bg-card hover:border-line-strong'}`}><span className={`grid size-10 place-items-center rounded-xl ${mosqueId === m.id ? 'bg-deep text-white' : 'bg-sunken text-deep'}`}><Toranj state="done" color="currentColor" size={14} /></span><span className="min-w-0 flex-1"><b className="block text-ink">{m.name}{!m.verified && <span className="ms-2 text-xs font-normal text-muted">(در انتظار تأیید)</span>}</b><span className="text-sm text-muted">{m.address ?? ''}</span></span><span className="text-sm text-muted">{dist(m.distance)}</span></button>)}
              {!near.isLoading && !near.data?.length && <p className="rounded-xl bg-sunken p-3 text-sm text-muted">مسجدی نزدیک پین نیست؛ پین را جابه‌جا کن یا مسجدت را اضافه کن.</p>}
            </div>
            {proposing ? (
              <div className="card grid gap-3 p-4"><b className="text-ink">مسجدم در فهرست نیست</b><p className="text-sm text-muted">پین را روی مسجد بگذار و نامش را بنویس؛ ستاد یک بار تأیید می‌کند.</p><input className="input" placeholder="نام مسجد" value={newName} onChange={(e) => setNewName(e.target.value)} /><div className="flex gap-2"><button className="btn btn-primary" disabled={!newName.trim() || propose.isPending} onClick={() => propose.mutate()}>اضافه کن</button><button className="btn btn-ghost" onClick={() => setProposing(false)}>برگرد</button></div></div>
            ) : <button type="button" className="w-fit text-sm font-bold text-leaf-ink" onClick={() => setProposing(true)}>مسجدم در فهرست نیست؛ با پین اضافه کن</button>}
            <div className="grid gap-2"><b className="text-sm text-ink">نسبت تو با این مسجد</b><div className="flex flex-wrap gap-2">{['امام جماعت', 'شریکة‌الامام', 'بازو', 'عضو هسته', 'نمازگزار'].map((r) => <button key={r} type="button" aria-pressed={relation === r} onClick={() => setRelation(r)} className={`h-9 rounded-full border px-3.5 text-[13px] font-bold ${relation === r ? 'border-deep bg-deep-soft text-deep' : 'border-line bg-card text-body'}`}>{r}</button>)}</div></div>
            <div className="flex items-center gap-3"><button className="btn btn-primary btn-lg" onClick={() => setStep(2)}>ادامه<ChevronLeft className="size-5" /></button><button className="btn btn-ghost" onClick={() => setStep(0)}>برگرد</button><button className="btn btn-ghost text-muted" onClick={() => { setMosqueId(null); setStep(2); }}>فعلاً رد شو</button></div>
          </section>
        )}
        {step === 2 && (
          <section className="rise grid gap-6">
            <h1 className="text-[clamp(24px,3vw,32px)] font-extrabold">همه‌چیز آماده است</h1>
            <div className="card grid gap-3 p-5">
              <div className="flex items-center justify-between gap-3"><span className="text-muted">نقش</span><b className="text-ink">{ROLE_FA[role]}</b></div>
              <div className="flex items-center justify-between gap-3"><span className="text-muted">مسجد</span><b className="text-ink">{near.data?.find((m) => m.id === mosqueId)?.name ?? (mosqueId ? 'ثبت شد' : 'بعداً')}</b></div>
              <div className="flex items-center justify-between gap-3"><span className="text-muted">مسیر اصلی</span><b className="text-ink">{main?.title ?? 'بی مسیر اصلی'}</b></div>
            </div>
            <p className="text-body">{main ? `با «${main.title}» شروع می‌کنی؛ اولین درس آماده است. هر وقت خواستی از «یادگیری» مسیرهای کوتاه‌تر هم برمی‌داری.` : 'از «کاوش» یک مسیر کوتاه بردار؛ یک تا چهار هفته.'}</p>
            <div className="flex items-center gap-3"><button className="btn btn-primary btn-lg" disabled={finish.isPending} onClick={() => finish.mutate()}>{finish.isPending ? <InlineSpinner /> : null}شروع کن</button><button className="btn btn-ghost" onClick={() => setStep(1)}>برگرد</button></div>
          </section>
        )}
      </main>
    </div>
  );
}

/** نقشهٔ ترسیمی: پین با کشیدن/کلیک جابه‌جا می‌شود؛ مسجدهای نزدیک نسبت به پین رسم می‌شوند */
function Map({ pin, onPin, marks, selected, onPick }: { pin: { lat: number; lng: number }; onPin: (p: { lat: number; lng: number }) => void; marks: Near[]; selected: string | null; onPick: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 720, h: 300 });
  useEffect(() => { const el = ref.current; if (!el) return; const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight })); ro.observe(el); return () => ro.disconnect(); }, []);
  const scale = 60000; // پیکسل به ازای هر درجه (حدود ۱۰۰ پیکسل = ۱۵۰ متر)
  const toXY = (lat: number, lng: number) => ({ x: size.w / 2 + (lng - pin.lng) * scale, y: size.h / 2 - (lat - pin.lat) * scale });
  const place = (e: React.PointerEvent) => { const r = ref.current!.getBoundingClientRect(); const x = e.clientX - r.left, y = e.clientY - r.top; onPin({ lat: pin.lat - (y - size.h / 2) / scale, lng: pin.lng + (x - size.w / 2) / scale }); };
  const streets = useMemo(() => Array.from({ length: 6 }, (_, i) => i), []);
  return (
    <div ref={ref} className="relative h-[300px] select-none overflow-hidden rounded-[22px] border border-line bg-[#EEF1F6] dark:bg-[#1A1F33]" onPointerDown={place} role="application" aria-label="نقشه؛ روی مسجد بزن تا پین جابه‌جا شود">
      <svg width="100%" height="100%" aria-hidden="true" className="absolute inset-0">
        <defs><pattern id="mg" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0 H0 V40" fill="none" stroke="var(--line)" strokeWidth="1" /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#mg)" />
        {streets.map((i) => <path key={i} d={i % 2 ? `M0 ${(i + 1) * size.h / 7} Q ${size.w / 2} ${(i + 1) * size.h / 7 - 20} ${size.w} ${(i + 1) * size.h / 7}` : `M${(i + 1) * size.w / 7} 0 V${size.h}`} stroke="var(--card)" strokeWidth={i % 3 ? 10 : 16} fill="none" />)}
        <circle cx={size.w / 2} cy={size.h / 2} r={Math.min(size.w, size.h) * 0.3} fill="color-mix(in srgb, var(--deep) 8%, transparent)" stroke="var(--deep)" strokeDasharray="6 6" />
        {marks.map((m) => { const p = toXY(m.lat, m.lng); return <g key={m.id} transform={`translate(${p.x} ${p.y})`} style={{ cursor: 'pointer' }} onPointerDown={(e) => { e.stopPropagation(); onPick(m.id); }}><circle r={selected === m.id ? 12 : 9} fill={selected === m.id ? 'var(--deep)' : 'var(--flame)'} stroke="var(--card)" strokeWidth="3" /></g>; })}
        <g transform={`translate(${size.w / 2} ${size.h / 2})`}><path d="M0 -34 C-13 -34 -20 -24 -20 -14 C-20 0 0 14 0 14 C0 14 20 0 20 -14 C20 -24 13 -34 0 -34 Z" fill="var(--deep)" stroke="var(--card)" strokeWidth="3" /><circle r="6" cy="-15" fill="var(--card)" /></g>
      </svg>
      <span className="absolute bottom-3 end-3 inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-bold text-body shadow-md"><MapPin className="size-3.5" />روی مسجد بزن تا پین برود</span>
    </div>
  );
}
