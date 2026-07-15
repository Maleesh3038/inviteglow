"use client"
import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase, Couple, RSVP, Review } from '@/lib/supabase'

const TEMPLATES = [
  { id: 'floral-romance', name: 'Floral Romance', tag: 'Most Popular', photo: '/images/hero-floral.png', demoSlug: 'kavindi-malina', color: '#c4607a' },
  { id: 'elegant-photo', name: 'Elegant Photo Hero', tag: 'Classic', photo: '/images/hero-elegant.png', demoSlug: 'sheneli-kevin', color: '#a8895a' },
  { id: 'cinematic-gold', name: 'Cinematic Gold', tag: 'Premium', photo: '/images/hero-cinematic.png', demoSlug: 'imesha-pasan', color: '#c9a96e' },
  { id: 'kandyan-heritage', name: 'Kandyan Heritage', tag: 'Sri Lankan', photo: '/images/hero-kandyan.png', demoSlug: 'irudaka-sachini', color: '#e8a060' },
  { id: 'twilight-picnic', name: 'Twilight Picnic', tag: 'After-Party', photo: '', demoSlug: '', color: '#f0a868' },
  { id: 'golden-garden', name: 'Golden Garden', tag: 'Floral Arch', photo: '/images/hero-golden-garden.png', demoSlug: 'sanjeewani-lalith', color: '#d4a857' },
  { id: 'ocean-pearl', name: 'Ocean Pearl', tag: 'Beach Elegance', photo: '/images/hero-ocean-pearl.png', demoSlug: 'akila-nethmi', color: '#2f7d9e' },
  { id: 'sunset-shores', name: 'Sunset Shores', tag: 'Bali Sunset', photo: '/images/hero-sunset-shores.png', demoSlug: 'manisha-sachin', color: '#e0795a' },
  { id: 'traditional-ceylon', name: 'Traditional Ceylon', tag: 'Kandyan Culture', photo: '/images/hero-traditional-ceylon.png', demoSlug: 'maheshi-dilip', color: '#2f4a35' },
  { id: 'sacred-poruwa', name: 'Sacred Poruwa', tag: 'Kandyan Sunset', photo: '/images/hero-sacred-poruwa.png', demoSlug: 'sandunika-geeth', color: '#c4956a' },
  { id: 'blush-blossom', name: 'Blush Blossom', tag: 'Cherry Blossom', photo: '/images/blush-blossom-cover-bg.png', demoSlug: '', color: '#c17d8a' },
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
  cover_badge_text: '',
  cover_background_image: '',
  project_status: 'lead' as 'lead' | 'sample' | 'ongoing' | 'complete',
  payment_status: 'unpaid' as 'unpaid' | 'partial' | 'paid',
  paid_amount: '',
  package_tier: '' as '' | 'starter' | 'premium' | 'luxury',
  admin_notes: '',
  enable_guest_links: true,
  enable_guest_wishes: true,
  show_wedding_note: true,
  wedding_note_text: '',
  wedding_note_background_image: '',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 8,
  border: '1px solid #e2e8f0', fontSize: 14, outline: 'none',
  fontFamily: "'Inter',sans-serif", marginBottom: 4, boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block',
}
const fieldWrap: React.CSSProperties = { marginBottom: 16 }
const ACCENT = '#6366f1'
const ACCENT_LIGHT = '#a5b4fc'

function generatePin() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

async function uploadToStorage(file: File, folder: string): Promise<string | null> {
  const ext = file.name.split('.').pop()
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, { cacheControl: '3600', upsert: false })
  if (error) { console.error('Upload error:', error); return null }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
  return data.publicUrl
}

// ── Clean line-style SVG icons — no emoji anywhere in this admin ──
type IconName = 'grid' | 'users' | 'template' | 'star' | 'chart' | 'calendar' | 'check' | 'cross' | 'camera' | 'music' | 'plus' | 'trash' | 'edit' | 'link' | 'external' | 'lock' | 'chair' | 'wine' | 'search' | 'x' | 'dice' | 'tag'
function Icon({ name, size = 16, color = 'currentColor', strokeWidth = 1.8 }: { name: IconName; size?: number; color?: string; strokeWidth?: number }) {
  const c = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (name) {
    case 'grid': return <svg {...c}><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></svg>
    case 'users': return <svg {...c}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0111 0" /><path d="M15.5 8.2a3 3 0 010 5.8" /><path d="M15 20a5 5 0 016.5-4.8" /></svg>
    case 'template': return <svg {...c}><rect x="3.5" y="3.5" width="17" height="17" rx="2.5" /><path d="M3.5 9h17" /><path d="M9 9v11.5" /></svg>
    case 'star': return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 2.5l3 6.3 6.7.9-4.9 4.7 1.2 6.9-6-3.2-6 3.2 1.2-6.9-4.9-4.7 6.7-.9z" /></svg>
    case 'chart': return <svg {...c}><path d="M4 20V10M11 20V4M18 20v-7" /><path d="M2 20h20" /></svg>
    case 'calendar': return <svg {...c}><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M16 3v4M8 3v4M3.5 9.5h17" /></svg>
    case 'check': return <svg {...c}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
    case 'cross': return <svg {...c}><path d="M6 6l12 12M18 6L6 18" /></svg>
    case 'camera': return <svg {...c}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7l1.5-3h5L16 7" /><circle cx="12" cy="13.5" r="3.5" /></svg>
    case 'music': return <svg {...c}><path d="M9.5 18V5.3l11-2v12.7" /><circle cx="6.5" cy="18" r="2.8" /><circle cx="17.5" cy="16" r="2.8" /></svg>
    case 'plus': return <svg {...c}><path d="M12 5v14M5 12h14" /></svg>
    case 'trash': return <svg {...c}><path d="M5 7h14" /><path d="M9 7V4.8A1.8 1.8 0 0110.8 3h2.4A1.8 1.8 0 0115 4.8V7" /><path d="M7 7l1 13.2A1.8 1.8 0 009.8 22h4.4a1.8 1.8 0 001.8-1.8L17 7" /></svg>
    case 'edit': return <svg {...c}><path d="M4 20h4L18.5 9.5a2.1 2.1 0 00-3-3L5 17v3z" /><path d="M13.5 8l3 3" /></svg>
    case 'link': return <svg {...c}><path d="M9.5 14.5l5-5" /><path d="M13 6l1-1a3.5 3.5 0 015 5l-1 1" /><path d="M11 18l-1 1a3.5 3.5 0 01-5-5l1-1" /></svg>
    case 'external': return <svg {...c}><path d="M9 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-3" /><path d="M14 4h6v6" /><path d="M20 4L10 14" /></svg>
    case 'lock': return <svg {...c}><rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M7.5 10.5V7a4.5 4.5 0 019 0v3.5" /></svg>
    case 'chair': return <svg {...c}><path d="M6 4v9a2 2 0 002 2h8a2 2 0 002-2V4" /><path d="M6 15v5M18 15v5M8 4h8" /></svg>
    case 'wine': return <svg {...c}><path d="M8 3h8l-1 7a3 3 0 01-6 0z" /><path d="M12 13v7M8.5 20h7" /></svg>
    case 'search': return <svg {...c}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.3-4.3" /></svg>
    case 'x': return <svg {...c}><path d="M6 6l12 12M18 6L6 18" /></svg>
    case 'dice': return <svg {...c}><rect x="4" y="4" width="16" height="16" rx="3" /><circle cx="9" cy="9" r="1" fill={color} /><circle cx="15" cy="9" r="1" fill={color} /><circle cx="9" cy="15" r="1" fill={color} /><circle cx="15" cy="15" r="1" fill={color} /><circle cx="12" cy="12" r="1" fill={color} /></svg>
    case 'tag': return <svg {...c}><path d="M20.5 12.5L12.5 20.5a2 2 0 01-2.8 0l-6.2-6.2a2 2 0 010-2.8l8-8H18a2.5 2.5 0 012.5 2.5v6z" /><circle cx="15" cy="8.5" r="1.4" fill={color} /></svg>
    default: return null
  }
}

