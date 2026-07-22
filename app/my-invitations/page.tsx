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
const templateName = (id: string) => TEMPLATE_OPTIONS.find(t => t.id === id)?.name || id.replace(/-/g, ' ')

// Same number used in lib/socialLinks.ts — kept as a plain constant here
// too since this file doesn't otherwise import that shared file.
const ADMIN_WHATSAPP = '94770024484'

const BANK_ACCOUNTS = [
  { bank: 'Sampath Bank', accountName: 'InviteGlow (Pvt) Ltd', accountNumber: '1234 5678 9012' },
  { bank: 'HNB', accountName: 'InviteGlow (Pvt) Ltd', accountNumber: '9876 5432 1098' },
]

type MyCouple = {
  id: string; slug: string; bride: string; groom: string; wedding_date: string; venue: string | null
  template: string; couple_photo: string | null
  project_status: string; payment_slip_status: string; payment_slip_url: string | null
  customer_email: string | null; customer_phone: string | null
}

async function uploadPhoto(file: File): Promise<string | null> {
  const ext = file.name.split('.').pop()
  const fileName = `couple/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, { cacheControl: '3600', upsert: false })
  if (error) return null
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
  return data.publicUrl
}

// ── Tiny line-icon set — keeps the whole page emoji-free and consistent
// with the rest of the InviteGlow dashboard chrome. ──
type IconName = 'home' | 'invite' | 'users' | 'planning' | 'account' | 'chevron' | 'copy' | 'check' | 'cross' |
  'trash' | 'external' | 'sparkles' | 'edit' | 'link' | 'wallet' | 'heart' | 'chair' | 'gallery' | 'card' |
  'bell' | 'support' | 'settings' | 'signout' | 'plus' | 'camera'
function Icon({ name, size = 16, color = 'currentColor', strokeWidth = 1.8 }: { name: IconName; size?: number; color?: string; strokeWidth?: number }) {
  const c = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (name) {
    case 'home': return <svg {...c}><path d="M4 11l8-7 8 7" /><path d="M6 10v9a1 1 0 001 1h10a1 1 0 001-1v-9" /></svg>
    case 'invite': return <svg {...c}><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M4 7l8 6 8-6" /></svg>
    case 'users': return <svg {...c}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0111 0" /><path d="M15.5 8.2a3 3 0 010 5.8" /><path d="M15 20a5 5 0 016.5-4.8" /></svg>
    case 'planning': return <svg {...c}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 3.5h6a1 1 0 011 1V6H8V4.5a1 1 0 011-1z" /><path d="M8.5 12h7M8.5 15.5h7M8.5 8.5h3" /></svg>
    case 'account': return <svg {...c}><circle cx="12" cy="8.5" r="3.5" /><path d="M4.5 20a7.5 7.5 0 0115 0" /></svg>
    case 'chevron': return <svg {...c}><path d="M9 6l6 6-6 6" /></svg>
    case 'copy': return <svg {...c}><rect x="8.5" y="8.5" width="12" height="12" rx="2" /><path d="M15.5 8.5V5.8A1.8 1.8 0 0013.7 4H5.8A1.8 1.8 0 004 5.8v7.9A1.8 1.8 0 005.8 15.5H8.5" /></svg>
    case 'check': return <svg {...c}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
    case 'cross': return <svg {...c}><path d="M6 6l12 12M18 6L6 18" /></svg>
    case 'trash': return <svg {...c}><path d="M5 7h14" /><path d="M9 7V4.8A1.8 1.8 0 0110.8 3h2.4A1.8 1.8 0 0115 4.8V7" /><path d="M7 7l1 13.2A1.8 1.8 0 009.8 22h4.4a1.8 1.8 0 001.8-1.8L17 7" /></svg>
    case 'external': return <svg {...c}><path d="M14 4h6v6" /><path d="M20 4l-9 9" /><path d="M18 14v5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 014 19V8a1.5 1.5 0 011.5-1.5H10" /></svg>
    case 'sparkles': return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" /></svg>
    case 'edit': return <svg {...c}><path d="M4 20h4L18.5 9.5a2.1 2.1 0 00-3-3L5 17v3z" /><path d="M13.5 8l3 3" /></svg>
    case 'link': return <svg {...c}><path d="M9.5 14.5l5-5" /><path d="M13 6l1-1a3.5 3.5 0 015 5l-1 1" /><path d="M11 18l-1 1a3.5 3.5 0 01-5-5l1-1" /></svg>
    case 'wallet': return <svg {...c}><rect x="3" y="6.5" width="18" height="13" rx="2.5" /><path d="M3 10h18" /><circle cx="16.5" cy="14.5" r="1.2" fill="currentColor" stroke="none" /><path d="M7 6.5V5a1.5 1.5 0 011.5-1.5h7A1.5 1.5 0 0117 5v1.5" /></svg>
    case 'heart': return <svg {...c}><path d="M12 20.5s-7.5-4.9-9.8-9.3C.6 8 2 4.7 5.2 4a4.6 4.6 0 016.8 2.3A4.6 4.6 0 0118.8 4C22 4.7 23.4 8 21.8 11.2 19.5 15.6 12 20.5 12 20.5z" /></svg>
    case 'chair': return <svg {...c}><path d="M6 4v9a2 2 0 002 2h8a2 2 0 002-2V4" /><path d="M6 15v5M18 15v5M8 4h8" /></svg>
    case 'gallery': return <svg {...c}><rect x="3" y="4" width="18" height="15" rx="2" /><circle cx="8.5" cy="9.5" r="1.7" /><path d="M21 15l-5.5-5.5a1.5 1.5 0 00-2.1 0L4 19" /></svg>
    case 'card': return <svg {...c}><rect x="3" y="5.5" width="18" height="13" rx="2.2" /><path d="M3 9.5h18" /><path d="M6.5 14h4" /></svg>
    case 'bell': return <svg {...c}><path d="M6 10a6 6 0 0112 0c0 4 1.5 5.5 1.5 5.5h-15S6 14 6 10z" /><path d="M9.7 19a2.3 2.3 0 004.6 0" /></svg>
    case 'support': return <svg {...c}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3.2" /><path d="M5.6 5.6l3.4 3.4M18.4 5.6l-3.4 3.4M5.6 18.4l3.4-3.4M18.4 18.4l-3.4-3.4" /></svg>
    case 'settings': return <svg {...c}><circle cx="12" cy="12" r="3" /><path d="M19.4 13.5a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.9 2.9l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5v.2a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.6 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.9-2.9l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1h-.2a2 2 0 110-4h.1A1.7 1.7 0 004.6 8.5a1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.9-2.9l.1.1a1.7 1.7 0 001.9.3h.1a1.7 1.7 0 001-1.5v-.2a2 2 0 114 0v.1a1.7 1.7 0 001 1.6 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.9 2.9l-.1.1a1.7 1.7 0 00-.3 1.9v.1a1.7 1.7 0 001.5 1h.2a2 2 0 110 4h-.1a1.7 1.7 0 00-1.6 1z" /></svg>
    case 'signout': return <svg {...c}><path d="M9 4H6a2 2 0 00-2 2v12a2 2 0 002 2h3" /><path d="M15 16l4-4-4-4" /><path d="M19 12H9" /></svg>
    case 'plus': return <svg {...c}><path d="M12 5v14M5 12h14" /></svg>
    case 'camera': return <svg {...c}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7l1.5-3h5L16 7" /><circle cx="12" cy="13.5" r="3.5" /></svg>
    default: return null
  }
}

// ── Inline "Manage" panel — everything a self-service customer needs to
// change lives right here, no separate dashboard link required. ──
function ManagePanel({ couple, onSaved, autoOpenPayment }: { couple: MyCouple; onSaved: () => void; autoOpenPayment?: boolean }) {
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

  const [showPayment, setShowPayment] = useState(!!autoOpenPayment)
  const [slipFile, setSlipFile] = useState<File | null>(null)
  const [slipUploading, setSlipUploading] = useState(false)
  const [slipMessage, setSlipMessage] = useState('')
  const slipInputRef = useRef<HTMLInputElement>(null)

  const askSupportUrl = () => {
    const lines = [
      `Hi! I need help with my InviteGlow invitation.`,
      ``,
      `Couple: ${bride || couple.bride} & ${groom || couple.groom}`,
      `Wedding date: ${weddingDate || couple.wedding_date}`,
      `Venue: ${venue || couple.venue || '—'}`,
      `Template: ${templateName(template || couple.template)}`,
      `Link: /invite/${couple.slug}`,
      `Status: ${couple.project_status} · Payment: ${couple.payment_slip_status}`,
    ]
    return `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`
  }

  const handleSlipUpload = async () => {
    if (!slipFile) { setSlipMessage('Please choose an image of your bank slip first.'); return }
    setSlipUploading(true)
    setSlipMessage('')
    const ext = slipFile.name.split('.').pop()
    const fileName = `payment-slips/${couple.id}-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(fileName, slipFile, { cacheControl: '3600', upsert: false })
    if (uploadError) {
      setSlipUploading(false)
      setSlipMessage('Could not upload: ' + uploadError.message)
      return
    }
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
    const { error: updateError } = await supabase.from('couples').update({
      payment_slip_url: urlData.publicUrl, payment_slip_status: 'pending',
    }).eq('id', couple.id)
    setSlipUploading(false)
    if (updateError) {
      setSlipMessage('Could not save: ' + updateError.message)
    } else {
      setSlipMessage('Slip uploaded! We\'ll verify it shortly.')
      setSlipFile(null)
      onSaved()
    }
  }

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
            <div style={{ width: 48, height: 48, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="camera" size={18} color="#94a3b8" />
            </div>
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

      {/* ── Finalize ── */}
      <div style={{ borderTop: '1px solid #f1f5f9', marginTop: 20, paddingTop: 18 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>Finalize</div>

        <div style={{ display: 'grid', gap: 10, marginBottom: showPayment ? 14 : 0 }}>
          <a href={askSupportUrl()} target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 10,
            background: '#25d366', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 12.5,
          }}>Ask Support on WhatsApp</a>
          <button type="button" onClick={() => setShowPayment(!showPayment)} style={{
            padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#475569',
            fontWeight: 600, fontSize: 12.5, cursor: 'pointer',
          }}>{showPayment ? 'Hide Payment Details' : (couple.payment_slip_url ? 'Update Payment Slip' : 'Upload Payment Slip')}</button>
        </div>

        {showPayment && (
          <div style={{ background: '#f8fafc', borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Bank Transfer Details</div>
            <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
              {BANK_ACCOUNTS.map(b => (
                <div key={b.bank} style={{ background: '#fff', borderRadius: 8, padding: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#1e293b' }}>{b.bank}</div>
                  <div style={{ fontSize: 10.5, color: '#64748b' }}>{b.accountName}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: ACCENT, marginTop: 2 }}>{b.accountNumber}</div>
                </div>
              ))}
            </div>

            {couple.payment_slip_url && (
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>
                Current status: <strong style={{ color: couple.payment_slip_status === 'verified' ? '#16a34a' : couple.payment_slip_status === 'rejected' ? '#dc2626' : '#b45309' }}>{couple.payment_slip_status}</strong>
              </div>
            )}

            <div onClick={() => slipInputRef.current?.click()} style={{
              border: `1.5px dashed ${ACCENT}`, borderRadius: 10, padding: '14px 12px', textAlign: 'center', cursor: 'pointer',
              background: '#fff', marginBottom: 10,
            }}>
              {slipFile ? (
                <div style={{ fontSize: 12, color: '#1e293b', fontWeight: 600 }}>{slipFile.name}</div>
              ) : (
                <div style={{ fontSize: 12, color: '#64748b' }}>Tap to select an image of your bank slip</div>
              )}
              <input ref={slipInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setSlipFile(e.target.files?.[0] || null)} />
            </div>

            {slipMessage && <div style={{ fontSize: 11.5, marginBottom: 10, color: slipMessage.startsWith('Slip uploaded') ? '#16a34a' : '#dc2626' }}>{slipMessage}</div>}

            <button onClick={handleSlipUpload} disabled={slipUploading} style={{
              width: '100%', padding: 11, borderRadius: 10, border: 'none', cursor: 'pointer',
              background: '#1e293b', color: '#fff', fontWeight: 700, fontSize: 12.5, opacity: slipUploading ? 0.6 : 1,
            }}>{slipUploading ? 'Uploading...' : 'Submit Payment Slip'}</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Small reusable "hub" card — used on the Invitation / Guests / Planning
// landing screens, mirroring the reference app's 3-card layout. ──
function HubCard({ icon, title, subtitle, onClick, badge }: { icon: IconName; title: string; subtitle: string; onClick: () => void; badge?: string }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left',
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '16px 16px',
      cursor: 'pointer', marginBottom: 10,
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 12, background: `${ACCENT}14`, display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon name={icon} size={19} color={ACCENT} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{title}</div>
          {badge && <div style={{ fontSize: 10, fontWeight: 700, color: '#b45309', background: '#fef3c7', padding: '2px 8px', borderRadius: 100 }}>{badge}</div>}
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{subtitle}</div>
      </div>
      <Icon name="chevron" size={18} color="#cbd5e1" />
    </button>
  )
}

const NAV_ITEMS: { key: 'invitation' | 'guests' | 'planning'; label: string; icon: IconName }[] = [
  { key: 'invitation', label: 'Invitation', icon: 'invite' },
  { key: 'guests', label: 'Guests', icon: 'users' },
  { key: 'planning', label: 'Planning', icon: 'planning' },
]

export default function MyInvitationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [couples, setCouples] = useState<MyCouple[]>([])
  const [userEmail, setUserEmail] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [openPaymentFor, setOpenPaymentFor] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Top-level section, mirrors the reference app's bottom nav bar.
  const [section, setSection] = useState<'invitation' | 'guests' | 'planning'>('invitation')
  // Within "Invitation", whether we're on the 3-card hub or the actual list.
  const [invitationView, setInvitationView] = useState<'hub' | 'list'>('hub')
  const [accountOpen, setAccountOpen] = useState(false)
  // Which invitation the Guests / Planning hubs act on, when there's more than one.
  const [selectedCoupleId, setSelectedCoupleId] = useState<string>('')

  const load = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { router.push('/login'); return }
    setUserEmail(userData.user.email || '')
    const { data } = await supabase.from('couples').select('id, slug, bride, groom, wedding_date, venue, template, couple_photo, project_status, payment_slip_status, payment_slip_url, customer_email, customer_phone').eq('user_id', userData.user.id).order('created_at', { ascending: false })
    if (data) {
      setCouples(data as MyCouple[])
      if (data.length > 0) setSelectedCoupleId(prev => prev || data[0].id)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Delete the invitation for ${label}? This cannot be undone.`)) return
    const { error } = await supabase.from('couples').delete().eq('id', id)
    if (!error) {
      setCouples(prev => prev.filter(c => c.id !== id))
      if (expandedId === id) setExpandedId(null)
    }
  }

  const copyLink = async (c: MyCouple) => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/invite/${c.slug}` : `/invite/${c.slug}`
    await navigator.clipboard.writeText(url)
    setCopiedId(c.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const statusMeta: Record<string, { label: string; bg: string; color: string }> = {
    lead: { label: 'Draft', bg: '#fef3c7', color: '#b45309' },
    ongoing: { label: 'In Progress', bg: '#dbeafe', color: '#1d4ed8' },
    complete: { label: 'Live', bg: '#dcfce7', color: '#16a34a' },
    sample: { label: 'Sample', bg: '#ede9fe', color: '#6d28d9' },
  }
  const slipMeta: Record<string, { label: string; bg: string; color: string }> = {
    pending: { label: 'Payment pending review', bg: '#fef3c7', color: '#b45309' },
    verified: { label: 'Payment verified', bg: '#dcfce7', color: '#16a34a' },
    rejected: { label: 'Payment rejected — contact us', bg: '#fee2e2', color: '#dc2626' },
  }

  const dashboardUrl = (slug: string, tab?: string) => `/dashboard/${slug}${tab ? `?tab=${tab}` : ''}`
  const selectedCouple = couples.find(c => c.id === selectedCoupleId) || couples[0]

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',sans-serif", color: '#94a3b8' }}>Loading...</div>
  }

  const initials = userEmail ? userEmail[0].toUpperCase() : 'U'

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter',sans-serif", paddingBottom: 88 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Inter:wght@400;500;600;700;800&display=swap');`}</style>

      {/* ── HEADER ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: '1.7rem', color: ACCENT }}>InviteGlow</div>
        <button onClick={() => setAccountOpen(true)} style={{
          width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: `linear-gradient(135deg,${ACCENT},${ACCENT_LIGHT})`, color: '#fff', fontWeight: 700, fontSize: 13,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{initials}</button>
      </div>

      <div style={{ maxWidth: 620, margin: '0 auto', padding: '24px 20px 20px' }}>

        {/* ══════════ INVITATION SECTION ══════════ */}
        {section === 'invitation' && invitationView === 'hub' && (
          <>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: '0.05em', marginBottom: 4 }}>INVITATION</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Your invitation</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Choose a template, edit the details, or design your own.</div>
            </div>
            <HubCard icon="invite" title="My Invitations" subtitle="Browse, publish, share, or duplicate" onClick={() => setInvitationView('list')} />
            <HubCard icon="edit" title="Edit Invitation" subtitle="Names, date, venue, story and more" onClick={() => { setInvitationView('list'); if (couples.length === 1) setExpandedId(couples[0].id) }} />
            <HubCard icon="sparkles" title="Custom Design" subtitle="Personalize colors, fonts and layout" onClick={() => {
              if (couples.length === 1) window.open(dashboardUrl(couples[0].slug, 'edit'), '_blank')
              else setInvitationView('list')
            }} />
            {couples.length === 0 && (
              <div style={{ background: '#fff', borderRadius: 20, padding: 40, textAlign: 'center', border: '1px solid #e2e8f0', marginTop: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>Start your first invitation</div>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Design your wedding invitation in a few simple steps.</div>
                <a href="/create" style={{
                  display: 'inline-flex', padding: '12px 24px', borderRadius: 100, textDecoration: 'none',
                  background: `linear-gradient(135deg,${ACCENT},${ACCENT_LIGHT})`, color: '#fff', fontWeight: 700, fontSize: 13.5,
                }}>Create Invitation</a>
              </div>
            )}
          </>
        )}

        {section === 'invitation' && invitationView === 'list' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <button onClick={() => setInvitationView('hub')} style={{
                width: 32, height: 32, borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(180deg)',
              }}><Icon name="chevron" size={16} color="#475569" /></button>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>My Invitations</div>
                <div style={{ fontSize: 12.5, color: '#64748b' }}>{couples.length} invitation{couples.length !== 1 ? 's' : ''}</div>
              </div>
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
                  const isPublished = c.payment_slip_status === 'verified'
                  const link = typeof window !== 'undefined' ? `${window.location.origin}/invite/${c.slug}` : `invite/${c.slug}`
                  const linkDisplay = link.replace(/^https?:\/\//, '')
                  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=0&color=${ACCENT.replace('#', '')}&data=${encodeURIComponent(link)}`

                  return (
                    <div key={c.id} style={{ background: '#fff', borderRadius: 18, padding: 20, border: '1px solid #e2e8f0' }}>
                      {/* badges */}
                      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                        <div style={{ padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: pMeta.bg, color: pMeta.color }}>{pMeta.label}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600, background: '#f1f5f9', color: '#475569' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, display: 'inline-block' }} />
                          {templateName(c.template)}
                        </div>
                      </div>

                      {/* names + inline edit */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>{c.bride} &amp; {c.groom}</div>
                        <button onClick={() => setExpandedId(isExpanded ? null : c.id)} aria-label="Edit names" style={{
                          border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex',
                        }}><Icon name="edit" size={13} color="#94a3b8" /></button>
                      </div>
                      <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 14 }}>
                        {c.wedding_date ? new Date(c.wedding_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date not set'}
                        {c.venue ? ` · ${c.venue}` : ''}
                      </div>

                      {sMeta && (
                        <div style={{ marginBottom: 14, fontSize: 12, fontWeight: 600, color: sMeta.color, background: sMeta.bg, display: 'inline-block', padding: '4px 12px', borderRadius: 100 }}>{sMeta.label}</div>
                      )}

                      {/* link box + qr */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 12, marginBottom: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em', marginBottom: 3 }}>YOUR INVITATION LINK</div>
                          <div style={{ fontSize: 12.5, color: '#1e293b', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 8 }}>{linkDisplay}</div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => copyLink(c)} style={{
                              display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 100, border: 'none',
                              cursor: 'pointer', background: copiedId === c.id ? '#16a34a' : ACCENT, color: '#fff', fontSize: 11.5, fontWeight: 600,
                            }}>
                              <Icon name={copiedId === c.id ? 'check' : 'copy'} size={12} color="#fff" />
                              {copiedId === c.id ? 'Copied' : 'Copy'}
                            </button>
                            <button onClick={() => window.open(dashboardUrl(c.slug, 'edit'), '_blank')} style={{
                              display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 100,
                              border: '1px solid #e2e8f0', cursor: 'pointer', background: '#fff', color: '#475569', fontSize: 11.5, fontWeight: 600,
                            }}>
                              <Icon name="sparkles" size={12} color="#475569" /> Customize
                            </button>
                          </div>
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qrSrc} alt="QR code" width={64} height={64} style={{ borderRadius: 8, background: '#fff', border: '1px solid #e2e8f0', flexShrink: 0 }} />
                      </div>

                      {/* actions */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        {!isPublished && (
                          <button onClick={() => { setExpandedId(c.id); setOpenPaymentFor(c.id) }} style={{
                            padding: '9px 16px', borderRadius: 100, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                            background: `linear-gradient(135deg,${ACCENT},${ACCENT_LIGHT})`, color: '#fff', border: 'none',
                            display: 'flex', alignItems: 'center', gap: 6,
                          }}><Icon name="card" size={13} color="#fff" /> Upgrade to publish</button>
                        )}
                        <button onClick={() => setExpandedId(isExpanded ? null : c.id)} style={{
                          padding: '9px 16px', borderRadius: 100, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                          background: isExpanded ? '#f1f5f9' : '#f8fafc', color: '#475569', border: '1px solid #e2e8f0',
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}><Icon name="edit" size={12} /> {isExpanded ? 'Close' : 'Edit'}</button>
                        <a href={`/invite/${c.slug}`} target="_blank" rel="noopener noreferrer" style={{
                          padding: '9px 16px', borderRadius: 100, fontSize: 12.5, fontWeight: 600, textDecoration: 'none',
                          border: `1.5px solid ${ACCENT}`, color: ACCENT, display: 'flex', alignItems: 'center', gap: 6,
                        }}><Icon name="external" size={12} color={ACCENT} /> Preview</a>
                        <button onClick={() => handleDelete(c.id, `${c.bride} & ${c.groom}`)} aria-label="Delete invitation" style={{
                          marginLeft: 'auto', width: 34, height: 34, borderRadius: 10, border: '1px solid #fecaca',
                          background: '#fef2f2', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}><Icon name="trash" size={13} color="#dc2626" /></button>
                      </div>

                      {isExpanded && <ManagePanel couple={c} onSaved={load} autoOpenPayment={openPaymentFor === c.id} />}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ══════════ GUESTS SECTION ══════════ */}
        {section === 'guests' && (
          <>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: '0.05em', marginBottom: 4 }}>GUESTS</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Guest management</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Share links, track RSVPs, and review what guests send in.</div>
            </div>

            {couples.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 20, padding: 40, textAlign: 'center', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 13.5, color: '#64748b' }}>Create an invitation first to manage guests.</div>
              </div>
            ) : (
              <>
                {couples.length > 1 && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 5, display: 'block' }}>Managing guests for</label>
                    <select value={selectedCoupleId} onChange={e => setSelectedCoupleId(e.target.value)} style={{
                      width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13.5,
                      outline: 'none', fontFamily: "'Inter',sans-serif", color: '#1e293b', background: '#fff',
                    }}>
                      {couples.map(c => <option key={c.id} value={c.id}>{c.bride} &amp; {c.groom}</option>)}
                    </select>
                  </div>
                )}
                <HubCard icon="link" title="Guest List &amp; Links" subtitle="Generate personalised invitation links to share" onClick={() => selectedCouple && window.open(dashboardUrl(selectedCouple.slug, 'share'), '_blank')} />
                <HubCard icon="users" title="RSVP Management" subtitle="Track responses, search guests, remove entries" onClick={() => selectedCouple && window.open(dashboardUrl(selectedCouple.slug, 'guests'), '_blank')} />
                <HubCard icon="chair" title="Table Arrangement" subtitle="Seat your guests — managed from Edit Invitation" onClick={() => selectedCouple && window.open(dashboardUrl(selectedCouple.slug, 'edit'), '_blank')} />
                <HubCard icon="gallery" title="Guest Gallery" subtitle="Review and approve photos &amp; videos guests share" onClick={() => selectedCouple && window.open(dashboardUrl(selectedCouple.slug, 'wishes'), '_blank')} badge="Wishes" />
                <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 4, padding: '0 4px' }}>
                  Note: guests RSVP themselves on your live invitation link — there's no manual "add guest" step needed.
                </div>
              </>
            )}
          </>
        )}

        {/* ══════════ PLANNING SECTION ══════════ */}
        {section === 'planning' && (
          <>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: '0.05em', marginBottom: 4 }}>PLANNING</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Wedding planning</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Keep your budget and vendor payments organised in one place.</div>
            </div>

            {couples.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 20, padding: 40, textAlign: 'center', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 13.5, color: '#64748b' }}>Create an invitation first to start planning.</div>
              </div>
            ) : (
              <>
                {couples.length > 1 && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 5, display: 'block' }}>Planning for</label>
                    <select value={selectedCoupleId} onChange={e => setSelectedCoupleId(e.target.value)} style={{
                      width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13.5,
                      outline: 'none', fontFamily: "'Inter',sans-serif", color: '#1e293b', background: '#fff',
                    }}>
                      {couples.map(c => <option key={c.id} value={c.id}>{c.bride} &amp; {c.groom}</option>)}
                    </select>
                  </div>
                )}
                <HubCard icon="wallet" title="Wedding Budget Tracker" subtitle="Log expenses, vendors, and payment status" onClick={() => selectedCouple && window.open(dashboardUrl(selectedCouple.slug, 'budget'), '_blank')} />
              </>
            )}
          </>
        )}
      </div>

      {/* ── BOTTOM NAV ── */}
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, background: '#fff', borderTop: '1px solid #e2e8f0',
        display: 'flex', justifyContent: 'space-around', padding: '8px 6px calc(env(safe-area-inset-bottom,0px) + 8px)', zIndex: 30,
      }}>
        <button onClick={() => setSection('invitation')} style={navBtnStyle(false)}>
          <Icon name="home" size={19} color="#94a3b8" />
          <span style={navLabelStyle(false)}>Home</span>
        </button>
        {NAV_ITEMS.map(item => (
          <button key={item.key} onClick={() => { setSection(item.key); if (item.key === 'invitation') setInvitationView('hub') }} style={navBtnStyle(section === item.key)}>
            <Icon name={item.icon} size={19} color={section === item.key ? ACCENT : '#94a3b8'} />
            <span style={navLabelStyle(section === item.key)}>{item.label}</span>
          </button>
        ))}
        <button onClick={() => setAccountOpen(true)} style={navBtnStyle(false)}>
          <Icon name="account" size={19} color="#94a3b8" />
          <span style={navLabelStyle(false)}>Account</span>
        </button>
      </div>

      {/* ── ACCOUNT SHEET ── */}
      {accountOpen && (
        <div onClick={() => setAccountOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 40,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480,
            padding: '20px 20px calc(env(safe-area-inset-bottom,0px) + 20px)', animation: 'slideUp 0.2s ease-out',
          }}>
            <style>{`@keyframes slideUp { from { transform: translateY(24px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }`}</style>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg,${ACCENT},${ACCENT_LIGHT})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16,
                }}>{initials}</div>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: '#0f172a' }}>
                    {couples.length > 0 ? `${couples[0].bride} & ${couples[0].groom}` : 'Your Account'}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748b' }}>{userEmail}</div>
                </div>
              </div>
              <button onClick={() => setAccountOpen(false)} aria-label="Close" style={{
                border: 'none', background: '#f1f5f9', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Icon name="cross" size={14} color="#64748b" /></button>
            </div>

            <div style={{ display: 'grid', gap: 2 }}>
              <AccountRow icon="account" label="My Profile" badge="Coming soon" />
              <AccountRow icon="card" label="Plan &amp; Billing" badge="Coming soon" />
              <AccountRow icon="bell" label="Notifications" badge="Coming soon" />
              <AccountRow icon="support" label="Support" onClick={() => window.open(`https://wa.me/${ADMIN_WHATSAPP}`, '_blank')} />
              <AccountRow icon="settings" label="Settings" subtitle={couples.length ? 'PIN, template & more — in Edit Invitation' : undefined}
                onClick={() => { setAccountOpen(false); setSection('invitation'); setInvitationView('list'); if (couples.length === 1) setExpandedId(couples[0].id) }} />
              <div style={{ borderTop: '1px solid #f1f5f9', margin: '10px 0' }} />
              <AccountRow icon="signout" label="Sign Out" danger onClick={handleLogout} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function navBtnStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'transparent',
    border: 'none', cursor: 'pointer', padding: '6px 10px', minWidth: 56,
  }
}
function navLabelStyle(active: boolean): React.CSSProperties {
  return { fontSize: 10.5, fontWeight: active ? 700 : 500, color: active ? ACCENT : '#94a3b8' }
}

function AccountRow({ icon, label, subtitle, badge, danger, onClick }: { icon: IconName; label: string; subtitle?: string; badge?: string; danger?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} disabled={!onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: '11px 4px',
      background: 'transparent', border: 'none', cursor: onClick ? 'pointer' : 'default', opacity: onClick ? 1 : 0.55,
    }}>
      <Icon name={icon} size={17} color={danger ? '#dc2626' : '#475569'} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: danger ? '#dc2626' : '#1e293b' }}>{label}</div>
        {subtitle && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{subtitle}</div>}
      </div>
      {badge && <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: 100 }}>{badge}</div>}
    </button>
  )
}
