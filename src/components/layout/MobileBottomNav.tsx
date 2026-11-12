import { useId, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar } from './Sidebar';

type NavIconKind = 'single' | 'history' | 'new' | 'wallet' | 'settings';
const items: { to: string; label: string; icon: NavIconKind }[] = [
  { to: '/single-order', label: 'Single', icon: 'single' },
  { to: '/orders', label: 'History', icon: 'history' },
  { to: '/engagement-order', label: 'Full Engagement', icon: 'new' },
  { to: '/wallet', label: 'Wallet', icon: 'wallet' },
  { to: '/settings', label: 'Setting', icon: 'settings' },
];

function NavigationIcon({ kind }: { kind: NavIconKind }) {
  const gradientId = useId().replace(/:/g, '');
  const ink = `url(#${gradientId})`;
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className={`member-nav-svg member-nav-svg-${kind}`}>
      <defs>
        <linearGradient id={gradientId} x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop className="member-nav-gradient-start" />
          <stop offset="1" className="member-nav-gradient-end" />
        </linearGradient>
      </defs>
      {kind === 'single' && <>
        <path d="m7 29 17 10 17-10M7 36l17 10 17-10" stroke={ink} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 3a6 6 0 0 1 6 0l15 9a4 4 0 0 1 0 7l-15 9a6 6 0 0 1-6 0L6 19a4 4 0 0 1 0-7Z" fill={ink} />
        <path d="M24 9v13m-6.5-6.5h13" className="member-nav-white-stroke" strokeWidth="3.5" strokeLinecap="round" />
      </>}
      {kind === 'history' && <>
        <path d="M21 41H9a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4h25a4 4 0 0 1 4 4v8M5 18h33M13 4v9M30 4v9" stroke={ink} strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13 25h3m7 0h3m-13 7h3" stroke={ink} opacity=".25" strokeWidth="4" strokeLinecap="round" />
        <circle cx="34" cy="34" r="11" className="member-nav-paper-fill" stroke={ink} strokeWidth="3.6" />
        <path d="M34 28v7l4 2" stroke={ink} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </>}
      {kind === 'new' && <>
        <g className="member-nav-white-fill">
          <path d="M26 10h9l-7 12h8L20 39l5-14h-8Z" strokeLinejoin="round" />
          <path d="M12 7C6 1 1 10 7 15l5 4 5-4c6-5 1-14-5-8Z" />
          <path d="M4 23h8a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4H8l-4 3v-4a4 4 0 0 1-3-3v-4a4 4 0 0 1 3-4Z" />
          <path d="m39 17 7 5a2 2 0 0 1 0 3l-7 5a1.5 1.5 0 0 1-2-1V18a1.5 1.5 0 0 1 2-1Z" />
          <circle cx="29" cy="39" r="3" /><circle cx="37" cy="40" r="2.5" />
          <path d="M23 47a6 6 0 0 1 12 0Zm13 0a8 8 0 0 0-2-4 5 5 0 0 1 8 4Z" />
        </g>
        <g className="member-nav-engagement-detail">
          <circle cx="5" cy="29" r="1" /><circle cx="8.5" cy="29" r="1" /><circle cx="12" cy="29" r="1" />
        </g>
      </>}
      {kind === 'wallet' && <>
        <path d="m8 16 29-9 3 10M8 19h30" stroke={ink} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="4" y="16" width="41" height="28" rx="6" fill={ink} />
        <path d="M26 23h11m-11 5h11m-10-5c8 0 8 10 0 10l9 7" className="member-nav-white-stroke" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </>}
      {kind === 'settings' && <>
        <path d="m20 3-1 6-5 2-5-3-6 9 5 4v6l-5 4 6 9 5-3 5 2 1 6h10l1-6 5-2 5 3 6-9-5-4v-6l5-4-6-9-5 3-5-2-1-6Z" fill={ink} transform="translate(-1 0)" />
        <circle cx="24" cy="24" r="11" className="member-nav-paper-fill" />
        <circle cx="24" cy="24" r="6" stroke={ink} strokeWidth="3.5" />
      </>}
    </svg>
  );
}

export function MobileBottomNav() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 lg:hidden">
        <div className="member-mobile-header flex items-center justify-between h-14 px-4"
          style={{ background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(14px)', borderBottom: '1px solid hsl(var(--member-line))', boxShadow: '0 6px 20px hsl(var(--member-green) / 0.08)' }}>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} aria-label="Open navigation menu" className="flex items-center justify-center w-11 h-11 rounded-lg" style={{ border: '1px solid hsl(var(--member-line))', background: 'hsl(var(--member-green) / 0.1)' }}>
            <Menu className="w-4 h-4" style={{ color: 'hsl(var(--member-green-deep))' }} />
          </Button>
          <div className="flex items-center">
            <img src="/logo.png" alt="ZoloSMM" className="h-8 w-auto object-contain" />
          </div>
          <div className="w-9" />
        </div>
      </header>

      <nav className="member-bottom-nav" aria-label="Primary">
        <div className="member-bottom-nav-inner">
          {items.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) =>
              `member-bottom-nav-item ${icon === 'new' ? 'member-bottom-nav-order' : ''} ${isActive ? 'is-active' : ''}`}
              data-icon={icon}>
              <span className={icon === 'new' ? 'member-bottom-nav-order-circle' : 'member-bottom-nav-icon'}>
                <NavigationIcon kind={icon} />
              </span>
              <span className="member-bottom-nav-label">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-foreground/30 z-50 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-[85vw] max-w-[300px] lg:hidden shadow-2xl">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}
    </>
  );
}
