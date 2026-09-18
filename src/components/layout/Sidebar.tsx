import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, Settings, LifeBuoy, Shield, LogOut, Rocket, Sparkles, X, Code2, Send, Layers, Bot, Bookmark } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency, CURRENCIES } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';

interface SidebarProps { onClose?: () => void; }

const GRADIENT = 'var(--member-action-gradient)';
const DISPLAY = "Georgia, 'Times New Roman', serif";

const userNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Rocket, label: 'Full Engagement', path: '/engagement-order', highlight: true },
  { icon: Layers, label: 'Mass Order', path: '/engagement-order?mode=mass' },
  { icon: Sparkles, label: 'Engagement Orders', path: '/engagement-orders' },
  
  { icon: Bot, label: 'AI Assistant', path: '/ai-assistant', highlight: true },
  { icon: Wallet, label: 'Wallet', path: '/wallet' },
  { icon: Code2, label: 'API Access', path: '/api-access' },
  { icon: LifeBuoy, label: 'Support', path: '/support' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

const adminNavItems = [{ icon: Shield, label: 'Admin Panel', path: '/admin' }];

export function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation();
  const { isAdmin, signOut, wallet, profile } = useAuth();
  const { formatPrice, currency, currencyInfo, setCurrency } = useCurrency();

  return (
    <div className="member-sidebar h-full w-full overflow-hidden flex flex-col" style={{ background: '#fff', borderRight: '1px solid rgba(59,46,240,.10)' }}>
      {/* Close button (mobile) */}
      <div className="flex items-center justify-end px-3 pt-2 lg:hidden">
        <button onClick={onClose} aria-label="Close navigation menu" className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ color: '#bbb' }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mission Control Card — user + wallet unified */}
      {profile && (
        <div className="mx-3 sm:mx-4 mb-4 mt-3 lg:mt-4 relative rounded-2xl overflow-hidden bg-white"
          style={{
            border: '1px solid rgba(59,46,240,.12)',
            boxShadow: '0 10px 28px -14px rgba(59,46,240,.28), 0 1px 0 rgba(255,255,255,.6) inset',
          }}>
          {/* subtle top gradient hairline */}
          <div aria-hidden className="absolute top-0 inset-x-0 h-[3px]" style={{ background: GRADIENT }} />

          {/* Identity row */}
          <div className="relative px-4 pt-4 pb-3 flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-bold text-primary-foreground"
                style={{ background: GRADIENT }}>
                {profile.full_name?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ background: '#22c55e' }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-[13px] font-semibold truncate leading-tight" style={{ color: '#0F172A' }}>
                  {profile.full_name || 'User'}
                </p>
                <span className="text-[8px] font-bold px-1.5 py-[2px] rounded tracking-wider text-primary-foreground"
                  style={{ background: GRADIENT }}>PRO</span>
              </div>
              <p className="text-[10.5px] truncate mt-0.5" style={{ color: '#94A3B8' }}>{profile.email}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-4 h-px" style={{ background: 'rgba(59,46,240,.10)' }} />

          {/* Wallet section */}
          <div className="relative px-4 pt-3 pb-4">
            <div className="flex items-end justify-between mb-3">
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em]" style={{ color: '#94A3B8' }}>
                  Available Balance
                </p>
                <p className="text-[24px] font-extrabold leading-none mt-1.5 tracking-tight truncate"
                  style={{ color: '#0F172A', fontFamily: DISPLAY }}>
                  {formatPrice(wallet?.balance || 0)}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0 pb-0.5 px-2 py-1 rounded-md" style={{ background: '#EFF6FF' }}>
                <Wallet className="w-3 h-3" style={{ color: '#3B2EF0' }} />
                <span className="text-[9px] font-bold" style={{ color: '#3B2EF0' }}>{currency}</span>
              </div>
            </div>
            <Link to="/wallet" onClick={onClose}
              className="group flex items-center justify-center gap-2 w-full h-10 rounded-xl text-[12.5px] font-semibold text-primary-foreground transition-all active:scale-[.98]"
              style={{ background: GRADIENT, boxShadow: '0 10px 22px -8px rgba(245,54,75,.50)' }}>
              <span className="tracking-wide">Add Funds</span>
              <Rocket className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3 scrollbar-thin">
        <p className="px-3 mb-2 text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: '#94A3B8' }}>Menu</p>
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
                !isActive && 'hover:bg-secondary'
              )}
              style={{
                background: isActive ? '#EFF6FF' : 'transparent',
                color: isActive ? '#3B2EF0' : '#475569',
                border: isActive ? '1px solid rgba(59,46,240,.22)' : '1px solid transparent',
                fontWeight: isActive ? 600 : 500,
              }}
            >
              <item.icon className="w-4 h-4" style={{ color: isActive ? '#3B2EF0' : '#94A3B8' }} />
              <span className="flex-1">{item.label}</span>
              {(item as any).highlight && !isActive && (
                 <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold text-primary-foreground" style={{ background: GRADIENT }}>HOT</span>
              )}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="my-3 mx-3" style={{ borderTop: '1px solid rgba(59,46,240,.10)' }} />
            <p className="px-3 mb-2 text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: '#94A3B8' }}>Admin</p>
            {adminNavItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link key={item.path} to={item.path} onClick={onClose}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium mb-0.5 transition-all duration-150"
                  style={{
                    background: isActive ? '#FDF4FF' : 'transparent',
                    color: isActive ? '#A21CAF' : '#475569',
                    border: isActive ? '1px solid rgba(245,54,75,.25)' : '1px solid transparent',
                  }}
                >
                  <item.icon className="w-4 h-4" style={{ color: isActive ? '#F5364B' : '#94A3B8' }} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Currency */}
      <div className="px-3 pb-2">
        <label className="relative w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-[12px] font-medium cursor-pointer"
          style={{ color: '#475569', background: '#F8FAFF', border: '1px solid rgba(59,46,240,.12)' }}>
          <div className="flex items-center gap-2">
            <span className="text-base">{currencyInfo.flag}</span>
            <span className="uppercase tracking-wider">{currency}</span>
          </div>
          <span className="text-[10px] opacity-70">{currencyInfo.symbol}</span>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as any)}
            className="absolute inset-0 opacity-0 cursor-pointer"
            aria-label="Select currency"
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>
            ))}
          </select>
        </label>
      </div>



      {/* Sign out */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(59,46,240,.10)' }}>
        <button onClick={() => signOut()} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-colors hover:bg-red-50" style={{ color: '#64748B' }}>
          <LogOut className="w-3.5 h-3.5" style={{ color: '#F5364B' }} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}
