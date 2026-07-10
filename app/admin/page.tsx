"use client"
import { useState, useEffect, useRef } from 'react'
import { supabase, Couple, RSVP, Review } from '@/lib/supabase'

const TEMPLATES = [
  { id: 'floral-romance', name: 'Floral Romance (Pink)' },
  { id: 'elegant-photo', name: 'Elegant Photo Hero' },
  { id: 'cinematic-gold', name: 'Cinematic Gold (Scratch to Reveal)' },
  { id: 'kandyan-heritage', name: 'Kandyan Heritage (Temple Doors)' },
  { id: 'twilight-picnic', name: 'Twilight Picnic (After-Party)' },
  { id: 'golden-garden', name: 'Golden Garden (Floral Arch)' },
  { id: 'ocean-pearl', name: 'Ocean Pearl (Beach Elegance)' },
  { id: 'sunset-shores', name: 'Sunset Shores (Bali Sunset)' },
  { id: 'traditional-ceylon', name: 'Traditional Ceylon (Kandyan Culture)' },
  { id: 'sacred-poruwa', name: 'Sacred Poruwa (Kandyan Sunset)' },
]

const BUCKET = 'wedding-photos'

const emptyForm = {
  slug: '',
  template: 'floral-romance',
  bride: '',
  groom: '',
  bride_family: '',
  groom_family: '',
  bride_phone: '',
  groom_phone: '',
  wedding_date: '',
  venue: '',
  venue_address: '',
  maps_url: '',
  couple_photo: '',
  song_title: '',
  song_artist: '',
  song_url: '',
  gallery: [] as string[],
  timeline: [
    { id: 1, enabled: true, time: '9:55 AM', event: 'Poruwa Ceremony' },
    { id: 2, enabled: false, time: '12:00 PM', event: 'Lunch' },
    { id: 3, enabled: false, time: '1:00 PM', event: 'Dancing Floor Starts' },
    { id: 4, enabled: false, time: '3:30 PM', event: 'Going Away' },
  ] as { id: number; enabled: boolean; time: string; event: string }[],
  seats: '',
  pin: '',
  ask_drinking: false,
  show_seating: false,
  section_visibility: {
    gallery: true,
    countdown: true,
    timeline: true,
    seat_finder: true,
    music: true,
    thank_you: true,
  },
  events: {
    engagement: { enabled: false, venue: '', venue_address: '', date: '', maps_url: '' },
    wedding: { enabled: true, venue: '', venue_address: '', date: '', maps_url: '' },
    homecoming: { enabled: false, venue: '', venue_address: '', date: '', maps_url: '' },
  } as Record<'engagement' | 'wedding' | 'homecoming', { enabled: boolean; venue: string; venue_address: string; date: string; maps_url: string }>,
  intro_text: '',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 8,
  border: '1px solid #e2e8f0', fontSize: 14, outline: 'none',
  fontFamily: "'Inter',sans-serif", marginBottom: 4,
}
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block',
}
const fieldWrap: React.CSSProperties = { marginBottom: 16 }

function generatePin() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

// Upload a file to Supabase Storage, return the public URL
async function uploadToStorage(file: File, folder: string): Promise<string | null> {
  const ext = file.name.split('.').pop()
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, { cacheControl: '3600', upsert: false })
  if (error) {
    console.error('Upload error:', error)
    return null
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
  return data.publicUrl
}

