import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Heart, MessageCircleQuestion, Plus, Search, UsersRound } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { Stories } from '../components/Growth';
import { Dialog, Empty, ErrorBox, Spinner, useToast } from '../components/ui';
import { api, errorText } from '../lib/api';
import { useAuth } from '../lib/auth';
import { ago, fa, jDateTime } from '../lib/fa';
import type { Person } from '../lib/imamat';

interface GaadeCard { id: string; title: string; kind: string; rhythm: string; place: string; host: Person; memberCount: number; members: Person[]; next: { at: string; where: string; topic: string } | null; joined: boolean; rsvp: 'YES' | 'NO' | null; yes: number }
interface GaadeFull extends GaadeCard { members: (Person & { rsvp: 'YES' | 'NO' | null })[]; notes: { id: string; topic: string; experience: string; knot: string; promise: string; createdAt: string; user: Person }[]; isHost: boolean }
interface QRow { id: string; title: string; body: string; createdAt: string; author: Person; lessonId: string | null; lessonTitle: string | null; votes: number; voted: boolean; answerCount: number; hasBest: boolean; mine: boolean }
interface QFull extends QRow { answers: { id: string; body: string; best: boolean; createdAt: string; author: Person; votes: number; voted: boolean; mine: boolean }[] }
interface PeerReq { id: string; title: string; body: string; createdAt: string; author: Person; gaade: string; mine: boolean; replies: { id: string; body: string; createdAt: string; author: Person }[] }

const Av = ({ p, s = 9 }: { p: Person; s?: number }) => (
  <span className={`grid size-${s} shrink-0 place-items-center rounded-full font-extrabold ${p.gender === 'FEMALE' ? 'bg-rose-soft text-rose-ink' : p.role === 'RAHYAR' ? 'bg-dome-soft text-dome-ink' : p.role === 'IMAM' ? 'bg-deep text-white' : 'bg-leaf-soft text-leaf-ink'}`} aria-hidden="true">{p.name.replace(/^(سید|حجت‌الاسلام)\s+/, '')[0]}</span>
);
const RoleChip = ({ p }: { p: Person }) => p.role === 'RAHYAR' ? <span className="chip chip-dome">راهیار</span> : p.role === 'IMAM' ? <span className="chip">امام</span> : null;

export default function PeersPage() {
  const [sp, setSp] = useSearchParams();
  const tab = sp.get('tab') ?? 'gaade';
  const T: [string, string][] = [['gaade', 'گعده‌های من'], ['qa', 'پرسش از همتایان'], ['peer', 'نظر همتا'], ['stories', 'تجربه‌های میدان']];
  return (
    <div className="grid gap-6">
      <header><h1 className="text-[clamp(24px,3vw,32px)] font-extrabold">گعده و همتایان</h1><p className="mt-1 text-muted">یادگیری از همتا: گعده، پرسش و پاسخ، نظر همتا روی گزارش‌ها و تجربه‌های میدان.</p></header>
      <div className="seg" role="tablist">{T.map(([k, t]) => <button key={k} role="tab" aria-pressed={tab === k} onClick={() => setSp({ tab: k })}>{t}</button>)}</div>
      {tab === 'gaade' && <GaadeTab />}
      {tab === 'qa' && <QaTab />}
      {tab === 'peer' && <PeerTab />}
      {tab === 'stories' && <div className="grid gap-4"><p className="text-muted">روایت‌هایی که امامان و کنشگران از تکلیف‌های میدانی‌شان نوشته‌اند و با اجازهٔ خودشان، پس از بازبینی ستاد منتشر شده است.</p><Stories /></div>}
    </div>
  );
}

