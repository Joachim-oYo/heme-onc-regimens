import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

/**
 * Drizzle client over Neon's serverless HTTP driver. `DATABASE_URL` is the
 * Neon connection string (set in `.env.local` for dev, Vercel env for prod).
 */
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Add your Neon connection string to .env.local.",
  );
}

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
export { schema };
