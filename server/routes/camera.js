/*  CLASS-PASS — Camera Routes  */
const { Router } = require('express')
const { updateCamera, getCameraStatus } = require('../services/statusEngine')
const { getClassrooms } = require('../data/university')
const { computeStatus } = require('../services/statusEngine')
const socket = require('../services/socketManager')

const router = Router()

// Camera connection status tracking
const cameraConnections = {}  // { [room]: { status, source, lastSeen } }

// Python detector POSTs here every 5 seconds
router.post('/update', (req, res) => {
  const { room, peopleDetected, count } = req.body

  if (!room) {
    return res.status(400).json({ success: false, error: 'Missing room' })
  }

  updateCamera(room, !!peopleDetected, parseInt(count) || 0)

  // Update connection tracker
  cameraConnections[room] = {
    ...cameraConnections[room],
    status: 'active',
    lastSeen: new Date().toISOString(),
    lastDetection: { peopleDetected: !!peopleDetected, count: parseInt(count) || 0 },
  }

  socket.cameraUpdate(room, { peopleDetected: !!peopleDetected, count: parseInt(count) || 0 })
  const roomObj = getClassrooms().find(c => c.room === room)
  if (roomObj) socket.classroomUpdated(room, computeStatus(roomObj))

  res.json({ success: true })
})

// Camera connection status update (from detector.py)
router.post('/status-update', (req, res) => {
  const { room, status, source } = req.body

  if (!room) {
    return res.status(400).json({ success: false, error: 'Missing room' })
  }

  cameraConnections[room] = {
    status: status || 'unknown',
    source: source || 'unknown',
    lastSeen: new Date().toISOString(),
    ...(cameraConnections[room]?.lastDetection ? { lastDetection: cameraConnections[room].lastDetection } : {}),
  }

  console.log(`[Camera] Room ${room}: ${status} (source: ${source})`)

  // Broadcast camera status change
  socket.broadcast('camera:status', { room, status, source })

  res.json({ success: true })
})

router.get('/status', (req, res) => {
  const detectionStatus = getCameraStatus()
  
  // Merge detection data with connection data
  const merged = {}
  
  // Add detection data
  for (const [room, data] of Object.entries(detectionStatus)) {
    merged[room] = { ...data }
  }
  
  // Add/merge connection data
  for (const [room, conn] of Object.entries(cameraConnections)) {
    if (!merged[room]) merged[room] = {}
    merged[room].connectionStatus = conn.status
    merged[room].source = conn.source
    merged[room].lastSeen = conn.lastSeen
    
    // Check if camera is stale (no updates for 60 seconds)
    const lastSeen = new Date(conn.lastSeen).getTime()
    const age = (Date.now() - lastSeen) / 1000
    if (age > 60 && conn.status === 'active') {
      merged[room].connectionStatus = 'stale'
    }
  }
  
  res.json(merged)
})

module.exports = router
