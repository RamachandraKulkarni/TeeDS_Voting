import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { supabase, getDesignPublicUrl, invokeEdgeFunction } from '../api/supabaseClient'
import { useSession } from '../session'
import DesignCard from '../components/DesignCard'
import UploadInstructionsModal from '../components/UploadInstructionsModal'
import { MODALITIES, ModalityValue, getModalityLabel } from '../constants/modalities'

type DesignRow = {
  id: string
  filename: string
  modality: ModalityValue
  storage_path: string
  student_name: string | null
  artwork_name: string | null
  major: string | null
  year_level: string | null
  asurite: string | null
}

const UploadPage = () => {
  const { session } = useSession()
  const [selectedModality, setSelectedModality] = useState<ModalityValue>(MODALITIES[0].value)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [designs, setDesigns] = useState<DesignRow[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [artworkName, setArtworkName] = useState('')
  const [acceptedRelease, setAcceptedRelease] = useState(false)
  const [isLicenseOpen, setIsLicenseOpen] = useState(false)

  const limitReached = designs.length >= 2

  const lockedModality = useMemo<ModalityValue | null>(() => (designs.length > 0 ? designs[0].modality : null), [designs])
  useEffect(() => {
    if (lockedModality && selectedModality !== lockedModality) {
      setSelectedModality(lockedModality)
    }
  }, [lockedModality, selectedModality])

  const fetchDesigns = useCallback(async () => {
    if (!session) return
    const { data, error } = await supabase
      .from('designs')
      .select('id, filename, modality, storage_path, student_name, artwork_name, major, year_level, asurite')
      .eq('submitter_id', session.user.id)
      .order('submitted_at', { ascending: false })

    if (error) {
      setMessage(error.message)
      return
    }

    setDesigns(data ?? [])
  }, [session])

  useEffect(() => {
    fetchDesigns()
  }, [fetchDesigns])

  useEffect(() => {
    setAcceptedRelease(false)
  }, [session?.user.id])

  const handleDelete = async (designId: string, storagePath: string) => {
    if (!session) return
    const confirmed = typeof window === 'undefined' ? true : window.confirm('Delete this upload? The file will be removed permanently.')
    if (!confirmed) return
    setMessage(null)
    setDeletingId(designId)
    try {
      const response = await invokeEdgeFunction<{ ok: boolean; message?: string }>(
        'delete-design',
        {
          designId,
          submitterId: session.user.id,
          storagePath,
        },
      )

      if (!response.ok) {
        throw new Error(response.message ?? 'Unable to delete design')
      }

      setMessage('Design deleted')
      fetchDesigns()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage(null)

    if (!session || !file) {
      setMessage('Missing file or session context')
      return
    }

    if (!acceptedRelease) {
      setMessage('You must accept the Artwork License & Release Agreement before uploading')
      return
    }

    const trimmedArtworkName = artworkName.trim()

    if (!trimmedArtworkName) {
      setMessage('Add an artwork name so we can label your submission')
      return
    }

    if (limitReached) {
      setMessage('Limit reached for this modality (2 designs max)')
      return
    }

    setIsUploading(true)
    try {
      const extension = file.name.split('.').pop()
      const storagePath = `${session.user.id}/${selectedModality}-${Date.now()}.${extension ?? 'png'}`

      const { error: storageError } = await supabase.storage.from('designs').upload(storagePath, file, {
        upsert: false,
      })

      if (storageError) {
        throw storageError
      }

      const recordResponse = await invokeEdgeFunction<{ ok: boolean; message?: string }>(
        'record-design',
        {
          filename: file.name,
          modality: selectedModality,
          storagePath,
          submitterId: session.user.id,
          artworkName: trimmedArtworkName,
        },
      )

      if (!recordResponse.ok) {
        throw new Error(recordResponse.message ?? 'Unable to record upload')
      }

      setFile(null)
      setArtworkName('')
      setMessage('Design uploaded! It may take a second to appear in the gallery.')
      fetchDesigns()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  if (!session) {
    return (
      <section className="panel highlight fade-in">
        <h2>Upload center</h2>
        <p className="header-summary">Sign in to drop your looks into the showcase.</p>
      </section>
    )
  }

  return (
    <>
      <UploadInstructionsModal />
      <section className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="panel highlight">
        <p className="eyebrow">Creator console</p>
        <h2 style={{ marginTop: 0 }}>Upload designs</h2>
        <p className="header-summary">
          Each modality allows two uploads per designer. Files go straight into the Supabase storage bucket named <code>designs</code>.
        </p>
        <p className="notice" style={{ marginTop: '0.5rem' }}>
          Your sign-in profile fills in the student details. We just need an artwork name and the correct modality here.
        </p>
        <div className="consent-callout">
          <p>
            Every upload must include the TEE-DS Artwork License & Release Agreement.{' '}
            <button type="button" className="text-link" onClick={() => setIsLicenseOpen(true)}>
              Read the agreement
            </button>
            .
          </p>
          <ul>
            <li>You keep ownership of your artwork at all times.</li>
            <li>Finalists and winners grant ASU a non-exclusive license for shirts, showcases, and promo use.</li>
            <li>You can revoke future use in writing, but printed or published pieces stay live.</li>
          </ul>
        </div>
        {lockedModality && (
          <p className="notice">
            Your uploads are locked to <strong>{getModalityLabel(lockedModality)}</strong>. Delete existing designs to switch modalities.
          </p>
        )}
        {message && <p className={`notice ${message.toLowerCase().includes('fail') ? 'error' : ''}`}>{message}</p>}
        <form onSubmit={handleUpload}>
          <label>
            Artwork name
            <input type="text" required value={artworkName} onChange={(event) => setArtworkName(event.target.value)} placeholder="Phoenix Bloom" />
          </label>
          <label>
            Modality
            <select
              value={selectedModality}
              onChange={(event) => setSelectedModality(event.target.value as ModalityValue)}
              disabled={Boolean(lockedModality)}
            >
              {MODALITIES.map((modality) => (
                <option key={modality.value} value={modality.value}>
                  {modality.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Design file (JPG/PNG)
            <input type="file" accept="image/*" required onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          </label>
          <div className="consent-actions">
            <button type="button" className="ghost-button" onClick={() => setIsLicenseOpen(true)}>
              Review the agreement
            </button>
            <button
              type="button"
              className="glow-button consent-agree-button"
              onClick={() => setAcceptedRelease(true)}
              disabled={acceptedRelease}
            >
              {acceptedRelease ? 'Agreement accepted' : 'I agree to the release'}
            </button>
          </div>
          <button className="glow-button" type="submit" disabled={isUploading || !file || limitReached || !acceptedRelease}>
            {limitReached ? 'Limit reached' : isUploading ? 'Uploading…' : 'Upload'}
          </button>
        </form>
        </div>

        <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div>
            <p className="eyebrow">Library</p>
            <h2 style={{ marginTop: 0 }}>My uploads</h2>
          </div>
          <p style={{ color: 'var(--muted)' }}>{designs.length}/2 in {getModalityLabel(selectedModality)} queue</p>
        </div>
        {designs.length === 0 ? (
          <p className="notice">No uploads yet.</p>
        ) : (
          <div className="design-grid">
            {designs.map((design) => {
              const metaLine = [design.student_name, getModalityLabel(design.modality)].filter(Boolean).join(' · ')
              const detailLine = [design.major, design.year_level, design.asurite].filter(Boolean).join(' · ')
              return (
                <DesignCard
                  key={design.id}
                  title={design.artwork_name ?? design.filename}
                  meta={metaLine || undefined}
                  footer={
                    detailLine ? (
                      <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{detailLine}</span>
                    ) : undefined
                  }
                  imageUrl={getDesignPublicUrl(design.storage_path)}
                  actionLabel={deletingId === design.id ? 'Deleting…' : 'Delete'}
                  onAction={() => handleDelete(design.id, design.storage_path)}
                  disabled={deletingId === design.id}
                  actionTone="delete"
                />
              )
            })}
          </div>
        )}
        </div>
      </section>

      {isLicenseOpen && (
        <div className="modal-overlay consent-overlay" role="dialog" aria-modal="true">
          <div className="modal-content consent-modal">
            <button className="ghost-button modal-close" type="button" onClick={() => setIsLicenseOpen(false)}>
              Close
            </button>
            <p className="eyebrow">TEE-DS T-Shirt Contest</p>
            <h3 style={{ marginTop: 0 }}>Artwork License & Release Agreement</h3>
            <ol className="consent-list">
              <li>
                <h4>1. Ownership</h4>
                <p>You retain every right, title, and copyright to your artwork. Ownership never transfers to ASU or TDS.</p>
              </li>
              <li>
                <h4>2. License to use your artwork (finalists & winners)</h4>
                <p>
                  If your entry becomes a finalist or winner, you grant ASU and The Design School a non-exclusive, royalty-free,
                  worldwide license to reproduce the artwork on shirts, merchandise, and promotional or educational materials;
                  display it on ASU websites, marketing, and social media; and exhibit it in physical or virtual spaces tied to
                  TEE-DS.
                </p>
                <p>This license is strictly for educational, promotional, and non-commercial purposes.</p>
              </li>
              <li>
                <h4>3. No transfer of ownership</h4>
                <p>You may keep selling, publishing, or licensing your artwork elsewhere without limitation.</p>
              </li>
              <li>
                <h4>4. Modifications</h4>
                <p>ASU may make minor technical adjustments necessary for production (resizing, color tweaks, background removal).</p>
              </li>
              <li>
                <h4>5. Revocation</h4>
                <p>
                  You may revoke future use at any time with written notice. Products already printed or published cannot be pulled
                  back, but ASU will stop future production after receiving your request.
                </p>
              </li>
              <li>
                <h4>6. Certification of original work</h4>
                <p>You certify the submission is your original creation and does not infringe on anyone else’s rights.</p>
              </li>
              <li>
                <h4>7. Consent to electronic signature</h4>
                <p>Checking the consent box on the upload form counts as your electronic signature on this agreement.</p>
              </li>
            </ol>
            <p style={{ color: 'var(--muted)', marginBottom: '1.25rem' }}>
              Need a copy? Save or print this window before closing. Contact TEE-DS to revoke future use.
            </p>
            <div className="consent-modal__actions">
              <button className="ghost-button" type="button" onClick={() => setIsLicenseOpen(false)}>
                Close
              </button>
              <button
                className="glow-button"
                type="button"
                onClick={() => {
                  setAcceptedRelease(true)
                  setIsLicenseOpen(false)
                }}
              >
                I agree & continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default UploadPage
