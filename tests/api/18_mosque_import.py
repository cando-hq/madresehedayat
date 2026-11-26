"""ورود فهرست مسجدهای ایران (۱.۱۰):
- استان با نام سنجیده (نیم‌فاصله/فاصله)، شهرستان تازه ساخته می‌شود، نام دیگر شهرستان (چاه بهار) به شهرستان موجود می‌رود
- مسجدی که پیش‌تر دستی در ۵۰ متری ثبت شده دوباره ساخته نمی‌شود
- هر نسخهٔ فهرست یک بار؛ اجرای دوباره کاری نمی‌کند؛ نسخهٔ تازه با همان مختصات فقط نام را به‌روز می‌کند
- «مسجدهای نزدیکم» نزدیک‌ترین‌ها را از میان همه می‌دهد، نه از چند هزار تای اول
"""
import gzip, json, os, subprocess, sys, tempfile
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from lib import B, ok, done, psql
import requests

API = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'apps', 'api')
DB = os.environ.get('TEST_DB', 'postgresql://postgres@localhost:5433/madrese_test?host=/tmp/pg')
psql("delete from mosques where source like 'fixture-%' or name like 'مسجد دستی آزمون%'")
psql("delete from counties where name in ('شهرستان آزمونی', 'شهرستان آزمونی دیگر')")

# مسجد دستی در زاهدان؛ فهرست در ۲۰ متری‌اش مسجدی دارد که نباید دوباره ساخته شود
ZD = psql("select c.id from counties c join provinces p on p.id=c.province_id where p.name='سیستان و بلوچستان' and c.name='زاهدان'")
CH = psql("select c.id from counties c join provinces p on p.id=c.province_id where p.name='سیستان و بلوچستان' and c.name='چابهار'")
psql(f"insert into mosques (id, name, county_id, lat, lng, verified) values ('mq-manual-test', 'مسجد دستی آزمون', '{ZD}', 29.49000, 60.86000, true)")

def run(rows, version, force=False):
    f = tempfile.NamedTemporaryFile(suffix='.json.gz', delete=False)
    with gzip.open(f.name, 'wt', encoding='utf-8') as g: json.dump({'version': version, 'rows': rows}, g, ensure_ascii=False)
    env = {**os.environ, 'DATABASE_URL': DB, **({'MOSQUE_REIMPORT': 'true'} if force else {})}
    out = subprocess.run(['node', 'dist/db/mosques-import.js', f.name], cwd=API, env=env, capture_output=True, text=True)
    os.unlink(f.name)
    return json.loads(out.stdout.split('مسجدها:', 1)[1]) if 'مسجدها:' in out.stdout else {'err': out.stderr[-400:]}

rows = [
    ['سیستان و بلوچستان', 'زاهدان', 'مسجد نزدیک دستی', 29.49015, 60.86005],   # ۲۰ متری مسجد دستی
    ['سیستان و بلوچستان', 'زاهدان', 'مسجد آزمون یک', 29.49500, 60.86500],
    ['سیستان و بلوچستان', 'شهرستان آزمونی', 'مسجد آزمون دو', 29.40000, 60.80000],
    ['سیستان و بلوچستان', 'چاه بهار', 'مسجد آزمون ساحلی', 25.29000, 60.64000],
    ['سیستان‌وبلوچستان', 'زاهدان', 'مسجد آزمون سه', 29.48000, 60.85000],       # نام استان با نیم‌فاصله
]
print('۱. ورود')
r = run(rows, 'fixture-1'); ok(r.get('imported') == 4 and r.get('nearSkip') == 1 and r.get('newCounties') == 1, 'چهار مسجد آمد، یکی کنار مسجد دستی کنار گذاشته شد، یک شهرستان تازه', r)
ok(psql("select count(*) from mosques where name='مسجد نزدیک دستی'") == '0', 'تکراری مسجد دستی ساخته نشد')
ok(psql(f"select county_id from mosques where name='مسجد آزمون ساحلی'") == CH, '«چاه بهار» به همان چابهار رفت')
ok(psql("select count(*) from provinces where name like 'سیستان%'") == '1', 'استان تکراری ساخته نشد')
ok(psql("select bool_and(verified) from mosques where source='fixture-1'") == 't', 'مسجدهای فهرست تأییدشده‌اند')

print('۲. اجرای دوباره و نسخهٔ تازه')
r = run(rows, 'fixture-1'); ok(r.get('skipped') == 'done', 'همان نسخه دوباره وارد نمی‌شود', r)
rows2 = [x[:] for x in rows]; rows2[1][2] = 'مسجد آزمون یک (نام تازه)'
r = run(rows2, 'fixture-2'); ok(r.get('imported') == 4, 'نسخهٔ تازه', r)
ok(psql("select count(*) from mosques where source like 'fixture-%'") == '4' and psql("select count(*) from mosques where name='مسجد آزمون یک (نام تازه)'") == '1', 'تکراری نساخت و نام را به‌روز کرد')

print('۳. مسجدهای نزدیکم')
near = requests.get(f'{B}/v2/mosques/near', params={'lat': 29.4951, 'lng': 60.8651, 'limit': 3}).json()
ok(near and near[0]['name'] == 'مسجد آزمون یک (نام تازه)' and near[0]['distance'] < 50, 'نزدیک‌ترین اول', near[:3])
ok([m['name'] for m in near][:3] == ['مسجد آزمون یک (نام تازه)', 'مسجد دستی آزمون', 'مسجد آزمون سه'], 'به ترتیب فاصله', [m['name'] for m in near])
far = requests.get(f'{B}/v2/mosques/near', params={'lat': 29.0, 'lng': 61.5, 'limit': 2}).json()
ok(len(far) == 2, 'در بیابان هم دورترها را پیدا می‌کند', far)

psql("delete from mosques where source like 'fixture-%' or id='mq-manual-test'")
psql("delete from counties where name='شهرستان آزمونی'")
done()
