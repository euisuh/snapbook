import { notFound } from 'next/navigation'
import Link from 'next/link'
import FrameReview from '@/components/admin/FrameReview'

interface IngestData {
  id: string
  sourceUrl: string
  status: string
  errorMsg: string | null
  createdAt: number
  videoUrl: string | null
  frames: Array<{ path: string; url: string }>
}

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ videoId: string }>
}) {
  const { videoId } = await params
  const BASE = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'
  const res = await fetch(`${BASE}/api/ingest/${videoId}`, { cache: 'no-store' })
  if (!res.ok) notFound()
  const data: IngestData = await res.json()

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Admin
        </Link>
        <h1 className="text-xl font-semibold">Review: {data.sourceUrl}</h1>
      </div>
      <FrameReview
        videoId={videoId}
        initialStatus={data.status}
        initialFrames={data.frames}
        sourceUrl={data.sourceUrl}
        videoUrl={data.videoUrl}
      />
    </div>
  )
}
