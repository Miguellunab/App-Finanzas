import { useEffect, useRef, useState } from 'react';

interface VoiceButtonProps {
  onTranscribed: (text: string, log?: string) => void;
  onLog?: (log: string) => void;
  disabled?: boolean;
}

type RecordState = 'idle' | 'recording' | 'processing' | 'error';

function getAudioOptions() {
  if (typeof MediaRecorder === 'undefined') return undefined;
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const candidates = isSafari
    ? ['audio/mp4', 'audio/aac', 'audio/webm;codecs=opus', 'audio/webm']
    : ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac'];
  const mimeType = candidates.find(type => MediaRecorder.isTypeSupported(type));
  return mimeType ? { mimeType } : undefined;
}

function stringifyError(e: unknown) {
  if (e instanceof Error) return `${e.name}: ${e.message}\n${e.stack ?? ''}`;
  return JSON.stringify(e, null, 2);
}

export default function VoiceButton({ onTranscribed, onLog, disabled }: VoiceButtonProps) {
  const [state, setState] = useState<RecordState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const logRef = useRef<string[]>([]);

  const log = (line: string) => {
    const next = `[${new Date().toISOString()}] ${line}`;
    logRef.current = [...logRef.current, next];
    onLog?.(logRef.current.join('\n'));
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  };

  useEffect(() => () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    stopStream();
  }, []);

  const fail = (message: string, details?: string) => {
    const full = details ? `${message}\n${details}` : message;
    setErrorMsg(message);
    setState('error');
    log(full);
  };

  const transcribe = async (blob: Blob, mimeType: string) => {
    setState('processing');
    log(`blob size=${blob.size} type=${mimeType || blob.type || 'unknown'}`);

    try {
      const type = mimeType || blob.type || 'audio/mp4';
      const ext = type.includes('webm') ? 'webm' : type.includes('aac') ? 'aac' : 'mp4';
      const formData = new FormData();
      formData.append('audio', new File([blob], `audio.${ext}`, { type }));

      const res = await fetch('/api/ai/transcribe', { method: 'POST', body: formData });
      const raw = await res.text();
      log(`response status=${res.status}\n${raw}`);
      const data = JSON.parse(raw);

      if (!res.ok || data.error) throw new Error(data.error ?? 'Error al transcribir');

      setState('idle');
      setErrorMsg('');
      onTranscribed(data.text, data.log ? `${logRef.current.join('\n')}\nserver:\n${data.log}` : logRef.current.join('\n'));
    } catch (e) {
      fail('Error al procesar audio', stringifyError(e));
    }
  };

  const startRecording = async () => {
    if (disabled || state === 'recording' || state === 'processing') return;
    logRef.current = [];
    setErrorMsg('');

    if (!window.isSecureContext) {
      fail('El microfono necesita HTTPS en iPhone.', `location=${location.href}`);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      fail('Este navegador no soporta grabacion web.', `ua=${navigator.userAgent}`);
      return;
    }

    try {
      log(`ua=${navigator.userAgent}`);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const options = getAudioOptions();
      log(`recorder options=${JSON.stringify(options ?? {})}`);
      const recorder = new MediaRecorder(stream, options);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = event => {
        if (event.data.size) chunksRef.current.push(event.data);
        log(`data chunk=${event.data.size}`);
      };
      recorder.onerror = event => fail('La grabacion fallo.', JSON.stringify(event, null, 2));
      recorder.onstop = () => {
        stopStream();
        const type = recorder.mimeType || options?.mimeType || 'audio/mp4';
        const blob = new Blob(chunksRef.current, { type });
        if (!blob.size) {
          fail('No se capturo audio.', 'Toca una vez para iniciar y otra vez para detener.');
          return;
        }
        void transcribe(blob, type);
      };

      recorder.start(1000);
      setState('recording');
      log(`recording mime=${recorder.mimeType || 'default'}`);
    } catch (e) {
      stopStream();
      fail('No se pudo acceder al microfono.', stringifyError(e));
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  };

  const toggle = () => {
    if (state === 'idle' || state === 'error') void startRecording();
    if (state === 'recording') stopRecording();
  };

  const label = state === 'recording'
    ? 'Grabando... toca para enviar'
    : state === 'processing'
      ? 'Procesando audio...'
      : state === 'error'
        ? errorMsg
        : 'Toca para grabar';

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        disabled={disabled || state === 'processing'}
        className="relative w-20 h-20 rounded-full flex items-center justify-center select-none"
        style={{
          background: state === 'recording' ? '#f43f5e' : state === 'processing' ? '#3b82f6' : 'linear-gradient(135deg, #7c6af7, #ec4899)',
          border: 'none',
          color: 'white',
          cursor: disabled || state === 'processing' ? 'wait' : 'pointer',
          touchAction: 'manipulation',
        }}
        aria-label={label}
      >
        {state === 'recording' ? <StopIcon /> : <MicIcon />}
      </button>
      <p className="text-xs text-center max-w-72" style={{ color: state === 'error' ? '#f43f5e' : '#9896b0' }}>
        {label}
      </p>
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="white" stroke="none">
      <rect x="6" y="6" width="12" height="12" rx="2"/>
    </svg>
  );
}
