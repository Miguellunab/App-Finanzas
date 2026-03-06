import { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import CyberBackground from '../animations/CyberBackground';
import FloatingNav from './FloatingNav';

interface AppShellProps {
  currentPath: string;
  title?: string;
  children: React.ReactNode;
}

function InteractiveTitle({ title }: { title: string }) {
  return (
    <motion.div 
      className="flex cursor-default font-bold text-sm tracking-widest relative"
      whileHover="hover"
      initial="rest"
    >
      {/* Background glowing aura on hover */}
      <motion.div
        className="absolute inset-0 bg-[#7c6af7] blur-md z-[-1]"
        variants={{ rest: { opacity: 0 }, hover: { opacity: 0.4 } }}
        transition={{ duration: 0.3 }}
      />
      {title.split('').map((char, i) => (
        <motion.span
          key={i}
          className="text-transparent bg-clip-text inline-block"
          style={{ backgroundImage: 'linear-gradient(90deg, #bfaaff, #ffffff, #7c6af7)' }}
          variants={{
            rest: { y: 0, rotateX: 0, color: 'transparent' },
            hover: { 
              y: [0, -4, 0], 
              rotateX: [0, 180, 360],
              color: ['#fff', '#bfaaff', 'transparent']
            }
          }}
          transition={{ 
            duration: 0.5, 
            delay: i * 0.05, 
            ease: "easeInOut" 
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.div>
  );
}

export default function AppShell({ currentPath, title, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-dvh flex flex-col relative z-10" style={{ background: 'transparent', maxWidth: '480px', margin: '0 auto' }}>
      <CyberBackground />
      {/* Top header */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-5 relative overflow-hidden"
        style={{
          background: 'rgba(10,10,15,0.65)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(124,106,247,0.2)',
          paddingTop: 'calc(env(safe-area-inset-top) + 12px)',
          paddingBottom: '12px',
        }}
      >
        {/* Animated header glow */}
        <div className="absolute inset-0 z-[-1] opacity-50" style={{ background: 'linear-gradient(90deg, transparent, rgba(124,106,247,0.1), transparent)' }} />

        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-xl transition-colors relative group"
          style={{ color: '#9896b0' }}
          aria-label="Abrir menú"
        >
          {/* Neon hover effect on hamburger */}
          <div className="absolute inset-0 bg-[#7c6af7] opacity-0 group-hover:opacity-20 rounded-xl transition-opacity blur-md" />
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="15" y2="18"/>
          </svg>
        </button>

        <InteractiveTitle title={title ? title.toUpperCase() : 'FINANZAS AI'} />

        <div className="relative group cursor-pointer">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base relative z-10 transition-transform group-hover:scale-110"
            style={{ background: 'linear-gradient(135deg, #7c6af7, #ec4899)' }}>
            💸
          </div>
          {/* Pulsing glow behind the money icon */}
          <div className="absolute inset-0 rounded-xl blur-md opacity-70 group-hover:opacity-100 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #7c6af7, #ec4899)', animation: 'pulse 2s infinite' }}
          />
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPath={currentPath}
      />

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>

      <FloatingNav currentPath={currentPath} />
    </div>
  );
}
