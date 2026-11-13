/*
 * پنل برگزارکننده: محتوای ما (سه دکمه: مسیر، دوره، پخش زنده)، مسیرساز، کتابخانهٔ مشترک، راهیاران، گزارش اثر.
 * برگزارکننده می‌سازد و برای بازبینی می‌فرستد؛ ستاد منتشر می‌کند.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, ChevronLeft, Compass, Library, Plus, Radio, Route, Trash2, TrendingUp } from 'lucide-react';
import { useEffect, useState, Suspense } from 'react';
import { Link, NavLink, Outlet, useNavigate, useParams } from 'react-router';
import { Brand } from '../components/Shell';
import { ROLE_FA } from '../components/Path2';
import { Dialog, Empty, ErrorBox, InlineSpinner, Spinner, useToast } from '../components/ui';
import { api, errorText } from '../lib/api';
import { useAuth } from '../lib/auth';
import { fa, jDate, jShort } from '../lib/fa';
import type { ActorRole, PathSize } from '../lib/types';

const NAV = [
  { to: '/pub', label: 'محتوای ما', icon: BookOpen, end: true },
  { to: '/pub/paths/new', label: 'مسیرساز', icon: Route },
  { to: '/pub/library', label: 'کتابخانهٔ مشترک', icon: Library },
  { to: '/pub/rahyars', label: 'راهیاران', icon: Compass },
  { to: '/pub/impact', label: 'گزارش اثر', icon: TrendingUp },
];
const STATUS_CHIP: Record<string, string> = { DRAFT: '', IN_REVIEW: 'chip-flame', PUBLISHED: 'chip-leaf', RETURNED: 'chip-rose', ARCHIVED: '' };

export function PubShell() {
  const { me } = useAuth();
  if (!me?.publisher) return <Empty title="این بخش برای برگزارکنندگان است">اگر سازمان یا گروه شما می‌خواهد مسیر یا دوره منتشر کند، از <Link to="/help" className="font-bold text-leaf-ink">پشتیبانی</Link> درخواست بدهید.</Empty>;
  return (
    <div className="min-h-dvh bg-bg md:grid md:grid-cols-[248px_1fr]">
      <aside className="border-b border-line bg-ink text-white md:min-h-dvh md:border-b-0">
        <div className="flex items-center justify-between p-4 md:block"><span className="[&_img]:brightness-0 [&_img]:invert"><Brand compact /></span><div className="mt-0 md:mt-4 flex items-center gap-2"><span className="size-3 rounded-full" style={{ background: me.publisher.color }} /><b className="text-sm">{me.publisher.name}</b></div></div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:grid md:gap-0.5" aria-label="بخش‌های پنل برگزارکننده">
          {NAV.map((s) => <NavLink key={s.to} to={s.to} end={s.end} className={({ isActive }) => `flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm no-underline ${isActive ? 'bg-white/15 font-bold text-white' : 'text-white/80 hover:bg-white/10'}`}><s.icon className="size-[18px]" />{s.label}</NavLink>)}
          <Link to="/" className="mt-2 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/70 no-underline hover:bg-white/10"><ChevronLeft className="size-4" />نمای کنشگر</Link>
        </nav>
      </aside>
      <main className="wrap py-6 md:py-10"><Suspense fallback={<Spinner />}><Outlet /></Suspense></main>
    </div>
  );
}

interface PubData {
  publisher: { id: string; name: string; color: string; status: string };
  paths: { id: string; slug: string; title: string; size: PathSize; sizeFa: string; status: string; statusFa: string; returnNote: string | null; enrolled: number; steps: number; hasRahyar: boolean; rahyar: { name: string } | null; submittedAt: string | null }[];
  courses: { id: string; slug: string; title: string; status: string; statusFa: string; lessonCount: number; learners: number; libraryShare: string; version: number; usedIn: string[]; instructor?: string | null }[];
  lives: { id: string; title: string; startsAt: string; status: string; statusFa: string; registered: number }[];
  stats: { enrolled: number; growth: number; inReview: number };
}

export function PubHome() {
  const q = useQuery({ queryKey: ['v2', 'pub'], queryFn: () => api<PubData>('/v2/pub') });
  const qc = useQueryClient();
  const nav = useNavigate();
  const toast = useToast();
  const [newCourse, setNewCourse] = useState<string | null>(null);
  const create = useMutation({ mutationFn: (title: string) => api<{ id: string }>('/v2/pub/courses', { body: { title } }), onSuccess: (c) => { qc.invalidateQueries({ queryKey: ['v2', 'pub'] }); nav(`/pub/courses/${c.id}`); } });
  const submitCourse = useMutation({ mutationFn: (id: string) => api(`/v2/pub/courses/${id}/submit`, { method: 'POST', body: {} }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['v2', 'pub'] }); toast('رفت برای بازبینی؛ ستاد تا دو روز کاری پاسخ می‌دهد'); } });
  const assign = useMutation({ mutationFn: ({ id, mobile }: { id: string; mobile: string }) => api(`/v2/pub/courses/${id}/instructor`, { body: { mobile } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['v2', 'pub'] }); toast('دوره به استودیوی استاد سپرده شد'); } });
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  const d = q.data!;
  const empty = !d.paths.length && !d.courses.length && !d.lives.length;
  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-[clamp(24px,3vw,32px)] font-extrabold">محتوای {d.publisher.name}</h1><p className="mt-1 text-muted">مسیر، دوره یا فقط پخش زنده؛ هر کدام جدا منتشر می‌شود.</p></div>
        <div className="flex gap-4 text-sm"><span><b className="tnum text-2xl font-extrabold text-ink">{fa(d.stats.enrolled)}</b> <span className="text-muted">کنشگر</span></span><span><b className="tnum text-2xl font-extrabold text-ink">{fa(d.stats.growth)}</b> <span className="text-muted">گام رشد</span></span>{d.stats.inReview > 0 && <span className="chip chip-flame self-center">{fa(d.stats.inReview)} در بازبینی</span>}</div>
      </header>
      <div className="grid gap-3 sm:grid-cols-3">
        {[{ t: 'مسیر تازه', d: 'خرد، میانه یا کلان؛ با دوره‌های خودت یا دیگران', icon: Route, go: () => nav('/pub/paths/new') }, { t: 'دورهٔ تازه', d: 'درس‌های صوتی، ویدیویی، متنی؛ تکلیف و آزمون', icon: BookOpen, go: () => setNewCourse('') }, { t: 'پخش زندهٔ تازه', d: 'بدون مسیر هم می‌شود؛ ضبطش بعداً به مسیر می‌چسبد', icon: Radio, go: () => nav('/manage/events/new') }].map((x) => (
          <button key={x.t} type="button" onClick={x.go} className="card is-link grid gap-2 p-5 text-start"><span className="grid size-11 place-items-center rounded-2xl bg-deep-soft text-deep"><x.icon className="size-5" /></span><b className="text-ink">{x.t}</b><span className="text-sm text-muted">{x.d}</span></button>
        ))}
      </div>
      {empty && <Empty icon={Plus} title="هنوز چیزی نساخته‌ای">از یک دوره یا یک پخش زنده شروع کن؛ مسیر را بعداً از همان‌ها می‌سازی.</Empty>}
      {!!d.paths.length && (
        <section className="grid gap-3"><h2 className="text-lg font-extrabold">مسیرها</h2>
          <div className="card divide-y divide-line">{d.paths.map((p) => <Link key={p.id} to={`/pub/paths/${p.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 no-underline"><span className="min-w-0 flex-1"><b className="block text-ink">{p.title}</b><span className="text-sm text-muted">{p.sizeFa}، {fa(p.steps)} {p.size === 'micro' ? 'هفته' : 'پله'}، {fa(p.enrolled)} کنشگر{p.hasRahyar ? `، راهیار: ${p.rahyar?.name ?? 'تعیین نشده'}` : ''}</span>{p.returnNote && <span className="mt-1 block rounded-lg bg-rose-soft px-2 py-1 text-sm text-rose-ink">ستاد: {p.returnNote}</span>}</span><span className={`chip ${STATUS_CHIP[p.status]}`}>{p.statusFa}{p.status === 'IN_REVIEW' && p.submittedAt ? `، از ${jShort(p.submittedAt)}` : ''}</span></Link>)}</div></section>
      )}
      {!!d.courses.length && (
        <section className="grid gap-3"><h2 className="text-lg font-extrabold">دوره‌ها</h2>
          <div className="card divide-y divide-line">{d.courses.map((c) => <div key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3"><span className="min-w-0 flex-1"><b className="block text-ink">{c.title}</b><span className="text-sm text-muted">{fa(c.lessonCount)} درس، {fa(c.learners)} کنشگر، نسخهٔ {fa(c.version)}{c.instructor ? `، استاد: ${c.instructor}` : ''}{c.usedIn.length ? `، در مسیر دیگران: ${c.usedIn.join('، ')}` : ''}</span></span><button className="btn btn-ghost btn-sm" onClick={() => { const m = prompt('شمارهٔ موبایل استاد:'); if (m?.trim()) assign.mutate({ id: c.id, mobile: m.trim() }); }}>{c.instructor ? 'تغییر استاد' : 'سپردن به استاد'}</button><span className={`chip ${STATUS_CHIP[c.status]}`}>{c.statusFa}</span><Link to={`/pub/courses/${c.id}`} className="btn btn-secondary btn-sm">ویرایش</Link>{(c.status === 'DRAFT' || c.status === 'RETURNED') && <button className="btn btn-primary btn-sm" onClick={() => submitCourse.mutate(c.id)}>بفرست برای بازبینی</button>}</div>)}</div></section>
      )}
      {!!d.lives.length && (
        <section className="grid gap-3"><h2 className="text-lg font-extrabold">پخش‌های زنده</h2>
          <div className="card divide-y divide-line">{d.lives.map((e) => <Link key={e.id} to={`/manage/events/${e.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 no-underline"><span className="grid size-10 place-items-center rounded-xl bg-rose-soft text-rose-ink"><Radio className="size-5" /></span><span className="min-w-0 flex-1"><b className="block text-ink">{e.title}</b><span className="text-sm text-muted">{jDate(e.startsAt)}، {fa(e.registered)} یادآوری‌خواه</span></span><span className={`chip ${STATUS_CHIP[e.status]}`}>{e.statusFa}</span></Link>)}</div></section>
      )}
      <Dialog open={newCourse !== null} onClose={() => setNewCourse(null)} title="دورهٔ تازه">
        <div className="grid gap-3"><label className="field"><span>عنوان دوره</span><input className="input" value={newCourse ?? ''} onChange={(e) => setNewCourse(e.target.value)} placeholder="تا ۶ کلمه" autoFocus /></label><p className="text-sm text-muted">بعدش درس‌ها را می‌سازی؛ در هر مسیری قابل استفاده است.</p><div className="flex gap-2"><button className="btn btn-primary" disabled={!newCourse?.trim() || create.isPending} onClick={() => create.mutate(newCourse!.trim())}>بساز</button><button className="btn btn-ghost" onClick={() => setNewCourse(null)}>برگرد</button></div></div>
      </Dialog>
    </div>
  );
}

/* ───────── مسیرساز ───────── */
interface LibItem { kind: 'course' | 'path' | 'live'; id: string; title: string; publisher: { id: string; name: string; color: string } | null; mine: boolean; needsApproval?: boolean; sizeFa?: string }
interface Draft { id?: string; title: string; size: PathSize; description: string; audience: ActorRole[]; hasRahyar: boolean; steps: { id?: string; title: string; rule: string; items: { kind: string; refId: string; optional: boolean; title: string }[] }[] }
const SIZE_OPTS: { k: PathSize; t: string; d: string }[] = [{ k: 'micro', t: 'خرد', d: 'یک تا چهار هفته، هر هفته یک درس و یک کار' }, { k: 'mid', t: 'میانه', d: 'یک فصل، چند دوره، گواهی' }, { k: 'macro', t: 'کلان', d: 'چندساله، با پله و قاعدهٔ گذار' }];

