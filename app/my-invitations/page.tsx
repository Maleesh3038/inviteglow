"use client"
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const ACCENT = "#c4607a"
const ACCENT_LIGHT = "#e8a0b8"
const BUCKET = 'wedding-photos'

const TEMPLATE_OPTIONS = [
  { id: 'floral-romance', name: 'Floral Romance' },
  { id: 'elegant-photo', name: 'Elegant Photo Hero' },
  { id: 'cinematic-gold', name: 'Cinematic Gold' },
  { id: 'kandyan-heritage', name: 'Kandyan Heritage' },
  { id: 'twilight-picnic', name: 'Twilight Picnic' },
  { id: 'golden-garden', name: 'Golden Garden' },
  { id: 'ocean-pearl', name: 'Ocean Pearl' },
  { id: 'sunset-shores', name: 'Sunset Shores' },
  { id: 'traditional-ceylon', name: 'Traditional Ceylon' },
  { id: 'sacred-poruwa', name: 'Sacred Poruwa' },
  { id: 'blush-blossom', name: 'Blush Blossom' },
  { id: 'ceylon-elegance', name: 'Ceylon Elegance' },
  { id: 'eternal-bloom', name: 'Eternal Bloom' },
]

type MyCouple = {
  id: string; slug: string; bride: string; groom: string; wedding_date: string; venue: string | null
  template: string; couple_photo: string | null
  project_status: string; payment_slip_status: string
}

