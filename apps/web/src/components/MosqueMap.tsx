/*
 * نقشهٔ پیدا کردن مسجد (۱.۱۱). جدا بار می‌شود تا صفحه‌های دیگر سنگین نشوند.
 * اگر VITE_NESHAN_KEY پر باشد نقشهٔ «نشان» (کیت رسمی نشان، بر پایهٔ Leaflet، با مکان‌های خود نشان) و گرنه OpenStreetMap
 * (کاشی‌ها از VITE_MAP_TILES یا کاشی‌های عمومی OSM). رابط هر دو یکی است؛ فقط سازندهٔ نقشه فرق دارد.
 * نقشه را صفحهٔ بالادست می‌راند: با ref به نقطه‌ای پرواز می‌کند (flyTo) و هر جابه‌جایی را با onMove خبر می‌دهد.
 */
import Leaflet from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

export interface MapMosque { id: string; name: string; lat: number | null; lng: number | null }
export interface MapHandle { flyTo: (p: { lat: number; lng: number }, zoom?: number) => void; center: () => { lat: number; lng: number } }
interface Props {
  start: { lat: number; lng: number; zoom: number };
  me?: { lat: number; lng: number } | null;
  mosques: MapMosque[];
  selected: string | null;
  onPick: (id: string) => void;
  /** بعد از هر کشیدن یا بزرگ‌نمایی: مرکز تازه */
  onMove?: (c: { lat: number; lng: number; zoom: number }) => void;
  /** زدن روی جای خالی نقشه */
  onTap?: (p: { lat: number; lng: number }) => void;
  /** حالت «مسجدم این‌جاست»: نشانگر ثابت وسط نقشه، نقشه زیرش جابه‌جا می‌شود */
  crosshair?: boolean;
  /** هر بار که عوض شود نقشه به آن‌جا پرواز می‌کند؛ اگر نقشه هنوز آماده نیست، همین که آماده شد */
  focus?: { lat: number; lng: number; zoom: number; n: number } | null;
  className?: string;
}

const TILES = (import.meta.env.VITE_MAP_TILES as string | undefined) || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const NESHAN_KEY = (import.meta.env.VITE_NESHAN_KEY as string | undefined) || '';
type LT = typeof Leaflet;
const css = (v: string, fb: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || fb;
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const MosqueMap = forwardRef<MapHandle, Props>(function MosqueMap({ start, me, mosques, selected, onPick, onMove, onTap, crosshair, focus, className }, ref) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const lib = useRef<LT>(Leaflet);
  const cb = useRef({ onPick, onMove, onTap, crosshair });
  cb.current = { onPick, onMove, onTap, crosshair };
  const [ready, setReady] = useState(0);

  useImperativeHandle(ref, () => ({
    flyTo: (p, zoom = 17) => { const m = map.current; if (!m) return; if (reduced()) m.setView([p.lat, p.lng], zoom); else m.flyTo([p.lat, p.lng], zoom, { duration: 0.8 }); },
    center: () => { const c = map.current?.getCenter(); return c ? { lat: c.lat, lng: c.lng } : { lat: start.lat, lng: start.lng }; },
  }), [start.lat, start.lng]);

  useEffect(() => {
    if (!box.current) return;
    let m: L.Map | null = null; let ro: ResizeObserver | null = null; let dead = false;
    (async () => {
      const L: LT = NESHAN_KEY ? (await import('./neshanLeaflet')).default : Leaflet;
      if (dead || !box.current) return;
      lib.current = L;
      m = NESHAN_KEY
        // گزینه‌های key و maptype را فقط کیت نشان می‌شناسد؛ poi مکان‌های نشان (از جمله مسجدها) را با نام نشان می‌دهد
        ? new L.Map(box.current, { key: NESHAN_KEY, maptype: 'neshan', poi: true, traffic: false, center: [start.lat, start.lng], zoom: start.zoom, zoomControl: false } as L.MapOptions)
        : L.map(box.current, { zoomControl: false, attributionControl: true }).setView([start.lat, start.lng], start.zoom);
      if (!NESHAN_KEY) L.tileLayer(TILES, { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m);
      m.on('click', (e: L.LeafletMouseEvent) => { if (!cb.current.crosshair) cb.current.onTap?.({ lat: e.latlng.lat, lng: e.latlng.lng }); });
      m.on('moveend', () => { const c = m!.getCenter(); cb.current.onMove?.({ lat: c.lat, lng: c.lng, zoom: m!.getZoom() }); });
      layer.current = L.layerGroup().addTo(m);
      map.current = m;
      ro = new ResizeObserver(() => m?.invalidateSize()); ro.observe(box.current);
      setReady((x) => x + 1);
    })();
    return () => { dead = true; ro?.disconnect(); m?.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = map.current; if (!m || !focus) return;
    if (reduced()) m.setView([focus.lat, focus.lng], focus.zoom); else m.flyTo([focus.lat, focus.lng], focus.zoom, { duration: 0.8 });
  }, [focus?.n, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const g = layer.current; if (!g) return;
    const L = lib.current;
    g.clearLayers();
    const deep = css('--deep', '#1E3A9E'), leaf = css('--leaf', '#0E9F5A'), flame = css('--flame', '#F5B700');
    if (me) L.circleMarker([me.lat, me.lng], { radius: 8, color: '#fff', weight: 3, fillColor: leaf, fillOpacity: 1 }).bindTooltip('تو این‌جایی').addTo(g);
    if (crosshair) return; // در حالت نشانگر، نقطه‌های دیگر حواس را پرت می‌کنند
    for (const x of mosques) {
      if (x.lat == null || x.lng == null) continue;
      const on = x.id === selected;
      const mk = L.circleMarker([x.lat, x.lng], { radius: on ? 12 : 8, color: '#fff', weight: on ? 3 : 2, fillColor: on ? flame : deep, fillOpacity: 1 })
        .bindTooltip(x.name, { direction: 'top', offset: [0, -10], permanent: on, className: on ? 'mq-tip-on' : '' })
        .on('click', (e) => { L.DomEvent.stopPropagation(e); cb.current.onPick(x.id); })
        .addTo(g);
      if (on) mk.bringToFront();
    }
  }, [mosques, selected, me, crosshair, ready]);

  return (
    <div className={`relative overflow-hidden bg-[#EEF1F6] dark:bg-[#1A1F33] ${className ?? 'h-64 rounded-2xl'}`}>
      <div ref={box} dir="ltr" className="absolute inset-0" role="application" aria-label="نقشهٔ مسجدها؛ روی نقطهٔ هر مسجد بزن تا انتخاب شود" />
      {crosshair && (
        <div className="pointer-events-none absolute inset-0 z-[500] grid place-items-center" aria-hidden="true">
          <svg width="40" height="52" viewBox="0 0 40 52" className="-translate-y-[22px] drop-shadow-md">
            <path d="M20 51C20 51 38 30.5 38 19A18 18 0 0 0 2 19C2 30.5 20 51 20 51Z" fill="var(--flame, #F5B700)" stroke="#fff" strokeWidth="3" />
            <circle cx="20" cy="19" r="6" fill="#fff" />
          </svg>
        </div>
      )}
    </div>
  );
});
export default MosqueMap;
