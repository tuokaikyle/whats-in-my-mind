CREATE TABLE IF NOT EXISTS "category" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "category_name_userId_unique" UNIQUE("name","user_id")
);
--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN IF NOT EXISTS "category_id" integer;--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN IF NOT EXISTS "effort" integer;--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN IF NOT EXISTS "deadline" timestamp;--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'category_user_id_user_id_fk') THEN
		ALTER TABLE "category" ADD CONSTRAINT "category_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "category_userId_idx" ON "category" USING btree ("user_id");--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'todo_category_id_category_id_fk') THEN
		ALTER TABLE "todo" ADD CONSTRAINT "todo_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE no action;
	END IF;
END $$;--> statement-breakpoint
ALTER TABLE "todo" DROP COLUMN IF EXISTS "category";
