import { useState, useEffect, useCallback } from 'react'
import { NavLink } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { SensorAPI } from '../data/sensorData'
import { API } from '../services/api'
import { useSocket } from '../hooks/useSocket'

export default function AdminDashboard() {
  const [stats, setStats] = useState({})
  const [byBuilding, setByBuilding] = useState({})
  const [issues, setIssues] = useState([])
  const [cameraStatus, setCameraStatus] = useState({})
  const [backendHealth, setBackendHealth] = useState(null)
  const [bookings, setBookings] = useState([])
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)

  useSocket({
    'classroom:update': () => loadAll(),
    'issue:reported': (issue) => setIssues(prev => [issue, ...prev]),
    'booking:created': () => loadBookings(),
    'attendance:punched': () => loadAttendance(),
    'camera:status': () => loadCameraStatus(),
  })

  const loadCameraStatus = async () => {
    const cam = await SensorAPI.getCameraStatusAsync()
    if (cam && !cam.error) setCameraStatus(cam)
  }

  const loadAll = useCallback(async () => {
    setLoading(true)
    const statsResult = await SensorAPI.getStatsAsync()
    if (statsResult?.counts) setStats(statsResult.counts)
    if (statsResult?.byBuilding) setByBuilding(statsResult.byBuilding)

    const issueResult = await SensorAPI.getIssuesAsync()
    if (Array.isArray(issueResult)) setIssues(issueResult)

    await loadCameraStatus()

    const health = await API.health()
    setBackendHealth(health)

    await loadBookings()
    await loadAttendance()
    setLoading(false)
  }, [])

  const loadBookings = async () => {
    const result = await API.getBookings()
    if (Array.isArray(result)) setBookings(result)
  }

  const loadAttendance = async () => {
    const result = await API.getAttendanceToday()
    if (Array.isArray(result)) setAttendance(result)
  }

  useEffect(() => { loadAll() }, [loadAll])
  useEffect(() => {
    const id = setInterval(loadAll, 15000)
    return () => clearInterval(id)
  }, [loadAll])

  const updateIssueStatus = async (id, status) => {
    await API.updateIssue(id, status)
    const updated = await SensorAPI.getIssuesAsync()
    if (Array.isArray(updated)) setIssues(updated)
  }

  // Heatmap data
  const hours = ['8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM']
  const buildingNames = Object.keys(byBuilding).sort().slice(0, 12)
  const heatData = buildingNames.map(b => {
    const info = byBuilding[b]
    return hours.map(() => {
      const utilization = info ? (info.occupied / info.total) : Math.random()
      if (utilization > 0.75) return 'peak'
      if (utilization > 0.5) return 'high'
      if (utilization > 0.25) return 'medium'
      return 'low'
    })
  })

  const cameraRooms = Object.keys(cameraStatus)
  const activeAttendance = attendance.filter(a => a.active)
  const openIssues = issues.filter(i => i.status === 'open')
  const uptimeHrs = backendHealth?.uptime ? Math.floor(backendHealth.uptime / 3600) : 0
  const uptimeMins = backendHealth?.uptime ? Math.floor((backendHealth.uptime % 3600) / 60) : 0

  return (
    <div className="dashboard">
      <Sidebar portalLabel="Admin Portal">
        <NavLink to="/admin" className="nav-item active"><i className="fas fa-tachometer-alt"></i>Dashboard</NavLink>
        <NavLink to="/student" className="nav-item"><i className="fas fa-building"></i>All Classrooms</NavLink>
        <div className="nav-item"><i className="fas fa-satellite-dish"></i>Sensor Network</div>
        <div className="nav-item"><i className="fas fa-chart-pie"></i>Analytics</div>
        <div className="nav-item"><i className="fas fa-users-cog"></i>User Management</div>
      </Sidebar>
      <div className="main">
        <Header roleBadge="Admin" roleClass="admin" />
        <div className="content">
          {/* Primary Stats */}
          <div className="stats-row">
            {[
              { icon: 'fa-building', color: 'blue', value: stats.total || 0, label: 'Total Classrooms' },
              { icon: 'fa-check-circle', color: 'green', value: stats.available || 0, label: 'Available Now' },
              { icon: 'fa-broadcast-tower', color: 'red', value: stats.lecture || 0, label: 'Lectures Active' },
              { icon: 'fa-exclamation-triangle', color: 'orange', value: openIssues.length, label: 'Open Issues' },
            ].map((s, i) => (
              <div className="stat-card" key={i}>
                <div className={`stat-icon ${s.color}`}><i className={`fas ${s.icon}`}></i></div>
                <div className="stat-info"><h3>{s.value}</h3><p>{s.label}</p></div>
              </div>
            ))}
          </div>

          {/* Secondary Stats */}
          <div className="stats-row" style={{ marginBottom: 26 }}>
            {[
              { icon: 'fa-calendar-check', color: 'blue', value: bookings.length, label: 'Active Bookings' },
              { icon: 'fa-fingerprint', color: 'green', value: activeAttendance.length, label: 'Punched Today' },
              { icon: 'fa-video', color: 'orange', value: cameraRooms.length, label: 'Camera Feeds' },
              { icon: 'fa-server', color: backendHealth?.status === 'ok' ? 'green' : 'red', value: backendHealth?.status === 'ok' ? 'Online' : 'Offline', label: `System · ${uptimeHrs}h ${uptimeMins}m` },
            ].map((s, i) => (
              <div className="stat-card" key={`s2-${i}`}>
                <div className={`stat-icon ${s.color}`}><i className={`fas ${s.icon}`}></i></div>
                <div className="stat-info"><h3>{s.value}</h3><p>{s.label}</p></div>
              </div>
            ))}
          </div>

          <div className="teacher-grid">
            {/* Heatmap */}
            <div className="panel">
              <div className="panel-title"><i className="fas fa-fire"></i>Utilization Heatmap</div>
              <div className="panel-subtitle">Classroom usage intensity by building and hour</div>
              {buildingNames.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-lighter)', fontSize: 13 }}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: 20 }}></i>
                  <p style={{ marginTop: 8 }}>Loading building data...</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 12 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: 6, color: 'var(--text-light)', fontWeight: 600 }}>Building</th>
                        {hours.map(h => <th key={h} style={{ padding: 6, color: 'var(--text-lighter)', fontWeight: 500 }}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {buildingNames.map((b, bi) => (
                        <tr key={b}>
                          <td style={{ padding: 6, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', fontSize: 11 }}>{b}</td>
                          {(heatData[bi] || []).map((level, hi) => (
                            <td key={hi} style={{ padding: 4 }}>
                              <div style={{
                                width: 26, height: 26, borderRadius: 6, margin: '0 auto',
                                background: level === 'peak' ? 'rgba(239,68,68,.7)' : level === 'high' ? 'rgba(245,158,11,.6)' : level === 'medium' ? 'rgba(34,197,94,.4)' : 'rgba(10,31,68,.05)',
                                transition: 'all 0.3s',
                              }}></div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div style={{ display: 'flex', gap: 18, marginTop: 16, fontSize: 11, color: 'var(--text-lighter)', flexWrap: 'wrap' }}>
                {[{ l: 'Low', c: 'rgba(10,31,68,.05)' }, { l: 'Medium', c: 'rgba(34,197,94,.4)' }, { l: 'High', c: 'rgba(245,158,11,.6)' }, { l: 'Peak', c: 'rgba(239,68,68,.7)' }].map(x => (
                  <span key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 14, height: 14, borderRadius: 4, background: x.c, display: 'inline-block' }}></span>{x.l}
                  </span>
                ))}
              </div>
            </div>

            {/* Right column */}
            <div>
              {/* Issues */}
              <div className="panel" style={{ marginBottom: 22 }}>
                <div className="panel-title">
                  <i className="fas fa-exclamation-circle"></i>Recent Issues
                  {openIssues.length > 0 && <span style={{ marginLeft: 'auto', background: 'var(--danger)', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>{openIssues.length} Open</span>}
                </div>
                <div className="panel-subtitle">Infrastructure and equipment reports</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                  {issues.length === 0 ? (
                    <div style={{ padding: 20, color: 'var(--text-lighter)', fontSize: 13, textAlign: 'center' }}>
                      <i className="fas fa-check-circle" style={{ fontSize: 28, display: 'block', marginBottom: 10, color: 'var(--success)' }}></i>
                      No issues reported
                    </div>
                  ) : issues.slice(0, 6).map(iss => (
                    <div key={iss.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg)', borderRadius: 10, fontSize: 13, transition: 'all 0.2s' }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        background: iss.status === 'open' ? 'var(--danger)' : iss.status === 'in-progress' ? 'var(--warning)' : 'var(--success)',
                        boxShadow: iss.status === 'open' ? '0 0 6px rgba(239,68,68,.4)' : 'none',
                      }}></span>
                      <div style={{ flex: 1 }}>
                        <strong>Room {iss.room}</strong> — {iss.type}
                        <div style={{ fontSize: 11, color: 'var(--text-lighter)', marginTop: 2 }}>{iss.reportedBy} · {iss.description?.substring(0, 40)}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {iss.status === 'open' && (
                          <button style={{ padding: '5px 10px', fontSize: 10, background: 'var(--warning)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}
                            onClick={() => updateIssueStatus(iss.id, 'in-progress')}>In Progress</button>
                        )}
                        {(iss.status === 'open' || iss.status === 'in-progress') && (
                          <button style={{ padding: '5px 10px', fontSize: 10, background: 'var(--success)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}
                            onClick={() => updateIssueStatus(iss.id, 'resolved')}>Resolve</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Camera Status */}
              <div className="panel" style={{ marginBottom: 22 }}>
                <div className="panel-title"><i className="fas fa-video"></i>Camera Feeds</div>
                <div className="panel-subtitle">Active occupancy detection cameras</div>
                {cameraRooms.length === 0 ? (
                  <div style={{ padding: 20, color: 'var(--text-lighter)', fontSize: 13, textAlign: 'center' }}>
                    <i className="fas fa-video-slash" style={{ fontSize: 24, display: 'block', marginBottom: 10, opacity: 0.5 }}></i>
                    No active cameras
                    <code style={{ display: 'block', marginTop: 10, fontSize: 11, background: 'var(--bg)', padding: 10, borderRadius: 8, color: 'var(--text-light)' }}>
                      python camera/detector.py --room 34-301 --camera 0
                    </code>
                  </div>
                ) : cameraRooms.map(room => {
                  const data = cameraStatus[room]
                  const status = data.connectionStatus || 'active'
                  return (
                    <div key={room} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                      <span style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: status === 'active' ? (data.peopleDetected ? 'var(--success)' : 'var(--text-lighter)') : status === 'stale' ? 'var(--warning)' : 'var(--danger)',
                        boxShadow: status === 'active' && data.peopleDetected ? '0 0 6px rgba(34,197,94,.4)' : 'none',
                      }}></span>
                      <div style={{ flex: 1 }}>
                        <strong>Room {room}</strong>
                        <div style={{ fontSize: 11, color: 'var(--text-lighter)', marginTop: 1 }}>
                          {status === 'active' ? (
                            data.peopleDetected ? `${data.count} detected — Camera Connected ✅` : 'Empty — Camera Connected ✅'
                          ) : status === 'stale' ? 'Detecting Activity… ⏳' : 'Disconnected ❌'}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 11, padding: '3px 8px', borderRadius: 6, fontWeight: 600,
                        background: status === 'active' ? 'rgba(34,197,94,.08)' : status === 'stale' ? 'rgba(245,158,11,.08)' : 'rgba(239,68,68,.08)',
                        color: status === 'active' ? 'var(--success)' : status === 'stale' ? 'var(--warning)' : 'var(--danger)',
                      }}>
                        {status === 'active' ? 'Live' : status === 'stale' ? 'Stale' : 'Offline'}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Active Attendance */}
              <div className="panel">
                <div className="panel-title">
                  <i className="fas fa-fingerprint"></i>Live Attendance
                  {activeAttendance.length > 0 && <span style={{ marginLeft: 'auto', background: 'rgba(5,150,105,.1)', color: '#059669', fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>{activeAttendance.length} Active</span>}
                </div>
                <div className="panel-subtitle">Teachers currently punched in</div>
                {activeAttendance.length === 0 ? (
                  <div style={{ padding: 20, color: 'var(--text-lighter)', fontSize: 13, textAlign: 'center' }}>
                    No active attendance records
                  </div>
                ) : activeAttendance.slice(0, 8).map(att => (
                  <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px rgba(34,197,94,0.4)', flexShrink: 0 }}></span>
                    <div style={{ flex: 1 }}>
                      <strong>{att.teacherName}</strong> — {att.subject}
                      <div style={{ fontSize: 11, color: 'var(--text-lighter)', marginTop: 1 }}>Room {att.room} · {new Date(att.punchedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <footer className="page-footer">© 2026 CLASS-PASS · Lovely Professional University, Phagwara, Punjab</footer>
      </div>
    </div>
  )
}
