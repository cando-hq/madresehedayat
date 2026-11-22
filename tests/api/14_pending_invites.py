"""مدیر برگزارکننده با شماره‌ای که هنوز حساب ندارد:
- ستاد شماره را می‌دهد؛ خطا نمی‌گیرد، نقش «منتظر اولین ورود» می‌ماند و در فهرست دیده می‌شود
- همین که آن شماره ثبت‌نام کند، خودکار مدیر برگزارکننده است و صف خالی می‌شود
- اگر شماره به‌عنوان شمارهٔ دوم به حسابی وصل شود، نقش به همان حساب می‌رسد
- دعوت منتظر را می‌شود برداشت
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from lib import B, ok, done, psql, login, staff, wipe_users

N1, N2, N3, OWNER = '09128800011', '09128800012', '09128800013', '09128800014'
wipe_users("last_name in ('منتظر','صاحب')")
psql("delete from pending_invites where true")
hq = staff()
pub = psql("select id from publishers where name='بنیاد هدایت'")

print('۱. شمارهٔ بی‌حساب منتظر می‌ماند')
r = hq.patch(f'{B}/v2/admin/publishers/{pub}', json={'adminMobile': N1})
ok(r.status_code == 200 and r.json().get('pending') is True, 'خطا نداد؛ منتظر اولین ورود', r.text[:200])
r = hq.patch(f'{B}/v2/admin/publishers/{pub}', json={'adminMobile': N1}); ok(r.status_code == 200, 'دوباره دادن همان شماره هم خطا نمی‌دهد')
row = [p for p in hq.get(f'{B}/v2/admin/publishers').json() if p['id'] == pub][0]
ok([x['mobile'] for x in row.get('pending', [])] == [N1], 'در فهرست برگزارکنندگان دیده می‌شود', row.get('pending'))
ok(psql(f"select count(*) from pending_invites where mobile_enc like '%{N1}%'") == '0', 'شماره رمزگذاری‌شده ذخیره شده')

print('۲. با اولین ورود مدیر می‌شود')
u = login(N1, 'حامد', 'منتظر', gender='MALE')
me = u.get(f'{B}/auth/me').json()
ok(psql(f"select count(*) from publisher_admins where user_id='{me['id']}' and publisher_id='{pub}'") == '1', 'مدیر برگزارکننده شد')
ok('ORG_ADMIN' in (me.get('roles') or []), 'نقش برگزارکننده دارد', me.get('roles'))
ok(psql(f"select count(*) from pending_invites where target_id='{pub}'") == '0', 'صف خالی شد')

print('۳. شمارهٔ دوم هم نقش منتظر را می‌گیرد')
hq.patch(f'{B}/v2/admin/publishers/{pub}', json={'adminMobile': N2})
o = login(OWNER, 'زهرا', 'صاحب', gender='FEMALE')
oid = o.get(f'{B}/auth/me').json()['id']
r = hq.post(f'{B}/admin/users/{oid}/mobile2', json={'mobile': N2}); ok(r.status_code == 200, 'ستاد شمارهٔ دوم را وصل کرد', r.text[:160])
ok(psql(f"select count(*) from publisher_admins where user_id='{oid}' and publisher_id='{pub}'") == '1', 'نقش به صاحب شمارهٔ دوم رسید')

print('۴. برداشتن دعوت منتظر')
hq.patch(f'{B}/v2/admin/publishers/{pub}', json={'adminMobile': N3})
iid = psql(f"select id from pending_invites where target_id='{pub}'")
r = hq.patch(f'{B}/v2/admin/publishers/{pub}', json={'cancelPending': iid}); ok(r.status_code == 200, 'برداشته شد')
ok(psql("select count(*) from pending_invites") == '0', 'صف خالی است')
r = hq.patch(f'{B}/v2/admin/publishers/{pub}', json={'adminMobile': '0912'}); ok(r.status_code == 400 and r.json().get('code') == 'bad_mobile', 'شمارهٔ ناقص پذیرفته نمی‌شود')
psql(f"delete from publisher_admins where user_id in ('{me['id']}','{oid}')"); psql(f"delete from role_grants where user_id in ('{me['id']}','{oid}') and role='ORG_ADMIN'")
done()
