# مدرسهٔ هدایت — راهنمای Claude برای این مخزن

اول `docs/handoff/00-از-این‌جا-شروع.md` را بخوان: چه چیزی کجاست، دسترسی‌ها، کارهای باز. سلیقه و لحن: `docs/handoff/02-سلیقه-و-قاعده‌ها.md`.

## قاعده‌ها
- با معین و تیم فارسی حرف بزن؛ کوتاه و دقیق. رابط کاربری: «تو»، گرم، بی‌اصطلاح داخلی، ارقام فارسی.
- دادهٔ واقعی کاربران به هیچ سرویس بیرونی نمی‌رود. رمز و توکن فقط در `.env` سرور؛ هرگز در گیت یا گفتگو.
- فونت رواق مجوز خریدار دارد. `docs/sources/` محرمانه است.
- `tests/` هرگز روی سرور اجرا نشود.
- مهاجرت‌ها دستی: `apps/api/drizzle/NNNN_*.sql` + `meta/_journal.json`؛ هیچ مهاجرتی داده را پاک نکند.

## انتشار (هر تغییر)
1. کد + آزمون (`tests/api/NN_*.py` یا `tests/ui/*.py`؛ آزمون UI تازه را در `tests/run.py` هم اضافه کن).
2. نسخه: `"version"` در `apps/api/package.json` و `apps/web/package.json` + بخش `## X.Y.Z — تاریخ شمسی` بالای `CHANGELOG.md` (فارسی، به زبان کاربر).
3. `cd apps/api && npm run build`، بعد `bash tests/audit/stack.sh fresh` و
   `TEST_DB='postgresql://postgres@localhost:5433/madrese_test?host=/tmp/pg' API_URL=http://localhost:3100/api WEB_URL=http://localhost:5180 python3 tests/run.py --ui` ← «همه درست».
4. commit (پیام فارسی) و `git fetch && git rebase origin/main && git push origin main`. سرور در چند دقیقه خودش نصب می‌کند؛ `https://madresehedayat.ir/api/health`.
5. **بایگانی بارگذار:** `python3 tools/archive/build.py <مسیر c-test>/projects/madrese-archive/site` و در `cando-hq/c-test` یک commit و push. اگر تصمیم یا سلیقهٔ تازه‌ای در گفت‌وگو آمد، اول `docs/handoff/01..03` را به‌روز کن.

## کار سرور
هر کار سرور با جواد است، از راه کانکتور روزنگار (`tell`، پروژه «مدرسه هدایت»): دستور کامل و یک‌جا کپی‌کردنی، با راه چک کردن.
