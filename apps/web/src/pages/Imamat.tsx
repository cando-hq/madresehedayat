import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Wheel } from '../components/Wheel';
import { ErrorBox, Spinner, useToast } from '../components/ui';
import { api, errorText } from '../lib/api';
import { ago, fa } from '../lib/fa';
import { LEVELS, PETALS, SECTORS, SPIRAL, sectorPct, useImamat, type Imamat, type SectorKey } from '../lib/imamat';

/** چهار سطح، صعودی */
export function LevelTrack({ level, dark }: { level: number; dark?: boolean }) {
  return (
    <ol className="m-0 flex list-none flex-wrap items-end gap-3 p-0">
      {LEVELS.map((l, i) => {
        const now = l.n === level, done = l.n < level;
        return (
          <li key={l.n} aria-current={now ? 'step' : undefined} style={{ minHeight: 110 + i * 26 }}
            className={`flex min-w-[140px] flex-1 flex-col justify-end rounded-2xl border-2 p-4 ${now ? 'border-flame bg-card text-ink' : dark ? (done ? 'border-white/25 bg-white/15 text-white' : 'border-white/15 bg-white/5 text-white') : done ? 'border-line bg-sunken' : 'border-dashed border-line bg-card'}`}>
            <span className="text-xs font-bold">{now ? 'اکنون اینجایید' : done ? 'گذرانده' : 'قدم بعد'}</span>
            <b className="text-lg font-extrabold">سطح {fa(l.n)}: {l.name}</b>
            <span className={`text-xs ${dark && !now ? 'text-white/80' : 'text-muted'}`}>{l.focus}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function SectorBars({ im }: { im: Imamat }) {
  return (
    <div className="grid gap-3">
      {(Object.keys(SECTORS) as SectorKey[]).map((k) => { const v = sectorPct(im, k); return (
        <div key={k} className="grid gap-1.5">
          <div className="flex justify-between text-sm"><b className="text-ink">{SECTORS[k].name}</b><span className="tnum text-muted">٪{fa(Math.round(v))}</span></div>
          <div className="bar"><span style={{ width: `${v}%`, background: SECTORS[k].c }} /></div>
        </div>
      ); })}
    </div>
  );
}

/** کارت خانه و کارنامه */
export function ImamatCard() {
  const q = useImamat();
  if (!q.data?.isImam) return null;
  const im = q.data; const last = im.assessments[0];
  return (
    <section className="card grid gap-4 p-6" aria-labelledby="imt-h">
      <div className="flex items-end justify-between gap-3">
        <div><h2 id="imt-h" className="text-lg font-extrabold">فرایند تعیّن امامت شما</h2><p className="text-sm text-muted">سطح {fa(im.level)}: {LEVELS[im.level - 1].name}؛ هر گلبرگ یک شایستگی و هر حلقه یک سطح</p></div>
        <Link to="/imamat" className="text-sm font-bold text-deep">دیدن کامل</Link>
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <Link to="/imamat" className="shrink-0" aria-label="دیدن کامل فرایند تعیّن امامت"><Wheel levels={im.petals} size={220} /></Link>
        <div className="grid min-w-[220px] flex-1 gap-4">
          <SectorBars im={im} />
          {last && <p className="rounded-xl bg-flame-soft p-3 text-sm leading-7 text-ink"><b>یادداشت راهیار:</b> {last.note}</p>}
        </div>
      </div>
    </section>
  );
}

export default function ImamatPage() {
  const q = useImamat();
  const [sel, setSel] = useState('sahne');
  const cat = useQuery({ queryKey: ['catalog'], queryFn: () => api<{ id: string; slug: string; title: string; petal?: string | null }[]>('/courses') });
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  const im = q.data!; const p = PETALS.find((x) => x.id === sel)!; const s = SECTORS[p.sector]; const lv = im.petals[sel] ?? 0;
  const related = (cat.data ?? []).slice(0, 3);
  return (
    <div className="stagger grid gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl"><h1 className="text-[clamp(24px,3vw,34px)] font-extrabold">فرایند تعیّن امامت</h1>
          <p className="mt-2 leading-8 text-muted">امامت تعیّنی است، نه تعیینی؛ با حکم آغاز می‌شود و در میدان ساخته می‌شود. ۲۴ شایستگی در چهار عرصه، هر کدام در چهار سطح. سطح را راهیار با ارزیابی میدانی ثبت می‌کند.</p></div>
        <div className="flex flex-wrap gap-3 text-sm">{(Object.keys(SECTORS) as SectorKey[]).map((k) => <span key={k} className="flex items-center gap-1.5"><span className="size-3 rounded" style={{ background: SECTORS[k].c }} />{SECTORS[k].name}</span>)}</div>
      </header>
      {im.isImam && (
        <section className="hero-blue grid gap-5 rounded-[28px] p-7 text-white">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><span className="text-sm font-bold text-flame">سطح شما</span><h2 className="text-2xl font-extrabold text-white">{LEVELS[im.level - 1].name}</h2></div>
            <span className="text-sm text-white/80">مرحله در مارپیچ رشد: <b className="text-white">{SPIRAL[im.spiral - 1]}</b></span></div>
          <LevelTrack level={im.level} dark />
          <div className="flex flex-wrap items-center gap-5 rounded-2xl bg-white/10 p-4"><img src="/brand/spiral.jpg" alt="مارپیچ رشد امام" className="h-28 w-auto rounded-xl" /><p className="min-w-[220px] flex-1 text-sm leading-7 text-white/90">امام در پنج مرحله رشد می‌کند و در هر دور، همان کنش‌ها عمیق‌تر می‌شوند. مرکز ثابت مارپیچ در همهٔ مراحل: تربیت نفس، الگو بودن و رفتار مهربانانه.</p></div>
        </section>
      )}
      <section className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="card grid place-items-center p-6"><Wheel levels={im.isImam ? im.petals : {}} selected={sel} onPick={setSel} size={600} /><span className="mt-2 text-sm text-muted">روی هر گلبرگ بزنید.</span></div>
        <aside className="card grid gap-4 p-6">
          <span className="chip w-fit" style={{ background: s.soft, color: s.ink }}>{s.name}</span>
          <h2 className="text-xl font-extrabold">{p.name}</h2><p className="leading-8 text-body">{p.desc}</p>
          <ol className="m-0 grid list-none gap-2 p-0">{LEVELS.map((l, k) => (
            <li key={l.n} className="flex items-center gap-3 rounded-xl p-3" style={{ background: k < lv ? s.soft : 'var(--sunken)' }}>
              <span className="grid size-8 place-items-center rounded-full text-sm font-extrabold" style={{ background: k < lv ? s.c : 'var(--card)', color: k < lv ? '#fff' : 'var(--muted)' }}>{fa(l.n)}</span>
              <b className="flex-1 text-sm text-ink">{l.name}</b><span className="text-xs font-bold" style={{ color: k < lv ? s.ink : 'var(--deep)' }}>{k < lv ? 'رسیده' : k === lv ? 'قدم بعد' : ''}</span>
            </li>))}</ol>
          {related.length > 0 && <div className="grid gap-2"><b className="text-sm text-ink">برای حلقهٔ بعد</b>{related.map((c) => <Link key={c.id} to={`/courses/${c.slug}`} className="flex items-center gap-2 rounded-xl bg-sunken p-3 text-sm font-bold text-ink no-underline">{c.title}<ChevronLeft className="ms-auto size-4 text-muted" /></Link>)}</div>}
          {!im.isImam && <p className="text-sm text-muted">سطح شایستگی‌ها برای امامان با ارزیابی میدانی راهیار ثبت می‌شود.</p>}
        </aside>
      </section>
      {im.assessments.length > 0 && (
        <section className="card grid gap-3 p-6"><h2 className="text-lg font-extrabold">ارزیابی‌های راهیار</h2>
          {im.assessments.map((a) => <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-sunken p-3 text-sm"><span className="chip chip-flame">سطح {fa(a.level)}</span><span className="min-w-0 flex-1">{a.note}</span><span className="text-muted">{a.by.name} · {ago(a.createdAt)}</span></div>)}</section>
      )}
    </div>
  );
}

/** پنل راهیار: ارزیابی میدانی امام */
export function AssessPanel({ learnerId }: { learnerId: string }) {
  const qc = useQueryClient(); const toast = useToast();
  const q = useQuery({ queryKey: ['imamat', learnerId], queryFn: () => api<Imamat>(`/rahyar/learners/${learnerId}/imamat`) });
  const [f, setF] = useState<{ level: number; spiral: number; note: string; petals: Record<string, number> } | null>(null);
  const save = useMutation({
    mutationFn: (body: object) => api<Imamat>(`/rahyar/learners/${learnerId}/assess`, { body }),
    onSuccess: (d) => { qc.setQueryData(['imamat', learnerId], d); setF(null); toast('ارزیابی ثبت شد و امام خبردار شد'); },
    onError: (e) => toast(errorText(e), 'err'),
  });
  if (!q.data?.isImam) return null;
  const im = q.data; const v = f ?? { level: im.level, spiral: im.spiral, note: '', petals: { ...im.petals } };
  const set = (x: Partial<typeof v>) => setF({ ...v, ...x });
  return (
    <section className="card grid gap-4 p-6" aria-labelledby="as-h">
      <div><h2 id="as-h" className="text-lg font-extrabold">ارزیابی میدانی</h2><p className="text-sm text-muted">سطح امامت را پس از دیدار در مسجد ثبت کنید؛ سطح از میدان می‌آید، نه از نمرهٔ دوره‌ها. یادداشت را امام هم می‌بیند.</p></div>
      <fieldset className="grid gap-2"><legend className="mb-1 text-sm font-bold text-ink">سطح امام</legend>
        {LEVELS.map((l) => <label key={l.n} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${v.level === l.n ? 'border-deep bg-deep-soft' : 'border-line'}`}><input type="radio" name="lvl" checked={v.level === l.n} onChange={() => set({ level: l.n })} /><b className="text-ink">سطح {fa(l.n)}: {l.name}</b><span className="text-xs text-muted">{l.focus}</span></label>)}
      </fieldset>
      <div className="field"><label htmlFor="sp">مرحله در مارپیچ رشد</label><select id="sp" className="input" value={v.spiral} onChange={(e) => set({ spiral: +e.target.value })}>{SPIRAL.map((s, i) => <option key={i} value={i + 1}>{fa(i + 1)}. {s}</option>)}</select></div>
      <details className="rounded-xl bg-sunken p-3"><summary className="cursor-pointer text-sm font-bold text-ink">سطح ۲۴ شایستگی (اختیاری)</summary>
        <div className="mt-3 grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(170px,1fr))]">{PETALS.map((p) => (
          <label key={p.id} className="grid gap-1 text-xs font-bold text-ink">{p.name}<select className="input !h-10" value={v.petals[p.id] ?? 0} onChange={(e) => set({ petals: { ...v.petals, [p.id]: +e.target.value } })}>{[0, 1, 2, 3, 4].map((k) => <option key={k} value={k}>{fa(k)}</option>)}</select></label>))}</div>
      </details>
      <div className="field"><label htmlFor="nt">یادداشت دیدار</label><textarea id="nt" className="input" value={v.note} onChange={(e) => set({ note: e.target.value })} placeholder="قوت‌ها و قدم بعدی" /></div>
      <button className="btn btn-primary w-fit" disabled={save.isPending || !v.note.trim()} onClick={() => save.mutate(v)}>ثبت ارزیابی</button>
      {im.assessments.length > 0 && <div className="grid gap-2"><b className="text-sm text-ink">ارزیابی‌های قبلی</b>{im.assessments.map((a) => <div key={a.id} className="flex flex-wrap gap-2 rounded-xl bg-sunken p-3 text-sm"><span className="chip chip-flame">سطح {fa(a.level)}</span><span className="flex-1">{a.note}</span><span className="text-muted">{ago(a.createdAt)}</span></div>)}</div>}
    </section>
  );
}
