CREATE TABLE "competition_result_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"telegram_account_id" integer NOT NULL,
	"chat_id" bigint NOT NULL,
	"competition_id" integer NOT NULL,
	"competition_date" date NOT NULL,
	"lease_token" varchar(36),
	"lease_expires_at" timestamp,
	"sent_at" timestamp,
	"prompt_message_id" integer,
	"result_snapshot" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "competitions" ADD COLUMN "is_skipped" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "competition_result_requests" ADD CONSTRAINT "competition_result_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_result_requests" ADD CONSTRAINT "competition_result_requests_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "competition_result_requests_competition_date_idx" ON "competition_result_requests" USING btree ("competition_id","competition_date");--> statement-breakpoint
CREATE INDEX "competition_result_requests_chat_prompt_idx" ON "competition_result_requests" USING btree ("chat_id","prompt_message_id");