function GaadeTile({ g }: { g: GaadeCard }) {
  return (
    <Link to={`/gaade/${g.id}`} className="card is-link grid gap-3 p-5 no-underline">
      <div className="flex items-start gap-3"><UsersRound className="size-11 shrink-0 rounded-2xl bg-flame-soft p-2.5 text-flame-ink" />
        <div className="min-w-0 flex-1"><b className="block text-ink">{g.title}</b><span className="text-sm text-muted">{fa(g.memberCount)} عضو · {g.rhythm}</span></div>
        {g.joined && <span className="chip chip-leaf">عضو هستید</span>}</div>
      {g.next && <div className="rounded-xl bg-sunken p-3 text-sm leading-7"><b className="text-ink">جلسهٔ بعد:</b> {jDateTime(g.next.at)}، {g.next.where}<br /><b className="text-ink">موضوع:</b> {g.next.topic}
        {g.joined && <><br /><b className={g.rsvp === 'YES' ? 'text-leaf-ink' : g.rsvp === 'NO' ? 'text-rose-ink' : 'text-flame-ink'}>{g.rsvp === 'YES' ? 'می‌آیید' : g.rsvp === 'NO' ? 'نمی‌آیید' : 'هنوز پاسخ نداده‌اید'}</b></>}</div>}
      <div className="flex -space-x-2 space-x-reverse">{g.members.map((p) => <Av key={p.id} p={p} s={8} />)}</div>
    </Link>
  );
}

