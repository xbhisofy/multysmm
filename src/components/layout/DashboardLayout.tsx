import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { PopupAdDialog } from '@/components/PopupAdDialog';
import '@/styles/member-experience.css';

interface DashboardLayoutProps { children: ReactNode; }

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) navigate('/auth');
  }, [user, isLoading, navigate]);

  return (
    <div className="member-shell">
      <aside className="fixed inset-y-0 left-0 z-40 w-[260px] hidden lg:block">
        <Sidebar />
      </aside>
      <MobileBottomNav />
      <main className="member-content lg:pl-[260px] w-full overflow-x-hidden">
       <div className="min-h-screen pt-16 lg:pt-0 px-3 sm:px-4 py-4 sm:py-5 lg:p-8">
          <div className="member-page max-w-7xl mx-auto w-full">{children}</div>
        </div>
      </main>
      <PopupAdDialog />
    </div>
  );
}
