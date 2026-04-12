import { pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
});
