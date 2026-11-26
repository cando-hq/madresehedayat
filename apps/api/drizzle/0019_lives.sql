-- پخش زنده به‌عنوان واحد مستقل: مخاطب مسیر یا دوره (نسخهٔ ۱.۹)
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "audience_path_id" text;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "audience_course_only" boolean DEFAULT false NOT NULL;
CREATE INDEX IF NOT EXISTS "events_live_idx" ON "events" ("is_live", "status", "ends_at");
