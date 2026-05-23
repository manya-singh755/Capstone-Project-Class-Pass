import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { SensorAPI } from '../data/sensorData'
import { API } from '../services/api'
import { useSocket } from '../hooks/useSocket'
import '../styles/ums.css'

function UMSLogin({ onLogin }) {
  const [uid, setUid] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await SensorAPI.loginAsync('teacher', uid, password)
    if (result.success) {
      onLogin(result.user)
    } else {
      setError(result.error || 'Invalid Employee ID or Password')
      setLoading(false)
    }
  }

  const demoLogin = async () => {
    setLoading(true)
    const result = await SensorAPI.loginAsync('teacher', 'T001', 'lpu2026')
    if (result.success) onLogin(result.user)
    else { SensorAPI.login('teacher', 'T001', 'lpu2026'); onLogin({ uid: 'T001', name: 'Dr. Sharma', department: 'CSE' }) }
  }

  return (
    <div className="ums-login-page">
      <div className="ums-top-bar">
        <div className="ums-top-inner">
          <span className="ums-logo-text">LPU</span>
          <span className="ums-portal-label">University Management System</span>
        </div>
      </div>
      <div className="ums-login-container">
        <div className="ums-login-box">
          <div className="ums-crest">
            <i className="fas fa-university"></i>
          </div>
          <h2>Faculty Portal</h2>
          <p className="ums-slogan">Lovely Professional University, Phagwara</p>

          {error && <div className="ums-error"><i className="fas fa-exclamation-triangle"></i>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="ums-field">
              <label>Employee ID</label>
              <input type="text" value={uid} onChange={e => setUid(e.target.value)} placeholder="e.g. T001" required />
            </div>
            <div className="ums-field">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" required />
            </div>
            <button type="submit" className="ums-submit" disabled={loading}>
              {loading ? <><i className="fas fa-spinner fa-spin"></i>Signing in...</> : <><i className="fas fa-sign-in-alt"></i>Sign In</>}
            </button>
          </form>

          <button className="ums-demo-btn" onClick={demoLogin}>
            <i className="fas fa-bolt"></i> Quick Demo Login (Dr. Sharma)
          </button>

          <div className="ums-links">
            <Link to="/login">← Back to CLASS-PASS</Link>
            <a href="#">Forgot Password?</a>
          </div>
        </div>
      </div>
      <div className="ums-footer">
        © 2026 Lovely Professional University · UMS Portal · Phagwara, Punjab 144411
      </div>
    </div>
  )
}

