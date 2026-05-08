CREATE TABLE "categories" (
	"id" text PRIMARY KEY,
	"label" text NOT NULL,
	"icon" text DEFAULT 'projector' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"cat" text NOT NULL,
	"cat_label" text DEFAULT '' NOT NULL,
	"old_price" double precision DEFAULT 0 NOT NULL,
	"price" double precision DEFAULT 0 NOT NULL,
	"img" text,
	"photos" jsonb DEFAULT '[]',
	"videos" jsonb DEFAULT '[]',
	"description" text DEFAULT '',
	"condition" text DEFAULT '',
	"icon" text DEFAULT 'projector',
	"color" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_cat_categories_id_fkey" FOREIGN KEY ("cat") REFERENCES "categories"("id") ON DELETE SET NULL;