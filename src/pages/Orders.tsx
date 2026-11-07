import { Fragment, useState, useEffect, useRef } from 'react';
import { PlatformIcon } from '@/components/PlatformIcon';
import { servicePlatform } from '../../supabase/functions/_shared/single-order-policy';
import { Link } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery, useMutation } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Search, 
  ChevronDown,
  ChevronUp,
  Leaf,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Timer,
  Zap,
  Calendar,
  Activity,
  Play,
  History,
  Pencil, Copy, ListFilter, CircleDollarSign, CircleDashed, ShoppingCart
} from 'lucide-react';
import type { Order, OrganicRun } from '@/lib/supabase';
import { EditRunDialog } from '@/components/engagement/EditRunDialog';
import { SingleOrderProgressChart } from '@/components/engagement/SingleOrderProgressChart';

const statusFilters = ['All', 'pending', 'processing', 'completed', 'partial', 'failed', 'cancelled'];

// Helper to extract engagement type from service category
const getServiceTypeLabel = (category: string | undefined): string => {
  if (!category) return 'items';
  const lower = category.toLowerCase();
  
  // Extract the engagement type from category like "Instagram Comments", "YouTube Views", etc.
  if (lower.includes('comment')) return 'comments';
  if (lower.includes('like')) return 'likes';
  if (lower.includes('view')) return 'views';
  if (lower.includes('save')) return 'saves';
  if (lower.includes('share')) return 'shares';
  if (lower.includes('repost')) return 'reposts';
  if (lower.includes('follower')) return 'followers';
  if (lower.includes('subscriber')) return 'subscribers';
  if (lower.includes('watch')) return 'watch hours';
  if (lower.includes('retweet')) return 'retweets';
  
  // Try to get last word from category
  const words = category.split(' ');
  return words[words.length - 1]?.toLowerCase() || 'items';
};

// Edit run data type
interface EditRunData {
  id: string;
  quantity: number;
  scheduledAt: string;
  engagementType?: string;
  runNumber?: number;
}

