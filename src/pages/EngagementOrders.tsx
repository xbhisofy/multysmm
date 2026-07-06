import { useState, useMemo, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Virtuoso } from "react-virtuoso";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { format, formatDistanceToNow } from "date-fns";
import {
  Loader2,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  RefreshCw,
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  ChevronRight,
  Zap,
  Timer,
  Search,
  X,
  BarChart3
} from "lucide-react";

const ENGAGEMENT_ICONS = {
  views: Eye,
  likes: Heart,
  comments: MessageCircle,
  saves: Bookmark,
  shares: Share2,
};

const STATUS_CONFIG = {
  pending: { color: "bg-secondary text-foreground border border-border", icon: Clock },
  processing: { color: "bg-foreground text-background", icon: Play },
  completed: { color: "bg-secondary text-foreground border border-border", icon: CheckCircle2 },
  partial: { color: "bg-secondary text-foreground border border-border", icon: RefreshCw },
  failed: { color: "bg-secondary text-foreground border border-border", icon: XCircle },
  started: { color: "bg-foreground text-background", icon: Play },
};

const PAGE_SIZE = 25;

export default function EngagementOrders() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Paginated + virtualized list. Loads PAGE_SIZE orders per page via the
  // aggregate RPC; Virtuoso only renders the visible cards, so the DOM stays
  // small even with 100k+ orders in the account.
  const {
    data,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
  } = useInfiniteQuery({
    queryKey: ['engagement-orders-paged', user?.id],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!user) return [] as any[];
      const { data, error } = await supabase.rpc(
        'get_user_engagement_orders_summary',
        { p_limit: PAGE_SIZE, p_offset: (pageParam as number) * PAGE_SIZE } as any
      );
      if (error) throw error;
      return (data ?? []) as any[];
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length,
    enabled: !!user,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchInterval: 60_000,
  });

  const orders = useMemo(
    () => (data?.pages ?? []).flat(),
    [data]
  );

  // Search filters currently loaded pages only (avoids full-table scans for 100k orders).
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const query = searchQuery.toLowerCase().trim();
    return orders.filter((order: any) =>
      order.order_number?.toString().includes(query) ||
      order.link?.toLowerCase().includes(query)
    );
  }, [orders, searchQuery]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !searchQuery.trim()) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, searchQuery, fetchNextPage]);

  if (!user && !authLoading) {
    navigate('/auth');
    return null;
  }
  if (!user) {
    navigate('/auth');
    return null;
  }

  const showEmpty = !isFetching && orders.length === 0;
  const showNoSearchMatch = orders.length > 0 && filteredOrders.length === 0 && !!searchQuery.trim();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6 text-primary" /> Engagement Orders</h1>
            <p className="text-muted-foreground">Track your full engagement deliveries in real-time</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => navigate('/engagement-order')}>
              + New Order
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search loaded orders by number or video link..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {searchQuery && (
          <p className="text-sm text-muted-foreground">
            {filteredOrders.length} match{filteredOrders.length !== 1 ? 'es' : ''} in {orders.length} loaded order{orders.length !== 1 ? 's' : ''}
            {hasNextPage && ' — scroll down or clear search to load more.'}
          </p>
        )}

        {/* Orders list */}
        {showEmpty ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No engagement orders yet</p>
            <Button onClick={() => navigate('/engagement-order')}>
              Place Your First Order
            </Button>
          </Card>
        ) : showNoSearchMatch ? (
          <Card className="p-12 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-2">No loaded orders match "{searchQuery}"</p>
            <p className="text-sm text-muted-foreground mb-4">Clear search to keep loading older orders</p>
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              Clear Search
            </Button>
          </Card>
        ) : (
          <Virtuoso
            useWindowScroll
            data={filteredOrders}
            endReached={handleEndReached}
            increaseViewportBy={{ top: 400, bottom: 800 }}
            computeItemKey={(_, order: any) => order.id}
            itemContent={(_, order: any) => (
              <div className="pb-4">
                <OrderCard
                  order={order}
                  onClick={() => navigate(`/engagement-orders/${order.order_number}`)}
                  onRepeat={() => navigate('/engagement-order', { state: { repeatFrom: order.order_number } })}
                />
              </div>
            )}
            components={{
              Footer: () => (
                <div className="py-4 flex justify-center">
                  {isFetchingNextPage ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : hasNextPage && !searchQuery.trim() ? (
                    <Button variant="outline" size="sm" onClick={() => fetchNextPage()}>
                      Load more
                    </Button>
                  ) : orders.length > 0 ? (
                    <p className="text-xs text-muted-foreground">No more orders</p>
                  ) : null}
                </div>
              ),
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

function OrderCard({ order, onClick, onRepeat }: { order: any; onClick: () => void; onRepeat: () => void }) {
  const { formatPrice } = useCurrency();
  const [isRepeating, setIsRepeating] = useState(false);
  const handleRepeat = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRepeating(true);
    onRepeat();
  };
  // Progress uses pre-aggregated fields from the RPC (no per-run scan client-side).
  const items = order.items || [];
  const completedRuns = items.reduce((s: number, i: any) => s + (i.completed_runs || 0), 0);
  const totalRuns = items.reduce((s: number, i: any) => s + (i.total_runs || 0), 0);
  const activeRuns = items.reduce((s: number, i: any) => s + (i.started_runs || 0), 0);
  const pendingRunsCount = items.reduce((s: number, i: any) => s + (i.pending_runs || 0), 0);
  const totalDelivered = items.reduce((s: number, i: any) => s + (i.delivered_qty || 0), 0);
  const totalQuantity = items.reduce((s: number, i: any) => s + (i.quantity || 0), 0);

  const progressPercent = totalQuantity > 0
    ? Math.min(100, (totalDelivered / totalQuantity) * 100)
    : totalRuns > 0 ? (completedRuns / totalRuns) * 100 : 0;

  const nextRunAt = order.next_run_at ? new Date(order.next_run_at) : null;

  // Derive effective status from aggregates.
  let effectiveStatus = order.status as string;
  if (totalQuantity > 0 && totalDelivered >= totalQuantity) {
    effectiveStatus = 'completed';
  } else if (effectiveStatus !== 'cancelled' && effectiveStatus !== 'failed' && effectiveStatus !== 'paused') {
    if (activeRuns > 0 || pendingRunsCount > 0 || totalDelivered > 0) {
      effectiveStatus = 'processing';
    }
  }
  const StatusIcon = STATUS_CONFIG[effectiveStatus as keyof typeof STATUS_CONFIG]?.icon || Clock;
  const statusColor = STATUS_CONFIG[effectiveStatus as keyof typeof STATUS_CONFIG]?.color || "";


  return (
    <Card 
      className="glass-card overflow-hidden cursor-pointer hover:border-muted-foreground/50 transition-all"
      onClick={onClick}
    >
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <CardTitle className="text-lg text-foreground">Order #{order.order_number}</CardTitle>
              <Badge className={statusColor}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {effectiveStatus}
              </Badge>
              {order.is_organic_mode && (
                <Badge variant="outline" className="border-border text-muted-foreground">
                  🌱 Organic
                </Badge>
              )}
            </div>
            <a 
              href={order.link} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              {order.link.length > 50 ? order.link.slice(0, 50) + '...' : order.link}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="text-right flex items-center gap-2 shrink-0">
            <div>
              <p className="font-semibold text-foreground whitespace-nowrap">{formatPrice(order.total_price || 0)}</p>
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Real-time Stats */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-3 bg-secondary rounded-xl border border-border">
            <Zap className="h-4 w-4 mx-auto mb-1 text-foreground" />
            <p className="text-sm font-bold text-foreground">{totalDelivered.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Delivered</p>
          </div>
          <div className="p-3 bg-secondary rounded-xl border border-border">
            <CheckCircle2 className="h-4 w-4 mx-auto mb-1 text-foreground" />
            <p className="text-sm font-bold text-foreground">{completedRuns}</p>
            <p className="text-[10px] text-muted-foreground">Complete</p>
          </div>
          <div className="p-3 bg-secondary rounded-xl border border-border">
            <Clock className="h-4 w-4 mx-auto mb-1 text-foreground" />
            <p className="text-sm font-bold text-foreground">{pendingRunsCount}</p>
            <p className="text-[10px] text-muted-foreground">Pending</p>
          </div>
          <div className="p-3 bg-secondary rounded-xl border border-border">
            <Play className="h-4 w-4 mx-auto mb-1 text-foreground" />
            <p className="text-sm font-bold text-foreground">{activeRuns}</p>
            <p className="text-[10px] text-muted-foreground">Active</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{completedRuns} / {totalRuns} runs</span>
            <span>{totalDelivered.toLocaleString()} / {totalQuantity.toLocaleString()}</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Next Run Timer */}
        {nextRunAt && (
          <div className="flex items-center gap-2 p-3 bg-secondary rounded-xl border border-border text-sm">
            <Timer className="h-4 w-4 text-foreground" />
            <span className="text-muted-foreground">Next run:</span>
            <strong className="text-foreground">{format(nextRunAt, 'HH:mm')}</strong>
            <span className="text-muted-foreground">
              ({formatDistanceToNow(nextRunAt, { addSuffix: true })})
            </span>
          </div>
        )}

        {/* Engagement Items */}
        <div className="flex flex-wrap gap-2">
          {items.map((item: any) => {
            const Icon = ENGAGEMENT_ICONS[item.engagement_type as keyof typeof ENGAGEMENT_ICONS] || Eye;
            const itemCompleted = item.completed_runs || 0;
            const itemTotal = item.total_runs || 0;
            const itemDelivered = item.delivered_qty || 0;

            return (
              <Badge
                key={item.id}
                variant="secondary"
                className="flex items-center gap-1.5 py-1.5 px-3"
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="capitalize">{item.engagement_type}:</span>
                <span className="font-mono">{itemDelivered.toLocaleString()}/{item.quantity.toLocaleString()}</span>
                <span className="text-muted-foreground">({itemCompleted}/{itemTotal})</span>
              </Badge>
            );
          })}
        </div>

        {/* Repeat Order Action */}
        <div className="pt-2 border-t border-border flex justify-end">
          <Button
            size="sm"
            onClick={handleRepeat}
            disabled={isRepeating}
            className="w-full sm:w-auto rounded-full h-9 px-4 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            {isRepeating ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Loading...</>
            ) : (
              <><RefreshCw className="h-4 w-4" />Repeat Order</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}