import sys; sys.path.insert(0,'/home/claude/dz/gen')
from common import *
SIDE = lambda cur: f'''<aside style="width: 248px; flex: none; background: #1B2150; color: #FFFFFF; padding: 22px 14px; display: flex; flex-direction: column; gap: 4px; box-sizing: border-box">
    <img src="/_blob/b522f6290bfc782976410c6c8494344e" alt="مدرسهٔ هدایت" style="width: 150px; max-width: 100%; height: auto; align-self: flex-start; margin: 0 8px 10px">
    <div style="display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 14px; background: rgba(255,255,255,0.08); margin-bottom: 10px">
      <span style="width: 38px; height: 38px; border-radius: 12px; background: #F5B700; color: #1B2150; font-weight: 900; display: flex; align-items: center; justify-content: center">ب</span>
      <span style="display: flex; flex-direction: column"><b style="font-size: 14px">کانون نوجوانان مسجد</b><span style="font-size: 12px; color: #C9D3F5">برگزارکنندهٔ تأییدشده</span></span>
    </div>
    <nav aria-label="منوی برگزارکننده" style="display: flex; flex-direction: column; gap: 2px">
      {''.join(f'<a href="{h}" {"aria-current=\"page\" " if k==cur else ""}style="display: flex; align-items: center; gap: 10px; min-height: 42px; padding: 0 12px; border-radius: 12px; background: {"rgba(255,255,255,0.14)" if k==cur else "transparent"}; color: #FFFFFF; font-size: 14px; font-weight: {800 if k==cur else 500}; text-decoration: none"><span style="width: 8px; height: 8px; border-radius: 50%; background: {c}"></span>{t}</a>' for k,t,c,h in [('dash','پیشخوان','#F5B700','Publisher.dc.html'),('paths','مسیرها','#F08C1A','PathBuilder.dc.html'),('courses','دوره‌ها','#D64A6A','#'),('live','پخش‌های زنده','#1BA3C6','#'),('lib','کتابخانهٔ مشترک','#12A58E','#'),('mentors','همراهان و مربیان','#8C93B5','#'),('impact','گزارش اثر','#8C93B5','#')])}
    </nav>
  </aside>'''

