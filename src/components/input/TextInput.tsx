import { useState } from 'react';

interface TextInputProps {
  onSubmit: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function TextInput({ onSubmit, disabled, placeholder = 'Ej: Gaste 25 mil en almuerzo...' }: TextInputProps) {
  const [value, setValue] = useState('');

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
      <div className="flex-1 flex items-center gap-2 rounded-2xl px-4 py-3" style={{ background: '#111118', border: '1px solid #2a2a38' }}>
        <input
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: '#f1f0ff', fontFamily: 'inherit', caretColor: '#7c6af7' }}
        />
        {value.length > 0 && (
          <button type="button" onClick={() => setValue('')} style={{ color: '#5a5870', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }} aria-label="Limpiar">
            x
          </button>
        )}
      </div>

      <button
        type="submit"
        disabled={!value.trim() || disabled}
        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{
          background: value.trim() ? 'linear-gradient(135deg, #7c6af7, #ec4899)' : '#1e1e28',
          border: 'none',
          cursor: value.trim() ? 'pointer' : 'not-allowed',
        }}
        aria-label="Enviar"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={value.trim() ? 'white' : '#5a5870'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </form>
  );
}
