import { useState } from 'react'

const STORAGE_KEY = 'teeds.v1.instructionsDismissed'

const InstructionsModal = () => {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return !window.localStorage.getItem(STORAGE_KEY)
  })

  const dismiss = () => {
    setIsOpen(false)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, 'true')
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="modal-overlay instructions-overlay" role="dialog" aria-modal="true">
      <div className="modal-content instructions-modal">
        <button aria-label="Dismiss instructions" className="ghost-button modal-close" type="button" onClick={dismiss}>
          Close
        </button>
        <p className="eyebrow">Before you sign in</p>
        <h3 style={{ marginTop: 0 }}>Have your ASU info ready</h3>
        <p className="header-summary" style={{ marginBottom: '1rem' }}>
          We collect a few details to keep the showcase secure. You will need the following before requesting your OTP:
        </p>
        <ul className="instructions-list">
          <li>Your @asu.edu email address</li>
          <li>Full name as it appears on ASU records</li>
          <li>ASU ID number</li>
          <li>Your discipline or program (e.g., Industrial Design)</li>
        </ul>
        <p style={{ color: 'var(--muted)' }}>
          Keep the OTP email open—you only have 10 minutes to enter the code once it arrives.
        </p>
        <button className="glow-button" type="button" onClick={dismiss}>
          I’m ready
        </button>
      </div>
    </div>
  )
}

export default InstructionsModal
