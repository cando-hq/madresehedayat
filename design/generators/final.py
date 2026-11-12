import sys, json; sys.path.insert(0,'/home/claude/dz/gen')
from common import *
P='/home/claude/dz/project/'
NAV5 = lambda cur: f'''<header style="background: #FFFFFF; border-bottom: 1px solid #E4E7EF"><div style="max-width: 1280px; margin: 0 auto; padding: 12px 32px; display: flex; align-items: center; gap: 24px">
  <img src="/_blob/c32edcf1902edb02071357b473d1f634" alt="مدرسهٔ هدایت" style="height: 40px; width: auto; max-width: 200px; object-fit: contain">
  <nav aria-label="منوی اصلی" style="display: flex; gap: 2px; flex: 1">{''.join(f'<a href="{h}" {"aria-current=\"page\" " if k==cur else ""}style="padding: 10px 14px; border-radius: 12px; background: {"#EAEFFC" if k==cur else "transparent"}; color: {"#1E3A9E" if k==cur else "#3E4462"}; font-weight: 800; font-size: 15px; text-decoration: none">{t}</a>' for k,t,h in [('home','خانه','HomeFinal.dc.html'),('learn','یادگیری','MyPaths.dc.html'),('field','میدان','Field.dc.html'),('peers','همتایان','Peers.dc.html'),('karname','کارنامه','Karname.dc.html')])}</nav>
  <div style="display: flex; align-items: center; gap: 6px"><a href="Messages.dc.html" aria-label="پیام‌ها" style="width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #3E4462"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5 h16 v11 h-9 l-5 4 v-4 h-2z"></path></svg></a><a href="#" style="display: flex; align-items: center; gap: 10px; text-decoration: none; color: #1B2150"><span style="text-align: left; display: flex; flex-direction: column"><b style="font-size: 14px; font-weight: 800">حجت‌الاسلام حسنی</b><span style="font-size: 12px; color: #6C7290">امام مسجد صاحب‌الزمان</span></span><span style="width: 42px; height: 42px; border-radius: 50%; background: #1E3A9E; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-weight: 900">ح</span></a></div></div></header>'''

