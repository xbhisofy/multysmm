import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, ShoppingCart, Package, ClipboardList, Wallet, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar } from './Sidebar';

const leftItems = [
  { to: '/single-order', label: 'Single Order', icon: Package },
  { to: '/orders', label: 'Order History', icon: ClipboardList },
];
const rightItems = [
  { to: '/wallet', label: 'Wallet', icon: Wallet },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const PlainItem = ({ to, label, icon: Icon }: { to: string; label: string; icon: typeof History }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `member-bottom-nav-item flex flex-col items-center justify-center gap-[5px] flex-1 pt-2 pb-[7px] ${isActive ? 'is-active' : ''}`}
  >
    <span className="member-bottom-nav-icon flex items-center justify-center">
      <Icon className="w-[22px] h-[22px]" />
    </span>
    <span className="member-bottom-nav-label">{label}</span>
  </NavLink>
);

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
            <img src="/logo.png" alt="MultySMM" className="h-8 w-auto object-contain" />
          </div>
          <div className="w-9" />
        </div>
      </header>

      <nav className="member-bottom-nav fixed bottom-0 left-0 right-0 z-40 lg:hidden" aria-label="Primary">
        <div className="member-bottom-nav-inner relative flex items-stretch">
          <div className="flex flex-1 items-stretch justify-around">
            {leftItems.map(item => <PlainItem key={item.to} {...item} />)}
          </div>
          <div className="w-20 shrink-0" />
          <div className="flex flex-1 items-stretch justify-around">
            {rightItems.map(item => <PlainItem key={item.to} {...item} />)}
          </div>
          <NavLink
            to="/engagement-order"
            aria-label="New Order"
            className={({ isActive }) => `member-bottom-nav-order absolute left-1/2 top-0 flex -translate-x-1/2 flex-col items-center ${isActive ? 'is-active' : ''}`}
          >
            <span className="member-bottom-nav-order-circle -mt-7 flex h-14 w-14 items-center justify-center rounded-full">
              <ShoppingCart className="h-6 w-6" />
            </span>
            <span className="member-bottom-nav-label mt-1">New Order</span>
          </NavLink>
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
