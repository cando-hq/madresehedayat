-- منبع مسجد: فهرست‌های واردشده (مثل فهرست نشان) با شناسهٔ پایدار تا ورود دوباره تکراری نسازد (نسخهٔ ۱.۱۰.۰)
ALTER TABLE "mosques" ADD COLUMN IF NOT EXISTS "source" text;
ALTER TABLE "mosques" ADD COLUMN IF NOT EXISTS "source_ref" text;
CREATE UNIQUE INDEX IF NOT EXISTS "mosques_source_ref_uq" ON "mosques" ("source_ref");
CREATE INDEX IF NOT EXISTS "mosques_lat_lng_idx" ON "mosques" ("lat", "lng");
