/*  ============================================
    CLASS-PASS — Sensor Data Layer (API-Backed)
    Now backed by Express backend APIs.
    Falls back to minimal mock data if offline.
    ============================================  */

import { API } from '../services/api.js'

// ---- Fallback mock data (only used when backend is down) ----
const mockClassrooms = [
  { id: 'CR001', room: '34-301', building: 'Block 34', floor: '3rd Floor', capacity: 60, equipment: 'Projector, Smart Board', type: 'Classroom', department: 'CSE', status: 'available', statusLabel: 'Available', currentActivity: 'No scheduled class', teacher: null, freeInfo: 'Free rest of day' },
  { id: 'CR002', room: '36-201', building: 'Block 36', floor: '2nd Floor', capacity: 120, equipment: 'Dual Projectors, Mic System', type: 'Lecture Hall', department: 'CSE', status: 'scheduled', statusLabel: 'Scheduled', currentActivity: 'Machine Learning', teacher: 'Dr. Mehta', freeInfo: 'Free at 10:00 AM' },
  { id: 'CR003', room: '38-105', building: 'Block 38', floor: '1st Floor', capacity: 45, equipment: 'Projector, AC', type: 'Classroom', department: 'ECE', status: 'available', statusLabel: 'Available', currentActivity: 'No scheduled class', teacher: null, freeInfo: 'Free until 1:00 PM' },
]

const mockUsers = {
  students: [
    { uid: '12312345', name: 'Surya Kumar', password: 'lpu2026', section: 'K22CS', program: 'B.Tech CSE', year: '2026', avatar: 'SK' },
  ],
  teachers: [
    { uid: 'T001', name: 'Dr. Sharma', password: 'lpu2026', department: 'CSE', designation: 'Associate Professor', avatar: 'DS' },
  ],
  admins: [
    { uid: 'A001', name: 'Admin', password: 'lpu2026', role: 'System Administrator', avatar: 'A' },
  ]
}

// ============================================================
// SENSOR API — Now API-backed with offline fallback
// ============================================================
export const SensorAPI = {
  async loginAsync(role, uid, password) {
    const result = await API.login(role, uid, password)
    if (result.success && result.user) {
      sessionStorage.setItem('classpass_user', JSON.stringify({ ...result.user, role }))
      return { success: true, user: result.user }
    }
    if (result._offline) {
      // Offline fallback
      return this.login(role, uid, password)
    }
    return { success: false, error: result.error || 'Invalid credentials' }
  },

  // Synchronous fallback login (for backward compat)
  login(role, uid, password) {
    const pool = mockUsers[role + 's'] || []
    const user = pool.find(u => u.uid === uid && u.password === password)
    if (user) {
      sessionStorage.setItem('classpass_user', JSON.stringify({ ...user, role }))
      return { success: true, user }
    }
    return { success: false, error: 'Invalid credentials' }
  },

  getLoggedInUser() {
    const data = sessionStorage.getItem('classpass_user')
    return data ? JSON.parse(data) : null
  },

  logout() {
    sessionStorage.removeItem('classpass_user')
  },

  // Async API-backed classroom fetch
  async getClassroomsAsync(filters = {}) {
    const result = await API.getClassrooms(filters)
    if (result.classrooms) return result
    // Offline fallback
    return { classrooms: mockClassrooms, total: mockClassrooms.length, page: 1, pages: 1 }
  },

  // Sync fallback (for components that haven't migrated to async)
  getClassrooms() {
    return mockClassrooms
  },

  async getStatsAsync() {
    return await API.getClassroomStats()
  },

  async getBuildingsAsync() {
    return await API.getBuildings()
  },

  async bookRoomAsync(room, userId, userName, subject, duration) {
    return await API.bookRoom(room, userId, userName, subject, duration)
  },

  bookRoom(roomId, userId, subject, duration) {
    return { success: true, booking: { bookingId: 'BK' + Date.now(), roomId, userId, subject, duration } }
  },

  async cancelBookingAsync(id) {
    return await API.cancelBooking(id)
  },

  async getBookingsAsync(userId) {
    return await API.getBookings(userId)
  },

  async reportIssueAsync(room, type, description, reportedBy) {
    return await API.reportIssue(room, type, description, reportedBy)
  },

  reportIssue(roomId, issueType, description, reportedBy) {
    return { success: true, issue: { issueId: 'ISS' + Date.now(), roomId, issueType, description, reportedBy, status: 'open' } }
  },

  async punchAttendanceAsync(teacherUid, teacherName, room, subject) {
    return await API.punchAttendance(teacherUid, teacherName, room, subject)
  },

  async getAttendanceTodayAsync(teacherUid) {
    return await API.getAttendanceToday(teacherUid)
  },

  async getIssuesAsync(status) {
    return await API.getIssues(status)
  },

  async getCameraStatusAsync() {
    return await API.getCameraStatus()
  },
}
