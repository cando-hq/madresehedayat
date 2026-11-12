from ui import *

# ---------- Onboard: نخستین ورود
body = f'''<div style="{ROOT}; display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh">
  <section style="position: relative; overflow: hidden; background: {DEEP}"><img src="{POSTER}" alt="گنبد مسجد در غروب" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.55"><div style="position: relative; padding: 44px 48px; color: #FFFFFF; display: flex; flex-direction: column; gap: 14px; background: linear-gradient(180deg, rgba(27,33,80,0.85), rgba(27,33,80,0))"><img src="{LOGO_W}" alt="مدرسهٔ هدایت" style="width: 200px; max-width: 100%; height: auto; align-self: flex-start"><h1 style="margin: 0; font-size: 30px; font-weight: 900; line-height: 1.4">یادگیری برای کار در مسجد، نه برای نمره</h1><p style="margin: 0; font-size: 15px; color: #C9D3F5; max-width: 420px">مسیرهای کوتاه و بلندِ برگزارکنندگان مختلف؛ هر درس یک کار واقعی در مسجد دارد و راهیار کنار توست.</p></div></section>
  <section style="padding: 44px 56px; display: flex; flex-direction: column; gap: 22px; justify-content: center">
    <div style="display: flex; gap: 8px; align-items: center; font-size: 13px; color: {MUTE}"><span style="padding: 4px 10px; border-radius: 999px; background: #EAEFFC; color: {DEEP}; font-weight: 800">۱ ورود</span><span style="padding: 4px 10px; border-radius: 999px; background: {DEEP}; color: #FFFFFF; font-weight: 800">۲ آشنایی</span><span style="padding: 4px 10px; border-radius: 999px; background: #F4F5F9; font-weight: 800">۳ اولین مسیر</span></div>
    <div><h2 style="margin: 0; font-size: 28px; font-weight: 900">خوش آمدی. دو سؤال کوتاه</h2><p style="margin: 4px 0 0; color: {MUTE}">تا مسیرهای مناسب‌تر را اول نشانت بدهیم. هر دو را می‌توانی بعداً تغییر دهی.</p></div>
    <label style="display: flex; flex-direction: column; gap: 6px; font-size: 14px; font-weight: 800">نام<input value="سیدمحمد حسنی" style="min-height: 50px; border: 1.5px solid #E4E7EF; border-radius: 14px; padding: 0 14px; font: inherit; font-size: 16px"><span style="font-size: 13px; color: {MUTE}; font-weight: 500">همان نامی که راهیار و همتایان می‌بینند</span></label>
    <div style="display: flex; flex-direction: column; gap: 8px"><b style="font-size: 14px">نقش تو در مسجد (اختیاری)</b><div style="display: flex; gap: 8px; flex-wrap: wrap">
      <sc-for list="{{{{roles}}}}" as="r" hint-placeholder-count="5"><button type="button" onClick="{{{{r.pick}}}}" aria-pressed="{{{{r.on}}}}" style="min-height: 44px; padding: 0 16px; border-radius: 999px; border: 1.5px solid {{{{r.b}}}}; background: {{{{r.bg}}}}; color: {{{{r.c}}}}; font: inherit; font-size: 14px; font-weight: 800; cursor: pointer">{{{{r.t}}}}</button></sc-for></div></div>
    <div style="padding: 14px 16px; border-radius: 16px; background: #EAEFFC; display: flex; gap: 12px; align-items: center">{toranj(DEEP, 30)}<span style="display: flex; flex-direction: column; gap: 2px"><span style="font-size: 12px; color: {DEEP}; font-weight: 800">مسیر اصلی برای تو</span><b style="font-size: 16px; font-weight: 900">{{{{main.t}}}}</b><span style="font-size: 13px; color: #3E4462">{{{{main.d}}}}</span></span></div>
    <label style="display: flex; flex-direction: column; gap: 6px; font-size: 14px; font-weight: 800">مسجد یا محله (اختیاری)<input placeholder="مثلاً مسجد صاحب‌الزمان، بهشهر" style="min-height: 50px; border: 1.5px solid #E4E7EF; border-radius: 14px; padding: 0 14px; font: inherit; font-size: 16px"><span style="font-size: 13px; color: {MUTE}; font-weight: 500">برای پیشنهاد گعده‌ها و مسیرهای نزدیک</span></label>
    <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap">{btn('شروع کن', 'MyPathsEmpty.dc.html')}{btn('بعداً', 'HomeFinal.dc.html', 'quiet')}<span style="font-size: 13px; color: {MUTE}">مسیر اصلی پیش‌فرض است، اجبار نیست؛ از «کاوش» هر چیز دیگری را برمی‌داری.</span></div>
  </section>
</div>'''
script = '''const R = ['امام', 'شریکة‌الامام', 'بازو', 'عضو هسته', 'دیگر'];
const MAIN = [['تعیّن امامت', 'بنیاد هدایت، ۴ پله از امام خانه تا امام مسجد، با راهیار'], ['شریکة‌الامام', 'بنیاد هدایت، ۳ پله، همراهی امام در خانه، حلقه و محله'], ['از عضو تا مربی هسته', 'کانون نوجوانان مسجد، ۳ پله، با مربی هسته'], ['از عضو تا مربی هسته', 'کانون نوجوانان مسجد، ۳ پله، با مربی هسته'], ['بی مسیر اصلی', 'از کاوش شروع کن؛ هر وقت نقش‌ت را گفتی، مسیر اصلی پیشنهاد می‌شود']];
class Component extends DCLogic { renderVals() { const s = (this.state && this.state.i) ?? 0; return { main: { t: MAIN[s][0], d: MAIN[s][1] }, roles: R.map((t, i) => ({ t, on: i === s ? 'true' : 'false', b: i === s ? '#1E3A9E' : '#E4E7EF', bg: i === s ? '#EAEFFC' : '#FFFFFF', c: i === s ? '#1E3A9E' : '#3E4462', pick: () => this.setState({ i }) })) }; } }'''
save('Onboard.dc.html', 'نخستین ورود', body, script, 1440, 900)

