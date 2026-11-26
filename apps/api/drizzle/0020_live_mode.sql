-- شیوهٔ پخش زنده: سخنرانی، کلاس، جلسه (نسخهٔ ۱.۹.۳)
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "live_mode" text;
