CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"username" text NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
