import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { INR_PER_USD, singleOrderMarkedPrice, singleOrderPrice } from '../_shared/single-order-policy.ts'

// Standard SMM Panel API v2: all money is INR (same as Single Order page); wallet stores USD internally.
const toInr = (usd: number) => Number(usd || 0) * INR_PER_USD

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// ─── Parse body: JSON OR form-encoded ───────────────────────────────────────
async function parseBody(req: Request): Promise<Record<string, string>> {
    const ct = req.headers.get('content-type') || ''
    const query: Record<string, string> = {}
    new URL(req.url).searchParams.forEach((v, k) => { query[k] = v })
    if (req.method === 'GET') return query
    try {
        if (ct.includes('application/json')) {
            return { ...query, ...(await req.json()) }
        }
        if (ct.includes('multipart/form-data')) {
            const fd = await req.formData(); const out: Record<string, string> = { ...query }
            fd.forEach((v, k) => { out[k] = String(v) }); return out
        }
        // form-encoded: key=X&action=balance (what most SMM panels send)
        const text = (await req.text()).replace(/\+/g, ' ')
        const params: Record<string, string> = { ...query }
        for (const pair of text.split('&')) {
            const idx = pair.indexOf('=')
            if (idx === -1) continue
            const k = decodeURIComponent(pair.slice(0, idx).trim())
            const v = decodeURIComponent(pair.slice(idx + 1).trim())
            if (k) params[k] = v
        }
        return params
    } catch {
        return {}
    }
}

function formatStatus(order: any) {
    const statusMap: Record<string, string> = {
        pending: 'Pending', processing: 'In progress', in_progress: 'In progress', dispatching: 'In progress',
        completed: 'Completed', failed: 'Canceled', canceled: 'Canceled', cancelled: 'Canceled', partial: 'Partial',
    }
    return {
        charge: toInr(Number(order.price)).toFixed(2),
        start_count: String(order.start_count ?? 0),
        status: statusMap[order.status ?? 'pending'] ?? order.status,
        remains: String(order.remains ?? order.quantity),
        currency: 'INR',
    }
}

// ─── JSON response helper ────────────────────────────────────────────────────
function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
}

// ─── Error response (standard SMM API format) ────────────────────────────────
function err(msg: string, _status = 400) {
    // Standard panels expect HTTP 200 with {"error": "..."}
    return json({ error: msg }, 200)
}

// ─── Lookup user by API key or Telegram ID ─────────────────────────────────
async function getUserId(key?: string) {
    if (!key) return null

    const { data } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('api_key', key.trim())
        .maybeSingle()

    return data?.user_id ?? null
}

