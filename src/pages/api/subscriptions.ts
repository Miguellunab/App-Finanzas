import type { APIRoute } from 'astro';
import { getDb, schema } from '../../lib/db';
import { eq, lte, and, sql } from 'drizzle-orm';
import { ensureWalletColumns } from '../../lib/walletColumns';
import { ensureSubscriptionColumns } from '../../lib/subscriptionColumns';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nextMonthlyDate(from: string, day: number) {
  const base = new Date(`${from}T00:00:00`);
  const y = base.getFullYear();
  const m = base.getMonth() + 1;
  const last = new Date(y, m + 1, 0).getDate();
  return new Date(y, m, Math.min(day, last)).toISOString().slice(0, 10);
}

function nextChargeDateForDay(day: number) {
  const base = new Date(`${today()}T00:00:00`);
  const lastThisMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  const thisMonth = new Date(base.getFullYear(), base.getMonth(), Math.min(day, lastThisMonth));
  if (thisMonth >= base) return thisMonth.toISOString().slice(0, 10);
  const lastNextMonth = new Date(base.getFullYear(), base.getMonth() + 2, 0).getDate();
  return new Date(base.getFullYear(), base.getMonth() + 1, Math.min(day, lastNextMonth)).toISOString().slice(0, 10);
}

async function chargeDueSubscriptions() {
  const db = getDb();
  const date = today();
  const due = await db.select().from(schema.subscriptions).where(and(eq(schema.subscriptions.isArchived, false), lte(schema.subscriptions.nextChargeDate, date)));

  for (const sub of due) {
    await db.insert(schema.transactions).values({
      type: 'expense',
      amount: sub.amount,
      currency: sub.currency,
      walletId: sub.walletId,
      description: `Suscripcion: ${sub.name}`,
      date: sub.nextChargeDate,
    });

    const wallet = await db.select({ type: schema.wallets.type }).from(schema.wallets).where(eq(schema.wallets.id, sub.walletId)).limit(1);
    await db.update(schema.wallets)
      .set({ balance: wallet[0]?.type === 'credit' ? sql`balance + ${sub.amount}` : sql`balance - ${sub.amount}` })
      .where(eq(schema.wallets.id, sub.walletId));

    await db.update(schema.subscriptions)
      .set({ lastChargedDate: sub.nextChargeDate, nextChargeDate: nextMonthlyDate(date, sub.chargeDay) })
      .where(eq(schema.subscriptions.id, sub.id));
  }
}

export const GET: APIRoute = async () => {
  try {
    await ensureWalletColumns();
    await ensureSubscriptionColumns();
    await chargeDueSubscriptions();
    const data = await getDb()
      .select({
        id: schema.subscriptions.id,
        name: schema.subscriptions.name,
        amount: schema.subscriptions.amount,
        currency: schema.subscriptions.currency,
        walletId: schema.subscriptions.walletId,
        chargeDay: schema.subscriptions.chargeDay,
        nextChargeDate: schema.subscriptions.nextChargeDate,
        lastChargedDate: schema.subscriptions.lastChargedDate,
        walletName: schema.wallets.name,
        walletEmoji: schema.wallets.emoji,
      })
      .from(schema.subscriptions)
      .leftJoin(schema.wallets, eq(schema.subscriptions.walletId, schema.wallets.id))
      .where(eq(schema.subscriptions.isArchived, false))
      .orderBy(schema.subscriptions.nextChargeDate);

    return new Response(JSON.stringify({ data }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    await ensureWalletColumns();
    await ensureSubscriptionColumns();
    const body = await request.json();
    const amount = parseFloat(body.amount);
    const walletId = parseInt(body.walletId);
    const chargeDay = parseInt(body.chargeDay);

    if (!body.name || !amount || !walletId || chargeDay < 1 || chargeDay > 31) {
      return new Response(JSON.stringify({ error: 'Nombre, dia, valor y billetera son requeridos' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const result = await getDb().insert(schema.subscriptions).values({
      name: body.name,
      amount,
      currency: body.currency ?? 'COP',
      walletId,
      chargeDay,
      nextChargeDate: nextChargeDateForDay(chargeDay),
    }).returning();

    return new Response(JSON.stringify({ data: result[0] }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const DELETE: APIRoute = async ({ url }) => {
  try {
    await ensureSubscriptionColumns();
    const id = url.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'id requerido' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    await getDb().update(schema.subscriptions).set({ isArchived: true }).where(eq(schema.subscriptions.id, parseInt(id)));
    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
