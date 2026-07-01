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
  const log: string[] = [];

  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return new Response(JSON.stringify({ error: 'No se recibio archivo de audio', log: log.join('\n') }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ext = getExtension(audioFile.type);
    const cleanType = getNormalizedMimeType(ext);
    const arrayBuffer = await audioFile.arrayBuffer();
    log.push(`received name=${audioFile.name} type=${audioFile.type || 'empty'} size=${audioFile.size}`);
    log.push(`normalized ext=${ext} type=${cleanType} bytes=${arrayBuffer.byteLength}`);

    const groq = getGroq();
    const transcription = await groq.audio.transcriptions.create({
      file: new File([arrayBuffer], `audio.${ext}`, { type: cleanType }),
      model: MODELS.whisper,
      language: 'es',
      response_format: 'json',
    });

    const text = transcription.text?.trim();
    log.push(`transcription text length=${text?.length ?? 0}`);

    if (!text) {
      return new Response(JSON.stringify({ error: 'No se pudo transcribir el audio. Intenta de nuevo.', log: log.join('\n') }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ text, log: log.join('\n') }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    log.push(e?.stack ?? e?.message ?? String(e));
    return new Response(JSON.stringify({ error: e.message, log: log.join('\n') }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
