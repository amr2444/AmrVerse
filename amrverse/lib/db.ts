// lib/db.ts
// PostgreSQL local/remote via TCP using node-postgres (pg)

import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function getPool() {
  if (!global.__pgPool) {
    global.__pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Si plus tard tu utilises une DB distante qui exige SSL, décommente:
      // ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
    });
  }
  return global.__pgPool;
}

/**
 * Default export compatible avec ton code actuel:
 *   import sql from "@/lib/db"
 *   const rows = await sql("SELECT ... WHERE id=$1", [id])
 */
export default async function sql<T = any>(query: string, params: any[] = []) {
  const pool = getPool();
  const res = await pool.query<T>(query, params);
  return res.rows;
}

// Helpers (si ton code les utilise)
export async function executeQuery<T>(query: string, params: unknown[] = []): Promise<T[]> {
  return (await sql<T>(query, params as any[])) as T[];
}

export async function executeQuerySingle<T>(query: string, params: unknown[] = []): Promise<T | null> {
  const results = await executeQuery<T>(query, params);
  return results.length > 0 ? results[0] : null;
}
