import type { APIRoute } from 'astro';
import { getDb, schema } from '../../../lib/db';
import { desc, eq } from 'drizzle-orm';
import { getGroq, MODELS, TRANSACTION_SYSTEM_PROMPT } from '../../../lib/groq';

export const POST: APIRoute = async ({ request }) => {
  try {
    const db = getDb();
    const { text } = await request.json();
    if (!text?.trim()) return new Response(JSON.stringify({ error: 'Texto vacio' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const wallets = await db.select({
      id: schema.wallets.id,
      name: schema.wallets.name,
      emoji: schema.wallets.emoji,
    }).from(schema.wallets).where(eq(schema.wallets.isArchived, false));

    const recent = await db.select({
      id: schema.transactions.id,
      type: schema.transactions.type,
      amount: schema.transactions.amount,
      description: schema.transactions.description,
      date: schema.transactions.date,
      walletName: schema.wallets.name,
      expenseKind: schema.transactions.expenseKind,
      createdAt: schema.transactions.createdAt,
    })
      .from(schema.transactions)
      .leftJoin(schema.wallets, eq(schema.transactions.walletId, schema.wallets.id))
      .orderBy(desc(schema.transactions.createdAt))
      .limit(12);

    const userPrompt = `Usuario: "${text}"

BILLETERAS:
${wallets.map(w => `- ID:${w.id} "${w.name}" ${w.emoji}`).join('\n') || '(ninguna)'}

ULTIMOS MOVIMIENTOS:
${recent.map(t => `- ID:${t.id} ${t.date} ${t.type} $${t.amount} "${t.description}" billetera:${t.walletName ?? 'N/A'} gasto:${t.expenseKind ?? 'N/A'}`).join('\n') || '(ninguno)'}`;

    const completion = await getGroq().chat.completions.create({
      model: MODELS.text,
      messages: [
        { role: 'system', content: TRANSACTION_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 700,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
    const result = {
      action: parsed.action ?? 'create_transaction',
      targetTransactionId: parsed.targetTransactionId ?? null,
      type: parsed.type ?? 'expense',
      amount: parsed.amount ?? 0,
      currency: parsed.currency ?? 'COP',
      description: parsed.description ?? text,
      expenseKind: parsed.expenseKind === 'fixed' || parsed.expenseKind === 'variable' ? parsed.expenseKind : null,
      wallet: {
        id: parsed.wallet?.id ?? null,
        name: parsed.wallet?.name ?? wallets[0]?.name ?? 'Efectivo',
        emoji: parsed.wallet?.emoji ?? wallets[0]?.emoji ?? '$',
        exists: parsed.wallet?.exists ?? Boolean(wallets[0]),
      },
      walletDestination: parsed.walletDestination ?? null,
      confidence: parsed.confidence ?? 0.8,
      clarification: parsed.clarification ?? null,
      rawText: text,
    };

    return new Response(JSON.stringify({ data: result }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
