/*
 * ستاد ← برگزارکنندگان: فهرست با جست‌وجو و وضعیت، و پروفایل هر برگزارکننده
 * (تیم و دعوت‌های منتظر، محتوا، مشخصات، تاریخچه).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, BookOpen, Building2, Clock, Plus, Route, Search, Trash2, UserPlus, Users } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ask } from '../../components/Confirm';
import { Dialog, Empty, ErrorBox, Spinner, useToast } from '../../components/ui';
import { api, errorText } from '../../lib/api';
import { ago, fa, jDate } from '../../lib/fa';

export interface TeamMember { id: string; name: string; mobile: string; active: boolean; lastSeenAt: string | null }
export interface Invite { id: string; mobile: string; createdAt: string }
interface PubRow { id: string; name: string; color: string; status: string; statusFa: string; kind: string | null; referrer: string | null; createdAt: string; paths: number; published: number; courses: number; learners: number; inReview: number; admins: string[]; team: number; pending: Invite[] }
interface Profile {
  publisher: { id: string; name: string; color: string; status: string; statusFa: string; kind: string | null; referrer: string | null; about: string | null; note: string | null; createdAt: string };
  stats: { paths: number; published: number; courses: number; learners: number; inReview: number };
  admins: TeamMember[]; pending: Invite[];
  paths: { id: string; slug: string; title: string; status: string; statusFa: string; updatedAt: string }[];
  courses: { id: string; title: string; status: string; statusFa: string; instructor: string | null; instructorPending: string | null; updatedAt: string }[];
  history: { at: string; by: string | null; text: string; detail: string | null }[];
}

export const PUB_CHIP: Record<string, string> = { ACTIVE: 'chip-leaf', PENDING: 'chip-flame', BLOCKED: 'chip-rose', REJECTED: 'chip-rose' };
const ST_CHIP: Record<string, string> = { DRAFT: '', IN_REVIEW: 'chip-flame', PUBLISHED: 'chip-leaf', RETURNED: 'chip-rose', ARCHIVED: '' };
export const PUB_COLORS = ['#1E3A9E', '#0F766E', '#7C3AED', '#B45309', '#BE123C', '#0369A1', '#4D7C0F', '#8C93B5'];
const KINDS = ['مؤسسه', 'هیئت', 'مسجد', 'حوزه و مدرسه', 'گروه مردمی', 'سازمان', 'رسانه'];
const FILTERS: [string, string][] = [['', 'همه'], ['ACTIVE', 'فعال'], ['PENDING', 'در انتظار پذیرش'], ['BLOCKED', 'مسدود']];

export function PubBadge({ name, color, size = 'md' }: { name: string; color: string; size?: 'md' | 'lg' }) {
  const s = size === 'lg' ? 'size-14 rounded-2xl text-xl' : 'size-10 rounded-xl text-base';
  return <span className={`grid shrink-0 place-items-center font-extrabold text-white ${s}`} style={{ background: color }} aria-hidden="true">{name.trim().charAt(0) || <Building2 className="size-5" />}</span>;
}

const seen = (m: TeamMember) => (m.lastSeenAt ? `آخرین ورود ${ago(m.lastSeenAt)}` : 'هنوز وارد نشده');

/* ───────── فهرست ───────── */
export function Publishers() {
  const qc = useQueryClient();
  const toast = useToast();
  const nav = useNavigate();
  const q = useQuery({ queryKey: ['v2', 'admin', 'publishers'], queryFn: () => api<PubRow[]>('/v2/admin/publishers') });
  const [filter, setFilter] = useState('');
  const [text, setText] = useState('');
  const [creating, setCreating] = useState(false);
  const [f, setF] = useState({ name: '', kind: 'مؤسسه', referrer: '', adminMobile: '' });
  const create = useMutation({
    mutationFn: () => api<{ id: string; pending: boolean }>('/v2/admin/publishers', { body: { ...f, adminMobile: f.adminMobile.trim() || undefined } }),
    onSuccess: (p) => { qc.invalidateQueries({ queryKey: ['v2', 'admin', 'publishers'] }); setCreating(false); setF({ name: '', kind: 'مؤسسه', referrer: '', adminMobile: '' }); toast(p.pending ? 'ساخته شد. مدیرش هنوز حساب ندارد و با اولین ورود به تیم اضافه می‌شود.' : 'ساخته شد'); nav(`/admin/publishers/${p.id}`); },
    onError: (e) => toast(errorText(e)),
  });
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  const all = q.data ?? [];
  const t = text.trim();
  const rows = all.filter((p) => (!filter || p.status === filter) && (!t || p.name.includes(t) || p.admins.some((a) => a.includes(t)) || p.pending.some((x) => x.mobile.includes(t))));
  const count = (s: string) => all.filter((p) => !s || p.status === s).length;
  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-2xl font-extrabold">برگزارکنندگان</h1><p className="mt-1 max-w-2xl text-muted">مؤسسه‌ها و گروه‌هایی که در مدرسه مسیر و دوره می‌سازند. هر کدام تیمی دارد که پنل برگزارکننده را اداره می‌کند؛ ستاد می‌پذیرد، بازبینی می‌کند و در صورت لزوم مسدود می‌کند.</p></div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}><Plus className="size-5" />برگزارکنندهٔ تازه</button>
      </header>
      <div className="flex flex-wrap items-center gap-3">
        <div className="hscroll flex gap-1.5" role="group" aria-label="وضعیت">{FILTERS.map(([k, l]) => <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)} className={`btn btn-sm ${filter === k ? 'btn-primary' : 'btn-ghost'}`}>{l} <span className="tnum opacity-70">{fa(count(k))}</span></button>)}</div>
        <label className="relative ms-auto w-full sm:w-72"><span className="sr-only">جست‌وجو</span><Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" /><input className="input h-10" style={{ paddingInlineStart: 36 }} value={text} onChange={(e) => setText(e.target.value)} placeholder="نام برگزارکننده، عضو تیم یا شماره" /></label>
      </div>
      {!rows.length ? <Empty icon={Building2} title={all.length ? 'چیزی با این جست‌وجو نیست' : 'هنوز برگزارکننده‌ای نیست'}>{all.length ? 'وضعیت یا متن جست‌وجو را عوض کن.' : 'با «برگزارکنندهٔ تازه» اولی را بساز و مدیرش را با شماره دعوت کن.'}</Empty> : (
        <div className="card divide-y divide-line">{rows.map((p) => (
          <Link key={p.id} to={`/admin/publishers/${p.id}`} className="grid gap-3 px-4 py-4 no-underline hover:bg-sunken sm:grid-cols-[1fr_auto] sm:items-center">
            <span className="flex min-w-0 items-center gap-3"><PubBadge name={p.name} color={p.color} /><span className="min-w-0"><b className="block truncate text-ink">{p.name}</b><span className="text-sm text-muted">{[p.kind, p.referrer && `معرف: ${p.referrer}`].filter(Boolean).join('، ')}</span></span></span>
            <span className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted">
              <span className="inline-flex items-center gap-1"><Route className="size-4" />{fa(p.published)} از {fa(p.paths)} مسیر</span>
              <span className="inline-flex items-center gap-1"><BookOpen className="size-4" />{fa(p.courses)} دوره</span>
              <span className="inline-flex items-center gap-1"><Users className="size-4" />{p.team ? `${fa(p.team)} نفر در تیم` : 'بدون تیم'}{p.pending.length ? `، ${fa(p.pending.length)} منتظر` : ''}</span>
              {p.inReview > 0 && <span className="chip chip-flame">{fa(p.inReview)} در بازبینی</span>}
              <span className={`chip ${PUB_CHIP[p.status] ?? ''}`}>{p.statusFa}</span>
            </span>
          </Link>
        ))}</div>
      )}
      <Dialog open={creating} onClose={() => setCreating(false)} title="برگزارکنندهٔ تازه">
        <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
          <label className="field"><span>نام</span><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="مثلاً مؤسسهٔ فرهنگی …" autoFocus /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field"><span>نوع</span><input className="input" list="pub-kinds" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} /></label>
            <label className="field"><span>معرف</span><input className="input" value={f.referrer} onChange={(e) => setF({ ...f, referrer: e.target.value })} placeholder="ستاد" /></label>
          </div>
          <label className="field"><span>شمارهٔ مدیر (اختیاری)</span><input className="input" dir="ltr" inputMode="tel" value={f.adminMobile} onChange={(e) => setF({ ...f, adminMobile: e.target.value })} placeholder="0912…" /><span className="text-sm text-muted">اگر هنوز در مدرسه حساب ندارد، با اولین ورود خودش به تیم اضافه می‌شود.</span></label>
          <datalist id="pub-kinds">{KINDS.map((k) => <option key={k} value={k} />)}</datalist>
          <div className="flex gap-2"><button className="btn btn-primary" disabled={f.name.trim().length < 2 || create.isPending}>بساز</button><button type="button" className="btn btn-ghost" onClick={() => setCreating(false)}>برگرد</button></div>
        </form>
      </Dialog>
    </div>
  );
}

