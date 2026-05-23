/* ============================================
   CLASS-PASS — IoT Sensor Data Layer
   Simulates real-time sensor readings from
   PIR sensors facing board & projector.
   
   ╔══════════════════════════════════════════╗
   ║  BACKEND CONNECTION GUIDE               ║
   ║                                         ║
   ║  When connecting to a real backend:      ║
   ║                                         ║
   ║  1. Replace SensorAPI.getAll() with      ║
   ║     fetch('/api/sensors')                ║
   ║                                         ║
   ║  2. Replace SensorAPI.getClassrooms()    ║
   ║     with fetch('/api/classrooms')        ║
   ║                                         ║
   ║  3. Replace SensorAPI.bookRoom() with    ║
   ║     fetch('/api/bookings', {POST})       ║
   ║                                         ║
   ║  4. Replace SensorAPI.reportIssue() with ║
   ║     fetch('/api/issues', {POST})         ║
   ║                                         ║
   ║  5. For real-time updates, use:          ║
   ║     WebSocket at ws://server/sensors     ║
   ║     or Socket.IO                         ║
   ║                                         ║
   ║  6. ESP8266/ESP32 sends sensor data to:  ║
   ║     POST /api/sensors/update             ║
   ║     { sensorId, boardMotion, projMotion }║
   ╚══════════════════════════════════════════╝
   ============================================ */

// =========================================================
// SENSOR DATA STRUCTURE
// Each classroom has 2 PIR sensors:
//   - boardSensor: faces the whiteboard/smart board
//   - projectorSensor: faces the projector screen
//
// Detection Logic:
//   Board motion detected     → Teaching activity
//   Projector motion detected → Active lecture/presentation
//   Both idle for >10 min     → Classroom marked EMPTY
//   Random motion (no board/proj) → IGNORED (people walking)
// =========================================================

const SENSOR_UPDATE_INTERVAL = 5000; // 5 seconds (simulated)

// ---- Simulated Sensor Hardware Data ----
// This mimics the raw data that ESP8266/ESP32 would send via Wi-Fi
const sensorHardware = [
    { sensorId: 'PIR-34-301-B', room: '34-301', type: 'board', location: 'Facing whiteboard, left wall mount' },
    { sensorId: 'PIR-34-301-P', room: '34-301', type: 'projector', location: 'Facing projector screen, ceiling mount' },
    { sensorId: 'PIR-36-201-B', room: '36-201', type: 'board', location: 'Facing smart board, left wall mount' },
    { sensorId: 'PIR-36-201-P', room: '36-201', type: 'projector', location: 'Facing projector screen, ceiling mount' },
    { sensorId: 'PIR-38-105-B', room: '38-105', type: 'board', location: 'Facing whiteboard, right wall mount' },
    { sensorId: 'PIR-38-105-P', room: '38-105', type: 'projector', location: 'Facing projector screen, ceiling mount' },
    { sensorId: 'PIR-34-102-B', room: '34-102', type: 'board', location: 'Facing smart board, left wall mount' },
    { sensorId: 'PIR-34-102-P', room: '34-102', type: 'projector', location: 'Facing projector, ceiling mount' },
    { sensorId: 'PIR-36-401-B', room: '36-401', type: 'board', location: 'Facing whiteboard, left wall mount' },
    { sensorId: 'PIR-36-401-P', room: '36-401', type: 'projector', location: 'Facing projector screen, ceiling mount' },
    { sensorId: 'PIR-38-303-B', room: '38-303', type: 'board', location: 'Facing stage board, rear wall mount' },
    { sensorId: 'PIR-38-303-P', room: '38-303', type: 'projector', location: 'Facing dual projectors, ceiling mount' },
    { sensorId: 'PIR-34-205-B', room: '34-205', type: 'board', location: 'Facing whiteboard, left wall mount' },
    { sensorId: 'PIR-34-205-P', room: '34-205', type: 'projector', location: 'Facing projector, ceiling mount' },
    { sensorId: 'PIR-36-102-B', room: '36-102', type: 'board', location: 'Facing lab board, front wall mount' },
    { sensorId: 'PIR-36-102-P', room: '36-102', type: 'projector', location: 'Facing projector, ceiling mount' },
    { sensorId: 'PIR-38-201-B', room: '38-201', type: 'board', location: 'Facing whiteboard, left wall mount' },
    { sensorId: 'PIR-38-201-P', room: '38-201', type: 'projector', location: 'Facing projector screen, ceiling mount' },
    { sensorId: 'PIR-UM-301-B', room: 'UM-301', type: 'board', location: 'Facing podium board, side wall mount' },
    { sensorId: 'PIR-UM-301-P', room: 'UM-301', type: 'projector', location: 'Facing projector, ceiling mount' },
    { sensorId: 'PIR-UM-102-B', room: 'UM-102', type: 'board', location: 'Facing whiteboard, wall mount' },
    { sensorId: 'PIR-UM-102-P', room: 'UM-102', type: 'projector', location: 'Facing projector, ceiling mount' },
    { sensorId: 'PIR-34-401-B', room: '34-401', type: 'board', location: 'Facing smart board, left wall mount' },
    { sensorId: 'PIR-34-401-P', room: '34-401', type: 'projector', location: 'Facing projector, ceiling mount' },
];

