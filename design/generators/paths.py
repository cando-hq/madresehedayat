import sys; sys.path.insert(0,'/home/claude/dz/gen')
from common import *
MEDIA_JS = '''const MI = {
  v: ['ویدیو', 'M8 5v14l11-7z', '#EAEFFC', '#1E3A9E'],
  a: ['صوتی', 'M12 3 a3 3 0 0 1 3 3 v6 a3 3 0 0 1-6 0 v-6 a3 3 0 0 1 3-3 M5 11 a7 7 0 0 0 14 0 M12 18 v3', '#E1F3F6', '#1D7F92'],
  b: ['کتاب و متن', 'M4 4 h7 a2 2 0 0 1 2 2 v15 a2 2 0 0 0-2-2 h-7z M22 4 h-7 a2 2 0 0 0-2 2 v15 a2 2 0 0 1 2-2 h7z', '#F4F5F9', '#3E4462'],
  l: ['کلاس زنده', 'M2 12 a10 10 0 0 1 20 0 M6 12 a6 6 0 0 1 12 0 M12 12 v8', '#FBE6EB', '#A8314F'],
  w: ['کاربرگ و تمرین', 'M6 3 h9 l4 4 v14 h-13z M9 12 h6 M9 16 h6', '#FFF2CC', '#8A5A00'],
  d: ['مستند', 'M3 6 h18 v12 h-18z M10 9 l5 3 l-5 3z', '#D3EFEA', '#0B5F52'],
};
const media = (s) => s.split('').map((k) => ({ t: MI[k][0], i: MI[k][1], bg: MI[k][2], c: MI[k][3] }));
const fa = (n) => n.toLocaleString('fa-IR');
'''
CHIP = '<sc-for list="{{%s}}" as="m" hint-placeholder-count="3"><span style="display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 999px; background: {{m.bg}}; color: {{m.c}}; font-size: 12px; font-weight: 800"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="{{m.i}}"></path></svg>{{m.t}}</span></sc-for>'
def filt(listname, n):
    return f'''<sc-for list="{{{{{listname}}}}}" as="f" hint-placeholder-count="{n}">
          <button type="button" onClick="{{{{f.pick}}}}" aria-pressed="{{{{f.on}}}}" style="min-height: 44px; padding: 0 16px; border-radius: 999px; border: 1.5px solid {{{{f.border}}}}; background: {{{{f.bg}}}}; color: {{{{f.fg}}}}; font: inherit; font-size: 14px; font-weight: 800; line-height: 1.4; cursor: pointer">{{{{f.t}}}}</button>
        </sc-for>'''
