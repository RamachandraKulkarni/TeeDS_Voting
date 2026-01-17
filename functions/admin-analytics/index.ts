import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

type DesignRow = {
  id: string
  filename: string
  artwork_name: string | null
  student_name: string | null
  major: string | null
  year_level: string | null
  asurite: string | null
  modality: string
  storage_path: string
  submitter_id: string | null
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'GET') {
    return jsonResponse({ ok: false, message: 'Method not allowed' }, 405)
  }

  try {
    const [
      { data: designRows, error: designsError },
      { data: voteRows, error: votesError },
      { data: userRows, error: usersError },
      { data: contactRows, error: contactsError },
      { data: rsvpRows, error: rsvpsError },
    ] = await Promise.all([
      supabase
        .from('designs')
        .select('id, filename, artwork_name, student_name, major, year_level, asurite, modality, storage_path, submitter_id'),
      supabase.from('votes').select('design_id, modality'),
      supabase
        .from('users')
        .select('id, email, full_name, asu_id, discipline, created_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('contact_messages')
        .select('id, sender_name, sender_email, topic, message, created_at')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('rsvps').select('will_attend'),
    ])

    if (designsError || votesError || usersError || contactsError || rsvpsError) {
      throw designsError ?? votesError ?? usersError ?? contactsError ?? rsvpsError
    }

    const totalsMap = new Map<string, { modality: string; designs: number; votes: number }>()
    const typedDesignRows = (designRows ?? []) as DesignRow[]
    typedDesignRows.forEach((row) => {
      const entry = totalsMap.get(row.modality) ?? { modality: row.modality, designs: 0, votes: 0 }
      entry.designs += 1
      totalsMap.set(row.modality, entry)
    })

    const users = (userRows ?? []).map((user) => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      asu_id: user.asu_id,
      discipline: user.discipline,
      created_at: user.created_at,
    }))

    const usersById = new Map(
      users.map((user) => [user.id, {
        id: user.id,
        email: user.email ?? null,
        full_name: user.full_name ?? null,
        asu_id: user.asu_id ?? null,
        discipline: user.discipline ?? null,
      }]),
    )

    const designLookup = new Map<
      string,
      {
        filename: string
        artwork_name: string | null
        student_name: string | null
        major: string | null
        year_level: string | null
        asurite: string | null
        modality: string
        storage_path: string
        submitter_id: string | null
        submitter: {
          id: string
          email: string | null
          full_name: string | null
          asu_id: string | null
          discipline: string | null
        } | null
      }
    >()
    typedDesignRows.forEach((row) => {
      const submitter = row.submitter_id ? usersById.get(row.submitter_id) ?? null : null
      designLookup.set(row.id, {
        filename: row.filename,
        artwork_name: row.artwork_name ?? null,
        student_name: row.student_name ?? null,
        major: row.major ?? null,
        year_level: row.year_level ?? null,
        asurite: row.asurite ?? null,
        modality: row.modality,
        storage_path: row.storage_path,
        submitter_id: row.submitter_id ?? null,
        submitter: submitter
          ? {
              id: submitter.id,
              email: submitter.email ?? null,
              full_name: submitter.full_name ?? null,
              asu_id: submitter.asu_id ?? null,
              discipline: submitter.discipline ?? null,
            }
          : null,
      })
    })

    voteRows?.forEach((vote) => {
      const entry = totalsMap.get(vote.modality) ?? { modality: vote.modality, designs: 0, votes: 0 }
      entry.votes += 1
      totalsMap.set(vote.modality, entry)
    })

    const leaderboardMap = new Map<
      string,
      {
        design_id: string
        filename: string
        artwork_name: string | null
        student_name: string | null
        major: string | null
        year_level: string | null
        asurite: string | null
        modality: string
        storage_path: string
        total_votes: number
      }
    >()
    voteRows?.forEach((vote) => {
      const meta = designLookup.get(vote.design_id)
      if (!meta) return
      const entry = leaderboardMap.get(vote.design_id) ?? {
        design_id: vote.design_id,
        filename: meta.filename,
        artwork_name: meta.artwork_name,
        student_name: meta.student_name,
        major: meta.major,
        year_level: meta.year_level,
        asurite: meta.asurite,
        modality: meta.modality,
        storage_path: meta.storage_path,
        total_votes: 0,
      }
      entry.total_votes += 1
      leaderboardMap.set(vote.design_id, entry)
    })

    const totals = Array.from(totalsMap.values()).sort((a, b) => a.modality.localeCompare(b.modality))
    const leaderboard = Array.from(leaderboardMap.values()).sort((a, b) => b.total_votes - a.total_votes).slice(0, 5)
    const topDesign = leaderboardMap.size
      ? Array.from(leaderboardMap.values()).sort((a, b) => b.total_votes - a.total_votes)[0]
      : null

    const contacts = (contactRows ?? []).map((row) => ({
      id: row.id,
      sender_name: row.sender_name,
      sender_email: row.sender_email,
      topic: row.topic,
      message: row.message,
      created_at: row.created_at,
    }))

    const rsvpCounts = (rsvpRows ?? []).reduce(
      (acc, row) => {
        if (row.will_attend === 'yes') acc.yes += 1
        else if (row.will_attend === 'no') acc.no += 1
        acc.total += 1
        return acc
      },
      { yes: 0, no: 0, total: 0 },
    )

    const designs = typedDesignRows.map((row) => {
      const submitter = row.submitter_id ? usersById.get(row.submitter_id) ?? null : null
      return {
        id: row.id,
        filename: row.filename,
        artwork_name: row.artwork_name ?? null,
        student_name: row.student_name ?? null,
        major: row.major ?? null,
        year_level: row.year_level ?? null,
        asurite: row.asurite ?? null,
        modality: row.modality,
        storage_path: row.storage_path,
        submitter_id: row.submitter_id ?? null,
        submitter: submitter
          ? {
              id: submitter.id,
              email: submitter.email ?? null,
              full_name: submitter.full_name ?? null,
              asu_id: submitter.asu_id ?? null,
              discipline: submitter.discipline ?? null,
            }
          : null,
      }
    })

    return jsonResponse({ ok: true, totals, leaderboard, topDesign, designs, users, contacts, rsvpCounts })
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
