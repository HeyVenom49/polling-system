CREATE TYPE "public"."poll_mode" AS ENUM('poll', 'quiz');--> statement-breakpoint
CREATE TYPE "public"."quiz_status" AS ENUM('lobby', 'question_open', 'question_closed', 'finished');--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN "mode" "poll_mode" DEFAULT 'poll' NOT NULL;--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN "quiz_status" "quiz_status";--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN "current_question_id" uuid;--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN "question_ends_at" timestamp;--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN "question_duration_sec" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE "options" ADD COLUMN "is_correct" boolean DEFAULT false NOT NULL;