"""پخش زنده به‌عنوان واحد مستقل (۱.۹):
- کنشگر عادی نمی‌سازد؛ تیم برگزارکننده، استاد (فقط برای دورهٔ خودش) و ستاد (مستقیم یا به نام برگزارکننده) می‌سازند
- «همین الان»: بی‌بازبینی منتشر می‌شود، در «الان زنده» و نوار بالا دیده می‌شود، مخاطب با یک ضربه وارد می‌شود
- مخاطب مسیر: فقط کنشگران آن مسیر؛ «یادم بینداز»؛ ورود پیش از ربع ساعت مانده بسته است
- اتاق پخش فقط برای میزبان و تیم؛ متن دعوت با پیوند
- توقف با دلیل (ستاد) و خبر به سازنده؛ بعد از توقف ورود بسته است
- صفحهٔ قدیمی برنامه می‌گوید این یک پخش زنده است
"""
import os, sys
from datetime import datetime, timedelta, timezone
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from lib import B, ok, done, psql, login, staff, wipe_users

LEAD, VIEW, OUT, TEACH = '09128800061', '09128800062', '09128800063', '09128800064'
wipe_users("last_name='پخشی'")
psql("delete from publishers where name='گروه آزمایشی پخش'")
hq = staff()
iso = lambda mins: (datetime.now(timezone.utc) + timedelta(minutes=mins)).isoformat()

print('۱. چه کسی می‌سازد')
view = login(VIEW, 'سمیه', 'پخشی')
o = view.get(f'{B}/v2/lives/options').json(); ok(o['canCreate'] is False, 'کنشگر عادی نمی‌سازد', o)
r = view.post(f'{B}/v2/lives', json={'title': 'آزمون', 'now': True, 'minutes': 30, 'audience': 'ALL'}); ok(r.status_code == 403, 'ساختن برایش بسته است')
lead = login(LEAD, 'حمید', 'پخشی', gender='MALE')
pid = hq.post(f'{B}/v2/admin/publishers', json={'name': 'گروه آزمایشی پخش', 'adminMobile': LEAD}).json()['id']
o = lead.get(f'{B}/v2/lives/options').json(); ok(o['canCreate'] and not o['onlyCourses'] and [p['id'] for p in o['publishers']] == [pid], 'تیم برگزارکننده می‌سازد', o)

print('۲. همین الان، برای همه')
r = lead.post(f'{B}/v2/lives', json={'title': 'پرسش و پاسخ گعده', 'about': 'یک ساعت گفت‌وگو', 'now': True, 'minutes': 60, 'audience': 'ALL', 'record': True})
ok(r.status_code in (200, 201), 'ساخته شد', r.text[:200]); L1 = r.json()['id']
d = view.get(f'{B}/v2/lives/{L1}').json()
ok(d['state'] == 'LIVE' and d['inAudience'] and d['publisher']['name'] == 'گروه آزمایشی پخش' and d['host'] == 'حمید پخشی', 'بی‌بازبینی زنده است، با نام برگزارکننده و میزبان', d)
ok(psql(f"select status||'/'||is_live||'/'||use_bbb||'/'||record from events where id='{L1}'") == 'PUBLISHED/true/true/true', 'منتشرشده، روی سرور کلاس، با ضبط')
lst = view.get(f'{B}/v2/lives').json(); ok(any(x['id'] == L1 for x in lst['now']), 'در «الان زنده»')
ok(any(x['id'] == L1 for x in view.get(f'{B}/v2/lives/now').json()), 'در نوار بالا')
j = view.post(f'{B}/v2/lives/{L1}/join'); ok(j.status_code == 200 and 'url' in j.json(), 'مخاطب با یک ضربه وارد شد', j.text[:200])
ok('bbb_override_default_locale=fa-IR' in j.json()['url'] and 'bbb_custom_style_url=' in j.json()['url'] and '%2Fbbb%2Ftheme.css' in j.json()['url'], 'کلاس فارسی با پوستهٔ مدرسه', j.json()['url'][:300])
ok(psql(f"select status from registrations where event_id='{L1}' and user_id=(select id from users where last_name='پخشی' and first_name='سمیه')") == 'REGISTERED', 'ورود خودش ثبت‌نام هم هست')
hj = lead.post(f'{B}/v2/lives/{L1}/join'); ok(hj.status_code == 200, 'میزبان وارد شد')
ok(view.get(f'{B}/events/{L1}').json().get('isLive') is True, 'صفحهٔ قدیمی برنامه می‌داند پخش زنده است')

