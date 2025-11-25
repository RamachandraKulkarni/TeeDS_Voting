import { NavLink, useNavigate } from 'react-router-dom'
import { useSession } from '../session'

const Header = () => {
  const navigate = useNavigate()
  const { session, clearSession } = useSession()

  const handleLogout = () => {
    clearSession()
    navigate('/auth')
  }

  return (
    <header className="card" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>TEEDS Design Showcase</strong>
          {session ? (
            <small>{session.user.email}</small>
          ) : (
            <small>ASU-only login</small>
          )}
        </div>
        <nav style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <NavLink to="/vote" className={({ isActive }) => (isActive ? 'link-active' : '')}>
            Vote
          </NavLink>
          <NavLink to="/upload" className={({ isActive }) => (isActive ? 'link-active' : '')}>
            Upload Designs
          </NavLink>
          <NavLink to="/admin" className={({ isActive }) => (isActive ? 'link-active' : '')}>
            Admin Analytics
          </NavLink>
          <span style={{ flexGrow: 1 }} />
          {session ? (
            <button onClick={handleLogout} type="button">
              Sign out
            </button>
          ) : (
            <button onClick={() => navigate('/auth')} type="button">
              Sign in
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header
