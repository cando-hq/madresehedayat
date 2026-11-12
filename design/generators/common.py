FONT = """@font-face{font-family:Ravagh;src:url(/_blob/e82b766c64b0cace84d3355c93f56b74) format("woff2");font-weight:400;font-display:swap}
@font-face{font-family:Ravagh;src:url(/_blob/527abc1483ee47a97b558a9acbfb98c5) format("woff2");font-weight:500;font-display:swap}
@font-face{font-family:Ravagh;src:url(/_blob/4d07209a2087021071dc7addbee9572d) format("woff2");font-weight:700;font-display:swap}
@font-face{font-family:Ravagh;src:url(/_blob/8c3eae47921ff883f9e1052d2720315a) format("woff2");font-weight:800;font-display:swap}
@font-face{font-family:Ravagh;src:url(/_blob/21203621768e345fd3b65247d31101f5) format("woff2");font-weight:900;font-display:swap}"""
FEAT = "font-family: Ravagh, Tahoma, sans-serif; font-feature-settings: 'ss01' 0, 'ss02' 0, 'ss03' 0, 'swsh' 0, 'dlig' 0; line-height: 1.65; direction: rtl"
ROOT = "min-height: 100vh; background: #F4F5F9; color: #1B2150; " + FEAT
CARD = "background: #FFFFFF; border: 1px solid #E4E7EF; border-radius: 24px"
TOR = "M24 2 C30 10 44 16 44 32 C44 46 34 58 24 58 C14 58 4 46 4 32 C4 16 18 10 24 2 Z"
def page(title, body, script, w=1440, h=1200, extra_css=""):
    return f"""<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<style>
{FONT}
body{{margin:0;background:#F4F5F9}}
a{{color:#1E3A9E}}a:hover{{color:#152B78}}
{extra_css}
</style>
</helmet>
{body}
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{w},"height":{h}}}}}'>
{script}
</script>
</body>
</html>
"""
def nav(active):
    return f'<dc-import name="Nav" active="{active}" hint-size="100%,72px"></dc-import>'
def toranj(fill, size=28, extra=""):
    return f'<svg width="{size}" height="{int(size*1.25)}" viewBox="0 0 48 60" aria-hidden="true"><path d="{TOR}" fill="{fill}"></path>{extra}</svg>'
