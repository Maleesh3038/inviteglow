"use client"
import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
// Staff can change the PIN themselves from the Settings tab (they must
// know the current one), and an admin can always force-reset it from the
// Admin panel regardless.
//
// Data model: every guest who RSVPs "Attending" on the invitation gets a
// row in `event_guests` (see event_guests_migration.sql), and that row's
// own `id` is what's encoded in their personal QR code, as a link to the
// public /pass/<id> page (scanning it with any ordinary camera app just
// shows their name + EPF number — no attendance is marked by that).
// Actually counting someone as attending only ever happens here: this
// dashboard's own camera scan (or typing the short code / searching by
// name) looks the guest up and marks them checked in at the door, and
// marks their meal claimed at the food counter — each guest's QR is
// unique to them, so one QR can't be reused by someone else at either
// station. Staff can also remove a guest entirely (e.g. a duplicate
// walk-in entry) from the Guests tab.
//
// Layout: a tab strip (Overview / Guests / Budget / Settings), similar to
// the couple's own wedding dashboard, keeps the growing feature set
// organised instead of piling everything onto one long page. The Budget
// tab is a lightweight expense tracker for the event's own spending
// (see add_event_budget.sql for its table), separate from any couple's
// wedding budget.

const PREFIX = 'INVITEGLOW-GUEST-'
function extractGuestId(decoded: string): string | null {
  const trimmed = decoded.trim()
  // Current format: a link to the public pass page, e.g.
  // https://inviteglow.com/pass/<guest id> — take the last path segment.
  const m = trimmed.match(/\/pass\/([^/?#]+)\/?(?:[?#].*)?$/)
  if (m) return decodeURIComponent(m[1])
  // Backward-compat: older QR codes encoded as INVITEGLOW-GUEST-<id>.
  if (trimmed.startsWith(PREFIX)) return trimmed.slice(PREFIX.length)
  return null
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
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
  meal_pref: string | null
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
function fmtDateTime(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// ── Event Budget Tracker ──────────────────────────────────────────────
// A lightweight expense tracker scoped to one event (see
// add_event_budget.sql for the `event_budget_items` table). Separate from
// the couple-dashboard's own wedding budget tracker — different table,
// different owner (event vs couple) — but the same idea: log planned vs.
// paid amounts per line item so the organiser can see spend at a glance.
type EventBudgetItem = {
  id: string
  event_id: string
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
  { key: 'decor', label: 'Decor', icon: '💐' },
  { key: 'entertainment', label: 'Entertainment', icon: '🎵' },
  { key: 'av', label: 'AV & Equipment', icon: '🎤' },
  { key: 'giveaways', label: 'Giveaways & Prizes', icon: '🎁' },
  { key: 'transport', label: 'Transport', icon: '🚗' },
  { key: 'staffing', label: 'Staffing', icon: '🧑‍💼' },
  { key: 'other', label: 'Other', icon: '📦' },
]
const categoryMeta = (key: string) => BUDGET_CATEGORIES.find(c => c.key === key) || BUDGET_CATEGORIES[BUDGET_CATEGORIES.length - 1]
const emptyBudgetForm = {
  category: 'venue', item_name: '', vendor: '', estimated_cost: '', paid_amount: '', due_date: '', status: 'pending' as EventBudgetItem['status'], notes: '',
}

function EventBudgetManager({ eventId, accent }: { eventId: string; accent: string }) {
  const [items, setItems] = useState<EventBudgetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyBudgetForm)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [totalBudgetInput, setTotalBudgetInput] = useState('')
  const [totalBudget, setTotalBudget] = useState<number | null>(null)

  const TEXT_DARK = '#0f2438'
  const TEXT_MUTED = '#7c8a99'
  const BORDER = '#e2e8f0'

  const load = async () => {
    const { data } = await supabase.from('event_budget_items').select('*').eq('event_id', eventId).order('created_at', { ascending: true })
    if (data) setItems(data as EventBudgetItem[])
    setLoading(false)
  }
  useEffect(() => { load() }, [eventId])

  useEffect(() => {
    try {
      const saved = window.localStorage?.getItem?.(`event-budget-target-${eventId}`)
      if (saved) { setTotalBudget(parseFloat(saved)); setTotalBudgetInput(saved) }
    } catch { /* ignore */ }
  }, [eventId])
  const saveTotalBudget = () => {
    const val = parseFloat(totalBudgetInput)
    if (!isNaN(val) && val > 0) {
      setTotalBudget(val)
      try { window.localStorage?.setItem?.(`event-budget-target-${eventId}`, String(val)) } catch { /* ignore */ }
    }
  }

  const totalEstimated = items.reduce((s, i) => s + (i.estimated_cost || 0), 0)
  const totalPaid = items.reduce((s, i) => s + (i.paid_amount || 0), 0)
  const totalRemaining = totalEstimated - totalPaid
  const budgetTarget = totalBudget ?? totalEstimated
  const usedPct = budgetTarget > 0 ? Math.min(100, Math.round((totalEstimated / budgetTarget) * 100)) : 0
  const fmt = (n: number) => `LKR ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`

  const resetForm = () => { setForm(emptyBudgetForm); setEditingId(null); setShowForm(false) }
  const startEdit = (item: EventBudgetItem) => {
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
      event_id: eventId,
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
      ? await supabase.from('event_budget_items').update(payload).eq('id', editingId)
      : await supabase.from('event_budget_items').insert([payload])
    setSaving(false)
    if (!error) { resetForm(); load() }
  }
  const handleDeleteItem = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from the budget?`)) return
    setBusyId(id)
    const { error } = await supabase.from('event_budget_items').delete().eq('id', id)
    setBusyId(null)
    if (!error) setItems(prev => prev.filter(i => i.id !== id))
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 9, border: `1px solid ${BORDER}`,
    fontSize: 13.5, outline: 'none', fontFamily: "'Inter',sans-serif", background: '#fff', color: TEXT_DARK, boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = { fontSize: 10.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 5, display: 'block' }
  const statusMeta: Record<EventBudgetItem['status'], { label: string; bg: string; color: string }> = {
    pending: { label: 'Pending', bg: '#fef3c7', color: '#b45309' },
    partial: { label: 'Partially Paid', bg: '#dbeafe', color: '#1d4ed8' },
    paid: { label: 'Paid in Full', bg: '#dcfce7', color: '#16a34a' },
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40, color: TEXT_MUTED, fontSize: 13 }}>Loading budget…</div>
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginBottom: 14 }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 10, color: TEXT_MUTED, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimated</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: TEXT_DARK }}>{fmt(totalEstimated)}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paid</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>{fmt(totalPaid)}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 10, color: totalRemaining > 0 ? '#dc2626' : TEXT_MUTED, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Balance Due</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: totalRemaining > 0 ? '#dc2626' : TEXT_DARK }}>{fmt(Math.max(0, totalRemaining))}</div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: TEXT_DARK }}>Overall Budget Goal (optional)</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input value={totalBudgetInput} onChange={e => setTotalBudgetInput(e.target.value.replace(/[^\d.]/g, ''))}
              placeholder="e.g. 500000" style={{ ...inputStyle, width: 130, padding: '7px 10px', fontSize: 12.5 }} />
            <button onClick={saveTotalBudget} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: accent, color: '#fff', fontSize: 12, fontWeight: 700 }}>Set</button>
          </div>
        </div>
        {budgetTarget > 0 && (
          <>
            <div style={{ height: 8, background: '#f1f5f9', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${usedPct}%`, background: usedPct >= 100 ? '#dc2626' : `linear-gradient(90deg,${accent},${ACCENT_LIGHT})`, borderRadius: 100, transition: 'width 0.3s' }} />
            </div>
            <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 6 }}>{fmt(totalEstimated)} planned of {fmt(budgetTarget)} goal ({usedPct}%)</div>
          </>
        )}
      </div>

      {showForm ? (
        <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', marginBottom: 14 }}>
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
              <input value={form.item_name} onChange={e => setForm({ ...form, item_name: e.target.value })} placeholder="e.g. Sound System" style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Vendor (optional)</label>
            <input value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} placeholder="e.g. ABC Events" style={inputStyle} />
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
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as EventBudgetItem['status'] })} style={inputStyle}>
                <option value="pending">Pending</option>
                <option value="partial">Partially Paid</option>
                <option value="paid">Paid in Full</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Notes (optional)</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Contract details, contact info, etc." style={{ ...inputStyle, minHeight: 56, resize: 'vertical' }} />
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
          border: `1.5px dashed ${accent}`, cursor: 'pointer', background: `${accent}0d`, color: accent, fontWeight: 700, fontSize: 13, marginBottom: 14,
        }}>+ Add Expense</button>
      )}

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 34, background: '#fff', borderRadius: 14, color: TEXT_MUTED, fontSize: 13 }}>No expenses added yet.</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {items.map(item => {
            const meta = categoryMeta(item.category)
            const sMeta = statusMeta[item.status]
            const balance = (item.estimated_cost || 0) - (item.paid_amount || 0)
            return (
              <div key={item.id} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: '#f7f5ef', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{meta.icon}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: TEXT_DARK }}>{item.item_name}</div>
                      <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 1 }}>
                        {meta.label}{item.vendor ? ` · ${item.vendor}` : ''}{item.due_date ? ` · Due ${new Date(item.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '3px 10px', borderRadius: 100, fontSize: 10.5, fontWeight: 700, background: sMeta.bg, color: sMeta.color, whiteSpace: 'nowrap' }}>{sMeta.label}</div>
                </div>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: TEXT_MUTED, marginBottom: 10, paddingLeft: 42 }}>
                  <span>Est: <strong style={{ color: TEXT_DARK }}>{fmt(item.estimated_cost || 0)}</strong></span>
                  <span>Paid: <strong style={{ color: '#16a34a' }}>{fmt(item.paid_amount || 0)}</strong></span>
                  {balance > 0 && <span>Balance: <strong style={{ color: '#dc2626' }}>{fmt(balance)}</strong></span>}
                </div>
                {item.notes && <div style={{ fontSize: 11.5, color: TEXT_MUTED, marginBottom: 10, paddingLeft: 42, fontStyle: 'italic' }}>{item.notes}</div>}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => startEdit(item)} style={{ padding: '5px 12px', borderRadius: 100, border: `1px solid ${BORDER}`, cursor: 'pointer', background: '#f8fafc', color: TEXT_MUTED, fontSize: 11, fontWeight: 600 }}>Edit</button>
                  <button onClick={() => handleDeleteItem(item.id, item.item_name)} disabled={busyId === item.id} style={{ padding: '5px 12px', borderRadius: 100, border: '1px solid #fecaca', cursor: 'pointer', background: '#fef2f2', color: '#dc2626', fontSize: 11, fontWeight: 600, opacity: busyId === item.id ? 0.6 : 1 }}>{busyId === item.id ? 'Removing...' : 'Delete'}</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const TABS = [
  { key: 'overview', label: 'Overview', icon: '🏠' },
  { key: 'guests', label: 'Guests', icon: '👥' },
  { key: 'budget', label: 'Budget', icon: '💰' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
] as const
type TabKey = typeof TABS[number]['key']

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
  const [activeTab, setActiveTab] = useState<TabKey>('overview')

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
  const [walkinMeal, setWalkinMeal] = useState<'veg' | 'non-veg' | null>(null)
  const [savingWalkin, setSavingWalkin] = useState(false)

  const [deletingGuestId, setDeletingGuestId] = useState<string | null>(null)

  const [pinCurrent, setPinCurrent] = useState('')
  const [pinNew, setPinNew] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [pinMsg, setPinMsg] = useState('')
  const [changingPin, setChangingPin] = useState(false)

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

  const recentCheckins = useMemo(() => {
    return guests
      .filter(g => g.checked_in && g.checked_in_at)
      .sort((a, b) => (a.checked_in_at! < b.checked_in_at! ? 1 : -1))
      .slice(0, 6)
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

  const handleDeleteGuest = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from the guest list? This can't be undone.`)) return
    setDeletingGuestId(id)
    const { error } = await supabase.from('event_guests').delete().eq('id', id)
    setDeletingGuestId(null)
    if (!error) setGuests(prev => prev.filter(g => g.id !== id))
  }

  const handleChangePin = async () => {
    if (!event) return
    setPinMsg('')
    if (pinCurrent.trim() !== (event.pin || '')) { setPinMsg('Current PIN is incorrect.'); return }
    if (!/^\d{4}$/.test(pinNew)) { setPinMsg('New PIN must be exactly 4 digits.'); return }
    if (pinNew !== pinConfirm) { setPinMsg("New PIN and confirmation don't match."); return }
    setChangingPin(true)
    const { error } = await supabase.from('events').update({ pin: pinNew }).eq('id', event.id)
    setChangingPin(false)
    if (error) { setPinMsg('Could not update PIN: ' + error.message); return }
    setEvent(prev => prev ? { ...prev, pin: pinNew } : prev)
    setPinCurrent(''); setPinNew(''); setPinConfirm('')
    setPinMsg('✓ PIN updated. Share the new PIN with staff before their next login.')
  }

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
      .insert([{ event_id: event.id, guest_name: walkinName.trim(), phone: walkinPhone.trim() || null, epf_no: walkinEpf.trim() || null, guest_count: walkinCount, meal_pref: walkinMeal, checked_in: true, checked_in_at: new Date().toISOString() }])
      .select('*').single()
    setSavingWalkin(false)
    if (!error && data) {
      setGuests(prev => [...prev, data as Guest].sort((a, b) => a.guest_name.localeCompare(b.guest_name)))
      setWalkinOpen(false); setWalkinName(''); setWalkinPhone(''); setWalkinEpf(''); setWalkinCount(1); setWalkinMeal(null)
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

  const avatarStyle: React.CSSProperties = {
    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
    background: `linear-gradient(135deg,${ACCENT},${ACCENT_LIGHT})`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 800, fontSize: 13,
  }
  const card: React.CSSProperties = { background: '#fff', borderRadius: 14, padding: 18, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', marginBottom: 14 }
  const settingsInput: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 15, textAlign: 'center', letterSpacing: '0.2em', marginBottom: 10, boxSizing: 'border-box' }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f5ef', fontFamily: "'Inter',sans-serif" }}>
      <div style={{ background: ACCENT, color: '#fff', padding: '18px 20px' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.75 }}>Check-in Dashboard</div>
        <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>{event.title}</div>
        {event.host && <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>Organized by {event.host}</div>}
      </div>

      <div style={{ position: 'sticky', top: 0, zIndex: 40, background: '#f7f5ef', padding: '12px 16px 8px', borderBottom: '1px solid #ece4d2' }}>
        <div style={{ display: 'flex', gap: 4, background: '#ece7d9', borderRadius: 100, padding: 4, maxWidth: 460, margin: '0 auto', overflowX: 'auto' }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              flex: '1 1 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px 8px', borderRadius: 100,
              border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
              background: activeTab === tab.key ? '#fff' : 'transparent',
              color: activeTab === tab.key ? ACCENT : '#8a7d5f',
              boxShadow: activeTab === tab.key ? '0 2px 8px rgba(15,23,42,0.1)' : 'none',
              transition: 'all 0.15s',
            }}>
              <span>{tab.icon}</span><span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px 100px' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 10, marginBottom: 16 }}>
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

              <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
                <button onClick={startScan} style={{ flex: '1 1 160px', padding: '13px 16px', borderRadius: 10, border: 'none', background: ACCENT_LIGHT, color: '#1c1400', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>📷 Scan QR</button>
                <button onClick={() => setWalkinOpen(true)} style={{ flex: '1 1 160px', padding: '13px 16px', borderRadius: 10, border: `1.5px solid ${ACCENT}`, background: '#fff', color: ACCENT, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>+ Add Walk-in Guest</button>
              </div>

              <div style={card}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f2438', marginBottom: 12 }}>Recent Check-ins</div>
                {recentCheckins.length === 0 ? (
                  <div style={{ fontSize: 12.5, color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>No one has checked in yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {recentCheckins.map(g => (
                      <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ ...avatarStyle, width: 32, height: 32, fontSize: 11 }}>{initials(g.guest_name)}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f2438', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.guest_name}{g.meal_pref ? (g.meal_pref === 'veg' ? ' 🥗' : ' 🍗') : ''}</div>
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>{fmtDateTime(g.checked_in_at)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'guests' && (
            <motion.div key="guests" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                  value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, or code..."
                  style={{ flex: 1, padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box', background: '#fff' }}
                />
                <button onClick={() => setWalkinOpen(true)} style={{ padding: '0 16px', borderRadius: 10, border: `1.5px solid ${ACCENT}`, background: '#fff', color: ACCENT, fontWeight: 700, fontSize: 18, cursor: 'pointer' }}>+</button>
              </div>

              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 30 }}>No guests match.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filtered.map(g => (
                    <div key={g.id} style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
                          <div style={avatarStyle}>{initials(g.guest_name)}</div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f2438' }}>{g.guest_name}{g.guest_count > 1 ? ` (+${g.guest_count - 1})` : ''}{g.meal_pref ? (g.meal_pref === 'veg' ? ' 🥗' : ' 🍗') : ''}</div>
                            <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>{g.epf_no ? `EPF ${g.epf_no}` : 'no EPF'} · {g.phone || 'no phone'} · Code {g.id.slice(0, 8).toUpperCase()}</div>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteGuest(g.id, g.guest_name)} disabled={deletingGuestId === g.id} title="Remove guest" style={{
                          background: 'transparent', border: 'none', cursor: 'pointer', color: '#cbd5e1', fontSize: 15, padding: 4, lineHeight: 1, flexShrink: 0,
                          opacity: deletingGuestId === g.id ? 0.4 : 1,
                        }}>🗑</button>
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
            </motion.div>
          )}

          {activeTab === 'budget' && (
            <motion.div key="budget" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <EventBudgetManager eventId={event.id} accent={ACCENT} />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <div style={card}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f2438', marginBottom: 12 }}>Event Details</div>
                <div style={{ fontSize: 13, color: '#475569', marginBottom: 6 }}><strong>Title:</strong> {event.title}</div>
                {event.host && <div style={{ fontSize: 13, color: '#475569', marginBottom: 6 }}><strong>Organized by:</strong> {event.host}</div>}
                <div style={{ fontSize: 13, color: '#475569' }}><strong>Link:</strong> /{event.slug}</div>
              </div>

              <div style={card}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f2438', marginBottom: 4 }}>Change Dashboard PIN</div>
                <div style={{ fontSize: 11.5, color: '#94a3b8', marginBottom: 14 }}>You'll need to share the new PIN with anyone else using this dashboard. Forgot it entirely? Ask an admin to reset it from the Admin panel.</div>
                <input type="password" inputMode="numeric" placeholder="Current PIN" maxLength={4} value={pinCurrent} onChange={e => setPinCurrent(e.target.value.replace(/\D/g, '').slice(0, 4))} style={settingsInput} />
                <input type="password" inputMode="numeric" placeholder="New 4-digit PIN" maxLength={4} value={pinNew} onChange={e => setPinNew(e.target.value.replace(/\D/g, '').slice(0, 4))} style={settingsInput} />
                <input type="password" inputMode="numeric" placeholder="Confirm new PIN" maxLength={4} value={pinConfirm} onChange={e => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))} style={settingsInput} />
                {pinMsg && <div style={{ fontSize: 12.5, marginBottom: 10, color: pinMsg.startsWith('✓') ? '#16a34a' : '#dc2626' }}>{pinMsg}</div>}
                <button onClick={handleChangePin} disabled={changingPin} style={{ width: '100%', padding: 13, borderRadius: 10, border: 'none', background: ACCENT, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: changingPin ? 0.6 : 1 }}>
                  {changingPin ? 'Updating...' : 'Update PIN'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
                    <div style={{ ...avatarStyle, margin: '0 auto 8px' }}>{initials(scannedGuest.guest.guest_name)}</div>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>✅</div>
                    <div style={{ fontSize: 13.5, color: '#16a34a', fontWeight: 700 }}>Welcome, {scannedGuest.guest.guest_name.split(' ')[0]}!</div>
                  </div>
                )}
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f2438', textAlign: 'center' }}>{scannedGuest.guest.guest_name}{scannedGuest.guest.guest_count > 1 ? ` (+${scannedGuest.guest.guest_count - 1})` : ''}{scannedGuest.guest.meal_pref ? (scannedGuest.guest.meal_pref === 'veg' ? ' 🥗' : ' 🍗') : ''}</div>
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
            <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 8 }}>Meal (optional):</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button onClick={() => setWalkinMeal(m => m === 'veg' ? null : 'veg')} style={{ flex: 1, padding: 10, borderRadius: 8, border: walkinMeal === 'veg' ? `1.5px solid ${ACCENT}` : '1px solid #e2e8f0', background: walkinMeal === 'veg' ? `${ACCENT}11` : '#fff', color: walkinMeal === 'veg' ? ACCENT : '#64748b', fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}>🥗 Veg</button>
              <button onClick={() => setWalkinMeal(m => m === 'non-veg' ? null : 'non-veg')} style={{ flex: 1, padding: 10, borderRadius: 8, border: walkinMeal === 'non-veg' ? `1.5px solid ${ACCENT}` : '1px solid #e2e8f0', background: walkinMeal === 'non-veg' ? `${ACCENT}11` : '#fff', color: walkinMeal === 'non-veg' ? ACCENT : '#64748b', fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}>🍗 Non-Veg</button>
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