// ── Single photo uploader ──
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
        {value ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={value} alt="Preview" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', border: '1px solid #e2e8f0' }} />
        ) : (
          <div style={{ width: 56, height: 56, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="camera" size={20} color="#94a3b8" />
          </div>
        )}
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 8, border: '1px solid #e2e8f0', background: uploading ? '#f1f5f9' : '#fff',
            cursor: uploading ? 'default' : 'pointer', fontSize: 13, color: '#475569', fontWeight: 500,
          }}>
          <Icon name="camera" size={14} />
          {uploading ? 'Uploading...' : value ? 'Change Photo' : 'Upload Photo'}
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

  const removePhoto = (idx: number) => onChange(value.filter((_, i) => i !== idx))

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
                background: 'rgba(220,38,38,0.9)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Icon name="x" size={10} color="#fff" /></button>
            </div>
          ))}
        </div>
      )}
      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 8, border: '1px solid #e2e8f0', background: uploading ? '#f1f5f9' : '#fff', cursor: uploading ? 'default' : 'pointer', fontSize: 13, color: '#475569', fontWeight: 500 }}>
        <Icon name="camera" size={14} />
        {uploading ? 'Uploading...' : 'Add Gallery Photos'}
      </button>
      <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
        onChange={e => { const f = e.target.files; if (f && f.length) handleFiles(f) }} />
      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>You can select multiple photos at once. First photo appears largest in the gallery.</div>
    </div>
  )
}

type TimelineItem = { id: number; enabled: boolean; time: string; event: string }

