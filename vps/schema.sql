-- MultySMM schema dump

-- ENUMS

CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- SEQUENCES

CREATE SEQUENCE IF NOT EXISTS public.engagement_orders_order_number_seq;
CREATE SEQUENCE IF NOT EXISTS public.orders_order_number_seq;

-- TABLES

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  actor_id uuid,
  actor_email text,
  target_user_id uuid,
  target_email text,
  action text NOT NULL,
  amount_usd numeric,
  amount_inr numeric,
  notes text,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.bundle_items (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  bundle_id uuid NOT NULL,
  service_id uuid,
  engagement_type text NOT NULL,
  ratio_percent numeric DEFAULT 100,
  is_base boolean DEFAULT false,
  default_drip_qty_per_run integer DEFAULT 500,
  default_drip_interval integer DEFAULT 1,
  default_drip_interval_unit text DEFAULT 'hours'::text,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  price_per_k numeric
);
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  user_name text,
  status text DEFAULT 'open'::text NOT NULL,
  last_message_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  conversation_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.deposits (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'USDT'::text,
  payment_method text DEFAULT 'usdt'::text,
  proof_url text,
  status text DEFAULT 'pending'::text,
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.engagement_bundles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  platform text NOT NULL,
  provider_id text,
  description text,
  icon text DEFAULT 'rocket'::text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  use_custom_ratios boolean DEFAULT false,
  ai_organic_enabled boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.engagement_order_items (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  engagement_order_id uuid NOT NULL,
  engagement_type text NOT NULL,
  service_id uuid,
  quantity integer NOT NULL,
  price numeric NOT NULL,
  drip_qty_per_run integer,
  drip_interval integer,
  drip_interval_unit text DEFAULT 'hours'::text,
  speed_preset text DEFAULT 'natural'::text,
  is_enabled boolean DEFAULT true,
  status text DEFAULT 'pending'::text,
  provider_order_id text,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  start_count integer,
  start_count_captured_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.engagement_orders (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  order_number integer DEFAULT nextval('engagement_orders_order_number_seq'::regclass) NOT NULL,
  user_id uuid NOT NULL,
  bundle_id uuid,
  link text NOT NULL,
  base_quantity integer NOT NULL,
  total_price numeric NOT NULL,
  is_organic_mode boolean DEFAULT true,
  variance_percent integer DEFAULT 25,
  peak_hours_enabled boolean DEFAULT true,
  status text DEFAULT 'pending'::text,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  config_snapshot jsonb
);
CREATE TABLE IF NOT EXISTS public.order_health_alerts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  order_kind text NOT NULL,
  order_ref uuid NOT NULL,
  issue_code text NOT NULL,
  priority text DEFAULT 'medium'::text NOT NULL,
  first_alerted_at timestamp with time zone DEFAULT now() NOT NULL,
  last_alerted_at timestamp with time zone DEFAULT now() NOT NULL,
  next_reminder_at timestamp with time zone,
  reminder_step integer DEFAULT 0 NOT NULL,
  notification_count integer DEFAULT 1 NOT NULL,
  resolved boolean DEFAULT false NOT NULL,
  resolved_at timestamp with time zone,
  last_details jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  order_number integer DEFAULT nextval('orders_order_number_seq'::regclass) NOT NULL,
  user_id uuid NOT NULL,
  service_id uuid,
  link text NOT NULL,
  quantity integer NOT NULL,
  price numeric NOT NULL,
  status text DEFAULT 'pending'::text,
  start_count integer,
  remains integer,
  provider_order_id text,
  is_drip_feed boolean DEFAULT false,
  drip_runs integer,
  drip_interval integer,
  drip_interval_unit text,
  drip_quantity_per_run integer,
  is_organic_mode boolean DEFAULT false,
  variance_percent integer DEFAULT 25,
  peak_hours_enabled boolean DEFAULT true,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.organic_run_schedule (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  order_id uuid,
  run_number integer NOT NULL,
  scheduled_at timestamp with time zone NOT NULL,
  quantity_to_send integer NOT NULL,
  base_quantity integer NOT NULL,
  variance_applied integer DEFAULT 0,
  peak_multiplier numeric DEFAULT 1.0,
  status text DEFAULT 'pending'::text,
  provider_order_id text,
  provider_response jsonb,
  error_message text,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  engagement_order_item_id uuid,
  provider_start_count integer,
  provider_remains integer,
  provider_status text,
  provider_charge numeric,
  last_status_check timestamp with time zone,
  retry_count integer DEFAULT 0,
  provider_account_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  provider_account_name text,
  rotation_lock_key text
);
CREATE TABLE IF NOT EXISTS public.oxapay_deposits (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  order_id text NOT NULL,
  track_id text,
  amount_usd numeric(12,4) NOT NULL,
  amount_inr numeric(12,2) NOT NULL,
  status text DEFAULT 'waiting'::text NOT NULL,
  pay_currency text,
  credited boolean DEFAULT false NOT NULL,
  payment_url text,
  raw_payload jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.oxapay_webhook_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  order_id text,
  track_id text,
  hmac_valid boolean DEFAULT false NOT NULL,
  processed boolean DEFAULT false NOT NULL,
  headers jsonb,
  raw_payload jsonb,
  error_message text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  maintenance_mode boolean DEFAULT false,
  global_markup_percent numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.popup_ads (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  youtube_video_id text DEFAULT ''::text NOT NULL,
  title text DEFAULT 'Watch this video'::text NOT NULL,
  description text DEFAULT ''::text NOT NULL,
  enabled boolean DEFAULT false NOT NULL,
  skip_after_seconds integer DEFAULT 5 NOT NULL,
  last_force_trigger timestamp with time zone,
  version integer DEFAULT 1 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  video_layout text DEFAULT 'auto'::text NOT NULL
);
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  email text NOT NULL,
  full_name text,
  api_key text,
  currency text DEFAULT 'USD'::text,
  telegram_chat_id text,
  telegram_notifications_enabled boolean DEFAULT false,
  organic_variance_percent integer DEFAULT 25,
  organic_peak_hours_enabled boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  avatar_url text,
  telegram_id text,
  telegram_username text,
  is_organic_mode_default boolean DEFAULT true,
  organic_ratios jsonb,
  is_banned boolean DEFAULT false NOT NULL,
  banned_reason text,
  banned_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.provider_accounts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  provider_id text NOT NULL,
  name text NOT NULL,
  api_key text NOT NULL,
  api_url text NOT NULL,
  priority integer DEFAULT 1,
  is_active boolean DEFAULT true,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  balance numeric,
  balance_currency text,
  balance_checked_at timestamp with time zone,
  low_balance_threshold numeric DEFAULT 10 NOT NULL,
  last_low_balance_alert_at timestamp with time zone,
  last_balance_error text,
  delivery_multiplier numeric DEFAULT 1.0 NOT NULL,
  last_verified_at timestamp with time zone,
  last_verified_status text,
  last_verified_balance numeric,
  last_verified_currency text,
  last_verified_error text
);
CREATE TABLE IF NOT EXISTS public.providers (
  id text NOT NULL,
  name text NOT NULL,
  api_url text NOT NULL,
  api_key text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.razorpay_webhook_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  event_id text NOT NULL,
  event_type text,
  payment_id text,
  payload jsonb,
  processed_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.rotation_alert_state (
  alert_key text NOT NULL,
  last_count integer DEFAULT 0 NOT NULL,
  last_alerted_at timestamp with time zone DEFAULT now() NOT NULL,
  resolved_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.service_provider_mapping (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  service_id uuid,
  provider_account_id uuid,
  provider_service_id text NOT NULL,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.services (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  provider_id text,
  provider_service_id text NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  description text,
  price numeric DEFAULT 0 NOT NULL,
  min_quantity integer DEFAULT 10 NOT NULL,
  max_quantity integer DEFAULT 100000 NOT NULL,
  speed text DEFAULT 'medium'::text,
  quality text DEFAULT 'standard'::text,
  drip_feed_enabled boolean DEFAULT false,
  is_active boolean DEFAULT true,
  start_time text,
  refill text,
  cancel_allowed text,
  drop_type text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.subscription_requests (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  plan_type text NOT NULL,
  message text,
  status text DEFAULT 'pending'::text NOT NULL,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  admin_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  plan_type text DEFAULT 'none'::text NOT NULL,
  status text DEFAULT 'inactive'::text NOT NULL,
  activated_at timestamp with time zone,
  expires_at timestamp with time zone,
  activated_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  category text DEFAULT 'other'::text,
  priority text DEFAULT 'medium'::text,
  status text DEFAULT 'open'::text,
  order_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  type text NOT NULL,
  amount numeric NOT NULL,
  balance_after numeric NOT NULL,
  order_id uuid,
  description text,
  payment_method text,
  payment_reference text,
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  role app_role DEFAULT 'user'::app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  balance numeric DEFAULT 0,
  total_deposited numeric DEFAULT 0,
  total_spent numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.zapupi_deposits (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  order_id text NOT NULL,
  amount_inr numeric NOT NULL,
  amount_usd numeric,
  status text DEFAULT 'pending'::text NOT NULL,
  credited boolean DEFAULT false NOT NULL,
  txn_id text,
  utr text,
  payment_url text,
  gateway_response jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  mismatch_meta jsonb
);
CREATE TABLE IF NOT EXISTS public.zapupi_webhook_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  event_key text NOT NULL,
  order_id text,
  txn_id text,
  utr text,
  status text,
  source text NOT NULL,
  payload jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- CONSTRAINTS

ALTER TABLE public.admin_audit_log ADD CONSTRAINT admin_audit_log_pkey PRIMARY KEY (id);
ALTER TABLE public.bundle_items ADD CONSTRAINT bundle_items_pkey PRIMARY KEY (id);
ALTER TABLE public.chat_conversations ADD CONSTRAINT chat_conversations_pkey PRIMARY KEY (id);
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);
ALTER TABLE public.deposits ADD CONSTRAINT deposits_pkey PRIMARY KEY (id);
ALTER TABLE public.engagement_bundles ADD CONSTRAINT engagement_bundles_pkey PRIMARY KEY (id);
ALTER TABLE public.engagement_order_items ADD CONSTRAINT engagement_order_items_pkey PRIMARY KEY (id);
ALTER TABLE public.engagement_orders ADD CONSTRAINT engagement_orders_pkey PRIMARY KEY (id);
ALTER TABLE public.order_health_alerts ADD CONSTRAINT order_health_alerts_pkey PRIMARY KEY (id);
ALTER TABLE public.orders ADD CONSTRAINT orders_pkey PRIMARY KEY (id);
ALTER TABLE public.organic_run_schedule ADD CONSTRAINT organic_run_schedule_pkey PRIMARY KEY (id);
ALTER TABLE public.oxapay_deposits ADD CONSTRAINT oxapay_deposits_pkey PRIMARY KEY (id);
ALTER TABLE public.oxapay_webhook_events ADD CONSTRAINT oxapay_webhook_events_pkey PRIMARY KEY (id);
ALTER TABLE public.platform_settings ADD CONSTRAINT platform_settings_pkey PRIMARY KEY (id);
ALTER TABLE public.popup_ads ADD CONSTRAINT popup_ads_pkey PRIMARY KEY (id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.provider_accounts ADD CONSTRAINT provider_accounts_pkey PRIMARY KEY (id);
ALTER TABLE public.providers ADD CONSTRAINT providers_pkey PRIMARY KEY (id);
ALTER TABLE public.razorpay_webhook_events ADD CONSTRAINT razorpay_webhook_events_pkey PRIMARY KEY (id);
ALTER TABLE public.rotation_alert_state ADD CONSTRAINT rotation_alert_state_pkey PRIMARY KEY (alert_key);
ALTER TABLE public.service_provider_mapping ADD CONSTRAINT service_provider_mapping_pkey PRIMARY KEY (id);
ALTER TABLE public.services ADD CONSTRAINT services_pkey PRIMARY KEY (id);
ALTER TABLE public.subscription_requests ADD CONSTRAINT subscription_requests_pkey PRIMARY KEY (id);
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);
ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);
ALTER TABLE public.transactions ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);
ALTER TABLE public.wallets ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);
ALTER TABLE public.zapupi_deposits ADD CONSTRAINT zapupi_deposits_pkey PRIMARY KEY (id);
ALTER TABLE public.zapupi_webhook_events ADD CONSTRAINT zapupi_webhook_events_pkey PRIMARY KEY (id);
ALTER TABLE public.order_health_alerts ADD CONSTRAINT order_health_alerts_order_kind_order_ref_issue_code_key UNIQUE (order_kind, order_ref, issue_code);
ALTER TABLE public.oxapay_deposits ADD CONSTRAINT oxapay_deposits_order_id_key UNIQUE (order_id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
ALTER TABLE public.razorpay_webhook_events ADD CONSTRAINT razorpay_webhook_events_event_id_key UNIQUE (event_id);
ALTER TABLE public.service_provider_mapping ADD CONSTRAINT service_provider_mapping_service_id_provider_account_id_key UNIQUE (service_id, provider_account_id);
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
ALTER TABLE public.wallets ADD CONSTRAINT wallets_user_id_key UNIQUE (user_id);
ALTER TABLE public.zapupi_deposits ADD CONSTRAINT zapupi_deposits_order_id_key UNIQUE (order_id);
ALTER TABLE public.zapupi_webhook_events ADD CONSTRAINT zapupi_webhook_events_event_key_key UNIQUE (event_key);
ALTER TABLE public.chat_conversations ADD CONSTRAINT chat_conversations_status_check CHECK ((status = ANY (ARRAY['open'::text, 'closed'::text])));
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_sender_role_check CHECK ((sender_role = ANY (ARRAY['user'::text, 'admin'::text])));
ALTER TABLE public.deposits ADD CONSTRAINT deposits_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])));
ALTER TABLE public.popup_ads ADD CONSTRAINT popup_ads_video_layout_check CHECK ((video_layout = ANY (ARRAY['auto'::text, 'landscape'::text, 'portrait'::text])));
ALTER TABLE public.provider_accounts ADD CONSTRAINT provider_accounts_last_verified_status_check CHECK ((last_verified_status = ANY (ARRAY['valid'::text, 'invalid'::text])));
ALTER TABLE public.subscription_requests ADD CONSTRAINT subscription_requests_plan_type_check CHECK ((plan_type = ANY (ARRAY['monthly'::text, 'lifetime'::text])));
ALTER TABLE public.subscription_requests ADD CONSTRAINT subscription_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])));
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_type_check CHECK ((plan_type = ANY (ARRAY['none'::text, 'monthly'::text, 'lifetime'::text])));
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check CHECK ((status = ANY (ARRAY['inactive'::text, 'active'::text, 'expired'::text, 'cancelled'::text])));
ALTER TABLE public.zapupi_deposits ADD CONSTRAINT zapupi_deposits_amount_inr_check CHECK ((amount_inr > (0)::numeric));
ALTER TABLE public.admin_audit_log ADD CONSTRAINT admin_audit_log_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.admin_audit_log ADD CONSTRAINT admin_audit_log_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.bundle_items ADD CONSTRAINT bundle_items_bundle_id_fkey FOREIGN KEY (bundle_id) REFERENCES engagement_bundles(id) ON DELETE CASCADE;
ALTER TABLE public.bundle_items ADD CONSTRAINT bundle_items_service_id_fkey FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL;
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE;
ALTER TABLE public.deposits ADD CONSTRAINT deposits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.engagement_bundles ADD CONSTRAINT engagement_bundles_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES providers(id);
ALTER TABLE public.engagement_order_items ADD CONSTRAINT engagement_order_items_engagement_order_id_fkey FOREIGN KEY (engagement_order_id) REFERENCES engagement_orders(id) ON DELETE CASCADE;
ALTER TABLE public.engagement_order_items ADD CONSTRAINT engagement_order_items_service_id_fkey FOREIGN KEY (service_id) REFERENCES services(id);
ALTER TABLE public.engagement_orders ADD CONSTRAINT engagement_orders_bundle_id_fkey FOREIGN KEY (bundle_id) REFERENCES engagement_bundles(id);
ALTER TABLE public.orders ADD CONSTRAINT orders_service_id_fkey FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.organic_run_schedule ADD CONSTRAINT organic_run_schedule_engagement_order_item_id_fkey FOREIGN KEY (engagement_order_item_id) REFERENCES engagement_order_items(id) ON DELETE CASCADE;
ALTER TABLE public.organic_run_schedule ADD CONSTRAINT organic_run_schedule_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE public.organic_run_schedule ADD CONSTRAINT organic_run_schedule_provider_account_id_fkey FOREIGN KEY (provider_account_id) REFERENCES provider_accounts(id);
ALTER TABLE public.oxapay_deposits ADD CONSTRAINT oxapay_deposits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.service_provider_mapping ADD CONSTRAINT service_provider_mapping_provider_account_id_fkey FOREIGN KEY (provider_account_id) REFERENCES provider_accounts(id) ON DELETE CASCADE;
ALTER TABLE public.service_provider_mapping ADD CONSTRAINT service_provider_mapping_service_id_fkey FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE;
ALTER TABLE public.services ADD CONSTRAINT services_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE;
ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;
ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.wallets ADD CONSTRAINT trg_enforce_wallet_credit_trail TRIGGER DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE public.wallets ADD CONSTRAINT wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.zapupi_deposits ADD CONSTRAINT zapupi_deposits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- INDEXES

