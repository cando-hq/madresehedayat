/*
 * ستاد: صف بازبینی (مسیر، دوره، پخش زنده، برگزارکنندهٔ تازه) و فهرست برگزارکنندگان.
 * ستاد بازبین است، نه سازنده: هر چیزی یک بار پیش از انتشار این‌جا دیده می‌شود.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, CheckCircle2, Eye } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Empty, Spinner, useToast } from '../../components/ui';
import { api } from '../../lib/api';
import { fa, jDate, jShort } from '../../lib/fa';

interface Item { kind: 'path' | 'course' | 'live' | 'publisher'; id: string; title: string; kindFa: string; publisher: { name: string; color: string } | null; submittedAt: string; facts: [string, string][]; checks: string[]; preview: string | null }
const KC: Record<string, string> = { path: 'chip-dome', course: 'chip-flame', live: 'chip-rose', publisher: '' };

export function ReviewQueue() {
  const qc = useQueryClient();
  const toast = useToast();
  const q = useQuery({ queryKey: ['v2', 'admin', 'review'], queryFn: () => api<{ items: Item[]; stats: { queue: number; publishers: number; growthThisSeason: number } }>('/v2/admin/review') });
  const [sel, setSel] = useState(0);
  const [note, setNote] = useState('');
  const [ticks, setTicks] = useState<Record<string, boolean>>({});
  const act = useMutation({
    mutationFn: ({ it, action }: { it: Item; action: 'publish' | 'return' }) => api(`/v2/admin/review/${it.kind}/${it.id}`, { body: { action, note } }),
    onSuccess: (_r, v) => { qc.invalidateQueries({ queryKey: ['v2'] }); setNote(''); setTicks({}); setSel(0); toast(v.action === 'publish' ? 'منتشر شد' : 'برگشت با دلیل'); },
  });
  if (q.isLoading) return <Spinner />;
  const d = q.data!;
  const cur = d.items[Math.min(sel, d.items.length - 1)];
  return (
    <div className="grid gap-6">
      <header><h1 className="text-2xl font-extrabold">صف بازبینی</h1><p className="mt-1 text-muted">هر مسیر، دوره و پخش زنده پیش از انتشار یک بار این‌جا دیده می‌شود. ستاد بازبین است، نه سازنده.</p></header>
      <div className="grid gap-3 sm:grid-cols-3">{[['در صف بازبینی', d.stats.queue], ['برگزارکنندهٔ فعال', d.stats.publishers], ['گام رشد تأییدشده، این فصل', d.stats.growthThisSeason]].map(([t, v]) => <div key={t as string} className="stat card p-4"><span className="text-sm text-muted">{t}</span><b className="n block">{fa(v as number)}</b></div>)}</div>
      {!d.items.length ? <Empty icon={CheckCircle2} title="هیچ موردی منتظر نیست">هر چه برسد، همین‌جا می‌آید.</Empty> : (
        <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
          <div className="card grid gap-1 p-2">{d.items.map((it, i) => <button key={it.kind + it.id} type="button" aria-pressed={i === sel} onClick={() => { setSel(i); setTicks({}); setNote(''); }} className={`grid gap-1 rounded-xl px-3 py-2.5 text-start ${i === sel ? 'bg-deep-soft' : 'hover:bg-sunken'}`}><span className="flex items-center gap-2"><span className={`chip ${KC[it.kind]}`}>{it.kindFa}</span><span className="text-xs text-muted">{it.publisher?.name ?? ''}</span><span className="ms-auto text-xs text-muted">{jShort(it.submittedAt)}</span></span><b className="text-sm text-ink">{it.title}</b></button>)}</div>
          {cur && (
            <div className="card grid gap-4 p-5">
              <div><span className="text-sm text-muted">{cur.kindFa}{cur.publisher ? `، ${cur.publisher.name}` : ''}، رسیده {jDate(cur.submittedAt)}</span><h2 className="text-xl font-extrabold">{cur.title}</h2></div>
              <div className="grid gap-2 sm:grid-cols-3">{cur.facts.map(([k, v]) => <div key={k} className="rounded-xl bg-sunken p-3"><span className="text-xs text-muted">{k}</span><b className="block text-sm text-ink">{k === 'زمان' ? jDate(v) : v}</b></div>)}</div>
              <div className="grid gap-2"><b className="text-sm text-ink">چک‌لیست بازبینی</b>{cur.checks.map((c) => <label key={c} className="flex items-center gap-3 rounded-xl bg-sunken px-3 py-2.5 text-sm"><input type="checkbox" className="size-5 accent-[var(--leaf)]" checked={!!ticks[c]} onChange={(e) => setTicks({ ...ticks, [c]: e.target.checked })} />{c}</label>)}</div>
              <label className="field"><span>یادداشت برای برگزارکننده (برای برگرداندن، اجباری)</span><textarea className="input min-h-[80px] py-2" value={note} onChange={(e) => setNote(e.target.value)} /></label>
              <div className="flex flex-wrap gap-2">{cur.preview && <Link to={cur.preview} className="btn btn-ghost"><Eye className="size-4" />پیش‌نمایش از دید کنشگر</Link>}<button className="btn btn-primary" disabled={act.isPending || !cur.checks.every((c) => ticks[c])} onClick={() => act.mutate({ it: cur, action: 'publish' })}>{cur.kind === 'publisher' ? 'بپذیر' : 'منتشر کن'}</button><button className="btn btn-secondary text-rose" disabled={act.isPending || !note.trim()} onClick={() => act.mutate({ it: cur, action: 'return' })}>برگردان برای اصلاح</button>{!cur.checks.every((c) => ticks[c]) && <span className="self-center text-xs text-muted">برای انتشار همهٔ چک‌لیست باید تیک بخورد</span>}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface PubRow { id: string; name: string; color: string; status: string; kind: string; referrer: string; createdAt: string; paths: number; courses: number; learners: number; admins: string[]; note?: string | null }
const PST: Record<string, [string, string]> = { ACTIVE: ['فعال', 'chip-leaf'], PENDING: ['در انتظار پذیرش', 'chip-flame'], BLOCKED: ['مسدود', 'chip-rose'], REJECTED: ['رد شده', 'chip-rose'] };

export function Publishers() {
  const qc = useQueryClient();
  const toast = useToast();
  const q = useQuery({ queryKey: ['v2', 'admin', 'publishers'], queryFn: () => api<PubRow[]>('/v2/admin/publishers') });
  const [name, setName] = useState(''); const [admin, setAdmin] = useState<{ id: string; mobile: string } | null>(null);
  const create = useMutation({ mutationFn: () => api('/v2/admin/publishers', { body: { name } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['v2', 'admin', 'publishers'] }); setName(''); toast('برگزارکننده اضافه شد؛ حالا مدیرش را با شماره تعیین کن'); } });
  const patch = useMutation({ mutationFn: (b: { id: string; status?: string; note?: string; adminMobile?: string }) => api(`/v2/admin/publishers/${b.id}`, { method: 'PATCH', body: b }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['v2', 'admin', 'publishers'] }); setAdmin(null); toast('ذخیره شد'); } });
  if (q.isLoading) return <Spinner />;
  return (
    <div className="grid gap-6">
      <header><h1 className="text-2xl font-extrabold">برگزارکنندگان</h1><p className="mt-1 text-muted">برگزارکننده می‌سازد؛ ستاد می‌پذیرد، بازبینی می‌کند و در صورت لزوم با دلیل مسدود می‌کند. محتوای منتشرشدهٔ برگزارکنندهٔ مسدود برای کنشگرانِ در حرکت می‌ماند.</p></header>
      <div className="card divide-y divide-line">{(q.data ?? []).map((p) => { const [t, c] = PST[p.status] ?? [p.status, '']; return (
        <div key={p.id} className="grid gap-2 px-4 py-3 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl text-white" style={{ background: p.color }}><Building2 className="size-5" /></span><span className="min-w-0"><b className="block text-ink">{p.name}</b><span className="text-sm text-muted">{p.kind}، معرف: {p.referrer}، {fa(p.paths)} مسیر، {fa(p.courses)} دوره، {fa(p.learners)} کنشگر{p.admins.length ? `، مدیر: ${p.admins.join('، ')}` : '، بی مدیر'}</span></span></div>
          <div className="flex flex-wrap items-center gap-2"><span className={`chip ${c}`}>{t}</span>
            {p.status === 'PENDING' && <button className="btn btn-primary btn-sm" onClick={() => patch.mutate({ id: p.id, status: 'ACTIVE' })}>بپذیر</button>}
            {p.status === 'ACTIVE' && <button className="btn btn-ghost btn-sm text-rose" onClick={() => { const note = prompt('دلیل مسدود کردن (اجباری):'); if (note?.trim()) patch.mutate({ id: p.id, status: 'BLOCKED', note }); }}>مسدود کن</button>}
            {p.status === 'BLOCKED' && <button className="btn btn-ghost btn-sm" onClick={() => patch.mutate({ id: p.id, status: 'ACTIVE' })}>باز کن</button>}
            <button className="btn btn-secondary btn-sm" onClick={() => setAdmin({ id: p.id, mobile: '' })}>مدیر با شماره</button></div>
          {admin?.id === p.id && <form className="flex gap-2 md:col-span-2" onSubmit={(e) => { e.preventDefault(); patch.mutate({ id: p.id, adminMobile: admin.mobile }); }}><input className="input h-10 max-w-xs" dir="ltr" placeholder="0912…" value={admin.mobile} onChange={(e) => setAdmin({ ...admin, mobile: e.target.value })} /><button className="btn btn-primary btn-sm">افزودن مدیر</button><button type="button" className="btn btn-ghost btn-sm" onClick={() => setAdmin(null)}>برگرد</button></form>}
        </div>); })}</div>
      <form className="card flex flex-wrap items-end gap-3 p-4" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}><label className="field flex-1"><span>برگزارکنندهٔ تازه (نام)</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></label><button className="btn btn-primary" disabled={!name.trim() || create.isPending}>اضافه کن</button></form>
    </div>
  );
}
