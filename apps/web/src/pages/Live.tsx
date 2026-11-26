/*
 * پخش زنده (۱.۹): ساختن در یک صفحه، اتاق پخش میزبان، صفحهٔ پخش برای مخاطب، زبانهٔ «پخش زنده» در یادگیری،
 * نوار «الان زنده است» و فهرست ستاد. پایه: /v2/lives
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CalendarClock, Check, Copy, MonitorPlay, Pencil, Play, Plus, Radio, Users, Video } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ask } from '../components/Confirm';
import { JalaliInput } from '../components/JalaliInput';
import { Dialog, Empty, ErrorBox, Spinner, useToast } from '../components/ui';
import { api, errorText } from '../lib/api';
import { fa, jDate, jDateTime } from '../lib/fa';
import { useOpenLink } from '../lib/open';

type State = 'SOON' | 'LIVE' | 'ENDED' | 'STOPPED';
export interface LiveCard {
  id: string; title: string; about: string | null; startsAt: string; endsAt: string; state: State; host: string | null;
  publisher: { id: string | null; name: string; color: string }; audience: { kind: 'ALL' | 'PATH' | 'COURSE'; title: string | null };
  reminded: boolean; hasRecording: boolean; record: boolean; useBbb: boolean; joinOpensAt: string; canManage?: boolean; stopReason?: string | null;
}
interface Detail extends LiveCard { inAudience: boolean; audienceNote: string | null }
interface Room extends LiveCard { onlineUrl: string | null; minutes: number; link: string; invite: string; audienceSize: number | null; remindedCount: number; attendees: { name: string; minutes: number | null }[]; finalized: boolean }
interface Options { canCreate: boolean; bbb: boolean; hq: boolean; onlyCourses: boolean; publishers: { id: string; name: string }[]; paths: { id: string; title: string }[]; courses: { id: string; title: string }[] }
interface LiveInfo { recordings: { id: string; durationSec: number | null; startedAt: string | null; expiresAt: string | null }[]; canSeeRecordings: boolean }

const STATE_FA: Record<State, string> = { LIVE: 'زنده', SOON: 'به‌زودی', ENDED: 'تمام شد', STOPPED: 'متوقف شد' };
const AUD_FA = (a: LiveCard['audience']) => (a.kind === 'PATH' ? `کنشگران مسیر «${a.title ?? ''}»` : a.kind === 'COURSE' ? `شرکت‌کنندگان دورهٔ «${a.title ?? ''}»` : 'همه');
const when = (iso: string) => jDateTime(iso);
const hhmm = (iso: string) => new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

function StateChip({ s }: { s: State }) {
  return s === 'LIVE' ? <span className="chip chip-live">زنده</span> : <span className={`chip ${s === 'SOON' ? 'chip-flame' : s === 'STOPPED' ? 'chip-rose' : ''}`}>{STATE_FA[s]}</span>;
}
function Badge({ c }: { c: LiveCard }) {
  return <span className="grid size-11 shrink-0 place-items-center rounded-2xl text-white" style={{ background: c.publisher.color }} aria-hidden="true"><Radio className="size-5" /></span>;
}
/** دقیقه‌های مانده؛ هر ۲۰ ثانیه تازه می‌شود */
function useNow(ms = 20_000) { const [n, setN] = useState(Date.now()); useEffect(() => { const t = setInterval(() => setN(Date.now()), ms); return () => clearInterval(t); }, [ms]); return n; }
const left = (iso: string, now: number) => { const m = Math.max(0, Math.round((new Date(iso).getTime() - now) / 60_000)); return m >= 1440 ? `${fa(Math.round(m / 1440))} روز` : m >= 60 ? `${fa(Math.floor(m / 60))} ساعت${m % 60 ? ` و ${fa(m % 60)} دقیقه` : ''}` : `${fa(m)} دقیقه`; };

function useJoin() {
  const open = useOpenLink(); const toast = useToast();
  return useMutation({ mutationFn: (id: string) => api<{ url: string }>(`/v2/lives/${id}/join`, { method: 'POST' }), onSuccess: (r) => open(r.url), onError: (e) => toast(errorText(e), 'err') });
}

