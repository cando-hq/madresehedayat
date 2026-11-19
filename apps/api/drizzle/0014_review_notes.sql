-- سازندهٔ دورهٔ تازه: یادداشت ستاد روی هر درس هنگام برگرداندن
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "review_notes" jsonb DEFAULT '{}'::jsonb NOT NULL;
