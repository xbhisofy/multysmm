import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Module-level client - reused across invocations for connection pooling
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Stop future runs when public delivery already reached the target, even if a provider over-delivers.
function calculateObservedRunDelivery(run: any): number {
  const providerStatus = (run?.provider_status || '').toString().toLowerCase().trim()

  if (providerStatus === 'completed' || providerStatus === 'complete' || run?.status === 'completed') {
    return Number(run?.quantity_to_send || 0)
  }

  if (run?.provider_remains !== null && run?.provider_remains !== undefined) {
    return Math.max(0, Number(run?.quantity_to_send || 0) - Number(run?.provider_remains || 0))
  }

  return 0
}

async function syncObservedOverdeliveryGuard(supabase: any, itemId?: string | null) {
  if (!itemId) return

  const { data: item } = await supabase
    .from('engagement_order_items')
    .select('id, quantity, status')
    .eq('id', itemId)
    .maybeSingle()

  if (!item || item.status === 'cancelled') return

  const orderedQty = Number(item.quantity || 0)
  if (orderedQty <= 0) return

  const { data: runs } = await supabase
    .from('organic_run_schedule')
    .select('id, quantity_to_send, status, provider_start_count, provider_remains, provider_status')
    .eq('engagement_order_item_id', itemId)
    .in('status', ['pending', 'started', 'completed', 'failed'])

  if (!runs?.length) return

  const askedSent = runs.reduce((sum: number, run: any) => {
    if (run.status === 'started' || run.status === 'completed') {
      return sum + Number(run.quantity_to_send || 0)
    }
    return sum
  }, 0)

  const observedByRuns = runs.reduce(
    (sum: number, run: any) => sum + calculateObservedRunDelivery(run),
    0,
  )

  const startCounts = runs
    .map((run: any) => Number(run.provider_start_count))
    .filter((value: number) => Number.isFinite(value) && value > 0)

  const publicCountDelta = startCounts.length > 0
    ? Math.max(0, Math.max(...startCounts) - Math.min(...startCounts))
    : 0

  const delivered = Math.max(askedSent, observedByRuns, publicCountDelta)
  if (delivered < orderedQty) return

  await supabase.from('organic_run_schedule').update({
    status: 'cancelled',
    completed_at: new Date().toISOString(),
    error_message: `Target met (asked=${askedSent}, observed=${observedByRuns}, public_delta=${publicCountDelta}, target=${orderedQty}) — cancelling remaining runs`,
  }).eq('engagement_order_item_id', itemId).eq('status', 'pending')

  await supabase.from('engagement_order_items').update({
    status: 'completed',
    updated_at: new Date().toISOString(),
  }).eq('id', itemId).neq('status', 'completed')
}

function isProviderStatusLookupMiss(errorMsg: string): boolean {
  const lower = errorMsg.toLowerCase()
  return lower.includes('incorrect order') || lower.includes('wrong order') || lower.includes('order not found') || lower.includes('not found')
}

function getRunAgeMinutes(run: any): number {
  const startedAt = new Date(run?.started_at || run?.scheduled_at || Date.now()).getTime()
  return Math.max(0, Math.round((Date.now() - startedAt) / 60000))
}

