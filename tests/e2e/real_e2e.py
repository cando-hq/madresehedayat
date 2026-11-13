import asyncio, re, json, hmac, hashlib, struct, time, base64, subprocess
from playwright.async_api import async_playwright
B='http://localhost:4174'
def totp(secret):
    key=base64.b32decode(secret.upper()+'='*((8-len(secret)%8)%8)); c=int(time.time())//30
    h=hmac.new(key,struct.pack('>Q',c),hashlib.sha1).digest(); o=h[-1]&15
    return str((struct.unpack('>I',h[o:o+4])[0]&0x7fffffff)%1000000).zfill(6)
def sql(q): return subprocess.run(['psql','-h','/tmp/pg','-p','5433','-U','postgres','mh','-tAc',q],capture_output=True,text=True).stdout.strip()
async def txt(pg): return await pg.locator('body').inner_text()
async def login(pg, mobile, first=None, last=None):
    codes={}
    async def on_resp(r):
        if r.url.endswith('/api/auth/otp') and r.status==200:
            try: codes['c']=(await r.json()).get('devCode')
            except: pass
    pg.on('response', on_resp)
    await pg.goto(B+'/login'); await pg.wait_for_timeout(700)
    await pg.locator('input').first.fill(mobile); await pg.get_by_role('button', name='دریافت کد').click()
    for _ in range(40):
        await pg.wait_for_timeout(200)
        if codes.get('c'): break
    t=await txt(pg)
    m=re.search(r'(\d+) ثانیه', t)
    if not codes.get('c'):
        print('  otp wait?', t[:120].replace('\n',' ')); await pg.wait_for_timeout(int(m.group(1))*1000+1000 if m else 2000)
        await pg.get_by_role('button', name=re.compile('دریافت|دوباره')).first.click()
        for _ in range(40):
            await pg.wait_for_timeout(200)
            if codes.get('c'): break
    await pg.keyboard.type(codes['c']); await pg.wait_for_timeout(1800)
    if first and (await pg.locator('input').count())>=2 and '/login' in pg.url:
        ins=pg.locator('input'); await ins.nth(0).fill(first); await ins.nth(1).fill(last)
        # از ۱.۱ استان و شهرستان در فرم ثبت‌نام نیست؛ از مسجد در آشنایی گرفته می‌شود
        await pg.get_by_role('button', name='برادر', exact=True).click()
        await pg.get_by_role('button', name='ساخت حساب و ورود').click(); await pg.wait_for_timeout(2000)
    pg.remove_listener('response', on_resp)
    print('  logged in ->', pg.url.replace(B,''))
