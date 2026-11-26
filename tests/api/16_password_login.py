"""ورود با رمز ثابت برای برگزارکنندگان و استادها (۱.۸):
- کنشگر عادی نمی‌تواند رمز بگذارد؛ عضو تیم برگزارکننده می‌تواند
- رمز ضعیف (کوتاه، تکراری، خود شماره) پذیرفته نمی‌شود
- ورود با شماره و رمز (و با شمارهٔ دوم)، بدون کد؛ رمز اشتباه پیام یکسان می‌دهد و پنج اشتباه قفل می‌کند
- برای عوض کردن رمز در نشستی که با رمز باز شده، رمز فعلی لازم است؛ در نشست بله نه
- عوض کردن رمز نشست‌های رمزیِ قبلی را می‌بندد
- برداشته شدن از تیم ورود با رمز را می‌بندد
- رمز در پایگاه با scrypt است، نه خام
"""
import os, sys, requests
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from lib import B, ok, done, psql, login, staff, wipe_users, rand_ip

import random
# قفل رمز در حافظهٔ API می‌ماند؛ هر اجرا شماره‌های تازه می‌گیرد
_r = random.randint(1000, 9999)
PUB, NORMAL, TWO = f'0912881{_r}', '09128800042', f'0912882{_r}'
wipe_users("last_name in ('رمزدار','بی‌رمز')")
psql("delete from publishers where name='گروه آزمایشی رمز'")
hq = staff()

def pw_login(mobile, password):
    s = requests.Session(); s.headers['X-Forwarded-For'] = rand_ip()
    return s, s.post(f'{B}/auth/password/login', json={'mobile': mobile, 'password': password})

print('۱. چه کسی رمز می‌گذارد')
n = login(NORMAL, 'سارا', 'بی‌رمز')
me = n.get(f'{B}/auth/me').json(); ok(me['password'] == {'allowed': False, 'setAt': None}, 'کنشگر عادی اجازه ندارد', me.get('password'))
r = n.post(f'{B}/auth/password', json={'password': 'kandoo-1405!'}); ok(r.status_code == 400 and r.json()['code'] == 'pw_not_allowed', 'رمز گذاشتن برایش بسته است', r.text[:160])
p = login(PUB, 'نادر', 'رمزدار', gender='MALE')
pid = hq.post(f'{B}/v2/admin/publishers', json={'name': 'گروه آزمایشی رمز', 'adminMobile': PUB}).json()['id']
ok(p.get(f'{B}/auth/me').json()['password']['allowed'] is True, 'عضو تیم برگزارکننده اجازه دارد')

print('۲. رمز ضعیف')
for bad, why in [('short1', 'کوتاه'), ('aaaaaaaaaa', 'تکراری'), (PUB, 'خود شماره'), ('12345678', 'ساده')]:
    r = p.post(f'{B}/auth/password', json={'password': bad}); ok(r.status_code == 400 and r.json()['code'] == 'pw_weak', f'رمز {why} پذیرفته نشد', r.text[:160])
r = p.post(f'{B}/auth/password', json={'password': 'kandoo-1405!'}); ok(r.status_code == 200, 'رمز خوب گذاشته شد', r.text[:160])
h = psql(f"select password_hash from users where id='{p.get(f'{B}/auth/me').json()['id']}'")
ok(h.startswith('scrypt$') and 'kandoo' not in h, 'رمز درهم‌سازی شده ذخیره شد')
ok(p.get(f'{B}/auth/me').json()['password']['setAt'], 'تاریخ گذاشتن رمز')

print('۳. ورود با رمز')
s, r = pw_login(PUB, 'kandoo-1405!'); ok(r.status_code == 200 and r.json()['user']['firstName'] == 'نادر', 'با شماره و رمز وارد شد', r.text[:200])
me = s.get(f'{B}/auth/me').json(); ok(me['viaPassword'] is True and me['publisher'], 'نشست رمزی و پنل برگزارکننده', me.get('viaPassword'))
ok(s.get(f'{B}/v2/pub').status_code == 200, 'پنل برگزارکننده باز است')
_, r = pw_login(PUB, 'wrong-pass'); ok(r.status_code == 401 and r.json()['code'] == 'pw_wrong', 'رمز اشتباه')
_, r2 = pw_login(NORMAL, 'whatever-1'); ok(r2.status_code == 401 and r2.json()['message'] == r.json()['message'], 'بی‌رمز همان پیام را می‌گیرد (چیزی لو نمی‌رود)')
_, r3 = pw_login('09128899999', 'whatever-1'); ok(r3.status_code == 401 and r3.json()['message'] == r.json()['message'], 'شمارهٔ ناشناس هم همان پیام')

print('۴. شمارهٔ دوم')
psql("delete from otp_requests")
c = p.post(f'{B}/auth/mobile2/otp', json={'mobile': TWO}).json()
r = p.post(f'{B}/auth/mobile2', json={'mobile': TWO, 'code': c.get('devCode')}); ok(r.status_code == 200, 'شمارهٔ دوم وصل شد', r.text[:160])
_, r = pw_login(TWO, 'kandoo-1405!'); ok(r.status_code == 200, 'با شمارهٔ دوم و همان رمز هم وارد شد', r.text[:160])

print('۵. عوض کردن رمز')
r = s.post(f'{B}/auth/password', json={'password': 'new-pass-1405'}); ok(r.status_code == 400 and r.json()['code'] == 'pw_current', 'در نشست رمزی رمز فعلی لازم است')
r = s.post(f'{B}/auth/password', json={'password': 'new-pass-1405', 'current': 'wrong'}); ok(r.status_code == 400 and r.json()['code'] == 'pw_current', 'رمز فعلی اشتباه')
r = p.post(f'{B}/auth/password', json={'password': 'new-pass-1405'}); ok(r.status_code == 200, 'در نشست بله بی رمز فعلی عوض شد (رمز فراموش‌شده)')
ok(s.post(f'{B}/auth/refresh').status_code == 401, 'نشست رمزی قبلی بسته شد')
ok(p.post(f'{B}/auth/refresh').status_code == 200, 'نشست بله باز ماند')
_, r = pw_login(PUB, 'kandoo-1405!'); ok(r.status_code == 401, 'رمز قبلی دیگر کار نمی‌کند')
s, r = pw_login(PUB, 'new-pass-1405'); ok(r.status_code == 200, 'رمز تازه کار می‌کند')

print('۶. قفل پس از پنج اشتباه')
for i in range(5): _, r = pw_login(PUB, f'bad-pass-{i}')
ok(r.status_code == 401 and r.json()['data']['left'] == 0, 'پنجمین اشتباه: فرصتی نمانده', r.text[:200])
_, r = pw_login(PUB, 'new-pass-1405'); ok(r.status_code == 429 and r.json()['code'] == 'pw_locked', 'حتی رمز درست تا ۱۵ دقیقه قفل است', r.text[:200])

print('۷. بیرون رفتن از تیم و خاموش کردن')
uid = p.get(f'{B}/auth/me').json()['id']
ok(hq.delete(f'{B}/v2/admin/publishers/{pid}/team/{uid}').status_code == 200, 'ستاد از تیم برداشت')
ok(p.get(f'{B}/auth/me').json()['password']['allowed'] is False, 'دیگر اجازهٔ رمز ندارد')
psql(f"update users set password_hash=null where id='{uid}'")
r = p.delete(f'{B}/auth/password'); ok(r.status_code == 200, 'خاموش کردن رمز')
psql(f"delete from publishers where id='{pid}'")
done()
