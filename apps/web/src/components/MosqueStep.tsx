/*
 * قدم «مسجد تو» در آشنایی اولیه:
 * ۱) مکانت را می‌گیریم ← ۲) «این مسجدها نزدیک تو هستند؛ مسجد تو کدام است؟» ← ۳) اگر نبود، ثبتش کن.
 * کسی که مکان نمی‌دهد استان و شهرستان را انتخاب می‌کند و مسجدهای همان شهرستان را می‌بیند.
 * شهرستان کاربر از مسجد انتخاب‌شده می‌آید (یا نزدیک‌ترین مسجد، یا انتخاب دستی)؛ برای همین در فرم ثبت‌نام نیست.
 * نسبت با مسجد پرسیده نمی‌شود: از نقش معلوم است. اگر مسجد از پیش معلوم باشد (کد دعوت)، همان انتخاب‌شده نشان داده می‌شود.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CircleAlert, LocateFixed, Plus, Search } from 'lucide-react';
import type { ActorRole } from '../lib/types';
import { lazy, Suspense, useState } from 'react';
import { api, type ApiError } from '../lib/api';
import { fa } from '../lib/fa';
import { StepFooter } from './StepFooter';
import { InlineSpinner, useToast } from './ui';

const MosqueMap = lazy(() => import('./MosqueMap'));

export interface Near { id: string; name: string; address: string | null; lat: number | null; lng: number | null; verified: boolean; distance: number | null; countyId: string; county: string; provinceId: string }
interface Province { id: string; name: string; counties: { id: string; name: string }[] }
export interface MosqueChoice { mosqueId: string | null; mosqueName: string | null; countyId: string | null; lat: number | null; lng: number | null }

const IRAN = { lat: 32.4, lng: 53.7 };
const dist = (m: number | null) => m == null ? '' : m < 1000 ? `${fa(Math.round(m / 10) * 10)} متر` : `${fa((m / 1000).toFixed(1))} کیلومتر`;
// متن قدم به نقش بسته است تا روشن باشد کدام مسجد را می‌خواهیم
const COPY: Record<ActorRole, [string, string]> = {
  IMAM: ['مسجدی که امامش هستی', 'راهیار منطقه و گعدهٔ امامان نزدیکت از همین معلوم می‌شود.'],
  SHARIK: ['مسجدی که همسرت امامش است', 'برای حلقه‌ها و گعده‌های بانوان نزدیکت.'],
  BAZU: ['مسجدی که در آن کار می‌کنی', 'تا به امام و هستهٔ همان مسجد وصل شوی.'],
  HASTEH: ['مسجد هسته‌ات', 'تا به امام و هستهٔ همان مسجد وصل شوی.'],
  OTHER: ['مسجد محله‌ات', 'برای برنامه‌ها و گعده‌های نزدیکت.'],
};

export function MosqueStep({ role, value, onChange, onNext, onBack, finishing }: { role: ActorRole; value: MosqueChoice; onChange: (v: MosqueChoice) => void; onNext: (v: MosqueChoice) => void; onBack: () => void; finishing?: boolean }) {
  const toast = useToast(); const qc = useQueryClient();
  const [mode, setMode] = useState<'ask' | 'here' | 'county'>(value.lat != null ? 'here' : value.countyId ? 'county' : 'ask');
  const [here, setHere] = useState<{ lat: number; lng: number } | null>(value.lat != null && value.lng != null ? { lat: value.lat, lng: value.lng } : null);
  const [locating, setLocating] = useState(false);
  const [geoErr, setGeoErr] = useState('');
  const [prov, setProv] = useState('');
  const [county, setCounty] = useState(value.countyId ?? '');
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [newCounty, setNewCounty] = useState('');
  const [newProv, setNewProv] = useState('');
  const [needCounty, setNeedCounty] = useState(false); // فقط وقتی سرور نتوانست شهرستان را از روی نقشه بفهمد

  const provinces = useQuery({ queryKey: ['geo', 'provinces'], queryFn: () => api<Province[]>('/geo/provinces'), staleTime: Infinity });
  const params = mode === 'here' && here ? `lat=${here.lat}&lng=${here.lng}` : mode === 'county' && county ? `county=${county}&limit=30` : '';
  const near = useQuery({ queryKey: ['v2', 'near', params, q], enabled: !!params, queryFn: () => api<Near[]>(`/v2/mosques/near?${params}&q=${encodeURIComponent(q)}`) });
  const all = near.data ?? [];
  // «نزدیک تو» یعنی تا ۲۰ کیلومتر؛ اگر نزدیک کاربر هیچ مسجدی ثبت نشده بود، سه نزدیک‌ترین را با عنوان روشن نشان می‌دهیم
  const closeBy = mode === 'here' && !q ? all.filter((m) => m.distance != null && m.distance <= 20_000) : all;
  const farOnly = mode === 'here' && !q && !closeBy.length && all.length > 0;
  const list = farOnly ? all.slice(0, 3) : closeBy;
  const center = here ?? (list.find((m) => m.lat != null) as { lat: number; lng: number } | undefined) ?? IRAN;

  const locate = () => {
    if (!navigator.geolocation) { setGeoErr('این مرورگر مکان نمی‌دهد؛ استان و شهرستانت را انتخاب کن.'); setMode('county'); return; }
    setLocating(true); setGeoErr('');
    navigator.geolocation.getCurrentPosition(
      (p) => { setLocating(false); const h = { lat: p.coords.latitude, lng: p.coords.longitude }; setHere(h); setMode('here'); onChange({ ...value, lat: h.lat, lng: h.lng }); },
      (e) => { setLocating(false); setGeoErr(e.code === 1 ? 'اجازهٔ مکان داده نشد. اشکالی ندارد؛ استان و شهرستانت را انتخاب کن.' : 'مکان پیدا نشد؛ استان و شهرستانت را انتخاب کن.'); setMode('county'); },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  };
  const pick = (m: Near) => onChange({ ...value, mosqueId: m.id, mosqueName: m.name, countyId: m.countyId });

  // مسجد تازه: شهرستانش پیش‌فرض همان شهرستان نزدیک‌ترین مسجد (یا شهرستان انتخاب‌شده)، قابل عوض کردن
  const guessCounty = mode === 'county' ? county : closeBy[0]?.countyId ?? '';
  const guessProv = mode === 'county' ? prov : closeBy[0]?.provinceId ?? '';
  const startAdd = () => { setAdding(true); setNeedCounty(false); setPin(here ?? (list[0]?.lat != null ? { lat: list[0].lat!, lng: list[0].lng! } : null)); setNewCounty(mode === 'county' ? county : ''); setNewProv(mode === 'county' ? prov : ''); };
  const add = useMutation({
    mutationFn: () => api<Near>('/v2/mosques', { body: { name: newName.trim(), lat: pin?.lat, lng: pin?.lng, countyId: newCounty || undefined } }),
    onSuccess: (m) => { onChange({ ...value, mosqueId: m.id, mosqueName: newName.trim(), countyId: m.countyId }); setAdding(false); setNewName(''); qc.invalidateQueries({ queryKey: ['v2', 'near'] }); toast('مسجدت ثبت شد؛ ستاد یک بار نگاهش می‌کند'); },
    onError: (e) => { if ((e as ApiError).code === 'no_county') { setNeedCounty(true); setNewProv(guessProv); setNewCounty(guessCounty); } toast((e as Error).message, 'err'); },
  });
  // بدون انتخاب مسجد هم می‌شود رفت، به شرط این‌که شهرستان معلوم باشد
  const fallbackCounty = value.countyId ?? (mode === 'county' ? county || null : closeBy[0]?.countyId ?? null);
  const canNext = !!value.mosqueId || !!fallbackCounty;
  const next = () => { const v = value.mosqueId ? value : { ...value, countyId: fallbackCounty }; onChange(v); onNext(v); };
  const countiesOf = (p: string) => provinces.data?.find((x) => x.id === p)?.counties ?? [];

  const sel = (on: boolean) => `grid size-5 shrink-0 place-items-center rounded-full border-2 ${on ? 'border-leaf' : 'border-line-strong'}`;
  return (
    <section className="rise flex flex-1 flex-col">
      <h1 className="text-[26px] font-extrabold leading-tight">{COPY[role][0]}</h1>
      <p className="mt-2 text-[15px] text-muted">{COPY[role][1]}</p>

      {mode === 'ask' && value.mosqueId && (
        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-leaf bg-leaf-soft px-4 py-3.5">
          <span className="grid size-5 shrink-0 place-items-center rounded-full border-2 border-leaf"><span className="size-2.5 rounded-full bg-leaf" /></span>
          <b className="min-w-0 flex-1 truncate text-[15px] text-ink">{value.mosqueName}</b>
          <button type="button" className="shrink-0 py-1 text-[13px] font-bold text-leaf-ink" onClick={() => onChange({ ...value, mosqueId: null, mosqueName: null })}>عوض کن</button>
        </div>
      )}

      {mode === 'ask' && !value.mosqueId && (
        <div className="mt-8 grid gap-3">
          <button type="button" className="btn btn-primary btn-lg w-full" onClick={locate} disabled={locating}>{locating ? <><InlineSpinner />در حال پیدا کردن…</> : <><LocateFixed className="size-5" />مسجدهای نزدیکم را پیدا کن</>}</button>
          <button type="button" className="btn btn-ghost w-full" onClick={() => setMode('county')}>شهرستانم را دستی انتخاب می‌کنم</button>
          <p className="text-center text-[13px] text-muted">مکانت فقط برای همین جست‌وجوست و ذخیره نمی‌شود.</p>
        </div>
      )}

      {geoErr && <p className="mt-6 flex items-start gap-2 rounded-xl bg-flame-soft px-3 py-2.5 text-sm text-flame-ink" role="status"><CircleAlert className="mt-0.5 size-4 shrink-0" />{geoErr}</p>}

      {mode === 'county' && (
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="field"><label htmlFor="ob-prov">استان</label><select id="ob-prov" className="input h-12" value={prov} onChange={(e) => { setProv(e.target.value); setCounty(''); onChange({ ...value, mosqueId: null, mosqueName: null, countyId: null }); }}><option value="">انتخاب کن</option>{provinces.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div className="field"><label htmlFor="ob-county">شهرستان</label><select id="ob-county" className="input h-12" value={county} disabled={!prov} onChange={(e) => { setCounty(e.target.value); onChange({ ...value, mosqueId: null, mosqueName: null, countyId: e.target.value || null }); }}><option value="">انتخاب کن</option>{countiesOf(prov).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        </div>
      )}

      {params && (
        <div className="mt-6 grid gap-4">
          <Suspense fallback={<div className="grid h-52 place-items-center rounded-2xl bg-sunken"><InlineSpinner /></div>}>
            <MosqueMap center={adding && pin ? pin : center} zoom={here ? 15 : list.some((m) => m.lat != null) ? 13 : 5} me={here} mosques={adding ? [] : list} selected={value.mosqueId} onPick={(id) => { const m = list.find((x) => x.id === id); if (m) pick(m); }} pin={adding ? pin : null} onPin={adding ? setPin : undefined} />
          </Suspense>

          {!adding && (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <b className="text-[15px] text-ink">{farOnly ? 'نزدیکت هنوز مسجدی ثبت نشده' : mode === 'here' ? 'مسجد تو کدام است؟' : 'مسجدهای این شهرستان'}</b>
                {mode === 'here' && <button type="button" className="shrink-0 py-1 text-[13px] font-bold text-muted" onClick={() => setMode('county')}>انتخاب شهرستان</button>}
              </div>
              {(all.length > 5 || q) && <div className="relative"><Search className="pointer-events-none absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" /><input className="input h-11 pe-10" placeholder="جست‌وجوی نام مسجد" value={q} onChange={(e) => setQ(e.target.value)} aria-label="جست‌وجوی نام مسجد" /></div>}
              <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card" role="radiogroup" aria-label="مسجدها">
                {near.isLoading && <div className="grid h-16 place-items-center"><InlineSpinner /></div>}
                {list.map((m) => (
                  <button key={m.id} type="button" role="radio" aria-checked={value.mosqueId === m.id} onClick={() => pick(m)} className={`flex w-full items-center gap-3 px-4 py-3.5 text-start transition-colors ${value.mosqueId === m.id ? 'bg-leaf-soft' : 'hover:bg-sunken'}`}>
                    <span className={sel(value.mosqueId === m.id)}>{value.mosqueId === m.id && <span className="size-2.5 rounded-full bg-leaf" />}</span>
                    <span className="grid min-w-0 flex-1"><b className="truncate text-[15px] text-ink">{m.name}</b><span className="truncate text-[13px] text-muted">{m.address || m.county}{m.verified ? '' : '، منتظر تأیید'}</span></span>
                    {m.distance != null && <span className="tnum shrink-0 text-[13px] text-muted">{dist(m.distance)}</span>}
                  </button>
                ))}
                {!near.isLoading && !list.length && <p className="px-4 py-4 text-sm text-muted">{q ? 'مسجدی با این نام نیست.' : 'این‌جا هنوز مسجدی ثبت نشده.'}</p>}
                <button type="button" className="flex w-full items-center gap-3 px-4 py-3.5 text-start font-bold text-leaf-ink hover:bg-sunken" onClick={startAdd}><Plus className="size-5 shrink-0" />مسجدم در فهرست نیست</button>
              </div>
            </>
          )}

          {adding && (
            <div className="grid gap-4">
              <p className="text-sm text-muted">روی نقشه، جای مسجد را بزن. ستاد یک بار تأییدش می‌کند.</p>
              <div className="field"><label htmlFor="nm">نام مسجد</label><input id="nm" className="input h-12" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="مثلاً مسجد امام حسن (ع)" autoFocus /></div>
              {needCounty && <div className="grid grid-cols-2 gap-3">
                <div className="field"><label htmlFor="nm-prov">استان</label><select id="nm-prov" className="input h-12" value={newProv} onChange={(e) => { setNewProv(e.target.value); setNewCounty(''); }}><option value="">انتخاب کن</option>{provinces.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                <div className="field"><label htmlFor="nm-county">شهرستان</label><select id="nm-county" className="input h-12" value={newCounty} disabled={!newProv} onChange={(e) => setNewCounty(e.target.value)}><option value="">انتخاب کن</option>{countiesOf(newProv).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              </div>}
              {!pin && <p className="hint">هنوز جای مسجد روی نقشه مشخص نشده.</p>}
            </div>
          )}
        </div>
      )}

      <StepFooter>
        {adding ? (<>
          <button className="btn btn-ghost btn-lg" onClick={() => setAdding(false)}>انصراف</button>
          <button className="btn btn-primary btn-lg flex-1" disabled={newName.trim().length < 3 || !pin || (needCounty && !newCounty) || add.isPending} onClick={() => add.mutate()}>{add.isPending ? <InlineSpinner /> : null}ثبت مسجد</button>
        </>) : (<>
          <button className="btn btn-ghost btn-lg" onClick={onBack}>برگرد</button>
          {(mode !== 'ask' || value.mosqueId) && <button className="btn btn-primary btn-lg flex-1" disabled={!canNext || finishing} onClick={next}>{finishing ? <InlineSpinner /> : null}{value.mosqueId || !canNext ? 'شروع کن' : 'مسجد را بعداً می‌گویم'}</button>}
        </>)}
      </StepFooter>
    </section>
  );
}