# ---------- Publisher dashboard
body=f'''<div style="{ROOT}; display: flex">
  {SIDE('dash')}
  <main style="flex: 1; padding: 28px 32px 48px; display: flex; flex-direction: column; gap: 22px; min-width: 0">
    <div style="display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap">
      <div><h1 style="margin: 0; font-size: 30px; font-weight: 900">پیشخوان برگزارکننده</h1><p style="margin: 4px 0 0; color: #6C7290">هر چه منتشر می‌کنید، پیش از انتشار یک بار بازبینی می‌شود.</p></div>
    </div>
    <section aria-labelledby="new-h" style="{CARD}; padding: 24px; display: flex; flex-direction: column; gap: 16px">
      <h2 id="new-h" style="margin: 0; font-size: 20px; font-weight: 900">انتشار تازه؛ چه می‌خواهید برگزار کنید؟</h2>
      <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px">
        <sc-for list="{{{{kinds}}}}" as="k" hint-placeholder-count="3">
          <button type="button" onClick="{{{{k.pick}}}}" aria-pressed="{{{{k.on}}}}" style="text-align: right; font: inherit; color: #1B2150; cursor: pointer; border-radius: 22px; padding: 20px; border: 2px solid {{{{k.border}}}}; background: {{{{k.bg}}}}; display: flex; flex-direction: column; gap: 10px; line-height: 1.7">
            <svg width="40" height="50" viewBox="0 0 48 60" aria-hidden="true"><path d="{TOR}" fill="{{{{k.c}}}}"></path><path d="{{{{k.i}}}}" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" transform="translate(12 18)"></path></svg>
            <b style="font-size: 18px; font-weight: 900">{{{{k.t}}}}</b>
            <span style="font-size: 14px; color: #3E4462">{{{{k.d}}}}</span>
            <span style="font-size: 12px; color: #6C7290">{{{{k.time}}}}</span>
          </button>
        </sc-for>
      </div>
      <div style="display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 16px; background: #F4F5F9; flex-wrap: wrap">
        <span style="flex: 1; min-width: 240px; font-size: 14px; color: #3E4462">{{{{hint}}}}</span>
        <a href="{{{{href}}}}" style="display: inline-flex; align-items: center; min-height: 46px; padding: 0 22px; border-radius: 14px; background: #0E9F5A; color: #FFFFFF; font-weight: 800; text-decoration: none">{{{{cta}}}}</a>
      </div>
    </section>
    <section style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px">
      <sc-for list="{{{{kpi}}}}" as="x" hint-placeholder-count="4">
        <div style="{CARD}; border-radius: 22px; padding: 18px 20px; display: flex; flex-direction: column; gap: 2px"><span style="font-size: 13px; color: #6C7290">{{{{x.t}}}}</span><b style="font-size: 28px; font-weight: 900">{{{{x.v}}}}</b><span style="font-size: 12px; color: #0A7A45; font-weight: 800">{{{{x.d}}}}</span></div>
      </sc-for>
    </section>
    <section style="{CARD}; padding: 24px; display: flex; flex-direction: column; gap: 10px">
      <h2 style="margin: 0 0 6px; font-size: 20px; font-weight: 900">منتشرشده‌های شما</h2>
      <sc-for list="{{{{items}}}}" as="it" hint-placeholder-count="5">
        <div style="display: grid; grid-template-columns: 110px minmax(0, 2fr) 1fr 1fr 130px; gap: 12px; align-items: center; padding: 12px 14px; border-radius: 16px; background: #F4F5F9; font-size: 14px">
          <span style="justify-self: start; padding: 3px 10px; border-radius: 999px; background: {{{{it.kbg}}}}; color: {{{{it.kc}}}}; font-size: 12px; font-weight: 800">{{{{it.kind}}}}</span>
          <span style="display: flex; flex-direction: column; min-width: 0"><b style="font-weight: 800">{{{{it.t}}}}</b><span style="font-size: 12px; color: #6C7290">{{{{it.meta}}}}</span></span>
          <span>{{{{it.people}}}}</span>
          <span style="color: #0A7A45; font-weight: 800">{{{{it.impact}}}}</span>
          <span style="justify-self: start; padding: 3px 10px; border-radius: 999px; background: {{{{it.sbg}}}}; color: {{{{it.sc}}}}; font-size: 12px; font-weight: 800">{{{{it.st}}}}</span>
        </div>
      </sc-for>
    </section>
  </main>
</div>'''
script='''const K = {
  live: { t: 'یک پخش زنده', d: 'کلاس یا نشست زنده روی سرور مدرسه؛ با ثبت‌نام، حضور خودکار و ضبط.', time: 'ساختن: ۳ دقیقه', c: '#D64A6A', i: 'M2 12 a10 10 0 0 1 20 0 M6 12 a6 6 0 0 1 12 0 M12 12 v8', hint: 'پخش زنده می‌تواند تنها منتشر شود یا بعداً بخشی از یک دوره یا مسیر شود.', cta: 'ساختن پخش زنده', href: '#' },
  course: { t: 'یک دوره', d: 'چند بخش پشت‌سرهم (ویدیو، صوت، متن، تمرین) و یک تکلیف میدانی.', time: 'ساختن: یک تا چند روز', c: '#F08C1A', i: 'M4 4 h7 a2 2 0 0 1 2 2 v15 a2 2 0 0 0-2-2 h-7z M22 4 h-7 a2 2 0 0 0-2 2 v15 a2 2 0 0 1 2-2 h7z', hint: 'دوره را عمومی کنید تا برگزارکنندگان دیگر هم بتوانند با نام شما آن را در مسیرشان بیاورند.', cta: 'ساختن دوره', href: '#' },
  path: { t: 'یک مسیر', d: 'از یک مسیر خرد یک‌ماهه تا یک مسیر کلان چندساله با پله‌ها، همراه و گواهی.', time: 'از چند دقیقه تا چند روز', c: '#1E3A9E', i: 'M5 19 c4 0 4-14 8-14 s4 14 8 14 M5 19 h0.01', hint: 'مسیر را از دوره‌های خودتان یا کتابخانهٔ مشترک بسازید؛ مسیر می‌تواند مسیرهای کوچک‌تر را در خودش داشته باشد.', cta: 'رفتن به مسیرساز', href: 'PathBuilder.dc.html' },
};
const ITEMS = [
  ['مسیر کلان', 'تعیّن امامت', '۴ پله، ۲۴ شایستگی، ارزیابی میدانی راهیار', '۹۱۲ امام', '۱۴۸ گام تأییدشده در این فصل', 'منتشرشده'],
  ['مسیر میانه', 'حل مسئلهٔ محله', '۳ دوره، آزمون و گواهی، یک فصل', '۸۴۰ نفر', '۲۱۱ تکلیف تأییدشده', 'منتشرشده'],
  ['مسیر خرد', 'جذب نوجوان در یک ماه', '۲ دوره و یک گعده، ۴ هفته', '۳۱۰ نفر', '۹۶ نفر تمام کردند', 'منتشرشده'],
  ['دوره', 'مهارت‌های ارتباطی و جذب مردم', '۸ بخش، تکلیف سی‌روزه؛ در ۶ مسیر استفاده شده', '۱٬۲۴۰ نفر', '۴۰۲ تکلیف تأییدشده', 'منتشرشده'],
  ['پخش زنده', 'اخلاق امامت محله، جلسهٔ ۶', 'سه‌شنبه ساعت ۲۱', '۱۲۴ ثبت‌نام', '—', 'در بازبینی'],
];
const KC = { 'مسیر کلان': ['#EAEFFC', '#1E3A9E'], 'مسیر میانه': ['#FDEBC4', '#8A5A00'], 'مسیر خرد': ['#D3EFEA', '#0B5F52'], 'دوره': ['#FFF2CC', '#8A5A00'], 'پخش زنده': ['#FBE6EB', '#A8314F'] };
class Component extends DCLogic {
  renderVals() {
    const sel = (this.state && this.state.k) || 'path';
    const kinds = Object.entries(K).map(([id, v]) => ({ ...v, on: id === sel ? 'true' : 'false', border: id === sel ? '#1B2150' : '#E4E7EF', bg: id === sel ? '#FBFAF6' : '#FFFFFF', pick: () => this.setState({ k: id }) }));
    const kpi = [{ t: 'کنشگر در مسیرهای شما', v: '۲٬۴۸۰', d: '۱۲٪+ در این فصل' }, { t: 'گام رشد تأییدشده', v: '۴۵۵', d: 'سنجهٔ اصلی' }, { t: 'دورهٔ شما در مسیر دیگران', v: '۹', d: '۳ برگزارکنندهٔ دیگر' }, { t: 'گزارش منتظر همراه', v: '۳۷', d: 'میانگین پاسخ: ۲ روز' }];
    const items = ITEMS.map(([kind, t, meta, people, impact, st]) => ({ kind, t, meta, people, impact, st, kbg: KC[kind][0], kc: KC[kind][1], sbg: st === 'منتشرشده' ? '#E2F5EA' : '#E1F3F6', sc: st === 'منتشرشده' ? '#0A7A45' : '#1D7F92' }));
    return { kinds, hint: K[sel].hint, cta: K[sel].cta, href: K[sel].href, kpi, items };
  }
}'''
open('/home/claude/dz/project/Publisher.dc.html','w').write(page('پیشخوان برگزارکننده', body, script, 1440, 1100))

