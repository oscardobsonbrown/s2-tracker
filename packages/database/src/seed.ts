import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { pages } from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ No database URL provided. Set DATABASE_URL.");
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });
const db = drizzle(pool);

const samplePages = [
  { name: "Home" },
  { name: "About" },
  { name: "Contact" },
  { name: "Products" },
  { name: "Blog" },
];

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Check if pages already exist
    const existingPages = await db.select().from(pages);

    if (existingPages.length > 0) {
      console.log(
        `⚠️  ${existingPages.length} pages already exist. Skipping seed.`
      );
      return;
    }

    // Insert sample pages
    const result = await db.insert(pages).values(samplePages).returning();

    console.log(`✅ Seeded ${result.length} pages successfully!`);
    console.log("📄 Pages:");
    for (const page of result) {
      console.log(`   - ${page.name} (id: ${page.id})`);
    }
  } catch (error) {
    console.error("❌ Failed to seed database:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
