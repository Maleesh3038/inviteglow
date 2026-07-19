"use client"
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
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
  'blush-blossom': { primary: '#c17d8a', primaryLight: '#f3d6d6', dark: '#5c4632', cream: '#fff6f1' },
  'ceylon-elegance': { primary: '#c68a8f', primaryLight: '#e7c9c0', dark: '#3f4a45', cream: '#faf6f3' },
  'eternal-bloom': { primary: '#5c7a52', primaryLight: '#b9cdae', dark: '#2d3d28', cream: '#f8f6ee' },
}

// Human-readable labels for the "Change Template" picker in the couple's
// own dashboard — purely cosmetic, doesn't affect any stored data.
const TEMPLATE_NAMES: Record<string, string> = {
  'floral-romance': 'Floral Romance',
  'elegant-photo': 'Elegant Photo Hero',
  'cinematic-gold': 'Cinematic Gold',
  'kandyan-heritage': 'Kandyan Heritage',
  'twilight-picnic': 'Twilight Picnic',
  'golden-garden': 'Golden Garden',
  'ocean-pearl': 'Ocean Pearl',
  'sunset-shores': 'Sunset Shores',
  'traditional-ceylon': 'Traditional Ceylon',
  'sacred-poruwa': 'Sacred Poruwa',
  'blush-blossom': 'Blush Blossom',
  'ceylon-elegance': 'Ceylon Elegance',
  'eternal-bloom': 'Eternal Bloom',
}

async function uploadToStorage(file: File, folder: string): Promise<string | null> {
  const ext = file.name.split('.').pop()
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, { cacheControl: '3600', upsert: false })
  if (error) { console.error('Upload error:', error); return null }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
  return data.publicUrl
}

function findSeatForGuest(guestName: string, seats: Record<string, string>): string | null {
  const query = guestName.trim().toLowerCase()
  if (!query) return null
  const found = Object.keys(seats || {}).find(k => query.includes(k) || k.includes(query))
  return found ? seats[found] : null
}

// ── Clean line-style SVG icons — no emoji in the dashboard chrome ──
type IconName = 'lock' | 'check' | 'cross' | 'users' | 'chair' | 'wine' | 'glass' | 'edit' | 'link' | 'overview' | 'search' | 'refresh' | 'trash' | 'copy' | 'whatsapp' | 'home' | 'car' | 'sparkles' | 'camera' | 'heart' | 'wallet' | 'plus'
function Icon({ name, size = 16, color = 'currentColor', strokeWidth = 1.8 }: { name: IconName; size?: number; color?: string; strokeWidth?: number }) {
  const c = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (name) {
    case 'lock': return <svg {...c}><rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M7.5 10.5V7a4.5 4.5 0 019 0v3.5" /></svg>
    case 'check': return <svg {...c}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
    case 'cross': return <svg {...c}><path d="M6 6l12 12M18 6L6 18" /></svg>
    case 'users': return <svg {...c}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0111 0" /><path d="M15.5 8.2a3 3 0 010 5.8" /><path d="M15 20a5 5 0 016.5-4.8" /></svg>
    case 'chair': return <svg {...c}><path d="M6 4v9a2 2 0 002 2h8a2 2 0 002-2V4" /><path d="M6 15v5M18 15v5M8 4h8" /></svg>
    case 'wine': return <svg {...c}><path d="M8 3h8l-1 7a3 3 0 01-6 0z" /><path d="M12 13v7M8.5 20h7" /></svg>
    case 'glass': return <svg {...c}><path d="M6 3h12l-1.5 12a3.5 3.5 0 01-3 3h-3a3.5 3.5 0 01-3-3z" /><path d="M9 8h6" /></svg>
    case 'edit': return <svg {...c}><path d="M4 20h4L18.5 9.5a2.1 2.1 0 00-3-3L5 17v3z" /><path d="M13.5 8l3 3" /></svg>
    case 'link': return <svg {...c}><path d="M9.5 14.5l5-5" /><path d="M13 6l1-1a3.5 3.5 0 015 5l-1 1" /><path d="M11 18l-1 1a3.5 3.5 0 01-5-5l1-1" /></svg>
    case 'overview': return <svg {...c}><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></svg>
    case 'search': return <svg {...c}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.3-4.3" /></svg>
    case 'refresh': return <svg {...c}><path d="M4 12a8 8 0 0114-5.3M20 12a8 8 0 01-14 5.3" /><path d="M18 3v4.5h-4.5M6 21v-4.5h4.5" /></svg>
    case 'trash': return <svg {...c}><path d="M5 7h14" /><path d="M9 7V4.8A1.8 1.8 0 0110.8 3h2.4A1.8 1.8 0 0115 4.8V7" /><path d="M7 7l1 13.2A1.8 1.8 0 009.8 22h4.4a1.8 1.8 0 001.8-1.8L17 7" /></svg>
    case 'copy': return <svg {...c}><rect x="8.5" y="8.5" width="12" height="12" rx="2" /><path d="M15.5 8.5V5.8A1.8 1.8 0 0013.7 4H5.8A1.8 1.8 0 004 5.8v7.9A1.8 1.8 0 005.8 15.5H8.5" /></svg>
    case 'whatsapp': return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3M12 2a10 10 0 00-8.5 15.3L2 22l4.8-1.3A10 10 0 1012 2z" /></svg>
    case 'home': return <svg {...c}><path d="M4 11l8-7 8 7" /><path d="M6 10v9a1 1 0 001 1h10a1 1 0 001-1v-9" /></svg>
    case 'car': return <svg {...c}><path d="M4 16V11l2-4h12l2 4v5" /><path d="M4 16a1.5 1.5 0 003 0M17 16a1.5 1.5 0 003 0M4 16h16" /></svg>
    case 'sparkles': return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" /></svg>
    case 'camera': return <svg {...c}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7l1.5-3h5L16 7" /><circle cx="12" cy="13.5" r="3.5" /></svg>
    case 'heart': return <svg {...c}><path d="M12 20.5s-7.5-4.9-9.8-9.3C.6 8 2 4.7 5.2 4a4.6 4.6 0 016.8 2.3A4.6 4.6 0 0118.8 4C22 4.7 23.4 8 21.8 11.2 19.5 15.6 12 20.5 12 20.5z" /></svg>
    case 'wallet': return <svg {...c}><rect x="3" y="6.5" width="18" height="13" rx="2.5" /><path d="M3 10h18" /><circle cx="16.5" cy="14.5" r="1.2" fill="currentColor" stroke="none" /><path d="M7 6.5V5a1.5 1.5 0 011.5-1.5h7A1.5 1.5 0 0117 5v1.5" /></svg>
    case 'plus': return <svg {...c}><path d="M12 5v14M5 12h14" /></svg>
    default: return null
  }
}

