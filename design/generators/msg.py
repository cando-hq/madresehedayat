import sys; sys.path.insert(0,'/home/claude/dz/gen')
from common import *
body=f'''<div style="{ROOT}">
  {nav('home')}
  <main style="max-width: 1280px; margin: 0 auto; padding: 24px 32px 48px; display: grid; grid-template-columns: 380px minmax(0, 1fr); gap: 20px; align-items: start">
    <aside style="{CARD}; border-radius: 28px; overflow: hidden; display: flex; flex-direction: column; height: 760px">
      <div role="tablist" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; padding: 8px; border-bottom: 1px solid #E4E7EF">
        <sc-for list="{{{{tabs}}}}" as="t" hint-placeholder-count="3">
          <button type="button" role="tab" aria-selected="{{{{t.on}}}}" onClick="{{{{t.pick}}}}" style="min-height: 44px; border: 0; border-radius: 12px; background: {{{{t.bg}}}}; color: {{{{t.fg}}}}; font: inherit; font-size: 14px; font-weight: 800; line-height: 1.4; cursor: pointer">{{{{t.t}}}}</button>
        </sc-for>
      </div>
      <div style="flex: 1; overflow: auto; padding: 8px">
        <sc-for list="{{{{items}}}}" as="m" hint-placeholder-count="6">
          <a href="#" style="display: flex; gap: 12px; align-items: flex-start; padding: 12px; border-radius: 16px; background: {{{{m.bg}}}}; text-decoration: none; color: #1B2150">
            <span style="width: 44px; height: 44px; border-radius: 50%; background: {{{{m.av}}}}; color: {{{{m.avFg}}}}; display: flex; align-items: center; justify-content: center; font-weight: 900; flex: none">{{{{m.i}}}}</span>
            <span style="flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0">
              <span style="display: flex; justify-content: space-between; gap: 8px"><b style="font-size: 15px; font-weight: 800">{{{{m.n}}}}</b><span style="font-size: 12px; color: #6C7290; white-space: nowrap">{{{{m.when}}}}</span></span>
              <span style="font-size: 13px; color: #3E4462; line-height: 1.7">{{{{m.t}}}}</span>
            </span>
          </a>
        </sc-for>
      </div>
    </aside>

    <section aria-label="گفت‌وگو با راهیار" style="{CARD}; border-radius: 28px; display: flex; flex-direction: column; height: 760px; overflow: hidden">
      <div style="padding: 16px 22px; border-bottom: 1px solid #E4E7EF; display: flex; align-items: center; gap: 12px">
        <span style="width: 46px; height: 46px; border-radius: 50%; background: #E1F3F6; color: #1D7F92; display: flex; align-items: center; justify-content: center; font-weight: 900">م</span>
        <div style="flex: 1"><b style="font-size: 16px; font-weight: 900">حجت‌الاسلام محمدی</b><div style="font-size: 13px; color: #6C7290">راهیار شما</div></div>
      </div>
      <div style="flex: 1; overflow: auto; padding: 22px; display: flex; flex-direction: column; gap: 14px; background: #FBFAF6">
        <sc-for list="{{{{thread}}}}" as="b" hint-placeholder-count="5">
          <div style="align-self: {{{{b.side}}}}; max-width: 70%; padding: 12px 16px; border-radius: 18px; background: {{{{b.bg}}}}; color: {{{{b.fg}}}}; font-size: 15px; line-height: 1.9">{{{{b.t}}}}<div style="font-size: 11px; opacity: 0.7; margin-top: 4px">{{{{b.when}}}}</div></div>
        </sc-for>
        <div style="align-self: flex-end; max-width: 70%; padding: 14px 16px; border-radius: 18px; background: #FFFFFF; border: 1.5px solid #E4E7EF; display: flex; gap: 12px; align-items: center">
          <svg width="32" height="40" viewBox="0 0 48 60" aria-hidden="true"><path d="{TOR}" fill="#F08C1A"></path></svg>
          <div style="flex: 1"><b style="font-size: 14px; font-weight: 800">دورهٔ تازه برای شما تعیین شد</b><div style="font-size: 13px; color: #6C7290">از ریشه تا وضع مطلوب · مهلت ۱۰ آذر</div></div>
          <a href="Course.dc.html" style="font-size: 13px; font-weight: 800">دیدن</a>
        </div>
      </div>
      <div style="padding: 12px; border-top: 1px solid #E4E7EF; display: flex; gap: 8px">
        <button type="button" aria-label="پیوست" style="width: 48px; height: 48px; border-radius: 14px; border: 1.5px solid #E4E7EF; background: #FFFFFF; color: #3E4462; display: flex; align-items: center; justify-content: center; cursor: pointer"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12 l-8 8 a5 5 0 0 1-7-7 l9-9 a3 3 0 0 1 4 4 l-9 9 a1 1 0 0 1-2-2 l8-8"></path></svg></button>
        <button type="button" aria-label="پیام صوتی" style="width: 48px; height: 48px; border-radius: 14px; border: 1.5px solid #E4E7EF; background: #FFFFFF; color: #3E4462; display: flex; align-items: center; justify-content: center; cursor: pointer"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 3 a3 3 0 0 1 3 3 v6 a3 3 0 0 1-6 0 v-6 a3 3 0 0 1 3-3 M5 11 a7 7 0 0 0 14 0 M12 18 v3"></path></svg></button>
        <label style="flex: 1; display: flex"><span style="position: absolute; width: 1px; height: 1px; overflow: hidden">پیام</span><input placeholder="پیام به راهیار…" style="flex: 1; min-height: 48px; border: 1.5px solid #E4E7EF; border-radius: 14px; padding: 0 14px; font: inherit; font-size: 14px"></label>
        <button type="button" style="min-height: 48px; padding: 0 22px; border-radius: 14px; border: 0; background: #1E3A9E; color: #FFFFFF; font: inherit; font-weight: 800; line-height: 1.4; cursor: pointer">فرستادن</button>
      </div>
    </section>
  </main>
</div>'''
script='''class Component extends DCLogic {
  renderVals() {
    const tab = (this.state && this.state.tab) || 'msg';
    const tabs = [['msg', 'پیام‌ها'], ['notif', 'اعلان‌ها · ۲'], ['help', 'پشتیبانی']].map(([k, t]) => ({ t, on: k === tab ? 'true' : 'false', bg: k === tab ? '#1B2150' : 'transparent', fg: k === tab ? '#FFFFFF' : '#3E4462', pick: () => this.setState({ tab: k }) }));
    const A = (i, av, avFg) => ({ i, av, avFg });
    const L = {
      msg: [
        { ...A('م', '#E1F3F6', '#1D7F92'), n: 'حجت‌الاسلام محمدی', t: 'گزارش ماهانه را دیدم؛ عالی بود. یک نکته دربارهٔ…', when: '۱۰:۱۲', bg: '#EAEFFC' },
        { ...A('ت', '#FFF2CC', '#8A5A00'), n: 'تیم مسجد صاحب‌الزمان', t: 'مهدی: صندلی‌ها را برای جمعه گرفتم', when: 'دیروز', bg: 'transparent' },
        { ...A('ه', '#FDEBC4', '#8A5A00'), n: 'هم‌دوره‌ای‌های شناسنامه', t: 'کسی کاربرگ درس ۳ را دارد؟', when: 'دیروز', bg: 'transparent' },
        { ...A('ش', '#FBE6EB', '#A8314F'), n: 'حلقهٔ شریکة‌الامام‌ها', t: 'خانم نوری: فایل جلسه را گذاشتم', when: 'شنبه', bg: 'transparent' },
      ],
      notif: [
        { ...A('●', '#FBE6EB', '#D64A6A'), n: 'کلاس زنده تا ۳۰ دقیقهٔ دیگر', t: 'اخلاق امامت محله · جلسهٔ ۵', when: '۲۰:۳۰', bg: '#FBE6EB' },
        { ...A('✓', '#E2F5EA', '#0A7A45'), n: 'مأموریت شما تأیید شد', t: 'راهیار گفت‌وگو با سه خانواده را تأیید کرد', when: '۹:۴۰', bg: '#E2F5EA' },
        { ...A('پ', '#D3EFEA', '#0B5F52'), n: 'پویش تازه', t: 'هر مسجد، یک کتابخانهٔ محله', when: 'دیروز', bg: 'transparent' },
        { ...A('گ', '#EAEFFC', '#1E3A9E'), n: 'گواهی صادر شد', t: 'پلکان اخوت در مسجد', when: '۱۹ آبان', bg: 'transparent' },
      ],
      help: [
        { ...A('؟', '#EAEFFC', '#1E3A9E'), n: 'راهنمای سامانه', t: 'پاسخ پرسش‌های پرتکرار', when: '', bg: 'transparent' },
        { ...A('ت', '#FFF2CC', '#8A5A00'), n: 'تیکت: صدای کلاس قطع می‌شد', t: 'پاسخ داده شد · بسته', when: '۱۲ آبان', bg: 'transparent' },
        { ...A('+', '#E2F5EA', '#0A7A45'), n: 'درخواست پشتیبانی تازه', t: 'مشکل فنی، پرسش آموزشی یا پیشنهاد', when: '', bg: 'transparent' },
      ],
    };
    const me = { side: 'flex-start', bg: '#1E3A9E', fg: '#FFFFFF' }, him = { side: 'flex-end', bg: '#FFFFFF', fg: '#1B2150' };
    const thread = [
      { ...me, t: 'سلام حاج‌آقا. گزارش ماهانهٔ آبان را فرستادم، با عکس‌های جلسهٔ خانواده‌ها.', when: 'دیروز ۲۲:۰۵' },
      { ...him, t: 'سلام علیکم. دیدم؛ عالی بود. ریشه‌ای که پیدا کردید دقیق است.', when: '۱۰:۱۰' },
      { ...him, t: 'برای قدم بعد، درس «از ریشه تا وضع مطلوب» را برایتان گذاشتم. ۱۸ آذر هم برای ارزیابی میدانی به مسجد می‌آیم.', when: '۱۰:۱۲' },
    ];
    return { tabs, items: L[tab], thread };
  }
}'''
open('/home/claude/dz/project/Messages.dc.html','w').write(page('پیام‌ها و اعلان‌ها', body, script, 1440, 900))
