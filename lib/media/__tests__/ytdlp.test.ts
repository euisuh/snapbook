// @vitest-environment node
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { EventEmitter } from 'events'

vi.mock('child_process')
vi.mock('fs/promises')

function makeFakeProc(stdout: string, exitCode: number) {
  const proc = new EventEmitter() as any
  proc.stdout = new EventEmitter()
  proc.stderr = new EventEmitter()
  Promise.resolve().then(() => {
    proc.stdout.emit('data', Buffer.from(stdout))
    proc.emit('close', exitCode)
  })
  return proc
}

describe('downloadVideo', () => {
  afterEach(() => vi.clearAllMocks())

  it('resolves with mediaPath on success', async () => {
    const { spawn } = await import('child_process')
    const { mkdir } = await import('fs/promises')

    vi.mocked(spawn).mockImplementation(() => makeFakeProc('/data/media/abc123.mp4\n', 0) as any)
    vi.mocked(mkdir).mockResolvedValue(undefined as any)

    const { downloadVideo } = await import('../ytdlp')
    const result = await downloadVideo('https://instagram.com/reel/test', 'abc123')
    expect(result.mediaPath).toBe('/data/media/abc123.mp4')
  })

  it('rejects on non-zero exit code', async () => {
    const { spawn } = await import('child_process')
    const { mkdir } = await import('fs/promises')

    vi.mocked(spawn).mockImplementation(() => makeFakeProc('', 1) as any)
    vi.mocked(mkdir).mockResolvedValue(undefined as any)

    const { downloadVideo } = await import('../ytdlp')
    await expect(downloadVideo('https://bad-url', 'id1')).rejects.toThrow()
  })

  it('rejects when yt-dlp fails to spawn', async () => {
    const { spawn } = await import('child_process')
    const { mkdir } = await import('fs/promises')

    const proc = new EventEmitter() as any
    proc.stdout = new EventEmitter()
    proc.stderr = new EventEmitter()
    setTimeout(() => proc.emit('error', new Error('ENOENT')), 0)
    vi.mocked(spawn).mockImplementation(() => proc as any)
    vi.mocked(mkdir).mockResolvedValue(undefined as any)

    const { downloadVideo } = await import('../ytdlp')
    await expect(downloadVideo('https://any', 'id2')).rejects.toThrow('not found or failed to start')
  })
})