function TimelinePicker({ value, onChange }: { value: TimelineItem[]; onChange: (items: TimelineItem[]) => void }) {
  const toggle = (id: number) => onChange(value.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t))
  const updateField = (id: number, field: 'time' | 'event', val: string) => onChange(value.map(t => t.id === id ? { ...t, [field]: val } : t))
  const removeItem = (id: number) => onChange(value.filter(t => t.id !== id))
  const addCustom = () => {
    const newId = Math.max(0, ...value.map(t => t.id)) + 1
    onChange([...value, { id: newId, enabled: true, time: '', event: '' }])
  }
  const moveItem = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= value.length) return
    const next = [...value]
    ;[next[index], next[newIndex]] = [next[newIndex], next[index]]
    onChange(next)
  }

  return (
    <div style={fieldWrap}>
      <label style={labelStyle}>Wedding Timeline</label>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>Tick the events that apply, edit the text freely, adjust the time, add custom events, or reorder with the arrows.</div>
      <div style={{ display: 'grid', gap: 8 }}>
        {value.map((item, index) => (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
            background: item.enabled ? '#eef2ff' : '#f8fafc', borderRadius: 10,
            border: `1px solid ${item.enabled ? '#c7d2fe' : '#e2e8f0'}`,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
              <button type="button" onClick={() => moveItem(index, -1)} disabled={index === 0} aria-label="Move up" style={{
                width: 20, height: 16, borderRadius: 4, border: 'none', cursor: index === 0 ? 'default' : 'pointer',
                background: 'transparent', color: index === 0 ? '#cbd5e1' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6" /></svg>
              </button>
              <button type="button" onClick={() => moveItem(index, 1)} disabled={index === value.length - 1} aria-label="Move down" style={{
                width: 20, height: 16, borderRadius: 4, border: 'none', cursor: index === value.length - 1 ? 'default' : 'pointer',
                background: 'transparent', color: index === value.length - 1 ? '#cbd5e1' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
              </button>
            </div>
            <input type="checkbox" checked={item.enabled} onChange={() => toggle(item.id)}
              style={{ width: 18, height: 18, cursor: 'pointer', accentColor: ACCENT, flexShrink: 0 }} />
            <input value={item.time} onChange={e => updateField(item.id, 'time', e.target.value)} placeholder="9:55 AM" disabled={!item.enabled}
              style={{ width: 90, padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', fontFamily: "'Inter',sans-serif", background: item.enabled ? '#fff' : '#f1f5f9', color: item.enabled ? '#0f172a' : '#94a3b8', flexShrink: 0 }} />
            <input value={item.event} onChange={e => updateField(item.id, 'event', e.target.value)} placeholder="Event name" disabled={!item.enabled}
              style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', fontFamily: "'Inter',sans-serif", background: item.enabled ? '#fff' : '#f1f5f9', color: item.enabled ? '#0f172a' : '#94a3b8' }} />
            <button type="button" onClick={() => removeItem(item.id)} style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', cursor: 'pointer', background: '#fee2e2', color: '#dc2626', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="x" size={11} color="#dc2626" />
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={addCustom} style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#475569', fontWeight: 500 }}>
        <Icon name="plus" size={13} /> Add Custom Event
      </button>
    </div>
  )
}

// ── RSVP Manager ──
function RsvpManager({ coupleId }: { coupleId: string }) {
  const [rsvps, setRsvps] = useState<RSVP[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadRsvps = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('rsvps').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false })
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
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>Remove a guest's response here — useful for test entries or duplicates.</div>
      {loading ? (
        <div style={{ fontSize: 13, color: '#94a3b8', padding: 12 }}>Loading...</div>
      ) : rsvps.length === 0 ? (
        <div style={{ fontSize: 13, color: '#94a3b8', padding: 12, background: '#f8fafc', borderRadius: 10 }}>No RSVPs yet for this invitation.</div>
      ) : (
        <div style={{ display: 'grid', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
          {rsvps.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 12px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{r.guest_name}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                  {r.response === 'yes' ? `Attending · ${r.guest_count} guest${r.guest_count > 1 ? 's' : ''}` : 'Not attending'}
                  {r.drinking ? ` · ${r.drinking}` : ''}
                </div>
              </div>
              <button type="button" onClick={() => handleDelete(r.id, r.guest_name)} disabled={deletingId === r.id}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #fecaca', cursor: 'pointer', background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 500, flexShrink: 0, opacity: deletingId === r.id ? 0.6 : 1 }}>
                {deletingId === r.id ? '...' : 'Delete'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Pending Reviews Manager ──
// ── Pricing Plans Manager — lets admin edit prices, tags, and feature
// lists for the 3 pricing tiers shown on the public homepage. ──
type PricingPlan = { id: string; name: string; price: number; tag: string; features: string[]; color: string; display_order: number }

const DEFAULT_SEED_PLANS: Omit<PricingPlan, 'id'>[] = [
  { name: 'Starter', price: 3000, tag: '', features: ['1 template of your choice', 'RSVP tracking & guest list', 'Couple dashboard', 'Countdown timer', 'Up to 100 guests'], color: '#94a3b8', display_order: 0 },
  { name: 'Premium', price: 5000, tag: 'Most Popular', features: ['Everything in Starter', 'Guest personalised links ("Dear [Name]")', 'Photo gallery + background music', 'Link valid for 1 year', 'Unlimited guests'], color: '#c4607a', display_order: 1 },
  { name: 'Luxury', price: 8000, tag: '', features: ['Everything in Premium', 'Lifetime link — never expires', 'Guest Wishes & Messages wall', 'Full custom design & colors', 'Priority support'], color: '#8a6a2a', display_order: 2 },
]

function PricingManager() {
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [seeding, setSeeding] = useState(false)
  const [message, setMessage] = useState('')

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('pricing_plans').select('*').order('display_order', { ascending: true })
    if (error) {
      setMessage('Could not load pricing plans: ' + error.message + ' — has the pricing_plans table been created in Supabase yet?')
    } else if (data) {
      setPlans(data as PricingPlan[])
      setMessage('')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const seedDefaults = async () => {
    setSeeding(true)
    setMessage('')
    const { error } = await supabase.from('pricing_plans').insert(DEFAULT_SEED_PLANS)
    setSeeding(false)
    if (error) {
      setMessage('Could not create plans: ' + error.message + ' — make sure the pricing_plans table exists and allows inserts.')
    } else {
      load()
    }
  }

  const updatePlan = (id: string, field: keyof PricingPlan, value: any) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
  }
  const updateFeature = (id: string, idx: number, value: string) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, features: p.features.map((f, i) => i === idx ? value : f) } : p))
  }
  const addFeature = (id: string) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, features: [...p.features, ''] } : p))
  }
  const removeFeature = (id: string, idx: number) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, features: p.features.filter((_, i) => i !== idx) } : p))
  }

  const savePlan = async (plan: PricingPlan) => {
    setSavingId(plan.id)
    setMessage('')
    const { error } = await supabase.from('pricing_plans').update({
      name: plan.name, price: plan.price, tag: plan.tag || null,
      features: plan.features.filter(f => f.trim()), color: plan.color, display_order: plan.display_order,
    }).eq('id', plan.id)
    setSavingId(null)
    setMessage(error ? 'Error: ' + error.message : 'Saved! Changes are live on the homepage.')
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading...</div>

  if (plans.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: 14, color: '#475569', marginBottom: 16 }}>No pricing plans set up yet.</div>
        <button onClick={seedDefaults} disabled={seeding} style={{
          padding: '12px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg,#6366f1,#a5b4fc)', color: '#fff', fontWeight: 600, fontSize: 14, opacity: seeding ? 0.6 : 1,
        }}>
          {seeding ? 'Setting up...' : 'Create Starter / Premium / Luxury'}
        </button>
        {message && <div style={{ marginTop: 16, fontSize: 13, color: '#dc2626', maxWidth: 400, margin: '16px auto 0' }}>{message}</div>}
      </div>
    )
  }

  return (
    <div>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
        Changes here update the pricing shown on the public homepage in real time.
      </div>
      {message && <div style={{ marginBottom: 16, fontSize: 13, color: message.startsWith('Saved') ? '#16a34a' : '#dc2626' }}>{message}</div>}
      <div style={{ display: 'grid', gap: 16 }}>
        {plans.map(plan => (
          <div key={plan.id} style={{ background: '#fff', borderRadius: 16, padding: 22, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4, display: 'block' }}>Plan Name</label>
                <input value={plan.name} onChange={e => updatePlan(plan.id, 'name', e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4, display: 'block' }}>Price (LKR)</label>
                <input type="number" value={plan.price} onChange={e => updatePlan(plan.id, 'price', parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4, display: 'block' }}>Badge Tag (optional)</label>
                <input value={plan.tag} onChange={e => updatePlan(plan.id, 'tag', e.target.value)} placeholder="e.g. Most Popular"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 6, display: 'block' }}>Features</label>
            <div style={{ display: 'grid', gap: 8, marginBottom: 10 }}>
              {plan.features.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 8 }}>
                  <input value={f} onChange={e => updateFeature(plan.id, i, e.target.value)}
                    style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                  <button onClick={() => removeFeature(plan.id, i)} aria-label="Remove feature" style={{
                    width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', background: '#fee2e2', color: '#dc2626',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}><Icon name="x" size={13} color="#dc2626" /></button>
                </div>
              ))}
            </div>
            <button onClick={() => addFeature(plan.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
              background: '#f8fafc', cursor: 'pointer', fontSize: 12.5, color: '#475569', fontWeight: 500, marginBottom: 16,
            }}>
              <Icon name="plus" size={12} /> Add Feature
            </button>

            <button onClick={() => savePlan(plan)} disabled={savingId === plan.id} style={{
              padding: '10px 22px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#6366f1,#a5b4fc)', color: '#fff', fontWeight: 600, fontSize: 13,
              opacity: savingId === plan.id ? 0.6 : 1,
            }}>
              {savingId === plan.id ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

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
    <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
          Site Reviews {pendingCount > 0 && <span style={{ color: '#dc2626' }}>({pendingCount} pending)</span>}
        </h2>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['pending', 'approved', 'rejected'] as const).map(s => (
            <button key={s} type="button" onClick={() => setFilter(s)} style={{
              padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: filter === s ? 'none' : '1px solid #e2e8f0',
              background: filter === s ? ACCENT : '#fff',
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
                    <span style={{ display: 'flex', gap: 1 }}>
                      {Array.from({ length: 5 }).map((_, i) => <Icon key={i} name="star" size={11} color={i < r.rating ? '#f59e0b' : '#e2e8f0'} />)}
                    </span>
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
                    style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#16a34a', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: actingId === r.id ? 0.6 : 1 }}>Approve</button>
                )}
                {r.status !== 'rejected' && (
                  <button type="button" onClick={() => setStatus(r.id, 'rejected')} disabled={actingId === r.id}
                    style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: actingId === r.id ? 0.6 : 1 }}>Reject</button>
                )}
                <button type="button" onClick={() => handleDelete(r.id, r.name)} disabled={actingId === r.id}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 12, fontWeight: 500, cursor: 'pointer', opacity: actingId === r.id ? 0.6 : 1 }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

type SectionVisibilityValue = { gallery: boolean; countdown: boolean; timeline: boolean; seat_finder: boolean; music: boolean; thank_you: boolean }
const SECTION_LABELS: { key: keyof SectionVisibilityValue; label: string }[] = [
  { key: 'gallery', label: 'Photo Gallery' }, { key: 'countdown', label: 'Countdown Timer' },
  { key: 'timeline', label: 'Wedding Timeline' }, { key: 'seat_finder', label: 'Seat Finder' },
  { key: 'music', label: 'Background Music' }, { key: 'thank_you', label: 'Thank You Note' },
]

