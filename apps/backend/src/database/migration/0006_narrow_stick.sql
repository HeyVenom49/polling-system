CREATE TYPE "public"."user_plan" AS ENUM('free', 'pro');--> statement-breakpoint
CREATE TYPE "public"."poll_theme" AS ENUM('ocean', 'sunset', 'midnight', 'paper', 'berry', 'meadow');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "plan" "user_plan" DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN "theme_id" "poll_theme" DEFAULT 'ocean' NOT NULL;