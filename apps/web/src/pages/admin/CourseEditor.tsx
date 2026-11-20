import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ask } from '../../components/Confirm';
import { ArrowDown, ArrowUp, Check, CircleAlert, Copy, Eye, GripVertical, Music, Pencil, Plus, Settings2, Trash2, Upload, Video, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { CourseIcon, Dialog, Drawer, ErrorBox, ICONS, LESSON_ICON, Spinner, useToast } from '../../components/ui';
import { CoursePreview } from '../../components/CoursePreview';
import { applyFormat, RichText } from '../../components/RichText';
import { api, ApiError, uploadFile } from '../../lib/api';
import { useTools } from '../Tools';
import { fa, jDate, LESSON_LABEL, minutes, STATUS_LABEL } from '../../lib/fa';
import type { LessonType } from '../../lib/types';
import type { AdminCourse } from './Courses';

interface ALesson { problem?: string | null; id: string; title: string; type: LessonType; order: number; durationSec: number; required: boolean; isFinalQuiz: boolean; content: any; skillIds?: string[] }
interface ASkill { id: string; title: string }
interface FullCourse extends AdminCourse {
  about: string | null; level: string | null; instructor: string | null; passScore: number; missionRule: 'ON_SUBMIT' | 'ON_APPROVAL';
  hasCertificate: boolean; outcomes: string[]; skills?: ASkill[];
  reviewStatus?: 'IN_REVIEW' | 'PUBLISHED' | 'RETURNED' | null; returnNote?: string | null; reviewNotes?: Record<string, string>;
  modules: { id: string; title: string; order: number; lessons: ALesson[] }[];
  dependencies: { requiresId: string; kind: 'PREREQUISITE' | 'COREQUISITE'; title: string }[];
}
type Mods = FullCourse['modules'];

const COLORS = [['green', 'سبز'], ['dome', 'فیروزه‌ای'], ['deep', 'آبی'], ['flame', 'زرد'], ['rose', 'سرخ']];
/** نوع‌های درس در منوی «افزودن»؛ پنج تای اول پرکاربردند */
const ADD_TYPES: [LessonType, string][] = [['VIDEO', 'ویدیو'], ['AUDIO', 'صوت'], ['TEXT', 'متن'], ['QUIZ', 'آزمون'], ['MISSION', 'مأموریت'], ['PRACTICE', 'تمرین'], ['WORKSHEET', 'برگهٔ کار'], ['TOOL', 'ابزار کار'], ['LIVE', 'جلسهٔ زنده']];
const NEW_TITLE: Record<string, string> = { VIDEO: 'ویدیوی تازه', AUDIO: 'صوت تازه', TEXT: 'متن تازه', QUIZ: 'آزمون کوتاه', MISSION: 'مأموریت میدانی', PRACTICE: 'تمرین تازه', WORKSHEET: 'برگهٔ کار', TOOL: 'کار با ابزار', LIVE: 'جلسهٔ زنده' };
export const TYPE_TINT: Record<string, string> = { VIDEO: 'tint-deep cover', AUDIO: 'tint-dome cover', TEXT: 'bg-sunken text-body', QUIZ: 'tint-green cover', MISSION: 'tint-flame cover', PRACTICE: 'tint-peri cover', WORKSHEET: 'tint-amber cover', TOOL: 'tint-sky cover', LIVE: 'tint-rose cover' };

export default function CourseEditor() {
  const { id } = useParams();
  const qc = useQueryClient();
  const toast = useToast();
  const nav = useNavigate();
  const path = useLocation().pathname;
  const base = path.startsWith('/pub') ? '/pub' : path.startsWith('/studio') ? '/studio' : '/admin/courses';
  const q = useQuery({ queryKey: ['admin-course', id], queryFn: () => api<FullCourse>(`/admin/courses/${id}`) });
  const [editId, setEditId] = useState<string | null>(null);
  const [settings, setSettings] = useState(false);
  const [preview, setPreview] = useState<{ start: string | null } | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [undo, setUndo] = useState<{ l: ALesson; moduleId: string; index: number } | null>(null);
  const undoTimer = useRef<number>(0);
  // فهرست کمبودها مال لحظهٔ فرستادن است؛ با هر تغییر دوره کهنه می‌شود (نشان «کامل کن» کنار هر درس می‌ماند)
  useEffect(() => { setProblems([]); }, [q.dataUpdatedAt]);
  const inval = () => { qc.invalidateQueries({ queryKey: ['admin-course', id] }); qc.invalidateQueries({ queryKey: ['admin-courses'] }); };
  const patch = useMutation({
    mutationFn: (body: Record<string, unknown>) => api(`/admin/courses/${id}`, { method: 'PATCH', body }),
    onSuccess: (_r, v) => { inval(); setProblems([]); toast(v.status ? `وضعیت: ${STATUS_LABEL[v.status as string]}` : 'ذخیره شد'); },
    onError: (e) => { const a = e as ApiError; if (a.data?.problems) setProblems(a.data.problems); toast(a.message, 'err'); },
  });
  const del = useMutation({
    mutationFn: () => api(`/admin/courses/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-courses'] }); toast('دوره حذف شد'); nav(base); },
    onError: (e) => toast((e as Error).message, 'err'),
  });
  const creator = !base.startsWith('/admin');
  const submit = useMutation({
    mutationFn: () => api(`/v2${base}/courses/${id}/submit`, { method: 'POST' }),
    onSuccess: () => { inval(); setProblems([]); toast('برای بازبینی ستاد فرستاده شد؛ نتیجه را پیام می‌دهیم'); },
    onError: (e) => { const a = e as ApiError; if (a.data?.problems) { setProblems(a.data.problems); window.scrollTo({ top: 0, behavior: 'smooth' }); } toast(a.message, 'err'); },
  });
  useEffect(() => () => window.clearTimeout(undoTimer.current), []);
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} />;
  const c = q.data!;
  const notes = c.reviewNotes ?? {};
  const flat = c.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleId: m.id })));
  const num = new Map(flat.map((l, i) => [l.id, i + 1]));
  const edit = flat.find((l) => l.id === editId) ?? null;
  const readyN = flat.filter((l) => !l.problem).length;
  const totalSec = flat.reduce((a, l) => a + (l.durationSec || 0), 0);
  const issues = [
    ...(!flat.length ? [{ id: null as string | null, where: 'دوره', what: 'هنوز درسی ندارد', tone: 'warn' }] : []),
    ...flat.filter((l) => l.problem).map((l) => ({ id: l.id as string | null, where: `درس ${fa(num.get(l.id)!)} · ${l.title}`, what: l.problem!, tone: 'warn' })),
    ...flat.filter((l) => notes[l.id]).map((l) => ({ id: l.id as string | null, where: `درس ${fa(num.get(l.id)!)} · ${l.title}`, what: 'یادداشت ستاد هنوز باز است', tone: 'note' })),
  ];
  const rs = c.reviewStatus;
  const inReview = creator && c.status !== 'PUBLISHED' && rs === 'IN_REVIEW';
  const returned = rs === 'RETURNED';
  const order = (mods: Mods) => api(`/admin/courses/${c.id}/order`, { method: 'PUT', body: { modules: mods.map((m) => ({ id: m.id, lessons: m.lessons.map((l) => l.id) })) } });
  /** ساختن درس در جای مشخص؛ درس تازه ته بخش ساخته می‌شود و بعد به جایش می‌رود */
  const createAt = async (moduleId: string, index: number, type: LessonType, title: string, extra?: Record<string, unknown>) => {
    const l = await api<{ id: string }>(`/admin/modules/${moduleId}/lessons`, { body: { title: title.slice(0, 160), type } });
    if (extra) await api(`/admin/lessons/${l.id}`, { method: 'PATCH', body: extra });
    const mods = c.modules.map((m) => ({ ...m, lessons: [...m.lessons] }));
    const m = mods.find((x) => x.id === moduleId)!;
    m.lessons.splice(Math.min(index, m.lessons.length), 0, { id: l.id } as ALesson);
    await order(mods);
    return l.id;
  };
  const addLesson = (moduleId: string, index: number, type: LessonType) =>
    createAt(moduleId, index, type, NEW_TITLE[type] ?? LESSON_LABEL[type]).then((nid) => { inval(); setEditId(nid); }).catch((e) => toast((e as Error).message, 'err'));
  const duplicate = (l: ALesson & { moduleId: string }) => {
    const m = c.modules.find((x) => x.id === l.moduleId)!;
    createAt(l.moduleId, m.lessons.findIndex((x) => x.id === l.id) + 1, l.type, `${l.title} (رونوشت)`, { content: l.content, durationSec: l.durationSec, required: l.required, isFinalQuiz: false, ...(l.skillIds?.length ? { skillIds: l.skillIds } : {}) })
      .then((nid) => { inval(); setEditId(nid); toast('رونوشت ساخته شد'); }).catch((e) => toast((e as Error).message, 'err'));
  };
  const remove = (l: ALesson & { moduleId: string }) => {
    const m = c.modules.find((x) => x.id === l.moduleId)!;
    const index = m.lessons.findIndex((x) => x.id === l.id);
    api(`/admin/lessons/${l.id}`, { method: 'DELETE' }).then(() => {
      setEditId(null); inval(); setUndo({ l, moduleId: l.moduleId, index });
      window.clearTimeout(undoTimer.current); undoTimer.current = window.setTimeout(() => setUndo(null), 8000);
    }).catch((e) => toast((e as Error).message, 'err'));
  };
  const restore = () => {
    if (!undo) return; const u = undo; setUndo(null);
    createAt(u.moduleId, u.index, u.l.type, u.l.title, { content: u.l.content, durationSec: u.l.durationSec, required: u.l.required, isFinalQuiz: u.l.isFinalQuiz, ...(u.l.skillIds?.length ? { skillIds: u.l.skillIds } : {}) })
      .then(() => { inval(); toast('درس برگشت'); }).catch((e) => toast((e as Error).message, 'err'));
  };
  const resolve = (lessonId: string) => api(`/admin/courses/${c.id}/review-notes/${lessonId}`, { method: 'DELETE' }).then(inval).catch((e) => toast((e as Error).message, 'err'));
  const canSubmit = creator && c.status !== 'PUBLISHED' && !inReview;
  const statusChip = creator
    ? inReview ? ['در بازبینی ستاد', 'chip chip-flame'] : returned ? ['برگشته از ستاد', 'chip tint-deep cover'] : c.status === 'PUBLISHED' ? ['منتشر شده', 'chip chip-leaf'] : ['پیش‌نویس', 'chip']
    : [STATUS_LABEL[c.status], c.status === 'PUBLISHED' ? 'chip chip-leaf' : c.status === 'REVIEW' ? 'chip chip-flame' : 'chip'];

  return (
    <div className="rise grid gap-5 pb-24">
      <div className="sticky top-0 z-20 -mx-1 flex flex-wrap items-center gap-2 border-b border-line bg-bg/95 px-1 py-3 backdrop-blur">
        <Link to={base} className="text-sm text-muted no-underline hover:text-ink">‹ {base === '/pub' ? 'محتوای ما' : base === '/studio' ? 'دوره‌های من' : 'دوره‌ها'}</Link>
        <span className={statusChip[1]}>{statusChip[0]}</span>
        <span className="me-auto" />
        <button className="btn btn-ghost btn-sm" onClick={() => setPreview({ start: null })}><Eye className="size-4" />از چشم کنشگر</button>
        {c.status === 'PUBLISHED' && <Link to={`/courses/${c.slug}`} className="btn btn-ghost btn-sm" target="_blank">دیدن در مدرسه</Link>}
        {creator ? (canSubmit && <button className="btn btn-primary btn-sm" disabled={submit.isPending} onClick={() => submit.mutate()}>{returned ? 'فرستادن دوباره' : 'فرستادن برای بازبینی'}</button>) : <>
          {c.status === 'DRAFT' && <button className="btn btn-secondary btn-sm" onClick={() => patch.mutate({ status: 'REVIEW' })}>فرستادن برای بازبینی</button>}
          {(c.status === 'DRAFT' || c.status === 'REVIEW') && <button className="btn btn-primary btn-sm" onClick={() => patch.mutate({ status: 'PUBLISHED' })}>انتشار</button>}
          {c.status === 'REVIEW' && <button className="btn btn-ghost btn-sm" onClick={() => patch.mutate({ status: 'DRAFT' })}>برگرداندن به پیش‌نویس</button>}
          {c.status === 'PUBLISHED' && <button className="btn btn-secondary btn-sm" onClick={() => patch.mutate({ status: 'PUBLISHED', bumpVersion: true })}>انتشار نسخهٔ تازه</button>}
          {c.status === 'PUBLISHED' && <button className="btn btn-ghost btn-sm" onClick={() => patch.mutate({ status: 'ARCHIVED' })}>بایگانی</button>}
          {c.status === 'ARCHIVED' && <button className="btn btn-secondary btn-sm" onClick={() => patch.mutate({ status: 'PUBLISHED' })}>انتشار دوباره</button>}</>}
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-w-0 gap-5">
          <Cover c={c} lessons={flat.length} totalSec={totalSec} save={(b) => patch.mutate(b)} />

          {problems.length > 0 && (
            <div className="rounded-2xl bg-flame-soft p-4 text-sm text-flame-ink" role="alert"><b className="flex items-center gap-2"><CircleAlert className="size-4" />{creator ? 'هنوز نمی‌شود فرستاد. این‌ها مانده:' : 'پیش از انتشار این‌ها را درست کنید:'}</b>
              <ul className="mt-2 list-disc ps-5">{problems.map((p) => <li key={p}>{p}</li>)}</ul></div>
          )}
          {inReview && <Banner tone="flame" title="این دوره پیش ستاد است">اگر چیزی را عوض کنی، ستاد همان را می‌بیند. نتیجه را پیام می‌دهیم.</Banner>}
          {returned && <Banner tone="deep" title={Object.keys(notes).length ? `ستاد دوره را با ${fa(Object.keys(notes).length)} یادداشت برگرداند` : 'ستاد دوره را برگرداند'}>
            {c.returnNote ? `«${c.returnNote}»` : 'یادداشت‌ها زیر همان درس‌ها آمده‌اند.'} درست کردی، «فرستادن دوباره» را بزن.</Banner>}
          {c.status === 'PUBLISHED' && <Banner tone="leaf" title="این دوره منتشر شده است">اصلاحات جزئی به همه می‌رسد. برای تغییر اساسی، «انتشار نسخهٔ تازه» تا یادگیرنده‌های فعلی روی نسخهٔ قبلی بمانند.</Banner>}

          <Outline c={c} notes={notes} num={num} onOpen={setEditId} openId={editId} inval={inval} order={order} addLesson={addLesson} resolve={resolve} />
        </div>

        <aside className="grid gap-4 xl:sticky xl:top-20">
          <section className="card grid gap-3 p-5">
            <span className="text-sm text-muted">آمادگی دوره</span>
            <b className="text-xl text-ink">{fa(readyN)} از {fa(flat.length)} درس آماده</b>
            <div className="h-1.5 overflow-hidden rounded-full bg-sunken"><div className="h-full rounded-full bg-leaf transition-[width] duration-500" style={{ width: `${flat.length ? Math.round((readyN / flat.length) * 100) : 0}%` }} /></div>
            {!issues.length && <p className="text-sm text-leaf-ink">همه‌چیز آماده است{creator && canSubmit ? '؛ می‌توانی برای ستاد بفرستی.' : '.'}</p>}
            {issues.length > 0 && <ul className="grid gap-1.5">{issues.map((x, i) => (
              <li key={i}><button className={`grid w-full rounded-xl px-3 py-2 text-start text-sm ${x.tone === 'note' ? 'bg-deep-soft text-deep' : 'bg-flame-soft text-flame-ink'}`} onClick={() => x.id && setEditId(x.id)} disabled={!x.id}>
                <b className="truncate">{x.where}</b><span>{x.what}</span></button></li>))}</ul>}
          </section>
          <section className="card grid gap-2 p-5 text-sm">
            <span className="text-muted">مشخصات دوره</span>
            <Row k="سطح" v={c.level || '—'} />
            <Row k="حد قبولی آزمون" v={`٪${fa(c.passScore)}`} />
            <Row k="گواهی" v={c.hasCertificate ? 'دارد' : 'ندارد'} />
            <Row k="تکمیل مأموریت" v={c.missionRule === 'ON_APPROVAL' ? 'با تأیید راهیار' : 'با فرستادن گزارش'} />
            <Row k="پیش‌نیاز" v={c.dependencies.length ? c.dependencies.map((d) => d.title).join('، ') : 'ندارد'} />
            <button className="btn btn-ghost btn-sm mt-1 w-fit text-leaf-ink" onClick={() => setSettings(true)}><Settings2 className="size-4" />تنظیمات دوره</button>
          </section>
        </aside>
      </div>

      <Drawer open={!!edit} onClose={() => setEditId(null)} title={edit ? LESSON_LABEL[edit.type] : ''} kicker={edit ? `درس ${fa(num.get(edit.id)!)} از ${fa(flat.length)}` : ''}
        icon={edit ? <TypeTile type={edit.type} /> : null}>
        {edit && <LessonEditor key={edit.id} l={edit} skills={c.skills ?? []} note={notes[edit.id]} onResolve={() => resolve(edit.id)}
          onSaved={() => { inval(); setEditId(null); }} onDuplicate={() => duplicate(edit)} onDelete={() => remove(edit)} />}
      </Drawer>

      <Drawer open={settings} onClose={() => setSettings(false)} title="تنظیمات دوره" kicker={c.title}>
        {settings && <div className="grid gap-5">
          <MetaForm c={c} save={(b) => patch.mutate(b)} saving={patch.isPending} />
          <SkillsEditor c={c} save={(skills) => patch.mutate({ skills })} saving={patch.isPending} />
          <Dependencies c={c} inval={inval} />
          {!creator && <button className="btn btn-ghost btn-sm w-fit text-rose" onClick={async () => { if (await ask({ title: 'این دوره حذف شود؟', body: 'درس‌هایش هم پاک می‌شوند. دوره‌ای که یادگیرنده دارد پاک نمی‌شود؛ بایگانی‌اش کن.', ok: 'حذف کن', danger: true })) del.mutate(); }}><Trash2 className="size-4" />حذف دوره</button>}
        </div>}
      </Drawer>

      {preview && <CoursePreview course={c} startId={preview.start} onClose={() => setPreview(null)} />}

      {undo && <div role="status" className="fixed inset-x-0 bottom-6 z-50 mx-auto flex w-fit items-center gap-4 rounded-2xl bg-ink px-5 py-3 text-sm text-white shadow-lift">
        <span>«{undo.l.title}» حذف شد</span><button className="font-extrabold text-flame" onClick={restore}>برگرداندن</button></div>}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-3"><span>{k}</span><b className="text-end text-ink">{v}</b></div>;
}

function Banner({ tone, title, children }: { tone: 'flame' | 'deep' | 'leaf'; title: string; children: React.ReactNode }) {
  const cls = { flame: 'bg-flame-soft text-flame-ink', deep: 'bg-deep-soft text-deep', leaf: 'bg-leaf-soft text-leaf-ink' }[tone];
  return <div role="status" className={`grid gap-1 rounded-2xl px-5 py-4 ${cls}`}><b>{title}</b><p className="text-sm text-body">{children}</p></div>;
}

function TypeTile({ type, size = 'md' }: { type: string; size?: 'sm' | 'md' }) {
  const I = LESSON_ICON[type];
  return <span className={`grid shrink-0 place-items-center rounded-xl ${TYPE_TINT[type] ?? 'bg-sunken'} ${size === 'sm' ? 'size-9' : 'size-11'}`}><I className="size-5" /></span>;
}

/** سرِ دوره: جلد در قاب طاق، اسم و یک جملهٔ معرفی که همین‌جا عوض می‌شوند */
function Cover({ c, lessons, totalSec, save }: { c: FullCourse; lessons: number; totalSec: number; save: (b: Record<string, unknown>) => void }) {
  const [title, setTitle] = useState(c.title);
  const [sub, setSub] = useState(c.subtitle ?? '');
  useEffect(() => { setTitle(c.title); setSub(c.subtitle ?? ''); }, [c.title, c.subtitle]);
  return (
    <section className="card flex flex-wrap items-stretch gap-5 p-5">
      <div className={`tint-${c.color} cover hidden h-36 w-28 shrink-0 sm:grid place-items-end justify-center rounded-t-full rounded-b-2xl pb-5`} aria-hidden="true"><CourseIcon name={c.icon} className="size-10" /></div>
      <div className="grid min-w-[220px] flex-1 content-center gap-2">
        <input className="-ms-2 rounded-xl border border-transparent bg-transparent px-2 text-[clamp(20px,2.4vw,26px)] font-extrabold text-ink hover:border-line focus:border-leaf-ink" aria-label="اسم دوره" value={title} maxLength={120}
          onChange={(e) => setTitle(e.target.value)} onBlur={() => { const t = title.trim(); if (t.length >= 3 && t !== c.title) save({ title: t }); else setTitle(c.title); }} />
        <span className="text-sm text-muted">{fa(lessons)} درس{totalSec ? ` · ${minutes(totalSec)}` : ''}{c.instructor ? ` · ${c.instructor}` : ''}</span>
        <input className="input h-11 bg-bg text-sm" placeholder="در یک جمله: این دوره به کنشگر چه می‌دهد؟" aria-label="معرفی کوتاه دوره" value={sub} maxLength={200}
          onChange={(e) => setSub(e.target.value)} onBlur={() => { if (sub.trim() !== (c.subtitle ?? '')) save({ subtitle: sub.trim() }); }} />
      </div>
    </section>
  );
}

function MetaForm({ c, save, saving }: { c: FullCourse; save: (b: Record<string, unknown>) => void; saving: boolean }) {
  const [f, setF] = useState({ title: c.title, subtitle: c.subtitle ?? '', about: c.about ?? '', level: c.level ?? '', instructor: c.instructor ?? '', color: c.color, icon: c.icon,
    passScore: c.passScore, missionRule: c.missionRule, hasCertificate: c.hasCertificate, isRestricted: c.isRestricted, outcomes: c.outcomes.join('\n') });
  const s = (k: keyof typeof f, v: unknown) => setF((x) => ({ ...x, [k]: v }));
  return (
    <section className="card grid gap-4 p-5">
      <h2 className="text-base font-extrabold">مشخصات دوره</h2>
      <div className="field"><label htmlFor="t">عنوان</label><input id="t" className="input" value={f.title} onChange={(e) => s('title', e.target.value)} /></div>
      <div className="field"><label htmlFor="st">زیرعنوان</label><input id="st" className="input" value={f.subtitle} onChange={(e) => s('subtitle', e.target.value)} placeholder="یک جمله دربارهٔ اینکه دوره چه می‌دهد" /></div>
      <div className="field"><label htmlFor="ab">توضیح</label><textarea id="ab" className="input" value={f.about} onChange={(e) => s('about', e.target.value)} /></div>
      <div className="field"><label htmlFor="oc">پس از این دوره… <span className="font-normal text-muted">(هر خط یک مورد)</span></label><textarea id="oc" className="input" value={f.outcomes} onChange={(e) => s('outcomes', e.target.value)} /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field"><label htmlFor="lv">سطح</label><input id="lv" className="input" value={f.level} onChange={(e) => s('level', e.target.value)} placeholder="مقدماتی، میانه…" /></div>
        <div className="field"><label htmlFor="in">مدرس</label><input id="in" className="input" value={f.instructor} onChange={(e) => s('instructor', e.target.value)} /></div>
        <div className="field"><label htmlFor="ps">حد قبولی آزمون (٪)</label><input id="ps" className="input tnum" type="number" min={0} max={100} value={f.passScore} onChange={(e) => s('passScore', Number(e.target.value))} /></div>
        <div className="field"><label htmlFor="mr">تکمیل مأموریت</label><select id="mr" className="input" value={f.missionRule} onChange={(e) => s('missionRule', e.target.value)}><option value="ON_SUBMIT">با فرستادن گزارش</option><option value="ON_APPROVAL">با تأیید راهیار</option></select></div>
      </div>
      <div className="field"><span className="text-sm font-bold text-ink">رنگ و نماد</span>
        <div className="flex flex-wrap gap-2">{COLORS.map(([k, t]) => <button key={k} type="button" className={`tint-${k} chip cover ${f.color === k ? 'ring-2 ring-ink' : ''}`} onClick={() => s('color', k)}>{t}</button>)}</div>
        <div className="flex flex-wrap gap-2">{Object.keys(ICONS).map((k) => <button key={k} type="button" aria-label={k} className={`grid size-10 place-items-center rounded-xl border ${f.icon === k ? 'border-leaf bg-leaf-soft text-leaf-ink' : 'border-line'}`} onClick={() => s('icon', k)}><CourseIcon name={k} className="size-5" /></button>)}</div>
      </div>
      <label className="flex items-center gap-3"><input type="checkbox" className="size-5" checked={f.hasCertificate} onChange={(e) => s('hasCertificate', e.target.checked)} />گواهی دارد (آزمون پایانی لازم است)</label>
      <label className="flex items-center gap-3"><input type="checkbox" className="size-5" checked={f.isRestricted} onChange={(e) => s('isRestricted', e.target.checked)} />فقط برای مشترکان (با دسترسی ویژه)</label>
      <div><button className="btn btn-primary" disabled={saving} onClick={() => save({ ...f, outcomes: f.outcomes.split('\n').map((x) => x.trim()).filter(Boolean) })}>ذخیرهٔ مشخصات</button></div>
    </section>
  );
}

function Dependencies({ c, inval }: { c: FullCourse; inval: () => void }) {
  const all = useQuery({ queryKey: ['admin-courses'], queryFn: () => api<AdminCourse[]>('/admin/courses') });
  const [deps, setDeps] = useState(c.dependencies.map((d) => ({ requiresId: d.requiresId, kind: d.kind })));
  const [pick, setPick] = useState('');
  const toast = useToast();
  useEffect(() => setDeps(c.dependencies.map((d) => ({ requiresId: d.requiresId, kind: d.kind }))), [c.dependencies]);
  const save = useMutation({
    mutationFn: () => api(`/admin/courses/${c.id}/dependencies`, { method: 'PUT', body: { deps } }),
    onSuccess: () => { inval(); toast('پیش‌نیازها ذخیره شد'); }, onError: (e) => toast((e as Error).message, 'err'),
  });
  const others = (all.data ?? []).filter((x) => x.id !== c.id && !deps.some((d) => d.requiresId === x.id));
  const title = (id: string) => all.data?.find((x) => x.id === id)?.title ?? '…';
  return (
    <section className="card grid gap-3 p-5">
      <h2 className="text-base font-extrabold">پیش‌نیاز و هم‌نیاز</h2>
      <p className="text-sm text-muted">پیش‌نیاز: تا تمام نشود، ثبت‌نام بسته است. هم‌نیاز: هم‌زمان ثبت‌نام می‌شود و گواهی پس از تمام شدن هر دو صادر می‌شود.</p>
      <ul className="grid gap-2">{deps.map((d, i) => (
        <li key={d.requiresId} className="flex items-center gap-2 rounded-xl border border-line p-2">
          <span className="flex-1 text-sm font-semibold text-ink">{title(d.requiresId)}</span>
          <select className="input h-9 w-auto text-sm" value={d.kind} onChange={(e) => setDeps((x) => x.map((y, j) => j === i ? { ...y, kind: e.target.value as any } : y))}><option value="PREREQUISITE">پیش‌نیاز</option><option value="COREQUISITE">هم‌نیاز</option></select>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDeps((x) => x.filter((_, j) => j !== i))} aria-label="برداشتن"><X className="size-4" /></button>
        </li>
      ))}</ul>
      <div className="flex gap-2"><select className="input h-10 flex-1" value={pick} onChange={(e) => setPick(e.target.value)}><option value="">افزودن دوره…</option>{others.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}</select>
        <button className="btn btn-secondary btn-sm h-10" disabled={!pick} onClick={() => { setDeps((x) => [...x, { requiresId: pick, kind: 'PREREQUISITE' }]); setPick(''); }}><Plus className="size-4" /></button></div>
      <div><button className="btn btn-primary btn-sm" onClick={() => save.mutate()} disabled={save.isPending}>ذخیره</button></div>
    </section>
  );
}


/* ───────── فهرست درس‌ها: فصل‌ها، کارت درس، کشیدن و رها کردن، افزودن لای درس‌ها ───────── */

function Outline({ c, notes, num, onOpen, openId, inval, order, addLesson, resolve }: {
  c: FullCourse; notes: Record<string, string>; num: Map<string, number>; onOpen: (id: string) => void; openId: string | null; inval: () => void;
  order: (m: Mods) => Promise<unknown>; addLesson: (moduleId: string, index: number, type: LessonType) => void; resolve: (lessonId: string) => void;
}) {
  const toast = useToast();
  const [gap, setGap] = useState<string | null>(null); // «moduleId:index»
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [rename, setRename] = useState<{ id: string; t: string } | null>(null);
  const [bulk, setBulk] = useState<{ moduleId: string; kind: 'aparat' | 'audio'; text?: string } | null>(null);
  const [paste, setPaste] = useState('');
  const call = (p: Promise<unknown>, ok?: string) => p.then(() => { inval(); if (ok) toast(ok); }).catch((e) => toast((e as Error).message, 'err'));
  const clone = () => c.modules.map((m) => ({ ...m, lessons: [...m.lessons] }));
  const moveLesson = (mi: number, li: number, d: -1 | 1) => {
    const mods = clone();
    const ls = mods[mi].lessons; const j = li + d;
    if (j >= 0 && j < ls.length) { [ls[li], ls[j]] = [ls[j], ls[li]]; }
    else if (j < 0 && mi > 0) { mods[mi - 1].lessons.push(ls.splice(li, 1)[0]); }
    else if (j >= ls.length && mi < mods.length - 1) { mods[mi + 1].lessons.unshift(ls.splice(li, 1)[0]); }
    else return;
    call(order(mods));
  };
  const moveModule = (mi: number, d: -1 | 1) => { const mods = clone(); const j = mi + d; if (j < 0 || j >= mods.length) return; [mods[mi], mods[j]] = [mods[j], mods[mi]]; call(order(mods)); };
  /** رها کردن درس روی درس دیگر (جای آن) یا روی سرِ فصل (اول آن فصل) */
  const dropOn = (targetModule: string, targetLesson: string | null) => {
    const id = drag; setDrag(null); setOver(null);
    if (!id || id === targetLesson) return;
    const mods = clone();
    let moved: ALesson | undefined;
    for (const m of mods) { const i = m.lessons.findIndex((l) => l.id === id); if (i >= 0) moved = m.lessons.splice(i, 1)[0]; }
    if (!moved) return;
    const tm = mods.find((m) => m.id === targetModule)!;
    const at = targetLesson ? tm.lessons.findIndex((l) => l.id === targetLesson) : 0;
    tm.lessons.splice(at < 0 ? tm.lessons.length : at, 0, moved);
    call(order(mods));
  };
  const last = c.modules[c.modules.length - 1];
  const items = parseAparatLines(paste);

  const Gap = ({ m, index }: { m: Mods[number]; index: number }) => {
    const k = `${m.id}:${index}`, open = gap === k;
    return (
      <div className="gap-row grid justify-items-center py-1">
        <button type="button" className="gap-add flex h-7 items-center gap-1.5 rounded-full border border-dashed border-line-strong bg-bg px-3 text-xs text-body" aria-expanded={open} onClick={() => setGap(open ? null : k)}><Plus className="size-3.5" />افزودن این‌جا</button>
        {open && <div className="mt-2 flex max-w-xl flex-wrap justify-center gap-1.5 rounded-2xl border border-line bg-card p-2 shadow-lift">
          {ADD_TYPES.map(([t, label]) => <button key={t} type="button" className={`chip h-8 cursor-pointer px-3 ${TYPE_TINT[t]}`} onClick={() => { setGap(null); addLesson(m.id, index, t); }}>{label}</button>)}
        </div>}
      </div>
    );
  };

  return (
    <section className="grid content-start gap-2" onDragEnd={() => { setDrag(null); setOver(null); }}>
      {c.modules.map((m, mi) => (
        <div key={m.id} className="grid">
          <div className={`flex items-center gap-2 border-b-2 pb-1.5 pt-4 ${over === 'm:' + m.id ? 'border-leaf' : 'border-ink'}`}
            onDragOver={(e) => { if (drag) { e.preventDefault(); setOver('m:' + m.id); } }} onDrop={(e) => { e.preventDefault(); dropOn(m.id, m.lessons[0]?.id ?? null); }}>
            <div className="grid min-w-0 flex-1">
              <span className="text-xs text-muted">فصل {fa(mi + 1)}</span>
              {rename?.id === m.id
                ? <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const t = rename.t.trim(); setRename(null); if (t && t !== m.title) call(api(`/admin/modules/${m.id}`, { method: 'PATCH', body: { title: t } })); }}>
                    <input className="input h-10" value={rename.t} autoFocus onChange={(e) => setRename({ id: m.id, t: e.target.value })} aria-label="عنوان فصل" onBlur={(e) => e.currentTarget.form?.requestSubmit()} /></form>
                : <button type="button" className="truncate text-start text-lg font-extrabold text-ink" onClick={() => setRename({ id: m.id, t: m.title })}>{m.title}</button>}
            </div>
            <button className="btn btn-ghost btn-icon btn-sm" aria-label="تغییر نام فصل" onClick={() => setRename({ id: m.id, t: m.title })}><Pencil className="size-4" /></button>
            <button className="btn btn-ghost btn-icon btn-sm" aria-label="فصل بالاتر" onClick={() => moveModule(mi, -1)} disabled={mi === 0}><ArrowUp className="size-4" /></button>
            <button className="btn btn-ghost btn-icon btn-sm" aria-label="فصل پایین‌تر" onClick={() => moveModule(mi, 1)} disabled={mi === c.modules.length - 1}><ArrowDown className="size-4" /></button>
            {!m.lessons.length && c.modules.length > 1 && <button className="btn btn-ghost btn-icon btn-sm text-rose" aria-label="حذف فصل" onClick={() => call(api(`/admin/modules/${m.id}`, { method: 'DELETE' }), 'فصل حذف شد')}><Trash2 className="size-4" /></button>}
          </div>
          <Gap m={m} index={0} />
          {!m.lessons.length && <p className="rounded-2xl border border-dashed border-line-strong p-5 text-center text-sm text-muted"
            onDragOver={(e) => { if (drag) e.preventDefault(); }} onDrop={(e) => { e.preventDefault(); dropOn(m.id, null); }}>این فصل هنوز درسی ندارد. با «افزودن این‌جا» بساز یا درسی را این‌جا بکش.</p>}
          {m.lessons.map((l, li) => {
            const note = notes[l.id];
            const chip = l.problem ? ['chip chip-flame max-w-56 truncate', `کامل کن: ${l.problem}`] : note ? ['chip tint-deep cover', 'یادداشت ستاد'] : ['chip chip-leaf', 'آماده'];
            return (
              <div key={l.id}>
                <div draggable onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', l.id); } catch { /* */ } setDrag(l.id); }}
                  onDragOver={(e) => { if (drag) { e.preventDefault(); if (over !== l.id) setOver(l.id); } }} onDrop={(e) => { e.preventDefault(); dropOn(m.id, l.id); }}
                  className={`lesson-card card grid ${drag === l.id ? 'is-drag' : ''} ${over === l.id && drag !== l.id ? 'is-over' : ''} ${openId === l.id ? 'border-leaf-ink' : note ? 'border-deep' : ''}`}>
                  <div className="flex items-center gap-1">
                    <span className="cursor-grab ps-2 text-line-strong" aria-hidden="true"><GripVertical className="size-4" /></span>
                    <button type="button" className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-2 py-3 text-start" onClick={() => onOpen(l.id)}>
                      <span className="tnum w-6 shrink-0 text-center text-sm text-muted">{fa(num.get(l.id)!)}</span>
                      <TypeTile type={l.type} />
                      <span className="grid min-w-0 flex-1">
                        <b className="truncate text-ink">{l.title}</b>
                        <span className="truncate text-xs text-muted">{LESSON_LABEL[l.type]}{l.durationSec ? ` · ${minutes(l.durationSec)}` : ''}{!l.required ? ' · اختیاری' : ''}{l.isFinalQuiz ? ' · آزمون پایانی' : ''}{l.type === 'QUIZ' ? ` · ${fa(l.content?.questions?.length ?? 0)} پرسش` : ''}</span>
                      </span>
                      <span className="hidden shrink-0 sm:block"><span className={chip[0]}>{chip[1]}</span></span>
                    </button>
                    <span className="grid pe-1">
                      <button className="btn btn-ghost btn-icon btn-sm h-7" aria-label="بالاتر" onClick={() => moveLesson(mi, li, -1)}><ArrowUp className="size-4" /></button>
                      <button className="btn btn-ghost btn-icon btn-sm h-7" aria-label="پایین‌تر" onClick={() => moveLesson(mi, li, 1)}><ArrowDown className="size-4" /></button>
                    </span>
                  </div>
                  {l.problem && <span className="-mt-1 px-4 pb-3 text-xs font-semibold text-flame-ink sm:hidden">کامل کن: {l.problem}</span>}
                  {note && <div className="mx-4 mb-3 flex flex-wrap items-center gap-3 rounded-xl bg-deep-soft px-3 py-2 text-sm text-deep">
                    <span className="min-w-0 flex-1"><b>یادداشت ستاد: </b>{note}</span>
                    <button className="btn btn-sm h-8 rounded-full border border-deep bg-transparent text-deep" onClick={() => resolve(l.id)}><Check className="size-4" />درستش کردم</button></div>}
                </div>
                <Gap m={m} index={li + 1} />
              </div>
            );
          })}
        </div>
      ))}

      <div className="mt-3 grid gap-3 rounded-3xl border-2 border-dashed border-line-strong bg-card p-5">
        <b className="text-ink">افزودن به آخر دوره</b>
        <div className="flex flex-wrap gap-2">
          <textarea className="input ltr h-12 min-h-12 min-w-0 flex-1 basis-80 resize-y py-2.5 text-sm" dir="auto" rows={1} value={paste} onChange={(e) => setPaste(e.target.value)} aria-label="پیوند آپارات"
            placeholder="پیوند ویدیوی آپارات را این‌جا بچسبان؛ چندتا هم می‌شود، هر کدام یک خط" />
          <button className="btn btn-secondary h-12" disabled={!items.length || items.some((x) => !x.hash)} onClick={() => { setBulk({ moduleId: last.id, kind: 'aparat', text: paste }); setPaste(''); }}><Video className="size-4" />{items.length > 1 ? `افزودن ${fa(items.length)} ویدیو` : 'افزودن ویدیو'}</button>
        </div>
        {items.some((x) => !x.hash) && <p className="err text-sm">خطی که پیوند آپارات نیست را بردار.</p>}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm text-muted">یا:</span>
          <button className="chip tint-dome cover h-8 cursor-pointer px-3" onClick={() => setBulk({ moduleId: last.id, kind: 'audio' })}><Music className="size-3.5" />چند فایل صوتی</button>
          {ADD_TYPES.filter(([t]) => t !== 'VIDEO').map(([t, label]) => <button key={t} type="button" className={`chip h-8 cursor-pointer px-3 ${TYPE_TINT[t]}`} onClick={() => addLesson(last.id, last.lessons.length, t)}>{label}</button>)}
          <button className="chip h-8 cursor-pointer border border-ink bg-card px-3 text-ink" onClick={() => call(api(`/admin/courses/${c.id}/modules`, { body: { title: `فصل ${fa(c.modules.length + 1)}` } }), 'فصل تازه اضافه شد')}><Plus className="size-3.5" />فصل تازه</button>
        </div>
      </div>
      {bulk && <BulkAdd moduleId={bulk.moduleId} kind={bulk.kind} initial={bulk.text} onClose={() => setBulk(null)} onDone={inval} />}
    </section>
  );
}

/* ───────── ویرایشگر درس (در پنل کناری) ───────── */

const aparatHash = (v: string) => { const m = v.trim().match(/aparat\.com\/v\/([A-Za-z0-9]+)/) ?? v.trim().match(/videohash\/([A-Za-z0-9]+)/); return m ? m[1] : v.trim(); };
const rid = () => Math.random().toString(36).slice(2, 8).padEnd(6, '0');

function LessonEditor({ l, skills, note, onResolve, onSaved, onDuplicate, onDelete }: { l: ALesson; skills: ASkill[]; note?: string; onResolve: () => void; onSaved: () => void; onDuplicate: () => void; onDelete: () => void }) {
  const toast = useToast();
  const [title, setTitle] = useState(l.title);
  const [mins, setMins] = useState(Math.round(l.durationSec / 60));
  const [required, setRequired] = useState(l.required);
  const [isFinal, setIsFinal] = useState(l.isFinalQuiz);
  const [content, setContent] = useState<any>(l.content ?? {});
  const [skillIds, setSkillIds] = useState<string[]>((l.skillIds ?? []).filter((x) => skills.some((k) => k.id === x)));
  const [problem, setProblem] = useState<string | null>(l.problem ?? null);
  const save = useMutation({
    mutationFn: () => api<{ problem: string | null }>(`/admin/lessons/${l.id}`, { method: 'PATCH', body: { title, durationSec: mins * 60, required, isFinalQuiz: isFinal, content, ...(skills.length ? { skillIds } : {}) } }),
    onSuccess: (r) => { if (r.problem) { setProblem(r.problem); toast('ذخیره شد، ولی هنوز کامل نیست', 'err'); } else { toast('درس ذخیره شد'); onSaved(); } },
    onError: (e) => toast((e as Error).message, 'err'),
  });
  return (
    <div className="grid gap-5">
      {note && <div className="flex flex-wrap items-center gap-3 rounded-xl bg-deep-soft px-4 py-3 text-sm text-deep"><span className="min-w-0 flex-1"><b>یادداشت ستاد: </b>{note}</span>
        <button className="btn btn-sm h-8 rounded-full border border-deep bg-transparent text-deep" onClick={onResolve}><Check className="size-4" />درستش کردم</button></div>}
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_120px]">
        <div className="field"><label htmlFor="lt">عنوان</label><input id="lt" className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="field"><label htmlFor="lm">مدت (دقیقه)</label><input id="lm" type="number" min={0} className="input tnum" value={mins} onChange={(e) => setMins(Number(e.target.value))} /></div>
      </div>
      <ContentEditor type={l.type} c={content} set={setContent} />
      {['TEXT', 'VIDEO', 'AUDIO'].includes(l.type) && <ChecksBuilder c={content} set={setContent} />}
      <div className="flex flex-wrap gap-5 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" className="size-5" checked={required} onChange={(e) => setRequired(e.target.checked)} />برای تمام کردن دوره لازم است</label>
        {l.type === 'QUIZ' && <label className="flex items-center gap-2"><input type="checkbox" className="size-5" checked={isFinal} onChange={(e) => setIsFinal(e.target.checked)} />آزمون پایانی دوره</label>}
      </div>
      {skills.length > 0 && (
        <fieldset className="grid gap-2 rounded-2xl border border-line p-4">
          <legend className="px-1 text-sm font-bold text-ink">این درس کدام مهارت را می‌سازد؟</legend>
          <div className="flex flex-wrap gap-2">{skills.map((k) => { const on = skillIds.includes(k.id); return (
            <button key={k.id} type="button" aria-pressed={on} onClick={() => setSkillIds(on ? skillIds.filter((x) => x !== k.id) : [...skillIds, k.id])} className={`chip h-9 cursor-pointer px-3.5 ${on ? 'chip-leaf' : ''}`}>{on && '✓ '}{k.title}</button>); })}</div>
        </fieldset>
      )}
      {problem && <p className="flex items-center gap-2 rounded-xl bg-flame-soft px-3 py-2 text-sm font-semibold text-flame-ink"><CircleAlert className="size-4 shrink-0" />کامل کن: {problem}</p>}
      <div className="sticky bottom-0 -mx-5 -mb-5 flex flex-wrap gap-2 border-t border-line bg-card px-5 py-3">
        <button className="btn btn-primary" onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? 'در حال ذخیره…' : 'ذخیره و بستن'}</button>
        <button className="btn btn-ghost" onClick={onDuplicate}><Copy className="size-4" />رونوشت</button>
        <span className="me-auto" />
        <button className="btn btn-ghost text-rose" onClick={onDelete}><Trash2 className="size-4" />حذف درس</button>
      </div>
    </div>
  );
}

/** «فلان عنوان | https://www.aparat.com/v/abc12» یا فقط پیوند؛ عنوان نبود، «ویدیوی n» */
function parseAparatLines(text: string) {
  return text.split('\n').map((l) => l.trim()).filter(Boolean).map((line, i) => {
    const m = line.match(/aparat\.com\/(?:v|video\/video\/embed\/videohash)\/([A-Za-z0-9]{3,20})/);
    const title = line.replace(/https?:\/\/\S+/g, '').replace(/^[\s|:،,\-–—]+|[\s|:،,\-–—]+$/g, '').trim();
    return { line, hash: m?.[1] ?? null, title: title || `ویدیوی ${fa(i + 1)}` };
  });
}
/** نام فایل صوتی به عنوان درس: «03_جلسه سوم.mp3» ← «جلسه سوم» */
const titleFromFile = (name: string) => name.replace(/\.[^.]+$/, '').replace(/^[\d۰-۹\s._\-–]+/, '').replace(/[_]+/g, ' ').trim() || name;

/** ساختن چند درس با هم: چند پیوند آپارات (هر خط یکی) یا چند فایل صوتی؛ به ترتیب، ته همان بخش */
function BulkAdd({ moduleId, kind, initial, onClose, onDone }: { moduleId: string; kind: 'aparat' | 'audio'; initial?: string; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [text, setText] = useState(initial ?? '');
  const [files, setFiles] = useState<File[]>([]);
  const [run, setRun] = useState<{ i: number; n: number; pct?: number } | null>(null);
  const items = kind === 'aparat' ? parseAparatLines(text) : [];
  const bad = items.filter((x) => !x.hash);
  const tooBig = files.filter((f) => f.size > MAX_UPLOAD);
  const n = kind === 'aparat' ? items.length : files.length;
  const ready = n > 0 && !run && (kind === 'aparat' ? !bad.length : !tooBig.length);
  const go = async () => {
    let made = 0;
    try {
      if (kind === 'aparat') {
        for (const [i, it] of items.entries()) {
          setRun({ i: i + 1, n });
          const l = await api<{ id: string }>(`/admin/modules/${moduleId}/lessons`, { body: { title: it.title.slice(0, 160), type: 'VIDEO' } });
          await api(`/admin/lessons/${l.id}`, { method: 'PATCH', body: { content: { provider: 'aparat', aparatHash: it.hash } } });
          made++;
        }
      } else {
        for (const [i, f] of files.entries()) {
          setRun({ i: i + 1, n, pct: 0 });
          const up = await uploadFile<{ key: string }>('/admin/uploads', f, (sent, total) => setRun({ i: i + 1, n, pct: total ? Math.floor((sent / total) * 100) : 0 }));
          const l = await api<{ id: string }>(`/admin/modules/${moduleId}/lessons`, { body: { title: titleFromFile(f.name).slice(0, 160), type: 'AUDIO' } });
          await api(`/admin/lessons/${l.id}`, { method: 'PATCH', body: { content: { fileKey: up.key } } });
          made++;
        }
      }
      toast(`${fa(made)} درس ساخته شد`); onDone(); onClose();
    } catch (e) {
      toast(`${fa(made)} درس ساخته شد؛ بقیه نشد: ${(e as Error).message}`, 'err'); onDone(); setRun(null);
    }
  };
  return (
    <Dialog open onClose={() => { if (!run) onClose(); }} title={kind === 'aparat' ? 'چند ویدیوی آپارات با هم' : 'چند فایل صوتی با هم'}>
      <div className="grid gap-3">
        {kind === 'aparat' ? <>
          <label className="field"><span>پیوندها، هر خط یکی</span>
            <textarea className="input ltr min-h-40 font-mono text-sm" dir="auto" value={text} onChange={(e) => setText(e.target.value)} disabled={!!run} autoFocus placeholder={'جلسهٔ اول: امام و محله | https://www.aparat.com/v/abc12\nhttps://www.aparat.com/v/def34'} />
            <span className="hint">اگر عنوان را کنار پیوند بنویسی، همان عنوان درس می‌شود؛ وگرنه «ویدیوی ۱، ۲…». درس‌ها به همین ترتیب ته این بخش می‌آیند.</span></label>
          {items.length > 0 && <ul className="max-h-48 divide-y divide-line overflow-auto rounded-2xl border border-line text-sm">{items.map((it, i) => <li key={i} className="flex items-center gap-2 px-3 py-2"><span className="tnum w-6 shrink-0 text-muted">{fa(i + 1)}</span><span className="min-w-0 flex-1 truncate text-ink">{it.title}</span>{it.hash ? <span className="ltr shrink-0 text-xs text-muted">{it.hash}</span> : <span className="shrink-0 text-xs font-semibold text-rose">پیوند آپارات نیست</span>}</li>)}</ul>}
        </> : <>
          <label className="btn btn-secondary w-fit"><Music className="size-4" />انتخاب فایل‌ها<input type="file" accept="audio/*" multiple className="sr-only" disabled={!!run} onChange={(e) => { setFiles([...(e.target.files ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'fa', { numeric: true }))); e.target.value = ''; }} /></label>
          <span className="hint">به ترتیب نام فایل چیده می‌شوند؛ عنوان درس از نام فایل می‌آید و بعداً عوض‌شدنی است. هر فایل تا ۵۰۰ مگ.</span>
          {files.length > 0 && <ul className="max-h-48 divide-y divide-line overflow-auto rounded-2xl border border-line text-sm">{files.map((f, i) => <li key={i} className="flex items-center gap-2 px-3 py-2"><span className="tnum w-6 shrink-0 text-muted">{fa(i + 1)}</span><span className="min-w-0 flex-1 truncate text-ink">{titleFromFile(f.name)}</span><span className={`tnum shrink-0 text-xs ${f.size > MAX_UPLOAD ? 'font-semibold text-rose' : 'text-muted'}`}>{mb(f.size)} مگ</span></li>)}</ul>}
        </>}
        {run && <div className="grid gap-2" role="status" aria-live="polite"><span className="text-sm text-ink">{kind === 'aparat' ? `ساختن درس ${fa(run.i)} از ${fa(run.n)}…` : `بارگذاری فایل ${fa(run.i)} از ${fa(run.n)} · ${fa(run.pct ?? 0)}٪`}</span>
          <div className="h-2 overflow-hidden rounded-full bg-sunken"><div className="h-full rounded-full bg-leaf transition-[width]" style={{ width: `${Math.round((((run.i - 1) + (run.pct ?? 100) / 100) / run.n) * 100)}%` }} /></div>
          <p className="hint">تا تمام نشده صفحه را نبند.</p></div>}
        <div className="flex gap-2"><button className="btn btn-primary" disabled={!ready} onClick={go}>{n ? `ساختن ${fa(n)} درس` : 'ساختن درس‌ها'}</button>{!run && <button className="btn btn-ghost" onClick={onClose}>انصراف</button>}</div>
      </div>
    </Dialog>
  );
}

const MAX_UPLOAD = 500 * 1024 * 1024;
const mb = (n: number) => fa(Math.round(n / 1024 / 1024));
/** بارگذاری فایل درس با نوار پیشرفت؛ تا تمام نشده، بستن صفحه هشدار می‌دهد */
function Uploader({ accept, onDone, label }: { accept: string; onDone: (key: string, name: string) => void; label: string }) {
  const [prog, setProg] = useState<{ sent: number; total: number; name: string } | null>(null);
  const ctl = useRef<AbortController | null>(null);
  const toast = useToast();
  useEffect(() => {
    if (!prog) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [!!prog]);
  const start = async (f: File) => {
    if (f.size > MAX_UPLOAD) { toast(`این فایل ${mb(f.size)} مگ است؛ حداکثر ۵۰۰ مگ. با کیفیت 720p خروجی بگیر یا در آپارات بگذار.`, 'err'); return; }
    ctl.current = new AbortController();
    setProg({ sent: 0, total: f.size, name: f.name });
    try {
      const r = await uploadFile<{ key: string; name: string }>('/admin/uploads', f, (sent, total) => setProg({ sent, total, name: f.name }), ctl.current.signal);
      onDone(r.key, r.name); toast('فایل بارگذاری شد؛ حالا «ذخیرهٔ درس» را بزن');
    } catch (er) { if ((er as ApiError).code !== 'aborted') toast((er as Error).message, 'err'); }
    finally { setProg(null); ctl.current = null; }
  };
  if (prog) {
    const pct = prog.total ? Math.min(100, Math.floor((prog.sent / prog.total) * 100)) : 0;
    return (
      <div className="grid gap-2 rounded-2xl border border-line p-4" role="status" aria-live="polite">
        <div className="flex items-center gap-3 text-sm"><b className="min-w-0 flex-1 truncate text-ink" dir="auto">{prog.name}</b><span className="tnum shrink-0 text-muted">{pct === 100 ? 'در حال ذخیره…' : `${fa(pct)}٪ · ${mb(prog.sent)} از ${mb(prog.total)} مگ`}</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-sunken" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><div className="h-full rounded-full bg-leaf transition-[width]" style={{ width: `${pct}%` }} /></div>
        <div className="flex items-center gap-3"><p className="hint me-auto">تا تمام نشده صفحه را نبند.</p>{pct < 100 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => ctl.current?.abort()}>لغو</button>}</div>
      </div>
    );
  }
  return (
    <label className="btn btn-secondary w-fit">
      <Upload className="size-4" />{label}
      <input type="file" accept={accept} className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) start(f); }} />
    </label>
  );
}

/** متن درس با دکمه‌های قالب (تیتر، پررنگ، فهرست، نکته) و پیش‌نمایش همان‌طور که کنشگر می‌بیند */
function TextEditor({ c, set }: { c: any; set: (c: any) => void }) {
  const ta = useRef<HTMLTextAreaElement>(null);
  const [view, setView] = useState(false);
  const body = String(c.body ?? '');
  const fmt = (k: 'h' | 'b' | 'li' | 'q') => { const el = ta.current; if (!el) return; set({ ...c, body: applyFormat(el, k) }); el.focus(); };
  const readMin = Math.max(1, Math.ceil(body.length / 900));
  return (
    <>
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <b className="me-auto text-sm text-ink">متن درس</b>
          <div className="seg seg-pill">{[[false, 'نوشتن'], [true, 'پیش‌نمایش']].map(([v, t]) => <button key={String(v)} type="button" aria-pressed={view === v} onClick={() => setView(v as boolean)}>{t as string}</button>)}</div>
        </div>
        {view ? <div className="min-h-64 rounded-2xl border border-line p-4">{body.trim() ? <RichText body={body} /> : <p className="text-sm text-muted">هنوز متنی نیست.</p>}</div> : <>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" className="btn btn-secondary btn-sm h-8 font-extrabold" onClick={() => fmt('h')}>تیتر</button>
            <button type="button" className="btn btn-secondary btn-sm h-8 font-extrabold" onClick={() => fmt('b')}>پررنگ</button>
            <button type="button" className="btn btn-secondary btn-sm h-8" onClick={() => fmt('li')}>فهرست</button>
            <button type="button" className="btn btn-secondary btn-sm h-8" onClick={() => fmt('q')}>نکتهٔ برجسته</button>
          </div>
          <textarea ref={ta} id="body" aria-label="متن درس" className="input min-h-72 leading-8" value={body} onChange={(e) => set({ ...c, body: e.target.value })} placeholder="متن درس را این‌جا بنویس یا از Word بچسبان. بین بندها یک خط خالی بگذار." />
          <span className="hint">چند کلمه را انتخاب کن و «پررنگ» را بزن، یا نشانگر را در یک خط بگذار و «تیتر» یا «فهرست» را بزن.{body.trim() ? ` زمان خواندن: حدود ${fa(readMin)} دقیقه.` : ''}</span>
        </>}
      </div>
      <div className="field"><label htmlFor="kp">نکته‌های کلیدی <span className="font-normal text-muted">(هر خط یکی؛ اختیاری)</span></label><textarea id="kp" className="input" value={(c.keyPoints ?? []).join('\n')} onChange={(e) => set({ ...c, keyPoints: e.target.value.split('\n').filter((x) => x.trim()) })} /></div>
    </>
  );
}

function ContentEditor({ type, c, set }: { type: LessonType; c: any; set: (c: any) => void }) {
  switch (type) {
    case 'TEXT': return <TextEditor c={c} set={set} />;
    case 'VIDEO': return (
      <div className="grid gap-4">
        <div className="seg w-fit">{[['aparat', 'آپارات'], ['file', 'فایل روی سرور مدرسه']].map(([k, t]) => <button type="button" key={k} aria-pressed={c.provider === k} onClick={() => set({ ...c, provider: k })}>{t}</button>)}</div>
        {c.provider === 'file'
          ? <div className="grid gap-2"><Uploader accept="video/mp4,video/webm" label="بارگذاری ویدیو" onDone={(key) => set({ ...c, fileKey: key })} />{c.fileKey && <span className="hint">فایل: {c.fileKey}</span>}<p className="hint">ویدیوی روی سرور مدرسه جای پخش را ذخیره می‌کند و با ۹۰٪ دیدن، درس خودکار تمام می‌شود.</p></div>
          : <div className="field"><label htmlFor="ap">پیوند ویدیو در آپارات</label><input id="ap" className="input ltr" placeholder="https://www.aparat.com/v/abc123" value={c.aparatHash ?? ''} onChange={(e) => set({ ...c, aparatHash: aparatHash(e.target.value) })} />
              <span className="hint">پیوند صفحهٔ ویدیو را بچسبانید؛ شناسه‌اش خودکار برداشته می‌شود.{c.aparatHash ? ` شناسه: ${c.aparatHash}` : ''}</span>
              <p className="rounded-xl bg-flame-soft p-3 text-sm text-ink"><b className="text-flame-ink">توجه: </b>ویدیوی آپارات پایان خودکار و پرسش وسط ویدیو ندارد؛ کنشگر خودش «دیدم» را می‌زند. برای ویدیوهای کوتاه و کلیدی که دیده شدنشان مهم است، «فایل روی سرور مدرسه» را انتخاب کنید.</p></div>}
        <div className="field"><label htmlFor="sm">خلاصه <span className="font-normal text-muted">(اختیاری)</span></label><textarea id="sm" className="input" value={c.summary ?? ''} onChange={(e) => set({ ...c, summary: e.target.value })} /></div>
      </div>
    );
    case 'AUDIO': return (
      <div className="grid gap-3">
        <Uploader accept="audio/*" label="بارگذاری فایل صوتی" onDone={(key) => set({ ...c, fileKey: key })} />
        {c.fileKey && <audio src={`/api/files/${c.fileKey}`} controls className="w-full" />}
        <div className="field"><label htmlFor="sm">خلاصه <span className="font-normal text-muted">(اختیاری)</span></label><textarea id="sm" className="input" value={c.summary ?? ''} onChange={(e) => set({ ...c, summary: e.target.value })} /></div>
      </div>
    );
    case 'WORKSHEET': return (
      <div className="grid gap-3">
        <div className="field"><label htmlFor="pr">توضیح برگه</label><textarea id="pr" className="input" value={c.prompt ?? ''} onChange={(e) => set({ ...c, prompt: e.target.value })} /></div>
        <b className="text-sm text-ink">خانه‌های برگه</b>
        {(c.fields ?? []).map((f: any, i: number) => (
          <div key={f.id} className="flex gap-2"><input className="input" value={f.label} placeholder="پرسش یا عنوان خانه" onChange={(e) => set({ ...c, fields: c.fields.map((x: any, j: number) => j === i ? { ...x, label: e.target.value } : x) })} />
            <button type="button" className="btn btn-ghost btn-icon" aria-label="حذف" onClick={() => set({ ...c, fields: c.fields.filter((_: any, j: number) => j !== i) })}><X className="size-4" /></button></div>
        ))}
        <button type="button" className="btn btn-secondary btn-sm w-fit" onClick={() => set({ ...c, fields: [...(c.fields ?? []), { id: rid(), label: '' }] })}><Plus className="size-4" />خانهٔ تازه</button>
      </div>
    );
    case 'MISSION': return (
      <div className="grid gap-3">
        <div className="field"><label htmlFor="g">هدف مأموریت</label><textarea id="g" className="input" value={c.goal ?? ''} onChange={(e) => set({ ...c, goal: e.target.value })} /></div>
        <div className="field"><label htmlFor="stp">قدم‌ها <span className="font-normal text-muted">(هر خط یک قدم)</span></label><textarea id="stp" className="input" value={(c.steps ?? []).join('\n')} onChange={(e) => set({ ...c, steps: e.target.value.split('\n').filter((x) => x.trim()) })} /></div>
      </div>
    );
    case 'QUIZ': return <QuizBuilder c={c} set={set} />;
    case 'PRACTICE': return <PracticeBuilder c={c} set={set} />;
    case 'TOOL': return <ToolPick c={c} set={set} />;
    case 'LIVE': return <LivePick c={c} set={set} />;
    default: return <p className="text-muted">ویرایشگر این نوع درس در مرحلهٔ بعد ساخته می‌شود.</p>;
  }
}

const SCORE: [number, string][] = [[2, 'بهترین'], [1, 'قابل قبول'], [0, 'ضعیف']];
/** سازندهٔ تمرین (سناریوی تصمیم): موقعیت‌ها، و برای هر کدام چند انتخاب با بازخورد */
function PracticeBuilder({ c, set }: { c: any; set: (c: any) => void }) {
  const steps: any[] = c.steps ?? [];
  const upd = (i: number, v: any) => set({ ...c, steps: steps.map((x, j) => (j === i ? v : x)) });
  return (
    <div className="grid gap-4">
      <div className="field"><label htmlFor="pin">مقدمهٔ تمرین <span className="font-normal text-muted">(اختیاری)</span></label><textarea id="pin" className="input" value={c.intro ?? ''} onChange={(e) => set({ ...c, intro: e.target.value })} /></div>
      {steps.map((st, i) => (
        <div key={st.id} className="grid gap-3 rounded-2xl border border-line p-4">
          <div className="flex items-center gap-2"><b className="me-auto text-ink">موقعیت {fa(i + 1)}</b>
            <button type="button" className="btn btn-ghost btn-icon" aria-label={`حذف موقعیت ${fa(i + 1)}`} onClick={() => set({ ...c, steps: steps.filter((_, j) => j !== i) })}><X className="size-4" /></button></div>
          <textarea className="input" placeholder="موقعیت را کوتاه و واقعی بنویسید" value={st.situation} onChange={(e) => upd(i, { ...st, situation: e.target.value })} />
          {(st.choices ?? []).map((ch: any, k: number) => {
            const setCh = (v: any) => upd(i, { ...st, choices: st.choices.map((x: any, m: number) => (m === k ? v : x)) });
            return (
              <div key={ch.id} className="grid gap-2 rounded-xl bg-sunken p-3">
                <div className="flex gap-2"><input className="input" placeholder={`انتخاب ${fa(k + 1)}`} value={ch.text} onChange={(e) => setCh({ ...ch, text: e.target.value })} />
                  <select className="input w-auto" aria-label="ارزش این انتخاب" value={ch.score} onChange={(e) => setCh({ ...ch, score: Number(e.target.value) })}>{SCORE.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select>
                  <button type="button" className="btn btn-ghost btn-icon" aria-label="حذف انتخاب" onClick={() => upd(i, { ...st, choices: st.choices.filter((_: any, m: number) => m !== k) })}><X className="size-4" /></button></div>
                <textarea className="input min-h-16" placeholder="بازخورد این انتخاب: چرا خوب است یا چه خطری دارد" value={ch.feedback} onChange={(e) => setCh({ ...ch, feedback: e.target.value })} />
              </div>
            );
          })}
          <button type="button" className="btn btn-secondary btn-sm w-fit" onClick={() => upd(i, { ...st, choices: [...(st.choices ?? []), { id: rid(), text: '', score: 1, feedback: '' }] })}><Plus className="size-4" />انتخاب تازه</button>
        </div>
      ))}
      <button type="button" className="btn btn-secondary w-fit" onClick={() => set({ ...c, steps: [...steps, { id: rid(), situation: '', choices: [{ id: rid(), text: '', score: 2, feedback: '' }, { id: rid(), text: '', score: 0, feedback: '' }] }] })}><Plus className="size-4" />موقعیت تازه</button>
      <p className="hint">تمرین نمره ندارد. کنشگر در هر موقعیت انتخاب می‌کند و بازخورد همان انتخاب را می‌بیند؛ با پاسخ به همهٔ موقعیت‌ها درس تمام می‌شود. در هر موقعیت دست‌کم یک انتخاب «بهترین» لازم است.</p>
    </div>
  );
}

function LivePick({ c, set }: { c: any; set: (c: any) => void }) {
  const evs = useQuery({ queryKey: ['manage-events'], queryFn: () => api<{ id: string; title: string; kind: string; startsAt: string; status: string; useBbb?: boolean }[]>('/manage/events') });
  const online = (evs.data ?? []).filter((e) => e.kind === 'ONLINE' && e.status !== 'CANCELLED');
  return (
    <div className="grid gap-2">
      <div className="field"><label htmlFor="lv">برنامهٔ آنلاین</label>
        <select id="lv" className="input" value={c.eventId ?? ''} onChange={(e) => set({ ...c, eventId: e.target.value })}><option value="">انتخاب کنید</option>
          {online.map((e) => <option key={e.id} value={e.id}>{e.title} — {jDate(e.startsAt)}{e.useBbb ? '' : ' (پیوند بیرونی)'}{e.status === 'DRAFT' ? ' (پیش‌نویس)' : ''}</option>)}</select></div>
      <p className="hint">اول برنامهٔ آنلاین را در «برنامه‌ها» بسازید. یادگیرنده از همین درس ثبت‌نام و وارد کلاس می‌شود؛ با حضور دست‌کم نیمی از زمان یا دیدن ضبط، درس تمام می‌شود. برای سنجش حضور، «کلاس روی سرور مدرسه» را انتخاب کنید.</p>
    </div>
  );
}

function ToolPick({ c, set }: { c: any; set: (c: any) => void }) {
  const tools = useTools(true);
  return (
    <div className="grid gap-2">
      <div className="field"><label htmlFor="tl">ابزار</label>
        <select id="tl" className="input" value={c.toolId ?? ''} onChange={(e) => set({ ...c, toolId: e.target.value })}><option value="">انتخاب کنید</option>
          {tools.data?.categories.map((cat) => <optgroup key={cat.id} label={cat.title}>{tools.data!.tools.filter((t) => t.cat === cat.id).map((t) => <option key={t.id} value={t.id}>{t.t}{t.published ? '' : ' (منتشر نشده)'}</option>)}</optgroup>)}</select></div>
      <p className="hint">کنشگر در این درس یک «کار» تازه از این ابزار پر می‌کند که در «کارهای من» هم می‌ماند؛ با پر کردنش درس تمام می‌شود.</p>
    </div>
  );
}

export function QuizBuilder({ c, set }: { c: any; set: (c: any) => void }) {
  const qs: any[] = c.questions ?? [];
  const up = (i: number, q: any) => set({ ...c, questions: qs.map((x, j) => (j === i ? q : x)) });
  return (
    <div className="grid gap-4">
      {qs.map((q, i) => (
        <div key={q.id} className="rounded-2xl border border-line p-4">
          <div className="mb-2 flex items-center gap-2"><b className="text-ink">پرسش {fa(i + 1)}</b>
            <select className="input ms-auto h-9 w-auto text-sm" value={q.kind} onChange={(e) => up(i, { ...q, kind: e.target.value, correct: e.target.value === 'multi' ? q.correct : q.correct.slice(0, 1) })}><option value="single">تک‌گزینه‌ای</option><option value="multi">چندپاسخی</option><option value="tf">درست / نادرست</option></select>
            <button type="button" className="btn btn-ghost btn-icon btn-sm text-rose" aria-label="حذف پرسش" onClick={() => set({ ...c, questions: qs.filter((_, j) => j !== i) })}><Trash2 className="size-4" /></button></div>
          <textarea className="input min-h-16" placeholder="متن پرسش" value={q.text} onChange={(e) => up(i, { ...q, text: e.target.value })} />
          <div className="mt-3 grid gap-2">
            {q.options.map((o: any, oi: number) => {
              const right = q.correct.includes(o.id);
              return (
                <div key={o.id} className="flex items-center gap-2">
                  <button type="button" aria-pressed={right} title="گزینهٔ درست" onClick={() => up(i, { ...q, correct: q.kind === 'multi' ? (right ? q.correct.filter((x: string) => x !== o.id) : [...q.correct, o.id]) : [o.id] })}
                    className={`grid size-8 shrink-0 place-items-center rounded-full border-2 text-xs font-bold ${right ? 'border-leaf bg-leaf text-white' : 'border-line-strong text-muted'}`}>{right ? '✓' : fa(oi + 1)}</button>
                  <input className="input h-10" value={o.text} placeholder={`گزینهٔ ${fa(oi + 1)}`} onChange={(e) => up(i, { ...q, options: q.options.map((x: any) => x.id === o.id ? { ...x, text: e.target.value } : x) })} readOnly={q.kind === 'tf'} />
                  {q.kind !== 'tf' && q.options.length > 2 && <button type="button" className="btn btn-ghost btn-icon btn-sm" aria-label="حذف گزینه" onClick={() => up(i, { ...q, options: q.options.filter((x: any) => x.id !== o.id), correct: q.correct.filter((x: string) => x !== o.id) })}><X className="size-4" /></button>}
                </div>
              );
            })}
            {q.kind !== 'tf' && q.options.length < 6 && <button type="button" className="btn btn-ghost btn-sm w-fit" onClick={() => up(i, { ...q, options: [...q.options, { id: rid(), text: '' }] })}><Plus className="size-4" />گزینهٔ تازه</button>}
          </div>
          <p className="hint mt-1">روی دایرهٔ کنار گزینهٔ درست بزنید.</p>
          <input className="input mt-2 h-10" placeholder="توضیح پس از پاسخ (چرا این گزینه درست است)" value={q.explain ?? ''} onChange={(e) => up(i, { ...q, explain: e.target.value })} />
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => set({ ...c, questions: [...qs, { id: rid(), kind: 'single', text: '', options: [{ id: rid(), text: '' }, { id: rid(), text: '' }, { id: rid(), text: '' }], correct: [], explain: '' }] })}><Plus className="size-4" />پرسش چندگزینه‌ای</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => { const t = rid(), f = rid(); set({ ...c, questions: [...qs, { id: rid(), kind: 'tf', text: '', options: [{ id: t, text: 'درست' }, { id: f, text: 'نادرست' }], correct: [], explain: '' }] }); }}><Plus className="size-4" />درست / نادرست</button>
      </div>
    </div>
  );
}

/** مهارت‌های دوره: تسلط به‌جای نمره. هر مهارت به چند درس وصل می‌شود. */
function SkillsEditor({ c, save, saving }: { c: FullCourse; save: (s: ASkill[]) => void; saving: boolean }) {
  const [list, setList] = useState<ASkill[]>(c.skills ?? []);
  const [t, setT] = useState('');
  useEffect(() => setList(c.skills ?? []), [c.skills]);
  const count = (id: string) => c.modules.flatMap((m) => m.lessons).filter((l) => (l.skillIds ?? []).includes(id)).length;
  const dirty = JSON.stringify(list) !== JSON.stringify(c.skills ?? []);
  const add = () => { const v = t.trim(); if (v.length < 2) return; setList([...list, { id: rid(), title: v.slice(0, 80) }]); setT(''); };
  return (
    <section className="card grid gap-4 p-5">
      <div><h2 className="text-base font-extrabold">مهارت‌ها</h2><p className="mt-1 text-sm text-muted">کنشگر به‌جای نمره، مهارت‌هایی را می‌بیند که بلد شده. هر مهارت را در ویرایش درس‌ها به درس‌هایش وصل کنید.</p></div>
      {list.length > 0 && <ul className="grid gap-2">{list.map((k, i) => (
        <li key={k.id} className="flex items-center gap-2">
          <input className="input h-10 flex-1" value={k.title} maxLength={80} aria-label={`نام مهارت ${fa(i + 1)}`} onChange={(e) => setList(list.map((x) => (x.id === k.id ? { ...x, title: e.target.value } : x)))} />
          <span className={`shrink-0 text-xs ${count(k.id) ? 'text-muted' : 'text-rose-ink'}`}>{count(k.id) ? `${fa(count(k.id))} درس` : 'بی‌درس'}</span>
          <button type="button" className="btn btn-ghost btn-icon btn-sm text-rose" aria-label={`حذف مهارت ${k.title}`} onClick={() => setList(list.filter((x) => x.id !== k.id))}><Trash2 className="size-4" /></button>
        </li>))}</ul>}
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <input className="input h-10 flex-1" placeholder="مثلاً: شروع گفت‌وگو با نوجوان" value={t} maxLength={80} onChange={(e) => setT(e.target.value)} aria-label="نام مهارت تازه" />
        <button className="btn btn-secondary btn-sm h-10" disabled={t.trim().length < 2}><Plus className="size-4" />افزودن</button>
      </form>
      {dirty && <div className="flex flex-wrap items-center gap-2"><button className="btn btn-primary btn-sm" disabled={saving || list.some((k) => k.title.trim().length < 2)} onClick={() => save(list.map((k) => ({ ...k, title: k.title.trim() })))}>ذخیرهٔ مهارت‌ها</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setList(c.skills ?? [])}>برگرداندن</button>
        {list.length < (c.skills ?? []).length && <span className="hint">مهارت حذف‌شده از درس‌ها هم برداشته می‌شود.</span>}</div>}
    </section>
  );
}

/** پرسش‌های کوتاه وسط درس (یادگیری فعال): تک‌پاسخی، حداکثر ۵، بی‌نمره */
function ChecksBuilder({ c, set }: { c: any; set: (c: any) => void }) {
  const qs: any[] = c.checks ?? [];
  const put = (next: any[]) => set({ ...c, checks: next.length ? next : undefined });
  const up = (i: number, q: any) => put(qs.map((x, j) => (j === i ? q : x)));
  return (
    <fieldset className="grid gap-3 rounded-2xl border border-line p-4">
      <legend className="px-1 text-sm font-bold text-ink">پرسش کوتاه وسط درس <span className="font-normal text-muted">(اختیاری)</span></legend>
      <p className="hint -mt-1">یک یا دو پرسش ساده که کنشگر را به فکر کردن وادارد. نمره ندارد و پاسخ فوری می‌گیرد.</p>
      {qs.map((q, i) => (
        <div key={q.id} className="grid gap-2 rounded-xl bg-sunken p-3">
          <div className="flex items-center gap-2"><b className="text-sm text-ink">پرسش {fa(i + 1)}</b>
            <button type="button" className="btn btn-ghost btn-icon btn-sm ms-auto text-rose" aria-label="حذف پرسش" onClick={() => put(qs.filter((_, j) => j !== i))}><Trash2 className="size-4" /></button></div>
          <input className="input h-10" placeholder="متن پرسش" value={q.text} onChange={(e) => up(i, { ...q, text: e.target.value })} />
          {q.options.map((o: any, oi: number) => { const right = q.correct.includes(o.id); return (
            <div key={o.id} className="flex items-center gap-2">
              <button type="button" aria-pressed={right} title="گزینهٔ درست" onClick={() => up(i, { ...q, correct: [o.id] })}
                className={`grid size-8 shrink-0 place-items-center rounded-full border-2 text-xs font-bold ${right ? 'border-leaf bg-leaf text-white' : 'border-line-strong text-muted'}`}>{right ? '✓' : fa(oi + 1)}</button>
              <input className="input h-10" value={o.text} placeholder={`گزینهٔ ${fa(oi + 1)}`} onChange={(e) => up(i, { ...q, options: q.options.map((x: any) => (x.id === o.id ? { ...x, text: e.target.value } : x)) })} />
              {q.options.length > 2 && <button type="button" className="btn btn-ghost btn-icon btn-sm" aria-label="حذف گزینه" onClick={() => up(i, { ...q, options: q.options.filter((x: any) => x.id !== o.id), correct: q.correct.filter((x: string) => x !== o.id) })}><X className="size-4" /></button>}
            </div>); })}
          {q.options.length < 4 && <button type="button" className="btn btn-ghost btn-sm w-fit" onClick={() => up(i, { ...q, options: [...q.options, { id: rid(), text: '' }] })}><Plus className="size-4" />گزینهٔ تازه</button>}
          <input className="input h-10" placeholder="توضیح کوتاه پس از پاسخ" value={q.explain ?? ''} onChange={(e) => up(i, { ...q, explain: e.target.value })} />
        </div>
      ))}
      {qs.length < 5 && <button type="button" className="btn btn-secondary btn-sm w-fit" onClick={() => put([...qs, { id: rid(), text: '', options: [{ id: rid(), text: '' }, { id: rid(), text: '' }], correct: [], explain: '' }])}><Plus className="size-4" />پرسش کوتاه</button>}
    </fieldset>
  );
}
