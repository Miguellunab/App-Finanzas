import { motion } from 'framer-motion';
import useLiteMode from '../../hooks/useLiteMode';

const navItems = [
  { id: 'home', href: '/', icon: HomeIcon, color: '#7c6af7' },
  { id: 'history', href: '/historial', icon: HistoryIcon, color: '#ec4899' },
  { id: 'wallets', href: '/billeteras', icon: WalletIcon, color: '#3b82f6' },
  { id: 'stats', href: '/estadisticas', icon: ChartIcon, color: '#22c55e' },
];

function HomeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <motion.path 
        d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        variants={{
          rest: { pathLength: 1, opacity: 1 },
          hover: { pathLength: [0, 1], opacity: [0.5, 1], transition: { duration: 0.5 } }
        }}
      />
      <motion.polyline 
        points="9 22 9 12 15 12 15 22" 
        variants={{
          rest: { pathLength: 1 },
          hover: { pathLength: [0, 1], transition: { duration: 0.5, delay: 0.2 } }
        }}
      />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <motion.path 
        d="M3.05 11a9 9 0 1 0 .5-4.5" 
        variants={{
          rest: { rotate: 0, pathLength: 1 },
          hover: { rotate: [0, -45, 0], pathLength: [0, 1], transition: { duration: 0.5 } }
        }}
      />
      <motion.polyline 
        points="12 8 12 12 14 14" 
        variants={{
          rest: { pathLength: 1 },
          hover: { pathLength: [0, 1], transition: { duration: 0.5, delay: 0.2 } }
        }}
      />
      <polyline points="3 3 3 7 7 7"/>
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <motion.rect 
        x="2" y="5" width="20" height="14" rx="2" 
        variants={{
          rest: { pathLength: 1, scale: 1 },
          hover: { pathLength: [0, 1], scale: [0.9, 1], transition: { duration: 0.5 } }
        }}
      />
      <motion.path 
        d="M16 12h2" 
        variants={{
          rest: { pathLength: 1, x: 0 },
          hover: { pathLength: [0, 1], x: [5, 0], transition: { duration: 0.5, delay: 0.2 } }
        }}
      />
      <path d="M2 10h20"/>
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <motion.line x1="18" y1="20" x2="18" y2="10" variants={{ rest: { pathLength: 1 }, hover: { pathLength: [0, 1], transition: { duration: 0.4 } } }} />
      <motion.line x1="12" y1="20" x2="12" y2="4" variants={{ rest: { pathLength: 1 }, hover: { pathLength: [0, 1], transition: { duration: 0.5, delay: 0.1 } } }} />
      <motion.line x1="6" y1="20" x2="6" y2="14" variants={{ rest: { pathLength: 1 }, hover: { pathLength: [0, 1], transition: { duration: 0.6, delay: 0.2 } } }} />
    </svg>
  );
}

interface FloatingNavProps {
  currentPath: string;
}

export default function FloatingNav({ currentPath }: FloatingNavProps) {
  const liteMode = useLiteMode();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full px-4" style={{ maxWidth: '440px' }}>
      <div 
        className="flex items-center justify-around rounded-3xl p-2 relative overflow-hidden"
        style={{
          background: 'rgba(17, 17, 24, 0.7)',
          backdropFilter: liteMode ? 'blur(10px)' : 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Animated Background SVG for the Bar itself */}
        {!liteMode && <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="nav-glow">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <motion.ellipse
            cx="50%" cy="150%" rx="60%" ry="50%"
            fill="#7c6af7" filter="url(#nav-glow)" opacity="0.2"
            animate={{ 
              rx: ["60%", "70%", "60%"],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>}

        {navItems.map((item) => {
          const isActive = currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href));
          
          return (
            <motion.a
              key={item.id}
              href={item.href}
              initial="rest"
              whileHover="hover"
              whileTap="hover"
              className="relative p-3 rounded-2xl flex flex-col items-center justify-center transition-colors no-underline z-10"
              animate={isActive ? "hover" : "rest"}
              variants={{
                rest: { color: isActive ? item.color : '#5a5870' },
                hover: { color: item.color }
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-2xl z-[-1]"
                  style={{
                    background: `linear-gradient(135deg, ${item.color}20, transparent)`,
                    border: `1px solid ${item.color}40`,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              
              {isActive && (
                 <motion.div
                   className="absolute top-0 w-8 h-1 rounded-b-full"
                   style={{ background: item.color, boxShadow: `0 2px 8px ${item.color}` }}
                   layoutId="nav-indicator"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   transition={{ duration: 0.3 }}
                 />
              )}

              <motion.div
                variants={{
                  rest: { y: 0, scale: 1 },
                  hover: liteMode ? { y: 0, scale: 1 } : { y: -2, scale: 1.1 }
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <item.icon />
              </motion.div>
            </motion.a>
          );
        })}
      </div>
    </div>
  );
}
