/*  CLASS-PASS — Booking Routes  */
const { Router } = require('express')
const { createBooking, cancelBooking, getActiveBookings, getAllBookings } = require('../services/statusEngine')
const { getClassrooms } = require('../data/university')
const { computeStatus } = require('../services/statusEngine')
const socket = require('../services/socketManager')

const router = Router()

router.post('/', (req, res) => {
  const { room, userId, userName, subject, duration } = req.body

  if (!room || !userId) {
    return res.status(400).json({ success: false, error: 'Missing room or userId' })
  }

  const hours = parseFloat(duration) || 1
  const booking = createBooking(room, userId, userName || 'Unknown', subject, hours)

  socket.bookingCreated(booking)
  const roomObj = getClassrooms().find(c => c.room === room)
  if (roomObj) socket.classroomUpdated(room, computeStatus(roomObj))

  res.json({ success: true, booking })
})

router.get('/', (req, res) => {
  const { userId, all } = req.query
  if (all === 'true') return res.json(getAllBookings())
  res.json(getActiveBookings(userId || null))
})

router.delete('/:id', (req, res) => {
  const allBookings = getAllBookings()
  const booking = allBookings.find(b => b.id === req.params.id)
  const room = booking?.room

  const success = cancelBooking(req.params.id)
  if (!success) return res.status(404).json({ success: false, error: 'Booking not found' })

  socket.bookingCancelled(req.params.id, room)
  if (room) {
    const roomObj = getClassrooms().find(c => c.room === room)
    if (roomObj) socket.classroomUpdated(room, computeStatus(roomObj))
  }

  res.json({ success: true })
})

module.exports = router
