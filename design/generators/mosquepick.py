from ui import *
from mob import mpage, mtop, mcard, mbtn, H2

def mapsvg(w, h, pins=True):
    # stylised map: blocks, two main streets, a park, a pin with radius
    return f'''<svg viewBox="0 0 {w} {h}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="img" aria-label="نقشهٔ محله" style="display: block; background: #EEF1F6">
  <defs><pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0 H0 V40" fill="none" stroke="#E2E6EE" stroke-width="1"/></pattern></defs>
  <rect width="{w}" height="{h}" fill="url(#g)"/>
  <rect x="{w*0.08}" y="{h*0.1}" width="{w*0.22}" height="{h*0.3}" rx="8" fill="#DCEBDD"/>
  <path d="M0 {h*0.55} Q {w*0.3} {h*0.45} {w*0.5} {h*0.6} T {w} {h*0.5}" stroke="#FFFFFF" stroke-width="18" fill="none"/>
  <path d="M{w*0.42} 0 V{h}" stroke="#FFFFFF" stroke-width="14"/>
  <path d="M{w*0.7} 0 Q {w*0.68} {h*0.5} {w*0.78} {h}" stroke="#FFFFFF" stroke-width="10" fill="none"/>
  <circle cx="{w*0.56}" cy="{h*0.52}" r="{min(w,h)*0.22}" fill="rgba(30,58,158,0.08)" stroke="#1E3A9E" stroke-dasharray="6 6"/>
  {'<g><circle cx="%s" cy="%s" r="9" fill="#F5B700" stroke="#FFFFFF" stroke-width="3"/><circle cx="%s" cy="%s" r="9" fill="#F5B700" stroke="#FFFFFF" stroke-width="3"/><circle cx="%s" cy="%s" r="9" fill="#F5B700" stroke="#FFFFFF" stroke-width="3"/></g>' % (w*0.3, h*0.68, w*0.78, h*0.3, w*0.62, h*0.82) if pins else ''}
  <g transform="translate({w*0.56} {h*0.52})"><path d="M0 -34 C-13 -34 -20 -24 -20 -14 C-20 0 0 14 0 14 C0 14 20 0 20 -14 C20 -24 13 -34 0 -34 Z" fill="#1E3A9E" stroke="#FFFFFF" stroke-width="3"/><circle r="6" cy="-15" fill="#FFFFFF"/></g>
</svg>'''

MOSQUES = [('مسجد صاحب‌الزمان', 'خیابان امام، کوچهٔ ۱۲', '۲۰۰ متر', True), ('مسجد جامع بهشهر', 'میدان شهدا', '۶۵۰ متر', False), ('مسجد النبی', 'بلوار شهید هاشمی‌نژاد', '۱٫۱ کیلومتر', False)]

def mosque_list(sel=0, compact=False):
    out = ''
    for i, (n, a, d, _) in enumerate(MOSQUES):
        on = i == sel
        out += f'<button type="button" aria-pressed="{str(on).lower()}" style="text-align: right; font: inherit; cursor: pointer; display: flex; gap: 12px; align-items: center; padding: {"10px 12px" if compact else "12px 14px"}; border-radius: 14px; border: 1.5px solid {DEEP if on else "#E4E7EF"}; background: {"#EAEFFC" if on else "#FFFFFF"}; color: {INK}"><span style="width: 36px; height: 36px; border-radius: 10px; background: {DEEP if on else "#F4F5F9"}; color: {"#FFFFFF" if on else DEEP}; display: flex; align-items: center; justify-content: center">{toranj("currentColor", 16)}</span><span style="flex: 1; display: flex; flex-direction: column"><b style="font-size: 14px">{n}</b><span style="font-size: 12px; color: {MUTE}">{a}</span></span><span style="font-size: 12px; color: {MUTE}; white-space: nowrap">{d}</span></button>'
    return out

