import type { APIRoute } from 'astro';
import { getDb, schema } from '../../lib/db';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async () => {
  try {
    const db = getDb();
    const wallets = await db.select().from(schema.wallets)
      .where(eq(schema.wallets.isArchived, false))
      .orderBy(schema.wallets.createdAt);
    return new Response(JSON.stringify({ data: wallets }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const db = getDb();
    const body = await request.json();
    const { name, emoji, color, currency, balance } = body;

    if (!name) return new Response(JSON.stringify({ error: 'name es requerido' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const result = await db.insert(schema.wallets).values({
      name, emoji: emoji ?? '💳', color: color ?? '#6366f1',
      currency: currency ?? 'COP', balance: parseFloat(balance ?? '0'),
    }).returning();

    return new Response(JSON.stringify({ data: result[0] }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const db = getDb();
    const body = await request.json();
    const { id, name, emoji, color, currency, balance, isArchived } = body;
    if (!id) return new Response(JSON.stringify({ error: 'id requerido' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (emoji !== undefined) updates.emoji = emoji;
    if (color !== undefined) updates.color = color;
    if (currency !== undefined) updates.currency = currency;
    if (balance !== undefined) updates.balance = parseFloat(balance);
    if (isArchived !== undefined) updates.isArchived = isArchived;

    const result = await db.update(schema.wallets).set(updates).where(eq(schema.wallets.id, parseInt(id))).returning();
    return new Response(JSON.stringify({ data: result[0] }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const DELETE: APIRoute = async ({ url }) => {
  try {
    const db = getDb();
    const id = url.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'id requerido' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    // Archivar en lugar de borrar
    await db.update(schema.wallets).set({ isArchived: true }).where(eq(schema.wallets.id, parseInt(id)));
    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
