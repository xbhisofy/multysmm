
-- Safeguard: log + optionally block automated is_active flips on provider config tables.

CREATE OR REPLACE FUNCTION public.guard_provider_config_is_active()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
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
$$;

DROP TRIGGER IF EXISTS trg_guard_provider_accounts_is_active ON public.provider_accounts;
CREATE TRIGGER trg_guard_provider_accounts_is_active
  BEFORE UPDATE OF is_active ON public.provider_accounts
  FOR EACH ROW EXECUTE FUNCTION public.guard_provider_config_is_active();

DROP TRIGGER IF EXISTS trg_guard_spm_is_active ON public.service_provider_mapping;
CREATE TRIGGER trg_guard_spm_is_active
  BEFORE UPDATE OF is_active ON public.service_provider_mapping
  FOR EACH ROW EXECUTE FUNCTION public.guard_provider_config_is_active();

-- Make sure any silently-disabled rows are back on (defensive).
UPDATE public.service_provider_mapping SET is_active = true WHERE is_active = false;
UPDATE public.provider_accounts        SET is_active = true WHERE is_active = false;
