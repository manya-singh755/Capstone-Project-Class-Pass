/*  ============================================
    CLASS-PASS — Socket.IO Manager
    Handles real-time broadcast to all clients
    ============================================  */

let io = null

function init(socketIO) {
  io = socketIO

  io.on('connection', (socket) => {
    console.log(`[WS] Client connected: ${socket.id}`)

    socket.on('disconnect', () => {
      console.log(`[WS] Client disconnected: ${socket.id}`)
    })
  })
}

function broadcast(event, data) {
  if (io) {
    io.emit(event, { ...data, timestamp: new Date().toISOString() })
  }
}

// Convenience emitters
function classroomUpdated(room, status) {
  broadcast('classroom:update', { room, ...status })
}

function bookingCreated(booking) {
  broadcast('booking:created', booking)
}

function bookingCancelled(bookingId, room) {
  broadcast('booking:cancelled', { bookingId, room })
}

function attendancePunched(record) {
  broadcast('attendance:punched', record)
}

function attendanceUnpunched(id, room) {
  broadcast('attendance:unpunched', { id, room })
}

function cameraUpdate(room, data) {
  broadcast('camera:update', { room, ...data })
}

function issueReported(issue) {
  broadcast('issue:reported', issue)
}

module.exports = {
  init,
  broadcast,
  classroomUpdated,
  bookingCreated,
  bookingCancelled,
  attendancePunched,
  attendanceUnpunched,
  cameraUpdate,
  issueReported,
}
