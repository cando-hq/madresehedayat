import { createRequire } from 'node:module';
const require_ = createRequire(import.meta.url);
import * as esbuild from '/opt/npm-tools/node_modules/esbuild/lib/main.js';
const S = '/home/claude/demobuild/shims/';
const alias = { 'react-router': S + 'router.tsx', '@tanstack/react-query': S + 'query.tsx', 'lucide-react': S + 'lucide.ts', qrcode: S + 'qrcode.ts' };
await esbuild.build({
  entryPoints: ['/home/claude/full/r/apps/web/src/main.tsx'], bundle: true, outfile: 'out/app.js', format: 'iife', minify: true, target: 'es2020',
  jsx: 'automatic', loader: { '.json': 'json' }, logLevel: 'warning',
  define: { 'import.meta.env.VITE_DEMO': '"1"', 'import.meta.env': '{"VITE_DEMO":"1","MODE":"production","PROD":true,"DEV":false}', 'process.env.NODE_ENV': '"production"' },
  nodePaths: ['/opt/npm-tools/node_modules'],
  plugins: [{ name: 'shim', setup(b) {
    b.onResolve({ filter: /^react(-dom)?(\/.*)?$/ }, (a) => ({ path: require_.resolve(a.path, { paths: ['/opt/npm-tools/node_modules'] }) }));
    b.onResolve({ filter: /^(react-router|@tanstack\/react-query|lucide-react|qrcode)$/ }, (a) => ({ path: alias[a.path] }));
    b.onResolve({ filter: /\.css$/ }, (a) => ({ path: a.path, namespace: 'nocss' }));
    b.onLoad({ filter: /.*/, namespace: 'nocss' }, () => ({ contents: '', loader: 'js' }));
  } }],
});
