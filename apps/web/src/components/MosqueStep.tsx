/*
 * قدم «مسجد تو» در آشنایی اولیه:
 * ۱) مکانت را می‌گیریم ← ۲) «این مسجدها نزدیک تو هستند؛ مسجد تو کدام است؟» ← ۳) اگر نبود، ثبتش کن.
 * کسی که مکان نمی‌دهد استان و شهرستان را انتخاب می‌کند و مسجدهای همان شهرستان را می‌بیند.
 * شهرستان کاربر از مسجد انتخاب‌شده می‌آید (یا نزدیک‌ترین مسجد، یا انتخاب دستی)؛ برای همین در فرم ثبت‌نام نیست.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, CircleAlert, LocateFixed, MapPin, Plus, Search } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import { api } from '../lib/api';
import { fa } from '../lib/fa';
import { InlineSpinner, useToast } from './ui';

const MosqueMap = lazy(() => import('./MosqueMap'));

export interface Near { id: string; name: string; address: string | null; lat: number | null; lng: number | null; verified: boolean; distance: number | null; countyId: string; county: string; provinceId: string }
interface Province { id: string; name: string; counties: { id: string; name: string }[] }
export interface MosqueChoice { mosqueId: string | null; mosqueName: string | null; countyId: string | null; lat: number | null; lng: number | null; relation: string }

const IRAN = { lat: 32.4, lng: 53.7 };
const dist = (m: number | null) => m == null ? '' : m < 1000 ? `${fa(Math.round(m / 10) * 10)} متر` : `${fa((m / 1000).toFixed(1))} کیلومتر`;
const RELATIONS = ['امام جماعت', 'شریکة‌الامام', 'بازو', 'عضو هسته', 'نمازگزار'];

export function MosqueStep({ value, onChange, onNext, onBack }: { value: MosqueChoice; onChange: (v: MosqueChoice) => void; onNext: () => void; onBack: () => void }) {
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

  const provinces = useQuery({ queryKey: ['geo', 'provinces'], queryFn: () => api<Province[]>('/geo/provinces'), staleTime: Infinity });
  const params = mode === 'here' && here ? `lat=${here.lat}&lng=${here.lng}` : mode === 'county' && county ? `county=${county}&limit=30` : '';
  const near = useQuery({ queryKey: ['v2', 'near', params, q], enabled: !!params, queryFn: () => api<Near[]>(`/v2/mosques/near?${params}&q=${encodeURIComponent(q)}`) });
  const all = near.data ?? [];
  // «نزدیک تو» یعنی تا ۲۰ کیلومتر؛ اگر نزدیک کاربر هیچ مسجدی ثبت نشده بود، سه نزدیک‌ترین را با عنوان روشن نشان می‌دهیم
  const closeBy = mode === 'here' && !q ? all.filter((m) => m.distance != null && m.distance <= 20_000) : all;
  const farOnly = mode === 'here' && !q && !closeBy.length && all.length > 0;
  const list = farOnly ? all.slice(0, 3) : closeBy;
  const chosen = list.find((m) => m.id === value.mosqueId);
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
  const startAdd = () => { setAdding(true); setPin(here ?? (list[0]?.lat != null ? { lat: list[0].lat!, lng: list[0].lng! } : null)); setNewCounty(guessCounty); setNewProv(guessProv); };
  const add = useMutation({
    mutationFn: () => api<Near>('/v2/mosques', { body: { name: newName.trim(), lat: pin?.lat, lng: pin?.lng, countyId: newCounty || undefined } }),
    onSuccess: (m) => { onChange({ ...value, mosqueId: m.id, mosqueName: newName.trim(), countyId: m.countyId }); setAdding(false); setNewName(''); qc.invalidateQueries({ queryKey: ['v2', 'near'] }); toast('مسجدت ثبت شد؛ ستاد یک بار نگاهش می‌کند'); },
    onError: (e) => toast((e as Error).message, 'err'),
  });
  // بدون انتخاب مسجد هم می‌شود رفت، به شرط این‌که شهرستان معلوم باشد
  const fallbackCounty = value.countyId ?? (mode === 'county' ? county || null : closeBy[0]?.countyId ?? null);
  const canNext = !!value.mosqueId || !!fallbackCounty;
  const next = () => { if (!value.mosqueId) onChange({ ...value, countyId: fallbackCounty }); onNext(); };
  const countiesOf = (p: string) => provinces.data?.find((x) => x.id === p)?.counties ?? [];

  return (
    <section className="rise grid gap-5">
      <div>
        <h1 className="text-[clamp(24px,3vw,32px)] font-extrabold">مسجد تو کجاست؟</h1>
        <p className="mt-1 text-muted">برای گعده‌های نزدیک، تیم‌های همین مسجد و راهیار منطقه‌ات. مکانت فقط برای پیدا کردن مسجد است و به کسی نشان داده نمی‌شود.</p>
      </div>

      {mode === 'ask' && (
        <div className="card grid gap-4 p-5">
          <div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-leaf-soft text-leaf-ink"><LocateFixed className="size-5" /></span>
            <div><b className="text-ink">مسجدهای نزدیکت را پیدا کنیم؟</b><p className="text-sm text-muted">گوشی یک بار اجازهٔ مکان می‌خواهد؛ بعد مسجدهای اطرافت را با فاصله نشانت می‌دهیم.</p></div></div>
          <button type="button" className="btn btn-primary btn-lg" onClick={locate} disabled={locating}>{locating ? <><InlineSpinner />در حال پیدا کردن مکان…</> : <><LocateFixed className="size-5" />مکانم را پیدا کن</>}</button>
          <button type="button" className="btn btn-ghost" onClick={() => setMode('county')}>مکان نمی‌دهم؛ شهرستانم را انتخاب می‌کنم</button>
        </div>
      )}

      {geoErr && <p className="flex items-start gap-2 rounded-xl bg-flame-soft px-3 py-2 text-sm text-flame-ink" role="status"><CircleAlert className="mt-0.5 size-4 shrink-0" />{geoErr}</p>}

      {mode === 'county' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="field"><label htmlFor="ob-prov">استان</label><select id="ob-prov" className="input" value={prov} onChange={(e) => { setProv(e.target.value); setCounty(''); onChange({ ...value, mosqueId: null, mosqueName: null, countyId: null }); }}><option value="">انتخاب کن</option>{provinces.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div className="field"><label htmlFor="ob-county">شهرستان</label><select id="ob-county" className="input" value={county} disabled={!prov} onChange={(e) => { setCounty(e.target.value); onChange({ ...value, mosqueId: null, mosqueName: null, countyId: e.target.value || null }); }}><option value="">انتخاب کن</option>{countiesOf(prov).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          {!here && <button type="button" className="w-fit text-sm font-bold text-leaf-ink sm:col-span-2" onClick={locate}><LocateFixed className="me-1 inline size-4" />دوباره مکانم را امتحان کن</button>}
        </div>
      )}

      {params && (
        <>
          <Suspense fallback={<div className="grid h-[300px] place-items-center rounded-[22px] border border-line bg-sunken"><InlineSpinner /></div>}>
            <MosqueMap center={adding && pin ? pin : center} zoom={here ? 15 : list.some((m) => m.lat != null) ? 13 : 5} me={here} mosques={adding ? [] : list} selected={value.mosqueId} onPick={(id) => { const m = list.find((x) => x.id === id); if (m) pick(m); }} pin={adding ? pin : null} onPin={adding ? setPin : undefined} />
          </Suspense>

          {!adding && (
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <b className="text-ink">{farOnly ? 'نزدیک تو هنوز مسجدی ثبت نشده. اگر مسجدت این‌ها نیست، ثبتش کن.' : mode === 'here' ? 'این مسجدها نزدیک تو هستند. مسجد تو کدام است؟' : 'مسجدهای این شهرستان. مسجد تو کدام است؟'}</b>
              </div>
              <div className="relative"><Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted" /><input className="input pe-9" placeholder="جست‌وجوی نام مسجد" value={q} onChange={(e) => setQ(e.target.value)} aria-label="جست‌وجوی نام مسجد" /></div>
              <div className="grid gap-2" role="radiogroup" aria-label="مسجدها">
                {near.isLoading && <InlineSpinner />}
                {list.map((m) => (
                  <button key={m.id} type="button" role="radio" aria-checked={value.mosqueId === m.id} onClick={() => pick(m)} className={`flex min-h-14 items-center gap-3 rounded-2xl border p-3 text-start transition-colors ${value.mosqueId === m.id ? 'border-deep bg-deep-soft' : 'border-line bg-card hover:border-line-strong'}`}>
                    <MapPin className={`size-5 shrink-0 ${value.mosqueId === m.id ? 'text-deep' : 'text-muted'}`} />
                    <span className="grid flex-1"><b className="text-ink">{m.name}</b><span className="text-xs text-muted">{[m.address, m.county].filter(Boolean).join('، ')}{m.verified ? '' : ' · منتظر تأیید ستاد'}</span></span>
                    {m.distance != null && <span className="tnum shrink-0 text-sm font-bold text-muted">{dist(m.distance)}</span>}
                  </button>
                ))}
                {!near.isLoading && !list.length && <p className="rounded-xl bg-sunken p-3 text-sm text-muted">{q ? 'مسجدی با این نام پیدا نشد.' : 'هنوز مسجدی این‌جا ثبت نشده.'} مسجدت را ثبت کن؛ بقیهٔ اهل محل هم پیدایش می‌کنند.</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-secondary w-fit" onClick={startAdd}><Plus className="size-4" />مسجدم در فهرست نیست؛ ثبتش کن</button>
                {mode === 'here' && <button type="button" className="btn btn-ghost w-fit" onClick={() => setMode('county')}>شهرستانم را دستی انتخاب می‌کنم</button>}
              </div>
            </div>
          )}

          {adding && (
            <div className="card grid gap-3 p-4">
              <b className="text-ink">ثبت مسجد تازه</b>
              <p className="text-sm text-muted">نامش را بنویس و روی نقشه، روی خود مسجد بزن تا نقطهٔ زرد آن‌جا برود. ستاد یک بار تأییدش می‌کند.</p>
              <div className="field"><label htmlFor="nm">نام مسجد</label><input id="nm" className="input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="مثلاً مسجد امام حسن (ع)" /></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="field"><label htmlFor="nm-prov">استان</label><select id="nm-prov" className="input" value={newProv} onChange={(e) => { setNewProv(e.target.value); setNewCounty(''); }}><option value="">انتخاب کن</option>{provinces.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                <div className="field"><label htmlFor="nm-county">شهرستان</label><select id="nm-county" className="input" value={newCounty} disabled={!newProv} onChange={(e) => setNewCounty(e.target.value)}><option value="">انتخاب کن</option>{countiesOf(newProv).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              </div>
              {!pin && <p className="hint">روی نقشه بزن تا جای مسجد مشخص شود.</p>}
              <div className="flex flex-wrap gap-2"><button type="button" className="btn btn-primary" disabled={newName.trim().length < 3 || !newCounty || !pin || add.isPending} onClick={() => add.mutate()}>{add.isPending ? <InlineSpinner /> : null}ثبت مسجد</button><button type="button" className="btn btn-ghost" onClick={() => setAdding(false)}>برگرد به فهرست</button></div>
            </div>
          )}
        </>
      )}

      {(value.mosqueId || chosen) && (
        <div className="grid gap-2"><b className="text-sm text-ink">نسبت تو با {value.mosqueName ?? 'این مسجد'}</b><div className="flex flex-wrap gap-2">{RELATIONS.map((r) => <button key={r} type="button" aria-pressed={value.relation === r} onClick={() => onChange({ ...value, relation: r })} className={`h-10 rounded-full border px-3.5 text-[13px] font-bold ${value.relation === r ? 'border-deep bg-deep-soft text-deep' : 'border-line bg-card text-body'}`}>{r}</button>)}</div></div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button className="btn btn-primary btn-lg" disabled={!canNext || adding} onClick={next}>ادامه<ChevronLeft className="size-5" /></button>
        <button className="btn btn-ghost" onClick={onBack}>برگرد</button>
        {!value.mosqueId && canNext && !adding && <span className="text-sm text-muted">مسجدت را بعداً هم می‌شود گفت.</span>}
      </div>
    </section>
  );
}
