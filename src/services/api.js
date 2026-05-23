/*  ============================================
    CLASS-PASS — API Service Layer
    Wraps fetch calls to the Express backend.
    Falls back to mock data if backend is down.
    ============================================  */

const BASE = '/api'

async function request(method, path, body) {
  try {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    }
    if (body) opts.body = JSON.stringify(body)

    const res = await fetch(`${BASE}${path}`, opts)
    const data = await res.json()

    if (!res.ok) {
      return { success: false, error: data.error || `HTTP ${res.status}`, _offline: false }
    }
    
    // If the response is an array, return it directly (don't spread)
    if (Array.isArray(data)) {
      return data
    }
    
    return { ...data, _offline: false }
  } catch (err) {
    console.warn(`[API] Offline or error: ${method} ${path}`, err.message)
    return { success: false, error: 'Backend unreachable', _offline: true }
  }
}

export const API = {
  // Auth
  login: (role, uid, password) => request('POST', '/auth/login', { role, uid, password }),
  getTeachers: (department) => request('GET', `/auth/teachers${department ? `?department=${department}` : ''}`),

  // Classrooms
  getClassrooms: (filters = {}) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v && v !== 'all') params.set(k, v) })
    return request('GET', `/classrooms?${params.toString()}`)
  },
  getClassroomStats: () => request('GET', '/classrooms/stats'),
  getBuildings: () => request('GET', '/classrooms/buildings'),
  getClassroom: (roomId) => request('GET', `/classrooms/${roomId}`),
  getSchedule: (roomId) => request('GET', `/classrooms/${roomId}/schedule`),

  // Attendance
  punchAttendance: (teacherUid, teacherName, room, subject) =>
    request('POST', '/attendance/punch', { teacherUid, teacherName, room, subject }),
  unpunchAttendance: (id) => request('DELETE', `/attendance/${id}`),
  getAttendanceToday: (teacherUid) =>
    request('GET', `/attendance/today${teacherUid ? `?teacherUid=${teacherUid}` : ''}`),

  // Bookings
  bookRoom: (room, userId, userName, subject, duration) =>
    request('POST', '/bookings', { room, userId, userName, subject, duration }),
  getBookings: (userId) => request('GET', `/bookings${userId ? `?userId=${userId}` : ''}`),
  cancelBooking: (id) => request('DELETE', `/bookings/${id}`),

  // Camera
  getCameraStatus: () => request('GET', '/camera/status'),

  // Issues
  reportIssue: (room, type, description, reportedBy) =>
    request('POST', '/issues', { room, type, description, reportedBy }),
  getIssues: (status) => request('GET', `/issues${status ? `?status=${status}` : ''}`),
  updateIssue: (id, status) => request('PATCH', `/issues/${id}`, { status }),

  // Health
  health: () => request('GET', '/health'),
}