# ---------- Home final (کنشگر)
body=f'''<div style="{ROOT}">
  {NAV5('home')}
  <main style="max-width: 1280px; margin: 0 auto; padding: 28px 32px 64px; display: flex; flex-direction: column; gap: 24px">
    <section style="background: #1E3A9E; color: #FFFFFF; border-radius: 32px; overflow: hidden; display: grid; grid-template-columns: 1.1fr 1fr">
      <div style="padding: 36px 40px; display: flex; flex-direction: column; gap: 16px; justify-content: center">
        <span style="font-size: 14px; color: #C9D3F5">صبح بخیر، حاج‌آقا حسنی</span>
        <h1 style="margin: 0; font-size: 34px; font-weight: 900; line-height: 1.4">بعدی برای تو</h1>
        <div style="background: #FFFFFF; color: #1B2150; border-radius: 22px; padding: 22px 24px; display: flex; flex-direction: column; gap: 12px; max-width: 540px">
          <div style="display: flex; justify-content: space-between; gap: 12px; font-size: 13px"><b style="color: #B07800">مسیر تعیّن امامت · پلهٔ امام محله</b><span style="color: #6C7290">از بنیاد هدایت</span></div>
          <b style="font-size: 22px; font-weight: 900; line-height: 1.5">روایت تکلیف «بوم مسئلهٔ محله» را بنویس</b>
          <span style="font-size: 14px; color: #3E4462">سی روز تمام شد. سه خط بنویس: چه کردی، چه شد، چه فهمیدی. راهیار تا سه روز پاسخ می‌دهد.</span>
          <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap"><a href="Narrate.dc.html" style="display: inline-flex; align-items: center; min-height: 48px; padding: 0 24px; border-radius: 14px; background: #0E9F5A; color: #FFFFFF; font-weight: 800; font-size: 16px; text-decoration: none">روایت بنویس</a><span style="font-size: 13px; color: #6C7290">یا: گوش دادن به بخش بعد، ۸ دقیقه</span></div>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap">
          <sc-for list="{{{{loop}}}}" as="l" hint-placeholder-count="5"><span style="display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 999px; background: {{{{l.bg}}}}; color: {{{{l.c}}}}; font-size: 12px; font-weight: 800"><span style="width: 8px; height: 8px; border-radius: 50%; background: currentColor; opacity: {{{{l.op}}}}"></span>{{{{l.t}}}}</span></sc-for>
        </div>
      </div>
      <img src="/_blob/702a4dfcbc9ca7da3287d181fdf527c9" alt="گنبد مسجد در غروب" style="width: 100%; height: 100%; min-height: 380px; object-fit: cover; object-position: 50% 38%">
    </section>

    <section aria-labelledby="wk-h" style="display: flex; flex-direction: column; gap: 12px">
      <h2 id="wk-h" style="margin: 0; font-size: 22px; font-weight: 900">این هفته</h2>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px">
        <sc-for list="{{{{week}}}}" as="w" hint-placeholder-count="3">
          <a href="{{{{w.href}}}}" style="{CARD}; padding: 20px; display: flex; gap: 14px; align-items: center; text-decoration: none; color: #1B2150">
            <svg width="40" height="50" viewBox="0 0 48 60" aria-hidden="true" style="flex: none"><path d="{TOR}" fill="{{{{w.c}}}}"></path></svg>
            <span style="display: flex; flex-direction: column; gap: 2px; min-width: 0"><span style="font-size: 12px; font-weight: 800; color: {{{{w.ink}}}}">{{{{w.k}}}}</span><b style="font-size: 16px; font-weight: 800">{{{{w.t}}}}</b><span style="font-size: 13px; color: #6C7290">{{{{w.when}}}}</span></span>
          </a>
        </sc-for>
      </div>
    </section>

    <section aria-labelledby="my-h" style="display: flex; flex-direction: column; gap: 12px">
      <div style="display: flex; justify-content: space-between; align-items: center"><h2 id="my-h" style="margin: 0; font-size: 22px; font-weight: 900">مسیرهای من</h2><a href="Explore.dc.html" style="font-size: 14px; font-weight: 800">یادگیری</a></div>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px">
        <sc-for list="{{{{paths}}}}" as="p" hint-placeholder-count="3">
          <a href="{{{{p.href}}}}" style="{CARD}; padding: 0; overflow: hidden; display: flex; flex-direction: column; text-decoration: none; color: #1B2150">
            <span style="height: 10px; background: {{{{p.c}}}}"></span>
            <span style="padding: 18px; display: flex; flex-direction: column; gap: 8px"><span style="display: flex; justify-content: space-between; font-size: 12px"><b style="color: {{{{p.ink}}}}">{{{{p.kind}}}}</b><span style="color: #6C7290">{{{{p.by}}}}</span></span><b style="font-size: 17px; font-weight: 900">{{{{p.t}}}}</b><span style="font-size: 13px; color: #3E4462">{{{{p.state}}}}</span><span style="height: 8px; border-radius: 4px; background: #EEF0F5"><span style="display: block; height: 100%; width: {{{{p.w}}}}; border-radius: 4px; background: {{{{p.c}}}}"></span></span></span>
          </a>
        </sc-for>
      </div>
    </section>
  </main>
</div>'''
script='''class Component extends DCLogic {
  renderVals() {
    const loop = [['یاد بگیر', 1], ['در میدان انجام بده', 1], ['روایت کن', 0], ['بازخورد بگیر', 0], ['یک گام رشد کن', 0]].map(([t, d], i) => ({ t, bg: i === 2 ? '#F5B700' : d ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)', c: i === 2 ? '#3B2B00' : '#FFFFFF', op: d || i === 2 ? 1 : 0.4 }));
    const week = [
      { k: 'گعده', t: 'گعدهٔ امامان محلهٔ بهشهر', when: 'پنجشنبه بعد از مغرب · قرار من: دیدار با دو خانواده', c: '#F5B700', ink: '#8A5A00', href: '#' },
      { k: 'پخش زنده', t: 'اخلاق امامت محله، جلسهٔ ۶', when: 'سه‌شنبه ساعت ۲۱ · ثبت‌نام کرده‌اید', c: '#D64A6A', ink: '#A8314F', href: 'Live.dc.html' },
      { k: 'تیم من', t: 'هستهٔ نوجوانان: جشن نیمه‌شب', when: 'جمعه · ۶۲ ثبت‌نام · شما مسئول برنامه‌اید', c: '#12A58E', ink: '#0B5F52', href: 'Events.dc.html' },
    ];
    const paths = [
      { kind: 'مسیر کلان · پلهٔ ۳ از ۴', by: 'بنیاد هدایت', t: 'تعیّن امامت', state: 'امام محله؛ ارزیابی میدانی بعدی ۱۸ آذر', w: '58%', c: '#1E3A9E', ink: '#1E3A9E', href: 'PathMacro.dc.html' },
      { kind: 'مسیر خرد · هفتهٔ ۳ از ۴', by: 'بنیاد هدایت', t: 'جذب نوجوان در یک ماه', state: 'با هستهٔ نوجوانان می‌خوانید', w: '70%', c: '#12A58E', ink: '#0B5F52', href: '#' },
      { kind: 'دوره · بخش ۲ از ۵', by: 'مؤسسهٔ برکت', t: 'کار با نوجوان در فضای مجازی', state: 'بخش بعد: صوتی، ۸ دقیقه', w: '40%', c: '#0E9F5A', ink: '#0A7A45', href: 'Course.dc.html' },
    ];
    return { loop, week, paths };
  }
}'''
open(P+'HomeFinal.dc.html','w').write(page('خانهٔ کنشگر (نهایی)', body, script, 1440, 1150))

