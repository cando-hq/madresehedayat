import sys; sys.path.insert(0,'/home/claude/dz/gen')
from common import *
body=f'''<div style="{ROOT}">
  {nav('camp')}
  <main style="max-width: 1280px; margin: 0 auto; padding: 28px 32px 64px; display: flex; flex-direction: column; gap: 24px">
    <section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 460px), 1fr)); border-radius: 32px; overflow: hidden; background: #0B5F52; color: #FFFFFF">
      <div style="padding: 40px 44px; display: flex; flex-direction: column; gap: 16px; justify-content: center">
        <span style="align-self: flex-start; padding: 6px 14px; border-radius: 999px; background: rgba(255,255,255,0.16); font-size: 13px; font-weight: 800">پویش ملی · ۱۲ روز مانده</span>
        <h1 style="margin: 0; font-size: 40px; font-weight: 900; line-height: 1.35">هر مسجد، یک کتابخانهٔ محله</h1>
        <div style="display: flex; gap: 28px; flex-wrap: wrap">
          <div><b style="font-size: 32px; font-weight: 900">۳۸۰</b><div style="font-size: 13px; color: #BFE7DE">مسجد همراه</div></div>
          <div><b style="font-size: 32px; font-weight: 900">۱۲٬۴۰۰</b><div style="font-size: 13px; color: #BFE7DE">کتاب اهدایی</div></div>
          <div><b style="font-size: 32px; font-weight: 900">۹۴</b><div style="font-size: 13px; color: #BFE7DE">کتابخانهٔ افتتاح‌شده</div></div>
        </div>
        <div style="background: #FFFFFF; color: #1B2150; border-radius: 22px; padding: 20px; display: flex; flex-direction: column; gap: 12px">
          <div style="display: flex; justify-content: space-between; font-size: 13px"><b style="font-weight: 800; color: #0B5F52">سهم مسجد شما</b><span style="color: #6C7290">۳ از ۴ گام</span></div>
          <sc-for list="{{{{mine}}}}" as="m" hint-placeholder-count="4">
            <div style="display: flex; align-items: center; gap: 12px; font-size: 14px">
              <span style="width: 26px; height: 26px; border-radius: 50%; background: {{{{m.bg}}}}; color: #FFFFFF; display: flex; align-items: center; justify-content: center; flex: none"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="{{{{m.i}}}}"></path></svg></span>
              <span style="flex: 1; font-weight: {{{{m.w}}}}">{{{{m.t}}}}</span>
            </div>
          </sc-for>
          <a href="#" style="display: flex; align-items: center; justify-content: center; min-height: 48px; border-radius: 14px; background: #0E9F5A; color: #FFFFFF; font-weight: 800; text-decoration: none">ثبت گزارش و عکس افتتاح</a>
        </div>
      </div>
      <div style="position: relative; min-height: 420px; background: #0E7564; display: flex; align-items: center; justify-content: center">
        <img src="/_blob/2ff13929c011011919bb4b0400b4e99a" alt="" style="width: 86%; max-width: 480px; height: auto; border-radius: 24px; opacity: 0.95">
      </div>
    </section>

    <section aria-labelledby="c-h" style="display: flex; flex-direction: column; gap: 14px">
      <h2 id="c-h" style="margin: 0; font-size: 24px; font-weight: 900">پویش‌های دیگر</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px">
        <sc-for list="{{{{camps}}}}" as="c" hint-placeholder-count="3">
          <a href="#" style="{CARD}; padding: 22px; display: flex; flex-direction: column; gap: 12px; text-decoration: none; color: #1B2150">
            <div style="display: flex; justify-content: space-between; align-items: center">
              <svg width="36" height="45" viewBox="0 0 48 60" aria-hidden="true"><path d="{TOR}" fill="{{{{c.c}}}}"></path></svg>
              <span style="padding: 4px 12px; border-radius: 999px; background: {{{{c.sbg}}}}; color: {{{{c.sc}}}}; font-size: 12px; font-weight: 800">{{{{c.state}}}}</span>
            </div>
            <b style="font-size: 18px; font-weight: 900; line-height: 1.5">{{{{c.t}}}}</b>
            <span style="font-size: 13px; color: #6C7290">{{{{c.k}}}}</span>
            <div style="height: 8px; border-radius: 4px; background: #EEF0F5"><div style="height: 100%; width: {{{{c.p}}}}; border-radius: 4px; background: {{{{c.c}}}}"></div></div>
          </a>
        </sc-for>
      </div>
    </section>
  </main>
</div>'''
script='''const OK = 'M5 12 l5 5 l9-10';
class Component extends DCLogic {
  renderVals() {
    const mine = [
      { t: 'اعلام همراهی مسجد', done: 1 }, { t: 'جمع کردن ۱۰۰ کتاب از خانواده‌ها', done: 1 }, { t: 'تعیین مسئول کتابخانه از نوجوانان', done: 1 }, { t: 'افتتاح و ثبت گزارش', done: 0 },
    ].map((m) => ({ t: m.t, bg: m.done ? '#0E9F5A' : '#C9CEDC', i: m.done ? OK : 'M12 7 v6 M12 17 v0.01', w: m.done ? 500 : 800 }));
    const camps = [
      { t: 'سفرهٔ اطعام محله در دههٔ فجر', k: 'استانی · ۱۴۰ مسجد', state: 'ثبت‌نام باز', p: '35%', c: '#F5B700', sbg: '#FFF2CC', sc: '#8A5A00' },
      { t: 'نماز صبح جماعت نوجوانان', k: 'ملی · ۲۱۰ مسجد', state: 'همراه هستید', p: '68%', c: '#D64A6A', sbg: '#E2F5EA', sc: '#0A7A45' },
      { t: 'آشتی‌کنان همسایه‌ها', k: 'شهرستانی · ۴۸ مسجد', state: 'پایان یافته', p: '100%', c: '#12A58E', sbg: '#F4F5F9', sc: '#6C7290' },
    ];
    return { mine, camps };
  }
}'''
open('/home/claude/dz/project/Campaigns.dc.html','w').write(page('پویش‌ها', body, script, 1440, 1100))
