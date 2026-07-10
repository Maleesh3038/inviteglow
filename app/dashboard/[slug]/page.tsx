"use client"
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase, Couple, RSVP, CoupleColors } from '@/lib/supabase'

const BUCKET = 'wedding-photos'

// Default color presets per template — used as the starting point when a couple
// customises colors for the first time (no custom_colors saved yet)
const TEMPLATE_DEFAULTS: Record<string, Required<CoupleColors>> = {
  'floral-romance': { primary: '#c4607a', primaryLight: '#e8a0b8', dark: '#3d1a2a', cream: '#fdf0f0' },
  'elegant-photo': { primary: '#c9a06e', primaryLight: '#e8d5a0', dark: '#2d2424', cream: '#faf6f4' },
  'cinematic-gold': { primary: '#e8c468', primaryLight: '#f0d488', dark: '#1a1208', cream: '#241a0c' },
  'kandyan-heritage': { primary: '#d4923f', primaryLight: '#f0c878', dark: '#4a1f0f', cream: '#fbf0dc' },
  'twilight-picnic': { primary: '#f0a868', primaryLight: '#e0849a', dark: '#171c33', cream: '#232a4d' },
  'golden-garden': { primary: '#d4a857', primaryLight: '#e8a87a', dark: '#3d2b1f', cream: '#fdf6ec' },
  'ocean-pearl': { primary: '#2f7d9e', primaryLight: '#7fc4d8', dark: '#0d2e3a', cream: '#f0f9fb' },
  'sunset-shores': { primary: '#e0795a', primaryLight: '#f4b896', dark: '#5a3a2e', cream: '#fdf3ea' },
  'traditional-ceylon': { primary: '#2f4a35', primaryLight: '#c9a227', dark: '#1f2e22', cream: '#fbf6e9' },
  'sacred-poruwa': { primary: '#c4956a', primaryLight: '#e8c99a', dark: '#3d2510', cream: '#fdf6e9' },
  'garden-minimal': { primary: '#4a8a5a', primaryLight: '#a0d8b0', dark: '#1a2e20', cream: '#f0f7f0' },
}

async function uploadToStorage(file: File, folder: string): Promise<string | null> {
  const ext = file.name.split('.').pop()
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, { cacheControl: '3600', upsert: false })
  if (error) { console.error('Upload error:', error); return null }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
  return data.publicUrl
}

// Look up a guest's table by fuzzy-matching their RSVP name against the
// couple's seats map (same matching style as the public SeatFinder widgets:
// substring match either direction, case-insensitive).
function findSeatForGuest(guestName: string, seats: Record<string, string>): string | null {
  const query = guestName.trim().toLowerCase()
  if (!query) return null
  const found = Object.keys(seats || {}).find(k => query.includes(k) || k.includes(query))
  return found ? seats[found] : null
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1px solid #e2e8f0', fontSize: 14, outline: 'none',
  fontFamily: "'Inter',sans-serif", background: '#fff', color: '#1e293b',
}
const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 6, display: 'block',
}
const fieldWrap: React.CSSProperties = { marginBottom: 16 }

