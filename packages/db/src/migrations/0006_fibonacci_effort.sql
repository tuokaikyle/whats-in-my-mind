UPDATE "todo" SET "effort" = 3 WHERE "effort" = 4;--> statement-breakpoint
UPDATE "todo" SET "progress" = "effort" WHERE "progress" IS NOT NULL AND "effort" IS NOT NULL AND "progress" > "effort";
