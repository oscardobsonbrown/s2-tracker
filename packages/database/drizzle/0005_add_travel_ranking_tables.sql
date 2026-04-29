CREATE TABLE "resort_airport_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"resort_id" varchar(128) NOT NULL,
	"airport_id" varchar(128) NOT NULL,
	"distance_km" double precision NOT NULL,
	"access_class" varchar(1) NOT NULL,
	"priority_rank" integer NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resort_weather_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"refresh_date" varchar(10) NOT NULL,
	"resort_id" varchar(128) NOT NULL,
	"snowfall_7_cm" double precision,
	"snowfall_14_cm" double precision,
	"snow_depth_cm" double precision,
	"avg_temp_c" double precision,
	"avg_wind_kmh" double precision,
	"max_elevation_m" integer,
	"default_balanced_score" double precision NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "resort_airport_links_resort_airport_idx" ON "resort_airport_links" USING btree ("resort_id","airport_id");--> statement-breakpoint
CREATE INDEX "resort_airport_links_resort_priority_idx" ON "resort_airport_links" USING btree ("resort_id","priority_rank");--> statement-breakpoint
CREATE INDEX "resort_airport_links_airport_idx" ON "resort_airport_links" USING btree ("airport_id");--> statement-breakpoint
CREATE INDEX "resort_airport_links_access_class_idx" ON "resort_airport_links" USING btree ("access_class");--> statement-breakpoint
CREATE UNIQUE INDEX "resort_weather_scores_refresh_resort_idx" ON "resort_weather_scores" USING btree ("refresh_date","resort_id");--> statement-breakpoint
CREATE INDEX "resort_weather_scores_refresh_idx" ON "resort_weather_scores" USING btree ("refresh_date");--> statement-breakpoint
CREATE INDEX "resort_weather_scores_score_idx" ON "resort_weather_scores" USING btree ("default_balanced_score");--> statement-breakpoint
CREATE INDEX "resort_weather_scores_refresh_score_idx" ON "resort_weather_scores" USING btree ("refresh_date","default_balanced_score");