// ── Single photo uploader (couple photo) ──
function PhotoUploader({ value, onChange, label, hint }: { value: string; onChange: (url: string) => void; label: string; hint: string }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setUploading(true)
    const url = await uploadToStorage(file, 'couple')
    setUploading(false)
    if (url) onChange(url)
  }

  return (
    <div style={fieldWrap}>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {value && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={value} alt="Preview" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', border: '1px solid #e2e8f0' }} />
        )}
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          style={{
            padding: '10px 18px', borderRadius: 8, border: '1px solid #e2e8f0', background: uploading ? '#f1f5f9' : '#fff',
            cursor: uploading ? 'default' : 'pointer', fontSize: 13, color: '#475569', fontWeight: 500,
          }}>
          {uploading ? 'Uploading...' : value ? '📷 Change Photo' : '📷 Upload Photo'}
        </button>
        {value && (
          <button type="button" onClick={() => onChange('')} style={{ fontSize: 12, color: '#dc2626', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            Remove
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      </div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{hint}</div>
    </div>
  )
}

// ── Multi-photo gallery uploader ──
function GalleryUploader({ value, onChange }: { value: string[]; onChange: (urls: string[]) => void }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList) => {
    setUploading(true)
    const uploaded: string[] = []
    for (const file of Array.from(files)) {
      const url = await uploadToStorage(file, 'gallery')
      if (url) uploaded.push(url)
    }
    setUploading(false)
    onChange([...value, ...uploaded])
  }

  const removePhoto = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx))
  }

  return (
    <div style={fieldWrap}>
      <label style={labelStyle}>Gallery Photos</label>

      {value.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(70px,1fr))', gap: 8, marginBottom: 12 }}>
          {value.map((url, i) => (
            <div key={i} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button type="button" onClick={() => removePhoto(i)} style={{
                position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%',
                background: 'rgba(220,38,38,0.9)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11, lineHeight: 1,
              }}>✕</button>
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
        style={{
          padding: '10px 18px', borderRadius: 8, border: '1px solid #e2e8f0', background: uploading ? '#f1f5f9' : '#fff',
          cursor: uploading ? 'default' : 'pointer', fontSize: 13, color: '#475569', fontWeight: 500,
        }}>
        {uploading ? 'Uploading...' : '📷 Add Gallery Photos'}
      </button>
      <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
        onChange={e => { const f = e.target.files; if (f && f.length) handleFiles(f) }} />
      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>You can select multiple photos at once. First photo appears largest in the gallery.</div>
    </div>
  )
}

// ── Timeline picker: toggle standard events on/off, edit times, add custom events ──
type TimelineItem = { id: number; enabled: boolean; time: string; event: string }

function TimelinePicker({ value, onChange }: { value: TimelineItem[]; onChange: (items: TimelineItem[]) => void }) {
  const toggle = (id: number) => {
    onChange(value.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t))
  }
  const updateField = (id: number, field: 'time' | 'event', val: string) => {
    onChange(value.map(t => t.id === id ? { ...t, [field]: val } : t))
  }
  const removeItem = (id: number) => {
    onChange(value.filter(t => t.id !== id))
  }
  const addCustom = () => {
    const newId = Math.max(0, ...value.map(t => t.id)) + 1
    onChange([...value, { id: newId, enabled: true, time: '', event: '' }])
  }

  return (
    <div style={fieldWrap}>
      <label style={labelStyle}>Wedding Timeline</label>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>
        Tick the events that apply to this wedding, adjust the time, or add your own custom event.
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {value.map(item => (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
            background: item.enabled ? '#fdf2f8' : '#f8fafc', borderRadius: 10,
            border: `1px solid ${item.enabled ? '#fbcfe8' : '#e2e8f0'}`,
          }}>
            <input
              type="checkbox"
              checked={item.enabled}
              onChange={() => toggle(item.id)}
              style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#c4607a', flexShrink: 0 }}
            />
            <input
              value={item.time}
              onChange={e => updateField(item.id, 'time', e.target.value)}
              placeholder="9:55 AM"
              disabled={!item.enabled}
              style={{
                width: 90, padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0',
                fontSize: 13, outline: 'none', fontFamily: "'Inter',sans-serif",
                background: item.enabled ? '#fff' : '#f1f5f9', color: item.enabled ? '#0f172a' : '#94a3b8',
                flexShrink: 0,
              }}
            />
            <input
              value={item.event}
              onChange={e => updateField(item.id, 'event', e.target.value)}
              placeholder="Event name"
              disabled={!item.enabled}
              style={{
                flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0',
                fontSize: 13, outline: 'none', fontFamily: "'Inter',sans-serif",
                background: item.enabled ? '#fff' : '#f1f5f9', color: item.enabled ? '#0f172a' : '#94a3b8',
              }}
            />
            <button type="button" onClick={() => removeItem(item.id)}
              style={{
                width: 26, height: 26, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: '#fee2e2', color: '#dc2626', fontSize: 12, flexShrink: 0,
              }}>✕</button>
          </div>
        ))}
      </div>
      <button type="button" onClick={addCustom} style={{
        marginTop: 10, padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0',
        background: '#fff', cursor: 'pointer', fontSize: 13, color: '#475569', fontWeight: 500,
      }}>
        + Add Custom Event
      </button>
    </div>
  )
}

