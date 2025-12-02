import { ChangeEvent, FormEvent, useState } from 'react'
import { invokeEdgeFunction } from '../api/supabaseClient'

const INITIAL_FORM = {
  name: '',
  email: '',
  topic: '',
  message: '',
}

const extractErrorMessage = (value: unknown) => {
  if (value instanceof Error) {
    try {
      const parsed = JSON.parse(value.message)
      if (parsed && typeof parsed === 'object' && 'message' in parsed) {
        const parsedMessage = (parsed as { message?: string }).message
        if (parsedMessage) {
          return parsedMessage
        }
      }
    } catch (err) {
      console.debug('contact form error parsing failed', err)
    }
    return value.message
  }
  return 'Unable to send message. Please try again later.'
}

interface ContactModalProps {
  onClose: () => void
}

const ContactModal = ({ onClose }: ContactModalProps) => {
  const [formValues, setFormValues] = useState(INITIAL_FORM)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const [error, setError] = useState<string | null>(null)

  const resetState = () => {
    setFormValues({ ...INITIAL_FORM })
    setStatus('idle')
    setError(null)
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const updateField = (field: keyof typeof INITIAL_FORM) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const value = event.target.value
    setFormValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setStatus('loading')

    try {
      await invokeEdgeFunction<{ ok: boolean; message?: string }>('contact-organizers', {
        name: formValues.name,
        email: formValues.email,
        topic: formValues.topic || undefined,
        message: formValues.message,
      })
      setStatus('success')
      setFormValues({ ...INITIAL_FORM })
    } catch (err) {
      console.error('contact form submit error', err)
      setStatus('idle')
      setError(extractErrorMessage(err))
    }
  }

  return (
    <div className="modal-overlay contact-overlay" role="dialog" aria-modal="true">
      <div className="modal-content contact-modal">
        <button className="ghost-button modal-close" type="button" onClick={handleClose}>
          Close
        </button>
        <p className="eyebrow">Contact the organizers</p>
        <h3 style={{ marginTop: 0 }}>Need help? Reach out.</h3>
        <p className="header-summary" style={{ marginBottom: '1rem' }}>
          Send a note to the TEE-DS team with any questions about eligibility, submissions, or accessibility.
        </p>
        <form className="contact-form" onSubmit={handleSubmit}>
          <label className="contact-form__field">
            <span>Name</span>
            <input
              type="text"
              name="name"
              required
              maxLength={120}
              value={formValues.name}
              onChange={updateField('name')}
              placeholder="Your full name"
            />
          </label>
          <label className="contact-form__field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              required
              maxLength={160}
              value={formValues.email}
              onChange={updateField('email')}
              placeholder="you@asu.edu"
            />
          </label>
          <label className="contact-form__field">
            <span>Topic (optional)</span>
            <input
              type="text"
              name="topic"
              maxLength={120}
              value={formValues.topic}
              onChange={updateField('topic')}
              placeholder="e.g., Upload troubleshooting"
            />
          </label>
          <label className="contact-form__field">
            <span>Message</span>
            <textarea
              name="message"
              required
              rows={5}
              maxLength={2000}
              value={formValues.message}
              onChange={updateField('message')}
              placeholder="Share as many details as you can so the admin team can follow up quickly."
            />
          </label>
          {error && (
            <p className="notice error" role="alert" style={{ marginTop: '0.5rem' }}>
              {error}
            </p>
          )}
          {status === 'success' && (
            <p className="notice" role="status" style={{ marginTop: '0.5rem' }}>
              Thanks! Your message reached the admin inbox.
            </p>
          )}
          <div className="contact-form__actions">
            <button className="ghost-button" type="button" onClick={handleClose}>
              Cancel
            </button>
            <button className="glow-button" type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Sending…' : 'Send message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ContactModal
