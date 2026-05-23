/*  ============================================
    CLASS-PASS — University Database
    Lovely Professional University, Phagwara
    ============================================  */

const departments = [
  { code: 'CSE', name: 'Computer Science & Engineering', school: 'School of Computer Science' },
  { code: 'IT', name: 'Information Technology', school: 'School of Computer Science' },
  { code: 'ECE', name: 'Electronics & Communication', school: 'School of Electronics' },
  { code: 'EEE', name: 'Electrical Engineering', school: 'School of Electronics' },
  { code: 'ME', name: 'Mechanical Engineering', school: 'School of Mechanical Engineering' },
  { code: 'CE', name: 'Civil Engineering', school: 'School of Civil Engineering' },
  { code: 'MBA', name: 'Management Studies', school: 'Mittal School of Business' },
  { code: 'BBA', name: 'Business Administration', school: 'Mittal School of Business' },
  { code: 'PHY', name: 'Physics', school: 'School of Sciences' },
  { code: 'CHM', name: 'Chemistry', school: 'School of Sciences' },
  { code: 'MTH', name: 'Mathematics', school: 'School of Sciences' },
  { code: 'BIO', name: 'Biotechnology', school: 'School of Bioengineering' },
  { code: 'ARC', name: 'Architecture', school: 'School of Architecture' },
  { code: 'LAW', name: 'Law', school: 'School of Law' },
]

// Block configuration: Blocks 27-38 with max 5 floors
const blockConfig = {
  27: { floors: 5, wing: 'Science Wing', depts: ['PHY', 'CHM', 'MTH', 'BIO'] },
  28: { floors: 5, wing: 'Science Wing', depts: ['PHY', 'CHM', 'BIO', 'MTH'] },
  29: { floors: 5, wing: 'Arts & Law Wing', depts: ['LAW', 'ARC', 'MBA'] },
  30: { floors: 5, wing: 'Management Wing', depts: ['MBA', 'BBA'] },
  31: { floors: 5, wing: 'Civil & Mech Wing', depts: ['CE', 'ME'] },
  32: { floors: 5, wing: 'Electrical Wing', depts: ['EEE', 'ECE'] },
  33: { floors: 5, wing: 'IT Wing', depts: ['IT', 'CSE'] },
  34: { floors: 5, wing: 'CSE Wing – A', depts: ['CSE', 'IT'] },
  35: { floors: 5, wing: 'CSE Wing – B', depts: ['CSE', 'IT'] },
  36: { floors: 5, wing: 'ECE Wing', depts: ['ECE', 'EEE'] },
  37: { floors: 5, wing: 'Multi-Discipline Wing', depts: ['CSE', 'ECE', 'ME', 'CE'] },
  38: { floors: 5, wing: 'Conference & Events Wing', depts: ['CSE', 'ECE', 'MBA'] },
}

// Room types with capacity ranges and equipment
const roomTemplates = [
  { type: 'Classroom', capacityRange: [40, 60], equipment: ['Projector', 'Whiteboard', 'AC'], weight: 5 },
  { type: 'Classroom', capacityRange: [60, 80], equipment: ['Smart Board', 'Projector', 'AC'], weight: 3 },
  { type: 'Lecture Hall', capacityRange: [100, 150], equipment: ['Dual Projectors', 'Mic System', 'AC'], weight: 2 },
  { type: 'Lecture Hall', capacityRange: [150, 250], equipment: ['Stage', 'Dual Projectors', 'Mic System', 'AC'], weight: 1 },
  { type: 'Computer Lab', capacityRange: [30, 50], equipment: ['Lab PCs', 'Smart Board', 'Projector', 'AC'], weight: 2 },
  { type: 'Seminar Hall', capacityRange: [80, 120], equipment: ['Projector', 'Mic System', 'AC'], weight: 1 },
  { type: 'Tutorial Room', capacityRange: [20, 35], equipment: ['Whiteboard', 'AC'], weight: 2 },
  { type: 'Workshop', capacityRange: [30, 40], equipment: ['Workbenches', 'Projector'], weight: 1 },
]

function pickWeighted(templates) {
  const total = templates.reduce((s, t) => s + t.weight, 0)
  let r = Math.random() * total
  for (const t of templates) {
    r -= t.weight
    if (r <= 0) return t
  }
  return templates[0]
}

