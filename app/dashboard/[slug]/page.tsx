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

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1px solid #e2d8c8', fontSize: 14, outline: 'none',
  fontFamily: "'Inter',sans-serif", background: '#fff', color: '#2d2424',
}
const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: '#6b5d4f', marginBottom: 6, display: 'block',
}
const fieldWrap: React.CSSProperties = { marginBottom: 16 }

// ── Couple-facing self-service edit panel ──
function EditPanel({ couple, onSaved }: { couple: Couple; onSaved: () => void }) {
  const [photo, setPhoto] = useState(couple.couple_photo || '')
  const [weddingDate, setWeddingDate] = useState(couple.wedding_date ? couple.wedding_date.slice(0, 16) : '')
  const [venue, setVenue] = useState(couple.venue || '')
  const [venueAddress, setVenueAddress] = useState(couple.venue_address || '')
  const [mapsUrl, setMapsUrl] = useState(couple.maps_url || '')

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

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    const { error } = await supabase.from('couples').update({
      couple_photo: photo || null,
      wedding_date: weddingDate,
      venue: venue || null,
      venue_address: venueAddress || null,
      maps_url: mapsUrl || null,
      custom_colors: colors,
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
    <div style={{ background: '#fff', borderRadius: 18, padding: 24, marginBottom: 24, boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#2d2424', marginBottom: 4 }}>Edit Your Invitation</div>
      <div style={{ fontSize: 12, color: '#9a8d7d', marginBottom: 20 }}>Changes apply instantly to your live invitation link.</div>

      {/* Photo */}
      <div style={fieldWrap}>
        <label style={labelStyle}>Couple Photo</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {photo && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={photo} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', border: '1px solid #e2d8c8' }} />
          )}
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
            style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #e2d8c8', background: uploading ? '#f5f0e6' : '#fff', cursor: uploading ? 'default' : 'pointer', fontSize: 13, color: '#6b5d4f', fontWeight: 500 }}>
            {uploading ? 'Uploading...' : photo ? '📷 Change Photo' : '📷 Upload Photo'}
          </button>
          {photo && (
            <button type="button" onClick={() => setPhoto('')} style={{ fontSize: 12, color: '#c4607a', background: 'transparent', border: 'none', cursor: 'pointer' }}>Remove</button>
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

      {/* Color customisation */}
      <div style={{ background: '#fdf8ec', borderRadius: 12, padding: 16, marginTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#8a6a2a' }}>🎨 Customise Colors</div>
          <button type="button" onClick={resetColors} style={{ fontSize: 11, color: '#9a8d7d', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
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
                  style={{ width: 38, height: 38, borderRadius: 8, border: '1px solid #e2d8c8', cursor: 'pointer', padding: 0 }} />
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
        background: 'linear-gradient(135deg,#c4607a,#e08090)', color: '#fff', fontWeight: 700, fontSize: 14,
        opacity: saving ? 0.6 : 1,
      }}>
        {saving ? 'Saving...' : '💾 Save Changes'}
      </button>
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

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fdf0f0", fontFamily: "'Inter',sans-serif", color: "#c4607a" }}>
        Loading...
      </div>
    )
  }

  if (notFound || !couple) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fdf0f0", fontFamily: "'Inter',sans-serif", color: "#3d1a2a", textAlign: "center", padding: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💔</div>
        <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "2rem", color: "#c4607a", marginBottom: 8 }}>Dashboard Not Found</div>
        <div style={{ fontSize: 14, color: "#9a7080" }}>This invitation doesn't exist.</div>
      </div>
    )
  }

  // ── PIN LOCK SCREEN ──
  if (!unlocked) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fdf0f0", fontFamily: "'Inter',sans-serif", padding: 24 }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Inter:wght@400;500;600&display=swap');`}</style>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: "#fff", borderRadius: 20, padding: "2.5rem 2rem", maxWidth: 360, width: "100%", textAlign: "center", boxShadow: "0 8px 40px rgba(200,120,140,0.15)" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
          <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "1.8rem", color: "#3d1a2a", marginBottom: 4 }}>
            {couple.bride} &amp; {couple.groom}
          </div>
          <div style={{ fontSize: 12, color: "#9a7080", marginBottom: 24 }}>Enter your PIN to view your dashboard</div>
          <input
            type="tel" inputMode="numeric" maxLength={4} value={pinInput}
            onChange={e => { setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinError(false) }}
            onKeyDown={e => e.key === 'Enter' && checkPin()}
            placeholder="••••"
            style={{
              width: "100%", padding: "16px", borderRadius: 12, textAlign: "center",
              fontSize: 28, letterSpacing: "0.5em", border: `2px solid ${pinError ? '#dc2626' : '#f0d0d8'}`,
              outline: "none", marginBottom: 12, fontFamily: "'Inter',sans-serif", color: "#3d1a2a",
            }}
          />
          {pinError && <div style={{ color: "#dc2626", fontSize: 12, marginBottom: 12 }}>Incorrect PIN. Please try again.</div>}
          <button onClick={checkPin} style={{
            width: "100%", padding: "14px", borderRadius: 12, border: "none", cursor: "pointer",
            background: "linear-gradient(135deg,#c4607a,#e08090)", color: "#fff", fontWeight: 600, fontSize: 14,
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

  const filteredRsvps = rsvps.filter(r => {
    if (search && !r.guest_name.toLowerCase().includes(search.toLowerCase())) return false
    if (filterResponse !== 'all' && r.response !== filterResponse) return false
    if (filterDrinking !== 'all' && r.drinking !== filterDrinking) return false
    return true
  })

  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: '7px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer',
    border: active ? 'none' : '1px solid #e2d8c8',
    background: active ? 'linear-gradient(135deg,#c4607a,#e08090)' : '#fff',
    color: active ? '#fff' : '#6b5d4f',
  })

  return (
    <div style={{ minHeight: "100vh", background: "#fdf0f0", fontFamily: "'Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Inter:wght@300;400;500;600;700&display=swap');`}</style>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "2.5rem", color: "#3d1a2a" }}>
            {couple.bride} <span style={{ color: "#c4607a" }}>&amp;</span> {couple.groom}
          </div>
          <div style={{ fontSize: 12, color: "#9a7080", letterSpacing: "0.1em", marginTop: 4 }}>
            Your Wedding Dashboard
          </div>
        </div>

        {/* Edit toggle */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <button onClick={() => setShowEdit(!showEdit)} style={{
            padding: '10px 22px', borderRadius: 100, border: '1px solid #e2d8c8', background: '#fff',
            cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#6b5d4f',
          }}>
            {showEdit ? '✕ Close Editor' : '✏️ Edit My Invitation'}
          </button>
        </div>

        {showEdit && <EditPanel couple={couple} onSaved={loadData} />}

        {/* Stats cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginBottom: 12 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 16px", textAlign: "center", boxShadow: "0 2px 16px rgba(200,120,140,0.08)" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#16a34a" }}>{accepted.length}</div>
            <div style={{ fontSize: 11, color: "#9a7080", marginTop: 4 }}>✓ RSVPs Accepted</div>
          </div>
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 16px", textAlign: "center", boxShadow: "0 2px 16px rgba(200,120,140,0.08)" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#dc2626" }}>{declined.length}</div>
            <div style={{ fontSize: 11, color: "#9a7080", marginTop: 4 }}>✗ Declined</div>
          </div>
        </div>

        <div style={{ background: "linear-gradient(135deg,#c4607a,#e08090)", borderRadius: 16, padding: "20px 16px", textAlign: "center", marginBottom: 16, boxShadow: "0 4px 20px rgba(196,96,122,0.25)" }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#fff" }}>{totalGuests}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 4, fontWeight: 500 }}>Total Guests Attending (including families)</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "16px", textAlign: "center", boxShadow: "0 2px 16px rgba(200,120,140,0.08)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🍷</span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#3d1a2a" }}>{drinkingYes}</div>
              <div style={{ fontSize: 10, color: "#9a7080" }}>Drinking Alcohol</div>
            </div>
          </div>
          <div style={{ background: "#fff", borderRadius: 16, padding: "16px", textAlign: "center", boxShadow: "0 2px 16px rgba(200,120,140,0.08)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🥤</span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#3d1a2a" }}>{drinkingNo}</div>
              <div style={{ fontSize: 10, color: "#9a7080" }}>Non-Alcoholic</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 14 }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search guest by name..."
            style={{
              width: "100%", padding: "12px 18px", borderRadius: 12,
              border: "1px solid #f0d0d8", background: "#fff", color: "#3d1a2a",
              fontSize: 14, outline: "none", fontFamily: "'Inter',sans-serif",
            }}
          />
        </div>

        {/* Dual filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: '#9a8d7d', alignSelf: 'center', marginRight: 4 }}>Status:</span>
          <div onClick={() => setFilterResponse('all')} style={pillStyle(filterResponse === 'all')}>All</div>
          <div onClick={() => setFilterResponse('yes')} style={pillStyle(filterResponse === 'yes')}>✓ Attending</div>
          <div onClick={() => setFilterResponse('no')} style={pillStyle(filterResponse === 'no')}>✗ Not Attending</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 11, color: '#9a8d7d', alignSelf: 'center', marginRight: 4 }}>Drinks:</span>
          <div onClick={() => setFilterDrinking('all')} style={pillStyle(filterDrinking === 'all')}>All</div>
          <div onClick={() => setFilterDrinking('yes')} style={pillStyle(filterDrinking === 'yes')}>🍷 Yes</div>
          <div onClick={() => setFilterDrinking('no')} style={pillStyle(filterDrinking === 'no')}>🥤 No</div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button onClick={loadData} style={{
            fontSize: 12, color: "#c4607a", background: "transparent", border: "none",
            cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: 6,
          }}>
            ↻ Refresh
          </button>
        </div>

        {/* RSVP List */}
        {filteredRsvps.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, background: "#fff", borderRadius: 16, color: "#9a7080" }}>
            {rsvps.length === 0 ? "No RSVP responses yet. Share your invitation link with guests!" : "No guests match your filters."}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {filteredRsvps.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                style={{
                  background: "#fff", borderRadius: 12, padding: "14px 18px",
                  display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10,
                  boxShadow: "0 2px 10px rgba(200,120,140,0.06)",
                }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#3d1a2a" }}>{r.guest_name}</div>
                    {r.response === 'yes' && r.guest_count > 1 && (
                      <div style={{ padding: "2px 9px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: "#f3e8ff", color: "#7c3aed" }}>
                        👥 {r.guest_count}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "#c4a0b0", marginTop: 2 }}>
                    {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} at{' '}
                    {new Date(r.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {r.response === 'yes' && r.drinking && (
                    <div style={{
                      padding: "6px 12px", borderRadius: 100, fontSize: 11, fontWeight: 600,
                      background: r.drinking === 'yes' ? '#fef3c7' : '#e0f2fe',
                      color: r.drinking === 'yes' ? '#b45309' : '#0369a1',
                    }}>
                      {r.drinking === 'yes' ? '🍷 Drinks' : '🥤 No Drinks'}
                    </div>
                  )}
                  <div style={{
                    padding: "6px 14px", borderRadius: 100, fontSize: 12, fontWeight: 600,
                    background: r.response === 'yes' ? '#dcfce7' : '#fee2e2',
                    color: r.response === 'yes' ? '#16a34a' : '#dc2626',
                  }}>
                    {r.response === 'yes' ? '✓ Attending' : '✗ Not Attending'}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 40, fontSize: 11, color: "#c4a0b0" }}>
          Auto-refreshes every 30 seconds · InviteGlow Dashboard
        </div>
      </div>
    </div>
  )
}