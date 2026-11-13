/*
 * کیت رسمی نقشهٔ نشان (Leaflet). فقط وقتی VITE_NESHAN_KEY پر باشد بار می‌شود؛ رابطش همان Leaflet است.
 * کلید «وب» را در پنل platform.neshan.org بسازید و دامنهٔ سایت را در آن ثبت کنید.
 */
// @ts-expect-error بسته نوع ندارد؛ همان شیء L ـِ Leaflet را با گزینه‌های key و maptype برمی‌گرداند
import NL from '@neshan-maps-platform/leaflet';
import '@neshan-maps-platform/leaflet/dist/leaflet.css';
export default NL as typeof import('leaflet');
