"""بایگانی دست‌به‌دست مدرسهٔ هدایت در بارگذار (پروژهٔ madrese-archive، مخزن cando-hq/c-test).

اجرا (بعد از هر انتشار):
    python3 tools/archive/build.py <مسیر c-test>/projects/madrese-archive/site [--panel-zip <مسیر.zip>]

چه می‌سازد:
- صفحه‌های خواندنی: شروع، سرگذشت نسخه‌ها، تصمیم‌ها، سلیقه، گفت‌وگوها، سیستم طراحی، اسناد، ورودی و خروجی‌ها، کد.
- raw/: همهٔ متن‌ها، داده‌های کوچک و ابزارها همان‌طور که در مخزن‌اند، تا همکار یا Claude بعدی مستقیم بخواند.
- manifest.json: فهرست همه‌چیز با حجم و sha256، نسخه و commit.
- با --panel-zip: zip فایل‌های سنگین (عکس، PDF، docx، بستهٔ فونت، اکسل) برای بارگذاری در پنل بارگذار؛
  طبق قاعدهٔ بارگذار این‌ها داخل ریپو نمی‌روند. بعد از بارگذاری و «باز کردن zip»، اجرای دوباره
  پیوندها را از files.json کنار site می‌خواند.
همه از روی همین مخزن ساخته می‌شود؛ متن دستی را در docs/handoff/ بنویس، نه در خروجی.
"""
import datetime, hashlib, html, json, os, re, shutil, subprocess, sys, zipfile
import markdown

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
REPO_URL = 'https://github.com/cando-hq/madresehedayat'
FA = str.maketrans('0123456789', '۰۱۲۳۴۵۶۷۸۹')


def sh(*a):
    return subprocess.run(a, cwd=ROOT, capture_output=True, text=True).stdout.strip()


def rel(p): return os.path.relpath(p, ROOT)


def md(text):
    return markdown.markdown(text, extensions=['tables', 'fenced_code', 'sane_lists', 'toc'], output_format='html5')


def read(p): return open(os.path.join(ROOT, p), encoding='utf-8').read()


# ───────── آنچه در site (ریپو) می‌رود و آنچه به پنل
TEXT_EXT = {'.md', '.txt', '.json', '.css', '.py', '.mjs', '.ts', '.tsx', '.sql', '.sh', '.html', '.svg', '.yml', '.yaml', '.gz', '.woff', '.woff2'}
RAW = [  # (مسیر در مخزن، توضیح)
    ('docs/handoff', 'سندهای دست‌به‌دست'),
    ('docs', 'اسناد محصول، تصمیم‌های کارفرما، معماری، کلاس زنده'),
    ('CHANGELOG.md', 'سرگذشت نسخه‌ها'), ('README.md', 'معرفی مخزن'), ('DEPLOY.md', 'نصب و نگهداری سرور'), ('CLAUDE.md', 'قاعده‌های Claude در مخزن'),
    ('.env.example', 'نمونهٔ تنظیمات سرور (بی‌رمز)'),
    ('design/system/tokens.json', 'رنگ‌ها و نشانه‌های طراحی'), ('design/system/tokens.css', ''), ('design/system/guide', 'راهنمای سیستم طراحی'),
    ('design/system/brand/mark.svg', 'نشان (svg)'),
    ('design/boards', 'بردهای طراحی همهٔ صفحه‌ها'), ('design/prototypes', 'نمونه‌های قابل کلیک'), ('design/generators', 'ابزار ساخت بردها'),
    ('apps/api/data/mosques.json.gz', 'فهرست ۲۷ هزار مسجد (خروجی)'), ('tools/mosques', 'ابزار ساخت فهرست مسجدها'),
    ('apps/web/public/bbb/fa_IR.json', 'ترجمهٔ کامل فارسی کلاس زنده'), ('apps/web/public/bbb/theme.css', 'پوستهٔ کلاس زنده'), ('tools/bbb', 'ابزار ترجمه و پوستهٔ کلاس'),
    ('tools/archive', 'همین ابزار بایگانی'),
    ('apps/web/public/fonts', 'فونت وب رواق (مجوز خریدار)'),
]
PANEL = [  # سنگین یا تصویری ← zip برای پنل
    ('design/system/brand', 'لوگو و تصویرهای نشان'), ('design/assets', 'تصویرهای پایهٔ طراحی'), ('apps/web/public/bbb/slide.jpg', 'اسلاید آغازین کلاس'),
]
# لینک‌های /f/ بارگذار بی‌رمز باز می‌شوند؛ این‌ها فقط در مخزن خصوصی می‌مانند و به پنل نمی‌روند
PRIVATE = [('docs/sources', 'اسناد پایه (محرمانه، از جمله نامه‌ها)'), ('design/system/fonts', 'بستهٔ کامل فونت رواق و مجوز (مجوز خریدار)')]
SKIP_IN_RAW = ('docs/sources',)


