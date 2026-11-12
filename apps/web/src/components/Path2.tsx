/*
 * اجزای مشترک منطق مسیر (نسخهٔ ۲): کارت مسیر، پله‌ها و آیتم‌ها، نشان اندازه و برگزارکننده.
 * یک اصل: پیشرفت را شکل نشان می‌دهد (ترنج‌های پرشده)، نه عدد و نشان.
 */
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronLeft, Compass, Lock, Radio, Route, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { api } from '../lib/api';
import { fa, minutes } from '../lib/fa';
import type { ActorRole, Learning, PathItemV2, PathStepV2, PathV2 } from '../lib/types';
import { CourseIcon } from './ui';

export const ROLE_FA: Record<ActorRole, string> = { IMAM: 'امام', SHARIK: 'شریکة‌الامام', BAZU: 'بازو', HASTEH: 'عضو هسته', OTHER: 'دیگر' };
export const useLearning = () => useQuery({ queryKey: ['v2', 'learning'], queryFn: () => api<Learning>('/v2/learning') });
export const usePaths2 = (q = '') => useQuery({ queryKey: ['v2', 'paths', q], queryFn: () => api<PathV2[]>(`/v2/paths${q}`) });

/** ترنج: نقش‌مایهٔ مدرسه؛ پر = تمام، نیمه = در جریان، خالی = نرفته */
export function Toranj({ state, color, size = 18 }: { state: 'done' | 'now' | 'todo'; color: string; size?: number }) {
  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 48 60" aria-hidden="true" className="shrink-0">
      <path d="M24 2 C30 10 44 16 44 32 C44 46 34 58 24 58 C14 58 4 46 4 32 C4 16 18 10 24 2 Z" fill={state === 'done' ? color : state === 'now' ? `${color}33` : 'transparent'} stroke={state === 'todo' ? 'var(--line-strong)' : color} strokeWidth={state === 'done' ? 0 : 2.5} />
      {state === 'now' && <circle cx="24" cy="32" r="7" fill={color} />}
    </svg>
  );
}

/** نوار اندازه: خرد ۱ ترنج، میانه ۲، کلان ۳ */
export function SizeMark({ p, className = '' }: { p: Pick<PathV2, 'size' | 'sizeFa' | 'color'>; className?: string }) {
  const n = p.size === 'micro' ? 1 : p.size === 'mid' ? 2 : 3;
  return <span className={`inline-flex items-center gap-1 text-[13px] font-bold ${className}`} style={{ color: p.color }}>{Array.from({ length: n }, (_, i) => <Toranj key={i} state="done" color={p.color} size={10} />)}<span className="ms-1">{p.sizeFa}</span></span>;
}

export function PubName({ pub, muted = true }: { pub: PathV2['publisher']; muted?: boolean }) {
  if (!pub) return null;
  return <span className={`inline-flex items-center gap-1.5 text-[13px] ${muted ? 'text-muted' : 'text-body'}`}><span className="size-2 rounded-full" style={{ background: pub.color }} />{pub.name}</span>;
}

/** جملهٔ وضعیت مسیر برای کنشگر */
export function pathStateText(p: PathV2) {
  if (!p.me.enrolled) return p.hasRahyar ? 'با راهیار' : 'خودآموز';
  if (p.percent >= 100) return 'تمام شد';
  const st = p.steps[p.currentStep];
  const unit = p.size === 'micro' ? 'هفتهٔ' : p.size === 'macro' ? 'پلهٔ' : 'بخش';
  return st ? `${unit} ${st.title}، ${fa(p.currentStep + 1)} از ${fa(p.stepCount)}` : '';
}

/** کارت مسیر: نوار رنگی اندازه، عنوان، برگزارکننده، پیشرفت به شکل ترنج‌های پله */
export function PathCard({ p, i = 0, big = false }: { p: PathV2; i?: number; big?: boolean }) {
  const cur = p.steps[p.currentStep];
  const cta = !p.me.enrolled ? 'ببین چه دارد' : p.percent >= 100 ? 'کارنامه' : cur?.items.find((x) => !x.done && !x.optional)?.started ? 'ادامه بده' : 'قدم بعدی';
  return (
    <Link to={`/paths/${p.slug}`} className={`card is-link rise group relative grid gap-3 overflow-hidden p-5 no-underline ${big ? 'md:grid-cols-[1fr_auto] md:items-center' : ''}`} style={{ ['--i' as string]: i, borderInlineStartWidth: 6, borderInlineStartColor: p.color }}>
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2"><SizeMark p={p} />{p.isMain && <span className="chip chip-dome">مسیر اصلی تو</span>}</div>
        <b className={`${big ? 'text-2xl' : 'text-lg'} font-extrabold leading-snug text-ink`}>{p.title}</b>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1"><PubName pub={p.publisher} />{p.hasRahyar ? <span className="inline-flex items-center gap-1 text-[13px] text-muted"><Compass className="size-3.5" />با راهیار</span> : <span className="text-[13px] text-muted">خودآموز</span>}{p.enrolledCount > 0 && <span className="inline-flex items-center gap-1 text-[13px] text-muted"><Users className="size-3.5" />{fa(p.enrolledCount)} کنشگر</span>}</div>
        {p.description && !p.me.enrolled && <p className="text-sm text-body">{p.description}</p>}
        {p.me.enrolled && (
          <div className="flex items-center gap-1.5" aria-label={`پیشرفت: ${pathStateText(p)}`}>
            {p.steps.map((s, k) => <Toranj key={s.id} state={s.done ? 'done' : k === p.currentStep ? 'now' : 'todo'} color={p.color} size={14} />)}
            <span className="ms-2 text-sm text-body">{pathStateText(p)}</span>
          </div>
        )}
      </div>
      <span className="inline-flex items-center gap-1 self-end font-bold text-deep group-hover:gap-2 transition-all">{cta}<ChevronLeft className="size-4" /></span>
    </Link>
  );
}

