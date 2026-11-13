/*
 * راهبردهای یادگیری در رابط: رشد بی‌رقابت، ریتم هفتگی، مرور با فاصله، تسلط بر مهارت،
 * دورهٔ گروهی هم‌زمان، داستان میدان و پرسش کوتاه وسط درس.
 * اصل مشترک: هیچ‌جا کنشگر با دیگری مقایسه نمی‌شود و هیچ‌جا جریمه نیست.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookCheck, CalendarCheck, Check, ChevronLeft, CircleCheck, Clock, Flag, Leaf, Quote, RotateCcw, Sparkles, Sprout, Target, TreeDeciduous, Users, XCircle } from 'lucide-react';
import { CountUp } from './Path';
import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { api, ApiError } from '../lib/api';
import { fa, jShort } from '../lib/fa';
import type { Cohort, Growth, Rhythm, Skill, Story } from '../lib/growth';
import { useMyCohorts, useReviews, useRhythm, useStories } from '../lib/growth';
import type { PathCard } from '../lib/types';
import { JalaliInput } from './JalaliInput';
import { Dialog, InlineSpinner, useToast } from './ui';

/* ───────── مراحل رشد ───────── */

const SeedIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <path d="M12 20c-3.6 0-6-2.4-6-5.6C6 10.6 9 7 12 4c3 3 6 6.6 6 10.4 0 3.2-2.4 5.6-6 5.6Z" /><path d="M12 20v-6" />
  </svg>
);
const STAGE_ICON = [SeedIcon, Sprout, Leaf, TreeDeciduous];

