
-- 0) Ensure a providers row exists for every active provider_account (so FK holds)
INSERT INTO public.providers (id, name, api_key, api_url, is_active)
SELECT DISTINCT ON (pa.provider_id) pa.provider_id, pa.name, pa.api_key, pa.api_url, true
FROM public.provider_accounts pa
WHERE pa.is_active = true
ORDER BY pa.provider_id, pa.priority ASC NULLS LAST
ON CONFLICT (id) DO UPDATE
SET api_key = EXCLUDED.api_key,
    api_url = EXCLUDED.api_url,
    is_active = true;

-- 1) Normalize services.provider_id casing to match provider_accounts
UPDATE public.services s
SET provider_id = pa.provider_id
FROM public.provider_accounts pa
WHERE lower(s.provider_id) = lower(pa.provider_id)
  AND s.provider_id <> pa.provider_id;

-- 2) Backfill service_provider_mapping for any active service missing a mapping
INSERT INTO public.service_provider_mapping (service_id, provider_account_id, provider_service_id, sort_order, is_active)
SELECT s.id, pa.id, s.provider_service_id, 1, true
FROM public.services s
JOIN public.provider_accounts pa
  ON lower(pa.provider_id) = lower(s.provider_id)
 AND pa.is_active = true
WHERE s.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.service_provider_mapping m
    WHERE m.service_id = s.id AND m.provider_account_id = pa.id
  )
ON CONFLICT (service_id, provider_account_id) DO NOTHING;
