import { spawn } from 'child_process'
import { mkdir } from 'fs/promises'
import path from 'path'

export interface DownloadResult {
  mediaPath: string
}

export async function downloadVideo(url: string, id: string): Promise<DownloadResult> {
  const mediaDir = process.env.MEDIA_DIR ?? '/data/media'
  await mkdir(mediaDir, { recursive: true })

  const outputTemplate = path.join(mediaDir, `${id}.%(ext)s`)
  const maxSizeMb = process.env.MAX_VIDEO_SIZE_MB ?? '500'

  return new Promise((resolve, reject) => {
    const args = [
      url,
      '-o', outputTemplate,
      '--max-filesize', `${maxSizeMb}M`,
      '--no-playlist',
      '--print', 'after_move:filepath',
      '--no-progress',
      '--quiet',
    ]

    const proc = spawn('yt-dlp', args)
    let filepath = ''
    let stderr = ''

    proc.stdout.on('data', (chunk: Buffer) => {
      filepath += chunk.toString()
    })
    proc.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`yt-dlp exited ${code}: ${stderr.slice(0, 300)}`))
        return
      }
      resolve({ mediaPath: filepath.trim() })
    })
    proc.on('error', (err) => {
      reject(new Error(`yt-dlp not found or failed to start: ${err.message}`))
    })
  })
}