// ---- Full Classroom Database (simulates LPU data) ----
// TODO: Replace with → fetch('/api/classrooms') when backend is ready
const classroomDB = [
    {
        id: 'CR001', room: '34-301', building: 'Block 34', floor: '3rd Floor',
        capacity: 60, equipment: 'Projector, Smart Board', type: 'Classroom',
        department: 'CSE', wifiSSID: 'LPU-Block34-3F'
    },
    {
        id: 'CR002', room: '36-201', building: 'Block 36', floor: '2nd Floor',
        capacity: 120, equipment: 'Dual Projectors, Mic System', type: 'Lecture Hall',
        department: 'CSE', wifiSSID: 'LPU-Block36-2F'
    },
    {
        id: 'CR003', room: '38-105', building: 'Block 38', floor: '1st Floor',
        capacity: 45, equipment: 'Projector, AC', type: 'Classroom',
        department: 'ECE', wifiSSID: 'LPU-Block38-1F'
    },
    {
        id: 'CR004', room: '34-102', building: 'Block 34', floor: '1st Floor',
        capacity: 80, equipment: 'Smart Board, AC', type: 'Classroom',
        department: 'CSE', wifiSSID: 'LPU-Block34-1F'
    },
    {
        id: 'CR005', room: '36-401', building: 'Block 36', floor: '4th Floor',
        capacity: 50, equipment: 'Smart Board, AC', type: 'Classroom',
        department: 'ME', wifiSSID: 'LPU-Block36-4F'
    },
    {
        id: 'CR006', room: '38-303', building: 'Block 38', floor: '3rd Floor',
        capacity: 200, equipment: 'Stage, Dual Projectors, Mic', type: 'Auditorium',
        department: 'General', wifiSSID: 'LPU-Block38-3F'
    },
    {
        id: 'CR007', room: '34-205', building: 'Block 34', floor: '2nd Floor',
        capacity: 40, equipment: 'Projector, Whiteboard', type: 'Classroom',
        department: 'IT', wifiSSID: 'LPU-Block34-2F'
    },
    {
        id: 'CR008', room: '36-102', building: 'Block 36', floor: '1st Floor',
        capacity: 100, equipment: 'Smart Board, AC, Lab PCs', type: 'Computer Lab',
        department: 'CSE', wifiSSID: 'LPU-Block36-1F'
    },
    {
        id: 'CR009', room: '38-201', building: 'Block 38', floor: '2nd Floor',
        capacity: 55, equipment: 'Projector, AC', type: 'Classroom',
        department: 'EEE', wifiSSID: 'LPU-Block38-2F'
    },
    {
        id: 'CR010', room: 'UM-301', building: 'Uni Mall', floor: '3rd Floor',
        capacity: 150, equipment: 'Projector, AC, Mic System', type: 'Seminar Hall',
        department: 'General', wifiSSID: 'LPU-UniMall-3F'
    },
    {
        id: 'CR011', room: 'UM-102', building: 'Uni Mall', floor: '1st Floor',
        capacity: 35, equipment: 'Whiteboard', type: 'Tutorial Room',
        department: 'General', wifiSSID: 'LPU-UniMall-1F'
    },
    {
        id: 'CR012', room: '34-401', building: 'Block 34', floor: '4th Floor',
        capacity: 70, equipment: 'Projector, AC', type: 'Classroom',
        department: 'CSE', wifiSSID: 'LPU-Block34-4F'
    }
];

