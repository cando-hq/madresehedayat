/*
 * کارنامه، دو لایه: بالا جایگاه در مسیر اصلی (برای مسیر بنیاد: چرخ شایستگی)، پایین همهٔ مسیرها، گام‌های رشد و گواهی‌ها.
 * نشان، مرحلهٔ رشد و استریک ندارد؛ یک سنجه: گام رشد تأییدشده.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Award, Copy, ExternalLink, Route, Settings } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { CourseCard } from '../components/CourseCard';
import { PathCard, PubName, ROLE_FA, Section, Toranj, pathStateText } from '../components/Path2';
import { Empty, Spinner, useToast } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { fa, jDate } from '../lib/fa';
import type { CourseCard as C, PathV2 } from '../lib/types';
import { ImamatCard } from './Imamat';

interface Karname { main: PathV2 | null; paths: PathV2[]; certs: { code: string; title: string; issuedAt: string; score: number | null; publisher: { id: string; name: string; color: string } | null }[]; total: number; imamat: { level: number } | null }
type Tab = 'active' | 'done' | 'archived';

export default function Me() {
  const { me } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const k = useQuery({ queryKey: ['v2', 'karname'], queryFn: () => api<Karname>('/v2/karname') });
  const mine = useQuery({ queryKey: ['my-courses'], queryFn: () => api<C[]>('/me/courses') });
  const [tab, setTab] = useState<Tab>('active');
  const archive = useMutation({
    mutationFn: ({ slug, archived }: { slug: string; archived: boolean }) => api(`/courses/${slug}/archive`, { body: { archived } }),
    onSuccess: (_r, v) => { qc.invalidateQueries({ queryKey: ['my-courses'] }); toast(v.archived ? 'دوره کنار گذاشته شد؛ پیشرفتش می‌ماند' : 'دوره برگشت'); },
  });
  if (k.isLoading || mine.isLoading) return <Spinner />;
  const d = k.data!;
  const all = mine.data ?? [];
  const lists: Record<Tab, C[]> = { active: all.filter((c) => !c.me?.completedAt && !c.me?.archived), done: all.filter((c) => c.me?.completedAt), archived: all.filter((c) => !c.me?.completedAt && c.me?.archived) };
  const copy = async (code: string) => { try { await navigator.clipboard.writeText(code); toast('شناسه کپی شد'); } catch { toast('کپی نشد؛ شناسه را دستی بردار', 'err'); } };
  const main = d.main;
  return (
    <div className="grid gap-10">
      <header className="flex flex-wrap items-center gap-4">
        <span className="grid size-16 place-items-center rounded-full bg-deep-soft text-2xl font-extrabold text-deep">{me?.firstName[0]}</span>
        <div className="flex-1 min-w-0"><h1 className="text-[clamp(22px,3vw,30px)] font-extrabold">{me?.firstName} {me?.lastName}</h1>
          <p className="text-muted">{me?.actorRole && me.actorRole !== 'OTHER' ? `${ROLE_FA[me.actorRole]}، ` : ''}{me?.mosque?.name ?? me?.nearMosque ?? 'بدون مسجد'}{me?.county ? `، ${me.county.name}` : ''}</p></div>
        <div className="flex items-center gap-4 text-sm"><span><b className="tnum text-2xl font-extrabold text-ink">{fa(d.total)}</b> <span className="text-muted">گام رشد</span></span><span><b className="tnum text-2xl font-extrabold text-ink">{fa(d.certs.length)}</b> <span className="text-muted">گواهی</span></span><Link to="/settings" className="btn btn-ghost btn-icon" aria-label="تنظیمات"><Settings className="size-5" /></Link></div>
      </header>

      {main ? (
        <section className="card grid gap-5 p-6 md:grid-cols-[1.2fr_1fr_auto] md:items-center" style={{ borderInlineStartWidth: 10, borderInlineStartColor: main.color }}>
          <div className="grid gap-1"><span className="text-[13px] font-bold" style={{ color: main.color }}>مسیر اصلی تو</span><b className="text-2xl font-extrabold text-ink">{main.title}</b><span className="text-sm text-body">{pathStateText(main)}؛ {fa(main.growthSteps)} گام رشد تأییدشده</span><PubName pub={main.publisher} /></div>
          <div className="grid gap-2"><div className="flex items-center gap-1.5">{main.steps.map((s, i) => <Toranj key={s.id} state={s.done ? 'done' : i === main.currentStep ? 'now' : 'todo'} color={main.color} size={18} />)}</div><span className="text-sm text-muted">{main.rahyar ? `راهیار: ${main.rahyar.name}` : main.hasRahyar ? 'راهیار به‌زودی' : 'خودآموز'}</span></div>
          <Link to={`/paths/${main.slug}`} className="btn btn-secondary">قدم بعدی</Link>
        </section>
      ) : (
        <div className="rounded-2xl bg-sunken p-5 text-body">هنوز مسیر اصلی نداری. <Link to="/learn?tab=main" className="font-bold text-leaf-ink">ببین برای نقشت چه مسیری هست</Link>.</div>
      )}

      {main?.id === 'pt-taayon' && <ImamatCard />}

      <Section title="همهٔ مسیرها" link="یادگیری" to="/learn">
        {d.paths.length ? <div className="stagger grid gap-4 lg:grid-cols-2">{d.paths.filter((p) => !p.isMain).map((p, i) => <PathCard key={p.id} p={p} i={i} />)}{d.paths.length === 1 && main && <p className="text-sm text-muted self-center">فقط مسیر اصلی را برداشته‌ای.</p>}</div>
          : <Empty icon={Route} title="هنوز مسیری برنداشته‌ای"><Link to="/learn?tab=explore" className="font-bold text-leaf-ink">کاوش</Link></Empty>}
      </Section>

      <Section title="گواهی‌ها">
        {d.certs.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {d.certs.map((c) => (
              <div key={c.code} className="card flex items-center gap-4 overflow-hidden p-0">
                <span className="grid h-full min-h-[88px] w-16 shrink-0 place-items-center" style={{ background: c.publisher?.color ?? 'var(--deep)' }}><Award className="size-7 text-white" /></span>
                <div className="min-w-0 flex-1 py-3"><b className="block text-ink">{c.title}</b><span className="text-sm text-muted">{c.publisher?.name ? `${c.publisher.name}، ` : ''}{jDate(c.issuedAt)}{c.score != null ? `، نمره ٪${fa(c.score)}` : ''}</span><span className="mt-0.5 block text-xs text-muted">شناسهٔ استعلام: <b dir="ltr" className="tnum">{c.code}</b></span></div>
                <div className="flex flex-col gap-1 pe-2"><button className="btn btn-ghost btn-icon btn-sm" onClick={() => copy(c.code)} aria-label="کپی شناسه"><Copy className="size-4" /></button><Link className="btn btn-ghost btn-icon btn-sm" to={`/verify/${c.code}`} aria-label="دیدن گواهی"><ExternalLink className="size-4" /></Link></div>
              </div>
            ))}
          </div>
        ) : <Empty icon={Award} title="هنوز گواهی نداری">با تمام کردن یک دوره یا مسیر، گواهی‌اش این‌جا می‌آید.</Empty>}
      </Section>

      <section>
        <div className="mb-4 flex flex-wrap items-center gap-3"><h2 className="me-auto text-lg font-extrabold">دوره‌های من</h2>
          <div className="seg" role="group">{([['active', 'در حال گذراندن'], ['done', 'تمام‌شده'], ['archived', 'کنار گذاشته']] as [Tab, string][]).map(([kk, t]) => <button key={kk} aria-pressed={tab === kk} onClick={() => setTab(kk)}>{t} <span className="tnum text-muted">{fa(lists[kk].length)}</span></button>)}</div></div>
        {lists[tab].length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lists[tab].map((c) => (
              <div key={c.id} className="grid gap-2">
                <CourseCard c={c} />
                {tab !== 'done' && <button className="btn btn-ghost btn-sm" onClick={() => archive.mutate({ slug: c.slug, archived: tab === 'active' })}>{tab === 'active' ? 'کنار بگذار' : 'برگردان'}</button>}
              </div>
            ))}
          </div>
        ) : <p className="rounded-2xl bg-sunken p-5 text-muted">{tab === 'active' ? 'دوره‌ای در جریان نیست.' : tab === 'done' ? 'هنوز دوره‌ای تمام نکرده‌ای.' : 'چیزی کنار نگذاشته‌ای.'}</p>}
      </section>
    </div>
  );
}
