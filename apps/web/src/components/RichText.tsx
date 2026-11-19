/*
 * متن درس با قالب ساده، همان که سازندهٔ دوره با دکمه‌ها می‌سازد:
 *   «## تیتر»، «- بند فهرست»، «> نکتهٔ برجسته»، «**پررنگ**»؛ بندها با خط خالی جدا می‌شوند.
 * هیچ HTMLی از متن ساخته نمی‌شود؛ فقط همین چند نشانه خوانده می‌شود.
 */
import type { ReactNode } from 'react';

type Block = { k: 'h' | 'p' | 'q'; t: string } | { k: 'ul'; items: string[] };

export function parseBlocks(body: string): Block[] {
  const out: Block[] = [];
  let para: string[] = [];
  const flush = () => { if (para.length) { out.push({ k: 'p', t: para.join('\n') }); para = []; } };
  for (const raw of String(body ?? '').split('\n')) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    if (line.startsWith('## ')) { flush(); out.push({ k: 'h', t: line.slice(3) }); continue; }
    if (line.startsWith('- ')) {
      flush();
      const last = out[out.length - 1];
      if (last && last.k === 'ul') last.items.push(line.slice(2)); else out.push({ k: 'ul', items: [line.slice(2)] });
      continue;
    }
    if (line.startsWith('> ')) { flush(); out.push({ k: 'q', t: line.slice(2) }); continue; }
    para.push(line);
  }
  flush();
  return out;
}

/** «**پررنگ**» در یک خط */
export function Inline({ t }: { t: string }): ReactNode {
  return t.split('**').map((x, i) => (i % 2 ? <b key={i} className="font-extrabold text-ink">{x}</b> : <span key={i}>{x}</span>));
}

export function RichText({ body, className = '' }: { body: string; className?: string }) {
  return (
    <div className={`prose-fa grid gap-3 ${className}`}>
      {parseBlocks(body).map((b, i) => {
        if (b.k === 'h') return <h3 key={i} className="mt-2 text-lg font-extrabold text-ink"><Inline t={b.t} /></h3>;
        if (b.k === 'q') return <p key={i} className="rounded-2xl bg-dome-soft px-4 py-3 text-dome-ink"><Inline t={b.t} /></p>;
        if (b.k === 'ul') return <ul key={i} className="grid list-disc gap-1 ps-6">{b.items.map((x, j) => <li key={j}><Inline t={x} /></li>)}</ul>;
        return <p key={i} className="whitespace-pre-line"><Inline t={b.t} /></p>;
      })}
    </div>
  );
}

/** دکمه‌های قالب برای یک textarea: انتخاب را پررنگ می‌کند یا خطِ نشانگر را تیتر/فهرست/نکته */
export function applyFormat(el: HTMLTextAreaElement, kind: 'h' | 'b' | 'li' | 'q'): string {
  const v = el.value, s0 = el.selectionStart ?? 0, e0 = el.selectionEnd ?? 0;
  if (kind === 'b') {
    const mid = v.slice(s0, e0) || 'متن پررنگ';
    return v.slice(0, s0) + '**' + mid + '**' + v.slice(e0);
  }
  const pre = { h: '## ', li: '- ', q: '> ' }[kind];
  const st = s0 === 0 ? 0 : v.lastIndexOf('\n', s0 - 1) + 1;
  const rest = v.slice(st);
  const had = ['## ', '- ', '> '].find((p) => rest.startsWith(p));
  const bare = had ? rest.slice(had.length) : rest;
  return v.slice(0, st) + (had === pre ? '' : pre) + bare;
}
