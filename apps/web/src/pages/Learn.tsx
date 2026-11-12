/*
 * یادگیری: سه زبانه. «مسیرهای من» (برداشته‌ها)، «مسیر اصلی من» (پیش‌فرض بر پایهٔ نقش، نه اجبار)، «کاوش» (همهٔ برگزارکنندگان).
 * صفحهٔ مسیر برای هر سه اندازه یکی است؛ فقط واحد پله (هفته/پله) و قفل‌شدن فرق می‌کند.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Award, Compass, MessageCircle, Radio, Route, Search, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { CourseCard } from '../components/CourseCard';
import { PathCard, PubName, ROLE_FA, Section, SizeMark, Steps, Toranj, pathStateText, useLearning, usePaths2 } from '../components/Path2';
import { Empty, ErrorBox, Spinner, useToast } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { fa, jDate, jShort } from '../lib/fa';
import type { ActorRole, CourseCard as C, EventCard, PathSize, PathV2, Pub } from '../lib/types';
import { ImamatCard } from './Imamat';

type Tab = 'mine' | 'main' | 'explore';
const TABS: [Tab, string][] = [['mine', 'مسیرهای من'], ['main', 'مسیر اصلی من'], ['explore', 'کاوش']];

export default function Learn() {
  const [sp, setSp] = useSearchParams();
  const tab = (sp.get('tab') as Tab) || 'mine';
  const L = useLearning();
  if (L.isLoading) return <Spinner />;
  if (L.error) return <ErrorBox error={L.error} onRetry={() => L.refetch()} />;
  const d = L.data!;
  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-[clamp(24px,3vw,32px)] font-extrabold">یادگیری</h1><p className="mt-1 text-muted">{tab === 'explore' ? 'همهٔ مسیرها، دوره‌ها و پخش‌های زندهٔ برگزارکنندگان؛ هر کدام را جدا بردار.' : tab === 'main' ? 'مسیر اصلی پیش‌فرض است، نه اجبار.' : 'مسیرهایی که برداشته‌ای.'}</p></div>
        <div className="seg seg-pill" role="tablist" aria-label="بخش‌های یادگیری">{TABS.map(([k, t]) => <button key={k} role="tab" aria-selected={tab === k} aria-pressed={tab === k} onClick={() => setSp({ tab: k })}>{t}</button>)}</div>
      </header>
      {tab === 'mine' && <Mine d={d} onExplore={() => setSp({ tab: 'explore' })} />}
      {tab === 'main' && <Main d={d} onExplore={() => setSp({ tab: 'explore' })} />}
      {tab === 'explore' && <Explore role={d.actorRole} />}
    </div>
  );
}

function Mine({ d, onExplore }: { d: NonNullable<ReturnType<typeof useLearning>['data']>; onExplore: () => void }) {
  const active = d.mine.filter((p) => p.percent < 100).sort((a, b) => (a.isMain ? -1 : b.isMain ? 1 : 0));
  const done = d.mine.filter((p) => p.percent >= 100);
  if (!d.mine.length) {
    return (
      <div className="grid gap-8">
        {d.main && <MainIntro p={d.main} role={d.actorRole} />}
        <Empty icon={Route} title="هنوز مسیری برنداشته‌ای">{d.main ? 'اگر مسیر اصلی برایت بلند است، با یک مسیر خرد شروع کن؛ یک تا چهار هفته، هر هفته یک کار کوچک در مسجد.' : 'با یک مسیر خرد شروع کن؛ یک تا چهار هفته، هر هفته یک کار کوچک در مسجد.'}<div className="mt-3"><button className="btn btn-primary" onClick={onExplore}>کاوش کن</button></div></Empty>
        {!!d.suggestions.length && <Section title="سه مسیر برای شروع"><div className="grid gap-4 lg:grid-cols-3">{d.suggestions.map((p, i) => <PathCard key={p.id} p={p} i={i} />)}</div></Section>}
      </div>
    );
  }
  return (
    <div className="grid gap-10">
      <div className="stagger grid gap-4 lg:grid-cols-2">{active.map((p, i) => <PathCard key={p.id} p={p} i={i} big={p.isMain} />)}</div>
      {!!done.length && <Section title="تمام‌شده‌ها" link="در کارنامه" to="/me"><div className="card divide-y divide-line">{done.map((p) => <Link key={p.id} to={`/paths/${p.slug}`} className="flex items-center gap-3 px-4 py-3 no-underline"><Toranj state="done" color={p.color} size={18} /><span className="flex-1"><b className="block text-ink">{p.title}</b><span className="text-sm text-muted">{p.sizeFa}{p.publisher ? `، ${p.publisher.name}` : ''}</span></span><Award className="size-5 text-flame-ink" /></Link>)}</div></Section>}
      {!!d.suggestions.length && <Section title="پیشنهاد برای تو" link="همهٔ مسیرها" to="/learn?tab=explore"><div className="grid gap-4 lg:grid-cols-3">{d.suggestions.map((p, i) => <PathCard key={p.id} p={p} i={i} />)}</div></Section>}
    </div>
  );
}

function MainIntro({ p, role }: { p: PathV2; role: ActorRole | null }) {
  return (
    <section className="hero-blue grid gap-5 rounded-[28px] p-6 text-white md:grid-cols-[1fr_auto] md:items-center md:p-8">
      <div className="grid gap-2">
        <span className="text-sm text-white/75">مسیر اصلی برای تو{role && role !== 'OTHER' ? ` (${ROLE_FA[role]})` : ''}</span>
        <b className="text-2xl font-extrabold !text-white md:text-3xl">{p.title}</b>
        <p className="max-w-xl text-white/85">{p.description}</p>
        <span className="text-sm text-white/75">{p.publisher?.name}، {fa(p.stepCount)} پله{p.hasRahyar ? '، با راهیار' : ''}. دوره‌های برگزارکنندگان دیگر هم داخل پله‌هایش هست.</span>
      </div>
      <Link to={`/paths/${p.slug}`} className="btn btn-lg w-fit !bg-white !text-deep">ببین چه دارد</Link>
    </section>
  );
}

function Main({ d, onExplore }: { d: NonNullable<ReturnType<typeof useLearning>['data']>; onExplore: () => void }) {
  if (!d.main) return <Empty icon={Compass} title="برای نقش «دیگر» مسیر اصلی نداریم">از کاوش شروع کن؛ هر وقت نقش‌ت را در تنظیمات گفتی، مسیر اصلی پیشنهاد می‌شود.<div className="mt-3"><button className="btn btn-primary" onClick={onExplore}>کاوش</button></div></Empty>;
  return <PathBody p={d.main} />;
}

/* ───────── کاوش ───────── */
const SIZES: [PathSize | 'all', string][] = [['all', 'همه'], ['micro', 'مسیر خرد'], ['mid', 'مسیر میانه'], ['macro', 'مسیر کلان']];
const WHO: [ActorRole | 'all', string][] = [['all', 'همه'], ['IMAM', 'امام'], ['SHARIK', 'شریکة‌الامام'], ['BAZU', 'بازو'], ['HASTEH', 'عضو هسته']];
type Kind = 'all' | PathSize | 'course' | 'live';

