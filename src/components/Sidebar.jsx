import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { SensorAPI } from '../data/sensorData'

export default function Sidebar({ portalLabel, children }) {
  const [open, setOpen] = useState(false)
  const user = SensorAPI.getLoggedInUser()
  const navigate = useNavigate()

  // Close sidebar on route change (mobile)
  useEffect(() => { setOpen(false) }, [])

  const handleLogout = () => {
    SensorAPI.logout()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile hamburger */}
      <button className="hamburger" id="menuBtn" onClick={() => setOpen(true)}>
        <i className="fas fa-bars"></i>
      </button>

      {/* Overlay */}
      <div className={`sidebar-overlay ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />

      {/* Sidebar */}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <NavLink to="/" className="sidebar-brand" onClick={() => setOpen(false)}>
          <div className="logo-icon">CP</div>
          <div>
            <h2>CLASS-PASS</h2>
            <span>Smart Campus System</span>
          </div>
        </NavLink>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">{portalLabel || 'Navigation'}</div>
            {children}
          </div>
          <div className="nav-section">
            <div className="nav-section-title">System</div>
            <div className="nav-item"><i className="fas fa-cog"></i>Settings</div>
            <div className="nav-item"><i className="fas fa-question-circle"></i>Help Center</div>
            <div className="nav-item" onClick={handleLogout}><i className="fas fa-sign-out-alt"></i>Logout</div>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{user?.avatar || 'U'}</div>
            <div className="user-info">
              <h4>{user?.name || 'Guest'}</h4>
              <p>{user?.program ? `${user.program} — ${user.year}` : user?.department || user?.role || ''}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
