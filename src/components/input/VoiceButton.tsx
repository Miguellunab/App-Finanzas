import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useLiteMode from '../../hooks/useLiteMode';

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
  const pendingStopRef = useRef(false);
  const isStartingRef = useRef(false);
  const liteMode = useLiteMode();

  const isBrowserSupported = typeof window !== 'undefined'
    && typeof navigator !== 'undefined'
    && !!navigator.mediaDevices
    && typeof navigator.mediaDevices.getUserMedia === 'function'
    && typeof MediaRecorder !== 'undefined';

  const isTouchDevice = typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  const isStandalone = typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && (window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      stopStream();
    };
  }, [stopStream]);

  const startRecording = useCallback(async () => {
    if (isStartingRef.current || state === 'recording' || state === 'processing') return;

    setErrorMsg('');
    if (!isBrowserSupported) {
      setErrorMsg('Este navegador no permite grabar audio aqui. Usa texto o abre la pagina en Safari normal actualizado.');
      setState('error');
      setTimeout(() => setState('idle'), 4200);
      return;
    }

    isStartingRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      let options: MediaRecorderOptions | undefined;
      if (MediaRecorder.isTypeSupported?.('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' };
      } else if (MediaRecorder.isTypeSupported?.('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      } else if (MediaRecorder.isTypeSupported?.('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
      }

      let mr: MediaRecorder;
      try {
        mr = new MediaRecorder(stream, options);
      } catch (err) {
        console.warn('Error with MediaRecorder options, falling back to default', err);
        mr = new MediaRecorder(stream);
      }
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      pendingStopRef.current = false;

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stopStream();
        setState('processing');
        const finalMime = mr.mimeType || 'audio/mp4';
        const blob = new Blob(chunksRef.current, { type: finalMime });
        if (!blob.size) {
          setErrorMsg('No se pudo capturar audio. En iPhone prueba tocar una vez para iniciar y otra para detener.');
          setState('error');
          setTimeout(() => setState('idle'), 4200);
          return;
        }
        await transcribe(blob, finalMime);
      };

      mr.onerror = () => {
        stopStream();
        setErrorMsg('La grabacion fallo en este dispositivo. Intenta de nuevo o usa el campo de texto.');
        setState('error');
        setTimeout(() => setState('idle'), 4200);
      };

      mr.start(250);
      setState('recording');
      if (pendingStopRef.current) {
        pendingStopRef.current = false;
        mr.stop();
      }
    } catch (e: any) {
      const message = typeof e?.message === 'string' ? e.message : '';
      setErrorMsg(
        message.includes('Permission') || message.includes('denied')
          ? isStandalone
            ? 'iPhone bloqueo el microfono dentro de la app web. Abrela una vez en Safari, prueba grabar alli y luego vuelve al acceso directo.'
            : 'El microfono fue bloqueado para esta pagina. Revisa el permiso del sitio en Safari y vuelve a intentar.'
          : 'No se pudo acceder al microfono en este dispositivo.'
      );
      setState('error');
      setTimeout(() => setState('idle'), 4200);
      stopStream();
    } finally {
      isStartingRef.current = false;
    }
  }, [isBrowserSupported, onTranscribed, state, stopStream]);

  const stopRecording = useCallback(() => {
    if (isStartingRef.current) {
      pendingStopRef.current = true;
      return;
    }

    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, [state]);

  const transcribe = async (blob: Blob, mimeType: string) => {
    try {
      // iOS Safari a veces devuelve mimeType vacío, por defecto es mp4
      const actualMime = mimeType || 'audio/mp4';
      const ext = actualMime.includes('webm') ? 'webm' : actualMime.includes('mp4') ? 'mp4' : 'ogg';
      const formData = new FormData();
      formData.append('audio', new File([blob], `audio.${ext}`, { type: actualMime }));

      const res = await fetch('/api/ai/transcribe', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok || data.error) throw new Error(data.error ?? 'Error al transcribir');

      setState('idle');
      onTranscribed(data.text);
    } catch (e: any) {
      setErrorMsg(e.message ?? 'Error al procesar audio');
      setState('error');
      setTimeout(() => setState('idle'), 4200);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (disabled) return;
    if (isTouchDevice) {
      if (state === 'idle') startRecording();
      else if (state === 'recording') stopRecording();
      return;
    }
    if (state === 'idle') startRecording();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    if (isTouchDevice) return;
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
        onPointerCancel={handlePointerUp}
        disabled={disabled || state === 'processing'}
        className="relative w-20 h-20 rounded-full flex items-center justify-center select-none touch-none"
        style={{ background: cfg.bg, boxShadow: cfg.shadow, border: 'none', cursor: 'pointer' }}
        whileTap={{ scale: 0.92 }}
        animate={state === 'recording' ? {
          boxShadow: ['0 8px 32px rgba(244,63,94,0.5)', '0 8px 48px rgba(244,63,94,0.8)', '0 8px 32px rgba(244,63,94,0.5)'],
        } : {}}
        transition={state === 'recording' ? { repeat: Infinity, duration: liteMode ? 1.6 : 1 } : {}}
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
          {state === 'idle' && (isTouchDevice ? 'Toca para grabar y toca de nuevo para enviar' : 'Manten presionado para hablar')}
          {state === 'recording' && (isTouchDevice ? 'Grabando... toca de nuevo para enviar' : 'Grabando... suelta para enviar')}
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