/* ───────── کارت در فهرست‌ها ───────── */
function Row({ c }: { c: LiveCard }) {
  return (
    <Link to={`/live/${c.id}`} className="card is-link flex items-center gap-3 p-4 no-underline">
      <Badge c={c} />
      <span className="min-w-0 flex-1"><b className="block text-ink">{c.title}</b>
        <span className="text-sm text-muted">{c.state === 'LIVE' ? `از ${hhmm(c.startsAt)}` : c.state === 'SOON' ? when(c.startsAt) : jDate(c.startsAt)}، {c.publisher.name}{c.audience.kind !== 'ALL' ? `، ${AUD_FA(c.audience)}` : ''}</span></span>
      {c.state === 'SOON' && c.reminded ? <span className="chip chip-leaf"><Check className="size-3.5" />یادآوری</span> : c.state === 'ENDED' ? <span className="chip"><Video className="size-3.5" />ضبط</span> : <StateChip s={c.state} />}
    </Link>
  );
}

/* ───────── زبانهٔ «پخش زنده» در یادگیری ───────── */
export function LiveList() {
  const q = useQuery({ queryKey: ['v2', 'lives'], queryFn: () => api<{ now: LiveCard[]; soon: LiveCard[]; recorded: LiveCard[] }>('/v2/lives'), refetchInterval: 60_000 });
  const o = useQuery({ queryKey: ['v2', 'lives', 'options'], queryFn: () => api<Options>('/v2/lives/options'), staleTime: 300_000 });
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  const d = q.data!;
  const sec = (t: string, xs: LiveCard[], empty: string) => (
    <section className="grid gap-3" aria-label={t}><h2 className="text-lg font-extrabold">{t}</h2>{xs.length ? <div className="grid gap-3 lg:grid-cols-2">{xs.map((c) => <Row key={c.id} c={c} />)}</div> : <p className="text-muted">{empty}</p>}</section>
  );
  return (
    <div className="grid gap-8">
      {o.data?.canCreate && <div className="flex justify-end"><Link to="/live/new" className="btn btn-primary"><Plus className="size-4" />پخش زندهٔ تازه</Link></div>}
      {!!d.now.length && sec('الان زنده', d.now, '')}
      {sec('به‌زودی', d.soon, 'فعلاً پخشی در راه نیست. پخش‌های مسیرها و دوره‌هایت همین‌جا می‌آید و خبرش را هم می‌گیری.')}
      {sec('ضبط‌شده‌ها', d.recorded, 'هنوز ضبطی نیست.')}
    </div>
  );
}

/* ───────── نوار «الان زنده است» (بالای همهٔ صفحه‌ها) ───────── */
export function LiveNowBar() {
  const q = useQuery({ queryKey: ['v2', 'lives', 'now'], queryFn: () => api<{ id: string; title: string; startsAt: string; live: boolean }[]>('/v2/lives/now'), refetchInterval: 60_000, retry: false });
  const x = q.data?.[0];
  if (!x || location.pathname.startsWith(`/live/${x.id}`)) return null;
  return (
    <div className="border-b border-line bg-[#262A4F] text-white">
      <Link to={`/live/${x.id}`} className="wrap flex items-center gap-3 py-2 text-sm text-white no-underline">
        <span className="chip chip-live !text-flame">{x.live ? 'زنده' : `از ${hhmm(x.startsAt)}`}</span>
        <b className="min-w-0 flex-1 truncate">{x.title}{(q.data?.length ?? 0) > 1 ? ` و ${fa(q.data!.length - 1)} پخش دیگر` : ''}</b>
        <span className="inline-flex items-center gap-1 font-bold">ورود<MonitorPlay className="size-4" /></span>
      </Link>
    </div>
  );
}

