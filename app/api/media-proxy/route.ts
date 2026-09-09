import { NextRequest, NextResponse } from 'next/server'

// Streams an image/GIF back through this site's own domain instead of the
// browser fetching it directly from Supabase Storage. Fetching cross-origin
// (browser -> supabase.co) can be silently blocked by CORS for `fetch()`
// (unlike a plain <img> tag, which never enforces CORS), which was why the
// couple dashboard could never build a real File object for the WhatsApp
// "share photo + message as one" feature and always fell back to text-only.
// A server-to-server fetch here has no CORS restriction, so this guarantees
// the browser can always read the bytes once they come back same-origin.
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 })
  }

  // Only ever proxy this project's own Supabase Storage files — never an
  // arbitrary URL — so this can't be abused as an open proxy.
  if (!parsed.hostname.endsWith('.supabase.co') || parsed.protocol !== 'https:') {
    return NextResponse.json({ error: 'Host not allowed' }, { status: 400 })
  }

  try {
    const upstream = await fetch(parsed.toString())
    if (!upstream.ok) {
      return NextResponse.json({ error: 'Upstream fetch failed' }, { status: 502 })
    }
    const buf = await upstream.arrayBuffer()
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream'
    return new NextResponse(buf, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=300',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Proxy error' }, { status: 502 })
  }
}
