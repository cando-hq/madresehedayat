"""شمارهٔ دوم حساب: با هر دو شماره به یک حساب وارد می‌شوی.
- کاربر خودش با کدی که شمارهٔ دوم می‌گیرد وصلش می‌کند؛ ورود با شمارهٔ دوم همان حساب را باز می‌کند (نه حساب تازه)
- شماره‌ای که حساب جدا دارد یا شمارهٔ خود حساب است پذیرفته نمی‌شود
- دعوت با شمارهٔ دوم (مثلاً نقش برگزارکننده) به همان حساب می‌رسد؛ مدیر ستادِ BOOTSTRAP با شمارهٔ دوم هم مدیر است
- ستاد بی‌کد وصل و پاک می‌کند؛ برداشتن شمارهٔ دوم ورود با آن را به ثبت‌نام تازه برمی‌گرداند
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import requests
from lib import B, ok, done, psql, login, staff, wipe_users, rand_ip

A, A2, OTHER = '09128800001', '09128800002', '09128800003'
wipe_users("last_name in ('دوشماره','جدا')")
psql("delete from user_mobiles where true")

print('۱. کاربر شمارهٔ دوم را با کد وصل می‌کند')
a = login(A, 'سعید', 'دوشماره', gender='MALE')
me = a.get(f'{B}/auth/me').json(); ok(me.get('mobile2') is None, 'اول شمارهٔ دوم ندارد', me.get('mobile2'))
r = a.post(f'{B}/auth/mobile2/otp', json={'mobile': A2}); ok(r.status_code == 200 and r.json().get('devCode'), 'کد برای شمارهٔ دوم رفت', r.text[:200])
code = r.json()['devCode']
r = a.post(f'{B}/auth/mobile2', json={'mobile': A2, 'code': '00000'}); ok(r.status_code == 400 and r.json().get('code') == 'otp_wrong', 'کد اشتباه پذیرفته نمی‌شود', r.text[:200])
r = a.post(f'{B}/auth/mobile2', json={'mobile': A2, 'code': code}); ok(r.status_code == 200 and r.json().get('mobile2') == A2, 'وصل شد', r.text[:200])
ok(a.get(f'{B}/auth/me').json().get('mobile2') == A2, 'در نمایه دیده می‌شود')

print('۲. ورود با شمارهٔ دوم همان حساب است')
psql('delete from otp_requests')
s2 = requests.Session(); s2.headers['X-Forwarded-For'] = rand_ip()
c = s2.post(f'{B}/auth/otp', json={'mobile': A2}).json()
v = s2.post(f'{B}/auth/verify', json={'mobile': A2, 'code': c['devCode']}).json()
ok(v.get('needsRegistration') is False and v['user']['id'] == me['id'], 'با شمارهٔ دوم به همان حساب وارد شد', str(v)[:200])
ok(c.get('isNew') is False, 'صفحهٔ ورود شمارهٔ دوم را تازه نمی‌داند', c)

print('۳. شماره‌های نپذیرفتنی')
r = a.post(f'{B}/auth/mobile2/otp', json={'mobile': A}); ok(r.status_code == 400 and r.json().get('code') == 'mobile_same', 'شمارهٔ اصلی خودش نه', r.text[:160])
login(OTHER, 'نرگس', 'جدا', gender='FEMALE')
r = a.post(f'{B}/auth/mobile2/otp', json={'mobile': OTHER}); ok(r.status_code == 400 and r.json().get('code') == 'mobile_taken', 'شمارهٔ حساب دیگر نه', r.text[:160])
o = login(OTHER)
r = o.post(f'{B}/auth/mobile2/otp', json={'mobile': A2}); ok(r.status_code == 400 and r.json().get('code') == 'mobile_taken', 'شمارهٔ دوم کسی دیگر را نمی‌شود برداشت', r.text[:160])

print('۴. دعوت و نقش با شمارهٔ دوم به همان حساب می‌رسد')
hq = staff()
pub = psql("select id from publishers where name='بنیاد هدایت'")
r = hq.patch(f'{B}/v2/admin/publishers/{pub}', json={'adminMobile': A2}); ok(r.status_code == 200, 'مدیر برگزارکننده با شمارهٔ دوم', r.text[:160])
ok(psql(f"select count(*) from publisher_admins where user_id='{me['id']}'") == '1', 'نقش به همان حساب رسید')
psql(f"delete from publisher_admins where user_id='{me['id']}'"); psql(f"delete from role_grants where user_id='{me['id']}'")
users = hq.get(f'{B}/admin/users', params={'q': A2}).json()
ok(users['total'] == 1 and users['rows'][0]['id'] == me['id'] and users['rows'][0]['mobile2'] == A2, 'جست‌وجوی ستاد با شمارهٔ دوم پیدایش می‌کند', str(users)[:200])

print('۵. ستاد شمارهٔ دوم را پاک و دوباره وصل می‌کند')
r = hq.delete(f'{B}/admin/users/{me["id"]}/mobile2'); ok(r.status_code == 200, 'ستاد برداشت')
s3 = requests.Session(); s3.headers['X-Forwarded-For'] = rand_ip()
psql('delete from otp_requests')
c = s3.post(f'{B}/auth/otp', json={'mobile': A2}).json(); v = s3.post(f'{B}/auth/verify', json={'mobile': A2, 'code': c['devCode']}).json()
ok(v.get('needsRegistration') is True, 'بی شمارهٔ دوم، آن شماره حساب ندارد')
r = hq.post(f'{B}/admin/users/{me["id"]}/mobile2', json={'mobile': A2}); ok(r.status_code == 200 and r.json().get('mobile2') == A2, 'ستاد بی‌کد وصل کرد', r.text[:160])
r = hq.post(f'{B}/admin/users/{me["id"]}/mobile2', json={'mobile': OTHER}); ok(r.status_code == 400 and r.json().get('code') == 'mobile_taken', 'ستاد هم شمارهٔ حساب دیگر را وصل نمی‌کند', r.text[:160])
ok(psql(f"select count(*) from audit_logs where target='{me['id']}' and action like 'user.mobile2%'") == '2', 'در گزارش تغییرات ثبت شد')

print('۶. کاربر خودش برمی‌دارد')
r = a.delete(f'{B}/auth/mobile2'); ok(r.status_code == 200 and a.get(f'{B}/auth/me').json().get('mobile2') is None, 'برداشته شد')
done()
