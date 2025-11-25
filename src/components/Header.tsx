import { NavLink, useNavigate } from 'react-router-dom'
import { useSession } from '../session'
import ArrowIcon from './ArrowIcon'

const NAV_LINKS = [
  { to: '/vote', label: 'Vote feed' },
  { to: '/upload', label: 'Upload' },
  { to: '/admin', label: 'Admin' },
]

const Header = () => {
  const navigate = useNavigate()
  const { session, clearSession } = useSession()

  const handleSignOut = () => {
    clearSession()
    navigate('/auth')
  }

  const handleSignIn = () => navigate('/auth')

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
        <div className="account-dropdown">
          <button className="user-chip account-trigger" type="button">
            {session ? session.user.email : 'Guest account'}
          </button>
          <div className="account-menu">
            {session ? (
              <button type="button" onClick={handleSignOut} className="pill-button pill-button--compact">
                <span className="pill-button__knob">
                  <ArrowIcon />
                </span>
                <span className="pill-button__label">Sign out</span>
              </button>
            ) : (
              <button type="button" onClick={handleSignIn} className="pill-button pill-button--compact">
                <span className="pill-button__knob">
                  <ArrowIcon />
                </span>
                <span className="pill-button__label">Sign in</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
