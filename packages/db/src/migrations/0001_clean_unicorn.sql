CREATE TABLE "category" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "category_name_userId_unique" UNIQUE("name","user_id")
);
--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN "category_id" integer;--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN "effort" integer;--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN "deadline" timestamp;--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "category_userId_idx" ON "category" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "todo" ADD CONSTRAINT "todo_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todo" DROP COLUMN "category";