function ItemRow({ it, locked }: { it: PathItemV2; locked: boolean }) {
  const icon = it.kind === 'live' ? <Radio className="size-5" /> : it.kind === 'path' ? <Route className="size-5" /> : it.kind === 'assess' ? <Compass className="size-5" /> : <CourseIcon name={it.icon ?? 'book-open'} className="size-5" />;
  const meta = it.kind === 'course' ? [it.lessonCount ? `${fa(it.lessonCount)} درس` : '', it.durationSec ? minutes(it.durationSec) : ''].filter(Boolean).join('، ')
    : it.kind === 'path' ? it.sizeFa : it.kind === 'live' ? 'پخش زنده' : 'با راهیار، حضوری';
  const Inner = (
    <>
      <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${it.done ? 'bg-leaf-soft text-leaf-ink' : 'bg-sunken text-body'}`}>{it.done ? <Check className="size-5" /> : locked ? <Lock className="size-4" /> : icon}</span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2"><b className="text-ink">{it.title}</b>{it.optional && <span className="text-xs text-muted">اختیاری</span>}</span>
        <span className="flex flex-wrap items-center gap-x-2 text-[13px] text-muted">{meta}{it.publisher && <PubName pub={it.publisher} />}</span>
        {!it.done && it.started && it.kind === 'course' && <span className="bar mt-1.5 !h-1.5 max-w-[200px]"><span style={{ width: `${it.percent}%` }} /></span>}
      </span>
      {!locked && <span className="text-sm font-bold text-deep">{it.done ? 'ببین' : it.started ? 'ادامه' : 'شروع'}</span>}
    </>
  );
  const cls = 'flex items-center gap-3 rounded-2xl px-3 py-2.5 no-underline';
  return locked ? <div className={`${cls} opacity-60`}>{Inner}</div> : <Link to={it.to} className={`${cls} hover:bg-sunken`}>{Inner}</Link>;
}

/** پله‌ها (یا هفته‌ها) و آیتم‌های هر کدام؛ پلهٔ بعد از پلهٔ جاری قفل است مگر مسیر بی‌پله باشد */
export function Steps({ p, unit }: { p: PathV2; unit?: string }) {
  const u = unit ?? (p.size === 'micro' ? 'هفتهٔ' : p.size === 'macro' ? 'پلهٔ' : '');
  const gated = p.size !== 'mid';
  return (
    <ol className="grid gap-3">
      {p.steps.map((s: PathStepV2, k) => {
        const state = s.done ? 'done' : k === p.currentStep || !gated ? 'now' : 'todo';
        const locked = gated && state === 'todo';
        return (
          <li key={s.id} className={`card grid gap-2 p-4 ${state === 'now' ? 'border-line-strong' : ''}`} style={state === 'now' ? { borderColor: p.color } : undefined}>
            <div className="flex items-center gap-3">
              <Toranj state={state} color={p.color} size={22} />
              <h3 className="flex-1 text-base font-extrabold">{u && <span className="text-muted">{u} </span>}{s.title}</h3>
              {s.rule && <span className="text-[13px] text-muted">رفتن به بعدی: {s.rule}</span>}
              {locked && <span className="text-[13px] text-muted">بعد از {u}قبلی</span>}
            </div>
            <div className="grid gap-1">{s.items.map((it) => <ItemRow key={it.kind + it.id} it={it} locked={locked} />)}</div>
          </li>
        );
      })}
    </ol>
  );
}

export function Section({ title, link, to, children }: { title: string; link?: string; to?: string; children: ReactNode }) {
  return (
    <section className="grid gap-4">
      <div className="flex items-end justify-between gap-3"><h2 className="text-lg font-extrabold">{title}</h2>{link && to && <Link to={to} className="text-sm font-bold text-leaf-ink">{link}</Link>}</div>
      {children}
    </section>
  );
}
