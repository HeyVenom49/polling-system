CREATE TABLE "options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"value" varchar(255) NOT NULL,
	"display_order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "options_question_id_display_order_unique" UNIQUE("question_id","display_order"),
	CONSTRAINT "options_question_id_value_unique" UNIQUE("question_id","value"),
	CONSTRAINT "options_display_order_non_negative" CHECK ("options"."display_order" >= 0),
	CONSTRAINT "options_value_not_blank" CHECK (length(trim("options"."value")) > 0)
);
--> statement-breakpoint
CREATE TABLE "guests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_id" uuid NOT NULL,
	"user_id" uuid,
	"guest_id" uuid,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "response_poll_id_user_id_unique" UNIQUE("poll_id","user_id"),
	CONSTRAINT "response_poll_id_guest_id_unique" UNIQUE("poll_id","guest_id"),
	CONSTRAINT "response_one_identity" CHECK ((
                ("responses"."user_id" IS NOT NULL AND "responses"."guest_id" IS NULL)
                OR
                ("responses"."user_id" IS NULL AND "responses"."guest_id" IS NOT NULL)
            ))
);
--> statement-breakpoint
CREATE TABLE "answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"response_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"option_id" uuid NOT NULL,
	CONSTRAINT "answers_response_id_question_id_unique" UNIQUE("response_id","question_id")
);
--> statement-breakpoint
ALTER TABLE "options" ADD CONSTRAINT "options_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_option_id_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."options"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "idx_options_question_id" ON "options" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "idx_response_poll_id" ON "responses" USING btree ("poll_id");--> statement-breakpoint
CREATE INDEX "idx_answers_response_id" ON "answers" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "idx_answers_question_id" ON "answers" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "idx_answers_option_id" ON "answers" USING btree ("option_id");