export function PubPathBuilder() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const qc = useQueryClient();
  const nav = useNavigate();
  const toast = useToast();
  const lib = useQuery({ queryKey: ['v2', 'pub', 'library'], queryFn: () => api<{ courses: LibItem[]; paths: LibItem[]; lives: LibItem[] }>('/v2/pub/library') });
  const existing = useQuery({ queryKey: ['v2', 'pub', 'path', id], queryFn: () => api<any>(`/v2/pub/paths/${id}`), enabled: !isNew });
  const [d, setD] = useState<Draft>({ title: '', size: 'micro', description: '', audience: [], hasRahyar: true, steps: [{ title: '', rule: '', items: [] }] });
  const [picker, setPicker] = useState<number | null>(null);
  const [err, setErr] = useState<string[]>([]);
  useEffect(() => { if (existing.data) { const p = existing.data; setD({ id: p.id, title: p.title, size: p.size, description: p.description ?? '', audience: p.audience ?? [], hasRahyar: !!p.hasRahyar, steps: p.steps.map((s: any) => ({ id: s.id, title: s.title, rule: s.rule ?? '', items: s.items.map((it: any) => ({ ...it, title: it.title ?? titleOf(it) })) })) }); } }, [existing.data]);
  const all = [...(lib.data?.courses ?? []), ...(lib.data?.paths ?? []), ...(lib.data?.lives ?? [])];
  const titleOf = (it: { kind: string; refId: string }) => all.find((x) => x.kind === it.kind && x.id === it.refId)?.title ?? '';
  const save = useMutation({ mutationFn: () => api<{ id: string; status: string }>('/v2/pub/paths', { body: { ...d, steps: d.steps.map((s) => ({ ...s, items: s.items.map(({ kind, refId, optional }) => ({ kind, refId, optional })) })) } }), onSuccess: (r) => { qc.invalidateQueries({ queryKey: ['v2', 'pub'] }); setD((x) => ({ ...x, id: r.id })); toast('پیش‌نویس ذخیره شد'); if (isNew) nav(`/pub/paths/${r.id}`, { replace: true }); } });
  const submit = useMutation({ mutationFn: async () => { const r = await api<{ id: string }>('/v2/pub/paths', { body: { ...d, steps: d.steps.map((s) => ({ ...s, items: s.items.map(({ kind, refId, optional }) => ({ kind, refId, optional })) })) } }); return api(`/v2/pub/paths/${r.id}/submit`, { method: 'POST', body: {} }); }, onSuccess: () => { qc.invalidateQueries({ queryKey: ['v2', 'pub'] }); toast('رفت برای بازبینی؛ ستاد تا دو روز کاری پاسخ می‌دهد'); nav('/pub'); }, onError: (e: any) => setErr(e?.data?.problems ?? [errorText(e)]) });
  const unit = d.size === 'micro' ? 'هفتهٔ' : d.size === 'macro' ? 'پلهٔ' : 'بخش';
  const status: string | undefined = existing.data?.status;
  const stepS = (i: number, patch: Partial<Draft['steps'][number]>) => setD((x) => ({ ...x, steps: x.steps.map((s, k) => (k === i ? { ...s, ...patch } : s)) }));
  return (
    <div className="grid gap-8">
      <nav className="text-sm text-muted"><Link to="/pub" className="text-leaf-ink">محتوای ما</Link> / مسیرساز</nav>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-[clamp(24px,3vw,32px)] font-extrabold">{isNew ? 'مسیر تازه' : d.title || 'مسیر'}</h1><p className="mt-1 text-muted">{status === 'IN_REVIEW' ? 'در بازبینی ستاد؛ تا پاسخ، ویرایش بسته است.' : status === 'PUBLISHED' ? 'منتشرشده؛ تغییرها بعد از ذخیره دیده می‌شوند.' : 'دوره‌های خودت یا کتابخانهٔ مشترک را در پله‌ها بچین.'}</p></div>
        <div className="flex gap-2">{d.id && <Link to={`/paths/${existing.data?.slug ?? ''}`} className="btn btn-ghost">پیش‌نمایش از دید کنشگر</Link>}<button className="btn btn-secondary" disabled={save.isPending || status === 'IN_REVIEW'} onClick={() => save.mutate()}>ذخیرهٔ پیش‌نویس</button>{status !== 'PUBLISHED' && <button className="btn btn-primary" disabled={submit.isPending || status === 'IN_REVIEW'} onClick={() => { setErr([]); submit.mutate(); }}>بفرست برای بازبینی</button>}</div>
      </header>
      {!!err.length && <div className="rounded-2xl bg-rose-soft p-4 text-rose-ink"><b>پیش از ارسال:</b><ul className="mt-1 list-inside list-disc">{err.map((x) => <li key={x}>{x}</li>)}</ul></div>}
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="grid content-start gap-4">
          <div className="card grid gap-4 p-5">
            <label className="field"><span>عنوان مسیر</span><input className="input" value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} placeholder="تا ۶ کلمه" /></label>
            <label className="field"><span>یک جمله برای کنشگر</span><textarea className="input min-h-[84px] py-2" value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} placeholder="آخر مسیر چه چیزی عوض شده؟" /></label>
            <div className="grid gap-2"><b className="text-sm text-ink">اندازه</b>{SIZE_OPTS.map((o) => <button key={o.k} type="button" aria-pressed={d.size === o.k} onClick={() => setD({ ...d, size: o.k })} className={`flex items-center gap-3 rounded-2xl border p-3 text-start ${d.size === o.k ? 'border-deep bg-deep-soft' : 'border-line hover:border-line-strong'}`}><span className="flex-1"><b className="block text-ink">{o.t}</b><span className="text-sm text-muted">{o.d}</span></span></button>)}</div>
            <div className="grid gap-2"><b className="text-sm text-ink">مخاطب</b><div className="flex flex-wrap gap-2">{(['IMAM', 'SHARIK', 'BAZU', 'HASTEH'] as ActorRole[]).map((r) => <button key={r} type="button" aria-pressed={d.audience.includes(r)} onClick={() => setD({ ...d, audience: d.audience.includes(r) ? d.audience.filter((x) => x !== r) : [...d.audience, r] })} className={`h-9 rounded-full border px-3.5 text-[13px] font-bold ${d.audience.includes(r) ? 'border-deep bg-deep-soft text-deep' : 'border-line bg-card text-body'}`}>{ROLE_FA[r]}</button>)}</div><span className="text-xs text-muted">خالی = همه. ثبت‌نام فقط برای مخاطب است، دیدن برای همه.</span></div>
            <label className="flex items-center gap-3 text-sm"><input type="checkbox" className="size-5 accent-[var(--leaf)]" checked={d.hasRahyar} onChange={(e) => setD({ ...d, hasRahyar: e.target.checked })} />با راهیار (تکلیف میدانی و روایت دارد)</label>
          </div>
          <div className="card grid gap-2 p-5 text-sm"><b className="text-ink">پیش از ارسال</b>{[[!!d.title.trim() && !!d.description.trim(), 'عنوان و جمله'], [d.steps.some((s) => s.items.length), 'دست‌کم یک دوره یا پخش زنده'], [!d.hasRahyar || true, 'با راهیار: دست‌کم یک تکلیف میدانی در دوره‌ها'], [true, 'محتوای دیگران با نام سازنده می‌آید']].map(([ok, t], i) => <span key={i} className={`flex items-center gap-2 ${ok ? 'text-leaf-ink' : 'text-muted'}`}><span className={`size-2 rounded-full ${ok ? 'bg-leaf' : 'bg-line-strong'}`} />{t as string}</span>)}</div>
        </div>
        <div className="grid content-start gap-3">
          <div className="flex items-center justify-between"><h2 className="text-lg font-extrabold">{d.size === 'mid' ? 'بخش‌ها' : d.size === 'micro' ? 'هفته‌ها' : 'پله‌ها'}</h2><button className="btn btn-secondary btn-sm" onClick={() => setD({ ...d, steps: [...d.steps, { title: '', rule: '', items: [] }] })}><Plus className="size-4" />{unit === 'بخش' ? 'بخش' : unit.replace('ٔ', '')}</button></div>
          {d.steps.map((s, i) => (
            <section key={i} className="card grid gap-3 p-4">
              <div className="flex flex-wrap items-center gap-2"><span className="grid size-9 place-items-center rounded-full bg-sunken font-extrabold text-ink">{fa(i + 1)}</span><input className="input h-10 flex-1" value={s.title} onChange={(e) => stepS(i, { title: e.target.value })} placeholder={`${unit} ${fa(i + 1)}: عنوان`} />{d.size !== 'mid' && <input className="input h-10 w-56" value={s.rule} onChange={(e) => stepS(i, { rule: e.target.value })} placeholder="رفتن به بعدی با…" />}{d.steps.length > 1 && <button className="btn btn-ghost btn-icon btn-sm" aria-label="حذف" onClick={() => setD({ ...d, steps: d.steps.filter((_, k) => k !== i) })}><Trash2 className="size-4" /></button>}</div>
              <div className="grid gap-1.5">
                {s.items.map((it, j) => { const src = all.find((x) => x.kind === it.kind && x.id === it.refId); return <div key={j} className="flex items-center gap-3 rounded-xl bg-sunken px-3 py-2"><span className={`chip ${it.kind === 'live' ? 'chip-rose' : it.kind === 'path' ? 'chip-leaf' : 'chip-flame'}`}>{it.kind === 'live' ? 'پخش زنده' : it.kind === 'path' ? src?.sizeFa ?? 'مسیر' : 'دوره'}</span><span className="min-w-0 flex-1"><b className="block truncate text-ink">{it.title || src?.title}</b>{src?.publisher && !src.mine && <span className="text-xs text-muted">از {src.publisher.name}</span>}</span><label className="flex items-center gap-1.5 text-xs text-muted"><input type="checkbox" checked={it.optional} onChange={(e) => stepS(i, { items: s.items.map((x, k) => (k === j ? { ...x, optional: e.target.checked } : x)) })} />اختیاری</label><button className="btn btn-ghost btn-icon btn-sm" aria-label="حذف" onClick={() => stepS(i, { items: s.items.filter((_, k) => k !== j) })}><Trash2 className="size-4" /></button></div>; })}
                <button type="button" className="rounded-xl border border-dashed border-line-strong px-3 py-2.5 text-sm font-bold text-deep hover:bg-sunken" onClick={() => setPicker(i)}>+ دوره، مسیر یا پخش زنده</button>
              </div>
            </section>
          ))}
        </div>
      </div>
      <Dialog open={picker !== null} onClose={() => setPicker(null)} title="از کتابخانهٔ مشترک" wide>
        {lib.isLoading ? <InlineSpinner /> : <Picker all={all} onPick={(it) => { if (picker == null) return; stepS(picker, { items: [...d.steps[picker].items, { kind: it.kind, refId: it.id, optional: false, title: it.title }] }); setPicker(null); }} />}
      </Dialog>
    </div>
  );
}

