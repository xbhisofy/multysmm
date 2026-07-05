import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AnalyticsPanel } from '@/components/admin/AnalyticsPanel';
import { BarChart3, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminAnalytics() {
  return (
    <DashboardLayout>
      <div className="space-y-6 px-2 sm:px-4 lg:px-6 pb-8">
        <div className="relative overflow-hidden glass-card p-6 sm:p-8 bg-gradient-to-br from-primary/10 via-transparent to-accent/10">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-xl shadow-primary/20">
                <BarChart3 className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Advanced Analytics</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Time-based financial, order, user & platform insights
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              Live
            </Badge>
          </div>
          <div className="absolute top-0 right-0 w-60 h-60 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-3xl" />
        </div>

        <AnalyticsPanel />
      </div>
    </DashboardLayout>
  );
}