# ---------- MyPaths (with content) + MyPathsEmpty
def mypaths(is_empty):
    tabs = f'<div role="tablist" style="display: flex; gap: 4px; background: #FFFFFF; border: 1px solid #E4E7EF; border-radius: 16px; padding: 4px; align-self: flex-start"><a role="tab" aria-selected="true" href="MyPaths.dc.html" style="padding: 10px 20px; border-radius: 12px; background: #EAEFFC; color: {DEEP}; font-weight: 800; text-decoration: none">مسیرهای من</a><a role="tab" aria-selected="false" href="PathMacro.dc.html" style="padding: 10px 20px; border-radius: 12px; color: #3E4462; font-weight: 800; text-decoration: none">مسیر اصلی من</a><a role="tab" aria-selected="false" href="Explore.dc.html" style="padding: 10px 20px; border-radius: 12px; color: #3E4462; font-weight: 800; text-decoration: none">کاوش</a></div>'
    if is_empty:
        inner = head('یادگیری', 'مسیرهایی که برداشته‌ای، این‌جاست.') + tabs + f'''<section style="{CARD}; padding: 24px 28px; display: grid; grid-template-columns: 1fr auto; gap: 18px; align-items: center; border-right: 10px solid {DEEP}"><div style="display: flex; flex-direction: column; gap: 6px"><span style="font-size: 12px; color: {DEEP}; font-weight: 800">مسیر اصلی برای تو (امام)</span><b style="font-size: 24px; font-weight: 900">تعیّن امامت</b><span style="font-size: 14px; color: #3E4462">بنیاد هدایت، ۴ پله از امام خانه تا امام مسجد، با راهیار. دوره‌های برگزارکنندگان دیگر هم داخل پله‌هایش هست.</span></div><div style="display: flex; flex-direction: column; gap: 8px">{btn('مسیر اصلی را بردار', 'PathMacro.dc.html', 'blue')}{btn('ببین چه دارد', 'PathMacro.dc.html', 'quiet', True)}</div></section>''' + empty('هنوز مسیری برنداشته‌ای', 'اگر مسیر اصلی برایت بلند است، با یک مسیر خرد شروع کن؛ یک تا چهار هفته، هر هفته یک کار کوچک در مسجد.', 'کاوش کن', 'Explore.dc.html') + f'''
    <section style="display: flex; flex-direction: column; gap: 12px"><h2 style="margin: 0; font-size: 20px; font-weight: 900">سه مسیر خرد برای شروع</h2>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px">
        <sc-for list="{{{{sug}}}}" as="s" hint-placeholder-count="3"><a href="PathMicro.dc.html" style="{CARD}; overflow: hidden; display: flex; flex-direction: column; text-decoration: none; color: {INK}"><span style="height: 10px; background: {{{{s.c}}}}"></span><span style="padding: 18px; display: flex; flex-direction: column; gap: 8px"><span style="display: flex; justify-content: space-between; font-size: 12px"><b style="color: #0B5F52">مسیر خرد، {{{{s.len}}}}</b><span style="color: {MUTE}">{{{{s.by}}}}</span></span><b style="font-size: 17px; font-weight: 900">{{{{s.t}}}}</b><span style="font-size: 13px; color: #3E4462">{{{{s.d}}}}</span><span style="margin-top: 6px">{btn('ببین چه دارد', 'PathMicro.dc.html', 'ghost', True)}</span></span></a></sc-for>
      </div></section>'''
        script = '''class Component extends DCLogic { renderVals() { return { sug: [
  { t: 'جذب نوجوان در یک ماه', by: 'بنیاد هدایت', len: '۴ هفته', d: 'هفته‌ای یک درس ۱۰ دقیقه‌ای و یک کار با نوجوانان مسجد.', c: '#12A58E' },
  { t: 'اولین حلقهٔ خانگی', by: 'مجمع بانوان مسجدی', len: '۳ هفته', d: 'از دعوت چهار همسایه تا قرار ثابت هفتگی.', c: '#D64A6A' },
  { t: 'دفتر نام و احوال محله', by: 'شبکهٔ مساجد شهر', len: '۲ هفته', d: 'شناختن ۴۰ خانواده با روش ساده و بی‌تکلف.', c: '#F08C1A' },
] }; } }'''
        save('MyPathsEmpty.dc.html', 'یادگیری: مسیرهای من (خالی)', shell('learn', inner), script, 1440, 900)
        return
    inner = head('یادگیری', 'سه مسیر در حرکت. اول کاری که مهلت نزدیک دارد.') + tabs + f'''
    <section style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px">
      <sc-for list="{{{{paths}}}}" as="p" hint-placeholder-count="3">
        <a href="{{{{p.href}}}}" style="{CARD}; overflow: hidden; display: flex; flex-direction: column; text-decoration: none; color: {INK}"><span style="height: 10px; background: {{{{p.c}}}}"></span>
          <span style="padding: 18px; display: flex; flex-direction: column; gap: 10px"><span style="display: flex; justify-content: space-between; font-size: 12px"><b style="color: {{{{p.ink}}}}">{{{{p.kind}}}}</b><span style="color: {MUTE}">{{{{p.by}}}}</span></span><b style="font-size: 18px; font-weight: 900">{{{{p.t}}}}</b>{bar('{{p.w}}', '{{p.c}}')}<span style="font-size: 13px; color: #3E4462">{{{{p.state}}}}</span><span style="display: flex; gap: 8px; align-items: center; margin-top: 4px"><span style="display: inline-flex; min-height: 40px; align-items: center; padding: 0 16px; border-radius: 12px; background: {{{{p.c}}}}; color: #FFFFFF; font-weight: 800; font-size: 14px">{{{{p.cta}}}}</span><span style="font-size: 12px; color: {MUTE}">{{{{p.due}}}}</span></span></span>
        </a>
      </sc-for>
    </section>
    <section style="display: flex; flex-direction: column; gap: 12px"><div style="display: flex; justify-content: space-between; align-items: center"><h2 style="margin: 0; font-size: 20px; font-weight: 900">تمام‌شده‌ها</h2><a href="Karname.dc.html" style="font-size: 14px; font-weight: 800">در کارنامه</a></div>
      <div style="{CARD}; padding: 6px 18px"><sc-for list="{{{{done}}}}" as="d" hint-placeholder-count="2"><div style="display: flex; align-items: center; gap: 14px; padding: 12px 0; border-bottom: 1px solid #F0F1F5">{toranj(GREEN, 22)}<span style="flex: 1; display: flex; flex-direction: column"><b style="font-size: 15px">{{{{d.t}}}}</b><span style="font-size: 13px; color: {MUTE}">{{{{d.m}}}}</span></span>{pill('گواهی', '#DDF5E8', '#0A7A45')}</div></sc-for></div></section>
    <section style="display: flex; flex-direction: column; gap: 12px"><div style="display: flex; justify-content: space-between; align-items: center"><h2 style="margin: 0; font-size: 20px; font-weight: 900">پیشنهاد برای تو</h2><a href="Explore.dc.html" style="font-size: 14px; font-weight: 800">همهٔ مسیرها</a></div>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px"><sc-for list="{{{{sug}}}}" as="s" hint-placeholder-count="3"><a href="PathMicro.dc.html" style="{CARD}; padding: 18px; display: flex; gap: 14px; align-items: center; text-decoration: none; color: {INK}">{toranj('{{s.c}}', 36)}<span style="display: flex; flex-direction: column; gap: 2px"><span style="font-size: 12px; color: {MUTE}">{{{{s.kind}}}}، {{{{s.by}}}}</span><b style="font-size: 15px; font-weight: 800">{{{{s.t}}}}</b><span style="font-size: 13px; color: #3E4462">{{{{s.why}}}}</span></span></a></sc-for></div></section>'''
    script = '''class Component extends DCLogic { renderVals() { return {
  paths: [
    { kind: 'مسیر کلان، پلهٔ ۳ از ۴', by: 'بنیاد هدایت', t: 'تعیّن امامت', state: 'پلهٔ امام محله. تکلیف «بوم مسئلهٔ محله» منتظر روایت توست.', w: '58%', c: '#1E3A9E', ink: '#1E3A9E', cta: 'روایت بنویس', due: 'تا ۱۸ آذر', href: 'PathMacro.dc.html' },
    { kind: 'مسیر خرد، هفتهٔ ۳ از ۴', by: 'بنیاد هدایت', t: 'جذب نوجوان در یک ماه', state: 'با هستهٔ نوجوانان می‌خوانی. درس این هفته: «اولین دعوت».', w: '70%', c: '#12A58E', ink: '#0B5F52', cta: 'ادامه بده، ۸ دقیقه', due: 'گعده پنجشنبه', href: 'PathMicro.dc.html' },
    { kind: 'دوره، بخش ۲ از ۵', by: 'مؤسسهٔ برکت', t: 'کار با نوجوان در فضای مجازی', state: 'خودآموز. بخش بعد صوتی است.', w: '40%', c: '#0E9F5A', ink: '#0A7A45', cta: 'ادامه بده', due: 'بی مهلت', href: 'Course.dc.html' },
  ],
  done: [ { t: 'دفتر نام و احوال محله', m: 'مسیر خرد، شبکهٔ مساجد شهر، مهر ۱۴۰۵' }, { t: 'پلهٔ امام جماعت', m: 'تعیّن امامت، بنیاد هدایت، تیر ۱۴۰۵' } ],
  sug: [ { kind: 'مسیر میانه', by: 'بنیاد هدایت', t: 'حل مسئلهٔ محله', why: 'ادامهٔ طبیعی پلهٔ فعلی تو', c: '#F08C1A' }, { kind: 'پخش زنده', by: 'شبکهٔ مساجد شهر', t: 'مهمانی محله؛ تجربهٔ ۴۵۰۰ محله', why: 'سه‌شنبه ۲۰:۳۰، ضبط می‌شود', c: '#D64A6A' }, { kind: 'دوره', by: 'مجمع بانوان مسجدی', t: 'حلقهٔ خانگی؛ گام به گام', why: 'برای شریکة‌الامام', c: '#D64A6A' } ],
}; } }'''
    save('MyPaths.dc.html', 'یادگیری: مسیرهای من', shell('learn', inner), script, 1440, 1150)
