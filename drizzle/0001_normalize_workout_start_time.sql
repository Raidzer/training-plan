ALTER TABLE "workout_reports" ALTER COLUMN "start_time" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "recovery_entries" ADD COLUMN IF NOT EXISTS "recovery_other" text;
--> statement-breakpoint
UPDATE "workout_reports"
SET "start_time" = NULL
WHERE "start_time" = '00:00';