// ── Couple-facing self-service edit panel ──
function EditPanel({ couple, onSaved }: { couple: Couple; onSaved: () => void }) {
  // Same theme-neutral approach as the main dashboard: pull the accent from
  // the couple's own customised color (or their template default) so this
  // form doesn't look hardcoded to Floral Romance's pink regardless of which
  // template the couple actually picked.
  const panelTemplateDefault = TEMPLATE_DEFAULTS[couple.template] || TEMPLATE_DEFAULTS['floral-romance']
  const PANEL_ACCENT = couple.custom_colors?.primary || panelTemplateDefault.primary
  const PANEL_BORDER = '#e2e8f0'
  const PANEL_TEXT_MUTED = '#64748b'
  const PANEL_TEXT_DARK = '#1e293b'

  const [photo, setPhoto] = useState(couple.couple_photo || '')
  const [weddingDate, setWeddingDate] = useState(couple.wedding_date ? couple.wedding_date.slice(0, 16) : '')
  const [venue, setVenue] = useState(couple.venue || '')
  const [venueAddress, setVenueAddress] = useState(couple.venue_address || '')
  const [mapsUrl, setMapsUrl] = useState(couple.maps_url || '')

  // Seat rows: editable list derived from couple.seats (name -> table).
  // show_seating itself is admin-controlled only — the couple can rearrange
  // names/tables here, but whether the finder is visible on the public
  // invitation is set in the admin panel, not here.
  const [seatRows, setSeatRows] = useState<{ id: number; name: string; table: string }[]>(
    Object.entries(couple.seats || {}).map(([name, table], i) => ({ id: i, name, table }))
  )

  const templateDefault = TEMPLATE_DEFAULTS[couple.template] || TEMPLATE_DEFAULTS['floral-romance']
  const [colors, setColors] = useState<Required<CoupleColors>>({
    primary: couple.custom_colors?.primary || templateDefault.primary,
    primaryLight: couple.custom_colors?.primaryLight || templateDefault.primaryLight,
    dark: couple.custom_colors?.dark || templateDefault.dark,
    cream: couple.custom_colors?.cream || templateDefault.cream,
  })

  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoUpload = async (file: File) => {
    setUploading(true)
    const url = await uploadToStorage(file, 'couple')
    setUploading(false)
    if (url) setPhoto(url)
  }

  const updateSeatRow = (id: number, field: 'name' | 'table', value: string) => {
    setSeatRows(rows => rows.map(r => r.id === id ? { ...r, [field]: value } : r))
  }
  const addSeatRow = () => {
    const newId = seatRows.length ? Math.max(...seatRows.map(r => r.id)) + 1 : 0
    setSeatRows(rows => [...rows, { id: newId, name: '', table: '' }])
  }
  const removeSeatRow = (id: number) => {
    setSeatRows(rows => rows.filter(r => r.id !== id))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    const seatsObj: Record<string, string> = {}
    seatRows.forEach(r => {
      const name = r.name.trim()
      const table = r.table.trim()
      if (name && table) seatsObj[name.toLowerCase()] = table
    })

    const { error } = await supabase.from('couples').update({
      couple_photo: photo || null,
      wedding_date: weddingDate,
      venue: venue || null,
      venue_address: venueAddress || null,
      maps_url: mapsUrl || null,
      custom_colors: colors,
      seats: seatsObj,
    }).eq('id', couple.id)

    setSaving(false)
    if (error) {
      setMessage('❌ Could not save: ' + error.message)
    } else {
      setMessage('✅ Saved! Your invitation has been updated.')
      onSaved()
    }
  }

  const resetColors = () => setColors(templateDefault)

  return (
    <div style={{ background: '#fff', borderRadius: 18, padding: 24, marginBottom: 24, boxShadow: '0 2px 20px rgba(15,23,42,0.06)' }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: PANEL_TEXT_DARK, marginBottom: 4 }}>Edit Your Invitation</div>
      <div style={{ fontSize: 12, color: PANEL_TEXT_MUTED, marginBottom: 20 }}>Changes apply instantly to your live invitation link.</div>

      {/* Photo */}
      <div style={fieldWrap}>
        <label style={labelStyle}>Couple Photo</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {photo && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={photo} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', border: `1px solid ${PANEL_BORDER}` }} />
          )}
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
            style={{ padding: '9px 16px', borderRadius: 8, border: `1px solid ${PANEL_BORDER}`, background: uploading ? '#f1f5f9' : '#fff', cursor: uploading ? 'default' : 'pointer', fontSize: 13, color: PANEL_TEXT_MUTED, fontWeight: 500 }}>
            {uploading ? 'Uploading...' : photo ? '📷 Change Photo' : '📷 Upload Photo'}
          </button>
          {photo && (
            <button type="button" onClick={() => setPhoto('')} style={{ fontSize: 12, color: PANEL_ACCENT, background: 'transparent', border: 'none', cursor: 'pointer' }}>Remove</button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f) }} />
        </div>
      </div>

      {/* Date / venue */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={fieldWrap}>
          <label style={labelStyle}>Wedding Date &amp; Time</label>
          <input type="datetime-local" style={inputStyle} value={weddingDate} onChange={e => setWeddingDate(e.target.value)} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>Venue Name</label>
          <input style={inputStyle} value={venue} onChange={e => setVenue(e.target.value)} placeholder="The Kingsbury" />
        </div>
      </div>
      <div style={fieldWrap}>
        <label style={labelStyle}>Venue Address</label>
        <input style={inputStyle} value={venueAddress} onChange={e => setVenueAddress(e.target.value)} placeholder="Janadhipathi Mawatha, Colombo" />
      </div>
      <div style={fieldWrap}>
        <label style={labelStyle}>Google Maps URL</label>
        <input style={inputStyle} value={mapsUrl} onChange={e => setMapsUrl(e.target.value)} placeholder="https://maps.google.com/?q=..." />
      </div>

      {/* Seating — admin turns the public seat finder on/off; here the couple
          can rearrange or correct names/tables once it's on */}
      {couple.show_seating && (
        <div style={{ background: '#eef2ff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#3730a3', marginBottom: 4 }}>🪑 Manage Seating</div>
          <div style={{ fontSize: 11, color: '#4338ca', marginBottom: 14 }}>
            Guests can search their name on your invitation to find their table. Add, edit, or remove names below.
          </div>

          <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
            {seatRows.map(row => (
              <div key={row.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  value={row.name}
                  onChange={e => updateSeatRow(row.id, 'name', e.target.value)}
                  placeholder="Guest name"
                  style={{ ...inputStyle, flex: 1, marginBottom: 0, background: '#fff' }}
                />
                <input
                  value={row.table}
                  onChange={e => updateSeatRow(row.id, 'table', e.target.value)}
                  placeholder="Table 3"
                  style={{ ...inputStyle, flex: 1, marginBottom: 0, background: '#fff' }}
                />
                <button
                  type="button"
                  onClick={() => removeSeatRow(row.id)}
                  aria-label="Remove guest"
                  style={{
                    width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: '#fee2e2', color: '#dc2626', fontSize: 13, flexShrink: 0,
                  }}>✕</button>
              </div>
            ))}
            {seatRows.length === 0 && (
              <div style={{ fontSize: 12, color: '#6b6098', fontStyle: 'italic' }}>No guests added yet.</div>
            )}
          </div>

          <button type="button" onClick={addSeatRow} style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid #c7d2fe',
            background: '#fff', cursor: 'pointer', fontSize: 13, color: '#4338ca', fontWeight: 500,
          }}>
            + Add Guest
          </button>
        </div>
      )}

      {/* Color customisation */}
      <div style={{ background: '#fdf8ec', borderRadius: 12, padding: 16, marginTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#8a6a2a' }}>🎨 Customise Colors</div>
          <button type="button" onClick={resetColors} style={{ fontSize: 11, color: PANEL_TEXT_MUTED, background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            Reset to default
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[
            { key: 'primary' as const, label: 'Primary Accent' },
            { key: 'primaryLight' as const, label: 'Light Accent' },
            { key: 'dark' as const, label: 'Dark / Text' },
            { key: 'cream' as const, label: 'Background' },
          ].map(c => (
            <div key={c.key}>
              <label style={labelStyle}>{c.label}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="color" value={colors[c.key]} onChange={e => setColors({ ...colors, [c.key]: e.target.value })}
                  style={{ width: 38, height: 38, borderRadius: 8, border: `1px solid ${PANEL_BORDER}`, cursor: 'pointer', padding: 0 }} />
                <input value={colors[c.key]} onChange={e => setColors({ ...colors, [c.key]: e.target.value })}
                  style={{ ...inputStyle, padding: '8px 10px', fontSize: 12 }} />
              </div>
            </div>
          ))}
        </div>
        {/* Live preview swatch */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14, padding: 12, borderRadius: 10, background: colors.cream }}>
          <div style={{ flex: 1, padding: '10px', borderRadius: 8, background: colors.primary, color: '#fff', fontSize: 11, textAlign: 'center', fontWeight: 600 }}>Primary</div>
          <div style={{ flex: 1, padding: '10px', borderRadius: 8, background: colors.primaryLight, color: colors.dark, fontSize: 11, textAlign: 'center', fontWeight: 600 }}>Light</div>
          <div style={{ flex: 1, padding: '10px', borderRadius: 8, background: colors.dark, color: '#fff', fontSize: 11, textAlign: 'center', fontWeight: 600 }}>Dark</div>
        </div>
      </div>

      {message && <div style={{ marginTop: 16, fontSize: 13, color: message.startsWith('✅') ? '#16a34a' : '#dc2626' }}>{message}</div>}

      <button onClick={handleSave} disabled={saving} style={{
        marginTop: 18, width: '100%', padding: 14, borderRadius: 12, border: 'none', cursor: 'pointer',
        background: `linear-gradient(135deg,${PANEL_ACCENT},${panelTemplateDefault.primaryLight})`, color: '#fff', fontWeight: 700, fontSize: 14,
        opacity: saving ? 0.6 : 1,
      }}>
        {saving ? 'Saving...' : '💾 Save Changes'}
      </button>
    </div>
  )
}