mypaths(False); mypaths(True)

# ---------- PathMicro: صفحهٔ مسیر خرد
inner = f'''<nav aria-label="مسیر صفحه" style="font-size: 13px; color: {MUTE}"><a href="MyPaths.dc.html">یادگیری</a> ‹ مسیر خرد</nav>
<section style="{CARD}; padding: 28px 32px; display: grid; grid-template-columns: 1.3fr 1fr; gap: 28px; align-items: center">
  <div style="display: flex; flex-direction: column; gap: 12px"><div style="display: flex; gap: 8px; flex-wrap: wrap">{pill('مسیر خرد، ۴ هفته', '#D3EFEA', '#0B5F52')}{pill('بنیاد هدایت')}{pill('با راهیار')}{pill('فردی یا تیمی')}</div><h1 style="margin: 0; font-size: 32px; font-weight: 900">جذب نوجوان در یک ماه</h1><p style="margin: 0; font-size: 15px; color: #3E4462; line-height: 1.9">هر هفته یک درس ۱۰ دقیقه‌ای و یک کار کوچک با نوجوانان مسجد. آخر ماه، سه نوجوان تازه را به نام می‌شناسی و برنامهٔ ثابت هفتگی داری.</p><div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap">{btn('ادامه بده، هفتهٔ ۳', 'Lesson.dc.html')}{btn('با تیم بخوان', 'Peers.dc.html', 'ghost')}<span style="font-size: 13px; color: {MUTE}">۲۱۴ کنشگر این مسیر را برداشته‌اند</span></div></div>
  <div style="display: flex; flex-direction: column; gap: 10px; padding: 18px; border-radius: 20px; background: #F4F5F9"><b style="font-size: 14px">پیشرفت تو</b>{bar('70%', TEAL)}<span style="font-size: 13px; color: #3E4462">هفتهٔ ۳ از ۴، ۲ گام رشد تأییدشده</span><div style="display: flex; gap: 8px; margin-top: 6px"><div style="flex: 1; padding: 10px 12px; border-radius: 14px; background: #FFFFFF"><span style="font-size: 12px; color: {MUTE}">راهیار</span><b style="display: block; font-size: 14px">حاج‌آقا محمدی</b></div><div style="flex: 1; padding: 10px 12px; border-radius: 14px; background: #FFFFFF"><span style="font-size: 12px; color: {MUTE}">گعدهٔ بعدی</span><b style="display: block; font-size: 14px">پنجشنبه ۲۰:۳۰</b></div></div></div>
</section>
<section style="display: flex; flex-direction: column; gap: 12px"><h2 style="margin: 0; font-size: 22px; font-weight: 900">چهار هفته</h2>
  <div style="display: flex; flex-direction: column; gap: 10px">
    <sc-for list="{{{{weeks}}}}" as="w" hint-placeholder-count="4">
      <div style="{CARD}; padding: 18px 22px; display: grid; grid-template-columns: 56px 1fr auto; gap: 16px; align-items: center; border-color: {{{{w.border}}}}">
        <span style="width: 48px; height: 48px; border-radius: 50%; background: {{{{w.bg}}}}; color: {{{{w.c}}}}; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 18px">{{{{w.n}}}}</span>
        <span style="display: flex; flex-direction: column; gap: 4px"><b style="font-size: 17px; font-weight: 900">{{{{w.t}}}}</b><span style="font-size: 13px; color: #3E4462">درس: {{{{w.lesson}}}}</span><span style="font-size: 13px; color: #3E4462">تکلیف: {{{{w.task}}}}</span></span>
        <span style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px">{pill('{{w.st}}', '{{w.sbg}}', '{{w.sc}}')}<a href="{{{{w.href}}}}" style="font-size: 14px; font-weight: 800; color: {{{{w.lc}}}}">{{{{w.cta}}}}</a></span>
      </div>
    </sc-for>
  </div></section>
<section style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px">
  <div style="{CARD}; padding: 22px; display: flex; flex-direction: column; gap: 8px"><b style="font-size: 16px">چه چیزی گام رشد می‌شود</b><span style="font-size: 14px; color: #3E4462; line-height: 1.9">هر هفته یک روایت کوتاه از کاری که در مسجد کردی. راهیار می‌خواند و یا تأیید می‌کند یا یک نکته برمی‌گرداند. آزمون ندارد.</span></div>
  <div style="{CARD}; padding: 22px; display: flex; flex-direction: column; gap: 8px"><b style="font-size: 16px">در این مسیر هم هست</b><span style="font-size: 14px; color: #3E4462">دورهٔ «کار با نوجوان در فضای مجازی» از مؤسسهٔ برکت، هفتهٔ ۴ (با نام سازنده)</span><span style="font-size: 14px; color: #3E4462">پخش زندهٔ «نوجوان و مسجد» از شبکهٔ مساجد شهر، سه‌شنبه</span></div>
</section>'''
script = '''const W = [
  ['۱', 'دیدن و شنیدن', 'نوجوان مسجد ما کیست؟ (صوتی، ۹ دقیقه)', 'نام و سن سه نوجوان مسجد را بپرس', 'done'],
  ['۲', 'اعتماد', 'اولین گفت‌وگو (ویدیو، ۱۱ دقیقه)', 'با یک نوجوان ده دقیقه بی‌برنامه حرف بزن', 'done'],
  ['۳', 'اولین دعوت', 'دعوتی که پذیرفته می‌شود (صوتی، ۸ دقیقه)', 'یک نوجوان را به یک کار کوچک مسجد دعوت کن', 'now'],
  ['۴', 'قرار ثابت', 'برنامهٔ هفتگی کم‌هزینه (ویدیو، ۱۲ دقیقه)', 'اولین قرار هفتگی را با دو نوجوان بگذار', 'lock'],
];
const ST = { done: ['تأیید شد', '#DDF5E8', '#0A7A45', 'ببین', '#6C7290', '#E4E7EF', '#DDF5E8', '#0A7A45'], now: ['این هفته', '#FFF2CC', '#8A5A00', 'ادامه بده', '#1E3A9E', '#1E3A9E', '#1E3A9E', '#FFFFFF'], lock: ['بعد از هفتهٔ ۳', '#F4F5F9', '#6C7290', 'بعداً باز می‌شود', '#6C7290', '#E4E7EF', '#F4F5F9', '#6C7290'] };
class Component extends DCLogic { renderVals() { return { weeks: W.map(([n, t, lesson, task, s]) => { const x = ST[s]; return { n, t, lesson, task, st: x[0], sbg: x[1], sc: x[2], cta: x[3], lc: x[4], border: x[5], bg: x[6], c: x[7], href: s === 'lock' ? '#' : 'Lesson.dc.html' }; }) }; } }'''
save('PathMicro.dc.html', 'صفحهٔ مسیر خرد', shell('learn', inner), script, 1440, 1200)

