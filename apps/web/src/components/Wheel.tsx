import { PETALS } from '../lib/imamat';
import { fa } from '../lib/fa';

const CX = 360, CY = 360, RIN = 152, ROUT = 312, RTIP = 346, START = 180, STEP = 15;
const rad = (d: number) => (d * Math.PI) / 180;
const P = (r: number, a: number) => `${(CX + r * Math.cos(rad(a))).toFixed(1)} ${(CY + r * Math.sin(rad(a))).toFixed(1)}`;
const ring = (r0: number, r1: number, a0: number, a1: number) => `M ${P(r0, a0)} L ${P(r1, a0)} A ${r1} ${r1} 0 0 1 ${P(r1, a1)} L ${P(r0, a1)} A ${r0} ${r0} 0 0 0 ${P(r0, a0)} Z`;
const tip = (r0: number, r1: number, a0: number, a1: number) => { const m = (a0 + a1) / 2; return `M ${P(r0, a0)} L ${P(r1, a0)} Q ${P(r1 + 22, a0 + 1.5)} ${P(RTIP, m)} Q ${P(r1 + 22, a1 - 1.5)} ${P(r1, a1)} L ${P(r0, a1)} A ${r0} ${r0} 0 0 0 ${P(r0, a0)} Z`; };
const wedge = (r: number, a0: number, a1: number) => `M ${CX} ${CY} L ${P(r, a0)} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${P(r, a1)} Z`;
const COL = {
  self: { on: ['#FFFFFF', '#FFFFFF'], tint: '#E9ECF3', stroke: '#CDD2DF', ink: '#1B2150', onInk: '#1B2150' },
  nahad: { on: ['#D64A6A', '#C23A5B'], tint: '#F6D9E0', stroke: '#FFFFFF', ink: '#8E2440', onInk: '#FFFFFF' },
  meydan: { on: ['#F5B700', '#F08C1A'], tint: '#FCEBC4', stroke: '#FFFFFF', ink: '#7A4C00', onInk: '#3B2B00' },
  peyvand: { on: ['#12A58E', '#1BA3C6'], tint: '#D3EFEA', stroke: '#FFFFFF', ink: '#0B5F52', onInk: '#FFFFFF' },
};

/** نمودار تعیّن امامت: ۲۴ گلبرگ در چهار عرصه؛ هر گلبرگ چهار حلقه به اندازهٔ چهار سطح امامت */
export function Wheel({ levels, selected, onPick, size = 360 }: { levels: Record<string, number>; selected?: string | null; onPick?: (id: string) => void; size?: number }) {
  const rs = [RIN, RIN + 40, RIN + 80, RIN + 120, ROUT];
  return (
    <svg viewBox="0 0 720 720" width={size} height={size} role="group" aria-label="نمودار تعیّن امامت؛ ۲۴ شایستگی در چهار سطح" className="max-w-full h-auto">
      <circle cx="360" cy="360" r="352" fill="var(--sunken)" />
      <path d={wedge(122, 180, 315)} fill="#D64A6A" /><path d={wedge(122, 315, 450)} fill="#F2B705" /><path d={wedge(122, 90, 180)} fill="#1F8FD6" />
      <path d={ring(126, 146, 182, 283)} fill="#fff" stroke="#D9DCE6" />
      {PETALS.map((pt, i) => {
        const a0 = START + i * STEP + 0.9, a1 = a0 + STEP - 1.8, m = (a0 + a1) / 2; const c = COL[pt.sector]; const on = c.on[i % 2]; const lv = levels[pt.id] ?? 0; const sel = pt.id === selected;
        const f = [0, 1, 2, 3].map((k) => (k < lv ? on : c.tint)); const st = sel ? '#1B2150' : c.stroke; const sw = sel ? 3 : 1.5;
        const norm = ((m % 360) + 360) % 360; const flip = norm > 90 && norm < 270; const [x, y] = P((RIN + ROUT) / 2 + 6, m).split(' ');
        return (
          <g key={pt.id} role={onPick ? 'button' : undefined} tabIndex={onPick ? 0 : undefined} aria-label={`${pt.name}، سطح ${fa(lv)} از ۴`} style={{ cursor: onPick ? 'pointer' : 'default' }}
            onClick={() => onPick?.(pt.id)} onKeyDown={(e) => { if (onPick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onPick(pt.id); } }}>
            <title>{pt.name}</title>
            <path d={ring(rs[0], rs[1], a0, a1)} fill={f[0]} stroke={st} strokeWidth={sw} />
            <path d={ring(rs[1], rs[2], a0, a1)} fill={f[1]} stroke={st} strokeWidth={sw} />
            <path d={ring(rs[2], rs[3], a0, a1)} fill={f[2]} stroke={st} strokeWidth={sw} />
            <path d={tip(rs[3], rs[4], a0, a1)} fill={f[3]} stroke={st} strokeWidth={sw} />
            <text transform={`translate(${x} ${y}) rotate(${(flip ? m + 180 : m).toFixed(1)})`} textAnchor="middle" dominantBaseline="middle" fontSize="15" fontWeight="800" fill={lv >= 3 ? c.onInk : c.ink} style={{ pointerEvents: 'none' }}>{pt.name}</text>
          </g>
        );
      })}
      <image href={`${import.meta.env.BASE_URL}brand/logo-mark.png`} x="315" y="300" width="90" height="120" />
    </svg>
  );
}
