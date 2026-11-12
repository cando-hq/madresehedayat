import sys; sys.path.insert(0,'/home/claude/dz/gen')
from common import *
body=f'''<div style="{ROOT}">
  {nav('events')}
  <main style="max-width: 1280px; margin: 0 auto; padding: 28px 32px 64px; display: flex; flex-direction: column; gap: 24px">
    <div style="display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap">
      <div><h1 style="margin: 0; font-size: 34px; font-weight: 900">برنامه‌ها</h1><p style="margin: 4px 0 0; color: #6C7290; font-size: 15px">کلاس‌های زنده، برنامه‌های حضوری و دورهمی‌های آنلاین</p></div>
      <div role="tablist" aria-label="نوع برنامه" style="display: flex; gap: 6px; background: #FFFFFF; border: 1px solid #E4E7EF; border-radius: 16px; padding: 6px">
        <sc-for list="{{{{kinds}}}}" as="k" hint-placeholder-count="4">
          <button type="button" role="tab" aria-selected="{{{{k.on}}}}" onClick="{{{{k.pick}}}}" style="min-height: 40px; padding: 0 16px; border: 0; border-radius: 12px; background: {{{{k.bg}}}}; color: {{{{k.fg}}}}; font: inherit; font-size: 14px; font-weight: 800; line-height: 1.4; cursor: pointer">{{{{k.t}}}}</button>
        </sc-for>
      </div>
    </div>

    <section style="display: grid; grid-template-columns: minmax(0, 1fr) 400px; gap: 20px; align-items: start">
      <div style="display: flex; flex-direction: column; gap: 12px">
        <sc-for list="{{{{list}}}}" as="e" hint-placeholder-count="6">
          <a href="{{{{e.href}}}}" style="{CARD}; border-radius: 22px; padding: 16px 18px; display: flex; gap: 18px; align-items: center; text-decoration: none; color: #1B2150">
            <span style="width: 72px; flex: none; border-radius: 16px; background: {{{{e.soft}}}}; color: {{{{e.ink}}}}; display: flex; flex-direction: column; align-items: center; padding: 10px 0"><b style="font-size: 26px; font-weight: 900; line-height: 1.2">{{{{e.d}}}}</b><span style="font-size: 12px; font-weight: 800">{{{{e.m}}}}</span></span>
            <span style="flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0">
              <span style="font-size: 12px; font-weight: 800; color: {{{{e.ink}}}}">{{{{e.kind}}}}</span>
              <b style="font-size: 17px; font-weight: 900">{{{{e.t}}}}</b>
              <span style="font-size: 13px; color: #6C7290">{{{{e.where}}}}</span>
            </span>
            <span style="padding: 6px 14px; border-radius: 999px; background: {{{{e.sbg}}}}; color: {{{{e.sc}}}}; font-size: 13px; font-weight: 800; white-space: nowrap">{{{{e.state}}}}</span>
          </a>
        </sc-for>
      </div>

      <aside aria-label="جزئیات برنامه" style="display: flex; flex-direction: column; gap: 16px; position: sticky; top: 16px">
        <div style="{CARD}; border-radius: 28px; overflow: hidden">
          <div class="ev" role="img" aria-label="حیاط مسجد در شب" style="height: 170px"></div>
          <div style="padding: 22px; display: flex; flex-direction: column; gap: 12px">
            <span style="font-size: 12px; font-weight: 800; color: #1E3A9E">برنامهٔ حضوری · مسجد صاحب‌الزمان</span>
            <h2 style="margin: 0; font-size: 22px; font-weight: 900; line-height: 1.5">جشن نیمه‌شب نوجوانان</h2>
            <ul style="margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 8px; font-size: 14px">
              <li style="display: flex; justify-content: space-between"><span style="color: #6C7290">زمان</span><b style="font-weight: 800">جمعه ۲۴ آبان، ۲۰:۰۰</b></li>
              <li style="display: flex; justify-content: space-between"><span style="color: #6C7290">ظرفیت</span><b style="font-weight: 800">۶۲ از ۸۰</b></li>
              <li style="display: flex; justify-content: space-between"><span style="color: #6C7290">مسئول</span><b style="font-weight: 800">آقا مهدی، بازوی اجرایی</b></li>
            </ul>
            <div style="height: 8px; border-radius: 4px; background: #EEF0F5"><div style="width: 77%; height: 100%; border-radius: 4px; background: #1E3A9E"></div></div>
            <a href="#" style="display: flex; align-items: center; justify-content: center; min-height: 52px; border-radius: 16px; background: #0E9F5A; color: #FFFFFF; font-weight: 800; font-size: 16px; text-decoration: none">ثبت‌نام</a>
          </div>
        </div>
        <div style="background: #1B2150; color: #FFFFFF; border-radius: 28px; padding: 22px; display: flex; gap: 18px; align-items: center">
          <svg width="96" height="96" viewBox="0 0 21 21" aria-label="کد ورود به برنامه" role="img" style="background: #FFFFFF; border-radius: 12px; padding: 6px; flex: none"><path d="M0 0h7v7h-7z M2 2h3v3h-3z M14 0h7v7h-7z M16 2h3v3h-3z M0 14h7v7h-7z M2 16h3v3h-3z M9 0h2v2h-2z M9 4h3v2h-3z M8 8h2v2h-2z M12 8h3v2h-3z M17 9h4v2h-4z M9 12h2v3h-2z M13 13h3v2h-3z M18 13h3v3h-3z M9 17h3v2h-3z M14 17h2v4h-2z M18 18h3v3h-3z" fill="#1B2150" fill-rule="evenodd"></path></svg>
          <div style="display: flex; flex-direction: column; gap: 6px"><b style="font-size: 16px; font-weight: 900">بلیت شما برای کارگاه روایت</b><span style="font-size: 13px; color: #C9D3F5; line-height: 1.8">دم در، مسئول برنامه این کد را اسکن می‌کند و حضورتان ثبت می‌شود.</span></div>
        </div>
      </aside>
    </section>
  </main>
</div>'''
css='.ev{background-image:url(/_blob/702a4dfcbc9ca7da3287d181fdf527c9);background-size:cover;background-position:50% 70%}'
script='''const E = [
  ['live', '۲۰', 'آبان', 'کلاس زنده', 'اخلاق امامت محله · جلسهٔ ۵', 'آنلاین، ۲۱:۰۰ · استاد رحیمی', 'زنده است', 'Live.dc.html'],
  ['site', '۲۴', 'آبان', 'برنامهٔ حضوری', 'جشن نیمه‌شب نوجوانان', 'مسجد صاحب‌الزمان · ۶۲ ثبت‌نام', 'ثبت‌نام باز', 'Events.dc.html'],
  ['site', '۲۸', 'آبان', 'برنامهٔ حضوری', 'کارگاه روایت‌نویسی', 'حسینیهٔ ارشاد بهشهر · ۳ ساعت', 'ثبت‌نام کرده‌اید', 'Events.dc.html'],
  ['online', '۱', 'آذر', 'دورهمی آنلاین', 'هم‌اندیشی شریکة‌الامام‌ها', 'آنلاین · ویژهٔ خواهران', 'یادآوری فعال', 'Events.dc.html'],
  ['live', '۴', 'آذر', 'کلاس زنده', 'تشکیلات مسجد · جلسهٔ ۲', 'آنلاین، ۲۰:۳۰', 'یادآوری', 'Live.dc.html'],
  ['site', '۱۰', 'آذر', 'برنامهٔ حضوری', 'اردوی یک‌روزهٔ بازوان', 'کوهپایهٔ میانکاله', 'به‌زودی', 'Events.dc.html'],
];
const K = { live: ['#FBE6EB', '#A8314F'], site: ['#EAEFFC', '#1E3A9E'], online: ['#D3EFEA', '#0B5F52'] };
const ST = { 'زنده است': ['#D64A6A', '#FFFFFF'], 'ثبت‌نام کرده‌اید': ['#E2F5EA', '#0A7A45'], 'ثبت‌نام باز': ['#FFF2CC', '#8A5A00'] };
class Component extends DCLogic {
  renderVals() {
    const sel = (this.state && this.state.k) || 'all';
    const kinds = [['all', 'همه'], ['live', 'کلاس زنده'], ['site', 'حضوری'], ['online', 'آنلاین']].map(([k, t]) => ({ t, on: k === sel ? 'true' : 'false', bg: k === sel ? '#1B2150' : 'transparent', fg: k === sel ? '#FFFFFF' : '#3E4462', pick: () => this.setState({ k }) }));
    const list = E.filter((e) => sel === 'all' || e[0] === sel).map(([k, d, m, kind, t, where, state, href]) => {
      const s = ST[state] || ['#F4F5F9', '#3E4462'];
      return { d, m, kind, t, where, state, href, soft: K[k][0], ink: K[k][1], sbg: s[0], sc: s[1] };
    });
    return { kinds, list };
  }
}'''
open('/home/claude/dz/project/Events.dc.html','w').write(page('برنامه‌ها', body, script, 1440, 1000, css))
