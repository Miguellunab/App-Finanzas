import type { APIRoute } from 'astro';
import { processDueSubscriptions } from '../../../lib/subscriptions';

const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

export const POST: APIRoute = async ({ request }) => {
  const secret = import.meta.env.SUBSCRIPTIONS_PROCESS_SECRET ?? import.meta.env.CRON_SECRET;
  if (!secret) {
    return new Response(JSON.stringify({ error: 'Procesamiento de suscripciones no configurado' }), {
      status: 503,
      headers,
    });
  }

  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers,
    });
  }

  try {
    const result = await processDueSubscriptions();
    return new Response(JSON.stringify({ success: true, automaticCharges: false, ...result }), {
      headers,
    });
  } catch (error) {
    console.error('Subscription processing failed', error);
    return new Response(JSON.stringify({ error: 'No se pudieron procesar las suscripciones' }), {
      status: 500,
      headers,
    });
  }
};
