// Single source of truth for how a run's status is shown to the user.
// Provider data (provider_status / provider_remains) always wins over the
// local DB status so the UI never shows "Completed" while the provider is
// still processing (or vice-versa).

export type EffectiveRunStatus = 'pending' | 'started' | 'completed' | 'failed' | 'cancelled';

export const normalizeProviderStatus = (s?: string | null) =>
  (s ?? '').toString().toLowerCase().trim();

export const isTargetMetAutoCompleted = (run: any): boolean => {
  const status = normalizeProviderStatus(run?.status);
  const message = normalizeProviderStatus(run?.error_message);
  return (status === 'cancelled' || status === 'canceled') && message.startsWith('target met');
};

export const getEffectiveRunStatus = (run: any): EffectiveRunStatus => {
  if (isTargetMetAutoCompleted(run)) return 'completed';

  const ps = normalizeProviderStatus(run?.provider_status);

  if (ps === 'completed' || ps === 'complete' || ps === 'success') return 'completed';
  if (ps === 'partial') return 'completed';
  if (ps === 'pending' || ps === 'awaiting') return 'pending';
  if (ps === 'in progress' || ps === 'inprogress' || ps === 'processing' || ps === 'processing order') {
    return 'started';
  }
  if (ps === 'canceled' || ps === 'cancelled' || ps === 'refunded' || ps === 'refund' || ps === 'failed' || ps === 'error') {
    return 'failed';
  }

  // No provider status yet: a dispatched run with 0 remaining is done.
  const remains = run?.provider_remains;
  if (run?.provider_order_id && typeof remains === 'number' && remains <= 0) return 'completed';

  const s = normalizeProviderStatus(run?.status);
  if (s === 'processing') return 'started';
  if (s === 'cancelled' || s === 'canceled') return 'cancelled';
  if (s === 'pending' || s === 'started' || s === 'completed' || s === 'failed') {
    return s as EffectiveRunStatus;
  }
  return 'pending';
};

// Human label for badges: prefer the live provider wording when we have it.
export const getRunStatusLabel = (run: any): string => {
  const effective = getEffectiveRunStatus(run);
  if (effective === 'started') return 'In progress';
  if (effective === 'completed') return 'Completed';
  if (effective === 'failed') return 'Failed';
  if (effective === 'cancelled') return 'Cancelled';
  return 'Scheduled';
};

export const getRunDelivered = (run: any): number => {
  const qty = Number(run?.quantity_to_send || 0);
  if (isTargetMetAutoCompleted(run)) return qty;

  const ps = normalizeProviderStatus(run?.provider_status);
  if (ps === 'completed' || ps === 'complete' || ps === 'success') return qty;

  if (run?.provider_remains !== null && run?.provider_remains !== undefined) {
    return Math.max(0, qty - Number(run.provider_remains));
  }

  if (normalizeProviderStatus(run?.status) === 'completed') return qty;
  return 0;
};