function UMSDashboard({ user }) {
  const [schedule, setSchedule] = useState([])
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [punchingSlot, setPunchingSlot] = useState(null)
  const [notification, setNotification] = useState(null)
  const [confirmSlot, setConfirmSlot] = useState(null)
  const [availableRooms, setAvailableRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState('')
  const [punchLaterSlots, setPunchLaterSlots] = useState({}) // track "punch later" choices
  const [changeRoomSlot, setChangeRoomSlot] = useState(null) // for changing room after attendance
  const [changeRoomTarget, setChangeRoomTarget] = useState('')
  const navigate = useNavigate()

  useSocket({
    'attendance:punched': () => loadAttendance(),
    'attendance:unpunched': () => loadAttendance(),
  })

  const loadAttendance = useCallback(async () => {
    const records = await API.getAttendanceToday(user.uid)
    if (Array.isArray(records)) setAttendance(records)
  }, [user.uid])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/classrooms/teacher-schedule/${user.uid}`)
        const teacherSchedule = await res.json()
        if (Array.isArray(teacherSchedule)) {
          setSchedule(teacherSchedule)
        }
      } catch (err) {
        console.warn('[UMS] Failed to fetch teacher schedule:', err.message)
        setSchedule([])
      }
      await loadAttendance()
      setLoading(false)
    }
    load()
  }, [user, loadAttendance])

  const isPunched = (room, subject) => {
    return attendance.some(a => (a.room === room || a.subject === subject) && a.active)
  }

  const getPunchRecord = (room, subject) => {
    return attendance.find(a => (a.room === room || a.subject === subject) && a.active)
  }

  const isPunchLater = (room, subject) => {
    return punchLaterSlots[`${room}-${subject}`] === true
  }

  const handlePunchLater = (slot) => {
    setPunchLaterSlots(prev => ({
      ...prev,
      [`${slot.room}-${slot.subject}`]: true
    }))
    setNotification({ type: 'info', text: `You chose to punch later for ${slot.subject}. You can punch anytime.` })
    setTimeout(() => setNotification(null), 4000)
  }

  const handlePunchClick = async (slot) => {
    // Remove from punch-later if it was there
    setPunchLaterSlots(prev => {
      const copy = { ...prev }
      delete copy[`${slot.room}-${slot.subject}`]
      return copy
    })
    setConfirmSlot(slot)
    setSelectedRoom(slot.room)
    try {
      const res = await fetch('/api/classrooms?status=available&limit=100')
      const data = await res.json()
      setAvailableRooms(data.classrooms || [])
    } catch(err) {
      console.warn("Could not fetch available rooms", err)
      setAvailableRooms([])
    }
  }

  const confirmPunch = async () => {
    if (!confirmSlot) return
    const roomToPunch = selectedRoom || confirmSlot.room
    setPunchingSlot(`${confirmSlot.room}-${confirmSlot.subject}`)
    const slotData = confirmSlot
    setConfirmSlot(null)

    const result = await API.punchAttendance(user.uid, user.name, roomToPunch, slotData.subject)
    if (result.success) {
      setNotification({ type: 'success', text: `✅ Attendance punched for ${slotData.subject} in Room ${roomToPunch}` })
      await loadAttendance()
    } else {
      setNotification({ type: 'error', text: result.error || 'Failed to punch attendance' })
    }
    setPunchingSlot(null)
    setTimeout(() => setNotification(null), 4000)
  }

  const handleUnpunch = async (record) => {
    const result = await API.unpunchAttendance(record.id)
    if (result.success) {
      setNotification({ type: 'info', text: `Attendance cancelled for Room ${record.room}` })
      await loadAttendance()
    }
    setTimeout(() => setNotification(null), 4000)
  }

  // Change classroom after attendance
  const handleChangeRoom = async (record) => {
    setChangeRoomSlot(record)
    setChangeRoomTarget(record.room)
    try {
      const res = await fetch('/api/classrooms?status=available&limit=100')
      const data = await res.json()
      setAvailableRooms(data.classrooms || [])
    } catch {
      setAvailableRooms([])
    }
  }

  const confirmChangeRoom = async () => {
    if (!changeRoomSlot || !changeRoomTarget) return
    // Unpunch old record, then punch new one
    await API.unpunchAttendance(changeRoomSlot.id)
    const result = await API.punchAttendance(user.uid, user.name, changeRoomTarget, changeRoomSlot.subject)
    if (result.success) {
      setNotification({ type: 'success', text: `✅ Classroom changed to Room ${changeRoomTarget} for ${changeRoomSlot.subject}` })
      await loadAttendance()
    } else {
      setNotification({ type: 'error', text: result.error || 'Failed to change classroom' })
    }
    setChangeRoomSlot(null)
    setTimeout(() => setNotification(null), 4000)
  }

  const handleLogout = () => {
    SensorAPI.logout()
    navigate('/ums')
    window.location.reload()
  }

  const now = new Date()
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const totalPunched = attendance.filter(a => a.active).length
  const totalPending = schedule.filter(s => s.teacher).length - totalPunched

  return (
    <div className="ums-dashboard">
      {/* Top Bar */}
      <div className="ums-top-bar">
        <div className="ums-top-inner">
          <div className="ums-top-left">
            <span className="ums-logo-text">LPU</span>
            <span className="ums-portal-label">University Management System</span>
          </div>
          <div className="ums-top-right">
            <Link to="/teacher" className="ums-classpass-link">
              <i className="fas fa-external-link-alt"></i> Open CLASS-PASS
            </Link>
            <span className="ums-user-badge">
              <i className="fas fa-user-circle"></i> {user.name}
            </span>
            <button className="ums-logout" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>
      </div>

      {notification && (
        <div className={`ums-notification ${notification.type}`}>
          <i className={`fas ${notification.type === 'success' ? 'fa-check-circle' : notification.type === 'error' ? 'fa-times-circle' : 'fa-info-circle'}`}></i>
          {notification.text}
        </div>
      )}

      <div className="ums-body">
        {/* Profile Sidebar */}
        <aside className="ums-profile-sidebar">
          <div className="ums-profile-card">
            <div className="ums-avatar">{user.avatar || user.name?.charAt(0)}</div>
            <h3>{user.name}</h3>
            <p className="ums-designation">{user.designation || 'Faculty'}</p>
            <p className="ums-dept">{user.department} Department</p>
            <div className="ums-divider"></div>
            <div className="ums-profile-meta">
              <div><i className="fas fa-id-badge"></i><span>ID: {user.uid}</span></div>
              <div><i className="fas fa-envelope"></i><span>{user.email || `${user.uid.toLowerCase()}@lpu.in`}</span></div>
              <div><i className="fas fa-calendar-day"></i><span>{dateStr}</span></div>
            </div>
          </div>

          <div className="ums-quick-stats">
            <div className="ums-qstat">
              <h4>{schedule.filter(s => s.teacher).length}</h4>
              <span>Classes</span>
            </div>
            <div className="ums-qstat punched">
              <h4>{totalPunched}</h4>
              <span>Punched</span>
            </div>
            <div className="ums-qstat pending">
              <h4>{Math.max(0, totalPending)}</h4>
              <span>Pending</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="ums-progress-card">
            <div className="ums-progress-label">
              <span>Today's Progress</span>
              <span>{schedule.filter(s => s.teacher).length > 0 ? Math.round((totalPunched / schedule.filter(s => s.teacher).length) * 100) : 0}%</span>
            </div>
            <div className="ums-progress-bar">
              <div className="ums-progress-fill" style={{ width: `${schedule.filter(s => s.teacher).length > 0 ? (totalPunched / schedule.filter(s => s.teacher).length) * 100 : 0}%` }}></div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="ums-main">
          <div className="ums-section-header">
            <h2><i className="fas fa-calendar-alt"></i> Today's Schedule</h2>
            <span className="ums-date-badge"><i className="fas fa-clock"></i> {dateStr}</span>
          </div>

          {loading ? (
            <div className="ums-loading">
              <div className="ums-loading-spinner"></div>
              <p>Loading your schedule...</p>
            </div>
          ) : schedule.length === 0 ? (
            <div className="ums-empty">
              <i className="fas fa-coffee"></i>
              <h3>No Classes Today</h3>
              <p>You don't have any scheduled lectures for today.</p>
            </div>
          ) : (
            <div className="ums-schedule-list">
              {schedule.map((slot, i) => {
                const punched = isPunched(slot.room, slot.subject)
                const punchRecord = getPunchRecord(slot.room, slot.subject)
                const isPast = slot.end <= currentTime
                const isCurrent = currentTime >= slot.start && currentTime < slot.end
                const isPunching = punchingSlot === `${slot.room}-${slot.subject}`
                const isLater = isPunchLater(slot.room, slot.subject)
                const isFreePeriod = !slot.teacher

                if (isFreePeriod) {
                  return (
                    <div className="ums-schedule-card free-period" key={i}>
                      <div className="ums-time-col">
                        <span className="ums-time-start">{fmtTime(slot.start)}</span>
                        <div className="ums-time-line"></div>
                        <span className="ums-time-end">{fmtTime(slot.end)}</span>
                      </div>
                      <div className="ums-schedule-info">
                        <h3 className="free-label"><i className="fas fa-coffee"></i> {slot.subject}</h3>
                      </div>
                      <div className="ums-punch-col">
                        <div className="ums-free-badge">
                          <i className="fas fa-minus-circle"></i> No Punch Required
                        </div>
                      </div>
                    </div>
                  )
                }

                return (
                  <div className={`ums-schedule-card ${punched ? 'punched' : ''} ${isCurrent ? 'current' : ''} ${isPast && !punched ? 'past' : ''}`} key={i}>
                    <div className="ums-time-col">
                      <span className="ums-time-start">{fmtTime(slot.start)}</span>
                      <div className="ums-time-line"></div>
                      <span className="ums-time-end">{fmtTime(slot.end)}</span>
                    </div>
                    <div className="ums-schedule-info">
                      <h3>{slot.subject}</h3>
                      <div className="ums-schedule-meta">
                        <span><i className="fas fa-door-open"></i> Room {punchRecord?.room || slot.room}</span>
                        <span><i className="fas fa-building"></i> {slot.building}</span>
                        <span><i className="fas fa-layer-group"></i> {slot.floor}</span>
                      </div>
                      {punched && punchRecord && (
                        <div className="ums-punch-timestamp">
                          <i className="fas fa-check-circle"></i> Punched at {new Date(punchRecord.punchedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          {punchRecord.room !== slot.room && <span className="ums-room-changed"> · Relocated to Room {punchRecord.room}</span>}
                        </div>
                      )}
                    </div>
                    <div className="ums-punch-col">
                      {punched ? (
                        /* ===== ATTENDANCE ALREADY MARKED ===== */
                        <>
                          <div className="ums-punch-marked">
                            <i className="fas fa-check-circle"></i> Attendance Marked ✅
                          </div>
                          <div className="ums-punch-actions">
                            <button className="ums-change-room-btn" onClick={() => handleChangeRoom(punchRecord)} title="Change Classroom">
                              <i className="fas fa-exchange-alt"></i> Change Room
                            </button>
                            <button className="ums-unpunch" onClick={() => handleUnpunch(punchRecord)} title="Cancel Attendance">
                              <i className="fas fa-undo"></i> Undo
                            </button>
                          </div>
                        </>
                      ) : isPast ? (
                        /* ===== MISSED ===== */
                        <div className="ums-punch-missed-wrap">
                          <div className="ums-punch-missed">
                            <i className="fas fa-times-circle"></i> Missed
                          </div>
                          <button
                            className="ums-punch-btn late"
                            onClick={() => handlePunchClick(slot)}
                          >
                            <i className="fas fa-fingerprint"></i> Punch Late
                          </button>
                        </div>
                      ) : isLater ? (
                        /* ===== DEFERRED (Punch Later) ===== */
                        <div className="ums-punch-deferred">
                          <div className="ums-deferred-label">
                            <i className="fas fa-clock"></i> Deferred
                          </div>
                          <button
                            className={`ums-punch-btn ${isCurrent ? 'pulse' : ''}`}
                            onClick={() => handlePunchClick(slot)}
                          >
                            <i className="fas fa-fingerprint"></i> Punch Now
                          </button>
                        </div>
                      ) : (
                        /* ===== NOT YET PUNCHED ===== */
                        <div className="ums-punch-options">
                          <button
                            className={`ums-punch-btn ${isCurrent ? 'pulse' : ''}`}
                            onClick={() => handlePunchClick(slot)}
                            disabled={isPunching}
                          >
                            {isPunching ? (
                              <><i className="fas fa-spinner fa-spin"></i> Punching...</>
                            ) : (
                              <><i className="fas fa-fingerprint"></i> Punch Attendance</>
                            )}
                          </button>
                          <button
                            className="ums-punch-later-btn"
                            onClick={() => handlePunchLater(slot)}
                          >
                            <i className="fas fa-clock"></i> Punch Later
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Attendance History */}
          {attendance.length > 0 && (
            <div className="ums-section-header" style={{ marginTop: 32 }}>
              <h2><i className="fas fa-history"></i> Today's Attendance Log</h2>
            </div>
          )}
          {attendance.length > 0 && (
            <div className="ums-attendance-log">
              {attendance.map((rec, i) => (
                <div className={`ums-log-entry ${rec.active ? 'active' : 'inactive'}`} key={i}>
                  <span className={`ums-log-dot ${rec.active ? 'active' : ''}`}></span>
                  <div className="ums-log-info">
                    <strong>{rec.subject}</strong> — Room {rec.room}
                    <span className="ums-log-time">Punched at {new Date(rec.punchedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <span className={`ums-log-status ${rec.active ? 'active' : ''}`}>
                    {rec.active ? 'Active' : 'Ended'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Confirmation Modal — Punch Attendance */}
      {confirmSlot && (
        <div className="modal-overlay" onClick={() => setConfirmSlot(null)}>
          <div className="modal-card ums-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-fingerprint" style={{color: 'var(--accent)'}}></i> Confirm Attendance</h3>
              <button className="modal-close" onClick={() => setConfirmSlot(null)}><i className="fas fa-times"></i></button>
            </div>
            
            <div className="ums-confirm-info">
              <div className="ums-confirm-subject">
                <i className="fas fa-book"></i>
                <div>
                  <label>Subject</label>
                  <strong>{confirmSlot.subject}</strong>
                </div>
              </div>
              <div className="ums-confirm-room">
                <i className="fas fa-door-open"></i>
                <div>
                  <label>Scheduled Room</label>
                  <strong>{confirmSlot.room}</strong>
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 24, textAlign: 'left' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8, display: 'block' }}>
                <i className="fas fa-map-marker-alt" style={{color: 'var(--accent)', marginRight: 6}}></i>
                Continue in this classroom or change?
              </label>
              <select 
                value={selectedRoom} 
                onChange={e => setSelectedRoom(e.target.value)}
                className="ums-room-select"
              >
                <option value={confirmSlot.room}>✅ Continue in {confirmSlot.room} (Scheduled)</option>
                <optgroup label="Available Rooms to Relocate">
                  {availableRooms.map(r => (
                    r.room !== confirmSlot.room && (
                      <option key={r.room} value={r.room}>🔄 Change to {r.room} ({r.building}, Cap: {r.capacity})</option>
                    )
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="ums-confirm-actions">
              <button onClick={() => setConfirmSlot(null)} className="btn btn-outline">
                <i className="fas fa-times"></i> Cancel
              </button>
              <button onClick={confirmPunch} className="btn btn-primary ums-confirm-punch-btn">
                <i className="fas fa-fingerprint"></i> Confirm & Punch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Room Modal */}
      {changeRoomSlot && (
        <div className="modal-overlay" onClick={() => setChangeRoomSlot(null)}>
          <div className="modal-card ums-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-exchange-alt" style={{color: 'var(--accent)'}}></i> Change Classroom</h3>
              <button className="modal-close" onClick={() => setChangeRoomSlot(null)}><i className="fas fa-times"></i></button>
            </div>

            <div className="ums-confirm-info">
              <div className="ums-confirm-subject">
                <i className="fas fa-book"></i>
                <div>
                  <label>Subject</label>
                  <strong>{changeRoomSlot.subject}</strong>
                </div>
              </div>
              <div className="ums-confirm-room">
                <i className="fas fa-door-open"></i>
                <div>
                  <label>Current Room</label>
                  <strong>{changeRoomSlot.room}</strong>
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 24, textAlign: 'left' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8, display: 'block' }}>
                <i className="fas fa-map-marker-alt" style={{color: 'var(--accent)', marginRight: 6}}></i>
                Select new classroom
              </label>
              <select 
                value={changeRoomTarget} 
                onChange={e => setChangeRoomTarget(e.target.value)}
                className="ums-room-select"
              >
                <option value={changeRoomSlot.room}>Stay in {changeRoomSlot.room} (Current)</option>
                <optgroup label="Available Rooms">
                  {availableRooms.map(r => (
                    r.room !== changeRoomSlot.room && (
                      <option key={r.room} value={r.room}>{r.room} ({r.building}, Cap: {r.capacity})</option>
                    )
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="ums-confirm-actions">
              <button onClick={() => setChangeRoomSlot(null)} className="btn btn-outline">
                <i className="fas fa-times"></i> Cancel
              </button>
              <button onClick={confirmChangeRoom} className="btn btn-accent" disabled={changeRoomTarget === changeRoomSlot.room}>
                <i className="fas fa-exchange-alt"></i> Change Classroom
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function fmtTime(t) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

export default function UMSPortal() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const saved = SensorAPI.getLoggedInUser()
    if (saved && saved.role === 'teacher') setUser(saved)
  }, [])

  if (!user) return <UMSLogin onLogin={setUser} />
  return <UMSDashboard user={user} />
}