async def shot(pg,n): await pg.screenshot(path=f'/tmp/r_{n}.png', full_page=True)
import os
ONLY=os.environ.get('ONLY','')
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        ctx=await b.new_context(viewport={'width':1280,'height':900}, geolocation={'latitude':33.9842,'longitude':51.4370}, permissions=['geolocation']); pg=await ctx.new_page()
        pg.on('pageerror', lambda e: print('PAGEERROR', str(e)[:300]))
        pg.on('response', lambda r: print('HTTP', r.status, r.url.replace(B,'')) if r.status>=500 else None)
        # ── 1 کنشگر تازه: ثبت‌نام → آنبورد با نقشه → خانه
        if ONLY: pass
        print('1) کنشگر تازه'); await login(pg,'09125550031','رضا','امینی')
        if '/onboard' in pg.url:
            await pg.get_by_role('radio', name='امام', exact=True).click(); await pg.get_by_role('button', name='ادامه').click(); await pg.wait_for_timeout(1200)
            await shot(pg,'onboard_mosque')
            await pg.get_by_role('button', name='مکانم را پیدا کن').click(); await pg.wait_for_timeout(2500)
            t=await txt(pg); print('  near list shown:', 'نزدیک تو' in t)
            r=pg.get_by_role('radio')
            if await r.count(): await r.first.click()
            await pg.get_by_role('button', name='ادامه').click(); await pg.wait_for_timeout(800)
            await pg.get_by_role('button', name='شروع کن').click(); await pg.wait_for_timeout(2500)
        print('  after onboard ->', pg.url.replace(B,'')); await shot(pg,'home')
        t=await txt(pg); print('  main path on home:', 'تعیّن امامت' in t)
        for path,need in [('/learn','تعیّن امامت'),('/field','میدان'),('/peers','گعده'),('/me','کارنامه')]:
            await pg.goto(B+path); await pg.wait_for_timeout(1500); t=await txt(pg); print(f'  {path}:', need in t, '| ERR' if 'مشکلی پیش آمد' in t or 'چیزی پیدا نشد' in t else '')
        await shot(pg,'learn')
        # start main path's first course
        await pg.goto(B+'/learn'); await pg.wait_for_timeout(1200)
        b1=pg.get_by_role('button', name=re.compile('شروع کن|ادامه بده|مسیر را بردار')).first
        if await b1.count(): await b1.click(); await pg.wait_for_timeout(1500)
        print('  after start ->', pg.url.replace(B,''))
        lk=pg.get_by_role('link', name=re.compile('امام کیست')).first
        if await lk.count(): await lk.click(); await pg.wait_for_timeout(1500); print('  course ->', pg.url.replace(B,''))
        bs=pg.get_by_role('button', name=re.compile('شروع|ادامه|ثبت‌نام')).first
        if await bs.count(): await bs.click(); await pg.wait_for_timeout(1500); print('  lesson ->', pg.url.replace(B,''))
        await shot(pg,'lesson')
        # گعده
        await pg.goto(B+'/peers'); await pg.wait_for_timeout(1200)
        nb=pg.get_by_role('button', name=re.compile('گعدهٔ تازه|گعده بساز|گعدهٔ نو')).first
        if await nb.count():
            await nb.click(); await pg.wait_for_timeout(600)
            ins=pg.locator('input:visible'); await ins.nth(0).fill('گعدهٔ امامان کاشان')
            await ins.nth(2).fill('شب اول محرم')
            await pg.get_by_role('button', name=re.compile('بساز|ساخت')).last.click(); await pg.wait_for_timeout(1500); print('  gaade ->', pg.url.replace(B,''), '| ok' if 'امامان کاشان' in await txt(pg) else '| ?')
        await shot(pg,'peers')
        # ── 2 برگزارکننده
        print('2) برگزارکننده'); await ctx.clear_cookies(); await login(pg,'09125550002')
        await pg.goto(B+'/pub'); await pg.wait_for_timeout(1500); t=await txt(pg); print('  /pub:', 'بنیاد هدایت' in t); await shot(pg,'pub')
        await pg.goto(B+'/pub/library'); await pg.wait_for_timeout(1500); print('  library:', 'دورهٔ آزمایشی استاد' in await txt(pg))
        cid=sql("select id from courses where slug like 'course-%' order by created_at desc limit 1")
        await pg.goto(B+f'/pub/courses/{cid}'); await pg.wait_for_timeout(2000); t=await txt(pg); print('  editor:', 'درس اول' in t, '| 403' if 'مال شما نیست' in t else ''); await shot(pg,'pub_editor')
        await pg.goto(B+'/pub/paths/new'); await pg.wait_for_timeout(1200); print('  path builder:', 'بفرست برای بازبینی' in await txt(pg))
        # ── 3 استاد
        print('3) استاد'); await ctx.clear_cookies(); await login(pg,'09125550003')
        await pg.goto(B+'/studio'); await pg.wait_for_timeout(1500); t=await txt(pg); print('  studio:', 'دورهٔ آزمایشی استاد' in t); await shot(pg,'studio')
        for sp in ['/studio/questions','/studio/lives','/studio/analytics']:
            await pg.goto(B+sp); await pg.wait_for_timeout(1000); t=await txt(pg); print(f'  {sp}: ok' if 'خطا' not in t else f'  {sp}: ERR')
        await pg.goto(B+f'/studio/courses/{cid}'); await pg.wait_for_timeout(1500); print('  studio editor:', 'درس اول' in await txt(pg))
        # ── 4 ستاد با MFA
        print('4) ستاد'); await ctx.clear_cookies()
        sql("insert into role_grants(id,user_id,role) select 'rg-hq-'||id,id,'HQ_ADMIN' from users where first_name='محمد' and last_name='کریمی' on conflict do nothing")
        await login(pg,'09125550011')
        await pg.goto(B+'/admin/review'); await pg.wait_for_timeout(1500); t=await txt(pg); print('  mfa gate shown:', 'رمز دوم' in t); await shot(pg,'mfa')
        sec=sql("select 1")  # placeholder
        tg=pg.get_by_text(re.compile('کلید را دستی')).first
        if await tg.count(): await tg.click(); await pg.wait_for_timeout(500)
        t=await txt(pg); m=re.search(r'([A-Z2-7]{16,})', t.replace(' ','')); print('  secret shown:', bool(m))
        if m:
            await pg.locator('input:visible').last.fill(totp(m.group(1))); await pg.get_by_role('button', name=re.compile('فعال‌سازی')).last.click(); await pg.wait_for_timeout(2000)
            await pg.goto(B+'/admin/review'); await pg.wait_for_timeout(1500); t=await txt(pg); print('  review queue:', 'دورهٔ آزمایشی استاد' in t); await shot(pg,'review')
            btn=pg.get_by_role('button', name='دورهٔ آزمایشی استاد').first
            if await btn.count():
                await btn.click(); await pg.wait_for_timeout(500)
                for cb in await pg.locator('input[type=checkbox]').all(): await cb.check()
                await pg.get_by_role('button', name='منتشر کن').click(); await pg.wait_for_timeout(1500); print('  published:', sql(f"select review_status from courses where id='{cid}'"))
            for ap in ['/admin','/admin/courses','/admin/users','/admin/mosques','/admin/publishers','/admin/events','/admin/security']:
                await pg.goto(B+ap); await pg.wait_for_timeout(1000); t=await txt(pg); print(f'  {ap}:', 'ERR' if ('خطا' in t and 'چیزی' in t) else 'ok')
        # ── 5 راهیار
        print('5) راهیار'); 
        uid=sql("select id from users where first_name='حسین' and last_name='مدرس'"); pid=sql("select id from paths2 where slug='taayon-emamat'"); lid=sql("select id from users where first_name='محمد' and last_name='کریمی'")
        sql(f"insert into path_rahyars(path_id,rahyar_id,learner_id) values('{pid}','{uid}','{lid}') on conflict do nothing"); sql(f"insert into role_grants(id,user_id,role) values('rg-r-{uid}','{uid}','RAHYAR') on conflict do nothing")
        await ctx.clear_cookies(); await login(pg,'09125550003')
        await pg.goto(B+'/rahyar'); await pg.wait_for_timeout(1500); t=await txt(pg); print('  rahyar:', 'محمد کریمی' in t); await shot(pg,'rahyar')
        await b.close()
asyncio.run(main())