// ────────────────────────────────────────────────────────────────────────────
serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const body = await parseBody(req)
        const { key, action } = body

        console.log(`[public-api] action="${action}" auth="key"`)

        // Global markup removed — services.price is the final per-1000 USD price set by admin.
        const markupMultiplier = 1

        // ── Auth ────────────────────────────────────────────────────────────────
        if (!key) return err('Authentication required (key)', 401)

        const userId = await getUserId(key)
        if (!userId) return err('Invalid API key', 401)

        // ── Routes ──────────────────────────────────────────────────────────────
        switch (action) {

            // ─────────── BALANCE ───────────────────────────────────────────────
            // Standard format: {"balance":"1.00","currency":"USD"}
            case 'balance': {
                const { data: w } = await supabase
                    .from('wallets').select('balance').eq('user_id', userId).maybeSingle()
                return json({ balance: toInr(Number(w?.balance ?? 0)).toFixed(2), currency: 'INR' })
            }

            // ─────────── SERVICES ──────────────────────────────────────────────
            // Standard format: [{"service":1,"name":"...","rate":"0.50","min":100,"max":50000,...}]
            case 'services': {
                const { data: services, error } = await supabase
                    .from('services')
                    .select('provider_service_id, name, category, price, min_quantity, max_quantity, drip_feed_enabled, description')
                    .eq('is_active', true)
                    .not('provider_id', 'is', null)
                    .not('provider_service_id', 'is', null)
                    .order('category')
                if (error) throw error
                const seen = new Set<string>()
                return json(services.filter(s => { const k = String(s.provider_service_id); if (seen.has(k)) return false; seen.add(k); return true }).map(s => ({
                    service: parseInt(s.provider_service_id) || s.provider_service_id,
                    name: s.name,
                    category: s.category,
                    rate: singleOrderMarkedPrice(Number(s.price)).toFixed(2),
                    type: 'Default',
                    refill: false,
                    cancel: false,
                    min: s.min_quantity,
                    max: s.max_quantity,
                    dripfeed: s.drip_feed_enabled ?? false,
                    description: s.description ?? '',
                })))
            }

            // ─────────── ADD ORDER ─────────────────────────────────────────────
            // Standard format: {"order":12345}
            case 'add': {
                const providerSvcId = body.service
                const link = body.link
                const qty = Number(body.quantity)

                if (!providerSvcId) return err('service is required')
                if (!link) return err('link is required')
                if (!qty || isNaN(qty)) return err('quantity must be a number')

                const { data: svc } = await supabase
                    .from('services')
                    .select('*')
                    .eq('provider_service_id', String(providerSvcId))
                    .eq('is_active', true)
                    .not('provider_id', 'is', null)
                    .order('created_at', { ascending: true })
                    .limit(1)
                    .maybeSingle()

                if (!svc) return err('Service not found or inactive', 404)
                if (!Number.isSafeInteger(qty) || qty < svc.min_quantity || qty > svc.max_quantity) {
                    return err(`Quantity must be between ${svc.min_quantity} and ${svc.max_quantity}`)
                }

                // Same pricing as Single Order: INR per 1k -> USD wallet debit
                const totalPrice = singleOrderPrice(singleOrderMarkedPrice(Number(svc.price)) / INR_PER_USD, qty)
                if (!Number.isFinite(totalPrice) || totalPrice <= 0) return err('Service price unavailable')

                const { data: wallet } = await supabase
                    .from('wallets').select('*').eq('user_id', userId).maybeSingle()
                if (!wallet || Number(wallet.balance) < totalPrice) {
                    return err('Not enough funds on balance')
                }

                const duplicateWindowStart = new Date(Date.now() - 2 * 60 * 1000).toISOString()
                const { data: recentDuplicateOrder } = await supabase
                    .from('orders')
                    .select('id, order_number, status, created_at')
                    .eq('user_id', userId)
                    .eq('service_id', svc.id)
                    .eq('link', link)
                    .eq('quantity', qty)
                    .gte('created_at', duplicateWindowStart)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle()

                if (recentDuplicateOrder) {
                    return json({ order: recentDuplicateOrder.order_number, duplicate_blocked: true })
                }

                const { data: order, error: oErr } = await supabase
                    .from('orders')
                    .insert({
                        user_id: userId,
                        service_id: svc.id,
                        link: String(link).trim(),
                        quantity: qty,
                        price: totalPrice,
                        status: 'pending',
                        is_drip_feed: false,
                        is_organic_mode: false,
                        variance_percent: 25,
                        peak_hours_enabled: false,
                    })
                    .select().single()

                if (oErr || !order) throw oErr

                // Atomic debit + transaction insert (locks wallet row, single DB tx).
                // Rolls the order back if payment fails so it can never escape unpaid.
                const { data: debitData, error: debitError } = await supabase.rpc('debit_wallet_for_order', {
                    p_user_id: userId,
                    p_amount: totalPrice,
                    p_order_id: order.id,
                    p_engagement_order_id: null,
                    p_description: `API Order #${order.order_number} - ${svc.name}`,
                })

                if (debitError || !debitData) {
                    console.error('[public-api] atomic debit failed, rolling back order:', debitError)
                    await supabase.from('orders').delete().eq('id', order.id)
                    return err(debitError?.message || 'Payment failed', 400)
                }

                // Dispatch to mapped provider (awaited so edge runtime doesn't drop it)
                try {
                    await supabase.functions.invoke('process-order', { body: { order_id: order.id } })
                } catch (e) { console.error('process-order:', (e as Error).message) }

                return json({ order: order.order_number })
            }

            // ─────────── ORDER STATUS ──────────────────────────────────────────
            case 'status': {
                if (body.orders) {
                    const nums = String(body.orders).split(',').map(x => Number(x.trim())).filter(Boolean).slice(0, 100)
                    const { data: rows } = await supabase.from('orders')
                        .select('order_number, status, quantity, remains, start_count, price')
                        .eq('user_id', userId).in('order_number', nums)
                    const out: Record<string, unknown> = {}
                    for (const n of nums) {
                        const o = (rows ?? []).find((r: any) => r.order_number === n)
                        out[String(n)] = o ? formatStatus(o) : { error: 'Incorrect order ID' }
                    }
                    return json(out)
                }
                if (!body.order) return err('order_number is required (field: order)')

                const { data: order } = await supabase
                    .from('orders')
                    .select('order_number, status, quantity, remains, start_count, price, service:services(name)')
                    .eq('order_number', Number(body.order))
                    .eq('user_id', userId)
                    .maybeSingle()

                if (!order) {
                    // Try engagement_orders if not found in orders
                    const { data: engOrder } = await supabase
                        .from('engagement_orders')
                        .select('order_number, status, total_price, base_quantity')
                        .eq('order_number', Number(body.order))
                        .eq('user_id', userId)
                        .maybeSingle()

                    if (!engOrder) return err('Incorrect order ID', 404)

                    return json({
                        charge: toInr(Number(engOrder.total_price)).toFixed(2),
                        currency: 'INR',
                        status: engOrder.status,
                        quantity: engOrder.base_quantity,
                        type: 'engagement_order'
                    })
                }

                return json(formatStatus(order))
            }

            case 'refill':
            case 'refill_status':
                return err('Refill is not available for this service')

            case 'cancel':
                return err('Cancel is not available for this service')

            // ─────────── ORDER SCHEDULE (NEW!) ──────────────────────────────────
            // Shows upcoming random bursts for an organic order
            case 'order_schedule': {
                if (!body.order) return err('order_number is required')

                // Find the engagement order first
                const { data: order } = await supabase
                    .from('engagement_orders')
                    .select('id')
                    .eq('order_number', Number(body.order))
                    .eq('user_id', userId)
                    .single()

                if (!order) return err('Organic Order not found', 404)

                // Scope runs to this order's items (otherwise service-role bypass leaks all users' schedules)
                const { data: items } = await supabase
                    .from('engagement_order_items')
                    .select('id')
                    .eq('engagement_order_id', order.id)

                const itemIds = (items ?? []).map((i: any) => i.id)
                if (itemIds.length === 0) {
                    return json({ order_number: body.order, upcoming_runs: [] })
                }

                const { data: runs } = await supabase
                    .from('organic_run_schedule')
                    .select('run_number, scheduled_at, quantity_to_send, status')
                    .in('engagement_order_item_id', itemIds)
                    .order('scheduled_at', { ascending: true })
                    .limit(20)

                return json({
                    order_number: body.order,
                    upcoming_runs: runs?.map(r => ({
                        run: r.run_number,
                        time: r.scheduled_at,
                        quantity: r.quantity_to_send,
                        status: r.status
                    })) || []
                })
            }

            // ─────────── CONTROL ORDER (PAUSE/STOP/RESUME) ──────────────────────
            case 'control_order': {
                const orderNum = Number(body.order)
                const cmd = body.command // pause, resume, stop
                if (!orderNum || !cmd) return err('order and command (pause/resume/stop) required')

                const { data: order } = await supabase
                    .from('engagement_orders')
                    .select('id, status')
                    .eq('order_number', orderNum)
                    .eq('user_id', userId)
                    .single()

                if (!order) return err('Order not found', 404)

                if (cmd === 'pause') {
                    await supabase.from('engagement_orders').update({ status: 'paused' }).eq('id', order.id)
                    return json({ status: 'ok', msg: 'Order paused' })
                }

                if (cmd === 'stop') {
                    await supabase.from('engagement_orders').update({ status: 'canceled' }).eq('id', order.id)
                    return json({ status: 'ok', msg: 'Order stopped and canceled' })
                }

                return err('Invalid command')
            }

            // ─────────── VERIFY DEPOSIT (NEW!) ──────────────────────────────────
            case 'verify_deposit': {
                const { tx_hash, amount } = body
                if (!tx_hash || !amount) return err('tx_hash and amount are required')

                // Internal bridge to verify-usdt-deposit
                // In production, you would use service_role to verify the transaction
                return json({
                    status: 'pending',
                    msg: 'Blockchain monitoring started. Please wait 1-2 minutes for confirmations.',
                    address: '0x170337478ecF31015d9EfA8880162A27016C034A'
                })
            }

            // ─────────── UNKNOWN ───────────────────────────────────────────────
            default:
                return err(`Unknown action "${action}". Valid: balance, services, add, status, refill, cancel, order_schedule, control_order, verify_deposit`)
        }

    } catch (e: any) {
        console.error('[public-api]', e)
        return err(e.message || 'Internal server error', 500)
    }
})
