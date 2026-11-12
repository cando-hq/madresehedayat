import sys; sys.path.insert(0,'/home/claude/dz/gen')
from common import *
body=f'''<div style="{ROOT}">
  {nav('tools')}
  <main style="max-width: 1280px; margin: 0 auto; padding: 28px 32px 64px; display: flex; flex-direction: column; gap: 24px">
    <section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 460px), 1fr)); gap: 20px; align-items: stretch">
      <div style="background: #1B2150; color: #FFFFFF; border-radius: 32px; padding: 36px 40px; display: flex; flex-direction: column; gap: 14px; justify-content: center">
        <span style="font-size: 13px; font-weight: 800; color: #F5B700">جعبه‌ابزار امام</span>
        <h1 style="margin: 0; font-size: 38px; font-weight: 900; line-height: 1.4">۳۵ ابزار برای فکر کردن، تصمیم گرفتن و کار تیمی</h1>
        <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 6px">
          <label style="flex: 1; min-width: 240px; display: flex; align-items: center; gap: 10px; background: #FFFFFF; color: #1B2150; border-radius: 14px; padding: 0 16px; min-height: 52px">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6C7290" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M10 4 a7 7 0 1 0 0.01 0 M15 15 l6 6"></path></svg>
            <span style="position: absolute; width: 1px; height: 1px; overflow: hidden">جست‌وجوی ابزار</span>
            <input placeholder="مثلاً ریشه‌یابی، اولویت، جلسه…" style="flex: 1; border: 0; outline: none; font: inherit; font-size: 15px; background: transparent; color: #1B2150">
          </label>
        </div>
      </div>
      <div style="{CARD}; padding: 26px; display: flex; flex-direction: column; gap: 14px">
        <div style="display: flex; justify-content: space-between; align-items: center"><h2 style="margin: 0; font-size: 20px; font-weight: 900">تخته‌های من</h2><a href="#" style="display: inline-flex; align-items: center; min-height: 40px; padding: 0 16px; border-radius: 12px; background: #0E9F5A; color: #FFFFFF; font-weight: 800; font-size: 14px; text-decoration: none">تختهٔ تازه</a></div>
        <sc-for list="{{{{boards}}}}" as="b" hint-placeholder-count="3">
          <a href="#" style="display: flex; align-items: center; gap: 14px; padding: 12px 14px; border-radius: 16px; background: #F4F5F9; text-decoration: none; color: #1B2150">
            <span style="width: 44px; height: 44px; border-radius: 12px; background: {{{{b.bg}}}}; color: {{{{b.c}}}}; display: flex; align-items: center; justify-content: center; flex: none"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="{{{{b.icon}}}}"></path></svg></span>
            <span style="flex: 1; display: flex; flex-direction: column; min-width: 0"><b style="font-size: 15px; font-weight: 800">{{{{b.t}}}}</b><span style="font-size: 12px; color: #6C7290">{{{{b.k}}}}</span></span>
            <span style="display: flex">
              <sc-for list="{{{{b.ppl}}}}" as="p" hint-placeholder-count="3"><span style="width: 28px; height: 28px; margin-right: -8px; border-radius: 50%; border: 2px solid #F4F5F9; background: {{{{p.bg}}}}; color: {{{{p.fg}}}}; font-size: 12px; font-weight: 900; display: flex; align-items: center; justify-content: center">{{{{p.i}}}}</span></sc-for>
            </span>
          </a>
        </sc-for>
      </div>
    </section>

    <nav aria-label="دسته‌های ابزار" style="display: flex; gap: 8px; flex-wrap: wrap">
      <sc-for list="{{{{cats}}}}" as="c" hint-placeholder-count="8">
        <button type="button" onClick="{{{{c.pick}}}}" aria-pressed="{{{{c.on}}}}" style="display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 16px; border-radius: 999px; border: 1.5px solid {{{{c.border}}}}; background: {{{{c.bg}}}}; color: {{{{c.fg}}}}; font: inherit; font-size: 14px; font-weight: 800; line-height: 1.4; cursor: pointer">
          <span style="width: 10px; height: 10px; border-radius: 50%; background: {{{{c.dot}}}}"></span>{{{{c.t}}}}<span style="font-weight: 500; opacity: 0.75">{{{{c.n}}}}</span>
        </button>
      </sc-for>
    </nav>

    <section aria-label="ابزارها" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 14px">
      <sc-for list="{{{{tools}}}}" as="t" hint-placeholder-count="12">
        <a href="#" style="{CARD}; border-radius: 22px; padding: 18px; display: flex; flex-direction: column; gap: 10px; text-decoration: none; color: #1B2150; min-height: 150px">
          <div style="display: flex; align-items: center; justify-content: space-between">
            <svg width="34" height="42" viewBox="0 0 48 60" aria-hidden="true"><path d="{TOR}" fill="{{{{t.soft}}}}"></path><path d="{{{{t.icon}}}}" fill="none" stroke="{{{{t.c}}}}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" transform="translate(12 18)"></path></svg>
            <span style="font-size: 12px; font-weight: 800; color: {{{{t.ink}}}}">{{{{t.cat}}}}</span>
          </div>
          <b style="font-size: 17px; font-weight: 900; line-height: 1.5">{{{{t.t}}}}</b>
          <span style="font-size: 13px; color: #6C7290; line-height: 1.7">{{{{t.d}}}}</span>
        </a>
      </sc-for>
    </section>
  </main>
</div>'''
script='''const IC = {
  prob: 'M4 12 h16 M8 6 l4 6 l-4 6 M14 6 l4 6 l-4 6', prio: 'M4 4 h7 v7 h-7z M13 4 h7 v7 h-7z M4 13 h7 v7 h-7z M13 13 h7 v7 h-7z',
  plan: 'M4 6 h16 M4 12 h10 M4 18 h13 M18 10 l2 2 l-2 2', aud: 'M12 8 a3 3 0 1 0 0.01 0 M5 21 c0-4 3-7 7-7 s7 3 7 7',
  idea: 'M9 18 h6 M10 21 h4 M12 3 a6 6 0 0 1 4 10 c-1 1-1 2-1 3 h-6 c0-1 0-2-1-3 a6 6 0 0 1 4-10', eval: 'M4 20 v-6 M10 20 v-12 M16 20 v-8 M22 20 h-20',
  team: 'M8 9 a3 3 0 1 0 0.01 0 M16 9 a3 3 0 1 0 0.01 0 M2 21 c0-4 3-6 6-6 s6 2 6 6 M12 21 c0-4 3-6 6-6',
};
const CAT = {
  prob: { t: 'تحلیل مسئله', c: '#D64A6A', soft: '#FBE6EB', ink: '#A8314F' },
  prio: { t: 'اولویت‌بندی و تصمیم', c: '#F08C1A', soft: '#FFF2CC', ink: '#8A5A00' },
  plan: { t: 'برنامه‌ریزی و اجرا', c: '#0E9F5A', soft: '#E2F5EA', ink: '#0A7A45' },
  aud: { t: 'شناخت مخاطب', c: '#1BA3C6', soft: '#E1F3F6', ink: '#1D7F92' },
  idea: { t: 'ایده‌پردازی', c: '#5B6BD6', soft: '#EAEFFC', ink: '#1E3A9E' },
  eval: { t: 'ارزیابی و بازتاب', c: '#12A58E', soft: '#D3EFEA', ink: '#0B5F52' },
  team: { t: 'کار گروهی', c: '#F5B700', soft: '#FFF6DA', ink: '#8A5A00' },
};
const T = [
  ['prob', 'استخوان ماهی', 'علت‌های یک مسئله را دسته‌بندی کنید'], ['prob', 'پنج چرا', 'پنج بار بپرسید چرا تا به ریشه برسید'], ['prob', 'درخت مسئله', 'علت‌ها در ریشه، پیامدها در شاخه'], ['prob', 'کوه یخ', 'رویداد، الگو، ساختار و ذهنیت'], ['prob', 'تحلیل میدان نیرو', 'نیروهای پیش‌برنده و بازدارنده'],
  ['prio', 'ماتریس آیزنهاور', 'فوری و مهم را جدا کنید'], ['prio', 'ماتریس اثر و تلاش', 'کارهای کم‌هزینه و پراثر را پیدا کنید'], ['prio', 'MoSCoW', 'باید، بهتر است، می‌شود، فعلاً نه'], ['prio', 'ماتریس تصمیم وزنی', 'گزینه‌ها را با معیارهای وزن‌دار بسنجید'], ['prio', 'مثبت، منفی، جالب', 'سه نگاه به یک پیشنهاد'], ['prio', 'ماتریس ریسک', 'احتمال در برابر اثر'],
  ['plan', 'هدف SMART', 'هدفی دقیق، سنجش‌پذیر و زمان‌دار'], ['plan', 'جدول RACI', 'مسئول، پاسخ‌گو، مشاور، مطلع'], ['plan', 'چرخهٔ PDCA', 'برنامه، اجرا، بررسی، اصلاح'], ['plan', 'برنامه‌ریزی معکوس', 'از روز برنامه به عقب برگردید'], ['plan', 'بودجهٔ برنامه', 'هزینه‌ها و منابع را ببینید'], ['plan', 'چک‌لیست اجرا', 'هیچ کاری از قلم نیفتد'], ['plan', 'نظریهٔ تغییر', 'از اقدام تا اثر، گام به گام'],
  ['aud', 'نقشهٔ همدلی', 'مخاطب چه می‌بیند، می‌شنود، حس می‌کند'], ['aud', 'پرسونا', 'یک مخاطب نمونه بسازید'], ['aud', 'سفر مخاطب', 'از آشنایی تا همراهی'], ['aud', 'نقشهٔ ذی‌نفعان', 'چه کسی اثر دارد و چه کسی اثر می‌پذیرد'],
  ['idea', 'نقشهٔ ذهنی', 'ایده‌ها را از یک مرکز بگسترانید'], ['idea', 'SCAMPER', 'هفت پرسش برای ایدهٔ تازه'], ['idea', 'شش کلاه فکری', 'شش زاویهٔ نگاه در یک جلسه'], ['idea', 'چطور می‌توانیم…؟', 'مسئله را به پرسش فرصت تبدیل کنید'], ['idea', 'هشت ایده در هشت دقیقه', 'ایده‌پردازی سریع تیمی'],
  ['eval', 'SWOT', 'قوت، ضعف، فرصت، تهدید'], ['eval', 'مرور پس از اقدام', 'چه شد، چرا، دفعهٔ بعد چه کنیم'], ['eval', 'شروع، توقف، ادامه', 'بازخورد ساده و روشن'], ['eval', 'KWL', 'می‌دانم، می‌خواهم بدانم، یاد گرفتم'], ['eval', 'گل، خار، غنچه', 'خوبی‌ها، سختی‌ها، فرصت‌ها'],
  ['team', 'چهار L', 'دوست داشتم، یاد گرفتم، کم بود، آرزو داشتم'], ['team', 'توافق‌نامهٔ تیم', 'قول و قرارهای تیم مسجد'], ['team', 'دایرهٔ نقش‌ها', 'هر کس چه نقشی دارد'],
];
const fa = (n) => n.toLocaleString('fa-IR');
class Component extends DCLogic {
  renderVals() {
    const sel = (this.state && this.state.cat) || 'all';
    const keys = ['all', ...Object.keys(CAT)];
    const cats = keys.map((k) => {
      const on = k === sel;
      return { t: k === 'all' ? 'همه' : CAT[k].t, n: fa(k === 'all' ? T.length : T.filter((x) => x[0] === k).length), on: on ? 'true' : 'false',
        bg: on ? '#1B2150' : '#FFFFFF', fg: on ? '#FFFFFF' : '#1B2150', border: on ? '#1B2150' : '#E4E7EF', dot: k === 'all' ? '#F5B700' : CAT[k].c,
        pick: () => this.setState({ cat: k }) };
    });
    const tools = T.filter((x) => sel === 'all' || x[0] === sel).map(([k, t, d]) => ({ t, d, cat: CAT[k].t, c: CAT[k].c, soft: CAT[k].soft, ink: CAT[k].ink, icon: IC[k] }));
    const P = (i, bg, fg) => ({ i, bg, fg });
    const boards = [
      { t: 'درخت مسئلهٔ نوجوانان', k: 'درخت مسئله · مشترک با تیم · دیروز', icon: IC.prob, bg: '#FBE6EB', c: '#A8314F', ppl: [P('ف', '#FBE6EB', '#A8314F'), P('م', '#D3EFEA', '#0B5F52'), P('ع', '#FFF2CC', '#8A5A00')] },
      { t: 'نقش‌های جشن نیمه‌شب', k: 'جدول RACI · مشترک · ۳ روز پیش', icon: IC.plan, bg: '#E2F5EA', c: '#0A7A45', ppl: [P('م', '#D3EFEA', '#0B5F52'), P('ز', '#FBE6EB', '#A8314F')] },
      { t: 'اولویت‌های مسجد در زمستان', k: 'اثر و تلاش · شخصی · هفتهٔ پیش', icon: IC.prio, bg: '#FFF2CC', c: '#8A5A00', ppl: [P('ح', '#1E3A9E', '#FFFFFF')] },
    ];
    return { cats, tools, boards };
  }
}'''
open('/home/claude/dz/project/Tools.dc.html','w').write(page('جعبه‌ابزار', body, script, 1440, 1500))
