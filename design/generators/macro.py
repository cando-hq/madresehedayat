import sys; sys.path.insert(0,'/home/claude/dz/gen')
from common import *
body=f'''<div style="{ROOT}">
  {nav('learn')}
  <main style="max-width: 1280px; margin: 0 auto; padding: 28px 32px 64px; display: flex; flex-direction: column; gap: 24px">
    <section style="background: #1E3A9E; color: #FFFFFF; border-radius: 32px; padding: 34px 40px; display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 28px; align-items: center">
      <div style="display: flex; flex-direction: column; gap: 12px">
        <div style="display: flex; gap: 8px; flex-wrap: wrap"><span style="padding: 4px 12px; border-radius: 999px; background: rgba(255,255,255,0.16); font-size: 13px; font-weight: 800">مسیر کلان · یک تا چند سال</span><span style="padding: 4px 12px; border-radius: 999px; background: #F5B700; color: #3B2B00; font-size: 13px; font-weight: 800">بنیاد هدایت</span></div>
        <h1 style="margin: 0; font-size: 38px; font-weight: 900; line-height: 1.35">تعیّن امامت</h1>
        <p style="margin: 0; color: #C9D3F5; line-height: 1.9">امامت تعیّنی است، نه تعیینی؛ با حکم آغاز می‌شود و در میدان ساخته می‌شود. چهار پله، ۲۴ شایستگی، همراهی راهیار و گعدهٔ امامان هم‌شهرستان.</p>
        <div style="display: flex; gap: 18px; flex-wrap: wrap; font-size: 14px"><span><b>۹۱۲</b> امام در مسیر</span><span>با <b>راهیار</b></span><span>همتایان: <b>گعده</b></span></div>
      </div>
      <img src="/_blob/dc31c516b7b1f4aa6178fd46d08cd210" alt="نمودار گلبرگی ۲۴ شایستگی" style="width: 100%; height: auto; border-radius: 24px; background: #FFFFFF">
    </section>

    <section aria-labelledby="st-h" style="display: flex; flex-direction: column; gap: 14px">
      <h2 id="st-h" style="margin: 0; font-size: 22px; font-weight: 900">پله‌ها</h2>
      <div role="tablist" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px">
        <sc-for list="{{{{stages}}}}" as="s" hint-placeholder-count="4">
          <button type="button" role="tab" onClick="{{{{s.pick}}}}" aria-selected="{{{{s.on}}}}" style="text-align: right; font: inherit; cursor: pointer; padding: 16px; border-radius: 20px; border: 2px solid {{{{s.border}}}}; background: {{{{s.bg}}}}; color: #1B2150; display: flex; flex-direction: column; gap: 4px; line-height: 1.6">
            <span style="font-size: 12px; font-weight: 800; color: {{{{s.ink}}}}">{{{{s.state}}}}</span><b style="font-size: 17px; font-weight: 900">پلهٔ {{{{s.n}}}}: {{{{s.t}}}}</b><span style="font-size: 12px; color: #6C7290">{{{{s.focus}}}}</span>
          </button>
        </sc-for>
      </div>
    </section>

    <section style="display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 22px; align-items: start">
      <div style="{CARD}; padding: 24px; display: flex; flex-direction: column; gap: 10px">
        <div style="display: flex; justify-content: space-between; align-items: center"><h2 style="margin: 0; font-size: 20px; font-weight: 900">در پلهٔ {{{{cur.t}}}}</h2><span style="font-size: 13px; color: #6C7290">{{{{cur.prog}}}}</span></div>
        <sc-for list="{{{{cur.blocks}}}}" as="b" hint-placeholder-count="4">
          <a href="{{{{b.href}}}}" style="display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 18px; background: {{{{b.rowbg}}}}; border: 1.5px solid {{{{b.rowborder}}}}; text-decoration: none; color: #1B2150">
            <span style="width: 36px; height: 36px; border-radius: 50%; background: {{{{b.dot}}}}; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-weight: 900; flex: none">{{{{b.mark}}}}</span>
            <span style="flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0"><span style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap"><span style="padding: 2px 10px; border-radius: 999px; background: {{{{b.kbg}}}}; color: {{{{b.kc}}}}; font-size: 12px; font-weight: 800">{{{{b.k}}}}</span><span style="font-size: 12px; color: #6C7290">{{{{b.by}}}}</span></span><b style="font-size: 16px; font-weight: 800">{{{{b.t}}}}</b><span style="font-size: 13px; color: #6C7290">{{{{b.meta}}}}</span></span>
            <span style="font-size: 13px; font-weight: 800; color: {{{{b.sc}}}}">{{{{b.st}}}}</span>
          </a>
        </sc-for>
        <div style="padding: 14px 16px; border-radius: 18px; border: 1.5px dashed #C9CEDC; font-size: 14px; color: #3E4462">رفتن به پلهٔ بعد: <b>ارزیابی میدانی راهیار</b> بعد از گذراندن محتوای پله. گذراندن دوره‌ها به تنهایی پله را بالا نمی‌برد.</div>
      </div>
      <aside style="display: flex; flex-direction: column; gap: 16px">
        <div style="{CARD}; padding: 22px; display: flex; flex-direction: column; gap: 10px"><b style="font-size: 16px; font-weight: 900">همراه شما در این مسیر</b><div style="display: flex; align-items: center; gap: 12px"><span style="width: 44px; height: 44px; border-radius: 50%; background: #E1F3F6; color: #1D7F92; display: flex; align-items: center; justify-content: center; font-weight: 900">م</span><span style="display: flex; flex-direction: column"><b style="font-size: 15px">حجت‌الاسلام محمدی</b><span style="font-size: 12px; color: #6C7290">راهیار شهرستان بهشهر</span></span></div><span style="font-size: 13px; color: #3E4462">ارزیابی میدانی بعدی: ۱۸ آذر</span></div>
        <div style="{CARD}; padding: 22px; display: flex; flex-direction: column; gap: 8px"><b style="font-size: 16px; font-weight: 900">گعدهٔ این مسیر</b><span style="font-size: 14px; color: #3E4462">گعدهٔ امامان محلهٔ بهشهر · ۴ عضو</span><span style="font-size: 13px; color: #6C7290">جلسهٔ بعد: پنجشنبه، مسجد امام رضا(ع)</span></div>
        <div style="background: #FFF6DA; border-radius: 24px; padding: 20px; display: flex; flex-direction: column; gap: 6px"><b style="font-size: 15px; font-weight: 900">می‌شود تکه‌تکه هم رفت</b><span style="font-size: 13px; color: #3E4462; line-height: 1.8">هر مسیر خرد یا دورهٔ این پله را می‌شود جدا هم برداشت. اگر بعداً وارد این مسیر شوید، آنچه گذرانده‌اید حساب می‌شود.</span></div>
      </aside>
    </section>
  </main>
</div>'''
script='''const ST = [['۱', 'امام جماعت', 'تمرکز بر اقامهٔ نماز'], ['۲', 'امام مسجد', 'تمرکز بر مسجد'], ['۳', 'امام محله', 'تمرکز بر محله'], ['۴', 'امام میانی', 'نقش الگویی و تمدنی']];
const KC = { 'دوره': ['#FFF2CC', '#8A5A00'], 'مسیر خرد': ['#D3EFEA', '#0B5F52'], 'مسیر میانه': ['#FDEBC4', '#8A5A00'], 'پخش زنده': ['#FBE6EB', '#A8314F'], 'ارزیابی': ['#EAEFFC', '#1E3A9E'] };
const BL = {
  0: [['دوره', 'مهارت‌های ارتباطی و جذب مردم', 'بنیاد هدایت', '۸ بخش · تکلیف سی‌روزه', 2], ['مسیر خرد', 'دفتر نام در یک ماه', 'بنیاد هدایت', '۴ هفته', 2], ['ارزیابی', 'دیدار میدانی راهیار', '', 'ثبت شد: سطح ۱', 2]],
  1: [['دوره', 'مدیریت مسجد؛ منشور همکاری', 'بنیاد هدایت', '۸ بخش', 2], ['مسیر خرد', 'جذب نوجوان در یک ماه', 'بنیاد هدایت', '۴ هفته · با گعده', 2], ['پخش زنده', 'اخلاق امامت محله', 'بنیاد هدایت', 'هر سه‌شنبه ساعت ۲۱', 2], ['ارزیابی', 'دیدار میدانی راهیار', '', 'ثبت شد: سطح ۲', 2]],
  2: [['مسیر میانه', 'حل مسئلهٔ محله', 'بنیاد هدایت', '۳ دوره · یک فصل', 1], ['دوره', 'تیم‌سازی و کادرسازی', 'بنیاد هدایت', '۸ بخش', 0], ['دوره', 'کار با نوجوان در فضای مجازی', 'مؤسسهٔ برکت', '۵ بخش · اختیاری', 0], ['ارزیابی', 'دیدار میدانی راهیار', '', '۱۸ آذر', 0]],
  3: [['دوره', 'نفر سوم؛ حلقهٔ میانی', 'بنیاد هدایت', '۳ بخش', 0], ['مسیر میانه', 'جهاد تبیین و روایت', 'بنیاد هدایت', '۴ دوره', 0], ['ارزیابی', 'دیدار میدانی راهیار', '', '', 0]],
};
const CUR = 2;
class Component extends DCLogic {
  renderVals() {
    const sel = this.state && this.state.s != null ? this.state.s : CUR;
    const stages = ST.map(([n, t, focus], i) => ({ n, t, focus, on: i === sel ? 'true' : 'false', state: i < CUR ? 'گذرانده' : i === CUR ? 'اکنون اینجایید' : 'قدم بعد', ink: i < CUR ? '#0A7A45' : i === CUR ? '#B07800' : '#6C7290', border: i === sel ? '#1B2150' : i === CUR ? '#F5B700' : '#E4E7EF', bg: i === CUR ? '#FFF6DA' : '#FFFFFF', pick: () => this.setState({ s: i }) }));
    const blocks = BL[sel].map(([k, t, by, meta, st], i) => ({ k, t, by: by ? 'از ' + by : '', meta, kbg: KC[k][0], kc: KC[k][1], href: k === 'دوره' ? 'Course.dc.html' : k === 'پخش زنده' ? 'Live.dc.html' : '#',
      mark: st === 2 ? '✓' : (i + 1).toLocaleString('fa-IR'), dot: st === 2 ? '#0E9F5A' : st === 1 ? '#F5B700' : '#C9CEDC', st: st === 2 ? 'تمام شد' : st === 1 ? 'در حال گذراندن' : '', sc: st === 2 ? '#0A7A45' : '#8A5A00', rowbg: st === 1 ? '#FFF6DA' : '#F4F5F9', rowborder: st === 1 ? '#F5B700' : 'transparent' }));
    const done = BL[sel].filter((b) => b[4] === 2).length;
    return { stages, cur: { t: ST[sel][1], blocks, prog: done.toLocaleString('fa-IR') + ' از ' + BL[sel].length.toLocaleString('fa-IR') + ' تمام شد' } };
  }
}'''
open('/home/claude/dz/project/PathMacro.dc.html','w').write(page('مسیر کلان: تعیّن امامت', body, script, 1440, 1150))

