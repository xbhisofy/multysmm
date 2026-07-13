import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Key, Clock, Link as LinkIcon, ArrowLeft, Zap, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

interface ProviderAccount {
  id: string;
  provider_id: string;
  name: string;
  api_key: string;
  api_url: string;
  priority: number;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
  delivery_multiplier?: number | null;
  last_verified_at?: string | null;
  last_verified_status?: 'valid' | 'invalid' | null;
  last_verified_balance?: number | null;
  last_verified_currency?: string | null;
  last_verified_error?: string | null;
}

interface Provider {
  id: string;
  name: string;
  api_url: string;
}

export default function AdminProviderAccounts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ProviderAccount | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [dialogTesting, setDialogTesting] = useState(false);

  const runTest = async (payload: { account_id?: string; api_url?: string; api_key?: string }, label?: string) => {
    const tid = toast.loading(`Testing ${label || "provider"} key...`);
    try {
      const { data, error } = await supabase.functions.invoke("test-provider-key", { body: payload });
      if (error) throw error;
      if (data?.ok) {
        toast.success(
          `✅ Key valid — balance: ${data.balance ?? "?"} ${data.currency ?? ""} (${data.latency_ms}ms)`,
          { id: tid }
        );
      } else {
        toast.error(`❌ ${data?.error || "Invalid key"}`, { id: tid });
      }
    } catch (e: any) {
      toast.error(`❌ ${e?.message || "Test failed"}`, { id: tid });
    } finally {
      queryClient.invalidateQueries({ queryKey: ["provider-accounts"] });
    }
  };
  
  // Form state
  const [formData, setFormData] = useState({
    provider_id: "",
    name: "",
    api_key: "",
    api_url: "",
    priority: 1,
    is_active: true,
    delivery_multiplier: 1,
  });

  // Fetch providers for dropdown
  const { data: providers } = useQuery({
    queryKey: ["providers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("providers")
        .select("id, name, api_url")
        .eq("is_active", true);
      if (error) throw error;
      return data as Provider[];
    },
  });

  // Fetch provider accounts
  const { data: accounts, isLoading } = useQuery({
    queryKey: ["provider-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_accounts")
        .select("*")
        .order("provider_id", { ascending: true })
        .order("priority", { ascending: true });
      if (error) throw error;
      return data as ProviderAccount[];
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      if (data.id) {
        // Update
        const { error } = await supabase
          .from("provider_accounts")
          .update({
            provider_id: data.provider_id,
            name: data.name,
            api_key: data.api_key,
            api_url: data.api_url,
            priority: data.priority,
            is_active: data.is_active,
            delivery_multiplier: data.delivery_multiplier,
          })
          .eq("id", data.id);
        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from("provider_accounts")
          .insert({
            provider_id: data.provider_id,
            name: data.name,
            api_key: data.api_key,
            api_url: data.api_url,
            priority: data.priority,
            is_active: data.is_active,
            delivery_multiplier: data.delivery_multiplier,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-accounts"] });
      toast.success(editingAccount ? "Account updated!" : "Account created!");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save account");
    },
  });

  // Delete mutation — SURGICAL: only removes the selected provider account
  // and its own mappings. Never touches other accounts' mappings, other
  // providers' services, bundles, priorities, or service IDs.
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const account = accounts?.find(a => a.id === id);
      if (!account) throw new Error("Account not found");

      // 1) Nullify FK references in organic_run_schedule (history rows keep)
      const { error: refError } = await supabase
        .from("organic_run_schedule")
        .update({ provider_account_id: null })
        .eq("provider_account_id", id);
      if (refError) throw refError;

      // 2) Delete ONLY the mappings that belong to THIS account.
      //    Other provider accounts mapped to the same service stay intact
      //    with their priorities, sort_order and provider_service_id.
      const { error: mapError } = await supabase
        .from("service_provider_mapping")
        .delete()
        .eq("provider_account_id", id);
      if (mapError) throw mapError;

      // 3) Delete the provider account itself.
      const { error } = await supabase
        .from("provider_accounts")
        .delete()
        .eq("id", id);
      if (error) throw error;

      // NOTE: Intentionally NOT cascading into services / bundle_items /
      // providers table. Removing one account must never wipe bundles or
      // other accounts' configuration. If the admin also wants to remove
      // the underlying provider + its services, they can do that explicitly.
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      queryClient.invalidateQueries({ queryKey: ["service-mappings"] });
      toast.success("Provider account unlinked. Other providers untouched.");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete account");
    },
  });

  // Toggle active status
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from("provider_accounts")
        .update({ is_active })
        .eq("id", id)
        .select("id, is_active");
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Update blocked (permission denied or row not found). Aap admin ho ya nahi check karein.");
      }
      return data[0];
    },
    onSuccess: (row) => {
      queryClient.invalidateQueries({ queryKey: ["provider-accounts"] });
      toast.success(`Status ${row.is_active ? "enabled" : "disabled"}`);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Toggle failed");
    },
  });

  const resetForm = () => {
    setFormData({
      provider_id: "",
      name: "",
      api_key: "",
      api_url: "",
      priority: 1,
      is_active: true,
      delivery_multiplier: 1,
    });
    setEditingAccount(null);
  };

  const openEditDialog = (account: ProviderAccount) => {
    setEditingAccount(account);
    setFormData({
      provider_id: account.provider_id,
      name: account.name,
      api_key: account.api_key,
      api_url: account.api_url,
      priority: account.priority,
      is_active: account.is_active,
      delivery_multiplier: Number(account.delivery_multiplier ?? 1),
    });
    setIsDialogOpen(true);
  };

  const handleProviderChange = (providerId: string) => {
    const provider = providers?.find(p => p.id === providerId);
    setFormData(prev => ({
      ...prev,
      provider_id: providerId,
      api_url: provider?.api_url || prev.api_url,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ ...formData, id: editingAccount?.id });
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return "***";
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  };

  // Group accounts by provider
  const groupedAccounts = accounts?.reduce((acc, account) => {
    if (!acc[account.provider_id]) {
      acc[account.provider_id] = [];
    }
    acc[account.provider_id].push(account);
    return acc;
  }, {} as Record<string, ProviderAccount[]>);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Provider Accounts</h1>
              <p className="text-sm text-muted-foreground">
                Manage multiple API keys for round-robin provider rotation
              </p>
            </div>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingAccount ? "Edit" : "Add"} Provider Account</DialogTitle>
                  <DialogDescription>
                    Add multiple API keys for the same provider to enable round-robin delivery
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Base Provider (ID)</Label>
                    <Input
                      placeholder="e.g., yoyo, dreepfed, justanother"
                      value={formData.provider_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, provider_id: e.target.value }))}
                      required
                    />
                    <p className="text-xs text-muted-foreground">Koi bhi custom provider ID likh sakte ho</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Account Name</Label>
                    <Input
                      placeholder="e.g., YOYO Account 2"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      placeholder="Enter API key"
                      value={formData.api_key}
                      onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>API URL</Label>
                    <Input
                      placeholder="https://api.provider.com"
                      value={formData.api_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, api_url: e.target.value }))}
                      required
                    />
                  </div>
                  
                  {/* Priority removed — priority is now managed per-service in Bundle → Providers dialog. */}
                  
                  <div className="space-y-2">
                    <Label>Delivery Multiplier (over-delivery factor)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min={0.5}
                      max={5}
                      value={formData.delivery_multiplier}
                      onChange={(e) => setFormData(prev => ({ ...prev, delivery_multiplier: parseFloat(e.target.value) || 1 }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      If this provider delivers 2x extra (e.g. 2000 for a 1000 order), set <strong>2.0</strong>. The system will automatically send half the quantity. Default: <strong>1.0</strong>
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={dialogTesting || !formData.api_key || !formData.api_url}
                    onClick={async () => {
                      setDialogTesting(true);
                      await runTest({ api_url: formData.api_url, api_key: formData.api_key }, formData.name);
                      setDialogTesting(false);
                    }}
                    className="gap-2"
                  >
                    {dialogTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                    Test Connection
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Info Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-sm text-primary-foreground/80">
              <strong>Round-Robin System:</strong> Add multiple accounts for the same provider. 
              When sending orders, the system will automatically rotate between accounts 
              using LRU (Least Recently Used) selection to prevent "active order on this link" errors.
            </p>
          </CardContent>
        </Card>

        {/* Accounts List */}
        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground">Loading...</div>
        ) : !accounts?.length ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No provider accounts yet. Click "Add Account" to create one.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedAccounts || {}).map(([providerId, providerAccounts]) => (
              <Card key={providerId}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {providers?.find(p => p.id === providerId)?.name || providerId}
                    <Badge variant="secondary">{providerAccounts.length} accounts</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>API Key</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Verified</TableHead>
                        <TableHead>Last Used</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {providerAccounts.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium">{account.name}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {maskApiKey(account.api_key)}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">#{account.priority}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {account.last_verified_status === 'valid' ? (
                                <Badge className="w-fit bg-green-500/15 text-green-700 dark:text-green-400 border border-green-500/30 hover:bg-green-500/20">
                                  ✓ Valid{account.last_verified_balance != null ? ` · ${account.last_verified_balance}${account.last_verified_currency ? ' ' + account.last_verified_currency : ''}` : ''}
                                </Badge>
                              ) : account.last_verified_status === 'invalid' ? (
                                <Badge
                                  variant="destructive"
                                  className="w-fit"
                                  title={account.last_verified_error || 'Invalid key'}
                                >
                                  ✕ Invalid
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="w-fit text-muted-foreground">
                                  ? Unknown
                                </Badge>
                              )}
                              {account.last_verified_at && (
                                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDistanceToNow(new Date(account.last_verified_at), { addSuffix: true })}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {account.last_used_at ? (
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(account.last_used_at), { addSuffix: true })}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">Never</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={account.is_active}
                              onCheckedChange={(checked) => 
                                toggleMutation.mutate({ id: account.id, is_active: checked })
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Test API key"
                                disabled={testingId === account.id}
                                onClick={async () => {
                                  setTestingId(account.id);
                                  await runTest({ account_id: account.id }, account.name);
                                  setTestingId(null);
                                }}
                              >
                                {testingId === account.id
                                  ? <Loader2 className="h-4 w-4 animate-spin" />
                                  : <Zap className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(account)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  if (confirm("Delete this account?")) {
                                    deleteMutation.mutate(account.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Service Mapping Link */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Service Provider Mapping</CardTitle>
            <CardDescription>
              Link services to multiple provider accounts for automatic rotation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate("/admin/service-provider-mapping")}
            >
              <LinkIcon className="h-4 w-4" />
              Configure Service Mappings
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
