import sys; sys.path.insert(0,'/home/claude/dz/gen')
from common import *
def side(title, sub, items, active):
    lis=''.join(f'<a href="#" {"aria-current=\"page\" " if k==active else ""}style="display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 0 14px; border-radius: 12px; background: {"rgba(255,255,255,0.14)" if k==active else "transparent"}; color: #FFFFFF; font-size: 14px; font-weight: {800 if k==active else 500}; text-decoration: none"><span style="width: 8px; height: 8px; border-radius: 50%; background: {c}"></span>{t}</a>' for k,t,c in items)
    return f'''<aside style="width: 260px; flex: none; background: #1B2150; color: #FFFFFF; padding: 22px 14px; display: flex; flex-direction: column; gap: 4px; min-height: 100vh; box-sizing: border-box">
    <img src="/_blob/b522f6290bfc782976410c6c8494344e" alt="مدرسهٔ هدایت" style="height: 38px; width: auto; align-self: flex-start; margin: 0 8px 6px">
    <div style="padding: 0 10px 14px; font-size: 13px; color: #C9D3F5">{title} · {sub}</div>
    <nav aria-label="منوی {title}" style="display: flex; flex-direction: column; gap: 2px">{lis}</nav>
  </aside>'''
RS=[('d','پیشخوان','#F5B700'),('l','امامان و تیم‌ها','#12A58E'),('r','گزارش‌ها','#D64A6A'),('a','تعیین دوره','#1BA3C6'),('m','پیام‌ها','#8C93B5'),('t','درخت راهیاری','#F08C1A')]
body=f'''<div style="{ROOT}; display: flex">
  {side('پنل راهیار','حجت‌الاسلام محمدی',RS,'d')}
  <main style="flex: 1; padding: 28px 32px; display: flex; flex-direction: column; gap: 20px; min-width: 0">
    <h1 style="margin: 0; font-size: 30px; font-weight: 900">۲۴ مسجد همراه شما</h1>
    <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px">
      <sc-for list="{{{{lv}}}}" as="l" hint-placeholder-count="4">
        <div style="{CARD}; border-radius: 22px; padding: 18px; display: flex; gap: 14px; align-items: center">
          <svg width="40" height="50" viewBox="0 0 48 60" aria-hidden="true"><path d="{TOR}" fill="{{{{l.c}}}}"></path><text x="24" y="40" text-anchor="middle" font-size="20" font-weight="900" fill="#FFFFFF" font-family="Ravagh, Tahoma">{{{{l.n}}}}</text></svg>
          <div><b style="font-size: 26px; font-weight: 900">{{{{l.v}}}}</b><div style="font-size: 13px; color: #6C7290">{{{{l.t}}}}</div></div>
        </div>
      </sc-for>
    </div>
    <section style="display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 20px; align-items: start">
      <div style="{CARD}; border-radius: 28px; padding: 22px; display: flex; flex-direction: column; gap: 8px">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px"><h2 style="margin: 0; font-size: 19px; font-weight: 900">امامان</h2><label style="display: flex"><span style="position: absolute; width: 1px; height: 1px; overflow: hidden">جست‌وجو</span><input placeholder="جست‌وجوی نام یا مسجد" style="min-height: 40px; border: 1.5px solid #E4E7EF; border-radius: 12px; padding: 0 12px; font: inherit; font-size: 13px; width: 220px"></label></div>
        <sc-for list="{{{{imams}}}}" as="m" hint-placeholder-count="6">
          <div style="display: grid; grid-template-columns: 1.6fr 1fr 1.2fr auto; gap: 12px; align-items: center; padding: 12px 14px; border-radius: 16px; background: #F4F5F9; font-size: 14px">
            <span style="display: flex; flex-direction: column"><b style="font-weight: 800">{{{{m.n}}}}</b><span style="font-size: 12px; color: #6C7290">{{{{m.mosque}}}}</span></span>
            <span style="justify-self: start; padding: 4px 12px; border-radius: 999px; background: {{{{m.lbg}}}}; color: {{{{m.lc}}}}; font-size: 12px; font-weight: 800">{{{{m.level}}}}</span>
            <span style="display: flex; flex-direction: column; gap: 4px"><span style="font-size: 12px; color: #6C7290">گل امامت {{{{m.pfa}}}}</span><span style="height: 6px; border-radius: 3px; background: #E4E7EF"><span style="display: block; height: 100%; width: {{{{m.p}}}}; border-radius: 3px; background: #1E3A9E"></span></span></span>
            <button type="button" onClick="{{{{m.pick}}}}" style="min-height: 40px; padding: 0 14px; border-radius: 12px; border: 1.5px solid #1E3A9E; background: #FFFFFF; color: #1E3A9E; font: inherit; font-size: 13px; font-weight: 800; line-height: 1.4; cursor: pointer">ارزیابی</button>
          </div>
        </sc-for>
      </div>
      <div style="display: flex; flex-direction: column; gap: 16px">
        <div style="{CARD}; border-radius: 28px; padding: 22px; display: flex; flex-direction: column; gap: 12px">
          <span style="font-size: 12px; font-weight: 800; color: #B07800">ارزیابی میدانی</span>
          <b style="font-size: 18px; font-weight: 900">{{{{cur.n}}}}</b>
          <span style="font-size: 13px; color: #6C7290">سطح را پس از دیدار در مسجد تعیین کنید.</span>
          <div role="radiogroup" aria-label="سطح امام" style="display: flex; flex-direction: column; gap: 6px">
            <sc-for list="{{{{cur.opts}}}}" as="o" hint-placeholder-count="4">
              <button type="button" role="radio" aria-checked="{{{{o.on}}}}" onClick="{{{{o.pick}}}}" style="display: flex; align-items: center; gap: 10px; min-height: 48px; padding: 0 14px; border-radius: 14px; border: 1.5px solid {{{{o.border}}}}; background: {{{{o.bg}}}}; font: inherit; font-size: 14px; font-weight: 800; line-height: 1.4; color: #1B2150; cursor: pointer; text-align: right"><span style="width: 26px; height: 26px; border-radius: 50%; background: {{{{o.c}}}}; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 13px">{{{{o.n}}}}</span>{{{{o.t}}}}</button>
            </sc-for>
          </div>
          <label style="display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 800">یادداشت دیدار<textarea rows="3" style="border: 1.5px solid #E4E7EF; border-radius: 14px; padding: 10px 12px; font: inherit; font-size: 14px; resize: vertical"></textarea></label>
          <button type="button" style="min-height: 48px; border-radius: 14px; border: 0; background: #0E9F5A; color: #FFFFFF; font: inherit; font-weight: 800; line-height: 1.4; cursor: pointer">ثبت ارزیابی</button>
        </div>
        <div style="background: #FBE6EB; border-radius: 28px; padding: 20px; display: flex; flex-direction: column; gap: 6px">
          <b style="font-size: 15px; font-weight: 900; color: #A8314F">۵ گزارش ماهانه منتظر بازخورد</b>
          <span style="font-size: 13px; color: #3E4462">۳ مأموریت میدانی هم منتظر تأیید شماست.</span>
          <a href="#" style="font-size: 14px; font-weight: 800">بررسی گزارش‌ها</a>
        </div>
      </div>
    </section>
  </main>
</div>'''
script='''const LV = [['۱', 'امام جماعت', '#8C93B5'], ['۲', 'امام مسجد', '#D64A6A'], ['۳', 'امام محله', '#F08C1A'], ['۴', 'امام میانی', '#12A58E']];
const I = [
  ['حجت‌الاسلام حسنی', 'صاحب‌الزمان · باغ‌نو', 3, 64], ['حاج‌آقا کریمی', 'امام رضا · ساری', 2, 48], ['حاج‌آقا صادقی', 'جامع · گلوگاه', 1, 22],
  ['حجت‌الاسلام امینی', 'ابوالفضل · چالوس', 4, 86], ['حاج‌آقا رستمی', 'المهدی · نکا', 2, 41], ['حاج‌آقا موسوی', 'فاطمیه · بهشهر', 3, 58],
];
const SOFT = { '#8C93B5': '#EEF0F5', '#D64A6A': '#FBE6EB', '#F08C1A': '#FDEBC4', '#12A58E': '#D3EFEA' };
const INK = { '#8C93B5': '#3E4462', '#D64A6A': '#A8314F', '#F08C1A': '#8A5A00', '#12A58E': '#0B5F52' };
class Component extends DCLogic {
  renderVals() {
    const s = this.state || {};
    const who = s.who ?? 0;
    const lvl = s.lvl ?? I[who][2];
    const lv = LV.map(([n, t, c], k) => ({ n, t, c, v: ['۶', '۸', '۷', '۳'][k] }));
    const imams = I.map(([n, mosque, l, p], k) => {
      const c = LV[l - 1][2];
      return { n, mosque, level: 'سطح ' + LV[l - 1][0] + '، ' + LV[l - 1][1], lbg: SOFT[c], lc: INK[c], p: p + '%', pfa: '٪' + p.toLocaleString('fa-IR'), pick: () => this.setState({ who: k, lvl: undefined }) };
    });
    const cur = { n: I[who][0] + ' · ' + I[who][1], opts: LV.map(([n, t, c], k) => ({ n, t, c, on: k + 1 === lvl ? 'true' : 'false', border: k + 1 === lvl ? c : '#E4E7EF', bg: k + 1 === lvl ? SOFT[c] : '#FFFFFF', pick: () => this.setState({ lvl: k + 1 }) })) };
    return { lv, imams, cur };
  }
}'''
open('/home/claude/dz/project/Rahyar.dc.html','w').write(page('پنل راهیار', body, script, 1440, 1000))

