/*
 * نخستین ورود، سه قدم: نقش تو در مسجد (→ مسیر اصلی پیشنهادی)، مسجد تو روی نقشه، و شروع.
 * قدم مسجد در components/MosqueStep.tsx است: مکان کاربر → مسجدهای نزدیک → انتخاب یا ثبت مسجد تازه.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Brand } from '../components/Shell';
import { MosqueStep, type MosqueChoice } from '../components/MosqueStep';
import { ROLE_FA } from '../components/Path2';
import { InlineSpinner, useToast } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { fa } from '../lib/fa';
import type { ActorRole } from '../lib/types';

interface OnboardInfo { actorRole: ActorRole | null; onboarded: boolean; mosque: string | null; mains: { role: ActorRole; roleFa: string; path: { slug: string; title: string; publisher: string; description: string | null; steps: number; color: string } | null }[] }
const ROLES: ActorRole[] = ['IMAM', 'SHARIK', 'BAZU', 'HASTEH', 'OTHER'];

export default function Onboard() {
  const { me, setMe } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const info = useQuery({ queryKey: ['v2', 'onboard'], queryFn: () => api<OnboardInfo>('/v2/onboard') });
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<ActorRole>(me?.actorRole ?? 'IMAM');
  const [mq, setMq] = useState<MosqueChoice>({ mosqueId: me?.mosque?.id ?? null, mosqueName: me?.mosque?.name ?? null, countyId: null, lat: me?.location?.lat ?? null, lng: me?.location?.lng ?? null, relation: '' });
  const finish = useMutation({
    mutationFn: () => api<{ main: { slug: string } | null }>('/v2/onboard', { body: { actorRole: role, mosqueId: mq.mosqueId, countyId: mq.countyId ?? undefined, relation: mq.relation || undefined } }),
    onSuccess: async () => { const m = await api('/auth/me'); setMe(m); qc.invalidateQueries({ queryKey: ['v2'] }); nav('/', { replace: true }); },
    onError: (e) => toast((e as Error).message, 'err'),
  });
  const main = info.data?.mains.find((m) => m.role === role)?.path ?? null;
  const stepsUi = ['نقش تو', 'مسجد تو', 'شروع'];
  return (
    <div className="min-h-dvh bg-bg">
      <header className="wrap flex h-16 items-center justify-between"><Brand /><ol className="flex shrink-0 items-center gap-1.5 text-[13px]" aria-label="قدم‌ها">{stepsUi.map((t, i) => <li key={t} aria-current={i === step ? 'step' : undefined} className={`whitespace-nowrap rounded-full py-1 font-bold ${i === step ? 'bg-deep px-3 text-white' : i < step ? 'bg-deep-soft px-2.5 text-deep' : 'bg-sunken px-2.5 text-muted'}`}>{fa(i + 1)}<span className={i === step ? 'ms-1' : 'ms-1 max-sm:hidden'}>{t}</span></li>)}</ol></header>
      <main className="wrap grid max-w-3xl gap-8 py-8">
        {step === 0 && (
          <section className="rise grid gap-6">
            <div><h1 className="text-[clamp(24px,3vw,32px)] font-extrabold">خوش آمدی، {me?.firstName}. نقشت در مسجد چیست؟</h1><p className="mt-1 text-muted">برای این‌که مسیر مناسب‌تر را اول نشانت بدهیم. بعداً از تنظیمات عوض می‌شود.</p></div>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="نقش">{ROLES.map((r) => <button key={r} type="button" role="radio" aria-checked={role === r} onClick={() => setRole(r)} className={`h-12 rounded-full border px-5 text-[15px] font-bold transition-colors ${role === r ? 'border-deep bg-deep-soft text-deep' : 'border-line bg-card text-body hover:border-line-strong'}`}>{ROLE_FA[r]}</button>)}</div>
            <div className="card grid gap-3 p-5" style={main ? { borderInlineStartWidth: 8, borderInlineStartColor: main.color } : undefined}>
              <span className="text-[13px] font-bold text-deep">مسیر اصلی برای تو</span>
              {main ? (<><b className="text-2xl font-extrabold text-ink">{main.title}</b><p className="text-body">{main.description}</p><span className="text-sm text-muted">{main.publisher}، {fa(main.steps)} پله. پیش‌فرض است، اجبار نیست؛ از «کاوش» هر چیز دیگری را برمی‌داری.</span></>)
                : (<><b className="text-xl font-extrabold text-ink">بی مسیر اصلی</b><p className="text-body">از کاوش شروع کن؛ هر وقت نقشت را گفتی، مسیر اصلی پیشنهاد می‌شود.</p></>)}
            </div>
            <div className="flex items-center gap-3"><button className="btn btn-primary btn-lg" onClick={() => setStep(1)}>ادامه<ChevronLeft className="size-5" /></button><button className="btn btn-ghost" onClick={() => { setRole('OTHER'); setStep(1); }}>نقشم را بعداً می‌گویم</button></div>
          </section>
        )}
        {step === 1 && <MosqueStep value={mq} onChange={setMq} onNext={() => setStep(2)} onBack={() => setStep(0)} />}
        {step === 2 && (
          <section className="rise grid gap-6">
            <h1 className="text-[clamp(24px,3vw,32px)] font-extrabold">همه‌چیز آماده است</h1>
            <div className="card grid gap-3 p-5">
              <div className="flex items-center justify-between gap-3"><span className="text-muted">نقش</span><b className="text-ink">{ROLE_FA[role]}</b></div>
              <div className="flex items-center justify-between gap-3"><span className="text-muted">مسجد</span><b className="text-ink">{mq.mosqueName ?? 'بعداً می‌گویم'}</b></div>
              <div className="flex items-center justify-between gap-3"><span className="text-muted">مسیر اصلی</span><b className="text-ink">{main?.title ?? 'بی مسیر اصلی'}</b></div>
            </div>
            <p className="text-body">{main ? `با «${main.title}» شروع می‌کنی؛ اولین درس آماده است. هر وقت خواستی از «یادگیری» مسیرهای کوتاه‌تر هم برمی‌داری.` : 'از «کاوش» یک مسیر کوتاه بردار؛ یک تا چهار هفته.'}</p>
            <div className="flex items-center gap-3"><button className="btn btn-primary btn-lg" disabled={finish.isPending} onClick={() => finish.mutate()}>{finish.isPending ? <InlineSpinner /> : null}شروع کن</button><button className="btn btn-ghost" onClick={() => setStep(1)}>برگرد</button></div>
          </section>
        )}
      </main>
    </div>
  );
}