function GaadeTab() {
  const q = useQuery({ queryKey: ['gaade'], queryFn: () => api<{ mine: GaadeCard[]; near: GaadeCard[] }>('/gaade') });
  const [open, setOpen] = useState(false);
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  return (
    <div className="grid gap-6">
      <p className="rounded-2xl bg-flame-soft p-4 leading-8 text-ink"><b>گعده چیست؟</b> جمع کوچکی از همتایان (پنج تا نُه نفر) با زمان ثابت؛ هر کس <b>یک تجربه</b> می‌گوید، <b>یک گره</b> را مطرح می‌کند و <b>یک قرار</b> برای جلسهٔ بعد می‌گذارد.</p>
      {q.data!.mine.length ? <div className="grid gap-4 lg:grid-cols-2">{q.data!.mine.map((g) => <GaadeTile key={g.id} g={g} />)}</div>
        : <Empty icon={UsersRound} title="هنوز در گعده‌ای نیستید">یک گعده بسازید یا به گعدهٔ همتایان نزدیکتان بپیوندید.</Empty>}
      <button className="btn btn-primary w-fit" onClick={() => setOpen(true)}><Plus />ساختن گعدهٔ تازه</button>
      {q.data!.near.length > 0 && <section className="grid gap-4"><h2 className="text-lg font-extrabold">گعده‌های همتایان نزدیک شما</h2><div className="grid gap-4 lg:grid-cols-2">{q.data!.near.map((g) => <GaadeTile key={g.id} g={g} />)}</div></section>}
      <NewGaade open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function NewGaade({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = useNavigate(); const toast = useToast(); const qc = useQueryClient();
  const cand = useQuery({ queryKey: ['gaade-cand'], queryFn: () => api<Person[]>('/gaade/candidates'), enabled: open });
  const [f, setF] = useState({ title: '', rhythm: 'ماهی دو بار', place: 'به نوبت در مساجد', topic: '', at: '' });
  const [inv, setInv] = useState<string[]>([]);
  const m = useMutation({ mutationFn: () => api<{ id: string }>('/gaade', { body: { ...f, at: f.at ? new Date(f.at).toISOString() : undefined, invite: inv } }), onSuccess: (r) => { qc.invalidateQueries({ queryKey: ['gaade'] }); onClose(); toast('گعده ساخته شد و دعوت‌ها رفت'); nav(`/gaade/${r.id}`); }, onError: (e) => toast(errorText(e), 'err') });
  const submit = (e: FormEvent) => { e.preventDefault(); m.mutate(); };
  return (
    <Dialog open={open} onClose={onClose} title="گعدهٔ تازه">
      <form onSubmit={submit} className="grid gap-4">
        <div className="field"><label htmlFor="gt">نام گعده</label><input id="gt" className="input" required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="مثلاً گعدهٔ امامان محلهٔ شرق شهر" /></div>
        <div className="grid gap-3 sm:grid-cols-2"><div className="field"><label htmlFor="gr">ریتم</label><select id="gr" className="input" value={f.rhythm} onChange={(e) => setF({ ...f, rhythm: e.target.value })}><option>هفتگی</option><option>ماهی دو بار</option><option>ماهانه</option></select></div>
          <div className="field"><label htmlFor="gp">مکان</label><input id="gp" className="input" value={f.place} onChange={(e) => setF({ ...f, place: e.target.value })} /></div></div>
        <div className="field"><label htmlFor="gtp">موضوع جلسهٔ اول</label><input id="gtp" className="input" required value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })} /></div>
        <div className="field"><label htmlFor="ga">زمان جلسهٔ اول</label><input id="ga" type="datetime-local" className="input ltr" value={f.at} onChange={(e) => setF({ ...f, at: e.target.value })} /></div>
        <fieldset className="grid gap-2"><legend className="mb-1 text-sm font-bold text-ink">دعوت از همتایان (چهار تا هشت نفر بهتر است)</legend>
          {cand.isLoading ? <Spinner /> : (cand.data ?? []).map((p) => <label key={p.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={inv.includes(p.id)} onChange={(e) => setInv(e.target.checked ? [...inv, p.id] : inv.filter((x) => x !== p.id))} />{p.name} <RoleChip p={p} /></label>)}
          {cand.data?.length === 0 && <span className="text-sm text-muted">همتایی در شهرستان شما پیدا نشد؛ بعداً از صفحهٔ گعده دعوت کنید.</span>}</fieldset>
        <div className="flex justify-end gap-2"><button type="button" className="btn btn-secondary" onClick={onClose}>انصراف</button><button className="btn btn-primary" disabled={m.isPending}>ساختن</button></div>
      </form>
    </Dialog>
  );
}

export function GaadePage() {
  const { id } = useParams(); const qc = useQueryClient(); const toast = useToast(); const nav = useNavigate();
  const q = useQuery({ queryKey: ['gaade', id], queryFn: () => api<GaadeFull>(`/gaade/${id}`) });
  const [note, setNote] = useState<{ experience: string; knot: string; promise: string } | null>(null);
  const [edit, setEdit] = useState<{ at: string; where: string; topic: string } | null>(null);
  const [inv, setInv] = useState(false);
  const refresh = () => { qc.invalidateQueries({ queryKey: ['gaade'] }); };
  const act = useMutation({ mutationFn: (x: { path: string; body?: object; method?: string }) => api(`/gaade/${id}/${x.path}`, { body: x.body ?? {}, method: x.method }), onSuccess: (_d, x) => { refresh(); if (x.path === 'leave') nav('/peers'); if (x.path === 'notes') { setNote(null); toast('یادداشت ثبت شد'); } if (x.path === 'next') { setEdit(null); toast('به اعضا خبر داده شد'); } }, onError: (e) => toast(errorText(e), 'err') });
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  const g = q.data!;
  return (
    <div className="grid gap-6">
      <Link to="/peers" className="flex w-fit items-center gap-1 text-sm font-bold text-deep no-underline"><ChevronLeft className="size-4 rotate-180" />گعده و همتایان</Link>
      <header className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-[clamp(22px,3vw,30px)] font-extrabold">{g.title}</h1><p className="mt-1 text-muted">{g.rhythm} · {g.place} · میزبان: {g.host.name}</p></div>
        <div className="flex gap-2">{g.joined ? !g.isHost && <button className="btn btn-danger" onClick={() => act.mutate({ path: 'leave' })}>ترک گعده</button> : <button className="btn btn-primary" onClick={() => act.mutate({ path: 'join' })}>پیوستن به گعده</button>}</div></header>
      <section className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-6">
          {g.next && (
            <div className="card grid gap-4 p-6">
              <div className="flex items-center justify-between"><h2 className="text-lg font-extrabold">جلسهٔ بعد</h2>{g.isHost && <button className="btn btn-secondary btn-sm" onClick={() => setEdit({ at: g.next!.at.slice(0, 16), where: g.next!.where, topic: g.next!.topic })}>ویرایش جلسه</button>}</div>
              <div className="grid gap-3 sm:grid-cols-3">{[['زمان', jDateTime(g.next.at)], ['مکان', g.next.where], ['موضوع', g.next.topic]].map(([k, v]) => <div key={k} className="rounded-xl bg-sunken p-3"><span className="text-xs text-muted">{k}</span><b className="block text-ink">{v}</b></div>)}</div>
              <div><b className="text-sm text-ink">دستور جلسه</b><ol className="mt-1 list-decimal ps-5 text-body"><li>هر نفر یک تجربه از ماه گذشته (سه دقیقه)</li><li>یک گره؛ همتایان راه پیشنهاد می‌دهند</li><li>هر نفر یک قرار برای جلسهٔ بعد</li></ol></div>
              {g.joined && <div className="flex flex-wrap items-center gap-2"><b className="text-sm text-ink">می‌آیید؟</b>
                <button className={`btn btn-sm ${g.rsvp === 'YES' ? 'btn-primary' : 'btn-secondary'}`} aria-pressed={g.rsvp === 'YES'} onClick={() => act.mutate({ path: 'rsvp', body: { rsvp: 'YES' } })}>می‌آیم</button>
                <button className={`btn btn-sm ${g.rsvp === 'NO' ? 'btn-danger' : 'btn-secondary'}`} aria-pressed={g.rsvp === 'NO'} onClick={() => act.mutate({ path: 'rsvp', body: { rsvp: 'NO' } })}>نمی‌توانم</button>
                <span className="text-sm text-muted">{fa(g.members.filter((m) => m.rsvp === 'YES').length)} نفر می‌آیند</span></div>}
            </div>
          )}
          {g.joined && (
            <div className="card grid gap-3 p-6">
              <div className="flex items-center justify-between"><h2 className="text-lg font-extrabold">یادداشت جلسه</h2>{!note && <button className="btn btn-primary btn-sm" onClick={() => setNote({ experience: '', knot: '', promise: '' })}>نوشتن یادداشت من</button>}</div>
              {note ? (
                <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); act.mutate({ path: 'notes', body: note }); }}>
                  <div className="field"><label htmlFor="ne">تجربه‌ای که گفتم</label><textarea id="ne" className="input" required value={note.experience} onChange={(e) => setNote({ ...note, experience: e.target.value })} /></div>
                  <div className="field"><label htmlFor="nk">گرهی که مطرح کردم</label><input id="nk" className="input" value={note.knot} onChange={(e) => setNote({ ...note, knot: e.target.value })} /></div>
                  <div className="field"><label htmlFor="np">قرار من تا جلسهٔ بعد</label><input id="np" className="input" required value={note.promise} onChange={(e) => setNote({ ...note, promise: e.target.value })} /></div>
                  <div className="flex gap-2"><button className="btn btn-primary" disabled={act.isPending}>ثبت</button><button type="button" className="btn btn-secondary" onClick={() => setNote(null)}>انصراف</button></div>
                </form>
              ) : <p className="text-sm text-muted">بعد از هر جلسه، تجربه، گره و قرار خودتان را بنویسید تا در جلسهٔ بعد مرور شود.</p>}
              {g.notes.length > 0 && <div className="grid gap-2">{g.notes.map((n) => (
                <div key={n.id} className="flex gap-3 rounded-xl bg-sunken p-3 text-sm leading-7"><Av p={n.user} s={8} /><div className="min-w-0 flex-1"><b className="text-ink">{n.user.name}</b> <span className="text-xs text-muted">· {n.topic} · {ago(n.createdAt)}</span>
                  <div><b>تجربه:</b> {n.experience}</div>{n.knot && <div><b>گره:</b> {n.knot}</div>}<div><b>قرار:</b> {n.promise}</div></div></div>))}</div>}
            </div>
          )}
          {!g.joined && <p className="rounded-2xl bg-sunken p-4 text-muted">یادداشت‌های جلسه فقط برای اعضای گعده است.</p>}
        </div>
        <aside className="card grid gap-2 p-5"><b className="text-ink">اعضا · {fa(g.members.length)}</b>
          {g.members.map((p) => <div key={p.id} className="flex items-center gap-3 rounded-xl p-2"><Av p={p} /><span className="min-w-0 flex-1"><b className="block text-sm text-ink">{p.name}</b><span className="text-xs text-muted">{p.rsvp === 'YES' ? 'می‌آید' : p.rsvp === 'NO' ? 'نمی‌آید' : ''}</span></span>{p.id === g.host.id && <span className="chip chip-flame">میزبان</span>}</div>)}
          {g.isHost && <button className="btn btn-secondary btn-sm mt-2" onClick={() => setInv(true)}>دعوت از همتا</button>}
        </aside>
      </section>
      <Dialog open={!!edit} onClose={() => setEdit(null)} title="جلسهٔ بعد">
        {edit && <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); act.mutate({ path: 'next', method: 'PUT', body: { ...edit, at: new Date(edit.at).toISOString() } }); }}>
          <div className="field"><label htmlFor="ea">زمان</label><input id="ea" type="datetime-local" className="input ltr" required value={edit.at} onChange={(e) => setEdit({ ...edit, at: e.target.value })} /></div>
          <div className="field"><label htmlFor="ew">مکان</label><input id="ew" className="input" required value={edit.where} onChange={(e) => setEdit({ ...edit, where: e.target.value })} /></div>
          <div className="field"><label htmlFor="et">موضوع</label><input id="et" className="input" required value={edit.topic} onChange={(e) => setEdit({ ...edit, topic: e.target.value })} /></div>
          <div className="flex justify-end gap-2"><button type="button" className="btn btn-secondary" onClick={() => setEdit(null)}>انصراف</button><button className="btn btn-primary">ذخیره و خبر به اعضا</button></div></form>}
      </Dialog>
      <InviteDialog open={inv} onClose={() => setInv(false)} id={g.id} have={g.members.map((m) => m.id)} />
    </div>
  );
}