function SectionTogglesPicker({ value, onChange }: { value: SectionVisibilityValue; onChange: (v: SectionVisibilityValue) => void }) {
  const toggle = (key: keyof SectionVisibilityValue) => onChange({ ...value, [key]: !value[key] })
  return (
    <div style={fieldWrap}>
      <label style={labelStyle}>Page Sections</label>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>Turn off any section the couple doesn't want. RSVP always stays on.</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {SECTION_LABELS.map(s => (
          <div key={s.key} onClick={() => toggle(s.key)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
            padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
            background: value[s.key] ? '#eef2ff' : '#f8fafc',
            border: `1px solid ${value[s.key] ? '#c7d2fe' : '#e2e8f0'}`,
          }}>
            <span style={{ fontSize: 13, color: '#334155' }}>{s.label}</span>
            <div style={{ width: 38, height: 22, borderRadius: 100, position: 'relative', flexShrink: 0, background: value[s.key] ? ACCENT : '#e2e8f0', transition: 'background 0.2s' }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: value[s.key] ? 19 : 3, transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

type EventValue = { enabled: boolean; venue: string; venue_address: string; date: string; maps_url: string }
type EventsValue = Record<'engagement' | 'wedding' | 'homecoming', EventValue>
const EVENT_LABELS: { key: keyof EventsValue; label: string }[] = [
  { key: 'engagement', label: 'Engagement' }, { key: 'wedding', label: 'Wedding' }, { key: 'homecoming', label: 'Homecoming' },
]

function EventsPicker({ value, onChange }: { value: EventsValue; onChange: (v: EventsValue) => void }) {
  const updateEvent = (key: keyof EventsValue, field: keyof EventValue, val: string | boolean) => onChange({ ...value, [key]: { ...value[key], [field]: val } })
  return (
    <div style={fieldWrap}>
      <label style={labelStyle}>Events</label>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>Add details for each event. Turn one off if it doesn't apply.</div>
      <div style={{ display: 'grid', gap: 12 }}>
        {EVENT_LABELS.map(ev => {
          const e = value[ev.key]
          return (
            <div key={ev.key} style={{ borderRadius: 12, padding: 14, background: e.enabled ? '#eef2ff' : '#f8fafc', border: `1px solid ${e.enabled ? '#c7d2fe' : '#e2e8f0'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: e.enabled ? 12 : 0 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{ev.label}</span>
                <div onClick={() => updateEvent(ev.key, 'enabled', !e.enabled)} style={{ width: 38, height: 22, borderRadius: 100, position: 'relative', flexShrink: 0, cursor: 'pointer', background: e.enabled ? ACCENT : '#e2e8f0', transition: 'background 0.2s' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: e.enabled ? 19 : 3, transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
              {e.enabled && (
                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <input placeholder="Venue name" value={e.venue} onChange={ev2 => updateEvent(ev.key, 'venue', ev2.target.value)} style={{ ...inputStyle, marginBottom: 0 }} />
                    <input type="datetime-local" value={e.date} onChange={ev2 => updateEvent(ev.key, 'date', ev2.target.value)} style={{ ...inputStyle, marginBottom: 0 }} />
                  </div>
                  <input placeholder="Venue address" value={e.venue_address} onChange={ev2 => updateEvent(ev.key, 'venue_address', ev2.target.value)} style={{ ...inputStyle, marginBottom: 0 }} />
                  <input placeholder="Google Maps URL" value={e.maps_url} onChange={ev2 => updateEvent(ev.key, 'maps_url', ev2.target.value)} style={{ ...inputStyle, marginBottom: 0 }} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

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
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {(['upload', 'youtube'] as const).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)} style={{
            padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            border: tab === t ? 'none' : '1px solid #e2e8f0',
            background: tab === t ? ACCENT : '#fff', color: tab === t ? '#fff' : '#475569',
          }}>{t === 'upload' ? 'Upload Audio File' : 'YouTube Link'}</button>
        ))}
      </div>
      {tab === 'upload' && (
        <div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 8, border: '1px solid #e2e8f0', background: uploading ? '#f1f5f9' : '#fff', cursor: uploading ? 'default' : 'pointer', fontSize: 13, color: '#475569', fontWeight: 500 }}>
              <Icon name="music" size={14} />
              {uploading ? 'Uploading...' : isUploaded ? 'Change Song' : 'Upload Song'}
            </button>
            {isUploaded && (
              <>
                <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 500 }}>Song uploaded</span>
                <button type="button" onClick={() => onChange('')} style={{ fontSize: 12, color: '#dc2626', background: 'transparent', border: 'none', cursor: 'pointer' }}>Remove</button>
              </>
            )}
          </div>
          <input ref={inputRef} type="file" accept="audio/*,.mp3,.wav,.aac,.m4a,.ogg" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Upload MP3, AAC, WAV, or M4A. Plays automatically when guests open the invitation.</div>
        </div>
      )}
      {tab === 'youtube' && (
        <div>
          <input style={inputStyle} placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..." value={isYouTube ? value : ''} onChange={e => onChange(e.target.value)} />
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Paste a YouTube link for an embedded player (muted autoplay).</div>
        </div>
      )}
    </div>
  )
}

const NAV_TABS = [
  { key: 'overview', label: 'Overview', icon: 'grid' as const },
  { key: 'couples', label: 'Couples', icon: 'users' as const },
  { key: 'templates', label: 'Templates', icon: 'template' as const },
  { key: 'pricing', label: 'Pricing', icon: 'tag' as const },
  { key: 'reviews', label: 'Reviews', icon: 'star' as const },
]

export default function AdminPage() {
  const [couples, setCouples] = useState<Couple[]>([])
  const [allRsvps, setAllRsvps] = useState<{ couple_id: string; response: string; guest_count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'couples' | 'templates' | 'pricing' | 'reviews'>('overview')
  const [coupleSearch, setCoupleSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'lead' | 'sample' | 'ongoing' | 'complete'>('all')

  // ── Admin password gate ──
  // The real password is checked server-side (app/api/admin-auth/route.ts)
  // against process.env.ADMIN_PASSWORD, so it never ships in the client
  // bundle. Once unlocked, we remember it for this browser tab only
  // (sessionStorage) so a refresh doesn't force re-entry every time.
  const [unlocked, setUnlocked] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [passwordInput, setPasswordInput] = useState('')
  const [authError, setAuthError] = useState('')
  const [authChecking, setAuthChecking] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('inviteglow_admin_unlocked') === '1') {
      setUnlocked(true)
    }
    setCheckingSession(false)
  }, [])

  const checkPassword = async () => {
    if (!passwordInput.trim()) return
    setAuthChecking(true)
    setAuthError('')
    try {
      const res = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      })
      const data = await res.json()
      if (data.ok) {
        setUnlocked(true)
        sessionStorage.setItem('inviteglow_admin_unlocked', '1')
      } else {
        setAuthError(data.error || 'Incorrect password. Please try again.')
      }
    } catch {
      setAuthError('Could not verify password — please try again.')
    }
    setAuthChecking(false)
  }

  const loadCouples = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('couples').select('*').order('created_at', { ascending: false })
    if (!error && data) setCouples(data as Couple[])
    const { data: rsvpData } = await supabase.from('rsvps').select('couple_id, response, guest_count')
    if (rsvpData) setAllRsvps(rsvpData as any)
    setLoading(false)
  }

  useEffect(() => { loadCouples() }, [])

  const startNew = () => {
    setForm({ ...emptyForm, pin: generatePin() })
    setEditing('new')
    setActiveTab('couples')
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
      // Load the couple's actual saved timeline directly — every item is
      // equally editable/removable, nothing is pinned to a fixed "default"
      // label. (The old version re-merged against a hardcoded defaults
      // list matched by event name, so renaming an item like "Poruwa
      // Ceremony" caused it to reappear as an unchecked duplicate instead
      // of just updating in place.)
      timeline: (c.timeline && c.timeline.length > 0
        ? c.timeline.map((t, i) => ({ id: i + 1, enabled: true, time: t.time, event: t.event }))
        : emptyForm.timeline
      ),
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
      cover_badge_text: (c as any).cover_badge_text ?? '',
      cover_background_image: (c as any).cover_background_image ?? '',
      project_status: ((c as any).project_status ?? 'ongoing') as 'lead' | 'sample' | 'ongoing' | 'complete',
      payment_status: ((c as any).payment_status ?? 'unpaid') as 'unpaid' | 'partial' | 'paid',
      paid_amount: (c as any).paid_amount != null ? String((c as any).paid_amount) : '',
      package_tier: ((c as any).package_tier ?? '') as '' | 'starter' | 'premium' | 'luxury',
      admin_notes: (c as any).admin_notes ?? '',
      enable_guest_links: (c as any).enable_guest_links ?? true,
      enable_guest_wishes: (c as any).enable_guest_wishes ?? true,
      show_wedding_note: (c as any).show_wedding_note ?? true,
      wedding_note_text: (c as any).wedding_note_text ?? '',
      wedding_note_background_image: (c as any).wedding_note_background_image ?? '',
    })
    setEditing(c.id)
    setActiveTab('couples')
  }

  const handleSave = async () => {
    if (!form.slug || !form.bride || !form.groom || !form.wedding_date) {
      setMessage('Please fill in Slug, Bride, Groom, and Wedding Date.')
      return
    }
    setSaving(true)
    setMessage('')

    const timelineArr = form.timeline.filter(t => t.enabled && t.time.trim() && t.event.trim()).map(t => ({ time: t.time.trim(), event: t.event.trim() }))
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
      cover_badge_text: (form as any).cover_badge_text || null,
      cover_background_image: (form as any).cover_background_image || null,
      project_status: form.project_status || 'ongoing',
      payment_status: form.payment_status || 'unpaid',
      paid_amount: form.paid_amount ? parseFloat(form.paid_amount) : 0,
      package_tier: form.package_tier || null,
      admin_notes: form.admin_notes || null,
      enable_guest_links: form.enable_guest_links,
      enable_guest_wishes: form.enable_guest_wishes,
      show_wedding_note: (form as any).show_wedding_note,
      wedding_note_text: (form as any).wedding_note_text || null,
      wedding_note_background_image: (form as any).wedding_note_background_image || null,
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
      setMessage('Error: ' + error.message)
    } else {
      setMessage('Saved successfully!')
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

  // ── Platform-wide stats ──
  const stats = useMemo(() => {
    const now = new Date()
    const in30 = new Date(now.getTime() + 30 * 86400000)
    const upcoming = couples.filter(c => {
      const d = new Date(c.wedding_date)
      return d >= now && d <= in30
    }).length
    const totalRsvps = allRsvps.length
    const totalGuests = allRsvps.filter(r => r.response === 'yes').reduce((s, r) => s + (r.guest_count || 1), 0)
    const templateCounts: Record<string, number> = {}
    couples.forEach(c => { templateCounts[c.template] = (templateCounts[c.template] || 0) + 1 })
    const statusOf = (c: Couple) => ((c as any).project_status as string) || 'ongoing'
    const sampleCount = couples.filter(c => statusOf(c) === 'sample').length
    const ongoingCount = couples.filter(c => statusOf(c) === 'ongoing').length
    const completeCount = couples.filter(c => statusOf(c) === 'complete').length
    const leadCount = couples.filter(c => statusOf(c) === 'lead').length
    const realCount = ongoingCount + completeCount // real client work, excludes samples and leads
    const totalRevenue = couples.reduce((s, c) => s + (Number((c as any).paid_amount) || 0), 0)
    const PACKAGE_PRICES: Record<string, number> = { starter: 3000, premium: 5000, luxury: 8000 }
    const pendingRevenue = couples.reduce((s, c) => {
      const status = (c as any).payment_status || 'unpaid'
      if (status === 'paid') return s
      const tier = (c as any).package_tier as string | undefined
      const expected = tier ? PACKAGE_PRICES[tier] || 0 : 0
      const paid = Number((c as any).paid_amount) || 0
      return s + Math.max(0, expected - paid)
    }, 0)
    return { upcoming, totalRsvps, totalGuests, templateCounts, sampleCount, ongoingCount, completeCount, leadCount, realCount, totalRevenue, pendingRevenue }
  }, [couples, allRsvps])

  const filteredCouples = useMemo(() => {
    let result = couples
    if (statusFilter !== 'all') {
      result = result.filter(c => (((c as any).project_status as string) || 'ongoing') === statusFilter)
    }
    if (coupleSearch.trim()) {
      const q = coupleSearch.toLowerCase()
      result = result.filter(c => `${c.bride} ${c.groom} ${c.slug}`.toLowerCase().includes(q))
    }
    return result
  }, [couples, coupleSearch, statusFilter])

  if (checkingSession) {
    return <div style={{ minHeight: '100vh', background: '#f6f7fb' }} />
  }

  if (!unlocked) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f7fb', fontFamily: "'Inter',sans-serif", padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '2.5rem 2rem', maxWidth: 360, width: '100%', textAlign: 'center', boxShadow: '0 8px 32px rgba(15,23,42,0.1)' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${ACCENT}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Icon name="lock" size={24} color={ACCENT} />
          </div>
          <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: '1.8rem', color: ACCENT, marginBottom: 4 }}>InviteGlow</div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 24 }}>Enter the admin password to continue</div>
          <input
            type="password"
            value={passwordInput}
            onChange={e => { setPasswordInput(e.target.value); setAuthError('') }}
            onKeyDown={e => e.key === 'Enter' && checkPassword()}
            placeholder="Password"
            autoFocus
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 12, textAlign: 'center',
              fontSize: 15, border: `2px solid ${authError ? '#dc2626' : '#e2e8f0'}`,
              outline: 'none', marginBottom: 12, fontFamily: "'Inter',sans-serif", color: '#1e293b', boxSizing: 'border-box',
            }}
          />
          {authError && <div style={{ color: '#dc2626', fontSize: 12, marginBottom: 12 }}>{authError}</div>}
          <button onClick={checkPassword} disabled={authChecking} style={{
            width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: `linear-gradient(135deg,${ACCENT},${ACCENT_LIGHT})`, color: '#fff', fontWeight: 600, fontSize: 14,
            opacity: authChecking ? 0.6 : 1,
          }}>
            {authChecking ? 'Checking...' : 'Unlock Admin'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f6f7fb', fontFamily: "'Inter',sans-serif", overflowX: 'hidden' }}>
      <style>{`
        @media (max-width: 560px) { .admin-tab-label { display: none; } }
      `}</style>

      {/* ── NAV BAR ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: '1.7rem', color: ACCENT, lineHeight: 1 }}>InviteGlow</div>
            <div style={{ fontSize: 10, color: '#64748b' }}>Admin Dashboard</div>
          </div>

          <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 100, padding: 4 }}>
            {NAV_TABS.map(tab => (
              <button key={tab.key} onClick={() => { setActiveTab(tab.key as typeof activeTab); if (tab.key !== 'couples') setEditing(null) }} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 100,
                border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
                background: activeTab === tab.key ? '#fff' : 'transparent',
                color: activeTab === tab.key ? ACCENT : '#64748b',
                boxShadow: activeTab === tab.key ? '0 2px 8px rgba(15,23,42,0.08)' : 'none',
              }}>
                <Icon name={tab.icon} size={14} />
                <span className="admin-tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          <button onClick={startNew} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: `linear-gradient(135deg,${ACCENT},${ACCENT_LIGHT})`, color: '#fff', fontWeight: 600, fontSize: 13,
          }}>
            <Icon name="plus" size={14} color="#fff" /> New
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 20px 60px' }}>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 20 }}>
              <div style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 2px 12px rgba(15,23,42,0.05)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${ACCENT}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <Icon name="users" size={16} color={ACCENT} />
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>{stats.realCount}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Real Client Projects</div>
              </div>
              <div style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 2px 12px rgba(15,23,42,0.05)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <Icon name="edit" size={16} color="#b45309" />
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>{stats.ongoingCount}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Ongoing Projects</div>
              </div>
              <div style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 2px 12px rgba(15,23,42,0.05)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <Icon name="check" size={16} color="#16a34a" />
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>{stats.completeCount}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Completed Projects</div>
              </div>
              <div style={{ background: `linear-gradient(135deg,${ACCENT},${ACCENT_LIGHT})`, borderRadius: 16, padding: 18, boxShadow: `0 4px 20px ${ACCENT}40` }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <Icon name="template" size={16} color="#fff" />
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>{stats.sampleCount}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)' }}>Sample / Demo Projects</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 20 }}>
              <div style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 2px 12px rgba(15,23,42,0.05)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#cffafe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <Icon name="users" size={16} color="#0e7490" />
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>{stats.leadCount}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Open Leads / Inquiries</div>
              </div>
              <div style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 2px 12px rgba(15,23,42,0.05)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <Icon name="check" size={16} color="#16a34a" />
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>LKR {stats.totalRevenue.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Revenue Collected</div>
              </div>
              <div style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 2px 12px rgba(15,23,42,0.05)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <Icon name="calendar" size={16} color="#b45309" />
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>LKR {stats.pendingRevenue.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Pending Payments</div>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 16, padding: 22, boxShadow: '0 2px 12px rgba(15,23,42,0.05)', marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Template Popularity</div>
              <div style={{ display: 'grid', gap: 10 }}>
                {TEMPLATES.map(t => {
                  const count = stats.templateCounts[t.id] || 0
                  const max = Math.max(1, ...Object.values(stats.templateCounts))
                  return (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 130, fontSize: 12, color: '#475569', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                      <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 100, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(count / max) * 100}%`, background: t.color, borderRadius: 100, transition: 'width 0.3s' }} />
                      </div>
                      <div style={{ width: 20, fontSize: 12, fontWeight: 700, color: '#0f172a', textAlign: 'right', flexShrink: 0 }}>{count}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 16, padding: 22, boxShadow: '0 2px 12px rgba(15,23,42,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Recent Invitations</div>
                <button onClick={() => setActiveTab('couples')} style={{ fontSize: 12, color: ACCENT, background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}>View all →</button>
              </div>
              {loading ? (
                <div style={{ fontSize: 13, color: '#94a3b8' }}>Loading...</div>
              ) : couples.length === 0 ? (
                <div style={{ fontSize: 13, color: '#94a3b8' }}>No invitations yet.</div>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {couples.slice(0, 5).map(c => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: '#f8fafc' }}>
                      {c.couple_photo ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={c.couple_photo} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: '#e2e8f0' }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{c.bride} &amp; {c.groom}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(c.wedding_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      </div>
                      <button onClick={() => startEdit(c)} style={{ fontSize: 12, color: ACCENT, background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Edit</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TEMPLATES TAB ── */}
        {activeTab === 'templates' && (
          <div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Template Gallery</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Preview every available template and open a live demo where one exists.</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
              {TEMPLATES.map(t => (
                <div key={t.id} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(15,23,42,0.06)' }}>
                  <div style={{ height: 130, position: 'relative', background: t.photo ? undefined : `linear-gradient(135deg,${t.color}33,${t.color}66)` }}>
                    {t.photo ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={t.photo} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="template" size={28} color={t.color} />
                      </div>
                    )}
                    <div style={{ position: 'absolute', top: 8, right: 8, background: t.color, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100 }}>{t.tag}</div>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)' }} />
                  </div>
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>{stats.templateCounts[t.id] || 0} invitation{(stats.templateCounts[t.id] || 0) === 1 ? '' : 's'} using this</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {t.demoSlug ? (
                        <a href={`/invite/${t.demoSlug}`} target="_blank" rel="noopener noreferrer" style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          padding: '8px', borderRadius: 8, border: '1px solid #e2e8f0', textDecoration: 'none',
                          fontSize: 12, color: '#475569', fontWeight: 600,
                        }}>
                          <Icon name="external" size={12} /> View Demo
                        </a>
                      ) : (
                        <div style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: 8, background: '#f8fafc', fontSize: 12, color: '#94a3b8' }}>No demo yet</div>
                      )}
                      <button onClick={() => { setForm({ ...emptyForm, template: t.id, pin: generatePin() }); setEditing('new'); setActiveTab('couples') }} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: `${t.color}1a`, color: t.color, fontSize: 12, fontWeight: 600,
                      }}>
                        <Icon name="plus" size={12} color={t.color} /> Use
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── REVIEWS TAB ── */}
        {activeTab === 'pricing' && <PricingManager />}

        {activeTab === 'reviews' && <PendingReviewsManager />}

        {/* ── COUPLES TAB ── */}
        {activeTab === 'couples' && (
          <div>
            {!editing && (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  {([
                    { key: 'all', label: 'All' },
                    { key: 'lead', label: 'Leads' },
                    { key: 'ongoing', label: 'Ongoing' },
                    { key: 'complete', label: 'Complete' },
                    { key: 'sample', label: 'Sample' },
                  ] as const).map(f => (
                    <button key={f.key} onClick={() => setStatusFilter(f.key)} style={{
                      padding: '7px 16px', borderRadius: 100, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                      border: statusFilter === f.key ? 'none' : '1px solid #e2e8f0',
                      background: statusFilter === f.key ? ACCENT : '#fff',
                      color: statusFilter === f.key ? '#fff' : '#475569',
                    }}>{f.label}</button>
                  ))}
                </div>
                <div style={{ position: 'relative', marginBottom: 18 }}>
                  <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <Icon name="search" size={16} color="#94a3b8" />
                  </div>
                  <input value={coupleSearch} onChange={e => setCoupleSearch(e.target.value)} placeholder="Search by bride, groom, or slug..."
                    style={{ width: '100%', padding: '12px 18px 12px 42px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', fontSize: 14, outline: 'none', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box' }} />
                </div>
              </>
            )}

            {/* FORM */}
            {editing && (
              <div style={{ background: '#fff', borderRadius: 16, padding: 28, marginBottom: 24, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#0f172a' }}>
                  {editing === 'new' ? 'Create New Invitation' : 'Edit Invitation'}
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={fieldWrap}>
                    <label style={labelStyle}>Unique Link Slug *</label>
                    <input style={inputStyle} placeholder="amara-roshan" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} />
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Invite link: {siteUrl}/invite/{form.slug || 'your-slug'}</div>
                  </div>
                  <div style={fieldWrap}>
                    <label style={labelStyle}>Template</label>
                    <select style={inputStyle} value={form.template} onChange={e => setForm({ ...form, template: e.target.value })}>
                      {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div style={fieldWrap}>
                    <label style={labelStyle}>Project Status</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {([
                        { key: 'lead', label: 'Lead', color: '#0891b2' },
                        { key: 'ongoing', label: 'Ongoing', color: '#d97706' },
                        { key: 'complete', label: 'Complete', color: '#16a34a' },
                        { key: 'sample', label: 'Sample', color: '#6366f1' },
                      ] as const).map(s => (
                        <button key={s.key} type="button" onClick={() => setForm({ ...form, project_status: s.key })}
                          style={{
                            flex: 1, minWidth: 70, padding: '10px 4px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            border: form.project_status === s.key ? 'none' : '1px solid #e2e8f0',
                            background: form.project_status === s.key ? s.color : '#fff',
                            color: form.project_status === s.key ? '#fff' : '#475569',
                          }}>{s.label}</button>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Lead = inquiry, not yet confirmed. Sample = template demo.</div>
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
                  </div>
                  <div style={fieldWrap}>
                    <label style={labelStyle}>Bride's Phone Number</label>
                    <input style={inputStyle} placeholder="0766128546" value={(form as any).bride_phone || ''} onChange={e => setForm({ ...form, bride_phone: e.target.value } as any)} />
                  </div>
                  <div style={fieldWrap}>
                    <label style={labelStyle}>Wedding Date &amp; Time *</label>
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

                <PhotoUploader value={form.couple_photo} onChange={url => setForm({ ...form, couple_photo: url })}
                  label="Couple Photo (Hero Image)" hint="Leave empty to use the default AI-generated photo." />

                <PhotoUploader value={(form as any).cover_background_image || ''} onChange={url => setForm({ ...form, cover_background_image: url } as any)}
                  label="Cover / Envelope Background Image" hint="Full-screen background behind the opening envelope. Best results: portrait, 9:16 ratio." />

                {/* Payment / Package tracking */}
                <div style={{ background: '#ecfeff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#0e7490', marginBottom: 12 }}>
                    Payment &amp; Package
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Package</label>
                      <select style={inputStyle} value={form.package_tier} onChange={e => setForm({ ...form, package_tier: e.target.value as any })}>
                        <option value="">Not set</option>
                        <option value="starter">Starter (LKR 3,000)</option>
                        <option value="premium">Premium (LKR 5,000)</option>
                        <option value="luxury">Luxury (LKR 8,000)</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Payment Status</label>
                      <select style={inputStyle} value={form.payment_status} onChange={e => setForm({ ...form, payment_status: e.target.value as any })}>
                        <option value="unpaid">Unpaid</option>
                        <option value="partial">Partial</option>
                        <option value="paid">Paid in Full</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Amount Paid (LKR)</label>
                      <input type="number" style={inputStyle} placeholder="0" value={form.paid_amount} onChange={e => setForm({ ...form, paid_amount: e.target.value })} />
                    </div>
                  </div>
                </div>

                {/* Internal admin notes — never shown to the couple */}
                <div style={fieldWrap}>
                  <label style={labelStyle}>Internal Notes (admin-only, never shown to the couple)</label>
                  <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} placeholder="e.g. Follow up after their engagement, prefers WhatsApp over calls..." value={form.admin_notes} onChange={e => setForm({ ...form, admin_notes: e.target.value })} />
                </div>

                {/* One-click WhatsApp confirmation */}
                {(form.bride_phone || form.groom_phone) && (
                  <div style={fieldWrap}>
                    <a
                      href={`https://wa.me/${(form.groom_phone || form.bride_phone).replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Hi ${form.groom || form.bride || 'there'}! This is InviteGlow. Thank you for reaching out about your wedding invitation${form.wedding_date ? ` for ${new Date(form.wedding_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}. We'll get started on your invitation and follow up shortly with next steps!`
                      )}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 8,
                        background: '#25d366', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600,
                      }}>
                      Send WhatsApp Confirmation
                    </a>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Opens WhatsApp with a ready-made confirmation message to send.</div>
                  </div>
                )}

                <div style={fieldWrap}>
                  <label style={labelStyle}>Dashboard PIN (4-digit)</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input style={{ ...inputStyle, flex: 1 }} placeholder="1234" maxLength={4} value={form.pin} onChange={e => setForm({ ...form, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
                    <button type="button" onClick={() => setForm({ ...form, pin: generatePin() })}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: 12, color: '#475569', whiteSpace: 'nowrap' }}>
                      <Icon name="dice" size={13} /> New
                    </button>
                  </div>
                </div>

                <div style={{ background: '#fffbeb', borderRadius: 12, padding: 16, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#92400e', marginBottom: 4 }}>
                      <Icon name="wine" size={14} color="#92400e" /> Ask Guests About Alcohol
                    </div>
                    <div style={{ fontSize: 11, color: '#a16207' }}>Guests who accept will be asked if they'll be drinking.</div>
                  </div>
                  <button type="button" onClick={() => setForm({ ...form, ask_drinking: !form.ask_drinking })} style={{
                    width: 48, height: 28, borderRadius: 100, border: 'none', cursor: 'pointer', flexShrink: 0,
                    background: form.ask_drinking ? ACCENT : '#e2e8f0', position: 'relative',
                  }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: form.ask_drinking ? 23 : 3, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </button>
                </div>

                <div style={{ background: '#eef2ff', borderRadius: 12, padding: 16, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#3730a3', marginBottom: 4 }}>
                      <Icon name="chair" size={14} color="#3730a3" /> Show Seat Finder
                    </div>
                    <div style={{ fontSize: 11, color: '#4338ca' }}>Guests can search their name to find their table.</div>
                  </div>
                  <button type="button" onClick={() => setForm({ ...form, show_seating: !form.show_seating })} style={{
                    width: 48, height: 28, borderRadius: 100, border: 'none', cursor: 'pointer', flexShrink: 0,
                    background: form.show_seating ? '#4f46e5' : '#e2e8f0', position: 'relative',
                  }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: form.show_seating ? 23 : 3, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </button>
                </div>

                <div style={{ background: '#f0fdfa', borderRadius: 12, padding: 16, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#0f766e', marginBottom: 4 }}>
                      <Icon name="link" size={14} color="#0f766e" /> Enable Guest Personalized Links
                    </div>
                    <div style={{ fontSize: 11, color: '#0d9488' }}>Lets the couple generate "Dear [Name]" links per guest. Turning this off also hides the Share tab on their dashboard.</div>
                  </div>
                  <button type="button" onClick={() => setForm({ ...form, enable_guest_links: !form.enable_guest_links })} style={{
                    width: 48, height: 28, borderRadius: 100, border: 'none', cursor: 'pointer', flexShrink: 0,
                    background: form.enable_guest_links ? '#0d9488' : '#e2e8f0', position: 'relative',
                  }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: form.enable_guest_links ? 23 : 3, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </button>
                </div>

                <div style={{ background: '#fdf4ff', borderRadius: 12, padding: 16, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#86198f', marginBottom: 4 }}>
                      <Icon name="star" size={13} color="#86198f" /> Enable Guest Wishes Wall
                    </div>
                    <div style={{ fontSize: 11, color: '#a21caf' }}>Lets guests leave a wish (with an optional photo/video) that everyone can see on the invitation page.</div>
                  </div>
                  <button type="button" onClick={() => setForm({ ...form, enable_guest_wishes: !(form as any).enable_guest_wishes } as any)} style={{
                    width: 48, height: 28, borderRadius: 100, border: 'none', cursor: 'pointer', flexShrink: 0,
                    background: (form as any).enable_guest_wishes ? '#a21caf' : '#e2e8f0', position: 'relative',
                  }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: (form as any).enable_guest_wishes ? 23 : 3, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </button>
                </div>

                <div style={{ background: '#fdf2f8', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#be185d', marginBottom: 10 }}>
                    <Icon name="music" size={14} color="#be185d" /> Background Music
                  </div>
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
                  <MusicUploader value={form.song_url} onChange={url => setForm({ ...form, song_url: url })} />
                </div>

                <GalleryUploader value={form.gallery} onChange={urls => setForm({ ...form, gallery: urls })} />
                <TimelinePicker value={form.timeline} onChange={items => setForm({ ...form, timeline: items })} />
                <EventsPicker value={form.events} onChange={v => setForm({ ...form, events: v })} />
                <SectionTogglesPicker value={form.section_visibility} onChange={v => setForm({ ...form, section_visibility: v })} />

                <div style={fieldWrap}>
                  <label style={labelStyle}>Cover Badge Text</label>
                  <input style={inputStyle} placeholder="e.g. Wedding Invitation" value={(form as any).cover_badge_text || ''} onChange={e => setForm({ ...form, cover_badge_text: e.target.value } as any)} />
                </div>
                <div style={{ background: '#eff6ff', borderRadius: 14, padding: 18, marginBottom: 20, border: '1px solid #bfdbfe' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 14 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: '#1d4ed8' }}>
                        <Icon name="calendar" size={15} color="#1d4ed8" /> Wedding Note Section
                      </div>
                      <div style={{ fontSize: 11, color: '#2563eb', marginTop: 4 }}>
                        A dedicated hero-style block shown right before the Wedding Ceremony details — its own background photo, a short note, "Dear [Guest Name]" if the guest link includes one, and the couple's names.
                      </div>
                    </div>
                    <button type="button" onClick={() => setForm({ ...form, show_wedding_note: !(form as any).show_wedding_note } as any)} style={{
                      width: 48, height: 28, borderRadius: 100, border: 'none', cursor: 'pointer', flexShrink: 0,
                      background: (form as any).show_wedding_note ? '#2563eb' : '#e2e8f0', position: 'relative',
                    }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: (form as any).show_wedding_note ? 23 : 3, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                    </button>
                  </div>
                  {(form as any).show_wedding_note && (
                    <div style={{ background: '#fff', borderRadius: 10, padding: 14 }}>
                      <div style={{ marginBottom: 14 }}>
                        <label style={labelStyle}>Note Text</label>
                        <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical', marginBottom: 0 }}
                          placeholder='e.g. "15 years of love, memories, and dreams later... their wedding day has finally arrived."'
                          value={(form as any).wedding_note_text || ''}
                          onChange={e => setForm({ ...form, wedding_note_text: e.target.value } as any)} />
                      </div>
                      <PhotoUploader
                        value={(form as any).wedding_note_background_image || ''}
                        onChange={url => setForm({ ...form, wedding_note_background_image: url } as any)}
                        label="Background Photo"
                        hint="Leave empty to reuse the main couple photo."
                      />
                    </div>
                  )}
                </div>

                <div style={fieldWrap}>
                  <label style={labelStyle}>Cover Intro Text</label>
                  <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} placeholder="Leave empty to use the theme's default line" value={form.intro_text} onChange={e => setForm({ ...form, intro_text: e.target.value })} />
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Guest Seat Assignments (one per line: Name | Table)</label>
                  <textarea style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }} placeholder={"amara | Table 3\nsilva | Table 7"} value={form.seats} onChange={e => setForm({ ...form, seats: e.target.value })} />
                </div>

                {editing !== 'new' && <RsvpManager coupleId={editing as string} />}

                {message && <div style={{ marginBottom: 16, fontSize: 14, color: message.startsWith('Saved') ? '#16a34a' : '#dc2626' }}>{message}</div>}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handleSave} disabled={saving} style={{
                    padding: '12px 28px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: `linear-gradient(135deg,${ACCENT},${ACCENT_LIGHT})`, color: '#fff', fontWeight: 600, fontSize: 14, opacity: saving ? 0.6 : 1,
                  }}>{saving ? 'Saving...' : 'Save Invitation'}</button>
                  <button onClick={() => { setEditing(null); setMessage('') }} style={{
                    padding: '12px 28px', borderRadius: 10, border: '1px solid #e2e8f0', cursor: 'pointer', background: '#fff', color: '#475569', fontWeight: 500, fontSize: 14,
                  }}>Cancel</button>
                </div>
              </div>
            )}

            {/* LIST */}
            {!editing && (
              <div>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Loading...</div>
                ) : filteredCouples.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                    {couples.length === 0 ? 'No invitations yet. Click "New" to create one.' : 'No couples match your search.'}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
                    {filteredCouples.map(c => {
                      const templateMeta = TEMPLATES.find(t => t.id === c.template)
                      return (
                        <div key={c.id} style={{ background: '#fff', borderRadius: 16, padding: 18, border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(15,23,42,0.04)' }}>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                            {c.couple_photo ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={c.couple_photo} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: 48, height: 48, borderRadius: 10, background: '#f1f5f9', flexShrink: 0 }} />
                            )}
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.bride} &amp; {c.groom}</div>
                              <div style={{ fontSize: 12, color: '#64748b' }}>{new Date(c.wedding_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                            {templateMeta && (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, color: templateMeta.color, background: `${templateMeta.color}1a`, padding: '3px 10px', borderRadius: 100 }}>
                                {templateMeta.name}
                              </div>
                            )}
                            {(() => {
                              const status = ((c as any).project_status as string) || 'ongoing'
                              const statusMeta = { lead: { label: 'Lead', color: '#0891b2' }, sample: { label: 'Sample', color: '#6366f1' }, ongoing: { label: 'Ongoing', color: '#d97706' }, complete: { label: 'Complete', color: '#16a34a' } }[status] || { label: status, color: '#64748b' }
                              return (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, color: statusMeta.color, background: `${statusMeta.color}1a`, padding: '3px 10px', borderRadius: 100 }}>
                                  {statusMeta.label}
                                </div>
                              )
                            })()}
                          </div>
                          <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                            <a href={`/invite/${c.slug}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: ACCENT, textDecoration: 'none', fontWeight: 500 }}>
                              <Icon name="link" size={11} color={ACCENT} /> Invite
                            </a>
                            <a href={`/dashboard/${c.slug}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#7c3aed', textDecoration: 'none', fontWeight: 500 }}>
                              <Icon name="chart" size={11} color="#7c3aed" /> Dashboard
                            </a>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
                              <Icon name="lock" size={11} color="#94a3b8" /> {c.pin || '----'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => startEdit(c)} style={{
                              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                              padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'pointer', background: '#f8fafc', color: '#475569', fontSize: 12.5, fontWeight: 500,
                            }}><Icon name="edit" size={12} /> Edit</button>
                            <button onClick={() => handleDelete(c.id)} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              padding: '8px 12px', borderRadius: 8, border: '1px solid #fecaca', cursor: 'pointer', background: '#fef2f2', color: '#dc2626',
                            }}><Icon name="trash" size={13} color="#dc2626" /></button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
