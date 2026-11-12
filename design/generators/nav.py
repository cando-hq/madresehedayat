import sys; sys.path.insert(0,'/home/claude/dz/gen')
from common import *
body = f'''<header style="background: #FFFFFF; border-bottom: 1px solid #E4E7EF; {FEAT}; color: #1B2150">
  <div style="max-width: 1280px; margin: 0 auto; padding: 12px 32px; display: flex; align-items: center; gap: 24px; flex-wrap: wrap">
    <a href="HomeFinal.dc.html" style="display: flex"><img src="/_blob/c32edcf1902edb02071357b473d1f634" alt="مدرسهٔ هدایت، خانه" style="height: 40px; width: auto; max-width: 200px; object-fit: contain"></a>
    <nav aria-label="منوی اصلی" style="display: flex; gap: 2px; flex-wrap: wrap; flex: 1">
      <sc-for list="{{{{items}}}}" as="it" hint-placeholder-count="5">
        <a href="{{{{it.href}}}}" aria-current="{{{{it.cur}}}}" style="padding: 10px 14px; border-radius: 12px; background: {{{{it.bg}}}}; color: {{{{it.c}}}}; font-weight: {{{{it.w}}}}; font-size: 15px; text-decoration: none">{{{{it.t}}}}</a>
      </sc-for>
    </nav>
    <div style="display: flex; align-items: center; gap: 6px">
      <a href="Messages.dc.html" aria-label="پیام‌ها، ۱ پیام تازه" style="position: relative; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #3E4462">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5 h16 v11 h-9 l-5 4 v-4 h-2z"></path></svg>
        <span style="position: absolute; top: 6px; left: 6px; width: 9px; height: 9px; border-radius: 50%; background: #D64A6A"></span>
      </a>
      <a href="Messages.dc.html" aria-label="اعلان‌ها، ۲ اعلان تازه" style="position: relative; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #3E4462">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 16 v-5 a6 6 0 0 1 12 0 v5 l2 2 h-16z M10 21 h4"></path></svg>
        <span style="position: absolute; top: 4px; left: 2px; min-width: 18px; height: 18px; border-radius: 9px; background: #D64A6A; color: #FFFFFF; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center">۲</span>
      </a>
      <a href="Karname.dc.html" style="display: flex; align-items: center; gap: 10px; margin-right: 8px; text-decoration: none; color: #1B2150">
        <span style="text-align: left; display: flex; flex-direction: column"><b style="font-size: 14px; font-weight: 800">حجت‌الاسلام حسنی</b><span style="font-size: 12px; color: #6C7290">امام مسجد صاحب‌الزمان</span></span>
        <span style="width: 42px; height: 42px; border-radius: 50%; background: #1E3A9E; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-weight: 900">ح</span>
      </a>
    </div>
  </div>
</header>'''
script = '''const ITEMS = [
  ['home', 'خانه', 'HomeFinal.dc.html'], ['learn', 'یادگیری', 'MyPaths.dc.html'], ['field', 'میدان', 'Field.dc.html'],
  ['peers', 'همتایان', 'Peers.dc.html'], ['karname', 'کارنامه', 'Karname.dc.html'],
];
class Component extends DCLogic {
  renderVals() {
    const a = this.props.active ?? 'home';
    return { items: ITEMS.map(([id, t, href]) => ({ t, href, cur: id === a ? 'page' : 'false', bg: id === a ? '#EAEFFC' : 'transparent', c: id === a ? '#1E3A9E' : '#3E4462', w: id === a ? 800 : 700 })) };
  }
}'''
s = page('منوی بالا', body, script, 1440, 72).replace('''{"$preview":{"width":1440,"height":72}}''', '''{"active":{"editor":"enum","options":["home","learn","field","peers","karname"],"default":"home"},"$preview":{"width":1440,"height":72}}''')
open('/home/claude/dz/project/Nav.dc.html','w').write(s)
