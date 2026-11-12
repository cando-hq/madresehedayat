from ui import *

RS = lambda cur: side(cur, 'پنل راهیار', 'حاج‌آقا محمدی', [('q', 'صف روایت‌ها', YEL, 'RahyarFinal.dc.html'), ('a', 'کنشگران من', TEAL, 'RahyarActors.dc.html'), ('g', 'گعده‌ها', ORANGE, 'RahyarGaade.dc.html'), ('m', 'پیام‌ها', '#8C93B5', 'Messages.dc.html')], 'راهیارِ ۲ مسیر، ۱۴ کنشگر')
PS = lambda cur: side(cur, 'برگزارکننده', 'بنیاد هدایت', [('c', 'محتوای ما', YEL, 'Publisher.dc.html'), ('p', 'مسیرساز', DEEP, 'PathBuilder.dc.html'), ('k', 'دوره‌ساز', GREEN, 'CourseBuilder.dc.html'), ('l', 'پخش زنده', RED, 'LiveBuilder.dc.html'), ('r', 'راهیاران', TEAL, 'PubRahyars.dc.html'), ('i', 'گزارش اثر', ORANGE, 'Impact.dc.html'), ('b', 'کتابخانهٔ مشترک', '#8C93B5', 'Library.dc.html')], 'مدیر محتوا: آقای رستمی')
AS = lambda cur: side(cur, 'ستاد', 'بازبینی و ادارهٔ سامانه', [('r', 'صف بازبینی', YEL, 'AdminFinal.dc.html'), ('p', 'برگزارکنندگان', ORANGE, 'AdminPubs.dc.html'), ('u', 'کنشگران', TEAL, '#'), ('s', 'پشتیبانی', RED, 'AdminSupport.dc.html'), ('g', 'گزارش کل', DEEP, 'AdminReport.dc.html')], 'ستاد: خانم موسوی')

def h1(t, sub, right=''):
    return f'<div style="display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; flex-wrap: wrap"><div><h1 style="margin: 0; font-size: 28px; font-weight: 900">{t}</h1><p style="margin: 4px 0 0; color: {MUTE}">{sub}</p></div>{right}</div>'

def table(cols, rows_var, row_tpl, count=6):
    th = ''.join(f'<th style="text-align: right; padding: 12px 14px; font-size: 13px; color: {MUTE}; font-weight: 800; border-bottom: 1px solid #E4E7EF">{c}</th>' for c in cols)
    return f'<div style="{CARD}; overflow: hidden"><table style="width: 100%; border-collapse: collapse; font-size: 14px"><thead><tr>{th}</tr></thead><tbody><sc-for list="{{{{{rows_var}}}}}" as="r" hint-placeholder-count="{count}"><tr style="border-bottom: 1px solid #F0F1F5">{row_tpl}</tr></sc-for></tbody></table></div>'
TD = lambda inner, extra='': f'<td style="padding: 12px 14px; vertical-align: middle; {extra}">{inner}</td>'

# ---------- RahyarActors: کنشگران من
inner = h1('کنشگران من', '۱۴ نفر در دو مسیر. اول کسی که ساکت شده.', f'<div style="display: flex; gap: 8px">{pill("۲ نفر دو هفته بی‌روایت", "#FBE6EB", "#A8314F")}{pill("۳ روایت منتظر تو", "#FFF2CC", "#8A5A00")}</div>') + f'''
<div role="group" aria-label="مسیر" style="display: flex; gap: 8px">{pill('همهٔ مسیرها', '#EAEFFC', DEEP)}{pill('جذب نوجوان در یک ماه (۶)')}{pill('تعیّن امامت، پلهٔ امام محله (۸)')}</div>
''' + table(['کنشگر', 'مسیر و جایگاه', 'آخرین روایت', 'وضعیت', ''], 'rows',
  TD(f'<span style="display: flex; align-items: center; gap: 10px"><span style="width: 36px; height: 36px; border-radius: 50%; background: {{{{r.c}}}}; color: #FFFFFF; font-weight: 900; display: flex; align-items: center; justify-content: center">{{{{r.i}}}}</span><span style="display: flex; flex-direction: column"><b>{{{{r.n}}}}</b><span style="font-size: 12px; color: {MUTE}">{{{{r.m}}}}</span></span></span>') +
  TD('<span style="display: flex; flex-direction: column"><span>{{r.path}}</span><span style="font-size: 12px; color: ' + MUTE + '">{{r.pos}}</span></span>') +
  TD('{{r.last}}') + TD(pill('{{r.st}}', '{{r.sbg}}', '{{r.sc}}')) + TD('<a href="{{r.href}}" style="font-weight: 800; white-space: nowrap">{{r.cta}}</a>'), 7) + f'''
<div style="{CARD}; padding: 18px 22px; display: flex; gap: 14px; align-items: center">{toranj(DEEP, 30)}<span style="flex: 1; font-size: 14px; color: #3E4462">کنشگر تازه را برگزارکننده به تو می‌سپارد؛ خودت کسی را اضافه نمی‌کنی. اگر فهرست خالی بود: «هنوز کنشگری به تو سپرده نشده. برگزارکننده تعیین می‌کند.»</span></div>'''
script = '''const R = [
  ['م', 'مهدی کاظمی', 'بازو، مسجد صاحب‌الزمان', 'جذب نوجوان', 'هفتهٔ ۳', '۴ روز پیش', 'wait', '#0B5F52'],
  ['ک', 'حاج‌آقا کریمی', 'امام، مسجد جامع', 'تعیّن امامت', 'پلهٔ امام محله، ۲ گام', '۳ روز پیش', 'wait', '#1E3A9E'],
  ['ز', 'خانم زارعی', 'شریکة‌الامام', 'جذب نوجوان', 'هفتهٔ ۳', 'دیروز', 'ok', '#A8314F'],
  ['ص', 'حاج‌آقا صادقی', 'امام، مسجد النبی', 'تعیّن امامت', 'پلهٔ امام محله، ۴ گام', '۱۶ روز پیش', 'quiet', '#1E3A9E'],
  ['ع', 'علی احمدی', 'عضو هسته', 'جذب نوجوان', 'هفتهٔ ۲', '۲۰ روز پیش', 'quiet', '#0B5F52'],
  ['ر', 'رضا نوری', 'بازو', 'جذب نوجوان', 'هفتهٔ ۳', 'امروز', 'wait', '#F08C1A'],
  ['ح', 'حاج‌آقا حسنی', 'امام، مسجد صاحب‌الزمان', 'تعیّن امامت', 'پلهٔ امام محله، ۶ گام', 'امروز', 'ok', '#1E3A9E'],
];
const ST = { wait: ['منتظر توست', '#FFF2CC', '#8A5A00', 'بازخورد بده', 'RahyarFinal.dc.html'], ok: ['در حرکت', '#DDF5E8', '#0A7A45', 'پرونده', '#'], quiet: ['دو هفته ساکت', '#FBE6EB', '#A8314F', 'پیام بده', 'Messages.dc.html'] };
class Component extends DCLogic { renderVals() { return { rows: R.map(([i, n, m, path, pos, last, s, c]) => ({ i, n, m, path, pos, last, c, st: ST[s][0], sbg: ST[s][1], sc: ST[s][2], cta: ST[s][3], href: ST[s][4] })) }; } }'''
save('RahyarActors.dc.html', 'راهیار: کنشگران من', panel(RS('a'), inner), script, 1440, 900)

