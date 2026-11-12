/* مسیر آموزشی: قلب مدرسه. حلقهٔ پیشرفت، کارت مسیر، و نقشهٔ ایستگاه‌ها. */
import { Award, Check, ChevronLeft, Clock, Layers, Lock, Play, Route } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router';
import { fa, minutes } from '../lib/fa';
import type { CourseCard as C, PathCard } from '../lib/types';
import { CourseIcon } from './ui';

/* ───────── ابزار حرکت ───────── */
const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** عدد از صفر تا مقدار می‌شمارد (ease-out)؛ با «کاهش حرکت» فوراً نشان داده می‌شود */
export function CountUp({ value, ms = 900, prefix = '' }: { value: number; ms?: number; prefix?: string }) {
  const [v, setV] = useState(() => (reduced() ? value : 0));
  useEffect(() => {
    if (reduced()) { setV(value); return; }
    let raf = 0; const t0 = performance.now(); const from = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / ms); const e = 1 - Math.pow(1 - k, 3);
      setV(Math.round(from + (value - from) * e));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return <span className="tnum">{prefix}{fa(v)}</span>;
}

/** وقتی عنصر به دید آمد، کلاس `in` می‌گیرد (یک بار) */
export function useInView<T extends Element>(margin = '0px 0px -12% 0px') {
  const ref = useRef<T>(null);
  const [inView, set] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (reduced() || typeof IntersectionObserver === 'undefined') { set(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { set(true); io.disconnect(); } }, { rootMargin: margin });
    io.observe(el); return () => io.disconnect();
  }, [margin]);
  return [ref, inView] as const;
}

/* ───────── داده‌های مشتق مسیر ───────── */
export type StationState = 'done' | 'current' | 'next' | 'later';
export function pathState(p: PathCard) {
  const states: StationState[] = [];
  let currentIdx = -1;
  p.courses.forEach((c, i) => {
    if (c.me?.completedAt) { states.push('done'); return; }
    if (currentIdx === -1) { currentIdx = i; states.push('current'); return; }
    states.push(i === currentIdx + 1 ? 'next' : 'later');
  });
  const pct = p.courseCount ? Math.round(((p.completedCount + (currentIdx >= 0 ? (p.courses[currentIdx].me?.percent ?? 0) / 100 : 0)) / p.courseCount) * 100) : 0;
  const totalSec = p.courses.reduce((s, c) => s + (c.durationSec ?? 0), 0);
  const done = p.courseCount > 0 && p.completedCount >= p.courseCount;
  const started = p.courses.some((c) => c.me);
  return { states, currentIdx, current: currentIdx >= 0 ? p.courses[currentIdx] : null, pct: Math.min(100, pct), totalSec, done, started };
}

/* ───────── حلقهٔ پیشرفت ───────── */
export function Ring({ value, size = 120, stroke = 9, children, label }: { value: number; size?: number; stroke?: number; children?: ReactNode; label: string }) {
  const r = (size - stroke) / 2; const c = 2 * Math.PI * r;
  const [ref, inView] = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className="pring relative grid shrink-0 place-items-center" style={{ width: size, height: size }} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -scale-x-100 -rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity=".14" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={inView ? c * (1 - value / 100) : c} className="ring-arc" />
      </svg>
      <div className="relative grid justify-items-center leading-tight">{children ?? (inView ? <b className="text-2xl font-extrabold text-ink"><CountUp value={value} prefix="٪" /></b> : <b className="text-2xl font-extrabold text-ink">٪۰</b>)}</div>
    </div>
  );
}

/* ───────── کارت مسیر ───────── */
export function PathTile({ p, i = 0 }: { p: PathCard; i?: number }) {
  const s = pathState(p);
  return (
    <Link to={`/paths/${p.slug}`} className={`tint-${p.color} card is-link path-tile group grid gap-5 p-5 no-underline md:p-6`} style={{ '--i': i } as CSSProperties}>
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <span className="text-[13px] font-bold text-[var(--t-ink)]">مسیر · {fa(p.courseCount)} دوره{s.totalSec ? ` · ${minutes(s.totalSec)}` : ''}</span>
          <h3 className="mt-1 text-lg font-extrabold leading-snug">{p.title}</h3>
        </div>
        <span className="text-[var(--t-ink)]"><Ring value={s.pct} size={64} stroke={6} label={`پیشرفت مسیر ${p.title}`}><b className="text-sm font-extrabold text-ink">٪{fa(s.pct)}</b></Ring></span>
      </div>
      <Stops p={p} states={s.states} />
      <div className="flex items-center justify-between gap-3 border-t border-line pt-4 text-sm">
        <span className="min-w-0 truncate text-muted">
          {s.done ? 'همهٔ دوره‌ها تمام شده' : s.current ? <>{s.started ? 'ادامه از' : 'شروع از'} <b className="font-bold text-ink">{s.current.title}</b></> : ''}
        </span>
        <span className="flex shrink-0 items-center gap-1 font-bold text-leaf-ink">{s.done ? 'آزمون و گواهی' : s.started ? 'ادامهٔ مسیر' : 'دیدن مسیر'}<ChevronLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-1" /></span>
      </div>
    </Link>
  );
}

