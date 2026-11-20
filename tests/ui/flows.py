"""جریان کامل با کلیک واقعی، روی سرور و پایگاه دادهٔ واقعی:
کنشگر تازه در دوره ثبت‌نام می‌کند ← درس متنی را می‌خواند ← برگهٔ کار را پر می‌کند ← گزارش مأموریت می‌فرستد ← آزمون می‌دهد؛
راهیار گزارش را می‌خواند و تأیید می‌کند؛ کنشگر تأیید را در میدان و اعلان‌ها می‌بیند.
پیش‌نیاز: tests/run.py (دادهٔ نمونه با SEED_DEMO=true و کاربران آزمون ۰۱).
"""
import asyncio, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
import lib
from lib import psql, ok, done, TEH_C
from common import login, BASE, out
from playwright.async_api import async_playwright

OUT = out('flows')
L = '09127100001'
lib.wipe_users("last_name='روندآزما'")  # اجرای دوباره از صفر
lib.login(L, 'زهره', 'روندآزما', gender='FEMALE', county=TEH_C)  # ثبت‌نام کامل با شهرستان تهران (دامنهٔ راهیار ۰۲)
ROWS = [x.split('|') for x in psql("select l.type, l.id from lessons l join modules m on m.id=l.module_id join courses c on c.id=m.course_id where c.slug='nojavan-1' order by m.order, l.order").split('\n')]
TEXT = next(i for t, i in ROWS if t == 'TEXT'); SHEET = next(i for t, i in ROWS if t == 'WORKSHEET')
MISSION = next(i for t, i in ROWS if t == 'MISSION'); QUIZ = next(i for t, i in ROWS if t == 'QUIZ')


async def main():
    errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        a = await login(b, L, '10.6.6.1')
        a.on('pageerror', lambda e: errs.append(f'pageerror {e} @{a.url}'))
        await a.set_viewport_size({'width': 390, 'height': 860})

        print('۱. ثبت‌نام در دوره از صفحهٔ دوره')
        await a.goto(f'{BASE}/courses/nojavan-1'); await a.wait_for_load_state('networkidle')
        await a.get_by_role('button', name='ثبت‌نام و شروع').click(); await a.wait_for_url('**/lessons/**', timeout=8000)
        ok('/lessons/' in a.url, 'ثبت‌نام و رفتن به درس اول', a.url)

        print('۲. درس متنی: «خواندم»')
        await a.goto(f'{BASE}/lessons/{TEXT}'); await a.wait_for_load_state('networkidle')
        await a.get_by_role('button', name='خواندم').click(); await a.wait_for_timeout(800)
        ok(await a.get_by_text('این درس را').count() > 0 or await a.get_by_text('قدم بعد').count() > 0, 'درس متنی تمام شد')
        await a.screenshot(path=f'{OUT}text-done.png', full_page=True)

        print('۳. برگهٔ کار')
        await a.goto(f'{BASE}/lessons/{SHEET}'); await a.wait_for_load_state('networkidle')
        for t in await a.locator('main textarea').all():
            await t.fill('علی؛ خوش‌صحبت و منظم. مسئولیت چیدن سفرهٔ افطار.')
        await a.get_by_role('button', name='ثبت برگه').click(); await a.wait_for_timeout(800)
        ok(await a.get_by_role('button', name='ثبت برگه').count() == 0, 'برگه ثبت شد')

        print('۴. گزارش مأموریت')
        await a.goto(f'{BASE}/lessons/{MISSION}'); await a.wait_for_load_state('networkidle')
        await a.locator('#did').fill('بعد از نماز مغرب با دو نوجوان دربارهٔ اردوی تابستان حرف زدم؛ یکی پیشنهاد کلاس عکاسی داد.')
        await a.locator('#lr').fill('بیشتر شنیدن جواب داد.')
        await a.locator('main button.btn-primary').filter(has_text='گزارش').first.click(); await a.wait_for_timeout(1200)
        ok(await a.get_by_text('گزارش تو').count() > 0, 'گزارش رفت و در صفحه دیده می‌شود')
        await a.screenshot(path=f'{OUT}mission-sent.png', full_page=True)

        print('۵. آزمون')
        await a.goto(f'{BASE}/lessons/{QUIZ}'); await a.wait_for_load_state('networkidle')
        for g in await a.locator('main [role=radiogroup], main [role=group]').all():
            await g.locator('button').first.click()
        await a.get_by_role('button', name='ثبت پاسخ‌ها').click(); await a.wait_for_timeout(1200)
        ok(await a.get_by_text('حد قبولی').count() > 0, 'نتیجهٔ آزمون نشان داده شد')
        await a.screenshot(path=f'{OUT}quiz-result.png', full_page=True)

        print('۶. راهیار گزارش را تأیید می‌کند')
        r = await login(b, '09121000002', '10.6.6.2')
        r.on('pageerror', lambda e: errs.append(f'pageerror {e} @{r.url}'))
        await r.goto(f'{BASE}/rahyar/reports'); await r.wait_for_load_state('networkidle')
        await r.get_by_text('زهره روندآزما').first.click(); await r.wait_for_load_state('networkidle'); await r.wait_for_timeout(500)
        ok('/rahyar/reports/' in r.url, 'گزارش کنشگر باز شد', r.url)
        await r.locator('textarea').first.fill('آفرین؛ پیشنهاد عکاسی را جدی بگیر.')
        await r.get_by_role('button', name='تأیید با این پیام').click(); await r.wait_for_timeout(1200)
        ok(await r.get_by_text('تأیید شد').count() > 0, 'تأیید ثبت شد')
        await r.screenshot(path=f'{OUT}rahyar-approved.png', full_page=True)

        print('۷. کنشگر تأیید را می‌بیند')
        await a.goto(f'{BASE}/lessons/{MISSION}'); await a.wait_for_load_state('networkidle')
        ok(await a.get_by_text('آفرین؛ پیشنهاد عکاسی').count() > 0, 'پیام راهیار زیر گزارش')
        await a.goto(f'{BASE}/notifications'); await a.wait_for_load_state('networkidle')
        ok(await a.get_by_text('تأیید شد').count() > 0, 'اعلان تأیید رسید')
        await b.close()
    ok(not errs, 'بی خطای صفحه', errs[:5])
    done()

asyncio.run(main())