# ---------- Field: میدان
inner = head('میدان', 'کارهای واقعی در مسجد و وضعیت هر روایت. هر چه این‌جا بسته شود، یک گام رشد است.',
  f'<div style="display: flex; gap: 8px">{pill("۱ منتظر روایت تو", "#FFF2CC", "#8A5A00")}{pill("۱ منتظر راهیار", "#EAEFFC", DEEP)}{pill("۱ برگشته", "#FBE6EB", "#A8314F")}</div>') + f'''
<section style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px">
  <sc-for list="{{{{tasks}}}}" as="t" hint-placeholder-count="4">
    <div style="{CARD}; padding: 22px; display: flex; flex-direction: column; gap: 10px; border-color: {{{{t.border}}}}">
      <div style="display: flex; justify-content: space-between; gap: 10px; align-items: center"><span style="font-size: 12px; color: {MUTE}">{{{{t.path}}}}</span>{pill('{{t.st}}', '{{t.sbg}}', '{{t.sc}}')}</div>
      <b style="font-size: 18px; font-weight: 900">{{{{t.t}}}}</b>
      <span style="font-size: 14px; color: #3E4462; line-height: 1.8">{{{{t.d}}}}</span>
      <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-top: 4px"><a href="{{{{t.href}}}}" style="display: inline-flex; align-items: center; min-height: 44px; padding: 0 18px; border-radius: 14px; background: {{{{t.bbg}}}}; color: {{{{t.bc}}}}; border: 1.5px solid {{{{t.bb}}}}; font-weight: 800; font-size: 15px; text-decoration: none">{{{{t.cta}}}}</a><span style="font-size: 13px; color: {MUTE}">{{{{t.meta}}}}</span></div>
    </div>
  </sc-for>
</section>
<section style="display: flex; flex-direction: column; gap: 12px"><h2 style="margin: 0; font-size: 20px; font-weight: 900">روایت‌های بسته‌شده</h2>
  <div style="{CARD}; padding: 6px 18px"><sc-for list="{{{{closed}}}}" as="c" hint-placeholder-count="3"><div style="display: flex; align-items: center; gap: 14px; padding: 12px 0; border-bottom: 1px solid #F0F1F5">{toranj(GREEN, 22)}<span style="flex: 1; display: flex; flex-direction: column"><b style="font-size: 15px">{{{{c.t}}}}</b><span style="font-size: 13px; color: {MUTE}">{{{{c.m}}}}</span></span><span style="font-size: 13px; color: #0A7A45; font-weight: 800">گام رشد</span></div></sc-for></div></section>'''