/** مسیر رشد: دانه ← جوانه ← نهال ← درخت. فقط با کار خود کنشگر جلو می‌رود. */
export function StageTrack({ g, compact }: { g: Growth; compact?: boolean }) {
  const I = STAGE_ICON[g.index] ?? SeedIcon;
  if (compact) return (
    <Link to="/me" className="stage-chip no-underline" title="مرحلهٔ رشد شما"><span><I className="size-4" /></span>{g.stageTitle}</Link>
  );
  const left = g.next ? [g.next.coursesLeft ? `${fa(g.next.coursesLeft)} دوره` : '', g.next.missionsLeft ? `${fa(g.next.missionsLeft)} مأموریت` : ''].filter(Boolean).join(' + ') : '';
  return (
    <section className="growth-card card overflow-hidden" aria-labelledby="stage-h">
      <div className="growth-hero relative grid justify-items-center gap-2 px-6 pb-6 pt-8 text-center">
        <img src={`${import.meta.env.BASE_URL}brand/mark.svg`} alt="" aria-hidden="true" className="growth-mark" />
        <span className="growth-icon grid size-20 place-items-center rounded-full"><I className="size-10" /></span>
        <span className="text-[13px] font-bold text-leaf-ink">مرحلهٔ رشد</span>
        <h2 id="stage-h" className="text-2xl font-extrabold">{g.stageTitle}</h2>
        {g.next && <span className="chip chip-leaf">تا {g.next.title}: {left}</span>}
      </div>
      <ol className="stage-track grid grid-cols-4 gap-2 px-5 py-5" aria-label="مراحل رشد">
        {g.stages.map((st, i) => {
          const SI = STAGE_ICON[i] ?? SeedIcon;
          const state = i < g.index ? 'done' : i === g.index ? 'now' : 'later';
          return (
            <li key={st.key} className={`stage stage-${state} grid justify-items-center gap-1.5 text-center`} style={{ '--i': i } as CSSProperties} aria-current={state === 'now' ? 'step' : undefined}>
              <span className="stage-dot grid size-10 place-items-center rounded-full"><SI className="size-5" /></span>
              <b className="text-[13px]">{st.title}</b>
            </li>
          );
        })}
      </ol>
      <dl className="grid grid-cols-3 border-t border-line">
        {([['دوره', g.coursesDone, BookCheck], ['مأموریت', g.missionsDone, Flag], ['مهارت', g.skills.mastered, Sparkles]] as const).map(([k, v, Ic]) => (
          <div key={k} className="grid justify-items-center gap-0.5 border-line py-4 [&:not(:last-child)]:border-e">
            <Ic className="size-5 text-muted" /><dd className="tnum text-2xl font-extrabold text-ink"><CountUp value={v} /></dd><dt className="text-xs text-muted">{k}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ───────── ریتم هفتگی ───────── */

const DAY_FA = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
const DAY_FULL = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];

export function RhythmCard({ r }: { r?: Rhythm }) {
  const q = useRhythm();
  const d = r ?? q.data;
  const [open, setOpen] = useState(false);
  if (!d) return <div className="card h-[196px] animate-pulse" aria-hidden="true" />;
  const met = d.goal != null && d.doneThisWeek >= d.goal;
  const pct = d.goal ? Math.min(100, Math.round((d.doneThisWeek / d.goal) * 100)) : 0;
  return (
    <section className={`widget card grid content-between gap-4 p-5 ${met ? 'is-met' : ''}`} aria-labelledby="rhythm-h">
      <div className="flex items-center gap-3">
        <span className="widget-icon bg-leaf-soft text-leaf-ink"><CalendarCheck className="size-5" /></span>
        <h2 id="rhythm-h" className="flex-1 text-[15px] font-extrabold">این هفته</h2>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setOpen(true)} aria-label={d.goal == null ? 'گذاشتن هدف هفتگی' : 'تغییر هدف هفتگی'} title="هدف هفتگی"><Target className="size-[18px]" /></button>
      </div>
      {d.goal == null ? (
        <button className="flex items-center gap-3 rounded-2xl border border-dashed border-line-strong p-3 text-start hover:bg-sunken" onClick={() => setOpen(true)}>
          <b className="tnum text-3xl font-extrabold text-ink">{fa(d.doneThisWeek)}</b>
          <span className="text-sm text-muted">درس<br /><span className="font-bold text-leaf-ink">+ هدف هفتگی</span></span>
        </button>
      ) : (
        <div className="flex items-end gap-2">
          <b className="tnum text-[40px] font-extrabold leading-none text-ink">{fa(d.doneThisWeek)}</b>
          <span className="pb-1 text-sm text-muted">از {fa(d.goal)} درس</span>
          {met && <span className="chip chip-leaf ms-auto"><Check className="size-3.5" strokeWidth={3} />کامل</span>}
        </div>
      )}
      {d.goal != null && <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="پیشرفت هدف هفته"><span style={{ width: `${pct}%` }} /></div>}
      <ol className="grid grid-cols-7 gap-1" aria-label="درس‌های تمام‌شده در روزهای این هفته">
        {d.days.map((n, i) => (
          <li key={i} className={`rday grid justify-items-center gap-1 ${i === d.today ? 'is-today' : ''} ${i > d.today ? 'is-ahead' : ''}`} title={`${DAY_FULL[i]}: ${n ? `${fa(n)} درس` : 'بی‌درس'}`}>
            <span className={`grid size-7 place-items-center rounded-full text-[11px] font-bold ${n ? 'bg-leaf text-on-action' : 'bg-sunken text-muted'}`}>{n > 1 ? fa(n) : n ? <Check className="size-3.5" strokeWidth={3} /> : ''}</span>
            <span className="text-[11px] text-muted">{DAY_FA[i]}</span>
          </li>
        ))}
      </ol>
      <GoalDialog open={open} onClose={() => setOpen(false)} current={d.goal} />
    </section>
  );
}

function GoalDialog({ open, onClose, current }: { open: boolean; onClose: () => void; current: number | null }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [v, setV] = useState<number | null>(current ?? 3);
  const save = useMutation({
    mutationFn: (n: number | null) => api<Rhythm>('/me/rhythm', { method: 'PUT', body: { lessonsPerWeek: n } }),
    onSuccess: (r, n) => { qc.setQueryData(['rhythm'], r); onClose(); toast(n == null ? 'هدف هفتگی برداشته شد' : `هدف شما: هفته‌ای ${fa(n)} درس`); },
  });
  const opts: [number, string][] = [[1, 'آرام'], [2, 'پیوسته'], [3, 'منظم'], [5, 'پرتلاش'], [7, 'هر روز']];
  return (
    <Dialog open={open} onClose={onClose} title="هدف هفتگی">
      <div className="grid gap-5">
        <p className="text-body">هفته از شنبه شروع می‌شود. هفته‌ای که نشد، جریمه ندارد.</p>
        <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="تعداد درس در هفته">
          {opts.map(([n, t]) => (
            <button key={n} type="button" role="radio" aria-checked={v === n} onClick={() => setV(n)}
              className={`opt grid justify-items-center gap-0.5 rounded-xl border px-2 py-3 ${v === n ? 'border-leaf bg-leaf-soft' : 'border-line hover:border-line-strong'}`}>
              <b className="tnum text-xl text-ink">{fa(n)}</b><span className="text-[11px] text-muted">{t}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn btn-primary" disabled={v == null || save.isPending} onClick={() => save.mutate(v)}>{save.isPending ? <InlineSpinner /> : null}ذخیرهٔ هدف</button>
          {current != null && <button className="btn btn-ghost" disabled={save.isPending} onClick={() => save.mutate(null)}>بدون هدف</button>}
        </div>
      </div>
    </Dialog>
  );
}

/** هشت هفتهٔ اخیر: هفته‌هایی که هدف کامل شد پررنگ‌اند؛ هفتهٔ خالی سرزنش ندارد */
export function RhythmHistory({ r }: { r: Rhythm }) {
  const max = Math.max(1, r.goal ?? 0, ...r.weeks.map((w) => w.count));
  const metCount = r.weeks.filter((w) => w.met).length;
  return (
    <section className="card grid gap-4 p-5" aria-labelledby="hist-h">
      <div>
        <h2 id="hist-h" className="flex items-center justify-between text-[15px] font-extrabold">هشت هفتهٔ اخیر{r.goal != null && metCount > 0 && <span className="chip chip-leaf">{fa(metCount)} هفته به هدف</span>}</h2>
      </div>
      <ol className="flex h-28 items-end gap-2" aria-label="درس‌های هر هفته">
        {r.weeks.map((w, i) => (
          <li key={w.weekStart} className="grid flex-1 justify-items-center gap-1" title={`هفتهٔ ${jShort(w.weekStart)}: ${fa(w.count)} درس`}>
            <span className={`rbar w-full max-w-7 rounded-t-md ${w.met ? 'bg-leaf' : w.count ? 'bg-leaf/40' : 'bg-line'}`} style={{ height: `${Math.max(6, (w.count / max) * 88)}px`, '--i': i } as CSSProperties} />
            <span className="tnum text-[11px] text-muted">{fa(w.count)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ───────── مرور با فاصله ───────── */

export function ReviewsCard() {
  const q = useReviews();
  if (!q.data || (!q.data.due.length && !q.data.next)) return null;
  const { due, next } = q.data;
  const first = due[0];
  return (
    <section className="widget card grid content-between gap-4 p-5" aria-labelledby="rev-h">
      <div className="flex items-center gap-3">
        <span className="widget-icon bg-dome-soft text-dome-ink"><RotateCcw className="size-5" /></span>
        <h2 id="rev-h" className="flex-1 text-[15px] font-extrabold">مرور</h2>
        {due.length > 0 && <span className="chip chip-dome tnum">{fa(due.length)} آماده</span>}
      </div>
      {first ? (
        <>
          <div><b className="line-clamp-2 text-lg font-extrabold leading-snug text-ink">{first.course.title}</b>
            <span className="mt-1 flex items-center gap-1.5 text-sm text-muted"><Clock className="size-3.5" />{fa(first.questionCount)} پرسش · ۲ دقیقه</span></div>
          <Link to={`/review/${first.id}`} className="btn btn-secondary btn-sm w-full">شروع مرور</Link>
        </>
      ) : next && (
        <div className="grid gap-1"><span className="text-sm text-muted">مرور بعدی · {jShort(next.dueAt)}</span><b className="line-clamp-2 font-extrabold text-ink">{next.course.title}</b></div>
      )}
    </section>
  );
}

/* ───────── مهارت‌ها و تسلط ───────── */

export function SkillList({ skills, title = 'مهارت‌ها', summary }: { skills: Skill[]; title?: string; hint?: string; summary?: string }) {
  if (!skills.length) return null;
  const n = skills.filter((s) => s.mastered).length;
  return (
    <section className="grid gap-4" aria-labelledby="skills-h">
      <div className="flex items-center justify-between gap-3">
        <h2 id="skills-h" className="text-lg font-extrabold">{title}</h2>
        <span className="chip chip-leaf tnum">{summary ?? `${fa(n)} از ${fa(skills.length)}`}</span>
      </div>
      <ul className="flex flex-wrap gap-2">
        {skills.map((s) => {
          const pct = s.lessonCount ? Math.round((s.doneCount / s.lessonCount) * 100) : 0;
          return (
            <li key={(s.course?.slug ?? '') + s.id} className={`skill-pill ${s.mastered ? 'is-mastered' : ''}`} style={{ '--p': `${pct}%` } as CSSProperties}
              title={`${s.title}${s.course ? ` — ${s.course.title}` : ''}: ${s.mastered ? 'بلدید' : `${fa(s.doneCount)} از ${fa(s.lessonCount)} درس`}`}>
              <span className="skill-dot">{s.mastered ? <Check className="size-3.5" strokeWidth={3} /> : null}</span>
              <span className="font-bold">{s.title}</span>
              {!s.mastered && s.lessonCount > 0 && <span className="tnum text-xs text-muted">{fa(s.doneCount)}/{fa(s.lessonCount)}</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ───────── داستان میدان ───────── */

export function Stories({ limit = 3 }: { limit?: number }) {
  const q = useStories();
  if (!q.data?.length) return null;
  return (
    <section aria-labelledby="stories-h">
      <h2 id="stories-h" className="mb-4 text-lg font-extrabold">داستان میدان</h2>
      <div className="story-row">{q.data.slice(0, limit).map((s, i) => <StoryCard key={i} s={s} i={i} />)}</div>
    </section>
  );
}
function StoryCard({ s, i }: { s: Story; i: number }) {
  return (
    <figure className={`story card grid content-between gap-5 p-6 story-${i % 3}`}>
      <Quote className="size-8 text-flame" aria-hidden="true" />
      <blockquote className="line-clamp-4 text-[17px] leading-8 text-ink">{s.text}</blockquote>
      <figcaption className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-flame-soft font-extrabold text-flame-ink">{s.authorLabel[0]}</span>
        <span className="min-w-0"><b className="block truncate text-sm text-ink">{s.authorLabel}</b><Link to={`/courses/${s.course.slug}`} className="block truncate text-xs text-muted">{s.course.title}</Link></span>
      </figcaption>
    </figure>
  );
}

/* ───────── دورهٔ گروهی هم‌زمان ───────── */

export const weekLabel = (c: Cohort) => {
  if (c.currentStation < 0) return `شروع: ${jShort(c.startsAt)}`;
  if (c.finished) return 'زمان‌بندی تمام شده';
  return `ایستگاه ${fa(c.currentStation + 1)} از ${fa(c.stations.length)}`;
};

export function useCohortAction(id: string) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (a: 'join' | 'leave' | 'cancel') => api(`/cohorts/${id}/${a}`, { method: 'POST' }),
    onSuccess: (_r, a) => {
      qc.invalidateQueries({ queryKey: ['cohorts'] });
      toast(a === 'join' ? 'همراه شدید؛ هر ایستگاه که باز شود خبرتان می‌کنیم' : a === 'leave' ? 'از همراهی گروه بیرون آمدید؛ پیشرفت خودتان سر جایش است' : 'دورهٔ گروهی لغو شد و به همراهان خبر داده شد');
    },
  });
}

/** کارت دورهٔ گروهی؛ فقط شمار، هیچ نام و رتبه‌ای */
export function CohortCard({ c, showPath = true, linkSelf = true }: { c: Cohort; showPath?: boolean; linkSelf?: boolean }) {
  const act = useCohortAction(c.id);
  const [confirm, setConfirm] = useState<'leave' | 'cancel' | null>(null);
  const cur = c.currentStation >= 0 ? c.stations[c.currentStation] : c.stations[0];
  const bubbles = Math.min(c.coreSize, 8);
  return (
    <section className={`tint-${c.path.color} cohort card grid gap-5 p-5`} aria-label={`مسیر گروهی ${c.path.title}`}>
      <div className="flex items-start gap-3">
        <span className="widget-icon bg-[var(--t-soft)] text-[var(--t-ink)]"><Users className="size-5" /></span>
        <div className="min-w-0 flex-1">
          <span className="text-xs font-bold text-[var(--t-ink)]">{c.core.name}</span>
          {showPath ? <Link to={linkSelf ? `/cohorts/${c.id}` : `/paths/${c.path.slug}`} className="block truncate text-[17px] font-extrabold text-ink no-underline">{c.path.title}</Link> : <b className="block text-[17px] font-extrabold text-ink">با هسته</b>}
        </div>
        <span className="chip tnum">{c.currentStation < 0 ? jShort(c.startsAt) : c.finished ? 'پایان' : `${fa(c.currentStation + 1)} / ${fa(c.stations.length)}`}</span>
      </div>
      <ol className="flex gap-1" aria-label="ایستگاه‌ها">
        {c.stations.map((s, i) => (
          <li key={s.course.slug} className={`h-2 flex-1 rounded-full ${s.doneByMe ? 'bg-leaf' : i === c.currentStation ? 'bg-flame' : i < c.currentStation ? 'bg-leaf/35' : 'bg-line'}`} title={`${s.course.title} — ${jShort(s.opensAt)}`} />
        ))}
      </ol>
      {cur && (
        <Link to={`/courses/${cur.course.slug}`} className="flex items-center gap-3 rounded-2xl bg-sunken p-3 no-underline">
          <span className="min-w-0 flex-1"><span className="block text-xs text-muted">{c.currentStation < 0 ? 'ایستگاه اول' : 'این هفته'}</span><b className="block truncate text-ink">{cur.course.title}</b></span>
          {cur.doneByMe ? <CircleCheck className="size-5 text-leaf" /> : <ChevronLeft className="size-5 text-muted" />}
        </Link>
      )}
      <div className="flex items-center gap-3">
        <span className="bubbles flex" aria-label={`${fa(c.memberCount)} نفر از ${fa(c.coreSize)} عضو همراه‌اند`} title={`${fa(c.memberCount)} از ${fa(c.coreSize)} همراه`}>
          {Array.from({ length: bubbles }, (_, i) => <i key={i} className={i < c.memberCount ? 'on' : ''} />)}
        </span>
        <span className="tnum text-xs text-muted">{fa(c.memberCount)}/{fa(c.coreSize)}</span>
        <span className="ms-auto flex gap-1.5">
          {c.canJoin && <button className="btn btn-primary btn-sm" disabled={act.isPending} onClick={() => act.mutate('join')}>همراه می‌شوم</button>}
          {!linkSelf && c.joined && <button className="btn btn-ghost btn-sm" disabled={act.isPending} onClick={() => setConfirm('leave')}>بیرون آمدن</button>}
          {!linkSelf && c.canManage && <button className="btn btn-ghost btn-sm text-rose-ink" disabled={act.isPending} onClick={() => setConfirm('cancel')}>لغو</button>}
          {c.joined && !c.canJoin && <span className="chip chip-leaf"><CircleCheck className="size-3.5" />همراهید</span>}
        </span>
      </div>
      {!linkSelf && c.note && <p className="rounded-xl border border-line px-4 py-3 text-sm text-body">{c.note}</p>}
      <Dialog open={!!confirm} onClose={() => setConfirm(null)} title={confirm === 'cancel' ? 'لغو مسیر گروهی؟' : 'بیرون آمدن از همراهی؟'}>
        <div className="grid gap-4">
          <p>{confirm === 'cancel' ? 'به همراهان خبر می‌دهیم. پیشرفت هر کس سر جایش می‌ماند.' : 'پیشرفت شما سر جایش می‌ماند. هر وقت خواستید برگردید.'}</p>
          <div className="flex gap-2">
            <button className={`btn ${confirm === 'cancel' ? 'btn-danger btn-solid' : 'btn-primary'}`} disabled={act.isPending} onClick={() => act.mutate(confirm!, { onSuccess: () => setConfirm(null) })}>{confirm === 'cancel' ? 'بله، لغو کن' : 'بله، بیرون می‌آیم'}</button>
            <button className="btn btn-ghost" onClick={() => setConfirm(null)}>منصرف شدم</button>
          </div>
        </div>
      </Dialog>
    </section>
  );
}

/** دوره‌های گروهی من که به یک مسیر مربوط‌اند */
export function PathCohorts({ slug }: { slug: string }) {
  const q = useMyCohorts();
  const list = (q.data ?? []).filter((c) => c.path.slug === slug);
  if (!list.length) return null;
  return <div className="grid gap-3">{list.map((c) => <CohortCard key={c.id} c={c} showPath={false} />)}</div>;
}

const todayIso = () => { const d = new Date(); d.setHours(18, 0, 0, 0); return d.toISOString(); };

/** ساخت دورهٔ گروهی برای یک هسته */
export function NewCohortDialog({ coreId, coreName, open, onClose, presetPath = '' }: { coreId: string; coreName: string; open: boolean; onClose: () => void; presetPath?: string }) {
  const qc = useQueryClient();
  const toast = useToast();
  const paths = useQuery({ queryKey: ['paths'], queryFn: () => api<PathCard[]>('/paths'), enabled: open });
  const [f, setF] = useState({ pathSlug: presetPath, startsAt: todayIso(), weeksPerStation: 1, note: '' });
  const [err, setErr] = useState('');
  const create = useMutation({
    mutationFn: () => api<Cohort>('/cohorts', { body: { coreId, ...f, note: f.note.trim() || undefined } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cohorts'] }); toast('دورهٔ گروهی ساخته شد و به اعضای هسته خبر دادیم'); onClose(); setF({ pathSlug: '', startsAt: todayIso(), weeksPerStation: 1, note: '' }); },
    onError: (e) => setErr(e instanceof ApiError ? e.message : 'ساخته نشد؛ دوباره امتحان کنید'),
  });
  const p = paths.data?.find((x) => x.slug === f.pathSlug);
  const weeks = p ? p.courseCount * f.weeksPerStation : 0;
  return (
    <Dialog open={open} onClose={onClose} title={`مسیر گروهی برای «${coreName}»`}>
      <form className="grid gap-5" onSubmit={(e) => { e.preventDefault(); setErr(''); if (!f.pathSlug) { setErr('یک مسیر انتخاب کنید'); return; } create.mutate(); }}>
        <p className="text-body">هر ایستگاه در هفتهٔ خودش؛ جلوتر رفتن آزاد است.</p>
        <div className="field">
          <label htmlFor="ch-path">مسیر</label>
          <select id="ch-path" className="input" value={f.pathSlug} onChange={(e) => setF({ ...f, pathSlug: e.target.value })}>
            <option value="">انتخاب کنید…</option>
            {paths.data?.map((x) => <option key={x.slug} value={x.slug}>{x.title} ({fa(x.courseCount)} دوره)</option>)}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="field"><label htmlFor="ch-start">شروع</label><JalaliInput id="ch-start" withTime={false} label="شروع" value={f.startsAt} onChange={(v) => setF({ ...f, startsAt: v })} /></div>
          <div className="field">
            <label htmlFor="ch-pace">سرعت</label>
            <select id="ch-pace" className="input" value={f.weeksPerStation} onChange={(e) => setF({ ...f, weeksPerStation: +e.target.value })}>
              {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n === 1 ? 'هر هفته یک ایستگاه' : `هر ${fa(n)} هفته یک ایستگاه`}</option>)}
            </select>
          </div>
        </div>
        {p && <p className="hint">این مسیر با این سرعت حدود {fa(weeks)} هفته طول می‌کشد.</p>}
        <div className="field">
          <label htmlFor="ch-note">یادداشت برای اعضا <span className="font-normal text-muted">(اختیاری)</span></label>
          <textarea id="ch-note" className="input min-h-20 py-3" maxLength={300} placeholder="مثلاً: جمعه‌ها بعد از نماز مغرب درباره‌اش حرف می‌زنیم" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
        </div>
        {err && <p className="err" role="alert"><XCircle className="size-4" />{err}</p>}
        <div className="flex gap-2">
          <button className="btn btn-primary" disabled={create.isPending}>{create.isPending && <InlineSpinner />}ساختن و خبر دادن به اعضا</button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>منصرف شدم</button>
        </div>
      </form>
    </Dialog>
  );
}

/** دوره‌های گروهی یک هسته، برای صفحهٔ هسته */
export function CoreCohorts({ coreId, coreName, canManage }: { coreId: string; coreName: string; canManage: boolean }) {
  const q = useQuery({ queryKey: ['cohorts', 'core', coreId], queryFn: () => api<Cohort[]>(`/cores/${coreId}/cohorts`) });
  const [open, setOpen] = useState(false);
  return (
    <section className="grid gap-3" aria-labelledby="cc-h">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="cc-h" className="text-lg font-extrabold">مسیر گروهی</h2>
        {canManage && <button className="btn btn-secondary btn-sm" onClick={() => setOpen(true)}><Users className="size-4" />مسیر گروهی تازه</button>}
      </div>
      {q.data?.length ? <div className="grid gap-3 lg:grid-cols-2">{q.data.map((c) => <CohortCard key={c.id} c={c} />)}</div>
        : <div className="grid justify-items-center gap-2 rounded-3xl border border-dashed border-line-strong p-8 text-center"><Users className="size-8 text-muted" /><p className="text-sm text-muted">{canManage ? 'یک مسیر، با هم، هفته‌ای یک ایستگاه.' : 'هنوز مسیر گروهی‌ای نیست.'}</p>{canManage && <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>شروع مسیر گروهی</button>}</div>}
      {canManage && <NewCohortDialog coreId={coreId} coreName={coreName} open={open} onClose={() => setOpen(false)} />}
    </section>
  );
}

/* ───────── پرسش کوتاه وسط درس (یادگیری فعال) ───────── */

interface Check { id: string; text: string; options: { id: string; text: string }[] }
type CheckResult = { ok: boolean; correct: string[]; explain: string };

export function LessonChecks({ lessonId, checks }: { lessonId: string; checks: Check[] }) {
  if (!checks?.length) return null;
  return (
    <section className="grid gap-3" aria-labelledby="chk-h">
      <h2 id="chk-h" className="flex items-center gap-2 text-[15px] font-extrabold"><Sparkles className="size-[18px] text-flame-ink" />یک لحظه فکر کنید</h2>
      {checks.map((q, i) => <CheckItem key={q.id} lessonId={lessonId} q={q} n={checks.length > 1 ? i + 1 : 0} />)}
    </section>
  );
}

function CheckItem({ lessonId, q, n }: { lessonId: string; q: Check; n: number }) {
  const [pick, setPick] = useState<string | null>(null);
  const [res, setRes] = useState<CheckResult | null>(null);
  const send = useMutation({
    mutationFn: (o: string) => api<CheckResult>(`/lessons/${lessonId}/check`, { body: { checkId: q.id, answer: [o] } }),
    onSuccess: (r) => setRes(r),
    meta: { quiet: true },
  });
  const choose = (o: string) => { if (res?.ok) return; setPick(o); setRes(null); send.mutate(o); };
  return (
    <div className="check card grid gap-3 p-4 md:p-5">
      <p className="font-bold text-ink">{n ? <span className="text-muted">{fa(n)}. </span> : null}{q.text}</p>
      <div className="grid gap-2" role="group" aria-label={q.text}>
        {q.options.map((o) => {
          const chosen = pick === o.id;
          const state = res && chosen ? (res.ok ? 'is-right' : 'is-wrong') : res?.ok && res.correct.includes(o.id) ? 'is-right' : '';
          return (
            <button key={o.id} type="button" onClick={() => choose(o.id)} aria-pressed={chosen} disabled={send.isPending || !!res?.ok}
              className={`opt flex items-center gap-2 rounded-xl border px-4 py-3 text-start ${state === 'is-right' ? 'border-leaf bg-leaf-soft' : state === 'is-wrong' ? 'border-rose bg-rose-soft' : chosen ? 'border-line-strong' : 'border-line hover:border-line-strong'}`}>
              <span className="flex-1">{o.text}</span>
              {state === 'is-right' && <CircleCheck className="size-5 text-leaf" />}{state === 'is-wrong' && <XCircle className="size-5 text-rose" />}
            </button>
          );
        })}
      </div>
      <div aria-live="polite">
        {send.isError && <p className="err">{(send.error as Error).message}</p>}
        {res && <p className={`rounded-xl px-4 py-3 text-sm ${res.ok ? 'bg-leaf-soft text-leaf-ink' : 'bg-sunken text-body'}`}>
          {res.ok ? <><b>درست است. </b>{res.explain}</> : <><b>نه دقیقاً. </b>یک بار دیگر به متن نگاه کنید و گزینهٔ دیگری را امتحان کنید.</>}
        </p>}
      </div>
    </div>
  );
}
