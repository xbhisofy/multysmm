import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';

const GRADIENT = 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)';

export function MobileBottomNav() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 lg:hidden">
        <div className="flex items-center justify-between h-14 px-4"
          style={{ background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(14px)', borderBottom: '1px solid #efeaf7' }}>
          <button onClick={() => setSidebarOpen(true)} aria-label="Open navigation menu" className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ border: '1px solid #efeaf7' }}>
            <Menu className="w-4 h-4" style={{ color: '#6D28D9' }} />
          </button>
          <div className="flex items-center">
            <img src="/__l5e/assets-v1/629907e8-d337-4ae6-907a-d50fec419bdb/organicsmm-logo.jpg" alt="MultySMM" className="h-8 w-auto object-contain" />
          </div>
          <div className="w-9" />
        </div>
      </header>

      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-[280px] lg:hidden shadow-xl">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}
    </>
  );
}
