"""سازندهٔ دوره و بازبینی ستاد: یادداشت روی هر درس، «درستش کردم»، و بسته ماندن فرستادن تا یادداشت باز است"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from lib import B, ok, done, j, psql, login, staff, wipe_users

PUB_MOBILE = '09125550101'
psql("delete from publishers where name='ناشر آزمون سازنده'")

hq = staff()
p = j(hq.post(f'{B}/v2/admin/publishers', json={'name': 'ناشر آزمون سازنده'}))
pub_s = login(PUB_MOBILE, 'سازنده', 'آزمایشی')
r = hq.patch(f'{B}/v2/admin/publishers/{p["id"]}', json={'adminMobile': PUB_MOBILE}); ok(r.ok, 'مدیر ناشر با شماره تعیین شد', r.text)
pub_s = login(PUB_MOBILE)  # نقش تازه در توکن

c = j(pub_s.post(f'{B}/v2/pub/courses', json={'title': 'دورهٔ آزمون سازنده'}))
cid = c['id']
full = j(pub_s.get(f'{B}/admin/courses/{cid}'))
ok(full.get('reviewNotes') == {}, 'دورهٔ تازه یادداشت ستاد ندارد', full.get('reviewNotes'))
mid = full['modules'][0]['id']
j(pub_s.patch(f'{B}/admin/courses/{cid}', json={'about': 'دوره‌ای کوتاه برای آزمون سازندهٔ تازهٔ دوره.'}))
v = j(pub_s.post(f'{B}/admin/modules/{mid}/lessons', json={'title': 'ویدیوی یک', 'type': 'VIDEO'}))
j(pub_s.patch(f'{B}/admin/lessons/{v["id"]}', json={'content': {'provider': 'aparat', 'aparatHash': 'abc12'}, 'durationSec': 600}))
t = j(pub_s.post(f'{B}/admin/modules/{mid}/lessons', json={'title': 'متن دو', 'type': 'TEXT'}))
j(pub_s.patch(f'{B}/admin/lessons/{t["id"]}', json={'content': {'body': '## تیتر\nیک متن **پررنگ** و کافی برای درس.\n- بند اول\n> نکته'}}))
qz = j(pub_s.post(f'{B}/admin/modules/{mid}/lessons', json={'title': 'آزمون', 'type': 'QUIZ'}))
j(pub_s.patch(f'{B}/admin/lessons/{qz["id"]}', json={'content': {'questions': [{'id': 'q1', 'kind': 'single', 'text': 'پرسش؟', 'options': [{'id': 'a', 'text': 'یک'}, {'id': 'b', 'text': 'دو'}], 'correct': ['a'], 'explain': 'چون'}]}}))

r = pub_s.post(f'{B}/v2/pub/courses/{cid}/submit'); ok(r.ok, 'دورهٔ کامل فرستاده شد', r.text)

# ستاد با یادداشت روی یک درس و بی یادداشت کلی برمی‌گرداند
r = hq.post(f'{B}/v2/admin/review/course/{cid}', json={'action': 'return', 'notes': {v['id']: 'صدای ویدیو ضعیف است', 'bad key!': 'x'}}); ok(r.ok, 'برگرداندن فقط با یادداشت روی درس', r.text)
full = j(pub_s.get(f'{B}/admin/courses/{cid}'))
ok(full['reviewStatus'] == 'RETURNED' and full['reviewNotes'] == {v['id']: 'صدای ویدیو ضعیف است'}, 'یادداشت روی همان درس رسید و کلید نامعتبر کنار رفت', full['reviewNotes'])
ok(full['returnNote'] is None, 'یادداشت کلی خالی ماند', full['returnNote'])

r = pub_s.post(f'{B}/v2/pub/courses/{cid}/submit')
ok(r.status_code == 400 and any('یادداشت ستاد' in x for x in r.json().get('problems', [])), 'تا یادداشت باز است، فرستادن بسته است', r.text)

r = pub_s.delete(f'{B}/admin/courses/{cid}/review-notes/{v["id"]}'); ok(r.ok and r.json()['open'] == 0, '«درستش کردم» یادداشت را برداشت', r.text)
r = pub_s.post(f'{B}/v2/pub/courses/{cid}/submit'); ok(r.ok, 'فرستادن دوباره پس از درست کردن', r.text)
full = j(pub_s.get(f'{B}/admin/courses/{cid}'))
ok(full['reviewStatus'] == 'IN_REVIEW' and full['reviewNotes'] == {}, 'دوباره در بازبینی', full['reviewStatus'])

r = hq.post(f'{B}/v2/admin/review/course/{cid}', json={'action': 'return'}); ok(r.status_code == 400, 'برگرداندن بی هیچ یادداشتی پذیرفته نمی‌شود', r.text)
r = hq.post(f'{B}/v2/admin/review/course/{cid}', json={'action': 'publish'}); ok(r.ok, 'ستاد منتشر کرد', r.text)
full = j(pub_s.get(f'{B}/admin/courses/{cid}'))
ok(full['status'] == 'PUBLISHED' and full['reviewNotes'] == {}, 'منتشر شد و یادداشتی نماند', full['status'])

# دیگری نمی‌تواند یادداشت دورهٔ این ناشر را بردارد
other = login('09125550102', 'دیگر', 'آزمایشی')
r = other.delete(f'{B}/admin/courses/{cid}/review-notes/{v["id"]}'); ok(r.status_code in (401, 403), 'کاربر عادی به یادداشت‌ها دسترسی ندارد', r.status_code)

psql(f"delete from courses where id='{cid}'"); psql(f"delete from publisher_admins where publisher_id='{p['id']}'"); psql(f"delete from publishers where id='{p['id']}'")
ids = [pub_s.get(f'{B}/auth/me').json()['id'], other.get(f'{B}/auth/me').json()['id']]
wipe_users("id in (" + ",".join(f"'{x}'" for x in ids) + ")")
done()
