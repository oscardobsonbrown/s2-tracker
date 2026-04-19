CREATE TABLE "airports" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"ourairports_id" integer NOT NULL,
	"ident" varchar(32) NOT NULL,
	"type" varchar(64) NOT NULL,
	"name" text NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"elevation_ft" integer,
	"continent" varchar(8),
	"iso_country" varchar(8),
	"iso_region" varchar(32),
	"municipality" text,
	"scheduled_service" boolean DEFAULT false NOT NULL,
	"icao_code" varchar(16),
	"iata_code" varchar(8),
	"gps_code" varchar(32),
	"local_code" varchar(32),
	"home_link" text,
	"wikipedia_link" text,
	"keywords" text,
	"source_url" text NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "airports_ourairports_id_unique" UNIQUE("ourairports_id"),
	CONSTRAINT "airports_ident_unique" UNIQUE("ident")
);
--> statement-breakpoint
CREATE INDEX "airports_location_idx" ON "airports" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "airports_iata_code_idx" ON "airports" USING btree ("iata_code");--> statement-breakpoint
CREATE INDEX "airports_icao_code_idx" ON "airports" USING btree ("icao_code");--> statement-breakpoint
CREATE INDEX "airports_type_idx" ON "airports" USING btree ("type");--> statement-breakpoint
CREATE INDEX "airports_country_idx" ON "airports" USING btree ("iso_country");--> statement-breakpoint
CREATE INDEX "airports_scheduled_service_idx" ON "airports" USING btree ("scheduled_service");