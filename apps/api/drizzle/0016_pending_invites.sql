-- نقش برای شمارهٔ بی‌حساب، تا اولین ورود (نسخهٔ ۱.۶.۲)
CREATE TABLE IF NOT EXISTS "pending_invites" (
  "id" text PRIMARY KEY NOT NULL,
  "mobile" text NOT NULL,
  "mobile_enc" text NOT NULL,
  "kind" text NOT NULL,
  "target_id" text NOT NULL,
  "created_by" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "pending_invites_uq" UNIQUE("mobile","kind","target_id")
);
CREATE INDEX IF NOT EXISTS "pending_invites_mobile_idx" ON "pending_invites" ("mobile");
