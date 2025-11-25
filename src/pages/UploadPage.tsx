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

  const limitReached = useMemo(() => {
    const count = designs.filter((design) => design.modality === selectedModality).length
    return count >= 2
  }, [designs, selectedModality])

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
    return <p className="notice">Sign in to upload your designs.</p>
  }

  return (
    <section>
      <div className="card">
        <h2>Upload designs</h2>
        <p>Each modality allows two uploads per designer. Files go straight into the Supabase storage bucket named <code>designs</code>.</p>
        {message && <p className={`notice ${message.toLowerCase().includes('fail') ? 'error' : ''}`}>{message}</p>}
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label>
            Modality
            <select value={selectedModality} onChange={(event) => setSelectedModality(event.target.value)}>
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
          <button type="submit" disabled={isUploading || !file || limitReached}>
            {limitReached ? 'Limit reached' : isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
      </div>

      <div>
        <h2>My uploads</h2>
        {designs.length === 0 ? (
          <p className="notice">No uploads yet.</p>
        ) : (
          <div className="grid">
            {designs.map((design) => (
              <DesignCard
                key={design.id}
                title={design.filename}
                meta={design.modality}
                imageUrl={getDesignPublicUrl(design.storage_path)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default UploadPage
