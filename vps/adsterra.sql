-- Adsterra platform: manual-fulfilment services + bundle (idempotent)
DO $$
DECLARE b_id uuid; s_imp uuid; s_vis uuid; s_clk uuid;
BEGIN
  SELECT id INTO s_imp FROM public.services WHERE provider_service_id='manual-adsterra-impressions';
  IF s_imp IS NULL THEN
    INSERT INTO public.services(provider_id, provider_service_id, name, category, description, price, min_quantity, max_quantity, is_active)
    VALUES (NULL,'manual-adsterra-impressions','Adsterra Impressions','Adsterra','Manual delivery by admin',0.5,1000,10000000,true) RETURNING id INTO s_imp;
  END IF;
  SELECT id INTO s_vis FROM public.services WHERE provider_service_id='manual-adsterra-visits';
  IF s_vis IS NULL THEN
    INSERT INTO public.services(provider_id, provider_service_id, name, category, description, price, min_quantity, max_quantity, is_active)
    VALUES (NULL,'manual-adsterra-visits','Adsterra Visits / Traffic','Adsterra','Manual delivery by admin',1,100,1000000,true) RETURNING id INTO s_vis;
  END IF;
  SELECT id INTO s_clk FROM public.services WHERE provider_service_id='manual-adsterra-clicks';
  IF s_clk IS NULL THEN
    INSERT INTO public.services(provider_id, provider_service_id, name, category, description, price, min_quantity, max_quantity, is_active)
    VALUES (NULL,'manual-adsterra-clicks','Adsterra Clicks','Adsterra','Manual delivery by admin',3,100,1000000,true) RETURNING id INTO s_clk;
  END IF;

  SELECT id INTO b_id FROM public.engagement_bundles WHERE platform='adsterra' LIMIT 1;
  IF b_id IS NULL THEN
    INSERT INTO public.engagement_bundles(name, platform, description, icon, is_active, sort_order, ai_organic_enabled)
    VALUES ('Adsterra Monetization','adsterra','Impressions and visits for website links','Megaphone',true,99,false)
    RETURNING id INTO b_id;
    INSERT INTO public.bundle_items(bundle_id, service_id, engagement_type, ratio_percent, is_base, sort_order) VALUES
      (b_id, s_imp, 'impressions', 100, true, 0),
      (b_id, s_vis, 'visits', 10, false, 1);
  END IF;
END $$;
