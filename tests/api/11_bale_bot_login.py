"""ورود با بات بله وقتی پیامک راه نیفتاده (بات ساختگی fakebale.py روی ۹۳۲۰ و یک API در حالت production با SMS_PROVIDER=console روی BOT_API_URL)"""
import os, sys, time, re; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from lib import *
import requests as rq
FB = 'http://127.0.0.1:9320'
B2 = os.environ.get('BOT_API_URL', 'http://localhost:3101/api')
try: rq.post(f'{FB}/reset', json={}, timeout=2); rq.get(f'{B2}/health', timeout=2)
except Exception:
    print('  (رد شد: fakebale.py یا API حالت بات بالا نیست؛ tests/README)'); sys.exit(0)
def push(**msg): rq.post(f'{FB}/push', json={'message': msg})
def sent_after(n, t=12):
    end = time.time() + t
    while time.time() < end:
        s = rq.get(f'{FB}/state').json()['sent']
        if len(s) > n: return s
        time.sleep(0.5)
    return rq.get(f'{FB}/state').json()['sent']
import random
N = f'{random.randint(1000, 9999)}'
M = '0912777' + N
psql(f"delete from otp_requests")
print('۱. پیامک راه نیفتاده: صفحهٔ ورود به بات بله می‌فرستد')
o = requests.get(f'{B2}/auth/options').json(); ok(o.get('baleBot') is True, 'گزینهٔ بات روشن است', o)
s = requests.Session(); s.headers['X-Forwarded-For'] = rand_ip()
j = s.post(f'{B2}/auth/otp', json={'mobile': M}).json()
ok(j.get('channel') == 'BALE_BOT' and re.fullmatch(r'https://ble\.ir/\w+\?start=login', j.get('botUrl') or '') and 'devCode' not in j, 'کانال بات و نشانی بات', j)
print('۲. /start: بات دکمهٔ «شماره‌ام را بفرست» می‌دهد')
push(message_id=1, chat={'id': 501}, **{'from': {'id': 501}}, text='/start login')
s1 = sent_after(0); kb = s1[-1].get('reply_markup', {}).get('keyboard', [[{}]])[0][0]
ok(kb.get('request_contact') is True, 'دکمهٔ درخواست شماره', s1[-1])
print('۳. کارت تماس کس دیگر پذیرفته نمی‌شود')
push(message_id=2, chat={'id': 501}, **{'from': {'id': 501}}, contact={'phone_number': '98912777' + N, 'first_name': 'x', 'user_id': 999})
s2 = sent_after(len(s1)); ok('فقط شمارهٔ خودت' in s2[-1]['text'] and not re.search(r'\d{5}', s2[-1]['text']), 'رد شد و کدی نرفت', s2[-1]['text'])
push(message_id=3, chat={'id': 501}, **{'from': {'id': 501}}, contact={'phone_number': '98912777' + N, 'first_name': 'x'})
s3 = sent_after(len(s2)); ok('فقط شمارهٔ خودت' in s3[-1]['text'], 'بی user_id هم رد شد')
print('۴. شمارهٔ خود فرستنده: کد در گفت‌وگو می‌آید و ورود کار می‌کند')
push(message_id=4, chat={'id': 501}, **{'from': {'id': 501}}, contact={'phone_number': '+98 912 777 ' + N, 'first_name': 'x', 'user_id': 501})
s4 = sent_after(len(s3)); code = re.search(r'\b(\d{5})\b', s4[-1]['text'])
ok(code and s4[-1].get('reply_markup', {}).get('remove_keyboard') is True, 'کد پنج‌رقمی رسید', s4[-1]['text'])
v = s.post(f'{B2}/auth/verify', json={'mobile': M, 'code': code.group(1)}).json(); ok(v.get('needsRegistration') is True, 'کد بات پذیرفته شد', v)
print('۵. کد دوم بلافاصله نمی‌آید (۱۰ ثانیه فاصله)')
push(message_id=5, chat={'id': 501}, **{'from': {'id': 501}}, contact={'phone_number': '98912777' + N, 'first_name': 'x', 'user_id': 501})
s5 = sent_after(len(s4)); ok('چند ثانیه' in s5[-1]['text'], 'فاصله رعایت شد', s5[-1]['text'])
print('۶. کاربر موجود: گفت‌وگو برای اعلان‌ها وصل می‌شود')
r = s.post(f'{B2}/auth/register', json={'regToken': v['regToken'], 'firstName': 'بات', 'lastName': 'آزمون', 'gender': 'MALE'}); ok(r.ok, 'ثبت‌نام شد', r.text[:200])
ok(psql("select count(*) from messenger_links where provider='BALE' and chat_id='501'") == '1', 'کاربر تازه: همان گفت‌وگویی که کد گرفت با ثبت‌نام وصل شد')
time.sleep(10.5)
push(message_id=6, chat={'id': 777}, **{'from': {'id': 777}}, contact={'phone_number': '98912777' + N, 'first_name': 'a', 'user_id': 777})
s6 = sent_after(len(s5)); ok(re.search(r'\b\d{5}\b', s6[-1]['text']), 'کد دوباره رفت', s6[-1]['text'])
ok(psql("select count(*) from messenger_links where provider='BALE' and chat_id='777'") == '1', 'گفت‌وگو به حساب وصل شد')
print('۷. بار بعد کد بی‌واسطه در همان گفت‌وگوی بله می‌آید، بی پیشنهاد پیامکِ راه‌نیفتاده')
psql('delete from otp_requests'); n = len(rq.get(f'{FB}/state').json()['sent'])
j = s.post(f'{B2}/auth/otp', json={'mobile': M}).json(); ok(j.get('channel') == 'BALE' and j.get('alt') is None, 'کانال بله، بدون پیامک', j)
s7 = sent_after(n); ok(s7[-1]['chat_id'] in ('777', 777) and re.search(r'\b\d{5}\b', s7[-1]['text']), 'کد در گفت‌وگو', s7[-1])
done()
