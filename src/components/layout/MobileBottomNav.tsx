import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, Zap, History, Wallet, Settings } from 'lucide-react';
import { Sidebar } from './Sidebar';

const items = [
  { to: '/engagement-order', label: 'Order', icon: Zap, color: '#7C3AED', soft: '#F1EBFE' },
  { to: '/orders', label: 'History', icon: History, color: '#0EA5E9', soft: '#E8F5FE' },
  { to: '/wallet', label: 'Wallet', icon: Wallet, color: '#10B981', soft: '#E7F8F1' },
  { to: '/settings', label: 'Settings', icon: Settings, color: '#F59E0B', soft: '#FDF3E2' },
];

export function MobileBottomNav() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 lg:hidden">
        <div className="member-mobile-header flex items-center justify-between h-14 px-4"
          style={{ background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(59,46,240,.12)', boxShadow: '0 6px 20px rgba(59,46,240,.08)' }}>
          <button onClick={() => setSidebarOpen(true)} aria-label="Open navigation menu" className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ border: '1px solid rgba(59,46,240,.15)', background: '#F3EFFE' }}>
            <Menu className="w-4 h-4" style={{ color: '#7C3AED' }} />
          </button>
          <div className="flex items-center">
            <img src="/logo.png" alt="MultySMM" className="h-8 w-auto object-contain" />
          </div>
          <div className="w-9" />
        </div>
      </header>

      <nav className="member-bottom-nav fixed bottom-0 left-0 right-0 z-40 lg:hidden" aria-label="Primary">
        <div className="member-bottom-nav-inner flex items-stretch justify-around">
          {items.map(({ to, label, icon: Icon, color, soft }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `member-bottom-nav-item flex flex-col items-center justify-center gap-1 flex-1 py-2 ${isActive ? 'is-active' : ''}`}
              style={{ '--tab-color': color, '--tab-soft': soft } as React.CSSProperties}
            >
              <span className="member-bottom-nav-icon flex items-center justify-center w-9 h-9 rounded-xl">
                <Icon className="w-[22px] h-[22px]" strokeWidth={2.6} />
              </span>
              <span className="text-[11px] font-extrabold tracking-tight">{label}</span>
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
