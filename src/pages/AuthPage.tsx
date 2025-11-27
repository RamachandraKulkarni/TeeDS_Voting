import { FormEvent, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { invokeEdgeFunction } from '../api/supabaseClient'
import { Session, useSession } from '../session'

type RequestOtpResponse = { ok: boolean; message: string }
type VerifyOtpResponse = { ok: boolean; session: Session }

const PROFILE_STORAGE_KEY = 'teeds.v1.authProfile'

const AuthPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { setSession } = useSession()

  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [asuId, setAsuId] = useState('')
  const [discipline, setDiscipline] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'request' | 'verify'>('request')
  const [status, setStatus] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = window.localStorage.getItem(PROFILE_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as { fullName?: string; asuId?: string; discipline?: string }
        setFullName(parsed.fullName ?? '')
        setAsuId(parsed.asuId ?? '')
        setDiscipline(parsed.discipline ?? '')
      }
    } catch (error) {
      console.warn('Unable to hydrate auth profile', error)
    }
  }, [])

  const persistProfile = (details: { fullName: string; asuId: string; discipline: string }) => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(details))
    } catch (error) {
      console.warn('Unable to persist auth profile', error)
    }
  }

  const handleRequestOtp = async (event: FormEvent) => {
    event.preventDefault()
    setStatus(null)

    if (!email.endsWith('@asu.edu')) {
      setStatus('Please use your @asu.edu email address')
      return
    }

    const trimmedName = fullName.trim()
    const trimmedAsuId = asuId.trim()
    const trimmedDiscipline = discipline.trim()

    if (!trimmedName || !trimmedAsuId || !trimmedDiscipline) {
      setStatus('Name, ASU ID, and discipline are required')
      return
    }

    persistProfile({ fullName: trimmedName, asuId: trimmedAsuId, discipline: trimmedDiscipline })

    setIsLoading(true)
    try {
      const response = await invokeEdgeFunction<RequestOtpResponse>('request-otp', {
        email,
        fullName: trimmedName,
        asuId: trimmedAsuId,
        discipline: trimmedDiscipline,
      })
      setStatus(response.message)
      setStep('verify')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to send OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (event: FormEvent) => {
    event.preventDefault()
    setStatus(null)
    setIsLoading(true)

    const trimmedName = fullName.trim()
    const trimmedAsuId = asuId.trim()
    const trimmedDiscipline = discipline.trim()

    try {
      const response = await invokeEdgeFunction<VerifyOtpResponse>('verify-otp', {
        email,
        otp,
        fullName: trimmedName,
        asuId: trimmedAsuId,
        discipline: trimmedDiscipline,
      })
      setSession(response.session)
      const redirectTo = (location.state as { from?: string } | undefined)?.from ?? '/vote'
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'OTP verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="panel highlight fade-in" style={{ maxWidth: '520px', margin: '0 auto' }}>
      <p className="eyebrow">Secure portal</p>
      <h2 style={{ marginTop: 0 }}>ASU OTP sign in</h2>
      <p className="header-summary">
        Link your @asu.edu identity, confirm your name, ASU ID, and discipline, then enter the six-digit code we drop into
        your inbox. It keeps the vote clean and the experience super fast.
      </p>

      {status && <p className={`notice ${status.toLowerCase().includes('fail') ? 'error' : ''}`}>{status}</p>}

      {step === 'request' ? (
        <form onSubmit={handleRequestOtp}>
          <label>
            ASU email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value.trim().toLowerCase())}
              placeholder="you@asu.edu"
            />
          </label>
          <label>
            Full name
            <input
              type="text"
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="First Last"
            />
          </label>
          <label>
            ASU ID number
            <input
              type="text"
              required
              value={asuId}
              onChange={(event) => setAsuId(event.target.value)}
              placeholder="1234567890"
            />
          </label>
          <label>
            Discipline / Program
            <input
              type="text"
              required
              value={discipline}
              onChange={(event) => setDiscipline(event.target.value)}
              placeholder="e.g. Visual Communication"
            />
          </label>
          <button className="glow-button" type="submit" disabled={isLoading}>
            {isLoading ? 'Sending…' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp}>
          <label>
            6-digit OTP
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
              placeholder="000000"
            />
          </label>
          <button className="glow-button" type="submit" disabled={isLoading}>
            {isLoading ? 'Checking…' : 'Verify & Continue'}
          </button>
          <button className="ghost-button" type="button" onClick={() => setStep('request')} disabled={isLoading}>
            Start over
          </button>
        </form>
      )}
    </section>
  )
}

export default AuthPage