FILT_JS = '''const chips = (opts, sel, key, self) => opts.map(([k, t]) => ({ t, on: k === sel ? 'true' : 'false', bg: k === sel ? '#1B2150' : '#FFFFFF', fg: k === sel ? '#FFFFFF' : '#1B2150', border: k === sel ? '#1B2150' : '#E4E7EF', pick: () => self.setState({ [key]: k }) }));
'''
# ---------- Paths
body=f'''<div style="{ROOT}">
  {nav('learn')}
  <main style="max-width: 1280px; margin: 0 auto; padding: 28px 32px 64px; display: flex; flex-direction: column; gap: 22px">
    <section style="display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; flex-wrap: wrap">
      <div><h1 style="margin: 0; font-size: 36px; font-weight: 900">مسیرهای آموزشی</h1><p style="margin: 4px 0 0; color: #6C7290; font-size: 15px">هر مسیر چند دورهٔ پشت‌سرهم است؛ با ویدیو، صوت، کتاب، کلاس زنده و تمرین، و در پایان آزمون و گواهی.</p></div>
      <div role="group" aria-label="مخاطب" style="display: flex; gap: 8px; flex-wrap: wrap">
        {filt('aud', 4)}
      </div>
    </section>

    <section style="display: grid; grid-template-columns: minmax(0, 1fr) 440px; gap: 22px; align-items: start">
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px">
        <sc-for list="{{{{paths}}}}" as="p" hint-placeholder-count="8">
          <button type="button" onClick="{{{{p.pick}}}}" aria-pressed="{{{{p.on}}}}" style="text-align: right; font: inherit; color: #1B2150; cursor: pointer; background: #FFFFFF; border: 2px solid {{{{p.border}}}}; border-radius: 26px; padding: 0; overflow: hidden; display: flex; flex-direction: column">
            <span style="height: 110px; background: {{{{p.c}}}}; display: flex; align-items: center; justify-content: space-between; padding: 0 20px">
              <svg width="56" height="70" viewBox="0 0 48 60" aria-hidden="true"><path d="{TOR}" fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.85)" stroke-width="1.2"></path><path d="{{{{p.icon}}}}" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" transform="translate(12 18)"></path></svg>
              <span style="padding: 4px 12px; border-radius: 999px; background: rgba(255,255,255,0.92); color: {{{{p.ink}}}}; font-size: 12px; font-weight: 800; line-height: 1.6">{{{{p.tag}}}}</span>
            </span>
            <span style="padding: 16px 18px 18px; display: flex; flex-direction: column; gap: 8px; width: 100%; box-sizing: border-box">
              <b style="font-size: 18px; font-weight: 900; line-height: 1.5">{{{{p.t}}}}</b>
              <span style="font-size: 13px; color: #6C7290; line-height: 1.6">{{{{p.meta}}}}</span>
              <span style="display: flex; align-items: center; gap: 10px"><span style="flex: 1; height: 6px; border-radius: 3px; background: #EEF0F5"><span style="display: block; height: 100%; width: {{{{p.pct}}}}; border-radius: 3px; background: {{{{p.c}}}}"></span></span><span style="font-size: 12px; font-weight: 800; color: {{{{p.ink}}}}">{{{{p.state}}}}</span></span>
            </span>
          </button>
        </sc-for>
      </div>

      <aside aria-label="جزئیات مسیر" style="{CARD}; border-radius: 30px; overflow: hidden; position: sticky; top: 16px">
        <div style="background: {{{{cur.c}}}}; color: #FFFFFF; padding: 26px; display: flex; flex-direction: column; gap: 8px">
          <span style="font-size: 13px; font-weight: 800; opacity: 0.9">{{{{cur.tag}}}} · {{{{cur.aud}}}}</span>
          <h2 style="margin: 0; font-size: 26px; font-weight: 900; line-height: 1.4">{{{{cur.t}}}}</h2>
          <span style="font-size: 14px; line-height: 1.8; opacity: 0.95">{{{{cur.d}}}}</span>
        </div>
        <ol style="list-style: none; margin: 0; padding: 18px 22px 8px; display: flex; flex-direction: column">
          <sc-for list="{{{{cur.steps}}}}" as="s" hint-placeholder-count="5">
            <li style="display: flex; gap: 14px">
              <span style="display: flex; flex-direction: column; align-items: center; flex: none">
                <span style="width: 34px; height: 34px; border-radius: 50%; background: {{{{s.dot}}}}; color: {{{{s.dotFg}}}}; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 14px">{{{{s.n}}}}</span>
                <span style="width: 2px; flex: 1; min-height: 14px; background: #E4E7EF; display: {{{{s.line}}}}"></span>
              </span>
              <a href="Course.dc.html" style="flex: 1; padding-bottom: 16px; text-decoration: none; color: #1B2150; display: flex; flex-direction: column; gap: 6px">
                <b style="font-size: 15px; font-weight: 800; line-height: 1.6">{{{{s.t}}}}</b>
                <span style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center">{CHIP % 's.media'}<span style="font-size: 12px; color: #6C7290">{{{{s.dur}}}}</span></span>
              </a>
            </li>
          </sc-for>
        </ol>
        <div style="margin: 0 22px; padding: 14px 16px; border-radius: 16px; background: #F4F5F9; display: flex; gap: 12px; align-items: center">
          <svg width="30" height="38" viewBox="0 0 48 60" aria-hidden="true"><path d="{TOR}" fill="{{{{cur.c}}}}"></path><path d="M16 32 l6 6 l10-12" fill="none" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
          <span style="font-size: 14px; line-height: 1.7"><b style="font-weight: 800">آزمون پایانی و گواهی مسیر</b><br><span style="color: #6C7290">در کارنامه و گل امامت ثبت می‌شود</span></span>
        </div>
        <div style="padding: 18px 22px 22px">
          <a href="Course.dc.html" style="display: flex; align-items: center; justify-content: center; min-height: 52px; border-radius: 16px; background: #0E9F5A; color: #FFFFFF; font-weight: 800; font-size: 16px; text-decoration: none">{{{{cur.cta}}}}</a>
        </div>
      </aside>
    </section>
  </main>
</div>'''
script = MEDIA_JS + FILT_JS + '''const IC = {
  start: 'M5 12 h14 M13 6 l6 6 l-6 6', prob: 'M10 4 a7 7 0 1 0 0.01 0 M15 15 l6 6', team: 'M8 9 a3 3 0 1 0 0.01 0 M16 9 a3 3 0 1 0 0.01 0 M2 21 c0-4 3-6 6-6 s6 2 6 6 M12 21 c0-4 3-6 6-6',
  talk: 'M3 5 h14 v10 h-8 l-5 4 v-4 h-1z', heart: 'M12 21 s-8-5-8-11 a4 4 0 0 1 8-1 a4 4 0 0 1 8 1 c0 6-8 11-8 11z', book: 'M4 4 h7 a2 2 0 0 1 2 2 v15 a2 2 0 0 0-2-2 h-7z M22 4 h-7 a2 2 0 0 0-2 2 v15 a2 2 0 0 1 2-2 h7z',
  link: 'M9 15 l6-6 M10 6 l2-2 a4 4 0 0 1 6 6 l-2 2 M14 18 l-2 2 a4 4 0 0 1-6-6 l2-2', coin: 'M12 3 a9 9 0 1 0 0.01 0 M12 7 v10 M9 9.5 c0-1.5 6-1.5 6 0 c0 3-6 2-6 5 c0 1.5 6 1.5 6 0',
};
const P = [
  { id: 'start', aud: 'imam', t: 'آغاز امامت محله', tag: 'مسیر پایه', c: '#1E3A9E', ink: '#1E3A9E', icon: IC.start, pct: 62, d: 'چهار مهارتی که همهٔ امامان از آن گفته‌اند؛ از نخستین سلام تا حل نخستین مسئلهٔ محله.',
    steps: [['مهارت‌های ارتباطی و جذب مردم به مسجد', 'vaw', '۳ ساعت', 2], ['مدیریت مسجد؛ رابطه با هیئت امنا و نهادها', 'vbw', '۳ ساعت', 2], ['جذب نوجوانان و جوانان', 'vdw', '۳ ساعت', 1], ['حل مسئله؛ از علامت تا ریشه', 'vaw', '۳ ساعت', 0]] },
  { id: 'prob', aud: 'imam', t: 'حل مسئلهٔ محله', tag: 'به پا داشتن مردم', c: '#F08C1A', ink: '#8A5A00', icon: IC.prob, pct: 35, d: 'روش آزمودهٔ محله پیشرفت: بوم مسئله، پنج چرا، شناسنامهٔ محله و روایت پیشرفت.',
    steps: [['حل مسئله؛ از علامت تا ریشه', 'vaw', '۳ ساعت', 2], ['بوم مسئله و پنج چرا؛ کارگاه', 'lw', '۲ ساعت', 1], ['شناسنامهٔ محله و ظرفیت‌شناسی', 'vbw', '۵ درس', 0], ['نفر سوم؛ حلقهٔ میانی و به میدان آوردن مردم', 'vab', '۶ درس', 0], ['روایت پیشرفت محله', 'vdw', '۴ درس', 0]] },
  { id: 'team', aud: 'all', t: 'تیم و تشکیلات مسجد', tag: 'نهاد امامت', c: '#D64A6A', ink: '#A8314F', icon: IC.team, pct: 0, d: 'هر کار بی‌کادر با رفتن امام می‌میرد؛ از کشف استعداد تا جانشین‌پروری.',
    steps: [['تیم‌سازی و کادرسازی', 'vaw', '۳ ساعت', 0], ['گعده‌داری؛ رشد در جمع همتا', 'ab', '۵ درس', 0], ['دایرهٔ نقش‌ها و جدول نوبت', 'w', 'تمرین', 0], ['ظرفیت بانوان و همراهی شریکة‌الامام', 'vd', '۴ درس', 0]] },
  { id: 'tabyin', aud: 'all', t: 'جهاد تبیین و روایت', tag: 'تبیین و گفتمان', c: '#F5B700', ink: '#8A5A00', icon: IC.talk, pct: 15, d: 'مخاطب امروز گفت‌وگو می‌خواهد نه خطابه؛ از پاسخ به پرسش‌ها تا رسانهٔ محله و قبس.',
    steps: [['گفت‌وگو و پاسخ به پرسش‌ها', 'vaw', '۳ ساعت', 1], ['روایت و رسانهٔ مسجد در فضای مجازی', 'vw', '۳ ساعت', 0], ['قبس؛ روشنگری در گروه‌ها و صفحه‌ها', 'al', '۱۷ قسمت صوتی', 0], ['روایت امام محله؛ مستندهای «یکی از ما»', 'd', '۸ مستند', 0]] },
  { id: 'sharika', aud: 'sharika', t: 'شریکة‌الامام؛ میدان بانوان', tag: 'نهاد امامت', c: '#C23A5B', ink: '#A8314F', icon: IC.heart, pct: 0, d: 'امامت در میدان زنان و دختران محله؛ از حلقهٔ خانگی تا شبکهٔ بانوان کنشگر.',
    steps: [['شریکة‌الامام؛ نقش و میدان', 'va', '۵ درس', 0], ['حلقه‌های بانوان در محله', 'vw', '۴ درس', 0], ['الگوی سوم زن', 'ab', '۶ درس', 0], ['رادیو بانور؛ روایت‌های میدان', 'a', '۱۲۰ قسمت', 0]] },
  { id: 'peyvand', aud: 'all', t: 'پیوندها و ولایت عرضی', tag: 'پیوندهای اجتماعی', c: '#12A58E', ink: '#0B5F52', icon: IC.link, pct: 80, d: 'صلهٔ رحم، همسایگی و اخوت ایمانی؛ اگر ولایت عرضی تقویت نشود، ولایت طولی می‌شکند.',
    steps: [['پلکان اخوت در مسجد', 'vab', '۷ درس', 2], ['نظام همسایگی؛ چهل خانه', 'vw', '۴ درس', 2], ['مهمانی محله', 'dw', '۳ درس', 1], ['صلهٔ رحم امام', 'ab', '۳ درس', 0]] },
  { id: 'mabani', aud: 'imam', t: 'مبانی امامت', tag: 'خودسازی امام', c: '#5B6BD6', ink: '#1E3A9E', icon: IC.book, pct: 20, d: 'امامت در آیینهٔ قرآن: پنج وظیفهٔ امام، مارپیچ رشد و مسجد جامعه‌پرداز.',
    steps: [['امامت در آیینهٔ قرآن', 'ab', 'کتاب صوتی · ۹ ساعت', 1], ['پنج وظیفه و ۵۵ کنش امام', 'vb', '۵ درس', 0], ['مارپیچ رشد امام', 'vw', '۳ درس', 0], ['مسجد جامعه‌پرداز', 'vdb', '۶ درس', 0]] },
  { id: 'mali', aud: 'all', t: 'مشارکت مردم و تأمین منابع', tag: 'دورهٔ ویژه', c: '#0E7564', ink: '#0B5F52', icon: IC.coin, pct: 0, d: 'پویش مشارکتی با سهم‌های کوچک؛ پیوند با سنت دینی، شفافیت و گزارش به مردم.',
    steps: [['پنج اصل تأمین مالی مردمی', 'vaw', '۳ ساعت', 0], ['زکات، مایهٔ برکات', 'ab', '۴ درس', 0], ['بوم پویش مشارکتی', 'w', 'تمرین', 0]] },
];
const AUD = { imam: 'ویژهٔ امام', sharika: 'ویژهٔ شریکة‌الامام', all: 'امام، شریکة‌الامام و بازوان' };
class Component extends DCLogic {
  renderVals() {
    const st = this.state || {};
    const a = st.a || 'all-view';
    const aud = chips([['all-view', 'همه'], ['imam', 'امام'], ['sharika', 'شریکة‌الامام'], ['bazu', 'بازوان و کنشگران']], a, 'a', this);
    const list = P.filter((p) => a === 'all-view' || p.aud === a || p.aud === 'all' || (a === 'bazu' && p.aud === 'all'));
    const sel = list.find((p) => p.id === st.sel) || list[0];
    const paths = list.map((p) => {
      const nC = p.steps.length;
      return { t: p.t, tag: p.tag, c: p.c, ink: p.ink, icon: p.icon, meta: fa(nC) + ' دوره · ' + AUD[p.aud], pct: p.pct + '%', state: p.pct ? '٪' + fa(p.pct) : 'شروع نشده',
        on: p.id === sel.id ? 'true' : 'false', border: p.id === sel.id ? '#1B2150' : '#E4E7EF', pick: () => this.setState({ sel: p.id }) };
    });
    const steps = sel.steps.map(([t, m, dur, s], i, arr) => ({ t, dur, media: media(m), n: s === 2 ? '✓' : fa(i + 1),
      dot: s === 2 ? '#0E9F5A' : s === 1 ? '#F5B700' : '#EEF0F5', dotFg: s === 2 ? '#FFFFFF' : s === 1 ? '#3B2B00' : '#6C7290', line: i === arr.length - 1 ? 'none' : 'block' }));
    const cur = { t: sel.t, tag: sel.tag, aud: AUD[sel.aud], d: sel.d, c: sel.c, steps, cta: sel.pct ? 'ادامهٔ مسیر' : 'شروع مسیر' };
    return { aud, paths, cur };
  }
}'''
open('/home/claude/dz/project/Paths.dc.html','w').write(page('مسیرهای آموزشی', body, script, 1440, 1300))

