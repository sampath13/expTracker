import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 3001
const THREADS_DIR = path.join(__dirname, '..', '..', 'docs', 'decisions')

const GO_API_KEY = process.env.OPENCODE_GO_API_KEY
const GO_MODEL = process.env.OPENCODE_GO_MODEL || 'deepseek-v4-flash'
const GO_ENDPOINT = 'https://opencode.ai/zen/go/v1/chat/completions'

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

// POST ask AI for a reply — sends full thread to OpenCode Go, posts AI response
app.post('/api/threads/:fileId/:threadId/ai-reply', async (req, res) => {
  if (!GO_API_KEY) {
    return res.status(503).json({ error: 'OPENCODE_GO_API_KEY not configured. Copy .env.example to .env and set your key.' })
  }

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

  const systemPrompt = [
    'You are a thoughtful collaborator on a Singapore-based expense tracker app',
    'with a grocery price comparison feature (crowdsourced from user receipts).',
    'You are participating in a threaded discussion. Reply naturally as if you are',
    'another team member — be concise, insightful, and directly address the latest posts.',
    '',
    'If the user asks a question, answer it. If they propose an idea, evaluate it.',
    'If they raise a concern, address it. Avoid repeating the thread history.',
    'Keep responses under 3 paragraphs unless the topic demands more depth.',
  ].join('\n')

  const userContent = [
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
    'Please reply to this thread.',
  ]
    .filter((line) => line !== null)
    .join('\n')

  try {
    console.log('\n' + '='.repeat(60))
    console.log(`AI REQUEST — ${threadId} (${fileId}) → ${GO_MODEL}`)
    console.log('='.repeat(60))
    console.log('[SYSTEM]')
    console.log(systemPrompt)
    console.log('-'.repeat(40))
    console.log('[USER CONTENT]')
    console.log(userContent)
    console.log('='.repeat(60))

    const goRes = await fetch(GO_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GO_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
      }),
    })

    if (!goRes.ok) {
      const errBody = await goRes.text()
      throw new Error(`OpenCode Go ${goRes.status}: ${errBody}`)
    }

    const json = await goRes.json()
    const aiMessage = json.choices?.[0]?.message?.content

    if (!aiMessage) {
      throw new Error('OpenCode Go returned empty response')
    }

    console.log('[AI RESPONSE]')
    console.log(aiMessage)
    console.log('='.repeat(60) + '\n')

    const newPost = {
      id: `${threadId}-P${thread.posts.length + 1}`,
      author: 'ai',
      type: 'answer',
      message: aiMessage,
      timestamp: new Date().toISOString(),
    }

    thread.posts.push(newPost)
    writeFile(fileId, data)
    res.json({ success: true, post: newPost })
  } catch (err) {
    console.error('AI API error:', err)
    res.status(502).json({ error: err.message || 'AI request failed' })
  }
})

// ─── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Thread server → http://localhost:${PORT}`)
})