// ---- Simulated Timetable (LPU-style periods) ----
// TODO: Replace with → fetch('/api/timetable') when integrated with LPU ERP
const timetable = {
    '34-301': [
        { start: '08:00', end: '09:00', subject: 'Data Structures', teacher: 'Dr. Verma' },
        { start: '09:00', end: '10:00', subject: 'DBMS Lab', teacher: 'Prof. Singh' },
        { start: '11:00', end: '12:00', subject: 'OS Concepts', teacher: 'Dr. Kaur' },
        { start: '14:00', end: '15:00', subject: 'Free Period', teacher: null },
    ],
    '36-201': [
        { start: '08:00', end: '10:00', subject: 'Machine Learning', teacher: 'Dr. Mehta' },
        { start: '10:00', end: '11:00', subject: 'Free Period', teacher: null },
        { start: '11:00', end: '13:00', subject: 'Cloud Computing', teacher: 'Prof. Gupta' },
        { start: '14:00', end: '15:30', subject: 'AI Workshop', teacher: 'Dr. Sharma' },
    ],
    '38-105': [
        { start: '09:00', end: '10:00', subject: 'Digital Electronics', teacher: 'Dr. Patel' },
        { start: '10:00', end: '12:00', subject: 'Free Period', teacher: null },
        { start: '13:00', end: '14:00', subject: 'Signals & Systems', teacher: 'Prof. Rao' },
    ],
    '34-102': [
        { start: '08:00', end: '09:00', subject: 'Free Period', teacher: null },
        { start: '09:00', end: '11:00', subject: 'Web Development', teacher: 'Dr. Sharma' },
        { start: '11:00', end: '12:00', subject: 'Free Period', teacher: null },
        { start: '13:00', end: '15:00', subject: 'Reserved: Faculty Meeting', teacher: 'Dr. Sharma' },
    ],
    '36-401': [
        { start: '08:00', end: '10:00', subject: 'Free Period', teacher: null },
        { start: '10:00', end: '11:00', subject: 'Thermodynamics', teacher: 'Prof. Kumar' },
        { start: '14:00', end: '17:00', subject: 'Free Period', teacher: null },
    ],
    '38-303': [
        { start: '08:00', end: '12:00', subject: 'CSE Symposium', teacher: 'Dr. Dean' },
        { start: '13:00', end: '16:00', subject: 'Guest Lecture Series', teacher: 'External' },
    ],
    '34-205': [
        { start: '09:00', end: '10:00', subject: 'Free Period', teacher: null },
        { start: '10:00', end: '12:00', subject: 'Java Programming', teacher: 'Prof. Nair' },
        { start: '14:00', end: '16:00', subject: 'Free Period', teacher: null },
    ],
    '36-102': [
        { start: '08:00', end: '10:00', subject: 'C++ Lab', teacher: 'Dr. Roy' },
        { start: '10:00', end: '11:00', subject: 'Free Period', teacher: null },
        { start: '11:00', end: '13:00', subject: 'Python Lab', teacher: 'Prof. Das' },
        { start: '14:00', end: '16:00', subject: 'Project Work', teacher: 'Dr. Gill' },
    ],
    '38-201': [
        { start: '08:00', end: '09:00', subject: 'Circuit Analysis', teacher: 'Dr. Bhat' },
        { start: '09:00', end: '12:00', subject: 'Free Period', teacher: null },
        { start: '14:00', end: '15:00', subject: 'Power Systems', teacher: 'Prof. Joshi' },
    ],
    'UM-301': [
        { start: '08:00', end: '12:00', subject: 'Free Period', teacher: null },
        { start: '13:00', end: '15:00', subject: 'Reserved: Prof. Gupta Seminar', teacher: 'Prof. Gupta' },
    ],
    'UM-102': [
        { start: '08:00', end: '17:00', subject: 'Free Period', teacher: null },
    ],
    '34-401': [
        { start: '08:00', end: '09:00', subject: 'Computer Networks', teacher: 'Dr. Agarwal' },
        { start: '09:00', end: '10:00', subject: 'Crypto & Security', teacher: 'Prof. Sinha' },
        { start: '10:00', end: '11:00', subject: 'Free Period', teacher: null },
        { start: '11:00', end: '13:30', subject: 'Software Engineering', teacher: 'Dr. Mishra' },
    ]
};

