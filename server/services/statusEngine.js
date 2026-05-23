/*  ============================================
    CLASS-PASS — Smart Status Engine
    Determines real-time classroom status based on
    attendance, bookings, camera, and timetable.
    ============================================  */

const { getTimetable } = require('../data/timetable')

// In-memory state stores
const attendanceRecords = []   // { id, teacherUid, teacherName, room, subject, punchedAt, active }
const bookings = []            // { id, room, userId, userName, subject, duration, createdAt, expiresAt, active }
const cameraReadings = {}      // { [room]: { peopleDetected, count, lastUpdate } }
const issues = []              // { id, room, type, description, reportedBy, status, createdAt }

function now() {
  const d = new Date()
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function fmtTime(t) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

/**
 * Compute the status of a single classroom.
 *
 * Priority:
 *   1. Teacher punched attendance → "Lecture Running"
 *   2. Room is booked             → "Reserved"  
 *   3. Camera detects people      → "Student Use"
 *   4. Scheduled class (no punch) → "Scheduled" (dimmed)
 *   5. Nothing                    → "Available"
 */
function computeStatus(room) {
  const currentTime = now()

  // Priority 1: Active attendance
  const activeAttendance = attendanceRecords.find(
    a => a.room === room.room && a.active
  )
  if (activeAttendance) {
    // Auto-expire if punched more than 2 hours ago
    const punchedTime = new Date(activeAttendance.punchedAt)
    const elapsed = (Date.now() - punchedTime.getTime()) / (1000 * 60)
    if (elapsed > 120) {
      activeAttendance.active = false
    } else {
      return {
        status: 'lecture',
        statusLabel: 'Lecture Running',
        currentActivity: activeAttendance.subject,
        teacher: activeAttendance.teacherName,
        freeInfo: `Since ${fmtTime(punchedTime.getHours().toString().padStart(2,'0') + ':' + punchedTime.getMinutes().toString().padStart(2,'0'))}`,
      }
    }
  }

  // Priority 2: Active booking
  const activeBooking = bookings.find(
    b => b.room === room.room && b.active && new Date(b.expiresAt) > new Date()
  )
  if (activeBooking) {
    return {
      status: 'reserved',
      statusLabel: 'Reserved',
      currentActivity: activeBooking.subject,
      teacher: activeBooking.userName,
      freeInfo: `Booked until ${fmtTime(new Date(activeBooking.expiresAt).getHours().toString().padStart(2,'0') + ':' + new Date(activeBooking.expiresAt).getMinutes().toString().padStart(2,'0'))}`,
    }
  }

  // Priority 3: Camera detects people
  const cam = cameraReadings[room.room]
  if (cam && cam.peopleDetected) {
    const age = (Date.now() - new Date(cam.lastUpdate).getTime()) / 1000
    if (age < 30) {  // Camera data within 30 seconds
      return {
        status: 'student-use',
        statusLabel: 'Student Use',
        currentActivity: `Detected ~${cam.count} ${cam.count === 1 ? 'person' : 'people'}`,
        teacher: null,
        freeInfo: 'Camera detected occupancy',
      }
    }
  }

  // Priority 4/5: Check timetable
  const timetable = getTimetable()
  const schedule = timetable[room.room] || []
  const currentSlot = schedule.find(s => currentTime >= s.start && currentTime < s.end)
  const nextSlot = schedule.find(s => s.start > currentTime && s.teacher)

  if (currentSlot && currentSlot.teacher) {
    // Scheduled but no attendance punch — show as "scheduled" (not actively running)
    return {
      status: 'scheduled',
      statusLabel: 'Scheduled',
      currentActivity: currentSlot.subject,
      teacher: currentSlot.teacher,
      freeInfo: `Free at ${fmtTime(currentSlot.end)}`,
    }
  }

  // Available
  return {
    status: 'available',
    statusLabel: 'Available',
    currentActivity: 'No scheduled class',
    teacher: null,
    freeInfo: nextSlot ? `Free until ${fmtTime(nextSlot.start)}` : 'Free rest of day',
  }
}

function punchAttendance(teacherUid, teacherName, room, subject) {
  // Deactivate any existing punch for this room or this teacher
  attendanceRecords.forEach(a => {
    if (a.active && (a.room === room || a.teacherUid === teacherUid)) {
      a.active = false
    }
  })

  const record = {
    id: 'ATT-' + Date.now(),
    teacherUid,
    teacherName,
    room,
    subject,
    punchedAt: new Date().toISOString(),
    active: true,
  }
  attendanceRecords.push(record)
  return record
}

function unpunchAttendance(id) {
  const rec = attendanceRecords.find(a => a.id === id)
  if (rec) { rec.active = false; return true }
  return false
}

function getAttendanceToday() {
  const today = new Date().toDateString()
  return attendanceRecords.filter(a => new Date(a.punchedAt).toDateString() === today)
}

// --- Bookings ---
function createBooking(room, userId, userName, subject, durationHours) {
  // Deactivate conflicting bookings
  bookings.forEach(b => {
    if (b.room === room && b.active) b.active = false
  })

  const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000)
  const booking = {
    id: 'BK-' + Date.now(),
    room,
    userId,
    userName,
    subject: subject || 'Emergency Class',
    duration: `${durationHours} Hour${durationHours > 1 ? 's' : ''}`,
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    active: true,
  }
  bookings.push(booking)
  return booking
}

function cancelBooking(id) {
  const booking = bookings.find(b => b.id === id)
  if (booking) { booking.active = false; return true }
  return false
}

function getActiveBookings(userId) {
  const filtered = userId
    ? bookings.filter(b => b.userId === userId && b.active && new Date(b.expiresAt) > new Date())
    : bookings.filter(b => b.active && new Date(b.expiresAt) > new Date())
  return filtered
}

function getAllBookings() {
  return bookings
}

// --- Camera ---
function updateCamera(room, peopleDetected, count) {
  cameraReadings[room] = {
    peopleDetected,
    count: count || 0,
    lastUpdate: new Date().toISOString(),
  }
}

function getCameraStatus() {
  return { ...cameraReadings }
}

// --- Issues ---
function reportIssue(room, type, description, reportedBy) {
  const issue = {
    id: 'ISS-' + Date.now(),
    room,
    type,
    description,
    reportedBy,
    status: 'open',
    createdAt: new Date().toISOString(),
  }
  issues.push(issue)
  return issue
}

function getIssues(status) {
  if (status) return issues.filter(i => i.status === status)
  return issues
}

function updateIssueStatus(id, status) {
  const issue = issues.find(i => i.id === id)
  if (issue) { issue.status = status; return issue }
  return null
}

// --- Cleanup daemon ---
function startCleanupDaemon() {
  setInterval(() => {
    // Expire old attendance (>2 hours)
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000
    attendanceRecords.forEach(a => {
      if (a.active && new Date(a.punchedAt).getTime() < twoHoursAgo) {
        a.active = false
      }
    })

    // Expire old bookings
    bookings.forEach(b => {
      if (b.active && new Date(b.expiresAt) < new Date()) {
        b.active = false
      }
    })
  }, 60 * 1000) // every minute
}

module.exports = {
  computeStatus,
  punchAttendance, unpunchAttendance, getAttendanceToday,
  createBooking, cancelBooking, getActiveBookings, getAllBookings,
  updateCamera, getCameraStatus,
  reportIssue, getIssues, updateIssueStatus,
  startCleanupDaemon,
}
