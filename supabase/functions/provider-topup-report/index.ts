import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { generateProviderTopupReport } from '../_shared/provider-topup-report.ts';
import { withDeadline } from '../_shared/fund-bot-policy.ts';

Deno.serve(async (req) => {
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return reply({ error: 'POST required' }, 405);
  try {
    const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const token = req.headers.get('Authorization')?.replace(/^Bearer /, '');
    if (!token) return reply({ error: 'Unauthorized' }, 401);
    const { data: auth, error: authError } = await db.auth.getUser(token);
    if (authError || !auth.user) return reply({ error: 'Unauthorized' }, 401);
    const { data: roles, error: roleError } = await db.from('user_roles').select('role').eq('user_id', auth.user.id);
    if (roleError || !roles?.some(r => r.role === 'admin')) return reply({ error: 'Admin access required' }, 403);
    const body = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length) return reply({ error: 'Expected empty object' }, 400);
    return reply(await withDeadline(generateProviderTopupReport(db), 40000));
  } catch { return reply({ error: 'Unable to generate provider report. Please retry.' }, 500); }
});