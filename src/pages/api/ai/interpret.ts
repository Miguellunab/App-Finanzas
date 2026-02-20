import type { APIRoute } from 'astro';
import { getDb, schema } from '../../../lib/db';
import { eq } from 'drizzle-orm';
import { getGroq, MODELS, TRANSACTION_SYSTEM_PROMPT } from '../../../lib/groq';

export const POST: APIRoute = async ({ request }) => {
  try {
    const db = getDb();
    const body = await request.json();
    const { text } = body;

    if (!text?.trim()) {
      return new Response(JSON.stringify({ error: 'Texto vacío' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    // Obtener wallets y categorías existentes para el contexto
    const wallets = await db.select({
      id: schema.wallets.id,
      name: schema.wallets.name,
      emoji: schema.wallets.emoji,
    }).from(schema.wallets).where(eq(schema.wallets.isArchived, false));

    const categories = await db.select({
      id: schema.categories.id,
      name: schema.categories.name,
      emoji: schema.categories.emoji,
      type: schema.categories.type,
    }).from(schema.categories).where(eq(schema.categories.isArchived, false));

    const walletsContext = wallets.map(w => `- ID:${w.id} "${w.name}" ${w.emoji}`).join('\n');
    const categoriesContext = categories.map(c => `- ID:${c.id} "${c.name}" ${c.emoji} (${c.type})`).join('\n');

    const userPrompt = `El usuario dice: "${text}"

BILLETERAS EXISTENTES:
${walletsContext || '(ninguna)'}

CATEGORÍAS EXISTENTES:
${categoriesContext || '(ninguna)'}

Interpreta la transacción. Si hay match con una billetera/categoría existente, usa su ID. Si no existe, "exists": false.
Responde SOLO con el JSON, sin texto adicional.`;

    const groq = getGroq();
    const completion = await groq.chat.completions.create({
      model: MODELS.text,
      messages: [
        { role: 'system', content: TRANSACTION_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 600,
      response_format: { type: 'json_object' },
    });

    const rawContent = completion.choices[0]?.message?.content ?? '{}';
    
    let parsed: any;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      return new Response(JSON.stringify({ error: 'La IA no pudo interpretar el mensaje. Intenta ser más específico.' }), {
        status: 422, headers: { 'Content-Type': 'application/json' },
      });
    }

    // Asegurar estructura mínima
    const result = {
      type: parsed.type ?? 'expense',
      amount: parsed.amount ?? 0,
      currency: parsed.currency ?? 'COP',
      description: parsed.description ?? text,
      category: {
        id: parsed.category?.id ?? null,
        name: parsed.category?.name ?? 'Sin categoría',
        emoji: parsed.category?.emoji ?? '📦',
        exists: parsed.category?.exists ?? false,
      },
      wallet: {
        id: parsed.wallet?.id ?? null,
        name: parsed.wallet?.name ?? 'Efectivo',
        emoji: parsed.wallet?.emoji ?? '💵',
        exists: parsed.wallet?.exists ?? false,
      },
      walletDestination: parsed.walletDestination ?? null,
      confidence: parsed.confidence ?? 0.8,
      clarification: parsed.clarification ?? null,
      rawText: text,
    };

    return new Response(JSON.stringify({ data: result }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