# ---------- RahyarGaade: گعده‌ها و گعده‌گذاری
inner = h1('گعده‌ها', 'یک گعده در هفته برای هر مسیر کافی است. خلاصهٔ هر گعده را همان شب بنویس.') + f'''
<div style="display: grid; grid-template-columns: minmax(0, 1fr) 420px; gap: 18px; align-items: start">
  <div style="display: flex; flex-direction: column; gap: 12px">
    <sc-for list="{{{{list}}}}" as="g" hint-placeholder-count="4">
      <div style="{CARD}; padding: 20px 22px; display: grid; grid-template-columns: 1fr auto; gap: 14px; align-items: center; border-right: 8px solid {{{{g.c}}}}"><span style="display: flex; flex-direction: column; gap: 4px"><span style="font-size: 12px; color: {MUTE}">{{{{g.path}}}}</span><b style="font-size: 17px; font-weight: 900">{{{{g.t}}}}</b><span style="font-size: 13px; color: #3E4462">{{{{g.when}}}}، {{{{g.where}}}}</span><span style="font-size: 13px; color: #3E4462">{{{{g.who}}}}</span></span><span style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px">{pill('{{g.st}}', '{{g.sbg}}', '{{g.sc}}')}<a href="#" style="font-size: 14px; font-weight: 800">{{{{g.cta}}}}</a></span></div>
    </sc-for>
  </div>
  <form style="{CARD}; padding: 24px; display: flex; flex-direction: column; gap: 14px"><b style="font-size: 18px; font-weight: 900">گعدهٔ تازه</b>
    <label style="display: flex; flex-direction: column; gap: 6px; font-size: 14px; font-weight: 800">مسیر<select style="min-height: 48px; border: 1.5px solid #E4E7EF; border-radius: 14px; padding: 0 12px; font: inherit; font-size: 15px"><option>جذب نوجوان در یک ماه</option><option>تعیّن امامت، پلهٔ امام محله</option></select></label>
    <label style="display: flex; flex-direction: column; gap: 6px; font-size: 14px; font-weight: 800">موضوع<input value="هفتهٔ چهارم: قرار ثابت" style="min-height: 48px; border: 1.5px solid #E4E7EF; border-radius: 14px; padding: 0 12px; font: inherit; font-size: 15px"><span style="font-size: 13px; color: {MUTE}; font-weight: 500">پیشنهاد مسیر: موضوع هفتهٔ جاری</span></label>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px"><label style="display: flex; flex-direction: column; gap: 6px; font-size: 14px; font-weight: 800">تاریخ<input value="پنجشنبه ۲۱ آذر" style="min-height: 48px; border: 1.5px solid #E4E7EF; border-radius: 14px; padding: 0 12px; font: inherit; font-size: 15px"></label><label style="display: flex; flex-direction: column; gap: 6px; font-size: 14px; font-weight: 800">ساعت<input value="۲۰:۳۰" style="min-height: 48px; border: 1.5px solid #E4E7EF; border-radius: 14px; padding: 0 12px; font: inherit; font-size: 15px"></label></div>
    <div style="display: flex; flex-direction: column; gap: 8px"><b style="font-size: 14px">حضوری یا آنلاین</b><div style="display: flex; gap: 8px">{pill('حضوری', '#EAEFFC', DEEP)}{pill('آنلاین')}</div><input value="مسجد صاحب‌الزمان، شبستان کوچک" style="min-height: 48px; border: 1.5px solid #E4E7EF; border-radius: 14px; padding: 0 12px; font: inherit; font-size: 15px"></div>
    {banner('error', 'زمان گذشته است. تاریخ را درست کن.')}
    <div style="display: flex; gap: 10px; align-items: center">{btn('گعده بگذار')}<span style="font-size: 13px; color: {MUTE}">به ۶ کنشگر مسیر اعلان می‌رود</span></div>
  </form>
</div>'''
script = '''const G = [
  ['جذب نوجوان در یک ماه', 'هفتهٔ سوم: اولین دعوت', 'پنجشنبه ۱۴ آذر، ۲۰:۳۰', 'مسجد صاحب‌الزمان', '۴ می‌آیند، ۲ نگفته‌اند', 'next', '#F5B700'],
  ['تعیّن امامت، پلهٔ امام محله', 'بوم مسئله؛ ریشه‌ها را کنار هم بگذاریم', 'شنبه ۱۶ آذر، ۲۱:۰۰', 'آنلاین', '۸ نفر دعوت شده‌اند', 'next', '#1E3A9E'],
  ['جذب نوجوان در یک ماه', 'هفتهٔ دوم: اعتماد', 'پنجشنبه ۷ آذر', 'مسجد صاحب‌الزمان', '۵ نفر آمدند', 'done', '#12A58E'],
  ['جذب نوجوان در یک ماه', 'هفتهٔ اول: دیدن و شنیدن', 'پنجشنبه ۳۰ آبان', 'مسجد صاحب‌الزمان', '۶ نفر آمدند', 'nosum', '#12A58E'],
];
const ST = { next: ['پیش رو', '#FFF2CC', '#8A5A00', 'ویرایش'], done: ['برگزار شد، خلاصه نوشته شد', '#DDF5E8', '#0A7A45', 'خلاصه'], nosum: ['خلاصه ننوشته‌ای', '#FBE6EB', '#A8314F', 'خلاصه بنویس'] };
class Component extends DCLogic { renderVals() { return { list: G.map(([path, t, when, where, who, s, c]) => ({ path, t, when, where, who, c, st: ST[s][0], sbg: ST[s][1], sc: ST[s][2], cta: ST[s][3] })) }; } }'''
save('RahyarGaade.dc.html', 'راهیار: گعده‌ها', panel(RS('g'), inner), script, 1440, 980)

