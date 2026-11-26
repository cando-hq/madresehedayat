"""ثبت‌نام و نخستین ورود در مرورگر گوشی (۱.۱۱). عکس‌ها در tests/ui/out/onboard/
- اسم و برادر/خواهر ← «تو مسجد چه‌کاره‌ای؟» با پیشنهادها ← «مسجدت کجاست؟» روی نقشه
- با مکان: نزدیک‌ها می‌آیند، زدن مسجد کارتش را با «همین است» می‌آورد، و به خانه می‌رسیم
- نقش نوشتنی: «شریکة الامام (همسر امام)» ← SHARIK؛ «خادم مسجد» ← دیگر، با همان نوشته
- بی‌مکان: جستجوی اسم مسجد در کل کشور؛ «مسجدم این‌جا نیست» با نشانگر وسط نقشه مسجد تازه می‌سازد
"""
import asyncio, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.async_api import async_playwright
from common import BASE, out, psql, rand_ip
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from lib import ok, done, wipe_users

O = out('onboard')
A, C = '09128800171', '09128800172'
wipe_users("last_name='نقشه‌آزما'")
psql("delete from mosques where name like 'مسجد آزمون نقشه%' or name='مسجد تازهٔ آزمون نقشه'")
TEH = psql("select c.id from counties c join provinces p on p.id=c.province_id where p.name='تهران' and c.name='تهران'")
psql(f"insert into mosques (id, name, county_id, lat, lng, verified) values ('mq-map-1', 'مسجد آزمون نقشه یک', '{TEH}', 35.7010, 51.3390, true), ('mq-map-2', 'مسجد آزمون نقشه دو', '{TEH}', 35.7030, 51.3420, true)")


async def signup(b, mobile, geo, first):
    kw = dict(geolocation={'latitude': 35.7003, 'longitude': 51.3380}, permissions=['geolocation']) if geo else {}
    ctx = await b.new_context(viewport={'width': 390, 'height': 844}, extra_http_headers={'X-Forwarded-For': rand_ip()}, **kw)
    pg = await ctx.new_page(); codes = {}
    async def on(r):
        if r.url.endswith('/api/auth/otp') and r.status == 200: codes['c'] = (await r.json()).get('devCode')
    pg.on('response', on)
    await pg.goto(f'{BASE}/login'); await pg.fill('#mobile', mobile); await pg.click('button:has-text("کد را بفرست")')
    await pg.wait_for_selector('#code'); await pg.wait_for_timeout(300); await pg.fill('#code', codes['c'])
    try: await pg.wait_for_selector('text=اسمت چیست', timeout=8000)
    except Exception: await pg.screenshot(path=O + 'dbg.png'); print(codes, pg.url); raise
    await pg.fill('#fn', first); await pg.fill('#ln', 'نقشه‌آزما'); await pg.click('button:has-text("خواهرم")')
    await pg.click('button:has-text("بعدی")'); await pg.wait_for_selector('text=تو مسجد چه‌کاره‌ای')
    return pg


async def main():
    psql('delete from otp_requests')
    async with async_playwright() as p:
        b = await p.chromium.launch(); errs = []
        print('۱. با مکان، با پیشنهاد نقش')
        pg = await signup(b, A, True, 'زهرا'); pg.on('pageerror', lambda e: errs.append(str(e)))
        ok(await pg.locator('button:has-text("بعدی")').is_disabled(), 'تا نقشی نیامده «بعدی» بسته است')
        await pg.click('button:has-text("شریکة الامام (همسر امام)")'); await pg.screenshot(path=O + '1-role.png')
        await pg.click('button:has-text("بعدی")'); await pg.wait_for_selector('text=مسجدت کجاست')
        await pg.wait_for_selector('[role=radio]:has-text("مسجد آزمون نقشه یک")', timeout=15000)
        ok('مسجدی که همسرت امامش است' in await pg.inner_text('main'), 'متن قدم مسجد به نقش بسته است')
        await pg.screenshot(path=O + '2-near.png')
        await pg.click('[role=radio]:has-text("مسجد آزمون نقشه یک")'); await pg.wait_for_selector('button:has-text("همین است")')
        await pg.screenshot(path=O + '3-picked.png')
        await pg.click('button:has-text("همین است")'); await pg.wait_for_url(f'{BASE}/', timeout=10000)
        ok(psql(f"select actor_role||'|'||mosque_id||'|'||mosque_relation from users where first_name='زهرا' and last_name='نقشه‌آزما'") == 'SHARIK|mq-map-1|شریکة الامام (همسر امام)', 'نقش، مسجد و نوشتهٔ نقش ذخیره شد')

        print('۲. بی‌مکان، نقش نوشتنی، جستجو و مسجد تازه')
        pg = await signup(b, C, False, 'سارا'); pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.fill('input[aria-label="نقشت در مسجد"]', 'خادم مسجد'); await pg.click('button:has-text("بعدی")')
        await pg.wait_for_selector('text=اسم مسجد را بنویس', state='attached')
        ok('مسجد محله‌ات' in await pg.inner_text('main'), 'نقش نامعلوم: متن عمومی')
        await pg.fill('input[aria-label="جستجوی اسم مسجد"]', 'آزمون نقشه دو')
        await pg.wait_for_selector('[role=radio]:has-text("مسجد آزمون نقشه دو")', timeout=15000); ok(True, 'جستجو در کل کشور پیدا کرد')
        await pg.click('[role=radio]:has-text("مسجد آزمون نقشه دو")'); await pg.wait_for_timeout(1500)
        await pg.click('button:has-text("عوض کن")'); await pg.click('button:has-text("مسجدم این‌جا نیست")')
        await pg.wait_for_selector('text=مسجدت دقیقاً کجاست'); await pg.fill('#nm', 'مسجد تازهٔ آزمون نقشه')
        await pg.screenshot(path=O + '4-pin.png')
        await pg.click('button:has-text("ثبت و ادامه")'); await pg.wait_for_url(f'{BASE}/', timeout=10000)
        r = psql(f"select u.actor_role||'|'||u.mosque_relation||'|'||m.name||'|'||m.verified||'|'||u.county_id from users u join mosques m on m.id=u.mosque_id where u.first_name='سارا' and u.last_name='نقشه‌آزما'")
        ok(r == f'OTHER|خادم مسجد|مسجد تازهٔ آزمون نقشه|false|{TEH}', 'مسجد تازه با شهرستان مسجد نزدیک ساخته شد و نقش نوشتنی ماند', r)
        ok(not errs, 'بی خطای صفحه', errs)
        await b.close()
    wipe_users("last_name='نقشه‌آزما'")
    psql("delete from mosques where name like 'مسجد آزمون نقشه%' or name='مسجد تازهٔ آزمون نقشه'")
    done()

asyncio.run(main())
