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
  "expenseKind": "fixed" | "variable" | "mismatch" | "surplus" | null,
  "wallet": {"name": string, "emoji": string, "exists": boolean, "id": number | null},
  "walletDestination": {"name": string | null, "emoji": string | null, "exists": boolean, "id": number | null} | null,
  "confidence": number,
  "clarification": string | null
}

Reglas:
- Si el usuario pide eliminar, borrar, quitar o anular un movimiento, action = "delete_transaction".
- Para "el ultimo movimiento", usa el ID del movimiento mas reciente del contexto.
- Para borrar un movimiento especifico, usa el ID que mejor coincida por monto, descripcion o billetera.
- Si no sabes cual borrar, targetTransactionId = null y pon una pregunta breve en clarification.
- Para registrar algo nuevo, action = "create_transaction".
- Gasto = "expense", ingreso = "income", transferencia = "transfer".
- Moneda por defecto COP.
- Convierte lenguaje colombiano: "20 mil" = 20000, "medio palo" = 500000.
- Haz match con billeteras existentes por nombre o sentido. Si no existe, exists=false.
- En transferencias, wallet es origen y walletDestination es destino. Si el usuario dice "de Bancolombia a Nequi", origen=Bancolombia y destino=Nequi.
- Para gastos, clasifica expenseKind como "fixed", "variable" o "mismatch". Fijos: gasolina, desayuno, almuerzo, cena, comidas principales, mercado, arriendo, servicios, transporte necesario, suscripciones, salud, deudas. Variables: empanadas, helados, antojos, snacks, ocio, compras impulsivas. Usa mismatch solo para un ajuste por dinero faltante al igualar una billetera real con la app.
- Para ingresos, usa expenseKind="surplus" solo cuando haya dinero sobrante de origen desconocido o un ajuste positivo de saldo. Para ingresos normales usa null.
- confidence va de 0 a 1.`;

export const STATS_SYSTEM_PROMPT = `Eres un asesor financiero personal experto. Analiza datos financieros y genera insights utiles, practicos y directos en espanol.`;
