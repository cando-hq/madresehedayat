/*
 * میدان: هر کاری که در مسجد انجام می‌شود. اول تکلیف‌ها و روایت‌ها (چهار وضعیت)، بعد درهای برنامه‌ها، پویش‌ها و جعبه‌ابزار.
 */
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, ChevronLeft, ClipboardCheck, Flag, Wrench } from 'lucide-react';
import { Link } from 'react-router';
import { Section, Toranj } from '../components/Path2';
import { Empty, ErrorBox, Spinner } from '../components/ui';
import { api } from '../lib/api';
import { fa, jShort } from '../lib/fa';
import type { EventCard, FieldTask, TaskStatus } from '../lib/types';
import { CampaignCard, useCampaigns } from './Campaigns';
import { EventRow } from './Events';

const ST: Record<TaskStatus, { label: string; chip: string; cta: string; btn: string }> = {
  need: { label: 'منتظر روایت تو', chip: 'chip-flame', cta: 'روایت بنویس', btn: 'btn-primary' },
  back: { label: 'برگشته با نکته', chip: 'chip-rose', cta: 'اصلاح کن و بفرست', btn: 'btn-primary' },
  wait: { label: 'منتظر راهیار', chip: 'chip-dome', cta: 'روایت را ببین', btn: 'btn-secondary' },
  open: { label: 'باز', chip: '', cta: 'درس را ببین', btn: 'btn-secondary' },
  done: { label: 'گام رشد', chip: 'chip-leaf', cta: 'ببین', btn: 'btn-ghost' },
};

export default function Field() {
  const q = useQuery({ queryKey: ['v2', 'field'], queryFn: () => api<{ tasks: FieldTask[]; counts: Record<TaskStatus, number> }>('/v2/field') });
  const events = useQuery({ queryKey: ['events', 'upcoming'], queryFn: () => api<EventCard[]>('/events?scope=upcoming') });
  const camps = useCampaigns();
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  const { tasks, counts } = q.data!;
  const open = tasks.filter((t) => t.status !== 'done');
  const done = tasks.filter((t) => t.status === 'done');
  const live = (camps.data ?? []).filter((c) => c.phase === 'ACTIVE' || c.phase === 'UPCOMING').slice(0, 2);
  return (
    <div className="grid gap-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-[clamp(24px,3vw,32px)] font-extrabold">میدان</h1><p className="mt-1 max-w-xl text-muted">کارهای واقعی در مسجد و وضعیت هر روایت. هر چه این‌جا بسته شود، یک گام رشد است.</p></div>
        <div className="flex flex-wrap gap-2">{counts.need > 0 && <span className="chip chip-flame">{fa(counts.need)} منتظر روایت تو</span>}{counts.back > 0 && <span className="chip chip-rose">{fa(counts.back)} برگشته</span>}{counts.wait > 0 && <span className="chip chip-dome">{fa(counts.wait)} منتظر راهیار</span>}</div>
      </header>

      {open.length ? (
        <div className="stagger grid gap-4 lg:grid-cols-2">
          {open.map((t, i) => { const s = ST[t.status]; return (
            <article key={t.lessonId} className="card grid gap-3 p-5" style={{ ['--i' as string]: i, borderInlineStartWidth: 6, borderInlineStartColor: t.path?.color ?? 'var(--line)' }}>
              <div className="flex items-center justify-between gap-3"><span className="truncate text-[13px] text-muted">{t.path ? `${t.path.title}، ` : ''}{t.course.title}</span><span className={`chip ${s.chip}`}>{s.label}</span></div>
              <b className="text-lg font-extrabold leading-snug text-ink">{t.title}</b>
              {t.status === 'back' && t.note ? <p className="rounded-xl bg-rose-soft p-3 text-sm text-body"><b>راهیار:</b> {t.note}</p>
                : t.status === 'wait' ? <p className="text-sm text-body">روایتت رسیده{t.submittedAt ? ` (${jShort(t.submittedAt)})` : ''}. راهیار تا سه روز پاسخ می‌دهد.</p>
                : t.status === 'need' ? <p className="text-sm text-body">سه خط کافی است: چه کردی، چه شد، چه فهمیدی.</p>
                : t.goal ? <p className="text-sm text-body">{t.goal}</p> : null}
              <Link to={t.to} className={`btn ${s.btn} w-fit`}>{s.cta}<ChevronLeft className="size-4" /></Link>
            </article>); })}
        </div>
      ) : <Empty icon={ClipboardCheck} title="تکلیف بازی نداری">تکلیف‌ها از درس‌های مسیرهایت می‌آیند. <Link to="/learn" className="font-bold text-leaf-ink">یک درس بعدی بردار</Link>.</Empty>}

      <section className="grid gap-3 sm:grid-cols-3" aria-label="درهای میدان">
        {[{ to: '/events', icon: CalendarDays, t: 'برنامه‌ها', d: `${fa(events.data?.length ?? 0)} برنامهٔ پیش رو` }, { to: '/campaigns', icon: Flag, t: 'پویش‌ها', d: live.length ? `${fa(live.length)} پویش فعال` : 'پویش فعالی نیست' }, { to: '/tools', icon: Wrench, t: 'جعبه‌ابزار', d: 'کاربرگ، تخته، ابزارهای درس' }].map((x) => (
          <Link key={x.to} to={x.to} className="card is-link flex items-center gap-3 p-4 no-underline"><span className="grid size-11 place-items-center rounded-2xl bg-deep-soft text-deep"><x.icon className="size-5" /></span><span className="flex-1"><b className="block text-ink">{x.t}</b><span className="text-sm text-muted">{x.d}</span></span><ChevronLeft className="size-4 text-muted" /></Link>
        ))}
      </section>

      {(live.length > 0 || (events.data?.length ?? 0) > 0) && (
        <Section title="این هفته در محله"><div className="grid gap-3 lg:grid-cols-2">{live.map((c) => <CampaignCard key={c.id} c={c} />)}{(events.data ?? []).slice(0, 2).map((e) => <EventRow key={e.id} e={e} />)}</div></Section>
      )}

      {!!done.length && (
        <Section title="روایت‌های بسته‌شده" link="کارنامه" to="/me">
          <div className="card divide-y divide-line">{done.map((t) => <Link key={t.lessonId} to={t.to} className="flex items-center gap-3 px-4 py-3 no-underline"><Toranj state="done" color={t.path?.color ?? 'var(--leaf)'} size={16} /><span className="flex-1"><b className="block text-ink">{t.title}</b><span className="text-sm text-muted">{t.path?.title ?? t.course.title}{t.reviewedAt ? `، تأیید ${jShort(t.reviewedAt)}` : ''}</span></span><span className="text-sm font-bold text-leaf-ink">گام رشد</span></Link>)}</div>
        </Section>
      )}
    </div>
  );
}
