/*
 * «از چشم کنشگر»: پیش‌نمایش همان دوره‌ای که ساخته می‌شود (حتی پیش‌نویس)، در قاب گوشی.
 * هیچ چیزی ثبت نمی‌شود؛ آزمون همین‌جا نمره می‌گیرد و گزارش مأموریت فرستاده نمی‌شود.
 */
import { CheckCircle2, ChevronRight, Pause, Play, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { fa, LESSON_LABEL, minutes } from '../lib/fa';
import { RichText } from './RichText';
import { LESSON_ICON } from './ui';

export interface PLesson { id: string; title: string; type: string; durationSec: number; content: any }
export interface PCourse { title: string; passScore: number; modules: { id: string; title: string; lessons: PLesson[] }[] }

const aparatEmbed = (h: string) => `https://www.aparat.com/video/video/embed/videohash/${h}/vt/frame`;
const TINT: Record<string, string> = { VIDEO: 'tint-deep cover', AUDIO: 'tint-dome cover', TEXT: 'bg-sunken text-body', QUIZ: 'tint-green cover', MISSION: 'tint-flame cover' };

export function CoursePreview({ course, startId, onClose }: { course: PCourse; startId?: string | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const flat = course.modules.flatMap((m) => m.lessons);
  const [at, setAt] = useState<string | null>(startId ?? null);
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => { ref.current?.showModal(); }, []);
  const cur = flat.find((l) => l.id === at) ?? null;
  const next = () => {
    if (!cur) return;
    setDone((d) => (d.includes(cur.id) ? d : [...d, cur.id]));
    const i = flat.findIndex((l) => l.id === cur.id);
    setAt(flat[i + 1]?.id ?? null);
  };
  const totalMin = Math.round(flat.reduce((a, l) => a + (l.durationSec || 0), 0) / 60);
  const firstOpen = flat.find((l) => !done.includes(l.id));
  return (
    <dialog ref={ref} onClose={onClose} className="m-0 h-dvh max-h-dvh w-full max-w-none border-0 bg-bg p-0 text-body backdrop:bg-ink/40">
      <div className="mx-auto flex min-h-full max-w-5xl flex-wrap items-start justify-center gap-8 p-6">
        <div className="grid max-w-xs gap-3 pt-6">
          <button className="btn btn-ghost btn-sm w-fit" onClick={() => ref.current?.close()}><X className="size-4" />بستن پیش‌نمایش</button>
          <h2 className="text-2xl font-extrabold">از چشم کنشگر</h2>
          <p className="text-sm text-muted">همین دوره، همان‌طور که کنشگر روی گوشی می‌بیند. درس‌ها را جلو ببر و آزمون بده؛ چیزی ثبت نمی‌شود.</p>
          <button className="btn btn-secondary btn-sm w-fit" onClick={() => { setDone([]); setAt(null); }}>از اول</button>
        </div>
        <div className="flex h-[min(800px,calc(100dvh-48px))] w-[390px] max-w-full flex-col overflow-hidden rounded-[40px] border-[10px] border-ink bg-bg">
          {!cur ? (
            <div className="grid flex-1 content-start gap-3 overflow-y-auto p-4">
              <div className="card flex items-center gap-3 p-4">
                <span className="arch grid h-20 w-16 shrink-0 place-items-end justify-center rounded-t-full rounded-b-xl bg-dome-soft pb-3 text-dome-ink" aria-hidden="true"><CheckCircle2 className="size-6" /></span>
                <div className="grid min-w-0 flex-1 gap-1">
                  <b className="text-lg leading-7 text-ink">{course.title}</b>
                  <span className="text-xs text-muted">{fa(flat.length)} درس{totalMin ? ` · ${fa(totalMin)} دقیقه` : ''}</span>
                  <div className="h-1.5 overflow-hidden rounded-full bg-sunken"><div className="h-full rounded-full bg-leaf transition-[width]" style={{ width: `${flat.length ? Math.round((done.length / flat.length) * 100) : 0}%` }} /></div>
                  <span className="text-xs text-muted">{fa(done.length)} از {fa(flat.length)} درس</span>
                </div>
              </div>
              {firstOpen ? <button className="btn btn-primary h-12" onClick={() => setAt(firstOpen.id)}>{done.length ? 'ادامهٔ دوره' : 'شروع دوره'}</button>
                : flat.length > 0 && <p className="rounded-2xl bg-leaf-soft p-4 text-sm font-semibold text-leaf-ink">همهٔ درس‌ها را گذراندی.</p>}
              {course.modules.map((m) => (
                <div key={m.id} className="grid gap-2">
                  {course.modules.length > 1 && <b className="px-1 pt-2 text-sm text-ink">{m.title}</b>}
                  {m.lessons.map((l) => { const I = LESSON_ICON[l.type]; return (
                    <button key={l.id} className="card flex items-center gap-3 p-3 text-start" onClick={() => setAt(l.id)}>
                      <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${TINT[l.type] ?? 'bg-sunken'}`}><I className="size-5" /></span>
                      <span className="min-w-0 flex-1"><b className="block text-sm leading-6 text-ink">{l.title}</b><span className="text-xs text-muted">{LESSON_LABEL[l.type]}{l.durationSec ? ` · ${minutes(l.durationSec)}` : ''}</span></span>
                      {done.includes(l.id) && <CheckCircle2 className="size-5 shrink-0 text-leaf-ink" aria-label="گذرانده شد" />}
                    </button>); })}
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 border-b border-line bg-card px-3 py-2">
                <button className="btn btn-ghost btn-icon btn-sm" aria-label="فهرست درس‌ها" onClick={() => setAt(null)}><ChevronRight className="size-5" /></button>
                <span className="text-sm text-muted">درس {fa(flat.indexOf(cur) + 1)} از {fa(flat.length)}</span>
              </div>
              <PreviewLesson key={cur.id} l={cur} passScore={course.passScore} onNext={next} />
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}

function PreviewLesson({ l, passScore, onNext }: { l: PLesson; passScore: number; onNext: () => void }) {
  const c = l.content ?? {};
  const [sel, setSel] = useState<Record<string, string[]>>({});
  const [checked, setChecked] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  let cta = 'درس بعد', ctaOk = true, onCta = onNext;
  let body: React.ReactNode = null;
  if (l.type === 'VIDEO') {
    cta = 'دیدم، درس بعد';
    body = c.provider === 'file' && c.fileKey
      ? <video src={`/api/files/${c.fileKey}`} controls className="aspect-video w-full rounded-2xl bg-ink" />
      : c.aparatHash
        ? <div className="aspect-video overflow-hidden rounded-2xl bg-ink"><iframe title={l.title} src={aparatEmbed(c.aparatHash)} allowFullScreen className="size-full border-0" /></div>
        : <p className="grid aspect-video place-items-center rounded-2xl border border-dashed border-line-strong text-sm text-muted">ویدیو هنوز پیوند ندارد</p>;
    body = <>{body}{c.summary && <p className="whitespace-pre-line leading-8">{c.summary}</p>}</>;
  } else if (l.type === 'AUDIO') {
    cta = 'گوش دادم، درس بعد';
    body = <>
      {c.fileKey ? <div className="flex items-center gap-3 rounded-2xl bg-dome-soft p-4">
        <button className="grid size-12 shrink-0 place-items-center rounded-full bg-dome-ink text-white" aria-label={playing ? 'توقف' : 'پخش'} onClick={() => { const a = audio.current; if (!a) return; if (a.paused) { a.play(); setPlaying(true); } else { a.pause(); setPlaying(false); } }}>{playing ? <Pause className="size-5" /> : <Play className="size-5" />}</button>
        <audio ref={audio} src={`/api/files/${c.fileKey}`} controls className="min-w-0 flex-1" onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} />
      </div> : <p className="rounded-2xl border border-dashed border-line-strong p-6 text-center text-sm text-muted">فایل صوتی هنوز بارگذاری نشده</p>}
      {c.summary && <p className="whitespace-pre-line leading-8">{c.summary}</p>}</>;
  } else if (l.type === 'TEXT') {
    cta = 'خواندم، درس بعد';
    body = <>
      <RichText body={String(c.body ?? '')} />
      {Array.isArray(c.keyPoints) && c.keyPoints.length > 0 && <div className="rounded-2xl bg-flame-soft p-4"><b className="text-flame-ink">نکته‌های کلیدی</b><ul className="mt-2 grid gap-1 text-ink">{c.keyPoints.map((k: string) => <li key={k}>• {k}</li>)}</ul></div>}</>;
  } else if (l.type === 'QUIZ') {
    const qs: any[] = c.questions ?? [];
    const okOf = (q: any) => { const g = [...(sel[q.id] ?? [])].sort(), w = [...(q.correct ?? [])].sort(); return g.length === w.length && g.every((x, i) => x === w[i]); };
    const right = qs.filter(okOf).length;
    const pct = qs.length ? Math.round((right / qs.length) * 100) : 0;
    const pass = pct >= passScore;
    const all = qs.every((q) => (sel[q.id] ?? []).length > 0);
    if (!checked) { cta = all ? 'بررسی پاسخ‌ها' : 'اول به همهٔ پرسش‌ها پاسخ بده'; ctaOk = all && qs.length > 0; onCta = () => setChecked(true); }
    else if (!pass) { cta = 'دوباره امتحان می‌دهم'; onCta = () => { setSel({}); setChecked(false); }; }
    body = <div className="grid gap-5">
      {checked && <p role="status" className={`rounded-xl p-3 text-sm font-semibold ${pass ? 'bg-leaf-soft text-leaf-ink' : 'bg-rose-soft text-rose-ink'}`}>{pass ? 'قبول شدی' : 'هنوز قبول نشدی'}: {fa(right)} از {fa(qs.length)} پاسخ درست (٪{fa(pct)}). حد قبولی ٪{fa(passScore)}.</p>}
      {!qs.length && <p className="text-sm text-muted">این آزمون هنوز پرسشی ندارد.</p>}
      {qs.map((q, qi) => {
        const multi = q.kind === 'multi', s = sel[q.id] ?? [];
        return (
          <div key={q.id} className="grid gap-2">
            <span className="text-xs text-muted">پرسش {fa(qi + 1)}{multi ? ' · همهٔ پاسخ‌های درست را بزن' : ''}</span>
            <b className="leading-8 text-ink">{q.text}</b>
            {q.options.map((o: any) => {
              const on = s.includes(o.id), isRight = (q.correct ?? []).includes(o.id);
              const cls = !checked ? (on ? 'border-leaf bg-leaf-soft text-ink' : 'border-line-strong bg-card') : isRight ? 'border-leaf bg-leaf-soft font-bold text-leaf-ink' : on ? 'border-rose bg-rose-soft text-rose-ink' : 'border-line bg-card text-muted';
              return <button key={o.id} type="button" aria-pressed={on} disabled={checked} onClick={() => setSel({ ...sel, [q.id]: multi ? (on ? s.filter((x) => x !== o.id) : [...s, o.id]) : [o.id] })}
                className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-start text-sm ${cls}`}><span className={`size-4 shrink-0 border-2 ${multi ? 'rounded' : 'rounded-full'} ${on ? 'border-leaf bg-leaf' : 'border-line-strong'}`} />{o.text}</button>;
            })}
            {checked && <p className={`rounded-xl p-3 text-sm ${okOf(q) ? 'bg-leaf-soft text-leaf-ink' : 'bg-sunken text-body'}`}><b>{okOf(q) ? 'درست. ' : 'نادرست. '}</b>{q.explain}</p>}
          </div>
        );
      })}
    </div>;
  } else if (l.type === 'MISSION') {
    cta = 'فرستادن گزارش برای راهیار';
    body = <div className="grid gap-3">
      <p className="rounded-xl bg-flame-soft p-3 text-sm font-semibold text-flame-ink">مأموریت میدانی · گزارشت را راهیارت می‌خواند</p>
      {c.goal && <p className="whitespace-pre-line leading-8">{c.goal}</p>}
      {Array.isArray(c.steps) && c.steps.length > 0 && <ol className="grid list-decimal gap-1 ps-6">{c.steps.map((s: string, i: number) => <li key={i}>{s}</li>)}</ol>}
      <textarea className="input min-h-24" placeholder="چه کردی و چه دیدی؟ (در پیش‌نمایش فرستاده نمی‌شود)" />
    </div>;
  } else {
    body = <p className="rounded-2xl bg-sunken p-4 text-sm text-muted">درس «{LESSON_LABEL[l.type]}» در پیش‌نمایش فقط معرفی می‌شود؛ کنشگر آن را در خود درس کامل می‌کند.</p>;
  }
  return (
    <>
      <div className="grid flex-1 content-start gap-4 overflow-y-auto p-4">
        <h3 className="text-xl font-extrabold leading-9">{l.title}</h3>
        {body}
      </div>
      <div className="border-t border-line bg-card p-3"><button className="btn btn-primary h-12 w-full" disabled={!ctaOk} onClick={onCta}>{cta}</button></div>
    </>
  );
}
