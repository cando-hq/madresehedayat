"""فهرست مسجدهای ایران (اکسل نشان: استان، شهرستان، مسجد، Y، X) ← apps/api/data/mosques.json.gz
اجرا: python3 -I tools/mosques/build.py <فایل.xlsx> <نسخه، مثل neshan-1402.10.24>
نام‌ها: ي/ك عربی ← فارسی، رقم لاتین ← فارسی، و «مسجد» جلوی نام‌هایی که با مسجد/حسینیه/نمازخانه/مصلی/امامزاده/تکیه شروع نمی‌شوند.
تکراری‌ها (همان نقطه تا ۵ متر) یک بار می‌آیند. ref = مختصات گرد شده تا ۵ رقم؛ ورود دوباره با همان ref تکراری نمی‌سازد."""
import gzip, json, os, re, sys
import openpyxl

src, version = sys.argv[1], sys.argv[2]
ws = openpyxl.load_workbook(src, read_only=True).worksheets[0]
rows = list(ws.iter_rows(values_only=True))
head = [str(h).strip() for h in rows[0]]
ix = {k: head.index(k) for k in ('استان', 'شهرستان', 'مسجد', 'Y', 'X')}
FA = str.maketrans({**{str(i): '۰۱۲۳۴۵۶۷۸۹'[i] for i in range(10)}, 'ي': 'ی', 'ك': 'ک', 'ۀ': 'هٔ'})
KEEP = ('مسجد', 'حسینیه', 'نمازخانه', 'مصلی', 'امامزاده', 'تکیه')
def clean(s): return re.sub(r'\s+', ' ', str(s or '').translate(FA)).strip()
out, seen = [], set()
for r in rows[1:]:
    try: lat, lng = float(r[ix['Y']]), float(r[ix['X']])
    except (TypeError, ValueError): continue
    if not (24 < lat < 40.5 and 44 < lng < 63.5): continue
    name = clean(r[ix['مسجد']])
    if not name: continue
    if not name.startswith(KEEP): name = 'مسجد ' + name
    ref = f'{lat:.5f},{lng:.5f}'
    if ref in seen: continue
    seen.add(ref)
    out.append([clean(r[ix['استان']]), clean(r[ix['شهرستان']]), name, round(lat, 6), round(lng, 6)])
dst = os.path.join(os.path.dirname(__file__), '../../apps/api/data/mosques.json.gz')
with gzip.open(dst, 'wt', encoding='utf-8') as f: json.dump({'version': version, 'rows': out}, f, ensure_ascii=False, separators=(',', ':'))
print(len(rows) - 1, 'ردیف؛', len(out), 'مسجد نوشته شد؛', os.path.getsize(dst) // 1024, 'KB')
