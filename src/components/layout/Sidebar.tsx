import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, Settings, LifeBuoy, Shield, LogOut, Rocket, Sparkles, X, Code2, Send, Layers, Megaphone, Bookmark, ShoppingCart, History } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';
import { isAdsOrderSection } from '@/lib/platform-options';

interface SidebarProps { onClose?: () => void; }

const GRADIENT = 'var(--member-action-gradient)';

const userNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: ShoppingCart, label: 'Single Order', path: '/single-order' },
  { icon: History, label: 'Single Order History', path: '/orders' },
  { icon: Rocket, label: 'Full Engagement', path: '/engagement-order', highlight: true },
  { icon: Layers, label: 'Mass Order', path: '/engagement-order?mode=mass' },
  { icon: Sparkles, label: 'Engagement Orders', path: '/engagement-orders' },
  
  { icon: Megaphone, label: 'Ads Monetization', path: '/engagement-order?section=ads&platform=adsterra', highlight: true },
  { icon: Wallet, label: 'Wallet', path: '/wallet' },
  { icon: Code2, label: 'API Access', path: '/api-access' },
  { icon: LifeBuoy, label: 'Support', path: '/support' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

const adminNavItems = [{ icon: Shield, label: 'Admin Panel', path: '/admin' }];

export function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation();
  const { isAdmin, signOut, wallet, profile } = useAuth();
  const { formatPrice, currency } = useCurrency();

  return (
    <div className="member-sidebar h-full w-full overflow-hidden flex flex-col" style={{ background: 'hsl(var(--member-soft))', borderRight: '1px solid hsl(var(--member-line))' }}>
      {/* Brand header — logo + name (mobile fills the empty top strip) */}
      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
        <Link to="/dashboard" onClick={onClose} className="flex items-center gap-2.5 min-w-0">
            <span className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-white flex items-center justify-center p-1"
              style={{ border: '1px solid hsl(var(--member-line))', boxShadow: '0 6px 14px -8px hsl(var(--member-green) / 0.5)' }}>
              <img src="/logo-mark.png" alt="MultySMM logo" className="w-full h-full object-contain" />
            </span>
          <span className="min-w-0">
            <span className="block text-[17px] font-extrabold tracking-tight leading-none" style={{ color: '#0F172A' }}>
              Multy<span style={{ color: 'hsl(var(--member-green))' }}>SMM</span>
            </span>
            <span className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'hsl(var(--member-green))' }} />
              <span className="text-[8.5px] font-bold uppercase tracking-[0.18em] truncate" style={{ color: 'hsl(var(--member-green-deep))' }}>
                Real Growth Platform
              </span>
            </span>
          </span>
        </Link>
        <button onClick={onClose} aria-label="Close navigation menu"
          className="w-8 h-8 flex items-center justify-center rounded-lg shrink-0 lg:hidden" style={{ color: '#bbb' }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* User + Wallet cards (OrganicSMM-style soft green) */}
      {profile && (
        <div className="mx-3 sm:mx-4 mb-4 mt-2 space-y-2.5">
          {/* User card */}
          <div className="rounded-2xl px-4 py-3.5 flex items-center gap-3"
            style={{
              background: 'hsl(var(--member-green) / 0.09)',
              border: '1px solid hsl(var(--member-green) / 0.16)',
            }}>
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-[14px] font-extrabold text-primary-foreground shrink-0"
              style={{ background: GRADIENT, boxShadow: '0 8px 16px -8px hsl(var(--member-green) / 0.55)' }}>
              {profile.full_name?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold truncate leading-tight" style={{ color: '#0F172A' }}>
                {profile.full_name || 'User'}
              </p>
              <p className="text-[11px] truncate mt-0.5" style={{ color: '#64748B' }}>{profile.email}</p>
            </div>
          </div>

          {/* Wallet card */}
          <div className="rounded-2xl px-4 pt-3.5 pb-4"
            style={{
              background: 'hsl(var(--member-green) / 0.09)',
              border: '1px solid hsl(var(--member-green) / 0.16)',
            }}>
            <div className="flex items-center justify-between mb-1.5">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: 'hsl(var(--member-green-deep))' }}>
                <Wallet className="w-3.5 h-3.5" />
                Wallet Balance
              </p>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-white"
                style={{ color: 'hsl(var(--member-green-deep))', border: '1px solid hsl(var(--member-green) / 0.2)' }}>
                {currency}
              </span>
            </div>
            <p className="text-[26px] font-extrabold leading-none tracking-tight truncate mb-3.5"
              style={{ color: '#0F172A' }}>
              {formatPrice(wallet?.balance || 0)}
            </p>
            <Link to="/wallet" onClick={onClose}
              className="flex items-center justify-center gap-2 w-full h-11 rounded-full text-[13.5px] font-bold text-primary-foreground transition-all active:scale-[.98]"
              style={{ background: GRADIENT, boxShadow: '0 10px 22px -8px hsl(var(--member-green) / 0.55)' }}>
              <Wallet className="w-4 h-4" />
              <span className="tracking-wide">Add Funds</span>
            </Link>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3 scrollbar-thin">
        <p className="px-3 mb-2.5 text-[10px] font-extrabold uppercase tracking-[0.22em]" style={{ color: 'hsl(var(--member-green) / 0.7)' }}>Menu</p>
        {userNavItems.map((item) => {
          const currentFull = location.pathname + location.search;
          const isMassLink = item.path.includes('mode=mass');
          const isEngagementBase = item.path === '/engagement-order';
          const onEngagement = location.pathname === '/engagement-order';
          const isMassActive = onEngagement && location.search.includes('mode=mass');
          const isAdsLink = item.path.includes('platform=adsterra');
          const isAdsActive = onEngagement && isAdsOrderSection(location.search);
          const isActive = isAdsLink
            ? isAdsActive
            : isMassLink
            ? isMassActive
            : isEngagementBase
              ? onEngagement && !isMassActive && !isAdsActive
              : location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} onClick={onClose}
              className={cn('flex items-center gap-3 px-4 py-3 rounded-2xl text-[13.5px] mb-2 transition-all duration-150 active:scale-[.98]',
                !isActive && 'hover:translate-x-0.5'
              )}
              style={{
                background: isActive ? GRADIENT : '#FFFFFF',
                color: isActive ? '#FFFFFF' : '#334155',
                border: isActive ? '1px solid transparent' : '1px solid hsl(var(--member-line))',
                boxShadow: isActive
                  ? '0 10px 20px -8px hsl(var(--member-green) / 0.45)'
                  : '0 2px 8px -4px rgba(15,23,42,.08)',
                fontWeight: isActive ? 800 : 600,
                letterSpacing: '-0.01em',
              }}
            >
              <item.icon className="w-[18px] h-[18px]" style={{ color: isActive ? '#FFFFFF' : 'hsl(var(--member-green))' }} />
              <span className="flex-1">{item.label}</span>
              {(item as any).highlight && !isActive && (
                 <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold text-primary-foreground" style={{ background: GRADIENT }}>HOT</span>
              )}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="my-3 mx-3" style={{ borderTop: '1px solid hsl(var(--member-line))' }} />
            <p className="px-3 mb-2 text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: '#64748B' }}>Admin</p>
            {adminNavItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link key={item.path} to={item.path} onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[13.5px] mb-2 transition-all duration-150 active:scale-[.98]"
                  style={{
                    background: isActive ? GRADIENT : '#FFFFFF',
                    color: isActive ? '#FFFFFF' : '#334155',
                    border: isActive ? '1px solid transparent' : '1px solid hsl(var(--member-line))',
                    boxShadow: isActive ? '0 10px 20px -8px hsl(var(--member-green) / 0.45)' : '0 2px 8px -4px rgba(15,23,42,.08)',
                    fontWeight: isActive ? 800 : 600,
                    letterSpacing: '-0.01em',
                  }}
                >
                  <item.icon className="w-[18px] h-[18px]" style={{ color: isActive ? '#FFFFFF' : 'hsl(var(--member-green))' }} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Currency selector removed — pricing is INR-only now */}

      {/* Telegram card */}
      <div className="px-3 pb-2">
        <a href="https://t.me/x07neo" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-150 hover:translate-x-0.5"
          style={{ background: '#FFFFFF', border: '1px solid hsl(var(--member-line))', boxShadow: '0 2px 8px -4px rgba(15,23,42,.08)' }}>
          <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: GRADIENT }}>
            <Send className="w-4 h-4" style={{ color: '#fff' }} />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-bold leading-tight" style={{ color: '#0F172A' }}>Join our Telegram</span>
            <span className="block text-[11px] mt-0.5" style={{ color: '#64748B' }}>Updates & support</span>
          </span>
        </a>
      </div>

      {/* Sign out */}
      <div className="p-3">
        <button onClick={() => signOut()} className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl text-[13.5px] font-bold transition-all active:scale-[.98] hover:bg-red-50"
          style={{ color: '#EF4444', background: '#FFFFFF', border: '1px solid rgba(239,68,68,.18)', boxShadow: '0 2px 8px -4px rgba(15,23,42,.08)' }}>
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}