print('۳. اتاق پخش')
room = lead.get(f'{B}/v2/lives/{L1}/room').json()
ok(room['link'].endswith(f'/live/{L1}') and room['link'] in room['invite'] and 'پرسش و پاسخ گعده' in room['invite'], 'متن دعوت با پیوند', room.get('invite'))
ok(room['remindedCount'] >= 1, 'شمار ثبت‌نامی‌ها', room.get('remindedCount'))
ok(view.get(f'{B}/v2/lives/{L1}/room').status_code == 403, 'اتاق برای مخاطب بسته است')
ok(any(x['id'] == L1 for x in lead.get(f'{B}/v2/lives/mine').json()), 'در «پخش‌های من»')

print('۴. برای کنشگران یک مسیر، زمان‌دار')
PATH = psql("select id from paths2 where status='PUBLISHED' order by created_at limit 1")
r = hq.post(f'{B}/v2/lives', json={'title': 'جلسهٔ زندهٔ مسیر', 'startsAt': iso(180), 'minutes': 45, 'audience': 'PATH', 'pathId': PATH})
ok(r.status_code in (200, 201), 'ستاد برای مسیر ساخت', r.text[:200]); L2 = r.json()['id']
out = login(OUT, 'رضا', 'پخشی', gender='MALE')
d = out.get(f'{B}/v2/lives/{L2}').json(); ok(d['inAudience'] is False and d['audienceNote'], 'بیرون از مسیر: یادداشت روشن')
ok(not any(x['id'] == L2 for x in out.get(f'{B}/v2/lives').json()['soon']), 'در فهرستش نیست')
ok(out.post(f'{B}/v2/lives/{L2}/join').status_code == 403, 'ورود بسته است')
uid = out.get(f'{B}/auth/me').json()['id']
psql(f"insert into path_enrollments (user_id, path_id) values ('{uid}', '{PATH}') on conflict do nothing")
ok(out.get(f'{B}/v2/lives/{L2}').json()['inAudience'] is True, 'با برداشتن مسیر مخاطب شد')
ok(any(x['id'] == L2 for x in out.get(f'{B}/v2/lives').json()['soon']), 'در «به‌زودی»')
r = out.post(f'{B}/v2/lives/{L2}/join'); ok(r.status_code == 400 and r.json()['code'] == 'early', 'زودتر از ربع ساعت مانده بسته است')
ok(out.post(f'{B}/v2/lives/{L2}/remind').json()['reminded'] is True and out.get(f'{B}/v2/lives/{L2}').json()['reminded'], 'یادم بینداز')
r = hq.post(f'{B}/v2/lives', json={'title': 'بی‌مسیر', 'now': True, 'minutes': 30, 'audience': 'PATH'}); ok(r.status_code == 400 and r.json()['code'] == 'no_path', 'مسیر انتخاب‌نشده')
r = lead.post(f'{B}/v2/lives', json={'title': 'گذشته', 'startsAt': iso(-60), 'minutes': 30, 'audience': 'ALL'}); ok(r.status_code == 400 and r.json()['code'] == 'past', 'زمان گذشته پذیرفته نیست')