/* ───────── تیم (مشترک بین ستاد و پنل برگزارکننده) ───────── */
export function TeamCard({ admins, pending, me, onAdd, onRemove, onCancel, busy, intro }: {
  admins: TeamMember[]; pending: Invite[]; me?: string; busy?: boolean; intro: string;
  onAdd: (mobile: string) => Promise<unknown>; onRemove: (m: TeamMember) => void; onCancel: (i: Invite) => void;
}) {
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError('');
    try { await onAdd(mobile.trim()); setMobile(''); } catch (x) { setError(errorText(x)); }
  };
  return (
    <section className="card grid gap-0 overflow-hidden" aria-labelledby="team-h">
      <div className="flex flex-wrap items-end justify-between gap-2 px-5 pt-5"><div><h2 id="team-h" className="text-lg font-extrabold">تیم</h2><p className="mt-1 text-sm text-muted">{intro}</p></div><span className="text-sm text-muted">{fa(admins.length)} نفر{pending.length ? `، ${fa(pending.length)} منتظر` : ''}</span></div>
      <ul className="mt-4 divide-y divide-line border-t border-line">
        {admins.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-deep-soft text-sm font-bold text-deep">{m.name.charAt(0)}</span>
            <span className="min-w-0 flex-1"><b className="block text-ink">{m.name}{m.id === me && <span className="ms-2 text-sm font-normal text-muted">(خودت)</span>}</b><span className="text-sm text-muted"><bdi dir="ltr">{m.mobile}</bdi>، {seen(m)}{!m.active && '، حساب غیرفعال'}</span></span>
            <button type="button" className="btn btn-ghost btn-sm text-rose-ink" disabled={busy} onClick={() => onRemove(m)} aria-label={m.id === me ? 'خروج از تیم' : `برداشتن ${m.name} از تیم`}><Trash2 className="size-4" />{m.id === me ? 'خروج' : 'بردار'}</button>
          </li>
        ))}
        {pending.map((i) => (
          <li key={i.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-flame-soft text-flame-ink"><Clock className="size-4" /></span>
            <span className="min-w-0 flex-1"><b className="block text-ink"><bdi dir="ltr">{i.mobile}</bdi></b><span className="text-sm text-muted">منتظر اولین ورود، دعوت از {ago(i.createdAt)}</span></span>
            <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => onCancel(i)} aria-label={`برداشتن دعوت ${i.mobile}`}>برداشتن دعوت</button>
          </li>
        ))}
        {!admins.length && !pending.length && <li className="px-5 py-6 text-center text-muted">هنوز کسی در تیم نیست. اولین نفر را با شماره اضافه کن.</li>}
      </ul>
      <form onSubmit={submit} className="grid gap-2 border-t border-line bg-sunken/60 px-5 py-4">
        <label htmlFor="team-mobile" className="text-sm font-bold text-ink">افزودن با شمارهٔ موبایل</label>
        <div className="flex flex-wrap gap-2"><input id="team-mobile" className="input h-11 max-w-xs flex-1" dir="ltr" inputMode="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="0912…" aria-invalid={!!error} aria-describedby="team-hint" /><button className="btn btn-primary h-11" disabled={busy || mobile.trim().length < 10}><UserPlus className="size-5" />افزودن به تیم</button></div>
        <p id="team-hint" className={`text-sm ${error ? 'text-rose-ink' : 'text-muted'}`}>{error || 'اگر هنوز در مدرسه حساب ندارد، منتظر می‌ماند و همین که با این شماره وارد شود، عضو تیم است.'}</p>
      </form>
    </section>
  );
}

