import { compile } from '/opt/npm-tools/node_modules/tailwindcss/dist/lib.mjs';
import fs from 'node:fs'; import path from 'node:path';
const TW = '/opt/npm-tools/node_modules/tailwindcss/';
let css = fs.readFileSync('/home/claude/full/r/apps/web/src/styles/app.css', 'utf8').replace(/@import 'vazirmatn[^;]*;/, '').replace(/@font-face \{ font-family: 'Ravagh';[^\n]*\n/g, '');
const c = await compile(css, { base: TW, loadStylesheet: async (id, base) => {
  const p = id === 'tailwindcss' ? TW + 'index.css' : path.resolve(base, id.replace(/^tailwindcss\//, '') + (id.endsWith('.css') ? '' : '.css'));
  return { path: p, base: path.dirname(p), content: fs.readFileSync(p, 'utf8') };
}, loadModule: async () => { throw new Error('no modules'); } });
const cand = new Set();
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (/\.(tsx?|html)$/.test(f)) for (const m of fs.readFileSync(p, 'utf8').matchAll(/[^\s"'`]+/g)) cand.add(m[0]); } })('/home/claude/full/r/apps/web/src');
fs.readFileSync('/home/claude/full/r/apps/web/index.html','utf8').match(/[^\s"'`<>=]+/g).forEach((x)=>cand.add(x));
fs.writeFileSync('out/app.css', c.build([...cand]));
console.log('candidates', cand.size, 'css bytes', fs.statSync('out/app.css').size);
