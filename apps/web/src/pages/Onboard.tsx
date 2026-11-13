/*
 * نخستین ورود، دو قدم: نقش تو در مسجد، و مسجد تو. بعد مستقیم به خانه با مسیر اصلی نقشت.
 * نقش چند چیز را خودش معلوم می‌کند تا دوباره پرسیده نشود: نسبتت با مسجد (امام ← امام جماعت همان مسجد)،
 * و متن قدم مسجد («مسجدی که امامش هستی»، «مسجد محله‌ات»…). قدم مسجد در components/MosqueStep.tsx است.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { MosqueStep, type MosqueChoice } from '../components/MosqueStep';
import { StepFooter } from '../components/StepFooter';
import { ROLE_FA } from '../components/Path2';
import { useToast } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { fa } from '../lib/fa';
import type { ActorRole } from '../lib/types';

const ROLES: ActorRole[] = ['IMAM', 'SHARIK', 'BAZU', 'HASTEH', 'OTHER'];
const ROLE_HINT: Record<ActorRole, string> = { IMAM: 'امام جماعت یا امام محله', SHARIK: 'همسر امام و همراه او در مسجد', BAZU: 'دست‌یار امام در کارهای مسجد', HASTEH: 'عضو هستهٔ نوجوانان یا جوانان', OTHER: 'نمازگزار یا هر نقش دیگر' };

export default function Onboard() {
  const { me, setMe } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<ActorRole>(me?.actorRole ?? 'IMAM');
  const [mq, setMq] = useState<MosqueChoice>({ mosqueId: me?.mosque?.id ?? null, mosqueName: me?.mosque?.name ?? null, countyId: null, lat: null, lng: null });
  const finish = useMutation({
    mutationFn: (v: MosqueChoice) => api<{ main: { title: string } | null }>('/v2/onboard', { body: { actorRole: role, mosqueId: v.mosqueId, countyId: v.countyId ?? undefined } }),
    onSuccess: async (r) => { const m = await api('/auth/me'); setMe(m); qc.invalidateQueries({ queryKey: ['v2'] }); if (r.main) toast(`«${r.main.title}» برایت باز شد`); nav('/', { replace: true }); },
    onError: (e) => toast((e as Error).message, 'err'),
  });
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="wrap flex h-16 max-w-xl items-center gap-4" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <img src={`${import.meta.env.BASE_URL}brand/logo-mark.png`} alt="مدرسهٔ هدایت" className="h-8 w-auto" />
        <div className="flex flex-1 gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={2} aria-valuenow={step + 1} aria-label={`قدم ${fa(step + 1)} از ۲`}>
          {[0, 1].map((i) => <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= step ? 'bg-leaf' : 'bg-line'}`} />)}
        </div>
        <span className="tnum text-sm text-muted">{fa(step + 1)} از ۲</span>
      </header>
      <main className="wrap flex w-full max-w-xl flex-1 flex-col pb-6 pt-6">
        {step === 0 && (
          <section className="rise flex flex-1 flex-col">
            <h1 className="text-[26px] font-extrabold leading-tight">سلام {me?.firstName}، نقشت در مسجد چیست؟</h1>
            <p className="mt-2 text-[15px] text-muted">درس‌ها و مسیرها به اندازهٔ همین نقش چیده می‌شوند.</p>
            <div className="mt-8 grid gap-2.5" role="radiogroup" aria-label="نقش">
              {ROLES.map((r) => (
                <button key={r} type="button" role="radio" aria-checked={role === r} onClick={() => setRole(r)} className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-start transition-colors ${role === r ? 'border-leaf bg-leaf-soft' : 'border-line bg-card hover:border-line-strong'}`}>
                  <span className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${role === r ? 'border-leaf' : 'border-line-strong'}`}>{role === r && <span className="size-2.5 rounded-full bg-leaf" />}</span>
                  <span className="grid"><b className="text-[15px] text-ink">{ROLE_FA[r]}</b><span className="text-[13px] text-muted">{ROLE_HINT[r]}</span></span>
                </button>
              ))}
            </div>
            <StepFooter><button className="btn btn-primary btn-lg w-full" onClick={() => setStep(1)}>ادامه</button></StepFooter>
          </section>
        )}
        {step === 1 && <MosqueStep role={role} value={mq} onChange={setMq} onBack={() => setStep(0)} onNext={(v) => finish.mutate(v)} finishing={finish.isPending} />}
      </main>
    </div>
  );
}