/** ردیف ایستگاه‌های کوچک: هر دوره یک نقطه، با خط پیوند */
function Stops({ p, states }: { p: PathCard; states: StationState[] }) {
  return (
    <ol className="stops flex items-center" aria-label="ایستگاه‌های مسیر">
      {p.courses.map((c, i) => (
        <li key={c.id} className={`stop stop-${states[i]} flex flex-1 items-center last:flex-none`} title={c.title} style={{ '--i': i } as CSSProperties}>
          <span className="dot grid place-items-center">{states[i] === 'done' && <Check className="size-3" strokeWidth={3} />}</span>
          {i < p.courses.length - 1 && <span className="link" />}
        </li>
      ))}
      {p.hasExam && <li className={`stop stop-exam ${states.every((x) => x === 'done') ? 'stop-current' : 'stop-later'} flex items-center`}><span className="link w-4" /><span className="dot grid place-items-center"><Award className="size-3" strokeWidth={2.5} /></span></li>}
    </ol>
  );
}

/* ───────── نقشهٔ مسیر (صفحهٔ مسیر) ───────── */
const STATE_LABEL: Record<StationState, string> = { done: 'تمام شد', current: 'این‌جا هستید', next: 'ایستگاه بعد', later: 'در راه' };

export function Journey({ p }: { p: PathCard }) {
  const s = pathState(p);
  const [ref, inView] = useInView<HTMLOListElement>('0px 0px -8% 0px');
  // خط مسیر تا ایستگاه فعلی پر می‌شود
  const fillTo = s.done ? 1 : s.currentIdx < 0 ? 0 : (s.currentIdx + 0.5) / (p.courses.length + (p.hasExam ? 1 : 0));
  return (
    <ol ref={ref} className={`journey ${inView ? 'in' : ''} relative grid gap-4`} style={{ '--fill': fillTo } as CSSProperties} aria-label={`ایستگاه‌های مسیر ${p.title}`}>
      <span className="spine" aria-hidden="true"><span /></span>
      {p.courses.map((c, i) => <Station key={c.id} c={c} n={i + 1} state={s.states[i]} i={i} />)}
      {p.hasExam && <ExamStation p={p} open={s.done} i={p.courses.length} />}
    </ol>
  );
}

function Station({ c, n, state, i }: { c: C; n: number; state: StationState; i: number }) {
  const cta = state === 'done' ? 'مرور دوره' : state === 'current' ? (c.me ? 'ادامه' : 'شروع') : 'دیدن دوره';
  return (
    <li className={`station st-${state} tint-${c.color}`} style={{ '--i': i } as CSSProperties} aria-current={state === 'current' ? 'step' : undefined}>
      <span className="node" aria-hidden="true">
        {state === 'done' ? <svg viewBox="0 0 24 24" className="tick"><path d="M6 12.5l4 4 8-9" /></svg> : <b className="tnum">{fa(n)}</b>}
      </span>
      <Link to={`/courses/${c.slug}`} className="card is-link stop-card group grid gap-3 p-4 no-underline md:grid-cols-[72px_minmax(0,1fr)_auto] md:items-center md:gap-5 md:p-5">
        <span className="cover hidden size-[72px] place-items-center rounded-2xl md:grid"><CourseIcon name={c.icon} className="size-8 transition-transform duration-300 group-hover:scale-110" /></span>
        <span className="grid min-w-0 gap-1">
          <span className={`state-tag st-tag-${state}`}>{STATE_LABEL[state]}</span>
          <b className="text-[17px] font-extrabold leading-snug text-ink">{c.title}</b>
          {c.subtitle && <span className="line-clamp-1 text-sm text-muted">{c.subtitle}</span>}
          <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
            {c.lessonCount != null && <span className="flex items-center gap-1"><Layers className="size-3.5" />{fa(c.lessonCount)} درس</span>}
            {!!c.durationSec && <span className="flex items-center gap-1"><Clock className="size-3.5" />{minutes(c.durationSec)}</span>}
          </span>
          {state === 'current' && c.me && (
            <span className="mt-2 flex items-center gap-3"><span className="bar animate flex-1"><span style={{ width: `${c.me.percent}%` }} /></span><b className="tnum text-xs text-ink">٪{fa(c.me.percent)}</b></span>
          )}
        </span>
        <span className={`btn ${state === 'current' ? 'btn-primary' : 'btn-ghost'} btn-sm justify-self-start md:justify-self-end`}>
          {state === 'current' && <Play className="size-4" />}{cta}
        </span>
      </Link>
    </li>
  );
}

