CREATE TYPE "public"."poll_status" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TABLE "polls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"creator_id" uuid NOT NULL,
	"require_authentication" boolean DEFAULT false NOT NULL,
	"expire_at" timestamp,
	"status" "poll_status" DEFAULT 'open' NOT NULL,
	"result_published" boolean DEFAULT false NOT NULL,
	"share_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "polls_share_id_unique" UNIQUE("share_id")
);
--> statement-breakpoint
ALTER TABLE "polls" ADD CONSTRAINT "polls_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "idx_polls_creator_id" ON "polls" USING btree ("creator_id");