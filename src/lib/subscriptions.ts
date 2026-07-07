import { and, eq, lte, sql } from 'drizzle-orm';
import { getDb, schema } from './db';
import { ensureSubscriptionColumns } from './subscriptionColumns';
import { ensureWalletColumns } from './walletColumns';

export function today() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
}

function nextMonthlyDate(from: string, day: number) {
  const base = new Date(`${from}T00:00:00`);
  const y = base.getFullYear();
  const m = base.getMonth() + 1;
  const last = new Date(y, m + 1, 0).getDate();
  return new Date(y, m, Math.min(day, last)).toISOString().slice(0, 10);
}

export function nextChargeDateForDay(day: number) {
  const base = new Date(`${today()}T00:00:00`);
  const lastThisMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  const thisMonth = new Date(base.getFullYear(), base.getMonth(), Math.min(day, lastThisMonth));
  if (thisMonth >= base) return thisMonth.toISOString().slice(0, 10);
  const lastNextMonth = new Date(base.getFullYear(), base.getMonth() + 2, 0).getDate();
  return new Date(base.getFullYear(), base.getMonth() + 1, Math.min(day, lastNextMonth)).toISOString().slice(0, 10);
}

export async function chargeDueSubscriptions() {
  await ensureWalletColumns();
  await ensureSubscriptionColumns();
  const db = getDb();
  const date = today();
  const due = await db.select().from(schema.subscriptions).where(and(eq(schema.subscriptions.isArchived, false), lte(schema.subscriptions.nextChargeDate, date)));

  for (const sub of due) {
    const existing = await db.select({ id: schema.transactions.id })
      .from(schema.transactions)
      .where(and(
        eq(schema.transactions.type, 'expense'),
        eq(schema.transactions.walletId, sub.walletId),
        eq(schema.transactions.amount, sub.amount),
        eq(schema.transactions.date, sub.nextChargeDate),
        eq(schema.transactions.description, `Suscripcion: ${sub.name}`),
      ))
      .limit(1);

    if (!existing.length) {
      await db.insert(schema.transactions).values({
        type: 'expense',
        amount: sub.amount,
        currency: sub.currency,
        walletId: sub.walletId,
        description: `Suscripcion: ${sub.name}`,
        expenseKind: 'fixed',
        date: sub.nextChargeDate,
      });

      const wallet = await db.select({ type: schema.wallets.type }).from(schema.wallets).where(eq(schema.wallets.id, sub.walletId)).limit(1);
      await db.update(schema.wallets)
        .set({ balance: wallet[0]?.type === 'credit' ? sql`balance + ${sub.amount}` : sql`balance - ${sub.amount}` })
        .where(eq(schema.wallets.id, sub.walletId));
    }

    await db.update(schema.subscriptions)
      .set({ lastChargedDate: sub.nextChargeDate, nextChargeDate: nextMonthlyDate(date, sub.chargeDay) })
      .where(eq(schema.subscriptions.id, sub.id));
  }
}