CREATE INDEX IF NOT EXISTS idx_ors_item_id ON public.organic_run_schedule USING btree (engagement_order_item_id);
CREATE INDEX IF NOT EXISTS idx_ors_order_id ON public.organic_run_schedule USING btree (order_id) WHERE (order_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_ors_pending_scan_order ON public.organic_run_schedule USING btree (last_status_check NULLS FIRST, scheduled_at) WHERE (status = 'pending'::text);
CREATE INDEX IF NOT EXISTS idx_ors_pending_scheduled ON public.organic_run_schedule USING btree (scheduled_at) WHERE (status = 'pending'::text);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages USING btree (conversation_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_actor ON public.admin_audit_log USING btree (actor_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target ON public.admin_audit_log USING btree (target_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_status ON public.chat_conversations USING btree (status);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user ON public.chat_conversations USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON public.chat_conversations USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON public.chat_messages USING btree (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_deposits_user_status ON public.deposits USING btree (user_id, status);
CREATE INDEX IF NOT EXISTS idx_engagement_order_items_order_id ON public.engagement_order_items USING btree (engagement_order_id);
CREATE INDEX IF NOT EXISTS idx_engagement_order_items_status ON public.engagement_order_items USING btree (status);
CREATE INDEX IF NOT EXISTS idx_eoi_status ON public.engagement_order_items USING btree (status) WHERE (status = ANY (ARRAY['pending'::text, 'processing'::text]));
CREATE INDEX IF NOT EXISTS idx_engagement_orders_order_number ON public.engagement_orders USING btree (order_number);
CREATE INDEX IF NOT EXISTS idx_engagement_orders_status ON public.engagement_orders USING btree (status);
CREATE INDEX IF NOT EXISTS idx_engagement_orders_user_id_created ON public.engagement_orders USING btree (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_active_status ON public.orders USING btree (status, created_at DESC) WHERE (status = ANY (ARRAY['pending'::text, 'processing'::text]));
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders USING btree (status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id_created ON public.orders USING btree (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_organic_run_schedule_status_failed ON public.organic_run_schedule USING btree (status, retry_count) WHERE (status = 'failed'::text);
CREATE INDEX IF NOT EXISTS idx_organic_run_schedule_item_id ON public.organic_run_schedule USING btree (engagement_order_item_id) WHERE (engagement_order_item_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_organic_run_schedule_status_check ON public.organic_run_schedule USING btree (status, last_status_check);
CREATE INDEX IF NOT EXISTS idx_organic_run_schedule_status_scheduled ON public.organic_run_schedule USING btree (status, scheduled_at) WHERE (status = 'pending'::text);
CREATE INDEX IF NOT EXISTS idx_organic_run_schedule_status_started ON public.organic_run_schedule USING btree (status) WHERE (status = 'started'::text);
CREATE INDEX IF NOT EXISTS idx_organic_runs_item_id ON public.organic_run_schedule USING btree (engagement_order_item_id);
CREATE INDEX IF NOT EXISTS idx_organic_runs_order_id ON public.organic_run_schedule USING btree (order_id);
CREATE INDEX IF NOT EXISTS idx_organic_runs_started ON public.organic_run_schedule USING btree (status, provider_order_id) WHERE (status = 'started'::text);
CREATE INDEX IF NOT EXISTS idx_organic_runs_status_scheduled ON public.organic_run_schedule USING btree (status, scheduled_at) WHERE (status = ANY (ARRAY['pending'::text, 'failed'::text]));
CREATE INDEX IF NOT EXISTS idx_ors_failed_retry ON public.organic_run_schedule USING btree (completed_at) WHERE (status = 'failed'::text);
CREATE INDEX IF NOT EXISTS idx_ors_provider_started ON public.organic_run_schedule USING btree (provider_account_id, started_at DESC) WHERE (provider_order_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_ors_rotation_lock ON public.organic_run_schedule USING btree (rotation_lock_key) WHERE (rotation_lock_key IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_ors_status_provider_completed ON public.organic_run_schedule USING btree (status, completed_at DESC) WHERE (provider_account_id IS NOT NULL);
CREATE UNIQUE INDEX uniq_active_rotation_lock ON public.organic_run_schedule USING btree (rotation_lock_key) WHERE (rotation_lock_key IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_spm_service_active ON public.service_provider_mapping USING btree (service_id, is_active) WHERE (is_active = true);
CREATE INDEX IF NOT EXISTS idx_services_active_category ON public.services USING btree (category, is_active) WHERE (is_active = true);
CREATE INDEX IF NOT EXISTS idx_transactions_order ON public.transactions USING btree (order_id) WHERE (order_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON public.transactions USING btree (user_id, created_at DESC);
CREATE UNIQUE INDEX uniq_tx_zapupi_payment_ref ON public.transactions USING btree (payment_reference) WHERE ((payment_method = 'zapupi'::text) AND (payment_reference IS NOT NULL));
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets USING btree (user_id);
CREATE UNIQUE INDEX uniq_zapupi_deposits_txn_id ON public.zapupi_deposits USING btree (txn_id) WHERE (txn_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_zapupi_webhook_events_order ON public.zapupi_webhook_events USING btree (order_id);
CREATE INDEX IF NOT EXISTS idx_oxapay_webhook_order ON public.oxapay_webhook_events USING btree (order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ohalerts_ref ON public.order_health_alerts USING btree (order_kind, order_ref);
CREATE INDEX IF NOT EXISTS idx_ors_provider_status_completed ON public.organic_run_schedule USING btree (provider_account_id, status, completed_at DESC) WHERE (provider_account_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_ors_started_lastcheck ON public.organic_run_schedule USING btree (last_status_check NULLS FIRST) WHERE (status = 'started'::text);
CREATE INDEX IF NOT EXISTS idx_popup_ads_enabled ON public.popup_ads USING btree (enabled) WHERE (enabled = true);
CREATE INDEX IF NOT EXISTS idx_provider_accounts_active ON public.provider_accounts USING btree (provider_id, is_active) WHERE (is_active = true);
CREATE INDEX IF NOT EXISTS idx_rzp_webhook_events_payment ON public.razorpay_webhook_events USING btree (payment_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services USING btree (is_active) WHERE (is_active = true);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON public.support_tickets USING btree (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_deposits_completed ON public.transactions USING btree (user_id, created_at DESC) WHERE ((type = 'deposit'::text) AND (status = 'completed'::text));
CREATE UNIQUE INDEX idx_transactions_razorpay_auto_reference_uniq ON public.transactions USING btree (payment_reference) WHERE ((payment_method = 'razorpay_auto'::text) AND (payment_reference IS NOT NULL));
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_zapupi_deposits_status ON public.zapupi_deposits USING btree (status);
CREATE INDEX IF NOT EXISTS idx_zapupi_deposits_user ON public.zapupi_deposits USING btree (user_id);
CREATE UNIQUE INDEX uniq_zapupi_deposits_utr ON public.zapupi_deposits USING btree (utr) WHERE (utr IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_oxapay_deposits_status ON public.oxapay_deposits USING btree (status) WHERE (credited = false);
CREATE INDEX IF NOT EXISTS idx_oxapay_deposits_user ON public.oxapay_deposits USING btree (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ohalerts_open ON public.order_health_alerts USING btree (resolved, next_reminder_at) WHERE (resolved = false);

-- FUNCTIONS

CREATE OR REPLACE FUNCTION public.admin_set_user_ban(target_user_id uuid, ban boolean, reason text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF ban THEN
    UPDATE public.profiles
    SET is_banned = true,
        banned_reason = COALESCE(reason, 'Banned by admin'),
        banned_at = now(),
        updated_at = now()
    WHERE user_id = target_user_id;
  ELSE
    UPDATE public.profiles
    SET is_banned = false,
        banned_reason = NULL,
        banned_at = NULL,
        updated_at = now()
    WHERE user_id = target_user_id;
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cancel_pending_runs_on_item_cancel()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status IN ('cancelled','completed') AND COALESCE(OLD.status,'') NOT IN ('cancelled','completed') THEN
    PERFORM set_config('app.allow_run_edit','1',true);
    UPDATE public.organic_run_schedule rs
       SET status='cancelled',
           error_message = COALESCE(rs.error_message,'') ||
             CASE WHEN COALESCE(rs.error_message,'')='' THEN '' ELSE ' | ' END
             || 'Auto-cancelled (item ' || NEW.status || ')'
     WHERE rs.status='pending'
       AND rs.engagement_order_item_id = NEW.id;
    PERFORM set_config('app.allow_run_edit','0',true);
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_public_markup()
 RETURNS numeric
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE((SELECT global_markup_percent FROM public.platform_settings LIMIT 1), 0)::numeric
$function$
;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$function$
;

CREATE OR REPLACE FUNCTION public.cancel_pending_runs_on_eo_cancel()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'cancelled' AND COALESCE(OLD.status,'') <> 'cancelled' THEN
    PERFORM set_config('app.allow_run_edit','1',true);
    UPDATE public.organic_run_schedule rs
       SET status='cancelled',
           error_message = COALESCE(rs.error_message,'') ||
             CASE WHEN COALESCE(rs.error_message,'')='' THEN '' ELSE ' | ' END
             || 'Auto-cancelled (parent order cancelled)'
     WHERE rs.status='pending'
       AND rs.engagement_order_item_id IN (
         SELECT id FROM public.engagement_order_items WHERE engagement_order_id = NEW.id
       );
    PERFORM set_config('app.allow_run_edit','0',true);
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_adjust_wallet(p_target_user_id uuid, p_action text, p_usd numeric, p_inr numeric, p_notes text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_balance numeric;
  v_deposited numeric;
  v_spent numeric;
  v_new_balance numeric;
  v_new_deposited numeric;
  v_is_add boolean := (p_action = 'add');
  v_amount numeric;
BEGIN
  IF p_action NOT IN ('add','subtract') THEN
    RAISE EXCEPTION 'invalid action';
  END IF;
  IF p_usd IS NULL OR p_usd <= 0 THEN
    RAISE EXCEPTION 'invalid amount';
  END IF;

  v_amount := trunc(p_usd::numeric, 4);

  SELECT balance, total_deposited, total_spent
    INTO v_balance, v_deposited, v_spent
  FROM public.wallets WHERE user_id = p_target_user_id FOR UPDATE;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'wallet not found';
  END IF;

  IF v_is_add THEN
    v_new_balance := trunc(v_balance + v_amount, 4);
    v_new_deposited := trunc(COALESCE(v_deposited,0) + v_amount, 4);
  ELSE
    v_new_balance := trunc(v_balance - v_amount, 4);
    IF v_new_balance < 0 THEN
      RAISE EXCEPTION 'balance cannot be negative';
    END IF;
    v_new_deposited := v_deposited;
  END IF;

  -- Insert transaction FIRST so its xmin matches the wallet update xmin in this same tx
  INSERT INTO public.transactions (
    user_id, type, amount, balance_after, description, status, payment_method
  ) VALUES (
    p_target_user_id,
    CASE WHEN v_is_add THEN 'deposit' ELSE 'refund' END,
    CASE WHEN v_is_add THEN v_amount ELSE -v_amount END,
    v_new_balance,
    (CASE WHEN v_is_add THEN 'Admin manual credit' ELSE 'Admin withdrawal' END)
      || ' — ₹' || trim(to_char(p_inr,'FM9999999990D00'))
      || CASE WHEN p_notes IS NOT NULL AND p_notes <> '' THEN ' — ' || p_notes ELSE '' END,
    'completed',
    CASE WHEN v_is_add THEN 'manual_admin' ELSE NULL END
  );

  UPDATE public.wallets
     SET balance = v_new_balance,
         total_deposited = v_new_deposited,
         updated_at = now()
   WHERE user_id = p_target_user_id;

  RETURN json_build_object('success', true, 'new_balance', v_new_balance);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.compute_rotation_lock_key()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_link text;
  v_type text;
BEGIN
  -- Only lock when run is actively held at a provider
  IF NEW.status = 'started'
     AND NEW.provider_order_id IS NOT NULL
     AND NEW.provider_account_id IS NOT NULL
     AND NEW.engagement_order_item_id IS NOT NULL THEN

    SELECT lower(btrim(eo.link)), lower(btrim(eoi.engagement_type))
      INTO v_link, v_type
    FROM public.engagement_order_items eoi
    JOIN public.engagement_orders eo ON eo.id = eoi.engagement_order_id
    WHERE eoi.id = NEW.engagement_order_item_id;

    IF v_link IS NOT NULL AND v_type IS NOT NULL AND v_link <> '' AND v_type <> '' THEN
      NEW.rotation_lock_key := v_link || '||' || v_type || '||' || NEW.provider_account_id::text;
    ELSE
      NEW.rotation_lock_key := NULL;
    END IF;
  ELSE
    NEW.rotation_lock_key := NULL;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_user_subscription()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan_type, status)
  VALUES (NEW.id, 'none', 'inactive')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.enforce_transaction_provenance()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_user IN ('postgres','supabase_admin','service_role') THEN
    RETURN NEW;
  END IF;

  IF NEW.type = 'deposit' THEN
    IF NEW.payment_method IS NULL
       OR NEW.payment_method NOT IN ('zapupi','oxapay','razorpay','manual_admin') THEN
      RAISE EXCEPTION 'Invalid deposit source: %', COALESCE(NEW.payment_method,'null');
    END IF;
  END IF;

  RETURN NEW;
END $function$
;

CREATE OR REPLACE FUNCTION public.enforce_wallet_credit_trail()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_balance_increase numeric := COALESCE(NEW.balance,0) - COALESCE(OLD.balance,0);
  v_deposit_increase numeric := COALESCE(NEW.total_deposited,0) - COALESCE(OLD.total_deposited,0);
  v_my_xmin xid;
  v_has_tx boolean := false;
  v_has_deposit boolean := false;
BEGIN
  IF v_balance_increase <= 0 AND v_deposit_increase <= 0 THEN
    RETURN NEW;  -- decrements/no-ops always allowed
  END IF;

  -- xmin of just-updated wallet row == current transaction xid
  SELECT xmin INTO v_my_xmin FROM public.wallets WHERE id = NEW.id;

  IF v_balance_increase > 0 THEN
    SELECT EXISTS (
      SELECT 1 FROM public.transactions t
       WHERE t.user_id = NEW.user_id
         AND t.xmin = v_my_xmin
    ) INTO v_has_tx;
    IF NOT v_has_tx THEN
      RAISE EXCEPTION 'wallet balance increase without matching transactions row (credit trail violation)';
    END IF;
  END IF;

  IF v_deposit_increase > 0 THEN
    SELECT EXISTS (
      SELECT 1 FROM public.transactions t
       WHERE t.user_id = NEW.user_id
         AND t.xmin   = v_my_xmin
         AND t.type   = 'deposit'
         AND t.status = 'completed'
    ) INTO v_has_deposit;
    IF NOT v_has_deposit THEN
      RAISE EXCEPTION 'total_deposited increase without matching deposit transaction (provenance violation)';
    END IF;
  END IF;

  RETURN NEW;
END
$function$
;

CREATE OR REPLACE FUNCTION public.engagement_order_items_lock_user_columns()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_is_admin boolean := false;
BEGIN
  IF v_uid IS NULL THEN RETURN NEW; END IF;
  SELECT public.has_role(v_uid, 'admin'::app_role) INTO v_is_admin;
  IF v_is_admin THEN RETURN NEW; END IF;

  NEW.engagement_order_id := OLD.engagement_order_id;
  NEW.engagement_type     := OLD.engagement_type;
  NEW.service_id          := OLD.service_id;
  NEW.quantity            := OLD.quantity;
  NEW.price               := OLD.price;
  NEW.created_at          := OLD.created_at;
  NEW.start_count         := OLD.start_count;
  NEW.start_count_captured_at := OLD.start_count_captured_at;

  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status NOT IN ('paused','processing','cancelled') THEN
    NEW.status := OLD.status;
  END IF;

  RETURN NEW;
END $function$
;

CREATE OR REPLACE FUNCTION public.engagement_orders_lock_user_columns()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_is_admin boolean := false;
BEGIN
  IF v_uid IS NULL THEN RETURN NEW; END IF;
  SELECT public.has_role(v_uid, 'admin'::app_role) INTO v_is_admin;
  IF v_is_admin THEN RETURN NEW; END IF;

  -- Regular user: lock EVERY financial / ownership / metadata field
  NEW.user_id        := OLD.user_id;
  NEW.bundle_id      := OLD.bundle_id;
  NEW.link           := OLD.link;
  NEW.total_price    := OLD.total_price;
  NEW.base_quantity  := OLD.base_quantity;
  NEW.is_organic_mode:= OLD.is_organic_mode;
  NEW.order_number   := OLD.order_number;
  NEW.created_at     := OLD.created_at;
  NEW.completed_at   := OLD.completed_at;

  -- Status: only allow paused/processing/cancelled (extra belt-and-braces with the RLS WITH CHECK)
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status NOT IN ('paused','processing','cancelled') THEN
    NEW.status := OLD.status;
  END IF;

  RETURN NEW;
END $function$
;

CREATE OR REPLACE FUNCTION public.get_user_engagement_orders_summary(p_limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, order_number bigint, status text, total_price numeric, link text, base_quantity integer, created_at timestamp with time zone, updated_at timestamp with time zone, is_organic_mode boolean, next_run_at timestamp with time zone, items jsonb)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH my_orders AS (
    SELECT eo.*
    FROM public.engagement_orders eo
    WHERE eo.user_id = auth.uid()
    ORDER BY eo.created_at DESC
    LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 200))
  ),
  run_agg AS (
    SELECT
      r.engagement_order_item_id AS item_id,
      COUNT(*) FILTER (
        WHERE r.status <> 'cancelled'
           OR (r.status = 'cancelled' AND lower(coalesce(r.error_message,'')) LIKE 'target met%')
      )::int AS total_runs,
      COUNT(*) FILTER (
        WHERE r.status = 'completed'
           OR (r.status = 'cancelled' AND lower(coalesce(r.error_message,'')) LIKE 'target met%')
      )::int AS completed_runs,
      COUNT(*) FILTER (WHERE r.status = 'started')::int AS started_runs,
      COUNT(*) FILTER (WHERE r.status = 'pending')::int AS pending_runs,
      MIN(r.scheduled_at) FILTER (WHERE r.status = 'pending') AS next_run_at,
      COALESCE(SUM(
        CASE
          WHEN r.status = 'cancelled'
               AND lower(coalesce(r.error_message,'')) LIKE 'target met%'
            THEN r.quantity_to_send
          WHEN lower(coalesce(r.provider_status,'')) IN ('completed','complete')
            THEN r.quantity_to_send
          WHEN r.provider_remains IS NOT NULL
            THEN GREATEST(0, r.quantity_to_send - r.provider_remains)
          WHEN r.status = 'completed'
            THEN r.quantity_to_send
          ELSE 0
        END
      ), 0)::int AS delivered_qty
    FROM public.organic_run_schedule r
    WHERE r.engagement_order_item_id IN (
      SELECT eoi.id FROM public.engagement_order_items eoi
      JOIN my_orders o ON o.id = eoi.engagement_order_id
    )
    GROUP BY r.engagement_order_item_id
  ),
  item_rows AS (
    SELECT
      eoi.id,
      eoi.engagement_order_id,
      eoi.engagement_type,
      eoi.quantity,
      eoi.status,
      COALESCE(ra.total_runs, 0)     AS total_runs,
      COALESCE(ra.completed_runs, 0) AS completed_runs,
      COALESCE(ra.started_runs, 0)   AS started_runs,
      COALESCE(ra.pending_runs, 0)   AS pending_runs,
      COALESCE(ra.delivered_qty, 0)  AS delivered_qty,
      ra.next_run_at
    FROM public.engagement_order_items eoi
    JOIN my_orders o ON o.id = eoi.engagement_order_id
    LEFT JOIN run_agg ra ON ra.item_id = eoi.id
  )
  SELECT
    o.id,
    o.order_number,
    o.status,
    o.total_price,
    o.link,
    o.base_quantity,
    o.created_at,
    o.updated_at,
    o.is_organic_mode,
    (SELECT MIN(ir.next_run_at) FROM item_rows ir WHERE ir.engagement_order_id = o.id) AS next_run_at,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
          'id', ir.id,
          'engagement_type', ir.engagement_type,
          'quantity', ir.quantity,
          'status', ir.status,
          'total_runs', ir.total_runs,
          'completed_runs', ir.completed_runs,
          'started_runs', ir.started_runs,
          'pending_runs', ir.pending_runs,
          'delivered_qty', ir.delivered_qty,
          'next_run_at', ir.next_run_at
        ))
       FROM item_rows ir WHERE ir.engagement_order_id = o.id),
      '[]'::jsonb
    ) AS items
  FROM my_orders o
  ORDER BY o.created_at DESC;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_engagement_orders_summary(p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, order_number bigint, status text, total_price numeric, link text, base_quantity integer, created_at timestamp with time zone, updated_at timestamp with time zone, is_organic_mode boolean, next_run_at timestamp with time zone, items jsonb)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH my_orders AS (
    SELECT eo.*
    FROM public.engagement_orders eo
    WHERE eo.user_id = auth.uid()
    ORDER BY eo.created_at DESC
    LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 200))
    OFFSET GREATEST(0, COALESCE(p_offset, 0))
  ),
  run_agg AS (
    SELECT
      r.engagement_order_item_id AS item_id,
      COUNT(*) FILTER (
        WHERE r.status <> 'cancelled'
           OR (r.status = 'cancelled' AND lower(coalesce(r.error_message,'')) LIKE 'target met%')
      )::int AS total_runs,
      COUNT(*) FILTER (
        WHERE r.status = 'completed'
           OR (r.status = 'cancelled' AND lower(coalesce(r.error_message,'')) LIKE 'target met%')
      )::int AS completed_runs,
      COUNT(*) FILTER (WHERE r.status = 'started')::int AS started_runs,
      COUNT(*) FILTER (WHERE r.status = 'pending')::int AS pending_runs,
      MIN(r.scheduled_at) FILTER (WHERE r.status = 'pending') AS next_run_at,
      COALESCE(SUM(
        CASE
          WHEN r.status = 'cancelled'
               AND lower(coalesce(r.error_message,'')) LIKE 'target met%'
            THEN r.quantity_to_send
          WHEN lower(coalesce(r.provider_status,'')) IN ('completed','complete')
            THEN r.quantity_to_send
          WHEN r.provider_remains IS NOT NULL
            THEN GREATEST(0, r.quantity_to_send - r.provider_remains)
          WHEN r.status = 'completed'
            THEN r.quantity_to_send
          ELSE 0
        END
      ), 0)::int AS delivered_qty
    FROM public.organic_run_schedule r
    WHERE r.engagement_order_item_id IN (
      SELECT eoi.id FROM public.engagement_order_items eoi
      JOIN my_orders o ON o.id = eoi.engagement_order_id
    )
    GROUP BY r.engagement_order_item_id
  ),
  item_rows AS (
    SELECT
      eoi.id,
      eoi.engagement_order_id,
      eoi.engagement_type,
      eoi.quantity,
      eoi.status,
      COALESCE(ra.total_runs, 0)     AS total_runs,
      COALESCE(ra.completed_runs, 0) AS completed_runs,
      COALESCE(ra.started_runs, 0)   AS started_runs,
      COALESCE(ra.pending_runs, 0)   AS pending_runs,
      COALESCE(ra.delivered_qty, 0)  AS delivered_qty,
      ra.next_run_at
    FROM public.engagement_order_items eoi
    JOIN my_orders o ON o.id = eoi.engagement_order_id
    LEFT JOIN run_agg ra ON ra.item_id = eoi.id
  )
  SELECT
    o.id,
    o.order_number,
    o.status,
    o.total_price,
    o.link,
    o.base_quantity,
    o.created_at,
    o.updated_at,
    o.is_organic_mode,
    (SELECT MIN(ir.next_run_at) FROM item_rows ir WHERE ir.engagement_order_id = o.id) AS next_run_at,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
          'id', ir.id,
          'engagement_type', ir.engagement_type,
          'quantity', ir.quantity,
          'status', ir.status,
          'total_runs', ir.total_runs,
          'completed_runs', ir.completed_runs,
          'started_runs', ir.started_runs,
          'pending_runs', ir.pending_runs,
          'delivered_qty', ir.delivered_qty,
          'next_run_at', ir.next_run_at
        ))
       FROM item_rows ir WHERE ir.engagement_order_id = o.id),
      '[]'::jsonb
    ) AS items
  FROM my_orders o
  ORDER BY o.created_at DESC;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$function$
;

CREATE OR REPLACE FUNCTION public.guard_oxapay_deposit_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_user IN ('postgres','supabase_admin','service_role') THEN
    RETURN NEW;
  END IF;

  IF NEW.credited IS DISTINCT FROM OLD.credited AND NEW.credited THEN
    RAISE EXCEPTION 'Forbidden: only backend can mark oxapay credited';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     AND lower(NEW.status) IN ('paid','confirmed','completed','success') THEN
    RAISE EXCEPTION 'Forbidden: only backend can promote oxapay status';
  END IF;

  RETURN NEW;
END $function$
;

CREATE OR REPLACE FUNCTION public.guard_provider_config_is_active()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_actor          text := current_setting('request.jwt.claim.email', true);
  v_role           text := current_setting('request.jwt.claim.role', true);
  v_app_name       text := current_setting('application_name', true);
  v_is_admin_call  boolean := false;
BEGIN
  -- Only care about is_active transitions
  IF TG_OP <> 'UPDATE' OR NEW.is_active IS NOT DISTINCT FROM OLD.is_active THEN
    RETURN NEW;
  END IF;

  -- Admin panel calls carry a JWT (authenticated role). Cron / edge function
  -- service_role calls do NOT. Treat authenticated role as admin-intent.
  v_is_admin_call := COALESCE(v_role, '') = 'authenticated';

  -- Block automated true->false flips on service_provider_mapping.
  -- This is the exact path that was silently resetting the admin's bundle
  -- selection. Manual admin toggles (authenticated JWT) still work.
  IF TG_TABLE_NAME = 'service_provider_mapping'
     AND OLD.is_active = true
     AND NEW.is_active = false
     AND NOT v_is_admin_call
  THEN
    -- Log and ignore the flip.
    BEGIN
      INSERT INTO public.admin_audit_log (action, notes, metadata, created_at)
      VALUES (
        'mapping_auto_disable_blocked',
        format('Blocked auto-disable of service_provider_mapping %s (service=%s, account=%s). Kept ACTIVE.',
               OLD.id, OLD.service_id, OLD.provider_account_id),
        jsonb_build_object(
          'table', TG_TABLE_NAME,
          'mapping_id', OLD.id,
          'service_id', OLD.service_id,
          'provider_account_id', OLD.provider_account_id,
          'provider_service_id', OLD.provider_service_id,
          'jwt_role', v_role,
          'jwt_email', v_actor,
          'application_name', v_app_name
        ),
        now()
      );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    NEW.is_active := true;   -- overrule automated disable
    RETURN NEW;
  END IF;

  -- All other is_active transitions: just record for traceability.
  BEGIN
    INSERT INTO public.admin_audit_log (action, notes, metadata, created_at)
    VALUES (
      CASE
        WHEN TG_TABLE_NAME = 'provider_accounts' AND NEW.is_active = false THEN 'provider_account_disabled'
        WHEN TG_TABLE_NAME = 'provider_accounts' AND NEW.is_active = true  THEN 'provider_account_enabled'
        WHEN TG_TABLE_NAME = 'service_provider_mapping' AND NEW.is_active = false THEN 'mapping_disabled_by_admin'
        ELSE 'mapping_enabled'
      END,
      format('%s.is_active %s -> %s (row=%s)',
             TG_TABLE_NAME, OLD.is_active, NEW.is_active, OLD.id),
      jsonb_build_object(
        'table', TG_TABLE_NAME,
        'row_id', OLD.id,
        'old_is_active', OLD.is_active,
        'new_is_active', NEW.is_active,
        'jwt_role', v_role,
        'jwt_email', v_actor,
        'application_name', v_app_name
      ),
      now()
    );
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.guard_zapupi_deposit_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_user IN ('postgres','supabase_admin','service_role') THEN
    RETURN NEW;
  END IF;

  IF NEW.credited IS DISTINCT FROM OLD.credited AND NEW.credited THEN
    RAISE EXCEPTION 'Forbidden: only backend can mark zapupi credited';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     AND lower(NEW.status) IN ('paid','confirmed','completed','success') THEN
    RAISE EXCEPTION 'Forbidden: only backend can promote zapupi status';
  END IF;

  IF NEW.amount_inr IS DISTINCT FROM OLD.amount_inr
     OR NEW.amount_usd IS DISTINCT FROM OLD.amount_usd THEN
    RAISE EXCEPTION 'Forbidden: deposit amount is immutable';
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Forbidden: deposit user_id is immutable';
  END IF;

  RETURN NEW;
END $function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.wallets (user_id, balance, total_deposited, total_spent)
  VALUES (NEW.id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_maintenance_mode()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE((SELECT maintenance_mode FROM public.platform_settings LIMIT 1), false)
$function$
;

CREATE OR REPLACE FUNCTION public.organic_run_schedule_lock_user_columns()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_is_admin boolean := false;
  v_bypass text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN NEW;
  END IF;

  BEGIN
    v_bypass := current_setting('app.allow_run_edit', true);
  EXCEPTION WHEN OTHERS THEN
    v_bypass := NULL;
  END;
  IF v_bypass = '1' THEN
    RETURN NEW;
  END IF;

  SELECT public.has_role(v_uid, 'admin'::app_role) INTO v_is_admin;
  IF v_is_admin THEN
    RETURN NEW;
  END IF;

  -- Regular user: revert all provider/internal columns
  NEW.order_id                 := OLD.order_id;
  NEW.engagement_order_item_id := OLD.engagement_order_item_id;
  NEW.run_number               := OLD.run_number;
  NEW.peak_multiplier          := OLD.peak_multiplier;
  NEW.provider_order_id        := OLD.provider_order_id;
  NEW.provider_response        := OLD.provider_response;
  NEW.error_message            := OLD.error_message;
  NEW.started_at               := OLD.started_at;
  NEW.completed_at             := OLD.completed_at;
  NEW.provider_start_count     := OLD.provider_start_count;
  NEW.provider_remains         := OLD.provider_remains;
  NEW.provider_status          := OLD.provider_status;
  NEW.provider_charge          := OLD.provider_charge;
  NEW.last_status_check        := OLD.last_status_check;
  NEW.retry_count              := OLD.retry_count;
  NEW.provider_account_id      := OLD.provider_account_id;
  NEW.provider_account_name    := OLD.provider_account_name;
  NEW.created_at               := OLD.created_at;

  -- Lock sensitive scheduling/quantity fields — must go through reschedule RPC
  NEW.scheduled_at     := OLD.scheduled_at;
  NEW.quantity_to_send := OLD.quantity_to_send;
  NEW.base_quantity    := OLD.base_quantity;
  NEW.variance_applied := OLD.variance_applied;

  -- Status: only allow change to 'cancelled'
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'cancelled' THEN
    NEW.status := OLD.status;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.pg_advisory_xact_lock(key bigint)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT pg_catalog.pg_advisory_xact_lock(key);
$function$
;

CREATE OR REPLACE FUNCTION public.profiles_block_privileged_updates()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role text := current_setting('request.jwt.claim.role', true);
  v_is_admin boolean := false;
BEGIN
  -- service_role / postgres bypass entirely
  IF v_role = 'service_role' OR session_user IN ('postgres','supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NOT NULL THEN
    v_is_admin := public.has_role(auth.uid(), 'admin'::app_role);
  END IF;

  IF v_is_admin THEN
    RETURN NEW;
  END IF;

  -- Non-admin: restore protected columns to OLD values
  IF NEW.is_banned IS DISTINCT FROM OLD.is_banned THEN
    NEW.is_banned := OLD.is_banned;
  END IF;
  IF NEW.api_key IS DISTINCT FROM OLD.api_key THEN
    NEW.api_key := OLD.api_key;
  END IF;
  IF NEW.telegram_id IS DISTINCT FROM OLD.telegram_id THEN
    NEW.telegram_id := OLD.telegram_id;
  END IF;
  IF NEW.organic_ratios IS DISTINCT FROM OLD.organic_ratios THEN
    NEW.organic_ratios := OLD.organic_ratios;
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    NEW.user_id := OLD.user_id;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_old_completed_engagement_orders()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  deleted_runs INT := 0;
  deleted_items INT := 0;
  deleted_orders INT := 0;
  deleted_stale_runs INT := 0;
BEGIN
  WITH target_orders AS (
    SELECT id FROM public.engagement_orders
    WHERE status IN ('completed','cancelled','failed','partial')
      AND COALESCE(completed_at, created_at) < now() - interval '1 day'
  ),
  target_items AS (
    SELECT eoi.id FROM public.engagement_order_items eoi
    JOIN target_orders t ON t.id = eoi.engagement_order_id
  ),
  del_runs AS (
    DELETE FROM public.organic_run_schedule
    WHERE engagement_order_item_id IN (SELECT id FROM target_items)
    RETURNING 1
  )
  SELECT count(*) INTO deleted_runs FROM del_runs;

  WITH target_orders AS (
    SELECT id FROM public.engagement_orders
    WHERE status IN ('completed','cancelled','failed','partial')
      AND COALESCE(completed_at, created_at) < now() - interval '1 day'
  ),
  del_items AS (
    DELETE FROM public.engagement_order_items
    WHERE engagement_order_id IN (SELECT id FROM target_orders)
    RETURNING 1
  )
  SELECT count(*) INTO deleted_items FROM del_items;

  WITH del_orders AS (
    DELETE FROM public.engagement_orders
    WHERE status IN ('completed','cancelled','failed','partial')
      AND COALESCE(completed_at, created_at) < now() - interval '1 day'
    RETURNING 1
  )
  SELECT count(*) INTO deleted_orders FROM del_orders;

  WITH del_stale AS (
    DELETE FROM public.organic_run_schedule rs
    WHERE rs.status = 'pending'
      AND rs.engagement_order_item_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.engagement_order_items eoi
        JOIN public.engagement_orders eo ON eo.id = eoi.engagement_order_id
        WHERE eoi.id = rs.engagement_order_item_id
          AND (eoi.status IN ('paused','cancelled') OR eo.status IN ('paused','cancelled'))
      )
    RETURNING 1
  )
  SELECT count(*) INTO deleted_stale_runs FROM del_stale;

  RETURN json_build_object(
    'deleted_runs', deleted_runs,
    'deleted_items', deleted_items,
    'deleted_orders', deleted_orders,
    'deleted_stale_runs', deleted_stale_runs,
    'ran_at', now()
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.reschedule_organic_run(p_run_id uuid, p_quantity integer, p_scheduled_at timestamp with time zone)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_run record;
  v_order_price numeric;
  v_order_quantity integer;
  v_price_per_thousand numeric := 0;
  v_qty_diff integer;
  v_extra_cost numeric := 0;
  v_balance numeric;
  v_spent numeric;
  v_new_balance numeric;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 OR p_quantity > 1000000 THEN
    RAISE EXCEPTION 'Invalid quantity';
  END IF;

  IF p_scheduled_at IS NULL THEN
    RAISE EXCEPTION 'Scheduled time required';
  END IF;

  SELECT
    rs.id,
    rs.order_id,
    rs.engagement_order_item_id,
    rs.run_number,
    rs.status,
    rs.quantity_to_send,
    rs.base_quantity,
    o.user_id AS order_user_id,
    o.price AS order_price,
    o.quantity AS order_quantity,
    eo.user_id AS engagement_order_user_id,
    s.price AS service_price
  INTO v_run
  FROM public.organic_run_schedule rs
  LEFT JOIN public.orders o
    ON o.id = rs.order_id
  LEFT JOIN public.engagement_order_items eoi
    ON eoi.id = rs.engagement_order_item_id
  LEFT JOIN public.engagement_orders eo
    ON eo.id = eoi.engagement_order_id
  LEFT JOIN public.services s
    ON s.id = eoi.service_id
  WHERE rs.id = p_run_id
    AND (
      o.user_id = v_uid
      OR eo.user_id = v_uid
    )
  FOR UPDATE OF rs;

  IF v_run IS NULL THEN
    RAISE EXCEPTION 'Run not found or not owned by you';
  END IF;

  IF v_run.status <> 'pending' THEN
    RAISE EXCEPTION 'Only pending runs can be rescheduled';
  END IF;

  IF v_run.order_id IS NOT NULL THEN
    v_order_price := COALESCE(v_run.order_price, 0);
    v_order_quantity := COALESCE(v_run.order_quantity, 0);

    IF v_order_quantity > 0 THEN
      v_price_per_thousand := (v_order_price::numeric / v_order_quantity::numeric) * 1000;
    END IF;
  ELSIF v_run.engagement_order_item_id IS NOT NULL THEN
    v_price_per_thousand := COALESCE(v_run.service_price, 0);
  END IF;

  v_qty_diff := p_quantity - v_run.quantity_to_send;

  IF v_qty_diff > 0 AND v_price_per_thousand > 0 THEN
    v_extra_cost := trunc((v_qty_diff::numeric / 1000.0) * v_price_per_thousand, 4);
  END IF;

  IF v_extra_cost > 0 THEN
    SELECT balance, total_spent
      INTO v_balance, v_spent
    FROM public.wallets
    WHERE user_id = v_uid
    FOR UPDATE;

    IF v_balance IS NULL THEN
      RAISE EXCEPTION 'Wallet not found';
    END IF;

    IF v_balance < v_extra_cost THEN
      RAISE EXCEPTION 'Insufficient balance';
    END IF;

    v_new_balance := trunc(v_balance - v_extra_cost, 4);

    UPDATE public.wallets
       SET balance = v_new_balance,
           total_spent = trunc(COALESCE(v_spent, 0) + v_extra_cost, 4)
     WHERE user_id = v_uid;

    INSERT INTO public.transactions (
      user_id,
      type,
      amount,
      balance_after,
      status,
      payment_method,
      order_id,
      description
    )
    VALUES (
      v_uid,
      'order',
      -v_extra_cost,
      v_new_balance,
      'completed',
      'wallet',
      v_run.order_id,
      'Reschedule run #' || COALESCE(v_run.run_number::text, '?') || ' (+' || v_qty_diff || ' units)'
    );
  END IF;

  PERFORM set_config('app.allow_run_edit', '1', true);

  UPDATE public.organic_run_schedule
     SET quantity_to_send = p_quantity,
         base_quantity = p_quantity,
         scheduled_at = p_scheduled_at,
         variance_applied = 0
   WHERE id = p_run_id
     AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Run could not be updated';
  END IF;

  PERFORM set_config('app.allow_run_edit', '0', true);

  RETURN json_build_object(
    'success', true,
    'extra_charged', v_extra_cost,
    'new_balance', COALESCE(v_new_balance, v_balance, NULL),
    'quantity', p_quantity,
    'scheduled_at', p_scheduled_at
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_engagement_order_completed_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status IN ('completed','cancelled','failed','partial')
     AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    NEW.completed_at = COALESCE(NEW.completed_at, now());
  ELSIF NEW.status NOT IN ('completed','cancelled','failed','partial') THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.chat_conversations
  SET last_message_at = NEW.created_at, updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cancel_order_with_refund(p_order_id uuid, p_actor uuid, p_is_admin boolean)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_order public.orders;
  v_refund numeric := 0;
  v_refund_qty integer := 0;
  v_pending_qty integer := 0;
  v_balance numeric;
  v_spent numeric;
  v_new_balance numeric;
BEGIN
  IF p_order_id IS NULL OR p_actor IS NULL THEN
    RAISE EXCEPTION 'order_id and actor required';
  END IF;

  -- Lock the order row so concurrent cancel calls serialize
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Authorization
  IF NOT p_is_admin AND v_order.user_id <> p_actor THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Idempotent: if already cancelled, do nothing (no double refund)
  IF v_order.status = 'cancelled' THEN
    RETURN json_build_object('success', true, 'already_cancelled', true, 'refund_amount', 0);
  END IF;

  IF v_order.is_organic_mode THEN
    -- Cancel only currently-pending runs and compute proportional refund
    PERFORM set_config('app.allow_run_edit','1',true);

    SELECT COALESCE(SUM(quantity_to_send),0) INTO v_pending_qty
      FROM public.organic_run_schedule
     WHERE order_id = v_order.id AND status = 'pending';

    UPDATE public.organic_run_schedule
       SET status = 'cancelled'
     WHERE order_id = v_order.id AND status = 'pending';

    PERFORM set_config('app.allow_run_edit','0',true);

    v_refund_qty := v_pending_qty;
    IF v_pending_qty > 0 AND v_order.quantity > 0 THEN
      v_refund := trunc((v_pending_qty::numeric / v_order.quantity::numeric) * v_order.price::numeric, 4);
    END IF;
  ELSE
    -- Refund only if order was strictly pending (not yet sent to provider)
    IF v_order.status = 'pending' THEN
      v_refund := trunc(v_order.price::numeric, 4);
      v_refund_qty := v_order.quantity;
    END IF;
  END IF;

  -- Flip order status while still holding the lock
  UPDATE public.orders SET status = 'cancelled', updated_at = now() WHERE id = v_order.id;

  -- Atomic wallet credit + transaction insert
  IF v_refund > 0 THEN
    SELECT balance, total_spent INTO v_balance, v_spent
      FROM public.wallets WHERE user_id = v_order.user_id FOR UPDATE;

    IF v_balance IS NULL THEN
      RAISE EXCEPTION 'Wallet not found for refund';
    END IF;

    v_new_balance := trunc(COALESCE(v_balance,0) + v_refund, 4);

    UPDATE public.wallets
       SET balance = v_new_balance,
           total_spent = GREATEST(0, trunc(COALESCE(v_spent,0) - v_refund, 4)),
           updated_at = now()
     WHERE user_id = v_order.user_id;

    INSERT INTO public.transactions (
      user_id, type, amount, balance_after, order_id, description, status
    ) VALUES (
      v_order.user_id, 'refund', v_refund, v_new_balance, v_order.id,
      'Refund for cancelled order #' || v_order.order_number, 'completed'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'refund_amount', v_refund,
    'refunded_quantity', v_refund_qty,
    'new_balance', v_new_balance
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.credit_wallet_zapupi(p_order_id text, p_txn_id text DEFAULT NULL::text, p_utr text DEFAULT NULL::text, p_gateway_response jsonb DEFAULT NULL::jsonb)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_lock_key bigint;
  v_dep record;
  v_balance numeric;
  v_deposited numeric;
  v_new_balance numeric;
  v_credit_usd numeric;
  v_rate numeric := 83.5;
BEGIN
  IF COALESCE(btrim(p_order_id),'') = '' THEN
    RAISE EXCEPTION 'order_id required';
  END IF;

  v_lock_key := abs(hashtextextended(p_order_id, 0));
  PERFORM pg_advisory_xact_lock(v_lock_key);

  SELECT * INTO v_dep FROM public.zapupi_deposits WHERE order_id = p_order_id FOR UPDATE;

  IF v_dep.id IS NULL THEN
    RAISE EXCEPTION 'Deposit order not found';
  END IF;

  IF v_dep.credited THEN
    SELECT balance INTO v_balance FROM public.wallets WHERE user_id = v_dep.user_id;
    RETURN json_build_object('credited', false, 'duplicate', true, 'new_balance', COALESCE(v_balance,0));
  END IF;

  v_credit_usd := trunc((v_dep.amount_inr::numeric / v_rate)::numeric, 4);
  IF v_credit_usd <= 0 THEN
    RAISE EXCEPTION 'invalid credit amount';
  END IF;

  INSERT INTO public.wallets (user_id, balance, total_deposited, total_spent)
  VALUES (v_dep.user_id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT balance, total_deposited INTO v_balance, v_deposited
  FROM public.wallets WHERE user_id = v_dep.user_id FOR UPDATE;

  v_new_balance := trunc(COALESCE(v_balance,0) + v_credit_usd, 4);

  UPDATE public.wallets
     SET balance = v_new_balance,
         total_deposited = trunc(COALESCE(v_deposited,0) + v_credit_usd, 4),
         updated_at = now()
   WHERE user_id = v_dep.user_id;

  INSERT INTO public.transactions (
    user_id, type, amount, balance_after, status,
    payment_method, payment_reference, description
  ) VALUES (
    v_dep.user_id, 'deposit', v_credit_usd, v_new_balance, 'completed',
    'zapupi', p_order_id,
    'Wallet top-up via ZapUPI (₹' || trim(to_char(v_dep.amount_inr,'FM9999999990D00')) || ')'
  );

  UPDATE public.zapupi_deposits
     SET status = 'success',
         credited = true,
         amount_usd = v_credit_usd,
         txn_id = COALESCE(p_txn_id, txn_id),
         utr = COALESCE(p_utr, utr),
         gateway_response = COALESCE(p_gateway_response, gateway_response),
         updated_at = now()
   WHERE id = v_dep.id;

  RETURN json_build_object(
    'credited', true,
    'duplicate', false,
    'new_balance', v_new_balance,
    'credited_usd', v_credit_usd,
    'credited_inr', v_dep.amount_inr
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.credit_wallet_oxapay(p_order_id text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_dep record;
  v_balance numeric;
  v_deposited numeric;
  v_new_balance numeric;
  v_credit_usd numeric;
  v_credit_inr numeric;
  v_rate numeric := 90;
  v_tx_id uuid;
BEGIN
  IF COALESCE(btrim(p_order_id),'') = '' THEN
    RAISE EXCEPTION 'order_id required';
  END IF;

  PERFORM pg_advisory_xact_lock(abs(hashtextextended(p_order_id, 88)));

  SELECT * INTO v_dep FROM public.oxapay_deposits
    WHERE order_id = p_order_id FOR UPDATE;

  IF v_dep.id IS NULL THEN
    RAISE EXCEPTION 'Deposit order not found';
  END IF;

  IF v_dep.credited THEN
    SELECT balance INTO v_balance FROM public.wallets WHERE user_id = v_dep.user_id;
    RETURN json_build_object('credited', false, 'duplicate', true, 'new_balance', COALESCE(v_balance,0));
  END IF;

  IF lower(COALESCE(v_dep.status,'')) NOT IN ('paid','confirmed','completed','success') THEN
    RAISE EXCEPTION 'Deposit not in payable status: %', v_dep.status;
  END IF;

  v_credit_inr := ROUND(v_dep.amount_inr, 2);
  v_credit_usd := ROUND(v_credit_inr / v_rate, 4);

  IF ABS(ROUND(v_dep.amount_usd, 4) - v_credit_usd) > 0.0112 THEN
    RAISE EXCEPTION 'currency mismatch: usd=% expected=%', v_dep.amount_usd, v_credit_usd;
  END IF;

  INSERT INTO public.wallets (user_id, balance, total_deposited, total_spent)
  VALUES (v_dep.user_id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT balance, total_deposited INTO v_balance, v_deposited
    FROM public.wallets WHERE user_id = v_dep.user_id FOR UPDATE;

  v_new_balance := trunc(COALESCE(v_balance,0) + v_credit_usd, 4);

  INSERT INTO public.transactions (
    user_id, type, amount, balance_after, status,
    payment_method, payment_reference, description
  ) VALUES (
    v_dep.user_id, 'deposit', v_credit_usd, v_new_balance, 'completed',
    'oxapay', p_order_id,
    'Wallet top-up via OxaPay Crypto (₹' || trim(to_char(v_credit_inr,'FM9999999990D00')) || ')'
  ) RETURNING id INTO v_tx_id;

  UPDATE public.wallets
     SET balance = v_new_balance,
         total_deposited = trunc(COALESCE(v_deposited,0) + v_credit_usd, 4),
         updated_at = now()
   WHERE user_id = v_dep.user_id;

  UPDATE public.oxapay_deposits
     SET credited = true,
         updated_at = now()
   WHERE id = v_dep.id;

  RETURN json_build_object(
    'credited', true,
    'duplicate', false,
    'transaction_id', v_tx_id,
    'new_balance', v_new_balance,
    'credited_inr', v_credit_inr,
    'credited_usd', v_credit_usd
  );
END $function$
;

CREATE OR REPLACE FUNCTION public.get_admin_analytics(p_from timestamp with time zone, p_to timestamp with time zone)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_span interval;
  v_prev_from timestamptz;
  v_prev_to timestamptz;
  v_current json;
  v_previous json;
  v_lifetime json;
  v_platforms json;
  v_platforms_spent json;
  v_top_depositors json;
  v_top_spenders json;
  v_top_orders json;
  v_current_wallet numeric;
  v_total_spent numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_from IS NULL OR p_to IS NULL OR p_to <= p_from THEN
    RAISE EXCEPTION 'invalid range';
  END IF;

  v_span := p_to - p_from;
  v_prev_to := p_from;
  v_prev_from := p_from - v_span;

  WITH tx AS (
    SELECT * FROM public.transactions
    WHERE created_at >= p_from AND created_at < p_to
  ),
  dep AS (
    SELECT amount FROM tx WHERE type='deposit' AND status='completed'
  ),
  ord AS (
    SELECT id, user_id, status, price::numeric AS price, created_at, service_id
    FROM public.orders WHERE created_at >= p_from AND created_at < p_to
  ),
  eord AS (
    SELECT id, user_id, status, total_price::numeric AS price, created_at
    FROM public.engagement_orders WHERE created_at >= p_from AND created_at < p_to
  ),
  all_orders AS (
    SELECT id, user_id, status, price, created_at FROM ord
    UNION ALL
    SELECT id, user_id, status, price, created_at FROM eord
  ),
  fin AS (
    SELECT
      COALESCE(SUM(amount),0)                                     AS total_deposits,
      COALESCE(COUNT(*),0)                                        AS deposits_count,
      COALESCE(AVG(amount),0)                                     AS avg_deposit,
      COALESCE(MAX(amount),0)                                     AS largest_deposit,
      COALESCE(MIN(amount),0)                                     AS smallest_deposit
    FROM dep
  ),
  fin_extra AS (
    SELECT
      COALESCE(SUM(CASE WHEN type='deposit' AND status='pending'  THEN amount ELSE 0 END),0) AS pending_deposits,
      COALESCE(SUM(CASE WHEN type='deposit' AND status='failed'   THEN amount ELSE 0 END),0) AS failed_deposits,
      COALESCE(SUM(CASE WHEN type='refund'  AND status='completed' THEN ABS(amount) ELSE 0 END),0) AS refunded_amount,
      COALESCE(SUM(CASE WHEN type='order_payment' AND status='completed' THEN ABS(amount) ELSE 0 END),0) AS wallet_debits,
      COALESCE(SUM(CASE WHEN type='order_payment' AND status='completed' THEN ABS(amount) ELSE 0 END),0) AS total_spent,
      COALESCE(COUNT(*) FILTER (WHERE type='order_payment' AND status='completed'),0) AS spenders_count,
      COALESCE(SUM(CASE WHEN type IN ('deposit','refund') AND status='completed' THEN amount ELSE 0 END),0) AS wallet_credits
    FROM tx
  ),
  ord_stats AS (
    SELECT
      COUNT(*)                                                          AS total_orders,
      COUNT(*) FILTER (WHERE status='completed')                        AS completed_orders,
      COUNT(*) FILTER (WHERE status='processing')                       AS processing_orders,
      COUNT(*) FILTER (WHERE status='pending')                          AS pending_orders,
      COUNT(*) FILTER (WHERE status='cancelled')                        AS cancelled_orders,
      COUNT(*) FILTER (WHERE status='failed')                           AS failed_orders,
      COUNT(*) FILTER (WHERE status='refunded')                         AS refunded_orders,
      COALESCE(SUM(price),0)                                            AS gross_revenue,
      COALESCE(AVG(price),0)                                            AS avg_order_value,
      COALESCE(MAX(price),0)                                            AS highest_order_value,
      COALESCE(MIN(price),0)                                            AS lowest_order_value
    FROM all_orders
  ),
  dep_users AS (
    SELECT DISTINCT user_id FROM tx WHERE type='deposit' AND status='completed'
  ),
  users_stats AS (
    SELECT
      (SELECT COUNT(*) FROM public.profiles p WHERE p.created_at >= p_from AND p.created_at < p_to) AS new_users,
      (SELECT COUNT(DISTINCT user_id) FROM dep_users) AS users_who_deposited,
      (SELECT COUNT(*) FROM auth.users au WHERE au.last_sign_in_at >= p_from AND au.last_sign_in_at < p_to) AS active_users,
      (SELECT COUNT(*) FROM public.profiles WHERE COALESCE(is_banned,false)=true) AS banned_users
  )
  SELECT json_build_object(
    'financial', (SELECT row_to_json(f) FROM (SELECT fin.*, fin_extra.* FROM fin, fin_extra) f),
    'orders',    (SELECT row_to_json(o) FROM ord_stats o),
    'users',     (SELECT row_to_json(u) FROM users_stats u)
  ) INTO v_current;

  -- Previous window
  WITH tx AS (
    SELECT * FROM public.transactions
    WHERE created_at >= v_prev_from AND created_at < v_prev_to
  ),
  dep AS (SELECT amount FROM tx WHERE type='deposit' AND status='completed'),
  ord AS (
    SELECT id, price::numeric AS price, status FROM public.orders
    WHERE created_at >= v_prev_from AND created_at < v_prev_to
  ),
  eord AS (
    SELECT id, total_price::numeric AS price, status FROM public.engagement_orders
    WHERE created_at >= v_prev_from AND created_at < v_prev_to
  ),
  all_orders AS (
    SELECT id, price, status FROM ord UNION ALL SELECT id, price, status FROM eord
  )
  SELECT json_build_object(
    'total_deposits', COALESCE((SELECT SUM(amount) FROM dep),0),
    'gross_revenue',  COALESCE((SELECT SUM(price) FROM all_orders),0),
    'total_orders',   COALESCE((SELECT COUNT(*) FROM all_orders),0),
    'total_spent',    COALESCE((SELECT SUM(ABS(amount)) FROM tx WHERE type='order_payment' AND status='completed'),0),
    'new_users',      COALESCE((SELECT COUNT(*) FROM public.profiles WHERE created_at >= v_prev_from AND created_at < v_prev_to),0)
  ) INTO v_previous;

  -- Lifetime + live wallet
  SELECT COALESCE(SUM(balance),0) INTO v_current_wallet FROM public.wallets;
  SELECT COALESCE(SUM(ABS(amount)),0) INTO v_total_spent
    FROM public.transactions WHERE type='order_payment' AND status='completed';

  SELECT json_build_object(
    'lifetime_deposits',   COALESCE((SELECT SUM(amount) FROM public.transactions WHERE type='deposit' AND status='completed'),0),
    'lifetime_spent',      v_total_spent,
    'lifetime_users',      (SELECT COUNT(*) FROM public.profiles),
    'lifetime_orders',     (SELECT COUNT(*) FROM public.orders) + (SELECT COUNT(*) FROM public.engagement_orders),
    'current_wallet_total', v_current_wallet,
    'vip_users',           (SELECT COUNT(*) FROM public.wallets WHERE total_deposited >= 100),
    'banned_users',        (SELECT COUNT(*) FROM public.profiles WHERE COALESCE(is_banned,false)=true)
  ) INTO v_lifetime;

  -- Platform breakdown (count + spent) for the range
  WITH single_o AS (
    SELECT COALESCE(s.category,'Other') AS cat, COALESCE(o.price::numeric,0) AS price
    FROM public.orders o
    LEFT JOIN public.services s ON s.id = o.service_id
    WHERE o.created_at >= p_from AND o.created_at < p_to
  ),
  eng_o AS (
    SELECT COALESCE(s.category,'Other') AS cat, COALESCE(eoi.price::numeric,0) AS price
    FROM public.engagement_order_items eoi
    JOIN public.engagement_orders eo ON eo.id = eoi.engagement_order_id
    LEFT JOIN public.services s ON s.id = eoi.service_id
    WHERE eo.created_at >= p_from AND eo.created_at < p_to
  ),
  cats AS (
    SELECT cat, price FROM single_o UNION ALL SELECT cat, price FROM eng_o
  ),
  norm AS (
    SELECT
      CASE
        WHEN cat ILIKE '%instagram%' THEN 'Instagram'
        WHEN cat ILIKE '%tiktok%'    THEN 'TikTok'
        WHEN cat ILIKE '%youtube%'   THEN 'YouTube'
        WHEN cat ILIKE '%facebook%'  THEN 'Facebook'
        WHEN cat ILIKE '%telegram%'  THEN 'Telegram'
        WHEN cat ILIKE '%twitter%' OR cat ILIKE '%x %' OR cat = 'X' THEN 'X (Twitter)'
        ELSE 'Other'
      END AS platform,
      price
    FROM cats
  ),
  agg AS (
    SELECT platform, COUNT(*)::bigint AS count, COALESCE(SUM(price),0)::numeric AS spent
    FROM norm GROUP BY platform ORDER BY spent DESC
  )
  SELECT
    COALESCE(json_agg(json_build_object('platform', platform, 'count', count) ORDER BY count DESC), '[]'::json),
    COALESCE(json_agg(json_build_object('platform', platform, 'spent', spent, 'count', count) ORDER BY spent DESC), '[]'::json)
  INTO v_platforms, v_platforms_spent
  FROM agg;

  -- Top 10 depositors
  SELECT COALESCE(json_agg(row_to_json(x)),'[]'::json) INTO v_top_depositors
  FROM (
    SELECT p.user_id, p.email, p.full_name, SUM(t.amount)::numeric AS amount, COUNT(*)::bigint AS n
    FROM public.transactions t
    JOIN public.profiles p ON p.user_id = t.user_id
    WHERE t.type='deposit' AND t.status='completed'
      AND t.created_at >= p_from AND t.created_at < p_to
    GROUP BY p.user_id, p.email, p.full_name
    ORDER BY amount DESC
    LIMIT 10
  ) x;

  -- Top 10 spenders
  SELECT COALESCE(json_agg(row_to_json(x)),'[]'::json) INTO v_top_spenders
  FROM (
    SELECT p.user_id, p.email, p.full_name, SUM(ABS(t.amount))::numeric AS amount, COUNT(*)::bigint AS n
    FROM public.transactions t
    JOIN public.profiles p ON p.user_id = t.user_id
    WHERE t.type='order_payment' AND t.status='completed'
      AND t.created_at >= p_from AND t.created_at < p_to
    GROUP BY p.user_id, p.email, p.full_name
    ORDER BY amount DESC
    LIMIT 10
  ) x;

  -- Top 10 by order count
  SELECT COALESCE(json_agg(row_to_json(x)),'[]'::json) INTO v_top_orders
  FROM (
    WITH all_o AS (
      SELECT user_id FROM public.orders WHERE created_at >= p_from AND created_at < p_to
      UNION ALL
      SELECT user_id FROM public.engagement_orders WHERE created_at >= p_from AND created_at < p_to
    )
    SELECT p.user_id, p.email, p.full_name, COUNT(*)::bigint AS n
    FROM all_o
    JOIN public.profiles p ON p.user_id = all_o.user_id
    GROUP BY p.user_id, p.email, p.full_name
    ORDER BY n DESC
    LIMIT 10
  ) x;

  RETURN json_build_object(
    'from', p_from,
    'to', p_to,
    'prev_from', v_prev_from,
    'prev_to', v_prev_to,
    'current', v_current,
    'previous', v_previous,
    'lifetime', v_lifetime,
    'platforms', v_platforms,
    'platforms_spent', v_platforms_spent,
    'top_depositors', v_top_depositors,
    'top_spenders', v_top_spenders,
    'top_orders', v_top_orders
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.debit_wallet_for_order(p_user_id uuid, p_amount numeric, p_order_id uuid DEFAULT NULL::uuid, p_engagement_order_id uuid DEFAULT NULL::uuid, p_description text DEFAULT 'Order payment'::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_balance numeric;
  v_spent numeric;
  v_new_balance numeric;
  v_amount numeric;
  v_tx_id uuid;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id required';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'amount must be greater than zero';
  END IF;

  IF p_order_id IS NULL AND p_engagement_order_id IS NULL THEN
    RAISE EXCEPTION 'either order_id or engagement_order_id required';
  END IF;

  v_amount := trunc(p_amount::numeric, 4);

  -- Lock the wallet row to serialize concurrent debits for the same user
  SELECT balance, total_spent INTO v_balance, v_spent
  FROM public.wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  IF v_balance < v_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  v_new_balance := trunc(v_balance - v_amount, 4);

  UPDATE public.wallets
     SET balance = v_new_balance,
         total_spent = trunc(COALESCE(v_spent, 0) + v_amount, 4),
         updated_at = now()
   WHERE user_id = p_user_id;

  -- Audit trail is MANDATORY and atomic with the debit (no logging gap possible)
  INSERT INTO public.transactions(
    user_id, type, amount, balance_after, order_id, description, status
  ) VALUES (
    p_user_id, 'order_payment', v_amount, v_new_balance, p_order_id, p_description, 'completed'
  )
  RETURNING id INTO v_tx_id;

  RETURN json_build_object(
    'success', true,
    'transaction_id', v_tx_id,
    'new_balance', v_new_balance,
    'debited', v_amount
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.record_zapupi_fraud_strike(p_user_id uuid, p_reason_code text, p_meta jsonb DEFAULT '{}'::jsonb)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_email text;
  v_mismatch_24h int;
  v_failed_24h   int;
  v_success_24h  int;
  v_should_ban boolean := false;
  v_ban_reason text;
  v_already_banned boolean := false;
BEGIN
  SELECT email, is_banned INTO v_email, v_already_banned
    FROM public.profiles WHERE user_id = p_user_id;

  -- log strike
  INSERT INTO public.admin_audit_log(
    actor_id, actor_email, target_user_id, target_email,
    action, metadata
  ) VALUES (
    NULL, 'system',
    p_user_id, v_email,
    'fraud_strike:' || p_reason_code,
    COALESCE(p_meta,'{}'::jsonb)
  );

  SELECT COUNT(*) INTO v_mismatch_24h FROM public.zapupi_deposits
    WHERE user_id = p_user_id AND status = 'mismatch'
      AND created_at >= now() - interval '24 hours';
  SELECT COUNT(*) INTO v_failed_24h FROM public.zapupi_deposits
    WHERE user_id = p_user_id AND status = 'failed'
      AND created_at >= now() - interval '24 hours';
  SELECT COUNT(*) INTO v_success_24h FROM public.zapupi_deposits
    WHERE user_id = p_user_id AND status = 'success'
      AND created_at >= now() - interval '24 hours';

  IF v_mismatch_24h >= 1 THEN
    v_should_ban := true;
    v_ban_reason := 'ZapUPI amount mismatch (' || v_mismatch_24h || ' in 24h)';
  ELSIF v_failed_24h >= 5 AND v_success_24h = 0 THEN
    v_should_ban := true;
    v_ban_reason := 'ZapUPI repeated failed deposits (' || v_failed_24h || ' in 24h, 0 success)';
  END IF;

  IF v_should_ban AND NOT COALESCE(v_already_banned,false) THEN
    UPDATE public.profiles
       SET is_banned = true,
           banned_reason = v_ban_reason,
           banned_at = now()
     WHERE user_id = p_user_id;

    INSERT INTO public.admin_audit_log(
      actor_id, actor_email, target_user_id, target_email,
      action, notes, metadata
    ) VALUES (
      NULL, 'system',
      p_user_id, v_email,
      'auto_ban',
      v_ban_reason,
      jsonb_build_object(
        'mismatch_24h', v_mismatch_24h,
        'failed_24h',   v_failed_24h,
        'success_24h',  v_success_24h,
        'reason_code',  p_reason_code
      )
    );
  END IF;

  RETURN json_build_object(
    'banned', v_should_ban AND NOT COALESCE(v_already_banned,false),
    'already_banned', v_already_banned,
    'mismatch_24h', v_mismatch_24h,
    'failed_24h', v_failed_24h,
    'success_24h', v_success_24h,
    'email', v_email,
    'ban_reason', v_ban_reason
  );
END
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_finished_orders_24h()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_terminal text[] := ARRAY['completed','cancelled','failed','refunded','partial'];
  v_deleted_orders int := 0;
  v_deleted_order_runs int := 0;
  v_eng json;
BEGIN
  -- --- Regular orders (public.orders) ---
  -- Delete organic_run_schedule rows tied to these orders first (FK-safe).
  WITH target_orders AS (
    SELECT id FROM public.orders
     WHERE status = ANY (v_terminal)
       AND COALESCE(updated_at, created_at) < now() - interval '24 hours'
  ),
  del_runs AS (
    DELETE FROM public.organic_run_schedule
     WHERE order_id IN (SELECT id FROM target_orders)
    RETURNING 1
  )
  SELECT count(*) INTO v_deleted_order_runs FROM del_runs;

  WITH del_o AS (
    DELETE FROM public.orders
     WHERE status = ANY (v_terminal)
       AND COALESCE(updated_at, created_at) < now() - interval '24 hours'
    RETURNING 1
  )
  SELECT count(*) INTO v_deleted_orders FROM del_o;

  -- --- Engagement orders: reuse existing 24h cleanup helper ---
  SELECT public.cleanup_old_completed_engagement_orders() INTO v_eng;

  RETURN json_build_object(
    'ran_at', now(),
    'orders_deleted', v_deleted_orders,
    'order_runs_deleted', v_deleted_order_runs,
    'engagement', v_eng
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result JSON;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'total_revenue', COALESCE((SELECT SUM(ABS(amount)) FROM transactions WHERE type IN ('order', 'order_payment') AND status = 'completed'), 0),
    'total_deposits', COALESCE((SELECT SUM(amount) FROM transactions WHERE type = 'deposit' AND status = 'completed'), 0),
    'total_wallet_balance', COALESCE((SELECT SUM(balance) FROM wallets), 0),
    'deposits_today', COALESCE((SELECT SUM(amount) FROM transactions WHERE type = 'deposit' AND status = 'completed' AND created_at >= date_trunc('day', now())), 0),
    'deposits_count', COALESCE((SELECT COUNT(*) FROM transactions WHERE type = 'deposit' AND status = 'completed'), 0),
    'total_orders', (SELECT COUNT(*) FROM orders) + (SELECT COUNT(*) FROM engagement_orders),
    'user_count', (SELECT COUNT(*) FROM profiles),
    'service_count', (SELECT COUNT(*) FROM services WHERE is_active = true),
    'markup', COALESCE((SELECT global_markup_percent FROM platform_settings LIMIT 1), 0),
    'maintenance_mode', COALESCE((SELECT maintenance_mode FROM platform_settings LIMIT 1), false)
  ) INTO result;

  RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_admin_users_summary()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result JSON;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_agg(row_to_json(t)) INTO result
  FROM (
    SELECT
      p.id,
      p.user_id,
      p.email,
      p.full_name,
      p.telegram_username,
      p.created_at,
      p.updated_at,
      COALESCE(p.is_banned, false) AS is_banned,
      p.banned_reason,
      p.banned_at,
      COALESCE(w.balance, 0) AS balance,
      COALESCE(w.total_deposited, 0) AS total_deposited,
      COALESCE(w.total_spent, 0) AS total_spent,
      COALESCE(ur.role::text, 'user') AS role,
      COALESCE(s.plan_type, 'none') AS plan_type,
      COALESCE(s.status, 'inactive') AS subscription_status,
      s.expires_at AS subscription_expires,
      dep.last_deposit_at,
      dep.deposit_count,
      COALESCE(o_cnt.n, 0) AS single_orders_count,
      COALESCE(eo_cnt.n, 0) AS engagement_orders_count,
      (COALESCE(o_cnt.n,0) + COALESCE(eo_cnt.n,0)) AS total_orders_count,
      o_cnt.last_order_at AS last_single_order_at,
      eo_cnt.last_order_at AS last_engagement_order_at,
      GREATEST(
        COALESCE(dep.last_deposit_at, 'epoch'::timestamptz),
        COALESCE(o_cnt.last_order_at, 'epoch'::timestamptz),
        COALESCE(eo_cnt.last_order_at, 'epoch'::timestamptz),
        COALESCE(p.updated_at, 'epoch'::timestamptz),
        COALESCE(au.last_sign_in_at, 'epoch'::timestamptz)
      ) AS last_active_at,
      au.last_sign_in_at,
      -- order status buckets (kept for existing UI code)
      COALESCE(o_cnt.active_n, 0) AS active_single_orders,
      COALESCE(o_cnt.paused_n, 0) AS paused_single_orders,
      COALESCE(eo_cnt.active_n, 0) AS active_engagement_orders,
      COALESCE(eo_cnt.paused_n, 0) AS paused_engagement_orders
    FROM profiles p
    LEFT JOIN wallets w ON w.user_id = p.user_id
    LEFT JOIN user_roles ur ON ur.user_id = p.user_id
    LEFT JOIN subscriptions s ON s.user_id = p.user_id
    LEFT JOIN auth.users au ON au.id = p.user_id
    LEFT JOIN LATERAL (
      SELECT
        MAX(tx.created_at) AS last_deposit_at,
        COUNT(*)           AS deposit_count
      FROM transactions tx
      WHERE tx.user_id = p.user_id
        AND tx.type = 'deposit'
        AND tx.status = 'completed'
    ) dep ON TRUE
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)           AS n,
        MAX(o.created_at)  AS last_order_at,
        COUNT(*) FILTER (WHERE o.status IN ('pending','processing')) AS active_n,
        COUNT(*) FILTER (WHERE o.status = 'paused')                  AS paused_n
      FROM orders o WHERE o.user_id = p.user_id
    ) o_cnt ON TRUE
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)           AS n,
        MAX(eo.created_at) AS last_order_at,
        COUNT(*) FILTER (WHERE eo.status IN ('pending','processing')) AS active_n,
        COUNT(*) FILTER (WHERE eo.status = 'paused')                  AS paused_n
      FROM engagement_orders eo WHERE eo.user_id = p.user_id
    ) eo_cnt ON TRUE
    ORDER BY dep.last_deposit_at DESC NULLS LAST, p.created_at DESC
  ) t;

  RETURN COALESCE(result, '[]'::json);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_provider_topup_plan()
 RETURNS TABLE(provider_id text, provider_name text, pending_runs bigint, pending_user_usd numeric, markup_percent numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  WITH service_map AS (
    -- for each service, list active mapped providers (via provider_accounts)
    SELECT spm.service_id, pa.provider_id AS pid,
           COUNT(*) OVER (PARTITION BY spm.service_id) AS n
    FROM service_provider_mapping spm
    JOIN provider_accounts pa ON pa.id = spm.provider_account_id
    WHERE spm.is_active = true AND pa.is_active = true
  ),
  eng AS (
    SELECT COALESCE(sm.pid, s.provider_id) AS pid,
           1.0 / NULLIF(COALESCE(sm.n, 1), 0) AS share,
           rs.quantity_to_send AS qty,
           s.price AS price
    FROM organic_run_schedule rs
    JOIN engagement_order_items eoi ON eoi.id = rs.engagement_order_item_id
    JOIN services s ON s.id = eoi.service_id
    LEFT JOIN service_map sm ON sm.service_id = s.id
    WHERE rs.status = 'pending'
  ),
  eng_agg AS (
    SELECT pid,
           SUM(share)::bigint AS runs,
           SUM((qty::numeric / 1000.0) * price * share) AS usd
    FROM eng GROUP BY pid
  ),
  nrun AS (
    SELECT COALESCE(sm.pid, s.provider_id) AS pid,
           1.0 / NULLIF(COALESCE(sm.n, 1), 0) AS share,
           rs.quantity_to_send AS qty,
           (o.price / NULLIF(o.quantity,0) * 1000) AS price
    FROM organic_run_schedule rs
    JOIN orders o ON o.id = rs.order_id
    LEFT JOIN services s ON s.id = o.service_id
    LEFT JOIN service_map sm ON sm.service_id = s.id
    WHERE rs.status = 'pending'
  ),
  nrun_agg AS (
    SELECT pid,
           SUM(share)::bigint AS runs,
           SUM((qty::numeric / 1000.0) * price * share) AS usd
    FROM nrun GROUP BY pid
  ),
  ord AS (
    SELECT COALESCE(sm.pid, s.provider_id) AS pid,
           1.0 / NULLIF(COALESCE(sm.n, 1), 0) AS share,
           o.price AS price
    FROM orders o
    LEFT JOIN services s ON s.id = o.service_id
    LEFT JOIN service_map sm ON sm.service_id = s.id
    WHERE o.status IN ('pending','processing')
      AND NOT EXISTS (SELECT 1 FROM organic_run_schedule rs WHERE rs.order_id = o.id)
  ),
  ord_agg AS (
    SELECT pid, SUM(share)::bigint AS runs, SUM(price * share) AS usd FROM ord GROUP BY pid
  ),
  agg AS (
    SELECT pid, runs, usd FROM eng_agg
    UNION ALL SELECT pid, runs, usd FROM nrun_agg
    UNION ALL SELECT pid, runs, usd FROM ord_agg
  )
  SELECT
    COALESCE(a.pid, 'unknown')::text,
    COALESCE(p.name, a.pid, 'unknown')::text,
    SUM(a.runs)::bigint,
    ROUND(COALESCE(SUM(a.usd), 0)::numeric, 4),
    COALESCE((SELECT global_markup_percent FROM platform_settings LIMIT 1), 0)::numeric
  FROM agg a
  LEFT JOIN providers p ON p.id = a.pid
  GROUP BY a.pid, p.name
  HAVING SUM(a.runs) > 0
  ORDER BY 4 DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_top_pending_users(p_limit integer DEFAULT 5)
 RETURNS TABLE(user_id uuid, email text, full_name text, wallet_balance numeric, total_deposited numeric, total_spent numeric, pending_orders bigint, pending_value_usd numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  WITH eng AS (
    SELECT eo.user_id AS uid,
           COUNT(*)::bigint AS cnt,
           COALESCE(SUM((rs.quantity_to_send::numeric/1000.0) * s.price),0) AS usd
    FROM organic_run_schedule rs
    JOIN engagement_order_items eoi ON eoi.id = rs.engagement_order_item_id
    JOIN engagement_orders eo ON eo.id = eoi.engagement_order_id
    JOIN services s ON s.id = eoi.service_id
    WHERE rs.status = 'pending'
    GROUP BY eo.user_id
  ),
  nord AS (
    SELECT o.user_id AS uid,
           COUNT(*)::bigint AS cnt,
           COALESCE(SUM(o.price),0) AS usd
    FROM orders o
    WHERE o.status IN ('pending','processing')
    GROUP BY o.user_id
  ),
  agg AS (
    SELECT uid, cnt, usd FROM eng
    UNION ALL
    SELECT uid, cnt, usd FROM nord
  ),
  totals AS (
    SELECT uid,
           SUM(cnt)::bigint AS cnt,
           SUM(usd)::numeric AS usd
    FROM agg
    GROUP BY uid
  )
  SELECT
    t.uid,
    COALESCE(p.email,'unknown')::text,
    COALESCE(p.full_name,'')::text,
    COALESCE(w.balance,0)::numeric,
    COALESCE(w.total_deposited,0)::numeric,
    COALESCE(w.total_spent,0)::numeric,
    t.cnt,
    ROUND(t.usd, 4)
  FROM totals t
  LEFT JOIN profiles p ON p.user_id = t.uid
  LEFT JOIN wallets w ON w.user_id = t.uid
  WHERE t.usd > 0
  ORDER BY t.usd DESC
  LIMIT GREATEST(1, p_limit);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_provider_topup_breakdown()
 RETURNS TABLE(provider_id text, provider_name text, service_id uuid, service_name text, service_category text, pending_runs bigint, pending_quantity bigint, pending_user_usd numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  RETURN QUERY
  SELECT pa.provider_id,
         COALESCE(p.name, pa.provider_id) AS provider_name,
         s.id AS service_id,
         s.name AS service_name,
         s.category AS service_category,
         COUNT(*)::bigint AS pending_runs,
         COALESCE(SUM(ors.quantity_to_send), 0)::bigint AS pending_quantity,
         COALESCE(SUM(ors.quantity_to_send::numeric / 1000 * s.price), 0)::numeric AS pending_user_usd
  FROM public.organic_run_schedule ors
  JOIN public.provider_accounts pa ON pa.id = ors.provider_account_id
  LEFT JOIN public.providers p ON p.id = pa.provider_id
  LEFT JOIN public.engagement_order_items eoi ON eoi.id = ors.engagement_order_item_id
  LEFT JOIN public.services s ON s.id = eoi.service_id
  WHERE ors.status = 'pending'
  GROUP BY pa.provider_id, p.name, s.id, s.name, s.category;
END $function$
;

CREATE OR REPLACE FUNCTION public.bootstrap_current_user(p_full_name text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  uemail text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email', '')
    INTO uemail;

  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (uid, COALESCE(NULLIF(uemail, ''), uid::text), COALESCE(p_full_name, ''))
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.wallets (user_id, balance, total_deposited, total_spent)
  VALUES (uid, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (uid, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
END $function$
;

-- TRIGGERS

CREATE TRIGGER update_deposits_updated_at BEFORE UPDATE ON public.deposits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_cancel_runs_on_item_status AFTER UPDATE OF status ON public.engagement_order_items FOR EACH ROW EXECUTE FUNCTION cancel_pending_runs_on_item_cancel();
CREATE TRIGGER trg_engagement_order_items_lock_user_cols BEFORE UPDATE ON public.engagement_order_items FOR EACH ROW EXECUTE FUNCTION engagement_order_items_lock_user_columns();
CREATE TRIGGER update_engagement_order_items_updated_at BEFORE UPDATE ON public.engagement_order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_guard_provider_accounts_is_active BEFORE UPDATE OF is_active ON public.provider_accounts FOR EACH ROW EXECUTE FUNCTION guard_provider_config_is_active();
CREATE TRIGGER trg_compute_rotation_lock_key BEFORE INSERT OR UPDATE OF status, provider_order_id, provider_account_id, engagement_order_item_id ON public.organic_run_schedule FOR EACH ROW EXECUTE FUNCTION compute_rotation_lock_key();
CREATE TRIGGER on_new_chat_message AFTER INSERT ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();
CREATE TRIGGER update_engagement_bundles_updated_at BEFORE UPDATE ON public.engagement_bundles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_engagement_order_completed_at_trigger BEFORE UPDATE ON public.engagement_orders FOR EACH ROW EXECUTE FUNCTION set_engagement_order_completed_at();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_cancel_runs_on_eo_cancel AFTER UPDATE OF status ON public.engagement_orders FOR EACH ROW EXECUTE FUNCTION cancel_pending_runs_on_eo_cancel();
CREATE TRIGGER trg_engagement_orders_lock_user_cols BEFORE UPDATE ON public.engagement_orders FOR EACH ROW EXECUTE FUNCTION engagement_orders_lock_user_columns();
CREATE TRIGGER update_engagement_orders_updated_at BEFORE UPDATE ON public.engagement_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_provider_accounts_updated_at BEFORE UPDATE ON public.provider_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER popup_ads_updated_at BEFORE UPDATE ON public.popup_ads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_organic_run_schedule_lock_user_columns BEFORE UPDATE ON public.organic_run_schedule FOR EACH ROW EXECUTE FUNCTION organic_run_schedule_lock_user_columns();
CREATE TRIGGER profiles_block_privileged_updates BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION profiles_block_privileged_updates();
CREATE TRIGGER trg_guard_spm_is_active BEFORE UPDATE OF is_active ON public.service_provider_mapping FOR EACH ROW EXECUTE FUNCTION guard_provider_config_is_active();
CREATE TRIGGER update_subscription_requests_updated_at BEFORE UPDATE ON public.subscription_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE CONSTRAINT TRIGGER trg_enforce_wallet_credit_trail AFTER UPDATE ON public.wallets DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION enforce_wallet_credit_trail();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_guard_oxapay BEFORE UPDATE ON public.oxapay_deposits FOR EACH ROW EXECUTE FUNCTION guard_oxapay_deposit_change();
CREATE TRIGGER trg_oxapay_deposits_updated_at BEFORE UPDATE ON public.oxapay_deposits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON public.providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER enforce_transaction_provenance_trigger BEFORE INSERT ON public.transactions FOR EACH ROW EXECUTE FUNCTION enforce_transaction_provenance();
CREATE TRIGGER guard_zapupi_deposit_change_trigger BEFORE UPDATE ON public.zapupi_deposits FOR EACH ROW EXECUTE FUNCTION guard_zapupi_deposit_change();
CREATE TRIGGER trg_zapupi_deposits_updated BEFORE UPDATE ON public.zapupi_deposits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_ohalerts_updated_at BEFORE UPDATE ON public.order_health_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS

ALTER TABLE public.service_provider_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organic_run_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zapupi_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oxapay_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oxapay_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_health_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popup_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rotation_alert_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.razorpay_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zapupi_deposits ENABLE ROW LEVEL SECURITY;

-- POLICIES

CREATE POLICY "Admin can manage all bundle items" ON public.bundle_items AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin can manage all bundles" ON public.engagement_bundles AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin can manage all services" ON public.services AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin only provider_accounts" ON public.provider_accounts AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin only providers" ON public.providers AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin only service_provider_mapping" ON public.service_provider_mapping AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can read rotation alerts" ON public.rotation_alert_state AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all profiles" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view audit log" ON public.admin_audit_log AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage deposits" ON public.deposits AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage engagement_orders" ON public.engagement_orders AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage order items" ON public.engagement_order_items AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "No client deletes (wallets)" ON public.wallets AS PERMISSIVE FOR DELETE TO anon, authenticated USING (false);
CREATE POLICY "Admins manage orders" ON public.orders AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage requests" ON public.subscription_requests AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage runs" ON public.organic_run_schedule AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage tickets" ON public.support_tickets AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update messages" ON public.chat_messages AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins view all wallets" ON public.wallets AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can update own engagement_order_items status" ON public.engagement_order_items AS PERMISSIVE FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM engagement_orders eo
  WHERE ((eo.id = engagement_order_items.engagement_order_id) AND (eo.user_id = auth.uid()))))) WITH CHECK (((EXISTS ( SELECT 1
   FROM engagement_orders eo
  WHERE ((eo.id = engagement_order_items.engagement_order_id) AND (eo.user_id = auth.uid())))) AND (status = ANY (ARRAY['paused'::text, 'processing'::text, 'cancelled'::text]))));
CREATE POLICY "Users can update own engagement_orders status" ON public.engagement_orders AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK (((auth.uid() = user_id) AND (status = ANY (ARRAY['paused'::text, 'processing'::text, 'cancelled'::text]))));
CREATE POLICY "Users can insert own profile" ON public.profiles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Admins manage platform settings" ON public.platform_settings AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage roles" ON public.user_roles AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage subscriptions" ON public.subscriptions AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins read platform settings" ON public.platform_settings AS PERMISSIVE FOR SELECT TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins view all transactions" ON public.transactions AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "No self delete on user_roles" ON public.user_roles AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "No self insert into user_roles" ON public.user_roles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "No self update on user_roles" ON public.user_roles AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users create conversations" ON public.chat_conversations AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users create requests" ON public.subscription_requests AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users create messages" ON public.chat_messages AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((auth.uid() = sender_id) AND ((EXISTS ( SELECT 1
   FROM chat_conversations
  WHERE ((chat_conversations.id = chat_messages.conversation_id) AND (chat_conversations.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role))));
CREATE POLICY "No client updates (transactions)" ON public.transactions AS PERMISSIVE FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "Users can view own profile" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users create own tickets" ON public.support_tickets AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users update own pending runs" ON public.organic_run_schedule AS PERMISSIVE FOR UPDATE TO authenticated USING (((status = 'pending'::text) AND ((EXISTS ( SELECT 1
   FROM orders
  WHERE ((orders.id = organic_run_schedule.order_id) AND (orders.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (engagement_order_items eoi
     JOIN engagement_orders eo ON ((eo.id = eoi.engagement_order_id)))
  WHERE ((eoi.id = organic_run_schedule.engagement_order_item_id) AND (eo.user_id = auth.uid()))))))) WITH CHECK (((status = ANY (ARRAY['pending'::text, 'cancelled'::text])) AND ((EXISTS ( SELECT 1
   FROM orders
  WHERE ((orders.id = organic_run_schedule.order_id) AND (orders.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (engagement_order_items eoi
     JOIN engagement_orders eo ON ((eo.id = eoi.engagement_order_id)))
  WHERE ((eoi.id = organic_run_schedule.engagement_order_item_id) AND (eo.user_id = auth.uid())))))));
CREATE POLICY "Users view own deposits" ON public.deposits AS PERMISSIVE FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users view own transactions" ON public.transactions AS PERMISSIVE FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users view own order items" ON public.engagement_order_items AS PERMISSIVE FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM engagement_orders
  WHERE ((engagement_orders.id = engagement_order_items.engagement_order_id) AND (engagement_orders.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users view own requests" ON public.subscription_requests AS PERMISSIVE FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users view own runs" ON public.organic_run_schedule AS PERMISSIVE FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM orders
  WHERE ((orders.id = organic_run_schedule.order_id) AND (orders.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (engagement_order_items eoi
     JOIN engagement_orders eo ON ((eo.id = eoi.engagement_order_id)))
  WHERE ((eoi.id = organic_run_schedule.engagement_order_item_id) AND (eo.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users view own tickets" ON public.support_tickets AS PERMISSIVE FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "popup_ads admin delete" ON public.popup_ads AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "No client inserts (deposits)" ON public.deposits AS PERMISSIVE FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "Users update conversations" ON public.chat_conversations AS PERMISSIVE FOR UPDATE TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users view own conversations" ON public.chat_conversations AS PERMISSIVE FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users view own engagement_orders" ON public.engagement_orders AS PERMISSIVE FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users view own messages" ON public.chat_messages AS PERMISSIVE FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM chat_conversations
  WHERE ((chat_conversations.id = chat_messages.conversation_id) AND (chat_conversations.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users view own orders" ON public.orders AS PERMISSIVE FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users view own roles" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users view own subscription" ON public.subscriptions AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users view own wallet" ON public.wallets AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "No client inserts (transactions)" ON public.transactions AS PERMISSIVE FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "Users view own zapupi deposits" ON public.zapupi_deposits AS PERMISSIVE FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Authenticated users can view active services" ON public.services AS PERMISSIVE FOR SELECT TO authenticated USING ((is_active = true));
CREATE POLICY "service role only" ON public.razorpay_webhook_events AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "users read own oxapay deposits" ON public.oxapay_deposits AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Service role only" ON public.zapupi_webhook_events AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "popup_ads admin insert" ON public.popup_ads AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "popup_ads admin update" ON public.popup_ads AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Block client inserts to user_roles" ON public.user_roles AS RESTRICTIVE FOR INSERT TO anon, authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins read oxapay webhook events" ON public.oxapay_webhook_events AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins read order health alerts" ON public.order_health_alerts AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can view active bundles" ON public.engagement_bundles AS PERMISSIVE FOR SELECT TO authenticated USING ((is_active = true));
CREATE POLICY "No client inserts (wallets)" ON public.wallets AS PERMISSIVE FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "Authenticated can view active bundle items" ON public.bundle_items AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM engagement_bundles b
  WHERE ((b.id = bundle_items.bundle_id) AND (b.is_active = true)))));
CREATE POLICY "popup_ads live read" ON public.popup_ads AS PERMISSIVE FOR SELECT TO public USING (((enabled = true) AND ((starts_at IS NULL) OR (starts_at <= now())) AND ((ends_at IS NULL) OR (ends_at >= now()))));
CREATE POLICY "No client updates (wallets)" ON public.wallets AS PERMISSIVE FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "No client deletes (transactions)" ON public.transactions AS PERMISSIVE FOR DELETE TO anon, authenticated USING (false);
CREATE POLICY "No client inserts (engagement_orders)" ON public.engagement_orders AS PERMISSIVE FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No client inserts (orders)" ON public.orders AS PERMISSIVE FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "Deny client insert on oxapay_deposits" ON public.oxapay_deposits AS RESTRICTIVE FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "Deny client update on oxapay_deposits" ON public.oxapay_deposits AS RESTRICTIVE FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "Deny client delete on oxapay_deposits" ON public.oxapay_deposits AS RESTRICTIVE FOR DELETE TO anon, authenticated USING (false);

-- GRANTS
