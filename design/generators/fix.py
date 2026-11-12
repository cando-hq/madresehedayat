import re,sys
sys.path.insert(0,'/home/claude/dz/gen')
from common import nav
P='/home/claude/dz/project/'
def hdr(f,active):
    s=open(P+f).read()
    s=re.sub(r'\n\s*<header.*?</header>', '\n  '+nav(active), s, count=1, flags=re.S)
    open(P+f,'w').write(s)
hdr('Main.dc.html','home'); hdr('Golbad.dc.html','learn'); hdr('Levels.dc.html','karname')
s=open(P+'Main.dc.html').read()
a=s.index('<div style="background: #FFFFFF; color: #1B2150; border-radius: 22px; padding: 22px 24px')
b=s.index('<div class="hero-img"')
newcard='''<div style="background: #FFFFFF; color: #1B2150; border-radius: 22px; padding: 22px 24px; display: flex; flex-direction: column; gap: 14px; max-width: 520px">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px">
            <span style="font-size: 13px; font-weight: 800; color: #B07800">ادامهٔ دوره · شناسنامهٔ مسئلهٔ محله</span>
            <span style="font-size: 13px; color: #6C7290">درس ۴ از ۶</span>
          </div>
          <div style="font-size: 22px; font-weight: 900; line-height: 1.5">ریشه‌یابی با «پنج چرا»</div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap">
            <sc-for list="{{parts}}" as="p" hint-placeholder-count="4"><span style="display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 999px; background: {{p.bg}}; color: {{p.c}}; font-size: 12px; font-weight: 800"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="{{p.i}}"></path></svg>{{p.t}}</span></sc-for>
          </div>
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap">
            <a href="Lesson.dc.html" style="display: inline-flex; align-items: center; gap: 8px; min-height: 48px; padding: 0 24px; border-radius: 14px; background: #0E9F5A; color: #FFFFFF; font-weight: 800; font-size: 16px; text-decoration: none">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 5v14l11-7z"></path></svg>
              ادامهٔ درس · ۱۲ دقیقه
            </a>
            <a href="Tools.dc.html" style="font-size: 14px; font-weight: 800">ابزار درس: پنج چرا</a>
          </div>
        </div>
      </div>
      '''
