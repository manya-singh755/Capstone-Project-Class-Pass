/*  CLASS-PASS — Issue Routes  */
const { Router } = require('express')
const { reportIssue, getIssues, updateIssueStatus } = require('../services/statusEngine')
const socket = require('../services/socketManager')

const router = Router()

router.post('/', (req, res) => {
  const { room, type, description, reportedBy } = req.body

  if (!room || !type || !description) {
    return res.status(400).json({ success: false, error: 'Missing required fields' })
  }

  const issue = reportIssue(room, type, description, reportedBy || 'Unknown')
  socket.issueReported(issue)

  res.json({ success: true, issue })
})

router.get('/', (req, res) => {
  const { status } = req.query
  res.json(getIssues(status))
})

router.patch('/:id', (req, res) => {
  const { status } = req.body
  if (!status) return res.status(400).json({ error: 'Missing status' })

  const issue = updateIssueStatus(req.params.id, status)
  if (!issue) return res.status(404).json({ error: 'Issue not found' })

  res.json({ success: true, issue })
})

module.exports = router
