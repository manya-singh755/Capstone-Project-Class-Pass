/*  ============================================
    CLASS-PASS — Timetable Generator
    ============================================  */

const { getClassrooms } = require('./university')
const { teachers } = require('./users')

const subjectsByDept = {
  CSE: [
    'Data Structures', 'Algorithms', 'DBMS', 'Operating Systems', 'Computer Networks',
    'Web Development', 'Machine Learning', 'Artificial Intelligence', 'Cloud Computing',
    'Cyber Security', 'Software Engineering', 'Compiler Design', 'Computer Architecture',
    'Distributed Systems', 'Deep Learning', 'NLP', 'Big Data Analytics', 'DevOps',
    'Mobile App Development', 'Blockchain Technology', 'IoT Systems',
  ],
  IT: [
    'Java Programming', 'Python Lab', 'C++ Lab', 'Web Technologies', 'Information Security',
    'Data Mining', 'Cloud Infrastructure', 'IT Project Management', 'ERP Systems',
    'Network Administration', 'System Analysis & Design', 'E-Commerce',
  ],
  ECE: [
    'Digital Electronics', 'Signals & Systems', 'VLSI Design', 'Embedded Systems',
    'Communication Systems', 'Antenna Theory', 'Microprocessors', 'Control Systems',
    'Optical Fiber Communication', 'Wireless Networks', 'DSP', 'Robotics',
  ],
  EEE: [
    'Circuit Analysis', 'Power Systems', 'Electrical Machines', 'Power Electronics',
    'Renewable Energy', 'High Voltage Engineering', 'Switchgear & Protection',
    'Electric Drives', 'Smart Grid Technology',
  ],
  ME: [
    'Thermodynamics', 'Fluid Mechanics', 'Strength of Materials', 'Manufacturing Tech',
    'CAD/CAM', 'Heat Transfer', 'IC Engines', 'Machine Design', 'Robotics & Automation',
    'Industrial Engineering', 'Finite Element Analysis',
  ],
  CE: [
    'Structural Analysis', 'Geotechnical Engineering', 'Surveying', 'Concrete Technology',
    'Transportation Engineering', 'Water Resources', 'Environmental Engineering',
    'Construction Management', 'Earthquake Engineering',
  ],
  MBA: [
    'Financial Management', 'Marketing Management', 'Organizational Behavior',
    'Business Analytics', 'Strategic Management', 'Human Resource Management',
    'Operations Management', 'International Business', 'Entrepreneurship',
  ],
  BBA: [
    'Business Communication', 'Principles of Management', 'Accounting',
    'Business Law', 'Micro Economics', 'Macro Economics',
  ],
  PHY: [
    'Quantum Mechanics', 'Electrodynamics', 'Optics', 'Nuclear Physics',
    'Statistical Mechanics', 'Solid State Physics', 'Applied Physics',
  ],
  CHM: [
    'Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry',
    'Analytical Chemistry', 'Polymer Chemistry', 'Applied Chemistry',
  ],
  MTH: [
    'Linear Algebra', 'Calculus', 'Differential Equations', 'Probability & Statistics',
    'Discrete Mathematics', 'Numerical Methods', 'Applied Mathematics',
  ],
  BIO: [
    'Molecular Biology', 'Genetics', 'Biochemistry', 'Microbiology',
    'Bioinformatics', 'Bioprocess Engineering', 'Immunology',
  ],
  ARC: [
    'Architectural Design', 'Building Construction', 'Urban Planning',
    'History of Architecture', 'Landscape Design',
  ],
  LAW: [
    'Constitutional Law', 'Criminal Law', 'Contract Law', 'Property Law',
    'Environmental Law', 'International Law', 'Corporate Law',
  ],
  General: [],
}

const timeSlots = [
  { start: '08:00', end: '09:00' },
  { start: '09:00', end: '10:00' },
  { start: '10:00', end: '11:00' },
  { start: '11:00', end: '12:00' },
  { start: '12:00', end: '13:00' },
  { start: '13:00', end: '14:00' },
  { start: '14:00', end: '15:00' },
  { start: '15:00', end: '16:00' },
  { start: '16:00', end: '17:00' },
]

function seededRandom(seed) {
  let x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function generateTimetable() {
  const classrooms = getClassrooms()
  const timetable = {}

  const teachersByDept = {}
  for (const t of teachers) {
    if (!teachersByDept[t.department]) teachersByDept[t.department] = []
    teachersByDept[t.department].push(t)
  }

  let seed = 42 // deterministic generation
  for (const room of classrooms) {
    const dept = room.department
    const subjects = subjectsByDept[dept] || subjectsByDept['CSE']
    const deptTeachers = teachersByDept[dept] || teachersByDept['CSE'] || []

    if (subjects.length === 0 || deptTeachers.length === 0) {
      timetable[room.room] = timeSlots.map(s => ({
        start: s.start, end: s.end, subject: 'Free Period', teacher: null
      }))
      continue
    }

    const schedule = []
    let subjectIdx = 0

    for (let i = 0; i < timeSlots.length; i++) {
      seed++
      const r = seededRandom(seed)

      // ~55% chance of having a class, skip lunch hour (12-13)
      if (i === 4 || r > 0.55) {
        schedule.push({
          start: timeSlots[i].start,
          end: timeSlots[i].end,
          subject: 'Free Period',
          teacher: null,
        })
      } else {
        const subject = subjects[subjectIdx % subjects.length]
        subjectIdx++
        const teacher = deptTeachers[Math.floor(seededRandom(seed + 100) * deptTeachers.length)]

        // 15% chance of a 2-hour block
        if (r < 0.15 && i < timeSlots.length - 1) {
          schedule.push({
            start: timeSlots[i].start,
            end: timeSlots[i + 1].end,
            subject,
            teacher: teacher.name,
            teacherUid: teacher.uid,
          })
          // skip next slot
          i++
          continue
        }

        schedule.push({
          start: timeSlots[i].start,
          end: timeSlots[i].end,
          subject,
          teacher: teacher.name,
          teacherUid: teacher.uid,
        })
      }
    }

    timetable[room.room] = schedule
  }

  return timetable
}

let _timetable = null
function getTimetable() {
  if (!_timetable) _timetable = generateTimetable()
  return _timetable
}

module.exports = { getTimetable, subjectsByDept, timeSlots }