AS=[('d','پیشخوان','#F5B700'),('c','دوره‌ها و درس‌ها','#F08C1A'),('p','مسیرهای یادگیری','#F08C1A'),('t','جعبه‌ابزار','#12A58E'),('e','برنامه‌ها و کلاس زنده','#D64A6A'),('k','پویش‌ها','#12A58E'),('u','کاربران و دسترسی‌ها','#1BA3C6'),('m','مساجد','#1BA3C6'),('r','راهیاران','#1BA3C6'),('g','گواهی‌ها','#8C93B5'),('b','اعلان همگانی','#8C93B5'),('s','پشتیبانی و بازخورد','#8C93B5'),('x','امنیت و رخدادها','#8C93B5')]
body=f'''<div style="{ROOT}; display: flex">
  {side('ستاد','مدیریت سامانه',AS,'d')}
  <main style="flex: 1; padding: 28px 32px; display: flex; flex-direction: column; gap: 20px; min-width: 0">
    <h1 style="margin: 0; font-size: 30px; font-weight: 900">پیشخوان ستاد</h1>
    <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px">
      <sc-for list="{{{{kpi}}}}" as="k" hint-placeholder-count="4">
        <div style="{CARD}; border-radius: 22px; padding: 18px 20px; display: flex; flex-direction: column; gap: 4px"><span style="font-size: 13px; color: #6C7290">{{{{k.t}}}}</span><b style="font-size: 30px; font-weight: 900">{{{{k.v}}}}</b><span style="font-size: 12px; font-weight: 800; color: #0A7A45">{{{{k.d}}}}</span></div>
      </sc-for>
    </div>
    <section style="display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 20px">
      <div style="{CARD}; border-radius: 28px; padding: 24px; display: flex; flex-direction: column; gap: 14px">
        <h2 style="margin: 0; font-size: 19px; font-weight: 900">امامان در چهار سطح</h2>
        <sc-for list="{{{{dist}}}}" as="d" hint-placeholder-count="4">
          <div style="display: grid; grid-template-columns: 110px 1fr 60px; gap: 12px; align-items: center; font-size: 14px"><b style="font-weight: 800">{{{{d.t}}}}</b><span style="height: 22px; border-radius: 6px; background: #F4F5F9"><span style="display: block; height: 100%; width: {{{{d.w}}}}; border-radius: 6px; background: {{{{d.c}}}}"></span></span><span style="text-align: left; font-weight: 800">{{{{d.v}}}}</span></div>
        </sc-for>
      </div>
      <div style="{CARD}; border-radius: 28px; padding: 24px; display: flex; flex-direction: column; gap: 10px">
        <h2 style="margin: 0 0 4px; font-size: 19px; font-weight: 900">نیازمند رسیدگی</h2>
        <sc-for list="{{{{todo}}}}" as="t" hint-placeholder-count="4">
          <a href="#" style="display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 0 14px; border-radius: 14px; background: #F4F5F9; text-decoration: none; color: #1B2150; font-size: 14px"><span style="min-width: 32px; height: 28px; border-radius: 8px; background: {{{{t.c}}}}; color: #FFFFFF; font-weight: 900; display: flex; align-items: center; justify-content: center">{{{{t.v}}}}</span><span style="flex: 1; font-weight: 700">{{{{t.t}}}}</span></a>
        </sc-for>
      </div>
    </section>
    <section style="{CARD}; border-radius: 28px; padding: 24px; display: flex; flex-direction: column; gap: 12px">
      <div style="display: flex; justify-content: space-between; align-items: center"><h2 style="margin: 0; font-size: 19px; font-weight: 900">دوره‌ها</h2><a href="#" style="display: inline-flex; align-items: center; min-height: 40px; padding: 0 16px; border-radius: 12px; background: #0E9F5A; color: #FFFFFF; font-size: 14px; font-weight: 800; text-decoration: none">دورهٔ تازه</a></div>
      <sc-for list="{{{{courses}}}}" as="c" hint-placeholder-count="4">
        <div style="display: grid; grid-template-columns: 2fr 1.4fr 0.8fr 0.8fr 0.8fr; gap: 12px; align-items: center; padding: 12px 14px; border-radius: 14px; background: #F4F5F9; font-size: 14px"><b style="font-weight: 800">{{{{c.t}}}}</b><span style="color: {{{{c.ink}}}}; font-weight: 800">{{{{c.petal}}}}</span><span>{{{{c.n}}}} درس</span><span>{{{{c.l}}}} یادگیرنده</span><span style="justify-self: start; padding: 3px 10px; border-radius: 999px; background: {{{{c.sbg}}}}; color: {{{{c.sc}}}}; font-size: 12px; font-weight: 800">{{{{c.s}}}}</span></div>
      </sc-for>
    </section>
  </main>
</div>'''
script='''class Component extends DCLogic {
  renderVals() {
    const kpi = [{ t: 'یادگیرندهٔ فعال', v: '۳٬۸۴۰', d: '۱۲٪+ این ماه' }, { t: 'مسجد', v: '۹۱۲', d: '۴۸ مسجد تازه' }, { t: 'دقیقهٔ یادگیری', v: '۲۱۴ هزار', d: '۹٪+' }, { t: 'گواهی صادرشده', v: '۱٬۱۰۶', d: '۲۱۰ این ماه' }];
    const dist = [['امام جماعت', 342, '#8C93B5'], ['امام مسجد', 288, '#D64A6A'], ['امام محله', 211, '#F08C1A'], ['امام میانی', 71, '#12A58E']].map(([t, v, c]) => ({ t, c, v: v.toLocaleString('fa-IR'), w: Math.round(v / 3.6) + '%' }));
    const todo = [{ v: '۱۴', t: 'تیکت پشتیبانی باز', c: '#D64A6A' }, { v: '۶', t: 'درخواست دسترسی راهیار', c: '#F08C1A' }, { v: '۳', t: 'دورهٔ منتظر انتشار', c: '#1E3A9E' }, { v: '۲', t: 'رخداد امنیتی برای بررسی', c: '#3E4462' }];
    const courses = [
      { t: 'شناسنامهٔ مسئلهٔ محله', petal: 'شناخت صحنه', ink: '#8A5A00', n: '۶', l: '۸۴۰', s: 'منتشرشده', sbg: '#E2F5EA', sc: '#0A7A45' },
      { t: 'شریکة‌الامام؛ میدان خواهران', petal: 'شریکة‌الامام', ink: '#A8314F', n: '۵', l: '۳۱۲', s: 'منتشرشده', sbg: '#E2F5EA', sc: '#0A7A45' },
      { t: 'تشکیلات مسجد', petal: 'بازوان اجرایی', ink: '#A8314F', n: '۶', l: '۰', s: 'پیش‌نویس', sbg: '#FFF2CC', sc: '#8A5A00' },
      { t: 'پلکان اخوت در مسجد', petal: 'ارکان اخوت', ink: '#0B5F52', n: '۷', l: '۱٬۲۰۴', s: 'منتشرشده', sbg: '#E2F5EA', sc: '#0A7A45' },
    ];
    return { kpi, dist, todo, courses };
  }
}'''
open('/home/claude/dz/project/Admin.dc.html','w').write(page('پنل ستاد', body, script, 1440, 1100))
