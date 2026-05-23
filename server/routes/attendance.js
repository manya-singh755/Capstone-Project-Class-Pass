/*  CLASS-PASS — Attendance Routes  */
const { Router } = require('express')
const { punchAttendance, unpunchAttendance, getAttendanceToday } = require('../services/statusEngine')
const { getClassrooms } = require('../data/university')
const { computeStatus } = require('../services/statusEngine')
const socket = require('../services/socketManager')

const router = Router()

router.post('/punch', (req, res) => {
  const { teacherUid, teacherName, room, subject } = req.body

  if (!teacherUid || !room || !subject) {
    return res.status(400).json({ success: false, error: 'Missing required fields' })
  }

  const record = punchAttendance(teacherUid, teacherName || 'Unknown', room, subject)

  // Broadcast real-time update
  socket.attendancePunched(record)
  const roomObj = getClassrooms().find(c => c.room === room)
  if (roomObj) socket.classroomUpdated(room, computeStatus(roomObj))

  res.json({ success: true, record })
})

router.delete('/:id', (req, res) => {
  const record = getAttendanceToday().find(a => a.id === req.params.id)
  const room = record?.room

  const success = unpunchAttendance(req.params.id)
  if (!success) return res.status(404).json({ success: false, error: 'Record not found' })

  socket.attendanceUnpunched(req.params.id, room)
  if (room) {
    const roomObj = getClassrooms().find(c => c.room === room)
    if (roomObj) socket.classroomUpdated(room, computeStatus(roomObj))
  }

  res.json({ success: true })
})

router.get('/today', (req, res) => {
  const { teacherUid } = req.query
  let records = getAttendanceToday()
  if (teacherUid) records = records.filter(r => r.teacherUid === teacherUid)
  res.json(records)
})

module.exports = router
