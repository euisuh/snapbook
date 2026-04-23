'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

interface IngestedVideo {
  id: string
  sourceUrl: string
  status: 'pending' | 'processing' | 'ready' | 'error'
  errorMsg: string | null
  createdAt: number
}

const STATUS_COLORS = {
  pending: 'secondary',
  processing: 'secondary',
  ready: 'default',
  error: 'destructive',
} as const

export default function IngestHistoryPage() {
  const [videos, setVideos] = useState<IngestedVideo[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchVideos() {
    const res = await fetch('/api/ingest')
    if (res.ok) setVideos(await res.json())
    setLoading(false)
  }

  useEffect(() => {
    fetchVideos()
    // Poll every 5s to update statuses for in-progress videos
    const interval = setInterval(fetchVideos, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-900">← Admin</Link>
        <h1 className="text-xl font-semibold">Ingest History</h1>
      </div>
      {loading ? (
        <p className="text-sm text-zinc-500">Loading...</p>
      ) : videos.length === 0 ? (
        <p className="text-sm text-zinc-500">No videos ingested yet.</p>
      ) : (
        <div className="flex flex-col divide-y divide-zinc-100">
          {videos.map((video) => (
            <div key={video.id} className="flex items-center justify-between py-3 gap-4">
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-sm text-zinc-900 truncate">{video.sourceUrl}</span>
                <span className="text-xs text-zinc-400">
                  {new Date(video.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <Badge variant={STATUS_COLORS[video.status] ?? 'secondary'}>
                  {video.status}
                </Badge>
                {video.status === 'ready' && (
                  <Link
                    href={`/admin/review/${video.id}`}
                    className="text-xs text-zinc-500 hover:text-zinc-900 underline"
                  >
                    Review
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
