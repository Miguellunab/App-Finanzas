import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { href: '/', label: 'Inicio', icon: HomeIcon },
  { href: '/historial', label: 'Historial', icon: HistoryIcon },
  { href: '/billeteras', label: 'Billeteras', icon: WalletIcon },
  { href: '/categorias', label: 'Categorías', icon: TagIcon },
  { href: '/estadisticas', label: 'Estadísticas', icon: ChartIcon },
];

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}
function HistoryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="12 8 12 12 14 14"/>
      <path d="M3.05 11a9 9 0 1 0 .5-4.5"/>
      <polyline points="3 3 3 7 7 7"/>
    </svg>
  );
}
function WalletIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <path d="M16 12h2"/>
      <path d="M2 10h20"/>
    </svg>
  );
}
function TagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  );
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
}

export default function Sidebar({ isOpen, onClose, currentPath }: SidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Panel lateral */}
          <motion.aside
            className="fixed left-0 top-0 bottom-0 z-50 w-72 flex flex-col"
            style={{ background: '#0e0e15', borderRight: '1px solid #2a2a38' }}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
          >
            {/* Header del sidebar */}
            <div className="flex items-center justify-between p-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: 'linear-gradient(135deg, #7c6af7, #ec4899)' }}>
                  💸
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: '#f1f0ff' }}>FinanzasAI</p>
                  <p className="text-xs" style={{ color: '#5a5870' }}>Tu dinero, inteligente</p>
                </div>
              </div>
              <button onClick={onClose} className="btn-ghost p-2 rounded-lg" aria-label="Cerrar menú">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: '#1e1e28', margin: '0 1.5rem' }} />

            {/* Nav items */}
            <nav className="flex-1 p-4 flex flex-col gap-1">
              {navItems.map((item, i) => {
                const isActive = currentPath === item.href || 
                  (item.href !== '/' && currentPath.startsWith(item.href));
                return (
                  <motion.a
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 + 0.1 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 no-underline"
                    style={{
                      background: isActive ? 'rgba(124,106,247,0.15)' : 'transparent',
                      color: isActive ? '#7c6af7' : '#9896b0',
                      border: isActive ? '1px solid rgba(124,106,247,0.3)' : '1px solid transparent',
                    }}
                  >
                    <span style={{ color: isActive ? '#7c6af7' : '#5a5870' }}>
                      <item.icon />
                    </span>
                    <span className="font-medium text-sm">{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="ml-auto w-1.5 h-1.5 rounded-full"
                        style={{ background: '#7c6af7' }}
                      />
                    )}
                  </motion.a>
                );
              })}
            </nav>

            {/* Footer del sidebar */}
            <div className="p-4 pb-8">
              <div style={{ height: '1px', background: '#1e1e28', marginBottom: '1rem' }} />
              <div className="px-4 py-3 rounded-xl" style={{ background: '#18181f' }}>
                <p className="text-xs font-medium" style={{ color: '#5a5870' }}>Modelo activo</p>
                <p className="text-xs mt-0.5" style={{ color: '#7c6af7' }}>Llama 3.3 70B + Whisper</p>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
