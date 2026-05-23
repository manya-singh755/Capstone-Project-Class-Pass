/*  CLASS-PASS — Auth Routes  */
const { Router } = require('express')
const { teachers, students, admins } = require('../data/users')

const router = Router()

router.post('/login', (req, res) => {
  const { role, uid, password } = req.body

  if (!role || !uid || !password) {
    return res.status(400).json({ success: false, error: 'Missing role, uid, or password' })
  }

  let pool
  if (role === 'student') pool = students
  else if (role === 'teacher') pool = teachers
  else if (role === 'admin') pool = admins
  else return res.status(400).json({ success: false, error: 'Invalid role' })

  const user = pool.find(u => u.uid === uid && u.password === password)
  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' })
  }

  const { password: _, ...safeUser } = user
  res.json({ success: true, user: { ...safeUser, role } })
})

router.get('/teachers', (req, res) => {
  const { department } = req.query
  let result = teachers.map(({ password, ...t }) => t)
  if (department) result = result.filter(t => t.department === department)
  res.json(result)
})

module.exports = router
