import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, Zap, History, Wallet, Settings } from 'lucide-react';
import { Sidebar } from './Sidebar';

const items = [
  { to: '/engagement-order', label: 'Order', icon: Zap },
  { to: '/orders', label: 'History', icon: History },
  { to: '/wallet', label: 'Wallet', icon: Wallet },
  { to: '/settings', label: 'Settings', icon: Settings },
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
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `member-bottom-nav-item flex flex-col items-center justify-center gap-1 flex-1 py-2 ${isActive ? 'is-active' : ''}`}
            >
              <Icon className="w-5 h-5" strokeWidth={2.2} />
              <span className="text-[10px] font-bold tracking-tight">{label}</span>
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