# ---------- Rahyar queue final
SIDE=lambda cur,title,sub,items: f'''<aside style="width: 248px; flex: none; background: #1B2150; color: #FFFFFF; padding: 22px 14px; display: flex; flex-direction: column; gap: 4px; box-sizing: border-box"><img src="/_blob/b522f6290bfc782976410c6c8494344e" alt="مدرسهٔ هدایت" style="width: 150px; max-width: 100%; height: auto; align-self: flex-start; margin: 0 8px 10px"><div style="padding: 0 10px 14px; font-size: 13px; color: #C9D3F5">{title} · {sub}</div><nav style="display: flex; flex-direction: column; gap: 2px">{''.join(f'<a href="#" {"aria-current=\"page\" " if k==cur else ""}style="display: flex; align-items: center; gap: 10px; min-height: 42px; padding: 0 12px; border-radius: 12px; background: {"rgba(255,255,255,0.14)" if k==cur else "transparent"}; color: #FFFFFF; font-size: 14px; font-weight: {800 if k==cur else 500}; text-decoration: none"><span style="width: 8px; height: 8px; border-radius: 50%; background: {c}"></span>{t}</a>' for k,t,c in items)}</nav></aside>'''
body=f'''<div style="{ROOT}; display: flex">
  {SIDE('q','پنل راهیار','حاج‌آقا محمدی',[('q','صف روایت‌ها','#F5B700'),('l','کنشگران من','#12A58E'),('g','گعده‌ها','#F08C1A'),('m','پیام‌ها','#8C93B5')])}
  <main style="flex: 1; padding: 28px 32px 48px; display: flex; flex-direction: column; gap: 18px; min-width: 0">
    <div style="display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; flex-wrap: wrap"><div><h1 style="margin: 0; font-size: 28px; font-weight: 900">صف روایت‌ها</h1><p style="margin: 4px 0 0; color: #6C7290">هر روایت را در دو دقیقه ببند: یک حکم، یک جمله.</p></div><div style="display: flex; gap: 8px"><span style="padding: 6px 14px; border-radius: 999px; background: #FBE6EB; color: #A8314F; font-size: 13px; font-weight: 800">۳ روایت بیش از سه روز</span><span style="padding: 6px 14px; border-radius: 999px; background: #FFF2CC; color: #8A5A00; font-size: 13px; font-weight: 800">۱۱ منتظر</span></div></div>
    <div style="display: grid; grid-template-columns: 380px minmax(0, 1fr); gap: 18px; align-items: start">
      <div style="{CARD}; padding: 10px; display: flex; flex-direction: column; gap: 6px">
        <sc-for list="{{{{queue}}}}" as="r" hint-placeholder-count="6">
          <button type="button" onClick="{{{{r.pick}}}}" aria-pressed="{{{{r.on}}}}" style="text-align: right; font: inherit; cursor: pointer; color: #1B2150; border: 0; border-radius: 16px; padding: 12px 14px; background: {{{{r.bg}}}}; display: flex; gap: 12px; align-items: center">
            <span style="width: 38px; height: 38px; border-radius: 50%; background: {{{{r.av}}}}; color: #FFFFFF; font-weight: 900; display: flex; align-items: center; justify-content: center; flex: none">{{{{r.i}}}}</span>
            <span style="flex: 1; min-width: 0; display: flex; flex-direction: column"><b style="font-size: 14px; font-weight: 800">{{{{r.n}}}}</b><span style="font-size: 12px; color: #6C7290; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{{{{r.task}}}}</span></span>
            <span style="font-size: 12px; font-weight: 800; color: {{{{r.ac}}}}; white-space: nowrap">{{{{r.age}}}}</span>
          </button>
        </sc-for>
      </div>
      <div style="{CARD}; padding: 26px; display: flex; flex-direction: column; gap: 16px">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap"><div><span style="font-size: 13px; color: #6C7290">{{{{cur.path}}}}</span><h2 style="margin: 2px 0 0; font-size: 22px; font-weight: 900">{{{{cur.n}}}} · {{{{cur.task}}}}</h2><span style="font-size: 13px; color: #6C7290">{{{{cur.meta}}}}</span></div><a href="#" style="font-size: 14px; font-weight: 800">پروندهٔ کنشگر</a></div>
        <div style="padding: 18px; border-radius: 18px; background: #FBFAF6; font-size: 16px; line-height: 2">{{{{cur.text}}}}</div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap"><span style="padding: 4px 12px; border-radius: 999px; background: #F4F5F9; font-size: 12px; font-weight: 800">🔒 یک عکس خصوصی</span><span style="padding: 4px 12px; border-radius: 999px; background: #F4F5F9; font-size: 12px; font-weight: 800">روایت قبلی: تأیید شده</span><span style="padding: 4px 12px; border-radius: 999px; background: #F4F5F9; font-size: 12px; font-weight: 800">نظر همتایان گعده: ۲</span></div>
        <div style="display: flex; flex-direction: column; gap: 8px"><b style="font-size: 14px">معیار این تکلیف (از مسیر)</b>
          <sc-for list="{{{{cur.crit}}}}" as="c" hint-placeholder-count="3"><label style="display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 0 14px; border-radius: 14px; background: #F4F5F9; font-size: 14px"><input type="checkbox" checked="{{{{c.ok}}}}" style="width: 20px; height: 20px; accent-color: #0E9F5A">{{{{c.t}}}}</label></sc-for></div>
        <label style="display: flex; flex-direction: column; gap: 6px; font-size: 14px; font-weight: 800">یک جمله برای کنشگر<textarea rows="2" placeholder="یک قوت و یک قدم بعدی" style="border: 1.5px solid #E4E7EF; border-radius: 14px; padding: 10px 12px; font: inherit; font-size: 15px; resize: vertical"></textarea></label>
        <div style="display: flex; gap: 8px; flex-wrap: wrap"><button type="button" style="min-height: 48px; padding: 0 22px; border-radius: 14px; border: 0; background: #0E9F5A; color: #FFFFFF; font: inherit; font-weight: 800; line-height: 1.4; cursor: pointer">تأیید؛ یک گام جلو</button><button type="button" style="min-height: 48px; padding: 0 18px; border-radius: 14px; border: 1.5px solid #1E3A9E; background: #FFFFFF; color: #1E3A9E; font: inherit; font-weight: 800; line-height: 1.4; cursor: pointer">فقط بازخورد</button><button type="button" style="min-height: 48px; padding: 0 18px; border-radius: 14px; border: 1.5px solid #F0C2CD; background: #FFFFFF; color: #A8314F; font: inherit; font-weight: 800; line-height: 1.4; cursor: pointer">درخواست اصلاح</button><span style="margin-right: auto; font-size: 12px; color: #6C7290; align-self: center">بعد از حکم، روایت بعدی باز می‌شود</span></div>
      </div>
    </div>
  </main>
</div>'''
script='''const Q = [
  ['م', 'مهدی کاظمی', 'بوم مسئله و پنج چرا', '۴ روز', 1, '#0B5F52', 'مسیر حل مسئلهٔ محله · دورهٔ حل مسئله', 'با سه نفر از تیم بوم را پر کردیم. با سه خانواده حرف زدیم: هر سه گفتند بچه‌ها بعد از ساعت هشت جایی ندارند. ریشه‌ای که رسیدیم: هیچ بزرگ‌تری برایشان وقت نمی‌گذارد. قدم بعد: دو پدر داوطلب شدند سه‌شنبه‌ها در مسجد بمانند.', ['ریشه با پنج چرا به دست آمده، نه حدس', 'دست‌کم سه گفت‌وگوی واقعی', 'روایت کوتاه و بی‌نکتهٔ آبرویی']],
  ['ک', 'حاج‌آقا کریمی', 'منشور همکاری ارکان', '۳ روز', 1, '#1E3A9E', 'تعیّن امامت · پلهٔ امام مسجد', 'جلسهٔ ماهانهٔ ارکان را برگزار کردم و صورت‌جلسه را با سه ستون «چه کسی، چه کاری، تا کی» در گروه گذاشتم.', ['جلسه با دستور مکتوب', 'هر تصمیم مسئول و مهلت دارد', 'صورت‌جلسه منتشر شده']],
  ['ز', 'خانم زارعی', 'نخستین حلقهٔ بانوان', '۲ روز', 0, '#A8314F', 'حلقهٔ خانگی بانوان', 'با چهار همسایه نخستین حلقه را گذاشتیم.', ['دست‌کم چهار نفر', 'موضوع و زمان ثابت', 'قرار جلسهٔ بعد']],
  ['ص', 'حاج‌آقا صادقی', 'دفتر نام و احوال', 'دیروز', 0, '#1E3A9E', 'تعیّن امامت · پلهٔ امام جماعت', 'دفتر به ۲۸ نام رسید؛ ۴ پیگیری غایب.', ['دست‌کم ۴۰ نام', '۸ پیگیری غایب', 'یک گفت‌وگو با پیشکسوت']],
  ['ع', 'علی احمدی', 'یک عقد اخوت', 'امروز', 0, '#0B5F52', 'پلکان اخوت', 'با رضا عقد اخوت بستیم و قرار هفتگی گذاشتیم.', ['عقد با یک نفر', 'قرار هفتگی']],
];
class Component extends DCLogic {
  renderVals() {
    const sel = (this.state && this.state.i) || 0;
    const queue = Q.map(([i, n, task, age, late, av], k) => ({ i, n, task, age, av, on: k === sel ? 'true' : 'false', bg: k === sel ? '#EAEFFC' : '#F4F5F9', ac: late ? '#A8314F' : '#6C7290', pick: () => this.setState({ i: k }) }));
    const c = Q[sel];
    return { queue, cur: { n: c[1], task: c[2], path: c[6], meta: 'رسیده ' + c[3] + ' پیش', text: c[7], crit: c[8].map((t, j) => ({ t, ok: j < 2 })) } };
  }
}'''
open(P+'RahyarFinal.dc.html','w').write(page('پنل راهیار: صف روایت‌ها (نهایی)', body, script, 1440, 980))

