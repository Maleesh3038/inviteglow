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
// Look & feel: deliberately restrained — one accent color (navy), neutral
// grays, plain line icons instead of emoji — a "real software tool" feel
// rather than a themed/colorful wedding-site look, since this page is
// used by event staff at a door, often glanced at quickly.
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
// Personalised guest links: the Share tab generates a link like
// /invite/<event-slug>?name=<Guest Name> — the invitation template
// (CorporateEventTemplate.tsx) already reads that `?name=` param, shows a
// "Dear <Name>," welcome screen for a few seconds before the invitation
// opens, and pre-fills the guest's name in the RSVP form. This mirrors
// the couple-dashboard's own "Generate Guest Link" tool.
//
// Layout: a tab strip (Overview / Guests / Share / Budget / Settings),
// similar to the couple's own wedding dashboard, keeps the growing
// feature set organised instead of piling everything onto one long page.

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

// ── Minimal line-icon set — no emoji anywhere in this dashboard. Plain
// stroke icons in one weight, colored via `color` (defaults to inherit),
// matching the clean/neutral look used elsewhere in the admin tooling. ──
type IconName = 'home' | 'users' | 'share' | 'wallet' | 'settings' | 'camera' | 'plus' | 'trash' | 'check' | 'alert' | 'copy' | 'whatsapp' | 'x' | 'chevronRight' | 'download'
function Icon({ name, size = 16, color = 'currentColor' }: { name: IconName; size?: number; color?: string }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (name) {
    case 'home': return <svg {...common}><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" /></svg>
    case 'users': return <svg {...common}><circle cx="9" cy="8" r="3.2" /><path d="M2.8 19c0-3 2.8-5 6.2-5s6.2 2 6.2 5" /><path d="M15.5 5.3a3.2 3.2 0 0 1 0 6" /><path d="M16.3 14.3c2.6.4 4.9 2.1 4.9 4.7" /></svg>
    case 'share': return <svg {...common}><circle cx="18" cy="5" r="2.4" /><circle cx="6" cy="12" r="2.4" /><circle cx="18" cy="19" r="2.4" /><path d="M8.1 10.8 15.9 6.2M8.1 13.2l7.8 4.6" /></svg>
    case 'wallet': return <svg {...common}><rect x="2.5" y="6" width="19" height="13" rx="2.2" /><path d="M2.5 10h19" /><circle cx="16.7" cy="14" r="1.1" fill={color} stroke="none" /></svg>
    case 'settings': return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 13.5a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V19.5a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H4.5a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 6.1 8.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 8.54 3.9l.06.06a1.65 1.65 0 0 0 1.82.33H10.5a1.65 1.65 0 0 0 1-1.51V2.6a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.1a1.65 1.65 0 0 0 1.51 1H21.5a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" /></svg>
    case 'camera': return <svg {...common}><path d="M4 8.5h2.6l1.3-2h8.2l1.3 2H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z" /><circle cx="12" cy="13.5" r="3.4" /></svg>
    case 'plus': return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>
    case 'trash': return <svg {...common}><path d="M4 7h16" /><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /><path d="M6.5 7l1 12.2a1.6 1.6 0 0 0 1.6 1.5h5.8a1.6 1.6 0 0 0 1.6-1.5L18 7" /><path d="M10 11v6M14 11v6" /></svg>
    case 'check': return <svg {...common}><path d="M20 6.5 9.5 17 4 11.6" /></svg>
    case 'alert': return <svg {...common}><path d="M10.6 4.1 2.4 18a1.5 1.5 0 0 0 1.3 2.3h16.6a1.5 1.5 0 0 0 1.3-2.3L13.4 4.1a1.5 1.5 0 0 0-2.8 0Z" /><path d="M12 10v4" /><circle cx="12" cy="17" r="0.15" fill={color} stroke={color} /></svg>
    case 'copy': return <svg {...common}><rect x="9" y="9" width="12" height="12" rx="1.8" /><path d="M6 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2" /></svg>
    case 'whatsapp': return <svg {...common} strokeWidth={1.5}><path d="M4 20l1.3-4A8 8 0 1 1 8.5 19L4 20Z" /><path d="M8.7 8.7c-.2.6-.2 1.7.6 2.9 1 1.6 2.4 2.7 4.2 3.2 1 .3 1.6 0 2-.6l.4-.7" /></svg>
    case 'x': return <svg {...common}><path d="M6 6l12 12M18 6 6 18" /></svg>
    case 'chevronRight': return <svg {...common}><path d="M9 6l6 6-6 6" /></svg>
    case 'download': return <svg {...common}><path d="M12 4v11" /><path d="M7.5 11.5 12 16l4.5-4.5" /><path d="M4.5 17.5v2a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-2" /></svg>
  }
}

