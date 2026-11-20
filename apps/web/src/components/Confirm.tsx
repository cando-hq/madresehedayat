import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Dialog } from './ui';

/*
 * جای confirm و prompt مرورگر: پنجرهٔ خود مدرسه با متن روشن و دکمه‌ای که می‌گوید چه می‌شود.
 * const ask = useConfirm(); if (await ask({ title, body, ok: 'حذف کن', danger: true })) …
 * با input: true متن وارد‌شده برمی‌گردد (یا null اگر انصراف).
 */
type Opts = { title: string; body?: ReactNode; ok: string; cancel?: string; danger?: boolean; input?: boolean; label?: string; required?: boolean; placeholder?: string };
type Ask = { (o: Opts & { input: true }): Promise<string | null>; (o: Opts): Promise<boolean> };
const Ctx = createContext<Ask>((() => Promise.resolve(false)) as unknown as Ask);
export const useConfirm = () => useContext(Ctx);
/** همان پنجره، بیرون از هوک (در دستگیره‌ها) */
let current: Ask = (() => Promise.resolve(false)) as unknown as Ask;
export const ask: Ask = ((o: Opts) => current(o)) as Ask;

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [o, setO] = useState<Opts | null>(null);
  const [text, setText] = useState('');
  const done = useRef<(v: unknown) => void>(() => {});
  const ask = useCallback((opts: Opts) => new Promise<unknown>((res) => { done.current = res; setText(''); setO(opts); }), []) as Ask;
  current = ask;
  const close = (v: unknown) => { setO(null); done.current(v); };
  return (
    <Ctx.Provider value={ask}>
      {children}
      <Dialog open={!!o} onClose={() => close(o?.input ? null : false)} title={o?.title ?? ''}>
        {o && <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); if (o.input && o.required && !text.trim()) return; close(o.input ? text.trim() : true); }}>
          {o.body && <div className="text-body">{o.body}</div>}
          {o.input && <label className="field"><span>{o.label ?? 'توضیح'}</span><textarea className="input min-h-24" autoFocus value={text} placeholder={o.placeholder} onChange={(e) => setText(e.target.value)} /></label>}
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={() => close(o.input ? null : false)}>{o.cancel ?? 'انصراف'}</button>
            <button className={`btn ${o.danger ? 'btn-danger' : 'btn-primary'}`} disabled={o.input && o.required && !text.trim()}>{o.ok}</button>
          </div>
        </form>}
      </Dialog>
    </Ctx.Provider>
  );
}