# ---------- CourseBuilder: دوره‌ساز
inner = h1('دوره‌ساز', 'دوره = چند درس + تکلیف اختیاری + آزمون اختیاری. در هر مسیری قابل استفاده است.', f'<div style="display: flex; gap: 8px">{pill("پیش‌نویس", "#F4F5F9")}{btn("ذخیرهٔ پیش‌نویس", "#", "quiet", True)}{btn("بفرست برای بازبینی", "#", "primary", True)}</div>') + f'''
<div style="display: grid; grid-template-columns: 360px minmax(0, 1fr); gap: 18px; align-items: start">
  <div style="display: flex; flex-direction: column; gap: 14px">
    <div style="{CARD}; padding: 20px; display: flex; flex-direction: column; gap: 12px">
      <label style="display: flex; flex-direction: column; gap: 6px; font-size: 14px; font-weight: 800">عنوان دوره<input value="حلقهٔ خانگی؛ گام به گام" style="min-height: 48px; border: 1.5px solid #E4E7EF; border-radius: 14px; padding: 0 12px; font: inherit; font-size: 15px"><span style="font-size: 13px; color: {MUTE}; font-weight: 500">تا ۶ کلمه</span></label>
      <label style="display: flex; flex-direction: column; gap: 6px; font-size: 14px; font-weight: 800">یک جمله برای کنشگر<textarea rows="2" style="border: 1.5px solid #E4E7EF; border-radius: 14px; padding: 10px 12px; font: inherit; font-size: 15px">از دعوت چهار همسایه تا قرار ثابت هفتگی.</textarea></label>
      <div style="display: flex; flex-direction: column; gap: 6px"><b style="font-size: 14px">مخاطب</b><div style="display: flex; gap: 6px; flex-wrap: wrap">{pill('شریکة‌الامام', '#EAEFFC', DEEP)}{pill('امام')}{pill('بازو')}{pill('همه')}</div></div>
      <div style="display: flex; flex-direction: column; gap: 6px"><b style="font-size: 14px">در کتابخانهٔ مشترک</b><label style="display: flex; align-items: center; gap: 10px; font-size: 14px"><input type="checkbox" checked style="width: 20px; height: 20px; accent-color: {GREEN}">برگزارکنندگان دیگر بتوانند در مسیرشان بگذارند (با نام ما)</label><div style="display: flex; gap: 6px; padding-right: 30px">{pill('همه', '#EAEFFC', DEEP)}{pill('با تأیید ما')}</div></div>
      <div style="display: flex; flex-direction: column; gap: 6px"><b style="font-size: 14px">پیشنهاد به مسیر اصلی</b><label style="display: flex; align-items: center; gap: 10px; font-size: 14px"><input type="checkbox" style="width: 20px; height: 20px; accent-color: {GREEN}">برای پلهٔ «…» مسیر «تعیّن امامت» پیشنهاد شود (بنیاد می‌پذیرد یا نه)</label></div>
      <div style="display: flex; flex-direction: column; gap: 4px"><b style="font-size: 14px">نسخه</b><span style="font-size: 13px; color: #3E4462">نسخهٔ ۱ (منتشرشده، در ۳ مسیر). تغییر تازه = نسخهٔ ۲؛ مسیرهای دیگران به نسخهٔ ۱ وصل می‌مانند تا صاحبشان بخواهد.</span></div>
    </div>
    <div style="{CARD}; padding: 20px; display: flex; flex-direction: column; gap: 8px"><b style="font-size: 14px">پیش از ارسال</b>
      <sc-for list="{{{{checks}}}}" as="c" hint-placeholder-count="4"><span style="display: flex; gap: 8px; align-items: center; font-size: 14px; color: {{{{c.c}}}}">{toranj('{{c.c}}', 16)}{{{{c.t}}}}</span></sc-for></div>
  </div>
  <div style="display: flex; flex-direction: column; gap: 12px">
    <div style="display: flex; justify-content: space-between; align-items: center"><h2 style="margin: 0; font-size: 20px; font-weight: 900">درس‌ها (۶)</h2><div style="display: flex; gap: 8px">{btn('+ درس', '#', 'ghost', True)}{btn('+ آزمون پایانی', '#', 'quiet', True)}</div></div>
    <sc-for list="{{{{lessons}}}}" as="l" hint-placeholder-count="6">
      <div style="{CARD}; padding: 16px 20px; display: grid; grid-template-columns: 28px 44px 1fr auto; gap: 14px; align-items: center"><span aria-label="جابه‌جا کن" style="color: #B4B9CC; font-size: 18px; cursor: grab">⋮⋮</span><span style="width: 44px; height: 44px; border-radius: 12px; background: {{{{l.bg}}}}; color: {{{{l.c}}}}; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 12px">{{{{l.k}}}}</span><span style="display: flex; flex-direction: column; gap: 2px"><b style="font-size: 15px">{{{{l.n}}}} {{{{l.t}}}}</b><span style="font-size: 13px; color: {MUTE}">{{{{l.m}}}}</span></span><span style="display: flex; gap: 6px; align-items: center">{pill('{{l.task}}', '{{l.tbg}}', '{{l.tc}}')}<a href="#" style="font-size: 14px; font-weight: 800">ویرایش</a></span></div>
    </sc-for>
    <div style="{CARD}; padding: 20px; display: flex; flex-direction: column; gap: 10px; border: 1.5px dashed #C9D3F5; background: #FBFCFF"><b style="font-size: 15px">درس ۷ (تازه)</b><div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px">{pill('صوت، تا ۳۰ مگابایت', '#EAEFFC', DEEP)}{pill('ویدیو، تا ۳۰۰ مگابایت')}{pill('متن')}</div><input placeholder="عنوان درس" style="min-height: 48px; border: 1.5px solid #E4E7EF; border-radius: 14px; padding: 0 12px; font: inherit; font-size: 15px"><div style="min-height: 72px; border: 1.5px dashed #E4E7EF; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 14px; color: {MUTE}">فایل را این‌جا بگذار یا لینک بده</div>{banner('error', 'فایل بزرگ است (۴۱ مگابایت). فشرده کن یا لینک بگذار.')}<label style="display: flex; flex-direction: column; gap: 6px; font-size: 14px; font-weight: 800">تکلیف این درس (اختیاری)<input placeholder="یک کنش واقعی که در یک هفته بشود" style="min-height: 48px; border: 1.5px solid #E4E7EF; border-radius: 14px; padding: 0 12px; font: inherit; font-size: 15px"></label></div>
  </div>
</div>'''
script = '''const L = [
  ['۱', 'چرا حلقه؟', 'صوت، ۸ دقیقه', 'A', 'بی تکلیف'], ['۲', 'دعوت از چهار همسایه', 'ویدیو، ۱۱ دقیقه', 'V', 'تکلیف: دعوت ۴ نفر'], ['۳', 'اولین نشست', 'صوت، ۹ دقیقه', 'A', 'تکلیف: نشست اول'],
  ['۴', 'موضوع ثابت، زمان ثابت', 'متن، ۴ دقیقه', 'T', 'بی تکلیف'], ['۵', 'وقتی کسی نیامد', 'صوت، ۷ دقیقه', 'A', 'بی تکلیف'], ['۶', 'قرار هفتگی', 'ویدیو، ۱۰ دقیقه', 'V', 'تکلیف: قرار ثابت'],
];
const K = { A: ['#D3EFEA', '#0B5F52'], V: ['#FBE6EB', '#A8314F'], T: ['#F4F5F9', '#3E4462'] };
class Component extends DCLogic { renderVals() { return {
  lessons: L.map(([n, t, m, k, task]) => ({ n, t, m, k: k === 'A' ? 'صوت' : k === 'V' ? 'ویدیو' : 'متن', bg: K[k][0], c: K[k][1], task, tbg: task === 'بی تکلیف' ? '#F4F5F9' : '#FFF2CC', tc: task === 'بی تکلیف' ? '#6C7290' : '#8A5A00' })),
  checks: [ { t: 'عنوان و جمله دارد', c: '#0A7A45' }, { t: 'دست‌کم یک درس', c: '#0A7A45' }, { t: 'دست‌کم یک تکلیف میدانی', c: '#0A7A45' }, { t: 'هر درس فایل یا متن دارد (درس ۷ ندارد)', c: '#A8314F' } ],
}; } }'''
save('CourseBuilder.dc.html', 'برگزارکننده: دوره‌ساز', panel(PS('k'), inner), script, 1440, 1400)

