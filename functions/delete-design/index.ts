import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type RequestBody = {
  designId?: string
  submitterId?: string
  storagePath?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, message: 'Method not allowed' }, 405)
  }

  try {
    const { designId, submitterId, storagePath } = (await req.json()) as RequestBody

    if (!designId || !submitterId || !storagePath) {
      return jsonResponse({ ok: false, message: 'designId, submitterId, and storagePath are required' }, 400)
    }

    const { data: design, error: fetchError } = await supabase
      .from('designs')
      .select('id, storage_path, submitter_id')
      .eq('id', designId)
      .eq('submitter_id', submitterId)
      .maybeSingle()

    if (fetchError) {
      throw fetchError
    }

    if (!design) {
      return jsonResponse({ ok: false, message: 'Design not found' }, 404)
    }

    const { error: storageError } = await supabase.storage.from('designs').remove([storagePath])
    if (storageError) {
      throw storageError
    }

    const { error: deleteError } = await supabase.from('designs').delete().eq('id', design.id)
    if (deleteError) {
      throw deleteError
    }

    return jsonResponse({ ok: true })
  } catch (error) {
    console.error('delete-design error', error)
    return jsonResponse({ ok: false, message: 'Unable to delete design' }, 500)
  }
})

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}