script = '''const T = [
  ['تعیّن امامت، پلهٔ امام محله', 'بوم مسئلهٔ محله', 'سی روز تمام شد. سه خط بنویس: چه کردی، چه شد، چه فهمیدی.', 'need', 'Narrate.dc.html', 'روایت بنویس', 'مهلت ۱۸ آذر'],
  ['جذب نوجوان در یک ماه، هفتهٔ ۳', 'یک نوجوان را به یک کار کوچک دعوت کن', 'بعد از درس «اولین دعوت» باز شد.', 'open', 'Lesson.dc.html', 'درس را ببین', 'بی مهلت'],
  ['جذب نوجوان در یک ماه، هفتهٔ ۲', 'ده دقیقه گفت‌وگوی بی‌برنامه', 'روایتت رسیده. راهیار تا سه روز پاسخ می‌دهد.', 'wait', '#', 'روایت را ببین', 'فرستاده در ۱۲ آبان'],
  ['حلقهٔ خانگی، بخش ۲', 'دعوت از چهار همسایه', 'راهیار یک نکته گفته: «اسم همسایه‌ها را بنویس، نه تعدادشان.»', 'back', 'Narrate.dc.html', 'اصلاح کن و بفرست', 'برگشته دیروز'],
];
const ST = { need: ['منتظر روایت تو', '#FFF2CC', '#8A5A00', '#F5B700', '#0E9F5A', '#FFFFFF', '#0E9F5A'], open: ['باز', '#F4F5F9', '#3E4462', '#E4E7EF', '#FFFFFF', '#1E3A9E', '#1E3A9E'], wait: ['منتظر راهیار', '#EAEFFC', '#1E3A9E', '#E4E7EF', '#FFFFFF', '#3E4462', '#E4E7EF'], back: ['برگشته با نکته', '#FBE6EB', '#A8314F', '#F0C2CD', '#0E9F5A', '#FFFFFF', '#0E9F5A'] };
class Component extends DCLogic { renderVals() { return {
  tasks: T.map(([path, t, d, s, href, cta, meta]) => { const x = ST[s]; return { path, t, d, href, cta, meta, st: x[0], sbg: x[1], sc: x[2], border: x[3], bbg: x[4], bc: x[5], bb: x[6] }; }),
  closed: [ { t: 'نام و سن سه نوجوان مسجد', m: 'جذب نوجوان، هفتهٔ ۱، تأیید حاج‌آقا محمدی، ۲ آبان' }, { t: 'منشور همکاری ارکان', m: 'تعیّن امامت، پلهٔ امام مسجد، تأیید، ۲۰ مهر' }, { t: 'دفتر نام و احوال، ۴۰ نام', m: 'دفتر نام و احوال محله، تأیید، ۵ مهر' } ],
}; } }'''
save('Field.dc.html', 'میدان: تکلیف‌ها و روایت‌ها', shell('field', inner), script, 1440, 1150)

# ---------- Narrate: فرم روایت با چهار حالت
def narr_card(state):
    if state == 'form':
        foot = f'<div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap">{btn("روایت را بفرست")}{btn("ضبط صدا", "#", "ghost")}{btn("عکس", "#", "quiet")}<span style="font-size: 13px; color: {MUTE}">پیش‌نویس روی گوشی می‌ماند</span></div>'
        top_ = ''
    elif state == 'error':
        top_ = banner('error', 'روایت فرستاده نشد. پیش‌نویس روی گوشی مانده؛ با اینترنت دوباره بفرست.', btn('دوباره بفرست', '#', 'danger', True))
        foot = f'<div style="display: flex; gap: 10px">{btn("روایت را بفرست")}</div>'
    elif state == 'wait':
        top_ = banner('wait', 'رسید. راهیار تا سه روز پاسخ می‌دهد. (فرستاده در ۱۴ آذر)')
        foot = f'<div style="display: flex; gap: 10px">{btn("برگرد به میدان", "Field.dc.html", "quiet")}</div>'
    else:
        top_ = banner('ok', 'گام رشدت تأیید شد: «بوم مسئلهٔ محله». در کارنامه ثبت شد.', btn('کارنامه', 'Karname.dc.html', 'ghost', True))
        foot = f'<div style="padding: 14px 16px; border-radius: 16px; background: #F4F5F9; font-size: 14px; line-height: 1.9"><b>راهیار:</b> ریشه‌ای که رسیدی درست است. قدم بعدی را با همان دو پدر داوطلب بردار و اسمشان را بنویس.</div>'
    ro = ' readonly' if state in ('wait', 'ok') else ''
    return f'''<div style="{CARD}; padding: 26px; display: flex; flex-direction: column; gap: 14px">{top_}
  <div><span style="font-size: 13px; color: {MUTE}">تعیّن امامت، پلهٔ امام محله</span><h2 style="margin: 2px 0 0; font-size: 20px; font-weight: 900">روایت تکلیف «بوم مسئلهٔ محله»</h2></div>
  <label style="display: flex; flex-direction: column; gap: 6px; font-size: 14px; font-weight: 800">چه کردی؟<textarea rows="5"{ro} style="border: 1.5px solid #E4E7EF; border-radius: 14px; padding: 12px 14px; font: inherit; font-size: 15px; line-height: 1.9; resize: vertical">با سه نفر از تیم بوم را پر کردیم. با سه خانواده حرف زدیم؛ هر سه گفتند بچه‌ها بعد از ساعت هشت جایی ندارند. ریشه: هیچ بزرگ‌تری برایشان وقت نمی‌گذارد. قدم بعد: دو پدر داوطلب شدند سه‌شنبه‌ها در مسجد بمانند.</textarea><span style="font-size: 13px; color: {MUTE}; font-weight: 500">سه خط کافی است: چه کردی، چه شد، چه فهمیدی. بدون نکتهٔ آبرویی.</span></label>
  <div style="display: flex; gap: 8px; flex-wrap: wrap">{pill('🔒 فقط راهیار می‌بیند')}{pill('یک عکس پیوست')}</div>
  {foot}</div>'''
