// جای‌گزین ساده برای نسخهٔ نمایشی: یک مربع نمادین به‌جای کد QR واقعی
const svg = (text: string) => {
  let h = 0; for (const c of text) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const n = 21; let cells = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
    const on = finder ? (x % 6 === 0 || y % 6 === 0 || (x % 20 > 1 && x % 20 < 5 && y % 20 > 1 && y % 20 < 5) || (x > 15 && x < 19 && y > 1 && y < 5) || (x > 1 && x < 5 && y > 15 && y < 19) || x === 14 || x === 20 || y === 14 || y === 20) : ((h = (h * 1103515245 + 12345) >>> 0) & 1);
    if (on && !(finder && ((x === 14 || x === 20) && y > 6) )) cells += `<rect x="${x + 1}" y="${y + 1}" width="1" height="1"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23" shape-rendering="crispEdges"><rect width="23" height="23" fill="#fff"/><g fill="#262A4F">${cells}</g></svg>`;
};
export default { toString: async (t: string) => svg(t), toDataURL: async (t: string) => 'data:image/svg+xml;utf8,' + encodeURIComponent(svg(t)) };
