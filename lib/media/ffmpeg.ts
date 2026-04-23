import { spawn } from 'child_process'
import { mkdir, readdir } from 'fs/promises'
import path from 'path'

function framesDir(videoId: string) {
  return path.join('/data/frames', videoId)
}

export async function extractSceneFrames(
  videoPath: string,
  videoId: string,
  threshold = 0.4
): Promise<string[]> {
  const dir = framesDir(videoId)
  await mkdir(dir, { recursive: true })

  await new Promise<void>((resolve, reject) => {
    const proc = spawn('ffmpeg', [
      '-i', videoPath,
      '-vf', `select='gt(scene,${threshold})',showinfo`,
      '-vsync', 'vfr',
      path.join(dir, '%04d.jpg'),
      '-y',
    ])
    let stderr = ''
    proc.stderr.on('data', (c: Buffer) => { stderr += c.toString() })
    proc.on('close', (code) => {
      // ffmpeg exits 1 on warnings but still writes frames — treat as success
      if (code !== null && code > 1) reject(new Error(`ffmpeg scene detect failed: ${stderr.slice(0, 300)}`))
      else resolve()
    })
    proc.on('error', (e) => reject(new Error(`ffmpeg not found: ${e.message}`)))
  })

  const files = await readdir(dir)
  return files
    .filter((f) => f.match(/^\d{4}\.jpg$/))
    .sort()
    .map((f) => path.join(dir, f))
}

export async function extractFrameAt(
  videoPath: string,
  videoId: string,
  timeMs: number,
  frameId: string
): Promise<string> {
  const dir = framesDir(videoId)
  await mkdir(dir, { recursive: true })

  const framePath = path.join(dir, `manual_${frameId}.jpg`)
  const ss = (timeMs / 1000).toFixed(3)

  await new Promise<void>((resolve, reject) => {
    const proc = spawn('ffmpeg', [
      '-ss', ss,
      '-i', videoPath,
      '-frames:v', '1',
      '-q:v', '2',
      framePath,
      '-y',
    ])
    proc.on('close', (code) => {
      if (code !== 0) reject(new Error('Frame extraction failed'))
      else resolve()
    })
    proc.on('error', (e) => reject(e))
  })

  return framePath
}

export async function generateVideoThumbnail(
  videoPath: string,
  thumbPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', [
      '-ss', '1',
      '-i', videoPath,
      '-frames:v', '1',
      '-vf', 'scale=640:-2',
      '-q:v', '3',
      thumbPath,
      '-y',
    ])
    proc.on('close', (code) => {
      if (code !== 0) reject(new Error('Video thumbnail generation failed'))
      else resolve()
    })
    proc.on('error', (e) => reject(e))
  })
}
