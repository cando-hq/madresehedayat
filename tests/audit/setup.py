"""نقش‌های گشت را روی پایگاه آزمایشی آماده می‌کند (پس از اجرای tests/run.py)"""
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from lib import *
hq = staff()
pub = psql("select id from publishers where name='بنیاد هدایت'")
login('09126000001')
r = hq.patch(f'{B}/v2/admin/publishers/{pub}', json={'adminMobile': '09126000001'}); print('publisher admin', r.status_code, r.text[:120])
u5 = login('09121000005'); uid5 = u5.get(f'{B}/auth/me').json()['id']
r = hq.post(f'{B}/admin/users/{uid5}/roles', json={'role': 'INSTRUCTOR'}); print('instructor', r.status_code)
psql("update users set onboarded_at=now() where onboarded_at is null")
