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

  const handleSignOut = () => {
    clearSession()
    navigate('/auth')
  }

  const handleSignIn = () => navigate('/auth')

  return (
    <header className="header-panel fade-in">
      <div className="header-meta">
        <p className="eyebrow">Honest poll · TEEDS 2025</p>
        <h1 className="headline">Design stories with honest votes.</h1>
        <p className="header-summary">
          Upload concepts, review peers, and keep tabs on both modalities in a single sleek dashboard.
        </p>
      </div>
      <div className="header-bar">
        <nav className="header-nav">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          <span className="user-chip">{session ? session.user.email : 'Signed out guest'}</span>
          {session ? (
            <button className="ghost-button" type="button" onClick={handleSignOut}>
              Sign out
            </button>
          ) : (
            <button className="glow-button" type="button" onClick={handleSignIn}>
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