# ---------- LiveBuilder: پخش زنده
inner = h1('پخش زنده', 'بدون مسیر و دوره هم می‌شود. بعد از پایان، ضبط به هر مسیری که بخواهی الصاق می‌شود.', f'{btn("+ پخش زندهٔ تازه", "#", "primary", True)}') + f'''
<div style="display: grid; grid-template-columns: minmax(0, 1fr) 420px; gap: 18px; align-items: start">
  <div style="display: flex; flex-direction: column; gap: 12px">
    <sc-for list="{{{{list}}}}" as="l" hint-placeholder-count="4">
      <div style="{CARD}; padding: 18px 22px; display: grid; grid-template-columns: 1fr auto; gap: 14px; align-items: center"><span style="display: flex; flex-direction: column; gap: 4px"><b style="font-size: 17px; font-weight: 900">{{{{l.t}}}}</b><span style="font-size: 13px; color: #3E4462">{{{{l.when}}}}، {{{{l.host}}}}</span><span style="font-size: 13px; color: {MUTE}">{{{{l.m}}}}</span></span><span style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px">{pill('{{l.st}}', '{{l.sbg}}', '{{l.sc}}')}<a href="#" style="font-size: 14px; font-weight: 800">{{{{l.cta}}}}</a></span></div>
    </sc-for>
  </div>
  <form style="{CARD}; padding: 24px; display: flex; flex-direction: column; gap: 14px"><b style="font-size: 18px; font-weight: 900">پخش زندهٔ تازه</b>
    <label style="display: flex; flex-direction: column; gap: 6px; font-size: 14px; font-weight: 800">عنوان<input value="مهمانی محله؛ تجربهٔ ۴۵۰۰ محله" style="min-height: 48px; border: 1.5px solid #E4E7EF; border-radius: 14px; padding: 0 12px; font: inherit; font-size: 15px"></label>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px"><label style="display: flex; flex-direction: column; gap: 6px; font-size: 14px; font-weight: 800">تاریخ<input value="سه‌شنبه ۴ آذر" style="min-height: 48px; border: 1.5px solid #E4E7EF; border-radius: 14px; padding: 0 12px; font: inherit; font-size: 15px"></label><label style="display: flex; flex-direction: column; gap: 6px; font-size: 14px; font-weight: 800">ساعت<input value="۲۰:۳۰" style="min-height: 48px; border: 1.5px solid #E4E7EF; border-radius: 14px; padding: 0 12px; font: inherit; font-size: 15px"></label></div>
    <label style="display: flex; flex-direction: column; gap: 6px; font-size: 14px; font-weight: 800">مجری<input value="حجت‌الاسلام قاسمی" style="min-height: 48px; border: 1.5px solid #E4E7EF; border-radius: 14px; padding: 0 12px; font: inherit; font-size: 15px"></label>
    <label style="display: flex; flex-direction: column; gap: 6px; font-size: 14px; font-weight: 800">لینک پخش<input value="https://live.example.ir/mehmani" style="min-height: 48px; border: 1.5px solid #E4E7EF; border-radius: 14px; padding: 0 12px; font: inherit; font-size: 15px; direction: ltr; text-align: left"><span style="font-size: 13px; color: {MUTE}; font-weight: 500">هر سرویس داخلی؛ باید با https شروع شود</span></label>
    <div style="display: flex; flex-direction: column; gap: 6px"><b style="font-size: 14px">ضبط</b><label style="display: flex; align-items: center; gap: 10px; font-size: 14px"><input type="checkbox" checked style="width: 20px; height: 20px; accent-color: {GREEN}">بعد از پایان، ضبط را به مسیر‌ها الصاق کن</label><div style="display: flex; gap: 6px; flex-wrap: wrap">{pill('حل مسئلهٔ محله', '#EAEFFC', DEEP)}{pill('+ مسیر دیگر')}</div></div>
    <div style="display: flex; gap: 10px; align-items: center">{btn('بفرست برای بازبینی')}{btn('پیش‌نویس', '#', 'quiet')}</div>
  </form>
</div>'''
script = '''const L = [
  ['مهمانی محله؛ تجربهٔ ۴۵۰۰ محله', 'سه‌شنبه ۴ آذر، ۲۰:۳۰', 'حجت‌الاسلام قاسمی', 'در بازبینی از ۱۰ آبان', 'rev', 'ویرایش'],
  ['نوجوان و مسجد', 'سه‌شنبه ۲۷ آبان، ۲۱:۰۰', 'خانم رضایی', '۱۸۳ یادآوری‌خواه، ضبط می‌شود', 'ok', 'لینک را بفرست'],
  ['اخلاق امامت محله، جلسهٔ ۶', 'سه‌شنبه ۲۰ آبان', 'حجت‌الاسلام قاسمی', 'ضبط به «تعیّن امامت» الصاق شد، ۲۴۰ بازدید', 'done', 'ضبط'],
  ['اخلاق امامت محله، جلسهٔ ۵', 'سه‌شنبه ۱۳ آبان', 'حجت‌الاسلام قاسمی', 'ضبط هنوز بارگذاری نشده', 'norec', 'ضبط را بگذار'],
];
const ST = { rev: ['در بازبینی', '#FFF2CC', '#8A5A00'], ok: ['منتشر شده', '#DDF5E8', '#0A7A45'], done: ['برگزار شد', '#F4F5F9', '#3E4462'], norec: ['ضبط ندارد', '#FBE6EB', '#A8314F'] };
class Component extends DCLogic { renderVals() { return { list: L.map(([t, when, host, m, s, cta]) => ({ t, when, host, m, cta, st: ST[s][0], sbg: ST[s][1], sc: ST[s][2] })) }; } }'''
save('LiveBuilder.dc.html', 'برگزارکننده: پخش زنده', panel(PS('l'), inner), script, 1440, 980)