// ── RSVP Manager: lets the admin view and delete individual guest RSVP
// entries for a couple. Loads on demand when the edit form opens for that
// couple, rather than being fetched for every couple in the list view. ──
function RsvpManager({ coupleId }: { coupleId: string }) {
  const [rsvps, setRsvps] = useState<RSVP[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadRsvps = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('rsvps').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false })
    if (!error && data) setRsvps(data as RSVP[])
    setLoading(false)
  }

  useEffect(() => { loadRsvps() }, [coupleId])

  const handleDelete = async (id: string, guestName: string) => {
    if (!confirm(`Delete ${guestName}'s RSVP? This cannot be undone.`)) return
    setDeletingId(id)
    const { error } = await supabase.from('rsvps').delete().eq('id', id)
    setDeletingId(null)
    if (!error) setRsvps(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div style={fieldWrap}>
      <label style={labelStyle}>Guest RSVPs ({rsvps.length})</label>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>
        Remove a guest's response here — useful for test entries or duplicate submissions.
      </div>
      {loading ? (
        <div style={{ fontSize: 13, color: '#94a3b8', padding: 12 }}>Loading...</div>
      ) : rsvps.length === 0 ? (
        <div style={{ fontSize: 13, color: '#94a3b8', padding: 12, background: '#f8fafc', borderRadius: 10 }}>No RSVPs yet for this invitation.</div>
      ) : (
        <div style={{ display: 'grid', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
          {rsvps.map(r => (
            <div key={r.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
              padding: '10px 12px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0',
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{r.guest_name}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                  {r.response === 'yes' ? `✓ Attending · ${r.guest_count} guest${r.guest_count > 1 ? 's' : ''}` : '✗ Not attending'}
                  {r.drinking ? ` · ${r.drinking}` : ''}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(r.id, r.guest_name)}
                disabled={deletingId === r.id}
                style={{
                  padding: '6px 14px', borderRadius: 8, border: '1px solid #fecaca', cursor: 'pointer',
                  background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 500, flexShrink: 0,
                  opacity: deletingId === r.id ? 0.6 : 1,
                }}>
                {deletingId === r.id ? '...' : 'Delete'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Pending Reviews Manager: approve/reject reviews submitted via the public
// homepage form. Shows pending reviews by default with an option to view
// approved/rejected ones too, so the admin can revisit a decision. ──
function PendingReviewsManager() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [actingId, setActingId] = useState<string | null>(null)

  const loadReviews = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false })
    if (!error && data) setReviews(data as Review[])
    setLoading(false)
  }

  useEffect(() => { loadReviews() }, [])

  const setStatus = async (id: string, status: 'approved' | 'rejected') => {
    setActingId(id)
    const { error } = await supabase.from('reviews').update({ status }).eq('id', id)
    setActingId(null)
    if (!error) setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Permanently delete ${name}'s review?`)) return
    setActingId(id)
    const { error } = await supabase.from('reviews').delete().eq('id', id)
    setActingId(null)
    if (!error) setReviews(prev => prev.filter(r => r.id !== id))
  }

  const filtered = reviews.filter(r => r.status === filter)
  const pendingCount = reviews.filter(r => r.status === 'pending').length

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 32, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
          ⭐ Site Reviews {pendingCount > 0 && <span style={{ color: '#dc2626' }}>({pendingCount} pending)</span>}
        </h2>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['pending', 'approved', 'rejected'] as const).map(s => (
            <button key={s} type="button" onClick={() => setFilter(s)} style={{
              padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: filter === s ? 'none' : '1px solid #e2e8f0',
              background: filter === s ? '#c4607a' : '#fff',
              color: filter === s ? '#fff' : '#475569',
            }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: '#94a3b8', padding: 12 }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ fontSize: 13, color: '#94a3b8', padding: 12, background: '#f8fafc', borderRadius: 10 }}>No {filter} reviews.</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.map(r => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, padding: '14px 16px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 240 }}>
                {r.photo_url && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={r.photo_url} alt={r.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                )}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{r.name}</span>
                    <span style={{ fontSize: 12, color: '#f59e0b' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#475569', marginTop: 4, lineHeight: 1.5 }}>{r.review_text}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                    {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {r.status !== 'approved' && (
                  <button type="button" onClick={() => setStatus(r.id, 'approved')} disabled={actingId === r.id}
                    style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#16a34a', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: actingId === r.id ? 0.6 : 1 }}>
                    ✓ Approve
                  </button>
                )}
                {r.status !== 'rejected' && (
                  <button type="button" onClick={() => setStatus(r.id, 'rejected')} disabled={actingId === r.id}
                    style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: actingId === r.id ? 0.6 : 1 }}>
                    ✗ Reject
                  </button>
                )}
                <button type="button" onClick={() => handleDelete(r.id, r.name)} disabled={actingId === r.id}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 12, fontWeight: 500, cursor: 'pointer', opacity: actingId === r.id ? 0.6 : 1 }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Section Visibility Picker: toggle which optional sections show on the
// public invitation. RSVP is deliberately not here — it's always on. ──
type SectionVisibilityValue = {
  gallery: boolean
  countdown: boolean
  timeline: boolean
  seat_finder: boolean
  music: boolean
  thank_you: boolean
}

const SECTION_LABELS: { key: keyof SectionVisibilityValue; label: string; icon: string }[] = [
  { key: 'gallery', label: 'Photo Gallery', icon: '📷' },
  { key: 'countdown', label: 'Countdown Timer', icon: '⏳' },
  { key: 'timeline', label: 'Wedding Timeline', icon: '🗓️' },
  { key: 'seat_finder', label: 'Seat Finder', icon: '🪑' },
  { key: 'music', label: 'Background Music', icon: '🎵' },
  { key: 'thank_you', label: 'Thank You Note', icon: '🤍' },
]

function SectionTogglesPicker({ value, onChange }: { value: SectionVisibilityValue; onChange: (v: SectionVisibilityValue) => void }) {
  const toggle = (key: keyof SectionVisibilityValue) => {
    onChange({ ...value, [key]: !value[key] })
  }
  return (
    <div style={fieldWrap}>
      <label style={labelStyle}>Page Sections</label>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>
        Turn off any section the couple doesn't want on their invitation. RSVP always stays on.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {SECTION_LABELS.map(s => (
          <div key={s.key} onClick={() => toggle(s.key)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
            padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
            background: value[s.key] ? '#fdf2f8' : '#f8fafc',
            border: `1px solid ${value[s.key] ? '#fbcfe8' : '#e2e8f0'}`,
          }}>
            <span style={{ fontSize: 13, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{s.icon}</span>{s.label}
            </span>
            <div style={{
              width: 38, height: 22, borderRadius: 100, position: 'relative', flexShrink: 0,
              background: value[s.key] ? '#c4607a' : '#e2e8f0', transition: 'background 0.2s',
            }}>
              <div style={{
                width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3,
                left: value[s.key] ? 19 : 3, transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Events Picker: Engagement / Wedding / Homecoming, each with its own
// enabled flag, venue, address, date/time, and maps link. ──
type EventValue = { enabled: boolean; venue: string; venue_address: string; date: string; maps_url: string }
type EventsValue = Record<'engagement' | 'wedding' | 'homecoming', EventValue>

const EVENT_LABELS: { key: keyof EventsValue; label: string; icon: string }[] = [
  { key: 'engagement', label: 'Engagement', icon: '💍' },
  { key: 'wedding', label: 'Wedding', icon: '👰' },
  { key: 'homecoming', label: 'Homecoming', icon: '🏡' },
]

function EventsPicker({ value, onChange }: { value: EventsValue; onChange: (v: EventsValue) => void }) {
  const updateEvent = (key: keyof EventsValue, field: keyof EventValue, val: string | boolean) => {
    onChange({ ...value, [key]: { ...value[key], [field]: val } })
  }
  return (
    <div style={fieldWrap}>
      <label style={labelStyle}>Events</label>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>
        Add details for each event this couple is celebrating. Turn an event off if it doesn't apply — its card won't show on the invitation.
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        {EVENT_LABELS.map(ev => {
          const e = value[ev.key]
          return (
            <div key={ev.key} style={{
              borderRadius: 12, padding: 14, background: e.enabled ? '#fdf2f8' : '#f8fafc',
              border: `1px solid ${e.enabled ? '#fbcfe8' : '#e2e8f0'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: e.enabled ? 12 : 0 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{ev.icon}</span>{ev.label}
                </span>
                <div onClick={() => updateEvent(ev.key, 'enabled', !e.enabled)} style={{
                  width: 38, height: 22, borderRadius: 100, position: 'relative', flexShrink: 0, cursor: 'pointer',
                  background: e.enabled ? '#c4607a' : '#e2e8f0', transition: 'background 0.2s',
                }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3,
                    left: e.enabled ? 19 : 3, transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                  }} />
                </div>
              </div>
              {e.enabled && (
                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <input
                      placeholder="Venue name" value={e.venue}
                      onChange={ev2 => updateEvent(ev.key, 'venue', ev2.target.value)}
                      style={{ ...inputStyle, marginBottom: 0 }}
                    />
                    <input
                      type="datetime-local" value={e.date}
                      onChange={ev2 => updateEvent(ev.key, 'date', ev2.target.value)}
                      style={{ ...inputStyle, marginBottom: 0 }}
                    />
                  </div>
                  <input
                    placeholder="Venue address" value={e.venue_address}
                    onChange={ev2 => updateEvent(ev.key, 'venue_address', ev2.target.value)}
                    style={{ ...inputStyle, marginBottom: 0 }}
                  />
                  <input
                    placeholder="Google Maps URL" value={e.maps_url}
                    onChange={ev2 => updateEvent(ev.key, 'maps_url', ev2.target.value)}
                    style={{ ...inputStyle, marginBottom: 0 }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Music uploader: upload an audio file to Supabase Storage (guaranteed
// no CORS issues unlike Google Drive), or paste a YouTube link for embed. ──
function MusicUploader({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const [tab, setTab] = useState<'upload' | 'youtube'>(value.includes('youtube.com') || value.includes('youtu.be') ? 'youtube' : 'upload')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `music/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, { cacheControl: '3600', upsert: false })
    if (!error) {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
      onChange(data.publicUrl)
    }
    setUploading(false)
  }

  const isYouTube = value.includes('youtube.com') || value.includes('youtu.be')
  const isUploaded = value && !isYouTube

  return (
    <div style={{ marginTop: 12 }}>
      <label style={labelStyle}>Song File / YouTube Link</label>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {(['upload', 'youtube'] as const).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)} style={{
            padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            border: tab === t ? 'none' : '1px solid #e2e8f0',
            background: tab === t ? '#be185d' : '#fff',
            color: tab === t ? '#fff' : '#475569',
          }}>
            {t === 'upload' ? '📁 Upload Audio File' : '▶ YouTube Link'}
          </button>
        ))}
      </div>

      {tab === 'upload' && (
        <div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
              style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid #e2e8f0', background: uploading ? '#f1f5f9' : '#fff', cursor: uploading ? 'default' : 'pointer', fontSize: 13, color: '#475569', fontWeight: 500 }}>
              {uploading ? 'Uploading...' : isUploaded ? '🎵 Change Song' : '🎵 Upload Song'}
            </button>
            {isUploaded && (
              <>
                <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 500 }}>✓ Song uploaded</span>
                <button type="button" onClick={() => onChange('')} style={{ fontSize: 12, color: '#dc2626', background: 'transparent', border: 'none', cursor: 'pointer' }}>Remove</button>
              </>
            )}
          </div>
          <input ref={inputRef} type="file" accept="audio/*,.mp3,.wav,.aac,.m4a,.ogg" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
            Upload MP3, AAC, WAV, or M4A. File plays automatically when guests open the invitation.
          </div>
        </div>
      )}

      {tab === 'youtube' && (
        <div>
          <input
            style={inputStyle}
            placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
            value={isYouTube ? value : ''}
            onChange={e => onChange(e.target.value)}
          />
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
            YouTube link paste karakoat Music section eke embedded player ekak pennaawa (muted autoplay).
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  const [couples, setCouples] = useState<Couple[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const loadCouples = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('couples').select('*').order('created_at', { ascending: false })
    if (!error && data) setCouples(data as Couple[])
    setLoading(false)
  }

  useEffect(() => { loadCouples() }, [])

  const startNew = () => {
    setForm({ ...emptyForm, pin: generatePin() })
    setEditing('new')
  }

  const startEdit = (c: Couple) => {
    setForm({
      slug: c.slug,
      template: c.template,
      bride: c.bride,
      groom: c.groom,
      bride_family: c.bride_family || '',
      groom_family: c.groom_family || '',
      bride_phone: (c as any).bride_phone || '',
      groom_phone: (c as any).groom_phone || '',
      wedding_date: c.wedding_date ? c.wedding_date.slice(0, 16) : '',
      venue: c.venue || '',
      venue_address: c.venue_address || '',
      maps_url: c.maps_url || '',
      couple_photo: c.couple_photo || '',
      song_title: c.song_title || '',
      song_artist: c.song_artist || '',
      song_url: c.song_url || '',
      gallery: c.gallery || [],
      timeline: (() => {
        const defaults = [
          { label: 'Poruwa Ceremony', time: '9:55 AM' },
          { label: 'Lunch', time: '12:00 PM' },
          { label: 'Dancing Floor Starts', time: '1:00 PM' },
          { label: 'Going Away', time: '3:30 PM' },
        ]
        const existing = c.timeline || []
        const merged = defaults.map((d, i) => {
          const found = existing.find(e => e.event === d.label)
          return { id: i + 1, enabled: !!found, time: found ? found.time : d.time, event: d.label }
        })
        // Include any custom events the couple added beyond the defaults
        const customEvents = existing.filter(e => !defaults.some(d => d.label === e.event))
        const customMapped = customEvents.map((e, i) => ({ id: 100 + i, enabled: true, time: e.time, event: e.event }))
        return [...merged, ...customMapped]
      })(),
      seats: Object.entries(c.seats || {}).map(([k, v]) => `${k} | ${v}`).join('\n'),
      pin: c.pin || generatePin(),
      ask_drinking: c.ask_drinking || false,
      show_seating: c.show_seating || false,
      section_visibility: {
        gallery: c.section_visibility?.gallery ?? true,
        countdown: c.section_visibility?.countdown ?? true,
        timeline: c.section_visibility?.timeline ?? true,
        seat_finder: c.section_visibility?.seat_finder ?? true,
        music: c.section_visibility?.music ?? true,
        thank_you: c.section_visibility?.thank_you ?? true,
      },
      events: {
        engagement: {
          enabled: c.events?.engagement?.enabled ?? false,
          venue: c.events?.engagement?.venue ?? '',
          venue_address: c.events?.engagement?.venue_address ?? '',
          date: c.events?.engagement?.date ? c.events.engagement.date.slice(0, 16) : '',
          maps_url: c.events?.engagement?.maps_url ?? '',
        },
        wedding: {
          enabled: c.events?.wedding?.enabled ?? true,
          venue: c.events?.wedding?.venue ?? c.venue ?? '',
          venue_address: c.events?.wedding?.venue_address ?? c.venue_address ?? '',
          date: c.events?.wedding?.date ? c.events.wedding.date.slice(0, 16) : (c.wedding_date ? c.wedding_date.slice(0, 16) : ''),
          maps_url: c.events?.wedding?.maps_url ?? c.maps_url ?? '',
        },
        homecoming: {
          enabled: c.events?.homecoming?.enabled ?? false,
          venue: c.events?.homecoming?.venue ?? '',
          venue_address: c.events?.homecoming?.venue_address ?? '',
          date: c.events?.homecoming?.date ? c.events.homecoming.date.slice(0, 16) : '',
          maps_url: c.events?.homecoming?.maps_url ?? '',
        },
      },
      intro_text: c.intro_text ?? '',
    })
    setEditing(c.id)
  }

  const handleSave = async () => {
    if (!form.slug || !form.bride || !form.groom || !form.wedding_date) {
      setMessage('⚠️ Please fill in Slug, Bride, Groom, and Wedding Date.')
      return
    }
    setSaving(true)
    setMessage('')

    const timelineArr = form.timeline
      .filter(t => t.enabled && t.time.trim() && t.event.trim())
      .map(t => ({ time: t.time.trim(), event: t.event.trim() }))
    const seatsObj: Record<string, string> = {}
    form.seats.split('\n').forEach(line => {
      const [name, table] = line.split('|').map(s => s.trim())
      if (name && table) seatsObj[name.toLowerCase()] = table
    })

    const payload = {
      slug: form.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      template: form.template,
      bride: form.bride,
      groom: form.groom,
      bride_family: form.bride_family || null,
      groom_family: form.groom_family || null,
      bride_phone: (form as any).bride_phone || null,
      groom_phone: (form as any).groom_phone || null,
      wedding_date: form.wedding_date,
      venue: form.venue || null,
      venue_address: form.venue_address || null,
      maps_url: form.maps_url || null,
      couple_photo: form.couple_photo || null,
      song_title: form.song_title || null,
      song_artist: form.song_artist || null,
      song_url: form.song_url || null,
      gallery: form.gallery,
      timeline: timelineArr,
      seats: seatsObj,
      pin: form.pin || generatePin(),
      ask_drinking: form.ask_drinking,
      show_seating: form.show_seating,
      section_visibility: form.section_visibility,
      events: form.events,
      intro_text: form.intro_text || null,
    }

    let error
    if (editing === 'new') {
      const res = await supabase.from('couples').insert([payload])
      error = res.error
    } else {
      const res = await supabase.from('couples').update(payload).eq('id', editing)
      error = res.error
    }

    setSaving(false)
    if (error) {
      setMessage('❌ Error: ' + error.message)
    } else {
      setMessage('✅ Saved successfully!')
      setEditing(null)
      loadCouples()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this invitation permanently?')) return
    await supabase.from('couples').delete().eq('id', id)
    loadCouples()
  }

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter',sans-serif", padding: '32px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: '2rem', color: '#c4607a' }}>InviteGlow Admin</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Manage wedding invitations</div>
          </div>
          {!editing && (
            <button onClick={startNew} style={{
              padding: '12px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#c4607a,#e08090)', color: '#fff', fontWeight: 600, fontSize: 14,
            }}>
              + New Invitation
            </button>
          )}
        </div>

        {!editing && <PendingReviewsManager />}

        {/* FORM */}
        {editing && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, marginBottom: 32, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#0f172a' }}>
              {editing === 'new' ? 'Create New Invitation' : 'Edit Invitation'}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={fieldWrap}>
                <label style={labelStyle}>Unique Link Slug *</label>
                <input style={inputStyle} placeholder="amara-roshan" value={form.slug}
                  onChange={e => setForm({ ...form, slug: e.target.value })} />
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Invite link: {siteUrl}/invite/{form.slug || 'your-slug'}</div>
              </div>

              <div style={fieldWrap}>
                <label style={labelStyle}>Template</label>
                <select style={inputStyle} value={form.template} onChange={e => setForm({ ...form, template: e.target.value })}>
                  {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div style={fieldWrap}>
                <label style={labelStyle}>Bride's Name *</label>
                <input style={inputStyle} placeholder="Amara" value={form.bride} onChange={e => setForm({ ...form, bride: e.target.value })} />
              </div>

              <div style={fieldWrap}>
                <label style={labelStyle}>Groom's Name *</label>
                <input style={inputStyle} placeholder="Roshan" value={form.groom} onChange={e => setForm({ ...form, groom: e.target.value })} />
              </div>

              <div style={fieldWrap}>
                <label style={labelStyle}>Bride's Family Name</label>
                <input style={inputStyle} placeholder="MR & MRS WANIGASOORIYA" value={form.bride_family} onChange={e => setForm({ ...form, bride_family: e.target.value })} />
              </div>

              <div style={fieldWrap}>
                <label style={labelStyle}>Groom's Family Name</label>
                <input style={inputStyle} placeholder="MR & MRS GAMGODA" value={form.groom_family} onChange={e => setForm({ ...form, groom_family: e.target.value })} />
              </div>

              <div style={fieldWrap}>
                <label style={labelStyle}>Groom's Phone Number</label>
                <input style={inputStyle} placeholder="0778509638" value={(form as any).groom_phone || ''} onChange={e => setForm({ ...form, groom_phone: e.target.value } as any)} />
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Shows "Call [Groom]" button on invitation cover. Leave empty to hide.</div>
              </div>

              <div style={fieldWrap}>
                <label style={labelStyle}>Bride's Phone Number</label>
                <input style={inputStyle} placeholder="0766128546" value={(form as any).bride_phone || ''} onChange={e => setForm({ ...form, bride_phone: e.target.value } as any)} />
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Shows "Call [Bride]" button on invitation cover. Leave empty to hide.</div>
              </div>

              <div style={fieldWrap}>
                <label style={labelStyle}>Wedding Date & Time *</label>
                <input type="datetime-local" style={inputStyle} value={form.wedding_date} onChange={e => setForm({ ...form, wedding_date: e.target.value })} />
              </div>

              <div style={fieldWrap}>
                <label style={labelStyle}>Venue Name</label>
                <input style={inputStyle} placeholder="The Kingsbury" value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} />
              </div>

              <div style={fieldWrap}>
                <label style={labelStyle}>Venue Address</label>
                <input style={inputStyle} placeholder="Janadhipathi Mawatha, Colombo" value={form.venue_address} onChange={e => setForm({ ...form, venue_address: e.target.value })} />
              </div>

              <div style={fieldWrap}>
                <label style={labelStyle}>Google Maps URL</label>
                <input style={inputStyle} placeholder="https://maps.google.com/?q=..." value={form.maps_url} onChange={e => setForm({ ...form, maps_url: e.target.value })} />
              </div>
            </div>

            {/* Couple Photo Upload */}
            <PhotoUploader
              value={form.couple_photo}
              onChange={url => setForm({ ...form, couple_photo: url })}
              label="Couple Photo (Hero Image)"
              hint="Leave empty to use the default AI-generated photo. Best results: portrait orientation, faces near the top third of the image."
            />

            {/* PIN */}
            <div style={fieldWrap}>
              <label style={labelStyle}>🔒 Dashboard PIN (4-digit)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input style={{ ...inputStyle, flex: 1 }} placeholder="1234" maxLength={4} value={form.pin}
                  onChange={e => setForm({ ...form, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
                <button type="button" onClick={() => setForm({ ...form, pin: generatePin() })}
                  style={{ padding: '0 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: 12, color: '#475569', whiteSpace: 'nowrap' }}>
                  🎲 New
                </button>
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Give this PIN to the couple — they'll use it to view their dashboard.</div>
            </div>

            {/* Drinking question toggle */}
            <div style={{ background: '#fffbeb', borderRadius: 12, padding: 16, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e', marginBottom: 4 }}>🍷 Ask Guests About Alcohol</div>
                <div style={{ fontSize: 11, color: '#a16207' }}>When enabled, guests who accept the RSVP will be asked if they'll be drinking alcohol. Only turn this on if the couple wants it.</div>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, ask_drinking: !form.ask_drinking })}
                style={{
                  width: 48, height: 28, borderRadius: 100, border: 'none', cursor: 'pointer', flexShrink: 0,
                  background: form.ask_drinking ? '#c4607a' : '#e2e8f0', position: 'relative', transition: 'background 0.2s',
                }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3,
                  left: form.ask_drinking ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </button>
            </div>

            {/* Seat assignment on/off toggle */}
            <div style={{ background: '#eef2ff', borderRadius: 12, padding: 16, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#3730a3', marginBottom: 4 }}>🪑 Show Seat Finder</div>
                <div style={{ fontSize: 11, color: '#4338ca' }}>When enabled, guests can search their name on the invitation to find their assigned table. Turn this off if seating hasn't been finalised yet.</div>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, show_seating: !form.show_seating })}
                style={{
                  width: 48, height: 28, borderRadius: 100, border: 'none', cursor: 'pointer', flexShrink: 0,
                  background: form.show_seating ? '#4f46e5' : '#e2e8f0', position: 'relative', transition: 'background 0.2s',
                }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3,
                  left: form.show_seating ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </button>
            </div>

            {/* Music section */}
            <div style={{ background: '#fdf2f8', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#be185d', marginBottom: 10 }}>🎵 Background Music</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Song Title</label>
                  <input style={inputStyle} placeholder="Leave empty for default" value={form.song_title} onChange={e => setForm({ ...form, song_title: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Artist</label>
                  <input style={inputStyle} placeholder="Leave empty for default" value={form.song_artist} onChange={e => setForm({ ...form, song_artist: e.target.value })} />
                </div>
              </div>
              <MusicUploader
                value={form.song_url}
                onChange={url => setForm({ ...form, song_url: url })}
              />
            </div>

            {/* Gallery Upload */}
            <GalleryUploader
              value={form.gallery}
              onChange={urls => setForm({ ...form, gallery: urls })}
            />

            <TimelinePicker
              value={form.timeline}
              onChange={items => setForm({ ...form, timeline: items })}
            />

            <EventsPicker
              value={form.events}
              onChange={v => setForm({ ...form, events: v })}
            />

            <SectionTogglesPicker
              value={form.section_visibility}
              onChange={v => setForm({ ...form, section_visibility: v })}
            />

            <div style={fieldWrap}>
              <label style={labelStyle}>Cover Intro Text</label>
              <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
                placeholder="Leave empty to use the theme's default line (e.g. Ocean Pearl: 'Where the tide meets eternity, we begin our forever')"
                value={form.intro_text} onChange={e => setForm({ ...form, intro_text: e.target.value })} />
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                Shown under the couple's names on the cover screen. Leave blank to use the template's default.
              </div>
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>Guest Seat Assignments (one per line: Name | Table)</label>
              <textarea style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }}
                placeholder={"amara | Table 3\nsilva | Table 7\nperera | Table 5"}
                value={form.seats} onChange={e => setForm({ ...form, seats: e.target.value })} />
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                Tip: turn on "🪑 Show Seat Finder" above once you're ready for guests to see this on the live invitation.
              </div>
            </div>

            {editing !== 'new' && <RsvpManager coupleId={editing as string} />}

            {message && <div style={{ marginBottom: 16, fontSize: 14, color: message.startsWith('✅') ? '#16a34a' : '#dc2626' }}>{message}</div>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleSave} disabled={saving} style={{
                padding: '12px 28px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg,#c4607a,#e08090)', color: '#fff', fontWeight: 600, fontSize: 14,
                opacity: saving ? 0.6 : 1,
              }}>
                {saving ? 'Saving...' : '💾 Save Invitation'}
              </button>
              <button onClick={() => { setEditing(null); setMessage('') }} style={{
                padding: '12px 28px', borderRadius: 10, border: '1px solid #e2e8f0', cursor: 'pointer',
                background: '#fff', color: '#475569', fontWeight: 500, fontSize: 14,
              }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* LIST */}
        {!editing && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Loading...</div>
            ) : couples.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                No invitations yet. Click "New Invitation" to create one.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {couples.map(c => (
                  <div key={c.id} style={{
                    background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #e2e8f0',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
                  }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                      {c.couple_photo && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={c.couple_photo} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover' }} />
                      )}
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{c.bride} &amp; {c.groom}</div>
                        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                          {new Date(c.wedding_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · {c.venue}
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
                          <a href={`/invite/${c.slug}`} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: 12, color: '#c4607a', textDecoration: 'none', fontWeight: 500 }}>
                            🔗 Invitation Link ↗
                          </a>
                          <a href={`/dashboard/${c.slug}`} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: 12, color: '#7c3aed', textDecoration: 'none', fontWeight: 500 }}>
                            📊 Dashboard ↗
                          </a>
                          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                            🔒 PIN: {c.pin || '----'}
                          </span>
                          {c.show_seating && (
                            <span style={{ fontSize: 12, color: '#4f46e5', fontWeight: 500 }}>
                              🪑 Seating On
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => startEdit(c)} style={{
                        padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'pointer',
                        background: '#f8fafc', color: '#475569', fontSize: 13, fontWeight: 500,
                      }}>Edit</button>
                      <button onClick={() => handleDelete(c.id)} style={{
                        padding: '8px 16px', borderRadius: 8, border: '1px solid #fecaca', cursor: 'pointer',
                        background: '#fef2f2', color: '#dc2626', fontSize: 13, fontWeight: 500,
                      }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
