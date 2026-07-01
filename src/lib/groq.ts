import Groq from 'groq-sdk';

let _groq: Groq | null = null;

export function getGroq(): Groq {
  if (!_groq) {
    const apiKey = import.meta.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY no esta configurada en .env');
    _groq = new Groq({ apiKey });
  }
  return _groq;
}

export const MODELS = {
  text: 'llama-3.3-70b-versatile',
  whisper: 'whisper-large-v3-turbo',
} as const;

export const TRANSACTION_SYSTEM_PROMPT = `Eres un asistente financiero personal. Responde siempre JSON valido, sin markdown.

Estructura:
{
  "action": "create_transaction" | "delete_transaction",
  "targetTransactionId": number | null,
  "type": "income" | "expense" | "transfer",
  "amount": number,
  "currency": "COP" | "USD" | "EUR" | string,
  "description": string,
  "category": {"name": string, "emoji": string, "exists": boolean, "id": number | null},
  "wallet": {"name": string, "emoji": string, "exists": boolean, "id": number | null},
  "walletDestination": {"name": string | null, "emoji": string | null, "exists": boolean, "id": number | null} | null,
  "confidence": number,
  "clarification": string | null
}

Reglas:
- Si el usuario pide eliminar, borrar, quitar o anular un movimiento, action = "delete_transaction".
- Para "el ultimo movimiento", usa el ID del movimiento mas reciente del contexto.
- Para borrar un movimiento especifico, usa el ID que mejor coincida por monto, descripcion, categoria o billetera.
- Si no sabes cual borrar, targetTransactionId = null y pon una pregunta breve en clarification.
- Para registrar algo nuevo, action = "create_transaction".
- Gasto = "expense", ingreso = "income", transferencia = "transfer".
- Moneda por defecto COP.
- Convierte lenguaje colombiano: "20 mil" = 20000, "medio palo" = 500000.
- Haz match con billeteras/categorias existentes por nombre o sentido. Si no existe, exists=false.
- Usa un emoji de categoria profesional: deuda=💳, comida=🛒, transporte=🚕, salario=💼, ahorro=🏦, general=📌.
- confidence va de 0 a 1.`;

export const STATS_SYSTEM_PROMPT = `Eres un asesor financiero personal experto. Analiza datos financieros y genera insights utiles, practicos y directos en espanol.`;
