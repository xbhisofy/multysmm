import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Users,
  Search,
  Loader2,
  ArrowLeft,
  Wallet,
  Shield,
  Mail,
  Calendar,
  Crown,
  Zap,
  XCircle,
  UserX,
  Clock,
  Pause,
  Play,
  ShoppingCart,
  Ban,
  ShieldOff,
  AlertTriangle,
  Download,
  ArrowDownCircle,
  LogIn,
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { UserFiltersSheet } from '@/components/admin/UserFiltersSheet';
import { UserSortSelect } from '@/components/admin/UserSortSelect';
import {
  DEFAULT_FILTERS, applyFilters, applySort, rowsToCsv, downloadCsv, indicatorFor,
  type AdminFilters, type SortKey, type Row,
} from '@/lib/admin-users-filters';

interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'none' | 'monthly' | 'lifetime';
  status: 'inactive' | 'active' | 'expired' | 'cancelled';
  activated_at: string | null;
  expires_at: string | null;
}

interface OrderCounts {
  singleActive: number;
  singlePaused: number;
  engagementActive: number;
  engagementPaused: number;
}

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  telegram_username?: string | null;
  currency: string;
  created_at: string;
  updated_at?: string | null;
  is_banned?: boolean;
  banned_reason?: string | null;
  wallet?: {
    balance: number;
    total_deposited: number;
    total_spent: number;
  };
  role?: string;
  subscription?: Subscription;
  orderCounts?: OrderCounts;
  // extended
  balance: number;
  total_deposited: number;
  total_spent: number;
  last_deposit_at?: string | null;
  deposit_count?: number;
  total_orders_count?: number;
  single_orders_count?: number;
  engagement_orders_count?: number;
  last_active_at?: string | null;
  last_sign_in_at?: string | null;
}

type UserTab = 'all' | 'normal' | 'monthly' | 'lifetime';

const INR_RATE = 83.5;

