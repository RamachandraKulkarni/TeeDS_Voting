import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useSession } from '../session'

const NAV_LINKS = [
  { to: '/vote', label: 'Vote feed' },
  { to: '/upload', label: 'Upload' },
  { to: '/admin', label: 'Admin' },
]

const Header = () => {
  const navigate = useNavigate()
  const { session, clearSession } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
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

  return (
    <header className="header-panel fade-in">
      <div className="header-bar header-bar--single">
        <nav className="header-nav">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="header-center">TEEDS 2026 · Design Showcase</div>
        <div className="header-auth" ref={menuRef}>
          {session ? (
            <>
              <button
                type="button"
                className="nav-link nav-link--action"
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
            <button type="button" onClick={handleSignIn} className="nav-link nav-link--action">
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