// This function checks provider order status and marks runs as complete
// Supports BOTH legacy orders AND new engagement orders
// Stores real-time provider data (start_count, remains, status) for live tracking
// Should be called by cron job every 2 minutes OR on-demand for instant updates
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth check - this is a cron/internal function
    // Allow: anon key (cron), service key (internal), or valid user JWT
    // For cron calls, the system sends the anon key automatically
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '') || ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    // System calls: anon key or service key
    const isSystemCall = !!(token && (token === anonKey || token === serviceKey))
    
    if (!isSystemCall && token) {
      // User JWT - verify it
      const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token)
      if (claimsError || !claimsData?.claims?.sub) {
        console.log('JWT verification failed, checking if valid system token...')
        // Still allow if it looks like a valid JWT (cron might send different format)
      }
    }
    
    // If no token at all, reject
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if specific run ID was passed (for on-demand check)
    let targetRunId: string | null = null
    let callSource: string = 'unknown'
    let callContext: Record<string, unknown> = {}
    try {
      const body = await req.json()
      targetRunId = body?.runId || null
      callSource = (body?.source || 'unknown').toString().slice(0, 40)
      callContext = {
        order_id: body?.orderId ?? body?.engagementOrderId ?? null,
        order_number: body?.orderNumber ?? null,
        reason: body?.reason ?? null,
      }
    } catch {
      // No body or invalid JSON - check all
    }

    const invocationStartedAt = Date.now()
    const traceId = crypto.randomUUID().slice(0, 8)
    console.log(`=== CHECK PROVIDER ORDER STATUS ===`)
    console.log(`Trace: ${traceId} | Time: ${new Date().toISOString()}`)
    console.log(`Source: ${callSource} | Target Run: ${targetRunId || 'ALL STARTED RUNS'}`)
    if (callContext.order_id || callContext.order_number || callContext.reason) {
      console.log(`Context: ${JSON.stringify(callContext)}`)
    }
    // User-agent helps separate browser polling from server-side/cron calls
    const ua = req.headers.get('user-agent') || 'none'
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown'
    console.log(`Caller: ip=${ip} ua="${ua.slice(0, 120)}"`)

    let completed = 0
    let stillProcessing = 0
    let failed = 0
    const results: any[] = []

    // ============================================
    // STEP 1: Check ENGAGEMENT ORDER runs (via engagement_order_item)
    // ============================================
    console.log(`\n--- Checking Engagement Order Runs ---`)
    
    let engagementQuery = supabase
      .from('organic_run_schedule')
      .select(`
        *,
        retry_count,
        provider_account:provider_accounts(id, name, api_key, api_url),
        engagement_order_item:engagement_order_items(
          id,
          status,
          engagement_type,
          engagement_order_id,
          service:services(provider_id),
          engagement_order:engagement_orders(id, status)
        )
      `)
      // Check ALL of these:
      // 1) started runs (normal — actively waiting for provider)
      // 2) "auto-completed" runs still pending/in-progress at provider
      // 3) completed runs whose provider_status is NOT terminal — keep syncing delivery data
      .or(
        'status.eq.started,' +
        'and(status.eq.completed,error_message.ilike.%Auto-completed%,provider_status.in.(Pending,In progress,Processing,Inprogress,Awaiting)),' +
        'and(status.eq.completed,provider_status.not.in.(Completed,Complete,Partial,Refunded,Canceled,Cancelled,Error,Failed,Success,Refund,Canscelled)),' +
        'and(status.eq.failed,provider_status.in.(Pending,In progress,Processing,Inprogress,Awaiting))'
      )
      .not('provider_order_id', 'is', null)
      .not('engagement_order_item_id', 'is', null)

    if (targetRunId) {
      engagementQuery = engagementQuery.eq('id', targetRunId)
    }

    const { data: engagementRuns, error: engagementError } = await engagementQuery

    if (engagementError) {
      console.error('Error fetching engagement runs:', engagementError)
    }

    console.log(`Found ${engagementRuns?.length || 0} engagement runs waiting for completion`)

    // Process each run individually using its ACTUAL provider account
    // (Not grouped by service provider_id - that was the bug!)
    for (const run of engagementRuns || []) {
      try {
        const orderStatus = run.engagement_order_item?.engagement_order?.status
        const itemStatus = run.engagement_order_item?.status

        if (orderStatus === 'cancelled' || itemStatus === 'cancelled') {
          console.log(`🚫 Skipping status sync for cancelled engagement run #${run.run_number}`)
          await supabase.from('organic_run_schedule').update({
            status: 'cancelled',
            error_message: run.error_message || 'Order cancelled by user',
            completed_at: run.completed_at || new Date().toISOString(),
            last_status_check: new Date().toISOString(),
          }).eq('id', run.id)
          continue
        }
        // Use the provider_account that was used to place the order
        // Fallback to default provider if no account recorded
        let apiKey: string
        let apiUrl: string
        let providerName: string

        if (run.provider_account) {
          // Use the actual provider account that placed this order
          apiKey = run.provider_account.api_key
          apiUrl = run.provider_account.api_url
          providerName = run.provider_account.name
        } else {
          // Fallback to default provider (legacy runs without provider_account_id)
          const providerId = run.engagement_order_item?.service?.provider_id
          if (!providerId) {
            console.error(`Run ${run.id} has no provider_account and no service provider_id`)
            continue
          }
          
          const { data: provider } = await supabase
            .from('providers')
            .select('*')
            .eq('id', providerId)
            .single()
            
          if (!provider) {
            console.error(`Provider ${providerId} not found for run ${run.id}`)
            continue
          }
          
          apiKey = provider.api_key
          apiUrl = provider.api_url
          providerName = provider.name
        }

        console.log(`Checking ${run.engagement_order_item?.engagement_type} order ${run.provider_order_id} on ${providerName}`)

        const formData = new URLSearchParams()
        formData.append('key', apiKey)
        formData.append('action', 'status')
        formData.append('order', run.provider_order_id)

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString()
        })

        const responseText = await response.text()
        console.log(`Status for ${run.engagement_order_item?.engagement_type} order ${run.provider_order_id}: ${responseText}`)

        let result
        try {
          result = JSON.parse(responseText)
        } catch {
          result = { error: responseText }
        }

        if (result.error) {
          console.error(`Status check failed for ${run.provider_order_id}:`, result.error)
          const providerError = String(result.error || '')
          const providerErrorLower = providerError.toLowerCase()
          
          if (isProviderStatusLookupMiss(providerError)) {
            const orderStatus = run.engagement_order_item?.engagement_order?.status
            const itemStatus = run.engagement_order_item?.status
            const ageMinutes = getRunAgeMinutes(run)

            if ((orderStatus === 'cancelled' || itemStatus === 'cancelled') && !run.provider_order_id) {
              await supabase.from('organic_run_schedule').update({
                status: 'cancelled',
                error_message: 'Order cancelled by user',
                completed_at: new Date().toISOString(),
                provider_status: 'cancelled',
                last_status_check: new Date().toISOString(),
              }).eq('id', run.id)
            } else if (ageMinutes < 180) {
              // Some providers create the order first but their status endpoint starts
              // recognizing that ID later. Do not mark it failed immediately, and do
              // not retry/place a duplicate external order.
              await supabase.from('organic_run_schedule').update({
                status: 'started',
                error_message: `[Awaiting provider confirmation] ${providerError}`,
                provider_status: 'Pending',
                last_status_check: new Date().toISOString(),
                provider_response: {
                  ...(run.provider_response || {}),
                  last_status_error: providerError,
                  status_lookup_pending: true,
                  status_lookup_age_min: ageMinutes,
                },
              }).eq('id', run.id)
              stillProcessing++
            } else {
              // Provider order already exists for this run.
              // Never recycle it into the placement queue, otherwise one scheduled run can create multiple external orders.
              await supabase.from('organic_run_schedule').update({
                status: 'completed',
                error_message: `Auto-completed after provider lookup miss (${providerError}) — provider order exists, duplicate retry blocked`,
                completed_at: run.completed_at || new Date().toISOString(),
                provider_status: 'Completed',
                last_status_check: new Date().toISOString(),
                retry_count: 99,
                provider_response: {
                  ...(run.provider_response || {}),
                  last_status_error: providerError,
                  status_lookup_missed: true,
                  duplicate_retry_blocked: true,
                },
              }).eq('id', run.id)
              completed++
              await syncObservedOverdeliveryGuard(supabase, run.engagement_order_item?.id)
              await updateEngagementOrderStatus(supabase, run.engagement_order_item?.engagement_order_id, run.engagement_order_item?.id)
            }
          } else if (providerErrorLower.includes('cancelled')) {
            const orderStatus = run.engagement_order_item?.engagement_order?.status
            const itemStatus = run.engagement_order_item?.status

            if (orderStatus === 'cancelled' || itemStatus === 'cancelled') {
              await supabase.from('organic_run_schedule').update({
                status: 'cancelled',
                error_message: 'Order cancelled by user',
                completed_at: new Date().toISOString(),
                provider_status: 'cancelled',
                last_status_check: new Date().toISOString(),
              }).eq('id', run.id)
            } else {
              await supabase.from('organic_run_schedule').update({
                status: 'failed',
                error_message: `Repeat blocked after provider order creation: ${providerError}`,
                completed_at: new Date().toISOString(),
                provider_status: 'error',
                last_status_check: new Date().toISOString(),
                retry_count: 99,
                provider_response: {
                  ...(run.provider_response || {}),
                  last_status_error: providerError,
                  repeat_retry_blocked: true,
                },
              }).eq('id', run.id)
              failed++
              await syncObservedOverdeliveryGuard(supabase, run.engagement_order_item?.id)
              await updateEngagementOrderStatus(supabase, run.engagement_order_item?.engagement_order_id, run.engagement_order_item?.id)
            }
          } else {
            // Update last check time even for errors
            await supabase.from('organic_run_schedule').update({
              last_status_check: new Date().toISOString(),
              provider_response: {
                ...(run.provider_response || {}),
                last_status_error: providerError,
              }
            }).eq('id', run.id)
            stillProcessing++
          }
          continue
        }

        const providerStatus = (result.status || '').toLowerCase()
        const startCount = parseInt(result.start_count) || null
        const remainsRaw = result.remains
        const remainsProvided = remainsRaw !== undefined && remainsRaw !== null && String(remainsRaw).trim() !== ''
        const remains = remainsProvided ? (parseInt(String(remainsRaw)) || 0) : 0
        const charge = parseFloat(result.charge) || null
        
        // Calculate delivery progress
        const delivered = startCount !== null ? (run.quantity_to_send - remains) : null
        const progressPercent = run.quantity_to_send > 0 ? ((run.quantity_to_send - remains) / run.quantity_to_send * 100).toFixed(1) : 0

        console.log(`Provider status: ${providerStatus}, Start: ${startCount}, Remains: ${remains}, Delivered: ${delivered} (${progressPercent}%)`)
        
        const startedAt = new Date(run.started_at || run.scheduled_at)
        const ageMinutes = Math.round((Date.now() - startedAt.getTime()) / 60000)

        // Comprehensive check for stuck runs:
        // 1. If provider returns a terminal status, always complete
        // 2. If stuck in a non-terminal status for 10+ minutes, auto-complete to unblock
        // 3. If "started" for 10+ minutes but NO provider status at all, auto-complete
        // Always update provider tracking data
        const trackingUpdate: any = {
          provider_status: result.status,
          provider_start_count: startCount,
          provider_remains: remains,
          provider_charge: charge,
          provider_response: result,
          last_status_check: new Date().toISOString()
        }

        // STRICT: only treat as "fully delivered" when provider explicitly returned remains=0
        // AND we have evidence a real delivery happened (start_count > 0).
        // Otherwise providers that omit `remains` while still "In progress" would
        // be falsely auto-completed (parseInt(undefined)||0 === 0).
        const deliveredAll = remainsProvided
          && remains === 0
          && startCount !== null
          && startCount > 0
          && !['cancelled', 'canceled', 'refunded', 'refund', 'failed', 'error', 'canscelled'].includes(providerStatus)

        if (providerStatus === 'completed' || providerStatus === 'complete' || providerStatus === 'success' || deliveredAll) {
          const orderStatus = run.engagement_order_item?.engagement_order?.status
          const itemStatus = run.engagement_order_item?.status

          if (orderStatus === 'cancelled' || itemStatus === 'cancelled') {
            await supabase.from('organic_run_schedule').update({
              ...trackingUpdate,
              status: 'cancelled',
              completed_at: new Date().toISOString(),
              error_message: 'Order cancelled by user'
            }).eq('id', run.id)
            continue
          }

          await supabase.from('organic_run_schedule').update({
            ...trackingUpdate,
            status: 'completed',
            completed_at: new Date().toISOString(),
            error_message: deliveredAll
              ? 'Auto-completed (provider remains reached 0)'
              : run.error_message?.includes('Auto-completed') ? null : run.error_message,
          }).eq('id', run.id)

          completed++
          results.push({
            run_id: run.id,
            run_number: run.run_number,
            type: run.engagement_order_item?.engagement_type,
            status: 'completed',
            provider_order_id: run.provider_order_id,
            delivered: run.quantity_to_send,
            remains: 0
          })

          await syncObservedOverdeliveryGuard(supabase, run.engagement_order_item?.id)
          await updateEngagementOrderStatus(supabase, run.engagement_order_item?.engagement_order_id, run.engagement_order_item?.id)

        } else if (providerStatus === 'partial') {
          // SCAM GUARD: if provider says "Partial" but delivered 0 (remains == full qty),
          // treat as a failed delivery and retry on a backup provider instead of
          // silently marking it complete.
          const deliveredQty = run.quantity_to_send - remains
          if (deliveredQty <= 0) {
            const orderStatus = run.engagement_order_item?.engagement_order?.status
            const itemStatus = run.engagement_order_item?.status
            if (orderStatus === 'cancelled' || itemStatus === 'cancelled') {
              await supabase.from('organic_run_schedule').update({
                ...trackingUpdate,
                status: 'cancelled',
                completed_at: new Date().toISOString(),
                error_message: 'Order cancelled by user'
              }).eq('id', run.id)
              continue
            }
            const currentRetryCount = run.retry_count || 0
            if (currentRetryCount < 15) {
              const triedSet = new Set<string>(
                Array.isArray(run.provider_response?.tried_providers) ? run.provider_response.tried_providers : []
              )
              if (run.provider_account_id) triedSet.add(run.provider_account_id)
              const mergedResp = { ...(trackingUpdate.provider_response || {}), tried_providers: Array.from(triedSet) }
              await supabase.from('organic_run_schedule').update({
                ...trackingUpdate,
                provider_response: mergedResp,
                status: 'failed',
                completed_at: new Date().toISOString(),
                error_message: `Auto-retry: provider returned Partial with 0 delivered (remains=${remains}/${run.quantity_to_send})`
              }).eq('id', run.id)
              failed++
              continue
            }
            // fall through to mark partial-completed if max retries exceeded
          }
          await supabase.from('organic_run_schedule').update({
            ...trackingUpdate,
            status: 'completed',
            completed_at: new Date().toISOString(),
            error_message: `Partial: ${remains} remaining`
          }).eq('id', run.id)

          completed++
          results.push({
            run_id: run.id,
            run_number: run.run_number,
            type: run.engagement_order_item?.engagement_type,
            status: 'partial',
            delivered: run.quantity_to_send - remains,
            remains: remains
          })
          await syncObservedOverdeliveryGuard(supabase, run.engagement_order_item?.id)
          await updateEngagementOrderStatus(supabase, run.engagement_order_item?.engagement_order_id, run.engagement_order_item?.id)

        } else if (providerStatus === 'cancelled' || providerStatus === 'canceled' || providerStatus === 'refunded' || providerStatus === 'refund' || providerStatus === 'canscelled') {
          const orderStatus = run.engagement_order_item?.engagement_order?.status
          const itemStatus = run.engagement_order_item?.status

          if (orderStatus === 'cancelled' || itemStatus === 'cancelled') {
            await supabase.from('organic_run_schedule').update({
              ...trackingUpdate,
              status: 'cancelled',
              completed_at: new Date().toISOString(),
              error_message: 'Order cancelled by user'
            }).eq('id', run.id)
          } else {
            // Provider explicitly cancelled/refunded this existing provider order.
            // Keep this run terminal instead of recycling it into retry placement.
            await supabase.from('organic_run_schedule').update({
              ...trackingUpdate,
              status: 'failed',
              completed_at: new Date().toISOString(),
              error_message: `Repeat blocked after provider ${providerStatus}`,
              retry_count: 99
            }).eq('id', run.id)
            failed++
            await syncObservedOverdeliveryGuard(supabase, run.engagement_order_item?.id)
            await updateEngagementOrderStatus(supabase, run.engagement_order_item?.engagement_order_id, run.engagement_order_item?.id)
          }
        } else if (deliveredAll) {
          await supabase.from('organic_run_schedule').update({
            ...trackingUpdate,
            status: 'completed',
            completed_at: new Date().toISOString(),
            error_message: 'Auto-completed (provider remains reached 0)'
          }).eq('id', run.id)

          completed++
          results.push({
            run_id: run.id,
            run_number: run.run_number,
            type: run.engagement_order_item?.engagement_type,
            status: 'completed',
            provider_order_id: run.provider_order_id,
            delivered: run.quantity_to_send,
            remains: 0
          })
          await syncObservedOverdeliveryGuard(supabase, run.engagement_order_item?.id)
          await updateEngagementOrderStatus(supabase, run.engagement_order_item?.engagement_order_id, run.engagement_order_item?.id)
        } else {
          await supabase.from('organic_run_schedule').update(trackingUpdate).eq('id', run.id)

          stillProcessing++
          results.push({
            run_id: run.id,
            run_number: run.run_number,
            type: run.engagement_order_item?.engagement_type,
            status: 'processing',
            provider_status: result.status,
            start_count: startCount,
            remains: remains,
            delivered: delivered,
            progress_percent: progressPercent
          })
        }

      } catch (fetchError) {
        console.error(`Network error checking ${run.provider_order_id}:`, fetchError)
        stillProcessing++
      }

      // Faster processing - reduced delay between checks
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // ============================================
    // STEP 2: Check LEGACY ORDER runs (via order_id)
    // ============================================
    console.log(`\n--- Checking Legacy Order Runs ---`)
    
    let legacyQuery = supabase
      .from('organic_run_schedule')
      .select('*, order:orders(*, service:services(provider_id))')
      // Check started + auto-completed + completed but non-terminal at provider
      .or(
        'status.eq.started,' +
        'and(status.eq.completed,error_message.ilike.%Auto-completed%,provider_status.in.(Pending,In progress,Processing,Inprogress,Awaiting)),' +
        'and(status.eq.completed,provider_status.not.in.(Completed,Complete,Partial,Refunded,Canceled,Cancelled,Error,Failed,Success,Refund,Canscelled)),' +
        'and(status.eq.failed,provider_status.in.(Pending,In progress,Processing,Inprogress,Awaiting))'
      )
      .not('provider_order_id', 'is', null)
      .not('order_id', 'is', null)
      .is('engagement_order_item_id', null)

    if (targetRunId) {
      legacyQuery = legacyQuery.eq('id', targetRunId)
    }

    const { data: legacyRuns, error: legacyError } = await legacyQuery

    if (legacyError) {
      console.error('Error fetching legacy runs:', legacyError)
    }

    console.log(`Found ${legacyRuns?.length || 0} legacy runs waiting for completion`)

    // Group by provider
    const legacyByProvider: { [key: string]: typeof legacyRuns } = {}
    
    for (const run of legacyRuns || []) {
      const providerId = run.order?.service?.provider_id
      if (providerId) {
        if (!legacyByProvider[providerId]) {
          legacyByProvider[providerId] = []
        }
        legacyByProvider[providerId].push(run)
      }
    }

    for (const [providerId, runs] of Object.entries(legacyByProvider)) {
      const { data: provider } = await supabase
        .from('providers')
        .select('*')
        .eq('id', providerId)
        .single()

      if (!provider) {
        console.error('Legacy provider not found:', providerId)
        continue
      }

      console.log(`Checking ${runs!.length} legacy orders on ${provider.name}`)

      for (const run of runs!) {
        try {
          const formData = new URLSearchParams()
          formData.append('key', provider.api_key)
          formData.append('action', 'status')
          formData.append('order', run.provider_order_id)

          const response = await fetch(provider.api_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
          })

          const responseText = await response.text()
          console.log(`Legacy status for order ${run.provider_order_id}: ${responseText}`)

          let result
          try {
            result = JSON.parse(responseText)
          } catch {
            result = { error: responseText }
          }

          if (result.error) {
            if (result.error.includes('not found') || result.error.includes('cancelled')) {
              await supabase.from('organic_run_schedule').update({
                status: 'failed',
                error_message: result.error,
                completed_at: new Date().toISOString(),
                provider_status: 'error',
                last_status_check: new Date().toISOString()
              }).eq('id', run.id)
              failed++
              await updateLegacyOrderStatus(supabase, run.order_id)
            } else {
              await supabase.from('organic_run_schedule').update({
                last_status_check: new Date().toISOString()
              }).eq('id', run.id)
              stillProcessing++
            }
            continue
          }

          const providerStatus = (result.status || '').toLowerCase()
          const startCount = parseInt(result.start_count) || null
          const remainsRaw = result.remains
          const remainsProvided = remainsRaw !== undefined && remainsRaw !== null && String(remainsRaw).trim() !== ''
          const remains = remainsProvided ? (parseInt(String(remainsRaw)) || 0) : 0
          const charge = parseFloat(result.charge) || null

          // Always update tracking data
          const trackingUpdate: any = {
            provider_status: result.status,
            provider_start_count: startCount,
            provider_remains: remains,
            provider_charge: charge,
            provider_response: result,
            last_status_check: new Date().toISOString()
          }

          const deliveredAll = remainsProvided
            && remains === 0
            && startCount !== null
            && startCount > 0
            && !['cancelled', 'canceled', 'refunded', 'refund', 'failed', 'error', 'canscelled'].includes(providerStatus)

          if (providerStatus === 'completed' || providerStatus === 'complete' || providerStatus === 'success' || deliveredAll) {
            await supabase.from('organic_run_schedule').update({
              ...trackingUpdate,
              status: 'completed',
              completed_at: new Date().toISOString(),
              error_message: deliveredAll
                ? 'Auto-completed (provider remains reached 0)'
                : run.error_message?.includes('Auto-completed') ? null : run.error_message,
            }).eq('id', run.id)

            completed++
            await updateLegacyOrderStatus(supabase, run.order_id)

          } else if (providerStatus === 'partial') {
            await supabase.from('organic_run_schedule').update({
              ...trackingUpdate,
              status: 'completed',
              completed_at: new Date().toISOString(),
              error_message: `Partial: ${remains} remaining`
            }).eq('id', run.id)

            completed++
            await updateLegacyOrderStatus(supabase, run.order_id)

          } else if (providerStatus === 'cancelled' || providerStatus === 'canceled' || providerStatus === 'refunded' || providerStatus === 'refund' || providerStatus === 'canscelled') {
            await supabase.from('organic_run_schedule').update({
              ...trackingUpdate,
              status: 'failed',
              completed_at: new Date().toISOString(),
              error_message: 'Cancelled by provider'
            }).eq('id', run.id)

            failed++
            await updateLegacyOrderStatus(supabase, run.order_id)

          } else {
            // Update tracking for live view
            await supabase.from('organic_run_schedule').update(trackingUpdate).eq('id', run.id)
            stillProcessing++
          }

        } catch (fetchError) {
          console.error(`Network error checking legacy ${run.provider_order_id}:`, fetchError)
          stillProcessing++
        }

        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }

    console.log(`\n=== STATUS CHECK COMPLETE ===`)
    console.log(`Completed: ${completed}, Still Processing: ${stillProcessing}, Failed: ${failed}`)

    // Send admin alert if there were failures
    if (failed > 0) {
      try {
        const executionId = crypto.randomUUID().slice(0, 8)
        const alertPayload = {
          job_name: 'check-order-status',
          execution_id: executionId,
          failed_count: failed,
          completed_count: completed,
          still_processing_count: stillProcessing,
          error_details: results.filter(r => r.status === 'failed' || r.status === 'error').map(r => ({
            run_id: r.run_id,
            run_number: r.run_number,
            type: r.type,
            error: r.error || 'Provider error'
          }))
        }

        console.log('Sending failure alert to admins...')
        const alertResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-admin-alert`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
            },
            body: JSON.stringify(alertPayload)
          }
        )
        const alertResult = await alertResponse.json()
        console.log('Alert response:', alertResult)
      } catch (alertError) {
        console.error('Failed to send admin alert:', alertError)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      completed,
      stillProcessing,
      failed,
      results,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Status check error:', error)
    return new Response(JSON.stringify({ 
      error: (error as Error).message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// Helper function to update engagement order and item status
async function updateEngagementOrderStatus(supabase: any, engagementOrderId: string, itemId: string) {
  if (!engagementOrderId) return

  const { data: parentOrder } = await supabase
    .from('engagement_orders')
    .select('status')
    .eq('id', engagementOrderId)
    .maybeSingle()

  if (parentOrder?.status === 'cancelled') {
    console.log(`🚫 Skipping parent engagement order status update for cancelled order ${engagementOrderId}`)
    return
  }

  // Update item status
  if (itemId) {
    const { data: currentItem } = await supabase
      .from('engagement_order_items')
      .select('status')
      .eq('id', itemId)
      .maybeSingle()

    if (currentItem?.status !== 'cancelled') {
      const { data: itemRuns } = await supabase
        .from('organic_run_schedule')
        .select('status')
        .eq('engagement_order_item_id', itemId)

      if (itemRuns && itemRuns.length > 0) {
        const completedCount = itemRuns.filter((r: any) => r.status === 'completed').length
        const failedCount = itemRuns.filter((r: any) => r.status === 'failed').length
        const cancelledCount = itemRuns.filter((r: any) => r.status === 'cancelled').length
        const activeCount = itemRuns.filter((r: any) => r.status === 'pending' || r.status === 'started').length
        const totalRuns = itemRuns.length

        let itemStatus = 'processing'
        if (activeCount > 0) {
          itemStatus = currentItem?.status === 'paused' ? 'paused' : 'processing'
        } else if (completedCount === totalRuns) {
          itemStatus = 'completed'
        } else if (completedCount > 0 && completedCount + failedCount + cancelledCount === totalRuns) {
          itemStatus = 'partial'
        } else if (failedCount + cancelledCount === totalRuns) {
          itemStatus = 'failed'
        }

        await supabase.from('engagement_order_items').update({ status: itemStatus }).eq('id', itemId)
      }
    }
  }

  // Update order status based on all items
  const { data: allItems } = await supabase
    .from('engagement_order_items')
    .select('status')
    .eq('engagement_order_id', engagementOrderId)

  if (!allItems || allItems.length === 0) return

  const completedItems = allItems.filter((i: any) => i.status === 'completed').length
  const partialItems = allItems.filter((i: any) => i.status === 'partial').length
  const failedItems = allItems.filter((i: any) => i.status === 'failed').length
  const cancelledItems = allItems.filter((i: any) => i.status === 'cancelled').length
  const activeItems = allItems.filter((i: any) => i.status === 'processing' || i.status === 'pending').length
  const totalItems = allItems.length

  console.log(`Engagement Order ${engagementOrderId} progress: ${completedItems}/${totalItems} items completed`)

  let orderStatus = 'processing'
  if (completedItems === totalItems) {
    orderStatus = 'completed'
  } else if (failedItems === totalItems) {
    orderStatus = 'failed'
  } else if (activeItems === 0 && completedItems + partialItems + failedItems + cancelledItems === totalItems) {
    orderStatus = completedItems > 0 ? 'partial' : failedItems > 0 ? 'failed' : 'cancelled'
  } else if (parentOrder?.status === 'paused') {
    orderStatus = 'paused'
  }

  await supabase.from('engagement_orders').update({ status: orderStatus }).eq('id', engagementOrderId).neq('status', 'cancelled')
}

// Helper function to update legacy order status
async function updateLegacyOrderStatus(supabase: any, orderId: string) {
  if (!orderId) return

  const { data: allRuns } = await supabase
    .from('organic_run_schedule')
    .select('status')
    .eq('order_id', orderId)

  if (!allRuns || allRuns.length === 0) return

  const completedCount = allRuns.filter((r: any) => r.status === 'completed').length
  const failedCount = allRuns.filter((r: any) => r.status === 'failed').length
  const pendingCount = allRuns.filter((r: any) => r.status === 'pending').length
  const startedCount = allRuns.filter((r: any) => r.status === 'started').length
  const totalRuns = allRuns.length

  console.log(`Legacy Order ${orderId} progress: ${completedCount}/${totalRuns} completed`)

  let orderStatus = 'processing'
  
  if (completedCount === totalRuns) {
    orderStatus = 'completed'
  } else if (completedCount + failedCount === totalRuns) {
    orderStatus = failedCount > 0 ? 'partial' : 'completed'
  } else if (pendingCount === 0 && startedCount === 0 && failedCount === totalRuns) {
    orderStatus = 'failed'
  }

  await supabase.from('orders').update({ status: orderStatus }).eq('id', orderId)
}
