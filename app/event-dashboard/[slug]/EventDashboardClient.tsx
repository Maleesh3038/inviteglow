"use client"
import { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase'

// ── Event-day Check-in Dashboard ─────────────────────────────────────
// Staff-facing page (NOT the guest invitation). Lives at
// /event-dashboard/[slug] — separate route from /invite/[slug] so there's
// no chance of a slug collision between the two.
//
// Access: gated by the event's own "Dashboard PIN" (the same `pin` field
// already collected in the Admin → Event form for each event), remembered
// per-browser via sessionStorage — same lightweight pattern as the Admin
// panel's own password gate. There's no separate staff login system.
//
// Data model: every guest who RSVPs "Attending" on the invitation gets a
// row in `event_guests` (see event_guests_migration.sql), and that row's
// own `id` is what's encoded in their personal QR code as
// `INVITEGLOW-GUEST-<id>`. Scanning it (or typing the 8-character short
// code / searching by name) looks the guest up here so staff can mark
// them checked in at the door, and mark their meal claimed at the food
// counter — each guest's QR is unique to them, so one QR can't be reused
// by someone else at either station.

const PREFIX = 'INVITEGLOW-GUEST-'
function extractGuestId(decoded: string): string | null {
  const trimmed = decoded.trim()
  if (trimmed.startsWith(PREFIX)) return trimmed.slice(PREFIX.length)
  // Also accept a bare short-code style scan/typed entry as a prefix match, handled by caller.
  return null
}

type EventRow = {
  id: string
  slug: string
  title: string
  host?: string | null
  event_date: string
  pin?: string | null
}
type Guest = {
  id: string
  event_id: string
  guest_name: string
  phone: string | null
  epf_no: string | null
  guest_count: number
  drinking: string | null
  checked_in: boolean
  checked_in_at: string | null
  meal_claimed: boolean
  meal_claimed_at: string | null
  created_at: string
}
// One EPF number = one guest row per event (enforced by a unique
// (event_id, epf_no) constraint in Postgres — see
// add_event_guests_epf.sql) — the invitation's RSVP upserts on that
// conflict, so re-submitting the same EPF number never creates a second
// QR for the same person.
type ScanResult = 'not-found' | { guest: Guest; alreadyIn: boolean }

const ACCENT = '#1c3d5a'
const ACCENT_LIGHT = '#c9a227'

function fmtTime(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export default function EventDashboardClient({ slug }: { slug: string }) {
  const [checkingSession, setCheckingSession] = useState(true)
  const [unlocked, setUnlocked] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [authError, setAuthError] = useState('')
  const [authChecking, setAuthChecking] = useState(false)

  const [event, setEvent] = useState<EventRow | null>(null)
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [search, setSearch] = useState('')

  const [scanOpen, setScanOpen] = useState(false)
  const [scanMsg, setScanMsg] = useState('')
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const guestsRef = useRef<Guest[]>([])

  const [walkinOpen, setWalkinOpen] = useState(false)
  const [walkinName, setWalkinName] = useState('')
  const [walkinPhone, setWalkinPhone] = useState('')
  const [walkinEpf, setWalkinEpf] = useState('')
  const [walkinCount, setWalkinCount] = useState(1)
  const [savingWalkin, setSavingWalkin] = useState(false)

  const sessionKey = `ig_dash_unlock_${slug}`

  // ── Load event + guest list ──
  useEffect(() => {
    const load = async () => {
      const { data: ev, error } = await supabase.from('events').select('id,slug,title,host,event_date,pin').eq('slug', slug).single()
      if (error || !ev) { setNotFound(true); setLoading(false); setCheckingSession(false); return }
      setEvent(ev as EventRow)
      try {
        if (sessionStorage.getItem(sessionKey) === 'true') setUnlocked(true)
      } catch { /* ignore */ }
      setCheckingSession(false)
      const { data: g } = await supabase.from('event_guests').select('*').eq('event_id', (ev as EventRow).id).order('guest_name', { ascending: true })
      if (g) setGuests(g as Guest[])
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  // ── Realtime — so two staff members checking guests in at two doors
  // at once both see live updates without reloading. ──
  useEffect(() => {
    if (!event) return
    const channel = supabase
      .channel(`event-guests-${event.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_guests', filter: `event_id=eq.${event.id}` }, payload => {
        setGuests(prev => {
          if (payload.eventType === 'DELETE') return prev.filter(g => g.id !== (payload.old as any).id)
          const row = payload.new as Guest
          const exists = prev.some(g => g.id === row.id)
          return exists ? prev.map(g => g.id === row.id ? row : g) : [...prev, row].sort((a, b) => a.guest_name.localeCompare(b.guest_name))
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [event])

  const tryUnlock = async () => {
    if (!event) return
    setAuthChecking(true); setAuthError('')
    if (pinInput.trim() && event.pin && pinInput.trim() === event.pin) {
      setUnlocked(true)
      try { sessionStorage.setItem(sessionKey, 'true') } catch { /* ignore */ }
    } else {
      setAuthError('Incorrect PIN.')
    }
    setAuthChecking(false)
  }

  const stats = useMemo(() => {
    const totalGuests = guests.reduce((s, g) => s + (g.guest_count || 1), 0)
    const checkedIn = guests.filter(g => g.checked_in).length
    const checkedInGuests = guests.filter(g => g.checked_in).reduce((s, g) => s + (g.guest_count || 1), 0)
    const meals = guests.filter(g => g.meal_claimed).length
    return { registrations: guests.length, totalGuests, checkedIn, checkedInGuests, meals }
  }, [guests])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return guests
    return guests.filter(g =>
      g.guest_name.toLowerCase().includes(q) || (g.phone || '').includes(q) ||
      (g.epf_no || '').toLowerCase().includes(q) || g.id.toLowerCase().startsWith(q)
    )
  }, [guests, search])

  useEffect(() => { guestsRef.current = guests }, [guests])

  // Release the camera if the staff member navigates away mid-scan.
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const patchGuest = async (id: string, patch: Partial<Guest>) => {
    setGuests(prev => prev.map(g => g.id === id ? { ...g, ...patch } : g))
    await supabase.from('event_guests').update(patch).eq('id', id)
  }
  const toggleCheckIn = (g: Guest) => patchGuest(g.id, g.checked_in ? { checked_in: false, checked_in_at: null } : { checked_in: true, checked_in_at: new Date().toISOString() })
  const toggleMeal = (g: Guest) => patchGuest(g.id, g.meal_claimed ? { meal_claimed: false, meal_claimed_at: null } : { meal_claimed: true, meal_claimed_at: new Date().toISOString() })

  // ── QR camera scanning ──────────────────────────────────────────────
  // No npm dependency needed: the decoder (jsQR) is pulled in from a CDN
  // at runtime, and the camera frames are read with plain browser APIs
  // (getUserMedia + a <video>/<canvas> pair). This avoids touching
  // package.json entirely, since this project's files are pasted straight
  // into GitHub rather than built through a local `npm install` step.
  const [scannedGuest, setScannedGuest] = useState<ScanResult | null>(null)
  function loadJsQR(): Promise<any> {
    return new Promise((resolve, reject) => {
      if ((window as any).jsQR) { resolve((window as any).jsQR); return }
      const existing = document.querySelector('script[data-jsqr]') as HTMLScriptElement | null
      if (existing) {
        existing.addEventListener('load', () => resolve((window as any).jsQR))
        existing.addEventListener('error', () => reject(new Error('jsQR failed to load')))
        return
      }
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js'
      script.async = true
      script.setAttribute('data-jsqr', 'true')
      script.onload = () => resolve((window as any).jsQR)
      script.onerror = () => reject(new Error('jsQR failed to load'))
      document.head.appendChild(script)
    })
  }
  const jsQRRef = useRef<any>(null)
  const scanTick = () => {
    const video = videoRef.current, canvas = canvasRef.current, jsQR = jsQRRef.current
    if (video && canvas && jsQR && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth; canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx && canvas.width > 0 && canvas.height > 0) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height)
        if (code && code.data) {
          const gid = extractGuestId(code.data)
          const found = gid ? guestsRef.current.find(g => g.id === gid) : undefined
          if (found) {
            const alreadyIn = found.checked_in
            // A valid scan checks the guest in right away — no extra tap
            // needed at the gate. Meal claiming stays a separate, deliberate
            // action since it usually happens later at a different counter.
            if (!alreadyIn) {
              const now = new Date().toISOString()
              patchGuest(found.id, { checked_in: true, checked_in_at: now })
              setScannedGuest({ guest: { ...found, checked_in: true, checked_in_at: now }, alreadyIn: false })
            } else {
              setScannedGuest({ guest: found, alreadyIn: true })
            }
          } else {
            setScannedGuest('not-found')
          }
          return // pause the loop until "Scan Next Guest"
        }
      }
    }
    rafRef.current = requestAnimationFrame(scanTick)
  }
  const startScan = async () => {
    setScanOpen(true); setScanMsg(''); setScannedGuest(null)
    try {
      jsQRRef.current = await loadJsQR()
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      rafRef.current = requestAnimationFrame(scanTick)
    } catch (e) {
      setScanMsg('Could not start the camera. Please allow camera access and try again.')
    }
  }
  const stopScan = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setScanOpen(false); setScannedGuest(null)
  }
  const resumeScan = () => { setScannedGuest(null); rafRef.current = requestAnimationFrame(scanTick) }

  const saveWalkin = async () => {
    if (!event || !walkinName.trim()) return
    setSavingWalkin(true)
    const { data, error } = await supabase.from('event_guests')
      .insert([{ event_id: event.id, guest_name: walkinName.trim(), phone: walkinPhone.trim() || null, epf_no: walkinEpf.trim() || null, guest_count: walkinCount, checked_in: true, checked_in_at: new Date().toISOString() }])
      .select('*').single()
    setSavingWalkin(false)
    if (!error && data) {
      setGuests(prev => [...prev, data as Guest].sort((a, b) => a.guest_name.localeCompare(b.guest_name)))
      setWalkinOpen(false); setWalkinName(''); setWalkinPhone(''); setWalkinEpf(''); setWalkinCount(1)
    }
  }

  if (checkingSession || loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',sans-serif", color: ACCENT }}>Loading…</div>
  }
  if (notFound || !event) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',sans-serif", color: '#94a3b8', textAlign: 'center', padding: 24 }}>Event not found.</div>
  }
  if (!unlocked) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f5ef', fontFamily: "'Inter',sans-serif", padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 360, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Check-in Dashboard</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0f2438', marginTop: 6, marginBottom: 20 }}>{event.title}</div>
          <input
            type="password" inputMode="numeric" placeholder="Enter dashboard PIN" value={pinInput}
            onChange={e => setPinInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && tryUnlock()}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 16, textAlign: 'center', letterSpacing: '0.2em', marginBottom: 12, boxSizing: 'border-box' }}
          />
          {authError && <div style={{ color: '#dc2626', fontSize: 12.5, marginBottom: 10 }}>{authError}</div>}
          <button onClick={tryUnlock} disabled={authChecking} style={{ width: '100%', padding: 13, borderRadius: 10, border: 'none', background: ACCENT, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            {authChecking ? '...' : 'Unlock'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f5ef', fontFamily: "'Inter',sans-serif" }}>
      <div style={{ background: ACCENT, color: '#fff', padding: '18px 20px' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.75 }}>Check-in Dashboard</div>
        <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>{event.title}</div>
        {event.host && <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>Organized by {event.host}</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 10, padding: '16px 16px 0' }}>
        {[
          ['Registered', stats.registrations],
          ['Total Guests', stats.totalGuests],
          ['Checked In', stats.checkedIn],
          ['Meals Given', stats.meals],
        ].map(([label, val]) => (
          <div key={label as string} style={{ background: '#fff', borderRadius: 12, padding: '14px 12px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: ACCENT }}>{val}</div>
            <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, padding: 16, flexWrap: 'wrap' }}>
        <button onClick={startScan} style={{ flex: '1 1 160px', padding: '13px 16px', borderRadius: 10, border: 'none', background: ACCENT_LIGHT, color: '#1c1400', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>📷 Scan QR</button>
        <button onClick={() => setWalkinOpen(true)} style={{ flex: '1 1 160px', padding: '13px 16px', borderRadius: 10, border: `1.5px solid ${ACCENT}`, background: '#fff', color: ACCENT, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>+ Add Walk-in Guest</button>
      </div>

      <div style={{ padding: '0 16px 16px' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, or code..."
          style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box', background: '#fff' }}
        />
      </div>

      <div style={{ padding: '0 16px 100px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 30 }}>No guests match.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(g => (
              <div key={g.id} style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f2438' }}>{g.guest_name}{g.guest_count > 1 ? ` (+${g.guest_count - 1})` : ''}</div>
                    <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>{g.epf_no ? `EPF ${g.epf_no}` : 'no EPF'} · {g.phone || 'no phone'} · Code {g.id.slice(0, 8).toUpperCase()}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button onClick={() => toggleCheckIn(g)} style={{
                    flex: 1, padding: '9px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    background: g.checked_in ? '#16a34a1a' : `${ACCENT}14`, color: g.checked_in ? '#16a34a' : ACCENT,
                  }}>{g.checked_in ? `✓ Checked In · ${fmtTime(g.checked_in_at)}` : 'Check In'}</button>
                  <button onClick={() => toggleMeal(g)} style={{
                    flex: 1, padding: '9px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    background: g.meal_claimed ? '#c9a2271a' : `${ACCENT}14`, color: g.meal_claimed ? '#946f00' : ACCENT,
                  }}>{g.meal_claimed ? `✓ Meal Given · ${fmtTime(g.meal_claimed_at)}` : 'Mark Meal'}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {scanOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,36,56,0.92)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 360 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f2438' }}>Scan Guest QR</div>
              <button onClick={stopScan} style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            {scanMsg && <div style={{ fontSize: 12.5, color: '#dc2626', marginBottom: 10 }}>{scanMsg}</div>}
            <div style={{ display: scannedGuest ? 'none' : 'block', width: '100%', borderRadius: 10, overflow: 'hidden', background: '#000', position: 'relative' }}>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video ref={videoRef} muted playsInline autoPlay style={{ width: '100%', display: 'block' }} />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
            {scannedGuest === 'not-found' && (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div style={{ fontSize: 26, marginBottom: 8 }}>⚠️</div>
                <div style={{ fontSize: 13, color: '#dc2626', fontWeight: 600, marginBottom: 14 }}>Not a valid pass for this event.</div>
                <button onClick={resumeScan} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: ACCENT, color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Scan Again</button>
              </div>
            )}
            {scannedGuest && scannedGuest !== 'not-found' && (
              <div style={{ padding: '6px 0' }}>
                {scannedGuest.alreadyIn ? (
                  <div style={{ textAlign: 'center', padding: '4px 0 10px' }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>⚠️</div>
                    <div style={{ fontSize: 12.5, color: '#b45309', fontWeight: 700 }}>Already checked in · {fmtTime(scannedGuest.guest.checked_in_at)}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>This QR was scanned before — check it's the right person.</div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '4px 0 10px' }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>✅</div>
                    <div style={{ fontSize: 13.5, color: '#16a34a', fontWeight: 700 }}>Checked in just now</div>
                  </div>
                )}
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f2438', textAlign: 'center' }}>{scannedGuest.guest.guest_name}{scannedGuest.guest.guest_count > 1 ? ` (+${scannedGuest.guest.guest_count - 1})` : ''}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14, textAlign: 'center' }}>
                  {scannedGuest.guest.epf_no ? `EPF ${scannedGuest.guest.epf_no}` : 'no EPF no.'} · {scannedGuest.guest.phone || 'no phone'}
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <button onClick={() => { toggleMeal(scannedGuest.guest); setScannedGuest({ ...scannedGuest, guest: { ...scannedGuest.guest, meal_claimed: !scannedGuest.guest.meal_claimed } }) }} style={{
                    flex: 1, padding: '11px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
                    background: scannedGuest.guest.meal_claimed ? '#c9a2271a' : ACCENT_LIGHT, color: scannedGuest.guest.meal_claimed ? '#946f00' : '#1c1400',
                  }}>{scannedGuest.guest.meal_claimed ? `✓ Meal Given · ${fmtTime(scannedGuest.guest.meal_claimed_at)}` : 'Mark Meal'}</button>
                </div>
                <button onClick={resumeScan} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Scan Next Guest →</button>
              </div>
            )}
          </div>
        </div>
      )}

      {walkinOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,36,56,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 22, width: '100%', maxWidth: 340 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f2438', marginBottom: 14 }}>Add Walk-in Guest</div>
            <input value={walkinName} onChange={e => setWalkinName(e.target.value)} placeholder="Guest name" style={{ width: '100%', padding: '11px 13px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, marginBottom: 10, boxSizing: 'border-box' }} />
            <input value={walkinPhone} onChange={e => setWalkinPhone(e.target.value)} placeholder="Phone (optional)" style={{ width: '100%', padding: '11px 13px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, marginBottom: 10, boxSizing: 'border-box' }} />
            <input value={walkinEpf} onChange={e => setWalkinEpf(e.target.value)} placeholder="EPF No (optional)" style={{ width: '100%', padding: '11px 13px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, marginBottom: 10, boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 12.5, color: '#64748b' }}>Guests:</span>
              <button onClick={() => setWalkinCount(c => Math.max(1, c - 1))} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: '#f1f5f9', cursor: 'pointer' }}>−</button>
              <span style={{ fontSize: 15, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{walkinCount}</span>
              <button onClick={() => setWalkinCount(c => c + 1)} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: '#f1f5f9', cursor: 'pointer' }}>+</button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setWalkinOpen(false)} style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveWalkin} disabled={savingWalkin || !walkinName.trim()} style={{ flex: 1, padding: 12, borderRadius: 8, border: 'none', background: ACCENT, color: '#fff', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', opacity: savingWalkin ? 0.6 : 1 }}>{savingWalkin ? '...' : 'Add & Check In'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