def walk(p):
    full = os.path.join(ROOT, p)
    if os.path.isfile(full): yield p; return
    for d, _, fs in os.walk(full):
        for f in sorted(fs):
            yield rel(os.path.join(d, f))


def is_text(p):
    return (os.path.splitext(p)[1].lower() in TEXT_EXT or os.path.basename(p) in ('.env.example',)) and 'data:image' not in (open(os.path.join(ROOT, p), 'rb').read(400000).decode('utf-8', 'ignore'))


# ───────── قالب صفحه
NAV = [('index.html', 'شروع'), ('timeline.html', 'سرگذشت نسخه‌ها'), ('decisions.html', 'تصمیم‌ها'), ('taste.html', 'سلیقه و قاعده‌ها'),
       ('sessions.html', 'گفت‌وگوها'), ('design.html', 'سیستم طراحی'), ('docs.html', 'اسناد'), ('data.html', 'ورودی و خروجی‌ها'), ('code.html', 'کد')]
CSS = """
@font-face{font-family:Ravagh;src:url(fonts/RavaghFaNum-Regular.woff) format('woff');font-weight:400}
@font-face{font-family:Ravagh;src:url(fonts/RavaghFaNum-SemiBold.woff) format('woff');font-weight:600}
@font-face{font-family:Ravagh;src:url(fonts/RavaghFaNum-ExtraBold.woff) format('woff');font-weight:800}
:root{--ink:#1B2150;--body:#3E4462;--muted:#6C7290;--line:#E4E7EF;--bg:#F4F5F9;--card:#fff;--leaf:#0E9F5A;--leaf-ink:#0A7A45;--leaf-soft:#E2F4EA;--dome:#3FB4C8;--flame:#F2B705;--sunken:#EEF0F5}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--body);font:16px/1.95 Ravagh,Vazirmatn,Tahoma,sans-serif;direction:rtl}
a{color:var(--leaf-ink)}a:focus-visible,button:focus-visible{outline:3px solid var(--leaf);outline-offset:2px}
.top{background:var(--ink);color:#fff}.top .in{max-width:1100px;margin:auto;padding:22px 20px 0;display:flex;flex-wrap:wrap;align-items:flex-end;gap:6px 24px}
.top b{font-size:20px;font-weight:800}.top small{color:#C8CCDD;font-size:13px}
nav{max-width:1100px;margin:auto;padding:10px 12px 0;display:flex;gap:2px;overflow-x:auto}
nav a{color:#C8CCDD;text-decoration:none;padding:10px 12px;border-radius:12px 12px 0 0;white-space:nowrap;font-size:14px;font-weight:600}
nav a.on{background:var(--bg);color:var(--ink)}
main{max-width:860px;margin:auto;padding:28px 20px 80px}
h1{color:var(--ink);font-size:30px;line-height:1.4;font-weight:800;margin:.2em 0 .4em}
h2{color:var(--ink);font-size:21px;font-weight:800;margin:2em 0 .5em;padding-top:.6em;border-top:1px solid var(--line)}
h3{color:var(--ink);font-size:17px;font-weight:800;margin:1.6em 0 .3em}
p,li{text-align:justify}blockquote{margin:1em 0;padding:10px 16px;background:var(--sunken);border-radius:14px;color:var(--muted);font-size:15px}
blockquote p{margin:.2em 0}
table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--card);font-size:14.5px;margin:1em 0}
th{background:#FFF4D1;color:var(--ink);font-weight:800;text-align:right;padding:9px 12px}
td{padding:9px 12px;border-top:1px solid var(--line);vertical-align:top}td:first-child{font-weight:600;color:var(--ink)}
code{font-family:ui-monospace,Menlo,monospace;font-size:.86em;background:var(--sunken);padding:1px 6px;border-radius:6px;direction:ltr;unicode-bidi:embed}
pre{background:#1B2150;color:#E8EAF5;padding:14px 16px;border-radius:14px;overflow:auto;direction:ltr;text-align:left}pre code{background:none;color:inherit;padding:0}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;margin:18px 0 8px}
.card{display:block;background:var(--card);border:1px solid var(--line);border-radius:18px;padding:16px 18px;text-decoration:none;color:var(--body)}
.card b{display:block;color:var(--ink);font-size:17px}.card span{font-size:14px;color:var(--muted)}
.card:hover{border-color:var(--leaf)}
.meta{color:var(--muted);font-size:14px}.ver{display:inline-block;background:var(--leaf-soft);color:var(--leaf-ink);font-weight:800;border-radius:999px;padding:0 12px;margin-left:8px;direction:ltr}
.sw{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}.sw div{border:1px solid var(--line);border-radius:14px;overflow:hidden;background:#fff;font-size:13px}
.sw i{display:block;height:54px}.sw span{display:block;padding:6px 10px;direction:ltr;text-align:left;font-family:ui-monospace,Menlo,monospace;font-size:12px}
.files td:nth-child(3){direction:ltr;text-align:left;white-space:nowrap;color:var(--muted)}
footer{max-width:860px;margin:auto;padding:0 20px 40px;color:var(--muted);font-size:13px}
@media (max-width:600px){h1{font-size:25px}main{padding-top:20px}}
"""