# ---------- Explore (learning hub)
body=f'''<div style="{ROOT}">
  {nav('learn')}
  <main style="max-width: 1280px; margin: 0 auto; padding: 28px 32px 64px; display: flex; flex-direction: column; gap: 22px">
    <section style="display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap">
      <div><h1 style="margin: 0; font-size: 34px; font-weight: 900">کاوش</h1><p style="margin: 4px 0 0; color: #6C7290">همهٔ مسیرها، دوره‌ها و پخش‌های زندهٔ برگزارکنندگان؛ کنار مسیر اصلی‌ات هر کدام را جدا بردار.</p></div>
      <label style="display: flex; align-items: center; gap: 10px; background: #FFFFFF; border: 1.5px solid #E4E7EF; border-radius: 16px; padding: 0 16px; min-height: 52px; width: 400px"><span style="position: absolute; width: 1px; height: 1px; overflow: hidden">جست‌وجو</span><input placeholder="جست‌وجو؛ مثلاً نوجوان، حل مسئله، روایت" style="flex: 1; border: 0; outline: none; font: inherit; font-size: 15px; background: transparent"></label>
    </section>
    <div role="tablist" style="display: flex; gap: 4px; background: #FFFFFF; border: 1px solid #E4E7EF; border-radius: 16px; padding: 4px; align-self: flex-start"><a role="tab" aria-selected="false" href="MyPaths.dc.html" style="padding: 10px 20px; border-radius: 12px; color: #3E4462; font-weight: 800; text-decoration: none">مسیرهای من</a><a role="tab" aria-selected="false" href="PathMacro.dc.html" style="padding: 10px 20px; border-radius: 12px; color: #3E4462; font-weight: 800; text-decoration: none">مسیر اصلی من</a><a role="tab" aria-selected="true" href="Explore.dc.html" style="padding: 10px 20px; border-radius: 12px; background: #EAEFFC; color: #1E3A9E; font-weight: 800; text-decoration: none">کاوش</a></div>
    <div style="display: flex; flex-direction: column; gap: 10px">
      <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center"><span style="width: 76px; font-size: 13px; font-weight: 800; color: #6C7290">برای کی</span>
        <sc-for list="{{{{who}}}}" as="w" hint-placeholder-count="5"><button type="button" onClick="{{{{w.pick}}}}" aria-pressed="{{{{w.on}}}}" style="min-height: 38px; padding: 0 14px; border-radius: 999px; border: 1.5px solid {{{{w.border}}}}; background: {{{{w.bg}}}}; color: {{{{w.fg}}}}; font: inherit; font-size: 13px; font-weight: 800; cursor: pointer">{{{{w.t}}}}</button></sc-for></div>
      <div role="group" aria-label="نوع" style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center"><span style="width: 76px; font-size: 13px; font-weight: 800; color: #6C7290">نوع</span>
        <sc-for list="{{{{kinds}}}}" as="f" hint-placeholder-count="6"><button type="button" onClick="{{{{f.pick}}}}" aria-pressed="{{{{f.on}}}}" style="min-height: 42px; padding: 0 16px; border-radius: 999px; border: 1.5px solid {{{{f.border}}}}; background: {{{{f.bg}}}}; color: {{{{f.fg}}}}; font: inherit; font-size: 14px; font-weight: 800; line-height: 1.4; cursor: pointer">{{{{f.t}}}}</button></sc-for></div>
      <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center"><span style="width: 76px; font-size: 13px; font-weight: 800; color: #6C7290">برگزارکننده</span>
        <sc-for list="{{{{pubs}}}}" as="p" hint-placeholder-count="5"><span style="display: inline-flex; align-items: center; gap: 6px; min-height: 38px; padding: 0 14px; border-radius: 999px; border: 1.5px solid #E4E7EF; background: #FFFFFF; font-size: 13px; font-weight: 800"><span style="width: 10px; height: 10px; border-radius: 50%; background: {{{{p.c}}}}"></span>{{{{p.t}}}}</span></sc-for></div>
    </div>
    <section style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px">
      <sc-for list="{{{{items}}}}" as="x" hint-placeholder-count="9">
        <a href="{{{{x.href}}}}" style="{CARD}; overflow: hidden; text-decoration: none; color: #1B2150; display: flex; flex-direction: column">
          <span style="height: 108px; background: {{{{x.c}}}}; display: flex; align-items: center; justify-content: space-between; padding: 0 18px">
            <svg width="48" height="60" viewBox="0 0 48 60" aria-hidden="true"><path d="{TOR}" fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.85)" stroke-width="1.2"></path></svg>
            <span style="padding: 4px 12px; border-radius: 999px; background: rgba(255,255,255,0.92); color: {{{{x.ink}}}}; font-size: 12px; font-weight: 800">{{{{x.kind}}}}</span>
          </span>
          <span style="padding: 16px 18px 18px; display: flex; flex-direction: column; gap: 6px">
            <span style="font-size: 12px; font-weight: 800; color: #6C7290">{{{{x.by}}}}</span>
            <b style="font-size: 17px; font-weight: 900; line-height: 1.55">{{{{x.t}}}}</b>
            <span style="font-size: 13px; color: #3E4462">{{{{x.meta}}}}</span>
          </span>
        </a>
      </sc-for>
    </section>
  </main>
</div>'''
script='''const PUB = { 'بنیاد هدایت': '#1E3A9E', 'مؤسسهٔ برکت': '#0E9F5A', 'مجمع بانوان مسجدی': '#D64A6A', 'شبکهٔ مساجد شهر': '#F08C1A', 'کانون نوجوانان مسجد': '#1BA3C6' };
const KS = { macro: ['مسیر کلان', '#1E3A9E', '#1E3A9E'], mid: ['مسیر میانه', '#F08C1A', '#8A5A00'], micro: ['مسیر خرد', '#12A58E', '#0B5F52'], course: ['دوره', '#E0A300', '#8A5A00'], live: ['پخش زنده', '#D64A6A', '#A8314F'] };
const IT = [
  ['macro', 'تعیّن امامت', 'بنیاد هدایت', 'مسیر اصلی امام، ۴ پله، با راهیار', 'PathMacro.dc.html', ['imam']],
  ['macro', 'شریکة‌الامام', 'بنیاد هدایت', 'مسیر اصلی همسر امام، ۳ پله، با راهیار', '#', ['sharik']],
  ['macro', 'از عضو تا مربی هسته', 'کانون نوجوانان مسجد', 'مسیر اصلی بازو و هسته، ۳ پله', 'PathBuilder.dc.html', ['bazu', 'haste']],
  ['mid', 'حل مسئلهٔ محله', 'بنیاد هدایت', '۳ دوره، یک فصل، گواهی', '#', ['imam', 'bazu']],
  ['micro', 'جذب نوجوان در یک ماه', 'بنیاد هدایت', '۴ هفته، هفته‌ای ۲ ساعت', 'PathMicro.dc.html', ['imam', 'bazu', 'haste']],
  ['micro', 'حلقهٔ خانگی بانوان', 'مجمع بانوان مسجدی', '۳ هفته، با هسته بخوانید', '#', ['sharik']],
  ['course', 'مهارت‌های ارتباطی و جذب مردم', 'بنیاد هدایت', '۸ بخش، تکلیف سی‌روزه', 'Course.dc.html', ['imam', 'sharik', 'bazu', 'haste']],
  ['course', 'کار با نوجوان در فضای مجازی', 'مؤسسهٔ برکت', '۵ بخش، ویدیو و کاربرگ', 'Course.dc.html', ['bazu', 'haste']],
  ['live', 'مهمانی محله؛ تجربهٔ ۴۵۰۰ محله', 'شبکهٔ مساجد شهر', 'سه‌شنبه ساعت ۲۰:۳۰', 'Live.dc.html', ['imam', 'sharik', 'bazu', 'haste']],
  ['live', 'اخلاق امامت محله، جلسهٔ ۶', 'بنیاد هدایت', 'هر سه‌شنبه ساعت ۲۱', 'Live.dc.html', ['imam']],
];
const WHO = [['all', 'همه'], ['imam', 'امام'], ['sharik', 'شریکة‌الامام'], ['bazu', 'بازو'], ['haste', 'عضو هسته']];
class Component extends DCLogic {
  renderVals() {
    const sel = (this.state && this.state.k) || 'all'; const wsel = (this.state && this.state.w) || 'all';
    const who = WHO.map(([id, t]) => ({ t, on: id === wsel ? 'true' : 'false', bg: id === wsel ? '#EAEFFC' : '#FFFFFF', fg: id === wsel ? '#1E3A9E' : '#3E4462', border: id === wsel ? '#1E3A9E' : '#E4E7EF', pick: () => this.setState({ w: id }) }));
    const kinds = [['all', 'همه'], ['macro', 'مسیر کلان'], ['mid', 'مسیر میانه'], ['micro', 'مسیر خرد'], ['course', 'دوره'], ['live', 'پخش زنده']].map(([id, t]) => ({ t, on: id === sel ? 'true' : 'false', bg: id === sel ? '#1B2150' : '#FFFFFF', fg: id === sel ? '#FFFFFF' : '#1B2150', border: id === sel ? '#1B2150' : '#E4E7EF', pick: () => this.setState({ k: id }) }));
    const pubs = Object.entries(PUB).map(([t, c]) => ({ t, c }));
    const items = IT.filter((x) => (sel === 'all' || x[0] === sel) && (wsel === 'all' || x[5].includes(wsel))).map(([k, t, by, meta, href]) => ({ kind: KS[k][0], c: KS[k][1], ink: KS[k][2], t, by, meta, href }));
    return { kinds, pubs, items, who };
  }
}'''
open('/home/claude/dz/project/Explore.dc.html','w').write(page('کاوش: همهٔ مسیرها و دوره‌ها', body, script, 1440, 1200))

