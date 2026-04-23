import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import mime from 'mime-types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params
  const filePath = path.join('/data', ...segments)

  // Prevent path traversal
  if (!filePath.startsWith('/data/')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const stat = fs.statSync(filePath)
  const mimeType = (mime.lookup(filePath) || 'application/octet-stream') as string
  const isVideo = mimeType.startsWith('video/')

  // Range request support (required for HTML5 video seek)
  const rangeHeader = request.headers.get('range')
  if (isVideo && rangeHeader) {
    const [startStr, endStr] = rangeHeader.replace('bytes=', '').split('-')
    const start = parseInt(startStr, 10)
    const end = endStr ? parseInt(endStr, 10) : stat.size - 1
    const chunkSize = end - start + 1

    const stream = fs.createReadStream(filePath, { start, end })
    return new NextResponse(stream as any, {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(chunkSize),
        'Content-Type': mimeType,
      },
    })
  }

  const buffer = fs.readFileSync(filePath)
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': mimeType,
      'Content-Length': String(stat.size),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
