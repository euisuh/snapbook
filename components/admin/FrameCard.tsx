'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Category {
  id: string
  name: string
  isPreset: boolean
}

interface FrameCardProps {
  frame: { url: string; path: string }
  videoId: string
  onSaved: () => void
}

export default function FrameCard({ frame, videoId, onSaved }: FrameCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleExpand() {
    setExpanded(true)
    setError(null)
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data: Category[] = await res.json()
        setCategories(data)
      }
    } catch {
      // silently ignore category load failure
    }
  }

  function handleCancel() {
    setExpanded(false)
    setTitle('')
    setNotes('')
    setSelectedCategoryIds([])
    setError(null)
  }

  function toggleCategory(id: string) {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          notes: notes.trim() || undefined,
          mediaType: 'video_frame',
          mediaPath: frame.path,
          videoId,
          frameTimeMs: 0,
          categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? 'Failed to save tip')
      }
      handleCancel()
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
      {/* Frame image */}
      <div className="relative w-full aspect-video bg-muted">
        <Image
          src={frame.url}
          alt="Video frame"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      <div className="p-3 flex flex-col gap-3">
        {!expanded ? (
          <Button variant="outline" size="sm" onClick={handleExpand}>
            Save as Tip
          </Button>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`title-${frame.path}`}>Title</Label>
              <Input
                id={`title-${frame.path}`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Composition rule of thirds"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`notes-${frame.path}`}>Notes (optional)</Label>
              <Textarea
                id={`notes-${frame.path}`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>

            {categories.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <Label>Categories</Label>
                <div className="flex flex-col gap-1.5 rounded-lg border border-input p-2.5">
                  {categories.map((cat) => (
                    <label
                      key={cat.id}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategoryIds.includes(cat.id)}
                        onChange={() => toggleCategory(cat.id)}
                        className="rounded"
                      />
                      {cat.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={loading || !title.trim()}
                className="flex-1"
              >
                {loading ? 'Saving...' : 'Save Tip'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
