CREATE TABLE "competition_blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"block_id" integer NOT NULL,
	"date" date NOT NULL,
	"name_location" varchar(255) NOT NULL,
	"distance_meters" integer,
	"distance_label" varchar(64) NOT NULL,
	"priority" varchar(16) DEFAULT 'regular' NOT NULL,
	"result" varchar(32),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "competition_blocks" ADD CONSTRAINT "competition_blocks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_block_id_competition_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."competition_blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "competition_blocks_user_start_sort_idx" ON "competition_blocks" USING btree ("user_id","start_date","sort_order");--> statement-breakpoint
CREATE INDEX "competitions_block_date_sort_idx" ON "competitions" USING btree ("block_id","date","sort_order");