// lib/media/__tests__/thumbnail.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest'

const mockToFile = vi.fn().mockResolvedValue(undefined)
const mockJpeg = vi.fn().mockReturnValue({ toFile: mockToFile })
const mockResize = vi.fn().mockReturnValue({ jpeg: mockJpeg })
const mockSharp = vi.fn().mockReturnValue({ resize: mockResize })

vi.mock('sharp', () => ({ default: mockSharp }))
vi.mock('fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
}))

describe('generateThumbnail', () => {
  afterEach(() => vi.clearAllMocks())

  it('calls sharp with correct resize and returns thumb path', async () => {
    const { generateThumbnail } = await import('../thumbnail')
    const result = await generateThumbnail('/data/media/img.jpg', 'tip123')

    expect(mockSharp).toHaveBeenCalledWith('/data/media/img.jpg')
    expect(mockResize).toHaveBeenCalledWith(640, 480, { fit: 'cover', position: 'entropy' })
    expect(result).toContain('tip123.jpg')
  })
})
