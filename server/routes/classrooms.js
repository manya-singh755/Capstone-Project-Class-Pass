/*  CLASS-PASS — Classroom Routes  */
const { Router } = require('express')
const { getClassrooms } = require('../data/university')
const { getTimetable } = require('../data/timetable')
const { computeStatus } = require('../services/statusEngine')

const router = Router()

router.get('/', (req, res) => {
  const { building, floor, department, type, status, search, page, limit } = req.query
  let classrooms = getClassrooms()

  // Filters
  if (building && building !== 'all') {
    classrooms = classrooms.filter(c => c.building === building)
  }
  if (floor && floor !== 'all') {
    classrooms = classrooms.filter(c => c.floor === floor)
  }
  if (department && department !== 'all') {
    classrooms = classrooms.filter(c => c.department === department)
  }
  if (type && type !== 'all') {
    classrooms = classrooms.filter(c => c.type === type)
  }
  if (search) {
    const q = search.toLowerCase()
    classrooms = classrooms.filter(c =>
      c.room.toLowerCase().includes(q) ||
      c.building.toLowerCase().includes(q) ||
      c.department.toLowerCase().includes(q)
    )
  }

  // Compute statuses
  let results = classrooms.map(room => {
    const statusInfo = computeStatus(room)
    return { ...room, ...statusInfo, lastUpdated: new Date().toISOString() }
  })

  // Status filter (applied after computing)
  if (status && status !== 'all') {
    results = results.filter(r => r.status === status)
  }

  // Pagination
  const total = results.length
  const pageNum = parseInt(page) || 1
  const pageSize = parseInt(limit) || 50
  const start = (pageNum - 1) * pageSize
  const paged = results.slice(start, start + pageSize)

  res.json({
    classrooms: paged,
    total,
    page: pageNum,
    pages: Math.ceil(total / pageSize),
  })
})

router.get('/stats', (req, res) => {
  const classrooms = getClassrooms()
  const statuses = classrooms.map(room => ({
    room: room.room,
    building: room.building,
    ...computeStatus(room),
  }))

  const counts = {
    total: classrooms.length,
    available: statuses.filter(s => s.status === 'available').length,
    lecture: statuses.filter(s => s.status === 'lecture').length,
    reserved: statuses.filter(s => s.status === 'reserved').length,
    studentUse: statuses.filter(s => s.status === 'student-use').length,
    scheduled: statuses.filter(s => s.status === 'scheduled').length,
  }

  // Building breakdown
  const byBuilding = {}
  for (const s of statuses) {
    if (!byBuilding[s.building]) byBuilding[s.building] = { total: 0, available: 0, occupied: 0 }
    byBuilding[s.building].total++
    if (s.status === 'available') byBuilding[s.building].available++
    else byBuilding[s.building].occupied++
  }

  res.json({ counts, byBuilding })
})

router.get('/buildings', (req, res) => {
  const classrooms = getClassrooms()
  const buildings = [...new Set(classrooms.map(c => c.building))].sort()
  const floors = [...new Set(classrooms.map(c => c.floor))]
    .sort((a, b) => {
      const numA = parseInt(a) || 0
      const numB = parseInt(b) || 0
      return numA - numB
    })
  const departments = [...new Set(classrooms.map(c => c.department))].sort()
  const types = [...new Set(classrooms.map(c => c.type))].sort()

  res.json({ buildings, floors, departments, types })
})

// Efficient teacher schedule — scans all timetables server-side
router.get('/teacher-schedule/:uid', (req, res) => {
  const { uid } = req.params
  const timetable = getTimetable()
  const classrooms = getClassrooms()
  const roomMap = {}
  for (const c of classrooms) roomMap[c.room] = c

  const teacherSchedule = []
  for (const [roomId, schedule] of Object.entries(timetable)) {
    for (const slot of schedule) {
      if (slot.teacherUid === uid || slot.teacher === uid) {
        const room = roomMap[roomId]
        teacherSchedule.push({
          ...slot,
          room: roomId,
          building: room?.building || '',
          floor: room?.floor || '',
        })
      }
    }
  }

  teacherSchedule.sort((a, b) => a.start.localeCompare(b.start))
  res.json(teacherSchedule)
})

router.get('/:roomId', (req, res) => {
  const room = getClassrooms().find(c => c.room === req.params.roomId || c.id === req.params.roomId)
  if (!room) return res.status(404).json({ error: 'Room not found' })

  const statusInfo = computeStatus(room)
  res.json({ ...room, ...statusInfo, lastUpdated: new Date().toISOString() })
})

router.get('/:roomId/schedule', (req, res) => {
  const timetable = getTimetable()
  const schedule = timetable[req.params.roomId] || []
  res.json(schedule)
})

module.exports = router
