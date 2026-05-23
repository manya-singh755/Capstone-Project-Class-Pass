import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { SensorAPI } from '../data/sensorData'
import '../styles/login.css'

export default function Login() {
  const [role, setRole] = useState('student')
  const [uid, setUid] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sensors, setSensors] = useState([
    { label: 'PIR-34-301-B · Board', status: 'active', value: 'Writing detected' },
    { label: 'PIR-34-301-P · Projector', status: 'active', value: 'Projection active' },
    { label: 'PIR-38-105-B · Board', status: 'idle', value: 'No motion (12m)' },
    { label: 'PIR-36-201-P · Projector', status: 'alert', value: '⚠ Check sensor' },
    { label: 'PIR-38-303-B · Board', status: 'active', value: 'Motion detected' },
  ])
  const navigate = useNavigate()

  useEffect(() => {
    const user = SensorAPI.getLoggedInUser()
    if (user) navigate(`/${user.role}`, { replace: true })
  }, [navigate])

  useEffect(() => {
    const id = setInterval(() => {
      setSensors(prev => prev.map(s => {
        const r = Math.random()
        if (r > .7) return { ...s, status: 'active', value: s.label.includes('Board') ? 'Writing detected' : 'Projection active' }
        if (r > .3) return { ...s, status: 'idle', value: `No motion (${5 + Math.floor(Math.random() * 50)}m)` }
        if (r > .1) return { ...s, status: 'active', value: 'Motion detected' }
        return { ...s, status: 'alert', value: '⚠ Check sensor' }
      }))
    }, 3000)
    return () => clearInterval(id)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Try API first, fall back to local
    const result = await SensorAPI.loginAsync(role, uid, password)
    if (result.success) {
      navigate(`/${role}`, { replace: true })
    } else {
      setError(result.error || 'Invalid credentials. Check your ID and password.')
      setLoading(false)
    }
  }

  const demoLogin = async (r) => {
    const creds = {
      student: ['12312345', 'lpu2026'],
      teacher: ['T001', 'lpu2026'],
      admin: ['A001', 'lpu2026']
    }
    const [u, p] = creds[r]
    await SensorAPI.loginAsync(r, u, p).catch(() => SensorAPI.login(r, u, p))
    navigate(`/${r}`, { replace: true })
  }

  const labels = {
    student: ['Registration Number', 'e.g. 12312345'],
    teacher: ['Employee ID', 'e.g. T001'],
    admin: ['Admin ID', 'e.g. A001']
  }

  return (
    <div className="login-body">
      <div className="login-brand">
        <div className="brand-content">
          <div className="brand-logo">CP</div>
          <h1>CLASS<span>-PASS</span></h1>
          <p className="tagline">Smart IoT-powered classroom management for Lovely Professional University. Real-time availability, emergency booking, and campus optimization.</p>
          <div className="sensor-preview">
            <div className="sensor-preview-title"><i className="fas fa-satellite-dish"></i>&nbsp; Live Sensor Status</div>
            <div className="sensor-grid">
              {sensors.map((s, i) => (
                <div className="sensor-row" key={i}>
                  <div className={`sensor-dot ${s.status}`}></div>
                  <span className="label">{s.label}</span>
                  <span className="value">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="login-form-panel">
        <div className="login-card">
          <div className="university-badge"><i className="fas fa-university"></i>Lovely Professional University, Phagwara</div>
          <h2>Welcome Back</h2>
          <p className="subtitle">Sign in to access your CLASS-PASS dashboard</p>

          <div className="role-tabs">
            {['student', 'teacher', 'admin'].map(r => (
              <button key={r} className={`role-tab ${role === r ? 'active' : ''}`} onClick={() => { setRole(r); setError('') }}>
                <i className={`fas ${r === 'student' ? 'fa-user-graduate' : r === 'teacher' ? 'fa-chalkboard-teacher' : 'fa-shield-alt'}`}></i>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          {error && <div className="login-error show"><i className="fas fa-exclamation-circle"></i>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="login-field">
              <label>{labels[role][0]}</label>
              <div className="input-wrap">
                <i className="fas fa-id-card"></i>
                <input type="text" value={uid} onChange={e => setUid(e.target.value)} placeholder={labels[role][1]} required />
              </div>
            </div>
            <div className="login-field">
              <label>Password</label>
              <div className="input-wrap">
                <i className="fas fa-lock"></i>
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required />
                <button type="button" className="toggle-password" onClick={() => setShowPw(!showPw)}>
                  <i className={`fas ${showPw ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>
            <div className="login-options">
              <label><input type="checkbox" defaultChecked /> Remember me</label>
              <a href="#">Forgot password?</a>
            </div>
            <button type="submit" className={`login-submit ${loading ? 'loading' : ''}`} disabled={loading}>
              {loading ? <><i className="fas fa-spinner fa-spin"></i>Signing in...</> : <><i className="fas fa-sign-in-alt"></i>Sign In</>}
            </button>
          </form>

          <div className="login-divider">or quick demo access</div>
          <div className="quick-access">
            {['student', 'teacher', 'admin'].map(r => (
              <button key={r} className="quick-access-btn" onClick={() => demoLogin(r)}>
                <i className={`fas ${r === 'student' ? 'fa-user-graduate' : r === 'teacher' ? 'fa-chalkboard-teacher' : 'fa-shield-alt'}`}></i>
                <span>Demo {r.charAt(0).toUpperCase() + r.slice(1)}</span>
              </button>
            ))}
          </div>

          <div className="login-divider">or</div>
          <Link to="/ums" className="ums-link-btn">
            <i className="fas fa-fingerprint"></i>
            <span>Open UMS Portal (Faculty Attendance)</span>
          </Link>

          <div className="login-footer">© 2026 CLASS-PASS · Capstone Project · B.Tech CSE · Password: lpu2026</div>
        </div>
      </div>
    </div>
  )
}
