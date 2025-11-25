import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { supabase, getDesignPublicUrl, invokeEdgeFunction } from '../api/supabaseClient'
import { useSession } from '../session'
import DesignCard from '../components/DesignCard'

type DesignRow = {
  id: string
  filename: string
  modality: string
  storage_path: string
}

const MODALITIES = [
  { value: 'online', label: 'Online gallery' },
  { value: 'in-person', label: 'In-person showcase' },
]

const UploadPage = () => {
  const { session } = useSession()
  const [selectedModality, setSelectedModality] = useState(MODALITIES[0].value)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [designs, setDesigns] = useState<DesignRow[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const limitReached = designs.length >= 2

  const lockedModality = useMemo(() => (designs.length > 0 ? designs[0].modality : null), [designs])
  useEffect(() => {
    if (lockedModality && selectedModality !== lockedModality) {
      setSelectedModality(lockedModality)
    }
  }, [lockedModality, selectedModality])

  const fetchDesigns = useCallback(async () => {
    if (!session) return
    const { data, error } = await supabase
      .from('designs')
      .select('id, filename, modality, storage_path')
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
        },
      )

      if (!recordResponse.ok) {
        throw new Error(recordResponse.message ?? 'Unable to record upload')
      }

      setFile(null)
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
    <section className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="panel highlight">
        <p className="eyebrow">Creator console</p>
        <h2 style={{ marginTop: 0 }}>Upload designs</h2>
        <p className="header-summary">
          Each modality allows two uploads per designer. Files go straight into the Supabase storage bucket named <code>designs</code>.
        </p>
        {lockedModality && (
          <p className="notice">
            Your uploads are locked to <strong>{MODALITIES.find((m) => m.value === lockedModality)?.label ?? lockedModality}</strong>.
            Delete existing designs to switch modalities.
          </p>
        )}
        {message && <p className={`notice ${message.toLowerCase().includes('fail') ? 'error' : ''}`}>{message}</p>}
        <form onSubmit={handleUpload}>
          <label>
            Modality
            <select
              value={selectedModality}
              onChange={(event) => setSelectedModality(event.target.value)}
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
          <button className="glow-button" type="submit" disabled={isUploading || !file || limitReached}>
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
          <p style={{ color: 'var(--muted)' }}>{designs.length}/2 in {selectedModality.replace('-', ' ')} queue</p>
        </div>
        {designs.length === 0 ? (
          <p className="notice">No uploads yet.</p>
        ) : (
          <div className="design-grid">
            {designs.map((design) => (
              <DesignCard
                key={design.id}
                title={design.filename}
                meta={design.modality}
                imageUrl={getDesignPublicUrl(design.storage_path)}
                actionLabel={deletingId === design.id ? 'Deleting…' : 'Delete'}
                onAction={() => handleDelete(design.id, design.storage_path)}
                disabled={deletingId === design.id}
                actionTone="delete"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default UploadPage
