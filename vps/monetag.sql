-- Monetag platform: manual-fulfilment services + bundle (idempotent)
DO $$
DECLARE b_id uuid; s_imp uuid; s_vis uuid; s_clk uuid; s_combined uuid;
BEGIN
  SELECT id INTO s_imp FROM public.services WHERE provider_service_id='manual-monetag-impressions';
  IF s_imp IS NULL THEN
    INSERT INTO public.services(provider_id, provider_service_id, name, category, description, price, min_quantity, max_quantity, is_active)
    VALUES (NULL,'manual-monetag-impressions','Monetag Impressions','Monetag','Manual delivery by admin',0.5,1000,10000000,true) RETURNING id INTO s_imp;
  END IF;
  SELECT id INTO s_vis FROM public.services WHERE provider_service_id='manual-monetag-visits';
  IF s_vis IS NULL THEN
    INSERT INTO public.services(provider_id, provider_service_id, name, category, description, price, min_quantity, max_quantity, is_active)
    VALUES (NULL,'manual-monetag-visits','Monetag Visits / Traffic','Monetag','Manual delivery by admin',1,100,1000000,true) RETURNING id INTO s_vis;
  END IF;
  SELECT id INTO s_clk FROM public.services WHERE provider_service_id='manual-monetag-clicks';
  IF s_clk IS NULL THEN
    INSERT INTO public.services(provider_id, provider_service_id, name, category, description, price, min_quantity, max_quantity, is_active)
    VALUES (NULL,'manual-monetag-clicks','Monetag Clicks','Monetag','Manual delivery by admin',3,100,1000000,true) RETURNING id INTO s_clk;
  END IF;

  SELECT id INTO s_combined FROM public.services WHERE provider_service_id='manual-monetag-impressions-visits';
  IF s_combined IS NULL THEN
    INSERT INTO public.services(provider_id, provider_service_id, name, category, description, price, min_quantity, max_quantity, is_active)
    SELECT NULL,'manual-monetag-impressions-visits','Impressions / Visits',category,'Manual delivery by admin',price,min_quantity,max_quantity,true
    FROM public.services WHERE id=s_imp RETURNING id INTO s_combined;
  END IF;

  SELECT id INTO b_id FROM public.engagement_bundles WHERE platform='monetag' AND name='Monetag Monetization' LIMIT 1;
  IF b_id IS NULL THEN
    INSERT INTO public.engagement_bundles(name, platform, description, icon, is_active, sort_order, ai_organic_enabled)
    VALUES ('Monetag Monetization','monetag','Impressions and visits for website links','Globe',true,100,false)
    RETURNING id INTO b_id;
    INSERT INTO public.bundle_items(bundle_id, service_id, engagement_type, ratio_percent, is_base, sort_order) VALUES
      (b_id, s_combined, 'impressions_visits', 100, true, 0);
  END IF;
END $$;