print('۵. استاد فقط برای دورهٔ خودش')
teach = login(TEACH, 'مهدی', 'پخشی', gender='MALE')
tid = teach.get(f'{B}/auth/me').json()['id']
cid = lead.post(f'{B}/v2/pub/courses', json={'title': 'دورهٔ آزمایشی پخش'}).json()['id']
psql(f"update courses set instructor_id='{tid}' where id='{cid}'")
o = teach.get(f'{B}/v2/lives/options').json(); ok(o['canCreate'] and o['onlyCourses'] and [c['id'] for c in o['courses']] == [cid], 'استاد فقط دوره‌های خودش را می‌بیند', o)
r = teach.post(f'{B}/v2/lives', json={'title': 'برای همه', 'now': True, 'minutes': 30, 'audience': 'ALL'}); ok(r.status_code == 400 and r.json()['code'] == 'only_course', 'پخش عمومی برای استاد بسته است')
r = teach.post(f'{B}/v2/lives', json={'title': 'جلسهٔ دوره', 'startsAt': iso(60), 'minutes': 60, 'audience': 'COURSE', 'courseId': cid}); ok(r.status_code in (200, 201), 'جلسهٔ دوره ساخته شد', r.text[:200]); L3 = r.json()['id']
ok(psql(f"select publisher_id from events where id='{L3}'") == pid, 'به نام برگزارکنندهٔ دوره')
ok(lead.get(f'{B}/v2/lives/{L3}/room').status_code == 200, 'تیم برگزارکننده هم اتاق پخش را دارد')
ok(view.get(f'{B}/v2/lives/{L3}').json()['inAudience'] is False, 'کسی که دوره را ندارد مخاطب نیست')

print('۶. سرور کلاس و جایگزین بیرونی')
c = hq.get(f'{B}/admin/live/check').json(); ok(c['ok'] is True and c['step'] == 'ok', 'آزمون سرور کلاس برای ستاد', c)
ok(view.get(f'{B}/admin/live/check').status_code == 403, 'آزمون سرور فقط برای ستاد')
r = lead.patch(f'{B}/v2/lives/{L3}', json={'onlineUrl': 'https://example.org/room-b'}); ok(r.status_code == 200, 'میزبان پیوند بیرونی جایگزین کرد', r.text[:160])
ok(psql(f"select use_bbb||'/'||record||'/'||online_url from events where id='{L3}'") == 'false/false/https://example.org/room-b', 'پخش از سرور مدرسه به پیوند بیرونی رفت')
r = lead.patch(f'{B}/v2/lives/{L3}', json={'onlineUrl': 'not-a-link'}); ok(r.status_code == 400 and r.json()['code'] == 'bad_link', 'پیوند نادرست پذیرفته نیست')

print('۷. توقف')
r = hq.post(f'{B}/v2/lives/{L1}/stop', json={'reason': 'آزمون توقف'}); ok(r.status_code == 200, 'ستاد متوقف کرد')
ok(view.get(f'{B}/v2/lives/{L1}').status_code == 404, 'برای مخاطب دیگر نیست')
ok(lead.get(f'{B}/v2/lives/{L1}/room').json()['state'] == 'STOPPED', 'میزبان «متوقف شد» می‌بیند')
ok(view.post(f'{B}/v2/lives/{L1}/join').status_code in (400, 404), 'ورود بسته شد')
ok(psql(f"select count(*) from notifications where user_id=(select id from users where last_name='پخشی' and first_name='حمید') and title like '%متوقف کرد%'") == '1', 'سازنده خبر گرفت')
adm = hq.get(f'{B}/v2/admin/lives').json(); ok({L1, L2, L3} <= {x['id'] for x in adm}, 'ستاد همه را می‌بیند')
ok(view.get(f'{B}/v2/admin/lives').status_code == 403, 'فهرست ستاد برای دیگران بسته است')

psql(f"delete from events where id in ('{L1}','{L2}','{L3}')"); psql(f"delete from path_enrollments where user_id='{uid}'"); psql(f"delete from courses where id='{cid}'"); psql(f"delete from publishers where id='{pid}'")
done()