# ---------- Desktop: OnboardMosque
body = f'''<div style="{ROOT}; display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh">
  <section style="position: relative; overflow: hidden; background: #EEF1F6">{mapsvg(720, 900)}
    <div style="position: absolute; top: 24px; right: 24px; left: 24px; display: flex; gap: 8px"><label style="flex: 1; display: flex; align-items: center; gap: 10px; background: #FFFFFF; border: 1.5px solid #E4E7EF; border-radius: 14px; padding: 0 14px; min-height: 48px; box-shadow: 0 6px 20px rgba(27,33,80,0.08)"><span style="position: absolute; width: 1px; height: 1px; overflow: hidden">جست‌وجوی مسجد</span><input value="صاحب‌الزمان" style="flex: 1; border: 0; font: inherit; font-size: 15px; outline: none"></label>{btn('موقعیت فعلی من', '#', 'ghost', True)}</div>
    <div style="position: absolute; bottom: 24px; right: 24px; left: 24px; display: flex; justify-content: space-between; align-items: center; gap: 10px"><span style="padding: 8px 14px; border-radius: 999px; background: #FFFFFF; font-size: 13px; font-weight: 800; box-shadow: 0 6px 20px rgba(27,33,80,0.08)">پین را روی مسجد بکش</span><span style="padding: 8px 14px; border-radius: 999px; background: #FFFFFF; font-size: 13px; color: {MUTE}; box-shadow: 0 6px 20px rgba(27,33,80,0.08)">بهشهر، مازندران</span></div>
  </section>
  <section style="padding: 44px 56px; display: flex; flex-direction: column; gap: 20px; justify-content: center">
    <div style="display: flex; gap: 8px; align-items: center; font-size: 13px; color: {MUTE}"><span style="padding: 4px 10px; border-radius: 999px; background: #EAEFFC; color: {DEEP}; font-weight: 800">۱ ورود</span><span style="padding: 4px 10px; border-radius: 999px; background: #EAEFFC; color: {DEEP}; font-weight: 800">۲ آشنایی</span><span style="padding: 4px 10px; border-radius: 999px; background: {DEEP}; color: #FFFFFF; font-weight: 800">۳ مسجد تو</span><span style="padding: 4px 10px; border-radius: 999px; background: #F4F5F9; font-weight: 800">۴ اولین مسیر</span></div>
    <div><h2 style="margin: 0; font-size: 28px; font-weight: 900">مسجد تو کجاست؟</h2><p style="margin: 4px 0 0; color: {MUTE}">برای گعده‌های نزدیک، تیم‌های همین مسجد و گزارش منطقه‌ای. فقط راهیار و ستاد می‌بینند.</p></div>
    <div style="display: flex; flex-direction: column; gap: 8px"><b style="font-size: 14px">مسجدهای نزدیک پین</b>{mosque_list(0)}</div>
    <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap"><a href="#" style="font-size: 14px; font-weight: 800">مسجدم در فهرست نیست؛ با پین اضافه کن</a><span style="font-size: 13px; color: {MUTE}">نام و نشانی را خودت می‌نویسی؛ ستاد یک بار تأیید می‌کند.</span></div>
    <div style="display: flex; flex-direction: column; gap: 6px"><b style="font-size: 14px">نسبت تو با این مسجد</b><div style="display: flex; gap: 8px; flex-wrap: wrap">{pill('امام جماعت', '#EAEFFC', DEEP)}{pill('شریکة‌الامام')}{pill('بازو')}{pill('عضو هسته')}{pill('نمازگزار')}</div></div>
    <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap">{btn('ادامه', 'MyPathsEmpty.dc.html')}{btn('فعلاً رد شو', 'MyPathsEmpty.dc.html', 'quiet')}<span style="font-size: 13px; color: {MUTE}">بعداً از کارنامه قابل تغییر است</span></div>
  </section>
</div>'''
open(P + 'OnboardMosque.dc.html', 'w').write(page('نخستین ورود: مسجد تو (نقشه)', body, 'class Component extends DCLogic { renderVals() { return {}; } }', 1440, 900))

# patch Onboard step chips to 4 steps and link to mosque step
s = open(P + 'Onboard.dc.html').read()
s = s.replace('<span style="padding: 4px 10px; border-radius: 999px; background: #F4F5F9; font-weight: 800">۳ اولین مسیر</span>', '<span style="padding: 4px 10px; border-radius: 999px; background: #F4F5F9; font-weight: 800">۳ مسجد تو</span><span style="padding: 4px 10px; border-radius: 999px; background: #F4F5F9; font-weight: 800">۴ اولین مسیر</span>')
s = s.replace('href="MyPathsEmpty.dc.html" style="display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 0 24px; border-radius: 14px; background: #0E9F5A', 'href="OnboardMosque.dc.html" style="display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 0 24px; border-radius: 14px; background: #0E9F5A')
s = s.replace('>شروع کن</a>', '>ادامه</a>')
open(P + 'Onboard.dc.html', 'w').write(s)

