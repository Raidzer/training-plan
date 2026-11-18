ALTER TABLE "users" ADD COLUMN "password_changed_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_reset_requested_at" timestamp;