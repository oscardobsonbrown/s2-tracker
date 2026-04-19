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

export const airports = pgTable(
  "airports",
  {
    id: varchar("id", { length: 128 }).primaryKey(),
    ourairportsId: integer("ourairports_id").notNull().unique(),
    ident: varchar("ident", { length: 32 }).notNull().unique(),
    type: varchar("type", { length: 64 }).notNull(),
    name: text("name").notNull(),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    elevationFt: integer("elevation_ft"),
    continent: varchar("continent", { length: 8 }),
    isoCountry: varchar("iso_country", { length: 8 }),
    isoRegion: varchar("iso_region", { length: 32 }),
    municipality: text("municipality"),
    scheduledService: boolean("scheduled_service").notNull().default(false),
    icaoCode: varchar("icao_code", { length: 16 }),
    iataCode: varchar("iata_code", { length: 8 }),
    gpsCode: varchar("gps_code", { length: 32 }),
    localCode: varchar("local_code", { length: 32 }),
    homeLink: text("home_link"),
    wikipediaLink: text("wikipedia_link"),
    keywords: text("keywords"),
    sourceUrl: text("source_url").notNull(),
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
    index("airports_location_idx").on(table.latitude, table.longitude),
    index("airports_iata_code_idx").on(table.iataCode),
    index("airports_icao_code_idx").on(table.icaoCode),
    index("airports_type_idx").on(table.type),
    index("airports_country_idx").on(table.isoCountry),
    index("airports_scheduled_service_idx").on(table.scheduledService),
  ]
);
