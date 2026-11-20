import { useEffect } from 'react';
import { useLocation } from 'react-router';

/*
 * هر صفحهٔ تازه از بالا باز می‌شود؛ با «برگشت» مرورگر، جای قبلی صفحه برمی‌گردد.
 * (بدون این، صفحهٔ تازه همان‌جایی باز می‌شد که صفحهٔ قبل پیمایش شده بود.)
 */
const saved = new Map<string, number>();
let popped = false;
let last: string | null = null;
let lastY = 0; // مشترک بین پوسته‌ها (کنشگر، ستاد، برگزارکننده، استاد)
if (typeof window !== 'undefined') {
  window.history.scrollRestoration = 'manual';
  window.addEventListener('popstate', () => { popped = true; });
  window.addEventListener('scroll', () => { lastY = window.scrollY; }, { passive: true });
}

export function ScrollManager() {
  const loc = useLocation();
  const here = loc.pathname + loc.search;
  useEffect(() => {
    if (last === here) return;
    if (last != null) saved.set(last, lastY);
    last = here;
    const y = popped ? saved.get(here) : undefined;
    popped = false;
    if (y == null) { window.scrollTo(0, 0); return; }
    // محتوا شاید هنوز در راه باشد؛ چند بار تا یک ثانیه تلاش کن
    let n = 0;
    const t = window.setInterval(() => { window.scrollTo(0, y); if (++n > 10 || Math.abs(window.scrollY - y) < 2) window.clearInterval(t); }, 100);
    return () => window.clearInterval(t);
  }, [here]);
  return null;
}
