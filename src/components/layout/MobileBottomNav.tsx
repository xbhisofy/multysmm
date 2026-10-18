import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, Zap, History, Wallet, Settings } from 'lucide-react';
import { Sidebar } from './Sidebar';

const items = [
  { to: '/engagement-order', label: 'New Order', icon: Zap },
  { to: '/engagement-orders', label: 'History', icon: History },
  { to: '/wallet', label: 'Wallet', icon: Wallet },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function MobileBottomNav() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 lg:hidden">
        <div className="member-mobile-header flex items-center justify-between h-14 px-4"
          style={{ background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(14px)', borderBottom: '1px solid hsl(var(--member-line))', boxShadow: '0 6px 20px hsl(var(--member-green) / 0.08)' }}>
          <button onClick={() => setSidebarOpen(true)} aria-label="Open navigation menu" className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ border: '1px solid hsl(var(--member-line))', background: 'hsl(var(--member-green) / 0.1)' }}>
            <Menu className="w-4 h-4" style={{ color: 'hsl(var(--member-green-deep))' }} />
          </button>
          <div className="flex items-center">
            <img src="/logo.png" alt="MultySMM" className="h-8 w-auto object-contain" />
          </div>
          <div className="w-9" />
        </div>
      </header>

      <nav className="member-bottom-nav fixed bottom-0 left-0 right-0 z-40 lg:hidden" aria-label="Primary">
        <div className="member-bottom-nav-inner flex items-stretch justify-around">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `member-bottom-nav-item flex flex-col items-center justify-center gap-[5px] flex-1 pt-2 pb-[7px] ${isActive ? 'is-active' : ''}`}
            >
              <span className="member-bottom-nav-icon flex items-center justify-center w-10 h-10 rounded-[14px]">
                <Icon className="w-[21px] h-[21px]" />
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