# ---------- Admin review queue
body=f'''<div style="{ROOT}; display: flex">
  {SIDE('r','ستاد','بازبینی و ادارهٔ سامانه',[('r','صف بازبینی','#F5B700'),('p','برگزارکنندگان','#F08C1A'),('u','کنشگران','#1BA3C6'),('s','پشتیبانی','#D64A6A'),('g','گزارش کل','#1E3A9E')])}
  <main style="flex: 1; padding: 28px 32px 48px; display: flex; flex-direction: column; gap: 18px; min-width: 0">
    <div><h1 style="margin: 0; font-size: 28px; font-weight: 900">صف بازبینی</h1><p style="margin: 4px 0 0; color: #6C7290">هر مسیر، دوره و پخش زنده پیش از انتشار یک بار اینجا دیده می‌شود. ستاد بازبین است، نه سازنده.</p></div>
    <section style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px">
      <sc-for list="{{{{kpi}}}}" as="x" hint-placeholder-count="4"><div style="{CARD}; border-radius: 22px; padding: 18px 20px"><span style="font-size: 13px; color: #6C7290">{{{{x.t}}}}</span><b style="display: block; font-size: 28px; font-weight: 900">{{{{x.v}}}}</b></div></sc-for>
    </section>
    <div style="display: grid; grid-template-columns: 360px minmax(0, 1fr); gap: 18px; align-items: start">
      <div style="{CARD}; padding: 10px; display: flex; flex-direction: column; gap: 6px">
        <sc-for list="{{{{queue}}}}" as="q" hint-placeholder-count="5">
          <button type="button" onClick="{{{{q.pick}}}}" aria-pressed="{{{{q.on}}}}" style="text-align: right; font: inherit; cursor: pointer; color: #1B2150; border: 0; border-radius: 16px; padding: 12px 14px; background: {{{{q.bg}}}}; display: flex; flex-direction: column; gap: 4px">
            <span style="display: flex; gap: 8px; align-items: center"><span style="padding: 2px 10px; border-radius: 999px; background: {{{{q.kbg}}}}; color: {{{{q.kc}}}}; font-size: 12px; font-weight: 800">{{{{q.kind}}}}</span><span style="font-size: 12px; color: #6C7290">{{{{q.by}}}}</span></span>
            <b style="font-size: 14px; font-weight: 800">{{{{q.t}}}}</b>
          </button>
        </sc-for>
      </div>
      <div style="{CARD}; padding: 26px; display: flex; flex-direction: column; gap: 16px">
        <div><span style="font-size: 13px; color: #6C7290">{{{{cur.kind}}}} · {{{{cur.by}}}}</span><h2 style="margin: 2px 0 0; font-size: 22px; font-weight: 900">{{{{cur.t}}}}</h2></div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px">
          <sc-for list="{{{{cur.facts}}}}" as="f" hint-placeholder-count="3"><div style="padding: 12px 14px; border-radius: 14px; background: #F4F5F9"><span style="font-size: 12px; color: #6C7290">{{{{f.k}}}}</span><b style="display: block; font-size: 15px">{{{{f.v}}}}</b></div></sc-for>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px"><b style="font-size: 14px">چک‌لیست بازبینی</b>
          <sc-for list="{{{{cur.checks}}}}" as="c" hint-placeholder-count="5"><label style="display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 0 14px; border-radius: 14px; background: {{{{c.bg}}}}; font-size: 14px"><input type="checkbox" checked="{{{{c.ok}}}}" style="width: 20px; height: 20px; accent-color: #0E9F5A">{{{{c.t}}}}</label></sc-for></div>
        <label style="display: flex; flex-direction: column; gap: 6px; font-size: 14px; font-weight: 800">یادداشت برای برگزارکننده<textarea rows="2" style="border: 1.5px solid #E4E7EF; border-radius: 14px; padding: 10px 12px; font: inherit; font-size: 15px"></textarea></label>
        <div style="display: flex; gap: 8px; flex-wrap: wrap"><a href="PathMacro.dc.html" style="display: inline-flex; align-items: center; min-height: 48px; padding: 0 18px; border-radius: 14px; border: 1.5px solid #E4E7EF; background: #FFFFFF; color: #1B2150; font-weight: 800; text-decoration: none">پیش‌نمایش از دید کنشگر</a><button type="button" style="min-height: 48px; padding: 0 22px; border-radius: 14px; border: 0; background: #0E9F5A; color: #FFFFFF; font: inherit; font-weight: 800; line-height: 1.4; cursor: pointer">انتشار</button><button type="button" style="min-height: 48px; padding: 0 18px; border-radius: 14px; border: 1.5px solid #F0C2CD; background: #FFFFFF; color: #A8314F; font: inherit; font-weight: 800; line-height: 1.4; cursor: pointer">برگرداندن برای اصلاح</button></div>
      </div>
    </div>
  </main>
</div>'''
script='''const KC = { 'مسیر کلان': ['#EAEFFC', '#1E3A9E'], 'مسیر خرد': ['#D3EFEA', '#0B5F52'], 'دوره': ['#FFF2CC', '#8A5A00'], 'پخش زنده': ['#FBE6EB', '#A8314F'], 'برگزارکنندهٔ تازه': ['#F4F5F9', '#3E4462'] };
const Q = [
  ['مسیر کلان', 'از عضو تا مربی هسته', 'کانون نوجوانان مسجد', [['اندازه', '۳ پله، ۱۸ ماه'], ['محتوا', '۷ دوره، ۲ مسیر خرد'], ['راهیار', '۱۲ مربی هسته']], ['مخاطب و پله‌ها روشن است', 'قاعدهٔ رفتن به پلهٔ بعد تعریف شده', 'هر پله دست‌کم یک تکلیف میدانی دارد', 'محتوای دیگران با نام سازنده آمده', 'حریم: کاربرگ‌ها نکتهٔ آبرویی نمی‌خواهند']],
  ['پخش زنده', 'مهمانی محله؛ تجربهٔ ۴۵۰۰ محله', 'شبکهٔ مساجد شهر', [['زمان', 'سه‌شنبه ۴ آذر، ۲۰:۳۰'], ['ظرفیت', '۳۰۰ نفر'], ['ضبط', 'بله، برای ثبت‌نامی‌ها']], ['عنوان و زمان درست است', 'مجری معرفی شده', 'در سقف ساعت زندهٔ برگزارکننده است']],
  ['دوره', 'حلقهٔ خانگی؛ گام به گام', 'مجمع بانوان مسجدی', [['بخش‌ها', '۶ بخش، صوت و کاربرگ'], ['تکلیف', 'سی‌روزه، با تأیید راهیار'], ['کتابخانه', 'عمومی']], ['هر بخش یک کار دارد', 'تکلیف میدانی روشن است', 'قابل استفاده در مسیرهای دیگران']],
  ['برگزارکنندهٔ تازه', 'مؤسسهٔ فرهنگی نورالهدی', 'درخواست پذیرش', [['نوع', 'مؤسسهٔ ثبت‌شده'], ['مخاطب', 'امامان روستا'], ['معرف', 'ستاد استان فارس']], ['هویت تأیید شده', 'معرف معتبر', 'تعهد حریم امضا شده']],
];
class Component extends DCLogic {
  renderVals() {
    const sel = (this.state && this.state.i) || 0;
    const queue = Q.map(([kind, t, by], k) => ({ kind, t, by, kbg: KC[kind][0], kc: KC[kind][1], on: k === sel ? 'true' : 'false', bg: k === sel ? '#EAEFFC' : '#F4F5F9', pick: () => this.setState({ i: k }) }));
    const c = Q[sel];
    const kpi = [{ t: 'در صف بازبینی', v: '۴' }, { t: 'برگزارکنندهٔ فعال', v: '۱۲' }, { t: 'گام رشد تأییدشده، این فصل', v: '۱٬۸۴۰' }, { t: 'میانگین زمان بازبینی', v: '۱٫۵ روز' }];
    return { kpi, queue, cur: { kind: c[0], t: c[1], by: c[2], facts: c[3].map(([k, v]) => ({ k, v })), checks: c[4].map((t, j) => ({ t, ok: j < 2, bg: '#F4F5F9' })) } };
  }
}'''
open(P+'AdminFinal.dc.html','w').write(page('پنل ستاد: صف بازبینی (نهایی)', body, script, 1440, 980))

