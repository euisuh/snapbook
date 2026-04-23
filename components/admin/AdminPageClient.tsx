'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import AddTipForm from '@/components/admin/AddTipForm'
import type { TipWithCategories } from '@/types/tip'

export default function AdminPageClient() {
  const [tips, setTips] = useState<TipWithCategories[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  const fetchTips = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/tips')
      if (!res.ok) throw new Error('Failed to load tips')
      const data: TipWithCategories[] = await res.json()
      setTips(data)
    } catch {
      setError('Could not load tips.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTips()
  }, [fetchTips])

  async function handleDelete(id: string) {
    setDeletingIds((prev) => new Set(prev).add(id))
    try {
      const res = await fetch(`/api/tips/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setTips((prev) => prev.filter((t) => t.id !== id))
      toast.success('Tip deleted')
    } catch {
      toast.error('Failed to delete tip')
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-4xl mx-auto px-6 py-10 flex flex-col gap-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Admin</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/ingest"
              className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Ingest History
            </Link>
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              ← Gallery
            </Link>
          </div>
        </div>

        {/* Add tip form */}
        <section>
          <h2 className="text-lg font-medium mb-4">Add Tip</h2>
          <AddTipForm onSuccess={fetchTips} />
        </section>

        {/* Recent tips list */}
        <section>
          <h2 className="text-lg font-medium mb-4">Recent Tips</h2>

          {loading && (
            <p className="text-sm text-gray-500">Loading…</p>
          )}

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {!loading && !error && tips.length === 0 && (
            <p className="text-sm text-gray-500">No tips yet.</p>
          )}

          {!loading && !error && tips.length > 0 && (
            <ul className="flex flex-col divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
              {tips.map((tip) => (
                <li
                  key={tip.id}
                  className="flex items-center justify-between gap-4 px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm truncate">{tip.title}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Delete "${tip.title}"`}
                    disabled={deletingIds.has(tip.id)}
                    onClick={() => handleDelete(tip.id)}
                    className="shrink-0 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
