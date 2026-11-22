"""برگزارکنندگان در مرورگر (۱.۷): فهرست و جست‌وجو، پروفایل، افزودن عضو با شمارهٔ بی‌حساب، ویرایش مشخصات؛
و در پنل برگزارکننده «تیم و معرفی». عکس‌ها در tests/ui/out/publishers/"""
import asyncio, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.async_api import async_playwright
from common import BASE, login, out, psql
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from lib import ok, done, login as api_login, wipe_users

O = out('publishers')
HQ, LEAD, NEW = '09120000000', '09128800031', '09128800039'


async def main():
    psql("delete from pending_invites where true")
    psql("delete from publisher_admins where publisher_id in (select id from publishers where name like 'گروه مرورگر%')")
    psql("delete from publishers where name like 'گروه مرورگر%'")
    wipe_users("last_name='مرورگری'")
    async with async_playwright() as p:
        b = await p.chromium.launch()
        errs = []
        page = await login(b, HQ, hq=True)
        page.on('pageerror', lambda e: errs.append(str(e)))

        print('۱. فهرست')
        await page.goto(f'{BASE}/admin/publishers'); await page.wait_for_selector('h1:has-text("برگزارکنندگان")')
        ok(await page.locator('text=بنیاد هدایت').count() > 0, 'برگزارکنندهٔ نمونه در فهرست')
        await page.screenshot(path=O + '1-list.png', full_page=True)

        print('۲. ساختن با شمارهٔ مدیر بی‌حساب')
        await page.click('button:has-text("برگزارکنندهٔ تازه")')
        await page.fill('label:has-text("نام") input', 'گروه مرورگر')
        await page.fill('label:has-text("شمارهٔ مدیر") input', NEW)
        await page.click('dialog button:has-text("بساز"), [role=dialog] button:has-text("بساز")')
        await page.wait_for_selector('h1:has-text("گروه مرورگر")')
        ok(await page.locator('text=منتظر اولین ورود').count() > 0, 'به پروفایل رفت و شماره منتظر است')
        await page.screenshot(path=O + '2-profile.png', full_page=True)

        print('۳. ویرایش مشخصات')
        await page.click('button:has-text("ویرایش مشخصات")')
        await page.fill('label:has-text("معرفی کوتاه") textarea', 'گروهی برای آزمون مرورگر')
        await page.click('[aria-label="رنگ #0F766E"]')
        await page.click('[role=dialog] button:has-text("ذخیره"), dialog button:has-text("ذخیره")')
        await page.wait_for_selector('text=گروهی برای آزمون مرورگر')
        ok(True, 'معرفی روی پروفایل آمد')

        print('۴. جست‌وجو در فهرست')
        await page.click('text=همهٔ برگزارکنندگان')
        await page.fill('input[placeholder*="نام برگزارکننده"]', NEW[-4:])
        await page.wait_for_timeout(200)
        ok(await page.locator('a:has-text("گروه مرورگر")').count() == 1 and await page.locator('a:has-text("بنیاد هدایت")').count() == 0, 'با شمارهٔ منتظر پیدا می‌شود')

        print('۵. پنل برگزارکننده: تیم و معرفی')
        pid = (await (await page.request.get(f'{BASE}/api/v2/admin/publishers')).json())
        pid = [x['id'] for x in pid if x['name'] == 'گروه مرورگر'][0]
        api_login(LEAD, 'زهرا', 'مرورگری', gender='FEMALE')
        r = await page.request.post(f'{BASE}/api/v2/admin/publishers/{pid}/team', data={'mobile': LEAD}); ok(r.status == 200, 'ستاد عضو حساب‌دار را اضافه کرد')
        lp = await login(b, LEAD)
        lp.on('pageerror', lambda e: errs.append(str(e)))
        await lp.goto(f'{BASE}/pub/team'); await lp.wait_for_selector('h1:has-text("تیم و معرفی")')
        ok(await lp.locator('text=گروهی برای آزمون مرورگر').count() > 0 and await lp.locator('text=(خودت)').count() == 1, 'معرفی و خودش در تیم')
        ok(await lp.locator(f'text={NEW}').count() > 0, 'شمارهٔ منتظر را هم می‌بیند')
        await lp.screenshot(path=O + '3-pub-team.png', full_page=True)
        await lp.set_viewport_size({'width': 390, 'height': 844}); await lp.screenshot(path=O + '4-pub-team-mobile.png', full_page=True)
        ok(not errs, 'بی خطای صفحه', errs)
        await b.close()
    psql("delete from pending_invites where true")
    psql("delete from publisher_admins where publisher_id in (select id from publishers where name like 'گروه مرورگر%')")
    psql("delete from publishers where name like 'گروه مرورگر%'")
    done()

asyncio.run(main())
