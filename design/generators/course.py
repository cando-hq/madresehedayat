import sys; sys.path.insert(0,'/home/claude/dz/gen')
from common import *
body=f'''<div style="{ROOT}">
  {nav('learn')}
  <main style="max-width: 1280px; margin: 0 auto; padding: 28px 32px 64px; display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 24px; align-items: start">
    <div style="display: flex; flex-direction: column; gap: 20px; min-width: 0">
      <section style="background: #F08C1A; color: #FFFFFF; border-radius: 32px; padding: 36px 40px; display: flex; gap: 28px; align-items: center; flex-wrap: wrap">
        <svg width="110" height="138" viewBox="0 0 48 60" aria-hidden="true" style="flex: none"><path d="{TOR}" fill="rgba(255,255,255,0.22)" stroke="rgba(255,255,255,0.8)" stroke-width="1"></path><path d="M10 4 a7 7 0 1 0 0.01 0 M15 15 l6 6" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" transform="translate(12 18)"></path></svg>
        <div style="flex: 1; min-width: 260px; display: flex; flex-direction: column; gap: 10px">
          <span style="font-size: 13px; font-weight: 800; color: #FFF2CC">به پا داشتن مردم · شناخت صحنه · لایهٔ چگونگی</span>
          <h1 style="margin: 0; font-size: 38px; font-weight: 900; line-height: 1.35">شناسنامهٔ مسئلهٔ محله</h1>
          <div style="display: flex; gap: 18px; flex-wrap: wrap; font-size: 14px; font-weight: 700"><span>۶ درس</span><span>۲ ساعت و ۱۰ دقیقه</span><span>۱ مأموریت میدانی</span><span>آزمون پایانی و گواهی</span></div>
        </div>
      </section>

      <section aria-labelledby="ls-h" style="{CARD}; border-radius: 28px; padding: 24px; display: flex; flex-direction: column; gap: 6px">
        <h2 id="ls-h" style="margin: 0 0 8px; font-size: 20px; font-weight: 900">درس‌ها</h2>
        <sc-for list="{{{{lessons}}}}" as="l" hint-placeholder-count="6">
          <a href="Lesson.dc.html" aria-current="{{{{l.cur}}}}" style="display: flex; align-items: center; gap: 16px; padding: 14px 16px; border-radius: 18px; background: {{{{l.bg}}}}; border: 1.5px solid {{{{l.border}}}}; text-decoration: none; color: #1B2150">
            <span style="width: 40px; height: 40px; border-radius: 50%; background: {{{{l.dot}}}}; color: {{{{l.dotFg}}}}; display: flex; align-items: center; justify-content: center; font-weight: 900; flex: none">{{{{l.n}}}}</span>
            <span style="flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0">
              <b style="font-size: 16px; font-weight: 800">{{{{l.t}}}}</b>
              <span style="display: flex; gap: 6px; flex-wrap: wrap">
                <sc-for list="{{{{l.parts}}}}" as="p" hint-placeholder-count="3"><span style="padding: 2px 10px; border-radius: 999px; background: {{{{p.bg}}}}; color: {{{{p.c}}}}; font-size: 12px; font-weight: 800">{{{{p.t}}}}</span></sc-for>
              </span>
            </span>
            <span style="font-size: 13px; font-weight: 800; color: {{{{l.sc}}}}">{{{{l.state}}}}</span>
          </a>
        </sc-for>
        <div style="display: flex; align-items: center; gap: 16px; padding: 16px; margin-top: 8px; border-radius: 18px; border: 1.5px dashed #C9CEDC">
          <svg width="40" height="50" viewBox="0 0 48 60" aria-hidden="true"><path d="{TOR}" fill="#EAEFFC"></path><path d="M16 32 l6 6 l10-12" fill="none" stroke="#1E3A9E" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path></svg>
          <span style="flex: 1; display: flex; flex-direction: column"><b style="font-size: 16px; font-weight: 800">آزمون پایانی و گواهی</b><span style="font-size: 13px; color: #6C7290">پس از درس ششم و تأیید مأموریت توسط راهیار باز می‌شود</span></span>
        </div>
      </section>
    </div>

    <aside style="display: flex; flex-direction: column; gap: 16px">
      <div style="{CARD}; border-radius: 28px; padding: 24px; display: flex; flex-direction: column; gap: 14px">
        <div style="display: flex; justify-content: space-between; font-size: 14px"><b style="font-weight: 900">پیشرفت شما</b><span style="color: #6C7290">۳ از ۶ درس</span></div>
        <div style="height: 10px; border-radius: 5px; background: #EEF0F5"><div style="width: 55%; height: 100%; border-radius: 5px; background: #F08C1A"></div></div>
        <a href="Lesson.dc.html" style="display: flex; align-items: center; justify-content: center; min-height: 52px; border-radius: 16px; background: #0E9F5A; color: #FFFFFF; font-weight: 800; font-size: 16px; text-decoration: none">ادامهٔ درس ۴</a>
        <a href="#" style="display: flex; align-items: center; justify-content: center; min-height: 44px; border-radius: 14px; border: 1.5px solid #E4E7EF; color: #1B2150; font-weight: 800; text-decoration: none">مرور کارت‌های یادآوری · ۸ کارت</a>
      </div>
      <div style="{CARD}; border-radius: 28px; padding: 24px; display: flex; flex-direction: column; gap: 12px">
        <b style="font-size: 16px; font-weight: 900">هم‌دوره‌ای‌ها</b>
        <span style="font-size: 14px; color: #3E4462; line-height: 1.8">۴۲ امام و شریکة‌الامام این دوره را با هم می‌خوانند. ایستگاه بعدی گروه: درس ۵، پنجشنبه.</span>
        <a href="Messages.dc.html" style="font-size: 14px; font-weight: 800">گفت‌وگوی گروه</a>
      </div>
      <div style="background: #FFF6DA; border-radius: 28px; padding: 22px; display: flex; flex-direction: column; gap: 8px">
        <b style="font-size: 15px; font-weight: 900">ابزارهای این دوره</b>
        <div style="display: flex; gap: 8px; flex-wrap: wrap"><a href="Tools.dc.html" style="padding: 6px 12px; border-radius: 999px; background: #FFFFFF; font-size: 13px; font-weight: 800; text-decoration: none">پنج چرا</a><a href="Tools.dc.html" style="padding: 6px 12px; border-radius: 999px; background: #FFFFFF; font-size: 13px; font-weight: 800; text-decoration: none">درخت مسئله</a><a href="Tools.dc.html" style="padding: 6px 12px; border-radius: 999px; background: #FFFFFF; font-size: 13px; font-weight: 800; text-decoration: none">نقشهٔ ذی‌نفعان</a></div>
      </div>
    </aside>
  </main>
</div>'''
script='''const PT = {
  v: ['ویدیو', '#EAEFFC', '#1E3A9E'], a: ['پادکست', '#E1F3F6', '#1D7F92'], t: ['متن', '#F4F5F9', '#3E4462'], q: ['آزمونک', '#E2F5EA', '#0A7A45'],
  w: ['کاربرگ', '#FFF2CC', '#8A5A00'], m: ['مأموریت میدانی', '#FDEBC4', '#8A5A00'], o: ['ابزار', '#D3EFEA', '#0B5F52'], l: ['کلاس زنده', '#FBE6EB', '#A8314F'], p: ['تمرین', '#EAEFFC', '#1E3A9E'],
};
const L = [
  ['چرا شناسنامه؟', 'vtq', 2], ['تصویر درست از محله', 'vaw', 2], ['نقاط امید و ظرفیت‌ها', 'tpo', 2],
  ['ریشه‌یابی با «پنج چرا»', 'vaqo', 1], ['از ریشه تا وضع مطلوب', 'vlw', 0], ['مأموریت: گفت‌وگو با سه خانواده', 'mw', 0],
];
const fa = (n) => n.toLocaleString('fa-IR');
class Component extends DCLogic {
  renderVals() {
    const lessons = L.map(([t, ps, st], i) => ({
      n: st === 2 ? '✓' : fa(i + 1), t, cur: st === 1 ? 'step' : 'false',
      parts: ps.split('').map((k) => ({ t: PT[k][0], bg: PT[k][1], c: PT[k][2] })),
      bg: st === 1 ? '#FFF6DA' : '#FFFFFF', border: st === 1 ? '#F5B700' : 'transparent',
      dot: st === 2 ? '#0E9F5A' : st === 1 ? '#F5B700' : '#EEF0F5', dotFg: st === 2 ? '#FFFFFF' : st === 1 ? '#3B2B00' : '#6C7290',
      state: st === 2 ? 'تمام شد' : st === 1 ? 'در حال خواندن' : '', sc: st === 2 ? '#0A7A45' : '#8A5A00',
    }));
    return { lessons };
  }
}'''
open('/home/claude/dz/project/Course.dc.html','w').write(page('صفحهٔ دوره', body, script, 1440, 1100))

