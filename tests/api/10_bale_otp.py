"""کد ورود در بله با سفیر (سرور ساختگی fakesafir.py روی ۹۳۱۰) — فقط شماره‌های ساختگی"""
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from lib import *
import requests as rq
FS = 'http://127.0.0.1:9310'
try: rq.post(f'{FS}/reset', json={}, timeout=2)
except Exception: sys.exit('سرور ساختگی سفیر بالا نیست: python3 tests/fakesafir.py')
def otp(mobile, via=None):
    psql("delete from otp_requests")
    s = requests.Session(); s.headers['X-Forwarded-For'] = rand_ip()
    return s, s.post(f'{B}/auth/otp', json={'mobile': mobile, **({'via': via} if via else {})})
print('۱. صفحهٔ ورود می‌داند بله روشن است')
o = requests.get(f'{B}/auth/options').json(); ok(o == {'sso': False, 'bale': True}, 'گزینه‌های ورود', o)
print('۲. شمارهٔ تازه: کد در بله، نه پیامک')
s, r = otp('09127770001'); j = r.json()
ok(j.get('channel') == 'BALE' and j.get('alt') == 'SMS' and j.get('isNew'), 'کد در بله رفت و پیامک جایگزین است', j)
sent = rq.get(f'{FS}/state').json()['sent']; ok(len(sent) == 1 and sent[0]['phone'] == '989127770001' and sent[0]['bot_id'] == 12345, 'شماره با ۹۸ و شناسهٔ بات درست', sent)
ok(sent[0]['otp'] == j['devCode'] and not sent[0]['otp'].startswith('0'), 'همان کد، بی صفر اول')
v = s.post(f'{B}/auth/verify', json={'mobile': '09127770001', 'code': sent[0]['otp']}).json(); ok(v.get('needsRegistration') is True, 'کدِ بله پذیرفته شد')
print('۳. شماره‌ای که بله ندارد: خودکار پیامک')
s, r = otp('09127770099'); j = r.json(); ok(j.get('channel') == 'SMS' and j.get('alt') == 'BALE', 'پیامک رفت', j)
print('۴. «با پیامک بفرست»: بله صدا زده نمی‌شود')
rq.post(f'{FS}/reset', json={}); s, r = otp('09127770002', 'sms'); j = r.json()
ok(j.get('channel') == 'SMS' and rq.get(f'{FS}/state').json()['sent'] == [], 'فقط پیامک', j)
print('۵. «در بله بفرست» برای شماره‌ای که بله ندارد')
s, r = otp('09127770099', 'bale'); ok(r.status_code == 400 and r.json().get('code') == 'bale_failed', 'پیام روشن: ' + r.json().get('message', ''))
r2 = s.post(f'{B}/auth/otp', json={'mobile': '09127770099', 'via': 'sms'}); ok(r2.ok and r2.json().get('channel') == 'SMS', 'بلافاصله پیامک گرفت (بی انتظار ۶۰ ثانیه)', r2.text)
print('۶. کد پیامکی قبلی با شکست بله باطل نمی‌شود')
psql("delete from otp_requests"); s = requests.Session(); s.headers['X-Forwarded-For'] = rand_ip()
c1 = s.post(f'{B}/auth/otp', json={'mobile': '09127770099', 'via': 'sms'}).json()['devCode']
psql("update otp_requests set created_at = created_at - interval '2 minutes', expires_at = now() + interval '1 minute'")
r = s.post(f'{B}/auth/otp', json={'mobile': '09127770099', 'via': 'bale'}); ok(r.status_code == 400, 'بله نشد')
v = s.post(f'{B}/auth/verify', json={'mobile': '09127770099', 'code': c1}).json(); ok(v.get('needsRegistration') is True, 'کد پیامکی قبلی هنوز کار می‌کند', v)
done()
