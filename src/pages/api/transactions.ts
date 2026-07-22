import type { APIRoute } from 'astro';
import { getDb, schema } from '../../lib/db';
import { eq, desc, and, gte, lte, or, sql } from 'drizzle-orm';
import { today } from '../../lib/subscriptions';
import { applyToWallets } from '../../lib/transactionBalances';

export const GET: APIRoute = async ({ url }) => {
  try {
    const db = getDb();
    const searchParams = url.searchParams;
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const type = searchParams.get('type');
    const walletId = searchParams.get('walletId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const conditions = [];
    if (type) conditions.push(eq(schema.transactions.type, type as any));
    if (walletId) conditions.push(or(eq(schema.transactions.walletId, parseInt(walletId)), eq(schema.transactions.walletDestinationId, parseInt(walletId))));
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
        installments: schema.transactions.installments,
        interestApplied: schema.transactions.interestApplied,
        createdAt: schema.transactions.createdAt,
        expenseKind: schema.transactions.expenseKind,
        walletId: schema.transactions.walletId,
        walletDestinationId: schema.transactions.walletDestinationId,
        walletName: schema.wallets.name,
        walletEmoji: schema.wallets.emoji,
      })
      .from(schema.transactions)
      .leftJoin(schema.wallets, eq(schema.transactions.walletId, schema.wallets.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(schema.transactions.date), desc(schema.transactions.createdAt))
      .limit(limit)
      .offset(offset);

    const total = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.transactions)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return new Response(JSON.stringify({ data: txs, total: total[0].count }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

const validTransactionKind = (type: string, value: unknown) =>
  type === 'expense'
    ? value === 'fixed' || value === 'variable' || value === 'mismatch'
    : type === 'income' && value === 'surplus';

export const POST: APIRoute = async ({ request }) => {
  try {
    const db = getDb();
    const body = await request.json();
    const { type, amount, currency, expenseKind, walletId, walletDestinationId, description, aiGenerated, rawInput, installments, interestApplied, date } = body;

    if (!type || !amount || !walletId) {
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos: type, amount, walletId' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }
    if (type === 'transfer' && (!walletDestinationId || walletDestinationId === walletId)) {
      return new Response(JSON.stringify({ error: 'Una transferencia necesita billetera destino distinta' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    // Insertar transacción
    const result = await db.insert(schema.transactions).values({
      type, amount: parseFloat(amount), currency: currency ?? 'COP',
      categoryId: null,
      expenseKind: validTransactionKind(type, expenseKind) ? expenseKind : null,
      walletId: parseInt(walletId),
      walletDestinationId: walletDestinationId ? parseInt(walletDestinationId) : null,
      description: description ?? '', aiGenerated: aiGenerated ?? false,
      rawInput: rawInput ?? null,
      installments: parseInt(installments ?? '1'),
      interestApplied: interestApplied ?? false,
      date: date ?? today(),
    }).returning();
    await applyToWallets(db, result[0]);

    return new Response(JSON.stringify({ data: result[0] }), {
      status: 201, headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const db = getDb();
    const body = await request.json();
    const id = parseInt(body.id);
    const amount = parseFloat(body.amount);
    const walletId = parseInt(body.walletId);
    const walletDestinationId = body.walletDestinationId ? parseInt(body.walletDestinationId) : null;

    if (!id || !body.type || !amount || !walletId) {
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos: id, type, amount, walletId' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }
    if (body.type === 'transfer' && (!walletDestinationId || walletDestinationId === walletId)) {
      return new Response(JSON.stringify({ error: 'Una transferencia necesita billetera destino distinta' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const previous = await db.select().from(schema.transactions).where(eq(schema.transactions.id, id)).limit(1);
    if (!previous.length) return new Response(JSON.stringify({ error: 'Transaccion no encontrada' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

    await applyToWallets(db, previous[0], true);
    const result = await db.update(schema.transactions).set({
      type: body.type,
      amount,
      currency: body.currency ?? 'COP',
      expenseKind: validTransactionKind(body.type, body.expenseKind) ? body.expenseKind : null,
      walletId,
      walletDestinationId,
      description: body.description ?? '',
      installments: parseInt(body.installments ?? '1'),
      interestApplied: body.interestApplied ?? false,
      date: body.date ?? today(),
    }).where(eq(schema.transactions.id, id)).returning();
    await applyToWallets(db, result[0]);

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

    // Obtener transacción para revertir el balance
    const tx = await db.select().from(schema.transactions).where(eq(schema.transactions.id, parseInt(id))).limit(1);
    if (!tx.length) return new Response(JSON.stringify({ error: 'Transacción no encontrada' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

    await applyToWallets(db, tx[0], true);

    await db.delete(schema.transactions).where(eq(schema.transactions.id, parseInt(id)));

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
