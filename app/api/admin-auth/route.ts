import { NextResponse } from 'next/server'

// The real password lives only in an environment variable on the server
// (Vercel → Project Settings → Environment Variables → ADMIN_PASSWORD).
// It is never sent to the browser, unlike a hardcoded client-side check.
export async function POST(request: Request) {
  try {
    const { password } = await request.json()
    const correct = process.env.ADMIN_PASSWORD

    if (!correct) {
      // Fails safe: if no password is configured on the server, deny access
      // rather than silently letting everyone in.
      return NextResponse.json({ ok: false, error: 'Admin password not configured on server.' }, { status: 500 })
    }

    if (typeof password === 'string' && password === correct) {
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ ok: false }, { status: 401 })
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 })
  }
}
