# پروتوتایپ قابل کلیک دوره‌ساز (نسخهٔ ۱.۴)

این پوشه نسخهٔ پشتیبان بوم طراحی دوره‌ساز است که پیش از کدنویسی نسخهٔ ۱.۴.۰ ساخته شد.
کد واقعی همین طراحی در `apps/web/src/pages/admin/CourseEditor.tsx` و `Review.tsx` است.

- `Main.dc.html`: کل پروتوتایپ تعاملی (یک ماشین حالت با همهٔ صفحه‌ها).
- بقیهٔ فایل‌ها هر کدام `Main` را با یک حالت شروع (`start`) باز می‌کنند تا هر صفحه جدا روی بوم دیده شود.
- `canvas.json`: چیدمان صفحه‌ها روی بوم.

حالت‌های شروع: `list` (فهرست دوره‌ها)، `start` (دورهٔ خالی)، `build` (ساخت)، `paste` (چسباندن لینک آپارات)، `audio` (بارگذاری صوت)، `insert` (افزودن بین درس‌ها)، `d-video`، `d-audio`، `d-text`، `d-quiz`، `d-mission` (ویرایش هر نوع درس)، `settings`، `preview`، `preview-text`، `preview-quiz`، `blocked` (ارسال ناقص)، `sent`، `staff-queue`، `staff-review`، `returned`، `published`.

این فایل‌ها برای اجرا به محیط بوم طراحی Claude نیاز دارند (`dc-import`)؛ با مرورگر معمولی کامل باز نمی‌شوند.
نسخهٔ زنده: https://claude.ai/artifact/SqP9UhHJRopc4k1Z7zVASW
