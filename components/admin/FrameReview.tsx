'use client'

import { useState, useEffect, useRef } from 'react'
import FrameCard from '@/components/admin/FrameCard'

interface FrameReviewProps {
  videoId: string
  initialStatus: string
  initialFrames: Array<{ url: string; path: string }>
  sourceUrl: string
  videoUrl: string | null
}

interface IngestResponse {
  id: string
  sourceUrl: string
  status: 'pending' | 'processing' | 'ready' | 'error'
  errorMsg: string | null
  createdAt: number
  videoUrl: string | null
  frames: Array<{ path: string; url: string }>
}

export default function FrameReview({
  videoId,
  initialStatus,
  initialFrames,
  sourceUrl: _sourceUrl,
  videoUrl,
}: FrameReviewProps) {
  const [status, setStatus] = useState(initialStatus)
  const [frames, setFrames] = useState(initialFrames)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [savedCount, setSavedCount] = useState(0)
  const [capturing, setCapturing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  async function handleCapture() {
    if (!videoRef.current) return
    const timeMs = Math.round(videoRef.current.currentTime * 1000)
    setCapturing(true)
    try {
      const res = await fetch(`/api/ingest/${videoId}/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeMs }),
      })
      if (!res.ok) throw new Error('Capture failed')
      const frame = await res.json()
      // Add new frame to list
      setFrames((prev) => [{ url: frame.url, path: frame.path }, ...prev])
    } catch {
      // silent fail — user can retry
    } finally {
      setCapturing(false)
    }
  }

  useEffect(() => {
    if (status !== 'pending' && status !== 'processing') return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/ingest/${videoId}`)
        if (!res.ok) return
        const data: IngestResponse = await res.json()
        setStatus(data.status)
        if (data.status === 'ready') {
          setFrames(data.frames)
          clearInterval(interval)
        } else if (data.status === 'error') {
          setErrorMsg(data.errorMsg)
          clearInterval(interval)
        }
      } catch {
        // silently retry
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [videoId, status])

  if (status === 'error') {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive text-sm">
        {errorMsg ?? 'An error occurred while processing this video.'}
      </div>
    )
  }

  if (status === 'pending' || status === 'processing') {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-muted-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <p className="text-sm">
          {status === 'pending' ? 'Waiting to process...' : 'Processing video...'}
        </p>
      </div>
    )
  }

  if (status === 'ready') {
    if (frames.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          No frames were extracted from this video.
        </p>
      )
    }

    return (
      <div className="flex flex-col gap-4">
        {videoUrl !== null && (
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            className="w-full max-w-2xl rounded-lg bg-black"
          />
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCapture}
            disabled={capturing}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            {capturing ? 'Capturing...' : 'Capture current frame'}
          </button>
          <span className="text-xs text-zinc-500">
            Click to capture the frame at the current video position
          </span>
        </div>
        {savedCount > 0 && (
          <p className="text-sm text-muted-foreground">
            {savedCount} frame{savedCount !== 1 ? 's' : ''} saved as tip{savedCount !== 1 ? 's' : ''}.
          </p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {frames.map((frame) => (
            <FrameCard
              key={frame.path}
              frame={frame}
              videoId={videoId}
              onSaved={() => setSavedCount((c) => c + 1)}
            />
          ))}
        </div>
      </div>
    )
  }

  return null
}
