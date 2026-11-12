import sys; sys.path.insert(0, '/home/claude/dz/gen')
from common import *
P = '/home/claude/dz/project/'
DEEP, INK, MUTE, GREEN, YEL, TEAL, RED, ORANGE = '#1E3A9E', '#1B2150', '#6C7290', '#0E9F5A', '#F5B700', '#12A58E', '#D64A6A', '#F08C1A'
LOGO = '/_blob/c32edcf1902edb02071357b473d1f634'
LOGO_W = '/_blob/b522f6290bfc782976410c6c8494344e'
POSTER = '/_blob/702a4dfcbc9ca7da3287d181fdf527c9'
NAV_ITEMS = [('home', 'خانه', 'HomeFinal.dc.html'), ('learn', 'یادگیری', 'MyPaths.dc.html'), ('field', 'میدان', 'Field.dc.html'), ('peers', 'همتایان', 'Peers.dc.html'), ('karname', 'کارنامه', 'Karname.dc.html')]

def top(cur, who='حجت‌الاسلام حسنی', sub='امام مسجد صاحب‌الزمان', extra_items=()):
    items = NAV_ITEMS + list(extra_items)
    links = ''.join(f'<a href="{h}" {"aria-current=\"page\" " if k == cur else ""}style="padding: 10px 14px; border-radius: 12px; background: {"#EAEFFC" if k == cur else "transparent"}; color: {DEEP if k == cur else "#3E4462"}; font-weight: 800; font-size: 15px; text-decoration: none">{t}</a>' for k, t, h in items)
    return f'''<header style="background: #FFFFFF; border-bottom: 1px solid #E4E7EF"><div style="max-width: 1280px; margin: 0 auto; padding: 12px 32px; display: flex; align-items: center; gap: 24px">
  <a href="HomeFinal.dc.html" style="display: flex"><img src="{LOGO}" alt="مدرسهٔ هدایت، خانه" style="height: 40px; width: auto; max-width: 200px; object-fit: contain"></a>
  <nav aria-label="منوی اصلی" style="display: flex; gap: 2px; flex: 1">{links}</nav>
  <div style="display: flex; align-items: center; gap: 6px">
    <a href="Messages.dc.html" aria-label="اعلان‌ها، ۲ اعلان تازه" style="position: relative; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #3E4462"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 16 v-5 a6 6 0 0 1 12 0 v5 l2 2 h-16z M10 21 h4"></path></svg><span style="position: absolute; top: 4px; left: 2px; min-width: 18px; height: 18px; border-radius: 9px; background: {RED}; color: #FFFFFF; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center">۲</span></a>
    <a href="Karname.dc.html" style="display: flex; align-items: center; gap: 10px; margin-right: 8px; text-decoration: none; color: {INK}"><span style="text-align: left; display: flex; flex-direction: column"><b style="font-size: 14px; font-weight: 800">{who}</b><span style="font-size: 12px; color: {MUTE}">{sub}</span></span><span style="width: 42px; height: 42px; border-radius: 50%; background: {DEEP}; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-weight: 900">{who[-4]}</span></a>
  </div></div></header>'''

def side(cur, title, sub, items, who):
    nav = ''.join(f'<a href="{h}" {"aria-current=\"page\" " if k == cur else ""}style="display: flex; align-items: center; gap: 10px; min-height: 42px; padding: 0 12px; border-radius: 12px; background: {"rgba(255,255,255,0.14)" if k == cur else "transparent"}; color: #FFFFFF; font-size: 14px; font-weight: {800 if k == cur else 500}; text-decoration: none"><span style="width: 8px; height: 8px; border-radius: 50%; background: {c}"></span>{t}</a>' for k, t, c, h in items)
    return f'''<aside style="width: 248px; flex: none; background: {INK}; color: #FFFFFF; padding: 22px 14px; display: flex; flex-direction: column; gap: 4px; box-sizing: border-box; min-height: 100vh"><img src="{LOGO_W}" alt="مدرسهٔ هدایت" style="width: 150px; max-width: 100%; height: auto; align-self: flex-start; margin: 0 8px 10px"><div style="padding: 0 10px 14px; font-size: 13px; color: #C9D3F5">{title}، {sub}</div><nav aria-label="منوی پنل" style="display: flex; flex-direction: column; gap: 2px">{nav}</nav><div style="margin-top: auto; padding: 12px 10px; font-size: 13px; color: #C9D3F5; border-top: 1px solid rgba(255,255,255,0.12)">{who}<br><a href="HomeFinal.dc.html" style="color: #FFFFFF; font-weight: 800">نمای کنشگر</a></div></aside>'''