// ── Guest Link Generator — lets the couple create personalised invite
// links for each guest with their name pre-filled in the URL. ──
function GuestLinkGenerator({ couple, accent }: { couple: Couple; accent: string }) {
  const [guestName, setGuestName] = useState("")
  const [copied, setCopied] = useState(false)

  const baseUrl = typeof window !== "undefined" ? `${window.location.origin}/invite/${couple.slug}` : `/invite/${couple.slug}`
  const generatedLink = guestName.trim()
    ? `${baseUrl}?name=${encodeURIComponent(guestName.trim())}`
    : baseUrl

  const copyLink = async () => {
    if (!guestName.trim()) return
    await navigator.clipboard.writeText(generatedLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareWhatsApp = () => {
    if (!guestName.trim()) return
    const msg = encodeURIComponent(`You're invited! 🎊\n${generatedLink}`)
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  return (
    <div style={{ background: "#fff", borderRadius: 18, padding: 24, marginBottom: 24, boxShadow: "0 2px 20px rgba(15,23,42,0.06)" }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>💌 Generate Guest Link</div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
        Type a guest's name to generate a personalised invitation link — their name will appear on the cover and auto-fill in the RSVP form.
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <input
          value={guestName}
          onChange={e => { setGuestName(e.target.value); setCopied(false) }}
          placeholder="e.g. Amara & Family"
          style={{ flex: 1, padding: "11px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, outline: "none", fontFamily: "'Inter',sans-serif", color: "#1e293b" }}
        />
      </div>

      {guestName.trim() && (
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 12, color: "#475569", wordBreak: "break-all", border: "1px solid #e2e8f0" }}>
          🔗 {generatedLink}
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={copyLink}
          disabled={!guestName.trim()}
          style={{
            flex: 1, padding: "11px", borderRadius: 10, border: "none", cursor: guestName.trim() ? "pointer" : "default",
            background: copied ? "#16a34a" : accent,
            color: "#fff", fontWeight: 600, fontSize: 13,
            opacity: guestName.trim() ? 1 : 0.4,
            transition: "background 0.2s",
          }}>
          {copied ? "✓ Copied!" : "📋 Copy Link"}
        </button>
        <button
          onClick={shareWhatsApp}
          disabled={!guestName.trim()}
          style={{
            flex: 1, padding: "11px", borderRadius: 10, border: "none", cursor: guestName.trim() ? "pointer" : "default",
            background: "#25d366", color: "#fff", fontWeight: 600, fontSize: 13,
            opacity: guestName.trim() ? 1 : 0.4,
          }}>
          📲 Share on WhatsApp
        </button>
      </div>
    </div>
  )
}

export default function CoupleDashboard() {
  const params = useParams()
  const slug = params.slug as string

  const [couple, setCouple] = useState<Couple | null>(null)
  const [rsvps, setRsvps] = useState<RSVP[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [search, setSearch] = useState("")
  const [filterResponse, setFilterResponse] = useState<'all' | 'yes' | 'no'>('all')
  const [filterDrinking, setFilterDrinking] = useState<'all' | 'yes' | 'no'>('all')
  const [showEdit, setShowEdit] = useState(false)

  const [unlocked, setUnlocked] = useState(false)
  const [pinInput, setPinInput] = useState("")
  const [pinError, setPinError] = useState(false)
  const [deletingRsvpId, setDeletingRsvpId] = useState<string | null>(null)

  const loadData = async () => {
    const { data: coupleData, error: coupleError } = await supabase
      .from('couples').select('*').eq('slug', slug).single()

    if (coupleError || !coupleData) {
      setNotFound(true)
      setLoading(false)
      return
    }
    setCouple(coupleData as Couple)

    const { data: rsvpData } = await supabase
      .from('rsvps').select('*').eq('couple_id', coupleData.id).order('created_at', { ascending: false })

    setRsvps((rsvpData as RSVP[]) || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [slug])

  useEffect(() => {
    if (!unlocked) return
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [unlocked, slug])

  const checkPin = () => {
    if (couple && pinInput === couple.pin) {
      setUnlocked(true)
      setPinError(false)
    } else {
      setPinError(true)
    }
  }

  const handleDeleteRsvp = async (id: string, guestName: string) => {
    if (!confirm(`Remove ${guestName}'s RSVP? This cannot be undone.`)) return
    setDeletingRsvpId(id)
    const { error } = await supabase.from('rsvps').delete().eq('id', id)
    setDeletingRsvpId(null)
    if (!error) setRsvps(prev => prev.filter(r => r.id !== id))
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "'Inter',sans-serif", color: "#475569" }}>
        Loading...
      </div>
    )
  }

  if (notFound || !couple) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "'Inter',sans-serif", color: "#1e293b", textAlign: "center", padding: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💔</div>
        <div style={{ fontFamily: "'Inter',sans-serif", fontWeight: 800, fontSize: "1.6rem", color: "#1e293b", marginBottom: 8 }}>Dashboard Not Found</div>
        <div style={{ fontSize: 14, color: "#64748b" }}>This invitation doesn't exist.</div>
      </div>
    )
  }

  // ── Theme-neutral dashboard palette ──
  // The dashboard is shared across every template (Floral, Twilight Picnic,
  // etc.), so it doesn't hardcode the pink Floral Romance look. Instead it
  // stays neutral (white/grey) and pulls just the accent color from whatever
  // the couple has customised, falling back to a calm slate if they haven't.
  // Placed here (couple is guaranteed non-null past the check above) so the
  // PIN lock screen below can use it too.
  const ACCENT = couple.custom_colors?.primary || '#475569'
  const ACCENT_LIGHT = couple.custom_colors?.primaryLight || '#94a3b8'
  const TEXT_DARK = '#1e293b'
  const TEXT_MUTED = '#64748b'
  const BORDER = '#e2e8f0'
  const PAGE_BG = '#f8fafc'

  // ── PIN LOCK SCREEN ──
  if (!unlocked) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: PAGE_BG, fontFamily: "'Inter',sans-serif", padding: 24 }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&display=swap');`}</style>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: "#fff", borderRadius: 20, padding: "2.5rem 2rem", maxWidth: 360, width: "100%", textAlign: "center", boxShadow: "0 8px 32px rgba(15,23,42,0.1)" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
          <div style={{ fontFamily: "'Inter',sans-serif", fontWeight: 800, fontSize: "1.4rem", color: TEXT_DARK, marginBottom: 4 }}>
            {couple.bride} &amp; {couple.groom}
          </div>
          <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 24 }}>Enter your PIN to view your dashboard</div>
          <input
            type="tel" inputMode="numeric" maxLength={4} value={pinInput}
            onChange={e => { setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinError(false) }}
            onKeyDown={e => e.key === 'Enter' && checkPin()}
            placeholder="••••"
            style={{
              width: "100%", padding: "16px", borderRadius: 12, textAlign: "center",
              fontSize: 28, letterSpacing: "0.5em", border: `2px solid ${pinError ? '#dc2626' : BORDER}`,
              outline: "none", marginBottom: 12, fontFamily: "'Inter',sans-serif", color: TEXT_DARK,
            }}
          />
          {pinError && <div style={{ color: "#dc2626", fontSize: 12, marginBottom: 12 }}>Incorrect PIN. Please try again.</div>}
          <button onClick={checkPin} style={{
            width: "100%", padding: "14px", borderRadius: 12, border: "none", cursor: "pointer",
            background: `linear-gradient(135deg,${ACCENT},${ACCENT_LIGHT})`, color: "#fff", fontWeight: 600, fontSize: 14,
          }}>
            Unlock Dashboard
          </button>
        </motion.div>
      </div>
    )
  }

  // ── DASHBOARD ──
  const accepted = rsvps.filter(r => r.response === 'yes')
  const declined = rsvps.filter(r => r.response === 'no')
  const drinkingYes = accepted.filter(r => r.drinking === 'yes').length
  const drinkingNo = accepted.filter(r => r.drinking === 'no').length
  const totalGuests = accepted.reduce((sum, r) => sum + (r.guest_count || 1), 0)

  // Twilight Picnic stores multi-select drinks as a comma-separated string in
  // the same 'drinking' column (e.g. "Wine,Beer") — a guest picking more than
  // one option counts toward each. Counted independently of the totalGuests
  // figure above, which is unaffected by this template difference.
  const isTwilightPicnic = couple.template === 'twilight-picnic'
  const drinkCounts = { 'Hard Liquor': 0, 'Wine': 0, 'Beer': 0, 'Non-Alcoholic': 0 }
  if (isTwilightPicnic) {
    accepted.forEach(r => {
      (r.drinking || '').split(',').map(d => d.trim()).forEach(d => {
        if (d in drinkCounts) drinkCounts[d as keyof typeof drinkCounts]++
      })
    })
  }
  const accommodationNeeded = accepted.filter(r => r.accommodation === 'needed').length
  const accommodationNotNeeded = accepted.filter(r => r.accommodation === 'not_needed').length

  const filteredRsvps = rsvps.filter(r => {
    if (search && !r.guest_name.toLowerCase().includes(search.toLowerCase())) return false
    if (filterResponse !== 'all' && r.response !== filterResponse) return false
    if (filterDrinking !== 'all' && r.drinking !== filterDrinking) return false
    return true
  })

  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: '7px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer',
    border: active ? 'none' : `1px solid ${BORDER}`,
    background: active ? `linear-gradient(135deg,${ACCENT},${ACCENT_LIGHT})` : '#fff',
    color: active ? '#fff' : TEXT_MUTED,
  })

  return (
    <div style={{ minHeight: "100vh", background: PAGE_BG, fontFamily: "'Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');`}</style>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontFamily: "'Inter',sans-serif", fontWeight: 800, fontSize: "1.9rem", color: TEXT_DARK, letterSpacing: "-0.01em" }}>
            {couple.bride} <span style={{ color: ACCENT }}>&amp;</span> {couple.groom}
          </div>
          <div style={{ fontSize: 12, color: TEXT_MUTED, letterSpacing: "0.1em", marginTop: 4 }}>
            Your Wedding Dashboard
          </div>
        </div>

        {/* Edit toggle */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <button onClick={() => setShowEdit(!showEdit)} style={{
            padding: '10px 22px', borderRadius: 100, border: `1px solid ${BORDER}`, background: '#fff',
            cursor: 'pointer', fontSize: 13, fontWeight: 600, color: TEXT_MUTED,
          }}>
            {showEdit ? '✕ Close Editor' : '✏️ Edit My Invitation'}
          </button>
        </div>

        {showEdit && <EditPanel couple={couple} onSaved={loadData} />}

        {/* Guest Link Generator — always visible */}
        <GuestLinkGenerator couple={couple} accent={ACCENT} />

        {/* Stats cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginBottom: 12 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 16px", textAlign: "center", boxShadow: "0 2px 12px rgba(15,23,42,0.06)" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#16a34a" }}>{accepted.length}</div>
            <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}>✓ RSVPs Accepted</div>
          </div>
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 16px", textAlign: "center", boxShadow: "0 2px 12px rgba(15,23,42,0.06)" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#dc2626" }}>{declined.length}</div>
            <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}>✗ Declined</div>
          </div>
        </div>

        <div style={{ background: `linear-gradient(135deg,${ACCENT},${ACCENT_LIGHT})`, borderRadius: 16, padding: "20px 16px", textAlign: "center", marginBottom: 16, boxShadow: `0 4px 20px ${ACCENT}40` }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#fff" }}>{totalGuests}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 4, fontWeight: 500 }}>Total Guests Attending (including families)</div>
        </div>

        {isTwilightPicnic ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              {([
                ['🥃', 'Hard Liquor'], ['🍷', 'Wine'], ['🍺', 'Beer'], ['🥤', 'Non-Alcoholic'],
              ] as const).map(([icon, label]) => (
                <div key={label} style={{ background: "#fff", borderRadius: 16, padding: "16px", textAlign: "center", boxShadow: "0 2px 12px rgba(15,23,42,0.06)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <span style={{ fontSize: 22 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: TEXT_DARK }}>{drinkCounts[label]}</div>
                    <div style={{ fontSize: 10, color: TEXT_MUTED }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
              <div style={{ background: "#fff", borderRadius: 16, padding: "16px", textAlign: "center", boxShadow: "0 2px 12px rgba(15,23,42,0.06)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>🏡</span>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: TEXT_DARK }}>{accommodationNeeded}</div>
                  <div style={{ fontSize: 10, color: TEXT_MUTED }}>Accommodation Needed</div>
                </div>
              </div>
              <div style={{ background: "#fff", borderRadius: 16, padding: "16px", textAlign: "center", boxShadow: "0 2px 12px rgba(15,23,42,0.06)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>🚗</span>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: TEXT_DARK }}>{accommodationNotNeeded}</div>
                  <div style={{ fontSize: 10, color: TEXT_MUTED }}>Not Needed</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            <div style={{ background: "#fff", borderRadius: 16, padding: "16px", textAlign: "center", boxShadow: "0 2px 12px rgba(15,23,42,0.06)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <span style={{ fontSize: 22 }}>🍷</span>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: TEXT_DARK }}>{drinkingYes}</div>
                <div style={{ fontSize: 10, color: TEXT_MUTED }}>Drinking Alcohol</div>
              </div>
            </div>
            <div style={{ background: "#fff", borderRadius: 16, padding: "16px", textAlign: "center", boxShadow: "0 2px 12px rgba(15,23,42,0.06)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <span style={{ fontSize: 22 }}>🥤</span>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: TEXT_DARK }}>{drinkingNo}</div>
                <div style={{ fontSize: 10, color: TEXT_MUTED }}>Non-Alcoholic</div>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div style={{ marginBottom: 14 }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search guest by name..."
            style={{
              width: "100%", padding: "12px 18px", borderRadius: 12,
              border: `1px solid ${BORDER}`, background: "#fff", color: TEXT_DARK,
              fontSize: 14, outline: "none", fontFamily: "'Inter',sans-serif",
            }}
          />
        </div>

        {/* Dual filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: TEXT_MUTED, alignSelf: 'center', marginRight: 4 }}>Status:</span>
          <div onClick={() => setFilterResponse('all')} style={pillStyle(filterResponse === 'all')}>All</div>
          <div onClick={() => setFilterResponse('yes')} style={pillStyle(filterResponse === 'yes')}>✓ Attending</div>
          <div onClick={() => setFilterResponse('no')} style={pillStyle(filterResponse === 'no')}>✗ Not Attending</div>
        </div>
        {!isTwilightPicnic && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 11, color: TEXT_MUTED, alignSelf: 'center', marginRight: 4 }}>Drinks:</span>
            <div onClick={() => setFilterDrinking('all')} style={pillStyle(filterDrinking === 'all')}>All</div>
            <div onClick={() => setFilterDrinking('yes')} style={pillStyle(filterDrinking === 'yes')}>🍷 Yes</div>
            <div onClick={() => setFilterDrinking('no')} style={pillStyle(filterDrinking === 'no')}>🥤 No</div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button onClick={loadData} style={{
            fontSize: 12, color: ACCENT, background: "transparent", border: "none",
            cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: 6,
          }}>
            ↻ Refresh
          </button>
        </div>

        {/* RSVP List */}
        {filteredRsvps.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, background: "#fff", borderRadius: 16, color: TEXT_MUTED }}>
            {rsvps.length === 0 ? "No RSVP responses yet. Share your invitation link with guests!" : "No guests match your filters."}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {filteredRsvps.map((r, i) => {
              const seatTable = r.response === 'yes' ? findSeatForGuest(r.guest_name, couple.seats) : null
              return (
                <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  style={{
                    background: "#fff", borderRadius: 12, padding: "14px 18px",
                    display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10,
                    boxShadow: "0 2px 10px rgba(15,23,42,0.05)",
                  }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK }}>{r.guest_name}</div>
                      {r.response === 'yes' && r.guest_count > 1 && (
                        <div style={{ padding: "2px 9px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: "#f3e8ff", color: "#7c3aed" }}>
                          👥 {r.guest_count}
                        </div>
                      )}
                      {seatTable && (
                        <div style={{ padding: "2px 9px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: "#eef2ff", color: "#4f46e5" }}>
                          🪑 {seatTable}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>
                      {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} at{' '}
                      {new Date(r.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {isTwilightPicnic ? (
                        <>
                          {r.response === 'yes' && r.drinking && (
                            <div style={{ padding: "6px 12px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: "#fef3c7", color: "#b45309" }}>
                              🥂 {r.drinking.split(',').filter(Boolean).join(', ') || 'No preference'}
                            </div>
                          )}
                          {r.response === 'yes' && r.accommodation && (
                            <div style={{
                              padding: "6px 12px", borderRadius: 100, fontSize: 11, fontWeight: 600,
                              background: r.accommodation === 'needed' ? '#ede9fe' : '#e0f2fe',
                              color: r.accommodation === 'needed' ? '#6d28d9' : '#0369a1',
                            }}>
                              {r.accommodation === 'needed' ? '🏡 Needs Stay' : '🚗 Sorted'}
                            </div>
                          )}
                        </>
                      ) : (
                        r.response === 'yes' && r.drinking && (
                          <div style={{
                            padding: "6px 12px", borderRadius: 100, fontSize: 11, fontWeight: 600,
                            background: r.drinking === 'yes' ? '#fef3c7' : '#e0f2fe',
                            color: r.drinking === 'yes' ? '#b45309' : '#0369a1',
                          }}>
                            {r.drinking === 'yes' ? '🍷 Drinks' : '🥤 No Drinks'}
                          </div>
                        )
                      )}
                      <div style={{
                        padding: "6px 14px", borderRadius: 100, fontSize: 12, fontWeight: 600,
                        background: r.response === 'yes' ? '#dcfce7' : '#fee2e2',
                        color: r.response === 'yes' ? '#16a34a' : '#dc2626',
                      }}>
                        {r.response === 'yes' ? '✓ Attending' : '✗ Not Attending'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteRsvp(r.id, r.guest_name)}
                      disabled={deletingRsvpId === r.id}
                      style={{
                        padding: '4px 12px', borderRadius: 100, border: '1px solid #fecaca', cursor: 'pointer',
                        background: '#fef2f2', color: '#dc2626', fontSize: 11, fontWeight: 500,
                        opacity: deletingRsvpId === r.id ? 0.6 : 1,
                      }}>
                      {deletingRsvpId === r.id ? 'Removing...' : '🗑 Remove'}
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 40, fontSize: 11, color: TEXT_MUTED }}>
          Auto-refreshes every 30 seconds · InviteGlow Dashboard
        </div>
      </div>
    </div>
  )
}
