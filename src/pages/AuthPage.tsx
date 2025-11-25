import { FormEvent, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { invokeEdgeFunction } from '../api/supabaseClient'
import { Session, useSession } from '../session'

type RequestOtpResponse = { ok: boolean; message: string }
type VerifyOtpResponse = { ok: boolean; session: Session }

const AuthPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { setSession } = useSession()

  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'request' | 'verify'>('request')
  const [status, setStatus] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleRequestOtp = async (event: FormEvent) => {
    event.preventDefault()
    setStatus(null)

    if (!email.endsWith('@asu.edu')) {
      setStatus('Please use your @asu.edu email address')
      return
    }

    setIsLoading(true)
    try {
      const response = await invokeEdgeFunction<RequestOtpResponse>('request-otp', { email })
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

    try {
      const response = await invokeEdgeFunction<VerifyOtpResponse>('verify-otp', { email, otp })
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
        Link your @asu.edu identity, then type the six-digit code we drop into your inbox. It keeps the vote clean and the
        experience super fast.
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
