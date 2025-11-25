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
    <section className="card" style={{ maxWidth: '480px', margin: '0 auto' }}>
      <h2>ASU OTP Sign in</h2>
      <p>We keep accounts simple: enter your @asu.edu email, then confirm with the 6-digit OTP.</p>

      {status && <p className={`notice ${status.toLowerCase().includes('fail') ? 'error' : ''}`}>{status}</p>}

      {step === 'request' ? (
        <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label>
            ASU Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value.trim().toLowerCase())}
              placeholder="you@asu.edu"
            />
          </label>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Checking...' : 'Verify & Continue'}
          </button>
          <button type="button" onClick={() => setStep('request')} disabled={isLoading}>
            Start over
          </button>
        </form>
      )}
    </section>
  )
}

export default AuthPage
