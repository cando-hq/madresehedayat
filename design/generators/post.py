import glob, re
P='/home/claude/dz/project/'
LINKS={'کنشگران من':'RahyarActors.dc.html','گعده‌ها':'RahyarGaade.dc.html','پیام‌ها':'Messages.dc.html','صف روایت‌ها':'RahyarFinal.dc.html',
 'صف بازبینی':'AdminFinal.dc.html','برگزارکنندگان':'AdminPubs.dc.html','پشتیبانی':'AdminSupport.dc.html','گزارش کل':'AdminReport.dc.html',
 'محتوای ما':'Publisher.dc.html','مسیرساز':'PathBuilder.dc.html','دوره‌ساز':'CourseBuilder.dc.html','پخش زنده':'LiveBuilder.dc.html','راهیاران':'PubRahyars.dc.html','گزارش اثر':'Impact.dc.html','کتابخانهٔ مشترک':'Library.dc.html'}
for f in glob.glob(P+'*.dc.html'):
    s=open(f).read(); o=s
    s=s.replace(' · ','، ')
    def fix(m):
        txt=m.group(2)
        return m.group(0).replace('href="#"','href="%s"'%LINKS[txt]) if txt in LINKS else m.group(0)
    s=re.sub(r'<a href="#" ([^>]*?)><span style="width: 8px; height: 8px; border-radius: 50%; background: [^"]+"></span>([^<]+)</a>', fix, s)
    if s!=o: open(f,'w').write(s)
print('post ok')