inner = f'''<nav aria-label="مسیر صفحه" style="font-size: 13px; color: {MUTE}"><a href="Field.dc.html">میدان</a> ‹ روایت</nav>
<p style="margin: 0; font-size: 13px; color: {MUTE}">چهار حالت یک فرم: نوشتن، خطای ارسال، منتظر راهیار، تأیید.</p>
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 18px">{narr_card('form')}{narr_card('error')}{narr_card('wait')}{narr_card('ok')}</div>'''
save('Narrate.dc.html', 'فرم روایت و حالت‌هایش', shell('field', inner), w=1440, h=1250)

# ---------- Peers: همتایان (گعده + تیم + پرسش)
inner = head('همتایان', 'گعدهٔ بعدی، تیم تو و پرسش‌های مسیر.') + f'''
<section style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 18px; align-items: start">
  <div style="{CARD}; padding: 26px; display: flex; flex-direction: column; gap: 14px; border-top: 8px solid {YEL}">
    <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px"><span style="font-size: 13px; color: {MUTE}">گعدهٔ مسیر «جذب نوجوان در یک ماه»، با حاج‌آقا محمدی</span>{pill('پنجشنبه ۲۰:۳۰، حضوری', '#FFF2CC', '#8A5A00')}</div>
    <h2 style="margin: 0; font-size: 24px; font-weight: 900">گعدهٔ هفتهٔ سوم: اولین دعوت</h2>
    <p style="margin: 0; font-size: 15px; color: #3E4462; line-height: 1.9">هر کس روایت هفته‌اش را دو دقیقه می‌گوید؛ بعد یک سؤال از پنج پرسش مسیر. مسجد صاحب‌الزمان، شبستان کوچک.</p>
    <div style="display: flex; gap: 8px; align-items: center"><div style="display: flex"><sc-for list="{{{{av}}}}" as="a" hint-placeholder-count="4"><span style="width: 34px; height: 34px; border-radius: 50%; background: {{{{a.c}}}}; color: #FFFFFF; font-weight: 900; font-size: 13px; display: flex; align-items: center; justify-content: center; border: 2px solid #FFFFFF; margin-left: -8px">{{{{a.i}}}}</span></sc-for></div><span style="font-size: 13px; color: {MUTE}">۴ نفر می‌آیند، ۲ نفر نگفته‌اند</span></div>
    <div style="display: flex; gap: 10px; flex-wrap: wrap">{btn('می‌آیم')}{btn('نمی‌توانم', '#', 'quiet')}<span style="font-size: 13px; color: {MUTE}; align-self: center">یک ساعت قبل پیامک می‌آید</span></div>
    <div style="padding: 14px 16px; border-radius: 16px; background: #F4F5F9; display: flex; flex-direction: column; gap: 6px"><b style="font-size: 14px">گعدهٔ قبلی، ۵ آبان</b><span style="font-size: 14px; color: #3E4462">خلاصهٔ راهیار: «همه یک نوجوان را به نام شناختیم. قرارِ هفته: ده دقیقه گفت‌وگوی بی‌برنامه.»</span></div>
  </div>
  <div style="display: flex; flex-direction: column; gap: 14px">
    <div style="{CARD}; padding: 22px; display: flex; flex-direction: column; gap: 10px"><div style="display: flex; justify-content: space-between; align-items: center"><b style="font-size: 16px">تیم من: هستهٔ نوجوانان</b><a href="TeamFinal.dc.html" style="font-size: 14px; font-weight: 800">صفحهٔ تیم</a></div><span style="font-size: 13px; color: #3E4462">۶ عضو، مسئول: شما. مسیر تیمی: جذب نوجوان در یک ماه.</span>{bar('62%', TEAL)}<span style="font-size: 13px; color: {MUTE}">۴ نفر هفتهٔ ۳ را تمام کرده‌اند</span><div style="display: flex; gap: 8px">{pill('کد دعوت: ۴۸۲۱۱', '#EAEFFC', DEEP)}{btn('کد را بفرست', '#', 'quiet', True)}</div></div>
    <div style="{CARD}; padding: 22px; display: flex; flex-direction: column; gap: 10px"><div style="display: flex; justify-content: space-between; align-items: center"><b style="font-size: 16px">پرسش‌های مسیر</b><a href="#" style="font-size: 14px; font-weight: 800">بپرس</a></div>
      <sc-for list="{{{{qs}}}}" as="q" hint-placeholder-count="3"><a href="#" style="display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; border-radius: 14px; background: #F4F5F9; text-decoration: none; color: {INK}"><b style="font-size: 14px">{{{{q.t}}}}</b><span style="font-size: 12px; color: {MUTE}">{{{{q.m}}}}</span></a></sc-for></div>
  </div>
</section>
<section style="{CARD}; padding: 22px; display: flex; gap: 16px; align-items: center">{toranj(DEEP, 36)}<div style="flex: 1"><b style="font-size: 16px">گعده‌ای برای مسیر «تعیّن امامت» گذاشته نشده</b><p style="margin: 2px 0 0; font-size: 14px; color: {MUTE}">راهیار زمان بگذارد، خبرت می‌کنیم. تا آن وقت پرسش‌هایت را همین‌جا بنویس.</p></div>{btn('از راهیار بخواه', '#', 'ghost', True)}</section>'''
script = '''class Component extends DCLogic { renderVals() { return {
  av: [ { i: 'ح', c: '#1E3A9E' }, { i: 'م', c: '#0B5F52' }, { i: 'ع', c: '#A8314F' }, { i: 'ر', c: '#F08C1A' } ],
  qs: [ { t: 'نوجوانی که دعوت را رد کرد، دوباره دعوت کنم؟', m: 'علی احمدی، ۲ پاسخ، یکی از راهیار' }, { t: 'برنامهٔ هفتگی با بودجهٔ صفر؟', m: 'خانم زارعی، ۴ پاسخ' }, { t: 'والدین مخالف چه؟', m: 'شما، بی‌پاسخ، ۱ روز' } ],
}; } }'''
save('Peers.dc.html', 'همتایان: گعده و تیم', shell('peers', inner), script, 1440, 1000)

