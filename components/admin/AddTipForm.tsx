'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Category {
  id: string
  name: string
  isPreset: boolean
}

interface AddTipFormProps {
  onSuccess: () => void
}

export default function AddTipForm({ onSuccess }: AddTipFormProps) {
  const router = useRouter()

  // Upload Image tab state
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Video URL tab state
  const [videoUrl, setVideoUrl] = useState('')
  const [ingestLoading, setIngestLoading] = useState(false)
  const [ingestQueued, setIngestQueued] = useState(false)

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data: Category[]) => setCategories(data))
      .catch(() => {})
  }, [])

  function toggleCategory(id: string) {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  async function handleAddCategory() {
    const name = newCategoryName.trim()
    if (!name) return
    setIsAddingCategory(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error('Failed to create category')
      const created: Category = await res.json()
      setCategories((prev) => [...prev, created])
      setSelectedCategoryIds((prev) => [...prev, created.id])
      setNewCategoryName('')
    } catch {
      // silently ignore
    } finally {
      setIsAddingCategory(false)
    }
  }

  async function handleUploadSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !title.trim()) return
    setUploadLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? 'Upload failed')
      }
      const uploadResult = await uploadRes.json() as {
        id: string
        mediaPath: string
        thumbPath: string | null
        mediaType: 'screenshot' | 'video_frame'
      }

      const tipRes = await fetch('/api/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          notes: notes.trim() || undefined,
          mediaType: uploadResult.mediaType,
          mediaPath: uploadResult.mediaPath,
          thumbPath: uploadResult.thumbPath ?? undefined,
          categoryIds: selectedCategoryIds,
        }),
      })
      if (!tipRes.ok) {
        const err = await tipRes.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? 'Failed to save tip')
      }

      // Reset form
      setFile(null)
      setTitle('')
      setNotes('')
      setSelectedCategoryIds([])
      if (fileInputRef.current) fileInputRef.current.value = ''
      onSuccess()
      toast.success('Tip saved!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setUploadLoading(false)
    }
  }

  async function handleIngestSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!videoUrl.trim()) return
    setIngestLoading(true)
    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: videoUrl.trim() }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? 'Ingest failed')
      }
      const result = await res.json() as { id: string }
      setIngestQueued(true)
      toast.success('Video queued for processing')
      setTimeout(() => {
        router.push(`/admin/review/${result.id}`)
      }, 800)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIngestLoading(false)
    }
  }

  return (
    <Tabs defaultValue="upload" className="w-full">
      <TabsList>
        <TabsTrigger value="upload">Upload Image</TabsTrigger>
        <TabsTrigger value="video">From Video URL</TabsTrigger>
      </TabsList>

      <TabsContent value="upload" className="mt-4">
        <form onSubmit={handleUploadSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="file-input">Image</Label>
            <input
              id="file-input"
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm file:font-medium file:cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tip-title">Title</Label>
            <Input
              id="tip-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Golden hour exposure tips"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tip-notes">Notes (optional)</Label>
            <Textarea
              id="tip-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Categories</Label>
            {categories.length > 0 && (
              <div className="flex flex-col gap-1.5 rounded-lg border border-input p-3">
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2 text-sm cursor-pointer">
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
            )}
            <div className="flex gap-2 items-center">
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="+ New category"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddCategory()
                  }
                }}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCategory}
                disabled={isAddingCategory || !newCategoryName.trim()}
              >
                Add
              </Button>
            </div>
          </div>

          <Button type="submit" disabled={uploadLoading || !file || !title.trim()}>
            {uploadLoading ? 'Uploading...' : 'Add Tip'}
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="video" className="mt-4">
        <form onSubmit={handleIngestSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="video-url">Video URL</Label>
            <Input
              id="video-url"
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              required
            />
            <p className="text-xs text-muted-foreground">
              Supports YouTube and other yt-dlp compatible URLs.
            </p>
          </div>

          <Button
            type="submit"
            disabled={ingestLoading || !videoUrl.trim() || ingestQueued}
          >
            {ingestLoading ? 'Submitting...' : 'Queue Video'}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  )
}