# ---------- Library
body=f'''<div style="{ROOT}">
  {nav('lib')}
  <main style="max-width: 1280px; margin: 0 auto; padding: 28px 32px 64px; display: flex; flex-direction: column; gap: 20px">
    <section style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap">
      <div style="flex: 1; min-width: 280px"><h1 style="margin: 0; font-size: 36px; font-weight: 900">همهٔ دوره‌ها</h1><p style="margin: 4px 0 0; color: #6C7290; font-size: 15px">{{{{count}}}}</p></div>
      <label style="display: flex; align-items: center; gap: 10px; background: #FFFFFF; border: 1.5px solid #E4E7EF; border-radius: 16px; padding: 0 16px; min-height: 52px; width: 420px">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6C7290" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M10 4 a7 7 0 1 0 0.01 0 M15 15 l6 6"></path></svg>
        <span style="position: absolute; width: 1px; height: 1px; overflow: hidden">جست‌وجوی دوره</span>
        <input placeholder="جست‌وجو در دوره‌ها، استادها و موضوع‌ها" style="flex: 1; border: 0; outline: none; font: inherit; font-size: 15px; background: transparent; color: #1B2150">
      </label>
    </section>
    <div style="display: flex; flex-direction: column; gap: 10px">
      <div role="group" aria-label="قالب" style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center"><span style="font-size: 13px; font-weight: 800; color: #6C7290; width: 64px">قالب</span>{filt('kinds', 6)}</div>
      <div role="group" aria-label="موضوع" style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center"><span style="font-size: 13px; font-weight: 800; color: #6C7290; width: 64px">موضوع</span>{filt('topics', 6)}</div>
    </div>
    <section aria-label="دوره‌ها" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px">
      <sc-for list="{{{{courses}}}}" as="c" hint-placeholder-count="12">
        <a href="Course.dc.html" style="{CARD}; overflow: hidden; text-decoration: none; color: #1B2150; display: flex; flex-direction: column">
          <span style="height: 140px; background: {{{{c.c}}}}; position: relative; display: flex; align-items: center; justify-content: center">
            <svg width="70" height="88" viewBox="0 0 48 60" aria-hidden="true"><path d="{TOR}" fill="rgba(255,255,255,0.22)" stroke="rgba(255,255,255,0.75)" stroke-width="1.2"></path><path d="{{{{c.big}}}}" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" transform="translate(12 18)"></path></svg>
            <span style="position: absolute; bottom: 10px; left: 12px; padding: 3px 10px; border-radius: 8px; background: rgba(15,21,56,0.55); color: #FFFFFF; font-size: 12px; font-weight: 800">{{{{c.dur}}}}</span>
          </span>
          <span style="padding: 16px 18px 18px; display: flex; flex-direction: column; gap: 8px">
            <span style="font-size: 12px; font-weight: 800; color: {{{{c.ink}}}}">{{{{c.topic}}}}</span>
            <b style="font-size: 17px; font-weight: 900; line-height: 1.55">{{{{c.t}}}}</b>
            <span style="font-size: 13px; color: #6C7290">{{{{c.who}}}}</span>
            <span style="display: flex; gap: 6px; flex-wrap: wrap">{CHIP % 'c.media'}</span>
          </span>
        </a>
      </sc-for>
    </section>
  </main>
</div>'''
script = MEDIA_JS + FILT_JS + '''const TP = {
  rel: ['ارتباط و جذب', '#1E3A9E', '#1E3A9E'], mng: ['مدیریت و تشکیلات', '#D64A6A', '#A8314F'], prob: ['حل مسئله', '#F08C1A', '#8A5A00'],
  tab: ['تبیین و رسانه', '#F5B700', '#8A5A00'], pey: ['پیوندها', '#12A58E', '#0B5F52'], mab: ['مبانی امامت', '#5B6BD6', '#1E3A9E'],
};
const C = [
  ['مهارت‌های ارتباطی و جذب مردم به مسجد', 'rel', 'vaw', '۳ ساعت · ۷ بخش', 'امام موفق محله و کارشناس مهارت'],
  ['مدیریت مسجد؛ منشور همکاری با ارکان', 'mng', 'vbw', '۳ ساعت · ۷ بخش', 'ویژهٔ امام و هیئت امنا'],
  ['جذب نوجوانان و جوانان', 'rel', 'vdw', '۳ ساعت · ۷ بخش', 'نقش واقعی و نردبان مسئولیت'],
  ['حل مسئله؛ از علامت تا ریشه', 'prob', 'vaw', '۳ ساعت · ۷ بخش', 'بوم مسئله و پنج چرا'],
  ['تیم‌سازی و کادرسازی', 'mng', 'vaw', '۳ ساعت · ۷ بخش', 'معجزهٔ دیده‌شدن و نقش روشن'],
  ['گفت‌وگو و پاسخ به پرسش‌ها', 'tab', 'vaw', '۳ ساعت · ۷ بخش', 'گفت‌وگو به‌جای خطابه'],
  ['روایت و رسانهٔ مسجد در فضای مجازی', 'tab', 'vw', '۳ ساعت · ۷ بخش', 'اداره گروه و کانال محله'],
  ['مشارکت مردم و تأمین منابع', 'mng', 'vaw', '۳ ساعت · دورهٔ ویژه', 'پویش با سهم‌های کوچک'],
  ['امامت در آیینهٔ قرآن', 'mab', 'ab', 'کتاب صوتی · ۹ ساعت', 'مدل پنج‌لایهٔ امامت قرآنی'],
  ['قبس، خودمانی', 'tab', 'a', 'پادکست · ۱۷ قسمت', 'برای روشنگران مسجد'],
  ['پلکان اخوت در مسجد', 'pey', 'vab', '۷ درس', 'اخوت ایمانی در محله'],
  ['گعده‌داری', 'mng', 'ab', '۵ درس', 'رشد در جمع همتا'],
  ['تجربهٔ امامت محله؛ دفتر اول', 'mab', 'bd', 'کتاب · ۲۱ روایت', 'روایت بیست‌ویک امام محله'],
  ['یکی از ما', 'pey', 'd', 'مستند · ۸ قسمت', 'امامان محله، راوی زندگی خود'],
  ['زکات، مایهٔ برکات', 'mng', 'ab', '۴ درس', 'تأمین مالی از منطق امامت'],
  ['نفر سوم؛ حلقهٔ میانی', 'prob', 'vab', '۶ درس', 'به میدان آوردن مردم'],
];
const BIG = { v: 'M8 5v14l11-7z', a: 'M12 3 a3 3 0 0 1 3 3 v6 a3 3 0 0 1-6 0 v-6 a3 3 0 0 1 3-3 M5 11 a7 7 0 0 0 14 0 M12 18 v3', b: 'M4 4 h7 a2 2 0 0 1 2 2 v15 a2 2 0 0 0-2-2 h-7z M22 4 h-7 a2 2 0 0 0-2 2 v15 a2 2 0 0 1 2-2 h7z', d: 'M3 6 h18 v12 h-18z M10 9 l5 3 l-5 3z' };
class Component extends DCLogic {
  renderVals() {
    const st = this.state || {};
    const k = st.k || 'all', tp = st.tp || 'all';
    const kinds = chips([['all', 'همه'], ['v', 'ویدیویی'], ['a', 'صوتی و پادکست'], ['b', 'کتاب و متن'], ['d', 'مستند'], ['w', 'با کاربرگ و تمرین']], k, 'k', this);
    const topics = chips([['all', 'همه'], ...Object.entries(TP).map(([id, v]) => [id, v[0]])], tp, 'tp', this);
    const list = C.filter((c) => (k === 'all' || c[2].includes(k)) && (tp === 'all' || c[1] === tp));
    const courses = list.map(([t, top, m, dur, who]) => ({ t, dur, who, topic: TP[top][0], c: TP[top][1], ink: TP[top][2], media: media(m), big: BIG[m[0]] || BIG.v }));
    return { kinds, topics, courses, count: fa(list.length) + ' دوره از ' + fa(C.length) + ' دوره · برای امام، شریکة‌الامام و بازوان مسجد' };
  }
}'''
open('/home/claude/dz/project/Library.dc.html','w').write(page('همهٔ دوره‌ها', body, script, 1440, 1500))