function randBetween(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

// Generate classrooms
function generateClassrooms() {
  const classrooms = []
  let idCounter = 1

  for (const [blockNum, config] of Object.entries(blockConfig)) {
    const block = parseInt(blockNum)

    for (let floor = 1; floor <= config.floors; floor++) {
      // Each floor gets 4-7 rooms
      const roomCount = block >= 30 ? randBetween(4, 7) : randBetween(3, 5)

      for (let room = 1; room <= roomCount; room++) {
        const template = pickWeighted(roomTemplates)
        const roomNumber = `${block}-${floor}${room.toString().padStart(2, '0')}` // e.g. 34-401 for Block 34, Floor 4, Room 1
        const capacity = randBetween(template.capacityRange[0], template.capacityRange[1])
        const dept = config.depts[Math.floor(Math.random() * config.depts.length)]

        classrooms.push({
          id: `CR${idCounter.toString().padStart(4, '0')}`,
          room: roomNumber,
          building: `Block ${block}`,
          floor: `${floor}${floor === 1 ? 'st' : floor === 2 ? 'nd' : floor === 3 ? 'rd' : 'th'} Floor`,
          floorNum: floor,
          capacity,
          equipment: template.equipment.join(', '),
          equipmentList: [...template.equipment],
          type: template.type,
          department: dept,
          wing: config.wing,
          hasAC: template.equipment.includes('AC'),
          hasProjector: template.equipment.includes('Projector') || template.equipment.includes('Dual Projectors'),
          hasSmartBoard: template.equipment.includes('Smart Board'),
        })
        idCounter++
      }
    }
  }

  // Add special rooms (Uni Mall, Shanti Devi Mittal Auditorium, etc.)
  const specialRooms = [
    { id: 'CR9001', room: 'UM-101', building: 'Uni Mall', floor: '1st Floor', floorNum: 1, capacity: 40, equipment: 'Projector, AC', equipmentList: ['Projector', 'AC'], type: 'Tutorial Room', department: 'CSE', wing: 'Uni Mall', hasAC: true, hasProjector: true, hasSmartBoard: false },
    { id: 'CR9002', room: 'UM-102', building: 'Uni Mall', floor: '1st Floor', floorNum: 1, capacity: 35, equipment: 'Whiteboard', equipmentList: ['Whiteboard'], type: 'Tutorial Room', department: 'General', wing: 'Uni Mall', hasAC: false, hasProjector: false, hasSmartBoard: false },
    { id: 'CR9003', room: 'UM-201', building: 'Uni Mall', floor: '2nd Floor', floorNum: 2, capacity: 60, equipment: 'Projector, Smart Board, AC', equipmentList: ['Projector', 'Smart Board', 'AC'], type: 'Classroom', department: 'IT', wing: 'Uni Mall', hasAC: true, hasProjector: true, hasSmartBoard: true },
    { id: 'CR9004', room: 'UM-301', building: 'Uni Mall', floor: '3rd Floor', floorNum: 3, capacity: 150, equipment: 'Projector, AC, Mic System', equipmentList: ['Projector', 'AC', 'Mic System'], type: 'Seminar Hall', department: 'General', wing: 'Uni Mall', hasAC: true, hasProjector: true, hasSmartBoard: false },
    { id: 'CR9005', room: 'SDM-AUD', building: 'Shanti Devi Mittal Auditorium', floor: 'Ground Floor', floorNum: 0, capacity: 500, equipment: 'Stage, Dual Projectors, Dolby Sound, Mic System, AC', equipmentList: ['Stage', 'Dual Projectors', 'Dolby Sound', 'Mic System', 'AC'], type: 'Auditorium', department: 'General', wing: 'Central Campus', hasAC: true, hasProjector: true, hasSmartBoard: false },
    { id: 'CR9006', room: 'LH-01', building: 'Lovely Auditorium', floor: 'Ground Floor', floorNum: 0, capacity: 800, equipment: 'Stage, LED Wall, Dolby Sound, Mic System, AC', equipmentList: ['Stage', 'LED Wall', 'Dolby Sound', 'Mic System', 'AC'], type: 'Auditorium', department: 'General', wing: 'Central Campus', hasAC: true, hasProjector: true, hasSmartBoard: false },
  ]

  classrooms.push(...specialRooms)
  return classrooms
}

// Seed so data is consistent across restarts
// We generate once and cache
let _classrooms = null
function getClassrooms() {
  if (!_classrooms) _classrooms = generateClassrooms()
  return _classrooms
}

module.exports = { departments, blockConfig, getClassrooms, roomTemplates }
