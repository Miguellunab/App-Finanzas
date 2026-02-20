import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TextInputProps {
  onSubmit: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function TextInput({ onSubmit, disabled, placeholder = 'Ej: Gasté 25 mil en almuerzo...' }: TextInputProps) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onSubmit(trimmed);
      setValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <motion.div
        className="flex-1 flex items-center gap-2 rounded-2xl px-4 py-3"
        animate={{
          borderColor: focused ? 'rgba(124,106,247,0.6)' : '#2a2a38',
          boxShadow: focused ? '0 0 0 3px rgba(124,106,247,0.1)' : 'none',
        }}
        style={{
          background: '#111118',
          border: '1px solid #2a2a38',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={focused ? '#7c6af7' : '#5a5870'} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, transition: 'stroke 0.2s' }}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent text-sm outline-none"
          style={{
            color: '#f1f0ff',
            fontFamily: 'inherit',
            caretColor: '#7c6af7',
          }}
        />
        <AnimatePresence>
          {value.length > 0 && (
            <motion.button
              type="button"
              onClick={() => setValue('')}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="flex-shrink-0"
              style={{ color: '#5a5870', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Botón enviar */}
      <motion.button
        type="submit"
        disabled={!value.trim() || disabled}
        whileTap={{ scale: 0.9 }}
        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{
          background: value.trim() ? 'linear-gradient(135deg, #7c6af7, #ec4899)' : '#1e1e28',
          border: 'none',
          cursor: value.trim() ? 'pointer' : 'not-allowed',
          transition: 'background 0.2s',
          boxShadow: value.trim() ? '0 4px 16px rgba(124,106,247,0.3)' : 'none',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={value.trim() ? 'white' : '#5a5870'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </motion.button>
    </form>
  );
}
