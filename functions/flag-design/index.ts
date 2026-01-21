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

type Payload = {
  designId?: string
  flag?: boolean
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, message: 'Method not allowed' }, 405)
  }

  try {
    const { designId, flag } = (await req.json()) as Payload
    if (!designId) {
      return jsonResponse({ ok: false, message: 'Missing designId' }, 400)
    }

    const { data: design, error: designError } = await supabase
      .from('designs')
      .select('id, modality, is_flagged')
      .eq('id', designId)
      .maybeSingle()

    if (designError || !design) {
      throw designError ?? new Error('Design not found')
    }

    const nextFlag = flag ?? true

    const { error: updateError } = await supabase
      .from('designs')
      .update({ is_flagged: nextFlag })
      .eq('id', designId)

    if (updateError) throw updateError

    if (nextFlag) {
      const { data: voteRows, error: votesError } = await supabase
        .from('votes')
        .select('design_id, modality')
        .eq('modality', design.modality)
        .not('design_id', 'eq', designId)

      if (votesError) throw votesError

      const counts = new Map<string, number>()
      ;(voteRows ?? []).forEach((row: { design_id: string }) => {
        counts.set(row.design_id, (counts.get(row.design_id) ?? 0) + 1)
      })

      const candidateIds = Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([designId]) => designId)
      let topDesignId: string | null = null

      if (candidateIds.length > 0) {
        const { data: candidateDesigns, error: candidateError } = await supabase
          .from('designs')
          .select('id, is_flagged')
          .in('id', candidateIds)

        if (candidateError) throw candidateError

        for (const candidate of candidateIds) {
          const match = candidateDesigns?.find((row) => row.id === candidate)
          if (match && match.is_flagged !== true) {
            topDesignId = match.id
            break
          }
        }
      }

      if (topDesignId) {
        const { error: moveError } = await supabase
          .from('votes')
          .update({ design_id: topDesignId })
          .eq('design_id', designId)

        if (moveError) throw moveError
      } else {
        await supabase.from('votes').delete().eq('design_id', designId)
      }
    }

    return jsonResponse({ ok: true })
  } catch (error) {
    console.error('flag-design error', error)
    return jsonResponse({ ok: false, message: 'Failed to flag design' }, 500)
  }
})

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}
