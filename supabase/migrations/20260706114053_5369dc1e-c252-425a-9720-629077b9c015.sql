
-- =========================================================
-- Smart Order Templates
-- =========================================================

-- 1. order_templates
CREATE TABLE public.order_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  category text,
  is_favorite boolean NOT NULL DEFAULT false,
  color_label text,
  platform text,
  service_id uuid,
  service_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  usage_count integer NOT NULL DEFAULT 0,
  last_used_at timestamptz,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_templates TO authenticated;
GRANT ALL ON public.order_templates TO service_role;

ALTER TABLE public.order_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own templates"
  ON public.order_templates FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own templates"
  ON public.order_templates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own templates"
  ON public.order_templates FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own templates"
  ON public.order_templates FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX order_templates_user_idx ON public.order_templates(user_id, is_favorite DESC, last_used_at DESC NULLS LAST);
CREATE INDEX order_templates_service_idx ON public.order_templates(service_id);

CREATE TRIGGER order_templates_set_updated_at
  BEFORE UPDATE ON public.order_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. template_settings (singleton)
CREATE TABLE public.template_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  enabled boolean NOT NULL DEFAULT true,
  max_per_user integer NOT NULL DEFAULT 50,
  allow_categories boolean NOT NULL DEFAULT true,
  allow_favorites boolean NOT NULL DEFAULT true,
  allow_color_labels boolean NOT NULL DEFAULT true,
  allow_descriptions boolean NOT NULL DEFAULT true,
  allow_duplicate boolean NOT NULL DEFAULT true,
  allow_archive boolean NOT NULL DEFAULT true,
  allow_dashboard_widget boolean NOT NULL DEFAULT true,
  allow_save_after_order boolean NOT NULL DEFAULT true,
  allow_save_from_repeat boolean NOT NULL DEFAULT true,
  max_name_length integer NOT NULL DEFAULT 60,
  max_description_length integer NOT NULL DEFAULT 300,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.template_settings TO anon, authenticated;
GRANT ALL ON public.template_settings TO service_role;

ALTER TABLE public.template_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads template settings"
  ON public.template_settings FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins update template settings"
  ON public.template_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert template settings"
  ON public.template_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.template_settings (id) VALUES (true) ON CONFLICT DO NOTHING;

-- 3. Enforce per-user cap
CREATE OR REPLACE FUNCTION public.enforce_template_cap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cap integer;
  v_count integer;
BEGIN
  SELECT max_per_user INTO v_cap FROM public.template_settings LIMIT 1;
  v_cap := COALESCE(v_cap, 50);
  SELECT COUNT(*) INTO v_count FROM public.order_templates
    WHERE user_id = NEW.user_id AND is_archived = false;
  IF v_count >= v_cap THEN
    RAISE EXCEPTION 'Template limit reached (max % per user)', v_cap;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER order_templates_cap
  BEFORE INSERT ON public.order_templates
  FOR EACH ROW EXECUTE FUNCTION public.enforce_template_cap();
