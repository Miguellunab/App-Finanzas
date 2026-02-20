import type { APIRoute } from 'astro';
import { getGroq, MODELS } from '../../../lib/groq';

// Extensiones válidas que acepta Whisper en Groq
const VALID_EXTENSIONS: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/mp4': 'mp4',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'video/webm': 'webm',
  'video/mp4': 'mp4',
};

function getExtension(mimeType: string): string {
  // Ignorar parámetros como ";codecs=opus"
  const base = mimeType.split(';')[0].trim().toLowerCase();
  return VALID_EXTENSIONS[base] ?? 'webm';
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return new Response(JSON.stringify({ error: 'No se recibió archivo de audio' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    // Reconstruir el File con nombre y tipo limpios para que el SDK no falle la validación
    const ext = getExtension(audioFile.type);
    const cleanType = `audio/${ext}`;
    const arrayBuffer = await audioFile.arrayBuffer();
    const cleanFile = new File([arrayBuffer], `audio.${ext}`, { type: cleanType });

    const groq = getGroq();

    const transcription = await groq.audio.transcriptions.create({
      file: cleanFile,
      model: MODELS.whisper,
      language: 'es',
      response_format: 'json',
    });

    const text = transcription.text?.trim();

    if (!text) {
      return new Response(JSON.stringify({ error: 'No se pudo transcribir el audio. Intenta de nuevo.' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ text }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
