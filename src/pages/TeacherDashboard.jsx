import { useState, useEffect, useCallback } from 'react'
import { NavLink, Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { ToastProvider, useToast } from '../components/Toast'
import { SensorAPI } from '../data/sensorData'
import { API } from '../services/api'
import { useSocket } from '../hooks/useSocket'

function TeacherContent() {
  const [subject, setSubject] = useState('')
  const [prefBuilding, setPrefBuilding] = useState('all')
  const [prefCapacity, setPrefCapacity] = useState('30-100')
  const [duration, setDuration] = useState('1')
  const [suggested, setSuggested] = useState([])
  const [selectedChips, setSelectedChips] = useState(['Projector'])
  const [issueRoom, setIssueRoom] = useState('')
  const [issueDesc, setIssueDesc] = useState('')
  const [myBookings, setMyBookings] = useState([])
  const [buildings, setBuildings] = useState([])
  const [rooms, setRooms] = useState([])
  const [stats, setStats] = useState({})
  const [bookingLoading, setBookingLoading] = useState(false)
  const [attendance, setAttendance] = useState([])
  const showToast = useToast()
  const user = SensorAPI.getLoggedInUser()

  useSocket({
    'classroom:update': () => loadSuggestions(),
    'booking:cancelled': () => loadBookings(),
    'attendance:punched': () => loadAttendance(),
    'attendance:unpunched': () => loadAttendance(),
  })

  const loadSuggestions = useCallback(async () => {
    const filters = { status: 'available', limit: 5 }
    if (prefBuilding !== 'all') filters.building = prefBuilding
    const result = await SensorAPI.getClassroomsAsync(filters)
    let available = result.classrooms || []

    // Filter by capacity
    if (prefCapacity) {
      const parts = prefCapacity.split('-').map(Number)
      const [min, max] = parts.length === 2 ? parts : [parts[0], Infinity]
      available = available.filter(c => c.capacity >= min && c.capacity <= max)
    }

    setSuggested(available.slice(0, 3))
  }, [prefBuilding, prefCapacity])

  const loadBookings = useCallback(async () => {
    if (user?.uid) {
      const result = await SensorAPI.getBookingsAsync(user.uid)
      setMyBookings(Array.isArray(result) ? result : [])
    }
  }, [user?.uid])

  const loadAttendance = useCallback(async () => {
    if (user?.uid) {
      const result = await API.getAttendanceToday(user.uid)
      if (Array.isArray(result)) setAttendance(result)
    }
  }, [user?.uid])

  useEffect(() => {
    loadSuggestions()
    loadBookings()
    loadAttendance()
  }, [loadSuggestions, loadBookings, loadAttendance])

  useEffect(() => {
    async function loadMeta() {
      const meta = await SensorAPI.getBuildingsAsync()
      if (meta.buildings) setBuildings(meta.buildings)

      const statsResult = await SensorAPI.getStatsAsync()
      if (statsResult?.counts) setStats(statsResult.counts)

      // Get room list for issue reporting
      const r = await SensorAPI.getClassroomsAsync({ limit: 999 })
      const roomList = (r.classrooms || []).map(c => c.room).slice(0, 50)
      setRooms(roomList)
      if (roomList.length > 0 && !issueRoom) setIssueRoom(roomList[0])
    }
    loadMeta()
  }, [])

  const handleBook = async (room) => {
    if (!room) return showToast('No available rooms match your criteria', 'fa-exclamation-circle')
    setBookingLoading(true)
    const result = await SensorAPI.bookRoomAsync(
      room.room, user?.uid || 'T001', user?.name || 'Teacher',
      subject || 'Emergency Class', duration
    )
    if (result.success) {
      showToast(`Room ${room.room} booked for ${duration} hour(s)!`, 'fa-check-circle')
      loadSuggestions()
      loadBookings()
    } else {
      showToast(result.error || 'Booking failed', 'fa-exclamation-circle')
    }
    setBookingLoading(false)
  }

  const handleCancel = async (bookingId) => {
    const result = await SensorAPI.cancelBookingAsync(bookingId)
    if (result.success) {
      showToast('Booking cancelled!', 'fa-check-circle')
      loadBookings()
      loadSuggestions()
    }
  }

  const toggleChip = (chip) => {
    setSelectedChips(prev => prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip])
  }

  const handleReport = async () => {
    if (!issueDesc.trim()) return showToast('Please describe the issue', 'fa-exclamation-circle')
    const result = await SensorAPI.reportIssueAsync(issueRoom, selectedChips.join(', '), issueDesc, user?.name || 'Teacher')
    if (result.success) {
      showToast(`Issue reported for Room ${issueRoom}!`, 'fa-flag')
      setIssueDesc('')
    }
  }

  const activeAttendance = attendance.filter(a => a.active)

  return (
    <>
      {/* Stats */}
      <div className="stats-row">
        {[
          { icon: 'fa-fingerprint', color: 'green', value: activeAttendance.length, label: 'Active Attendance' },
          { icon: 'fa-door-open', color: 'blue', value: stats.available || 0, label: 'Available Rooms' },
          { icon: 'fa-calendar-check', color: 'orange', value: myBookings.length, label: 'My Bookings' },
          { icon: 'fa-exclamation-circle', color: 'red', value: stats.lecture || 0, label: 'Lectures Running' },
        ].map((s, i) => (
          <div className="stat-card" key={i}>
            <div className={`stat-icon ${s.color}`}><i className={`fas ${s.icon}`}></i></div>
            <div className="stat-info"><h3>{s.value}</h3><p>{s.label}</p></div>
          </div>
        ))}
      </div>

      <div className="teacher-grid">
        {/* Left: Emergency Booking */}
        <div>
          <div className="panel" style={{ marginBottom: 22 }}>
            <div className="panel-title"><i className="fas fa-bolt"></i>Emergency Booking</div>
            <div className="panel-subtitle">Quickly book the nearest available classroom</div>
            <div className="form-group"><label>Subject / Purpose</label><input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Data Structures Lab" /></div>
            <div className="form-group"><label>Preferred Building</label>
              <select value={prefBuilding} onChange={e => setPrefBuilding(e.target.value)}>
                <option value="all">Any Building</option>
                {buildings.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Required Capacity</label>
              <select value={prefCapacity} onChange={e => setPrefCapacity(e.target.value)}>
                <option value="20-50">20–50 Students</option>
                <option value="30-100">30–100 Students</option>
                <option value="50-150">50–150 Students</option>
                <option value="100-300">100–300 Students</option>
              </select>
            </div>
            <div className="form-group"><label>Duration (Hours)</label>
              <select value={duration} onChange={e => setDuration(e.target.value)}>
                <option value="1">1 Hour</option><option value="2">2 Hours</option><option value="3">3 Hours</option>
              </select>
            </div>

            {/* Suggested rooms */}
            {suggested.length > 0 && (
              <div className="suggestions-list">
                <div className="suggestions-title"><i className="fas fa-star"></i> Suggested Rooms</div>
                {suggested.map(room => (
                  <div className="suggested-room" key={room.id}>
                    <div className="room-icon"><i className="fas fa-door-open"></i></div>
                    <div className="room-info">
                      <h4>Room {room.room}</h4>
                      <p>{room.building}, {room.floor} · Capacity {room.capacity} · {room.type}</p>
                    </div>
                    <button className="btn btn-accent btn-sm" onClick={() => handleBook(room)} disabled={bookingLoading}>
                      <i className="fas fa-bolt"></i> Book
                    </button>
                  </div>
                ))}
              </div>
            )}
            {suggested.length === 0 && (
              <div className="no-suggestions">
                <i className="fas fa-info-circle"></i> No available rooms match your criteria. Try adjusting the filters.
              </div>
            )}
          </div>

          {/* My Active Bookings */}
          {myBookings.length > 0 && (
            <div className="panel">
              <div className="panel-title"><i className="fas fa-calendar-check"></i>My Active Bookings</div>
              <div className="panel-subtitle">Your current classroom reservations</div>
              <div className="bookings-list">
                {myBookings.map(b => (
                  <div className="booking-item" key={b.id}>
                    <div className="booking-info">
                      <strong>Room {b.room}</strong> — {b.subject}
                      <span className="booking-duration">{b.duration}</span>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={() => handleCancel(b.id)}>
                      <i className="fas fa-times"></i> Cancel
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Attendance + Report + Quick Actions */}
        <div>
          {/* Attendance Summary Card */}
          <div className="panel" style={{ marginBottom: 22 }}>
            <div className="panel-title"><i className="fas fa-fingerprint"></i>Attendance Status</div>
            <div className="panel-subtitle">Your current attendance overview</div>
            
            {activeAttendance.length > 0 ? (
              <div className="teacher-attendance-list">
                {activeAttendance.map(att => (
                  <div className="teacher-att-item" key={att.id}>
                    <div className="teacher-att-status">
                      <span className="teacher-att-dot active"></span>
                    </div>
                    <div className="teacher-att-info">
                      <strong>{att.subject}</strong>
                      <span>Room {att.room} · Since {new Date(att.punchedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="teacher-att-badge">Active ✅</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="teacher-att-empty">
                <i className="fas fa-clock"></i>
                <span>No active attendance. Punch from UMS Portal.</span>
              </div>
            )}
            
            <Link to="/ums" className="btn btn-accent" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
              <i className="fas fa-external-link-alt"></i> Open UMS Portal — Punch Attendance
            </Link>
          </div>

          <div className="panel" style={{ marginBottom: 22 }}>
            <div className="panel-title"><i className="fas fa-flag"></i>Report an Issue</div>
            <div className="panel-subtitle">Report equipment or facility problems</div>
            <div className="form-group"><label>Select Room</label>
              <select value={issueRoom} onChange={e => setIssueRoom(e.target.value)}>
                {rooms.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, display: 'block' }}>Issue Type</label>
              <div className="report-options">
                {['Projector', 'Board', 'AC', 'Lights', 'WiFi'].map(c => (
                  <span key={c} className={`report-chip ${selectedChips.includes(c) ? 'selected' : ''}`} onClick={() => toggleChip(c)}>
                    <i className={`fas ${c === 'Projector' ? 'fa-tv' : c === 'Board' ? 'fa-chalkboard' : c === 'AC' ? 'fa-snowflake' : c === 'Lights' ? 'fa-lightbulb' : 'fa-wifi'}`}></i> {c}
                  </span>
                ))}
              </div>
            </div>
            <div className="form-group"><label>Description</label>
              <textarea value={issueDesc} onChange={e => setIssueDesc(e.target.value)} placeholder="Describe the issue briefly..."></textarea>
            </div>
            <button className="btn btn-danger" onClick={handleReport}><i className="fas fa-exclamation-circle"></i>Submit Report</button>
          </div>

          <div className="panel">
            <div className="panel-title"><i className="fas fa-th"></i>Quick Actions</div>
            <div className="quick-actions">
              {[
                { label: 'My Schedule', icon: 'fa-calendar-alt', link: '/ums' },
                { label: 'Browse Rooms', icon: 'fa-search', link: '/student' },
                { label: 'Campus Map', icon: 'fa-map-marker-alt' },
                { label: 'IT Support', icon: 'fa-headset' },
              ].map((q, i) => (
                q.link ? (
                  <Link to={q.link} className="quick-action" key={i}>
                    <i className={`fas ${q.icon}`}></i>
                    <span>{q.label}</span>
                  </Link>
                ) : (
                  <div className="quick-action" key={i}>
                    <i className={`fas ${q.icon}`}></i>
                    <span>{q.label}</span>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function TeacherDashboard() {
  return (
    <ToastProvider>
      <div className="dashboard">
        <Sidebar portalLabel="Teacher Portal">
          <NavLink to="/teacher" className="nav-item active"><i className="fas fa-bolt"></i>Emergency Booking</NavLink>
          <NavLink to="/student" className="nav-item"><i className="fas fa-door-open"></i>Classroom Availability</NavLink>
          <Link to="/ums" className="nav-item"><i className="fas fa-fingerprint"></i>UMS Attendance</Link>
          <div className="nav-item"><i className="fas fa-chart-bar"></i>Reports</div>
        </Sidebar>
        <div className="main">
          <Header roleBadge="Teacher" roleClass="teacher" />
          <div className="content"><TeacherContent /></div>
          <footer className="page-footer">© 2026 CLASS-PASS · Lovely Professional University, Phagwara, Punjab</footer>
        </div>
      </div>
    </ToastProvider>
  )
}
