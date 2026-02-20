import type { APIRoute } from 'astro';
import { getDb, schema } from '../../lib/db';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';

export const GET: APIRoute = async ({ url }) => {
  try {
    const db = getDb();
    const searchParams = url.searchParams;
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const type = searchParams.get('type');
    const categoryId = searchParams.get('categoryId');
    const walletId = searchParams.get('walletId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const conditions = [];
    if (type) conditions.push(eq(schema.transactions.type, type as any));
    if (categoryId) conditions.push(eq(schema.transactions.categoryId, parseInt(categoryId)));
    if (walletId) conditions.push(eq(schema.transactions.walletId, parseInt(walletId)));
    if (startDate) conditions.push(gte(schema.transactions.date, startDate));
    if (endDate) conditions.push(lte(schema.transactions.date, endDate));

    const txs = await db
      .select({
        id: schema.transactions.id,
        type: schema.transactions.type,
        amount: schema.transactions.amount,
        currency: schema.transactions.currency,
        description: schema.transactions.description,
        date: schema.transactions.date,
        aiGenerated: schema.transactions.aiGenerated,
        rawInput: schema.transactions.rawInput,
        createdAt: schema.transactions.createdAt,
        categoryId: schema.transactions.categoryId,
        walletId: schema.transactions.walletId,
        walletDestinationId: schema.transactions.walletDestinationId,
        categoryName: schema.categories.name,
        categoryEmoji: schema.categories.emoji,
        categoryColor: schema.categories.color,
        walletName: schema.wallets.name,
        walletEmoji: schema.wallets.emoji,
      })
      .from(schema.transactions)
      .leftJoin(schema.categories, eq(schema.transactions.categoryId, schema.categories.id))
      .leftJoin(schema.wallets, eq(schema.transactions.walletId, schema.wallets.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(schema.transactions.date), desc(schema.transactions.createdAt))
      .limit(limit)
      .offset(offset);

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.transactions)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return new Response(JSON.stringify({ data: txs, total: total[0].count }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const db = getDb();
    const body = await request.json();
    const { type, amount, currency, categoryId, walletId, walletDestinationId, description, aiGenerated, rawInput, date } = body;

    if (!type || !amount || !walletId) {
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos: type, amount, walletId' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    // Insertar transacción
    const result = await db.insert(schema.transactions).values({
      type, amount: parseFloat(amount), currency: currency ?? 'COP',
      categoryId: categoryId ? parseInt(categoryId) : null,
      walletId: parseInt(walletId),
      walletDestinationId: walletDestinationId ? parseInt(walletDestinationId) : null,
      description: description ?? '', aiGenerated: aiGenerated ?? false,
      rawInput: rawInput ?? null, date: date ?? new Date().toISOString().split('T')[0],
    }).returning();

    // Actualizar balance de wallet origen
    if (type === 'expense' || type === 'transfer') {
      await db.update(schema.wallets)
        .set({ balance: sql`balance - ${parseFloat(amount)}` })
        .where(eq(schema.wallets.id, parseInt(walletId)));
    } else if (type === 'income') {
      await db.update(schema.wallets)
        .set({ balance: sql`balance + ${parseFloat(amount)}` })
        .where(eq(schema.wallets.id, parseInt(walletId)));
    }

    // Si es transferencia, actualizar wallet destino
    if (type === 'transfer' && walletDestinationId) {
      await db.update(schema.wallets)
        .set({ balance: sql`balance + ${parseFloat(amount)}` })
        .where(eq(schema.wallets.id, parseInt(walletDestinationId)));
    }

    return new Response(JSON.stringify({ data: result[0] }), {
      status: 201, headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const DELETE: APIRoute = async ({ url }) => {
  try {
    const db = getDb();
    const id = url.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'id requerido' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    // Obtener transacción para revertir el balance
    const tx = await db.select().from(schema.transactions).where(eq(schema.transactions.id, parseInt(id))).limit(1);
    if (!tx.length) return new Response(JSON.stringify({ error: 'Transacción no encontrada' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

    const { type, amount, walletId, walletDestinationId } = tx[0];

    // Revertir balance
    if (type === 'expense' || type === 'transfer') {
      await db.update(schema.wallets).set({ balance: sql`balance + ${amount}` }).where(eq(schema.wallets.id, walletId));
    } else if (type === 'income') {
      await db.update(schema.wallets).set({ balance: sql`balance - ${amount}` }).where(eq(schema.wallets.id, walletId));
    }
    if (type === 'transfer' && walletDestinationId) {
      await db.update(schema.wallets).set({ balance: sql`balance - ${amount}` }).where(eq(schema.wallets.id, walletDestinationId));
    }

    await db.delete(schema.transactions).where(eq(schema.transactions.id, parseInt(id)));

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