function ExamStation({ p, open, i }: { p: PathCard; open: boolean; i: number }) {
  return (
    <li className={`station st-exam ${open ? 'st-current' : 'st-later'}`} style={{ '--i': i } as CSSProperties} aria-current={open ? 'step' : undefined}>
      <span className="node" aria-hidden="true">{open ? <Award className="size-5" /> : <Lock className="size-4" />}</span>
      <div className={`card exam-card grid gap-3 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center ${open ? 'is-open' : ''}`}>
        <span className="grid gap-1">
          <span className="state-tag st-tag-exam">پایان مسیر</span>
          <b className="text-[17px] font-extrabold text-ink">آزمون جامع و گواهی مسیر</b>
          <span className="text-sm text-muted">{open ? 'همهٔ دوره‌ها تمام شده. با قبولی، گواهی مسیر با شناسهٔ استعلام صادر می‌شود.' : `پس از ${fa(p.courseCount)} دوره باز می‌شود؛ گواهی مسیر با شناسهٔ استعلام.`}</span>
        </span>
        <Link to={`/paths/${p.slug}/exam`} className={`btn ${open ? 'btn-primary' : 'btn-secondary'} btn-sm justify-self-start`}>{open ? 'شروع آزمون' : 'دربارهٔ آزمون'}</Link>
      </div>
    </li>
  );
}

/** سرصفحهٔ مسیر */
export function PathHero({ p }: { p: PathCard }) {
  const s = pathState(p);
  return (
    <header className={`tint-${p.color} path-hero relative overflow-hidden rounded-3xl`}>
      <div className="relative z-10 grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-10">
        <div className="stagger grid gap-3">
          <span className="flex items-center gap-2 text-[13px] font-bold text-[var(--t-ink)]"><Route className="size-4" />مسیر آموزشی</span>
          <h1 className="text-[clamp(26px,3.4vw,40px)] font-extrabold leading-tight">{p.title}</h1>
          {p.description && <p className="max-w-2xl text-body">{p.description}</p>}
          <dl className="mt-2 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <div><dt className="text-muted">دوره</dt><dd className="text-lg font-extrabold text-ink"><CountUp value={p.courseCount} /></dd></div>
            {!!s.totalSec && <div><dt className="text-muted">زمان کل</dt><dd className="text-lg font-extrabold text-ink">{minutes(s.totalSec)}</dd></div>}
            <div><dt className="text-muted">تمام‌شده</dt><dd className="text-lg font-extrabold text-ink"><CountUp value={p.completedCount} /> از {fa(p.courseCount)}</dd></div>
            {p.hasExam && <div><dt className="text-muted">پایان</dt><dd className="text-lg font-extrabold text-ink">گواهی مسیر</dd></div>}
          </dl>
          <div className="mt-3 flex flex-wrap gap-3">
            {s.done ? <Link to={`/paths/${p.slug}/exam`} className="btn btn-primary btn-lg"><Award className="size-5" />آزمون جامع</Link>
              : s.current && <Link to={`/courses/${s.current.slug}`} className="btn btn-primary btn-lg"><Play className="size-5" />{s.started ? 'ادامهٔ مسیر' : 'شروع مسیر'}</Link>}
            {s.current && !s.done && <span className="self-center text-sm text-muted">ایستگاه {fa(s.currentIdx + 1)}: <b className="font-bold text-ink">{s.current.title}</b></span>}
          </div>
        </div>
        <span className="justify-self-start text-[var(--t-ink)] md:justify-self-end"><Ring value={s.pct} size={148} stroke={10} label={`پیشرفت مسیر ${p.title}`} /></span>
      </div>
      {s.done && <Celebrate />}
    </header>
  );
}

/** جشن کوچک پایان مسیر: چند برگ از پایین بالا می‌روند و محو می‌شوند */
function Celebrate() {
  if (reduced()) return null;
  return (
    <span className="celebrate pointer-events-none absolute inset-0" aria-hidden="true">
      {Array.from({ length: 14 }, (_, k) => <i key={k} style={{ '--k': k, '--x': `${(k * 37) % 100}%`, '--d': `${(k % 5) * 120}ms`, '--r': `${((k * 53) % 60) - 30}deg` } as CSSProperties} />)}
    </span>
  );
}
