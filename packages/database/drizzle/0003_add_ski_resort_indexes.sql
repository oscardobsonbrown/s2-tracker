CREATE INDEX "ski_resorts_country_idx" ON "ski_resorts" USING btree ("country");--> statement-breakpoint
CREATE INDEX "ski_resorts_status_idx" ON "ski_resorts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ski_resorts_location_idx" ON "ski_resorts" USING btree ("latitude","longitude");