# ---------- PubRahyars: راهیاران مسیرها
inner = h1('راهیاران', 'هر مسیرِ با تکلیف باید راهیار داشته باشد. با شماره دعوت کن؛ با همان شماره وارد می‌شود.', f'{btn("+ دعوت راهیار", "#", "primary", True)}') + table(['راهیار', 'مسیر', 'کنشگران', 'میانگین پاسخ', 'وضعیت', ''], 'rows',
  TD('<span style="display: flex; flex-direction: column"><b>{{r.n}}</b><span style="font-size: 12px; color: ' + MUTE + '">{{r.ph}}</span></span>') + TD('{{r.path}}') + TD('{{r.k}}') + TD('{{r.avg}}') + TD(pill('{{r.st}}', '{{r.sbg}}', '{{r.sc}}')) + TD('<a href="#" style="font-weight: 800">{{r.cta}}</a>'), 5) + f'''
<div style="{CARD}; padding: 22px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; align-items: end"><label style="display: flex; flex-direction: column; gap: 6px; font-size: 14px; font-weight: 800">شمارهٔ موبایل راهیار<input placeholder="۰۹۱۲…" style="min-height: 48px; border: 1.5px solid #E4E7EF; border-radius: 14px; padding: 0 12px; font: inherit; font-size: 15px"></label><label style="display: flex; flex-direction: column; gap: 6px; font-size: 14px; font-weight: 800">مسیر<select style="min-height: 48px; border: 1.5px solid #E4E7EF; border-radius: 14px; padding: 0 12px; font: inherit; font-size: 15px"><option>تعیّن امامت</option><option>جذب نوجوان در یک ماه</option><option>حل مسئلهٔ محله</option></select></label>{btn('دعوت بفرست')}</div>'''
script = '''const R = [
  ['حاج‌آقا محمدی', '۰۹۱۲…۵۵۵', 'جذب نوجوان؛ تعیّن امامت', '۱۴', '۱٫۸ روز', 'ok', 'پرونده'],
  ['خانم رضایی', '۰۹۱۳…۲۱۰', 'حلقهٔ خانگی', '۹', '۰٫۹ روز', 'ok', 'پرونده'],
  ['حاج‌آقا نجفی', '۰۹۱۵…۰۰۷', 'تعیّن امامت', '۱۱', '۴٫۶ روز', 'slow', 'پیام بده'],
  ['آقای شریفی', '۰۹۱۹…۳۳۱', 'حل مسئلهٔ محله', '۰', '', 'inv', 'دعوت دوباره'],
  ['', '', 'حل مسئلهٔ محله', '۲۳ کنشگر بی راهیار', '', 'none', 'راهیار بگذار'],
];
const ST = { ok: ['فعال', '#DDF5E8', '#0A7A45'], slow: ['پاسخ دیر', '#FFF2CC', '#8A5A00'], inv: ['دعوت‌شده، نیامده', '#F4F5F9', '#3E4462'], none: ['مسیر بی راهیار', '#FBE6EB', '#A8314F'] };
class Component extends DCLogic { renderVals() { return { rows: R.map(([n, ph, path, k, avg, s, cta]) => ({ n: n || '—', ph, path, k, avg: avg || '—', cta, st: ST[s][0], sbg: ST[s][1], sc: ST[s][2] })) }; } }'''
save('PubRahyars.dc.html', 'برگزارکننده: راهیاران', panel(PS('r'), inner), script, 1440, 820)

