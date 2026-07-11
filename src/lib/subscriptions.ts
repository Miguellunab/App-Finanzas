import { sql } from 'drizzle-orm';
import { getDb } from './db';

export function today() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
}

export function nextChargeDateForDay(day: number) {
  const base = new Date(`${today()}T00:00:00`);
  const lastThisMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  const thisMonth = new Date(base.getFullYear(), base.getMonth(), Math.min(day, lastThisMonth));
  if (thisMonth >= base) return thisMonth.toISOString().slice(0, 10);
  const lastNextMonth = new Date(base.getFullYear(), base.getMonth() + 2, 0).getDate();
  return new Date(base.getFullYear(), base.getMonth() + 1, Math.min(day, lastNextMonth)).toISOString().slice(0, 10);
}

export async function processDueSubscriptions() {
  const result = await getDb().execute<{
    processed: number;
    pending: number;
    skipped_archived: number;
    orphaned: number;
  }>(
    sql`select * from public.process_due_subscriptions_detailed(${today()}::date)`,
  );
  const row = result.rows[0];
  return {
    processed: Number(row?.processed ?? 0),
    pending: Number(row?.pending ?? 0),
    skippedArchived: Number(row?.skipped_archived ?? 0),
    orphaned: Number(row?.orphaned ?? 0),
  };
}
