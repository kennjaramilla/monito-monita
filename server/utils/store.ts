import { get, put } from '@vercel/blob'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

// Private Vercel Blob in production. Without a token (local dev, tests) the
// same JSON goes to .data/ on disk.
const useBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN)
const localPath = (key: string) => join(process.cwd(), '.data', key)

export async function readJson<T>(key: string): Promise<T | null> {
  if (!useBlob()) {
    try {
      return JSON.parse(await readFile(localPath(key), 'utf8')) as T
    } catch {
      return null
    }
  }
  // Skip the CDN cache so a fresh wishlist or draw shows up right away.
  const res = await get(key, { access: 'private', useCache: false }).catch(() => null)
  if (!res || res.statusCode !== 200) return null
  return (await new Response(res.stream).json()) as T
}

export async function writeJson(key: string, value: unknown) {
  const body = JSON.stringify(value)
  if (!useBlob()) {
    await mkdir(dirname(localPath(key)), { recursive: true })
    await writeFile(localPath(key), body)
    return
  }
  await put(key, body, {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  })
}
