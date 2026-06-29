import { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import ThreadDetail from './components/ThreadDetail'

export default function App() {
  const [categories, setCategories] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [selectedThreadId, setSelectedThreadId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchThreads = useCallback(async () => {
    try {
      const res = await fetch('/api/threads')
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      setCategories(data)
      return data
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchThreads().then((data) => {
      if (data?.length > 0) {
        setSelectedCategoryId(data[0].fileId)
        setSelectedThreadId(data[0].threads?.[0]?.id ?? null)
      }
    })
  }, [fetchThreads])

  const selectedCategory = categories.find((c) => c.fileId === selectedCategoryId)
  const selectedThread = selectedCategory?.threads?.find((t) => t.id === selectedThreadId)

  const handleSelectThread = (categoryId, threadId) => {
    setSelectedCategoryId(categoryId)
    setSelectedThreadId(threadId)
  }

  const handleReply = async (type, message) => {
    if (!selectedCategoryId || !selectedThreadId) return
    await fetch(`/api/threads/${selectedCategoryId}/${selectedThreadId}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, message }),
    })
    await fetchThreads()
  }

  const handleStatusChange = async (status) => {
    if (!selectedCategoryId || !selectedThreadId) return
    await fetch(`/api/threads/${selectedCategoryId}/${selectedThreadId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await fetchThreads()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 text-gray-500">
        <div className="text-center">
          <div className="text-2xl mb-2">⏳</div>
          <div>Loading threads…</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center text-red-600 max-w-sm">
          <div className="text-2xl mb-2">⚠️</div>
          <div className="font-medium mb-1">Could not connect to server</div>
          <div className="text-sm text-gray-500">{error}</div>
          <div className="text-sm text-gray-400 mt-2">
            Make sure the backend is running:{' '}
            <code className="bg-gray-100 px-1 rounded">npm run dev</code>
          </div>
        </div>
      </div>
    )
  }

  const totalThreads = categories.reduce((sum, c) => sum + (c.threads?.length ?? 0), 0)
  const needsAction = categories.reduce(
    (sum, c) =>
      sum +
      (c.threads?.filter((t) =>
        ['needs_discussion', 'needs_research', 'open'].includes(t.status),
      ).length ?? 0),
    0,
  )

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-sm overflow-hidden">
      <Sidebar
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        selectedThreadId={selectedThreadId}
        onSelectThread={handleSelectThread}
        totalThreads={totalThreads}
        needsAction={needsAction}
      />

      <main className="flex-1 overflow-hidden">
        {selectedThread ? (
          <ThreadDetail
            thread={selectedThread}
            onReply={handleReply}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="text-3xl mb-2">🧵</div>
              <div>Select a thread from the sidebar</div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
