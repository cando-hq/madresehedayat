/*
 * نقشهٔ واقعی (OpenStreetMap با Leaflet) برای انتخاب مسجد. جدا بار می‌شود تا صفحه‌های دیگر سنگین نشوند.
 * کاشی‌ها از VITE_MAP_TILES می‌آیند؛ پیش‌فرض کاشی‌های عمومی OSM است. اگر کاشی‌ها باز نشوند، پین‌ها روی زمینهٔ ساده می‌مانند.
 */
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';

export interface MapMosque { id: string; name: string; lat: number | null; lng: number | null }
interface Props {
  center: { lat: number; lng: number };
  zoom?: number;
  me?: { lat: number; lng: number } | null;
  mosques: MapMosque[];
  selected: string | null;
  onPick: (id: string) => void;
  /** وقتی کاربر مسجد تازه ثبت می‌کند: پینی که با زدن روی نقشه جابه‌جا می‌شود */
  pin?: { lat: number; lng: number } | null;
  onPin?: (p: { lat: number; lng: number }) => void;
}

const TILES = (import.meta.env.VITE_MAP_TILES as string | undefined) || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const css = (v: string, fb: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || fb;

export default function MosqueMap({ center, zoom = 15, me, mosques, selected, onPick, pin, onPin }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const cb = useRef({ onPick, onPin });
  cb.current = { onPick, onPin };

  useEffect(() => {
    if (!box.current) return;
    const m = L.map(box.current, { zoomControl: true, attributionControl: true }).setView([center.lat, center.lng], zoom);
    L.tileLayer(TILES, { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m);
    m.on('click', (e: L.LeafletMouseEvent) => cb.current.onPin?.({ lat: e.latlng.lat, lng: e.latlng.lng }));
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    const ro = new ResizeObserver(() => m.invalidateSize()); ro.observe(box.current);
    return () => { ro.disconnect(); m.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { map.current?.setView([center.lat, center.lng], zoom); }, [center.lat, center.lng, zoom]);

  useEffect(() => {
    const g = layer.current; if (!g) return;
    g.clearLayers();
    const deep = css('--deep', '#1E3A9E'), leaf = css('--leaf', '#0E9F5A'), flame = css('--flame', '#F5B700');
    if (me) L.circleMarker([me.lat, me.lng], { radius: 8, color: '#fff', weight: 3, fillColor: leaf, fillOpacity: 1 }).bindTooltip('تو این‌جایی').addTo(g);
    for (const x of mosques) {
      if (x.lat == null || x.lng == null) continue;
      const on = x.id === selected;
      L.circleMarker([x.lat, x.lng], { radius: on ? 11 : 8, color: '#fff', weight: 2, fillColor: on ? flame : deep, fillOpacity: 1 })
        .bindTooltip(x.name, { direction: 'top', offset: [0, -8], permanent: on })
        .on('click', (e) => { L.DomEvent.stopPropagation(e); cb.current.onPick(x.id); })
        .addTo(g);
    }
    // نقشه طوری بزرگ‌نمایی می‌شود که «تو» و مسجدهای فهرست با هم دیده شوند
    const pts = [...(me ? [[me.lat, me.lng]] : []), ...mosques.filter((x) => x.lat != null && x.lng != null).map((x) => [x.lat!, x.lng!])] as [number, number][];
    if (!pin && pts.length > 1) map.current?.fitBounds(L.latLngBounds(pts), { padding: [36, 36], maxZoom: 16 });
    if (pin) L.circleMarker([pin.lat, pin.lng], { radius: 11, color: '#fff', weight: 3, fillColor: flame, fillOpacity: 1 }).bindTooltip('مسجد تازه', { permanent: true, direction: 'top', offset: [0, -10] }).addTo(g);
  }, [mosques, selected, me, pin]);

  return <div ref={box} dir="ltr" className="h-52 w-full overflow-hidden rounded-2xl bg-[#EEF1F6] sm:h-64 dark:bg-[#1A1F33]" role="application" aria-label="نقشهٔ مسجدهای نزدیک؛ روی نقطهٔ هر مسجد بزن تا انتخاب شود" />;
}
