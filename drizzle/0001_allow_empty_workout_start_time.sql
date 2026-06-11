ALTER TABLE "workout_reports" ALTER COLUMN "start_time" DROP NOT NULL;

UPDATE "workout_reports"
SET "start_time" = NULL
WHERE "start_time" = '00:00';
