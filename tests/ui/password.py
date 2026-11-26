"""ورود با رمز در مرورگر (۱.۸): گذاشتن رمز از تنظیمات، بیرون آمدن، ورود با شماره و رمز از صفحهٔ ورود. عکس‌ها در tests/ui/out/password/"""
import asyncio, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.async_api import async_playwright
from common import BASE, login, out, psql, rand_ip
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from lib import ok, done, login as api_login, staff, wipe_users, B

O = out('password')
PUB = '09128800051'


async def main():
    wipe_users("last_name='رمزمرورگر'")
    psql("delete from publishers where name='گروه رمز مرورگر'")
    api_login(PUB, 'لیلا', 'رمزمرورگر')
    pid = staff().post(f'{B}/v2/admin/publishers', json={'name': 'گروه رمز مرورگر', 'adminMobile': PUB}).json()['id']
    async with async_playwright() as p:
        b = await p.chromium.launch(); errs = []
        page = await login(b, PUB); page.on('pageerror', lambda e: errs.append(str(e)))
        print('۱. هشدار در «تیم و معرفی» و گذاشتن رمز')
        await page.goto(f'{BASE}/pub/team'); await page.wait_for_selector('text=گذاشتن رمز')
        await page.click('a:has-text("گذاشتن رمز")'); await page.wait_for_selector('text=ورود با رمز')
        await page.click('button:has-text("گذاشتن رمز")')
        await page.fill('label:has-text("رمز تازه") input', 'madrese-1405')
        await page.fill('label:has-text("دوباره همان رمز") input', 'madrese-1405')
        await page.screenshot(path=O + '1-settings.png', full_page=True)
        await page.click('button:has-text("بگذار")'); await page.wait_for_selector('text=روشن است')
        ok(True, 'رمز گذاشته شد و وضعیت «روشن است»')
        print('۲. ورود با رمز')
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, extra_http_headers={'X-Forwarded-For': rand_ip()})
        lp = await ctx.new_page(); lp.on('pageerror', lambda e: errs.append(str(e)))
        await lp.goto(f'{BASE}/login'); await lp.click('text=ورود با رمز (برگزارکنندگان و استادها)')
        await lp.fill('input[autocomplete=username]', PUB); await lp.fill('input[autocomplete=current-password]', 'wrong-pass-1')
        await lp.click('button:has-text("ورود")'); await lp.wait_for_selector('[role=alert]')
        ok('شماره یا رمز درست نیست' in await lp.inner_text('[role=alert]'), 'رمز اشتباه پیام روشن دارد')
        await lp.screenshot(path=O + '2-login-wrong.png', full_page=True)
        await lp.fill('input[autocomplete=current-password]', 'madrese-1405'); await lp.click('button:has-text("ورود")')
        await lp.wait_for_url(lambda u: '/login' not in u, timeout=10000)
        ok(True, 'با شماره و رمز وارد شد، بی کد بله')
        ok(not errs, 'بی خطای صفحه', errs)
        await b.close()
    psql(f"delete from publishers where id='{pid}'")
    done()

asyncio.run(main())
