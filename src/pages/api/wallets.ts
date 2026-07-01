import type { APIRoute } from 'astro';
import { getDb, schema } from '../../lib/db';
import { eq } from 'drizzle-orm';
import { ensureWalletColumns } from '../../lib/walletColumns';

export const GET: APIRoute = async () => {
  try {
    await ensureWalletColumns();
    const db = getDb();
    const wallets = await db.select().from(schema.wallets).where(eq(schema.wallets.isArchived, false)).orderBy(schema.wallets.createdAt);
    return new Response(JSON.stringify({ data: wallets }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    await ensureWalletColumns();
    const db = getDb();
    const body = await request.json();
    const { name, emoji, color, currency, balance, type, interestRate, interestPeriod, includeInBalance } = body;

    if (!name) return new Response(JSON.stringify({ error: 'name es requerido' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const result = await db.insert(schema.wallets).values({
      name,
      emoji: emoji ?? '💳',
      color: color ?? '#6366f1',
      currency: currency ?? 'COP',
      balance: parseFloat(balance ?? '0'),
      type: type ?? 'debit',
      interestRate: parseFloat(interestRate ?? '0'),
      interestPeriod: interestPeriod ?? 'EA',
      includeInBalance: includeInBalance ?? true,
    }).returning();

    return new Response(JSON.stringify({ data: result[0] }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    await ensureWalletColumns();
    const db = getDb();
    const body = await request.json();
    const { id, name, emoji, color, currency, balance, type, interestRate, interestPeriod, includeInBalance, isArchived } = body;
    if (!id) return new Response(JSON.stringify({ error: 'id requerido' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (emoji !== undefined) updates.emoji = emoji;
    if (color !== undefined) updates.color = color;
    if (currency !== undefined) updates.currency = currency;
    if (balance !== undefined) updates.balance = parseFloat(balance);
    if (type !== undefined) updates.type = type;
    if (interestRate !== undefined) updates.interestRate = parseFloat(interestRate);
    if (interestPeriod !== undefined) updates.interestPeriod = interestPeriod;
    if (includeInBalance !== undefined) updates.includeInBalance = includeInBalance;
    if (isArchived !== undefined) updates.isArchived = isArchived;

    const result = await db.update(schema.wallets).set(updates).where(eq(schema.wallets.id, parseInt(id))).returning();
    return new Response(JSON.stringify({ data: result[0] }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const DELETE: APIRoute = async ({ url }) => {
  try {
    await ensureWalletColumns();
    const db = getDb();
    const id = url.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'id requerido' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    await db.update(schema.wallets).set({ isArchived: true }).where(eq(schema.wallets.id, parseInt(id)));
    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
