import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceButtonProps {
  onTranscribed: (text: string) => void;
  disabled?: boolean;
}

type RecordState = 'idle' | 'recording' | 'processing' | 'error';

export default function VoiceButton({ onTranscribed, disabled }: VoiceButtonProps) {
  const [state, setState] = useState<RecordState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4' });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setState('processing');
        const blob = new Blob(chunksRef.current, { type: mr.mimeType });
        await transcribe(blob, mr.mimeType);
      };

      mr.start();
      setState('recording');
    } catch (e: any) {
      setErrorMsg('No se pudo acceder al micrófono');
      setState('error');
      setTimeout(() => setState('idle'), 3000);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, [state]);

  const blobToWav = async (blob: Blob): Promise<Blob> => {
    const arrayBuffer = await blob.arrayBuffer();
    const audioCtx = new AudioContext();
    const decoded = await audioCtx.decodeAudioData(arrayBuffer);
    await audioCtx.close();

    const numChannels = decoded.numberOfChannels;
    const sampleRate = decoded.sampleRate;
    const numSamples = decoded.length;
    const dataLength = numSamples * numChannels * 2; // 16-bit PCM
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    const writeStr = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, dataLength, true);

    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, decoded.getChannelData(ch)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        offset += 2;
      }
    }

    return new Blob([buffer], { type: 'audio/wav' });
  };

  const transcribe = async (blob: Blob, mimeType: string) => {
    try {
      const wavBlob = await blobToWav(blob);
      const formData = new FormData();
      formData.append('audio', new File([wavBlob], 'audio.wav', { type: 'audio/wav' }));

      const res = await fetch('/api/ai/transcribe', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok || data.error) throw new Error(data.error ?? 'Error al transcribir');

      setState('idle');
      onTranscribed(data.text);
    } catch (e: any) {
      setErrorMsg(e.message ?? 'Error al procesar audio');
      setState('error');
      setTimeout(() => setState('idle'), 3000);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (state === 'idle' && !disabled) startRecording();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    if (state === 'recording') stopRecording();
  };

  const stateConfig = {
    idle: { bg: 'linear-gradient(135deg, #7c6af7, #ec4899)', shadow: '0 8px 24px rgba(124,106,247,0.4)', icon: MicIcon },
    recording: { bg: 'linear-gradient(135deg, #f43f5e, #fb923c)', shadow: '0 8px 32px rgba(244,63,94,0.5)', icon: StopIcon },
    processing: { bg: 'linear-gradient(135deg, #3b82f6, #06b6d4)', shadow: '0 8px 24px rgba(59,130,246,0.4)', icon: SpinIcon },
    error: { bg: 'linear-gradient(135deg, #374151, #4b5563)', shadow: 'none', icon: MicIcon },
  };

  const cfg = stateConfig[state];

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Botón principal */}
      <motion.button
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        disabled={disabled || state === 'processing'}
        className="relative w-20 h-20 rounded-full flex items-center justify-center select-none touch-none"
        style={{ background: cfg.bg, boxShadow: cfg.shadow, border: 'none', cursor: 'pointer' }}
        whileTap={{ scale: 0.92 }}
        animate={state === 'recording' ? {
          boxShadow: ['0 8px 32px rgba(244,63,94,0.5)', '0 8px 48px rgba(244,63,94,0.8)', '0 8px 32px rgba(244,63,94,0.5)'],
        } : {}}
        transition={state === 'recording' ? { repeat: Infinity, duration: 1 } : {}}
      >
        {/* Anillos de pulso cuando graba */}
        <AnimatePresence>
          {state === 'recording' && (
            <>
              {[1, 2].map(i => (
                <motion.span
                  key={i}
                  className="absolute inset-0 rounded-full"
                  style={{ border: '2px solid rgba(244,63,94,0.4)' }}
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 1.8 + i * 0.4, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.4, ease: 'easeOut' }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        <cfg.icon />
      </motion.button>

      {/* Label de estado */}
      <AnimatePresence mode="wait">
        <motion.p
          key={state}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="text-xs text-center"
          style={{ color: state === 'error' ? '#f43f5e' : '#5a5870' }}
        >
          {state === 'idle' && 'Mantén presionado para hablar'}
          {state === 'recording' && '🎙 Grabando... suelta para enviar'}
          {state === 'processing' && '⏳ Procesando audio...'}
          {state === 'error' && (errorMsg || 'Error')}
        </motion.p>
      </AnimatePresence>
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

function SpinIcon() {
  return (
    <motion.svg
      width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </motion.svg>
  );
}