// ── Small donut chart (attending vs declined), pure SVG — no charting library ──
function RsvpDonut({ accepted, declined, accent, accentLight, size = 128 }: { accepted: number; declined: number; accent: string; accentLight: string; size?: number }) {
  const total = accepted + declined
  const r = size / 2 - 12
  const circumference = 2 * Math.PI * r
  const acceptedFrac = total > 0 ? accepted / total : 0
  const acceptedLen = circumference * acceptedFrac
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={12} />
      {total > 0 && (
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={accent} strokeWidth={12}
          strokeDasharray={`${acceptedLen} ${circumference - acceptedLen}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      )}
      <text x="50%" y="47%" textAnchor="middle" fontSize={size * 0.22} fontWeight={800} fill="#1e293b" fontFamily="'Inter',sans-serif">{total}</text>
      <text x="50%" y="63%" textAnchor="middle" fontSize={size * 0.09} fill="#94a3b8" fontFamily="'Inter',sans-serif">RSVPs</text>
    </svg>
  )
}

// ── Guest wish moderation ──────────────────────────────────────────
type DashWishMedia = { url: string; type: 'photo' | 'video' }
type DashWish = {
  id: string; couple_id: string; guest_name: string; message: string
  photo_url: string | null; video_url: string | null; media: DashWishMedia[] | null
  approved: boolean | null; created_at: string
}

function getDashWishMedia(w: DashWish): DashWishMedia[] {
  if (w.media && w.media.length > 0) return w.media
  if (w.photo_url) return [{ url: w.photo_url, type: 'photo' }]
  if (w.video_url) return [{ url: w.video_url, type: 'video' }]
  return []
}

function WishesManager({ coupleId, accent }: { coupleId: string; accent: string }) {
  const [wishes, setWishes] = useState<DashWish[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'approved'>('pending')
  const [busyId, setBusyId] = useState<string | null>(null)
  const BORDER = '#e2e8f0'
  const TEXT_DARK = '#1e293b'
  const TEXT_MUTED = '#64748b'

  const load = async () => {
    const { data } = await supabase.from('wishes').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false })
    if (data) setWishes(data as DashWish[])
    setLoading(false)
  }

  useEffect(() => { load() }, [coupleId])

  const setApproved = async (id: string, approved: boolean) => {
    setBusyId(id)
    const { error } = await supabase.from('wishes').update({ approved }).eq('id', id)
    if (!error) setWishes(prev => prev.map(w => w.id === id ? { ...w, approved } : w))
    setBusyId(null)
  }

  const deleteWish = async (id: string, guestName: string) => {
    if (!confirm(`Delete ${guestName}'s wish? This cannot be undone.`)) return
    setBusyId(id)
    const { error } = await supabase.from('wishes').delete().eq('id', id)
    if (!error) setWishes(prev => prev.filter(w => w.id !== id))
    setBusyId(null)
  }

  const pending = wishes.filter(w => !w.approved)
  const approved = wishes.filter(w => w.approved)
  const shown = filter === 'pending' ? pending : approved

  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: '7px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer',
    border: active ? 'none' : `1px solid ${BORDER}`,
    background: active ? accent : '#fff',
    color: active ? '#fff' : TEXT_MUTED,
  })

  if (loading) {
    return <div style={{ textAlign: "center", padding: 48, background: "#fff", borderRadius: 16, color: TEXT_MUTED }}>Loading wishes...</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <div onClick={() => setFilter('pending')} style={pillStyle(filter === 'pending')}>Pending ({pending.length})</div>
        <div onClick={() => setFilter('approved')} style={pillStyle(filter === 'approved')}>Approved ({approved.length})</div>
      </div>

      {shown.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, background: "#fff", borderRadius: 16, color: TEXT_MUTED }}>
          {filter === 'pending' ? 'No wishes waiting for approval.' : 'No approved wishes yet.'}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {shown.map(w => {
            const media = getDashWishMedia(w)
            return (
              <div key={w.id} style={{ background: "#fff", borderRadius: 14, padding: "14px 18px", boxShadow: "0 2px 10px rgba(15,23,42,0.05)" }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  {media.length > 0 && (
                    <div style={{ width: 64, height: 64, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#f1f5f9' }}>
                      {media[0].type === 'video' ? (
                        <video src={media[0].url} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={media[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK }}>{w.guest_name}</div>
                    <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 2, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{w.message}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                      {new Date(w.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {media.length > 1 && ` · ${media.length} attachments`}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                  {w.approved ? (
                    <button type="button" onClick={() => setApproved(w.id, false)} disabled={busyId === w.id} style={{
                      display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 100,
                      border: '1px solid #fde68a', cursor: 'pointer', background: '#fffbeb', color: '#b45309',
                      fontSize: 11, fontWeight: 600, opacity: busyId === w.id ? 0.6 : 1,
                    }}>Unapprove</button>
                  ) : (
                    <button type="button" onClick={() => setApproved(w.id, true)} disabled={busyId === w.id} style={{
                      display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 100,
                      border: '1px solid #bbf7d0', cursor: 'pointer', background: '#f0fdf4', color: '#16a34a',
                      fontSize: 11, fontWeight: 600, opacity: busyId === w.id ? 0.6 : 1,
                    }}>
                      <Icon name="check" size={11} color="#16a34a" /> Approve
                    </button>
                  )}
                  <button type="button" onClick={() => deleteWish(w.id, w.guest_name)} disabled={busyId === w.id} style={{
                    display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 100,
                    border: '1px solid #fecaca', cursor: 'pointer', background: '#fef2f2', color: '#dc2626',
                    fontSize: 11, fontWeight: 600, opacity: busyId === w.id ? 0.6 : 1,
                  }}>
                    <Icon name="trash" size={11} color="#dc2626" /> Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Couple-facing self-service edit panel ──
// ── Wedding Budget Tracker ────────────────────────────────────────
type BudgetItem = {
  id: string
  couple_id: string
  category: string
  item_name: string
  vendor: string | null
  estimated_cost: number
  paid_amount: number
  due_date: string | null
  status: 'pending' | 'partial' | 'paid'
  notes: string | null
  created_at: string
}

const BUDGET_CATEGORIES = [
  { key: 'venue', label: 'Venue', icon: '🏛️' },
  { key: 'catering', label: 'Catering', icon: '🍽️' },
  { key: 'photography', label: 'Photo & Video', icon: '📷' },
  { key: 'attire', label: 'Attire', icon: '👗' },
  { key: 'decor', label: 'Decor & Flowers', icon: '💐' },
  { key: 'music', label: 'Music & DJ', icon: '🎵' },
  { key: 'invitations', label: 'Invitations', icon: '💌' },
  { key: 'transport', label: 'Transport', icon: '🚗' },
  { key: 'beauty', label: 'Hair & Makeup', icon: '💄' },
  { key: 'other', label: 'Other', icon: '📦' },
]
const categoryMeta = (key: string) => BUDGET_CATEGORIES.find(c => c.key === key) || BUDGET_CATEGORIES[BUDGET_CATEGORIES.length - 1]

const emptyBudgetForm = {
  category: 'venue', item_name: '', vendor: '', estimated_cost: '', paid_amount: '', due_date: '', status: 'pending' as BudgetItem['status'], notes: '',
}

function BudgetManager({ coupleId, accent }: { coupleId: string; accent: string }) {
  const [items, setItems] = useState<BudgetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyBudgetForm)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [totalBudgetInput, setTotalBudgetInput] = useState('')
  const [totalBudget, setTotalBudget] = useState<number | null>(null)

  const TEXT_DARK = '#1e293b'
  const TEXT_MUTED = '#64748b'
  const BORDER = '#e2e8f0'

  const load = async () => {
    const { data } = await supabase.from('budget_items').select('*').eq('couple_id', coupleId).order('created_at', { ascending: true })
    if (data) setItems(data as BudgetItem[])
    setLoading(false)
  }

  useEffect(() => { load() }, [coupleId])

  // Overall budget target is stored locally per-session via a simple
  // prompt-free inline field — kept purely client-side comparison against
  // the sum of estimated costs, no schema change needed for this bit.
  useEffect(() => {
    const saved = window.localStorage?.getItem?.(`budget-target-${coupleId}`)
    if (saved) { setTotalBudget(parseFloat(saved)); setTotalBudgetInput(saved) }
  }, [coupleId])
  const saveTotalBudget = () => {
    const val = parseFloat(totalBudgetInput)
    if (!isNaN(val) && val > 0) {
      setTotalBudget(val)
      try { window.localStorage?.setItem?.(`budget-target-${coupleId}`, String(val)) } catch { }
    }
  }

  const totalEstimated = items.reduce((s, i) => s + (i.estimated_cost || 0), 0)
  const totalPaid = items.reduce((s, i) => s + (i.paid_amount || 0), 0)
  const totalRemaining = totalEstimated - totalPaid
  const budgetTarget = totalBudget ?? totalEstimated
  const usedPct = budgetTarget > 0 ? Math.min(100, Math.round((totalEstimated / budgetTarget) * 100)) : 0

  const fmt = (n: number) => `LKR ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`

  const resetForm = () => { setForm(emptyBudgetForm); setEditingId(null); setShowForm(false) }

  const startEdit = (item: BudgetItem) => {
    setForm({
      category: item.category, item_name: item.item_name, vendor: item.vendor || '',
      estimated_cost: String(item.estimated_cost ?? ''), paid_amount: String(item.paid_amount ?? ''),
      due_date: item.due_date || '', status: item.status, notes: item.notes || '',
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  const handleSaveItem = async () => {
    if (!form.item_name.trim()) return
    setSaving(true)
    const payload = {
      couple_id: coupleId,
      category: form.category,
      item_name: form.item_name.trim(),
      vendor: form.vendor.trim() || null,
      estimated_cost: parseFloat(form.estimated_cost) || 0,
      paid_amount: parseFloat(form.paid_amount) || 0,
      due_date: form.due_date || null,
      status: form.status,
      notes: form.notes.trim() || null,
    }
    const { error } = editingId
      ? await supabase.from('budget_items').update(payload).eq('id', editingId)
      : await supabase.from('budget_items').insert([payload])
    setSaving(false)
    if (!error) { resetForm(); load() }
  }

  const handleDeleteItem = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from your budget?`)) return
    setBusyId(id)
    const { error } = await supabase.from('budget_items').delete().eq('id', id)
    setBusyId(null)
    if (!error) setItems(prev => prev.filter(i => i.id !== id))
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 9, border: `1px solid ${BORDER}`,
    fontSize: 13.5, outline: 'none', fontFamily: "'Inter',sans-serif", background: '#fff', color: TEXT_DARK, boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = { fontSize: 10.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 5, display: 'block' }

  const statusMeta: Record<BudgetItem['status'], { label: string; bg: string; color: string }> = {
    pending: { label: 'Pending', bg: '#fef3c7', color: '#b45309' },
    partial: { label: 'Partially Paid', bg: '#dbeafe', color: '#1d4ed8' },
    paid: { label: 'Paid in Full', bg: '#dcfce7', color: '#16a34a' },
  }

  if (loading) {
    return <div style={{ textAlign: "center", padding: 48, background: "#fff", borderRadius: 16, color: TEXT_MUTED }}>Loading budget...</div>
  }

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 2px 12px rgba(15,23,42,0.05)' }}>
          <div style={{ fontSize: 10.5, color: TEXT_MUTED, fontWeight: 600, marginBottom: 6 }}>TOTAL ESTIMATED</div>
          <div style={{ fontSize: 19, fontWeight: 800, color: TEXT_DARK }}>{fmt(totalEstimated)}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 2px 12px rgba(15,23,42,0.05)' }}>
          <div style={{ fontSize: 10.5, color: '#16a34a', fontWeight: 600, marginBottom: 6 }}>PAID SO FAR</div>
          <div style={{ fontSize: 19, fontWeight: 800, color: '#16a34a' }}>{fmt(totalPaid)}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 2px 12px rgba(15,23,42,0.05)' }}>
          <div style={{ fontSize: 10.5, color: totalRemaining > 0 ? '#dc2626' : TEXT_MUTED, fontWeight: 600, marginBottom: 6 }}>BALANCE DUE</div>
          <div style={{ fontSize: 19, fontWeight: 800, color: totalRemaining > 0 ? '#dc2626' : TEXT_DARK }}>{fmt(Math.max(0, totalRemaining))}</div>
        </div>
      </div>

      {/* Optional overall budget target + progress bar */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 2px 12px rgba(15,23,42,0.05)', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: TEXT_DARK }}>Overall Budget Goal (optional)</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input value={totalBudgetInput} onChange={e => setTotalBudgetInput(e.target.value.replace(/[^\d.]/g, ''))}
              placeholder="e.g. 1500000" style={{ ...inputStyle, width: 140, padding: '7px 10px', fontSize: 12.5 }} />
            <button onClick={saveTotalBudget} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: accent, color: '#fff', fontSize: 12, fontWeight: 600 }}>Set</button>
          </div>
        </div>
        {budgetTarget > 0 && (
          <>
            <div style={{ height: 8, background: '#f1f5f9', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${usedPct}%`, background: usedPct >= 100 ? '#dc2626' : `linear-gradient(90deg,${accent},#a5b4fc)`, borderRadius: 100, transition: 'width 0.3s' }} />
            </div>
            <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 6 }}>
              {fmt(totalEstimated)} planned of {fmt(budgetTarget)} goal ({usedPct}%)
            </div>
          </>
        )}
      </div>

      {/* Add/Edit form */}
      {showForm ? (
        <div style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 2px 12px rgba(15,23,42,0.05)', marginBottom: 16 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: TEXT_DARK, marginBottom: 14 }}>{editingId ? 'Edit Expense' : 'Add Expense'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>
                {BUDGET_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Item / Service Name</label>
              <input value={form.item_name} onChange={e => setForm({ ...form, item_name: e.target.value })} placeholder="e.g. Wedding Cake" style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Vendor (optional)</label>
            <input value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} placeholder="e.g. Sweet Dreams Bakery" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={labelStyle}>Estimated Cost (LKR)</label>
              <input value={form.estimated_cost} onChange={e => setForm({ ...form, estimated_cost: e.target.value.replace(/[^\d.]/g, '') })} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Paid / Advance (LKR)</label>
              <input value={form.paid_amount} onChange={e => setForm({ ...form, paid_amount: e.target.value.replace(/[^\d.]/g, '') })} placeholder="0" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={labelStyle}>Due Date</label>
              <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Payment Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as BudgetItem['status'] })} style={inputStyle}>
                <option value="pending">Pending</option>
                <option value="partial">Partially Paid</option>
                <option value="paid">Paid in Full</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Notes (optional)</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Contract details, contact info, etc." style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleSaveItem} disabled={saving || !form.item_name.trim()} style={{
              flex: 1, padding: 12, borderRadius: 10, border: 'none', cursor: 'pointer', background: accent, color: '#fff',
              fontWeight: 700, fontSize: 13, opacity: (saving || !form.item_name.trim()) ? 0.6 : 1,
            }}>{saving ? 'Saving...' : editingId ? 'Update Expense' : 'Add Expense'}</button>
            <button onClick={resetForm} style={{ padding: '12px 18px', borderRadius: 10, border: `1px solid ${BORDER}`, cursor: 'pointer', background: '#fff', color: TEXT_MUTED, fontWeight: 600, fontSize: 13 }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: 13, borderRadius: 12,
          border: `1.5px dashed ${accent}`, cursor: 'pointer', background: `${accent}0d`, color: accent, fontWeight: 700, fontSize: 13, marginBottom: 16,
        }}>
          <Icon name="plus" size={14} color={accent} /> Add Expense
        </button>
      )}

      {/* Expense list */}
      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, background: "#fff", borderRadius: 16, color: TEXT_MUTED, fontSize: 13 }}>
          No expenses added yet. Start planning your budget above!
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {items.map(item => {
            const meta = categoryMeta(item.category)
            const sMeta = statusMeta[item.status]
            const balance = (item.estimated_cost || 0) - (item.paid_amount || 0)
            return (
              <div key={item.id} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 10px rgba(15,23,42,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{meta.icon}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: TEXT_DARK }}>{item.item_name}</div>
                      <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 1 }}>
                        {meta.label}{item.vendor ? ` · ${item.vendor}` : ''}{item.due_date ? ` · Due ${new Date(item.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '3px 10px', borderRadius: 100, fontSize: 10.5, fontWeight: 700, background: sMeta.bg, color: sMeta.color, whiteSpace: 'nowrap' }}>{sMeta.label}</div>
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: TEXT_MUTED, marginBottom: 10, paddingLeft: 44 }}>
                  <span>Est: <strong style={{ color: TEXT_DARK }}>{fmt(item.estimated_cost || 0)}</strong></span>
                  <span>Paid: <strong style={{ color: '#16a34a' }}>{fmt(item.paid_amount || 0)}</strong></span>
                  {balance > 0 && <span>Balance: <strong style={{ color: '#dc2626' }}>{fmt(balance)}</strong></span>}
                </div>
                {item.notes && <div style={{ fontSize: 11.5, color: TEXT_MUTED, marginBottom: 10, paddingLeft: 44, fontStyle: 'italic' }}>{item.notes}</div>}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => startEdit(item)} style={{
                    display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 100, border: `1px solid ${BORDER}`,
                    cursor: 'pointer', background: '#f8fafc', color: TEXT_MUTED, fontSize: 11, fontWeight: 500,
                  }}><Icon name="edit" size={11} /> Edit</button>
                  <button onClick={() => handleDeleteItem(item.id, item.item_name)} disabled={busyId === item.id} style={{
                    display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 100, border: '1px solid #fecaca',
                    cursor: 'pointer', background: '#fef2f2', color: '#dc2626', fontSize: 11, fontWeight: 500, opacity: busyId === item.id ? 0.6 : 1,
                  }}><Icon name="trash" size={11} color="#dc2626" /> {busyId === item.id ? 'Removing...' : 'Delete'}</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EditPanel({ couple, onSaved }: { couple: Couple; onSaved: () => void }) {
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
  const [introText, setIntroText] = useState(couple.intro_text || '')
  const [thankYouText, setThankYouText] = useState((couple as any).thank_you_text || '')
  const [brideFamilyName, setBrideFamilyName] = useState(couple.bride_family || '')
  const [groomFamilyName, setGroomFamilyName] = useState(couple.groom_family || '')
  const [togetherWithText, setTogetherWithText] = useState((couple as any).together_with_text || '')
  const [familyInvitationText, setFamilyInvitationText] = useState((couple as any).family_invitation_text || '')

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

  // ── Change Dashboard PIN — fully separate from the rest of this form.
  // Its own state and its own save call, so it can never interfere with
  // (or be blocked by) saving the other invitation fields. ──
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinSaving, setPinSaving] = useState(false)
  const [pinMessage, setPinMessage] = useState('')

  const handleChangePin = async () => {
    setPinMessage('')
    if (newPin.length !== 4) { setPinMessage('PIN must be exactly 4 digits.'); return }
    if (newPin !== confirmPin) { setPinMessage("PINs don't match — please re-enter."); return }
    setPinSaving(true)
    // Only the pin column is touched — nothing else about the couple
    // record is read or written by this call.
    const { error } = await supabase.from('couples').update({ pin: newPin }).eq('id', couple.id)
    setPinSaving(false)
    if (error) {
      setPinMessage('Could not update PIN: ' + error.message)
    } else {
      setPinMessage('PIN updated! Use it next time you unlock this dashboard.')
      setNewPin('')
      setConfirmPin('')
    }
  }

  // ── Change Template — also fully separate from the rest of this form.
  // Only touches the `template` column; admin controls which templates
  // are offered via enable_template_switch / allowed_templates. ──
  const allowedTemplates: string[] = Array.isArray((couple as any).allowed_templates) ? (couple as any).allowed_templates : []
  const [selectedTemplate, setSelectedTemplate] = useState(couple.template)
  const [templateSaving, setTemplateSaving] = useState(false)
  const [templateMessage, setTemplateMessage] = useState('')

  const handleChangeTemplate = async () => {
    if (selectedTemplate === couple.template) { setTemplateMessage("That's already your current template."); return }
    setTemplateMessage('')
    setTemplateSaving(true)
    const { error } = await supabase.from('couples').update({ template: selectedTemplate }).eq('id', couple.id)
    setTemplateSaving(false)
    if (error) {
      setTemplateMessage('Could not switch template: ' + error.message)
    } else {
      setTemplateMessage('Template updated! Refresh your invitation link to see the new look.')
      onSaved()
    }
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
      intro_text: introText || null,
      thank_you_text: thankYouText || null,
      bride_family: brideFamilyName || null,
      groom_family: groomFamilyName || null,
      together_with_text: togetherWithText || null,
      family_invitation_text: familyInvitationText || null,
    }).eq('id', couple.id)

    setSaving(false)
    if (error) {
      setMessage('Could not save: ' + error.message)
    } else {
      setMessage('Saved! Your invitation has been updated.')
      onSaved()
    }
  }

  const resetColors = () => setColors(templateDefault)

  return (
    <div style={{ background: '#fff', borderRadius: 18, padding: 24, boxShadow: '0 2px 20px rgba(15,23,42,0.06)' }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: PANEL_TEXT_DARK, marginBottom: 4 }}>Edit Your Invitation</div>
      <div style={{ fontSize: 12, color: PANEL_TEXT_MUTED, marginBottom: 20 }}>Changes apply instantly to your live invitation link.</div>

      <div style={fieldWrap}>
        <label style={labelStyle}>Couple Photo</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {photo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={photo} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', border: `1px solid ${PANEL_BORDER}` }} />
          ) : (
            <div style={{ width: 56, height: 56, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="camera" size={20} color="#94a3b8" />
            </div>
          )}
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, border: `1px solid ${PANEL_BORDER}`, background: uploading ? '#f1f5f9' : '#fff', cursor: uploading ? 'default' : 'pointer', fontSize: 13, color: PANEL_TEXT_MUTED, fontWeight: 500 }}>
            <Icon name="camera" size={14} />
            {uploading ? 'Uploading...' : photo ? 'Change Photo' : 'Upload Photo'}
          </button>
          {photo && (
            <button type="button" onClick={() => setPhoto('')} style={{ fontSize: 12, color: PANEL_ACCENT, background: 'transparent', border: 'none', cursor: 'pointer' }}>Remove</button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f) }} />
        </div>
      </div>

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

      {couple.show_seating && (
        <div style={{ background: '#eef2ff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#3730a3', marginBottom: 4 }}>
            <Icon name="chair" size={15} color="#3730a3" /> Manage Seating
          </div>
          <div style={{ fontSize: 11, color: '#4338ca', marginBottom: 14 }}>
            Guests can search their name on your invitation to find their table. Add, edit, or remove names below.
          </div>
          <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
            {seatRows.map(row => (
              <div key={row.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input value={row.name} onChange={e => updateSeatRow(row.id, 'name', e.target.value)} placeholder="Guest name"
                  style={{ ...inputStyle, flex: 1, marginBottom: 0, background: '#fff' }} />
                <input value={row.table} onChange={e => updateSeatRow(row.id, 'table', e.target.value)} placeholder="Table 3"
                  style={{ ...inputStyle, flex: 1, marginBottom: 0, background: '#fff' }} />
                <button type="button" onClick={() => removeSeatRow(row.id)} aria-label="Remove guest" style={{
                  width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0,
                  background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}><Icon name="cross" size={13} color="#dc2626" /></button>
              </div>
            ))}
            {seatRows.length === 0 && <div style={{ fontSize: 12, color: '#6b6098', fontStyle: 'italic' }}>No guests added yet.</div>}
          </div>
          <button type="button" onClick={addSeatRow} style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid #c7d2fe',
            background: '#fff', cursor: 'pointer', fontSize: 13, color: '#4338ca', fontWeight: 500,
          }}>+ Add Guest</button>
        </div>
      )}

      <div style={{ background: '#fdf8ec', borderRadius: 12, padding: 16, marginTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#8a6a2a' }}>Customise Colors</div>
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
        <div style={{ display: 'flex', gap: 8, marginTop: 14, padding: 12, borderRadius: 10, background: colors.cream }}>
          <div style={{ flex: 1, padding: '10px', borderRadius: 8, background: colors.primary, color: '#fff', fontSize: 11, textAlign: 'center', fontWeight: 600 }}>Primary</div>
          <div style={{ flex: 1, padding: '10px', borderRadius: 8, background: colors.primaryLight, color: colors.dark, fontSize: 11, textAlign: 'center', fontWeight: 600 }}>Light</div>
          <div style={{ flex: 1, padding: '10px', borderRadius: 8, background: colors.dark, color: '#fff', fontSize: 11, textAlign: 'center', fontWeight: 600 }}>Dark</div>
        </div>
      </div>

      <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 16, marginTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#166534', marginBottom: 14 }}>Customise Text</div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Groom's Family Name</label>
          <input style={inputStyle} value={groomFamilyName} onChange={e => setGroomFamilyName(e.target.value)} placeholder="e.g. MR & MRS De Silva" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>"Together With" Label</label>
          <input style={inputStyle} value={togetherWithText} onChange={e => setTogetherWithText(e.target.value)} placeholder="together with (default)" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Bride's Family Name</label>
          <input style={inputStyle} value={brideFamilyName} onChange={e => setBrideFamilyName(e.target.value)} placeholder="e.g. MR & MRS Perera" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Family Invitation Text</label>
          <textarea value={familyInvitationText} onChange={e => setFamilyInvitationText(e.target.value)} style={{ ...inputStyle, minHeight: 70, resize: 'vertical' as const }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Cover Intro Text</label>
          <textarea value={introText} onChange={e => setIntroText(e.target.value)} placeholder="Leave empty to use the template's default line..." style={{ ...inputStyle, minHeight: 70, resize: 'vertical' as const }} />
        </div>
        <div>
          <label style={labelStyle}>Thank You Message</label>
          <textarea value={thankYouText} onChange={e => setThankYouText(e.target.value)} placeholder="Leave empty to use the default thank you message..." style={{ ...inputStyle, minHeight: 90, resize: 'vertical' as const }} />
        </div>
      </div>

      {message && <div style={{ marginTop: 16, fontSize: 13, color: message.startsWith('Saved') ? '#16a34a' : '#dc2626' }}>{message}</div>}

      <button onClick={handleSave} disabled={saving} style={{
        marginTop: 18, width: '100%', padding: 14, borderRadius: 12, border: 'none', cursor: 'pointer',
        background: `linear-gradient(135deg,${PANEL_ACCENT},${panelTemplateDefault.primaryLight})`, color: '#fff', fontWeight: 700, fontSize: 14,
        opacity: saving ? 0.6 : 1,
      }}>
        {saving ? 'Saving...' : 'Save Changes'}
      </button>

      {/* ── Change Template — separate card, separate save action ── */}
      {(couple as any).enable_template_switch === true && allowedTemplates.length > 0 && (
        <div style={{ background: '#fff7ed', borderRadius: 12, padding: 16, marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#c2410c', marginBottom: 4 }}>
            <Icon name="sparkles" size={14} color="#c2410c" /> Change Template
          </div>
          <div style={{ fontSize: 11, color: '#ea580c', marginBottom: 14 }}>
            Not feeling the current look? Pick a different template below — your photos, text, and RSVPs all stay exactly as they are.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 8, marginBottom: 14 }}>
            {allowedTemplates.map(id => {
              const tColors = TEMPLATE_DEFAULTS[id] || TEMPLATE_DEFAULTS['floral-romance']
              const label = TEMPLATE_NAMES[id] || id
              const isSelected = selectedTemplate === id
              const isCurrent = couple.template === id
              return (
                <button key={id} type="button" onClick={() => { setSelectedTemplate(id); setTemplateMessage('') }} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 8px', borderRadius: 10,
                  border: isSelected ? `2px solid ${tColors.primary}` : '1px solid #fde8d0', cursor: 'pointer',
                  background: isSelected ? '#fff' : '#fffaf5', position: 'relative',
                }}>
                  {isCurrent && (
                    <span style={{ position: 'absolute', top: 6, right: 6, fontSize: 8.5, fontWeight: 700, color: '#fff', background: '#94a3b8', padding: '2px 6px', borderRadius: 100 }}>CURRENT</span>
                  )}
                  <span style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg,${tColors.primary},${tColors.primaryLight})` }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#334155', textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
                </button>
              )
            })}
          </div>
          {templateMessage && (
            <div style={{ fontSize: 12.5, marginBottom: 12, color: templateMessage.startsWith('Template updated') ? '#16a34a' : '#dc2626' }}>{templateMessage}</div>
          )}
          <button type="button" onClick={handleChangeTemplate} disabled={templateSaving || selectedTemplate === couple.template} style={{
            width: '100%', padding: 12, borderRadius: 10, border: 'none', cursor: 'pointer',
            background: '#c2410c', color: '#fff', fontWeight: 700, fontSize: 13,
            opacity: (templateSaving || selectedTemplate === couple.template) ? 0.5 : 1,
          }}>
            {templateSaving ? 'Switching...' : 'Switch to This Template'}
          </button>
        </div>
      )}

      {/* ── Change Dashboard PIN — separate card, separate save action ── */}
      <div style={{ background: '#eff6ff', borderRadius: 12, padding: 16, marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#1e40af', marginBottom: 4 }}>
          <Icon name="lock" size={14} color="#1e40af" /> Change Dashboard PIN
        </div>
        <div style={{ fontSize: 11, color: '#3b5bab', marginBottom: 14 }}>
          This is the 4-digit code you enter to unlock this dashboard. Changing it here does not affect anything else about your invitation.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>New PIN</label>
            <input type="tel" inputMode="numeric" maxLength={4} value={newPin}
              onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••" style={{ ...inputStyle, letterSpacing: '0.3em', textAlign: 'center' }} />
          </div>
          <div>
            <label style={labelStyle}>Confirm New PIN</label>
            <input type="tel" inputMode="numeric" maxLength={4} value={confirmPin}
              onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••" style={{ ...inputStyle, letterSpacing: '0.3em', textAlign: 'center' }} />
          </div>
        </div>
        {pinMessage && (
          <div style={{ fontSize: 12.5, marginBottom: 12, color: pinMessage.startsWith('PIN updated') ? '#16a34a' : '#dc2626' }}>{pinMessage}</div>
        )}
        <button type="button" onClick={handleChangePin} disabled={pinSaving || newPin.length !== 4 || confirmPin.length !== 4} style={{
          width: '100%', padding: 12, borderRadius: 10, border: 'none', cursor: 'pointer',
          background: '#1e40af', color: '#fff', fontWeight: 700, fontSize: 13,
          opacity: (pinSaving || newPin.length !== 4 || confirmPin.length !== 4) ? 0.5 : 1,
        }}>
          {pinSaving ? 'Updating...' : 'Update PIN'}
        </button>
      </div>
    </div>
  )
}

