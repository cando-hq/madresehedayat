/*
 * قدم «مسجدت کجاست؟» در آشنایی اولیه (۱.۱۱): نقشه‌محور.
 * - همان اول مکان را می‌خواهیم؛ نقشه روی تو باز می‌شود و نزدیک‌ترین مسجدهای مرکز نقشه زیرش می‌آیند.
 *   مکان ندادی؟ نقشهٔ ایران باز است: بکش و بزرگ کن، یا اسم مسجد را جستجو کن.
 * - زدن یک مسجد (روی نقشه یا فهرست): نقشه رویش زوم می‌کند و کارتش پایین صفحه با «همین است» می‌آید.
 * - مسجدت نبود: نشانگر ثابت وسط نقشه، نقشه را زیرش جابه‌جا کن، اسم را بنویس و ثبت کن (ستاد بعداً نگاهش می‌کند).
 * شهرستان کاربر از مسجد انتخاب‌شده می‌آید؛ «فعلاً رد شو» شهرستان نزدیک‌ترین مسجد مرکز نقشه را می‌گیرد.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Check, CircleAlert, LocateFixed, MapPin, Plus, Search, X } from 'lucide-react';
import type { ActorRole } from '../lib/types';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { api, type ApiError } from '../lib/api';
import { fa } from '../lib/fa';
import type { MapHandle } from './MosqueMap';
import { InlineSpinner, useToast } from './ui';

const MosqueMap = lazy(() => import('./MosqueMap'));

export interface Near { id: string; name: string; address: string | null; lat: number | null; lng: number | null; verified: boolean; distance: number | null; countyId: string; county: string; provinceId: string }
interface Province { id: string; name: string; counties: { id: string; name: string }[] }
export interface MosqueChoice { mosqueId: string | null; mosqueName: string | null; countyId: string | null; lat: number | null; lng: number | null }

const IRAN = { lat: 32.6, lng: 54.0, zoom: 5 };
const meters = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371e3, p1 = a.lat * Math.PI / 180, p2 = b.lat * Math.PI / 180, dp = p2 - p1, dl = (b.lng - a.lng) * Math.PI / 180;
  return 2 * R * Math.asin(Math.sqrt(Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2));
};
const dist = (m: number) => (m < 1000 ? `${fa(Math.max(10, Math.round(m / 10) * 10))} متر` : `${fa((m / 1000).toFixed(m < 10_000 ? 1 : 0))} کیلومتر`);
const SUB: Record<ActorRole, string> = {
  IMAM: 'همان مسجدی که امامش هستی.',
  SHARIK: 'مسجدی که همسرت امامش است.',
  BAZU: 'مسجدی که در آن کنار امام کار می‌کنی.',
  HASTEH: 'مسجدی که در آن فعالی.',
  OTHER: 'مسجد محله‌ات، یا هر مسجدی که بیشتر می‌روی.',
};
function useDebounced<T>(v: T, ms: number) { const [d, setD] = useState(v); useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]); return d; }

export function MosqueStep({ role, value, onChange, onNext, onBack, finishing }: { role: ActorRole; value: MosqueChoice; onChange: (v: MosqueChoice) => void; onNext: (v: MosqueChoice) => void; onBack: () => void; finishing?: boolean }) {
  const toast = useToast(); const qc = useQueryClient();
  const map = useRef<MapHandle>(null);
  const known = value.lat != null && value.lng != null ? { lat: value.lat, lng: value.lng } : null;
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(known);
  const [geo, setGeo] = useState<'asking' | 'ok' | 'off'>(known ? 'ok' : 'asking');
  const [start] = useState(known ? { ...known, zoom: 15 } : IRAN);
  const [view, setView] = useState(start);
  const [focus, setFocus] = useState<{ lat: number; lng: number; zoom: number; n: number } | null>(null);
  const fly = (p: { lat: number; lng: number }, zoom: number) => setFocus((f) => ({ lat: p.lat, lng: p.lng, zoom, n: (f?.n ?? 0) + 1 }));
  const [q, setQ] = useState('');
  const [chosen, setChosen] = useState<Near | null>(null);
  const [pinMode, setPinMode] = useState(false);
  const [newName, setNewName] = useState('');
  const [needCounty, setNeedCounty] = useState(false);
  const [newProv, setNewProv] = useState('');
  const [newCounty, setNewCounty] = useState('');

  const locate = () => {
    if (!navigator.geolocation) { setGeo('off'); return; }
    setGeo('asking');
    navigator.geolocation.getCurrentPosition(
      (p) => { const h = { lat: p.coords.latitude, lng: p.coords.longitude }; setMe(h); setGeo('ok'); fly(h, 15); onChange({ ...value, lat: h.lat, lng: h.lng }); },
      () => setGeo('off'),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!known) locate(); }, []);

  const v = useDebounced(view, 350);
  const dq = useDebounced(q.trim(), 300);
  const zoomedOut = v.zoom < 11 && !dq; // روی کل ایران «نزدیک‌ترین» معنا ندارد
  const near = useQuery({
    queryKey: ['v2', 'near', v.lat.toFixed(3), v.lng.toFixed(3), dq], enabled: !zoomedOut,
    queryFn: () => api<Near[]>(`/v2/mosques/near?lat=${v.lat}&lng=${v.lng}&limit=12&q=${encodeURIComponent(dq)}`),
    placeholderData: (p) => p,
  });
  const list = zoomedOut ? [] : near.data ?? [];
  const onMap = chosen && !list.some((m) => m.id === chosen.id) ? [chosen, ...list] : list;

  const pick = (m: Near) => {
    setChosen(m); setPinMode(false);
    onChange({ ...value, mosqueId: m.id, mosqueName: m.name, countyId: m.countyId });
    if (m.lat != null && m.lng != null) fly({ lat: m.lat, lng: m.lng }, 17);
  };
  const unpick = () => { setChosen(null); onChange({ ...value, mosqueId: null, mosqueName: null }); };
  const startPin = (p?: { lat: number; lng: number }) => { unpick(); setPinMode(true); setNeedCounty(false); if (p) fly(p, Math.max(v.zoom, 17)); else if (v.zoom < 15 && map.current) fly(map.current.center(), 16); };

  const provinces = useQuery({ queryKey: ['geo', 'provinces'], queryFn: () => api<Province[]>('/geo/provinces'), staleTime: Infinity, enabled: needCounty });
  const countiesOf = (p: string) => provinces.data?.find((x) => x.id === p)?.counties ?? [];
  const add = useMutation({
    mutationFn: () => { const c = map.current!.center(); return api<Near>('/v2/mosques', { body: { name: newName.trim(), lat: c.lat, lng: c.lng, countyId: needCounty ? newCounty || undefined : undefined } }); },
    onSuccess: (m) => {
      const nv = { ...value, mosqueId: m.id, mosqueName: newName.trim(), countyId: m.countyId };
      onChange(nv); qc.invalidateQueries({ queryKey: ['v2', 'near'] }); toast('مسجدت ثبت شد'); onNext(nv);
    },
    onError: (e) => { if ((e as ApiError).code === 'no_county') { setNeedCounty(true); setNewProv(list[0]?.provinceId ?? ''); setNewCounty(list[0]?.countyId ?? ''); } toast((e as Error).message, 'err'); },
  });

  // رد شدن بی مسجد: شهرستان نزدیک‌ترین مسجد مرکز نقشه
  const skipCounty = value.countyId ?? (!zoomedOut ? list[0]?.countyId ?? null : null);
  const skip = () => { const nv = { ...value, mosqueId: null, mosqueName: null, countyId: skipCounty }; onChange(nv); onNext(nv); };
  const done = () => { if (value.mosqueId) onNext(value); };

  const away = (m: Near) => (me && m.lat != null && m.lng != null ? dist(meters(me, { lat: m.lat, lng: m.lng })) : m.county);

  return (
    <section className="rise -mx-4 flex flex-1 flex-col sm:mx-0">
      <div className="px-4 sm:px-0">
        <h1 className="text-[26px] font-extrabold leading-tight">{pinMode ? 'مسجدت دقیقاً کجاست؟' : 'مسجدت کجاست؟'}</h1>
        <p className="mt-1.5 text-[15px] text-muted">{pinMode ? 'نقشه را بکش تا نشانگر روی مسجدت بنشیند.' : SUB[role]}</p>
        {!pinMode && (
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute end-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
            <input className="input h-12 pe-11 text-[15px]" placeholder="اسم مسجد را بنویس" value={q} onChange={(e) => { setQ(e.target.value); }} aria-label="جستجوی اسم مسجد" enterKeyHint="search" />
            {q && <button type="button" className="absolute start-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center text-muted" onClick={() => setQ('')} aria-label="پاک کردن جستجو"><X className="size-4" /></button>}
          </div>
        )}
      </div>

      <div className="relative mt-3">
        <Suspense fallback={<div className="grid h-[44dvh] min-h-64 place-items-center bg-sunken sm:rounded-2xl"><InlineSpinner /></div>}>
          <MosqueMap ref={map} start={start} me={me} mosques={pinMode ? [] : onMap} selected={chosen?.id ?? null} crosshair={pinMode} focus={focus}
            onPick={(id) => { const m = onMap.find((x) => x.id === id); if (m) pick(m); }}
            onMove={(c) => setView(c)} onTap={(p) => startPin(p)} className="h-[44dvh] min-h-64 sm:rounded-2xl" />
        </Suspense>
        <button type="button" onClick={() => (me ? fly(me, 16) : locate())} className="absolute bottom-3 start-3 z-[600] grid size-11 place-items-center rounded-full bg-card text-ink shadow-md ring-1 ring-line" aria-label="برو به جای من">
          {geo === 'asking' ? <InlineSpinner /> : <LocateFixed className="size-5" />}
        </button>
      </div>

      <div className="flex-1 px-4 pt-4 sm:px-0">
        {pinMode ? (
          <div className="grid gap-3">
            <div className="field"><label htmlFor="nm">اسم مسجد</label><input id="nm" className="input h-12" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="مثلاً مسجد امام حسن (ع)" autoFocus /></div>
            {needCounty && <div className="grid grid-cols-2 gap-3">
              <div className="field"><label htmlFor="nm-prov">استان</label><select id="nm-prov" className="input h-12" value={newProv} onChange={(e) => { setNewProv(e.target.value); setNewCounty(''); }}><option value="">انتخاب کن</option>{provinces.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div className="field"><label htmlFor="nm-county">شهرستان</label><select id="nm-county" className="input h-12" value={newCounty} disabled={!newProv} onChange={(e) => setNewCounty(e.target.value)}><option value="">انتخاب کن</option>{countiesOf(newProv).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            </div>}
          </div>
        ) : zoomedOut ? (
          <p className="flex items-start gap-2 rounded-2xl bg-sunken px-4 py-3.5 text-[15px] text-body">
            <MapPin className="mt-0.5 size-5 shrink-0 text-leaf" />
            {geo === 'asking' ? 'دارم جایت را پیدا می‌کنم…' : geo === 'off' ? 'جایت را نداریم. اشکالی ندارد: اسم مسجد را بنویس، یا نقشه را روی محله‌ات بزرگ کن.' : 'نقشه را روی محله‌ات بزرگ کن.'}
          </p>
        ) : (
          <div role="radiogroup" aria-label="مسجدها" className="grid">
            {near.isLoading && !list.length && <div className="grid h-16 place-items-center"><InlineSpinner /></div>}
            {!near.isLoading && !list.length && <p className="py-3 text-[15px] text-muted">{dq ? `مسجدی به اسم «${dq}» این اطراف نیست.` : 'این اطراف مسجدی نداریم.'}</p>}
            {list.map((m) => {
              const on = chosen?.id === m.id;
              return (
                <button key={m.id} type="button" role="radio" aria-checked={on} onClick={() => pick(m)}
                  className={`flex items-center gap-3 border-b border-line py-3 text-start last:border-0 ${on ? 'text-leaf-ink' : ''}`}>
                  <span className={`grid size-9 shrink-0 place-items-center rounded-full ${on ? 'bg-leaf text-white' : 'bg-sunken text-muted'}`}>{on ? <Check className="size-5" /> : <MapPin className="size-4" />}</span>
                  <span className="grid min-w-0 flex-1"><b className="truncate text-[15px] text-ink">{m.name}</b>{m.address && <span className="truncate text-[13px] text-muted">{m.address}</span>}</span>
                  <span className="tnum shrink-0 text-[13px] text-muted">{away(m)}</span>
                </button>
              );
            })}
            <button type="button" className="flex items-center gap-3 py-3.5 text-start font-bold text-leaf-ink" onClick={() => startPin()}>
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-leaf-soft"><Plus className="size-5" /></span>مسجدم این‌جا نیست
            </button>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 z-[700] mt-2 border-t border-line bg-bg/95 px-4 pt-3 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:px-0" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        {pinMode ? (
          <div className="flex items-center gap-2">
            <button type="button" className="btn btn-ghost btn-lg" onClick={() => setPinMode(false)}>انصراف</button>
            <button type="button" className="btn btn-primary btn-lg flex-1" disabled={newName.trim().length < 3 || (needCounty && !newCounty) || add.isPending || finishing} onClick={() => add.mutate()}>{add.isPending || finishing ? <InlineSpinner /> : null}ثبت و ادامه</button>
          </div>
        ) : chosen ? (
          <div className="grid gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-leaf text-white"><Check className="size-5" /></span>
              <span className="grid min-w-0 flex-1"><b className="truncate text-[17px] text-ink">{chosen.name}</b><span className="truncate text-[13px] text-muted">{chosen.county}{me && chosen.lat != null ? `، ${away(chosen)} از تو` : ''}</span></span>
              <button type="button" className="shrink-0 py-2 text-sm font-bold text-muted" onClick={unpick}>عوض کن</button>
            </div>
            <button type="button" className="btn btn-primary btn-lg w-full" onClick={done} disabled={finishing}>{finishing ? <InlineSpinner /> : null}همین است</button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button type="button" className="btn btn-ghost btn-lg" onClick={onBack} aria-label="برگرد"><ArrowRight className="size-5" /></button>
            <p className="flex-1 text-center text-[13px] text-muted">مسجدت را روی نقشه یا فهرست بزن</p>
            {skipCounty && <button type="button" className="btn btn-ghost btn-lg text-muted" onClick={skip} disabled={finishing}>بعداً</button>}
          </div>
        )}
        {geo === 'off' && !pinMode && !chosen && <p className="mt-2 flex items-center justify-center gap-1.5 text-[12px] text-muted"><CircleAlert className="size-3.5" />جایت فقط برای پیدا کردن مسجد است و جایی ذخیره نمی‌شود.</p>}
      </div>
    </section>
  );
}