# ---------- Impact: گزارش اثر
inner = h1('گزارش اثر', 'نه بازدید، نه دقیقهٔ تماشا. چند نفر برداشتند، چند نفر در حرکت‌اند، چند گام رشد تأیید شد.', f'<div style="display: flex; gap: 8px">{pill("این فصل: پاییز ۱۴۰۵", "#EAEFFC", DEEP)}{pill("فصل قبل")}{btn("خروجی", "#", "quiet", True)}</div>') + f'''
<section style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px"><sc-for list="{{{{kpi}}}}" as="x" hint-placeholder-count="4"><div style="{CARD}; padding: 18px 20px"><span style="font-size: 13px; color: {MUTE}">{{{{x.t}}}}</span><b style="display: block; font-size: 30px; font-weight: 900">{{{{x.v}}}}</b><span style="font-size: 12px; color: {{{{x.c}}}}">{{{{x.d}}}}</span></div></sc-for></section>
''' + table(['مسیر / دوره / پخش', 'برداشته', 'در حرکت', 'گام رشد تأییدشده', 'افتاده (۳ هفته ساکت)', 'راهیار'], 'rows',
  TD('<span style="display: flex; flex-direction: column"><b>{{r.t}}</b><span style="font-size: 12px; color: ' + MUTE + '">{{r.k}}</span></span>') + TD('{{r.a}}') + TD('{{r.b}}') + TD('<b style="color: #0A7A45">{{r.c}}</b>') + TD('<span style="color: {{r.dc}}">{{r.d}}</span>') + TD('{{r.r}}'), 6) + f'''
<section style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px">
  <div style="{CARD}; padding: 22px; display: flex; flex-direction: column; gap: 8px"><b style="font-size: 16px">کجا می‌افتند</b><span style="font-size: 14px; color: #3E4462; line-height: 1.9">در «تعیّن امامت» بیشترین افت بین پلهٔ ۲ و ۳ است (تکلیف «بوم مسئله»). در «جذب نوجوان» هفتهٔ ۲ (گفت‌وگوی بی‌برنامه). تکلیف را کوچک‌تر کن یا گعده را جلوتر بگذار.</span></div>
  <div style="{CARD}; padding: 22px; display: flex; flex-direction: column; gap: 8px"><b style="font-size: 16px">محتوای ما در مسیر دیگران</b><span style="font-size: 14px; color: #3E4462">«حلقهٔ خانگی؛ گام به گام» در ۳ مسیر از ۲ برگزارکنندهٔ دیگر؛ ۴۱ کنشگر از آن راه.</span><span style="font-size: 13px; color: {MUTE}">حالت خالی: «هنوز کسی مسیر را برنداشته. لینک مسیر را بفرست.»</span></div>
</section>'''
script = '''class Component extends DCLogic { renderVals() { return {
  kpi: [ { t: 'کنشگرِ برداشته', v: '۶۲۰', d: '+۱۱۰ نسبت به فصل قبل', c: '#0A7A45' }, { t: 'در حرکت (روایت در ۳ هفتهٔ اخیر)', v: '۴۱۲', d: '۶۶٪', c: '#3E4462' }, { t: 'گام رشد تأییدشده، این فصل', v: '۱٬۰۴۸', d: 'شاخص اصلی', c: '#1E3A9E' }, { t: 'میانگین پاسخ راهیاران', v: '۲٫۱ روز', d: 'هدف: زیر ۳ روز', c: '#0A7A45' } ],
  rows: [
    { t: 'تعیّن امامت', k: 'مسیر کلان، ۴ پله', a: '۲۸۰', b: '۱۹۰', c: '۵۲۰', d: '۴۱', dc: '#A8314F', r: '۳ راهیار' },
    { t: 'جذب نوجوان در یک ماه', k: 'مسیر خرد', a: '۲۱۴', b: '۱۶۰', c: '۳۱۰', d: '۲۲', dc: '#8A5A00', r: 'حاج‌آقا محمدی' },
    { t: 'حل مسئلهٔ محله', k: 'مسیر میانه', a: '۹۶', b: '۴۸', c: '۱۳۸', d: '۲۳', dc: '#A8314F', r: 'بی راهیار!' },
    { t: 'حلقهٔ خانگی؛ گام به گام', k: 'دوره، در ۳ مسیر دیگران', a: '۱۴۰', b: '۸۰', c: '۸۰', d: '۹', dc: '#3E4462', r: 'خانم رضایی' },
    { t: 'اخلاق امامت محله', k: 'پخش زنده، ۶ جلسه', a: '۳۸۰ ثبت‌نام', b: '۲۴۰ بازدید ضبط', c: '—', d: '—', dc: '#3E4462', r: '—' },
  ],
}; } }'''
save('Impact.dc.html', 'برگزارکننده: گزارش اثر', panel(PS('i'), inner), script, 1440, 1000)

