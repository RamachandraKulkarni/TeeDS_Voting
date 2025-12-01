import { useState } from 'react'

const STORAGE_KEY = 'teeds.v1.uploadInstructionsDismissed'

const UploadInstructionsModal = () => {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return !window.localStorage.getItem(STORAGE_KEY)
  })

  const dismiss = () => {
    setIsOpen(false)
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, 'true')
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="modal-overlay instructions-overlay" role="dialog" aria-modal="true">
      <div className="modal-content instructions-modal">
        <button aria-label="Dismiss upload instructions" className="ghost-button modal-close" type="button" onClick={dismiss}>
          Close
        </button>
        <p className="eyebrow">Before you upload</p>
        <h3 style={{ marginTop: 0 }}>Fast checklist</h3>
        <p className="header-summary" style={{ marginBottom: '1rem' }}>
          Your profile details were captured at sign-in. For each upload you only need the items below:
        </p>
        <ul className="instructions-list">
          <li>Public-facing artwork name</li>
          <li>Correct modality (TDS Online Student or TDS In-Person Student)</li>
          <li>Final JPG or PNG file under the 2-upload limit</li>
        </ul>
        <p style={{ color: 'var(--muted)' }}>
          Once you upload, that modality is locked to you unless you delete every entry first.
        </p>
        <button className="glow-button" type="button" onClick={dismiss}>
          Let me upload
        </button>
      </div>
    </div>
  )
}

export default UploadInstructionsModal
