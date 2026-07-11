import type { APIRoute } from 'astro';
import { getDb, schema } from '../../lib/db';
import { eq } from 'drizzle-orm';
import { nextChargeDateForDay } from '../../lib/subscriptions';

export const GET: APIRoute = async () => {
  try {
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
    const id = url.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'id requerido' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    await getDb().update(schema.subscriptions).set({ isArchived: true }).where(eq(schema.subscriptions.id, parseInt(id)));
    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