# ---------- Mobile: MOnboard (role) + MMosque (map)
inner = f'''<div style="display: flex; gap: 6px; font-size: 12px"><span style="padding: 3px 9px; border-radius: 999px; background: #EAEFFC; color: {DEEP}; font-weight: 800">۱ ورود</span><span style="padding: 3px 9px; border-radius: 999px; background: {DEEP}; color: #FFFFFF; font-weight: 800">۲ آشنایی</span><span style="padding: 3px 9px; border-radius: 999px; background: #F4F5F9; font-weight: 800">۳ مسجد</span><span style="padding: 3px 9px; border-radius: 999px; background: #F4F5F9; font-weight: 800">۴ مسیر</span></div>
<h1 style="margin: 4px 0 0; font-size: 22px; font-weight: 900">خوش آمدی. دو سؤال کوتاه</h1>
{mcard(f'<label style="display: flex; flex-direction: column; gap: 6px; font-size: 14px; font-weight: 800">نام<input value="زهرا زارعی" style="min-height: 50px; border: 1.5px solid #E4E7EF; border-radius: 14px; padding: 0 14px; font: inherit; font-size: 16px"><span style="font-size: 12px; color: {MUTE}; font-weight: 500">همان نامی که راهیار و همتایان می‌بینند</span></label><div style="display: flex; flex-direction: column; gap: 8px"><b style="font-size: 14px">نقش تو در مسجد (اختیاری)</b><div style="display: flex; gap: 6px; flex-wrap: wrap">{pill("امام")}{pill("شریکة‌الامام", "#EAEFFC", DEEP)}{pill("بازو")}{pill("عضو هسته")}{pill("دیگر")}</div></div>')}
<div style="padding: 12px 14px; border-radius: 16px; background: #EAEFFC; display: flex; gap: 10px; align-items: center">{toranj(DEEP, 26)}<span style="display: flex; flex-direction: column"><span style="font-size: 11px; color: {DEEP}; font-weight: 800">مسیر اصلی برای تو</span><b style="font-size: 15px; font-weight: 900">شریکة‌الامام</b><span style="font-size: 12px; color: #3E4462">بنیاد هدایت، ۳ پله، با راهیار</span></span></div>
{mbtn('ادامه', 'MMosque.dc.html')}<a href="MHome.dc.html" style="text-align: center; font-size: 14px; font-weight: 800; color: #3E4462">بعداً</a>'''
mpage('MOnboard.dc.html', 'گوشی: آشنایی', mtop('مدرسهٔ هدایت'), inner, h=844)

inner = f'''<div style="display: flex; gap: 6px; font-size: 12px"><span style="padding: 3px 9px; border-radius: 999px; background: #EAEFFC; color: {DEEP}; font-weight: 800">۱</span><span style="padding: 3px 9px; border-radius: 999px; background: #EAEFFC; color: {DEEP}; font-weight: 800">۲</span><span style="padding: 3px 9px; border-radius: 999px; background: {DEEP}; color: #FFFFFF; font-weight: 800">۳ مسجد تو</span><span style="padding: 3px 9px; border-radius: 999px; background: #F4F5F9; font-weight: 800">۴ مسیر</span></div>
<h1 style="margin: 4px 0 0; font-size: 22px; font-weight: 900">مسجد تو کجاست؟</h1><span style="font-size: 13px; color: {MUTE}">برای گعده‌های نزدیک و تیم‌های همین مسجد. فقط راهیار و ستاد می‌بینند.</span>
<div style="position: relative; height: 260px; border-radius: 18px; overflow: hidden; border: 1px solid #E4E7EF">{mapsvg(362, 260)}<div style="position: absolute; top: 10px; right: 10px; left: 10px; display: flex; gap: 6px"><label style="flex: 1; display: flex; align-items: center; background: #FFFFFF; border: 1.5px solid #E4E7EF; border-radius: 12px; padding: 0 12px; min-height: 42px"><input value="صاحب‌الزمان" style="flex: 1; border: 0; font: inherit; font-size: 14px; outline: none; min-width: 0"></label><a href="#" aria-label="موقعیت فعلی من" style="width: 42px; height: 42px; border-radius: 12px; background: #FFFFFF; border: 1.5px solid #E4E7EF; display: flex; align-items: center; justify-content: center; color: {DEEP}; text-decoration: none; font-weight: 900">◎</a></div><span style="position: absolute; bottom: 10px; right: 10px; padding: 6px 10px; border-radius: 999px; background: #FFFFFF; font-size: 12px; font-weight: 800">پین را روی مسجد بکش</span></div>
<div style="display: flex; flex-direction: column; gap: 6px"><b style="font-size: 14px">مسجدهای نزدیک پین</b>{mosque_list(0, True)}<a href="#" style="font-size: 13px; font-weight: 800; padding: 6px 0">مسجدم در فهرست نیست؛ با پین اضافه کن</a></div>
{mbtn('ادامه', 'MPaths.dc.html')}<a href="MPaths.dc.html" style="text-align: center; font-size: 14px; font-weight: 800; color: #3E4462">فعلاً رد شو</a>'''
mpage('MMosque.dc.html', 'گوشی: مسجد تو (نقشه)', mtop('مسجد تو', 'MOnboard.dc.html'), inner, h=900)

# MLogin -> MOnboard link
s = open(P + 'MLogin.dc.html').read().replace('>وارد شو</a>', '>وارد شو</a>'.replace('>', '>'))
s = s.replace('href="#" style="display: inline-flex; align-items: center; justify-content: center; min-height: 48px; width: 100%; box-sizing: border-box; padding: 0 24px; border-radius: 14px; background: #0E9F5A; color: #FFFFFF; border: 0; font-weight: 800; font-size: 16px; text-decoration: none; line-height: 1.4">وارد شو', 'href="MOnboard.dc.html" style="display: inline-flex; align-items: center; justify-content: center; min-height: 48px; width: 100%; box-sizing: border-box; padding: 0 24px; border-radius: 14px; background: #0E9F5A; color: #FFFFFF; border: 0; font-weight: 800; font-size: 16px; text-decoration: none; line-height: 1.4">وارد شو')
open(P + 'MLogin.dc.html', 'w').write(s)
print('mosque ok')
