import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, Settings, LifeBuoy, Shield, LogOut, Rocket, Sparkles, X, Code2, Send } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';

interface SidebarProps { onClose?: () => void; }

const GOLD = '#c9a84c';
const GOLD_SOFT = '#f0d78c';
const INK = '#0a0a0a';
const COAL = '#141414';
const PARCHMENT = '#efe7d4';
const BORDER = 'rgba(201,168,76,.18)';
const GOLD_GRAD = 'linear-gradient(135deg, #f0d78c 0%, #c9a84c 55%, #8b6f24 100%)';

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
    <div className="h-full w-full overflow-hidden flex flex-col"
      style={{ background: INK, borderRight: `1px solid ${BORDER}` }}>
      {/* Brand */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-[16px]"
            style={{ background: GOLD_GRAD, color: INK, boxShadow: '0 10px 24px -8px rgba(201,168,76,.55)' }}>
            M
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[19px] tracking-tight" style={{ color: PARCHMENT, fontFamily: "'Instrument Serif', serif" }}>
              Multy<em style={{ color: GOLD_SOFT }}>SMM</em>
            </span>
            <span className="text-[8.5px] font-bold uppercase tracking-[0.22em]" style={{ color: GOLD }}>
              ✦ Noir Edition
            </span>
          </div>
        </Link>
        <button onClick={onClose} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg"
          style={{ color: PARCHMENT, border: `1px solid ${BORDER}` }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* User chip */}
      {profile && (
        <div className="mx-4 mb-3 flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
          style={{ background: COAL, border: `1px solid ${BORDER}` }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
            style={{ background: GOLD_GRAD, color: INK }}>
            {profile.full_name?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-semibold truncate" style={{ color: PARCHMENT }}>{profile.full_name || 'User'}</p>
            <p className="text-[10px] truncate" style={{ color: 'rgba(239,231,212,.5)' }}>{profile.email}</p>
          </div>
        </div>
      )}

      {/* Wallet card */}
      <div className="mx-4 mb-4">
        <div className="rounded-2xl p-4 relative overflow-hidden"
          style={{
            background: 'radial-gradient(120% 120% at 0% 0%, #1c1a13 0%, #0d0d0d 60%), #0d0d0d',
            border: `1px solid ${BORDER}`,
            boxShadow: '0 18px 40px -16px rgba(201,168,76,.25), inset 0 1px 0 rgba(255,255,255,.04)'
          }}>
          <div aria-hidden className="absolute -top-12 -right-12 w-36 h-36 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(closest-side, rgba(201,168,76,.30), transparent 70%)' }} />
          <div className="relative">
            <div className="flex items-center gap-1.5 mb-2">
              <Wallet className="w-3 h-3" style={{ color: GOLD }} />
              <span className="text-[9px] font-bold uppercase tracking-[0.20em]" style={{ color: GOLD_SOFT }}>Wallet Balance</span>
            </div>
            <p className="text-[28px] tracking-tight mb-3 leading-none"
              style={{ color: PARCHMENT, fontFamily: "'Instrument Serif', serif", fontWeight: 400 }}>
              ₹<span className="gold-shimmer" style={{ fontFamily: "'Instrument Serif', serif" }}>
                {formatPrice(wallet?.balance || 0).replace('₹', '')}
              </span>
            </p>
            <Link to="/wallet" onClick={onClose}
              className="flex items-center justify-center gap-1.5 w-full h-9 rounded-xl text-[12px] font-bold transition-transform hover:-translate-y-0.5"
              style={{ background: GOLD_GRAD, color: INK, boxShadow: '0 8px 22px -6px rgba(201,168,76,.5)' }}>
              <Wallet className="w-3.5 h-3.5" /> Add Funds
            </Link>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3 scrollbar-thin">
        <p className="px-3 mb-2 text-[9px] font-bold uppercase tracking-[0.22em]" style={{ color: 'rgba(201,168,76,.55)' }}>Menu</p>
        {userNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} onClick={onClose}
              className={cn('group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] mb-0.5 transition-all duration-150')}
              style={{
                background: isActive ? 'linear-gradient(90deg, rgba(201,168,76,.14), rgba(201,168,76,.02))' : 'transparent',
                color: isActive ? GOLD_SOFT : 'rgba(239,231,212,.72)',
                border: isActive ? `1px solid ${BORDER}` : '1px solid transparent',
                fontWeight: isActive ? 600 : 500,
              }}
            >
              {isActive && (
                <span aria-hidden className="absolute left-0 top-2 bottom-2 w-[2px] rounded-r-full"
                  style={{ background: GOLD_GRAD }} />
              )}
              <item.icon className="w-4 h-4" style={{ color: isActive ? GOLD : 'rgba(239,231,212,.5)' }} />
              <span className="flex-1">{item.label}</span>
              {(item as any).highlight && !isActive && (
                <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold tracking-wider"
                  style={{ background: GOLD_GRAD, color: INK }}>HOT</span>
              )}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="my-3 mx-3" style={{ borderTop: `1px solid ${BORDER}` }} />
            <p className="px-3 mb-2 text-[9px] font-bold uppercase tracking-[0.22em]" style={{ color: 'rgba(201,168,76,.55)' }}>Admin</p>
            {adminNavItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link key={item.path} to={item.path} onClick={onClose}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium mb-0.5 transition-all duration-150"
                  style={{
                    background: isActive ? 'linear-gradient(90deg, rgba(201,168,76,.14), rgba(201,168,76,.02))' : 'transparent',
                    color: isActive ? GOLD_SOFT : 'rgba(239,231,212,.72)',
                    border: isActive ? `1px solid ${BORDER}` : '1px solid transparent',
                  }}
                >
                  <item.icon className="w-4 h-4" style={{ color: isActive ? GOLD : 'rgba(239,231,212,.5)' }} />
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
          style={{ color: 'rgba(239,231,212,.7)', background: COAL, border: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2">
            <span className="text-base">🇮🇳</span>
            <span className="uppercase tracking-wider">INR</span>
          </div>
          <span className="text-[10px]" style={{ color: GOLD }}>₹</span>
        </div>
      </div>

      {/* Telegram */}
      <div className="px-3 pb-1">
        <a href="https://t.me/HenryMiller08" target="_blank" rel="noopener noreferrer"
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12px] font-medium transition-colors hover:bg-[#1a1a1a]"
          style={{ background: COAL, border: `1px solid ${BORDER}`, color: PARCHMENT }}>
          <Send className="w-4 h-4 shrink-0" style={{ color: GOLD }} />
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-[11px]">Join our Telegram</span>
            <span className="text-[10px]" style={{ color: 'rgba(239,231,212,.5)' }}>Updates & support</span>
          </div>
        </a>
      </div>

      {/* Sign out */}
      <div className="p-3" style={{ borderTop: `1px solid ${BORDER}` }}>
        <button onClick={() => signOut()}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-colors hover:bg-[#1a1a1a]"
          style={{ color: 'rgba(239,231,212,.65)' }}>
          <LogOut className="w-3.5 h-3.5" style={{ color: '#d97757' }} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}