# ---------- Karname: کارنامهٔ چندمسیری + گواهی
inner = head('کارنامه', 'گام‌های رشد تأییدشده در هر مسیر. چیزی که این‌جا هست، در مسجد اتفاق افتاده.',
  f'<div style="display: flex; gap: 8px">{pill("۱۱ گام رشد", "#DDF5E8", "#0A7A45")}{pill("۲ گواهی", "#EAEFFC", DEEP)}{pill("۳ مسیر در حرکت")}</div>') + f'''
<section style="{CARD}; padding: 22px 26px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 18px; align-items: center; border-right: 10px solid {DEEP}"><div style="display: flex; flex-direction: column; gap: 4px"><span style="font-size: 12px; color: {DEEP}; font-weight: 800">مسیر اصلی تو</span><b style="font-size: 22px; font-weight: 900">تعیّن امامت، پلهٔ امام محله</b><span style="font-size: 13px; color: #3E4462">۶ گام رشد تأییدشده؛ ارزیابی میدانی ۱۸ آذر</span></div><div style="display: flex; flex-direction: column; gap: 6px"><span style="font-size: 12px; color: {MUTE}">شایستگی‌های این پله</span>{bar('58%', DEEP)}<span style="font-size: 13px; color: #3E4462">۱۴ از ۲۴؛ ۲ تا از مسیرهای دیگر حساب شده</span></div><div style="display: flex; flex-direction: column; gap: 4px"><span style="font-size: 12px; color: {MUTE}">راهیار اصلی</span><b style="font-size: 15px">حاج‌آقا محمدی</b><a href="PathMacro.dc.html" style="font-size: 13px; font-weight: 800">پله‌ها و شایستگی‌ها</a></div></section>
<h2 style="margin: 0; font-size: 20px; font-weight: 900">همهٔ مسیرها</h2>
<section style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px">
  <sc-for list="{{{{paths}}}}" as="p" hint-placeholder-count="4">
    <div style="{CARD}; padding: 22px; display: flex; flex-direction: column; gap: 10px"><div style="display: flex; justify-content: space-between; gap: 10px"><span style="display: flex; flex-direction: column"><span style="font-size: 12px; color: {MUTE}">{{{{p.kind}}}}، {{{{p.by}}}}</span><b style="font-size: 18px; font-weight: 900">{{{{p.t}}}}</b></span>{pill('{{p.st}}', '{{p.sbg}}', '{{p.sc}}')}</div>{bar('{{p.w}}', '{{p.c}}')}<span style="font-size: 13px; color: #3E4462">{{{{p.d}}}}</span>
      <div style="display: flex; gap: 6px; flex-wrap: wrap"><sc-for list="{{{{p.steps}}}}" as="s" hint-placeholder-count="4"><span style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; background: #F4F5F9; font-size: 12px; font-weight: 800"><span style="width: 8px; height: 8px; border-radius: 50%; background: {{{{s.c}}}}"></span>{{{{s.t}}}}</span></sc-for></div>
      <div style="display: flex; gap: 8px; margin-top: 4px"><a href="{{{{p.href}}}}" style="font-size: 14px; font-weight: 800">{{{{p.cta}}}}</a></div></div>
  </sc-for>
</section>
<section style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px">
  <div style="{CARD}; padding: 0; overflow: hidden; display: grid; grid-template-columns: 1fr 1fr"><div style="padding: 24px; background: {DEEP}; color: #FFFFFF; display: flex; flex-direction: column; gap: 8px; justify-content: center"><img src="{LOGO_W}" alt="" style="width: 120px; height: auto; align-self: flex-start"><span style="font-size: 12px; color: #C9D3F5">گواهی پایان مسیر خرد</span><b style="font-size: 18px; font-weight: 900">دفتر نام و احوال محله</b><span style="font-size: 12px; color: #C9D3F5">شبکهٔ مساجد شهر، مهر ۱۴۰۵، شمارهٔ ۱۴۰۵-۰۰۸۱۲</span></div><div style="padding: 22px; display: flex; flex-direction: column; gap: 8px; justify-content: center"><span style="font-size: 14px; color: #3E4462">۲ گام رشد تأییدشده، راهیار: خانم رضایی</span>{btn('گواهی را دریافت کن', '#', 'ghost', True)}<a href="#" style="font-size: 13px; font-weight: 800">به اشتراک بگذار</a></div></div>
  <div style="{CARD}; padding: 22px; display: flex; flex-direction: column; gap: 10px"><b style="font-size: 16px">پنج پرسش این فصل (از مسیر تعیّن امامت)</b><span style="font-size: 13px; color: {MUTE}">خودسنجی، فقط خودت و راهیار می‌بینید. آخرین بار: ۱ آذر.</span>
    <sc-for list="{{{{qs}}}}" as="q" hint-placeholder-count="5"><div style="display: flex; justify-content: space-between; gap: 10px; padding: 8px 0; border-bottom: 1px solid #F0F1F5; font-size: 14px"><span>{{{{q.t}}}}</span><span style="display: flex; gap: 4px"><sc-for list="{{{{q.d}}}}" as="x" hint-placeholder-count="3"><span style="width: 10px; height: 10px; border-radius: 50%; background: {{{{x.c}}}}"></span></sc-for></span></div></sc-for>
    {btn('خودسنجی این ماه', '#', 'quiet', True)}</div>
</section>'''
script = '''const D = (n) => [0, 1, 2].map(i => ({ c: i < n ? '#1E3A9E' : '#E4E7EF' }));
class Component extends DCLogic { renderVals() { return {
  paths: [
    { kind: 'مسیر کلان', by: 'بنیاد هدایت', t: 'تعیّن امامت', st: 'پلهٔ ۳ از ۴', sbg: '#EAEFFC', sc: '#1E3A9E', w: '58%', c: '#1E3A9E', d: '۶ گام رشد تأییدشده. ارزیابی میدانی پلهٔ امام محله ۱۸ آذر.', steps: [ { t: 'امام خانه', c: '#0E9F5A' }, { t: 'امام جماعت', c: '#0E9F5A' }, { t: 'امام محله', c: '#F5B700' }, { t: 'امام مسجد', c: '#E4E7EF' } ], cta: 'جزئیات پله‌ها و شایستگی‌ها', href: 'PathMacro.dc.html' },
    { kind: 'مسیر خرد', by: 'بنیاد هدایت', t: 'جذب نوجوان در یک ماه', st: 'هفتهٔ ۳ از ۴', sbg: '#D3EFEA', sc: '#0B5F52', w: '70%', c: '#12A58E', d: '۲ گام رشد. تیمی، با هستهٔ نوجوانان.', steps: [ { t: 'هفتهٔ ۱', c: '#0E9F5A' }, { t: 'هفتهٔ ۲', c: '#0E9F5A' }, { t: 'هفتهٔ ۳', c: '#F5B700' }, { t: 'هفتهٔ ۴', c: '#E4E7EF' } ], cta: 'مسیر', href: 'PathMicro.dc.html' },
    { kind: 'مسیر خرد', by: 'شبکهٔ مساجد شهر', t: 'دفتر نام و احوال محله', st: 'تمام، گواهی', sbg: '#DDF5E8', sc: '#0A7A45', w: '100%', c: '#0E9F5A', d: '۲ گام رشد، مهر ۱۴۰۵.', steps: [ { t: 'هفتهٔ ۱', c: '#0E9F5A' }, { t: 'هفتهٔ ۲', c: '#0E9F5A' } ], cta: 'گواهی', href: '#' },
    { kind: 'دوره', by: 'مؤسسهٔ برکت', t: 'کار با نوجوان در فضای مجازی', st: 'بخش ۲ از ۵', sbg: '#F4F5F9', sc: '#3E4462', w: '40%', c: '#0E9F5A', d: 'خودآموز، آزمون پایانی دارد.', steps: [ { t: 'بخش ۱', c: '#0E9F5A' }, { t: 'بخش ۲', c: '#F5B700' }, { t: 'آزمون', c: '#E4E7EF' } ], cta: 'ادامه', href: 'Course.dc.html' },
  ],
  qs: [ { t: 'از مردم هستم یا فاصله گرفته‌ام؟', d: D(2) }, { t: 'توجه را به منبع می‌برم یا به خودم؟', d: D(3) }, { t: 'در سختی صبر و یقین دارم؟', d: D(2) }, { t: 'نقد را می‌پذیرم؟', d: D(1) }, { t: 'جایگاه امانت است؛ جانشین می‌پرورم؟', d: D(1) } ],
}; } }'''
save('Karname.dc.html', 'کارنامهٔ چندمسیری و گواهی', shell('karname', inner), script, 1440, 1300)

