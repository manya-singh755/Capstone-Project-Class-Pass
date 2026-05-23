/*  ============================================
    CLASS-PASS — Backend Server
    Express + Socket.IO
    ============================================  */

const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const path = require('path')

const socketManager = require('./services/socketManager')
const { startCleanupDaemon } = require('./services/statusEngine')

// Routes
const authRoutes = require('./routes/auth')
const classroomRoutes = require('./routes/classrooms')
const attendanceRoutes = require('./routes/attendance')
const bookingRoutes = require('./routes/bookings')
const cameraRoutes = require('./routes/camera')
const issueRoutes = require('./routes/issues')

const app = express()
const server = http.createServer(app)

// Socket.IO
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'DELETE', 'PATCH'] },
})
socketManager.init(io)

// Middleware
app.use(cors())
app.use(express.json())

// Request logging
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[API] ${req.method} ${req.path}`)
  }
  next()
})

// Mount routes
app.use('/api/auth', authRoutes)
app.use('/api/classrooms', classroomRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/camera', cameraRoutes)
app.use('/api/issues', issueRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  })
})

// Serve static Vite build in production
const distPath = path.join(__dirname, '..', 'dist')
app.use(express.static(distPath))
app.get(/^\/.*/, (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'))
  }
})

// Start
const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log('')
  console.log('  ╔═══════════════════════════════════════╗')
  console.log('  ║        CLASS-PASS Backend Server       ║')
  console.log('  ╠═══════════════════════════════════════╣')
  console.log(`  ║  HTTP:   http://localhost:${PORT}         ║`)
  console.log(`  ║  WS:     ws://localhost:${PORT}           ║`)
  console.log('  ║  Status: Running ✓                    ║')
  console.log('  ╚═══════════════════════════════════════╝')
  console.log('')

  // Preload data
  const { getClassrooms } = require('./data/university')
  const { getTimetable } = require('./data/timetable')
  const classrooms = getClassrooms()
  const timetable = getTimetable()
  console.log(`  → ${classrooms.length} classrooms loaded`)
  console.log(`  → ${Object.keys(timetable).length} timetable entries generated`)
  console.log('')
})

// Start background cleanup
startCleanupDaemon()
