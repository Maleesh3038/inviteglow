"use client"
import { useState, useEffect, useRef } from 'react'
import { supabase, Couple } from '@/lib/supabase'

const TEMPLATES = [
  { id: 'floral-romance', name: 'Floral Romance' },
  { id: 'cinematic-gold', name: 'Cinematic Gold' },
  { id: 'kandyan-heritage', name: 'Kandyan Heritage' },
  { id: 'garden-minimal', name: 'Garden Minimal' },
]

const BUCKET = 'wedding-photos'

const emptyForm = {
  slug: '',
  template: 'floral-romance',
  bride: '',
  groom: '',
  bride_family: '',
  groom_family: '',
  wedding_date: '',
  venue: '',
  venue_address: '',
  maps_url: '',
  couple_photo: '',
  song_title: '',
  song_artist: '',
  song_url: '',
  gallery: [] as string[],
  timeline: '',
  seats: '',
  pin: '',
  ask_drinking: false,
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
      wedding_date: c.wedding_date ? c.wedding_date.slice(0, 16) : '',
      venue: c.venue || '',
      venue_address: c.venue_address || '',
      maps_url: c.maps_url || '',
      couple_photo: c.couple_photo || '',
      song_title: c.song_title || '',
      song_artist: c.song_artist || '',
      song_url: c.song_url || '',
      gallery: c.gallery || [],
      timeline: (c.timeline || []).map(t => `${t.time} | ${t.event}`).join('\n'),
      seats: Object.entries(c.seats || {}).map(([k, v]) => `${k} | ${v}`).join('\n'),
      pin: c.pin || generatePin(),
      ask_drinking: c.ask_drinking || false,
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

    const timelineArr = form.timeline.split('\n').map(line => {
      const [time, event] = line.split('|').map(s => s.trim())
      return time && event ? { time, event } : null
    }).filter(Boolean)
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
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                Default calm wedding music plays automatically when the couple hasn't customised it.
              </div>
            </div>

            {/* Gallery Upload */}
            <GalleryUploader
              value={form.gallery}
              onChange={urls => setForm({ ...form, gallery: urls })}
            />

            <div style={fieldWrap}>
              <label style={labelStyle}>Wedding Timeline (one per line: Time | Event)</label>
              <textarea style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }}
                placeholder={"9:55 AM | Poruwa Ceremony\n12:00 PM | Lunch\n1:00 PM | Dancing Floor Starts"}
                value={form.timeline} onChange={e => setForm({ ...form, timeline: e.target.value })} />
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>Guest Seat Assignments (one per line: Name | Table)</label>
              <textarea style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }}
                placeholder={"amara | Table 3\nsilva | Table 7\nperera | Table 5"}
                value={form.seats} onChange={e => setForm({ ...form, seats: e.target.value })} />
            </div>

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