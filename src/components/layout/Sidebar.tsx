import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, Settings, LifeBuoy, Shield, LogOut, Rocket, Sparkles, X, Code2, Send, Layers } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';

interface SidebarProps { onClose?: () => void; }

const GRADIENT = 'linear-gradient(135deg, #F97316 0%, #EC4899 55%, #8B5CF6 100%)';

const userNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Rocket, label: 'Full Engagement', path: '/engagement-order', highlight: true },
  { icon: Layers, label: 'Mass Order', path: '/engagement-order?mode=mass' },
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
      {/* Close button (mobile) */}
      <div className="flex items-center justify-end px-3 pt-2 lg:hidden">
        <button onClick={onClose} aria-label="Close navigation menu" className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ color: '#bbb' }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mission Control Card — user + wallet unified */}
      {profile && (
        <div className="mx-4 mb-4 relative rounded-[22px] overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, #fff 0%, #FFF7EF 55%, #FFE8D2 100%)',
            border: '1px solid #FFD9B5',
            boxShadow: '0 18px 40px -18px rgba(249,115,22,.35), 0 2px 0 #fff inset',
          }}>
          {/* decorative dot grid */}
          <div aria-hidden className="absolute inset-0 opacity-[0.09] pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(#F97316 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
          {/* corner glow */}
          <div aria-hidden className="absolute -top-14 -right-14 w-40 h-40 rounded-full"
            style={{ background: 'radial-gradient(closest-side, rgba(249,115,22,.35), transparent 70%)' }} />

          {/* Header strip — avatar + identity + status dot */}
          <div className="relative px-4 pt-3.5 pb-3 flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-[14px] font-black text-white rotate-[-6deg]"
                style={{ background: GRADIENT, boxShadow: '0 8px 18px -6px rgba(249,115,22,.55)' }}>
                {profile.full_name?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white" style={{ background: '#22c55e' }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-[13px] font-extrabold truncate leading-tight" style={{ color: '#0B0B16' }}>
                  {profile.full_name || 'User'}
                </p>
                <span className="text-[8px] font-black px-1.5 py-[1px] rounded-full tracking-wider"
                  style={{ background: '#0B0B16', color: '#FFB27A' }}>PRO</span>
              </div>
              <p className="text-[10px] truncate mt-0.5" style={{ color: '#8a7a6a' }}>{profile.email}</p>
            </div>
          </div>

          {/* Ticket-style dashed divider with punch holes */}
          <div className="relative h-3 mx-1">
            <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full" style={{ background: '#F3EBFB' }} />
            <span className="absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full" style={{ background: '#F3EBFB' }} />
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 border-t border-dashed" style={{ borderColor: '#F7B37B' }} />
          </div>

          {/* Wallet section */}
          <div className="relative px-4 pt-2 pb-4">
            <div className="flex items-end justify-between mb-2.5">
              <div>
                <p className="text-[8.5px] font-black uppercase tracking-[0.22em]" style={{ color: '#B4632A' }}>
                  Available Balance
                </p>
                <p className="text-[26px] font-black leading-none mt-1 tracking-tight"
                  style={{ background: GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {formatPrice(wallet?.balance || 0)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-0.5 pb-0.5">
                <Wallet className="w-4 h-4" style={{ color: '#F97316' }} />
                <span className="text-[8px] font-bold" style={{ color: '#B4632A' }}>INR</span>
              </div>
            </div>
            <Link to="/wallet" onClick={onClose}
              className="group flex items-center justify-between w-full h-10 pl-4 pr-1.5 rounded-full text-[12px] font-black text-white transition-transform active:scale-[.98]"
              style={{ background: GRADIENT, boxShadow: '0 10px 22px -10px rgba(249,115,22,.7)' }}>
              <span className="tracking-wide">Add Funds</span>
              <span className="w-7 h-7 rounded-full flex items-center justify-center bg-white transition-transform group-hover:translate-x-0.5"
                style={{ color: '#F97316' }}>
                <Rocket className="w-3.5 h-3.5 -rotate-45" />
              </span>
            </Link>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3 scrollbar-thin">
        <p className="px-3 mb-2 text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: '#b8a8d0' }}>Menu</p>
        {userNavItems.map((item) => {
          const currentFull = location.pathname + location.search;
          const isMassLink = item.path.includes('mode=mass');
          const isEngagementBase = item.path === '/engagement-order';
          const onEngagement = location.pathname === '/engagement-order';
          const isMassActive = onEngagement && location.search.includes('mode=mass');
          const isActive = isMassLink
            ? isMassActive
            : isEngagementBase
              ? onEngagement && !isMassActive
              : location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} onClick={onClose}
              className={cn('flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium mb-0.5 transition-all duration-150',
                !isActive && 'hover:bg-orange-50/70'
              )}
              style={{
                background: isActive ? '#F5EEFF' : 'transparent',
                color: isActive ? '#EA580C' : '#4A4A5E',
                border: isActive ? '1px solid #E5D7FA' : '1px solid transparent',
                fontWeight: isActive ? 600 : 500,
              }}
            >
              <item.icon className="w-4 h-4" style={{ color: isActive ? '#F97316' : '#a99dc1' }} />
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
                  <item.icon className="w-4 h-4" style={{ color: isActive ? '#6366F1' : '#a99dc1' }} />
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
          <LogOut className="w-3.5 h-3.5" style={{ color: '#6366F1' }} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}
