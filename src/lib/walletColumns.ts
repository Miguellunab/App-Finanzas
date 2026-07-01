import { sql } from 'drizzle-orm';
import { getDb } from './db';

let ready: Promise<void> | null = null;

export function ensureWalletColumns() {
  ready ??= Promise.all([
    getDb().execute(sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'debit'`),
    getDb().execute(sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS interest_rate real NOT NULL DEFAULT 0`),
    getDb().execute(sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS interest_period text NOT NULL DEFAULT 'EA'`),
    getDb().execute(sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS include_in_balance boolean NOT NULL DEFAULT true`),
  ]).then(() => undefined);
  return ready;
}
