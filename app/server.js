import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 3001
const THREADS_DIR = path.join(__dirname, '..', 'threads')

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// ─── Helpers ────────────────────────────────────────────────────────────────

function readFile(fileId) {
  const filePath = path.join(THREADS_DIR, `${fileId}.json`)
  if (!fs.existsSync(filePath)) return null
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeFile(fileId, data) {
  const filePath = path.join(THREADS_DIR, `${fileId}.json`)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

function loadAllCategories() {
  return fs
    .readdirSync(THREADS_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((file) => {
      const fileId = file.replace('.json', '')
      const data = readFile(fileId)
      return { fileId, ...data }
    })
}

// ─── Routes ─────────────────────────────────────────────────────────────────

// GET all thread categories
app.get('/api/threads', (_req, res) => {
  try {
    res.json(loadAllCategories())
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST add a reply to a thread
app.post('/api/threads/:fileId/:threadId/posts', (req, res) => {
  const { fileId, threadId } = req.params
  const { type, message } = req.body

  if (!message?.trim()) {
    return res.status(400).json({ error: 'Message is required' })
  }

  const data = readFile(fileId)
  if (!data) return res.status(404).json({ error: 'Category not found' })

  const thread = data.threads.find((t) => t.id === threadId)
  if (!thread) return res.status(404).json({ error: 'Thread not found' })

  const newPost = {
    id: `${threadId}-P${thread.posts.length + 1}`,
    author: 'user',
    type: type || 'comment',
    message: message.trim(),
    timestamp: new Date().toISOString(),
  }

  thread.posts.push(newPost)
  writeFile(fileId, data)
  res.json({ success: true, post: newPost })
})

// PUT update thread status
app.put('/api/threads/:fileId/:threadId/status', (req, res) => {
  const { fileId, threadId } = req.params
  const { status } = req.body

  const valid = ['resolved', 'needs_discussion', 'needs_research', 'deferred', 'open']
  if (!valid.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${valid.join(', ')}` })
  }

  const data = readFile(fileId)
  if (!data) return res.status(404).json({ error: 'Category not found' })

  const thread = data.threads.find((t) => t.id === threadId)
  if (!thread) return res.status(404).json({ error: 'Thread not found' })

  thread.status = status
  writeFile(fileId, data)
  res.json({ success: true })
})

// POST prepare a thread for manual AI review
// Returns a formatted prompt the user can copy into any AI tool.
// Does NOT call any AI API — that is handled externally by the user.
app.post('/api/threads/:fileId/:threadId/review', (req, res) => {
  const { fileId, threadId } = req.params

  const data = readFile(fileId)
  if (!data) return res.status(404).json({ error: 'Category not found' })

  const thread = data.threads.find((t) => t.id === threadId)
  if (!thread) return res.status(404).json({ error: 'Thread not found' })

  const divider = '─'.repeat(60)

  const discussion = thread.posts
    .map((p) => {
      const who = p.author === 'ai' ? 'AI' : 'USER'
      return `[${who} — ${p.type.toUpperCase()}]\n${p.message}`
    })
    .join(`\n\n${divider}\n\n`)

  const prompt = [
    'You are reviewing a discussion thread for a Singapore-based expense tracker app',
    'with a grocery price comparison feature (crowdsourced from user receipts).',
    '',
    `THREAD ID : ${thread.id}`,
    `QUESTION  : ${thread.question}`,
    thread.context ? `CONTEXT   : ${thread.context}` : null,
    `STATUS    : ${thread.status}`,
    `TAGS      : ${thread.tags.join(', ')}`,
    '',
    divider,
    'DISCUSSION',
    divider,
    '',
    discussion,
    '',
    divider,
    'REVIEW REQUEST',
    divider,
    '',
    'Please provide a focused review that:',
    '1. Summarises where this discussion currently stands',
    '2. Identifies any gaps, unresolved risks, or concerns',
    '3. Asks 1–2 specific follow-up questions if more clarity is needed',
    '4. Recommends a next action or decision if the thread is ready to close',
    '',
    'Be concise and actionable.',
  ]
    .filter((line) => line !== null)
    .join('\n')

  res.json({ prompt })
})

// ─── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Thread server → http://localhost:${PORT}`)
})
