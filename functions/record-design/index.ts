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
  filename?: string
  modality?: string
  storagePath?: string
  submitterId?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, message: 'Method not allowed' }, 405)
  }

  try {
    const { filename, modality, storagePath, submitterId } = (await req.json()) as RequestBody

    if (!filename || !modality || !storagePath || !submitterId) {
      return jsonResponse({
        ok: false,
        message: 'filename, modality, storagePath, and submitterId are required',
      }, 400)
    }

    const { data: existing, error: fetchError } = await supabase
      .from('designs')
      .select('id, modality')
      .eq('submitter_id', submitterId)

    if (fetchError) {
      throw fetchError
    }

    const existingCount = existing?.length ?? 0
    if (existingCount >= 2) {
      return jsonResponse({ ok: false, message: 'You already have two designs uploaded. Delete one to continue.' }, 400)
    }

    const existingModalities = new Set((existing ?? []).map((row) => row.modality))
    if (existingModalities.size > 0 && (existingModalities.size > 1 || !existingModalities.has(modality))) {
      return jsonResponse({
        ok: false,
        message: 'All of your uploads must stay in the same modality unless you delete them first.',
      }, 400)
    }

    const { error } = await supabase.from('designs').insert({
      filename,
      modality,
      storage_path: storagePath,
      submitter_id: submitterId,
    })

    if (error) {
      throw error
    }

    return jsonResponse({ ok: true })
  } catch (error) {
    console.error('record-design error', error)
    return jsonResponse({ ok: false, message: 'Unable to record design' }, 500)
  }
})

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}
