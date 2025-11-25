import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-email',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'GET' && req.method !== 'POST') {
    return jsonResponse({ ok: false, message: 'Method not allowed' }, 405)
  }

  const adminEmail = (req.headers.get('x-admin-email') ?? '').trim().toLowerCase()
  if (!adminEmail) {
    return jsonResponse({ ok: false, message: 'Admin email required' }, 401)
  }

  const { data: adminRecord, error: adminError } = await supabase
    .from('admins')
    .select('email')
    .eq('email', adminEmail)
    .maybeSingle()

  if (adminError) {
    console.error('admin lookup failed', adminError)
    return jsonResponse({ ok: false, message: 'Unable to validate admin access' }, 500)
  }

  if (!adminRecord) {
    return jsonResponse({ ok: false, message: 'Admin email not recognized' }, 403)
  }

  try {
    const [{ data: designRows, error: designsError }, { data: voteRows, error: votesError }] = await Promise.all([
      supabase.from('designs').select('id, filename, modality'),
      supabase.from('votes').select('design_id, modality'),
    ])

    if (designsError || votesError) {
      throw designsError ?? votesError
    }

    const totalsMap = new Map<string, { modality: string; designs: number; votes: number }>()
    designRows?.forEach((row) => {
      const entry = totalsMap.get(row.modality) ?? { modality: row.modality, designs: 0, votes: 0 }
      entry.designs += 1
      totalsMap.set(row.modality, entry)
    })

    const designLookup = new Map<string, { filename: string; modality: string }>()
    designRows?.forEach((row) => {
      designLookup.set(row.id, { filename: row.filename, modality: row.modality })
    })

    voteRows?.forEach((vote) => {
      const entry = totalsMap.get(vote.modality) ?? { modality: vote.modality, designs: 0, votes: 0 }
      entry.votes += 1
      totalsMap.set(vote.modality, entry)
    })

    const leaderboardMap = new Map<string, { design_id: string; filename: string; modality: string; total_votes: number }>()
    voteRows?.forEach((vote) => {
      const meta = designLookup.get(vote.design_id)
      if (!meta) return
      const entry = leaderboardMap.get(vote.design_id) ?? {
        design_id: vote.design_id,
        filename: meta.filename,
        modality: meta.modality,
        total_votes: 0,
      }
      entry.total_votes += 1
      leaderboardMap.set(vote.design_id, entry)
    })

    const totals = Array.from(totalsMap.values()).sort((a, b) => a.modality.localeCompare(b.modality))
    const leaderboard = Array.from(leaderboardMap.values()).sort((a, b) => b.total_votes - a.total_votes).slice(0, 5)

    return jsonResponse({ ok: true, totals, leaderboard })
  } catch (error) {
    console.error('admin-analytics error', error)
    return jsonResponse({ ok: false, message: 'Failed to load analytics' }, 500)
  }
})

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}