# ---------- AdminPubs: برگزارکنندگان
inner = h1('برگزارکنندگان', '۱۲ فعال، ۲ در انتظار، ۱ مسدود. برگزارکننده می‌سازد؛ ستاد بازبین است.', f'<div style="display: flex; gap: 8px">{pill("۲ درخواست تازه", "#FFF2CC", "#8A5A00")}{btn("+ برگزارکننده", "#", "quiet", True)}</div>') + table(['برگزارکننده', 'نوع و معرف', 'محتوا', 'کنشگران', 'گام رشد این فصل', 'وضعیت', ''], 'rows',
  TD('<span style="display: flex; align-items: center; gap: 10px"><span style="width: 12px; height: 12px; border-radius: 50%; background: {{r.c}}"></span><b>{{r.n}}</b></span>') + TD('<span style="display: flex; flex-direction: column"><span>{{r.kind}}</span><span style="font-size: 12px; color: ' + MUTE + '">{{r.ref}}</span></span>') + TD('{{r.content}}') + TD('{{r.k}}') + TD('<b>{{r.g}}</b>') + TD(pill('{{r.st}}', '{{r.sbg}}', '{{r.sc}}')) + TD('<a href="#" style="font-weight: 800">{{r.cta}}</a>'), 7) + f'''
<div style="{CARD}; padding: 22px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px">
  <div style="display: flex; flex-direction: column; gap: 8px"><b style="font-size: 15px">پذیرش برگزارکنندهٔ تازه: سه شرط</b><span style="font-size: 14px; color: #3E4462">۱) هویت نهاد یا گروه روشن است. ۲) معرفِ معتبر دارد. ۳) تعهد حریم (روایت‌ها را جایی نمی‌برد) امضا شده.</span></div>
  <div style="display: flex; flex-direction: column; gap: 8px"><b style="font-size: 15px">مسدود کردن</b><span style="font-size: 14px; color: #3E4462">دومرحله‌ای، با دلیل مکتوب. محتوای منتشرشده‌اش برای کنشگرانِ در حرکت می‌ماند تا مسیرشان نیمه‌کاره نشود.</span></div>
</div>'''
script = '''const R = [
  ['بنیاد هدایت', '#1E3A9E', 'بنیاد، معرف: ستاد', '۳ مسیر، ۹ دوره، ۶ پخش', '۶۲۰', '۱٬۰۴۸', 'ok', 'پرونده'],
  ['مؤسسهٔ برکت', '#0E9F5A', 'مؤسسهٔ ثبت‌شده، معرف: بنیاد هدایت', '۲ دوره', '۱۴۰', '۸۰', 'ok', 'پرونده'],
  ['مجمع بانوان مسجدی', '#D64A6A', 'شبکهٔ مردمی، معرف: ستاد استان', '۱ مسیر، ۳ دوره', '۲۱۰', '۱۹۰', 'ok', 'پرونده'],
  ['شبکهٔ مساجد شهر', '#F08C1A', 'ستاد شهری، معرف: ستاد', '۱ مسیر، ۴ پخش', '۳۰۰', '۱۲۰', 'ok', 'پرونده'],
  ['کانون نوجوانان مسجد', '#1BA3C6', 'کانون، معرف: شبکهٔ مساجد شهر', '۱ مسیر کلان در بازبینی', '۰', '۰', 'rev', 'بازبینی'],
  ['مؤسسهٔ فرهنگی نورالهدی', '#8C93B5', 'مؤسسه، معرف: ستاد استان فارس', '—', '۰', '۰', 'wait', 'بررسی درخواست'],
  ['گروه رسانه‌ای ایکس', '#8C93B5', 'بی معرف', '۱ دوره (پایین کشیده شد)', '۱۲', '۰', 'block', 'دلیل'],
];
const ST = { ok: ['فعال', '#DDF5E8', '#0A7A45'], rev: ['محتوا در بازبینی', '#FFF2CC', '#8A5A00'], wait: ['در انتظار پذیرش', '#EAEFFC', '#1E3A9E'], block: ['مسدود', '#FBE6EB', '#A8314F'] };
class Component extends DCLogic { renderVals() { return { rows: R.map(([n, c, kind, content, k, g, s, cta]) => ({ n, c, kind: kind.split('، ')[0], ref: kind.split('، ')[1] || '', content, k, g, cta, st: ST[s][0], sbg: ST[s][1], sc: ST[s][2] })) }; } }'''
save('AdminPubs.dc.html', 'ستاد: برگزارکنندگان', panel(AS('p'), inner), script, 1440, 900)

# ---------- AdminSupport: پشتیبانی
inner = h1('پشتیبانی', 'تیکت‌های کنشگران و برگزارکنندگان. هدف: پاسخ اول زیر یک روز.', f'<div style="display: flex; gap: 8px">{pill("۵ باز", "#FBE6EB", "#A8314F")}{pill("۳ در حال پیگیری", "#FFF2CC", "#8A5A00")}{pill("۴۰ بسته این ماه", "#DDF5E8", "#0A7A45")}</div>') + f'''
<div style="display: grid; grid-template-columns: 380px minmax(0, 1fr); gap: 18px; align-items: start">
  <div style="{CARD}; padding: 10px; display: flex; flex-direction: column; gap: 6px"><sc-for list="{{{{q}}}}" as="t" hint-placeholder-count="5"><button type="button" onClick="{{{{t.pick}}}}" aria-pressed="{{{{t.on}}}}" style="text-align: right; font: inherit; cursor: pointer; color: {INK}; border: 0; border-radius: 16px; padding: 12px 14px; background: {{{{t.bg}}}}; display: flex; flex-direction: column; gap: 4px"><span style="display: flex; gap: 8px; align-items: center; width: 100%">{pill('{{t.kind}}', '{{t.kbg}}', '{{t.kc}}')}<span style="font-size: 12px; color: {MUTE}">{{{{t.who}}}}</span><span style="margin-right: auto; font-size: 12px; color: {{{{t.ac}}}}">{{{{t.age}}}}</span></span><b style="font-size: 14px; font-weight: 800">{{{{t.t}}}}</b></button></sc-for></div>
  <div style="{CARD}; padding: 26px; display: flex; flex-direction: column; gap: 14px">
    <div><span style="font-size: 13px; color: {MUTE}">{{{{cur.kind}}}}، {{{{cur.who}}}}، {{{{cur.age}}}}</span><h2 style="margin: 2px 0 0; font-size: 20px; font-weight: 900">{{{{cur.t}}}}</h2></div>
    <div style="padding: 16px 18px; border-radius: 16px; background: #FBFAF6; font-size: 15px; line-height: 1.9">{{{{cur.text}}}}</div>
    <div style="display: flex; gap: 8px; flex-wrap: wrap">{pill('گوشی: اندروید ۱۰')}{pill('اینترنت: ۲G')}{pill('مسیر: جذب نوجوان، هفتهٔ ۳')}</div>
    <label style="display: flex; flex-direction: column; gap: 6px; font-size: 14px; font-weight: 800">پاسخ<textarea rows="3" style="border: 1.5px solid #E4E7EF; border-radius: 14px; padding: 10px 12px; font: inherit; font-size: 15px">سلام. فایل درس‌ها را می‌توانید از دکمهٔ «دانلود برای آفلاین» زیر هر درس ذخیره کنید؛ با وای‌فای یک بار دانلود می‌شود و بعد بدون اینترنت باز می‌شود.</textarea></label>
    <div style="display: flex; gap: 8px; flex-wrap: wrap">{btn('پاسخ بده و ببند')}{btn('پاسخ بده، باز بماند', '#', 'ghost')}{btn('بفرست به برگزارکننده', '#', 'quiet')}</div>
  </div>
</div>'''
script = '''const Q = [
  ['bug', 'مهدی کاظمی، کنشگر', 'صوت درس باز نمی‌شود', '۳ ساعت', 'سلام. درس هفتهٔ سوم با اینترنت گوشی باز نمی‌شود؛ تا نصف می‌آید و قطع می‌شود.'],
  ['pub', 'مؤسسهٔ برکت', 'دورهٔ ما در کتابخانه دیده نمی‌شود', '۱ روز', 'دوره را منتشر کردید اما در کتابخانهٔ مشترک برای برگزارکنندگان دیگر نیست.'],
  ['acc', 'خانم زارعی، کنشگر', 'شماره‌ام عوض شده', '۲ روز', 'شمارهٔ قبلی را ندارم. کارنامه‌ام را چطور به شمارهٔ تازه بیاورم؟'],
  ['bug', 'حاج‌آقا نجفی، راهیار', 'بازخورد ثبت نشد', '۴ روز', 'سه بار نوشتم و «مشکلی از سمت ما» آمد.'],
  ['idea', 'علی احمدی، کنشگر', 'پیشنهاد: یادآوری گعده یک روز قبل', '۶ روز', 'یک ساعت قبل دیر است؛ ما باید از قبل برنامه بریزیم.'],
];
const K = { bug: ['خطا', '#FBE6EB', '#A8314F'], pub: ['برگزارکننده', '#FFF2CC', '#8A5A00'], acc: ['حساب', '#EAEFFC', '#1E3A9E'], idea: ['پیشنهاد', '#D3EFEA', '#0B5F52'] };
class Component extends DCLogic { renderVals() { const s = (this.state && this.state.i) || 0; const c = Q[s]; return {
  q: Q.map(([k, who, t, age], i) => ({ kind: K[k][0], kbg: K[k][1], kc: K[k][2], who, t, age, ac: i < 2 ? '#A8314F' : '#6C7290', on: i === s ? 'true' : 'false', bg: i === s ? '#EAEFFC' : '#F4F5F9', pick: () => this.setState({ i }) })),
  cur: { kind: K[c[0]][0], who: c[1], t: c[2], age: c[3] + ' پیش', text: c[4] } }; } }'''
