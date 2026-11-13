/*
 * نخستین ورود، سه قدم: نقش تو در مسجد (→ مسیر اصلی پیشنهادی)، مسجد تو روی نقشه، و شروع.
 * قدم مسجد در components/MosqueStep.tsx است: مکان کاربر → مسجدهای نزدیک → انتخاب یا ثبت مسجد تازه.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { MosqueStep, type MosqueChoice } from '../components/MosqueStep';
import { StepFooter } from '../components/StepFooter';
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
  const ROLE_HINT: Record<ActorRole, string> = { IMAM: 'امام جماعت یا امام محله', SHARIK: 'همسر امام و همراه او در مسجد', BAZU: 'دست‌یار امام در کارهای مسجد', HASTEH: 'عضو هستهٔ نوجوانان یا جوانان', OTHER: 'نمازگزار یا هر نقش دیگر' };
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="wrap flex h-16 max-w-xl items-center gap-4" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <img src="/brand/logo-mark.png" alt="مدرسهٔ هدایت" className="h-8 w-auto" />
        <div className="flex flex-1 gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step + 1} aria-label={`قدم ${fa(step + 1)} از ۳`}>
          {[0, 1, 2].map((i) => <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= step ? 'bg-leaf' : 'bg-line'}`} />)}
        </div>
        <span className="tnum text-sm text-muted">{fa(step + 1)} از ۳</span>
      </header>
      <main className="wrap flex w-full max-w-xl flex-1 flex-col pb-6 pt-6">
        {step === 0 && (
          <section className="rise flex flex-1 flex-col">
            <h1 className="text-[26px] font-extrabold leading-tight">سلام {me?.firstName}، نقشت در مسجد چیست؟</h1>
            <p className="mt-2 text-[15px] text-muted">مسیر مناسب‌تر را اول نشانت می‌دهیم.</p>
            <div className="mt-8 grid gap-2.5" role="radiogroup" aria-label="نقش">
              {ROLES.map((r) => (
                <button key={r} type="button" role="radio" aria-checked={role === r} onClick={() => setRole(r)} className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-start transition-colors ${role === r ? 'border-leaf bg-leaf-soft' : 'border-line bg-card hover:border-line-strong'}`}>
                  <span className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${role === r ? 'border-leaf' : 'border-line-strong'}`}>{role === r && <span className="size-2.5 rounded-full bg-leaf" />}</span>
                  <span className="grid"><b className="text-[15px] text-ink">{ROLE_FA[r]}</b><span className="text-[13px] text-muted">{ROLE_HINT[r]}</span></span>
                </button>
              ))}
            </div>
            {main && <p className="mt-5 text-sm text-muted">مسیر اصلی‌ات: <b className="text-ink">{main.title}</b> از {main.publisher}، {fa(main.steps)} پله. پیش‌فرض است، اجبار نیست.</p>}
            <StepFooter><button className="btn btn-primary btn-lg w-full" onClick={() => setStep(1)}>ادامه</button></StepFooter>
          </section>
        )}
        {step === 1 && <MosqueStep value={mq} onChange={setMq} onNext={() => setStep(2)} onBack={() => setStep(0)} />}
        {step === 2 && (
          <section className="rise flex flex-1 flex-col">
            <h1 className="text-[26px] font-extrabold leading-tight">آماده‌ای</h1>
            <p className="mt-2 text-[15px] text-muted">{main ? `با «${main.title}» شروع می‌کنی؛ اولین درس آماده است.` : 'از «کاوش» یک مسیر کوتاه برمی‌داری.'}</p>
            <dl className="mt-8 divide-y divide-line rounded-2xl border border-line bg-card">
              {[['نقش', ROLE_FA[role]], ['مسجد', mq.mosqueName ?? 'بعداً می‌گویم'], ['مسیر اصلی', main?.title ?? 'ندارد']].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 px-4 py-3.5"><dt className="text-sm text-muted">{k}</dt><dd className="font-bold text-ink">{v}</dd></div>
              ))}
            </dl>
            <StepFooter>
              <button className="btn btn-ghost btn-lg" onClick={() => setStep(1)}>برگرد</button>
              <button className="btn btn-primary btn-lg flex-1" disabled={finish.isPending} onClick={() => finish.mutate()}>{finish.isPending ? <InlineSpinner /> : null}شروع کن</button>
            </StepFooter>
          </section>
        )}
      </main>
    </div>
  );
}
