import { useEffect, useState } from 'react';

const navItems = [
  { href: '/', label: 'Inicio', icon: HomeIcon, color: '#7c6af7' },
  { href: '/historial', label: 'Historial', icon: HistoryIcon, color: '#ec4899' },
  { href: '/billeteras', label: 'Billeteras', icon: WalletIcon, color: '#3b82f6' },
  { href: '/estadisticas', label: 'Estadisticas', icon: ChartIcon, color: '#22c55e' },
];

function HomeIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>;
}
function HistoryIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3.05 11a9 9 0 1 0 .5-4.5"/><path d="M3 3v4h4"/><path d="M12 8v4l2 2"/></svg>;
}
function WalletIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M16 14h2"/></svg>;
}
function ChartIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 20v-6"/><path d="M12 20V4"/><path d="M18 20V10"/></svg>;
}

export default function FloatingNav({ currentPath }: { currentPath: string }) {
  const [activePath, setActivePath] = useState(currentPath);

  useEffect(() => {
    const syncWithUrl = () => setActivePath(window.location.pathname);

    syncWithUrl();
    document.addEventListener('astro:page-load', syncWithUrl);
    return () => document.removeEventListener('astro:page-load', syncWithUrl);
  }, [currentPath]);

  return (
    <div className="fixed inset-x-0 mx-auto z-40 w-full px-4" style={{ maxWidth: '440px', bottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}>
      <div className="flex items-center justify-around rounded-3xl p-2" style={{ background: 'rgba(17,17,24,0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
        {navItems.map((item) => {
          const active = activePath === item.href || (item.href !== '/' && activePath.startsWith(item.href));
          return (
            <a key={item.href} href={item.href} data-astro-prefetch="viewport" aria-label={item.label} aria-current={active ? 'page' : undefined} onPointerDown={() => setActivePath(item.href)} onClick={() => setActivePath(item.href)} className="relative p-3 rounded-2xl flex items-center justify-center no-underline" style={{ color: active ? item.color : '#5a5870', background: active ? `${item.color}20` : 'transparent', border: active ? `1px solid ${item.color}40` : '1px solid transparent' }}>
              <item.icon />
            </a>
          );
        })}
      </div>
    </div>
  );
}