save('AdminSupport.dc.html', 'ستاد: پشتیبانی', panel(AS('s'), inner), script, 1440, 900)

# ---------- AdminReport: گزارش کل
inner = h1('گزارش کل', 'یک شاخص اصلی: کنشگران با گام رشد تأییدشده در فصل. بقیه برای فهمیدن چرایی.', f'<div style="display: flex; gap: 8px">{pill("پاییز ۱۴۰۵", "#EAEFFC", DEEP)}{pill("تابستان ۱۴۰۵")}{btn("خروجی", "#", "quiet", True)}</div>') + f'''
<section style="{CARD}; padding: 26px 30px; display: grid; grid-template-columns: 1fr 2fr; gap: 24px; align-items: center; background: {DEEP}; color: #FFFFFF; border: 0"><div><span style="font-size: 14px; color: #C9D3F5">کنشگران با گام رشد تأییدشده، این فصل</span><b style="display: block; font-size: 56px; font-weight: 900; line-height: 1.2">۱٬۸۴۰</b><span style="font-size: 14px; color: #C9D3F5">از ۲٬۹۶۰ کنشگرِ برداشته (۶۲٪)، فصل قبل ۱٬۴۱۰</span></div>
  <div style="display: flex; align-items: flex-end; gap: 10px; height: 140px"><sc-for list="{{{{bars}}}}" as="b" hint-placeholder-count="6"><span style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px"><span style="font-size: 12px; color: #C9D3F5">{{{{b.v}}}}</span><span style="width: 100%; height: {{{{b.h}}}}px; border-radius: 8px 8px 0 0; background: {{{{b.c}}}}"></span><span style="font-size: 12px; color: #C9D3F5">{{{{b.t}}}}</span></span></sc-for></div></section>
<section style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px"><sc-for list="{{{{kpi}}}}" as="x" hint-placeholder-count="4"><div style="{CARD}; padding: 18px 20px"><span style="font-size: 13px; color: {MUTE}">{{{{x.t}}}}</span><b style="display: block; font-size: 28px; font-weight: 900">{{{{x.v}}}}</b><span style="font-size: 12px; color: #3E4462">{{{{x.d}}}}</span></div></sc-for></section>
''' + table(['برگزارکننده', 'کنشگرِ برداشته', 'در حرکت', 'گام رشد تأییدشده', 'میانگین پاسخ راهیار', 'افت'], 'rows',
  TD('<b>{{r.n}}</b>') + TD('{{r.a}}') + TD('{{r.b}}') + TD('<b style="color: #0A7A45">{{r.c}}</b>') + TD('<span style="color: {{r.rc}}">{{r.r}}</span>') + TD('{{r.d}}'), 5)
script = '''class Component extends DCLogic { renderVals() { return {
  bars: [ ['مهر', 480, '#7FA0F0'], ['آبان', 610, '#7FA0F0'], ['آذر', 750, '#F5B700'], ['تیر', 420, 'rgba(255,255,255,0.3)'], ['مرداد', 470, 'rgba(255,255,255,0.3)'], ['شهریور', 520, 'rgba(255,255,255,0.3)'] ].map(([t, v, c]) => ({ t, v: v.toLocaleString('fa-IR'), h: Math.round(v / 750 * 100), c })),
  kpi: [ { t: 'برگزارکنندهٔ فعال', v: '۱۲', d: '۲ در انتظار' }, { t: 'مسیر منتشرشده', v: '۱۹', d: '۷ کلان، ۵ میانه، ۷ خرد؛ ۳۱ دوره' }, { t: 'راهیار فعال', v: '۴۸', d: 'میانگین ۱۲ کنشگر برای هر راهیار' }, { t: 'گعدهٔ برگزارشده', v: '۲۱۰', d: '۸۰٪ با خلاصه' } ],
  rows: [ { n: 'بنیاد هدایت', a: '۶۲۰', b: '۴۱۲', c: '۱٬۰۴۸', r: '۲٫۱ روز', rc: '#0A7A45', d: '۸٪' }, { n: 'شبکهٔ مساجد شهر', a: '۳۰۰', b: '۲۰۱', c: '۳۴۰', r: '۱٫۶ روز', rc: '#0A7A45', d: '۵٪' }, { n: 'مجمع بانوان مسجدی', a: '۲۱۰', b: '۱۷۰', c: '۲۹۰', r: '۰٫۹ روز', rc: '#0A7A45', d: '۴٪' }, { n: 'مؤسسهٔ برکت', a: '۱۴۰', b: '۸۰', c: '۸۰', r: '—', rc: '#3E4462', d: '۱۲٪' }, { n: 'کانون نوجوانان مسجد', a: '۰', b: '۰', c: '۰', r: '—', rc: '#3E4462', d: '—' } ],
}; } }'''
save('AdminReport.dc.html', 'ستاد: گزارش کل', panel(AS('g'), inner), script, 1440, 1000)
print('ok')