async function uploadPhoto(file: File): Promise<string | null> {
  const ext = file.name.split('.').pop()
  const fileName = `couple/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, { cacheControl: '3600', upsert: false })
  if (error) return null
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
  return data.publicUrl
}

// ── Inline "Manage" panel — everything a self-service customer needs to
// change lives right here, no separate dashboard link required. ──
function ManagePanel({ couple, onSaved }: { couple: MyCouple; onSaved: () => void }) {
  const [bride, setBride] = useState(couple.bride)
  const [groom, setGroom] = useState(couple.groom)
  const [weddingDate, setWeddingDate] = useState(couple.wedding_date ? couple.wedding_date.slice(0, 10) : '')
  const [venue, setVenue] = useState(couple.venue || '')
  const [template, setTemplate] = useState(couple.template)
  const [photo, setPhoto] = useState(couple.couple_photo || '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #e2e8f0',
    fontSize: 13.5, outline: 'none', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box', color: '#1e293b',
  }
  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 5, display: 'block' }

  const handlePhotoUpload = async (file: File) => {
    setUploading(true)
    const url = await uploadPhoto(file)
    setUploading(false)
    if (url) setPhoto(url)
  }

  const handleSave = async () => {
    if (!bride.trim() || !groom.trim() || !weddingDate) { setMessage("Please fill in the couple's names and wedding date."); return }
    setSaving(true)
    setMessage('')
    const { error } = await supabase.from('couples').update({
      bride: bride.trim(), groom: groom.trim(), wedding_date: weddingDate, venue: venue.trim() || null,
      template, couple_photo: photo || null,
    }).eq('id', couple.id)
    setSaving(false)
    if (error) {
      setMessage('Could not save: ' + error.message)
    } else {
      setMessage('Saved! Your invitation has been updated.')
      onSaved()
    }
  }

  return (
    <div style={{ borderTop: '1px solid #f1f5f9', marginTop: 16, paddingTop: 16 }}>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Couple Photo</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {photo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={photo} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', border: '1px solid #e2e8f0' }} />
          ) : (
            <div style={{ width: 48, height: 48, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }} />
          )}
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{
            padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 12, color: '#475569', fontWeight: 500,
          }}>{uploading ? 'Uploading...' : photo ? 'Change Photo' : 'Upload Photo'}</button>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f) }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Bride's Name</label>
          <input value={bride} onChange={e => setBride(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Groom's Name</label>
          <input value={groom} onChange={e => setGroom(e.target.value)} style={inputStyle} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Wedding Date</label>
          <input type="date" value={weddingDate} onChange={e => setWeddingDate(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Venue</label>
          <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="e.g. Cinnamon Grand, Colombo" style={inputStyle} />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Template</label>
        <select value={template} onChange={e => setTemplate(e.target.value)} style={inputStyle}>
          {TEMPLATE_OPTIONS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {message && <div style={{ fontSize: 12, marginBottom: 12, color: message.startsWith('Saved') ? '#16a34a' : '#dc2626' }}>{message}</div>}

      <button onClick={handleSave} disabled={saving} style={{
        width: '100%', padding: 12, borderRadius: 10, border: 'none', cursor: 'pointer',
        background: `linear-gradient(135deg,${ACCENT},${ACCENT_LIGHT})`, color: '#fff', fontWeight: 700, fontSize: 13,
        opacity: saving ? 0.6 : 1,
      }}>{saving ? 'Saving...' : 'Save Changes'}</button>
    </div>
  )
}

export default function MyInvitationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [couples, setCouples] = useState<MyCouple[]>([])
  const [userEmail, setUserEmail] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const load = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { router.push('/login'); return }
    setUserEmail(userData.user.email || '')
    const { data } = await supabase.from('couples').select('id, slug, bride, groom, wedding_date, venue, template, couple_photo, project_status, payment_slip_status').eq('user_id', userData.user.id).order('created_at', { ascending: false })
    if (data) setCouples(data as MyCouple[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const statusMeta: Record<string, { label: string; bg: string; color: string }> = {
    lead: { label: 'Under Review', bg: '#fef3c7', color: '#b45309' },
    ongoing: { label: 'In Progress', bg: '#dbeafe', color: '#1d4ed8' },
    complete: { label: 'Live', bg: '#dcfce7', color: '#16a34a' },
    sample: { label: 'Sample', bg: '#ede9fe', color: '#6d28d9' },
  }
  const slipMeta: Record<string, { label: string; bg: string; color: string }> = {
    pending: { label: 'Payment slip pending review', bg: '#fef3c7', color: '#b45309' },
    verified: { label: 'Payment verified', bg: '#dcfce7', color: '#16a34a' },
    rejected: { label: 'Payment slip rejected — contact us', bg: '#fee2e2', color: '#dc2626' },
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',sans-serif", color: '#94a3b8' }}>Loading...</div>
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: '1.7rem', color: ACCENT }}>InviteGlow</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 12.5, color: '#64748b' }}>{userEmail}</span>
          <button onClick={handleLogout} style={{ fontSize: 12.5, color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Log out</button>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Your Invitations</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Manage and preview your wedding invitation here.</div>
        </div>

        {couples.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 20, padding: 48, textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>Start your first invitation</div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Design your wedding invitation in a few simple steps.</div>
            <a href="/create" style={{
              display: 'inline-flex', padding: '12px 24px', borderRadius: 100, textDecoration: 'none',
              background: `linear-gradient(135deg,${ACCENT},${ACCENT_LIGHT})`, color: '#fff', fontWeight: 700, fontSize: 13.5,
            }}>Create Invitation</a>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {couples.map(c => {
              const pMeta = statusMeta[c.project_status] || statusMeta.lead
              const sMeta = c.payment_slip_status ? slipMeta[c.payment_slip_status] : null
              const isExpanded = expandedId === c.id
              return (
                <div key={c.id} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{c.bride} &amp; {c.groom}</div>
                      <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 2 }}>
                        {new Date(c.wedding_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · {c.template.replace(/-/g, ' ')}
                      </div>
                    </div>
                    <div style={{ padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: pMeta.bg, color: pMeta.color, whiteSpace: 'nowrap' }}>{pMeta.label}</div>
                  </div>
                  {sMeta && (
                    <div style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: sMeta.color, background: sMeta.bg, display: 'inline-block', padding: '4px 12px', borderRadius: 100 }}>{sMeta.label}</div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                    <a href={`/invite/${c.slug}`} target="_blank" rel="noopener noreferrer" style={{
                      padding: '8px 16px', borderRadius: 100, fontSize: 12.5, fontWeight: 600, textDecoration: 'none',
                      border: `1.5px solid ${ACCENT}`, color: ACCENT,
                    }}>Preview Invitation</a>
                    <button onClick={() => setExpandedId(isExpanded ? null : c.id)} style={{
                      padding: '8px 16px', borderRadius: 100, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                      background: isExpanded ? '#f1f5f9' : '#f8fafc', color: '#475569', border: '1px solid #e2e8f0',
                    }}>{isExpanded ? 'Close' : 'Manage Invitation'}</button>
                  </div>

                  {isExpanded && <ManagePanel couple={c} onSaved={load} />}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
