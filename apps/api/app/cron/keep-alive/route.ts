export const GET = async () => {
  if (!process.env.DATABASE_URL) {
    return new Response("Database not configured", { status: 503 });
  }

  const { database, eq, pages } = await import("@repo/database");

  // Insert a test page
  const [newPage] = await database
    .insert(pages)
    .values({
      name: "cron-temp",
    })
    .returning();

  // Delete the test page
  await database.delete(pages).where(eq(pages.id, newPage.id));

  return new Response("OK", { status: 200 });
};
