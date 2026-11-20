"""گشت همهٔ صفحه‌ها: هر نقش، پیوندها را دنبال می‌کند؛ خطاها، API ناموفق، بیرون‌زدگی و عکس هر صفحه را ثبت می‌کند."""
import asyncio, json, re, sys, os
import os; _T = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); sys.path.insert(0, _T); sys.path.insert(0, os.path.join(_T, 'ui'))
from playwright.async_api import async_playwright
from lib import psql, totp, rand_ip
BASE = 'http://localhost:5180'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out'); os.makedirs(OUT, exist_ok=True)
PERSONAS = [  # (نام، شماره، ستاد؟، صفحه‌های آغاز)
  ('activist', '09121000003', False, ['/', '/learn', '/learn?tab=explore', '/learn?tab=main', '/field', '/peers', '/peers?tab=qa', '/peers?tab=peer', '/peers?tab=stories', '/me', '/settings', '/notifications', '/messages', '/help', '/events', '/campaigns', '/tools', '/cores']),
  ('imam', '09121000004', False, ['/', '/imam', '/manage/events', '/broadcast', '/cores']),
  ('rahyar', '09121000002', False, ['/rahyar', '/rahyar/learners', '/rahyar/reports', '/rahyar/messages', '/rahyar/tree', '/rahyar/assign', '/manage/events', '/manage/campaigns', '/broadcast']),
  ('orgadmin', '09126000001', False, ['/pub', '/pub/library', '/pub/rahyars', '/pub/impact', '/org', '/pub/paths/new']),
  ('instructor', '09121000005', False, ['/studio']),
  ('staff', '09120000000', True, ['/admin']),
]
def pattern(path):
    p = path.split('#')[0]
    p = re.sub(r'/[a-z0-9]{16,}', '/:id', p)
    p = re.sub(r'/(pl|pt|lc|l|c)-[a-z0-9-]+', '/:id', p)
    return p
async def login(b, mobile, hq, w):
    ctx = await b.new_context(viewport={'width': w, 'height': 900 if w < 500 else 860}, extra_http_headers={'X-Forwarded-For': rand_ip()})
    pg = await ctx.new_page()
    psql('delete from otp_requests')
    c = (await (await pg.request.post(f'{BASE}/api/auth/otp', data={'mobile': mobile})).json())['devCode']
    await pg.request.post(f'{BASE}/api/auth/verify', data={'mobile': mobile, 'code': c})
    if hq:
        psql("update users set totp_secret=null, totp_enabled_at=null")
        sec = (await (await pg.request.post(f'{BASE}/api/auth/mfa/setup')).json())['secret']
        await pg.request.post(f'{BASE}/api/auth/mfa/verify', data={'code': totp(sec)})
    return ctx, pg
SKIP = re.compile(r'/(logout|live/|b/|join/|verify)')
async def crawl(b, name, mobile, hq, starts, w, report):
    ctx, pg = await login(b, mobile, hq, w)
    issues = []
    cur = {'url': ''}
    pg.on('pageerror', lambda e: issues.append(('pageerror', cur['url'], str(e)[:200])))
    pg.on('console', lambda m: issues.append(('console', cur['url'], m.text[:200])) if m.type == 'error' and 'favicon' not in m.text and 'Failed to load resource' not in m.text else None)
    def onresp(r):
        if '/api/' in r.url and r.status >= 400 and r.status != 401: issues.append(('api', cur['url'], f'{r.status} {r.request.method} {r.url.split("/api")[1][:90]}'))
    pg.on('response', onresp)
    seen, queue, pats = set(), list(starts), {}
    while queue and len(seen) < 120:
        path = queue.pop(0)
        if path in seen or SKIP.search(path): continue
        pt = pattern(path)
        if pats.get(pt, 0) >= 2: continue
        pats[pt] = pats.get(pt, 0) + 1; seen.add(path); cur['url'] = path
        try:
            await pg.goto(BASE + path, wait_until='networkidle', timeout=20000)
        except Exception as e:
            issues.append(('goto', path, str(e)[:120])); continue
        await pg.wait_for_timeout(400)
        st = await pg.evaluate('''() => ({ w: document.documentElement.scrollWidth, iw: innerWidth, t: (document.querySelector('main')||document.body).innerText.slice(0,4000), url: location.pathname + location.search,
          links: [...document.querySelectorAll('a[href^="/"]')].map(a => a.getAttribute('href')),
          wide: [...document.querySelectorAll('main *')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 2 || r.left < -2) && getComputedStyle(e).position !== 'fixed' && !e.closest('.hscroll,.seg,[class*=overflow-x],table,nav') }).slice(0,3).map(e => e.tagName + '.' + (e.className||'').toString().slice(0,60) + ' «' + (e.innerText||'').slice(0,30) + '»') })''')
        if st['url'] != path.split('#')[0] and not path.startswith(st['url']): issues.append(('redirect', path, '→ ' + st['url']))
        if st['w'] > st['iw'] + 2: issues.append(('overflow', path, f"{st['w']}>{st['iw']}"))
        for x in st['wide']: issues.append(('wide', path, x))
        for bad in ['چیزی درست کار نکرد', 'این صفحه پیدا نشد', 'پیدا نشد', 'undefined', 'NaN', '[object Object]', 'null']:
            if bad in st['t']: issues.append(('text', path, bad + ' :: ' + st['t'][max(0, st['t'].find(bad)-40):st['t'].find(bad)+40].replace('\n', ' ')))
        fn = f"{name}-{w}-{len(seen):03d}.png"
        await pg.screenshot(path=f'{OUT}/{fn}')
        report['pages'].append({'who': name, 'w': w, 'path': path, 'shot': fn})
        for l in st['links']:
            l = l.split('#')[0]
            if l not in seen and not SKIP.search(l): queue.append(l)
    report['issues'] += [{'who': name, 'w': w, 'kind': k, 'path': p, 'msg': m} for k, p, m in issues]
    await ctx.close()
async def main():
    only = sys.argv[1:] or [p[0] for p in PERSONAS]
    report = {'pages': [], 'issues': []}
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for name, mob, hq, starts in PERSONAS:
            if name not in only: continue
            for w in (390, 1280):
                await crawl(b, name, mob, hq, starts, w, report)
        await b.close()
    json.dump(report, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'report.json'), 'w'), ensure_ascii=False, indent=1)
    print('pages', len(report['pages']), 'issues', len(report['issues']))
asyncio.run(main())
