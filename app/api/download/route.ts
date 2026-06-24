import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 1200
const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'identity',
  Connection: 'keep-alive',
}

/** Try multiple regex patterns to extract a Google Drive file ID */
function extractFileId(url: string): string | null {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/open\?id=([a-zA-Z0-9_-]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m?.[1]) return m[1]
  }
  return null
}

/** Build a NextResponse that forces a browser download */
function buildResponse(
  upstream: Response,
  fileName: string
): NextResponse {
  const contentLength = upstream.headers.get('Content-Length')
  const headers: Record<string, string> = {
    'Content-Type':
      upstream.headers.get('Content-Type') || 'application/octet-stream',
    'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  }
  if (contentLength) headers['Content-Length'] = contentLength

  return new NextResponse(upstream.body as ReadableStream, { headers })
}

/**
 * Fetch a URL and return the Response only when it is
 * an actual file (not an HTML warning page).
 */
async function fetchFile(
  url: string,
  extraHeaders: Record<string, string> = {}
): Promise<Response | null> {
  try {
    const res = await fetch(url, {
      headers: { ...BROWSER_HEADERS, ...extraHeaders },
      redirect: 'follow',
    })
    if (!res.ok) return null
    const ct = res.headers.get('Content-Type') || ''
    if (ct.includes('text/html')) return null
    return res
  } catch {
    return null
  }
}

/** Strategy 4 fallback: use Google Drive API v3 public endpoint */
async function fetchViaApi(
  fileId: string
): Promise<Response | null> {
  const apiUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`
  try {
    const res = await fetch(apiUrl, {
      headers: BROWSER_HEADERS,
      redirect: 'follow',
    })
    if (!res.ok) return null
    const ct = res.headers.get('Content-Type') || ''
    if (ct.includes('text/html')) return null
    return res
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const fileUrl = searchParams.get('url')
  const fileName = searchParams.get('name') || 'download.mp4'

  if (!fileUrl) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 })
  }

  const fileId = extractFileId(fileUrl)

  if (fileId) {
    // ---- STRATEGY 1: direct with confirm=t ----
    const s1 = await fetchFile(
      `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`
    )
    if (s1) return buildResponse(s1, fileName)

    // ---- STRATEGY 2: parse warning page for form action / tokens ----
    try {
      const warnRes = await fetch(
        `https://drive.google.com/uc?export=download&id=${fileId}`,
        { headers: BROWSER_HEADERS, redirect: 'follow' }
      )
      if (warnRes.ok) {
        const html = await warnRes.text()
        const cookies = warnRes.headers.get('Set-Cookie') || ''

        // 2a) form action URL
        const actionMatch = html.match(
          /action="(https:\/\/drive(?:\.usercontent)?\.google\.com\/[^"]+)"/
        )
        if (actionMatch?.[1]) {
          const decoded = actionMatch[1].replace(/&amp;/g, '&')
          const s2a = await fetchFile(decoded, cookies ? { Cookie: cookies } : {})
          if (s2a) return buildResponse(s2a, fileName)
        }

        // 2b) confirm + uuid tokens
        const confirmMatch = html.match(/confirm=([a-zA-Z0-9_-]+)/)
        const uuidMatch = html.match(/uuid=([a-zA-Z0-9_-]+)/)
        if (confirmMatch?.[1]) {
          let tokenUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=${confirmMatch[1]}`
          if (uuidMatch?.[1]) tokenUrl += `&uuid=${uuidMatch[1]}`
          const s2b = await fetchFile(tokenUrl, cookies ? { Cookie: cookies } : {})
          if (s2b) return buildResponse(s2b, fileName)
        }
      }
    } catch {
      // continue to next strategy
    }

    // ---- STRATEGY 3: usercontent domain ----
    const s3 = await fetchFile(
      `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`
    )
    if (s3) return buildResponse(s3, fileName)

    // ---- STRATEGY 4: API v3 ----
    const s4 = await fetchViaApi(fileId)
    if (s4) return buildResponse(s4, fileName)
  }

  // ---- FALLBACK: direct URL fetch ----
  try {
    const direct = await fetch(fileUrl, {
      headers: BROWSER_HEADERS,
      redirect: 'follow',
    })
    if (direct.ok) return buildResponse(direct, fileName)
  } catch {
    // fall through
  }

  return NextResponse.json(
    { error: 'Failed to fetch file after trying all strategies' },
    { status: 502 }
  )
}