function InviteDialog({ open, onClose, id, have }: { open: boolean; onClose: () => void; id: string; have: string[] }) {
  const qc = useQueryClient(); const toast = useToast();
  const cand = useQuery({ queryKey: ['gaade-cand'], queryFn: () => api<Person[]>('/gaade/candidates'), enabled: open });
  const [sel, setSel] = useState<string[]>([]);
  const m = useMutation({ mutationFn: () => api(`/gaade/${id}/invite`, { body: { userIds: sel } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['gaade'] }); onClose(); setSel([]); toast('دعوت‌ها رفت'); } });
  const list = (cand.data ?? []).filter((p) => !have.includes(p.id));
  return (
    <Dialog open={open} onClose={onClose} title="دعوت از همتا">
      <div className="grid gap-2">{list.map((p) => <label key={p.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sel.includes(p.id)} onChange={(e) => setSel(e.target.checked ? [...sel, p.id] : sel.filter((x) => x !== p.id))} />{p.name} <RoleChip p={p} /></label>)}
        {!cand.isLoading && !list.length && <span className="text-muted">همتای دیگری پیدا نشد.</span>}
        <div className="flex justify-end gap-2"><button className="btn btn-secondary" onClick={onClose}>انصراف</button><button className="btn btn-primary" disabled={!sel.length || m.isPending} onClick={() => m.mutate()}>دعوت</button></div></div>
    </Dialog>
  );
}

