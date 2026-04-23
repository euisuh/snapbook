import sharp from 'sharp'
import * as fsp from 'fs/promises'
import path from 'path'

export async function generateThumbnail(sourcePath: string, id: string): Promise<string> {
  const thumbsDir = '/data/thumbs'
  await fsp.mkdir(thumbsDir, { recursive: true })

  const thumbPath = path.join(thumbsDir, `${id}.jpg`)

  await sharp(sourcePath)
    .resize(640, 480, { fit: 'cover', position: 'entropy' })
    .jpeg({ quality: 80 })
    .toFile(thumbPath)

  return thumbPath
}
