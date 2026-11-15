CREATE TABLE "user_avatars" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"data" "bytea" NOT NULL,
	"version" varchar(36) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_avatars" ADD CONSTRAINT "user_avatars_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;