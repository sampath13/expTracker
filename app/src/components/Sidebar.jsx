const STATUS_CONFIG = {
  resolved: { dot: 'bg-green-400', label: 'Resolved' },
  needs_discussion: { dot: 'bg-amber-400', label: 'Discussion' },
  needs_research: { dot: 'bg-purple-400', label: 'Research' },
  deferred: { dot: 'bg-gray-300', label: 'Deferred' },
  open: { dot: 'bg-blue-400', label: 'Open' },
}

// Count threads by status urgency for the category badge
function countActive(threads) {
  return threads.filter((t) =>
    ['needs_discussion', 'needs_research', 'open'].includes(t.status),
  ).length
}

export default function Sidebar({
  categories,
  selectedCategoryId,
  selectedThreadId,
  onSelectThread,
  totalThreads,
  needsAction,
}) {
  return (
    <aside className="w-72 h-full flex flex-col border-r border-gray-200 bg-white shrink-0">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-100">
        <h1 className="font-semibold text-gray-900 text-base">Research Threads</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          {totalThreads} threads · {needsAction} need action
        </p>
      </div>

      {/* Thread list grouped by category */}
      <nav className="flex-1 overflow-y-auto py-2">
        {categories.map((cat) => {
          const active = countActive(cat.threads ?? [])
          return (
            <div key={cat.fileId} className="mb-1">
              {/* Category header */}
              <div className="flex items-center justify-between px-4 py-1.5">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider truncate">
                  {cat.category}
                </span>
                {active > 0 && (
                  <span className="text-xs bg-amber-100 text-amber-700 font-medium px-1.5 py-0.5 rounded-full shrink-0 ml-1">
                    {active}
                  </span>
                )}
              </div>

              {/* Threads in category */}
              {(cat.threads ?? []).map((thread) => {
                const cfg = STATUS_CONFIG[thread.status] ?? STATUS_CONFIG.open
                const isSelected =
                  selectedCategoryId === cat.fileId && selectedThreadId === thread.id
                return (
                  <button
                    key={thread.id}
                    onClick={() => onSelectThread(cat.fileId, thread.id)}
                    className={`w-full text-left px-4 py-2.5 flex items-start gap-2.5 hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    }`}
                  >
                    {/* Status dot */}
                    <span
                      className={`mt-1 w-2 h-2 rounded-full shrink-0 ${cfg.dot}`}
                      title={cfg.label}
                    />
                    {/* Question text */}
                    <div className="min-w-0">
                      <p
                        className={`text-xs leading-snug line-clamp-2 ${
                          isSelected ? 'text-blue-700 font-medium' : 'text-gray-700'
                        }`}
                      >
                        {thread.question}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {thread.posts?.length ?? 0} posts
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Footer legend */}
      <div className="px-4 py-3 border-t border-gray-100 flex flex-wrap gap-x-3 gap-y-1">
        {Object.entries(STATUS_CONFIG).map(([key, val]) => (
          <span key={key} className="flex items-center gap-1 text-xs text-gray-400">
            <span className={`w-1.5 h-1.5 rounded-full ${val.dot}`} />
            {val.label}
          </span>
        ))}
      </div>
    </aside>
  )
}
