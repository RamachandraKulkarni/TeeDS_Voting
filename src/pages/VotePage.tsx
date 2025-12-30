import { useCallback, useEffect, useMemo, useRef, useState, type UIEvent } from 'react'
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
const CARD_COUNT_PRESETS = [3, 6, 9]
const DEFAULT_CARDS_PER_VIEW = 6

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
  const [cardsPerView, setCardsPerView] = useState<number>(DEFAULT_CARDS_PER_VIEW)
  const [currentPage, setCurrentPage] = useState(0)
  const carouselRef = useRef<HTMLDivElement | null>(null)

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

  useEffect(() => {
    setCurrentPage(0)
    const viewport = carouselRef.current
    if (viewport) {
      viewport.scrollTo({ left: 0, behavior: 'auto' })
    }
  }, [cardsPerView, selectedModality])

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

  const pagedDesigns = useMemo(() => {
    if (cardsPerView <= 0) {
      return []
    }
    const chunks: DesignRow[][] = []
    for (let index = 0; index < visibleDesigns.length; index += cardsPerView) {
      chunks.push(visibleDesigns.slice(index, index + cardsPerView))
    }
    return chunks
  }, [cardsPerView, visibleDesigns])

  const totalPages = pagedDesigns.length

  useEffect(() => {
    setCurrentPage((previous) => {
      const maxIndex = Math.max(totalPages - 1, 0)
      const clamped = Math.min(previous, maxIndex)
      if (clamped !== previous && carouselRef.current) {
        carouselRef.current.scrollTo({
          left: clamped * carouselRef.current.clientWidth,
          behavior: 'auto',
        })
      }
      return clamped
    })
  }, [totalPages])

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

  const handleCardCountSelect = (count: number) => {
    setCardsPerView(count)
  }

  const handlePageChange = useCallback(
    (nextPage: number) => {
      if (!carouselRef.current || totalPages === 0) {
        return
      }
      const maxIndex = Math.max(totalPages - 1, 0)
      const clamped = Math.min(Math.max(nextPage, 0), maxIndex)
      carouselRef.current.scrollTo({
        left: clamped * carouselRef.current.clientWidth,
        behavior: 'smooth',
      })
      setCurrentPage(clamped)
    },
    [totalPages],
  )

  const handleCarouselScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      if (totalPages <= 1) {
        return
      }
      const viewport = event.currentTarget
      const width = viewport.clientWidth
      if (!width) {
        return
      }
      const rawIndex = Math.round(viewport.scrollLeft / width)
      const nextIndex = Math.min(Math.max(rawIndex, 0), totalPages - 1)
      if (nextIndex !== currentPage) {
        setCurrentPage(nextIndex)
      }
    },
    [currentPage, totalPages],
  )

  return (
    <section className="fade-in vote-page" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="panel">
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
          <div>
            <p className="eyebrow">Live gallery · {modalityLabel}</p>
            <h2 style={{ marginTop: 0, marginBottom: '0.35rem' }}>Vote anonymously</h2>
          </div>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.95rem' }}>
            Remaining votes: <strong style={{ color: '#000' }}>{remainingVotes}</strong>
          </p>
        </div>
        {votingLocked && (
          <p className="notice" style={{ marginTop: '0.5rem' }}>
            Voting opens on <strong>{VOTING_START_LABEL}</strong>. Browse the gallery now; buttons will enable once the window starts.
          </p>
        )}
        <div className="segmented-control" role="tablist" aria-label="Modality filter">
          {MODALITIES.map((option) => (
            <button
              key={option.value}
              className={`segmented-option ${selectedModality === option.value ? 'active' : ''}`}
              type="button"
              onClick={() => setSelectedModality(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="card-count-toolbar">
          <div className="card-count-control">
            <span className="eyebrow" style={{ margin: 0 }}>Visible cards</span>
            <div className="card-count-control__options" role="group" aria-label="Select number of cards per page">
              {CARD_COUNT_PRESETS.map((count) => (
                <button
                  key={count}
                  type="button"
                  className={`card-count-option ${cardsPerView === count ? 'active' : ''}`}
                  onClick={() => handleCardCountSelect(count)}
                  aria-pressed={cardsPerView === count}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="ghost-button card-count-reset"
            onClick={() => setCardsPerView(DEFAULT_CARDS_PER_VIEW)}
            disabled={cardsPerView === DEFAULT_CARDS_PER_VIEW}
          >
            Reset to default
          </button>
        </div>
        {status && <p className={`notice ${status.toLowerCase().includes('fail') ? 'error' : ''}`}>{status}</p>}
        {!session && <p className="notice">Sign in to cast votes.</p>}
      </div>

      {visibleDesigns.length === 0 ? (
        <p className="notice">Design uploads will appear here automatically.</p>
      ) : (
        <div className="design-carousel">
          <div
            className="design-carousel__viewport"
            ref={carouselRef}
            onScroll={handleCarouselScroll}
            aria-live="polite"
          >
            <div className="design-carousel__track">
              {pagedDesigns.map((page, pageIndex) => (
                <div
                  key={`design-page-${pageIndex}`}
                  className="design-carousel__page"
                  aria-label={`Designs page ${pageIndex + 1}`}
                >
                  {page.map((design) => (
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
              ))}
            </div>
          </div>
          {totalPages > 1 && (
            <div className="carousel-pagination">
              <button
                type="button"
                className="ghost-button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
              >
                Previous
              </button>
              <div className="carousel-pagination__pages" role="tablist" aria-label="Carousel page selector">
                {pagedDesigns.map((_, index) => (
                  <button
                    key={`pagination-${index}`}
                    type="button"
                    className={currentPage === index ? 'active' : ''}
                    onClick={() => handlePageChange(index)}
                    aria-current={currentPage === index ? 'true' : undefined}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="ghost-button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {previewDesign && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={(event) => {
          if (event.target === event.currentTarget) {
            setPreviewDesign(null)
          }
        }}>
          <div className="modal-content">
            <button
              aria-label="Close preview"
              className="ghost-button modal-close"
              type="button"
              onClick={() => setPreviewDesign(null)}
            >
              <span aria-hidden="true" className="modal-close__icon" />
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

    </section>
  )
}

export default VotePage