# ---------- Team page
body=f'''<div style="{ROOT}">
  {NAV5('peers')}
  <main style="max-width: 1280px; margin: 0 auto; padding: 28px 32px 64px; display: flex; flex-direction: column; gap: 22px">
    <section style="{CARD}; padding: 26px 30px; display: flex; gap: 20px; align-items: center; flex-wrap: wrap">
      <svg width="60" height="75" viewBox="0 0 48 60" aria-hidden="true"><path d="{TOR}" fill="#12A58E"></path></svg>
      <div style="flex: 1; min-width: 240px"><span style="font-size: 13px; font-weight: 800; color: #0B5F52">تیم · مسجد صاحب‌الزمان(عج)</span><h1 style="margin: 0; font-size: 30px; font-weight: 900">هستهٔ نوجوانان</h1><span style="font-size: 14px; color: #6C7290">مسئول: مهدی کاظمی · ۶ عضو</span></div>
      <div style="display: flex; gap: 8px"><button type="button" style="min-height: 44px; padding: 0 16px; border-radius: 12px; border: 1.5px solid #E4E7EF; background: #FFFFFF; font: inherit; font-weight: 800; line-height: 1.4; cursor: pointer">پیوند دعوت</button><button type="button" style="min-height: 44px; padding: 0 16px; border-radius: 12px; border: 0; background: #1E3A9E; color: #FFFFFF; font: inherit; font-weight: 800; line-height: 1.4; cursor: pointer">پیام به تیم</button></div>
    </section>
    <section style="display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 20px; align-items: start">
      <div style="display: flex; flex-direction: column; gap: 16px">
        <div style="{CARD}; padding: 24px; display: flex; flex-direction: column; gap: 12px">
          <div style="display: flex; justify-content: space-between; align-items: center"><h2 style="margin: 0; font-size: 20px; font-weight: 900">با هم می‌خوانیم</h2><a href="Explore.dc.html" style="font-size: 14px; font-weight: 800">برداشتن مسیر برای تیم</a></div>
          <sc-for list="{{{{together}}}}" as="t" hint-placeholder-count="2">
            <a href="{{{{t.href}}}}" style="display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 18px; background: #F4F5F9; text-decoration: none; color: #1B2150">
              <span style="width: 12px; height: 44px; border-radius: 6px; background: {{{{t.c}}}}"></span>
              <span style="flex: 1; display: flex; flex-direction: column; gap: 4px"><span style="font-size: 12px; font-weight: 800; color: {{{{t.ink}}}}">{{{{t.kind}}}}</span><b style="font-size: 16px; font-weight: 800">{{{{t.t}}}}</b><span style="font-size: 13px; color: #6C7290">{{{{t.state}}}}</span></span>
              <span style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px; font-size: 12px; color: #6C7290"><span>پیشرفت تیم</span><b style="font-size: 18px; color: #1B2150">{{{{t.p}}}}</b></span>
            </a>
          </sc-for>
        </div>
        <div style="{CARD}; padding: 24px; display: flex; flex-direction: column; gap: 10px">
          <h2 style="margin: 0; font-size: 20px; font-weight: 900">اعضا</h2><span style="font-size: 13px; color: #6C7290">مسئول تیم پیشرفت و حضور را می‌بیند؛ نمره و یادداشت‌ها خصوصی است.</span>
          <sc-for list="{{{{members}}}}" as="m" hint-placeholder-count="6">
            <div style="display: grid; grid-template-columns: 1.6fr 1fr 1.4fr 0.8fr; gap: 12px; align-items: center; padding: 12px 14px; border-radius: 16px; background: #F4F5F9; font-size: 14px">
              <span style="display: flex; align-items: center; gap: 10px"><span style="width: 36px; height: 36px; border-radius: 50%; background: {{{{m.bg}}}}; color: {{{{m.fg}}}}; font-weight: 900; display: flex; align-items: center; justify-content: center">{{{{m.i}}}}</span><b style="font-weight: 800">{{{{m.n}}}}</b></span>
              <span style="color: #6C7290">{{{{m.role}}}}</span>
              <span style="display: flex; flex-direction: column; gap: 4px"><span style="font-size: 13px">{{{{m.cur}}}}</span><span style="height: 6px; border-radius: 3px; background: #E4E7EF"><span style="display: block; height: 100%; width: {{{{m.w}}}}; border-radius: 3px; background: #12A58E"></span></span></span>
              <span style="color: #6C7290">{{{{m.last}}}}</span>
            </div>
          </sc-for>
        </div>
      </div>
      <aside style="display: flex; flex-direction: column; gap: 16px">
        <div style="background: #1B2150; color: #FFFFFF; border-radius: 28px; padding: 24px; display: flex; flex-direction: column; gap: 10px"><span style="font-size: 12px; font-weight: 800; color: #F5B700">تکلیف تیمی این ماه</span><b style="font-size: 18px; font-weight: 900">چهار صبحِ جماعت با نوجوانان</b><span style="font-size: 14px; color: #C9D3F5; line-height: 1.8">از مسیر خرد «جذب نوجوان در یک ماه». گزارش را تیم می‌دهد و راهیار برای کل تیم تأیید می‌کند.</span><div style="height: 8px; border-radius: 4px; background: rgba(255,255,255,0.18)"><div style="width: 50%; height: 100%; border-radius: 4px; background: #F5B700"></div></div><span style="font-size: 13px">۲ از ۴ انجام شد</span></div>
        <div style="{CARD}; padding: 22px; display: flex; flex-direction: column; gap: 8px"><b style="font-size: 16px; font-weight: 900">برنامه‌های تیم</b><span style="font-size: 14px; color: #3E4462">جشن نیمه‌شب نوجوانان · جمعه · ۶۲ ثبت‌نام</span><a href="Events.dc.html" style="font-size: 14px; font-weight: 800">مدیریت برنامه</a></div>
        <div style="{CARD}; padding: 22px; display: flex; flex-direction: column; gap: 8px"><b style="font-size: 16px; font-weight: 900">تختهٔ تیم</b><span style="font-size: 14px; color: #3E4462">درخت مسئلهٔ نوجوانان · ۳ نفر دیروز ویرایش کردند</span><a href="Tools.dc.html" style="font-size: 14px; font-weight: 800">باز کردن</a></div>
      </aside>
    </section>
  </main>
</div>'''
script='''class Component extends DCLogic {
  renderVals() {
    const together = [
      { kind: 'مسیر خرد · هفتهٔ ۳ از ۴', t: 'جذب نوجوان در یک ماه', state: 'بنیاد هدایت · ایستگاه بعد پنجشنبه باز می‌شود', p: '٪۷۰', c: '#12A58E', ink: '#0B5F52', href: '#' },
      { kind: 'دوره · بخش ۲ از ۵', t: 'کار با نوجوان در فضای مجازی', state: 'مؤسسهٔ برکت', p: '٪۴۰', c: '#0E9F5A', ink: '#0A7A45', href: 'Course.dc.html' },
    ];
    const M = [['م', 'مهدی کاظمی', 'مسئول تیم', 'جذب نوجوان در یک ماه', '80%', 'امروز'], ['ح', 'حاج‌آقا حسنی', 'امام مسجد', 'جذب نوجوان در یک ماه', '70%', 'امروز'], ['ع', 'علی احمدی', 'عضو', 'جذب نوجوان در یک ماه', '60%', 'دیروز'], ['ر', 'رضا یوسفی', 'مسئول رسانه', 'کار با نوجوان در فضای مجازی', '40%', '۳ روز پیش'], ['س', 'سجاد نیکو', 'عضو', 'جذب نوجوان در یک ماه', '30%', 'هفتهٔ پیش'], ['ا', 'امیر رحیمی', 'عضو', '—', '0%', 'هنوز شروع نکرده']];
    const members = M.map(([i, n, role, cur, w, last], k) => ({ i, n, role, cur, w, last, bg: k === 1 ? '#1E3A9E' : '#D3EFEA', fg: k === 1 ? '#FFFFFF' : '#0B5F52' }));
    return { together, members };
  }
}'''
open(P+'TeamFinal.dc.html','w').write(page('تیم من (نهایی)', body, script, 1440, 1000))

