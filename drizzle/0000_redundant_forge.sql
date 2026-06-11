CREATE TABLE "alice_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"alice_user_id" text NOT NULL,
	"linked_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "alice_accounts_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "alice_accounts_alice_user_id_unique" UNIQUE("alice_user_id")
);
--> statement-breakpoint
CREATE TABLE "alice_link_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"code" varchar(16) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diary_result_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"name" varchar(255) NOT NULL,
	"code" varchar(64),
	"match_pattern" text,
	"schema" jsonb NOT NULL,
	"output_template" text NOT NULL,
	"is_inline" boolean DEFAULT false NOT NULL,
	"calculations" jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"type" varchar(32) DEFAULT 'common' NOT NULL,
	"level" varchar(32) DEFAULT 'general' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"distance_key" varchar(16) NOT NULL,
	"time_text" varchar(16) NOT NULL,
	"record_date" date NOT NULL,
	"race_name" varchar(255),
	"race_city" varchar(255),
	"protocol_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"import_id" integer,
	"date" date NOT NULL,
	"session_order" integer DEFAULT 1 NOT NULL,
	"task_text" text NOT NULL,
	"comment_text" text,
	"is_workload" boolean DEFAULT false NOT NULL,
	"raw_row" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_imports" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"filename" varchar(255),
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"row_count" integer,
	"inserted_count" integer,
	"skipped_count" integer,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"date" date NOT NULL,
	"type" varchar(64) NOT NULL,
	"target_distance_km" numeric(6, 2),
	"target_time_sec" integer,
	"target_pace" varchar(16),
	"target_zone" varchar(16),
	"comment" text
);
--> statement-breakpoint
CREATE TABLE "recovery_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"date" date NOT NULL,
	"has_bath" boolean DEFAULT false NOT NULL,
	"has_mfr" boolean DEFAULT false NOT NULL,
	"has_massage" boolean DEFAULT false NOT NULL,
	"recovery_other" text,
	"overall_score" integer,
	"functional_score" integer,
	"muscle_score" integer,
	"sleep_hours" numeric(4, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registration_invites" (
	"id" serial PRIMARY KEY NOT NULL,
	"token_hash" text NOT NULL,
	"role" varchar(32) NOT NULL,
	"created_by_user_id" integer NOT NULL,
	"used_by_user_id" integer,
	"used_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"mileage_limit_km" numeric(7, 2),
	"current_mileage_km" numeric(7, 2),
	"notify_on_limit_email" boolean DEFAULT false NOT NULL,
	"notify_on_limit_telegram" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telegram_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"chat_id" bigint NOT NULL,
	"username" varchar(64),
	"first_name" varchar(128),
	"linked_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "telegram_accounts_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "telegram_accounts_chat_id_unique" UNIQUE("chat_id")
);
--> statement-breakpoint
CREATE TABLE "telegram_link_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"consumed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telegram_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"chat_id" bigint NOT NULL,
	"send_time" varchar(5),
	"enabled" boolean DEFAULT false NOT NULL,
	"last_sent_on" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "telegram_subscriptions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"login" varchar(64) NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(32) DEFAULT 'athlete' NOT NULL,
	"timezone" varchar(64) DEFAULT 'Europe/Moscow' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"name" varchar(255) NOT NULL,
	"last_name" varchar(255),
	"gender" varchar(16) DEFAULT 'male' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"email_verified" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_login_unique" UNIQUE("login")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	"type" varchar(32) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weight_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"date" date NOT NULL,
	"period" varchar(16) NOT NULL,
	"weight_kg" numeric(5, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_report_conditions" (
	"id" serial PRIMARY KEY NOT NULL,
	"workout_report_id" integer NOT NULL,
	"weather" varchar(255),
	"has_wind" boolean,
	"temperature_c" numeric(5, 1),
	"surface" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_report_shoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"workout_report_id" integer NOT NULL,
	"shoe_id" integer NOT NULL,
	"mileage_km" numeric(7, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"plan_entry_id" integer NOT NULL,
	"date" date NOT NULL,
	"start_time" varchar(5),
	"result_text" text NOT NULL,
	"comment_text" text,
	"distance_km" numeric(6, 2),
	"overall_score" integer,
	"functional_score" integer,
	"muscle_score" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"date" date NOT NULL,
	"type" varchar(64) NOT NULL,
	"distance_km" numeric(6, 2),
	"time_sec" integer,
	"avg_hr" integer,
	"rpe" integer,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alice_accounts" ADD CONSTRAINT "alice_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alice_link_codes" ADD CONSTRAINT "alice_link_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diary_result_templates" ADD CONSTRAINT "diary_result_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_entries" ADD CONSTRAINT "plan_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_entries" ADD CONSTRAINT "plan_entries_import_id_plan_imports_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."plan_imports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_imports" ADD CONSTRAINT "plan_imports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_entries" ADD CONSTRAINT "recovery_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_invites" ADD CONSTRAINT "registration_invites_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_invites" ADD CONSTRAINT "registration_invites_used_by_user_id_users_id_fk" FOREIGN KEY ("used_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shoes" ADD CONSTRAINT "shoes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_accounts" ADD CONSTRAINT "telegram_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_link_codes" ADD CONSTRAINT "telegram_link_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_subscriptions" ADD CONSTRAINT "telegram_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weight_entries" ADD CONSTRAINT "weight_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_report_conditions" ADD CONSTRAINT "workout_report_conditions_workout_report_id_workout_reports_id_fk" FOREIGN KEY ("workout_report_id") REFERENCES "public"."workout_reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_report_shoes" ADD CONSTRAINT "workout_report_shoes_workout_report_id_workout_reports_id_fk" FOREIGN KEY ("workout_report_id") REFERENCES "public"."workout_reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_report_shoes" ADD CONSTRAINT "workout_report_shoes_shoe_id_shoes_id_fk" FOREIGN KEY ("shoe_id") REFERENCES "public"."shoes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_reports" ADD CONSTRAINT "workout_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_reports" ADD CONSTRAINT "workout_reports_plan_entry_id_plan_entries_id_fk" FOREIGN KEY ("plan_entry_id") REFERENCES "public"."plan_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "alice_link_codes_code_idx" ON "alice_link_codes" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "personal_records_user_distance_idx" ON "personal_records" USING btree ("user_id","distance_key");--> statement-breakpoint
CREATE INDEX "personal_records_user_idx" ON "personal_records" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "plan_entries_user_date_idx" ON "plan_entries" USING btree ("user_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "recovery_entries_user_date_idx" ON "recovery_entries" USING btree ("user_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "registration_invites_token_hash_idx" ON "registration_invites" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "registration_invites_expires_at_idx" ON "registration_invites" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "shoes_user_id_idx" ON "shoes" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "verification_tokens_identifier_token_idx" ON "verification_tokens" USING btree ("identifier","token");--> statement-breakpoint
CREATE UNIQUE INDEX "weight_entries_user_date_period_idx" ON "weight_entries" USING btree ("user_id","date","period");--> statement-breakpoint
CREATE UNIQUE INDEX "workout_report_conditions_report_idx" ON "workout_report_conditions" USING btree ("workout_report_id");--> statement-breakpoint
CREATE INDEX "workout_report_shoes_report_idx" ON "workout_report_shoes" USING btree ("workout_report_id");--> statement-breakpoint
CREATE INDEX "workout_report_shoes_shoe_idx" ON "workout_report_shoes" USING btree ("shoe_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workout_report_shoes_unique_idx" ON "workout_report_shoes" USING btree ("workout_report_id","shoe_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workout_reports_user_plan_entry_idx" ON "workout_reports" USING btree ("user_id","plan_entry_id");