function Explore({ role }: { role: ActorRole | null }) {
  const [who, setWho] = useState<ActorRole | 'all'>(role && role !== 'OTHER' ? role : 'all');
  const [kind, setKind] = useState<Kind>('all');
  const [pubId, setPub] = useState('all');
  const [q, setQ] = useState('');
  const paths = usePaths2();
  const pubs = useQuery({ queryKey: ['v2', 'publishers'], queryFn: () => api<Pub[]>('/v2/publishers') });
  const courses = useQuery({ queryKey: ['catalog'], queryFn: () => api<C[]>('/courses'), enabled: kind === 'all' || kind === 'course' });
  const events = useQuery({ queryKey: ['events', 'upcoming'], queryFn: () => api<EventCard[]>('/events?scope=upcoming'), enabled: kind === 'all' || kind === 'live' });
  const list = useMemo(() => (paths.data ?? []).filter((p) => (who === 'all' || p.audience.includes(who)) && (kind === 'all' || p.size === kind) && (pubId === 'all' || p.publisher?.id === pubId) && (!q.trim() || (p.title + (p.description ?? '')).includes(q.trim()))), [paths.data, who, kind, pubId, q]);
  const cl = useMemo(() => (courses.data ?? []).filter((c) => (!q.trim() || c.title.includes(q.trim()))), [courses.data, q]);
  const live = useMemo(() => (events.data ?? []).filter((e) => e.kind === 'ONLINE' && (!q.trim() || e.title.includes(q.trim()))), [events.data, q]);
  if (paths.isLoading) return <Spinner />;
  const Chip = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => <button type="button" aria-pressed={on} onClick={onClick} className={`h-9 rounded-full border px-3.5 text-[13px] font-bold transition-colors ${on ? 'border-deep bg-deep-soft text-deep' : 'border-line bg-card text-body hover:border-line-strong'}`}>{children}</button>;
  return (
    <div className="grid gap-8">
      <div className="grid gap-3">
        <div className="relative max-w-md"><Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted" /><input className="input pe-9" type="search" placeholder="نوجوان، حل مسئله، حلقه…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="جست‌وجو" /></div>
        <div className="flex flex-wrap items-center gap-2"><span className="w-16 text-[13px] font-bold text-muted">برای کی</span>{WHO.map(([k, t]) => <Chip key={k} on={who === k} onClick={() => setWho(k)}>{t}</Chip>)}</div>
        <div className="flex flex-wrap items-center gap-2"><span className="w-16 text-[13px] font-bold text-muted">نوع</span>{SIZES.map(([k, t]) => <Chip key={k} on={kind === k} onClick={() => setKind(k)}>{t}</Chip>)}<Chip on={kind === 'course'} onClick={() => setKind('course')}>دوره</Chip><Chip on={kind === 'live'} onClick={() => setKind('live')}>پخش زنده</Chip></div>
        <div className="flex flex-wrap items-center gap-2"><span className="w-16 text-[13px] font-bold text-muted">برگزارکننده</span><Chip on={pubId === 'all'} onClick={() => setPub('all')}>همه</Chip>{(pubs.data ?? []).map((p) => <Chip key={p.id} on={pubId === p.id} onClick={() => setPub(p.id)}><span className="me-1.5 inline-block size-2 rounded-full align-middle" style={{ background: p.color }} />{p.name}</Chip>)}</div>
      </div>
      {kind !== 'course' && kind !== 'live' && (list.length ? <div className="stagger grid gap-4 md:grid-cols-2 xl:grid-cols-3">{list.map((p, i) => <PathCard key={p.id} p={p} i={i} />)}</div>
        : <Empty icon={Route} title="مسیری با این فیلتر نیست">فیلتر را بردار یا «همه» را ببین.</Empty>)}
      {(kind === 'all' || kind === 'course') && pubId === 'all' && who === 'all' && !!cl.length && <Section title="دوره‌ها (خودآموز، جدا از مسیر)"><div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cl.slice(0, kind === 'course' ? 60 : 6).map((c) => <CourseCard key={c.id} c={c} />)}</div></Section>}
      {(kind === 'all' || kind === 'live') && !!live.length && <Section title="پخش‌های زندهٔ پیش رو" link="همهٔ برنامه‌ها" to="/events"><div className="grid gap-3 lg:grid-cols-2">{live.map((e) => <Link key={e.id} to={`/events/${e.id}`} className="card is-link flex items-center gap-4 p-4 no-underline"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-rose-soft text-rose-ink"><Radio className="size-5" /></span><span className="min-w-0 flex-1"><b className="block truncate text-ink">{e.title}</b><span className="text-sm text-muted">{jDate(e.startsAt)}{e.hostName ? `، ${e.hostName}` : ''}{e.record ? '، ضبط می‌شود' : ''}</span></span>{e.my ? <span className="chip chip-leaf">یادآوری فعال</span> : <span className="text-sm font-bold text-deep">یادم بیاور</span>}</Link>)}</div></Section>}
    </div>
  );
}

/* ───────── صفحهٔ مسیر ───────── */
export function PathPage() {
  const { slug = '' } = useParams();
  const q = useQuery({ queryKey: ['v2', 'path', slug], queryFn: () => api<PathV2>(`/v2/paths/${slug}`) });
  if (q.isLoading) return <Spinner />;
  if (q.error || !q.data) return <Empty icon={Route} title="این مسیر پیدا نشد"><Link to="/learn" className="font-bold text-leaf-ink">بازگشت به یادگیری</Link></Empty>;
  return (
    <div className="grid gap-8">
      <nav className="text-sm text-muted" aria-label="مسیر صفحه"><Link to="/learn" className="text-leaf-ink">یادگیری</Link> / {q.data.sizeFa}</nav>
      <PathBody p={q.data} />
    </div>
  );
}

function PathBody({ p }: { p: PathV2 }) {
  const qc = useQueryClient();
  const toast = useToast();
  const nav = useNavigate();
  const { me } = useAuth();
  const inval = () => { qc.invalidateQueries({ queryKey: ['v2'] }); };
  const enroll = useMutation({ mutationFn: () => api(`/v2/paths/${p.slug}/enroll`, { method: 'POST', body: {} }), onSuccess: () => { inval(); toast('برداشتی. اولین قدم آماده است.'); } });
  const leave = useMutation({ mutationFn: () => api(`/v2/paths/${p.slug}/leave`, { method: 'POST', body: {} }), onSuccess: () => { inval(); toast('مسیر را کنار گذاشتی؛ پیشرفتت می‌ماند.'); nav('/learn'); } });
  const cur = p.steps[p.currentStep];
  const nextItem = cur?.items.find((x) => !x.done && !x.optional);
  const team = me?.cores?.find((c) => c.isLeader);
  return (
    <div className="grid gap-8">
      <section className="card grid gap-6 overflow-hidden p-6 md:grid-cols-[1.3fr_1fr] md:p-8" style={{ borderTop: `8px solid ${p.color}` }}>
        <div className="grid content-start gap-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1"><SizeMark p={p} /><PubName pub={p.publisher} />{p.isMain && <span className="chip chip-dome">مسیر اصلی تو</span>}{!!p.audience.length && <span className="text-[13px] text-muted">برای {p.audience.map((r) => ROLE_FA[r]).join('، ')}</span>}</div>
          <h1 className="text-[clamp(26px,3.4vw,36px)] font-extrabold">{p.title}</h1>
          {p.description && <p className="max-w-2xl text-body leading-8">{p.description}</p>}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {!p.me.enrolled ? <button className="btn btn-primary btn-lg" disabled={enroll.isPending} onClick={() => enroll.mutate()}>مسیر را بردار</button>
              : nextItem ? <Link to={nextItem.to} className="btn btn-primary btn-lg">{nextItem.started ? 'ادامه بده' : 'شروع کن'}: {nextItem.title}</Link>
              : <Link to="/me" className="btn btn-primary btn-lg">تمام شد؛ کارنامه</Link>}
            {team && <Link to={`/cores/${team.id}`} className="btn btn-secondary"><Users className="size-4" />با تیم بخوان</Link>}
            <span className="text-sm text-muted">{fa(p.enrolledCount)} کنشگر این مسیر را برداشته‌اند</span>
          </div>
        </div>
        <div className="grid content-start gap-3 rounded-2xl bg-sunken p-4">
          {p.me.enrolled ? (
            <>
              <div className="flex items-center gap-1.5">{p.steps.map((s, k) => <Toranj key={s.id} state={s.done ? 'done' : k === p.currentStep ? 'now' : 'todo'} color={p.color} size={16} />)}</div>
              <b className="text-ink">{pathStateText(p)}</b>
              <span className="text-sm text-body">{fa(p.growthSteps)} گام رشد تأییدشده در این مسیر</span>
            </>
          ) : <b className="text-ink">{fa(p.stepCount)} {p.size === 'micro' ? 'هفته' : p.size === 'macro' ? 'پله' : 'بخش'}</b>}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="rounded-xl bg-card p-3"><span className="text-xs text-muted">راهیار</span><b className="block text-sm text-ink">{p.hasRahyar ? (p.rahyar?.name ?? 'به‌زودی تعیین می‌شود') : 'ندارد؛ خودآموز'}</b></div>
            <div className="rounded-xl bg-card p-3"><span className="text-xs text-muted">گعدهٔ بعدی</span><b className="block text-sm text-ink">{p.gaade ? `${jShort(p.gaade.at)}، ${p.gaade.where}` : 'گذاشته نشده'}</b></div>
          </div>
          {p.hasRahyar && p.rahyar && <Link to="/messages" className="btn btn-ghost btn-sm w-fit"><MessageCircle className="size-4" />پیام به راهیار</Link>}
        </div>
      </section>
      <Section title={p.size === 'micro' ? `${fa(p.stepCount)} هفته` : p.size === 'macro' ? 'پله‌ها' : 'دوره‌های این مسیر'}><Steps p={p} /></Section>
      {p.id === 'pt-taayon' && p.me.enrolled && <ImamatCard />}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="card grid gap-2 p-5"><b className="text-ink">چه چیزی گام رشد می‌شود</b><p className="text-sm text-body leading-7">{p.hasRahyar ? 'هر تکلیف یک کار واقعی در مسجد است. روایتش را می‌نویسی؛ راهیار می‌خواند و یا تأیید می‌کند یا یک نکته برمی‌گرداند. ' : 'تمام کردن هر دوره و آزمونش. '}{p.steps.some((s) => s.rule) ? `برای رفتن به ${p.size === 'micro' ? 'هفتهٔ' : 'پلهٔ'} بعد: ${cur?.rule ?? p.steps[0].rule}.` : ''}</p></div>
        <div className="card grid gap-2 p-5"><b className="text-ink">در این مسیر از دیگران هم هست</b>{(() => { const others = p.steps.flatMap((s) => s.items).filter((it) => it.publisher && it.publisher.id !== p.publisher?.id); return others.length ? <ul className="grid gap-1 text-sm text-body">{others.map((it) => <li key={it.kind + it.id}>{it.title} <span className="text-muted">از {it.publisher!.name}</span></li>)}</ul> : <p className="text-sm text-muted">همهٔ محتوا از {p.publisher?.name} است.</p>; })()}</div>
      </section>
      {p.me.enrolled && p.percent < 100 && <button className="btn btn-ghost btn-sm w-fit text-rose" onClick={() => { if (confirm('مسیر را کنار بگذاری؟ پیشرفتت می‌ماند.')) leave.mutate(); }}>کنار گذاشتن مسیر</button>}
    </div>
  );
}

/* ───────── آزمون جامع مسیر (مسیرهای میانهٔ قدیمی) ───────── */
interface PathExamData {
  path: { slug: string; title: string }; passScore: number; locked: boolean; waitingFor: string[]; intro: string | null;
  questions: { id: string; kind: 'single' | 'multi' | 'tf'; text: string; options: { id: string; text: string }[] }[];
  attempts: { score: number; passed: boolean; at: string }[]; nextAllowedAt: string | null; certificate: { code: string; score: number | null } | null;
}
export function PathExam() {
  const { slug = '' } = useParams();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['path-exam', slug], queryFn: () => api<PathExamData>(`/paths/${slug}/exam`) });
  const [ans, setAns] = useState<Record<string, string[]>>({});
  const [res, setRes] = useState<{ score: number; passed: boolean; results: { id: string; ok: boolean; correct: string[]; explain: string }[]; certificate: { code: string } | null } | null>(null);
  const [err, setErr] = useState('');
  const submit = useMutation({
    mutationFn: () => api<typeof res>(`/paths/${slug}/exam`, { body: { answers: ans } }),
    onSuccess: (r) => { setRes(r); qc.invalidateQueries({ queryKey: ['path-exam', slug] }); qc.invalidateQueries({ queryKey: ['certs'] }); window.scrollTo({ top: 0, behavior: 'smooth' }); },
    onError: (e) => setErr((e as Error).message),
  });
  if (q.isLoading) return <Spinner />;
  if (q.error) return <Empty icon={Route} title={(q.error as Error).message} />;
  const e = q.data!;
  const pick = (qq: PathExamData['questions'][number], o: string) => setAns((a) => ({ ...a, [qq.id]: qq.kind === 'multi' ? (a[qq.id]?.includes(o) ? a[qq.id].filter((x) => x !== o) : [...(a[qq.id] ?? []), o]) : [o] }));
  const answered = e.questions.every((qq) => ans[qq.id]?.length);
  return (
    <div className="rise mx-auto grid max-w-3xl gap-6">
      <nav className="text-sm text-muted"><Link to={`/paths/${slug}`} className="text-leaf-ink">{e.path.title}</Link> / آزمون جامع</nav>
      <h1 className="text-[clamp(22px,3vw,30px)] font-extrabold">آزمون جامع مسیر «{e.path.title}»</h1>
      <p className="hint">این آزمون فقط دانش را می‌سنجد؛ گام رشد از روایت می‌آید.</p>
      {e.certificate && <div className="card flex flex-wrap items-center gap-3 p-4"><Award className="size-8 text-flame-ink" /><span className="flex-1">گواهی مسیر را گرفته‌ای{e.certificate.score != null ? ` (نمره ٪${fa(e.certificate.score)})` : ''}.</span><Link className="btn btn-secondary btn-sm" to={`/verify/${e.certificate.code}`}>دیدن گواهی</Link></div>}
      {e.locked ? (
        <div className="card grid gap-2 p-5"><b className="text-ink">آزمون هنوز باز نیست</b><p className="text-body">اول این دوره‌ها را تمام کن:</p><ul className="list-inside list-disc text-body">{e.waitingFor.map((w) => <li key={w}>{w}</li>)}</ul></div>
      ) : res ? (
        <div className={`card grid gap-3 p-5 ${res.passed ? 'border-leaf' : ''}`}>
          <b className="text-xl text-ink">{res.passed ? 'قبول شدی' : 'این بار نشد'}، نمرهٔ ٪{fa(res.score)}</b>
          <p className="text-body">{res.passed ? (res.certificate ? 'گواهی مسیر صادر شد و در کارنامه است.' : '') : `برای قبولی ٪${fa(e.passScore)} لازم است. پاسخ‌ها را مرور کن و دوباره بیا.`}</p>
          <ol className="grid gap-2">{e.questions.map((qq, i) => { const r = res.results.find((x) => x.id === qq.id); return <li key={qq.id} className={`rounded-xl p-3 text-sm ${r?.ok ? 'bg-leaf-soft' : 'bg-rose-soft'}`}><b>{fa(i + 1)}. {qq.text}</b>{r?.explain && <p className="mt-1">{r.explain}</p>}</li>; })}</ol>
          <div className="flex gap-2">{res.certificate && <Link className="btn btn-primary" to={`/verify/${res.certificate.code}`}>دیدن گواهی</Link>}{!res.passed && <button className="btn btn-secondary" onClick={() => { setRes(null); setAns({}); }}>تلاش دوباره</button>}</div>
        </div>
      ) : (
        <>
          {e.intro && <p className="prose-fa">{e.intro}</p>}
          {e.nextAllowedAt ? <p className="rounded-xl bg-flame-soft p-3 text-ink">تلاش بعدی از {jDate(e.nextAllowedAt)} ممکن است.</p> : (
            <>
              <ol className="grid gap-4">{e.questions.map((qq, i) => (
                <li key={qq.id} className="card p-5"><p className="font-bold text-ink"><span className="text-muted">{fa(i + 1)}. </span>{qq.text}</p>
                  <div className="mt-3 grid gap-2">{qq.options.map((o) => { const sel = ans[qq.id]?.includes(o.id); return (
                    <button key={o.id} type="button" onClick={() => pick(qq, o.id)} aria-pressed={!!sel} className={`opt rounded-xl border px-4 py-3 text-start ${sel ? 'border-leaf bg-leaf-soft' : 'border-line hover:border-line-strong'}`}>{o.text}</button>); })}</div></li>
              ))}</ol>
              <div className="flex items-center gap-3"><button className="btn btn-primary btn-lg" disabled={!answered || submit.isPending} onClick={() => { setErr(''); submit.mutate(); }}>ثبت پاسخ‌ها</button>{err && <span className="err">{err}</span>}</div>
            </>
          )}
        </>
      )}
    </div>
  );
}
