import { sql } from 'drizzle-orm';
import { getDb } from './db';

let ready: Promise<void> | null = null;

export function ensureWalletColumns() {
  ready ??= Promise.all([
    getDb().execute(sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'debit'`),
    getDb().execute(sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS interest_rate real NOT NULL DEFAULT 0`),
    getDb().execute(sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS interest_period text NOT NULL DEFAULT 'EA'`),
    getDb().execute(sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS credit_limit real NOT NULL DEFAULT 0`),
    getDb().execute(sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS statement_day integer`),
    getDb().execute(sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS due_day integer`),
    getDb().execute(sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS interest_from_first_installment boolean NOT NULL DEFAULT false`),
    getDb().execute(sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS source_wallet_id integer`),
    getDb().execute(sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS vault_end_date text`),
    getDb().execute(sql`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS include_in_balance boolean NOT NULL DEFAULT true`),
    getDb().execute(sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS installments integer NOT NULL DEFAULT 1`),
    getDb().execute(sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS interest_applied boolean NOT NULL DEFAULT false`),
  ]).then(() => undefined);
  return ready;
}