# ---------- Path builder
body=f'''<div style="{ROOT}; display: flex">
  {SIDE('paths')}
  <main style="flex: 1; padding: 28px 32px 48px; display: flex; flex-direction: column; gap: 20px; min-width: 0">
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap">
      <div><span style="font-size: 13px; font-weight: 800; color: #6C7290">مسیرساز، پیش‌نویس، کانون نوجوانان مسجد</span><h1 style="margin: 0; font-size: 28px; font-weight: 900">از عضو تا مربی هسته</h1></div>
      <div style="display: flex; gap: 8px"><a href="PathMacro.dc.html" style="display: inline-flex; align-items: center; min-height: 44px; padding: 0 18px; border-radius: 14px; border: 1.5px solid #E4E7EF; background: #FFFFFF; color: #1B2150; font-weight: 800; text-decoration: none">پیش‌نمایش</a><a href="#" style="display: inline-flex; align-items: center; min-height: 44px; padding: 0 18px; border-radius: 14px; background: #0E9F5A; color: #FFFFFF; font-weight: 800; text-decoration: none">فرستادن برای بازبینی</a></div>
    </div>
    <ol aria-label="گام‌های ساختن مسیر" style="list-style: none; margin: 0; padding: 0; display: flex; gap: 8px; flex-wrap: wrap">
      <sc-for list="{{{{steps}}}}" as="s" hint-placeholder-count="6">
        <li><button type="button" onClick="{{{{s.pick}}}}" aria-current="{{{{s.cur}}}}" style="display: inline-flex; align-items: center; gap: 8px; min-height: 42px; padding: 0 14px; border-radius: 999px; border: 1.5px solid {{{{s.border}}}}; background: {{{{s.bg}}}}; color: {{{{s.fg}}}}; font: inherit; font-size: 14px; font-weight: 800; line-height: 1.4; cursor: pointer"><span style="width: 22px; height: 22px; border-radius: 50%; background: {{{{s.dot}}}}; color: #FFFFFF; font-size: 12px; display: flex; align-items: center; justify-content: center">{{{{s.n}}}}</span>{{{{s.t}}}}</button></li>
      </sc-for>
    </ol>

    <sc-if value="{{{{show.size}}}}" hint-placeholder-height="300px">
      <section style="{CARD}; padding: 24px; display: flex; flex-direction: column; gap: 16px">
        <h2 style="margin: 0; font-size: 20px; font-weight: 900">اندازهٔ مسیر</h2>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px">
          <sc-for list="{{{{sizes}}}}" as="z" hint-placeholder-count="3">
            <button type="button" onClick="{{{{z.pick}}}}" aria-pressed="{{{{z.on}}}}" style="text-align: right; font: inherit; cursor: pointer; color: #1B2150; padding: 18px; border-radius: 20px; border: 2px solid {{{{z.border}}}}; background: #FFFFFF; display: flex; flex-direction: column; gap: 6px; line-height: 1.7"><b style="font-size: 17px; font-weight: 900">{{{{z.t}}}}</b><span style="font-size: 13px; color: #6C7290">{{{{z.d}}}}</span><span style="font-size: 13px; color: #3E4462">{{{{z.has}}}}</span></button>
          </sc-for>
        </div>
        <p style="margin: 0; font-size: 14px; color: #6C7290">با انتخاب اندازه، فقط گام‌های لازم باز می‌مانند. مسیر خرد پله و شایستگی ندارد.</p>
      </section>
    </sc-if>

    <sc-if value="{{{{show.stages}}}}" hint-placeholder-height="400px">
      <section style="display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 18px; align-items: start">
        <div style="{CARD}; padding: 24px; display: flex; flex-direction: column; gap: 12px">
          <div style="display: flex; justify-content: space-between; align-items: center"><h2 style="margin: 0; font-size: 20px; font-weight: 900">پله‌ها و محتوای هر پله</h2><button type="button" style="min-height: 38px; padding: 0 14px; border-radius: 12px; border: 1.5px solid #1E3A9E; background: #FFFFFF; color: #1E3A9E; font: inherit; font-size: 13px; font-weight: 800; line-height: 1.4; cursor: pointer">افزودن پله</button></div>
          <sc-for list="{{{{stages}}}}" as="g" hint-placeholder-count="4">
            <div style="border: 1.5px solid #E4E7EF; border-radius: 20px; padding: 16px; display: flex; flex-direction: column; gap: 10px">
              <div style="display: flex; align-items: center; gap: 10px"><span style="width: 32px; height: 32px; border-radius: 50%; background: {{{{g.c}}}}; color: #FFFFFF; font-weight: 900; display: flex; align-items: center; justify-content: center">{{{{g.n}}}}</span><b style="flex: 1; font-size: 16px; font-weight: 900">{{{{g.t}}}}</b><span style="font-size: 12px; color: #6C7290">{{{{g.rule}}}}</span></div>
              <div style="display: flex; flex-wrap: wrap; gap: 8px">
                <sc-for list="{{{{g.blocks}}}}" as="b" hint-placeholder-count="3"><span style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 12px; background: {{{{b.bg}}}}; color: {{{{b.c}}}}; font-size: 13px; font-weight: 800"><span style="font-size: 11px; opacity: 0.8">{{{{b.k}}}}</span>{{{{b.t}}}}</span></sc-for>
                <button type="button" style="padding: 6px 12px; border-radius: 12px; border: 1.5px dashed #C9CEDC; background: transparent; color: #6C7290; font: inherit; font-size: 13px; font-weight: 800; line-height: 1.4; cursor: pointer">+ دوره، مسیر یا پخش زنده</button>
              </div>
            </div>
          </sc-for>
        </div>
        <aside style="{CARD}; padding: 20px; display: flex; flex-direction: column; gap: 10px">
          <b style="font-size: 16px; font-weight: 900">از کتابخانهٔ مشترک</b>
          <label style="display: flex; align-items: center; gap: 8px; min-height: 44px; border: 1.5px solid #E4E7EF; border-radius: 12px; padding: 0 12px"><span style="position: absolute; width: 1px; height: 1px; overflow: hidden">جست‌وجو</span><input placeholder="دوره، مسیر خرد یا پخش زنده" style="flex: 1; border: 0; outline: none; font: inherit; font-size: 14px"></label>
          <sc-for list="{{{{lib}}}}" as="l" hint-placeholder-count="5">
            <div style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 14px; background: #F4F5F9"><span style="display: flex; flex-direction: column; flex: 1; min-width: 0"><b style="font-size: 14px; font-weight: 800">{{{{l.t}}}}</b><span style="font-size: 12px; color: #6C7290">{{{{l.k}}}} · {{{{l.by}}}}</span></span><button type="button" aria-label="افزودن" style="width: 34px; height: 34px; border-radius: 10px; border: 0; background: #1E3A9E; color: #FFFFFF; font: inherit; font-size: 18px; cursor: pointer">+</button></div>
          </sc-for>
          <span style="font-size: 12px; color: #6C7290">دوره‌های دیگران با نام سازنده‌شان در مسیر شما نشان داده می‌شوند.</span>
        </aside>
      </section>
    </sc-if>

    <sc-if value="{{{{show.model}}}}" hint-placeholder-height="300px">
      <section style="display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 18px">
        <div style="{CARD}; padding: 24px; display: flex; flex-direction: column; gap: 12px"><h2 style="margin: 0; font-size: 20px; font-weight: 900">نقشهٔ شایستگی (اختیاری)</h2><p style="margin: 0; font-size: 14px; color: #6C7290">شایستگی‌ها را در چند عرصه بچینید؛ کارنامهٔ کنشگر آن را به شکل نمودار گلبرگی نشان می‌دهد.</p>
          <sc-for list="{{{{sectors}}}}" as="x" hint-placeholder-count="4"><div style="display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 14px; background: #F4F5F9"><span style="width: 14px; height: 14px; border-radius: 4px; background: {{{{x.c}}}}"></span><b style="flex: 1; font-size: 14px">{{{{x.t}}}}</b><span style="font-size: 13px; color: #6C7290">{{{{x.n}}}} شایستگی</span></div></sc-for>
        </div>
        <div style="{CARD}; padding: 24px; display: flex; flex-direction: column; gap: 12px"><h2 style="margin: 0; font-size: 20px; font-weight: 900">رفتن به پلهٔ بعد با</h2>
          <sc-for list="{{{{rules}}}}" as="r" hint-placeholder-count="4"><label style="display: flex; align-items: center; gap: 10px; min-height: 48px; padding: 0 14px; border-radius: 14px; border: 1.5px solid {{{{r.border}}}}; font-size: 14px; font-weight: 700"><input type="checkbox" checked="{{{{r.on}}}}" style="width: 20px; height: 20px; accent-color: #0E9F5A">{{{{r.t}}}}</label></sc-for>
          <span style="font-size: 12px; color: #6C7290">قاعدهٔ این مسیر را کانون تعیین کرده؛ هر برگزارکننده قاعدهٔ خودش را دارد.</span>
        </div>
      </section>
    </sc-if>

    <sc-if value="{{{{show.people}}}}" hint-placeholder-height="260px">
      <section style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px">
        <div style="{CARD}; padding: 22px; display: flex; flex-direction: column; gap: 8px"><b style="font-size: 16px; font-weight: 900">مخاطب</b><span style="font-size: 14px; color: #3E4462">امام جماعت و امام مسجد</span><span style="font-size: 12px; color: #6C7290">هر کنشگری می‌تواند مسیر را ببیند؛ ثبت‌نام فقط برای مخاطب است.</span></div>
        <div style="{CARD}; padding: 22px; display: flex; flex-direction: column; gap: 8px"><b style="font-size: 16px; font-weight: 900">همراه</b><span style="font-size: 14px; color: #3E4462">نام نقش: «راهیار» · تقسیم بر اساس جنسیت و شهرستان</span><span style="font-size: 12px; color: #6C7290">۴۲ راهیار در ۳۱ شهرستان</span></div>
        <div style="{CARD}; padding: 22px; display: flex; flex-direction: column; gap: 8px"><b style="font-size: 16px; font-weight: 900">جمع همتایان</b><span style="font-size: 14px; color: #3E4462">گعدهٔ امامان هم‌شهرستان؛ ماهی دو بار</span><span style="font-size: 12px; color: #6C7290">برای مسیر خرد: «با هسته‌تان بخوانید»</span></div>
      </section>
    </sc-if>
  </main>
</div>'''
script='''const STEPS = [['size', 'اندازه'], ['stages', 'پله‌ها و محتوا'], ['model', 'شایستگی و قاعدهٔ گام'], ['people', 'مخاطب، همراه، همتایان'], ['cert', 'گواهی'], ['review', 'بازبینی']];
const fa = (n) => n.toLocaleString('fa-IR');
const BK = { 'دوره': ['#FFF2CC', '#8A5A00'], 'مسیر خرد': ['#D3EFEA', '#0B5F52'], 'مسیر میانه': ['#FDEBC4', '#8A5A00'], 'پخش زنده': ['#FBE6EB', '#A8314F'], 'ارزیابی': ['#EAEFFC', '#1E3A9E'] };
const B = (k, t) => ({ k, t, bg: BK[k][0], c: BK[k][1] });
class Component extends DCLogic {
  renderVals() {
    const cur = (this.state && this.state.s) || 'stages'; const size = (this.state && this.state.z) || 'macro';
    const steps = STEPS.map(([id, t], i) => { const on = id === cur; const done = STEPS.findIndex((x) => x[0] === cur) > i; return { t, n: fa(i + 1), cur: on ? 'step' : 'false', border: on ? '#1B2150' : '#E4E7EF', bg: on ? '#1B2150' : '#FFFFFF', fg: on ? '#FFFFFF' : '#1B2150', dot: done ? '#0E9F5A' : on ? '#F5B700' : '#C9CEDC', pick: () => this.setState({ s: id }) }; });
    const sizes = [['micro', 'خرد', 'یک تا چهار هفته', 'چند بخش یا دوره، یک تکلیف، پایان'], ['mid', 'میانه', 'یک فصل', 'چند دوره و مسیر خرد، آزمون و گواهی'], ['macro', 'کلان', 'یک تا چند سال', 'پله‌ها، شایستگی‌ها، ارزیابی همراه']].map(([id, t, d, has]) => ({ t, d, has, on: id === size ? 'true' : 'false', border: id === size ? '#1E3A9E' : '#E4E7EF', pick: () => this.setState({ z: id }) }));
    const stages = [
      { n: '۱', t: 'عضو هسته', c: '#8C93B5', rule: '۲ تکلیف تأییدشده', blocks: [B('دوره', 'هسته چیست؟ (کانون)'), B('مسیر خرد', 'جذب نوجوان در یک ماه (بنیاد هدایت)'), B('پخش زنده', 'نوجوان و مسجد (شبکهٔ مساجد شهر)')] },
      { n: '۲', t: 'بازوی فعال', c: '#D64A6A', rule: 'ارزیابی مربی هسته', blocks: [B('دوره', 'کار با نوجوان در فضای مجازی (مؤسسهٔ برکت)'), B('دوره', 'برنامهٔ هفتگی کم‌هزینه (کانون)'), B('ارزیابی', 'دیدار مربی')] },
      { n: '۳', t: 'مربی هسته', c: '#12A58E', rule: 'ارزیابی مربی هسته', blocks: [B('مسیر میانه', 'حل مسئلهٔ محله (بنیاد هدایت)'), B('دوره', 'تربیت مربی (کانون)'), B('ارزیابی', 'ادارهٔ یک هستهٔ ۵ نفره')] },
    ];
    const lib = [['جذب نوجوان در یک ماه', 'مسیر خرد', 'بنیاد هدایت'], ['کار با نوجوان در فضای مجازی', 'دوره', 'مؤسسهٔ برکت'], ['قبس، خودمانی', 'دوره', 'بنیاد هدایت'], ['مهمانی محله', 'پخش زنده', 'شبکهٔ مساجد شهر'], ['حلقهٔ خانگی بانوان', 'مسیر خرد', 'مجمع بانوان مسجدی']].map(([t, k, by]) => ({ t, k, by }));
    const sectors = [['خودسازی امام', '#8C93B5', 7], ['نهاد امامت', '#D64A6A', 2], ['به پا داشتن مردم', '#F08C1A', 9], ['پیوندهای اجتماعی', '#12A58E', 6]].map(([t, c, n]) => ({ t, c, n: fa(n) }));
    const rules = [['ارزیابی میدانی همراه', true], ['گذراندن دوره‌های پله', true], ['تکلیف‌های میدانی تأییدشده', true], ['آزمون پایانی پله', false]].map(([t, on]) => ({ t, on, border: on ? '#0E9F5A' : '#E4E7EF' }));
    return { steps, sizes, stages, lib, sectors, rules, show: { size: cur === 'size', stages: cur === 'stages', model: cur === 'model', people: cur === 'people' || cur === 'cert' || cur === 'review' } };
  }
}'''
open('/home/claude/dz/project/PathBuilder.dc.html','w').write(page('مسیرساز', body, script, 1440, 1100))