function QRowLink({ q }: { q: QRow }) {
  return (
    <Link to={`/questions/${q.id}`} className="card is-link flex items-center gap-3 p-4 no-underline">
      <Av p={q.author} /><span className="min-w-0 flex-1"><b className="block text-ink">{q.title}</b><span className="text-xs text-muted">{q.author.name} · {ago(q.createdAt)}{q.lessonTitle ? ` · ${q.lessonTitle}` : ''}</span></span>
      {q.hasBest && <span className="chip chip-leaf">پاسخ برگزیده</span>}<span className="chip tnum">{fa(q.answerCount)} پاسخ</span>
    </Link>
  );
}

export function AskDialog({ open, onClose, lessonId }: { open: boolean; onClose: () => void; lessonId?: string }) {
  const nav = useNavigate(); const toast = useToast(); const qc = useQueryClient();
  const [f, setF] = useState({ title: '', body: '' });
  const m = useMutation({ mutationFn: () => api<{ id: string }>('/questions', { body: { ...f, lessonId } }), onSuccess: (r) => { qc.invalidateQueries({ queryKey: ['questions'] }); onClose(); setF({ title: '', body: '' }); toast('پرسش ثبت شد؛ همتایان و راهیاران می‌بینند'); nav(`/questions/${r.id}`); }, onError: (e) => toast(errorText(e), 'err') });
  return (
    <Dialog open={open} onClose={onClose} title="پرسش از همتایان">
      <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
        <div className="field"><label htmlFor="qt">پرسش</label><input id="qt" className="input" required maxLength={160} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="پرسش را کوتاه و روشن بنویسید" /></div>
        <div className="field"><label htmlFor="qb">توضیح (اختیاری)</label><textarea id="qb" className="input" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} placeholder="موقعیت را بگویید؛ بدون نام و نکتهٔ آبرویی." /></div>
        <div className="flex justify-end gap-2"><button type="button" className="btn btn-secondary" onClick={onClose}>انصراف</button><button className="btn btn-primary" disabled={m.isPending}>پرسیدن</button></div>
      </form>
    </Dialog>
  );
}

