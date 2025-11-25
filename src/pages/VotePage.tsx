import { useCallback, useEffect, useMemo, useState } from 'react'
import DesignCard from '../components/DesignCard'
import { getDesignPublicUrl, supabase } from '../api/supabaseClient'
import { useSession } from '../session'

type DesignRow = {
  id: string
  filename: string
  modality: string
  storage_path: string
}

type SettingsRow = {
  key: string
  value: string
}

const MODALITIES: Array<{ value: string; label: string }> = [
  { value: 'online', label: 'Online gallery' },
  { value: 'in-person', label: 'In-person showcase' },
]

const VotePage = () => {
  const { session } = useSession()
  const [designs, setDesigns] = useState<DesignRow[]>([])
  const [userVotes, setUserVotes] = useState<Record<string, number>>({})
  const [settings, setSettings] = useState<Record<string, number>>({ default: 1 })
  const [selectedModality, setSelectedModality] = useState<string>(MODALITIES[0].value)
  const [status, setStatus] = useState<string | null>(null)
  const [castingDesignId, setCastingDesignId] = useState<string | null>(null)

  const fetchDesigns = useCallback(async () => {
    const { data, error } = await supabase
      .from('designs')
      .select('id, filename, modality, storage_path')
      .order('submitted_at', { ascending: false })

    if (error) {
      setStatus(error.message)
      return
    }

    setDesigns(data ?? [])
  }, [])

  const fetchSettings = useCallback(async () => {
    const { data, error } = await supabase.from('settings').select('key, value')
    if (error) {
      setStatus(error.message)
      return
    }
    const parsed: Record<string, number> = { default: 1 }
    data?.forEach((row: SettingsRow) => {
      const numericValue = Number(row.value)
      if (Number.isFinite(numericValue)) {
        parsed[row.key] = numericValue
      }
    })
    setSettings(parsed)
  }, [])

  const fetchVotes = useCallback(async () => {
    if (!session) {
      setUserVotes({})
      return
    }
    const { data, error } = await supabase
      .from('votes')
      .select('id, modality')
      .eq('voter_id', session.user.id)

    if (error) {
      setStatus(error.message)
      return
    }

    const tally: Record<string, number> = {}
    data?.forEach((vote) => {
      tally[vote.modality] = (tally[vote.modality] ?? 0) + 1
    })
    setUserVotes(tally)
  }, [session])

  useEffect(() => {
    fetchDesigns()
    fetchSettings()
  }, [fetchDesigns, fetchSettings])

  useEffect(() => {
    fetchVotes()
  }, [fetchVotes])

  const limitForModality = useCallback(
    (modality: string) =>
      settings[`votes_per_${modality}`] ?? settings[`votes_${modality}`] ?? settings.default ?? 1,
    [settings],
  )

  const remainingVotes = useMemo(() => {
    const limit = limitForModality(selectedModality)
    const used = userVotes[selectedModality] ?? 0
    return Math.max(limit - used, 0)
  }, [limitForModality, selectedModality, userVotes])

  const visibleDesigns = useMemo(
    () => designs.filter((design) => design.modality === selectedModality),
    [designs, selectedModality],
  )

  const handleVote = async (designId: string, modality: string) => {
    if (!session) {
      setStatus('Sign in to vote')
      return
    }
    if (remainingVotes === 0) {
      setStatus('Vote limit reached for this modality')
      return
    }

    setCastingDesignId(designId)
    setStatus(null)
    try {
      const { error } = await supabase.rpc('cast_vote', {
        p_voter_id: session.user.id,
        p_design_id: designId,
        p_modality: modality,
      })
      if (error) {
        throw error
      }
      setStatus('Vote captured ✅')
      fetchVotes()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to vote right now')
    } finally {
      setCastingDesignId(null)
    }
  }

  return (
    <section>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2>Vote anonymously</h2>
        <p>Only images are shown to keep things unbiased. Votes reset automatically when the event closes.</p>
        <label>
          Modality filter
          <select value={selectedModality} onChange={(event) => setSelectedModality(event.target.value)}>
            {MODALITIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <p>Remaining votes for this modality: <strong>{remainingVotes}</strong></p>
        {status && <p className={`notice ${status.toLowerCase().includes('fail') ? 'error' : ''}`}>{status}</p>}
      </div>

      {visibleDesigns.length === 0 ? (
        <p className="notice">Design uploads will appear here automatically.</p>
      ) : (
        <div className="grid">
          {visibleDesigns.map((design) => (
            <DesignCard
              key={design.id}
              title={design.filename}
              meta={design.modality}
              imageUrl={getDesignPublicUrl(design.storage_path)}
              actionLabel={session ? 'Vote' : 'Sign in to vote'}
              disabled={!session || remainingVotes === 0 || castingDesignId === design.id}
              onAction={() => handleVote(design.id, design.modality)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default VotePage