// ── Guest Link Generator ──
function GuestLinkGenerator({ couple, accent }: { couple: Couple; accent: string }) {
  const [guestName, setGuestName] = useState("")
  const [copied, setCopied] = useState(false)
  const [waMessage, setWaMessage] = useState((couple as any).whatsapp_invite_message || "You're invited!")
  const [editingMsg, setEditingMsg] = useState(false)

  const baseUrl = typeof window !== "undefined" ? `${window.location.origin}/invite/${couple.slug}` : `/invite/${couple.slug}`
  const generatedLink = guestName.trim() ? `${baseUrl}?name=${encodeURIComponent(guestName.trim())}` : baseUrl

  const copyLink = async () => {
    if (!guestName.trim()) return
    await navigator.clipboard.writeText(generatedLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareWhatsApp = () => {
    if (!guestName.trim()) return
    const msg = encodeURIComponent(`${waMessage}\n${generatedLink}`)
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  const saveMessage = async () => {
    await supabase.from('couples').update({ whatsapp_invite_message: waMessage }).eq('id', couple.id)
    setEditingMsg(false)
  }

  return (
    <div style={{ background: "#fff", borderRadius: 18, padding: 24, boxShadow: "0 2px 20px rgba(15,23,42,0.06)" }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Generate Guest Link</div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
        Type a guest's name to generate a personalised invitation link — their name will appear on the cover and auto-fill in the RSVP form.
      </div>

      <input
        value={guestName}
        onChange={e => { setGuestName(e.target.value); setCopied(false) }}
        placeholder="e.g. Amara & Family"
        style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, outline: "none", fontFamily: "'Inter',sans-serif", color: "#1e293b", marginBottom: 12, boxSizing: 'border-box' }}
      />

      {guestName.trim() && (
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 12, color: "#475569", wordBreak: "break-all", border: "1px solid #e2e8f0" }}>
          {generatedLink}
        </div>
      )}

      <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "12px 14px", marginBottom: 12, border: "1px solid #bbf7d0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#166534" }}>WhatsApp Message</div>
          <button onClick={() => setEditingMsg(!editingMsg)} style={{ fontSize: 11, color: accent, background: "transparent", border: "none", cursor: "pointer", fontWeight: 600 }}>
            {editingMsg ? "Cancel" : "Edit"}
          </button>
        </div>
        {editingMsg ? (
          <div>
            <textarea value={waMessage} onChange={e => setWaMessage(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", fontFamily: "'Inter',sans-serif", resize: "vertical" as const, minHeight: 60, boxSizing: 'border-box' }} />
            <button onClick={saveMessage} style={{ marginTop: 6, padding: "7px 16px", borderRadius: 8, background: accent, color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              Save Message
            </button>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "#1e293b" }}>{waMessage}<br /><span style={{ color: "#64748b" }}>[link auto-added]</span></div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={copyLink} disabled={!guestName.trim()} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: "11px", borderRadius: 10, border: "none", cursor: guestName.trim() ? "pointer" : "default",
          background: copied ? "#16a34a" : accent, color: "#fff", fontWeight: 600, fontSize: 13,
          opacity: guestName.trim() ? 1 : 0.4, transition: "background 0.2s",
        }}>
          {copied ? <Icon name="check" size={14} color="#fff" /> : <Icon name="copy" size={14} color="#fff" />}
          {copied ? "Copied!" : "Copy Link"}
        </button>
        <button onClick={shareWhatsApp} disabled={!guestName.trim()} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: "11px", borderRadius: 10, border: "none", cursor: guestName.trim() ? "pointer" : "default",
          background: "#25d366", color: "#fff", fontWeight: 600, fontSize: 13, opacity: guestName.trim() ? 1 : 0.4,
        }}>
          <Icon name="whatsapp" size={14} color="#fff" />
          WhatsApp
        </button>
      </div>
    </div>
  )
}