import json
P='/home/claude/dz/project/'
import sys; sys.exit(0)
c=json.load(open(P+'canvas.json'))
c['boards']['Explore.dc.html']=dict(x=0,y=-3700,w=1440,h=1150,title='یادگیری: مسیر، دوره، پخش زنده',expand='fill',is_interactive=True)
c['boards']['PathMacro.dc.html']=dict(x=1520,y=-3700,w=1440,h=1150,title='صفحهٔ مسیر کلان',expand='fill',is_interactive=True)
c['boards']['Publisher.dc.html']=dict(x=3040,y=-3700,w=1440,h=1100,title='پیشخوان برگزارکننده',expand='fill',is_interactive=True)
c['boards']['PathBuilder.dc.html']=dict(x=4560,y=-3700,w=1440,h=1100,title='مسیرساز',expand='fill',is_interactive=True)
c['notes']['t7']=dict(x=0,y=-4000,text='منطق مسیر: برگزارکنندگان مسیر، دوره یا پخش زنده منتشر می‌کنند',kind='title1',maxW=6000)
new=['Explore.dc.html','PathMacro.dc.html','Publisher.dc.html','PathBuilder.dc.html']
c['order']=new+[o for o in c['order'] if o not in new]
json.dump(c,open(P+'canvas.json','w'),ensure_ascii=False)