function QaTab() {
  const [s, setS] = useState(''); const [open, setOpen] = useState(false);
  const q = useQuery({ queryKey: ['questions', s], queryFn: () => api<QRow[]>(`/questions?q=${encodeURIComponent(s)}`) });
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2"><label className="flex h-12 min-w-[260px] flex-1 items-center gap-2 rounded-xl border border-line-strong bg-card px-3"><Search className="size-5 text-muted" /><span className="sr-only">جست‌وجو در پرسش‌ها</span><input className="flex-1 bg-transparent outline-none" value={s} onChange={(e) => setS(e.target.value)} placeholder="جست‌وجو در پرسش‌ها" /></label>
        <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus />پرسش تازه</button></div>
      {q.isLoading ? <Spinner /> : q.data?.length ? <div className="grid gap-3">{q.data.map((x) => <QRowLink key={x.id} q={x} />)}</div> : <Empty icon={MessageCircleQuestion} title="پرسشی پیدا نشد" />}
      <AskDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

/** پرسش‌های همتایان زیر هر درس */
export function LessonQuestions({ lessonId }: { lessonId: string }) {
  const q = useQuery({ queryKey: ['questions', 'lesson', lessonId], queryFn: () => api<QRow[]>(`/questions?lesson=${lessonId}`) });
  const [open, setOpen] = useState(false);
  return (
    <section className="card grid gap-3 p-5" aria-labelledby="lq-h">
      <div className="flex items-center justify-between gap-2"><h2 id="lq-h" className="text-base font-extrabold">پرسش از همتایان دربارهٔ این درس</h2><button className="btn btn-secondary btn-sm" onClick={() => setOpen(true)}><Plus />پرسیدن</button></div>
      {q.data?.length ? q.data.map((x) => <QRowLink key={x.id} q={x} />) : <p className="text-sm text-muted">هنوز پرسشی نیست. اگر جایی گره دارید بپرسید؛ امامان و کنشگرانی که همین درس را خوانده‌اند پاسخ می‌دهند.</p>}
      <AskDialog open={open} onClose={() => setOpen(false)} lessonId={lessonId} />
    </section>
  );
}

export function QuestionPage() {
  const { id } = useParams(); const qc = useQueryClient(); const toast = useToast();
  const q = useQuery({ queryKey: ['question', id], queryFn: () => api<QFull>(`/questions/${id}`) });
  const [ans, setAns] = useState('');
  const refresh = () => { qc.invalidateQueries({ queryKey: ['question', id] }); qc.invalidateQueries({ queryKey: ['questions'] }); };
  const send = useMutation({ mutationFn: () => api(`/questions/${id}/answers`, { body: { body: ans } }), onSuccess: () => { setAns(''); refresh(); toast('پاسخ ثبت شد'); }, onError: (e) => toast(errorText(e), 'err') });
  const act = useMutation({ mutationFn: (p: string) => api(p, { body: {} }), onSuccess: refresh });
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  const x = q.data!;
  return (
    <div className="grid max-w-3xl gap-6">
      <Link to="/peers?tab=qa" className="flex w-fit items-center gap-1 text-sm font-bold text-deep no-underline"><ChevronLeft className="size-4 rotate-180" />پرسش از همتایان</Link>
      <article className="card grid gap-3 p-6">
        <div className="flex flex-wrap items-center gap-3"><Av p={x.author} /><span className="min-w-0 flex-1"><b className="block text-ink">{x.author.name}</b><span className="text-xs text-muted">{ago(x.createdAt)}{x.lessonId ? <> · <Link to={`/lessons/${x.lessonId}`}>{x.lessonTitle}</Link></> : null}</span></span>
          <button className={`btn btn-sm ${x.voted ? 'btn-primary' : 'btn-secondary'}`} aria-pressed={x.voted} onClick={() => act.mutate(`/questions/${x.id}/vote`)}><Heart />من هم همین پرسش را دارم · {fa(x.votes)}</button></div>
        <h1 className="text-xl font-extrabold">{x.title}</h1>{x.body && <p className="leading-8">{x.body}</p>}
      </article>
      <section className="grid gap-3"><h2 className="text-lg font-extrabold">{fa(x.answers.length)} پاسخ</h2>
        {x.answers.map((a) => (
          <div key={a.id} className={`card grid gap-2 p-5 ${a.best ? '!border-2 !border-leaf' : ''}`}>
            <div className="flex flex-wrap items-center gap-2"><Av p={a.author} s={8} /><b className="text-sm text-ink">{a.author.name}</b><RoleChip p={a.author} /><span className="text-xs text-muted">· {ago(a.createdAt)}</span>{a.best && <span className="chip chip-leaf ms-auto">پاسخ برگزیدهٔ پرسشگر</span>}</div>
            <p className="leading-8">{a.body}</p>
            <div className="flex gap-2"><button className={`btn btn-sm ${a.voted ? 'btn-primary' : 'btn-secondary'}`} aria-pressed={a.voted} onClick={() => act.mutate(`/answers/${a.id}/vote`)}><Heart />مفید بود · {fa(a.votes)}</button>
              {x.mine && !a.best && !a.mine && <button className="btn btn-secondary btn-sm" onClick={() => act.mutate(`/answers/${a.id}/best`)}>برگزیدن این پاسخ</button>}</div>
          </div>))}
        {!x.answers.length && <p className="text-muted">هنوز پاسخی نیامده؛ اگر تجربه‌ای دارید بنویسید.</p>}
        <form className="card grid gap-3 p-5" onSubmit={(e) => { e.preventDefault(); send.mutate(); }}>
          <div className="field"><label htmlFor="an">پاسخ شما</label><textarea id="an" className="input" required value={ans} onChange={(e) => setAns(e.target.value)} placeholder="از تجربهٔ خودتان بگویید؛ مشخص و کوتاه." /></div>
          <button className="btn btn-primary w-fit" disabled={send.isPending || !ans.trim()}>فرستادن پاسخ</button></form>
      </section>
    </div>
  );
}

function PeerTab() {
  const { me } = useAuth(); const qc = useQueryClient(); const toast = useToast();
  const q = useQuery({ queryKey: ['peer-requests'], queryFn: () => api<PeerReq[]>('/peer-requests') });
  const gs = useQuery({ queryKey: ['gaade'], queryFn: () => api<{ mine: GaadeCard[]; near: GaadeCard[] }>('/gaade') });
  const [txt, setTxt] = useState<Record<string, string>>({});
  const [nw, setNw] = useState<{ gaadeId: string; title: string; body: string } | null>(null);
  const reply = useMutation({ mutationFn: (id: string) => api(`/peer-requests/${id}/replies`, { body: { body: txt[id] } }), onSuccess: (_d, id) => { setTxt({ ...txt, [id]: '' }); qc.invalidateQueries({ queryKey: ['peer-requests'] }); toast('نظرتان رسید'); }, onError: (e) => toast(errorText(e), 'err') });
  const create = useMutation({ mutationFn: () => api('/peer-requests', { body: nw }), onSuccess: () => { setNw(null); qc.invalidateQueries({ queryKey: ['peer-requests'] }); toast('درخواست نظر برای همتایان گعده رفت'); }, onError: (e) => toast(errorText(e), 'err') });
  if (q.isLoading) return <Spinner />;
  const mine = gs.data?.mine ?? [];
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-muted">گزارش‌هایی که همتایان گعده‌تان برای گرفتن نظر گذاشته‌اند. نظر کوتاه، مشخص و مهربان بنویسید.</p>
        {mine.length > 0 && <button className="btn btn-primary" onClick={() => setNw({ gaadeId: mine[0].id, title: '', body: '' })}><Plus />درخواست نظر</button>}</div>
      {q.data?.length ? q.data.map((r) => (
        <div key={r.id} className="card grid gap-3 p-5">
          <div className="flex items-center gap-3"><Av p={r.author} /><span className="min-w-0 flex-1"><b className="block text-ink">{r.title}</b><span className="text-xs text-muted">{r.author.name} · {r.gaade} · {ago(r.createdAt)}</span></span></div>
          <p className="leading-8">{r.body}</p>
          {r.replies.map((x) => <div key={x.id} className="flex gap-2 rounded-xl bg-sunken p-3 text-sm"><b className="text-ink">{x.author.name}:</b><span className="flex-1">{x.body}</span><span className="text-xs text-muted">{ago(x.createdAt)}</span></div>)}
          {!r.mine ? <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); reply.mutate(r.id); }}><label className="sr-only" htmlFor={`pr-${r.id}`}>نظر شما</label><input id={`pr-${r.id}`} className="input" required value={txt[r.id] ?? ''} onChange={(e) => setTxt({ ...txt, [r.id]: e.target.value })} placeholder="یک نکتهٔ مشخص و مهربان…" /><button className="btn btn-primary">فرستادن</button></form>
            : <span className="text-xs text-muted">این درخواست شماست{me ? '' : ''}.</span>}
        </div>)) : <Empty icon={UsersRound} title="درخواست نظری نیست">از گزارش یک تکلیف یا تجربه‌ای که می‌خواهید نظر همتایان را بدانید، درخواست نظر بگذارید.</Empty>}
      <Dialog open={!!nw} onClose={() => setNw(null)} title="درخواست نظر از همتایان">
        {nw && <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
          <div className="field"><label htmlFor="pg">گعده</label><select id="pg" className="input" value={nw.gaadeId} onChange={(e) => setNw({ ...nw, gaadeId: e.target.value })}>{mine.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}</select></div>
          <div className="field"><label htmlFor="ptt">عنوان</label><input id="ptt" className="input" required value={nw.title} onChange={(e) => setNw({ ...nw, title: e.target.value })} placeholder="مثلاً گزارش تکلیف حل مسئله" /></div>
          <div className="field"><label htmlFor="pbb">متن گزارش یا پرسش</label><textarea id="pbb" className="input" required value={nw.body} onChange={(e) => setNw({ ...nw, body: e.target.value })} placeholder="بدون نام و نکتهٔ آبرویی." /></div>
          <div className="flex justify-end gap-2"><button type="button" className="btn btn-secondary" onClick={() => setNw(null)}>انصراف</button><button className="btn btn-primary" disabled={create.isPending}>فرستادن</button></div></form>}
      </Dialog>
    </div>
  );
}