c=json.load(open(P+'canvas.json'))
c['boards']['HomeFinal.dc.html']=dict(x=0,y=-5500,w=1440,h=1150,title='خانهٔ کنشگر (نهایی)',expand='fill',is_interactive=True)
c['boards']['TeamFinal.dc.html']=dict(x=1520,y=-5500,w=1440,h=1000,title='تیم من (نهایی)',expand='fill')
c['boards']['RahyarFinal.dc.html']=dict(x=3040,y=-5500,w=1440,h=980,title='راهیار: صف روایت‌ها (نهایی)',expand='fill',is_interactive=True)
c['boards']['AdminFinal.dc.html']=dict(x=4560,y=-5500,w=1440,h=980,title='ستاد: صف بازبینی (نهایی)',expand='fill',is_interactive=True)
c['notes']['t8']=dict(x=0,y=-5800,text='طراحی نهایی برای چهار کاربر: کنشگر، تیم، راهیار، ستاد (برگزارکننده: ردیف پایین)',kind='title1',maxW=6000)
new=['HomeFinal.dc.html','TeamFinal.dc.html','RahyarFinal.dc.html','AdminFinal.dc.html']
c['order']=new+[o for o in c['order'] if o not in new]
json.dump(c,open(P+'canvas.json','w'),ensure_ascii=False)
print('ok')