export default function AdminUsers() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<UserTab>('all');
  const [sortKey, setSortKey] = useState<SortKey>('last_fund');
  const [filters, setFilters] = useState<AdminFilters>(DEFAULT_FILTERS);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceAction, setBalanceAction] = useState<'subtract' | 'add'>('add');
  // Only these admins can manually add funds. Everyone else: subtract only.
  const SUPER_ADMIN_USER_IDS = new Set<string>([
    'd84c0832-ba73-42be-ad4c-5e4c5a17c157', // multysmm@gmail.com
  ]);
  const isSuperAdmin = !!user?.id && SUPER_ADMIN_USER_IDS.has(user.id);
  const [removeSubUser, setRemoveSubUser] = useState<UserProfile | null>(null);
  const [pauseUser, setPauseUser] = useState<UserProfile | null>(null);
  const [cancelUser, setCancelUser] = useState<UserProfile | null>(null);
  const [refundOnCancel, setRefundOnCancel] = useState(false);
  const [banUser, setBanUser] = useState<UserProfile | null>(null);
  const [banReason, setBanReason] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-all-users-with-subs'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_users_summary' as any);
      if (error) throw error;

      return ((data as any) || []).map((u: any) => ({
        ...u,
        wallet: {
          balance: u.balance,
          total_deposited: u.total_deposited,
          total_spent: u.total_spent
        },
        subscription: u.subscription_plan !== 'none' ? {
          plan_type: u.subscription_plan,
          status: u.subscription_status,
          expires_at: u.subscription_expires
        } : null,
        orderCounts: {
          singleActive: u.active_single_orders,
          singlePaused: u.paused_single_orders,
          engagementActive: u.active_engagement_orders,
          engagementPaused: u.paused_engagement_orders,
        }
      })) as UserProfile[];
    },
  });

  const updateBalanceMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser || !balanceAmount) return;
      const inrAmount = parseFloat(balanceAmount);
      if (!inrAmount || inrAmount <= 0) throw new Error('Enter a valid INR amount');
      const currentBalanceInr = (selectedUser.wallet?.balance || 0) * INR_RATE;
      if (balanceAction === 'subtract' && inrAmount > currentBalanceInr + 0.01) {
        throw new Error(`Cannot subtract more than current balance ₹${currentBalanceInr.toFixed(2)}`);
      }

      // All admin wallet changes go through the audited edge function.
      // Direct client-side wallet/transaction writes are blocked at the RLS layer.
      const { data, error } = await supabase.functions.invoke('admin-wallet-action', {
        body: {
          target_user_id: selectedUser.user_id,
          action: balanceAction, // 'add' | 'subtract'
          inr_amount: inrAmount,
        },
      });
      if (error) {
        let message = error.message || 'Action failed';
        const response = (error as any)?.context;
        if (response?.json) {
          try {
            const body = await response.json();
            message = body?.error || message;
          } catch {
            // Keep the default message if response parsing fails.
          }
        }
        throw new Error(message);
      }
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      toast.success('Balance updated successfully!');
      setSelectedUser(null);
      setBalanceAmount('');
      queryClient.invalidateQueries({ queryKey: ['admin-all-users-with-subs'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const toggleAdminMutation = useMutation({
    mutationFn: async (targetUser: UserProfile) => {
      const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', targetUser.user_id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('User role updated!');
      queryClient.invalidateQueries({ queryKey: ['admin-all-users-with-subs'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const removeSubscriptionMutation = useMutation({
    mutationFn: async (targetUser: UserProfile) => {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          plan_type: 'none',
          status: 'cancelled',
          expires_at: null,
        })
        .eq('user_id', targetUser.user_id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Subscription removed!');
      setRemoveSubUser(null);
      queryClient.invalidateQueries({ queryKey: ['admin-all-users-with-subs'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Pause all orders mutation
  const pauseAllOrdersMutation = useMutation({
    mutationFn: async (targetUser: UserProfile) => {
      // 1. Update single orders to paused
      const { error: singleError } = await supabase
        .from('orders')
        .update({ status: 'paused' })
        .eq('user_id', targetUser.user_id)
        .in('status', ['pending', 'processing']);

      if (singleError) throw singleError;

      // 2. Update engagement orders to paused
      const { error: engagementError } = await supabase
        .from('engagement_orders')
        .update({ status: 'paused' })
        .eq('user_id', targetUser.user_id)
        .in('status', ['pending', 'processing']);

      if (engagementError) throw engagementError;
    },
    onSuccess: () => {
      toast.success('All orders paused!');
      setPauseUser(null);
      queryClient.invalidateQueries({ queryKey: ['admin-all-users-with-subs'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Resume all orders mutation
  const resumeAllOrdersMutation = useMutation({
    mutationFn: async (targetUser: UserProfile) => {
      const now = new Date().toISOString();

      // 1. Get all paused engagement orders for this user
      const { data: pausedEngOrders } = await supabase
        .from('engagement_orders')
        .select('id')
        .eq('user_id', targetUser.user_id)
        .eq('status', 'paused');

      // 2. Get all paused single orders for this user
      const { data: pausedSingleOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', targetUser.user_id)
        .eq('status', 'paused');

      // 3. Cancel overdue pending runs for engagement orders (scheduled during pause)
      if (pausedEngOrders && pausedEngOrders.length > 0) {
        // Get engagement order item IDs
        const { data: items } = await supabase
          .from('engagement_order_items')
          .select('id')
          .in('engagement_order_id', pausedEngOrders.map(o => o.id));

        if (items && items.length > 0) {
          const { error: cancelError } = await supabase
            .from('organic_run_schedule')
            .update({
              status: 'cancelled',
              error_message: 'Skipped — order was paused during this scheduled time',
              completed_at: now,
            })
            .in('engagement_order_item_id', items.map(i => i.id))
            .eq('status', 'pending')
            .lt('scheduled_at', now);

          if (cancelError) console.error('Cancel overdue engagement runs error:', cancelError);
        }
      }

      // 4. Cancel overdue pending runs for single orders (scheduled during pause)
      if (pausedSingleOrders && pausedSingleOrders.length > 0) {
        const { error: cancelSingleError } = await supabase
          .from('organic_run_schedule')
          .update({
            status: 'cancelled',
            error_message: 'Skipped — order was paused during this scheduled time',
            completed_at: now,
          })
          .in('order_id', pausedSingleOrders.map(o => o.id))
          .eq('status', 'pending')
          .lt('scheduled_at', now);

        if (cancelSingleError) console.error('Cancel overdue single runs error:', cancelSingleError);
      }

      // 5. Resume single orders
      const { error: singleError } = await supabase
        .from('orders')
        .update({ status: 'processing' })
        .eq('user_id', targetUser.user_id)
        .eq('status', 'paused');

      if (singleError) throw singleError;

      // 6. Resume engagement orders
      const { error: engagementError } = await supabase
        .from('engagement_orders')
        .update({ status: 'processing' })
        .eq('user_id', targetUser.user_id)
        .eq('status', 'paused');

      if (engagementError) throw engagementError;
    },
    onSuccess: () => {
      toast.success('All orders resumed! Overdue runs during pause were cancelled.');
      queryClient.invalidateQueries({ queryKey: ['admin-all-users-with-subs'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Cancel all orders mutation
  const cancelAllOrdersMutation = useMutation({
    mutationFn: async ({ targetUser, refund }: { targetUser: UserProfile; refund: boolean }) => {
      // 1. Get all single orders for this user
      const { data: singleOrders } = await supabase
        .from('orders')
        .select('id, price')
        .eq('user_id', targetUser.user_id)
        .not('status', 'in', '("completed","cancelled","failed")');

      // 2. Get all engagement orders for this user
      const { data: engagementOrders } = await supabase
        .from('engagement_orders')
        .select('id, total_price')
        .eq('user_id', targetUser.user_id)
        .not('status', 'in', '("completed","cancelled","failed")');

      // 3. Cancel all pending runs for single orders
      for (const order of singleOrders || []) {
        await supabase
          .from('organic_run_schedule')
          .update({ status: 'cancelled' })
          .eq('order_id', order.id)
          .eq('status', 'pending');
      }

      // 4. Get engagement order items and cancel their runs
      for (const eo of engagementOrders || []) {
        const { data: items } = await supabase
          .from('engagement_order_items')
          .select('id')
          .eq('engagement_order_id', eo.id);

        for (const item of items || []) {
          await supabase
            .from('organic_run_schedule')
            .update({ status: 'cancelled' })
            .eq('engagement_order_item_id', item.id)
            .eq('status', 'pending');
        }

        // Cancel the items too
        await supabase
          .from('engagement_order_items')
          .update({ status: 'cancelled' })
          .eq('engagement_order_id', eo.id)
          .not('status', 'in', '("completed","cancelled","failed")');
      }

      // 5. Update single order statuses
      const { error: singleError } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('user_id', targetUser.user_id)
        .not('status', 'in', '("completed","cancelled","failed")');

      if (singleError) throw singleError;

      // 6. Update engagement order statuses
      const { error: engagementError } = await supabase
        .from('engagement_orders')
        .update({ status: 'cancelled' })
        .eq('user_id', targetUser.user_id)
        .not('status', 'in', '("completed","cancelled","failed")');

      if (engagementError) throw engagementError;

      // 7. Optional refund - simple implementation (just log for now, complex calculation needed for precise refund)
      if (refund) {
        // Calculate rough refund based on order prices
        const singleTotal = (singleOrders || []).reduce((sum, o) => sum + (o.price || 0), 0);
        const engagementTotal = (engagementOrders || []).reduce((sum, o) => sum + (o.total_price || 0), 0);
        const totalRefund = singleTotal + engagementTotal;

        if (totalRefund > 0) {
          // Get current wallet
          const { data: wallet } = await supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', targetUser.user_id)
            .single();

          const newBalance = (wallet?.balance || 0) + totalRefund;

          await supabase
            .from('wallets')
            .update({ balance: newBalance })
            .eq('user_id', targetUser.user_id);

          await supabase.from('transactions').insert({
            user_id: targetUser.user_id,
            type: 'refund',
            amount: totalRefund,
            balance_after: newBalance,
            description: 'Admin cancelled all orders - refund',
            status: 'completed',
          });
        }
      }
    },
    onSuccess: () => {
      toast.success('All orders cancelled!');
      setCancelUser(null);
      setRefundOnCancel(false);
      queryClient.invalidateQueries({ queryKey: ['admin-all-users-with-subs'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Ban / Unban mutation
  const toggleBanMutation = useMutation({
    mutationFn: async ({ targetUser, ban, reason }: { targetUser: UserProfile; ban: boolean; reason?: string }) => {
      const { error } = await supabase.rpc('admin_set_user_ban' as any, {
        target_user_id: targetUser.user_id,
        ban,
        reason: reason || null,
      });
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      toast.success(vars.ban ? 'User banned. They will be logged out.' : 'User unbanned. They can log in again.');
      setBanUser(null);
      setBanReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-all-users-with-subs'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Helper to check if user has paused orders

  const hasPausedOrders = (u: UserProfile) => {
    return (u.orderCounts?.singlePaused || 0) + (u.orderCounts?.engagementPaused || 0) > 0;
  };

  // Helper to check if user has active orders
  const hasActiveOrders = (u: UserProfile) => {
    return (u.orderCounts?.singleActive || 0) + (u.orderCounts?.engagementActive || 0) > 0;
  };

  // Total active orders for a user
  const getTotalActiveOrders = (u: UserProfile) => {
    return (u.orderCounts?.singleActive || 0) + (u.orderCounts?.engagementActive || 0);
  };

  // Tab filter first, then advanced filters + search + sort
  const filteredUsers = useMemo(() => {
    let base: UserProfile[] = users || [];
    switch (activeTab) {
      case 'normal':
        base = base.filter((u) => !u.subscription || u.subscription.status !== 'active');
        break;
      case 'monthly':
        base = base.filter((u) => u.subscription?.status === 'active' && u.subscription?.plan_type === 'monthly');
        break;
      case 'lifetime':
        base = base.filter((u) => u.subscription?.status === 'active' && u.subscription?.plan_type === 'lifetime');
        break;
    }
    const filtered = applyFilters(base as unknown as Row[], filters, searchQuery);
    const sorted = applySort(filtered, sortKey);
    return sorted as unknown as UserProfile[];
  }, [users, activeTab, filters, searchQuery, sortKey]);

  const handleExport = () => {
    const csv = rowsToCsv(filteredUsers as unknown as Row[]);
    downloadCsv(`users-${new Date().toISOString().slice(0,10)}.csv`, csv);
    toast.success(`Exported ${filteredUsers.length} users`);
  };

  const selectedBalanceInr = selectedUser ? (selectedUser.wallet?.balance || 0) * INR_RATE : 0;
  const parsedBalanceAmount = parseFloat(balanceAmount || '0') || 0;
  const isSubtractTooMuch =
    balanceAction === 'subtract' && parsedBalanceAmount > 0 && parsedBalanceAmount > selectedBalanceInr + 0.01;

  // Stats
  const totalBalance = users?.reduce((sum, u) => sum + (u.wallet?.balance || 0), 0) || 0;
  const normalCount = users?.filter((u) => !u.subscription || u.subscription.status !== 'active').length || 0;
  const monthlyCount = users?.filter((u) => u.subscription?.status === 'active' && u.subscription?.plan_type === 'monthly').length || 0;
  const lifetimeCount = users?.filter((u) => u.subscription?.status === 'active' && u.subscription?.plan_type === 'lifetime').length || 0;

  // Wait for auth to load before checking admin status
  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const getSubscriptionBadge = (sub?: Subscription) => {
    if (!sub || sub.status !== 'active') {
      return (
        <Badge variant="outline" className="text-[10px] h-5 border-muted-foreground/30 text-muted-foreground">
          <UserX className="h-3 w-3 mr-1" />
          No Plan
        </Badge>
      );
    }
    if (sub.plan_type === 'lifetime') {
      return (
        <Badge className="text-[10px] h-5 bg-amber-500/20 text-amber-500 border-amber-500/30">
          <Crown className="h-3 w-3 mr-1" />
          Lifetime
        </Badge>
      );
    }
    return (
      <Badge className="text-[10px] h-5 bg-primary/20 text-primary border-primary/30">
        <Zap className="h-3 w-3 mr-1" />
        Monthly
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 px-2 sm:px-4 lg:px-6 pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Link
            to="/admin"
            className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">User Management</h1>
            <p className="text-sm text-muted-foreground">
              View and manage all user accounts & subscriptions
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-foreground/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{users?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted-foreground/10 flex items-center justify-center">
                  <UserX className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{normalCount}</p>
                  <p className="text-xs text-muted-foreground">No Plan</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{monthlyCount}</p>
                  <p className="text-xs text-muted-foreground">Monthly</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Crown className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{lifetimeCount}</p>
                  <p className="text-xs text-muted-foreground">Lifetime</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as UserTab)}>
          <TabsList className="h-10">
            <TabsTrigger value="all" className="gap-1">
              <Users className="h-3 w-3" />
              All
            </TabsTrigger>
            <TabsTrigger value="normal" className="gap-1">
              <UserX className="h-3 w-3" />
              No Plan
            </TabsTrigger>
            <TabsTrigger value="monthly" className="gap-1">
              <Zap className="h-3 w-3" />
              Monthly
            </TabsTrigger>
            <TabsTrigger value="lifetime" className="gap-1">
              <Crown className="h-3 w-3" />
              Lifetime
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search + Sort + Filters + Export */}
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search email, name, user ID, telegram…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-xl"
            />
          </div>
          <div className="flex flex-wrap gap-2 md:ml-auto">
            <UserSortSelect value={sortKey} onChange={setSortKey} />
            <UserFiltersSheet value={filters} onChange={setFilters} />
            <Button variant="outline" className="h-10 rounded-xl gap-2" onClick={handleExport} disabled={!filteredUsers.length}>
              <Download className="h-4 w-4" /> CSV
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground -mt-2">
          Showing <span className="font-semibold text-foreground">{filteredUsers.length}</span> of {users?.length || 0} users
        </p>


        {/* Users Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredUsers && filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((u) => {
              const ind = indicatorFor(u as unknown as Row);
              const dotClass =
                ind === 'green'  ? 'bg-emerald-500' :
                ind === 'blue'   ? 'bg-blue-500' :
                ind === 'red'    ? 'bg-red-500' :
                ind === 'orange' ? 'bg-orange-500' :
                ind === 'gray'   ? 'bg-slate-400' : 'bg-transparent';
              const ringClass =
                ind === 'red' ? 'ring-1 ring-red-500/30' :
                ind === 'blue' ? 'ring-1 ring-blue-500/30' : '';
              return (
              <Card
                key={u.id}
                className={`glass-card hover:border-primary/30 transition-all group ${ringClass}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                        {u.email.charAt(0).toUpperCase()}
                      </div>
                      {ind && <span className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${dotClass}`} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate">
                          {u.full_name || 'Unnamed'}
                        </h3>
                        {u.role === 'admin' && (
                          <Badge className="bg-foreground/20 text-foreground text-[10px] h-5">
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                        {u.is_banned && (
                          <Badge className="bg-red-500/20 text-red-500 text-[10px] h-5 border-red-500/30">
                            <Ban className="h-3 w-3 mr-1" /> Banned
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {u.email}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">
                        ID: {u.user_id.slice(0, 8)}…
                      </p>
                    </div>
                  </div>


                  {/* Subscription Status */}
                  <div className="mt-3 p-2.5 rounded-lg bg-muted/50 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {getSubscriptionBadge(u.subscription)}
                      {u.subscription?.status === 'active' && u.subscription?.plan_type === 'monthly' && u.subscription?.expires_at && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(u.subscription.expires_at), { addSuffix: true })}
                        </span>
                      )}
                      {u.subscription?.status === 'active' && u.subscription?.plan_type === 'lifetime' && (
                        <span className="text-[10px] text-amber-500">Forever</span>
                      )}
                    </div>
                    {u.is_banned ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleBanMutation.mutate({ targetUser: u, ban: false })}
                        disabled={toggleBanMutation.isPending}
                        className="h-7 px-2 rounded-lg text-[11px] gap-1 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                        title="Unban user"
                      >
                        <ShieldOff className="h-3 w-3" /> Unban
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setBanUser(u); setBanReason(''); }}
                        className="h-7 px-2 rounded-lg text-[11px] gap-1 border-red-500/40 text-red-600 hover:bg-red-500/10"
                        title="Ban user"
                      >
                        <Ban className="h-3 w-3" /> Ban
                      </Button>
                    )}
                  </div>


                  <div className="grid grid-cols-3 gap-2 mt-3 p-3 rounded-xl bg-muted/50">
                    <div className="text-center">
                      <p className="text-lg font-bold text-success">
                        ₹{((u.wallet?.balance || 0) * 83.5).toFixed(2)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Balance</p>
                    </div>
                    <div className="text-center border-x border-border">
                      <p className="text-lg font-bold">
                        ₹{((u.wallet?.total_spent || 0) * 83.5).toFixed(2)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Spent</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-primary">
                        ₹{((u.wallet?.total_deposited || 0) * 83.5).toFixed(2)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Deposited</p>
                    </div>
                  </div>

                  {/* Order Count Badge */}
                  {(hasActiveOrders(u) || hasPausedOrders(u)) && (
                    <div className="mt-3 p-2.5 rounded-lg bg-muted/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {getTotalActiveOrders(u) > 0 && (
                            <span className="text-primary font-medium">{getTotalActiveOrders(u)} Active</span>
                          )}
                          {getTotalActiveOrders(u) > 0 && hasPausedOrders(u) && ' • '}
                          {hasPausedOrders(u) && (
                            <span className="text-warning font-medium">
                              {(u.orderCounts?.singlePaused || 0) + (u.orderCounts?.engagementPaused || 0)} Paused
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Activity meta */}
                  <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
                    <div className="p-2 rounded-lg bg-muted/40 text-center">
                      <p className="text-muted-foreground uppercase tracking-wide">Last Fund</p>
                      <p className="font-semibold text-foreground mt-0.5 flex items-center justify-center gap-1">
                        <ArrowDownCircle className="h-3 w-3 text-emerald-500" />
                        {u.last_deposit_at ? formatDistanceToNow(new Date(u.last_deposit_at), { addSuffix: true }) : 'Never'}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/40 text-center">
                      <p className="text-muted-foreground uppercase tracking-wide">Orders</p>
                      <p className="font-semibold text-foreground mt-0.5 flex items-center justify-center gap-1">
                        <ShoppingCart className="h-3 w-3" />
                        {u.total_orders_count || 0}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/40 text-center">
                      <p className="text-muted-foreground uppercase tracking-wide">Last Login</p>
                      <p className="font-semibold text-foreground mt-0.5 flex items-center justify-center gap-1">
                        <LogIn className="h-3 w-3" />
                        {u.last_sign_in_at ? formatDistanceToNow(new Date(u.last_sign_in_at), { addSuffix: true }) : 'Never'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(u.created_at), 'MMM d, yyyy')}
                    </p>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedUser(u)}
                        className="h-8 w-8 rounded-lg"
                        title="Manage Balance"
                      >
                        <Wallet className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleAdminMutation.mutate(u)}
                        className={`h-8 w-8 rounded-lg ${u.role === 'admin' ? 'text-foreground' : ''}`}
                        title="Toggle Admin"
                      >
                        <Shield className="h-4 w-4" />
                      </Button>
                      {/* Pause/Resume Button */}
                      {hasPausedOrders(u) ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => resumeAllOrdersMutation.mutate(u)}
                          disabled={resumeAllOrdersMutation.isPending}
                          className="h-8 w-8 rounded-lg text-success hover:text-success"
                          title="Resume All Orders"
                        >
                          {resumeAllOrdersMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      ) : hasActiveOrders(u) ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPauseUser(u)}
                          className="h-8 w-8 rounded-lg text-warning hover:text-warning"
                          title="Pause All Orders"
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      ) : null}
                      {/* Cancel Button */}
                      {(hasActiveOrders(u) || hasPausedOrders(u)) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setCancelUser(u)}
                          className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
                          title="Cancel All Orders"
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}
                      {u.subscription?.status === 'active' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setRemoveSubUser(u)}
                          className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
                          title="Remove Subscription"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        ) : (
          <Card className="glass-card p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No users found</p>
          </Card>
        )}

        {/* Balance Dialog */}
        <Dialog
          open={!!selectedUser}
          onOpenChange={(open) => !open && setSelectedUser(null)}
        >
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Manage Balance
              </DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-xl bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground mb-1">
                    {selectedUser.email}
                  </p>
                  <p className="text-3xl font-bold text-success">
                    ₹{selectedBalanceInr.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">Current Balance</p>
                </div>

                {isSuperAdmin ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={balanceAction === 'add' ? 'default' : 'outline'}
                      onClick={() => setBalanceAction('add')}
                      className="h-10 rounded-xl"
                    >
                      Add
                    </Button>
                    <Button
                      type="button"
                      variant={balanceAction === 'subtract' ? 'default' : 'outline'}
                      onClick={() => setBalanceAction('subtract')}
                      className="h-10 rounded-xl"
                    >
                      Subtract
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                    🔒 Only the super-admin (multysmm@gmail.com) can add or subtract funds. All other credits come from ZapUPI.
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Amount (₹ INR)</Label>
                  <Input
                    type="number"
                    step="1"
                    placeholder="e.g. 500"
                    value={balanceAmount}
                    onChange={(e) => setBalanceAmount(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                  <p className="text-[10px] text-muted-foreground">Wallet credit converted at ₹83.5 / $1</p>
                  {isSubtractTooMuch && (
                    <p className="text-xs font-medium text-destructive">
                      Subtract amount cannot be more than current balance ₹{selectedBalanceInr.toFixed(2)}.
                    </p>
                  )}
                </div>
              </div>
            )}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setSelectedUser(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => updateBalanceMutation.mutate()}
                disabled={updateBalanceMutation.isPending || !balanceAmount || !isSuperAdmin || isSubtractTooMuch}
              >
                {updateBalanceMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {balanceAction === 'add' ? 'Add' : 'Subtract'} ₹{balanceAmount || '0'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Remove Subscription Dialog */}
        <Dialog
          open={!!removeSubUser}
          onOpenChange={(open) => !open && setRemoveSubUser(null)}
        >
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                Remove Subscription
              </DialogTitle>
            </DialogHeader>
            {removeSubUser && (
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-xl bg-muted/50 text-center">
                  <p className="font-medium">{removeSubUser.full_name || removeSubUser.email}</p>
                  <p className="text-xs text-muted-foreground">{removeSubUser.email}</p>
                  <div className="mt-2">
                    {getSubscriptionBadge(removeSubUser.subscription)}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  This will remove the user's subscription. They will no longer be able to place orders until they subscribe again.
                </p>
              </div>
            )}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setRemoveSubUser(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => removeSubUser && removeSubscriptionMutation.mutate(removeSubUser)}
                disabled={removeSubscriptionMutation.isPending}
              >
                {removeSubscriptionMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Remove Subscription
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Pause All Orders Dialog */}
        <Dialog
          open={!!pauseUser}
          onOpenChange={(open) => !open && setPauseUser(null)}
        >
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-warning">
                <Pause className="h-5 w-5" />
                Pause All Orders
              </DialogTitle>
            </DialogHeader>
            {pauseUser && (
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-xl bg-muted/50 text-center">
                  <p className="font-medium">{pauseUser.full_name || pauseUser.email}</p>
                  <p className="text-xs text-muted-foreground">{pauseUser.email}</p>
                  <div className="mt-3 flex justify-center gap-4 text-sm">
                    <span>{pauseUser.orderCounts?.singleActive || 0} Single Orders</span>
                    <span>{pauseUser.orderCounts?.engagementActive || 0} Engagement Orders</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-sm text-warning">
                  <p className="font-medium mb-1">This will pause ALL delivery schedules for this user.</p>
                  <p className="text-warning/80">Runs scheduled during pause will be skipped (not delivered). Resume to continue deliveries.</p>
                </div>
              </div>
            )}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setPauseUser(null)}>
                Cancel
              </Button>
              <Button
                variant="warning"
                onClick={() => pauseUser && pauseAllOrdersMutation.mutate(pauseUser)}
                disabled={pauseAllOrdersMutation.isPending}
              >
                {pauseAllOrdersMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Pause All Orders
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Cancel All Orders Dialog */}
        <Dialog
          open={!!cancelUser}
          onOpenChange={(open) => {
            if (!open) {
              setCancelUser(null);
              setRefundOnCancel(false);
            }
          }}
        >
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Ban className="h-5 w-5" />
                Cancel All Orders
              </DialogTitle>
            </DialogHeader>
            {cancelUser && (
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-xl bg-muted/50 text-center">
                  <p className="font-medium">{cancelUser.full_name || cancelUser.email}</p>
                  <p className="text-xs text-muted-foreground">{cancelUser.email}</p>
                  <div className="mt-3 text-sm">
                    <p>Orders to cancel:</p>
                    <p className="font-medium mt-1">
                      {(cancelUser.orderCounts?.singleActive || 0) + (cancelUser.orderCounts?.singlePaused || 0)} single,{' '}
                      {(cancelUser.orderCounts?.engagementActive || 0) + (cancelUser.orderCounts?.engagementPaused || 0)} engagement
                    </p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">This action cannot be undone!</p>
                    <p className="text-destructive/80">All pending deliveries will be stopped permanently.</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="refund"
                    checked={refundOnCancel}
                    onCheckedChange={(checked) => setRefundOnCancel(checked === true)}
                  />
                  <label
                    htmlFor="refund"
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    Refund remaining balance
                  </label>
                </div>
              </div>
            )}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setCancelUser(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => cancelUser && cancelAllOrdersMutation.mutate({ targetUser: cancelUser, refund: refundOnCancel })}
                disabled={cancelAllOrdersMutation.isPending}
              >
                {cancelAllOrdersMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Cancel All Orders
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Ban User Dialog */}
        <Dialog
          open={!!banUser}
          onOpenChange={(open) => { if (!open) { setBanUser(null); setBanReason(''); } }}
        >
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Ban className="h-5 w-5" />
                Ban User
              </DialogTitle>
            </DialogHeader>
            {banUser && (
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-xl bg-muted/50 text-center">
                  <p className="font-medium">{banUser.full_name || banUser.email}</p>
                  <p className="text-xs text-muted-foreground">{banUser.email}</p>
                </div>
                <div className="space-y-2">
                  <Label>Reason (optional)</Label>
                  <Textarea
                    placeholder="Why is this user being banned?"
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    className="rounded-xl min-h-[80px]"
                  />
                </div>
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">This user will be logged out immediately.</p>
                    <p className="text-destructive/80">On next login attempt they'll see: "You are banned, please contact admin." Unban anytime to restore access.</p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => { setBanUser(null); setBanReason(''); }}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => banUser && toggleBanMutation.mutate({ targetUser: banUser, ban: true, reason: banReason.trim() })}
                disabled={toggleBanMutation.isPending}
              >
                {toggleBanMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Ban User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