/* ───────── صفحهٔ پخش (مخاطب) ───────── */
export function LivePage() {
  const { id = '' } = useParams();
  const qc = useQueryClient(); const toast = useToast(); const now = useNow();
  const q = useQuery({ queryKey: ['v2', 'live', id], queryFn: () => api<Detail>(`/v2/lives/${id}`), refetchInterval: 60_000 });
  const info = useQuery({ queryKey: ['live-info', id], queryFn: () => api<LiveInfo>(`/events/${id}/live`), enabled: q.data?.state === 'ENDED' });
  const join = useJoin();
  const remind = useMutation({ mutationFn: (on: boolean) => api(`/v2/lives/${id}/remind`, { method: on ? 'POST' : 'DELETE' }), onSuccess: (_r, on) => { qc.invalidateQueries({ queryKey: ['v2', 'live', id] }); qc.invalidateQueries({ queryKey: ['v2', 'lives'] }); toast(on ? 'یادت می‌اندازیم: یک روز و ربع ساعت پیش از شروع' : 'یادآوری برداشته شد'); }, onError: (e) => toast(errorText(e), 'err') });
  const open = useOpenLink();
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  const c = q.data!;
  const opens = new Date(c.joinOpensAt).getTime() <= now;
  return (
    <article className="mx-auto grid max-w-3xl gap-6">
      <Link to="/learn?tab=live" className="inline-flex w-fit items-center gap-1 text-sm text-muted no-underline hover:text-ink"><ArrowRight className="size-4" />همهٔ پخش‌های زنده</Link>
      <header className="flex items-start gap-4">
        <Badge c={c} />
        <div className="min-w-0 flex-1"><StateChip s={c.state} /><h1 className="mt-1 text-[clamp(24px,3.4vw,34px)] font-extrabold leading-tight">{c.title}</h1>
          <p className="mt-1 text-muted">{c.publisher.name}{c.host ? `، با ${c.host}` : ''}</p></div>
      </header>
      <section className="card grid gap-4 p-5 sm:p-6" aria-label="ورود">
        <p className="flex items-center gap-2 text-body"><CalendarClock className="size-5 text-muted" />{when(c.startsAt)} تا {hhmm(c.endsAt)}</p>
        {c.state === 'STOPPED' && <p className="rounded-xl bg-rose-soft px-3 py-2 text-rose-ink">این پخش برگزار نمی‌شود{c.stopReason ? `: ${c.stopReason}` : '.'}</p>}
        {!c.inAudience && c.state !== 'STOPPED' && <p className="rounded-xl bg-sunken px-3 py-2 text-body">{c.audienceNote}</p>}
        {c.inAudience && (c.state === 'LIVE' || c.state === 'SOON') && (opens
          ? <button className="btn btn-primary btn-lg w-full sm:w-auto" disabled={join.isPending} onClick={() => join.mutate(id)}><MonitorPlay className="size-5" />{c.state === 'LIVE' ? 'ورود به پخش' : 'ورود به پخش (تا لحظاتی دیگر شروع می‌شود)'}</button>
          : <div className="flex flex-wrap items-center gap-3">
              <p className="text-body">{left(c.startsAt, now)} تا شروع. «ورود به پخش» از ساعت {hhmm(c.joinOpensAt)} همین‌جا باز می‌شود.</p>
              {c.reminded
                ? <button className="btn btn-secondary btn-sm" disabled={remind.isPending} onClick={() => remind.mutate(false)}><Check className="size-4" />یادآوری روشن است</button>
                : <button className="btn btn-primary btn-sm" disabled={remind.isPending} onClick={() => remind.mutate(true)}><CalendarClock className="size-4" />یادم بینداز</button>}
            </div>)}
        {c.state === 'ENDED' && (info.data?.recordings.length
          ? <div className="grid gap-2"><b className="text-ink">ضبط پخش</b>{info.data.recordings.map((r, i) => <button key={r.id} className="btn btn-secondary w-fit" onClick={async () => { try { const x = await api<{ url: string }>(`/events/${id}/recordings/${r.id}`, { method: 'POST' }); open(x.url); } catch (e) { toast(errorText(e), 'err'); } }}><Play className="size-4" />دیدن ضبط{info.data!.recordings.length > 1 ? ` ${fa(i + 1)}` : ''}{r.durationSec ? `، ${fa(Math.round(r.durationSec / 60))} دقیقه` : ''}</button>)}</div>
          : <p className="text-muted">{c.record ? 'ضبط معمولاً تا نیم ساعت بعد از پایان همین‌جا می‌آید.' : 'این پخش ضبط نشد.'}</p>)}
        {c.state !== 'ENDED' && c.record && <p className="text-sm text-muted">این پخش ضبط می‌شود و تا شش ماه برای مخاطبانش می‌ماند.</p>}
        {c.canManage && <Link to={`/live/${id}/room`} className="btn btn-ghost btn-sm w-fit">اتاق پخش (میزبان)</Link>}
      </section>
      {c.about && <section className="grid gap-2"><h2 className="text-lg font-extrabold">دربارهٔ این پخش</h2><p className="whitespace-pre-line text-body">{c.about}</p></section>}
      <p className="text-sm text-muted">مخاطب: {AUD_FA(c.audience)}</p>
    </article>
  );
}

