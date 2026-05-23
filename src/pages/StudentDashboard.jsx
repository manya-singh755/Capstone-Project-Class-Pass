import { useState, useEffect, useCallback } from 'react'
import { NavLink } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { ToastProvider, useToast } from '../components/Toast'
import { SensorAPI } from '../data/sensorData'
import { useSocket } from '../hooks/useSocket'

const STATUS_COLORS = {
  available: { bg: 'rgba(34,197,94,0.1)', color: '#16a34a', label: 'Available' },
  lecture: { bg: 'rgba(239,68,68,0.1)', color: '#dc2626', label: 'Lecture Running' },
  reserved: { bg: 'rgba(59,130,246,0.1)', color: '#2563eb', label: 'Reserved' },
  'student-use': { bg: 'rgba(234,179,8,0.1)', color: '#ca8a04', label: 'Student Use' },
  scheduled: { bg: 'rgba(100,116,139,0.1)', color: '#64748b', label: 'Scheduled' },
  occupied: { bg: 'rgba(239,68,68,0.1)', color: '#dc2626', label: 'Occupied' },
}

function StudentContent() {
  const [classrooms, setClassrooms] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [building, setBuilding] = useState('all')
  const [floor, setFloor] = useState('all')
  const [department, setDepartment] = useState('all')
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [buildings, setBuildings] = useState([])
  const [floors, setFloors] = useState([])
  const [departments, setDepartments] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [schedule, setSchedule] = useState([])
  const showToast = useToast()

  // Real-time updates
  useSocket({
    'classroom:update': (data) => {
      setClassrooms(prev => prev.map(c =>
        c.room === data.room ? { ...c, ...data } : c
      ))
    },
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    const result = await SensorAPI.getClassroomsAsync({
      building, floor, department, status, search, page, limit: 24
    })
    setClassrooms(result.classrooms || [])
    setTotal(result.total || 0)
    setPages(result.pages || 1)

    const statsResult = await SensorAPI.getStatsAsync()
    if (statsResult.counts) setStats(statsResult.counts)

    setLoading(false)
  }, [building, floor, department, status, search, page])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    async function loadMeta() {
      const meta = await SensorAPI.getBuildingsAsync()
      if (meta.buildings) setBuildings(meta.buildings)
      if (meta.floors) setFloors(meta.floors)
      if (meta.departments) setDepartments(meta.departments)
    }
    loadMeta()
  }, [])

  // Auto-refresh every 10s
  useEffect(() => {
    const id = setInterval(loadData, 10000)
    return () => clearInterval(id)
  }, [loadData])

  const viewSchedule = async (room) => {
    setSelectedRoom(room)
    const result = await SensorAPI.getClassroomsAsync({ search: room.room })
    const sched = await fetch(`/api/classrooms/${room.room}/schedule`).then(r => r.json()).catch(() => [])
    setSchedule(sched)
  }

  const statusBadge = (s) => {
    const config = STATUS_COLORS[s] || STATUS_COLORS.available
    return { background: config.bg, color: config.color }
  }

  return (
    <>
      <div className="stats-row">
        {[
          { icon: 'fa-building', color: 'blue', value: stats.total || total, label: 'Total Classrooms' },
          { icon: 'fa-check-circle', color: 'green', value: stats.available || 0, label: 'Available Now' },
          { icon: 'fa-broadcast-tower', color: 'red', value: stats.lecture || 0, label: 'Lectures Running' },
          { icon: 'fa-clock', color: 'blue', value: stats.reserved || 0, label: 'Reserved' },
        ].map((s, i) => (
          <div className="stat-card" key={i}>
            <div className={`stat-icon ${s.color}`}><i className={`fas ${s.icon}`}></i></div>
            <div className="stat-info"><h3>{s.value}</h3><p>{s.label}</p></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <span className="filter-label"><i className="fas fa-filter"></i> Filters:</span>
        <select className="filter-select" value={building} onChange={e => { setBuilding(e.target.value); setPage(1) }}>
          <option value="all">All Buildings</option>
          {buildings.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select className="filter-select" value={floor} onChange={e => { setFloor(e.target.value); setPage(1) }}>
          <option value="all">All Floors</option>
          {floors.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <select className="filter-select" value={department} onChange={e => { setDepartment(e.target.value); setPage(1) }}>
          <option value="all">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="filter-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="all">All Statuses</option>
          <option value="available">Available</option>
          <option value="lecture">Lecture Running</option>
          <option value="reserved">Reserved</option>
          <option value="student-use">Student Use</option>
          <option value="scheduled">Scheduled</option>
        </select>
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search room number..." />
        </div>
      </div>

      {/* Room grid */}
      {loading ? (
        <div className="no-results"><i className="fas fa-spinner fa-spin"></i><h3>Loading classrooms...</h3></div>
      ) : (
        <>
          <div className="results-count">
            Showing {classrooms.length} of {total} classrooms
            {total > 24 && <span className="page-info"> · Page {page} of {pages}</span>}
          </div>
          <div className="classroom-grid">
            {classrooms.length === 0 ? (
              <div className="no-results"><i className="fas fa-search"></i><h3>No classrooms found</h3><p>Try adjusting your filters.</p></div>
            ) : classrooms.map(c => (
              <div className={`classroom-card ${c.status}`} key={c.id} onClick={() => viewSchedule(c)}>
                <div className="card-header">
                  <span className="room-number">{c.room}</span>
                  <span className="status-badge" style={statusBadge(c.status)}>
                    {c.statusLabel || c.status}
                  </span>
                </div>
                <div className="card-details">
                  <div className="card-detail"><i className="fas fa-building"></i>{c.building} · {c.floor}</div>
                  <div className="card-detail"><i className="fas fa-users"></i>Capacity: {c.capacity}</div>
                  <div className="card-detail">
                    <i className={`fas ${c.teacher ? 'fa-chalkboard-teacher' : 'fa-tv'}`}></i>
                    {c.teacher ? `${c.currentActivity} — ${c.teacher}` : c.equipment}
                  </div>
                  <div className="card-detail"><i className="fas fa-tag"></i>{c.type} · {c.department}</div>
                </div>
                <div className="card-footer">
                  <span className="time-info"><i className="fas fa-clock"></i>{c.freeInfo}</span>
                  <span className={`status-dot ${c.status}`}></span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="page-btn">
                <i className="fas fa-chevron-left"></i> Previous
              </button>
              <span className="page-label">Page {page} of {pages}</span>
              <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="page-btn">
                Next <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      )}

      {/* Room Detail Modal */}
      {selectedRoom && (
        <div className="modal-overlay" onClick={() => setSelectedRoom(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-door-open"></i> Room {selectedRoom.room}</h3>
              <button className="modal-close" onClick={() => setSelectedRoom(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-meta">
              <span><i className="fas fa-building"></i> {selectedRoom.building}</span>
              <span><i className="fas fa-layer-group"></i> {selectedRoom.floor}</span>
              <span><i className="fas fa-users"></i> Capacity: {selectedRoom.capacity}</span>
              <span><i className="fas fa-tag"></i> {selectedRoom.type}</span>
            </div>
            <div className="modal-status" style={statusBadge(selectedRoom.status)}>
              {selectedRoom.statusLabel || selectedRoom.status} — {selectedRoom.currentActivity}
            </div>
            <h4 style={{ marginTop: 16, marginBottom: 8, fontSize: 14, fontWeight: 700 }}>
              <i className="fas fa-calendar-alt" style={{ color: 'var(--accent)', marginRight: 6 }}></i>
              Today's Schedule
            </h4>
            <div className="schedule-list">
              {schedule.length === 0 ? (
                <div style={{ padding: '12px 0', color: 'var(--text-lighter)', fontSize: 13 }}>No schedule data</div>
              ) : schedule.map((s, i) => (
                <div className={`schedule-item ${s.teacher ? 'has-class' : 'free'}`} key={i}>
                  <span className="sched-time">{fmtTime(s.start)} – {fmtTime(s.end)}</span>
                  <span className="sched-subject">{s.subject}</span>
                  {s.teacher && <span className="sched-teacher">{s.teacher}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function fmtTime(t) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

export default function StudentDashboard() {
  return (
    <ToastProvider>
      <div className="dashboard">
        <Sidebar portalLabel="Student Portal">
          <NavLink to="/student" className="nav-item active"><i className="fas fa-th-large"></i>Dashboard</NavLink>
          <NavLink to="/student" className="nav-item"><i className="fas fa-door-open"></i>Classroom Availability</NavLink>
          <div className="nav-item"><i className="fas fa-chart-bar"></i>Reports</div>
        </Sidebar>
        <div className="main">
          <Header roleBadge="Student" roleClass="student" />
          <div className="content"><StudentContent /></div>
          <footer className="page-footer">© 2026 CLASS-PASS · Lovely Professional University, Phagwara, Punjab</footer>
        </div>
      </div>
    </ToastProvider>
  )
}
