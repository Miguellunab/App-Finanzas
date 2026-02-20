import { useState } from 'react';
import Sidebar from './Sidebar';

interface AppShellProps {
  currentPath: string;
  title?: string;
  children: React.ReactNode;
}

export default function AppShell({ currentPath, title, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: '#0a0a0f', maxWidth: '480px', margin: '0 auto', position: 'relative' }}>
      {/* Top header */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-5 py-4"
        style={{ background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #1e1e28' }}
      >
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-xl transition-colors"
          style={{ color: '#9896b0' }}
          aria-label="Abrir menú"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="15" y2="18"/>
          </svg>
        </button>

        <span className="font-semibold text-sm" style={{ color: '#f1f0ff' }}>
          {title ?? 'FinanzasAI'}
        </span>

        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
          style={{ background: 'linear-gradient(135deg, #7c6af7, #ec4899)' }}>
          💸
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPath={currentPath}
      />

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
