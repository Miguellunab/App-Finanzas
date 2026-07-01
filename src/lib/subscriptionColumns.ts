import { sql } from 'drizzle-orm';
import { getDb } from './db';

export async function ensureSubscriptionColumns() {
  await getDb().execute(sql`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      name text NOT NULL,
      amount real NOT NULL,
      currency text NOT NULL DEFAULT 'COP',
      wallet_id integer NOT NULL REFERENCES wallets(id),
      charge_day integer NOT NULL,
      next_charge_date text NOT NULL,
      last_charged_date text,
      is_archived boolean NOT NULL DEFAULT false,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
}
