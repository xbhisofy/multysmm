import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, Settings, LifeBuoy, Shield, LogOut, Rocket, Sparkles, X, Code2, Send } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';

interface SidebarProps { onClose?: () => void; }

const GRADIENT = 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)';

const userNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Rocket, label: 'Full Engagement', path: '/engagement-order', highlight: true },
  { icon: Sparkles, label: 'Engagement Orders', path: '/engagement-orders' },
  { icon: Wallet, label: 'Wallet', path: '/wallet' },
  { icon: Code2, label: 'API Access', path: '/api-access' },
  { icon: LifeBuoy, label: 'Support', path: '/support' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

const adminNavItems = [{ icon: Shield, label: 'Admin Panel', path: '/admin' }];

export function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation();
  const { isAdmin, signOut, wallet, profile } = useAuth();
  const { formatPrice } = useCurrency();

  return (
    <div className="h-full w-full overflow-hidden flex flex-col" style={{ background: '#fff', borderRight: '1px solid #efeaf7' }}>
      {/* Brand */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-[15px]"
            style={{ background: GRADIENT, boxShadow: '0 6px 18px rgba(124,58,237,.35)' }}>
            M
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[15px] font-extrabold tracking-tight" style={{ color: '#0B0B16' }}>MultySMM</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.18em]"
              style={{ background: GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ✦ AI-Powered
            </span>
          </div>
        </Link>
        <button onClick={onClose} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg" style={{ color: '#bbb' }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* User chip */}
      {profile && (
        <div className="mx-4 mb-3 flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: '#FAF5FF', border: '1px solid #EDE4FE' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
            style={{ background: GRADIENT }}>
            {profile.full_name?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold truncate" style={{ color: '#0B0B16' }}>{profile.full_name || 'User'}</p>
            <p className="text-[10px] truncate" style={{ color: '#9b8fb8' }}>{profile.email}</p>
          </div>
        </div>
      )}

      {/* Wallet card */}
      <div className="mx-4 mb-4">
        <div className="rounded-2xl p-4 relative overflow-hidden text-white"
          style={{ background: GRADIENT, boxShadow: '0 14px 30px -10px rgba(124,58,237,.45)' }}>
          <div aria-hidden className="absolute -top-10 -right-10 w-32 h-32 rounded-full"
            style={{ background: 'radial-gradient(closest-side, rgba(255,255,255,.25), transparent 70%)' }} />
          <div className="relative">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Wallet className="w-3 h-3" />
              <span className="text-[9px] font-bold uppercase tracking-[0.16em] opacity-90">Wallet Balance</span>
            </div>
            <p className="text-[24px] font-extrabold tracking-tight mb-3">
              {formatPrice(wallet?.balance || 0)}
            </p>
            <Link to="/wallet" onClick={onClose}
              className="flex items-center justify-center gap-1.5 w-full h-9 rounded-xl text-[12px] font-bold"
              style={{ background: 'rgba(255,255,255,.95)', color: '#7C3AED' }}>
              <Wallet className="w-3.5 h-3.5" /> Add Funds
            </Link>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3 scrollbar-thin">
        <p className="px-3 mb-2 text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: '#b8a8d0' }}>Menu</p>
        {userNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} onClick={onClose}
              className={cn('flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium mb-0.5 transition-all duration-150',
                !isActive && 'hover:bg-purple-50/70'
              )}
              style={{
                background: isActive ? '#F5EEFF' : 'transparent',
                color: isActive ? '#6D28D9' : '#4A4A5E',
                border: isActive ? '1px solid #E5D7FA' : '1px solid transparent',
                fontWeight: isActive ? 600 : 500,
              }}
            >
              <item.icon className="w-4 h-4" style={{ color: isActive ? '#7C3AED' : '#a99dc1' }} />
              <span className="flex-1">{item.label}</span>
              {(item as any).highlight && !isActive && (
                <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold text-white" style={{ background: GRADIENT }}>HOT</span>
              )}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="my-3 mx-3" style={{ borderTop: '1px solid #f3eefa' }} />
            <p className="px-3 mb-2 text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: '#b8a8d0' }}>Admin</p>
            {adminNavItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link key={item.path} to={item.path} onClick={onClose}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium mb-0.5 transition-all duration-150"
                  style={{
                    background: isActive ? '#FDF2F8' : 'transparent',
                    color: isActive ? '#BE185D' : '#4A4A5E',
                    border: isActive ? '1px solid #FBCFE8' : '1px solid transparent',
                  }}
                >
                  <item.icon className="w-4 h-4" style={{ color: isActive ? '#EC4899' : '#a99dc1' }} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Currency */}
      <div className="px-3 pb-2">
        <div className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-[12px] font-medium"
          style={{ color: '#7d6f97', background: '#FAF7FF', border: '1px solid #efeaf7' }}>
          <div className="flex items-center gap-2">
            <span className="text-base">🇮🇳</span>
            <span className="uppercase tracking-wider">INR</span>
          </div>
          <span className="text-[10px] opacity-70">₹</span>
        </div>
      </div>


      {/* Sign out */}
      <div className="p-3" style={{ borderTop: '1px solid #f3eefa' }}>
        <button onClick={() => signOut()} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-colors hover:bg-red-50" style={{ color: '#9b8fb8' }}>
          <LogOut className="w-3.5 h-3.5" style={{ color: '#EC4899' }} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}
