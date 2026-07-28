DO $$ BEGIN
  CREATE TYPE "public"."poll_mode" AS ENUM('poll', 'quiz');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."quiz_status" AS ENUM('lobby', 'question_open', 'question_closed', 'finished');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN IF NOT EXISTS "mode" "poll_mode" DEFAULT 'poll' NOT NULL;
--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN IF NOT EXISTS "quiz_status" "quiz_status";
--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN IF NOT EXISTS "current_question_id" uuid;
--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN IF NOT EXISTS "question_ends_at" timestamp;
--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN IF NOT EXISTS "question_duration_sec" integer DEFAULT 30 NOT NULL;
--> statement-breakpoint
ALTER TABLE "options" ADD COLUMN IF NOT EXISTS "is_correct" boolean DEFAULT false NOT NULL;
