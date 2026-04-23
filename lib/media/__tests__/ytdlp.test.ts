// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest'
import { EventEmitter } from 'events'

vi.mock('child_process', () => ({ spawn: vi.fn() }))
vi.mock('fs/promises', () => ({ mkdir: vi.fn().mockResolvedValue(undefined) }))

function makeFakeProc(stdout: string, exitCode: number) {
  const proc = new EventEmitter() as any
  proc.stdout = new EventEmitter()
  proc.stderr = new EventEmitter()
  setTimeout(() => {
    proc.stdout.emit('data', Buffer.from(stdout))
    proc.emit('close', exitCode)
  }, 0)
  return proc
}

describe('downloadVideo', () => {
  afterEach(() => vi.clearAllMocks())

  it('resolves with mediaPath on success', async () => {
    const { spawn } = await import('child_process')
    vi.mocked(spawn).mockImplementation(() => makeFakeProc('/data/media/abc123.mp4\n', 0) as any)
    const { downloadVideo } = await import('../ytdlp')
    const result = await downloadVideo('https://instagram.com/reel/test', 'abc123')
    expect(result.mediaPath).toBe('/data/media/abc123.mp4')
  })

  it('rejects on non-zero exit code', async () => {
    const { spawn } = await import('child_process')
    vi.mocked(spawn).mockImplementation(() => makeFakeProc('', 1) as any)
    const { downloadVideo } = await import('../ytdlp')
    await expect(downloadVideo('https://bad-url', 'id1')).rejects.toThrow('yt-dlp exited')
  })

  it('rejects when exit 0 but no output path', async () => {
    const { spawn } = await import('child_process')
    vi.mocked(spawn).mockImplementation(() => makeFakeProc('', 0) as any)
    const { downloadVideo } = await import('../ytdlp')
    await expect(downloadVideo('https://any', 'id3')).rejects.toThrow('no output path')
  })

  it('rejects when yt-dlp fails to spawn', async () => {
    const { spawn } = await import('child_process')
    const proc = new EventEmitter() as any
    proc.stdout = new EventEmitter()
    proc.stderr = new EventEmitter()
    setTimeout(() => proc.emit('error', new Error('ENOENT')), 0)
    vi.mocked(spawn).mockImplementation(() => proc as any)
    const { downloadVideo } = await import('../ytdlp')
    await expect(downloadVideo('https://any', 'id2')).rejects.toThrow('not found or failed to start')
  })
})