/* ───────── پروفایل ───────── */
export function PublisherProfile() {
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const toast = useToast();
  const key = ['v2', 'admin', 'publishers', id];
  const q = useQuery({ queryKey: key, queryFn: () => api<Profile>(`/v2/admin/publishers/${id}`) });
  const refresh = () => { qc.invalidateQueries({ queryKey: ['v2', 'admin', 'publishers'] }); };
  const patch = useMutation({ mutationFn: (b: Record<string, unknown>) => api(`/v2/admin/publishers/${id}`, { method: 'PATCH', body: b }), onSuccess: () => { refresh(); toast('ذخیره شد'); }, onError: (e) => toast(errorText(e)) });
  const remove = useMutation({ mutationFn: (uid: string) => api(`/v2/admin/publishers/${id}/team/${uid}`, { method: 'DELETE' }), onSuccess: () => { refresh(); toast('از تیم برداشته شد'); }, onError: (e) => toast(errorText(e)) });
  const cancel = useMutation({ mutationFn: (inv: string) => api(`/v2/admin/publishers/${id}/invites/${inv}`, { method: 'DELETE' }), onSuccess: () => { refresh(); toast('دعوت برداشته شد'); } });
  const [edit, setEdit] = useState<null | { name: string; kind: string; referrer: string; color: string; about: string }>(null);
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  const d = q.data!; const p = d.publisher;
  const add = async (mobile: string) => { const r = await api<{ pending: boolean }>(`/v2/admin/publishers/${id}/team`, { body: { mobile } }); refresh(); toast(r.pending ? 'این شماره هنوز حساب ندارد؛ با اولین ورود به تیم اضافه می‌شود' : 'به تیم اضافه شد'); };
  const block = async () => { const note = await ask({ title: `مسدود کردن «${p.name}»`, body: 'محتوای منتشرشده‌اش می‌ماند و کنشگرانِ در حرکت ادامه می‌دهند؛ چیز تازه‌ای منتشر نمی‌کند. دلیل را تیمش می‌بیند.', input: true, required: true, label: 'دلیل', ok: 'مسدود کن', danger: true }); if (note) patch.mutate({ status: 'BLOCKED', note }); };
  return (
    <div className="grid gap-6">
      <Link to="/admin/publishers" className="inline-flex w-fit items-center gap-1 text-sm text-muted no-underline hover:text-ink"><ArrowRight className="size-4" />همهٔ برگزارکنندگان</Link>
      <header className="flex flex-wrap items-start gap-4">
        <PubBadge name={p.name} color={p.color} size="lg" />
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-extrabold">{p.name}</h1><span className={`chip ${PUB_CHIP[p.status] ?? ''}`}>{p.statusFa}</span></div>
          <p className="mt-1 text-muted">{[p.kind, p.referrer && `معرف: ${p.referrer}`, `از ${jDate(p.createdAt)}`].filter(Boolean).join('، ')}</p>
          {p.about && <p className="mt-2 max-w-2xl text-body">{p.about}</p>}
          {p.status === 'BLOCKED' && p.note && <p className="mt-2 w-fit rounded-lg bg-rose-soft px-3 py-1.5 text-sm text-rose-ink">دلیل مسدودی: {p.note}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => setEdit({ name: p.name, kind: p.kind ?? '', referrer: p.referrer ?? '', color: p.color, about: p.about ?? '' })}>ویرایش مشخصات</button>
          {p.status === 'PENDING' && <button className="btn btn-primary btn-sm" onClick={() => patch.mutate({ status: 'ACTIVE' })}>بپذیر</button>}
          {p.status === 'ACTIVE' && <button className="btn btn-danger btn-sm" onClick={block}>مسدود کن</button>}
          {p.status === 'BLOCKED' && <button className="btn btn-primary btn-sm" onClick={() => patch.mutate({ status: 'ACTIVE' })}>باز کن</button>}
        </div>
      </header>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[['مسیر منتشرشده', `${fa(d.stats.published)} از ${fa(d.stats.paths)}`], ['دوره', fa(d.stats.courses)], ['کنشگر در مسیرها', fa(d.stats.learners)], ['در بازبینی', fa(d.stats.inReview)]].map(([k, v]) => <div key={k} className="card px-4 py-3"><dt className="text-sm text-muted">{k}</dt><dd className="tnum mt-1 text-xl font-extrabold text-ink">{v}</dd></div>)}
      </dl>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <TeamCard admins={d.admins} pending={d.pending} busy={remove.isPending || cancel.isPending} onAdd={add}
          intro="همهٔ اعضا دسترسی کامل به پنل این برگزارکننده دارند. تیم خودش هم می‌تواند عضو اضافه یا کم کند."
          onRemove={async (m) => { if (await ask({ title: `برداشتن ${m.name}`, body: 'دیگر به پنل این برگزارکننده دسترسی ندارد. کارهایی که ساخته سر جایش می‌ماند.', ok: 'بردار', danger: true })) remove.mutate(m.id); }}
          onCancel={(i) => cancel.mutate(i.id)} />
        <section className="card grid gap-0 overflow-hidden" aria-labelledby="content-h">
          <div className="px-5 pt-5"><h2 id="content-h" className="text-lg font-extrabold">محتوا</h2><p className="mt-1 text-sm text-muted">چیزهایی که در بازبینی است در <Link to="/admin/review" className="font-bold text-leaf-ink">صف بازبینی</Link> هم هست.</p></div>
          {!d.paths.length && !d.courses.length ? <p className="px-5 py-6 text-center text-muted">هنوز مسیر یا دوره‌ای نساخته است.</p> : (
            <ul className="mt-4 divide-y divide-line border-t border-line">
              {d.paths.map((x) => <li key={x.id} className="flex items-center gap-3 px-5 py-3"><Route className="size-4 shrink-0 text-muted" /><span className="min-w-0 flex-1">{x.status === 'PUBLISHED' ? <Link to={`/paths/${x.slug}`} className="font-bold text-ink">{x.title}</Link> : <b className="text-ink">{x.title}</b>}<span className="block text-sm text-muted">مسیر، {ago(x.updatedAt)}</span></span><span className={`chip ${ST_CHIP[x.status] ?? ''}`}>{x.statusFa}</span></li>)}
              {d.courses.map((c) => <li key={c.id} className="flex items-center gap-3 px-5 py-3"><BookOpen className="size-4 shrink-0 text-muted" /><span className="min-w-0 flex-1"><Link to={`/admin/courses/${c.id}`} className="font-bold text-ink">{c.title}</Link><span className="block text-sm text-muted">دوره{c.instructor ? `، استاد: ${c.instructor}` : c.instructorPending ? '، استاد منتظر اولین ورود' : ''}</span></span><span className={`chip ${ST_CHIP[c.status] ?? ''}`}>{c.statusFa}</span></li>)}
            </ul>
          )}
        </section>
      </div>
      <section className="grid gap-3" aria-labelledby="hist-h">
        <h2 id="hist-h" className="text-lg font-extrabold">تاریخچه</h2>
        {!d.history.length ? <p className="text-muted">از نسخهٔ ۱.۷ به بعد، هر تغییر تیم و مشخصات این‌جا ثبت می‌شود.</p> : (
          <ol className="card divide-y divide-line">{d.history.map((h, i) => <li key={i} className="flex flex-wrap items-baseline gap-x-2 px-4 py-2.5 text-sm"><b className="text-ink">{h.text}</b>{h.detail && <span className="text-body"><bdi>{h.detail}</bdi></span>}<span className="ms-auto text-muted">{h.by ? `${h.by}، ` : ''}{ago(h.at)}</span></li>)}</ol>
        )}
      </section>
      <Dialog open={!!edit} onClose={() => setEdit(null)} title="مشخصات برگزارکننده">
        {edit && <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); patch.mutate(edit, { onSuccess: () => setEdit(null) }); }}>
          <label className="field"><span>نام</span><input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field"><span>نوع</span><input className="input" list="pub-kinds-e" value={edit.kind} onChange={(e) => setEdit({ ...edit, kind: e.target.value })} /></label>
            <label className="field"><span>معرف</span><input className="input" value={edit.referrer} onChange={(e) => setEdit({ ...edit, referrer: e.target.value })} /></label>
          </div>
          <datalist id="pub-kinds-e">{KINDS.map((k) => <option key={k} value={k} />)}</datalist>
          <ColorPick value={edit.color} onChange={(color) => setEdit({ ...edit, color })} />
          <label className="field"><span>معرفی کوتاه</span><textarea className="input min-h-24 py-2" maxLength={600} value={edit.about} onChange={(e) => setEdit({ ...edit, about: e.target.value })} placeholder="چه کسانی هستند و در مدرسه چه می‌سازند." /></label>
          <div className="flex gap-2"><button className="btn btn-primary" disabled={edit.name.trim().length < 2 || patch.isPending}>ذخیره</button><button type="button" className="btn btn-ghost" onClick={() => setEdit(null)}>برگرد</button></div>
        </form>}
      </Dialog>
    </div>
  );
}

export function ColorPick({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <fieldset className="field"><legend className="mb-2 text-sm font-bold text-ink">رنگ</legend>
      <div className="flex flex-wrap gap-2">{PUB_COLORS.map((c) => <button key={c} type="button" onClick={() => onChange(c)} aria-label={`رنگ ${c}`} aria-pressed={value.toLowerCase() === c.toLowerCase()} className={`size-9 rounded-full ring-offset-2 ring-offset-card ${value.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-ink' : ''}`} style={{ background: c }} />)}</div>
    </fieldset>
  );
}