s=s[:a]+newcard+s[b:]
s=s.replace('<section aria-label="این هفته"','<section aria-label="امروز و این هفته"')
s=s.replace('<a href="#" style="background: #FFFFFF; border: 1px solid #E4E7EF; border-radius: 22px; padding: 20px;','<a href="{{w.href}}" style="background: #FFFFFF; border: 1px solid #E4E7EF; border-radius: 22px; padding: 20px;')
s=s.replace('پیشنهاد راهیار:</b> «ارزیابی» و «جهت‌گیری تمدنی» هنوز خالی‌اند. مدرسهٔ حل مسئله هر دو را پر می‌کند.','پیشنهاد راهیار:</b> «ارزیابی» و «جهت‌گیری تمدنی» هنوز خالی‌اند. مسیر «حل مسئلهٔ محله» هر دو را پر می‌کند.')
s=s.replace('<a href="#" style="font-weight: 800">شناسنامهٔ مسئله</a>\n            <a href="#" style="font-weight: 800">طرح اقدام (پیش‌نویس)</a>','<a href="Tools.dc.html" style="font-weight: 800">تختهٔ درخت مسئله</a>\n            <a href="Tools.dc.html" style="font-weight: 800">طرح اقدام (پیش‌نویس)</a>')
s=s.replace('<a href="#" style="font-size: 14px; font-weight: 800">پیام به تیم</a>','<a href="Mosque.dc.html" style="font-size: 14px; font-weight: 800">مسجد من</a>')
s=s.replace('<a href="#" style="font-size: 14px; font-weight: 800">همهٔ دوره‌ها</a>','<a href="Golbad.dc.html" style="font-size: 14px; font-weight: 800">همهٔ دوره‌ها</a>')
s=s.replace('<a href="#" style="background: #FFFFFF; border: 1px solid #E4E7EF; border-radius: 24px; overflow: hidden;','<a href="Course.dc.html" style="background: #FFFFFF; border: 1px solid #E4E7EF; border-radius: 24px; overflow: hidden;')
s=s.replace('استاد-مربی شهرستان بهشهر · همراه ۷۰ مسجد','راهیار شما از آغاز مسیر')
s=s.replace('<li style="display: flex; justify-content: space-between"><span>سرکشی بعدی به مسجد</span><b style="font-weight: 800">۱۸ آذر</b></li>','<li style="display: flex; justify-content: space-between"><span>ارزیابی میدانی بعدی</span><b style="font-weight: 800">۱۸ آذر</b></li>')
s=s.replace('<a href="#" style="display: inline-flex; align-self: flex-start; align-items: center; min-height: 44px; padding: 0 20px; border-radius: 12px; border: 1.5px solid #1E3A9E;','<a href="Messages.dc.html" style="display: inline-flex; align-self: flex-start; align-items: center; min-height: 44px; padding: 0 20px; border-radius: 12px; border: 1.5px solid #1E3A9E;')
s=s.replace('<span style="font-size: 13px; color: #C9D3F5">ارزیابی بعدی راهیار: ۱۸ آذر</span>','<span style="font-size: 13px; color: #C9D3F5">ارزیابی میدانی راهیار: ۱۸ آذر</span>')
old_week=s[s.index('    const days = Array'):s.index('    const sectors')]
s=s.replace(old_week,'''    const parts = [
      { t: 'ویدیو ۶ دقیقه', i: 'M8 5v14l11-7z', bg: '#EAEFFC', c: '#1E3A9E' },
      { t: 'پادکست', i: 'M12 3 a3 3 0 0 1 3 3 v6 a3 3 0 0 1-6 0 v-6 a3 3 0 0 1 3-3 M5 11 a7 7 0 0 0 14 0 M12 18 v3', bg: '#E1F3F6', c: '#1D7F92' },
      { t: 'آزمونک', i: 'M9 12 l2 2 l4-4 M4 4 h16 v16 h-16z', bg: '#E2F5EA', c: '#0A7A45' },
      { t: 'مأموریت میدانی', i: 'M12 21 s-7-6-7-11 a7 7 0 0 1 14 0 c0 5-7 11-7 11z M12 10 a2 2 0 1 0 0.01 0', bg: '#FFF2CC', c: '#8A5A00' },
    ];
    const week = [
      { kind: 'کلاس زنده · پخش زنده', title: 'اخلاق امامت محله، جلسهٔ ۵', when: 'امروز، ۲۱:۰۰ · ۱۲۴ نفر ثبت‌نام', icon: IC.live, bg: '#FBE6EB', fg: '#C23A5B', ink: '#A8314F', href: 'Live.dc.html' },
      { kind: 'برنامهٔ حضوری', title: 'جشن نیمه‌شب نوجوانان مسجد', when: 'جمعه ۲۴ آبان · ثبت‌نام باز است', icon: IC.visit, bg: '#EAEFFC', fg: '#1E3A9E', ink: '#1E3A9E', href: 'Events.dc.html' },
      { kind: 'پویش', title: 'هر مسجد، یک کتابخانهٔ محله', when: '۱۲ روز مانده · ۳۸۰ مسجد همراه', icon: IC.heart, bg: '#D3EFEA', fg: '#0B5F52', ink: '#0B5F52', href: 'Campaigns.dc.html' },
      { kind: 'تختهٔ تیمی', title: 'درخت مسئلهٔ نوجوانان', when: '۳ نفر دیروز ویرایش کردند', icon: IC.chart, bg: '#FFF2CC', fg: '#8A5A00', ink: '#8A5A00', href: 'Tools.dc.html' },
    ];
''')
s=s.replace('return { days, week,','return { parts, week,')
open(P+'Main.dc.html','w').write(s)
