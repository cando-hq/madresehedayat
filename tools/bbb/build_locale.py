"""ساختن fa_IR.json کامل برای کلاس زنده: fa_IR رسمی BigBlueButton 4.0.2 + ترجمهٔ رشته‌های جاافتاده (fa_missing.py).
خروجی: apps/web/public/bbb/fa_IR.json (nginx سرور کلاس همین را به‌جای fa_IR خودش می‌دهد؛ DEPLOY.md بخش کلاس زنده)
اجرا: python3 -I tools/bbb/build_locale.py"""
import json, os, re, sys
here = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, here)
from fa_missing import T
en = json.load(open(os.path.join(here, 'en-4.0.2.json'), encoding='utf-8'))
fa = json.load(open(os.path.join(here, 'fa_IR-4.0.2.json'), encoding='utf-8'))
miss = [k for k in en if k not in fa]
assert len(miss) == len(T), (len(miss), len(T))
ph = re.compile(r'\{[^}]+\}')
for k, t in zip(miss, T):
    a, b = sorted(ph.findall(en[k])), sorted(ph.findall(t))
    assert a == b, (k, en[k], t)  # جانگهدارها ({name}) باید همان‌ها بمانند
    fa[k] = t
out = os.path.join(here, '..', '..', 'apps', 'web', 'public', 'bbb', 'fa_IR.json')
json.dump(fa, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('fa_IR.json', len(fa), 'کلید؛', len(miss), 'ترجمهٔ تازه')
