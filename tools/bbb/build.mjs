// ساختن apps/web/public/bbb/theme.css از tools/bbb/theme.src.css با فونت رواق درون‌خطی (base64)
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const font = (f, w) => `@font-face{font-family:'Ravagh';src:url(data:font/woff;base64,${readFileSync(join(root, 'apps/web/public/fonts', f)).toString('base64')}) format('woff');font-weight:${w};font-display:swap}`;
const css = readFileSync(join(root, 'tools/bbb/theme.src.css'), 'utf8')
  .replace('/*FONTS*/', [font('RavaghFaNum-Regular.woff', 400), font('RavaghFaNum-Bold.woff', 700)].join('\n'));
writeFileSync(join(root, 'apps/web/public/bbb/theme.css'), css);
console.log('theme.css', css.length);
