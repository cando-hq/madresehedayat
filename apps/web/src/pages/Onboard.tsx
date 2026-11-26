/*
 * نخستین ورود (۱.۱۱)، دو قدم کوتاه: «تو مسجد چه‌کاره‌ای؟» و «مسجدت کجاست؟». بعد مستقیم به خانه با مسیر اصلی نقشت.
 * نقش نوشتنی است و چند پیشنهاد زیرش؛ پیشنهاد نقش برنامه را معلوم می‌کند (مسیر اصلی و متن قدم مسجد)،
 * و آنچه کاربر خودش نوشت، به زبان خودش، به‌عنوان نسبتش با مسجد ذخیره می‌شود. قدم مسجد در components/MosqueStep.tsx است.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { MosqueStep, type MosqueChoice } from '../components/MosqueStep';
import { useToast } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { fa } from '../lib/fa';
import type { ActorRole } from '../lib/types';

const SUGGEST: [ActorRole, string][] = [
  ['IMAM', 'امام جماعت'],
  ['SHARIK', 'شریکة الامام (همسر امام)'],
  ['BAZU', 'دستیار امام'],
  ['HASTEH', 'نوجوان و جوان مسجد'],
  ['OTHER', 'نمازگزار'],
];
const clean = (t: string) => t.replace(/\s+/g, ' ').replace(/ي/g, 'ی').replace(/ك/g, 'ک').trim();
/** نوشتهٔ آزاد ← نقش برنامه. چیزی که روشن نیست «دیگر» می‌ماند و نوشته‌اش نگه داشته می‌شود. */
export function guessRole(t: string): ActorRole {
  const s = clean(t).replace(/‌/g, ' ');
  const hit = SUGGEST.find(([, l]) => clean(l) === s); if (hit) return hit[0];
  if (/شریک|همسر امام|خانم امام|همسر روحانی/.test(s)) return 'SHARIK';
  if (/دستیار|بازو|معاون امام|کمک امام/.test(s)) return 'BAZU';
  if (/نوجوان|جوان|هسته|بسیج/.test(s)) return 'HASTEH';
  if (/^امام( |$)|امام جماعت|پیش ?نماز|روحانی مسجد|امام محله/.test(s)) return 'IMAM';
  return 'OTHER';
}
const LABEL_OF = Object.fromEntries(SUGGEST) as Record<ActorRole, string>;

export default function Onboard() {
  const { me, setMe } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [roleText, setRoleText] = useState(me?.actorRole && me.actorRole !== 'OTHER' ? LABEL_OF[me.actorRole] : '');
  const role = guessRole(roleText);
  const [mq, setMq] = useState<MosqueChoice>({ mosqueId: me?.mosque?.id ?? null, mosqueName: me?.mosque?.name ?? null, countyId: null, lat: null, lng: null });
  const finish = useMutation({
    mutationFn: (v: MosqueChoice) => api<{ main: { title: string } | null }>('/v2/onboard', { body: { actorRole: role, relation: clean(roleText).slice(0, 60) || undefined, mosqueId: v.mosqueId, countyId: v.countyId ?? undefined } }),
    onSuccess: async (r) => { const m = await api('/auth/me'); setMe(m); qc.invalidateQueries({ queryKey: ['v2'] }); toast(r.main ? `خوش آمدی! «${r.main.title}» برایت باز شد` : 'خوش آمدی!'); nav('/', { replace: true }); },
    onError: (e) => toast((e as Error).message, 'err'),
  });
  const next = (e?: FormEvent) => { e?.preventDefault(); if (clean(roleText).length >= 2) setStep(1); };

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="wrap flex h-14 max-w-xl items-center gap-4" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <img src={`${import.meta.env.BASE_URL}brand/logo-mark.png`} alt="مدرسهٔ هدایت" className="h-7 w-auto" />
        <div className="flex flex-1 gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={2} aria-valuenow={step + 1} aria-label={`قدم ${fa(step + 1)} از ۲`}>
          {[0, 1].map((i) => <span key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= step ? 'bg-leaf' : 'bg-line'}`} />)}
        </div>
      </header>
      <main className="wrap flex w-full max-w-xl flex-1 flex-col pb-4 pt-5">
        {step === 0 && (
          <form onSubmit={next} className="rise flex flex-1 flex-col">
            <h1 className="text-[28px] font-extrabold leading-tight">{me?.firstName ? `${me.firstName}، ` : ''}تو مسجد چه‌کاره‌ای؟</h1>
            <p className="mt-1.5 text-[15px] text-muted">بنویس، یا یکی از این‌ها را بزن.</p>
            <input className="input mt-6 h-14 text-[17px]" value={roleText} onChange={(e) => setRoleText(e.target.value)} placeholder="مثلاً امام جماعت" aria-label="نقشت در مسجد" maxLength={60} autoFocus enterKeyHint="next" />
            <div className="mt-4 flex flex-wrap gap-2" aria-label="پیشنهادها">
              {SUGGEST.map(([r, l]) => {
                const on = clean(roleText) === clean(l);
                return (
                  <button key={r} type="button" aria-pressed={on} onClick={() => setRoleText(l)}
                    className={`inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-[14px] font-bold transition-colors ${on ? 'border-leaf bg-leaf text-white' : 'border-line bg-card text-body hover:border-line-strong'}`}>
                    {on && <Check className="size-4" />}{l}
                  </button>
                );
              })}
            </div>
            <div className="sticky bottom-0 -mx-4 mt-auto bg-bg/95 px-4 pt-3 backdrop-blur sm:static sm:mx-0 sm:mt-10 sm:bg-transparent sm:px-0" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
              <button className="btn btn-primary btn-lg w-full" disabled={clean(roleText).length < 2}>بعدی<ArrowLeft className="size-5" /></button>
            </div>
          </form>
        )}
        {step === 1 && <MosqueStep role={role} value={mq} onChange={setMq} onBack={() => setStep(0)} onNext={(v) => finish.mutate(v)} finishing={finish.isPending} />}
      </main>
    </div>
  );
}