// ---- Fake User Accounts (for login simulation) ----
// TODO: Replace with → POST /api/auth/login when backend is ready
const userAccounts = {
    students: [
        { uid: '12312345', name: 'Surya Kumar', password: 'surya123', section: 'K22CS', program: 'B.Tech CSE', year: '2026', avatar: 'SK' },
        { uid: '12398765', name: 'Priya Sharma', password: 'priya123', section: 'K22EC', program: 'B.Tech ECE', year: '2026', avatar: 'PS' },
        { uid: '12345678', name: 'Rahul Verma', password: 'rahul123', section: 'K22IT', program: 'B.Tech IT', year: '2026', avatar: 'RV' },
    ],
    teachers: [
        { uid: 'T001', name: 'Dr. Sharma', password: 'teacher123', department: 'CSE', designation: 'Associate Professor', avatar: 'DS' },
        { uid: 'T002', name: 'Prof. Gupta', password: 'teacher123', department: 'CSE', designation: 'Professor', avatar: 'PG' },
        { uid: 'T003', name: 'Dr. Mehta', password: 'teacher123', department: 'CSE', designation: 'Assistant Professor', avatar: 'DM' },
    ],
    admins: [
        { uid: 'A001', name: 'Admin', password: 'admin123', role: 'System Administrator', avatar: 'A' },
    ]
};