def page(fname, title, body, built):
    nav = ''.join(f'<a href="{h}"{" class=on aria-current=page" if h == fname else ""}>{t}</a>' for h, t in NAV)
    return f"""<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(title)} — بایگانی مدرسهٔ هدایت</title><link rel="stylesheet" href="style.css"></head><body>
<header class="top"><div class="in"><b>بایگانی مدرسهٔ هدایت</b><small>نسخهٔ {built['version']} · ساخته‌شده {built['date_fa']}</small></div><nav aria-label="بخش‌ها">{nav}</nav></header>
<main>{body}</main><footer>این بایگانی از مخزن <a href="{REPO_URL}">cando-hq/madresehedayat</a> (commit <code>{built['commit'][:7]}</code>) با <code>tools/archive/build.py</code> ساخته شده؛ متن‌ها را در مخزن عوض کن، نه این‌جا.</footer></body></html>"""


def size_fa(n):
    for u in ('بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'):
        if n < 1024 or u == 'گیگابایت': return (f'{n:.0f}' if u == 'بایت' or n >= 100 else f'{n:.1f}').translate(FA) + ' ' + u
        n /= 1024


def jalali(d: datetime.date):
    gy, gm, gd = d.year, d.month, d.day
    g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
    gy2 = gy + 1 if gm > 2 else gy
    days = 355666 + (365 * gy) + ((gy2 + 3) // 4) - ((gy2 + 99) // 100) + ((gy2 + 399) // 400) + gd + g_d_m[gm - 1]
    jy = -1595 + (33 * (days // 12053)); days %= 12053
    jy += 4 * (days // 1461); days %= 1461
    if days > 365: jy += (days - 1) // 365; days = (days - 1) % 365
    jm = 1 + days // 31 if days < 186 else 7 + (days - 186) // 30
    jd = 1 + (days % 31 if days < 186 else (days - 186) % 30)
    return f'{jy}/{jm:02d}/{jd:02d}'.translate(FA)


def main():
    if len(sys.argv) < 2: sys.exit(__doc__)
    out = os.path.abspath(sys.argv[1]); pzip = sys.argv[sys.argv.index('--panel-zip') + 1] if '--panel-zip' in sys.argv else None
    files_json = os.path.join(os.path.dirname(out), 'files.json')
    panel_files = {}
    if os.path.exists(files_json):
        for f in json.load(open(files_json, encoding='utf-8')).get('files', []):
            panel_files[f.get('path') or f.get('name')] = f
    version = json.load(open(os.path.join(ROOT, 'apps/api/package.json')))['version']
    built = {'version': version, 'commit': sh('git', 'rev-parse', 'HEAD'), 'date_fa': jalali(datetime.date.today()), 'at': datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds')}
    if os.path.isdir(out): shutil.rmtree(out)
    os.makedirs(os.path.join(out, 'raw')); os.makedirs(os.path.join(out, 'fonts'))
    manifest = {'project': 'madrese-archive', 'repo': REPO_URL, **built, 'raw': [], 'panel': []}

    # raw: متن‌ها و داده‌های کوچک
    seen = set()
    for p, why in RAW:
        for f in walk(p):
            if f in seen: continue
            seen.add(f)
            if f.startswith(SKIP_IN_RAW) and p != 'docs/handoff' and f.startswith('docs/sources'): continue
            if not is_text(f): continue
            dst = os.path.join(out, 'raw', f); os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copy2(os.path.join(ROOT, f), dst)
            b = open(dst, 'rb').read(); manifest['raw'].append({'path': 'raw/' + f, 'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest()})
    for f in os.listdir(os.path.join(ROOT, 'apps/web/public/fonts')):
        if f.endswith('.woff'): shutil.copy2(os.path.join(ROOT, 'apps/web/public/fonts', f), os.path.join(out, 'fonts', f))
    open(os.path.join(out, 'style.css'), 'w').write(CSS)

    # فایل‌های پنل
    panel = []
    for p, why in PANEL:
        for f in walk(p):
            full = os.path.join(ROOT, f); panel.append((f, why, os.path.getsize(full)))
    extra = os.environ.get('ARCHIVE_EXTRA')  # پوشهٔ ورودی‌های بیرون از مخزن (اکسل اصلی، عکس صفحه‌ها) ← zip/inputs/
    if extra and os.path.isdir(extra):
        for d, _, fs in os.walk(extra):
            for f in sorted(fs): panel.append(('inputs/' + os.path.relpath(os.path.join(d, f), extra), 'ورودی یا عکس بیرون از مخزن', os.path.getsize(os.path.join(d, f))))
    if pzip:
        with zipfile.ZipFile(pzip, 'w', zipfile.ZIP_DEFLATED) as z:
            for f, _, _ in panel:
                src = os.path.join(extra, f[len('inputs/'):]) if f.startswith('inputs/') else os.path.join(ROOT, f)
                z.write(src, f)
    def plink(f):
        pf = panel_files.get(f) or next((v for k, v in panel_files.items() if k and k.endswith(f)), None)
        return f'<a href="{html.escape(pf["url"])}">{html.escape(os.path.basename(f))}</a>' if pf else html.escape(os.path.basename(f))
    manifest['panel'] = [{'path': f, 'about': w, 'bytes': n, 'uploaded': bool(panel_files.get(f))} for f, w, n in panel]

    W = lambda name, title, body: open(os.path.join(out, name), 'w', encoding='utf-8').write(page(name, title, body, built))
    rawlink = lambda f, t=None: f'<a href="raw/{f}">{html.escape(t or f)}</a>'

    # شروع
    start = md(read('docs/handoff/00-از-این‌جا-شروع.md'))
    cards = '<div class="cards">' + ''.join(f'<a class="card" href="{h}"><b>{t}</b><span>{d}</span></a>' for h, t, d in [
        ('timeline.html', 'سرگذشت نسخه‌ها', f'از ۱.۰.۰ تا {version.translate(FA)}، هر نسخه با معرفی'),
        ('decisions.html', 'تصمیم‌ها', 'چه تصمیمی، چرا'), ('taste.html', 'سلیقه و قاعده‌ها', 'لحن، متن، طراحی، کار با تیم'),
        ('sessions.html', 'گفت‌وگوها', 'خلاصهٔ هر جلسهٔ کاری'), ('design.html', 'سیستم طراحی', 'رنگ، فونت، لوگو، بردها'),
        ('data.html', 'ورودی و خروجی‌ها', 'فهرست مسجدها، ترجمهٔ کلاس و…'), ('code.html', 'کد', 'مخزن، ساختار، آزمون‌ها')]) + '</div>'
    W('index.html', 'شروع', f'<p class="meta"><span class="ver">{version}</span>نسخهٔ فعلی؛ commit <code>{built["commit"][:7]}</code></p>' + cards + start)

    # سرگذشت
    cl = read('CHANGELOG.md'); parts = re.split(r'^## ', cl, flags=re.M)
    body = '<h1>سرگذشت نسخه‌ها</h1><p class="meta">هر نسخه همان روزی که منتشر شد خودکار روی سایت نشست. منبع: <code>CHANGELOG.md</code>.</p>'
    for p in parts[1:]:
        head, _, rest = p.partition('\n'); v = head.split(' ')[0]; when = head.partition('—')[2].strip()
        c = sh('git', 'log', '-1', '--format=%h', '-S', f'"version": "{v}"', '--', 'apps/api/package.json')
        link = f' · <a href="{REPO_URL}/commit/{c}">کد این نسخه</a>' if c else ''
        body += f'<h2 id="v{v}"><span class="ver">{v}</span>{when}</h2><p class="meta">{link.lstrip(" ·")}</p>' + md(rest)
    W('timeline.html', 'سرگذشت نسخه‌ها', body)

    W('decisions.html', 'تصمیم‌ها', md(read('docs/handoff/01-تصمیم‌ها.md')) + '<h2>تصمیم‌های کارفرما</h2>' + md(re.sub(r'^# .*\n', '', read('docs/decisions.md'))))
    W('taste.html', 'سلیقه و قاعده‌ها', md(read('docs/handoff/02-سلیقه-و-قاعده‌ها.md')) + '<h2>واژگان و متن‌نویسی رابط</h2>' + md(re.sub(r'^# .*\n', '', read('docs/product/06-واژگان-و-متن‌نویسی-رابط.md'))))
    W('sessions.html', 'گفت‌وگوها', md(read('docs/handoff/03-گفت‌وگوها.md')))

    # طراحی
    tok = json.loads(read('design/system/tokens.json'))
    sw = ''.join(f'<div><i style="background:{v}"></i><span>{k} {v}</span></div>' for k, v in tok['color']['light'].items() if isinstance(v, str) and v.startswith('#'))
    boards = [f for f in walk('design/boards') if f.endswith('.html')]
    body = ('<h1>سیستم طراحی</h1>'
            f'<h2>فونت</h2><p style="font-size:30px;font-weight:800;color:var(--ink);margin:.2em 0">مدرسهٔ هدایت — ۱۲۳۴۵۶۷۸۹۰</p><p>{html.escape(tok["font"]["family"])}. {html.escape(tok["font"]["note"])}. فونت وب: {rawlink("apps/web/public/fonts", "apps/web/public/fonts")}؛ بستهٔ کامل و مجوز فقط در مخزن خصوصی: <a href="{REPO_URL}/tree/main/design/system/fonts">design/system/fonts</a>.</p>'
            f'<h2>رنگ‌ها (روشن)</h2><div class="sw">{sw}</div><p>همهٔ رنگ‌ها و حالت تیره: {rawlink("design/system/tokens.json")}، {rawlink("design/system/tokens.css")}.</p>'
            '<h2>لوگو و تصویرها</h2><p>لوگو را بازترسیم نکن؛ همین فایل‌ها:</p><ul>' + ''.join(f'<li>{plink(f)}</li>' for f, w, _ in panel if f.startswith(('design/system/brand', 'design/assets'))) + f'<li>{rawlink("design/system/brand/mark.svg", "mark.svg")}</li></ul>'
            '<h2>راهنمای سیستم طراحی</h2>' + md(read('design/system/guide/README.md')) +
            f'<h2>بردهای طراحی ({str(len(boards)).translate(FA)} صفحه)</h2><p>این‌ها سورس بردهای ابزار طراحی‌اند و بیرون از آن ابزار کامل دیده نمی‌شوند (اسکریپت و تصویرهایشان در خود ابزار است). شکل نهایی هر صفحه را در خود سایت ببین؛ این فایل‌ها برای متن، چیدمان و ادامهٔ طراحی‌اند.</p><ul>' + ''.join(f'<li>{rawlink(f, os.path.basename(f).replace(".dc.html", ""))}</li>' for f in boards) + '</ul>')
    W('design.html', 'سیستم طراحی', body)

    # اسناد
    docs = [f for f in walk('docs') if f.endswith('.md') and not f.startswith(('docs/handoff', 'docs/sources'))] + ['DEPLOY.md', 'README.md', 'CLAUDE.md']
    os.makedirs(os.path.join(out, 'd'), exist_ok=True)
    slug_of = {f: re.sub(r'[^\w\u0600-\u06FF-]+', '-', f.replace('.md', '')).strip('-') + '.html' for f in docs}
    def fix_links(h, base):
        def rep(m):
            target = os.path.normpath(os.path.join(os.path.dirname(base), m[1])).replace(os.sep, '/')
            for cand in (target, m[1]):
                if cand in slug_of: return f'href="{slug_of[cand]}"'
            return f'href="{REPO_URL}/blob/main/{target}"'
        return re.sub(r'href="(?!https?:|#|mailto:)([^"]+\.md)"', rep, h)
    lst = ''
    for f in docs:
        slug = re.sub(r'[^\w؀-ۿ-]+', '-', f.replace('.md', '')).strip('-') + '.html'
        t = read(f); title = (re.search(r'^# (.+)$', t, re.M) or [None, f])[1]
        doc = page('docs.html', title, f'<p class="meta"><a href="../docs.html">اسناد</a> · <code>{f}</code></p>' + fix_links(md(t), f), built).replace('href="style.css"', 'href="../style.css"').replace('src:url(fonts/', 'src:url(../fonts/')
        doc = re.sub(r'<nav aria-label="بخش‌ها">(.*?)</nav>', lambda m: '<nav aria-label="بخش‌ها">' + re.sub(r'href="(?!http)', 'href="../', m[1]) + '</nav>', doc, flags=re.S)
        open(os.path.join(out, 'd', slug), 'w', encoding='utf-8').write(doc)
        lst += f'<tr><td><a href="d/{slug}">{html.escape(title)}</a></td><td><code>{f}</code></td></tr>'
    W('docs.html', 'اسناد', md(read('docs/README.md')) + '<h2>همهٔ اسناد خواندنی</h2><table><tr><th>سند</th><th>مسیر در مخزن</th></tr>' + lst + '</table>'
      + '<h2>اسناد پایه (محرمانه)</h2><p>این‌ها عمداً در بارگذار نیستند، چون لینک فایل‌های بارگذار بی‌رمز باز می‌شود. فقط در مخزن خصوصی گیت‌هاب:</p><ul>' + ''.join(f'<li><a href="{REPO_URL}/blob/main/{f}">{html.escape(os.path.basename(f))}</a></li>' for p, _ in PRIVATE for f in walk(p)) + '</ul>')

    # ورودی و خروجی‌ها
    rows = [
        ('فهرست مسجدهای ایران (ورودی)', 'اکسل نشان، ۱۴۰۲/۱۰/۲۴، ۲۷٬۱۳۸ ردیف: استان، شهرستان، مسجد، Y، X', ''.join(plink(f) + ' ' for f, w, _ in panel if f.startswith('inputs/') and f.endswith('.xlsx')) or 'در پنل، پوشهٔ inputs'),
        ('فهرست مسجدها (خروجی)', '۲۷٬۱۱۲ مسجد پاک‌شده؛ با هر بالا آمدن سایت وارد پایگاه داده می‌شود', rawlink('apps/api/data/mosques.json.gz', 'mosques.json.gz') + ' · ابزار: ' + rawlink('tools/mosques/build.py', 'build.py')),
        ('ترجمهٔ فارسی کلاس زنده', '۱٬۹۴۳ عبارت؛ ۳۶۷ تای آن تازه', rawlink('apps/web/public/bbb/fa_IR.json', 'fa_IR.json') + ' · ابزار: ' + rawlink('tools/bbb/build_locale.py', 'build_locale.py')),
        ('پوستهٔ کلاس زنده', 'فونت و رنگ مدرسه برای BigBlueButton', rawlink('apps/web/public/bbb/theme.css', 'theme.css') + ' · ' + plink('apps/web/public/bbb/slide.jpg')),
        ('تنظیمات سرور', 'فهرست کلیدها، بی‌مقدار رمز', rawlink('.env.example', '.env.example')),
    ]
    body = '<h1>ورودی و خروجی‌ها</h1><table><tr><th>چه</th><th>توضیح</th><th>فایل</th></tr>' + ''.join(f'<tr><td>{a}</td><td>{b}</td><td>{c}</td></tr>' for a, b, c in rows) + '</table>'
    shots = [f for f, w, _ in panel if f.startswith('inputs/') and f.lower().endswith(('.png', '.jpg'))]
    if shots: body += '<h2>عکس صفحه‌ها</h2><ul>' + ''.join(f'<li>{plink(f)}</li>' for f in shots) + '</ul>'
    body += '<h2>همهٔ فایل‌های پنل</h2><table class="files"><tr><th>فایل</th><th>چیست</th><th>حجم</th></tr>' + ''.join(f'<tr><td>{plink(f)}</td><td>{w}</td><td>{size_fa(n)}</td></tr>' for f, w, n in panel) + '</table>'
    up = sum(1 for x in manifest['panel'] if x['uploaded'])
    body += f'<p class="meta">{str(up).translate(FA)} از {str(len(panel)).translate(FA)} فایل در پنل بارگذار است.' + ('' if up == len(panel) else ' بقیه را با zip «madrese-archive-files» در پنل بارگذار کن و «باز کردن zip» را بزن.') + '</p>'
    W('data.html', 'ورودی و خروجی‌ها', body)

    # کد
    log = sh('git', 'log', '-25', '--format=%h\t%ad\t%s', '--date=short')
    tr = ''.join(f'<tr><td><a href="{REPO_URL}/commit/{h}">{h}</a></td><td>{d}</td><td>{html.escape(s)}</td></tr>' for h, d, s in (l.split('\t', 2) for l in log.splitlines()))
    tree = [('apps/api', 'API: NestJS + drizzle + Postgres؛ مهاجرت‌ها در drizzle/'), ('apps/web', 'وب: React + TanStack Query + Tailwind؛ نسخهٔ نمایشی در src/demo'),
            ('tests', 'آزمون‌ها: api/ (پایتون)، ui/ (Playwright)، run.py'), ('deploy', 'نصب و به‌روزرسانی خودکار سرور'), ('tools', 'ابزارها: مسجدها، کلاس زنده، بایگانی'),
            ('design', 'طراحی'), ('docs', 'اسناد')]
    body = (f'<h1>کد</h1><p>مخزن: <a href="{REPO_URL}">{REPO_URL}</a> (شاخهٔ <code>main</code>). نسخهٔ این بایگانی: <span class="ver">{version}</span> commit <code>{built["commit"]}</code>.</p>'
            '<p>برای ادامهٔ کار کد را از گیت‌هاب بگیر؛ این‌جا نسخهٔ دوم کد نگه داشته نمی‌شود تا دو منبع نداشته باشیم. قاعده‌های کار: ' + rawlink('CLAUDE.md') + '.</p>'
            '<h2>ساختار</h2><table><tr><th>پوشه</th><th>چیست</th></tr>' + ''.join(f'<tr><td><code>{a}</code></td><td>{b}</td></tr>' for a, b in tree) + '</table>'
            '<h2>آخرین تغییرها</h2><table><tr><th>commit</th><th>تاریخ</th><th>پیام</th></tr>' + tr + '</table>')
    W('code.html', 'کد', body)

    open(os.path.join(out, 'manifest.json'), 'w', encoding='utf-8').write(json.dumps(manifest, ensure_ascii=False, indent=1))
    open(os.path.join(out, 'README.md'), 'w', encoding='utf-8').write(
        f'# بایگانی مدرسهٔ هدایت\n\nنسخهٔ {version}، commit {built["commit"]}. اول `raw/docs/handoff/00-از-این‌جا-شروع.md` را بخوان.\n'
        f'همه‌چیز از مخزن {REPO_URL} با `tools/archive/build.py` ساخته شده؛ این پوشه را دستی عوض نکن. فهرست کامل: `manifest.json`.\n')
    # بررسی: هر پیوند داخلی صفحه‌ها باید به فایلی برسد
    broken = []
    for d, _, fs in os.walk(out):
        if os.sep + 'raw' in d: continue
        for f in fs:
            if not f.endswith('.html'): continue
            for u in re.findall(r'(?:href|src)="([^"]+)"', open(os.path.join(d, f), encoding='utf-8').read()):
                if re.match(r'(https?:|#|mailto:)', u): continue
                if not os.path.exists(os.path.normpath(os.path.join(d, u.split('#')[0].split('?')[0]))): broken.append(f'{os.path.relpath(os.path.join(d, f), out)} → {u}')
    if broken: print('پیوند شکسته:', *broken[:20], sep='\n  '); sys.exit(1)
    n = sum(len(fs) for _, _, fs in os.walk(out)); total = sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(out) for f in fs)
    print(f'بایگانی: {n} فایل، {total // 1024} کیلوبایت در site؛ {len(panel)} فایل برای پنل ({sum(x[2] for x in panel) // 1024} کیلوبایت){"، zip: " + pzip if pzip else ""}')


if __name__ == '__main__':
    main()
