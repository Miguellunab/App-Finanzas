import { useState } from 'react';
import Sidebar from './Sidebar';
import FloatingNav from './FloatingNav';

interface AppShellProps {
  currentPath: string;
  title?: string;
  children: React.ReactNode;
}

export default function AppShell({ currentPath, title, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-dvh flex flex-col relative z-10" style={{ background: '#0a0a0f', width: '100%', maxWidth: '960px', margin: '0 auto' }}>
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-5"
        style={{
          background: 'rgba(10,10,15,0.92)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(124,106,247,0.2)',
          paddingTop: 'calc(env(safe-area-inset-top) + 12px)',
          paddingBottom: '12px',
        }}
      >
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-xl transition-colors"
          style={{ color: '#9896b0' }}
          aria-label="Abrir menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="15" y2="18"/>
          </svg>
        </button>

        <div className="font-bold text-sm tracking-[0.24em]" style={{ color: '#f1f0ff' }}>
          {(title ?? 'FINANZAS AI').toUpperCase()}
        </div>

        <img src="/favicon.png" alt="" className="w-9 h-9 rounded-xl" />
      </header>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} currentPath={currentPath} />

      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 6rem)' }}>
        {children}
      </main>

      <FloatingNav currentPath={currentPath} />
    </div>
  );
}
