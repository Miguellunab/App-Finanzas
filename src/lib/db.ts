import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    if (!import.meta.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is missing in environment variables");
    }
    const sql = neon(import.meta.env.DATABASE_URL);
    _db = drizzle({ client: sql, schema });
  }
  return _db;
}

export { schema };
