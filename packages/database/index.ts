import "server-only";

import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { keys } from "./keys";
// biome-ignore lint/performance/noNamespaceImport: drizzle schema initialization requires namespace import
import * as schema from "./src/schema";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: keys().DATABASE_URL });

export const database = drizzle(pool, { schema });

// Re-export drizzle-orm helpers
// biome-ignore lint/performance/noBarrelFile: package entrypoint re-exports query helpers and schema
export {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  or,
  sql,
} from "drizzle-orm";
export * from "./src/schema";
export * from "./src/travel-airports";
export * from "./src/travel-ranking";
