-- شمارهٔ دوم حساب (نسخهٔ ۱.۶)
CREATE TABLE IF NOT EXISTS "user_mobiles" (
  "user_id" text PRIMARY KEY NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "mobile" text NOT NULL UNIQUE,
  "mobile_enc" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
