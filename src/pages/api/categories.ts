import type { APIRoute } from 'astro';
import { getDb, schema } from '../../lib/db';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async () => {
  try {
    const db = getDb();
    const categories = await db.select().from(schema.categories)
      .where(eq(schema.categories.isArchived, false))
      .orderBy(schema.categories.name);
    return new Response(JSON.stringify({ data: categories }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const db = getDb();
    const body = await request.json();
    const { name, emoji, color, type, budgetLimit } = body;

    if (!name) return new Response(JSON.stringify({ error: 'name es requerido' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const result = await db.insert(schema.categories).values({
      name, emoji: emoji ?? '📦', color: color ?? '#8b5cf6',
      type: type ?? 'both', budgetLimit: budgetLimit ? parseFloat(budgetLimit) : null,
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
    const { id, name, emoji, color, type, budgetLimit, isArchived } = body;
    if (!id) return new Response(JSON.stringify({ error: 'id requerido' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (emoji !== undefined) updates.emoji = emoji;
    if (color !== undefined) updates.color = color;
    if (type !== undefined) updates.type = type;
    if (budgetLimit !== undefined) updates.budgetLimit = budgetLimit ? parseFloat(budgetLimit) : null;
    if (isArchived !== undefined) updates.isArchived = isArchived;

    const result = await db.update(schema.categories).set(updates).where(eq(schema.categories.id, parseInt(id))).returning();
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
    await db.update(schema.categories).set({ isArchived: true }).where(eq(schema.categories.id, parseInt(id)));
    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