type EventRow = {
  id: string
  slug: string
  title: string
  host?: string | null
  event_date: string
  pin?: string | null
  template?: string | null
  ask_drinking?: boolean | null
  ask_meal_pref?: boolean | null
  whatsapp_invite_message?: string | null
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

// ── Neutral, single-accent palette. No gold/cream theme here on
// purpose — this is a working tool, not the invitation itself. ──
const ACCENT = '#1c3d5a'
const BG = '#f4f5f7'
const CARD = '#ffffff'
const BORDER = '#e5e8ec'
const TEXT_DARK = '#111827'
const TEXT_MUTED = '#6b7280'
const SUCCESS = '#15803d'
const WARNING = '#b45309'
const DANGER = '#dc2626'

function fmtTime(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}
function fmtDateTime(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// ── CSV export — a plain client-side download, no server round-trip.
// Used both for the full guest list (a handy offline backup in case the
// venue's wifi drops mid-event) and for bulk-generated guest links. ──
function csvEscape(val: string | number) {
  const s = String(val ?? '')
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
  return s
}
function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv = [headers, ...rows].map(r => r.map(csvEscape).join(',')).join('\r\n')
  // Leading BOM so Excel opens UTF-8 (Sinhala names etc.) correctly.
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
function safeFileName(s: string) {
  return s.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'event'
}

// ── Personalised Guest Link generator ────────────────────────────────
// Mirrors the couple-dashboard's "Generate Guest Link" tool: type a
// guest's name, get a link like /invite/<slug>?name=<name>. Opening that
// link shows a brief "Dear <Name>," welcome screen before the invitation
// itself opens, and pre-fills the RSVP form with that name.
const DEFAULT_WA_MESSAGE = "Hi {name}! You're invited to {event}. Please tap below to view your invitation and confirm your attendance."

function GuestLinkGenerator({ event, accent, onMessageSaved }: { event: EventRow; accent: string; onMessageSaved: (msg: string) => void }) {
  const [guestName, setGuestName] = useState('')
  const [copied, setCopied] = useState(false)
  const [waMessage, setWaMessage] = useState(event.whatsapp_invite_message || DEFAULT_WA_MESSAGE.replace('{event}', event.title))
  const [editingMsg, setEditingMsg] = useState(false)
  const [savingMsg, setSavingMsg] = useState(false)

  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/invite/${event.slug}` : `/invite/${event.slug}`
  const generatedLink = guestName.trim() ? `${baseUrl}?name=${encodeURIComponent(guestName.trim())}` : baseUrl
  // Swaps {name} for the guest currently typed above — if nothing's typed
  // yet, leaves the placeholder visible so it's clear a name goes there.
  const personalizedMessage = waMessage.replace(/\{name\}/g, guestName.trim() || '{name}')
  const fullMessage = `${personalizedMessage}\n${generatedLink}`

  const copyLink = async () => {
    if (!guestName.trim()) return
    try {
      await navigator.clipboard.writeText(generatedLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }
  const shareWhatsApp = () => {
    if (!guestName.trim()) return
    window.open(`https://wa.me/?text=${encodeURIComponent(fullMessage)}`, '_blank')
  }
  const saveMessage = async () => {
    setSavingMsg(true)
    const { error } = await supabase.from('events').update({ whatsapp_invite_message: waMessage }).eq('id', event.id)
    setSavingMsg(false)
    if (!error) { onMessageSaved(waMessage); setEditingMsg(false) }
  }

  const input: React.CSSProperties = { width: '100%', padding: '11px 13px', borderRadius: 9, border: `1px solid ${BORDER}`, fontSize: 13.5, outline: 'none', fontFamily: "'Inter',sans-serif", color: TEXT_DARK, boxSizing: 'border-box', background: '#fff' }

  return (
    <div style={{ background: CARD, borderRadius: 12, border: `1px solid ${BORDER}`, padding: 18 }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: TEXT_DARK, marginBottom: 4 }}>Generate a Guest Link</div>
      <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 14, lineHeight: 1.5 }}>
        Type a guest's name to create a personalised invitation link. Opening it greets them by name for a few seconds before the invitation opens, and fills their name into the RSVP form automatically.
      </div>
      <input value={guestName} onChange={e => { setGuestName(e.target.value); setCopied(false) }} placeholder="e.g. Nadeesha Perera" style={{ ...input, marginBottom: 10 }} />
      {guestName.trim() && (
        <div style={{ background: '#f8fafc', borderRadius: 9, padding: '10px 12px', marginBottom: 12, fontSize: 12, color: TEXT_MUTED, wordBreak: 'break-all', border: `1px solid ${BORDER}` }}>
          {generatedLink}
        </div>
      )}

      <div style={{ background: '#f8fafc', borderRadius: 9, padding: '12px 14px', marginBottom: 12, border: `1px solid ${BORDER}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_DARK }}>WhatsApp Message</div>
          <button onClick={() => setEditingMsg(!editingMsg)} style={{ fontSize: 11, color: accent, background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            {editingMsg ? 'Cancel' : 'Edit'}
          </button>
        </div>
        {editingMsg ? (
          <div>
            <div style={{ fontSize: 10.5, color: TEXT_MUTED, marginBottom: 6 }}>Tip: type <strong>{'{name}'}</strong> anywhere and it'll be swapped for the guest's name above. The link is always added on a new line automatically.</div>
            <textarea value={waMessage} onChange={e => setWaMessage(e.target.value)} style={{ ...input, minHeight: 80, resize: 'vertical', marginBottom: 8 }} />
            <button onClick={saveMessage} disabled={savingMsg} style={{ padding: '8px 16px', borderRadius: 8, background: accent, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, opacity: savingMsg ? 0.6 : 1 }}>
              {savingMsg ? 'Saving...' : 'Save Message'}
            </button>
          </div>
        ) : (
          <div style={{ fontSize: 12.5, color: TEXT_DARK, whiteSpace: 'pre-wrap' }}>{personalizedMessage}<br /><span style={{ color: TEXT_MUTED }}>[link auto-added]</span></div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={copyLink} disabled={!guestName.trim()} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 9, border: 'none',
          cursor: guestName.trim() ? 'pointer' : 'default', background: copied ? SUCCESS : accent, color: '#fff', fontWeight: 600, fontSize: 13, opacity: guestName.trim() ? 1 : 0.4,
        }}>
          <Icon name={copied ? 'check' : 'copy'} size={14} color="#fff" /> {copied ? 'Copied' : 'Copy Link'}
        </button>
        <button onClick={shareWhatsApp} disabled={!guestName.trim()} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 9, border: `1px solid ${BORDER}`,
          cursor: guestName.trim() ? 'pointer' : 'default', background: '#fff', color: TEXT_DARK, fontWeight: 600, fontSize: 13, opacity: guestName.trim() ? 1 : 0.4,
        }}>
          <Icon name="whatsapp" size={14} color={TEXT_DARK} /> WhatsApp
        </button>
      </div>
    </div>
  )
}

// ── Bulk guest link generation ───────────────────────────────────────
// For sending links to a whole guest list at once instead of one at a
// time. WhatsApp itself has no way to auto-send to many numbers without
// their paid Business API, so this generates every guest's personalised
// link up front and gives a ready-to-tap "Send" per person (opens that
// one chat, pre-filled — still one tap each, but no retyping names or
// links), plus a CSV export of the whole batch for a bulk SMS tool or a
// WhatsApp broadcast list.
function BulkGuestLinks({ event, accent }: { event: EventRow; accent: string }) {
  const [bulkInput, setBulkInput] = useState('')
  const [rows, setRows] = useState<{ name: string; phone: string; link: string }[]>([])

  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/invite/${event.slug}` : `/invite/${event.slug}`

  const generate = () => {
    const parsed = bulkInput.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
      const [namePart, phonePart] = line.split(',')
      const name = (namePart || '').trim()
      const phone = (phonePart || '').trim()
      return { name, phone, link: name ? `${baseUrl}?name=${encodeURIComponent(name)}` : baseUrl }
    }).filter(r => r.name)
    setRows(parsed)
  }

  const waLinkFor = (r: { name: string; phone: string; link: string }) => {
    // Reuses whatever WhatsApp message template is saved for this event
    // (editable above, in the single-guest generator) so bulk-sent
    // messages match what's been customised, instead of a second
    // hardcoded copy going stale.
    const template = event.whatsapp_invite_message || DEFAULT_WA_MESSAGE.replace('{event}', event.title)
    const msg = `${template.replace(/\{name\}/g, r.name)}\n${r.link}`
    const digits = r.phone.replace(/[^\d+]/g, '').replace(/^\+/, '')
    return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`
  }

  const exportLinks = () => {
    downloadCsv(`${safeFileName(event.title)}-guest-links.csv`, ['Name', 'Phone', 'Link'], rows.map(r => [r.name, r.phone, r.link]))
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '11px 13px', borderRadius: 9, border: `1px solid ${BORDER}`, fontSize: 13, outline: 'none', fontFamily: "'Inter',sans-serif", color: TEXT_DARK, boxSizing: 'border-box', background: '#fff' }

  return (
    <div style={{ background: CARD, borderRadius: 12, border: `1px solid ${BORDER}`, padding: 18, marginTop: 14 }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: TEXT_DARK, marginBottom: 4 }}>Bulk Generate Links</div>
      <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 12, lineHeight: 1.5 }}>
        Paste your guest list, one per line, as <strong>Name, Phone</strong> (phone is optional). Each guest gets their own personalised link. WhatsApp doesn't allow auto-sending to many numbers at once, so "Send" opens one pre-filled chat at a time — or export everything as a spreadsheet for a bulk SMS tool.
      </div>
      <textarea
        value={bulkInput} onChange={e => setBulkInput(e.target.value)}
        placeholder={'Nadeesha Perera, 0771234567\nKasun Silva, 0759876543\nAmara Fernando'}
        style={{ ...inputStyle, minHeight: 100, resize: 'vertical', marginBottom: 10, fontFamily: "'Inter',sans-serif" }}
      />
      <div style={{ display: 'flex', gap: 8, marginBottom: rows.length ? 14 : 0 }}>
        <button onClick={generate} disabled={!bulkInput.trim()} style={{
          flex: 1, padding: 12, borderRadius: 9, border: 'none', cursor: bulkInput.trim() ? 'pointer' : 'default',
          background: accent, color: '#fff', fontWeight: 600, fontSize: 13, opacity: bulkInput.trim() ? 1 : 0.4,
        }}>Generate Links</button>
        {rows.length > 0 && (
          <button onClick={exportLinks} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', borderRadius: 9, border: `1px solid ${BORDER}`, background: '#fff', color: TEXT_DARK, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            <Icon name="download" size={14} /> Export CSV
          </button>
        )}
      </div>
      {rows.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 2 }}>{rows.length} link{rows.length === 1 ? '' : 's'} generated</div>
          {rows.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '9px 12px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: TEXT_DARK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                <div style={{ fontSize: 11, color: TEXT_MUTED }}>{r.phone || 'no phone'}</div>
              </div>
              <a href={waLinkFor(r)} target="_blank" rel="noopener noreferrer" style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '7px 11px', borderRadius: 100, border: `1px solid ${BORDER}`,
                color: TEXT_DARK, fontSize: 11.5, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                <Icon name="whatsapp" size={12} /> Send
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
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
  { key: 'venue', label: 'Venue' },
  { key: 'catering', label: 'Catering' },
  { key: 'decor', label: 'Decor' },
  { key: 'entertainment', label: 'Entertainment' },
  { key: 'av', label: 'AV & Equipment' },
  { key: 'giveaways', label: 'Giveaways & Prizes' },
  { key: 'transport', label: 'Transport' },
  { key: 'staffing', label: 'Staffing' },
  { key: 'other', label: 'Other' },
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
    width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${BORDER}`,
    fontSize: 13.5, outline: 'none', fontFamily: "'Inter',sans-serif", background: '#fff', color: TEXT_DARK, boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = { fontSize: 10.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 5, display: 'block' }
  const statusDot: Record<EventBudgetItem['status'], string> = { pending: WARNING, partial: '#2563eb', paid: SUCCESS }
  const statusLabel: Record<EventBudgetItem['status'], string> = { pending: 'Pending', partial: 'Partially Paid', paid: 'Paid in Full' }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40, color: TEXT_MUTED, fontSize: 13 }}>Loading budget…</div>
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginBottom: 14 }}>
        <div style={{ background: CARD, borderRadius: 12, border: `1px solid ${BORDER}`, padding: 16 }}>
          <div style={{ fontSize: 10, color: TEXT_MUTED, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimated</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: TEXT_DARK }}>{fmt(totalEstimated)}</div>
        </div>
        <div style={{ background: CARD, borderRadius: 12, border: `1px solid ${BORDER}`, padding: 16 }}>
          <div style={{ fontSize: 10, color: TEXT_MUTED, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paid</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: TEXT_DARK }}>{fmt(totalPaid)}</div>
        </div>
        <div style={{ background: CARD, borderRadius: 12, border: `1px solid ${BORDER}`, padding: 16 }}>
          <div style={{ fontSize: 10, color: TEXT_MUTED, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Balance Due</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: totalRemaining > 0 ? DANGER : TEXT_DARK }}>{fmt(Math.max(0, totalRemaining))}</div>
        </div>
      </div>

      <div style={{ background: CARD, borderRadius: 12, border: `1px solid ${BORDER}`, padding: 16, marginBottom: 16 }}>
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
            <div style={{ height: 6, background: '#eef0f2', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${usedPct}%`, background: usedPct >= 100 ? DANGER : accent, borderRadius: 100, transition: 'width 0.3s' }} />
            </div>
            <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 6 }}>{fmt(totalEstimated)} planned of {fmt(budgetTarget)} goal ({usedPct}%)</div>
          </>
        )}
      </div>

      {showForm ? (
        <div style={{ background: CARD, borderRadius: 12, border: `1px solid ${BORDER}`, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: TEXT_DARK, marginBottom: 14 }}>{editingId ? 'Edit Expense' : 'Add Expense'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>
                {BUDGET_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
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
              flex: 1, padding: 12, borderRadius: 9, border: 'none', cursor: 'pointer', background: accent, color: '#fff',
              fontWeight: 700, fontSize: 13, opacity: (saving || !form.item_name.trim()) ? 0.6 : 1,
            }}>{saving ? 'Saving...' : editingId ? 'Update Expense' : 'Add Expense'}</button>
            <button onClick={resetForm} style={{ padding: '12px 18px', borderRadius: 9, border: `1px solid ${BORDER}`, cursor: 'pointer', background: '#fff', color: TEXT_MUTED, fontWeight: 600, fontSize: 13 }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: 13, borderRadius: 10,
          border: `1px dashed ${BORDER}`, cursor: 'pointer', background: '#fff', color: TEXT_DARK, fontWeight: 600, fontSize: 13, marginBottom: 14,
        }}><Icon name="plus" size={14} /> Add Expense</button>
      )}

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 34, background: CARD, borderRadius: 12, border: `1px solid ${BORDER}`, color: TEXT_MUTED, fontSize: 13 }}>No expenses added yet.</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {items.map(item => {
            const meta = categoryMeta(item.category)
            const balance = (item.estimated_cost || 0) - (item.paid_amount || 0)
            return (
              <div key={item.id} style={{ background: CARD, borderRadius: 12, border: `1px solid ${BORDER}`, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: TEXT_DARK }}>{item.item_name}</div>
                    <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 1 }}>
                      {meta.label}{item.vendor ? ` · ${item.vendor}` : ''}{item.due_date ? ` · Due ${new Date(item.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: TEXT_MUTED, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusDot[item.status], display: 'inline-block' }} />
                    {statusLabel[item.status]}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: TEXT_MUTED, marginBottom: 10 }}>
                  <span>Est: <strong style={{ color: TEXT_DARK }}>{fmt(item.estimated_cost || 0)}</strong></span>
                  <span>Paid: <strong style={{ color: TEXT_DARK }}>{fmt(item.paid_amount || 0)}</strong></span>
                  {balance > 0 && <span>Balance: <strong style={{ color: DANGER }}>{fmt(balance)}</strong></span>}
                </div>
                {item.notes && <div style={{ fontSize: 11.5, color: TEXT_MUTED, marginBottom: 10, fontStyle: 'italic' }}>{item.notes}</div>}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => startEdit(item)} style={{ padding: '5px 12px', borderRadius: 100, border: `1px solid ${BORDER}`, cursor: 'pointer', background: '#fff', color: TEXT_MUTED, fontSize: 11, fontWeight: 600 }}>Edit</button>
                  <button onClick={() => handleDeleteItem(item.id, item.item_name)} disabled={busyId === item.id} style={{ padding: '5px 12px', borderRadius: 100, border: `1px solid ${BORDER}`, cursor: 'pointer', background: '#fff', color: DANGER, fontSize: 11, fontWeight: 600, opacity: busyId === item.id ? 0.6 : 1 }}>{busyId === item.id ? 'Removing...' : 'Delete'}</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const TABS: { key: 'overview' | 'guests' | 'share' | 'budget' | 'settings'; label: string; icon: IconName }[] = [
  { key: 'overview', label: 'Overview', icon: 'home' },
  { key: 'guests', label: 'Guests', icon: 'users' },
  { key: 'share', label: 'Share', icon: 'share' },
  { key: 'budget', label: 'Budget', icon: 'wallet' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
]
type TabKey = typeof TABS[number]['key']

export default function EventDashboardClient({ slug }: { slug: string }) {
  const [checkingSession, setCheckingSession] = useState(true)
  const [unlocked, setUnlocked] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [authError, setAuthError] = useState('')
  const [authChecking, setAuthChecking] = useState(false)

  const [event, setEvent] = useState<EventRow | null>(null)
  // The EPF/QR entry-pass fields and meal check-off below are a Corporate
  // Event-specific check-in workflow — not relevant on a family/religious
  // event's dashboard like First Holy Communion, where guests never submit
  // an EPF number and there's no catered-meal handout to track.
  const isCorporate = event?.template === 'corporate-event'
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
      const { data: ev, error } = await supabase.from('events').select('id,slug,title,host,event_date,pin,template,ask_drinking,ask_meal_pref,whatsapp_invite_message').eq('slug', slug).single()
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

  // Headcounts for the caterer — counted against every registered guest
  // (guest_count, not just the primary RSVP name), same as the "Total
  // Guests" stat above.
  const cateringSummary = useMemo(() => {
    const sumWhere = (pred: (g: Guest) => boolean) => guests.filter(pred).reduce((s, g) => s + (g.guest_count || 1), 0)
    return {
      veg: sumWhere(g => g.meal_pref === 'veg'),
      nonVeg: sumWhere(g => g.meal_pref === 'non-veg'),
      noMealPref: sumWhere(g => !g.meal_pref),
      drinkingYes: sumWhere(g => g.drinking === 'yes'),
      drinkingNo: sumWhere(g => g.drinking === 'no'),
      noDrinkingPref: sumWhere(g => !g.drinking),
    }
  }, [guests])

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

  const exportGuestsCsv = () => {
    if (!event) return
    downloadCsv(
      `${safeFileName(event.title)}-guests.csv`,
      ['Name', 'EPF No', 'Phone', 'Guest Count', 'Meal Preference', 'Drinking', 'Checked In', 'Checked In At', 'Meal Claimed', 'Meal Claimed At', 'Code'],
      guests.map(g => [
        g.guest_name, g.epf_no || '', g.phone || '', g.guest_count || 1, g.meal_pref || '', g.drinking || '',
        g.checked_in ? 'Yes' : 'No', g.checked_in_at ? new Date(g.checked_in_at).toLocaleString('en-GB') : '',
        g.meal_claimed ? 'Yes' : 'No', g.meal_claimed_at ? new Date(g.meal_claimed_at).toLocaleString('en-GB') : '',
        g.id.slice(0, 8).toUpperCase(),
      ])
    )
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
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',sans-serif", color: TEXT_MUTED, textAlign: 'center', padding: 24 }}>Event not found.</div>
  }
  if (!unlocked) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG, fontFamily: "'Inter',sans-serif", padding: 24 }}>
        <div style={{ background: CARD, borderRadius: 14, padding: 32, maxWidth: 360, width: '100%', border: `1px solid ${BORDER}`, textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: ACCENT, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Check-in Dashboard</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: TEXT_DARK, marginTop: 6, marginBottom: 20 }}>{event.title}</div>
          <input
            type="password" inputMode="numeric" placeholder="Enter dashboard PIN" value={pinInput}
            onChange={e => setPinInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && tryUnlock()}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 9, border: `1px solid ${BORDER}`, fontSize: 16, textAlign: 'center', letterSpacing: '0.2em', marginBottom: 12, boxSizing: 'border-box' }}
          />
          {authError && <div style={{ color: DANGER, fontSize: 12.5, marginBottom: 10 }}>{authError}</div>}
          <button onClick={tryUnlock} disabled={authChecking} style={{ width: '100%', padding: 13, borderRadius: 9, border: 'none', background: ACCENT, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            {authChecking ? '...' : 'Unlock'}
          </button>
        </div>
      </div>
    )
  }

  const avatarStyle: React.CSSProperties = {
    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
    background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 700, fontSize: 12.5,
  }
  const card: React.CSSProperties = { background: CARD, borderRadius: 12, border: `1px solid ${BORDER}`, padding: 18, marginBottom: 14 }
  const settingsInput: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 9, border: `1px solid ${BORDER}`, fontSize: 15, textAlign: 'center', letterSpacing: '0.2em', marginBottom: 10, boxSizing: 'border-box' }
  const miniStat: React.CSSProperties = { background: '#f4f5f7', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: TEXT_MUTED, display: 'flex', gap: 6, alignItems: 'center' }
  const mealBadge = (pref: string | null) => pref ? (
    <span style={{ fontSize: 10, fontWeight: 700, color: TEXT_MUTED, border: `1px solid ${BORDER}`, borderRadius: 100, padding: '1px 7px', marginLeft: 6, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
      {pref === 'veg' ? 'Veg' : 'Non-Veg'}
    </span>
  ) : null

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter',sans-serif" }}>
      <div style={{ background: ACCENT, color: '#fff', padding: '18px 20px' }}>
        <div style={{ fontSize: 10.5, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.65 }}>Check-in Dashboard</div>
        <div style={{ fontSize: 19, fontWeight: 700, marginTop: 2 }}>{event.title}</div>
        {event.host && <div style={{ fontSize: 12, opacity: 0.65, marginTop: 2 }}>Organized by {event.host}</div>}
      </div>

      <div style={{ position: 'sticky', top: 0, zIndex: 40, background: BG, padding: '12px 16px 8px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: 'flex', gap: 3, background: '#e9ebee', borderRadius: 100, padding: 3, maxWidth: 520, margin: '0 auto', overflowX: 'auto' }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              flex: '1 1 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px 8px', borderRadius: 100,
              border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
              background: activeTab === tab.key ? '#fff' : 'transparent',
              color: activeTab === tab.key ? ACCENT : TEXT_MUTED,
              boxShadow: activeTab === tab.key ? '0 1px 4px rgba(15,23,42,0.12)' : 'none',
              transition: 'all 0.15s',
            }}>
              <Icon name={tab.icon} size={14} />
              <span className="dash-tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      <style>{`@media (max-width: 460px) { .dash-tab-label { display: none; } }`}</style>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px 100px' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 10, marginBottom: 16 }}>
                {[
                  ['Registered', stats.registrations],
                  ['Total Guests', stats.totalGuests],
                  ...(isCorporate ? [['Checked In', stats.checkedIn]] : []),
                  ...(event.ask_meal_pref ? [['Meals Given', stats.meals]] : []),
                ].map(([label, val]) => (
                  <div key={label as string} style={{ background: CARD, borderRadius: 12, border: `1px solid ${BORDER}`, padding: '14px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 21, fontWeight: 700, color: TEXT_DARK }}>{val}</div>
                    <div style={{ fontSize: 10.5, color: TEXT_MUTED, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
                {isCorporate && (
                  <button onClick={startScan} style={{ flex: '1 1 160px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '13px 16px', borderRadius: 10, border: 'none', background: ACCENT, color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                    <Icon name="camera" size={15} color="#fff" /> Scan QR
                  </button>
                )}
                <button onClick={() => setWalkinOpen(true)} style={{ flex: '1 1 160px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '13px 16px', borderRadius: 10, border: `1px solid ${BORDER}`, background: '#fff', color: TEXT_DARK, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  <Icon name="plus" size={15} /> {isCorporate ? 'Add Walk-in Guest' : 'Add Guest'}
                </button>
              </div>

              {(event.ask_meal_pref || event.ask_drinking) && (
                <div style={card}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_DARK, marginBottom: 4 }}>Catering Summary</div>
                  <div style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 12 }}>Based on {stats.totalGuests} registered guests — confirm final numbers with your caterer before the event.</div>
                  {event.ask_meal_pref && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: event.ask_drinking ? 10 : 0 }}>
                      <div style={miniStat}>Veg <strong style={{ color: TEXT_DARK }}>{cateringSummary.veg}</strong></div>
                      <div style={miniStat}>Non-Veg <strong style={{ color: TEXT_DARK }}>{cateringSummary.nonVeg}</strong></div>
                      {cateringSummary.noMealPref > 0 && <div style={miniStat}>Not specified <strong style={{ color: TEXT_DARK }}>{cateringSummary.noMealPref}</strong></div>}
                    </div>
                  )}
                  {event.ask_drinking && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <div style={miniStat}>Drinks: Yes <strong style={{ color: TEXT_DARK }}>{cateringSummary.drinkingYes}</strong></div>
                      <div style={miniStat}>Drinks: No <strong style={{ color: TEXT_DARK }}>{cateringSummary.drinkingNo}</strong></div>
                      {cateringSummary.noDrinkingPref > 0 && <div style={miniStat}>Not specified <strong style={{ color: TEXT_DARK }}>{cateringSummary.noDrinkingPref}</strong></div>}
                    </div>
                  )}
                </div>
              )}

              {isCorporate && (
              <div style={card}>
                <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_DARK, marginBottom: 12 }}>Recent Check-ins</div>
                {recentCheckins.length === 0 ? (
                  <div style={{ fontSize: 12.5, color: TEXT_MUTED, textAlign: 'center', padding: '16px 0' }}>No one has checked in yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {recentCheckins.map(g => (
                      <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ ...avatarStyle, width: 30, height: 30, fontSize: 11 }}>{initials(g.guest_name)}</div>
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: TEXT_DARK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.guest_name}</span>
                          {mealBadge(g.meal_pref)}
                        </div>
                        <div style={{ fontSize: 11, color: TEXT_MUTED, flexShrink: 0 }}>{fmtDateTime(g.checked_in_at)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              )}
            </motion.div>
          )}

          {activeTab === 'guests' && (
            <motion.div key="guests" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                  value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, or code..."
                  style={{ flex: 1, padding: '12px 14px', borderRadius: 9, border: `1px solid ${BORDER}`, fontSize: 14, boxSizing: 'border-box', background: '#fff' }}
                />
                <button onClick={exportGuestsCsv} title="Export guest list as CSV" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', borderRadius: 9, border: `1px solid ${BORDER}`, background: '#fff', color: TEXT_DARK, cursor: 'pointer' }}>
                  <Icon name="download" size={16} />
                </button>
                <button onClick={() => setWalkinOpen(true)} title="Add walk-in guest" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', borderRadius: 9, border: `1px solid ${BORDER}`, background: '#fff', color: TEXT_DARK, cursor: 'pointer' }}>
                  <Icon name="plus" size={16} />
                </button>
              </div>
              <div style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 12, marginTop: -6 }}>{guests.length} guest{guests.length === 1 ? '' : 's'} registered — export a CSV backup before the event in case of connectivity issues at the venue.</div>

              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', color: TEXT_MUTED, fontSize: 13, padding: 30 }}>No guests match.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filtered.map(g => (
                    <div key={g.id} style={{ background: CARD, borderRadius: 12, border: `1px solid ${BORDER}`, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
                          <div style={avatarStyle}>{initials(g.guest_name)}</div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: TEXT_DARK, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                              {g.guest_name}{g.guest_count > 1 ? ` (+${g.guest_count - 1})` : ''}{mealBadge(g.meal_pref)}
                            </div>
                            <div style={{ fontSize: 11.5, color: TEXT_MUTED, marginTop: 2 }}>
                              {isCorporate ? <>{g.epf_no ? `EPF ${g.epf_no}` : 'no EPF'} · {g.phone || 'no phone'} · Code {g.id.slice(0, 8).toUpperCase()}</> : (g.phone || 'no phone')}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteGuest(g.id, g.guest_name)} disabled={deletingGuestId === g.id} title="Remove guest" style={{
                          background: 'transparent', border: 'none', cursor: 'pointer', color: TEXT_MUTED, padding: 4, lineHeight: 1, flexShrink: 0,
                          opacity: deletingGuestId === g.id ? 0.4 : 1,
                        }}><Icon name="trash" size={15} /></button>
                      </div>
                      {(isCorporate || event?.ask_meal_pref) && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        {isCorporate && (
                          <button onClick={() => toggleCheckIn(g)} style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                            border: `1px solid ${g.checked_in ? SUCCESS : BORDER}`, background: g.checked_in ? '#f0fdf4' : '#fff', color: g.checked_in ? SUCCESS : TEXT_DARK,
                          }}>{g.checked_in && <Icon name="check" size={13} color={SUCCESS} />}{g.checked_in ? `Checked In · ${fmtTime(g.checked_in_at)}` : 'Check In'}</button>
                        )}
                        {event?.ask_meal_pref && (
                          <button onClick={() => toggleMeal(g)} style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                            border: `1px solid ${g.meal_claimed ? ACCENT : BORDER}`, background: g.meal_claimed ? '#f4f5f7' : '#fff', color: g.meal_claimed ? ACCENT : TEXT_DARK,
                          }}>{g.meal_claimed && <Icon name="check" size={13} color={ACCENT} />}{g.meal_claimed ? `Meal Given · ${fmtTime(g.meal_claimed_at)}` : 'Mark Meal'}</button>
                        )}
                      </div>
                      )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'share' && (
            <motion.div key="share" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <GuestLinkGenerator event={event} accent={ACCENT} onMessageSaved={msg => setEvent(prev => prev ? { ...prev, whatsapp_invite_message: msg } : prev)} />
              <BulkGuestLinks event={event} accent={ACCENT} />
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
                <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_DARK, marginBottom: 12 }}>Event Details</div>
                <div style={{ fontSize: 13, color: '#374151', marginBottom: 6 }}><strong>Title:</strong> {event.title}</div>
                {event.host && <div style={{ fontSize: 13, color: '#374151', marginBottom: 6 }}><strong>Organized by:</strong> {event.host}</div>}
                <div style={{ fontSize: 13, color: '#374151' }}><strong>Link:</strong> /{event.slug}</div>
              </div>

              <div style={card}>
                <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_DARK, marginBottom: 4 }}>Change Dashboard PIN</div>
                <div style={{ fontSize: 11.5, color: TEXT_MUTED, marginBottom: 14 }}>You'll need to share the new PIN with anyone else using this dashboard. Forgot it entirely? Ask an admin to reset it from the Admin panel.</div>
                <input type="password" inputMode="numeric" placeholder="Current PIN" maxLength={4} value={pinCurrent} onChange={e => setPinCurrent(e.target.value.replace(/\D/g, '').slice(0, 4))} style={settingsInput} />
                <input type="password" inputMode="numeric" placeholder="New 4-digit PIN" maxLength={4} value={pinNew} onChange={e => setPinNew(e.target.value.replace(/\D/g, '').slice(0, 4))} style={settingsInput} />
                <input type="password" inputMode="numeric" placeholder="Confirm new PIN" maxLength={4} value={pinConfirm} onChange={e => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))} style={settingsInput} />
                {pinMsg && <div style={{ fontSize: 12.5, marginBottom: 10, color: pinMsg.startsWith('✓') ? SUCCESS : DANGER }}>{pinMsg}</div>}
                <button onClick={handleChangePin} disabled={changingPin} style={{ width: '100%', padding: 13, borderRadius: 9, border: 'none', background: ACCENT, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: changingPin ? 0.6 : 1 }}>
                  {changingPin ? 'Updating...' : 'Update PIN'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {scanOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, width: '100%', maxWidth: 360 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_DARK }}>Scan Guest QR</div>
              <button onClick={stopScan} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: TEXT_MUTED, display: 'flex' }}><Icon name="x" size={18} /></button>
            </div>
            {scanMsg && <div style={{ fontSize: 12.5, color: DANGER, marginBottom: 10 }}>{scanMsg}</div>}
            <div style={{ display: scannedGuest ? 'none' : 'block', width: '100%', borderRadius: 9, overflow: 'hidden', background: '#000', position: 'relative' }}>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video ref={videoRef} muted playsInline autoPlay style={{ width: '100%', display: 'block' }} />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
            {scannedGuest === 'not-found' && (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><Icon name="alert" size={26} color={DANGER} /></div>
                <div style={{ fontSize: 13, color: DANGER, fontWeight: 600, marginBottom: 14 }}>Not a valid pass for this event.</div>
                <button onClick={resumeScan} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: ACCENT, color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Scan Again</button>
              </div>
            )}
            {scannedGuest && scannedGuest !== 'not-found' && (
              <div style={{ padding: '6px 0' }}>
                {scannedGuest.alreadyIn ? (
                  <div style={{ textAlign: 'center', padding: '4px 0 10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}><Icon name="alert" size={22} color={WARNING} /></div>
                    <div style={{ fontSize: 12.5, color: WARNING, fontWeight: 700 }}>Already checked in · {fmtTime(scannedGuest.guest.checked_in_at)}</div>
                    <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>This QR was scanned before — check it's the right person.</div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '4px 0 10px' }}>
                    <div style={{ ...avatarStyle, width: 44, height: 44, fontSize: 15, margin: '0 auto 8px' }}>{initials(scannedGuest.guest.guest_name)}</div>
                    <div style={{ fontSize: 13.5, color: SUCCESS, fontWeight: 700 }}>Welcome, {scannedGuest.guest.guest_name.split(' ')[0]}!</div>
                  </div>
                )}
                <div style={{ fontSize: 16, fontWeight: 700, color: TEXT_DARK, textAlign: 'center', marginTop: 4 }}>
                  {scannedGuest.guest.guest_name}{scannedGuest.guest.guest_count > 1 ? ` (+${scannedGuest.guest.guest_count - 1})` : ''}{mealBadge(scannedGuest.guest.meal_pref)}
                </div>
                <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 14, textAlign: 'center' }}>
                  {isCorporate ? <>{scannedGuest.guest.epf_no ? `EPF ${scannedGuest.guest.epf_no}` : 'no EPF no.'} · {scannedGuest.guest.phone || 'no phone'}</> : (scannedGuest.guest.phone || 'no phone')}
                </div>
                {event?.ask_meal_pref && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <button onClick={() => { toggleMeal(scannedGuest.guest); setScannedGuest({ ...scannedGuest, guest: { ...scannedGuest.guest, meal_claimed: !scannedGuest.guest.meal_claimed } }) }} style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
                      border: `1px solid ${scannedGuest.guest.meal_claimed ? ACCENT : BORDER}`, background: scannedGuest.guest.meal_claimed ? '#f4f5f7' : '#fff', color: scannedGuest.guest.meal_claimed ? ACCENT : TEXT_DARK,
                    }}>{scannedGuest.guest.meal_claimed && <Icon name="check" size={13} color={ACCENT} />}{scannedGuest.guest.meal_claimed ? `Meal Given · ${fmtTime(scannedGuest.guest.meal_claimed_at)}` : 'Mark Meal'}</button>
                  </div>
                )}
                <button onClick={resumeScan} style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${BORDER}`, background: '#fff', color: TEXT_MUTED, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Scan Next Guest</button>
              </div>
            )}
          </div>
        </div>
      )}

      {walkinOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 22, width: '100%', maxWidth: 340 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_DARK, marginBottom: 14 }}>Add Walk-in Guest</div>
            <input value={walkinName} onChange={e => setWalkinName(e.target.value)} placeholder="Guest name" style={{ width: '100%', padding: '11px 13px', borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 13, marginBottom: 10, boxSizing: 'border-box' }} />
            <input value={walkinPhone} onChange={e => setWalkinPhone(e.target.value)} placeholder="Phone (optional)" style={{ width: '100%', padding: '11px 13px', borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 13, marginBottom: 10, boxSizing: 'border-box' }} />
            <input value={walkinEpf} onChange={e => setWalkinEpf(e.target.value)} placeholder="EPF No (optional)" style={{ width: '100%', padding: '11px 13px', borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 13, marginBottom: 10, boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 12.5, color: TEXT_MUTED }}>Guests:</span>
              <button onClick={() => setWalkinCount(c => Math.max(1, c - 1))} style={{ width: 30, height: 30, borderRadius: '50%', border: `1px solid ${BORDER}`, background: '#fff', cursor: 'pointer' }}>−</button>
              <span style={{ fontSize: 15, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{walkinCount}</span>
              <button onClick={() => setWalkinCount(c => c + 1)} style={{ width: 30, height: 30, borderRadius: '50%', border: `1px solid ${BORDER}`, background: '#fff', cursor: 'pointer' }}>+</button>
            </div>
            <div style={{ fontSize: 12.5, color: TEXT_MUTED, marginBottom: 8 }}>Meal (optional):</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button onClick={() => setWalkinMeal(m => m === 'veg' ? null : 'veg')} style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${walkinMeal === 'veg' ? ACCENT : BORDER}`, background: walkinMeal === 'veg' ? '#f4f5f7' : '#fff', color: walkinMeal === 'veg' ? ACCENT : TEXT_MUTED, fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}>Veg</button>
              <button onClick={() => setWalkinMeal(m => m === 'non-veg' ? null : 'non-veg')} style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${walkinMeal === 'non-veg' ? ACCENT : BORDER}`, background: walkinMeal === 'non-veg' ? '#f4f5f7' : '#fff', color: walkinMeal === 'non-veg' ? ACCENT : TEXT_MUTED, fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}>Non-Veg</button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setWalkinOpen(false)} style={{ flex: 1, padding: 12, borderRadius: 8, border: `1px solid ${BORDER}`, background: '#fff', color: TEXT_MUTED, fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveWalkin} disabled={savingWalkin || !walkinName.trim()} style={{ flex: 1, padding: 12, borderRadius: 8, border: 'none', background: ACCENT, color: '#fff', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', opacity: savingWalkin ? 0.6 : 1 }}>{savingWalkin ? '...' : 'Add & Check In'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
