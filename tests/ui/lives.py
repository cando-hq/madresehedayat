"""پخش زنده در مرورگر (۱.۹): ساختن «همین الان» از پنل برگزارکننده، اتاق پخش، نوار «الان زنده»، زبانهٔ پخش زنده
و صفحهٔ پخش برای مخاطب. عکس‌ها در tests/ui/out/lives/"""
import asyncio, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.async_api import async_playwright
from common import BASE, login, out, psql
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from lib import ok, done, login as api_login, staff, wipe_users, B

O = out('lives')
LEAD, VIEW = '09128800071', '09128800072'


async def main():
    wipe_users("last_name='زنده‌ای'")
    psql("delete from events where title like 'پخش آزمون مرورگر%'")
    psql("delete from publishers where name='گروه پخش مرورگر'")
    api_login(LEAD, 'کاظم', 'زنده‌ای', gender='MALE'); api_login(VIEW, 'نرگس', 'زنده‌ای')
    pid = staff().post(f'{B}/v2/admin/publishers', json={'name': 'گروه پخش مرورگر', 'adminMobile': LEAD}).json()['id']
    async with async_playwright() as p:
        b = await p.chromium.launch(); errs = []
        pg = await login(b, LEAD); pg.on('pageerror', lambda e: errs.append(str(e)))
        print('۱. از پنل برگزارکننده')
        await pg.goto(f'{BASE}/pub'); await pg.click('text=پخش زندهٔ تازه'); await pg.wait_for_selector('h1:has-text("پخش زندهٔ تازه")')
        await pg.fill('label:has-text("عنوان") input', 'پخش آزمون مرورگر')
        await pg.click('button:has-text("همین الان")')
        await pg.click('button:has-text("یک ساعت")')
        await pg.screenshot(path=O + '1-new.png', full_page=True)
        await pg.click('button:has-text("بساز و برو به اتاق پخش")')
        await pg.wait_for_selector('text=اتاق پخش'); await pg.wait_for_selector('text=کپی متن دعوت')
        ok(await pg.locator('button:has-text("ورود به پخش (میزبان)")').count() == 1, 'اتاق پخش با دکمهٔ ورود میزبان')
        await pg.screenshot(path=O + '2-room.png', full_page=True)
        print('۲. مخاطب')
        vp = await login(b, VIEW); vp.on('pageerror', lambda e: errs.append(str(e)))
        await vp.goto(f'{BASE}/'); await vp.wait_for_selector('a:has-text("پخش آزمون مرورگر")')
        ok(True, 'نوار «الان زنده» بالای خانه')
        await vp.screenshot(path=O + '3-bar.png')
        await vp.goto(f'{BASE}/learn?tab=live'); await vp.wait_for_selector('h2:has-text("الان زنده")')
        ok(await vp.locator('a:has-text("پخش آزمون مرورگر")').count() >= 1, 'در زبانهٔ «پخش زنده»')
        await vp.screenshot(path=O + '4-tab.png', full_page=True)
        await vp.click('main a:has-text("پخش آزمون مرورگر")'); await vp.wait_for_selector('button:has-text("ورود به پخش")')
        ok(True, 'صفحهٔ پخش با «ورود به پخش»')
        await vp.set_viewport_size({'width': 390, 'height': 844}); await vp.screenshot(path=O + '5-page-mobile.png', full_page=True)
        ok(not errs, 'بی خطای صفحه', errs)
        await b.close()
    psql("delete from events where title like 'پخش آزمون مرورگر%'"); psql(f"delete from publishers where id='{pid}'")
    done()

asyncio.run(main())
