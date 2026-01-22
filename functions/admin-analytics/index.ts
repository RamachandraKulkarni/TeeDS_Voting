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
  is_flagged: boolean | null
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
        .select('id, filename, artwork_name, student_name, major, year_level, asurite, modality, storage_path, is_flagged, submitter_id'),
      supabase.from('votes').select('design_id, modality, voter_id'),
      supabase
        .from('users')
        .select('id, email, full_name, asu_id, discipline, is_faculty, created_at')
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
      is_faculty: user.is_faculty ?? false,
      created_at: user.created_at,
    }))

    const usersById = new Map(
      users.map((user) => [user.id, {
        id: user.id,
        email: user.email ?? null,
        full_name: user.full_name ?? null,
        asu_id: user.asu_id ?? null,
        discipline: user.discipline ?? null,
        is_faculty: user.is_faculty ?? false,
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
        is_flagged: boolean
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
        is_flagged: row.is_flagged ?? false,
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

    const voteCounts = new Map<string, number>()
    const votersByDesign = new Map<string, Array<{ id: string; name: string; email: string; is_faculty: boolean }>>()
    const facultyVotesByDesign = new Map<string, Array<{ id: string; name: string; email: string }>>()
    voteRows?.forEach((vote) => {
      const entry = totalsMap.get(vote.modality) ?? { modality: vote.modality, designs: 0, votes: 0 }
      entry.votes += 1
      totalsMap.set(vote.modality, entry)

      voteCounts.set(vote.design_id, (voteCounts.get(vote.design_id) ?? 0) + 1)

      const voter = usersById.get(vote.voter_id)
      if (!voter) return

      const voterList = votersByDesign.get(vote.design_id) ?? []
      if (!voterList.find((entry) => entry.id === voter.id)) {
        voterList.push({
          id: voter.id,
          name: voter.full_name ?? voter.email ?? 'Unknown voter',
          email: voter.email ?? 'unknown',
          is_faculty: voter.is_faculty ?? false,
        })
      }
      votersByDesign.set(vote.design_id, voterList)

      if (!voter.is_faculty) return
      const list = facultyVotesByDesign.get(vote.design_id) ?? []
      if (!list.find((entry) => entry.id === voter.id)) {
        list.push({
          id: voter.id,
          name: voter.full_name ?? voter.email ?? 'Unknown faculty',
          email: voter.email ?? 'unknown',
        })
      }
      facultyVotesByDesign.set(vote.design_id, list)
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
      if (meta.is_flagged) return
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
    const topByModality = Array.from(leaderboardMap.values()).reduce<Record<string, typeof leaderboard[number]>>(
      (acc, entry) => {
        const current = acc[entry.modality]
        if (!current || entry.total_votes > current.total_votes) {
          acc[entry.modality] = entry
        }
        return acc
      },
      {},
    )

    const facultyUsers = users.filter((user) => user.is_faculty)
    const facultyIds = new Set(facultyUsers.map((user) => user.id))
    const facultyCounts = new Map<string, number>()
    voteRows?.forEach((vote) => {
      if (!facultyIds.has(vote.voter_id)) return
      facultyCounts.set(vote.design_id, (facultyCounts.get(vote.design_id) ?? 0) + 1)
    })

    const facultyLeaderboard = Array.from(facultyCounts.entries())
      .map(([designId, count]) => {
        const meta = designLookup.get(designId)
        if (!meta || meta.is_flagged) return null
        return {
          design_id: designId,
          filename: meta.filename,
          artwork_name: meta.artwork_name,
          student_name: meta.student_name,
          major: meta.major,
          year_level: meta.year_level,
          asurite: meta.asurite,
          modality: meta.modality,
          storage_path: meta.storage_path,
          total_votes: count,
        }
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
      .sort((a, b) => b.total_votes - a.total_votes)

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

    const designVoteBreakdown = typedDesignRows
      .map((row) => {
        const title = row.artwork_name ?? row.filename
        const facultyVoters = facultyVotesByDesign.get(row.id) ?? []
        const voters = votersByDesign.get(row.id) ?? []
        return {
          design_id: row.id,
          title,
          modality: row.modality,
          total_votes: voteCounts.get(row.id) ?? 0,
          faculty_votes: facultyVoters.length,
          faculty_voters: facultyVoters,
          voters,
        }
      })
      .sort((a, b) => b.total_votes - a.total_votes)

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
        is_flagged: row.is_flagged ?? false,
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

    return jsonResponse({
      ok: true,
      totals,
      leaderboard,
      topByModality,
      facultyLeaderboard,
      facultyCount: facultyUsers.length,
      designVoteBreakdown,
      designs,
      users,
      contacts,
      rsvpCounts,
    })
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
