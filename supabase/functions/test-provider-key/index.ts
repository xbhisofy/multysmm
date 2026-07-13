import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { account_id, api_url: rawUrl, api_key: rawKey } = await req.json().catch(() => ({}));

    let api_url = rawUrl as string | undefined;
    let api_key = rawKey as string | undefined;

    if (account_id && (!api_url || !api_key)) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      const { data, error } = await supabase
        .from('provider_accounts')
        .select('api_url, api_key')
        .eq('id', account_id)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Account not found');
      api_url = api_url || data.api_url;
      api_key = api_key || data.api_key;
    }

    if (!api_url || !api_key) {
      return new Response(JSON.stringify({ ok: false, error: 'api_url and api_key are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const form = new URLSearchParams();
    form.set('key', api_key);
    form.set('action', 'balance');

    const started = Date.now();
    const resp = await fetch(api_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    const latency_ms = Date.now() - started;
    const text = await resp.text();

    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch { /* not json */ }

    const providerError =
      parsed && (parsed.error || parsed.Error || parsed.err_msg);

    const ok = resp.ok && parsed && !providerError &&
      (parsed.balance !== undefined || parsed.funds !== undefined);

    const balance = parsed?.balance ?? parsed?.funds ?? null;
    const currency = parsed?.currency ?? null;
    const errMsg = ok ? null : (providerError || (parsed ? 'Unexpected response' : text.slice(0, 200)));

    if (account_id) {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );
        await supabase
          .from('provider_accounts')
          .update({
            last_verified_at: new Date().toISOString(),
            last_verified_status: ok ? 'valid' : 'invalid',
            last_verified_balance: ok && balance !== null ? Number(balance) : null,
            last_verified_currency: ok ? currency : null,
            last_verified_error: ok ? null : String(errMsg ?? '').slice(0, 500),
          })
          .eq('id', account_id);
      } catch (_) { /* non-fatal */ }
    }

    return new Response(JSON.stringify({
      ok,
      status: resp.status,
      latency_ms,
      balance,
      currency,
      error: errMsg,
      raw: parsed ?? text.slice(0, 500),
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