/** کارت خانه: گعدهٔ بعدی و یک پرسش همتا */
export function PeersCard() {
  const g = useQuery({ queryKey: ['gaade'], queryFn: () => api<{ mine: GaadeCard[]; near: GaadeCard[] }>('/gaade') });
  const q = useQuery({ queryKey: ['questions', ''], queryFn: () => api<QRow[]>('/questions?q=') });
  if (g.isLoading) return null;
  const next = [...(g.data?.mine ?? [])].filter((x) => x.next).sort((a, b) => a.next!.at.localeCompare(b.next!.at))[0];
  const open = (q.data ?? []).find((x) => !x.hasBest) ?? q.data?.[0];
  return (
    <section className="card grid gap-3 p-6" aria-labelledby="pc-h">
      <div className="flex items-end justify-between"><h2 id="pc-h" className="text-lg font-extrabold">گعده و همتایان</h2><Link to="/peers" className="text-sm font-bold text-deep">همه</Link></div>
      {next ? <Link to={`/gaade/${next.id}`} className="flex items-center gap-3 rounded-xl bg-sunken p-3 no-underline"><UsersRound className="size-10 shrink-0 rounded-xl bg-flame-soft p-2 text-flame-ink" /><span className="min-w-0 flex-1"><b className="block text-ink">{next.title}</b><span className="text-xs text-muted">جلسهٔ بعد: {jDateTime(next.next!.at)}، {next.next!.where}</span></span><span className={`chip ${next.rsvp === 'YES' ? 'chip-leaf' : 'chip-flame'}`}>{next.rsvp === 'YES' ? 'می‌آیم' : 'پاسخ نداده‌اید'}</span></Link>
        : <p className="text-sm text-muted">گعده جای «یک تجربه، یک گره، یک قرار» با همتایان است. <Link to="/peers">پیدا کردن یا ساختن گعده</Link></p>}
      {open && <Link to={`/questions/${open.id}`} className="flex items-center gap-3 rounded-xl bg-sunken p-3 no-underline"><MessageCircleQuestion className="size-6 text-muted" /><span className="min-w-0 flex-1"><span className="text-xs text-muted">پرسش همتایان</span><b className="block text-sm text-ink">{open.title}</b></span><span className="chip tnum">{fa(open.answerCount)} پاسخ</span></Link>}
    </section>
  );
}
