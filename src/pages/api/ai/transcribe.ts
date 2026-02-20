import type { APIRoute } from 'astro';
import { getGroq, MODELS } from '../../../lib/groq';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return new Response(JSON.stringify({ error: 'No se recibió archivo de audio' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const groq = getGroq();
    
    // Transcribir con Whisper
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
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
