import { pathToFileURL } from "node:url";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { loadDatabaseEnv } from "./load-database-env";
import { airports, resortAirportLinks, skiResorts } from "./schema";
import { pickResortAirportCandidates } from "./travel-airports";

const batchSize = 500;

type ResortAirportLinkInsert = typeof resortAirportLinks.$inferInsert;

export async function importResortAirportLinks() {
  loadDatabaseEnv();

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("DATABASE_URL must be set.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  try {
    const [resorts, airportRows] = await Promise.all([
      db.select().from(skiResorts),
      db.select().from(airports),
    ]);

    const links: ResortAirportLinkInsert[] = resorts.flatMap((resort) =>
      pickResortAirportCandidates(
        {
          resortId: resort.id,
          latitude: resort.latitude,
          longitude: resort.longitude,
        },
        airportRows.map((airport) => ({
          airportId: airport.id,
          iataCode: airport.iataCode,
          keywords: airport.keywords,
          latitude: airport.latitude,
          longitude: airport.longitude,
          name: airport.name,
          scheduledService: airport.scheduledService,
          type: airport.type,
        }))
      ).map((link) => ({
        resortId: resort.id,
        airportId: link.airportId,
        distanceKm: link.distanceKm,
        accessClass: link.accessClass,
        priorityRank: link.priorityRank,
        isPrimary: link.isPrimary,
        updatedAt: new Date(),
      }))
    );

    await db.transaction(async (transaction) => {
      await transaction.delete(resortAirportLinks);

      for (let index = 0; index < links.length; index += batchSize) {
        const batch = links.slice(index, index + batchSize);
        await transaction.insert(resortAirportLinks).values(batch);
      }
    });

    console.log(`Imported ${links.length} resort airport links.`);
  } finally {
    await pool.end();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  importResortAirportLinks().catch((error) => {
    console.error("Failed to import resort airport links:", error);
    process.exit(1);
  });
}
