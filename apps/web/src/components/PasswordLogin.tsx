import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { useState } from 'react';
import { api } from '../lib/api';
import { ago } from '../lib/fa';
import type { Me } from '../lib/types';
import { ask } from './Confirm';
import { useToast } from './ui';

/**
 * ورود با رمز ثابت (برگزارکنندگان و استادها): بعد از یک بار ورود با بله، رمز می‌گذارند
 * و از آن به بعد با شماره و رمز وارد می‌شوند. اگر رمز یادشان برود، با بله وارد می‌شوند و رمز تازه می‌گذارند.
 */
export function PasswordLogin({ me }: { me: Me }) {
  const qc = useQueryClient(); const toast = useToast();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ current: '', password: '', again: '' });
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const has = !!me.password?.setAt;
  const needCurrent = has && !!me.viaPassword;
  const done = () => { setOpen(false); setF({ current: '', password: '', again: '' }); setErr(''); qc.invalidateQueries({ queryKey: ['me'] }); };
  const save = useMutation({
    mutationFn: () => api('/auth/password', { body: { password: f.password, current: needCurrent ? f.current : undefined } }),
    onSuccess: () => { toast(has ? 'رمز عوض شد' : 'رمز گذاشته شد؛ از این به بعد با شماره و رمز هم وارد می‌شوی'); done(); },
    onError: (e) => setErr((e as Error).message),
  });
  const remove = useMutation({ mutationFn: () => api('/auth/password', { method: 'DELETE' }), onSuccess: () => { toast('ورود با رمز خاموش شد'); done(); } });
  if (!me.password?.allowed) return null;
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setErr('');
    if (f.password.length < 8) return setErr('رمز دست‌کم ۸ نویسه است');
    if (f.password !== f.again) return setErr('دو رمز یکی نیستند');
    save.mutate();
  };
  const type = show ? 'text' : 'password';
  return (
    <div id="password" className="grid scroll-mt-24 gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><b className="block text-ink">ورود با رمز</b>
          <span className="text-sm text-muted">{has ? `روشن است؛ رمز ${ago(me.password!.setAt!)} گذاشته شد. با شماره و رمز، بی‌کد بله وارد می‌شوی.` : 'برای کار هر روزه با پنل، به جای کد بله با شماره و یک رمز ثابت وارد شو.'}</span></div>
        {!open && <div className="flex gap-2">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(true)}><KeyRound className="size-4" />{has ? 'عوض کردن رمز' : 'گذاشتن رمز'}</button>
          {has && <button type="button" className="btn btn-ghost btn-sm" onClick={async () => { if (await ask({ title: 'ورود با رمز خاموش شود؟', body: 'از این به بعد فقط با کد بله وارد می‌شوی. هر جا با رمز وارد شده بودی، بیرون می‌آیی.', ok: 'خاموش کن', danger: true })) remove.mutate(); }}>خاموش کردن</button>}
        </div>}
      </div>
      {open && (
        <form className="grid gap-3 rounded-2xl bg-sunken p-4" onSubmit={submit} noValidate>
          {needCurrent && <label className="field"><span>رمز فعلی</span><input className="input" dir="ltr" type={type} autoComplete="current-password" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} autoFocus /></label>}
          <label className="field"><span>رمز تازه</span><input className="input" dir="ltr" type={type} autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoFocus={!needCurrent} aria-describedby="pw-hint" /></label>
          <label className="field"><span>دوباره همان رمز</span><input className="input" dir="ltr" type={type} autoComplete="new-password" value={f.again} onChange={(e) => setF({ ...f, again: e.target.value })} /></label>
          <button type="button" className="inline-flex w-fit items-center gap-1.5 text-sm font-bold text-leaf-ink" onClick={() => setShow(!show)}>{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}{show ? 'پنهان کردن رمز' : 'نشان دادن رمز'}</button>
          <p id="pw-hint" className={`text-sm ${err ? 'text-rose-ink' : 'text-muted'}`} role={err ? 'alert' : undefined}>{err || 'دست‌کم ۸ نویسه، و نه شمارهٔ موبایلت. اگر روزی یادت رفت، با بله وارد شو و رمز تازه بگذار.'}</p>
          <div className="flex gap-2"><button className="btn btn-primary" disabled={save.isPending}>{has ? 'عوض کن' : 'بگذار'}</button><button type="button" className="btn btn-ghost" onClick={done}>انصراف</button></div>
        </form>
      )}
    </div>
  );
}
