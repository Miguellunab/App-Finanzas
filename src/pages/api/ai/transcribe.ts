import type { APIRoute } from 'astro';
import { getGroq, MODELS } from '../../../lib/groq';

const VALID_EXTENSIONS: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/mp4': 'mp4',
  'audio/m4a': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/aac': 'aac',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'video/webm': 'webm',
  'video/mp4': 'mp4',
};

function getExtension(mimeType: string): string {
  return VALID_EXTENSIONS[mimeType.split(';')[0].trim().toLowerCase()] ?? 'mp4';
}

function getNormalizedMimeType(ext: string): string {
  if (ext === 'm4a' || ext === 'mp4') return 'audio/mp4';
  if (ext === 'aac') return 'audio/aac';
  if (ext === 'mp3') return 'audio/mpeg';
  return `audio/${ext}`;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;
    if (!audioFile) return new Response(JSON.stringify({ error: 'No se recibio archivo de audio' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const ext = getExtension(audioFile.type);
    const arrayBuffer = await audioFile.arrayBuffer();
    const transcription = await getGroq().audio.transcriptions.create({
      file: new File([arrayBuffer], `audio.${ext}`, { type: getNormalizedMimeType(ext) }),
      model: MODELS.whisper,
      language: 'es',
      response_format: 'json',
    });

    const text = transcription.text?.trim();
    if (!text) return new Response(JSON.stringify({ error: 'No se pudo transcribir el audio. Intenta de nuevo.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    return new Response(JSON.stringify({ text }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
