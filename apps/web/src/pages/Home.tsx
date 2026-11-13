/*
 * خانهٔ کنشگر: «بعدی برای تو» (یک کار، نه ده کارت)، این هفته (گعده، پخش زنده، تیم، برنامه)، مسیرهای من.
 * قدم بعدی را سرور با قاعده‌های روشن می‌دهد: روایت برگشته → روایت منتظر → درس بعدی پلهٔ جاری → برداشتن مسیر اصلی.
 */
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, MessageCircle, Play, Radio, Users } from 'lucide-react';
import { Link } from 'react-router';
import { PathCard, Section, useLearning } from '../components/Path2';
import { ErrorBox, Spinner } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { jShort } from '../lib/fa';
import { useReviews } from '../lib/growth';
import type { EventCard } from '../lib/types';
import { PeersCard } from './Peers';

function greet() {
  const h = new Date().getHours();
  return h < 5 ? 'شب بخیر' : h < 12 ? 'صبح بخیر' : h < 17 ? 'ظهر بخیر' : 'عصر بخیر';
}
const when = (iso: string) => { const d = new Date(iso); const day = new Intl.DateTimeFormat('fa-IR', { weekday: 'long' }).format(d); const t = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(d); return `${day} ${t}`; };

export default function Home() {
  const { me } = useAuth();
  const L = useLearning();
  const events = useQuery({ queryKey: ['events', 'upcoming'], queryFn: () => api<EventCard[]>('/events?scope=upcoming') });
  const reviews = useReviews();
  if (L.isLoading) return <Spinner />;
  if (L.error) return <ErrorBox error={L.error} onRetry={() => L.refetch()} />;
  const d = L.data!;
  const due = reviews.data?.due[0];
  const step = due ? { kicker: 'وقت مرور، دو دقیقه', title: due.course.title, cta: 'شروع مرور', to: `/review/${due.id}`, color: d.next.color } : d.next;
  const live = (events.data ?? []).filter((e) => e.kind === 'ONLINE' && e.status === 'PUBLISHED');
  const liveNow = live.find((e) => e.my?.status === 'REGISTERED' && new Date(e.startsAt).getTime() - 15 * 60_000 <= Date.now() && Date.now() <= new Date(e.endsAt).getTime());
  const team = me?.cores?.[0];
  const week: { k: string; t: string; sub: string; to: string; color: string; icon: typeof Users }[] = [];
  if (d.gaade) week.push({ k: 'گعده', t: d.gaade.topic || d.gaade.title, sub: `${when(d.gaade.at)}، ${d.gaade.where}`, to: `/gaade/${d.gaade.id}`, color: 'var(--flame)', icon: Users });
  for (const e of live.slice(0, 1)) week.push({ k: 'پخش زنده', t: e.title, sub: `${when(e.startsAt)}${e.my ? '، یادآوری فعال' : ''}`, to: `/events/${e.id}`, color: 'var(--rose)', icon: Radio });
  if (team) week.push({ k: 'تیم من', t: team.name, sub: team.isLeader ? 'تو مسئول تیمی' : 'عضو', to: `/cores/${team.id}`, color: 'var(--leaf)', icon: Users });
  const inPerson = (events.data ?? []).find((e) => e.kind === 'IN_PERSON');
  if (inPerson && week.length < 3) week.push({ k: 'برنامه', t: inPerson.title, sub: `${jShort(inPerson.startsAt)}${inPerson.location ? `، ${inPerson.location}` : ''}`, to: `/events/${inPerson.id}`, color: 'var(--deep)', icon: Radio });
  const mine = [...d.mine].sort((a, b) => (a.isMain ? -1 : b.isMain ? 1 : 0)).filter((p) => p.percent < 100).slice(0, 3);
  return (
    <div className="grid gap-10">
      {liveNow && (
        <Link to={`/events/${liveNow.id}`} className="live-strip flex items-center gap-3 rounded-2xl bg-[#262A4F] px-4 py-3 text-white no-underline">
          <span className="chip chip-live !text-flame">{new Date(liveNow.startsAt) <= new Date() ? 'زنده' : 'به‌زودی'}</span>
          <b className="min-w-0 flex-1 truncate">{liveNow.title}</b>
          <span className="flex items-center gap-1.5 text-sm font-bold text-flame"><Radio className="size-4" />ورود</span>
        </Link>
      )}

      <section className="hero-blue grid overflow-hidden rounded-[32px] md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]" aria-labelledby="hi-h">
        <div className="grid content-center gap-5 p-6 md:p-10">
          <h1 id="hi-h" className="text-[clamp(26px,3.4vw,40px)] font-extrabold !text-white">{greet()}، {me?.firstName}</h1>
          <div className="grid max-w-[540px] gap-3 rounded-[22px] bg-card p-5 text-body">
            <div className="flex items-center justify-between gap-2 text-sm"><b style={{ color: step.color }}>{step.kicker}</b><span className="text-muted">بعدی برای تو</span></div>
            <b className="text-xl font-extrabold leading-relaxed text-ink">{step.title}</b>
            {'pct' in step && step.pct != null && step.pct > 0 && <div className="bar"><span style={{ width: `${step.pct}%`, background: step.color }} /></div>}
            <Link className="btn btn-primary btn-lg w-fit" to={step.to}>{d.next.kind === 'lesson' ? <Play className="size-5" /> : null}{step.cta}<ChevronLeft className="size-5" /></Link>
          </div>
          {d.main && <span className="text-sm text-white/75">مسیر اصلی تو: {d.main.title}{d.main.rahyar ? `، با ${d.main.rahyar.name}` : ''}</span>}
        </div>
        <img src={`${import.meta.env.BASE_URL}brand/poster.jpg`} alt="گنبد مسجد با ترنج‌هایی از عرصه‌های زندگی و کبوترها در غروب" className="h-full max-h-[420px] min-h-[220px] w-full object-cover" style={{ objectPosition: '50% 38%' }} />
      </section>

      {!!week.length && (
        <Section title="این هفته">
          <div className="grid gap-3 md:grid-cols-3">
            {week.map((w) => <Link key={w.k + w.t} to={w.to} className="card is-link flex items-center gap-3 p-4 no-underline" style={{ borderInlineStartWidth: 6, borderInlineStartColor: w.color }}><span className="min-w-0 flex-1"><span className="block text-[12px] font-bold text-muted">{w.k}</span><b className="block truncate text-ink">{w.t}</b><span className="block truncate text-sm text-muted">{w.sub}</span></span><ChevronLeft className="size-4 shrink-0 text-muted" /></Link>)}
          </div>
        </Section>
      )}

      <Section title="مسیرهای من" link={d.mine.length ? 'همه' : 'کاوش'} to={d.mine.length ? '/learn' : '/learn?tab=explore'}>
        {mine.length ? <div className="stagger grid gap-4 lg:grid-cols-3">{mine.map((p, i) => <PathCard key={p.id} p={p} i={i} />)}</div>
          : <div className="rounded-2xl bg-sunken p-5 text-body">هنوز مسیری برنداشته‌ای. {d.main ? <Link to={`/paths/${d.main.slug}`} className="font-bold text-leaf-ink">مسیر اصلی‌ات را ببین</Link> : <Link to="/learn?tab=explore" className="font-bold text-leaf-ink">یک مسیر خرد بردار</Link>}.</div>}
      </Section>

      <section className="grid gap-4 lg:grid-cols-2" aria-label="همتایان و راهیار">
        <PeersCard />
        {d.main?.rahyar && (
          <div className="card flex items-center gap-4 p-5"><span className="grid size-14 shrink-0 place-items-center rounded-full bg-dome-soft text-xl font-extrabold text-dome-ink">{d.main.rahyar.name[0]}</span><span className="min-w-0 flex-1"><b className="block text-ink">{d.main.rahyar.name}</b><span className="text-sm text-muted">راهیار مسیر «{d.main.title}»</span></span><Link to="/messages" className="btn btn-secondary btn-sm"><MessageCircle className="size-4" />پیام</Link></div>
        )}
      </section>
    </div>
  );
}