export default function Orders() {
  const { user, wallet, refreshWallet } = useAuth();
  const { formatPrice } = useCurrency();
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingRun, setEditingRun] = useState<EditRunData | null>(null);
  const syncBusy = useRef(false);

  // Instant load with cache - no loading spinner
  const { data: orders, refetch, isLoading, error: ordersError } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, status, price, link, quantity, remains, start_count, provider_order_id, is_organic_mode, is_drip_feed, created_at, updated_at, error_message, service:services(*)')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(200);
      
      if (error) throw error;
      return data as unknown as (Order & { service: { name: string; category: string; service_number?: number } | null })[];
    },
    enabled: !!user?.id,
    staleTime: 10000, // Cache for 10s - instant subsequent loads
    refetchOnWindowFocus: false,
    refetchInterval: (query) => {
      // Auto-refresh every 10 seconds if there are processing/pending orders
      const data = query.state.data;
      if (data?.some(o => o.status === 'pending' || o.status === 'processing')) {
        return 10000;
      }
      return false;
    }
  });

  const { data: organicRuns, refetch: refetchRuns } = useQuery({
    queryKey: ['organic-runs', expandedOrder],
    queryFn: async () => {
      if (!expandedOrder) return [];
      const { data, error } = await supabase
        .from('organic_run_schedule')
        .select('*')
        .eq('order_id', expandedOrder)
        .order('run_number', { ascending: true });
      
      if (error) throw error;
      return data as OrganicRun[];
    },
    enabled: !!expandedOrder,
    staleTime: 5000, // Cache for 5s
    refetchOnWindowFocus: false,
    refetchInterval: (query) => {
      // Auto-refresh runs if any are pending/started
      const data = query.state.data;
      if (data?.some(r => r.status === 'pending' || r.status === 'started')) {
        return 5000;
      }
      return false;
    }
  });

  // Edit run mutation with wallet deduction for increased quantity
  const editRunMutation = useMutation({
    mutationFn: async ({ runId, quantity, scheduledAt }: { runId: string; quantity: number; scheduledAt: string }) => {
      // Server-side RPC: validates ownership, charges wallet atomically if qty increased,
      // then updates the run (bypassing the lock trigger securely).
      const { data, error } = await supabase.rpc('reschedule_organic_run', {
        p_run_id: runId,
        p_quantity: quantity,
        p_scheduled_at: scheduledAt,
      });
      if (error) throw error;
      return data as { success: boolean; extra_charged: number; new_balance: number };
    },
    onSuccess: (data: any) => {
      const extra = Number(data?.extra_charged || 0);
      toast.success(
        extra > 0
          ? `✅ Rescheduled! ${formatPrice(extra)} charged from wallet.`
          : '✅ Run rescheduled successfully!'
      );
      refetchRuns();
      refreshWallet?.();
      setEditingRun(null);
    },
    onError: (error: any) => {
      toast.error(`Failed to update: ${error.message}`);
    }
  });

  // Get price per 1000 for the expanded order
  const getOrderPricePerThousand = () => {
    if (!expandedOrder || !orders) return 0.1;
    const order = orders.find(o => o.id === expandedOrder);
    return order ? Number(order.price) / (order.quantity / 1000) : 0.1;
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-order-status', { body: { singleOrders: true, source: 'history-refresh' } });
      if (error || data?.unavailable) toast.warning('Some provider statuses could not be verified. Last confirmed status retained.');
      await refetch();
      if (expandedOrder) await refetchRuns();
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    const sync = async () => {
      if (syncBusy.current || document.visibilityState !== 'visible') return;
      syncBusy.current = true;
      try { await supabase.functions.invoke('check-order-status', { body: { singleOrders: true, source: 'history-auto' } }); await refetch(); } finally { syncBusy.current = false; }
    };
    void sync();
    const timer = setInterval(() => { void sync(); }, 30000);
    return () => clearInterval(timer);
  }, [user?.id, refetch]);

  const filteredOrders = orders?.filter(order => {
    const matchesSearch = 
      order.order_number.toString().includes(searchQuery) ||
      order.link.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.service?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success/20 text-success border-success/30';
      case 'processing': return 'bg-warning/20 text-warning border-warning/30';
      case 'pending': return 'bg-muted text-muted-foreground border-muted';
      case 'partial': return 'bg-primary/20 text-primary border-primary/30';
      case 'failed': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'cancelled': return 'bg-muted text-muted-foreground border-muted';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'processing': return <Loader2 className="h-4 w-4 text-warning animate-spin" />;
      case 'pending': return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'started': return <Loader2 className="h-4 w-4 text-warning animate-spin" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRunStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success';
      case 'started': return 'bg-warning animate-pulse';
      case 'pending': return 'bg-muted';
      case 'failed': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const target = new Date(date);
    const diffMs = target.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 0) {
      const pastMins = Math.abs(diffMins);
      if (pastMins < 60) return `${pastMins}m ago`;
      if (pastMins < 1440) return `${Math.round(pastMins / 60)}h ago`;
      return `${Math.round(pastMins / 1440)}d ago`;
    }
    
    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `in ${diffMins}m`;
    if (diffMins < 1440) return `in ${Math.round(diffMins / 60)}h`;
    return `in ${Math.round(diffMins / 1440)}d`;
  };

  const getTimeUntilNext = (runs: OrganicRun[]) => {
    const pendingRuns = runs.filter(r => r.status === 'pending');
    if (pendingRuns.length === 0) return null;
    
    const nextRun = pendingRuns[0];
    const now = new Date();
    const scheduledAt = new Date(nextRun.scheduled_at);
    const diffMs = scheduledAt.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Due now';
    
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m`;
    return `${Math.round(diffMins / 60)}h ${diffMins % 60}m`;
  };

  const getTotalDelivered = (runs: OrganicRun[]) => {
    return runs
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + r.quantity_to_send, 0);
  };

  const getOrderProgress = (order: Order & { service: { name: string; category: string; service_number?: number } | null }) => {
    if (!order.is_organic_mode) return null;
    
    // We'll calculate from organicRuns if this order is expanded
    if (expandedOrder === order.id && organicRuns) {
      const completed = organicRuns.filter(r => r.status === 'completed').length;
      const total = organicRuns.length;
      return { completed, total, percentage: (completed / total) * 100 };
    }
    
    return null;
  };

  const hasProcessingOrders = orders?.some(o => o.status === 'pending' || o.status === 'processing');

  return (
    <DashboardLayout>
      <div className="order-history-page space-y-6">
        <nav aria-label="Order pages" className="flex gap-2">
          <Button variant="outline" asChild><Link to="/single-order"><ShoppingCart />New Order</Link></Button>
          <Button asChild><Link to="/orders" aria-current="page"><History />Order History</Link></Button>
        </nav>
        <div className="flex items-center justify-between gap-4">
          <h1 className="history-title text-2xl font-extrabold sm:text-3xl">Order Status</h1>
          <Button variant="outline" size="icon" aria-label="Refresh orders" title="Refresh orders" onClick={handleManualRefresh} disabled={isRefreshing}><RefreshCw className={isRefreshing ? 'animate-spin' : ''} /></Button>
        </div>
        <div className="history-status-filters flex flex-wrap gap-2 sm:gap-3" aria-label="Order status">
          {['All', 'pending', 'completed', 'partial', 'processing', 'refunded', 'failed', 'cancelled'].map(status => {
            const Icon = status === 'All' ? ListFilter : status === 'completed' ? CheckCircle2 : status === 'processing' ? Loader2 : status === 'partial' ? CircleDashed : status === 'refunded' ? CircleDollarSign : status === 'failed' ? AlertCircle : Clock;
            return <Button key={status} variant="outline" aria-pressed={statusFilter === status} onClick={() => setStatusFilter(status)} className={`history-filter h-11 rounded-full px-4 text-sm sm:text-base ${statusFilter === status ? 'is-selected' : ''}`}><Icon />{status.charAt(0).toUpperCase() + status.slice(1)}</Button>;
          })}
        </div>
        <div className="relative"><Input aria-label="Search orders" placeholder="Search" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} className="history-search h-16 rounded-xl pl-5 pr-14 text-base" /><Search className="absolute right-5 top-5 h-6 w-6" /></div>
        {ordersError && <div role="alert" className="flex items-center gap-3 text-destructive">Could not load orders.<Button variant="outline" onClick={handleManualRefresh}>Retry</Button></div>}
        {isLoading && <div role="status" className="flex items-center justify-center gap-2 py-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Loading orders…</div>}

        {/* Orders List - Instant render */}
        {filteredOrders && filteredOrders.length > 0 ? (
          <div className="history-table-scroll overflow-x-auto" tabIndex={0} role="region" aria-label="Order history table">
            <table className="history-table w-full text-left text-sm"><thead><tr>
              <th><div className="flex items-center gap-2"><Checkbox aria-label="Select all visible orders" checked={filteredOrders.length > 0 && filteredOrders.every(order => selectedOrders.includes(order.id))} onCheckedChange={checked => setSelectedOrders(checked ? filteredOrders.map(order => order.id) : [])} />ID<Button size="sm" className="rounded-full" disabled={!selectedOrders.length} onClick={async () => { try { await navigator.clipboard.writeText(filteredOrders.filter(order => selectedOrders.includes(order.id)).map(order => order.order_number).join('\n')); toast.success('Order IDs copied'); } catch { toast.error('Could not copy order IDs'); } }}><Copy />Copy</Button></div></th>
              <th>Date</th><th>Link</th><th>Charge</th><th>Start count</th><th>Quantity</th><th>Service</th><th>Status</th><th>Remains</th><th>Actions</th>
            </tr></thead><tbody>
            {filteredOrders.map((order) => {
              const progress = expandedOrder === order.id ? getOrderProgress(order) : null;
              
              return (
                <Fragment key={order.id}>
                  <tr>
                    <td><div className="flex items-center gap-3"><Checkbox aria-label={`Select order ${order.order_number}`} checked={selectedOrders.includes(order.id)} onCheckedChange={checked => setSelectedOrders(previous => checked ? [...previous, order.id] : previous.filter(id => id !== order.id))} /><Button variant="secondary" className="history-order-id h-9 rounded-full px-3" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)} aria-expanded={expandedOrder === order.id}>{order.order_number}</Button></div></td>
                    <td className="whitespace-nowrap">{new Date(order.created_at).toLocaleString('sv-SE')}</td>
                    <td><a className="block max-w-52 truncate font-medium text-primary" title={order.link} href={/^https?:\/\//i.test(order.link) ? order.link : undefined} target="_blank" rel="noopener noreferrer">{order.link}</a></td>
                    <td className="whitespace-nowrap font-semibold">{formatPrice(Number(order.price))}</td>
                    <td>{order.start_count ?? '—'}</td><td>{order.quantity.toLocaleString()}</td>
                    <td><span className="flex max-w-72 items-center gap-3" title={order.service?.name}><PlatformIcon platform={servicePlatform(order.service?.category || '', order.service?.name || '')} /><span className="min-w-0 truncate"><span className="font-bold text-primary">{order.service?.service_number ? `s${order.service.service_number} - ` : ''}</span>{order.service?.name || 'Unavailable service'}</span></span></td>
                    <td><span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 capitalize ${getStatusColor(order.status)}`}>{getStatusIcon(order.status)}{order.status}</span></td>
                    <td>{order.remains ?? '—'}</td>
                    <td><Button variant="outline" size="sm" className="rounded-full" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)} aria-expanded={expandedOrder === order.id}>Details</Button></td>
                  </tr>
                  {expandedOrder === order.id && !order.is_organic_mode && <tr className="history-detail"><td colSpan={10}><div className="space-y-3 p-4"><p className="font-bold">{order.service?.name || 'Unavailable service'}</p><p className="break-all">{order.link}</p>{order.error_message && <p role="alert" className="text-destructive">{order.error_message}</p>}<p className="text-muted-foreground">Order #{order.order_number} · {order.status} · {order.quantity.toLocaleString()} quantity</p></div></td></tr>}
                  {/* Organic Runs (Expanded) - ENHANCED REAL-TIME VIEW */}
                  {expandedOrder === order.id && order.is_organic_mode && (
                    <tr className="history-detail"><td colSpan={10}><div className="border-t border-border">
                      {/* Header with Live Status */}
                      <div className="p-4 bg-gradient-to-r from-success/10 to-transparent border-b border-border flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                        <h4 className="text-sm font-bold flex items-center gap-2">
                          <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                          <Activity className="h-4 w-4 text-success" />
                          LIVE DELIVERY TRACKING
                        </h4>
                        <div className="flex items-center gap-4 flex-wrap">
                          {organicRuns?.some(r => r.status === 'pending' || r.status === 'started') && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin text-warning" />
                                Auto-updating
                              </span>
                              {organicRuns && getTimeUntilNext(organicRuns) && (
                                <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full flex items-center gap-1">
                                  <Timer className="h-3 w-3" />
                                  Next: {getTimeUntilNext(organicRuns)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {organicRuns && organicRuns.length > 0 ? (
                        <>
                          {/* Quick Stats Bar */}
                          <div className="grid grid-cols-5 gap-1 p-3 bg-secondary/30 border-b border-border">
                            <div className="text-center p-2">
                              <p className="text-xl font-bold text-foreground">{organicRuns.length}</p>
                              <p className="text-[10px] text-muted-foreground uppercase">Total Runs</p>
                            </div>
                            <div className="text-center p-2">
                              <p className="text-xl font-bold text-success">
                                {organicRuns.filter(r => r.status === 'completed').length}
                              </p>
                              <p className="text-[10px] text-muted-foreground uppercase">Completed</p>
                            </div>
                            <div className="text-center p-2">
                              <p className="text-xl font-bold text-warning">
                                {organicRuns.filter(r => r.status === 'started').length}
                              </p>
                              <p className="text-[10px] text-muted-foreground uppercase">In Progress</p>
                            </div>
                            <div className="text-center p-2">
                              <p className="text-xl font-bold text-muted-foreground">
                                {organicRuns.filter(r => r.status === 'pending').length}
                              </p>
                              <p className="text-[10px] text-muted-foreground uppercase">Pending</p>
                            </div>
                            <div className="text-center p-2">
                              <p className="text-xl font-bold text-success">
                                {getTotalDelivered(organicRuns).toLocaleString()}
                              </p>
                              <p className="text-[10px] text-muted-foreground uppercase">Delivered</p>
                            </div>
                          </div>

                          {/* Real-time Delivery Progress Chart */}
                          <div className="p-4 border-b border-border">
                            <SingleOrderProgressChart 
                              runs={organicRuns}
                              serviceName={order.service?.name || 'Items'}
                              serviceCategory={order.service?.category}
                              totalQuantity={order.quantity}
                            />
                          </div>

                          {/* Runs Timeline with Cumulative Count */}
                          <div className="p-4 max-h-[500px] overflow-y-auto space-y-2">
                            {organicRuns.map((run, idx) => {
                              const isActive = run.status === 'started';
                              const isCompleted = run.status === 'completed';
                              const isPending = run.status === 'pending';
                              const isFailed = run.status === 'failed';
                              
                              // Calculate cumulative delivered up to this run
                              const cumulativeDelivered = organicRuns
                                .slice(0, idx + 1)
                                .filter(r => r.status === 'completed')
                                .reduce((sum, r) => sum + r.quantity_to_send, 0);
                              
                              // Calculate cumulative scheduled up to this run (exclude failed)
                              const cumulativeScheduled = organicRuns
                                .slice(0, idx + 1)
                                .filter(r => r.status !== 'failed')
                                .reduce((sum, r) => sum + r.quantity_to_send, 0);
                              
                              return (
                                <div 
                                  key={run.id}
                                  className={`relative rounded-lg transition-all ${
                                    isActive 
                                      ? 'bg-primary/10 border-2 border-primary/50 shadow-md shadow-primary/20' 
                                      : isCompleted
                                        ? 'bg-primary/10 border border-primary/30'
                                        : isFailed
                                          ? 'bg-primary/10 border border-primary/30'
                                          : 'bg-primary/5 border border-primary/20'
                                  }`}
                                >
                                  <div className="p-3">
                                    {/* Main Row */}
                                    <div className="flex items-center gap-3">
                                      {/* Run Number Badge - Colorful */}
                                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-mono text-sm font-bold ${
                                        isActive 
                                          ? 'bg-gradient-to-br from-primary to-primary text-primary-foreground animate-pulse' 
                                          : isCompleted
                                            ? 'bg-gradient-to-br from-primary to-primary text-primary-foreground'
                                            : isFailed
                                              ? 'bg-gradient-to-br from-primary to-destructive text-primary-foreground'
                                              : 'bg-gradient-to-br from-primary to-primary text-primary-foreground'
                                      }`}>
                                        #{run.run_number}
                                      </div>

                                      {/* Time Info */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          {/* Status Icon + Label - Colorful */}
                                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                                            isActive 
                                              ? 'bg-primary/20 text-primary border border-primary/30' 
                                              : isCompleted
                                                ? 'bg-primary/20 text-primary border border-primary/30'
                                                : isFailed
                                                  ? 'bg-primary/20 text-primary border border-primary/30'
                                                  : 'bg-primary/20 text-primary border border-primary/30'
                                          }`}>
                                            {isActive && <Loader2 className="h-3 w-3 animate-spin" />}
                                            {isCompleted && <CheckCircle2 className="h-3 w-3" />}
                                            {isPending && <Clock className="h-3 w-3" />}
                                            {isFailed && <AlertCircle className="h-3 w-3" />}
                                            {run.status.toUpperCase()}
                                          </span>
                                          
                                          {/* Quantity - Cyan accent - Use service category for label */}
                                          <span className="text-sm font-bold text-primary">
                                            +{run.quantity_to_send} {getServiceTypeLabel(order.service?.category)}
                                          </span>
                                          
                                          {/* CUMULATIVE COUNT - Teal badge */}
                                          {(isCompleted || cumulativeDelivered > 0) && (
                                            <span className="inline-flex items-center gap-1 text-xs bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-lg">
                                              = {cumulativeDelivered.toLocaleString()} total
                                            </span>
                                          )}
                                          
                                          {/* Show scheduled total for pending - Purple */}
                                          {isPending && cumulativeDelivered === 0 && (
                                            <span className="inline-flex items-center gap-1 text-xs bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-lg">
                                              → {cumulativeScheduled.toLocaleString()} scheduled
                                            </span>
                                          )}
                                          
                                          {/* Peak indicator - Orange/Amber */}
                                          {Number(run.peak_multiplier) > 1 && (
                                            <span className="inline-flex items-center gap-1 text-[10px] text-primary bg-primary/20 border border-primary/30 px-1.5 py-0.5 rounded">
                                              <Zap className="h-3 w-3" />
                                              {run.peak_multiplier}x Peak
                                            </span>
                                          )}
                                          
                                          {/* Variance - Blue for positive, Pink for negative */}
                                          <span className={`text-[10px] font-medium ${Number(run.variance_applied) >= 0 ? 'text-primary' : 'text-primary'}`}>
                                            ({Number(run.variance_applied) >= 0 ? '+' : ''}{run.variance_applied})
                                          </span>
                                        </div>
                                        
                                        {/* Timestamps Row */}
                                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                                          {/* Scheduled */}
                                          <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            Scheduled: {formatDate(run.scheduled_at)}
                                            <span className="text-primary font-medium">
                                              ({formatRelativeTime(run.scheduled_at)})
                                            </span>
                                          </span>
                                          
                                          {/* Started */}
                                          {run.started_at && (
                                            <span className="flex items-center gap-1">
                                              <Play className="h-3 w-3 text-warning" />
                                              Started: {formatTime(run.started_at)}
                                            </span>
                                          )}
                                          
                                          {/* Completed */}
                                          {run.completed_at && (
                                            <span className="flex items-center gap-1">
                                              <CheckCircle2 className="h-3 w-3 text-success" />
                                              Done: {formatTime(run.completed_at)}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Provider Order ID or Edit Button */}
                                      {run.provider_order_id ? (
                                        <div className="text-right shrink-0">
                                          <p className="text-[10px] text-muted-foreground uppercase">Provider ID</p>
                                          <p className="text-xs font-mono text-primary">{run.provider_order_id}</p>
                                        </div>
                                      ) : isPending && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 px-3 text-primary hover:bg-primary/20"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingRun({
                                              id: run.id,
                                              quantity: run.quantity_to_send,
                                              scheduledAt: run.scheduled_at,
                                              engagementType: order.service?.name || 'Views',
                                              runNumber: run.run_number,
                                            });
                                          }}
                                        >
                                          <Pencil className="h-4 w-4 mr-1.5" />
                                          Edit / Reschedule
                                        </Button>
                                      )}
                                    </div>

                                    {/* Error Message */}
                                    {run.error_message && (
                                      <div className="mt-2 p-2 rounded bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2">
                                        <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                                        {run.error_message}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Overall Progress Footer */}
                          <div className="p-4 border-t border-border bg-gradient-to-r from-background/80 to-background/40">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium flex items-center gap-2">
                                <History className="h-4 w-4 text-primary" />
                                Overall Progress
                              </span>
                              <span className="text-sm">
                                <span className="text-success font-bold">
                                  {getTotalDelivered(organicRuns).toLocaleString()}
                                </span>
                                <span className="text-muted-foreground"> / {order.quantity.toLocaleString()} {getServiceTypeLabel(order.service?.category)}</span>
                              </span>
                            </div>
                            <Progress 
                              value={(organicRuns.filter(r => r.status === 'completed').length / organicRuns.length) * 100} 
                              className="h-3"
                            />
                            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                              <span>
                                {organicRuns.filter(r => r.status === 'completed').length}/{organicRuns.length} runs complete
                              </span>
                              <span className="flex items-center gap-1 text-success">
                                <Activity className="h-3 w-3" />
                                {Math.round((organicRuns.filter(r => r.status === 'completed').length / organicRuns.length) * 100)}% done
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading delivery schedule...
                        </div>
                      )}
                    </div></td></tr>
                  )}
                </Fragment>
              );
            })}
            </tbody></table>
          </div>
        ) : !isLoading && !ordersError ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No orders found</p>
            <Button variant="gradient" asChild>
              <Link to="/single-order">New Order</Link>
            </Button>
          </div>
        ) : null}

        {/* Edit Run Dialog */}
        <EditRunDialog
          open={!!editingRun}
          onOpenChange={(open) => !open && setEditingRun(null)}
          run={editingRun}
          onSave={({ runId, quantity, scheduledAt }) => {
            editRunMutation.mutate({ runId, quantity, scheduledAt });
          }}
          isSaving={editRunMutation.isPending}
          walletBalance={wallet?.balance || 0}
          pricePerThousand={getOrderPricePerThousand()}
        />
      </div>
    </DashboardLayout>
  );
}
