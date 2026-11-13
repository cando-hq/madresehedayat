/*
 * استودیوی استاد: دوره‌های من (ساخت و ارسال برای بازبینی)، پرسش‌های درس‌هایم، پخش‌های زندهٔ من، تحلیل (کدام درس رها می‌شود).
 * استاد زیرمجموعهٔ برگزارکننده است: برگزارکننده دوره را به او می‌سپارد؛ ستاد منتشر می‌کند.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, ChevronLeft, MessageCircle, Plus, Radio, TrendingUp } from 'lucide-react';
import { useState, Suspense } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { Brand } from '../components/Shell';
import { Dialog, Empty, ErrorBox, Spinner, useToast } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { fa, jDate, minutes } from '../lib/fa';

interface StudioData {
  courses: { id: string; slug: string; title: string; status: string; statusFa: string; returnNote: string | null; lessonCount: number; learners: number; completed: number; publisher: string | null; missing: number }[];
  questions: { id: string; title: string; body: string; by: string; lesson: string; createdAt: string; answers: number; answeredByMe: boolean }[];
  lives: { id: string; title: string; startsAt: string; endsAt: string; status: string; registered: number; attended: number; record: boolean; past: boolean }[];
  analytics: { course: string; lesson: string; type: string; durationSec: number; started: number; done: number; avgPos: number | null }[];
  totals: { learners: number; unanswered: number; nextLive: { id: string; title: string; startsAt: string } | null };
}
const useStudio = () => useQuery({ queryKey: ['v2', 'studio'], queryFn: () => api<StudioData>('/v2/studio') });
const NAV = [{ to: '/studio', label: 'دوره‌های من', icon: BookOpen, end: true }, { to: '/studio/questions', label: 'پرسش‌ها', icon: MessageCircle }, { to: '/studio/lives', label: 'پخش‌های زنده', icon: Radio }, { to: '/studio/analytics', label: 'تحلیل', icon: TrendingUp }];
const CHIP: Record<string, string> = { DRAFT: '', IN_REVIEW: 'chip-flame', PUBLISHED: 'chip-leaf', RETURNED: 'chip-rose' };

export function StudioShell() {
  const { has, isStaff } = useAuth();
  const d = useStudio();
  if (!has('INSTRUCTOR') && !isStaff) return <Empty title="این بخش برای استادهاست">اگر دوره‌ای تدریس می‌کنی، از برگزارکننده‌ات بخواه دوره را به استودیوی تو بسپارد.</Empty>;
  return (
    <div className="min-h-dvh bg-bg md:grid md:grid-cols-[248px_1fr]">
      <aside className="border-b border-line bg-ink text-white md:min-h-dvh md:border-b-0">
        <div className="flex items-center justify-between p-4 md:block"><span className="[&_img]:brightness-0 [&_img]:invert"><Brand compact /></span><b className="text-sm md:mt-4 md:block">استودیوی استاد</b></div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:grid md:gap-0.5" aria-label="بخش‌های استودیو">
          {NAV.map((s) => <NavLink key={s.to} to={s.to} end={s.end} className={({ isActive }) => `flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm no-underline ${isActive ? 'bg-white/15 font-bold text-white' : 'text-white/80 hover:bg-white/10'}`}><s.icon className="size-[18px]" />{s.label}{s.to === '/studio/questions' && (d.data?.totals.unanswered ?? 0) > 0 && <span className="ms-auto rounded-full bg-flame px-2 text-xs font-bold text-ink">{fa(d.data!.totals.unanswered)}</span>}</NavLink>)}
          <Link to="/" className="mt-2 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/70 no-underline hover:bg-white/10"><ChevronLeft className="size-4" />نمای کنشگر</Link>
        </nav>
      </aside>
      <main className="wrap py-6 md:py-10"><Suspense fallback={<Spinner />}><Outlet /></Suspense></main>
    </div>
  );
}

export function StudioCourses() {
  const d = useStudio(); const qc = useQueryClient(); const nav = useNavigate(); const toast = useToast();
  const [title, setTitle] = useState<string | null>(null);
  const create = useMutation({ mutationFn: (t: string) => api<{ id: string }>('/v2/studio/courses', { body: { title: t } }), onSuccess: (c) => { qc.invalidateQueries({ queryKey: ['v2', 'studio'] }); nav(`/studio/courses/${c.id}`); } });
  const submit = useMutation({ mutationFn: (id: string) => api(`/v2/studio/courses/${id}/submit`, { method: 'POST', body: {} }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['v2', 'studio'] }); toast('رفت برای بازبینی؛ ستاد تا دو روز کاری پاسخ می‌دهد'); } });
  if (d.isLoading) return <Spinner />; if (d.error) return <ErrorBox error={d.error} onRetry={() => d.refetch()} />;
  const x = d.data!;
  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-[clamp(24px,3vw,32px)] font-extrabold">دوره‌های من</h1><p className="mt-1 text-muted">درس بساز، ضبط کن، بفرست برای بازبینی. {fa(x.totals.learners)} کنشگر در دوره‌های توست.</p></div>
        <button className="btn btn-primary" onClick={() => setTitle('')}><Plus className="size-4" />دورهٔ تازه</button>
      </header>
      {x.totals.nextLive && <Link to={`/events/${x.totals.nextLive.id}`} className="card is-link flex items-center gap-3 p-4 no-underline" style={{ borderInlineStartWidth: 6, borderInlineStartColor: 'var(--rose)' }}><Radio className="size-5 text-rose-ink" /><span className="flex-1"><b className="block text-ink">پخش زندهٔ بعدی: {x.totals.nextLive.title}</b><span className="text-sm text-muted">{jDate(x.totals.nextLive.startsAt)}</span></span><ChevronLeft className="size-4 text-muted" /></Link>}
      {x.courses.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {x.courses.map((c) => (
            <article key={c.id} className="card grid gap-3 p-5">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><b className="block text-lg font-extrabold text-ink">{c.title}</b><span className="text-sm text-muted">{c.publisher ? `برای ${c.publisher}، ` : ''}{fa(c.lessonCount)} درس</span></div><span className={`chip ${CHIP[c.status]}`}>{c.statusFa}</span></div>
              {c.returnNote && <p className="rounded-xl bg-rose-soft p-3 text-sm text-rose-ink"><b>ستاد:</b> {c.returnNote}</p>}
              {c.missing > 0 && <p className="text-sm text-flame-ink">{fa(c.missing)} درس هنوز فایل صوت یا ویدیو ندارد.</p>}
              <div className="flex items-center gap-4 text-sm"><span><b className="tnum text-ink">{fa(c.learners)}</b> <span className="text-muted">کنشگر</span></span><span><b className="tnum text-ink">{fa(c.completed)}</b> <span className="text-muted">تمام کرده</span></span></div>
              <div className="flex flex-wrap gap-2"><Link to={`/studio/courses/${c.id}`} className="btn btn-secondary btn-sm">درس‌ها و ضبط</Link>{(c.status === 'DRAFT' || c.status === 'RETURNED') && <button className="btn btn-primary btn-sm" disabled={submit.isPending} onClick={() => submit.mutate(c.id)}>بفرست برای بازبینی</button>}{c.status === 'PUBLISHED' && <Link to={`/courses/${c.slug}`} className="btn btn-ghost btn-sm">از دید کنشگر</Link>}</div>
            </article>
          ))}
        </div>
      ) : <Empty icon={BookOpen} title="هنوز دوره‌ای به تو سپرده نشده">از «دورهٔ تازه» شروع کن یا از برگزارکننده‌ات بخواه دوره‌ای را به استودیوی تو بسپارد.</Empty>}
      <Dialog open={title !== null} onClose={() => setTitle(null)} title="دورهٔ تازه">
        <div className="grid gap-3"><label className="field"><span>عنوان دوره</span><input className="input" value={title ?? ''} onChange={(e) => setTitle(e.target.value)} placeholder="تا ۶ کلمه" autoFocus /></label><div className="flex gap-2"><button className="btn btn-primary" disabled={!title?.trim() || create.isPending} onClick={() => create.mutate(title!.trim())}>بساز</button><button className="btn btn-ghost" onClick={() => setTitle(null)}>برگرد</button></div></div>
      </Dialog>
    </div>
  );
}

export function StudioQuestions() {
  const d = useStudio();
  if (d.isLoading) return <Spinner />;
  const qs = d.data!.questions;
  return (
    <div className="grid gap-6">
      <header><h1 className="text-[clamp(24px,3vw,32px)] font-extrabold">پرسش‌های درس‌هایم</h1><p className="mt-1 text-muted">پرسش‌هایی که کنشگران زیر درس‌های تو گذاشته‌اند. پاسخ استاد بالای پاسخ‌های همتایان می‌نشیند.</p></header>
      {qs.length ? <div className="card divide-y divide-line">{qs.map((q) => <Link key={q.id} to={`/questions/${q.id}`} className="flex items-center gap-3 px-4 py-3 no-underline"><span className="min-w-0 flex-1"><b className="block text-ink">{q.title}</b><span className="text-sm text-muted">{q.by}، زیر درس «{q.lesson}»، {jDate(q.createdAt)}</span></span>{q.answeredByMe ? <span className="chip chip-leaf">پاسخ داده‌ای</span> : <span className="chip chip-flame">{q.answers ? `${fa(q.answers)} پاسخ همتا، بی پاسخ استاد` : 'بی پاسخ'}</span>}</Link>)}</div>
        : <Empty icon={MessageCircle} title="پرسشی نیست">هر پرسشی زیر درس‌هایت بیاید، این‌جا می‌آید.</Empty>}
    </div>
  );
}

export function StudioLives() {
  const d = useStudio();
  if (d.isLoading) return <Spinner />;
  const ls = d.data!.lives;
  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-[clamp(24px,3vw,32px)] font-extrabold">پخش‌های زندهٔ من</h1><p className="mt-1 text-muted">اتاق کنترل: ثبت‌نام‌ها، حضور، ضبط. ضبط بعد از پایان به مسیرها الصاق می‌شود.</p></div><Link to="/manage/events/new" className="btn btn-primary"><Plus className="size-4" />پخش زندهٔ تازه</Link></header>
      {ls.length ? <div className="grid gap-3">{ls.map((e) => <div key={e.id} className="card flex flex-wrap items-center gap-3 p-4"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-rose-soft text-rose-ink"><Radio className="size-5" /></span><span className="min-w-0 flex-1"><b className="block text-ink">{e.title}</b><span className="text-sm text-muted">{jDate(e.startsAt)}، {fa(e.registered)} یادآوری‌خواه{e.past ? `، ${fa(e.attended)} حاضر` : ''}{e.record ? '، ضبط می‌شود' : ''}</span></span><span className={`chip ${e.status === 'PUBLISHED' ? 'chip-leaf' : e.status === 'IN_REVIEW' ? 'chip-flame' : ''}`}>{e.status === 'PUBLISHED' ? 'منتشرشده' : e.status === 'IN_REVIEW' ? 'در بازبینی' : e.status === 'DRAFT' ? 'پیش‌نویس' : e.status}</span><Link to={e.past ? `/events/${e.id}` : `/manage/events/${e.id}`} className="btn btn-secondary btn-sm">{e.past ? 'ضبط و حضور' : 'اتاق کنترل'}</Link></div>)}</div>
        : <Empty icon={Radio} title="پخش زنده‌ای نداری">با «پخش زندهٔ تازه» بساز؛ بدون مسیر هم منتشر می‌شود.</Empty>}
    </div>
  );
}

export function StudioAnalytics() {
  const d = useStudio();
  if (d.isLoading) return <Spinner />;
  const rows = d.data!.analytics;
  return (
    <div className="grid gap-6">
      <header><h1 className="text-[clamp(24px,3vw,32px)] font-extrabold">تحلیل</h1><p className="mt-1 text-muted">کدام درس رها می‌شود. درس‌هایی که نسبت تمام‌کردن پایین‌تری دارند، بالاتر آمده‌اند؛ کوتاه‌ترشان کن یا کارش را روشن‌تر.</p></header>
      {rows.length ? (
        <div className="card overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-muted">{['درس', 'قالب و مدت', 'شروع کرده', 'تمام کرده', 'میانگین تا کجا'].map((h) => <th key={h} className="px-4 py-3 text-start font-bold">{h}</th>)}</tr></thead><tbody>
          {rows.map((r, i) => { const rate = r.started ? Math.round(r.done / r.started * 100) : 0; return <tr key={i} className="border-t border-line"><td className="px-4 py-3"><b className="text-ink">{r.lesson}</b><span className="block text-xs text-muted">{r.course}</span></td><td className="px-4 py-3 text-body">{r.type === 'AUDIO' ? 'صوت' : r.type === 'VIDEO' ? 'ویدیو' : r.type === 'MISSION' ? 'تکلیف' : r.type === 'QUIZ' ? 'آزمون' : 'متن'}{r.durationSec ? `، ${minutes(r.durationSec)}` : ''}</td><td className="tnum px-4 py-3">{fa(r.started)}</td><td className="px-4 py-3"><span className="tnum">{fa(r.done)}</span> <span className={`ms-1 text-xs ${rate < 50 ? 'text-rose-ink' : 'text-muted'}`}>(٪{fa(rate)})</span><span className="bar mt-1 !h-1.5 max-w-[120px]"><span style={{ width: `${rate}%`, background: rate < 50 ? 'var(--rose)' : 'var(--leaf)' }} /></span></td><td className="tnum px-4 py-3">{r.avgPos != null ? `٪${fa(r.avgPos)}` : '—'}</td></tr>; })}
        </tbody></table></div>
      ) : <Empty icon={TrendingUp} title="هنوز داده‌ای نیست">وقتی کنشگران درس‌هایت را شروع کنند، این‌جا می‌بینی کجا می‌مانند.</Empty>}
    </div>
  );
}
