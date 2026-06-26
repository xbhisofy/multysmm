import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';

const GOLD = '#c9a84c';
const GOLD_SOFT = '#f0d78c';
const INK = '#0a0a0a';
const PARCHMENT = '#efe7d4';
const BORDER = 'rgba(201,168,76,.18)';
const GOLD_GRAD = 'linear-gradient(135deg, #f0d78c 0%, #c9a84c 55%, #8b6f24 100%)';

export function MobileBottomNav() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 lg:hidden">
        <div className="flex items-center justify-between h-14 px-4"
          style={{ background: 'rgba(10,10,10,.85)', backdropFilter: 'blur(14px)', borderBottom: `1px solid ${BORDER}` }}>
          <button onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center w-9 h-9 rounded-lg"
            style={{ border: `1px solid ${BORDER}`, background: '#141414' }}>
            <Menu className="w-4 h-4" style={{ color: GOLD }} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center font-black text-[12px]"
              style={{ background: GOLD_GRAD, color: INK }}>M</div>
            <span className="text-[16px] tracking-tight" style={{ color: PARCHMENT, fontFamily: "'Instrument Serif', serif" }}>
              Multy<em style={{ color: GOLD_SOFT }}>SMM</em>
            </span>
          </div>
          <div className="w-9" />
        </div>
      </header>

      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-[280px] lg:hidden shadow-2xl">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}
    </>
  );
}