/* ───────── ساختن ───────── */
const DURS = [30, 45, 60, 90, 120];
export function LiveNew() {
  const nav = useNavigate(); const toast = useToast(); const qc = useQueryClient();
  const o = useQuery({ queryKey: ['v2', 'lives', 'options'], queryFn: () => api<Options>('/v2/lives/options') });
  const [f, setF] = useState({ title: '', about: '', now: false, startsAt: '', minutes: 60, audience: 'ALL' as 'ALL' | 'PATH' | 'COURSE', pathId: '', courseId: '', publisherId: '', hostOther: false, hostMobile: '', record: true, onlineUrl: '' });
  const [errs, setErrs] = useState('');
  useEffect(() => { if (o.data?.onlyCourses) setF((x) => ({ ...x, audience: 'COURSE' })); if (o.data && !o.data.hq && o.data.publishers[0]) setF((x) => ({ ...x, publisherId: x.publisherId || o.data!.publishers[0].id })); }, [o.data]);
  const create = useMutation({
    mutationFn: () => api<{ id: string }>('/v2/lives', { body: { title: f.title, about: f.about || undefined, now: f.now, startsAt: f.now ? undefined : f.startsAt, minutes: f.minutes, audience: f.audience, pathId: f.audience === 'PATH' ? f.pathId : undefined, courseId: f.audience === 'COURSE' ? f.courseId : undefined, publisherId: f.publisherId || undefined, hostMobile: f.hostOther ? f.hostMobile : undefined, record: f.record, onlineUrl: f.onlineUrl || undefined } }),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ['v2', 'lives'] }); toast(f.now ? 'پخش ساخته شد؛ از اتاق پخش وارد شو' : 'پخش زنده ساخته شد'); nav(`/live/${r.id}/room`, { replace: true }); },
    onError: (e) => setErrs(errorText(e)),
  });
  if (o.isLoading) return <Spinner />;
  if (o.error) return <ErrorBox error={o.error} onRetry={() => o.refetch()} />;
  const d = o.data!;
  if (!d.canCreate) return <Empty icon={Radio} title="پخش زنده را برگزارکنندگان و استادها می‌سازند">اگر عضو تیم یک برگزارکننده‌ای، از مدیر تیم بخواه تو را اضافه کند.</Empty>;
  const submit = (e: FormEvent) => {
    e.preventDefault(); setErrs('');
    if (f.title.trim().length < 3) return setErrs('عنوان را بنویس');
    if (!f.now && !f.startsAt) return setErrs('زمان شروع را بگو یا «همین الان» را بزن');
    if (f.audience === 'PATH' && !f.pathId) return setErrs('مسیر را انتخاب کن');
    if (f.audience === 'COURSE' && !f.courseId) return setErrs('دوره را انتخاب کن');
    if (!d.bbb && !f.onlineUrl.trim()) return setErrs('پیوند کلاس را بگذار');
    create.mutate();
  };
  const seg = (on: boolean) => `btn btn-sm ${on ? 'btn-primary' : 'btn-secondary'}`;
  return (
    <form onSubmit={submit} className="mx-auto grid max-w-2xl gap-6" noValidate>
      <header><h1 className="text-[clamp(24px,3vw,32px)] font-extrabold">پخش زندهٔ تازه</h1><p className="mt-1 text-muted">بی‌مرحلهٔ انتشار: همین که بسازی، مخاطب‌ها می‌بینند{d.bbb ? '.' : '. سرور کلاس مدرسه هنوز راه نیفتاده؛ پیوند کلاس را خودت می‌گذاری.'}</p></header>
      <div className="card grid gap-5 p-5 sm:p-6">
        <label className="field"><span>عنوان</span><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="مثلاً پرسش و پاسخ دربارهٔ گعدهٔ هفتگی" autoFocus maxLength={120} /></label>
        <label className="field"><span>چند خط دربارهٔ پخش <span className="font-normal text-muted">(اختیاری)</span></span><textarea className="input min-h-20 py-2" value={f.about} onChange={(e) => setF({ ...f, about: e.target.value })} maxLength={1000} /></label>
        <fieldset className="grid gap-2"><legend className="mb-2 text-sm font-bold text-ink">چه زمانی؟</legend>
          <div className="flex flex-wrap gap-2"><button type="button" className={seg(f.now)} aria-pressed={f.now} onClick={() => setF({ ...f, now: true })}><Radio className="size-4" />همین الان</button><button type="button" className={seg(!f.now)} aria-pressed={!f.now} onClick={() => setF({ ...f, now: false })}><CalendarClock className="size-4" />روز و ساعت</button></div>
          {!f.now && <JalaliInput label="شروع" value={f.startsAt} onChange={(v) => setF({ ...f, startsAt: v })} />}
        </fieldset>
        <fieldset className="grid gap-2"><legend className="mb-2 text-sm font-bold text-ink">چقدر طول می‌کشد؟</legend>
          <div className="flex flex-wrap gap-2">{DURS.map((m) => <button key={m} type="button" className={seg(f.minutes === m)} aria-pressed={f.minutes === m} onClick={() => setF({ ...f, minutes: m })}>{m < 60 ? `${fa(m)} دقیقه` : m === 60 ? 'یک ساعت' : m === 90 ? 'یک ساعت و نیم' : 'دو ساعت'}</button>)}</div>
        </fieldset>
        <fieldset className="grid gap-2"><legend className="mb-2 text-sm font-bold text-ink">برای چه کسانی؟</legend>
          {!d.onlyCourses && <div className="flex flex-wrap gap-2">{([['ALL', 'همه'], ['PATH', 'کنشگران یک مسیر'], ['COURSE', 'شرکت‌کنندگان یک دوره']] as const).map(([k, l]) => <button key={k} type="button" className={seg(f.audience === k)} aria-pressed={f.audience === k} onClick={() => setF({ ...f, audience: k })} disabled={(k === 'PATH' && !d.paths.length) || (k === 'COURSE' && !d.courses.length)}>{l}</button>)}</div>}
          {f.audience === 'PATH' && <select className="input" value={f.pathId} onChange={(e) => setF({ ...f, pathId: e.target.value })} aria-label="مسیر"><option value="">مسیر را انتخاب کن</option>{d.paths.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select>}
          {f.audience === 'COURSE' && <select className="input" value={f.courseId} onChange={(e) => setF({ ...f, courseId: e.target.value })} aria-label="دوره"><option value="">دوره را انتخاب کن</option>{d.courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select>}
          <p className="text-sm text-muted">{f.audience === 'ALL' ? 'در زبانهٔ «پخش زنده» همه می‌بینند و هر کس بخواهد «یادم بینداز» می‌زند.' : 'همین که بسازی خبرشان می‌کنیم و ربع ساعت پیش از شروع یادشان می‌اندازیم.'}</p>
        </fieldset>
        {f.audience === 'ALL' && (d.hq || d.publishers.length > 1) && <label className="field"><span>به نام</span><select className="input" value={f.publisherId} onChange={(e) => setF({ ...f, publisherId: e.target.value })}>{d.hq && <option value="">ستاد مدرسهٔ هدایت</option>}{d.publishers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}
        <fieldset className="grid gap-2"><legend className="mb-2 text-sm font-bold text-ink">میزبان</legend>
          <div className="flex flex-wrap gap-2"><button type="button" className={seg(!f.hostOther)} aria-pressed={!f.hostOther} onClick={() => setF({ ...f, hostOther: false })}>خودم</button><button type="button" className={seg(f.hostOther)} aria-pressed={f.hostOther} onClick={() => setF({ ...f, hostOther: true })}>کس دیگر</button></div>
          {f.hostOther && <input className="input" dir="ltr" inputMode="tel" placeholder="شمارهٔ میزبان، 0912…" value={f.hostMobile} onChange={(e) => setF({ ...f, hostMobile: e.target.value })} aria-label="شمارهٔ میزبان" />}
          {f.hostOther && <p className="text-sm text-muted">میزبان باید یک بار با همین شماره وارد مدرسه شده باشد. او و تیم برگزارکننده هر دو اتاق پخش را دارند.</p>}
        </fieldset>
        {d.bbb ? <label className="flex items-start gap-3"><input type="checkbox" className="mt-1 size-5" checked={f.record} onChange={(e) => setF({ ...f, record: e.target.checked })} /><span><b className="text-ink">ضبط شود</b><span className="block text-sm text-muted">اول پخش به همه اعلام می‌شود. ضبط تا شش ماه برای مخاطب‌ها می‌ماند.</span></span></label>
          : <label className="field"><span>پیوند کلاس</span><input className="input" dir="ltr" value={f.onlineUrl} onChange={(e) => setF({ ...f, onlineUrl: e.target.value })} placeholder="https://…" /><span className="text-sm text-muted">اسکای‌روم، گوگل‌میت یا هر اتاق دیگر. مخاطب‌ها فقط از ربع ساعت پیش از شروع می‌بینندش.</span></label>}
      </div>
      {errs && <p className="err" role="alert">{errs}</p>}
      <div className="flex flex-wrap gap-2"><button className="btn btn-primary btn-lg" disabled={create.isPending}>{create.isPending ? 'یک لحظه…' : f.now ? <><Radio className="size-5" />بساز و برو به اتاق پخش</> : 'بساز'}</button><button type="button" className="btn btn-ghost btn-lg" onClick={() => nav(-1)}>انصراف</button></div>
    </form>
  );
}

/* ───────── اتاق پخش (میزبان) ───────── */
export function LiveRoom() {
  const { id = '' } = useParams();
  const qc = useQueryClient(); const toast = useToast(); const now = useNow(); const nav = useNavigate();
  const q = useQuery({ queryKey: ['v2', 'live-room', id], queryFn: () => api<Room>(`/v2/lives/${id}/room`), refetchInterval: 30_000 });
  const info = useQuery({ queryKey: ['live-info', id], queryFn: () => api<LiveInfo>(`/events/${id}/live`), enabled: q.data?.state === 'ENDED' });
  const join = useJoin(); const open = useOpenLink();
  const [edit, setEdit] = useState<null | { title: string; about: string; startsAt: string; minutes: number }>(null);
  const refresh = () => { qc.invalidateQueries({ queryKey: ['v2', 'live-room', id] }); qc.invalidateQueries({ queryKey: ['v2', 'lives'] }); };
  const save = useMutation({ mutationFn: (b: object) => api(`/v2/lives/${id}`, { method: 'PATCH', body: b }), onSuccess: () => { refresh(); setEdit(null); toast('ذخیره شد'); }, onError: (e) => toast(errorText(e), 'err') });
  const stop = useMutation({ mutationFn: (reason: string) => api(`/v2/lives/${id}/stop`, { body: { reason } }), onSuccess: () => { refresh(); toast('پخش متوقف شد؛ به کسانی که یادآوری خواسته بودند خبر دادیم'); } });
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  const r = q.data!;
  const copy = async (t: string, ok: string) => { try { await navigator.clipboard.writeText(t); toast(ok); } catch { toast('کپی نشد؛ متن را دستی انتخاب کن', 'err'); } };
  const ended = r.state === 'ENDED' || r.state === 'STOPPED';
  return (
    <div className="grid gap-6">
      <button type="button" onClick={() => nav(-1)} className="inline-flex w-fit items-center gap-1 text-sm text-muted hover:text-ink"><ArrowRight className="size-4" />برگشت</button>
      <header className="flex flex-wrap items-start gap-4">
        <Badge c={r} />
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><StateChip s={r.state} /><span className="text-sm text-muted">اتاق پخش</span></div>
          <h1 className="mt-1 text-[clamp(22px,3vw,30px)] font-extrabold leading-tight">{r.title}</h1>
          <p className="mt-1 text-muted">{when(r.startsAt)}، {r.minutes >= 60 ? `${fa(r.minutes / 60)} ساعت` : `${fa(r.minutes)} دقیقه`}، {r.publisher.name}، برای {AUD_FA(r.audience)}</p></div>
        {!ended && <div className="flex flex-wrap gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => setEdit({ title: r.title, about: r.about ?? '', startsAt: r.startsAt, minutes: r.minutes })}><Pencil className="size-4" />ویرایش</button>
          <button className="btn btn-ghost btn-sm text-rose" onClick={async () => { const why = await ask({ title: 'پخش متوقف شود؟', body: 'برای کسانی که یادآوری خواسته‌اند خبر می‌فرستیم و پخش از فهرست‌ها برداشته می‌شود.', input: true, required: true, label: 'دلیل (برای مخاطب‌ها)', ok: 'متوقف کن', danger: true }); if (why) stop.mutate(why as string); }}>توقف</button>
        </div>}
      </header>

      <section className="card grid gap-4 p-5 sm:p-6" aria-label="شروع">
        {r.state === 'STOPPED' ? <p className="text-rose-ink">این پخش متوقف شد{r.stopReason ? `: ${r.stopReason}` : '.'}</p>
          : r.state === 'ENDED' ? <p className="text-body">پخش تمام شد. {r.finalized ? 'حضورها حساب شد.' : r.useBbb ? 'حضورها چند دقیقهٔ دیگر حساب می‌شود.' : ''}</p>
          : <>
            <p className="text-body">{r.state === 'LIVE' ? 'پخش در جریان است.' : `${left(r.startsAt, now)} تا شروع. تو هر وقت بخواهی وارد می‌شوی؛ مخاطب‌ها از ساعت ${hhmm(r.joinOpensAt)}.`}</p>
            <button className="btn btn-primary btn-lg w-full sm:w-auto" disabled={join.isPending} onClick={() => join.mutate(id)}><MonitorPlay className="size-5" />{r.state === 'LIVE' ? 'ورود به پخش (میزبان)' : 'باز کردن اتاق (میزبان)'}</button>
            {r.useBbb ? <p className="text-sm text-muted">میزبان با اختیار کامل وارد می‌شود: میکروفون، تصویر، صفحه و {r.record ? 'دکمهٔ ضبط (ضبط از وقتی که آن را بزنی شروع می‌شود)' : 'مدیریت حاضران'}.</p> : r.onlineUrl && <p className="text-sm text-muted" dir="ltr">{r.onlineUrl}</p>}
          </>}
      </section>

      {!ended && <section className="card grid gap-3 p-5 sm:p-6" aria-label="دعوت">
        <h2 className="text-lg font-extrabold">دعوت</h2>
        <p className="text-sm text-muted">این متن را در بله، ایتا یا گروه‌هایتان بفرستید. هر کس بزند، با یک ضربه وارد صفحهٔ پخش می‌شود.</p>
        <pre className="whitespace-pre-wrap rounded-xl bg-sunken p-3 font-[inherit] text-sm text-body">{r.invite}</pre>
        <div className="flex flex-wrap gap-2"><button className="btn btn-primary btn-sm" onClick={() => copy(r.invite, 'متن دعوت کپی شد')}><Copy className="size-4" />کپی متن دعوت</button><button className="btn btn-secondary btn-sm" onClick={() => copy(r.link, 'پیوند کپی شد')}><Copy className="size-4" />کپی پیوند</button><Link className="btn btn-ghost btn-sm" to={`/live/${id}`}>صفحهٔ پخش از چشم مخاطب</Link></div>
      </section>}

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[[r.audience.kind === 'ALL' ? 'مخاطب' : 'کنشگران مخاطب', r.audience.kind === 'ALL' ? 'همه' : fa(r.audienceSize ?? 0)], ['یادآوری خواسته‌اند', fa(r.remindedCount)], ['حاضر', fa(r.attendees.length)]].map(([k, v]) => <div key={k} className="card px-4 py-3"><dt className="text-sm text-muted">{k}</dt><dd className="tnum mt-1 text-xl font-extrabold text-ink">{v}</dd></div>)}
      </dl>

      {!!r.attendees.length && <section className="grid gap-2" aria-label="حاضران"><h2 className="flex items-center gap-2 text-lg font-extrabold"><Users className="size-5" />حاضران</h2>
        <ul className="card divide-y divide-line">{r.attendees.map((a, i) => <li key={i} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"><span className="text-ink">{a.name}</span>{a.minutes != null && <span className="tnum text-muted">{fa(a.minutes)} دقیقه</span>}</li>)}</ul></section>}

      {r.state === 'ENDED' && <section className="grid gap-2" aria-label="ضبط"><h2 className="text-lg font-extrabold">ضبط</h2>
        {info.data?.recordings.length ? info.data.recordings.map((x) => <button key={x.id} className="btn btn-secondary w-fit" onClick={async () => { try { const y = await api<{ url: string }>(`/events/${id}/recordings/${x.id}`, { method: 'POST' }); open(y.url); } catch (e) { toast(errorText(e), 'err'); } }}><Play className="size-4" />دیدن ضبط{x.expiresAt ? `، تا ${jDate(x.expiresAt)} می‌ماند` : ''}</button>)
          : <p className="text-muted">{r.record ? 'ضبط معمولاً تا نیم ساعت بعد از پایان می‌آید.' : 'این پخش ضبط نشد.'}</p>}
        <p className="text-sm text-muted">برای گذاشتن ضبط در یک مسیر، در مسیرساز همین پخش را به پله اضافه کن.</p></section>}

      <Dialog open={!!edit} onClose={() => setEdit(null)} title="ویرایش پخش">
        {edit && <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); save.mutate({ title: edit.title, about: edit.about, startsAt: edit.startsAt, minutes: edit.minutes }); }}>
          <label className="field"><span>عنوان</span><input className="input" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></label>
          <label className="field"><span>دربارهٔ پخش</span><textarea className="input min-h-20 py-2" value={edit.about} onChange={(e) => setEdit({ ...edit, about: e.target.value })} /></label>
          {r.state === 'SOON' && <JalaliInput label="شروع" value={edit.startsAt} onChange={(v) => setEdit({ ...edit, startsAt: v })} />}
          <div className="flex flex-wrap gap-2">{DURS.map((m) => <button key={m} type="button" className={`btn btn-sm ${edit.minutes === m ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setEdit({ ...edit, minutes: m })}>{fa(m)} دقیقه</button>)}</div>
          <p className="text-sm text-muted">اگر زمان را عوض کنی، به کسانی که یادآوری خواسته‌اند خبر می‌دهیم.</p>
          <div className="flex gap-2"><button className="btn btn-primary" disabled={save.isPending}>ذخیره</button><button type="button" className="btn btn-ghost" onClick={() => setEdit(null)}>انصراف</button></div>
        </form>}
      </Dialog>
    </div>
  );
}

/* ───────── پخش‌های من (پنل برگزارکننده و استودیو) ───────── */
export function MyLives({ intro }: { intro: string }) {
  const q = useQuery({ queryKey: ['v2', 'lives', 'mine'], queryFn: () => api<LiveCard[]>('/v2/lives/mine') });
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  const xs = q.data!;
  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-[clamp(24px,3vw,32px)] font-extrabold">پخش زنده</h1><p className="mt-1 text-muted">{intro}</p></div><Link to="/live/new" className="btn btn-primary"><Radio className="size-4" />پخش زندهٔ تازه</Link></header>
      {xs.length ? <div className="grid gap-3">{xs.map((c) => <Link key={c.id} to={`/live/${c.id}/room`} className="card is-link flex items-center gap-3 p-4 no-underline"><Badge c={c} /><span className="min-w-0 flex-1"><b className="block text-ink">{c.title}</b><span className="text-sm text-muted">{when(c.startsAt)}، برای {AUD_FA(c.audience)}</span></span><StateChip s={c.state} /></Link>)}</div>
        : <Empty icon={Radio} title="هنوز پخش زنده‌ای نساخته‌ای">با «پخش زندهٔ تازه» در یک صفحه بساز؛ همین الان یا برای بعد.</Empty>}
    </div>
  );
}

/* ───────── ستاد ───────── */
interface AdminRow { id: string; title: string; startsAt: string; endsAt: string; state: State; publisher: string | null; by: string | null; host: string | null; reminded: number; attended: number; stopReason: string | null }
export function AdminLives() {
  const qc = useQueryClient(); const toast = useToast();
  const q = useQuery({ queryKey: ['v2', 'admin', 'lives'], queryFn: () => api<AdminRow[]>('/v2/admin/lives'), refetchInterval: 60_000 });
  const stop = useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => api(`/v2/lives/${id}/stop`, { body: { reason } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['v2', 'admin', 'lives'] }); toast('متوقف شد؛ به سازنده و یادآوری‌خواه‌ها خبر دادیم'); } });
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  const xs = q.data!;
  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-extrabold">پخش‌های زنده</h1><p className="mt-1 max-w-2xl text-muted">برگزارکنندگان و استادها بی‌بازبینی پخش می‌گذارند. این‌جا همه را می‌بینی و هر کدام را که لازم شد، با دلیل متوقف می‌کنی.</p></div><Link to="/live/new" className="btn btn-primary"><Radio className="size-4" />پخش زندهٔ تازه</Link></header>
      {!xs.length ? <Empty icon={Radio} title="هنوز پخشی نیست">پخش‌های برگزارکنندگان این‌جا می‌آید.</Empty> : (
        <div className="card divide-y divide-line">{xs.map((x) => (
          <div key={x.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <span className="min-w-0 flex-1"><Link to={`/live/${x.id}/room`} className="font-bold text-ink">{x.title}</Link>
              <span className="block text-sm text-muted">{when(x.startsAt)}، {x.publisher ?? 'ستاد'}{x.by ? `، ساخت ${x.by}` : ''}، {fa(x.reminded)} یادآوری{x.attended ? `، ${fa(x.attended)} حاضر` : ''}{x.stopReason ? `، دلیل توقف: ${x.stopReason}` : ''}</span></span>
            <StateChip s={x.state} />
            {(x.state === 'SOON' || x.state === 'LIVE') && <button className="btn btn-ghost btn-sm text-rose" onClick={async () => { const reason = await ask({ title: `متوقف کردن «${x.title}»`, body: 'سازنده و کسانی که یادآوری خواسته‌اند خبر می‌گیرند.', input: true, required: true, label: 'دلیل', ok: 'متوقف کن', danger: true }); if (reason) stop.mutate({ id: x.id, reason: reason as string }); }}>توقف</button>}
          </div>
        ))}</div>
      )}
      <p className="text-sm text-muted">پخش‌های دو ماه اخیر و آینده.</p>
    </div>
  );
}