// =========================================================
// SENSOR API — The single data layer for the whole app
// TODO: When backend is ready, replace each method's body
//       with a fetch() call to your REST API.
// =========================================================
const SensorAPI = {

    // ----------------------------
    // AUTHENTICATION
    // TODO: Replace with → POST /api/auth/login
    // ----------------------------
    login(role, uid, password) {
        const users = userAccounts[role + 's'] || [];
        const user = users.find(u => u.uid === uid && u.password === password);
        if (user) {
            // Store session (simulated — use JWT tokens with real backend)
            sessionStorage.setItem('classpass_user', JSON.stringify({ ...user, role }));
            return { success: true, user };
        }
        return { success: false, error: 'Invalid credentials' };
    },

    getLoggedInUser() {
        const data = sessionStorage.getItem('classpass_user');
        return data ? JSON.parse(data) : null;
    },

    logout() {
        sessionStorage.removeItem('classpass_user');
    },

    // ----------------------------
    // SENSOR READINGS
    // TODO: Replace with → GET /api/sensors
    //       or WebSocket stream ws://server/sensors
    // ----------------------------
    getSensorReadings() {
        return sensorHardware.map(sensor => {
            const room = classroomDB.find(c => c.room === sensor.room);
            const isTeaching = this._isCurrentlyTeaching(sensor.room);

            // Simulate PIR motion readings
            let motionDetected, intensity;
            if (sensor.type === 'board') {
                motionDetected = isTeaching ? Math.random() > 0.15 : Math.random() > 0.85;
                intensity = motionDetected ? Math.floor(40 + Math.random() * 60) : Math.floor(Math.random() * 15);
            } else {
                motionDetected = isTeaching ? Math.random() > 0.3 : Math.random() > 0.9;
                intensity = motionDetected ? Math.floor(30 + Math.random() * 50) : Math.floor(Math.random() * 10);
            }

            return {
                sensorId: sensor.sensorId,
                room: sensor.room,
                type: sensor.type,
                location: sensor.location,
                motionDetected,
                intensity, // 0-100 scale
                timestamp: new Date().toISOString(),
                wifiSignal: -40 - Math.floor(Math.random() * 30), // dBm
                batteryLevel: 70 + Math.floor(Math.random() * 30), // simulated
            };
        });
    },

    // ----------------------------
    // CLASSROOM STATUS (combines sensor + timetable)
    // TODO: Replace with → GET /api/classrooms
    // ----------------------------
    getClassrooms() {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        return classroomDB.map(room => {
            const schedule = timetable[room.room] || [];
            const currentSlot = schedule.find(s => currentTime >= s.start && currentTime < s.end);
            const nextSlot = schedule.find(s => s.start > currentTime && s.teacher);

            // Determine status from timetable + sensor fusion
            let status, freeInfo, currentActivity, teacher;
            if (currentSlot && currentSlot.teacher) {
                if (currentSlot.subject.startsWith('Reserved')) {
                    status = 'reserved';
                    freeInfo = `Until ${this._formatTime(currentSlot.end)}`;
                    currentActivity = currentSlot.subject;
                    teacher = currentSlot.teacher;
                } else {
                    status = 'occupied';
                    freeInfo = `Free at ${this._formatTime(currentSlot.end)}`;
                    currentActivity = currentSlot.subject;
                    teacher = currentSlot.teacher;
                }
            } else {
                status = 'available';
                if (nextSlot) {
                    freeInfo = `Free until ${this._formatTime(nextSlot.start)}`;
                } else {
                    freeInfo = 'Free rest of day';
                }
                currentActivity = 'No scheduled class';
                teacher = null;
            }

            // Sensor readings for this room
            const boardSensor = this._getLatestReading(room.room, 'board');
            const projSensor = this._getLatestReading(room.room, 'projector');

            return {
                ...room,
                status,
                freeInfo,
                currentActivity,
                teacher,
                sensors: {
                    board: boardSensor,
                    projector: projSensor
                },
                lastUpdated: new Date().toISOString()
            };
        });
    },

    // ----------------------------
    // BOOK A ROOM
    // TODO: Replace with → POST /api/bookings
    //       Body: { roomId, userId, subject, duration }
    // ----------------------------
    bookRoom(roomId, userId, subject, duration) {
        console.log(`[API] POST /api/bookings → Room: ${roomId}, User: ${userId}, Subject: ${subject}, Duration: ${duration}`);
        // Simulated response
        return {
            success: true,
            booking: {
                bookingId: 'BK' + Date.now(),
                roomId,
                userId,
                subject,
                duration,
                timestamp: new Date().toISOString()
            }
        };
    },

    // ----------------------------
    // REPORT AN ISSUE
    // TODO: Replace with → POST /api/issues
    //       Body: { roomId, issueType, description, reportedBy }
    // ----------------------------
    reportIssue(roomId, issueType, description, reportedBy) {
        console.log(`[API] POST /api/issues → Room: ${roomId}, Type: ${issueType}, By: ${reportedBy}`);
        return {
            success: true,
            issue: {
                issueId: 'ISS' + Date.now(),
                roomId,
                issueType,
                description,
                reportedBy,
                status: 'open',
                timestamp: new Date().toISOString()
            }
        };
    },

    // ---- Private Helpers ----
    _isCurrentlyTeaching(roomNumber) {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const schedule = timetable[roomNumber] || [];
        const slot = schedule.find(s => currentTime >= s.start && currentTime < s.end);
        return slot && slot.teacher !== null;
    },

    _getLatestReading(roomNumber, sensorType) {
        const isTeaching = this._isCurrentlyTeaching(roomNumber);
        const motionDetected = sensorType === 'board'
            ? (isTeaching ? Math.random() > 0.15 : Math.random() > 0.85)
            : (isTeaching ? Math.random() > 0.3 : Math.random() > 0.9);

        return {
            motionDetected,
            intensity: motionDetected ? Math.floor(30 + Math.random() * 70) : Math.floor(Math.random() * 15),
            lastTriggered: motionDetected ? 'Just now' : `${Math.floor(5 + Math.random() * 55)} min ago`
        };
    },

    _formatTime(timeStr) {
        const [h, m] = timeStr.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
    }
};