# Lesson
body=f'''<div style="{ROOT}; background: #FBFAF6">
  <header style="background: #FFFFFF; border-bottom: 1px solid #E4E7EF">
    <div style="max-width: 1100px; margin: 0 auto; padding: 12px 24px; display: flex; align-items: center; gap: 16px">
      <a href="Course.dc.html" style="display: inline-flex; align-items: center; gap: 6px; min-height: 44px; font-weight: 800; text-decoration: none"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6 l6 6 l-6 6"></path></svg>شناسنامهٔ مسئلهٔ محله</a>
      <div style="flex: 1; display: flex; gap: 4px" aria-label="بخش ۲ از ۵ این درس">
        <sc-for list="{{{{segs}}}}" as="s" hint-placeholder-count="5"><span style="flex: 1; height: 6px; border-radius: 3px; background: {{{{s.c}}}}"></span></sc-for>
      </div>
      <button type="button" style="min-height: 40px; padding: 0 14px; border-radius: 12px; border: 1.5px solid #E4E7EF; background: #FFFFFF; font: inherit; font-size: 13px; font-weight: 800; line-height: 1.4; color: #1B2150; cursor: pointer">حالت تمرکز</button>
    </div>
  </header>
  <main style="max-width: 760px; margin: 0 auto; padding: 32px 24px 64px; display: flex; flex-direction: column; gap: 24px">
    <div><span style="font-size: 13px; font-weight: 800; color: #B07800">درس ۴ از ۶</span><h1 style="margin: 4px 0 0; font-size: 34px; font-weight: 900; line-height: 1.4">ریشه‌یابی با «پنج چرا»</h1></div>

    <div class="vid" role="img" aria-label="ویدیوی درس" style="position: relative; aspect-ratio: 16 / 9; border-radius: 24px; overflow: hidden">
      <div style="position: absolute; inset: 0; background: rgba(15,21,56,0.35); display: flex; align-items: center; justify-content: center">
        <button type="button" aria-label="پخش ویدیو، ۶ دقیقه" style="width: 76px; height: 76px; border-radius: 50%; border: 0; background: #FFFFFF; color: #1E3A9E; display: flex; align-items: center; justify-content: center; cursor: pointer"><svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"></path></svg></button>
      </div>
      <div style="position: absolute; bottom: 14px; right: 16px; left: 16px; display: flex; gap: 8px; justify-content: space-between; color: #FFFFFF; font-size: 13px; font-weight: 800"><span>۶:۱۲</span><span>زیرنویس · سرعت ۱٫۲۵ · فقط صدا</span></div>
    </div>

    <div style="font-size: 18px; line-height: 2.1; color: #1B2150">
      <p style="margin: 0 0 14px">مسئلهٔ «نوجوان‌ها جایی برای ماندن ندارند» خودش ریشه نیست؛ نشانه است. اگر فقط به نشانه جواب بدهیم، یک اتاق باز می‌کنیم و سه ماه بعد خالی می‌ماند.</p>
      <p style="margin: 0">«پنج چرا» یعنی از همان جملهٔ اول پنج بار بپرسیم «چرا؟» تا به جایی برسیم که اگر درستش کنیم، بقیه هم درست شود.</p>
    </div>

    <section aria-labelledby="q-h" style="background: #FFFFFF; border: 1.5px solid #E4E7EF; border-radius: 24px; padding: 24px; display: flex; flex-direction: column; gap: 12px">
      <span style="font-size: 12px; font-weight: 800; color: #0A7A45">بررسی کوتاه</span>
      <h2 id="q-h" style="margin: 0; font-size: 19px; font-weight: 900; line-height: 1.7">کدام جمله «ریشه» است، نه نشانه؟</h2>
      <sc-for list="{{{{opts}}}}" as="o" hint-placeholder-count="3">
        <button type="button" onClick="{{{{o.pick}}}}" aria-pressed="{{{{o.on}}}}" style="text-align: right; min-height: 52px; padding: 12px 16px; border-radius: 16px; border: 1.5px solid {{{{o.border}}}}; background: {{{{o.bg}}}}; font: inherit; font-size: 15px; font-weight: 700; line-height: 1.7; color: #1B2150; cursor: pointer">{{{{o.t}}}}</button>
      </sc-for>
      <sc-if value="{{{{fb.show}}}}" hint-placeholder-height="60px"><div role="status" style="padding: 14px 16px; border-radius: 16px; background: {{{{fb.bg}}}}; color: {{{{fb.c}}}}; font-size: 15px; line-height: 1.8; font-weight: 700">{{{{fb.t}}}}</div></sc-if>
    </section>

    <section style="background: #FFF6DA; border-radius: 24px; padding: 22px; display: flex; gap: 16px; align-items: center; flex-wrap: wrap">
      <svg width="40" height="50" viewBox="0 0 48 60" aria-hidden="true"><path d="{TOR}" fill="#F5B700"></path></svg>
      <div style="flex: 1; min-width: 220px"><b style="font-size: 16px; font-weight: 900">تمرین روی تختهٔ تیم</b><div style="font-size: 14px; color: #3E4462">پنج چرای مسئلهٔ خودتان را با تیم مسجد بنویسید.</div></div>
      <a href="Tools.dc.html" style="display: inline-flex; align-items: center; min-height: 44px; padding: 0 18px; border-radius: 12px; background: #1B2150; color: #FFFFFF; font-weight: 800; text-decoration: none">باز کردن ابزار پنج چرا</a>
    </section>

    <div style="display: flex; justify-content: space-between; gap: 12px; padding-top: 8px">
      <a href="Course.dc.html" style="display: inline-flex; align-items: center; min-height: 52px; padding: 0 22px; border-radius: 16px; border: 1.5px solid #E4E7EF; color: #1B2150; font-weight: 800; text-decoration: none">بخش قبل</a>
      <a href="#" style="display: inline-flex; align-items: center; min-height: 52px; padding: 0 28px; border-radius: 16px; background: #0E9F5A; color: #FFFFFF; font-weight: 800; text-decoration: none">بخش بعد: پادکست ۸ دقیقه</a>
    </div>
  </main>
</div>'''
css='.vid{background-image:url(/_blob/702a4dfcbc9ca7da3287d181fdf527c9);background-size:cover;background-position:50% 45%}'
script='''const O = ['نوجوان‌ها شب‌ها در کوچه می‌مانند', 'هیچ بزرگ‌تری در محله برایشان وقت نمی‌گذارد', 'مسجد اتاق خالی ندارد'];
class Component extends DCLogic {
  renderVals() {
    const a = this.state ? this.state.a : undefined;
    const segs = [0, 1, 2, 3, 4].map((i) => ({ c: i < 1 ? '#0E9F5A' : i === 1 ? '#F5B700' : '#E4E7EF' }));
    const opts = O.map((t, i) => {
      const on = a === i, right = i === 1;
      return { t, on: on ? 'true' : 'false', pick: () => this.setState({ a: i }),
        border: on ? (right ? '#0E9F5A' : '#D64A6A') : '#E4E7EF', bg: on ? (right ? '#E2F5EA' : '#FBE6EB') : '#FFFFFF' };
    });
    const fb = a === undefined ? { show: false } : a === 1
      ? { show: true, bg: '#E2F5EA', c: '#0A7A45', t: 'درست است. اگر یک بزرگ‌تر وقت بگذارد، کوچه و اتاق هم حل می‌شود.' }
      : { show: true, bg: '#FBE6EB', c: '#A8314F', t: 'این هنوز نشانه است؛ یک «چرا» دیگر بپرسید.' };
    return { segs, opts, fb };
  }
}'''
open('/home/claude/dz/project/Lesson.dc.html','w').write(page('صفحهٔ درس', body, script, 1440, 1500, css))
