// @vitest-environment node
// lib/media/__tests__/ffmpeg.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { EventEmitter } from 'events'

vi.mock('child_process', () => ({ spawn: vi.fn() }))
vi.mock('fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  readdir: vi.fn().mockResolvedValue(['0001.jpg', '0002.jpg', '0003.jpg']),
}))

function makeProc(code: number) {
  const proc = new EventEmitter() as any
  proc.stdout = new EventEmitter()
  proc.stderr = new EventEmitter()
  setTimeout(() => proc.emit('close', code), 0)
  return proc
}

describe('ffmpeg', () => {
  afterEach(() => vi.clearAllMocks())

  it('extractSceneFrames returns sorted frame paths', async () => {
    const { spawn } = await import('child_process')
    vi.mocked(spawn).mockImplementation(() => makeProc(0) as any)

    const { extractSceneFrames } = await import('../ffmpeg')
    const frames = await extractSceneFrames('/data/media/vid.mp4', 'vid123')
    expect(frames).toHaveLength(3)
    expect(frames[0]).toContain('0001.jpg')
  })

  it('extractFrameAt resolves with frame path', async () => {
    const { spawn } = await import('child_process')
    vi.mocked(spawn).mockImplementation(() => makeProc(0) as any)

    const { extractFrameAt } = await import('../ffmpeg')
    const p = await extractFrameAt('/data/media/vid.mp4', 'vid123', 5000, 'frame1')
    expect(p).toContain('manual_frame1.jpg')
  })

  it('generateVideoThumbnail resolves on success', async () => {
    const { spawn } = await import('child_process')
    vi.mocked(spawn).mockImplementation(() => makeProc(0) as any)

    const { generateVideoThumbnail } = await import('../ffmpeg')
    await expect(generateVideoThumbnail('/data/media/vid.mp4', '/data/thumbs/vid.jpg')).resolves.toBeUndefined()
  })

  it('extractSceneFrames rejects on exit code > 1', async () => {
    const { spawn } = await import('child_process')
    vi.mocked(spawn).mockImplementation(() => makeProc(2) as any)

    const { extractSceneFrames } = await import('../ffmpeg')
    await expect(extractSceneFrames('/data/media/vid.mp4', 'vid123')).rejects.toThrow('scene detect failed')
  })
})