function Picker({ all, onPick }: { all: LibItem[]; onPick: (it: LibItem) => void }) {
  const [q, setQ] = useState('');
  const [k, setK] = useState<'all' | 'course' | 'path' | 'live' | 'mine'>('all');
  const list = all.filter((x) => (k === 'all' || (k === 'mine' ? x.mine : x.kind === k)) && (!q.trim() || x.title.includes(q.trim())));
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2"><input className="input h-10 flex-1" placeholder="جست‌وجو" value={q} onChange={(e) => setQ(e.target.value)} /><div className="seg seg-pill">{([['all', 'همه'], ['mine', 'مال ما'], ['course', 'دوره'], ['path', 'مسیر خرد/میانه'], ['live', 'پخش زنده']] as const).map(([kk, t]) => <button key={kk} aria-pressed={k === kk} onClick={() => setK(kk)}>{t}</button>)}</div></div>
      <div className="grid max-h-[50vh] gap-1.5 overflow-auto">{list.map((it) => <button key={it.kind + it.id} type="button" onClick={() => onPick(it)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-start hover:bg-sunken"><span className={`chip ${it.kind === 'live' ? 'chip-rose' : it.kind === 'path' ? 'chip-leaf' : 'chip-flame'}`}>{it.kind === 'live' ? 'پخش زنده' : it.kind === 'path' ? it.sizeFa : 'دوره'}</span><span className="min-w-0 flex-1"><b className="block truncate text-ink">{it.title}</b><span className="text-xs text-muted">{it.mine ? 'مال ما' : `از ${it.publisher?.name}${it.needsApproval ? '، با تأیید سازنده' : ''}`}</span></span><Plus className="size-4 text-deep" /></button>)}{!list.length && <p className="p-3 text-sm text-muted">چیزی پیدا نشد.</p>}</div>
      <p className="text-xs text-muted">دوره‌های دیگران با نام سازنده‌شان در مسیر شما نشان داده می‌شوند و به نسخهٔ فعلی‌شان وصل می‌مانند.</p>
    </div>
  );
}

/* ───────── کتابخانهٔ مشترک ───────── */
export function PubLibrary() {
  const lib = useQuery({ queryKey: ['v2', 'pub', 'library'], queryFn: () => api<{ courses: LibItem[]; paths: LibItem[]; lives: LibItem[] }>('/v2/pub/library') });
  if (lib.isLoading) return <Spinner />;
  const d = lib.data!;
  const Row = ({ it }: { it: LibItem }) => <div className="flex items-center gap-3 px-4 py-3"><span className="min-w-0 flex-1"><b className="block text-ink">{it.title}</b><span className="text-sm text-muted">{it.mine ? 'مال ما' : `از ${it.publisher?.name}`}{it.needsApproval ? '، استفاده با تأیید سازنده' : ''}</span></span>{it.publisher ? <span className="size-2.5 rounded-full" style={{ background: it.publisher.color }} /> : null}</div>;
  return (
    <div className="grid gap-8">
      <header><h1 className="text-[clamp(24px,3vw,32px)] font-extrabold">کتابخانهٔ مشترک</h1><p className="mt-1 max-w-2xl text-muted">دوره‌ها و مسیرهای کوتاهی که برگزارکنندگان برای استفادهٔ دیگران باز گذاشته‌اند. در مسیرساز با «+ دوره» اضافه می‌شوند؛ نام سازنده همیشه کنار دوره می‌ماند و مسیر شما به نسخهٔ ثابت وصل است.</p></header>
      <section className="grid gap-3"><h2 className="text-lg font-extrabold">دوره‌ها ({fa(d.courses.length)})</h2><div className="card divide-y divide-line">{d.courses.map((it) => <Row key={it.id} it={it} />)}</div></section>
      <section className="grid gap-3"><h2 className="text-lg font-extrabold">مسیرهای خرد و میانه ({fa(d.paths.length)})</h2><div className="card divide-y divide-line">{d.paths.map((it) => <Row key={it.id} it={it} />)}</div></section>
      {!!d.lives.length && <section className="grid gap-3"><h2 className="text-lg font-extrabold">پخش‌های زنده</h2><div className="card divide-y divide-line">{d.lives.map((it) => <Row key={it.id} it={it} />)}</div></section>}
    </div>
  );
}

/* ───────── راهیاران ───────── */
export function PubRahyars() {
  const qc = useQueryClient();
  const toast = useToast();
  const q = useQuery({ queryKey: ['v2', 'pub', 'rahyars'], queryFn: () => api<{ rows: { userId: string; name: string; mobile: string; path: { id: string; title: string }; learners: number; avgDays: number }[]; missing: { id: string; title: string; learners: number }[]; paths: { id: string; title: string }[] }>('/v2/pub/rahyars') });
  const [mobile, setMobile] = useState(''); const [pathId, setPathId] = useState('');
  const invite = useMutation({ mutationFn: () => api('/v2/pub/rahyars', { body: { mobile, pathId } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['v2', 'pub', 'rahyars'] }); setMobile(''); toast('دعوت رفت؛ با همین شماره وارد می‌شود'); } });
  if (q.isLoading) return <Spinner />;
  const d = q.data!;
  return (
    <div className="grid gap-8">
      <header><h1 className="text-[clamp(24px,3vw,32px)] font-extrabold">راهیاران مسیرها</h1><p className="mt-1 text-muted">هر مسیرِ با تکلیف باید راهیار داشته باشد. با شماره دعوت کن؛ با همان شماره وارد می‌شود. راهیار می‌تواند بیرون از سازمان شما باشد.</p></header>
      {!!d.missing.length && <div className="rounded-2xl bg-rose-soft p-4 text-rose-ink"><b>مسیر بی‌راهیار:</b> {d.missing.map((m) => `${m.title} (${fa(m.learners)} کنشگر)`).join('، ')}؛ تا تعیین راهیار، روایت‌ها به راهیار مسیر اصلیِ کنشگر می‌رود.</div>}
      <div className="card divide-y divide-line">{d.rows.map((r) => <div key={r.userId + r.path.id} className="flex flex-wrap items-center gap-3 px-4 py-3"><span className="grid size-10 place-items-center rounded-full bg-dome-soft font-extrabold text-dome-ink">{r.name[0]}</span><span className="min-w-0 flex-1"><b className="block text-ink">{r.name}</b><span className="text-sm text-muted" dir="ltr">{r.mobile}</span></span><span className="text-sm text-body">{r.path.title}</span><span className="text-sm text-muted">{fa(r.learners)} کنشگر</span><span className="chip chip-leaf">فعال</span></div>)}{!d.rows.length && <p className="p-4 text-muted">هنوز راهیاری دعوت نکرده‌ای.</p>}</div>
      <form className="card grid gap-3 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={(e) => { e.preventDefault(); invite.mutate(); }}>
        <label className="field"><span>شمارهٔ موبایل راهیار</span><input className="input" dir="ltr" inputMode="tel" placeholder="0912…" value={mobile} onChange={(e) => setMobile(e.target.value)} /></label>
        <label className="field"><span>مسیر</span><select className="input" value={pathId} onChange={(e) => setPathId(e.target.value)}><option value="">انتخاب کن</option>{d.paths.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
        <button className="btn btn-primary" disabled={!mobile || !pathId || invite.isPending}>دعوت بفرست</button>
      </form>
    </div>
  );
}

/* ───────── گزارش اثر ───────── */
export function PubImpact() {
  const q = useQuery({ queryKey: ['v2', 'pub', 'impact'], queryFn: () => api<{ rows: { id: string; title: string; sizeFa: string; enrolled: number; active: number; growth: number; dropped: number; rahyar: string | null }[]; others: { title: string; paths: { title: string; publisher: string }[] }[]; totals: { enrolled: number; active: number; growth: number } }>('/v2/pub/impact') });
  if (q.isLoading) return <Spinner />;
  const d = q.data!;
  return (
    <div className="grid gap-8">
      <header><h1 className="text-[clamp(24px,3vw,32px)] font-extrabold">گزارش اثر</h1><p className="mt-1 text-muted">نه بازدید، نه دقیقهٔ تماشا. چند نفر برداشتند، چند نفر در حرکت‌اند، چند گام رشد تأیید شد.</p></header>
      <div className="grid gap-3 sm:grid-cols-3">{[['کنشگرِ برداشته', d.totals.enrolled], ['در حرکت (روایت در ۳ هفتهٔ اخیر)', d.totals.active], ['گام رشد تأییدشده', d.totals.growth]].map(([t, v]) => <div key={t as string} className="stat card p-5"><span className="text-sm text-muted">{t}</span><b className="n block">{fa(v as number)}</b></div>)}</div>
      <div className="card overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-start text-muted">{['مسیر', 'برداشته', 'در حرکت', 'گام رشد', 'افتاده', 'راهیار'].map((h) => <th key={h} className="px-4 py-3 text-start font-bold">{h}</th>)}</tr></thead><tbody>{d.rows.map((r) => <tr key={r.id} className="border-t border-line"><td className="px-4 py-3"><b className="text-ink">{r.title}</b><span className="block text-xs text-muted">{r.sizeFa}</span></td><td className="tnum px-4 py-3">{fa(r.enrolled)}</td><td className="tnum px-4 py-3">{fa(r.active)}</td><td className="tnum px-4 py-3 font-bold text-leaf-ink">{fa(r.growth)}</td><td className={`tnum px-4 py-3 ${r.dropped > 0 ? 'text-rose-ink' : ''}`}>{fa(r.dropped)}</td><td className="px-4 py-3">{r.rahyar ?? <span className="text-rose-ink">بی راهیار</span>}</td></tr>)}{!d.rows.length && <tr><td colSpan={6} className="p-4 text-muted">هنوز مسیری منتشر نشده. بعد از انتشار، لینک مسیر را بفرست.</td></tr>}</tbody></table></div>
      <section className="card grid gap-2 p-5"><b className="text-ink">محتوای ما در مسیر دیگران</b>{d.others.length ? <ul className="grid gap-1 text-sm text-body">{d.others.map((o) => <li key={o.title}>{o.title}: {o.paths.map((p) => `«${p.title}» (${p.publisher})`).join('، ')}</li>)}</ul> : <p className="text-sm text-muted">هنوز کسی از دوره‌های شما در مسیرش استفاده نکرده.</p>}</section>
    </div>
  );
}

