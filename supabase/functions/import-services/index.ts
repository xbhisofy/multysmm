import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProviderService {
  service: string
  name: string
  type: string
  rate: string
  min: string
  max: string
  dripfeed?: boolean
  refill?: boolean
  cancel?: boolean
  category?: string
  desc?: string
}

// Transform a provider service to our format
function transformService(s: ProviderService, provider_id: string, markup_percent: number, categoryOverride?: string) {
  const baseRate = parseFloat(s.rate) || 0
  const markedUpRate = baseRate * (1 + markup_percent / 100)

  let speed = 'medium'
  const nameLower = s.name.toLowerCase()
  if (nameLower.includes('instant') || nameLower.includes('fast')) {
    speed = 'instant'
  } else if (nameLower.includes('slow') || nameLower.includes('gradual')) {
    speed = 'slow'
  }

  let quality = 'standard'
  if (nameLower.includes('premium') || nameLower.includes('hq') || nameLower.includes('high quality')) {
    quality = 'premium'
  } else if (nameLower.includes('real') || nameLower.includes('active')) {
    quality = 'high'
  }

  // Use category override if provided (from bundle auto-import)
  let category = categoryOverride || s.category || s.type || 'Other'

  // Only auto-detect category if no override provided
  if (!categoryOverride) {
    const catLower = category.toLowerCase()

    if (catLower.includes('instagram')) {
      if (nameLower.includes('followers')) category = 'Instagram Followers'
      else if (nameLower.includes('like')) category = 'Instagram Likes'
      else if (nameLower.includes('view')) category = 'Instagram Views'
      else if (nameLower.includes('comment')) category = 'Instagram Comments'
      else category = 'Instagram'
    } else if (catLower.includes('tiktok')) {
      if (nameLower.includes('followers')) category = 'TikTok Followers'
      else if (nameLower.includes('like')) category = 'TikTok Likes'
      else if (nameLower.includes('view')) category = 'TikTok Views'
      else category = 'TikTok'
    } else if (catLower.includes('youtube')) {
      if (nameLower.includes('subscriber')) category = 'YouTube Subscribers'
      else if (nameLower.includes('view')) category = 'YouTube Views'
      else if (nameLower.includes('like')) category = 'YouTube Likes'
      else category = 'YouTube'
    } else if (catLower.includes('twitter') || catLower.includes('x ')) {
      category = 'Twitter/X'
    } else if (catLower.includes('facebook')) {
      category = 'Facebook'
    }
  }

  return {
    provider_id,
    provider_service_id: s.service.toString(),
    name: s.name,
    category,
    description: s.desc || null,
    price: Number(markedUpRate.toFixed(5)),
    min_quantity: parseInt(s.min) || 10,
    max_quantity: parseInt(s.max) || 100000,
    speed,
    quality,
    drip_feed_enabled: s.dripfeed === true,
    is_active: true,
    refill: s.refill ? 'Yes' : 'No',
    cancel_allowed: s.cancel ? 'Yes' : 'No',
  }
}