# ---------- Exam: آزمون پایان دوره
inner = f'''<nav aria-label="مسیر صفحه" style="font-size: 13px; color: {MUTE}"><a href="Course.dc.html">دوره: کار با نوجوان در فضای مجازی</a> ‹ آزمون پایانی</nav>
<section style="display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 18px; align-items: start">
  <div style="{CARD}; padding: 28px; display: flex; flex-direction: column; gap: 18px">
    <div style="display: flex; justify-content: space-between; align-items: center"><b style="font-size: 14px; color: {MUTE}">پرسش ۳ از ۸</b>{pill('بی زمان، هر وقت خواستی', '#F4F5F9')}</div>{bar('37%', DEEP)}
    <h1 style="margin: 0; font-size: 22px; font-weight: 900; line-height: 1.6">نوجوانی در گروه مجازی مسجد پیامی تند می‌گذارد. اولین کار درست کدام است؟</h1>
    <div role="radiogroup" style="display: flex; flex-direction: column; gap: 8px"><sc-for list="{{{{opts}}}}" as="o" hint-placeholder-count="4"><button type="button" role="radio" aria-checked="{{{{o.on}}}}" onClick="{{{{o.pick}}}}" style="text-align: right; font: inherit; font-size: 15px; cursor: pointer; min-height: 52px; padding: 12px 16px; border-radius: 16px; border: 1.5px solid {{{{o.b}}}}; background: {{{{o.bg}}}}; color: {INK}; display: flex; gap: 12px; align-items: center"><span style="width: 22px; height: 22px; border-radius: 50%; border: 2px solid {{{{o.b}}}}; background: {{{{o.dot}}}}; flex: none"></span>{{{{o.t}}}}</button></sc-for></div>
    <div style="display: flex; gap: 10px; align-items: center">{btn('پرسش بعدی')}{btn('قبلی', '#', 'quiet')}<span style="font-size: 13px; color: {MUTE}">پاسخ‌ها ذخیره می‌شود؛ می‌توانی بعداً برگردی.</span></div>
  </div>
  <div style="display: flex; flex-direction: column; gap: 14px">
    <div style="{CARD}; padding: 20px; display: flex; flex-direction: column; gap: 8px"><b style="font-size: 15px">این آزمون</b><span style="font-size: 14px; color: #3E4462">۸ پرسش، قبولی ۶. فقط دانش دوره را می‌سنجد؛ گام رشد از روایت می‌آید، نه از این آزمون.</span><span style="font-size: 13px; color: {MUTE}">سازنده: مؤسسهٔ برکت</span></div>
    <div style="{CARD}; padding: 20px; display: flex; flex-direction: column; gap: 10px"><b style="font-size: 15px">بعد از قبولی</b>{banner('ok', 'دوره تمام شد: ۷ از ۸. گواهی دوره در کارنامه است.', '')}<span style="font-size: 13px; color: {MUTE}">اگر کمتر از ۶: «دو پرسش را دوباره ببین؛ بخش ۴ را گوش کن و دوباره بیا.» بی محدودیت تلاش.</span></div>
  </div>
</section>'''
script = '''const O = ['در گروه جواب تند بده تا دیگران یاد بگیرند', 'پیام را حذف کن و او را از گروه بیرون کن', 'خصوصی پیام بده و بپرس چه شده', 'هیچ کاری نکن تا خودش آرام شود'];
class Component extends DCLogic { renderVals() { const s = (this.state && this.state.i) ?? 2; return { opts: O.map((t, i) => ({ t, on: i === s ? 'true' : 'false', b: i === s ? '#1E3A9E' : '#E4E7EF', bg: i === s ? '#EAEFFC' : '#FFFFFF', dot: i === s ? '#1E3A9E' : '#FFFFFF', pick: () => this.setState({ i }) })) }; } }'''
save('Exam.dc.html', 'آزمون پایان دوره', shell('learn', inner), script, 1440, 820)
print('ok')
