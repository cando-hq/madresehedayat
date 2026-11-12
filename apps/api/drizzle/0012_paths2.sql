-- منطق مسیر، نسخهٔ ۲: برگزارکننده، مسیر در سه اندازه، مسیر اصلی بر پایهٔ نقش، مسجد روی نقشه، کتابخانهٔ مشترک، پخش زندهٔ مستقل
ALTER TABLE "users" ADD COLUMN "actor_role" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "main_path_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "mosque_relation" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "lat" double precision;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "lng" double precision;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarded_at" timestamp with time zone;--> statement-breakpoint
UPDATE "users" SET "onboarded_at" = "created_at";--> statement-breakpoint
ALTER TABLE "mosques" ADD COLUMN "lat" double precision;--> statement-breakpoint
ALTER TABLE "mosques" ADD COLUMN "lng" double precision;--> statement-breakpoint
ALTER TABLE "mosques" ADD COLUMN "proposed_by" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "publisher_id" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "library_share" text DEFAULT 'all' NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "review_status" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "return_note" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "submitted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "is_live" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "publisher_id" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "review_status" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "return_note" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "submitted_at" timestamp with time zone;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "publishers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#1E3A9E' NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"kind" text,
	"referrer" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "publisher_admins" (
	"publisher_id" text NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "publisher_admins_publisher_id_user_id_pk" PRIMARY KEY("publisher_id","user_id")
);--> statement-breakpoint
ALTER TABLE "publisher_admins" ADD CONSTRAINT "publisher_admins_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publisher_admins" ADD CONSTRAINT "publisher_admins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "paths2" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"size" text NOT NULL,
	"publisher_id" text NOT NULL,
	"audience" text[] DEFAULT '{}'::text[] NOT NULL,
	"main_for" text[] DEFAULT '{}'::text[] NOT NULL,
	"description" text,
	"color" text DEFAULT '#1E3A9E' NOT NULL,
	"has_rahyar" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"return_note" text,
	"submitted_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "paths2_slug_unique" UNIQUE("slug")
);--> statement-breakpoint
ALTER TABLE "paths2" ADD CONSTRAINT "paths2_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "path_enrollments" (
	"user_id" text NOT NULL,
	"path_id" text NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "path_enrollments_user_id_path_id_pk" PRIMARY KEY("user_id","path_id")
);--> statement-breakpoint
ALTER TABLE "path_enrollments" ADD CONSTRAINT "path_enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "path_enrollments" ADD CONSTRAINT "path_enrollments_path_id_paths2_id_fk" FOREIGN KEY ("path_id") REFERENCES "public"."paths2"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "path_rahyars" (
	"path_id" text NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "path_rahyars_path_id_user_id_pk" PRIMARY KEY("path_id","user_id")
);--> statement-breakpoint
ALTER TABLE "path_rahyars" ADD CONSTRAINT "path_rahyars_path_id_paths2_id_fk" FOREIGN KEY ("path_id") REFERENCES "public"."paths2"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "path_rahyars" ADD CONSTRAINT "path_rahyars_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "path_assessments" (
	"id" text PRIMARY KEY NOT NULL,
	"path_id" text NOT NULL,
	"step_id" text NOT NULL,
	"user_id" text NOT NULL,
	"by_id" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "path_assessments" ADD CONSTRAINT "path_assessments_path_id_paths2_id_fk" FOREIGN KEY ("path_id") REFERENCES "public"."paths2"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "path_assessments" ADD CONSTRAINT "path_assessments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "path_assessments" ADD CONSTRAINT "path_assessments_by_id_users_id_fk" FOREIGN KEY ("by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "path_assess_user_idx" ON "path_assessments" USING btree ("user_id","path_id");--> statement-breakpoint
-- برگزارکنندهٔ پیش‌فرض: بنیاد هدایت؛ همهٔ دوره‌ها و مسیرهای موجود به نام او
INSERT INTO "publishers" ("id","name","color","status","kind","referrer") VALUES ('pub-hedayat','بنیاد هدایت','#1E3A9E','ACTIVE','بنیاد','ستاد') ON CONFLICT DO NOTHING;--> statement-breakpoint
UPDATE "courses" SET "publisher_id" = 'pub-hedayat' WHERE "publisher_id" IS NULL;--> statement-breakpoint
-- مسیرهای قدیمی (فهرست دوره‌ها) به مسیر میانهٔ منتشرشده تبدیل می‌شوند
INSERT INTO "paths2" ("id","slug","title","size","publisher_id","audience","description","color","has_rahyar","status","steps")
SELECT p."id", p."slug", p."title", 'mid', 'pub-hedayat', '{}'::text[], p."description", CASE p."color" WHEN 'green' THEN '#0E9F5A' WHEN 'blue' THEN '#1E3A9E' ELSE '#F08C1A' END, true, CASE WHEN p."published" THEN 'PUBLISHED' ELSE 'DRAFT' END,
  jsonb_build_array(jsonb_build_object('id','s1','title','دوره‌ها','rule',NULL,'items', COALESCE((SELECT jsonb_agg(jsonb_build_object('kind','course','refId',i."course_id") ORDER BY i."order") FROM "path_items" i WHERE i."path_id" = p."id"), '[]'::jsonb)))
FROM "paths" p ON CONFLICT DO NOTHING;