const TABS = [
  { key: 'overview', label: 'Overview', icon: 'overview' as const },
  { key: 'guests', label: 'Guests', icon: 'users' as const },
  { key: 'budget', label: 'Budget', icon: 'wallet' as const },
  { key: 'wishes', label: 'Wishes', icon: 'heart' as const },
  { key: 'edit', label: 'Edit', icon: 'edit' as const },
  { key: 'share', label: 'Share', icon: 'link' as const },
]

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
  const [activeTab, setActiveTab] = useState<'overview' | 'guests' | 'budget' | 'wishes' | 'edit' | 'share'>('overview')

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
    if (couple && (couple as any).enable_guest_links === false && activeTab === 'share') {
      setActiveTab('overview')
    }
  }, [couple, activeTab])

  useEffect(() => {
    if (couple && (couple as any).enable_guest_wishes !== true && activeTab === 'wishes') {
      setActiveTab('overview')
    }
  }, [couple, activeTab])

  useEffect(() => {
    if (couple && (couple as any).enable_budget_tracker !== true && activeTab === 'budget') {
      setActiveTab('overview')
    }
  }, [couple, activeTab])

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
        <div style={{ fontFamily: "'Inter',sans-serif", fontWeight: 800, fontSize: "1.6rem", color: "#1e293b", marginBottom: 8 }}>Dashboard Not Found</div>
        <div style={{ fontSize: 14, color: "#64748b" }}>This invitation doesn't exist.</div>
      </div>
    )
  }

  const ACCENT = couple.custom_colors?.primary || '#6366f1'
  const ACCENT_LIGHT = couple.custom_colors?.primaryLight || '#a5b4fc'
  const TEXT_DARK = '#1e293b'
  const TEXT_MUTED = '#64748b'
  const BORDER = '#e2e8f0'
  const PAGE_BG = '#f6f7fb'

  // ── PIN LOCK SCREEN ──
  if (!unlocked) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: PAGE_BG, fontFamily: "'Inter',sans-serif", padding: 24 }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&display=swap');`}</style>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: "#fff", borderRadius: 20, padding: "2.5rem 2rem", maxWidth: 360, width: "100%", textAlign: "center", boxShadow: "0 8px 32px rgba(15,23,42,0.1)" }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: `${ACCENT}1a`, display: 'flex',
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <Icon name="lock" size={24} color={ACCENT} />
          </div>
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
              outline: "none", marginBottom: 12, fontFamily: "'Inter',sans-serif", color: TEXT_DARK, boxSizing: 'border-box',
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
    <div style={{ minHeight: "100vh", background: PAGE_BG, fontFamily: "'Inter',sans-serif", overflowX: 'hidden' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');`}</style>

      {/* ── NAV BAR ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${ACCENT},${ACCENT_LIGHT})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13, flexShrink: 0,
            }}>
              {couple.bride?.[0]}{couple.groom?.[0]}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_DARK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {couple.bride} &amp; {couple.groom}
              </div>
              <div style={{ fontSize: 10, color: TEXT_MUTED }}>Wedding Dashboard</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 100, padding: 4 }}>
            {TABS.filter(tab =>
              (tab.key !== 'share' || (couple as any).enable_guest_links !== false) &&
              (tab.key !== 'wishes' || (couple as any).enable_guest_wishes === true) &&
              (tab.key !== 'budget' || (couple as any).enable_budget_tracker === true)
            ).map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 100,
                border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
                background: activeTab === tab.key ? '#fff' : 'transparent',
                color: activeTab === tab.key ? ACCENT : TEXT_MUTED,
                boxShadow: activeTab === tab.key ? '0 2px 8px rgba(15,23,42,0.08)' : 'none',
                transition: 'all 0.15s',
              }}>
                <Icon name={tab.icon} size={14} />
                <span className="dash-tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 520px) {
          .dash-tab-label { display: none; }
        }
        .dash-overview-grid { grid-template-columns: 1fr; }
        @media (min-width: 600px) {
          .dash-overview-grid { grid-template-columns: minmax(160px, auto) 1fr; }
        }
      `}</style>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px 60px" }}>

        <AnimatePresence mode="wait">
          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div className="dash-overview-grid" style={{ display: 'grid', gap: 16, alignItems: 'stretch', marginBottom: 20 }}>
                <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 2px 16px rgba(15,23,42,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <RsvpDonut accepted={accepted.length} declined={declined.length} accent={ACCENT} accentLight={ACCENT_LIGHT} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 2px 12px rgba(15,23,42,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="check" size={14} color="#16a34a" />
                      </div>
                      <span style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 600 }}>Accepted</span>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: TEXT_DARK }}>{accepted.length}</div>
                  </div>
                  <div style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 2px 12px rgba(15,23,42,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="cross" size={14} color="#dc2626" />
                      </div>
                      <span style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 600 }}>Declined</span>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: TEXT_DARK }}>{declined.length}</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1', background: `linear-gradient(135deg,${ACCENT},${ACCENT_LIGHT})`, borderRadius: 16, padding: 18, display: 'flex', alignItems: 'center', gap: 12, boxShadow: `0 4px 20px ${ACCENT}40` }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="users" size={18} color="#fff" />
                    </div>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>{totalGuests}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>Total guests attending (incl. families)</div>
                    </div>
                  </div>
                </div>
              </div>

              {isTwilightPicnic ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginBottom: 12 }}>
                    {([
                      ['wine', 'Hard Liquor'], ['glass', 'Wine'], ['glass', 'Beer'], ['glass', 'Non-Alcoholic'],
                    ] as const).map(([icon, label]) => (
                      <div key={label} style={{ background: "#fff", borderRadius: 16, padding: "16px", boxShadow: "0 2px 12px rgba(15,23,42,0.05)", display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${ACCENT}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon name={icon} size={15} color={ACCENT} />
                        </div>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: TEXT_DARK }}>{drinkCounts[label]}</div>
                          <div style={{ fontSize: 10, color: TEXT_MUTED }}>{label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div style={{ background: "#fff", borderRadius: 16, padding: "16px", boxShadow: "0 2px 12px rgba(15,23,42,0.05)", display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="home" size={15} color="#6d28d9" /></div>
                      <div><div style={{ fontSize: 18, fontWeight: 700, color: TEXT_DARK }}>{accommodationNeeded}</div><div style={{ fontSize: 10, color: TEXT_MUTED }}>Accommodation Needed</div></div>
                    </div>
                    <div style={{ background: "#fff", borderRadius: 16, padding: "16px", boxShadow: "0 2px 12px rgba(15,23,42,0.05)", display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="car" size={15} color="#0369a1" /></div>
                      <div><div style={{ fontSize: 18, fontWeight: 700, color: TEXT_DARK }}>{accommodationNotNeeded}</div><div style={{ fontSize: 10, color: TEXT_MUTED }}>Not Needed</div></div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ background: "#fff", borderRadius: 16, padding: "16px", boxShadow: "0 2px 12px rgba(15,23,42,0.05)", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="wine" size={15} color="#b45309" /></div>
                    <div><div style={{ fontSize: 18, fontWeight: 700, color: TEXT_DARK }}>{drinkingYes}</div><div style={{ fontSize: 10, color: TEXT_MUTED }}>Drinking Alcohol</div></div>
                  </div>
                  <div style={{ background: "#fff", borderRadius: 16, padding: "16px", boxShadow: "0 2px 12px rgba(15,23,42,0.05)", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="glass" size={15} color="#0369a1" /></div>
                    <div><div style={{ fontSize: 18, fontWeight: 700, color: TEXT_DARK }}>{drinkingNo}</div><div style={{ fontSize: 10, color: TEXT_MUTED }}>Non-Alcoholic</div></div>
                  </div>
                </div>
              )}

              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <button onClick={loadData} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: ACCENT,
                  background: "transparent", border: `1px solid ${BORDER}`, borderRadius: 100, padding: '8px 16px', cursor: "pointer", fontWeight: 600,
                }}>
                  <Icon name="refresh" size={13} color={ACCENT} /> Refresh Data
                </button>
              </div>
            </motion.div>
          )}

          {/* ── GUESTS TAB ── */}
          {activeTab === 'guests' && (
            <motion.div key="guests" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div style={{ position: 'relative', marginBottom: 14 }}>
                <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <Icon name="search" size={16} color="#94a3b8" />
                </div>
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search guest by name..."
                  style={{
                    width: "100%", padding: "12px 18px 12px 42px", borderRadius: 12, boxSizing: 'border-box',
                    border: `1px solid ${BORDER}`, background: "#fff", color: TEXT_DARK,
                    fontSize: 14, outline: "none", fontFamily: "'Inter',sans-serif",
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: TEXT_MUTED, alignSelf: 'center', marginRight: 4 }}>Status:</span>
                <div onClick={() => setFilterResponse('all')} style={pillStyle(filterResponse === 'all')}>All</div>
                <div onClick={() => setFilterResponse('yes')} style={pillStyle(filterResponse === 'yes')}>Attending</div>
                <div onClick={() => setFilterResponse('no')} style={pillStyle(filterResponse === 'no')}>Not Attending</div>
              </div>
              {!isTwilightPicnic && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 11, color: TEXT_MUTED, alignSelf: 'center', marginRight: 4 }}>Drinks:</span>
                  <div onClick={() => setFilterDrinking('all')} style={pillStyle(filterDrinking === 'all')}>All</div>
                  <div onClick={() => setFilterDrinking('yes')} style={pillStyle(filterDrinking === 'yes')}>Yes</div>
                  <div onClick={() => setFilterDrinking('no')} style={pillStyle(filterDrinking === 'no')}>No</div>
                </div>
              )}

              {filteredRsvps.length === 0 ? (
                <div style={{ textAlign: "center", padding: 48, background: "#fff", borderRadius: 16, color: TEXT_MUTED }}>
                  {rsvps.length === 0 ? "No RSVP responses yet. Share your invitation link with guests!" : "No guests match your filters."}
                </div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {filteredRsvps.map((r, i) => {
                    const seatTable = r.response === 'yes' ? findSeatForGuest(r.guest_name, couple.seats) : null
                    return (
                      <motion.div key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}
                        style={{
                          background: "#fff", borderRadius: 14, padding: "14px 18px",
                          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10,
                          boxShadow: "0 2px 10px rgba(15,23,42,0.05)",
                        }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK }}>{r.guest_name}</div>
                            {r.response === 'yes' && r.guest_count > 1 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: "2px 9px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: "#f3e8ff", color: "#7c3aed" }}>
                                <Icon name="users" size={11} color="#7c3aed" /> {r.guest_count}
                              </div>
                            )}
                            {seatTable && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: "2px 9px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: "#eef2ff", color: "#4f46e5" }}>
                                <Icon name="chair" size={11} color="#4f46e5" /> {seatTable}
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
                                    {r.drinking.split(',').filter(Boolean).join(', ') || 'No preference'}
                                  </div>
                                )}
                                {r.response === 'yes' && r.accommodation && (
                                  <div style={{
                                    padding: "6px 12px", borderRadius: 100, fontSize: 11, fontWeight: 600,
                                    background: r.accommodation === 'needed' ? '#ede9fe' : '#e0f2fe',
                                    color: r.accommodation === 'needed' ? '#6d28d9' : '#0369a1',
                                  }}>
                                    {r.accommodation === 'needed' ? 'Needs Stay' : 'Sorted'}
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
                                  {r.drinking === 'yes' ? 'Drinks' : 'No Drinks'}
                                </div>
                              )
                            )}
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              padding: "6px 14px", borderRadius: 100, fontSize: 12, fontWeight: 600,
                              background: r.response === 'yes' ? '#dcfce7' : '#fee2e2',
                              color: r.response === 'yes' ? '#16a34a' : '#dc2626',
                            }}>
                              <Icon name={r.response === 'yes' ? 'check' : 'cross'} size={11} color={r.response === 'yes' ? '#16a34a' : '#dc2626'} />
                              {r.response === 'yes' ? 'Attending' : 'Not Attending'}
                            </div>
                          </div>
                          <button type="button" onClick={() => handleDeleteRsvp(r.id, r.guest_name)} disabled={deletingRsvpId === r.id} style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '4px 12px', borderRadius: 100, border: '1px solid #fecaca', cursor: 'pointer',
                            background: '#fef2f2', color: '#dc2626', fontSize: 11, fontWeight: 500,
                            opacity: deletingRsvpId === r.id ? 0.6 : 1,
                          }}>
                            <Icon name="trash" size={11} color="#dc2626" />
                            {deletingRsvpId === r.id ? 'Removing...' : 'Remove'}
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ── BUDGET TAB ── */}
          {activeTab === 'budget' && (couple as any).enable_budget_tracker === true && (
            <motion.div key="budget" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <BudgetManager coupleId={couple.id} accent={ACCENT} />
            </motion.div>
          )}

          {/* ── WISHES TAB ── */}
          {activeTab === 'wishes' && (couple as any).enable_guest_wishes === true && (
            <motion.div key="wishes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <WishesManager coupleId={couple.id} accent={ACCENT} />
            </motion.div>
          )}

          {/* ── EDIT TAB ── */}
          {activeTab === 'edit' && (
            <motion.div key="edit" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <EditPanel couple={couple} onSaved={loadData} />
            </motion.div>
          )}

          {/* ── SHARE TAB ── */}
          {activeTab === 'share' && (couple as any).enable_guest_links !== false && (
            <motion.div key="share" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <GuestLinkGenerator couple={couple} accent={ACCENT} />
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ textAlign: "center", marginTop: 40, fontSize: 11, color: TEXT_MUTED }}>
          Auto-refreshes every 30 seconds · InviteGlow Dashboard
        </div>
      </div>
    </div>
  )
}