// Convert provider currency to USD
function convertRateToUSD(rate: string, providerCurrency: string, exchangeRates: Record<string, number>): number {
  const baseRate = parseFloat(rate) || 0;
  const fromUpper = providerCurrency.toUpperCase();
  if (fromUpper === 'USD') return baseRate;

  const fromRate = exchangeRates[fromUpper] || (fromUpper === 'INR' ? 83.5 : 1);
  return baseRate / fromRate;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify admin user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleData?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const {
      provider_id,
      markup_percent = 30,
      action = 'fetch', // 'fetch' = get list, 'import' = import specific services
      service_ids = [],  // Array of service IDs to import
      search_query = '',  // Search query for filtering
      category_override = '' // Override category for auto-import from bundles (e.g., "Instagram Saves")
    } = await req.json()

    if (!provider_id) {
      return new Response(JSON.stringify({ error: 'Provider ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Action: ${action}, Provider: ${provider_id}`)

    // Source of truth = provider_accounts (fresh keys). Fall back to providers only if no account exists.
    // Some legacy providers are saved as variants (example: "Goup 3") while the active key
    // lives on the base account (same api_url). Keep the selected account id so imported
    // services are always linked in service_provider_mapping.
    let apiKey: string | null = null
    let apiUrl: string | null = null
    let selectedProviderAccountId: string | null = null
    let providerFallback: any = null

    const { data: exactAccount } = await supabase
      .from('provider_accounts')
      .select('id, api_key, api_url, name, provider_id')
      .eq('provider_id', provider_id)
      .eq('is_active', true)
      .order('priority', { ascending: true })
      .limit(1)
      .maybeSingle()

    let account = exactAccount

    if (!account) {
      const { data: provider } = await supabase
        .from('providers')
        .select('*')
        .eq('id', provider_id)
        .maybeSingle()

      providerFallback = provider

      if (provider?.api_url) {
        const { data: urlMatchedAccount } = await supabase
          .from('provider_accounts')
          .select('id, api_key, api_url, name, provider_id')
          .eq('api_url', provider.api_url)
          .eq('is_active', true)
          .order('priority', { ascending: true })
          .limit(1)
          .maybeSingle()

        account = urlMatchedAccount
      }
    }

    if (account) {
      selectedProviderAccountId = account.id
      apiKey = account.api_key
      apiUrl = account.api_url

      // Keep providers row in sync so services FK is satisfied and keys don't go stale
      await supabase
        .from('providers')
        .upsert({
          id: provider_id,
          name: providerFallback?.name || account.name || provider_id,
          api_key: account.api_key,
          api_url: account.api_url,
          is_active: true,
        }, { onConflict: 'id' })
    } else {
      const provider = providerFallback || (await supabase
        .from('providers')
        .select('*')
        .eq('id', provider_id)
        .maybeSingle()).data

      if (provider) {
        apiKey = provider.api_key
        apiUrl = provider.api_url
      }
    }

    if (!apiKey || !apiUrl) {
      return new Response(JSON.stringify({ error: `Provider not found: ${provider_id}. Check provider_accounts table.` }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const linkServiceToSelectedAccount = async (serviceId: string, providerServiceId: string) => {
      if (!selectedProviderAccountId) {
        console.warn(`No active provider account found to link service ${serviceId} (${provider_id}:${providerServiceId})`)
        return
      }

      const { error } = await supabase.from('service_provider_mapping').upsert({
        service_id: serviceId,
        provider_account_id: selectedProviderAccountId,
        provider_service_id: providerServiceId,
        sort_order: 1,
        is_active: true
      }, { onConflict: 'service_id,provider_account_id' })

      if (error) {
        console.error(`Failed to link service ${serviceId}:`, error.message)
      }
    }

    // Fetch services from provider API
    const formData = new URLSearchParams()
    formData.append('key', apiKey)
    formData.append('action', 'services')

    console.log(`Fetching from: ${apiUrl}`)

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API Error: ${errorText}`)
      return new Response(JSON.stringify({
        error: `Provider API error: ${response.status}`,
        details: errorText
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const rawResponse = await response.json()

    // Handle provider error responses (they return { error: "..." } instead of array)
    if (!Array.isArray(rawResponse)) {
      // Check if it's an error response from the provider
      if (rawResponse?.error) {
        console.error('Provider returned error:', rawResponse.error)
        return new Response(JSON.stringify({
          error: `Provider error: ${rawResponse.error}`,
          details: rawResponse
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      console.error('Invalid API response format:', JSON.stringify(rawResponse).slice(0, 500))
      return new Response(JSON.stringify({
        error: 'Invalid API response format',
        received: typeof rawResponse,
        preview: JSON.stringify(rawResponse).slice(0, 200)
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Cast to proper type after validation
    const servicesData: ProviderService[] = rawResponse

    console.log(`Received ${servicesData.length} services from API`)

    // 1. Fetch exchange rates
    let exchangeRates: Record<string, number> = { USD: 1, INR: 83.5, EUR: 0.92, GBP: 0.79, AED: 3.67 };
    try {
      const extReq = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/get-exchange-rates`);
      if (extReq.ok) {
        const ratesData = await extReq.json();
        if (ratesData.rates) exchangeRates = ratesData.rates;
      }
    } catch (e) {
      console.error("Failed to fetch exchange rates, using fallbacks:", e);
    }

    // 2. Fetch unique provider currency
    const DEFAULT_PROVIDER_CURRENCY = Deno.env.get("PROVIDER_CURRENCY") || 'INR';
    let providerCurrency = DEFAULT_PROVIDER_CURRENCY;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const balResponse = await fetch(`${apiUrl}?key=${apiKey}&action=balance`, { signal: controller.signal });
      clearTimeout(timeout);
      if (balResponse.ok) {
        const data = await balResponse.json();
        if (data.currency) providerCurrency = data.currency;
      }
    } catch (e) {
      console.error("Failed to detect provider currency, using default");
    }

    // Process all rates into USD
    for (const s of servicesData) {
      s.rate = convertRateToUSD(s.rate, providerCurrency, exchangeRates).toString();
    }

    // ACTION: FETCH - Return list of services for selection
    if (action === 'fetch') {
      let filtered = servicesData

      // Apply search filter
      if (search_query) {
        const query = search_query.toLowerCase()
        filtered = servicesData.filter(s =>
          s.service.toString().includes(query) ||
          s.name.toLowerCase().includes(query) ||
          (s.category && s.category.toLowerCase().includes(query))
        )
      }

      // Return first 100 results (paginated)
      const results = filtered.slice(0, 100).map(s => ({
        service_id: s.service.toString(),
        name: s.name,
        category: s.category || s.type || 'Other',
        rate: parseFloat(s.rate) || 0,
        min: parseInt(s.min) || 10,
        max: parseInt(s.max) || 100000,
        dripfeed: s.dripfeed || false,
        refill: s.refill || false,
      }))

      return new Response(JSON.stringify({
        success: true,
        total: servicesData.length,
        filtered: filtered.length,
        services: results
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ACTION: IMPORT - Import specific services by ID
    if (action === 'import') {
      if (!service_ids || service_ids.length === 0) {
        return new Response(JSON.stringify({ error: 'No services selected' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Filter to only selected services (normalize both sides to string)
      const selectedIdSet = new Set((service_ids as any[]).map((id) => String(id).trim()))
      const selectedServices = servicesData.filter(s =>
        selectedIdSet.has(String(s.service).trim())
      )

      if (selectedServices.length === 0) {
        return new Response(JSON.stringify({ error: 'Selected services not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Transform and insert - use category_override if provided
      const servicesToInsert = selectedServices.map(s =>
        transformService(s, provider_id, markup_percent, category_override || undefined)
      )

      let imported = 0
      let updated = 0
      const errors: string[] = []

      for (const service of servicesToInsert) {
        // Check if exists
        const { data: existing } = await supabase
          .from('services')
          .select('id')
          .eq('provider_id', provider_id)
          .eq('provider_service_id', service.provider_service_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (existing) {
          const { error } = await supabase
            .from('services')
            .update(service)
            .eq('id', existing.id)

          if (error) {
            errors.push(`Update ${service.name}: ${error.message}`)
          } else {
            updated++
            await linkServiceToSelectedAccount(existing.id, service.provider_service_id)
          }
        } else {
          const { data: inserted, error } = await supabase
            .from('services')
            .insert(service)
            .select('id')
            .single()

          if (error) {
            errors.push(`Insert ${service.name}: ${error.message}`)
          } else {
            imported++
            if (inserted) {
              await linkServiceToSelectedAccount(inserted.id, service.provider_service_id)
            }
          }
        }
      }

      console.log(`Import complete: ${imported} new, ${updated} updated`)

      return new Response(JSON.stringify({
        success: true,
        imported,
        updated,
        total: servicesToInsert.length,
        errors: errors.length > 0 ? errors : undefined
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ACTION: IMPORT_ALL - Import all services (bulk)
    if (action === 'import_all') {
      const servicesToInsert = servicesData.map(s =>
        transformService(s, provider_id, markup_percent)
      )

      let imported = 0
      let updated = 0
      let linked = 0
      const errors: string[] = []

      // Never delete/recreate services here: bundle_items uses ON DELETE SET NULL and
      // mappings use ON DELETE CASCADE, so deleting causes bundles/services to unlink later.
      for (const service of servicesToInsert) {
        const { data: existing } = await supabase
          .from('services')
          .select('id')
          .eq('provider_id', provider_id)
          .eq('provider_service_id', service.provider_service_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (existing) {
          const { error } = await supabase
            .from('services')
            .update(service)
            .eq('id', existing.id)

          if (error) {
            errors.push(`Update ${service.name}: ${error.message}`)
          } else {
            updated++
            await linkServiceToSelectedAccount(existing.id, service.provider_service_id)
            linked++
          }
        } else {
          const { data: inserted, error } = await supabase
            .from('services')
            .insert(service)
            .select('id')
            .single()

          if (error) {
            errors.push(`Insert ${service.name}: ${error.message}`)
          } else if (inserted) {
            imported++
            await linkServiceToSelectedAccount(inserted.id, service.provider_service_id)
            linked++
          }
        }
      }

      return new Response(JSON.stringify({
        success: true,
        imported,
        updated,
        linked,
        total: servicesToInsert.length
        ,errors: errors.length > 0 ? errors : undefined
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Import error:', error)
    return new Response(JSON.stringify({
      error: (error as Error).message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
