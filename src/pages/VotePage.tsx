import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import DesignCard from '../components/DesignCard'
import ArrowIcon from '../components/ArrowIcon'
import { getDesignPublicUrl, supabase } from '../api/supabaseClient'
import { useSession } from '../session'
import { MODALITIES, ModalityValue, getModalityLabel } from '../constants/modalities'

type DesignRow = {
  id: string
  filename: string
  artwork_name: string | null
  modality: ModalityValue
  storage_path: string
}

type SettingsRow = {
  key: string
  value: string
}

const VOTING_START_TIMESTAMP = new Date('2026-01-17T00:00:00-07:00').getTime()
const VOTING_START_LABEL = 'January 17 at 12:00 AM MST'

const VotePage = () => {
  const { session } = useSession()
  const [designs, setDesigns] = useState<DesignRow[]>([])
  const [userVotes, setUserVotes] = useState<Record<string, number>>({})
  const [settings, setSettings] = useState<Record<string, number>>({ default: 1 })
  const [selectedModality, setSelectedModality] = useState<ModalityValue>(MODALITIES[0].value)
  const [status, setStatus] = useState<string | null>(null)
  const [castingDesignId, setCastingDesignId] = useState<string | null>(null)
  const [previewDesign, setPreviewDesign] = useState<DesignRow | null>(null)
  const [currentTime, setCurrentTime] = useState(() => Date.now())

  const fetchDesigns = useCallback(async () => {
    const { data, error } = await supabase
      .from('designs')
      .select('id, filename, artwork_name, modality, storage_path')
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

  useEffect(() => {
    const interval = window.setInterval(() => setCurrentTime(Date.now()), 60 * 1000)
    return () => window.clearInterval(interval)
  }, [])

  const limitForModality = useCallback(
    (modality: ModalityValue) =>
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

  const modalityLabel = useMemo(() => getModalityLabel(selectedModality), [selectedModality])

  const handleVote = async (designId: string, modality: ModalityValue) => {
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPreviewDesign(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const isVotingOpen = currentTime >= VOTING_START_TIMESTAMP
  const votingLocked = !isVotingOpen

  return (
    <section
      className={`fade-in vote-page${isVotingOpen ? '' : ' vote-page--locked'}`}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      <div className="panel">
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
          <div>
            <p className="eyebrow">Live gallery · {modalityLabel}</p>
            <h2 style={{ marginTop: 0, marginBottom: '0.35rem' }}>Vote anonymously</h2>
          </div>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.95rem' }}>Remaining votes: <strong style={{ color: '#fff' }}>{remainingVotes}</strong></p>
        </div>
        <div className="segmented-control" role="tablist" aria-label="Modality filter">
          {MODALITIES.map((option) => (
            <button
              key={option.value}
              className={`segmented-option ${selectedModality === option.value ? 'active' : ''}`}
              type="button"
              onClick={() => setSelectedModality(option.value)}
              disabled={votingLocked}
            >
              {option.label}
            </button>
          ))}
        </div>
        {status && <p className={`notice ${status.toLowerCase().includes('fail') ? 'error' : ''}`}>{status}</p>}
        {!session && <p className="notice">Sign in to cast votes.</p>}
      </div>

      {visibleDesigns.length === 0 ? (
        <p className="notice">Design uploads will appear here automatically.</p>
      ) : (
        <div className="design-grid">
          {visibleDesigns.map((design) => (
            <DesignCard
              key={design.id}
              title={design.artwork_name ?? design.filename}
              imageUrl={getDesignPublicUrl(design.storage_path)}
              actionLabel={
                votingLocked
                  ? 'Voting locked'
                  : session
                    ? remainingVotes === 0
                      ? 'No votes left'
                      : 'Vote now'
                    : 'Sign in to vote'
              }
              disabled={
                votingLocked || !session || remainingVotes === 0 || castingDesignId === design.id
              }
              onAction={() => handleVote(design.id, design.modality)}
              onPreview={() => setPreviewDesign(design)}
            />
          ))}
        </div>
      )}

      {previewDesign && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={(event) => {
          if (event.target === event.currentTarget) {
            setPreviewDesign(null)
          }
        }}>
          <div className="modal-content">
            <button className="ghost-button modal-close" type="button" onClick={() => setPreviewDesign(null)}>
              Close
            </button>
            <div className="modal-media">
              <img src={getDesignPublicUrl(previewDesign.storage_path)} alt={previewDesign.artwork_name ?? previewDesign.filename} />
            </div>
            <div className="modal-meta">
              <h3 style={{ margin: '0 0 0.35rem 0' }}>{previewDesign.artwork_name ?? previewDesign.filename}</h3>
              {session ? (
                <button
                  className="pill-button"
                  type="button"
                  onClick={() => {
                    handleVote(previewDesign.id, previewDesign.modality)
                  }}
                  disabled={votingLocked || castingDesignId === previewDesign.id || remainingVotes === 0}
                >
                  <span className="pill-button__knob">
                    <ArrowIcon />
                  </span>
                  <span className="pill-button__label">
                    {remainingVotes === 0 ? 'No votes left' : 'Vote for this design'}
                  </span>
                </button>
              ) : (
                <p className="notice" style={{ marginTop: 0 }}>Sign in to vote for this design.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {votingLocked && (
        <div className="vote-locked-overlay" role="dialog" aria-modal="true" aria-live="assertive">
          <div className="vote-locked-modal">
            <p className="eyebrow">Voting locked</p>
            <h2>Gallery opens on {VOTING_START_LABEL}</h2>
            <p>
              Voting isn&apos;t live yet. We&apos;ll automatically unlock the feed on voting day so everyone can browse entries and
              cast ballots at the same time.
            </p>
            <div className="vote-locked-actions">
              <Link to="/timeline" className="ghost-button">
                View timeline
              </Link>
              <Link to="/rules" className="del-btn del-btn--static">
                Read rules
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default VotePage
