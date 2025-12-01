import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useSession } from '../session'
import teeLogo from '../assets/logos/tee-ds.svg'

const NAV_LINKS = [
  { to: '/vote', label: 'Vote feed' },
  { to: '/upload', label: 'Upload' },
  { to: '/admin', label: 'Admin' },
  { to: '/rules', label: 'Official Rules' },
  { to: '/timeline', label: 'Timeline' },
]

const EVENT_START = new Date('2026-01-24T15:30:00-07:00').getTime()

const getTimeLeft = () => {
  const diff = EVENT_START - Date.now()
  if (diff <= 0) {
    return null
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  const seconds = Math.floor((diff / 1000) % 60)

  return { days, hours, minutes, seconds }
}

const Header = () => {
  const navigate = useNavigate()
  const { session, clearSession } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const [timeLeft, setTimeLeft] = useState(getTimeLeft)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const handleSignOut = () => {
    clearSession()
    navigate('/auth')
    setMenuOpen(false)
  }

  const handleSignIn = () => {
    setMenuOpen(false)
    navigate('/auth')
  }

  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const displayName = session?.user.fullName?.split(' ')[0] ?? session?.user.email ?? 'Sign in'
  const showDropdown = Boolean(session && menuOpen)
  const countdownLabel = useMemo(() => {
    if (!timeLeft) return 'Event is live'
    const pad = (value: number) => value.toString().padStart(2, '0')
    return `${timeLeft.days}d : ${pad(timeLeft.hours)}h : ${pad(timeLeft.minutes)}m : ${pad(timeLeft.seconds)}s`
  }, [timeLeft])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTimeLeft(getTimeLeft())
    }, 1000)
    return () => window.clearInterval(interval)
  }, [])

  return (
    <header className="header-panel fade-in gd-header">
      <div className="gd-header__row">
        <div className="gd-brand">
          <img src={teeLogo} alt="TEE-DS 2026 logo" className="gd-brand__mark" />
          <div className="gd-brand__copy">
            <p className="gd-tagline__eyebrow">TEE-DS 2026</p>
            <p className="gd-tagline__note">Life-Centered Design - Design is a Dialogue</p>
          </div>
        </div>
        <div className="gd-rail">
          <nav className="header-nav gd-nav">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="gd-countdown">
            <span className="gd-countdown__label">Live printing event kicks off Jan 24, 2026</span>
            <strong className="gd-countdown__timer">{countdownLabel}</strong>
          </div>
          <div className="header-auth" ref={menuRef}>
            {session ? (
              <>
                <button
                  type="button"
                  className="header-auth__button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                >
                  {displayName}
                </button>
                {showDropdown && (
                  <div className="auth-dropdown" role="menu">
                    <div className="auth-dropdown__identity">
                      <p>{session.user.fullName ?? session.user.email}</p>
                      <small>{session.user.email}</small>
                    </div>
                    <button type="button" onClick={handleSignOut}>
                      Sign out
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button type="button" onClick={handleSignIn} className="header-auth__button">
                Sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
