"""پروفایل و تیم برگزارکننده (۱.۷):
- ستاد: ساختن با مدیر اول، پروفایل (آمار، تیم، منتظرها، محتوا، تاریخچه)، ویرایش مشخصات، افزودن و برداشتن عضو، برداشتن دعوت
- خود برگزارکننده: دیدن تیم، افزودن همکار (با حساب یا منتظر)، برداشتن، آخرین نفر نمی‌تواند خودش را بردارد، نوشتن معرفی
- عضو برداشته‌شده دیگر به پنل دسترسی ندارد
- سپردن دوره به استادی که هنوز حساب ندارد: منتظر می‌ماند و با اولین ورود دوره در استودیوی اوست
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from lib import B, ok, done, psql, login, staff, wipe_users

LEAD, MATE, NEW, TEACH, OUT = '09128800021', '09128800022', '09128800023', '09128800024', '09128800025'
wipe_users("last_name in ('تیمی','استادنو')")
psql("delete from pending_invites where true")
psql("delete from publishers where name like 'گروه آزمایشی%'")
hq = staff()

print('۱. ستاد می‌سازد و مدیر اول را دعوت می‌کند')
lead = login(LEAD, 'علی', 'تیمی', gender='MALE')
r = hq.post(f'{B}/v2/admin/publishers', json={'name': 'گروه آزمایشی تیم', 'kind': 'هیئت', 'referrer': 'ستاد', 'adminMobile': LEAD})
ok(r.status_code in (200, 201) and r.json().get('pending') is False, 'ساخته شد و مدیر حساب‌دار همان لحظه عضو شد', r.text[:200])
pid = r.json()['id']
r = hq.post(f'{B}/v2/admin/publishers', json={'name': 'x', 'adminMobile': LEAD}); ok(r.status_code == 400, 'نام کوتاه پذیرفته نمی‌شود')

print('۲. پروفایل در پنل ستاد')
pr = hq.get(f'{B}/v2/admin/publishers/{pid}').json()
ok(pr['publisher']['name'] == 'گروه آزمایشی تیم' and pr['publisher']['statusFa'] == 'فعال', 'مشخصات و وضعیت', pr['publisher'])
ok([a['mobile'] for a in pr['admins']] == [LEAD] and pr['admins'][0]['name'] == 'علی تیمی', 'تیم با نام و شماره', pr['admins'])
ok({'paths', 'published', 'courses', 'learners', 'inReview'} <= set(pr['stats']), 'آمار', pr['stats'])
ok(any(h['text'] == 'برگزارکننده ساخته شد' for h in pr['history']) and any(h['text'] == 'به تیم اضافه شد' for h in pr['history']), 'تاریخچه', pr['history'])
row = [x for x in hq.get(f'{B}/v2/admin/publishers').json() if x['id'] == pid][0]
ok(row['team'] == 1 and row['admins'] == ['علی تیمی'], 'فهرست تعداد تیم را دارد', row)
r = hq.patch(f'{B}/v2/admin/publishers/{pid}', json={'about': 'هیئت جوانان محله', 'color': '#0F766E', 'referrer': 'استان قم'})
ok(r.status_code == 200, 'مشخصات ویرایش شد')
p = hq.get(f'{B}/v2/admin/publishers/{pid}').json()['publisher']
ok(p['about'] == 'هیئت جوانان محله' and p['color'] == '#0F766E' and p['referrer'] == 'استان قم', 'ذخیره شد', p)
r = hq.patch(f'{B}/v2/admin/publishers/{pid}', json={'color': 'red'}); ok(r.status_code == 400, 'رنگ نامعتبر پذیرفته نمی‌شود')

print('۳. تیم از پنل خود برگزارکننده')
t = lead.get(f'{B}/v2/pub/team').json()
ok(t['publisher']['id'] == pid and t['me'] == t['admins'][0]['id'], 'تیم خودش را می‌بیند', t)
mate = login(MATE, 'مریم', 'تیمی', gender='FEMALE')
r = lead.post(f'{B}/v2/pub/team', json={'mobile': MATE}); ok(r.status_code == 200 and r.json()['pending'] is False, 'همکار حساب‌دار اضافه شد', r.text[:200])
r = lead.post(f'{B}/v2/pub/team', json={'mobile': MATE}); ok(r.status_code == 400 and r.json().get('code') == 'already', 'تکراری خطای روشن می‌دهد', r.text[:200])
ok(mate.get(f'{B}/v2/pub').status_code == 200, 'همکار پنل را باز می‌کند')
r = lead.post(f'{B}/v2/pub/team', json={'mobile': NEW}); ok(r.json().get('pending') is True, 'شمارهٔ بی‌حساب منتظر ماند')
inv = lead.get(f'{B}/v2/pub/team').json()['pending']; ok([x['mobile'] for x in inv] == [NEW], 'منتظر در تیم دیده می‌شود', inv)
r = lead.patch(f'{B}/v2/pub/profile', json={'about': 'معرفی تازه از خود تیم'}); ok(r.status_code == 200 and lead.get(f'{B}/v2/pub/team').json()['publisher']['about'] == 'معرفی تازه از خود تیم', 'تیم معرفی را می‌نویسد')
r = lead.delete(f'{B}/v2/pub/invites/{inv[0]["id"]}'); ok(r.status_code == 200 and not lead.get(f'{B}/v2/pub/team').json()['pending'], 'دعوت برداشته شد')
out = login(OUT, 'رضا', 'تیمی', gender='MALE')
ok(out.get(f'{B}/v2/pub/team').status_code == 403, 'غریبه به تیم دسترسی ندارد')

print('۴. برداشتن')
mid = [a['id'] for a in lead.get(f'{B}/v2/pub/team').json()['admins'] if a['mobile'] == MATE][0]
r = lead.delete(f'{B}/v2/pub/team/{mid}'); ok(r.status_code == 200, 'همکار برداشته شد')
ok(mate.get(f'{B}/v2/pub').status_code == 403, 'دیگر پنل را ندارد')
ok(psql(f"select count(*) from role_grants where user_id='{mid}' and role='ORG_ADMIN'") == '0', 'نقش برگزارکننده هم رفت')
lid = lead.get(f'{B}/v2/pub/team').json()['me']
r = lead.delete(f'{B}/v2/pub/team/{lid}'); ok(r.status_code == 400 and r.json().get('code') == 'last_admin', 'آخرین نفر خودش را برنمی‌دارد', r.text[:200])
r = hq.post(f'{B}/v2/admin/publishers/{pid}/team', json={'mobile': MATE}); ok(r.status_code == 200, 'ستاد دوباره اضافه کرد')
r = hq.delete(f'{B}/v2/admin/publishers/{pid}/team/{mid}'); ok(r.status_code == 200, 'ستاد برداشت')
hist = [h['text'] for h in hq.get(f'{B}/v2/admin/publishers/{pid}').json()['history']]
ok('از تیم برداشته شد' in hist and 'دعوت برداشته شد' in hist and 'مشخصات ویرایش شد' in hist, 'همه در تاریخچه', hist)

print('۵. سپردن دوره به استاد بی‌حساب')
cid = lead.post(f'{B}/v2/pub/courses', json={'title': 'دورهٔ آزمایشی تیم'}).json()['id']
r = lead.post(f'{B}/v2/pub/courses/{cid}/instructor', json={'mobile': TEACH}); ok(r.status_code == 200 and r.json().get('pending') is True, 'منتظر ماند', r.text[:200])
c = [x for x in lead.get(f'{B}/v2/pub').json()['courses'] if x['id'] == cid][0]
ok(c['instructorPending'] == TEACH and not c.get('instructor'), 'در فهرست دوره‌ها «منتظر» است', c)
teach = login(TEACH, 'حسن', 'استادنو', gender='MALE')
c = [x for x in lead.get(f'{B}/v2/pub').json()['courses'] if x['id'] == cid][0]
ok(c['instructor'] == 'حسن استادنو' and not c.get('instructorPending'), 'با اولین ورود استاد دوره شد', c)
ok('INSTRUCTOR' in (teach.get(f'{B}/auth/me').json().get('roles') or []), 'نقش استاد گرفت')

psql(f"delete from courses where id='{cid}'"); psql(f"delete from publishers where id='{pid}'")
done()
