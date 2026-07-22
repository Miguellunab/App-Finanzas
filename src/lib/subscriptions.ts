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

export function nextChargeDateAfter(chargeDate: string, day: number) {
  const base = new Date(`${chargeDate}T00:00:00Z`);
  const nextMonth = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 1));
  const lastDay = new Date(Date.UTC(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth() + 1, 0)).getUTCDate();
  return new Date(Date.UTC(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth(), Math.min(day, lastDay))).toISOString().slice(0, 10);
}

export async function processDueSubscriptions() {
  const result = await getDb().execute<{
    pending: number;
  }>(sql`select count(*)::int as pending from public.subscriptions where is_archived = false and next_charge_date <= ${today()}`);
  const row = result.rows[0];
  return {
    processed: 0,
    pending: Number(row?.pending ?? 0),
    skippedArchived: 0,
    orphaned: 0,
  };
}
