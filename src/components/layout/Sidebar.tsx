const navItems = [
  { href: '/', label: 'Inicio', icon: HomeIcon },
  { href: '/historial', label: 'Historial', icon: HistoryIcon },
  { href: '/billeteras', label: 'Billeteras', icon: WalletIcon },
  { href: '/categorias', label: 'Categorias', icon: TagIcon },
  { href: '/suscripciones', label: 'Suscripciones', icon: RepeatIcon },
  { href: '/estadisticas', label: 'Estadisticas', icon: ChartIcon },
];

function HomeIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>; }
function HistoryIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3.05 11a9 9 0 1 0 .5-4.5"/><path d="M3 3v4h4"/><path d="M12 8v4l2 2"/></svg>; }
function WalletIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M16 14h2"/></svg>; }
function TagIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><path d="M7 7h.01"/></svg>; }
function RepeatIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m17 2 4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>; }
function ChartIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 20v-6"/><path d="M12 20V4"/><path d="M18 20V10"/></svg>; }

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
}

export default function Sidebar({ isOpen, onClose, currentPath }: SidebarProps) {
  if (!isOpen) return null;

  return (
    <>
      <button className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.6)', border: 0 }} onClick={onClose} aria-label="Cerrar menu" />
      <aside className="fixed left-0 top-0 bottom-0 z-50 w-72 flex flex-col" style={{ background: '#0e0e15', borderRight: '1px solid #2a2a38' }}>
        <div className="flex items-center justify-between px-6 pb-4" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}>
          <div className="flex items-center gap-3">
            <img src="/favicon.png" alt="" className="w-9 h-9 rounded-xl" />
            <div>
              <p className="font-bold text-sm" style={{ color: '#f1f0ff' }}>FinanzasAI</p>
              <p className="text-xs" style={{ color: '#5a5870' }}>Tu dinero, inteligente</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg" aria-label="Cerrar menu">x</button>
        </div>
        <div style={{ height: '1px', background: '#1e1e28', margin: '0 1.5rem' }} />
        <nav className="flex-1 p-4 flex flex-col gap-1">
          {navItems.map((item) => {
            const active = currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href));
            return (
              <a key={item.href} href={item.href} onClick={onClose} className="flex items-center gap-3 px-4 py-3 rounded-xl no-underline" style={{ background: active ? 'rgba(124,106,247,0.15)' : 'transparent', color: active ? '#7c6af7' : '#9896b0', border: active ? '1px solid rgba(124,106,247,0.3)' : '1px solid transparent' }}>
                <item.icon />
                <span className="font-medium text-sm">{item.label}</span>
              </a>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
