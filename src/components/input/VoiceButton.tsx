import { useEffect, useRef, useState } from 'react';

interface VoiceButtonProps {
  onTranscribed: (text: string) => void;
  disabled?: boolean;
}

type RecordState = 'idle' | 'recording' | 'processing' | 'error';

function getAudioOptions() {
  if (typeof MediaRecorder === 'undefined') return undefined;
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const candidates = isSafari ? ['audio/mp4', 'audio/aac', 'audio/webm;codecs=opus', 'audio/webm'] : ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  const mimeType = candidates.find(type => MediaRecorder.isTypeSupported(type));
  return mimeType ? { mimeType } : undefined;
}

export default function VoiceButton({ onTranscribed, disabled }: VoiceButtonProps) {
  const [state, setState] = useState<RecordState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  };

  useEffect(() => () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    stopStream();
  }, []);

  const transcribe = async (blob: Blob, mimeType: string) => {
    setState('processing');
    try {
      const type = mimeType || blob.type || 'audio/mp4';
      const ext = type.includes('webm') ? 'webm' : type.includes('aac') ? 'aac' : 'mp4';
      const formData = new FormData();
      formData.append('audio', new File([blob], `audio.${ext}`, { type }));
      const res = await fetch('/api/ai/transcribe', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? 'Error al transcribir');
      setState('idle');
      onTranscribed(data.text);
    } catch (e: any) {
      setErrorMsg(e.message ?? 'Error al procesar audio');
      setState('error');
    }
  };

  const startRecording = async () => {
    if (disabled || state === 'recording' || state === 'processing') return;
    setErrorMsg('');
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setErrorMsg('El microfono necesita Safari/Chrome actualizado y HTTPS.');
      setState('error');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const options = getAudioOptions();
      const recorder = new MediaRecorder(stream, options);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = event => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        stopStream();
        const type = recorder.mimeType || options?.mimeType || 'audio/mp4';
        const blob = new Blob(chunksRef.current, { type });
        if (!blob.size) {
          setErrorMsg('No se capturo audio.');
          setState('error');
          return;
        }
        void transcribe(blob, type);
      };
      recorder.start(1000);
      setState('recording');
    } catch (e: any) {
      stopStream();
      setErrorMsg(e.message ?? 'No se pudo acceder al microfono.');
      setState('error');
    }
  };

  const toggle = () => {
    if (state === 'idle' || state === 'error') void startRecording();
    if (state === 'recording') recorderRef.current?.stop();
  };

  const label = state === 'recording' ? 'Grabando... toca para enviar' : state === 'processing' ? 'Procesando audio...' : state === 'error' ? errorMsg : 'Toca para grabar';

  return (
    <div className="flex flex-col items-center gap-2">
      <button type="button" onClick={toggle} disabled={disabled || state === 'processing'} className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: state === 'recording' ? '#f43f5e' : state === 'processing' ? '#3b82f6' : 'linear-gradient(135deg, #7c6af7, #ec4899)', border: 'none', color: 'white', cursor: 'pointer', touchAction: 'manipulation' }} aria-label={label}>
        {state === 'recording' ? <StopIcon /> : <MicIcon />}
      </button>
      <p className="text-xs text-center max-w-72" style={{ color: state === 'error' ? '#f43f5e' : '#9896b0' }}>{label}</p>
    </div>
  );
}

function MicIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v4"/><path d="M8 23h8"/></svg>;
}

function StopIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>;
}
