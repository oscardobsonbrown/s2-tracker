import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
});

export const skiResorts = pgTable(
  "ski_resorts",
  {
    id: varchar("id", { length: 128 }).primaryKey(),
    name: text("name").notNull(),
    country: text("country"),
    region: text("region"),
    locality: text("locality"),
    status: varchar("status", { length: 64 }).notNull().default("unknown"),
    hasDownhill: boolean("has_downhill"),
    hasNordic: boolean("has_nordic"),
    downhillDistanceKm: doublePrecision("downhill_distance_km"),
    nordicDistanceKm: doublePrecision("nordic_distance_km"),
    verticalM: integer("vertical_m"),
    minElevationM: integer("min_elevation_m"),
    maxElevationM: integer("max_elevation_m"),
    liftCount: integer("lift_count"),
    surfaceLiftsCount: integer("surface_lifts_count"),
    runConvention: varchar("run_convention", { length: 64 }),
    wikidataId: varchar("wikidata_id", { length: 64 }),
    websites: text("websites"),
    openskimapUrl: text("openskimap_url").notNull(),
    geometry: varchar("geometry", { length: 64 }).notNull(),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    sources: text("sources"),
    importedAt: timestamp("imported_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("ski_resorts_country_idx").on(table.country),
    index("ski_resorts_status_idx").on(table.status),
    index("ski_resorts_location_idx").on(table.latitude, table.longitude),
  ]
);
