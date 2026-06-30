import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

// ─── Config ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  resolved:         { badge: 'bg-green-100 text-green-800 border-green-200',  label: 'Resolved' },
  needs_discussion: { badge: 'bg-amber-100 text-amber-800 border-amber-200',  label: 'Needs Discussion' },
  needs_research:   { badge: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Needs Research' },
  deferred:         { badge: 'bg-gray-100 text-gray-600 border-gray-200',     label: 'Deferred' },
  open:             { badge: 'bg-blue-100 text-blue-800 border-blue-200',     label: 'Open' },
}

const TYPE_CONFIG = {
  answer:     { icon: '✓', label: 'Answer',     color: 'text-green-600 bg-green-50' },
  comment:    { icon: '◈', label: 'Comment',    color: 'text-blue-600 bg-blue-50' },
  concern:    { icon: '⚠', label: 'Concern',    color: 'text-amber-600 bg-amber-50' },
  suggestion: { icon: '◆', label: 'Suggestion', color: 'text-purple-600 bg-purple-50' },
  research:   { icon: '⬡', label: 'Research',   color: 'text-indigo-600 bg-indigo-50' },
}

const POST_TYPES = ['answer', 'comment', 'concern', 'suggestion']

const STATUSES = Object.entries(STATUS_CONFIG).map(([key, val]) => ({ key, label: val.label }))

// ─── PostItem ─────────────────────────────────────────────────────────────────

function PostItem({ post, onRetryAi, retryDisabled }) {
  const typeCfg = TYPE_CONFIG[post.type] ?? TYPE_CONFIG.comment
  const isUser = post.author !== 'ai'

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
          {post.author === 'ai' ? '🤖' : '👤'} {post.author ?? 'user'}
        </span>

        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeCfg.color}`}>
          {typeCfg.icon} {typeCfg.label}
        </span>

        {post.timestamp && (
          <span className="text-xs text-gray-400 ml-auto">
            {new Date(post.timestamp).toLocaleString('en-SG', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}

        {isUser && onRetryAi && (
          <button
            onClick={onRetryAi}
            disabled={retryDisabled}
            title="Re-send to AI"
            className="text-xs text-gray-400 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors leading-none px-1"
          >
            ↻
          </button>
        )}
      </div>

      {/* Body */}
      <div className="prose-post text-gray-700 text-sm leading-relaxed">
        <ReactMarkdown
          components={{
            a: ({ node, ...props }) => (
              <a className="text-blue-600 underline" target="_blank" rel="noreferrer" {...props} />
            ),
          }}
        >
          {post.message}
        </ReactMarkdown>
      </div>
    </div>
  )
}

// ─── ReplyForm ────────────────────────────────────────────────────────────────

function ReplyForm({ onReply, disabled }) {
  const [message, setMessage] = useState('')
  const [type, setType] = useState('answer')
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef(null)
  const formRef = useRef(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim() || disabled) return
    setSubmitting(true)
    await onReply(type, message)
    setMessage('')
    setSubmitting(false)
  }

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [message])

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="border border-gray-200 rounded-lg bg-white overflow-hidden"
    >
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={disabled ? 'AI is responding…' : 'Write a reply… (supports Markdown)'}
        rows={3}
        disabled={disabled || submitting}
        className="w-full px-4 pt-3 pb-2 text-sm text-gray-800 resize-none outline-none placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            formRef.current?.requestSubmit()
          }
        }}
      />

      <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 outline-none focus:ring-1 focus:ring-blue-300"
          >
            {POST_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_CONFIG[t].icon} {TYPE_CONFIG[t].label}
              </option>
            ))}
          </select>
          <span className="text-xs text-gray-300">↵ to submit, Shift+↵ new line</span>
        </div>

        <button
          type="submit"
          disabled={!message.trim() || submitting || disabled}
          className="text-xs px-4 py-1.5 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Posting…' : disabled ? 'AI thinking…' : 'Reply'}
        </button>
      </div>
    </form>
  )
}

// ─── ThreadDetail ─────────────────────────────────────────────────────────────

export default function ThreadDetail({ thread, fileId, onReply, onTriggerAi, aiStateValue, onDismissAiError, onStatusChange }) {
  const postsEndRef = useRef(null)
  const [showStatusMenu, setShowStatusMenu] = useState(false)

  const statusCfg = STATUS_CONFIG[thread.status] ?? STATUS_CONFIG.open
  const isAiThinking = aiStateValue === 'loading'
  const aiError = typeof aiStateValue === 'string' ? aiStateValue : null

  useEffect(() => {
    postsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread.posts?.length, isAiThinking])

  const handleUserReply = async (type, message) => {
    await onReply(type, message)
    onTriggerAi(fileId, thread.id)
  }

  const handleRetryAi = () => {
    onTriggerAi(fileId, thread.id)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Thread header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <span className="text-xs font-mono text-gray-400">{thread.id}</span>
            <h2 className="text-base font-semibold text-gray-900 mt-0.5 leading-snug">
              {thread.question}
            </h2>
            {thread.context && (
              <p className="text-xs text-gray-500 mt-1 italic">{thread.context}</p>
            )}
            {thread.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {thread.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Status badge — click to change */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowStatusMenu((v) => !v)}
              className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusCfg.badge} hover:opacity-80 transition-opacity`}
            >
              {statusCfg.label} ▾
            </button>

            {showStatusMenu && (
              <div className="absolute right-0 top-8 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]">
                {STATUSES.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => {
                      onStatusChange(key)
                      setShowStatusMenu(false)
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 ${
                      thread.status === key ? 'font-semibold text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Posts */}
      <div
        className="flex-1 overflow-y-auto px-6 py-5 space-y-4"
        onClick={() => showStatusMenu && setShowStatusMenu(false)}
      >
        {thread.posts?.length === 0 && !isAiThinking ? (
          <div className="text-center text-gray-400 py-8">
            No posts yet. Start the discussion below.
          </div>
        ) : (
          thread.posts.map((post) => (
            <PostItem
              key={post.id}
              post={post}
              onRetryAi={handleRetryAi}
              retryDisabled={isAiThinking}
            />
          ))
        )}
        {isAiThinking && (
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 flex items-center gap-3">
            <span className="inline-block w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-purple-700">AI is thinking…</span>
          </div>
        )}
        {aiError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-center justify-between">
            <span className="text-xs text-red-600">AI error: {aiError}</span>
            <button
              onClick={() => onDismissAiError(fileId, thread.id)}
              className="text-xs text-red-400 hover:text-red-600 ml-2 shrink-0"
            >
              ✕
            </button>
          </div>
        )}
        <div ref={postsEndRef} />
      </div>

      {/* Reply form */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
        <ReplyForm onReply={handleUserReply} disabled={isAiThinking} />
      </div>
    </div>
  )
}