def btn(t, href='#', kind='primary', small=False):
    h = 44 if small else 48
    pad = '0 18px' if small else '0 24px'
    st = {'primary': f'background: {GREEN}; color: #FFFFFF; border: 0', 'blue': f'background: {DEEP}; color: #FFFFFF; border: 0', 'ghost': f'background: #FFFFFF; color: {DEEP}; border: 1.5px solid {DEEP}', 'quiet': f'background: transparent; color: #3E4462; border: 1.5px solid #E4E7EF', 'danger': f'background: #FFFFFF; color: #A8314F; border: 1.5px solid #F0C2CD'}[kind]
    return f'<a href="{href}" style="display: inline-flex; align-items: center; justify-content: center; min-height: {h}px; padding: {pad}; border-radius: 14px; {st}; font-weight: 800; font-size: {15 if small else 16}px; text-decoration: none; line-height: 1.4">{t}</a>'

def pill(t, bg='#F4F5F9', c='#3E4462'):
    return f'<span style="display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 999px; background: {bg}; color: {c}; font-size: 12px; font-weight: 800; white-space: nowrap">{t}</span>'

def head(h1, sub, right=''):
    return f'<section style="display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap"><div><h1 style="margin: 0; font-size: 32px; font-weight: 900">{h1}</h1><p style="margin: 4px 0 0; color: {MUTE}; font-size: 15px">{sub}</p></div>{right}</section>'

def empty(title, hint, cta, href='#', icon_fill=YEL):
    return f'<div style="{CARD}; padding: 40px 32px; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center">{toranj(icon_fill, 44)}<b style="font-size: 18px; font-weight: 900">{title}</b><span style="font-size: 14px; color: {MUTE}; max-width: 440px">{hint}</span><div style="margin-top: 8px">{btn(cta, href)}</div></div>'

def banner(kind, text, action=''):
    bg, c = {'error': ('#FBE6EB', '#A8314F'), 'wait': ('#FFF2CC', '#8A5A00'), 'ok': ('#DDF5E8', '#0A7A45'), 'info': ('#EAEFFC', DEEP)}[kind]
    return f'<div role="status" style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 16px; background: {bg}; color: {c}; font-size: 14px; font-weight: 700">{toranj(c, 18)}<span style="flex: 1">{text}</span>{action}</div>'

def bar(w, c=DEEP):
    return f'<span style="display: block; height: 8px; border-radius: 4px; background: #EEF0F5"><span style="display: block; height: 100%; width: {w}; border-radius: 4px; background: {c}"></span></span>'

def main_(inner, gap=22):
    return f'<main style="max-width: 1280px; margin: 0 auto; padding: 28px 32px 64px; display: flex; flex-direction: column; gap: {gap}px">{inner}</main>'

def shell(cur, inner, **kw):
    return f'<div style="{ROOT}">{top(cur, **kw)}{main_(inner)}</div>'

def panel(side_html, inner):
    return f'<div style="{ROOT}; display: flex">{side_html}<main style="flex: 1; padding: 28px 32px 48px; display: flex; flex-direction: column; gap: 18px; min-width: 0">{inner}</main></div>'

def save(name, title, body, script='class Component extends DCLogic { renderVals() { return {}; } }', w=1440, h=1100):
    open(P + name, 'w').write(page(title, body, script, w, h))
