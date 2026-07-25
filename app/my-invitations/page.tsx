"use client"
import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import EditInvitationEditor from './EditInvitationEditor'

const PINK = "#c4607a"
const RED = "#e0355c"
const BUCKET = 'wedding-photos'
const ADMIN_WHATSAPP = '94770024484'

const TEMPLATE_OPTIONS = [
  { id: 'floral-romance', name: 'Floral Romance' }, { id: 'elegant-photo', name: 'Elegant Photo Hero' },
  { id: 'cinematic-gold', name: 'Cinematic Gold' }, { id: 'kandyan-heritage', name: 'Kandyan Heritage' },
  { id: 'twilight-picnic', name: 'Twilight Picnic' }, { id: 'golden-garden', name: 'Golden Garden' },
  { id: 'ocean-pearl', name: 'Ocean Pearl' }, { id: 'sunset-shores', name: 'Sunset Shores' },
  { id: 'traditional-ceylon', name: 'Traditional Ceylon' }, { id: 'sacred-poruwa', name: 'Sacred Poruwa' },
  { id: 'blush-blossom', name: 'Blush Blossom' }, { id: 'ceylon-elegance', name: 'Ceylon Elegance' },
  { id: 'eternal-bloom', name: 'Eternal Bloom' }, { id: 'noble-salute', name: 'Noble Salute' },
]
const templateName = (id: string) => TEMPLATE_OPTIONS.find(t => t.id === id)?.name || (id || '').replace(/-/g, ' ')

type MyCouple = {
  id: string; slug: string; bride: string; groom: string; wedding_date: string; venue: string | null
  template: string; couple_photo: string | null
  project_status: string; payment_slip_status: string; payment_slip_url: string | null
  page_views: number | null
}
type GuestRow = { id: string; couple_id: string; name: string; phone: string | null; heads: number; category: string; side: string; table_id: string | null; created_at: string }
type SeatingTable = { id: string; couple_id: string; name: string; created_at: string }
type RsvpRow = { id: string; couple_id: string; guest_name: string; response: 'yes' | 'no'; guest_count: number; created_at: string }
type ChecklistItem = { id: string; couple_id: string; task_name: string; category: string; due_date: string | null; done: boolean; created_at: string }
type Vendor = { id: string; couple_id: string; category: string; vendor_name: string; contact_name: string | null; phone: string | null; email: string | null; cost: number; status: 'contacted' | 'booked' | 'paid'; notes: string | null; created_at: string }
type LiquorItem = { id: string; couple_id: string; item_name: string; category: string; quantity: number; unit: string; cost_per_unit: number; notes: string | null; created_at: string }

// ── Icons ──
type IconName = 'grid' | 'file' | 'edit' | 'sparkles' | 'userPlus' | 'users' | 'mail' | 'grid2' | 'gallery' | 'checklist' | 'wallet' | 'home' | 'liquor' | 'support' | 'membersIcon' | 'card' | 'bell' | 'signout' | 'copy' | 'check' | 'cross' | 'trash' | 'whatsapp' | 'link' | 'plus' | 'chevron' | 'search'
function Icon({ name, size = 16, color = 'currentColor', strokeWidth = 1.8 }: { name: IconName; size?: number; color?: string; strokeWidth?: number }) {
  const c = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (name) {
    case 'grid': return <svg {...c}><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></svg>
    case 'file': return <svg {...c}><path d="M6 3h9l5 5v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" /><path d="M14 3v5h5" /></svg>
    case 'edit': return <svg {...c}><path d="M4 20h4L18.5 9.5a2.1 2.1 0 00-3-3L5 17v3z" /><path d="M13.5 8l3 3" /></svg>
    case 'sparkles': return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" /></svg>
    case 'userPlus': return <svg {...c}><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20a6.5 6.5 0 0113 0" /><path d="M18 8v6M21 11h-6" /></svg>
    case 'users': return <svg {...c}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0111 0" /><path d="M15.5 8.2a3 3 0 010 5.8" /><path d="M15 20a5 5 0 016.5-4.8" /></svg>
    case 'mail': return <svg {...c}><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M3.5 6.5L12 13l8.5-6.5" /></svg>
    case 'grid2': return <svg {...c}><rect x="3" y="3" width="7.5" height="7.5" rx="1.2" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.2" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.2" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.2" /></svg>
    case 'gallery': return <svg {...c}><rect x="3" y="4" width="18" height="16" rx="2.5" /><circle cx="8.5" cy="9.5" r="1.7" /><path d="M21 15.5l-5.5-5.5a1.5 1.5 0 00-2.1 0L4 18.5" /></svg>
    case 'checklist': return <svg {...c}><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" /></svg>
    case 'wallet': return <svg {...c}><rect x="3" y="6.5" width="18" height="13" rx="2.5" /><path d="M3 10h18" /><circle cx="16.5" cy="14.5" r="1.2" fill="currentColor" stroke="none" /><path d="M7 6.5V5a1.5 1.5 0 011.5-1.5h7A1.5 1.5 0 0117 5v1.5" /></svg>
    case 'home': return <svg {...c}><path d="M4 11l8-7 8 7" /><path d="M6 10v9a1 1 0 001 1h10a1 1 0 001-1v-9" /></svg>
    case 'liquor': return <svg {...c}><path d="M8 3h8l-1 7a3 3 0 01-6 0z" /><path d="M12 13v7M8.5 20h7" /></svg>
    case 'support': return <svg {...c}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3.2" /><path d="M5.6 5.6l3.4 3.4M18.4 5.6l-3.4 3.4M5.6 18.4l3.4-3.4M18.4 18.4l-3.4-3.4" /></svg>
    case 'membersIcon': return <svg {...c}><circle cx="8.5" cy="8" r="3" /><path d="M2.5 19a6 6 0 0112 0" /><path d="M16 5.5a3 3 0 010 5.8M19 19a5 5 0 00-4.5-5.5" /></svg>
    case 'card': return <svg {...c}><rect x="3" y="5.5" width="18" height="13" rx="2.2" /><path d="M3 9.5h18" /><path d="M6.5 14h4" /></svg>
    case 'bell': return <svg {...c}><path d="M6 10a6 6 0 0112 0c0 4 1.5 5.5 1.5 5.5h-15S6 14 6 10z" /><path d="M9.7 19a2.3 2.3 0 004.6 0" /></svg>
    case 'signout': return <svg {...c}><path d="M9 4H6a2 2 0 00-2 2v12a2 2 0 002 2h3" /><path d="M15 16l4-4-4-4" /><path d="M19 12H9" /></svg>
    case 'copy': return <svg {...c}><rect x="8.5" y="8.5" width="12" height="12" rx="2" /><path d="M15.5 8.5V5.8A1.8 1.8 0 0013.7 4H5.8A1.8 1.8 0 004 5.8v7.9A1.8 1.8 0 005.8 15.5H8.5" /></svg>
    case 'check': return <svg {...c}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
    case 'cross': return <svg {...c}><path d="M6 6l12 12M18 6L6 18" /></svg>
    case 'trash': return <svg {...c}><path d="M5 7h14" /><path d="M9 7V4.8A1.8 1.8 0 0110.8 3h2.4A1.8 1.8 0 0115 4.8V7" /><path d="M7 7l1 13.2A1.8 1.8 0 009.8 22h4.4a1.8 1.8 0 001.8-1.8L17 7" /></svg>
    case 'whatsapp': return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3M12 2a10 10 0 00-8.5 15.3L2 22l4.8-1.3A10 10 0 1012 2z" /></svg>
    case 'link': return <svg {...c}><path d="M9.5 14.5l5-5" /><path d="M13 6l1-1a3.5 3.5 0 015 5l-1 1" /><path d="M11 18l-1 1a3.5 3.5 0 01-5-5l1-1" /></svg>
    case 'plus': return <svg {...c}><path d="M12 5v14M5 12h14" /></svg>
    case 'chevron': return <svg {...c}><path d="M9 6l6 6-6 6" /></svg>
    case 'search': return <svg {...c}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.3-4.3" /></svg>
    default: return null
  }
}

// ── Shared UI bits ──
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 13px', borderRadius: 9, border: '1px solid #e2e8f0',
  fontSize: 13.5, outline: 'none', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box', color: '#1e293b', background: '#fff',
}
const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 5, display: 'block' }
const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: 16, padding: 22, border: '1px solid #eef0f3' }

function StatCard({ label, value, icon, iconBg, iconColor, sub }: { label: string; value: string | number; icon: IconName; iconBg: string; iconColor: string; sub?: string }) {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>{label.toUpperCase()}</div>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={15} color={iconColor} />
        </div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

// ── Guest management shared bits ──
const GUEST_CATEGORIES = [
  { key: 'family', label: 'Family' }, { key: 'friends', label: 'Friends' }, { key: 'office', label: 'Office' },
  { key: 'vip', label: 'VIP' }, { key: 'neighbors', label: 'Neighbors' }, { key: 'other', label: 'Other' },
]
const GUEST_SIDES = [{ key: 'bride', label: 'Bride' }, { key: 'groom', label: 'Groom' }, { key: 'both', label: 'Both' }]
const categoryLabel = (k: string) => GUEST_CATEGORIES.find(c => c.key === k)?.label || k
const sideLabel = (k: string) => GUEST_SIDES.find(s => s.key === k)?.label || k

const GUEST_TABS: { key: SectionKey; label: string; icon: IconName }[] = [
  { key: 'add-guests', label: 'Add Guests', icon: 'userPlus' },
  { key: 'guest-links', label: 'Guest List & Links', icon: 'users' },
  { key: 'rsvp', label: 'RSVP Management', icon: 'mail' },
  { key: 'table', label: 'Table Arrangement', icon: 'grid2' },
  { key: 'gallery', label: 'Wishes Wall', icon: 'gallery' },
]

function GuestManagementTabs({ active, onNavigate }: { active: SectionKey; onNavigate: (s: SectionKey) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
      {GUEST_TABS.map(t => (
        <button key={t.key} onClick={() => onNavigate(t.key)} style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 100, border: 'none', cursor: 'pointer',
          background: active === t.key ? `linear-gradient(135deg,${PINK},${RED})` : '#fff',
          color: active === t.key ? '#fff' : '#475569', fontWeight: active === t.key ? 700 : 600, fontSize: 12.5,
          boxShadow: active === t.key ? `0 4px 14px ${PINK}40` : '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <Icon name={t.icon} size={14} color={active === t.key ? '#fff' : '#94a3b8'} /> {t.label}
        </button>
      ))}
    </div>
  )
}


type SectionKey =
  | 'overview' | 'my-invitations' | 'edit-invitation' | 'custom-design'
  | 'add-guests' | 'guest-links' | 'rsvp' | 'table' | 'gallery'
  | 'checklist' | 'budget' | 'vendors' | 'liquor'
  | 'support' | 'profile' | 'members' | 'billing'

const NAV_GROUPS: { title: string; items: { key: SectionKey; label: string; icon: IconName }[] }[] = [
  { title: 'Invitation', items: [
    { key: 'overview', label: 'Overview', icon: 'grid' },
    { key: 'my-invitations', label: 'My Invitations', icon: 'file' },
    { key: 'edit-invitation', label: 'Edit Invitation', icon: 'edit' },
    { key: 'custom-design', label: 'Custom Design', icon: 'sparkles' },
  ]},
  { title: 'Guest Management', items: [
    { key: 'add-guests', label: 'Add Guests', icon: 'userPlus' },
    { key: 'guest-links', label: 'Guest List & Links', icon: 'users' },
    { key: 'rsvp', label: 'RSVP Management', icon: 'mail' },
    { key: 'table', label: 'Table Arrangement', icon: 'grid2' },
    { key: 'gallery', label: 'Wishes Wall', icon: 'gallery' },
  ]},
  { title: 'Wedding Plan Tools', items: [
    { key: 'checklist', label: 'Task Checklist', icon: 'checklist' },
    { key: 'budget', label: 'Budget Management', icon: 'wallet' },
    { key: 'vendors', label: 'Vendor List', icon: 'home' },
    { key: 'liquor', label: 'Liquor Planner', icon: 'liquor' },
  ]},
  { title: 'Help', items: [{ key: 'support', label: 'Support', icon: 'support' }] },
  { title: 'Account', items: [
    { key: 'profile', label: 'My Profile', icon: 'membersIcon' },
    { key: 'members', label: 'Members', icon: 'users' },
  ]},
  { title: 'Billing', items: [{ key: 'billing', label: 'Upgrade Plan', icon: 'card' }] },
]

export default function CustomerDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [emailConfirmed, setEmailConfirmed] = useState(true)
  const [couples, setCouples] = useState<MyCouple[]>([])
  const [activeCoupleId, setActiveCoupleId] = useState('')
  const [guests, setGuests] = useState<GuestRow[]>([])
  const [rsvps, setRsvps] = useState<RsvpRow[]>([])
  const [section, setSection] = useState<SectionKey>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const couple = couples.find(c => c.id === activeCoupleId) || couples[0] || null

  const loadAll = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { router.push('/login'); return }
    setUserEmail(userData.user.email || '')
    setAvatarUrl((userData.user.user_metadata as any)?.avatar_url || '')
    setDisplayName((userData.user.user_metadata as any)?.full_name || '')
    setEmailConfirmed(!!userData.user.email_confirmed_at)
    const { data: cData } = await supabase.from('couples').select('id, slug, bride, groom, wedding_date, venue, template, couple_photo, project_status, payment_slip_status, payment_slip_url, page_views').eq('user_id', userData.user.id).order('created_at', { ascending: false })
    if (cData) {
      setCouples(cData as MyCouple[])
      if (cData.length > 0) setActiveCoupleId(prev => prev || cData[0].id)
    }
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [])

  const loadGuestsAndRsvps = async (coupleId: string) => {
    const [{ data: g }, { data: r }] = await Promise.all([
      supabase.from('guests').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false }),
      supabase.from('rsvps').select('id, couple_id, guest_name, response, guest_count, created_at').eq('couple_id', coupleId).order('created_at', { ascending: false }),
    ])
    if (g) setGuests(g as GuestRow[])
    if (r) setRsvps(r as RsvpRow[])
  }

  useEffect(() => { if (couple) loadGuestsAndRsvps(couple.id) }, [couple?.id])

  const resendVerification = async () => {
    await supabase.auth.resend({ type: 'signup', email: userEmail })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',sans-serif", color: '#94a3b8' }}>Loading your dashboard...</div>
  }

  if (!couple) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',sans-serif", flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>No invitation yet</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>Create your first invitation to unlock your dashboard.</div>
        <a href="/create" style={{ padding: '12px 24px', borderRadius: 100, background: `linear-gradient(135deg,${PINK},${RED})`, color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 13.5 }}>Create Invitation</a>
      </div>
    )
  }

  const initials = userEmail ? userEmail[0].toUpperCase() : 'U'
  const daysToWedding = Math.max(0, Math.ceil((new Date(couple.wedding_date).getTime() - Date.now()) / 86400000))

  return (
    <div style={{ minHeight: '100vh', background: '#fdf7f8', fontFamily: "'Inter',sans-serif", display: 'flex' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Garamond:ital@1&family=Inter:wght@400;500;600;700;800&display=swap');`}</style>

      {/* ── SIDEBAR ── */}
      <div style={{
        width: 244, flexShrink: 0, background: '#fffaf9', borderRight: '1px solid #f6e1e6',
        display: sidebarOpen ? 'flex' : undefined, flexDirection: 'column', position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 40,
        transform: sidebarOpen ? 'translateX(0)' : undefined,
      }} className="ig-sidebar">
        <div style={{ padding: '22px 18px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
            <span style={{ color: PINK, fontSize: 18 }}>♥</span>
            <span style={{ fontFamily: "'Great Vibes',cursive", fontSize: 24, color: PINK, lineHeight: 1 }}>InviteGlow</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: `${PINK}0d`, borderRadius: 14, padding: '12px 14px', border: `1px solid ${PINK}33` }}>
            <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
              <svg width={40} height={40} viewBox="0 0 40 40">
                <circle cx={20} cy={20} r={17} fill="none" stroke="#f1dde1" strokeWidth={4} />
                <circle cx={20} cy={20} r={17} fill="none" stroke={PINK} strokeWidth={4} strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 17}`} strokeDashoffset={2 * Math.PI * 17 * Math.max(0, 1 - Math.min(daysToWedding, 90) / 90)}
                  transform="rotate(-90 20 20)" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#0f172a' }}>{daysToWedding}</div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: PINK, letterSpacing: '0.08em' }}>DAYS TO GO</div>
              <div style={{ fontSize: 10.5, color: '#8a7478', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{new Date(couple.wedding_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 12px' }}>
          {NAV_GROUPS.map(group => (
            <div key={group.title} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#c9a9b1', letterSpacing: '0.1em', padding: '8px 10px 4px' }}>{group.title.toUpperCase()}</div>
              {group.items.map(item => (
                <button key={item.key} onClick={() => { setSection(item.key); setSidebarOpen(false) }} style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '9px 10px', borderRadius: 9,
                  border: 'none', cursor: 'pointer', marginBottom: 2,
                  background: section === item.key ? PINK : 'transparent',
                  color: section === item.key ? '#fff' : '#6b5a5f', fontWeight: section === item.key ? 700 : 500, fontSize: 13,
                  boxShadow: section === item.key ? `0 4px 14px ${PINK}45` : 'none',
                }}>
                  <Icon name={item.icon} size={16} color={section === item.key ? '#fff' : '#c9a9b1'} />
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div style={{ padding: 14, borderTop: '1px solid #f6e1e6' }}>
          <button onClick={() => { setSection('profile'); setSidebarOpen(false) }} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, width: '100%', textAlign: 'left' }}>
            {avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={avatarUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `2px solid ${PINK}` }} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg,${PINK},${RED})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{initials}</div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{couple.bride} &amp; {couple.groom}</div>
              <div style={{ fontSize: 10.5, color: '#94a3b8' }}>{couple.payment_slip_status === 'verified' ? 'Live Plan' : 'Free Plan'}</div>
            </div>
          </button>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 12.5, fontWeight: 600, padding: '4px 2px' }}>
            <Icon name="signout" size={14} /> Sign Out
          </button>
        </div>
      </div>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 35 }} className="ig-sidebar-backdrop" />}

      <style>{`
        .ig-sidebar { transform: translateX(-100%); transition: transform 0.2s; }
        .ig-sidebar-backdrop { display: none; }
        @media (min-width: 900px) {
          .ig-sidebar { display: flex !important; transform: none !important; position: sticky !important; }
          .ig-sidebar-backdrop { display: none !important; }
        }
      `}</style>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', background: '#fff', borderBottom: '1px solid #eef0f3' }}>
          <button onClick={() => setSidebarOpen(true)} className="ig-hamburger" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', fontSize: 12, color: '#475569' }}>
            <Icon name="grid" size={14} /> Menu
          </button>
          <div style={{ flex: 1 }} />
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="bell" size={16} color="#64748b" />
          </div>
        </div>
        <style>{`@media (min-width: 900px) { .ig-hamburger { display: none !important; } }`}</style>

        {!emailConfirmed && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: '#fffbeb', borderBottom: '1px solid #fde68a', padding: '12px 24px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="mail" size={16} color="#b45309" />
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#92400e' }}>Please verify your email address</div>
                <div style={{ fontSize: 11.5, color: '#a16207' }}>We sent a verification link when you signed up. Click it to confirm your email.</div>
              </div>
            </div>
            <button onClick={resendVerification} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#f59e0b', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>Resend email</button>
          </div>
        )}

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 60px' }}>
          {section === 'overview' && <OverviewSection couple={couple} guests={guests} rsvps={rsvps} daysToWedding={daysToWedding} onNavigate={setSection} />}
          {section === 'my-invitations' && <MyInvitationSection couple={couple} onSaved={() => loadAll()} focusEdit={false} />}
          {section === 'edit-invitation' && <EditInvitationEditor coupleId={couple.id} />}
          {section === 'custom-design' && <CustomDesignSection couple={couple} />}
          {section === 'add-guests' && <AddGuestsSection couple={couple} guests={guests} onChanged={() => loadGuestsAndRsvps(couple.id)} onNavigate={setSection} />}
          {section === 'guest-links' && <GuestLinksSection couple={couple} guests={guests} rsvps={rsvps} onNavigate={setSection} />}
          {section === 'rsvp' && <RsvpManagementSection couple={couple} guests={guests} rsvps={rsvps} onChanged={() => loadGuestsAndRsvps(couple.id)} onNavigate={setSection} />}
          {section === 'table' && <TableArrangementSection couple={couple} guests={guests} onChanged={() => loadGuestsAndRsvps(couple.id)} onNavigate={setSection} />}
          {section === 'gallery' && <WishesWallSection couple={couple} onNavigate={setSection} />}
          {section === 'checklist' && <ChecklistSection couple={couple} />}
          {section === 'budget' && <BudgetSection couple={couple} />}
          {section === 'vendors' && <VendorsSection couple={couple} />}
          {section === 'liquor' && <LiquorSection couple={couple} />}
          {section === 'support' && <SupportSection couple={couple} />}
          {section === 'profile' && <ProfileSection userEmail={userEmail} avatarUrl={avatarUrl} displayName={displayName} onChanged={loadAll} />}
          {section === 'members' && <MembersSection userEmail={userEmail} />}
          {section === 'billing' && <BillingSection couple={couple} />}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════ OVERVIEW ══════════════════════════════
function OverviewSection({ couple, guests, rsvps, daysToWedding, onNavigate }: {
  couple: MyCouple; guests: GuestRow[]; rsvps: RsvpRow[]; daysToWedding: number; onNavigate: (s: SectionKey) => void
}) {
  const accepted = rsvps.filter(r => r.response === 'yes')
  const declined = rsvps.filter(r => r.response === 'no')
  const totalAttending = accepted.reduce((s, r) => s + (r.guest_count || 1), 0)
  const respondedNames = new Set(rsvps.map(r => r.guest_name.trim().toLowerCase()))
  const awaiting = guests.filter(g => {
    const q = g.name.trim().toLowerCase()
    return !Array.from(respondedNames).some(n => n.includes(q) || q.includes(n))
  })
  const totalInvited = Math.max(guests.length, rsvps.length)
  const respondedCount = rsvps.length

  const isPublished = couple.payment_slip_status === 'verified'
  const steps = [
    { label: 'Create account', done: true },
    { label: 'Choose template', done: !!couple.template },
    { label: 'Add guest list', done: guests.length > 0 },
    { label: 'Customize details', done: !!couple.couple_photo },
    { label: 'Publish & share', done: isPublished },
  ]
  const doneCount = steps.filter(s => s.done).length
  const progressPct = Math.round((doneCount / steps.length) * 100)
  const nextStep = steps.find(s => !s.done)

  const link = typeof window !== 'undefined' ? `${window.location.origin}/invite/${couple.slug}` : `/invite/${couple.slug}`

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: PINK, letterSpacing: '0.05em', marginBottom: 4 }}>DASHBOARD</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Welcome back, <span style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', color: PINK, fontWeight: 700 }}>{couple.bride} &amp; {couple.groom}</span></div>
      <div style={{ fontSize: 13.5, color: '#64748b', marginTop: 4, marginBottom: 22 }}>Let's get your invitation ready to share.</div>

      {/* Hero status card */}
      <div style={{ background: `linear-gradient(135deg,${PINK},${RED})`, borderRadius: 20, padding: 26, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 22, boxShadow: `0 10px 30px ${PINK}40` }}>
        <div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            <span style={{ padding: '3px 10px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.5)', color: '#fff', fontSize: 10, fontWeight: 700 }}>{(couple.project_status || 'DRAFT').toUpperCase()}</span>
            <span style={{ padding: '3px 10px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.5)', color: '#fff', fontSize: 10, fontWeight: 700 }}>{isPublished ? 'LIVE' : 'FREE'}</span>
          </div>
          <div style={{ fontSize: 21, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
            Your invitation is <span style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic' }}>{isPublished ? 'live!' : 'almost ready.'}</span>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', marginBottom: 16, maxWidth: 340 }}>
            {isPublished ? 'Share your link and start collecting RSVPs.' : 'Finish a few steps below to publish and start collecting RSVPs.'}
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => onNavigate('edit-invitation')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 100, border: 'none', cursor: 'pointer', background: '#fff', color: PINK, fontWeight: 700, fontSize: 13 }}>
              <Icon name="edit" size={13} color={PINK} /> Edit invitation
            </button>
            <button onClick={() => onNavigate('billing')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#fff', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>Upgrade <Icon name="chevron" size={13} color="#fff" /></button>
          </div>
        </div>
        <div style={{ width: 118, height: 140, borderRadius: 16, overflow: 'hidden', border: '3px solid rgba(255,255,255,0.5)', boxShadow: '0 8px 24px rgba(0,0,0,0.25)', flexShrink: 0, position: 'relative', background: '#fdf6ee' }}>
          {couple.couple_photo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={couple.couple_photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: 15, color: '#a8895a' }}>{couple.bride}</span>
              <span style={{ fontSize: 9, color: '#a8895a' }}>&amp;</span>
              <span style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: 15, color: '#a8895a' }}>{couple.groom}</span>
            </div>
          )}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '5px 4px', textAlign: 'center', background: 'rgba(36,26,31,0.75)', fontSize: 9, color: '#fff', fontWeight: 700 }}>
            {new Date(couple.wedding_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </div>
        </div>
      </div>

      {/* Getting started — connected horizontal timeline */}
      <div style={{ ...cardStyle, marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Getting started</div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: PINK, background: `${PINK}14`, padding: '3px 10px', borderRadius: 100 }}>{progressPct}%</div>
        </div>
        <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 24 }}>{nextStep ? `Next: ${nextStep.label}` : 'All steps complete!'}</div>
        <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 12, left: '10%', right: '10%', height: 2, background: '#f1f5f9', zIndex: 0 }} />
          <div style={{ position: 'absolute', top: 12, left: '10%', height: 2, width: `${Math.max(0, (doneCount - 1)) / (steps.length - 1) * 80}%`, background: PINK, zIndex: 0, transition: 'width 0.3s' }} />
          {steps.map((s, i) => (
            <div key={s.label} style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: s.done ? PINK : '#fff', border: `2px solid ${s.done ? PINK : '#e2e8f0'}`, color: s.done ? '#fff' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: 11, fontWeight: 700 }}>
                {s.done ? <Icon name="check" size={12} color="#fff" /> : i + 1}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: s.done ? '#334155' : '#94a3b8', padding: '0 4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats — unified strip instead of separate cards */}
      <div style={{ ...cardStyle, display: 'flex', flexWrap: 'wrap', marginBottom: 22, padding: 0, overflow: 'hidden' }}>
        {[
          { label: 'Total Guests', value: totalInvited, icon: 'users' as IconName, color: PINK },
          { label: 'Page Views', value: couple.page_views ?? 0, icon: 'gallery' as IconName, color: '#0369a1' },
          { label: 'Attending', value: totalAttending, icon: 'check' as IconName, color: '#16a34a' },
          { label: 'Days to Wedding', value: daysToWedding, icon: 'home' as IconName, color: '#b45309' },
        ].map((s, i) => (
          <div key={s.label} style={{ flex: '1 1 140px', padding: '18px 20px', borderLeft: i > 0 ? '1px solid #f1f5f9' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Icon name={s.icon} size={14} color={s.color} />
              <span style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em' }}>{s.label.toUpperCase()}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Guest responses */}
      <div style={{ ...cardStyle, marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Guest responses</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{totalInvited} invited · {respondedCount} responded</div>
          </div>
          <button onClick={() => onNavigate('rsvp')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: PINK, fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>Details <Icon name="chevron" size={12} color={PINK} /></button>
        </div>
        <div style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', height: 14, borderRadius: 100, overflow: 'hidden', background: '#f1f5f9', marginBottom: 16 }}>
            {totalInvited > 0 && <>
              <div style={{ width: `${accepted.length / totalInvited * 100}%`, background: '#16a34a' }} />
              <div style={{ width: `${declined.length / totalInvited * 100}%`, background: '#f59e0b' }} />
              <div style={{ width: `${awaiting.length / totalInvited * 100}%`, background: '#e2e8f0' }} />
            </>}
          </div>
          {[
            { label: 'Attending', color: '#16a34a', n: accepted.length },
            { label: 'Declined', color: '#f59e0b', n: declined.length },
            { label: 'Awaiting', color: '#cbd5e1', n: awaiting.length },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, display: 'inline-block' }} />
                <span style={{ fontSize: 13, color: '#334155' }}>{r.label}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{r.n} / {totalInvited}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Awaiting responses */}
      <div style={{ ...cardStyle, marginBottom: 22 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>Awaiting responses</div>
        <div style={{ fontSize: 12.5, color: '#94a3b8', marginBottom: 16 }}>{awaiting.length === 0 ? 'All caught up.' : `${awaiting.length} guest${awaiting.length > 1 ? 's' : ''} haven't responded yet.`}</div>
        {awaiting.length === 0 ? (
          <div style={{ border: '1px dashed #e2e8f0', borderRadius: 14, padding: 36, textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Icon name="check" size={18} color="#16a34a" />
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>No pending guests</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Add guests and we'll track responses here.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {awaiting.slice(0, 6).map(g => (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: '#f8fafc' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{g.name}</div>
                  {g.phone && <div style={{ fontSize: 11, color: '#94a3b8' }}>{g.phone}</div>}
                </div>
                {g.phone && (
                  <a href={`https://wa.me/${g.phone.replace(/\D/g, '').replace(/^0/, '94')}?text=${encodeURIComponent(`Hi ${g.name}! Just a friendly reminder to RSVP for our wedding: ${link}`)}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: '#25d366', textDecoration: 'none', fontWeight: 600 }}>
                    <Icon name="whatsapp" size={13} color="#25d366" /> Remind
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div style={cardStyle}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>Quick actions</div>
        <div style={{ fontSize: 12.5, color: '#94a3b8', marginBottom: 14 }}>Jump back into what matters.</div>
        {[
          { key: 'custom-design' as SectionKey, icon: 'sparkles' as IconName, label: 'Choose template', sub: `${templateName(couple.template)} · switch anytime` },
          { key: 'rsvp' as SectionKey, icon: 'users' as IconName, label: 'Manage guests', sub: `${totalInvited} invited · ${awaiting.length} pending RSVP` },
          { key: 'checklist' as SectionKey, icon: 'checklist' as IconName, label: 'Plan wedding', sub: 'Tasks, checklist & vendors' },
          { key: 'budget' as SectionKey, icon: 'wallet' as IconName, label: 'Track budget', sub: 'Estimates, payments & vendors' },
          { key: 'vendors' as SectionKey, icon: 'home' as IconName, label: 'Vendor list', sub: 'Photographers, caterers & more' },
        ].map(q => (
          <button key={q.key} onClick={() => onNavigate(q.key)} style={{
            display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: '12px 4px',
            background: 'transparent', border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
          }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={q.icon} size={16} color="#64748b" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{q.label}</div>
              <div style={{ fontSize: 11.5, color: '#94a3b8' }}>{q.sub}</div>
            </div>
            <Icon name="chevron" size={15} color="#cbd5e1" />
          </button>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════ MY INVITATION / EDIT ══════════════════════════════
function MyInvitationSection({ couple, onSaved, focusEdit }: { couple: MyCouple; onSaved: () => void; focusEdit: boolean }) {
  const [bride, setBride] = useState(couple.bride)
  const [groom, setGroom] = useState(couple.groom)
  const [weddingDate, setWeddingDate] = useState(couple.wedding_date ? couple.wedding_date.slice(0, 10) : '')
  const [venue, setVenue] = useState(couple.venue || '')
  const [template, setTemplate] = useState(couple.template)
  const [photo, setPhoto] = useState(couple.couple_photo || '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const link = typeof window !== 'undefined' ? `${window.location.origin}/invite/${couple.slug}` : `/invite/${couple.slug}`
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=0&color=${PINK.replace('#', '')}&data=${encodeURIComponent(link)}`

  const uploadPhoto = async (file: File) => {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `couple/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, { cacheControl: '3600', upsert: false })
    if (!error) {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
      setPhoto(data.publicUrl)
    }
    setUploading(false)
  }

  const handleSave = async () => {
    if (!bride.trim() || !groom.trim() || !weddingDate) { setMessage("Please fill in the couple's names and wedding date."); return }
    setSaving(true); setMessage('')
    const { error } = await supabase.from('couples').update({
      bride: bride.trim(), groom: groom.trim(), wedding_date: weddingDate, venue: venue.trim() || null, template, couple_photo: photo || null,
    }).eq('id', couple.id)
    setSaving(false)
    if (error) setMessage('Could not save: ' + error.message)
    else { setMessage('Saved! Your invitation has been updated.'); onSaved() }
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const pMeta: Record<string, { label: string; bg: string; color: string }> = {
    lead: { label: 'Draft', bg: '#fef3c7', color: '#b45309' }, ongoing: { label: 'In Progress', bg: '#dbeafe', color: '#1d4ed8' },
    complete: { label: 'Live', bg: '#dcfce7', color: '#16a34a' }, sample: { label: 'Sample', bg: '#ede9fe', color: '#6d28d9' },
  }
  const statusMeta = pMeta[couple.project_status] || pMeta.lead

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{focusEdit ? 'Edit Invitation' : 'My Invitations'}</div>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Manage your invitation details, link, and QR code.</div>

      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          <div style={{ padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: statusMeta.bg, color: statusMeta.color }}>{statusMeta.label}</div>
          <div style={{ padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600, background: '#f1f5f9', color: '#475569' }}>{templateName(couple.template)}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, marginBottom: 4 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em', marginBottom: 4 }}>YOUR INVITATION LINK</div>
            <div style={{ fontSize: 12.5, color: '#1e293b', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 10 }}>{link.replace(/^https?:\/\//, '')}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={copyLink} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 100, border: 'none', cursor: 'pointer', background: copied ? '#16a34a' : PINK, color: '#fff', fontSize: 11.5, fontWeight: 600 }}>
                <Icon name={copied ? 'check' : 'copy'} size={12} color="#fff" /> {copied ? 'Copied' : 'Copy'}
              </button>
              <a href={`/invite/${couple.slug}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 100, border: `1px solid ${PINK}`, color: PINK, fontSize: 11.5, fontWeight: 600, textDecoration: 'none' }}>Preview</a>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrSrc} alt="QR code" width={72} height={72} style={{ borderRadius: 8, background: '#fff', border: '1px solid #e2e8f0', flexShrink: 0 }} />
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Invitation Details</div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Couple Photo</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {photo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={photo} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', border: '1px solid #e2e8f0' }} />
            ) : (
              <div style={{ width: 52, height: 52, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }} />
            )}
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 12, color: '#475569', fontWeight: 500 }}>
              {uploading ? 'Uploading...' : photo ? 'Change Photo' : 'Upload Photo'}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f) }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div><label style={labelStyle}>Bride's Name</label><input value={bride} onChange={e => setBride(e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>Groom's Name</label><input value={groom} onChange={e => setGroom(e.target.value)} style={inputStyle} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div><label style={labelStyle}>Wedding Date</label><input type="date" value={weddingDate} onChange={e => setWeddingDate(e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>Venue</label><input value={venue} onChange={e => setVenue(e.target.value)} placeholder="e.g. Cinnamon Grand, Colombo" style={inputStyle} /></div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Template</label>
          <select value={template} onChange={e => setTemplate(e.target.value)} style={inputStyle}>
            {TEMPLATE_OPTIONS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        {message && <div style={{ fontSize: 12, marginBottom: 12, color: message.startsWith('Saved') ? '#16a34a' : '#dc2626' }}>{message}</div>}
        <button onClick={handleSave} disabled={saving} style={{ padding: '11px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${PINK},${RED})`, color: '#fff', fontWeight: 700, fontSize: 13, opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

function CustomDesignSection({ couple }: { couple: MyCouple }) {
  const waUrl = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(`Hi! I'd like a custom design for my InviteGlow invitation.\n\nCouple: ${couple.bride} & ${couple.groom}\nLink: /invite/${couple.slug}`)}`
  const benefits = [
    'A one-of-a-kind layout built around your story — not a shared template',
    'Direct back-and-forth with our design team until it feels right',
    'Your own color palette, fonts, and section layout',
  ]
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: PINK, letterSpacing: '0.05em', marginBottom: 4 }}>PREMIUM</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Custom Design</div>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Want something entirely your own? Our team can hand-build it with you.</div>

      <div style={{ background: `linear-gradient(150deg, #fff9f6 0%, #fdeef1 55%, #fbe4e9 100%)`, borderRadius: 20, padding: 32, position: 'relative', overflow: 'hidden', border: '1px solid #f6e1e6' }}>
        <div style={{ position: 'absolute', top: -70, right: -70, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,180,140,0.25), transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: -50, left: -30, width: 160, height: 160, borderRadius: '50%', background: `radial-gradient(circle, ${PINK}1a, transparent 70%)` }} />
        <div style={{ position: 'relative' }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: 'linear-gradient(135deg,#f4b48c,#e0355c)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, boxShadow: '0 6px 18px rgba(224,53,92,0.25)' }}>
            <Icon name="sparkles" size={20} color="#fff" />
          </div>
          <div style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Bespoke design, built with you</div>
          <div style={{ fontSize: 13, color: '#6b5a5f', marginBottom: 20, maxWidth: 440 }}>
            Every template on InviteGlow is fully editable already — but if you want a design made from scratch, our team can craft one entirely around your vision.
          </div>
          <div style={{ display: 'grid', gap: 10, marginBottom: 24 }}>
            {benefits.map(b => (
              <div key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'linear-gradient(135deg,#f4b48c,#e0355c)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <Icon name="check" size={10} color="#fff" />
                </div>
                <span style={{ fontSize: 12.5, color: '#3d2e32', lineHeight: 1.5 }}>{b}</span>
              </div>
            ))}
          </div>
          <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 22px', borderRadius: 100, background: '#25d366', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 13, boxShadow: '0 6px 18px rgba(37,211,102,0.3)' }}>
            <Icon name="whatsapp" size={14} color="#fff" /> Chat with our design team
          </a>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════ ADD GUESTS ══════════════════════════════
type NewGuestRow = { name: string; phone: string; heads: number; category: string; side: string }
const emptyGuestRow = (): NewGuestRow => ({ name: '', phone: '', heads: 1, category: 'friends', side: 'both' })

function AddGuestsSection({ couple, guests, onChanged, onNavigate }: { couple: MyCouple; guests: GuestRow[]; onChanged: () => void; onNavigate: (s: SectionKey) => void }) {
  const [rows, setRows] = useState<NewGuestRow[]>([emptyGuestRow()])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const updateRow = (i: number, patch: Partial<NewGuestRow>) => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r))
  const addRow = () => setRows(prev => [...prev, emptyGuestRow()])
  const removeRow = (i: number) => setRows(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev)

  const validRows = rows.filter(r => r.name.trim())

  const saveGuests = async () => {
    if (validRows.length === 0) { setMessage('Enter at least one name.'); return }
    setSaving(true); setMessage('')
    const payload = validRows.map(r => ({
      couple_id: couple.id, name: r.name.trim(), phone: r.phone.trim() || null, heads: r.heads, category: r.category, side: r.side,
    }))
    const { error } = await supabase.from('guests').insert(payload)
    setSaving(false)
    if (!error) { setRows([emptyGuestRow()]); onChanged() } else setMessage('Could not save: ' + error.message)
  }

  const removeGuest = async (id: string, gname: string) => {
    if (!confirm(`Remove ${gname} from your guest list?`)) return
    const { error } = await supabase.from('guests').delete().eq('id', id)
    if (!error) onChanged()
  }

  const colStyle: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em', padding: '0 4px 8px' }
  const cellInput: React.CSSProperties = { ...inputStyle, padding: '9px 12px', fontSize: 12.5 }

  return (
    <div>
      <GuestManagementTabs active="add-guests" onNavigate={onNavigate} />
      <div style={{ fontSize: 11, fontWeight: 700, color: PINK, letterSpacing: '0.05em', marginBottom: 4 }}>GUEST MANAGEMENT</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Add guests</div>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Add guests to your invitation list — fill in as many rows as you need.</div>

      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 760, padding: '18px 20px 8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '24px 2fr 1.6fr 1fr 0.9fr 1fr 1fr 32px', gap: 10 }}>
              <div style={colStyle}>#</div>
              <div style={colStyle}>NAME *</div>
              <div style={colStyle}>WHATSAPP</div>
              <div style={colStyle}>HEADS</div>
              <div style={colStyle}></div>
              <div style={colStyle}>CATEGORY</div>
              <div style={colStyle}>SIDE</div>
              <div />
            </div>
            {rows.map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 2fr 1.6fr 1fr 0.9fr 1fr 1fr 32px', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{i + 1}</div>
                <input value={row.name} onChange={e => updateRow(i, { name: e.target.value })} placeholder="Full name" style={cellInput} />
                <input value={row.phone} onChange={e => updateRow(i, { phone: e.target.value })} placeholder="071 234 5678" style={cellInput} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button onClick={() => updateRow(i, { heads: Math.max(1, row.heads - 1) })} style={{ width: 24, height: 24, borderRadius: 7, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#64748b' }}>−</button>
                  <span style={{ fontSize: 12.5, fontWeight: 700, width: 16, textAlign: 'center' }}>{row.heads}</span>
                  <button onClick={() => updateRow(i, { heads: row.heads + 1 })} style={{ width: 24, height: 24, borderRadius: 7, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#64748b' }}>+</button>
                </div>
                <div />
                <select value={row.category} onChange={e => updateRow(i, { category: e.target.value })} style={cellInput}>
                  {GUEST_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
                <select value={row.side} onChange={e => updateRow(i, { side: e.target.value })} style={cellInput}>
                  {GUEST_SIDES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
                <button onClick={() => removeRow(i)} aria-label="Remove row" style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: 'transparent', color: '#cbd5e1', cursor: 'pointer' }}><Icon name="cross" size={13} color="#cbd5e1" /></button>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 10 }}>
          <div>
            {message && <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>{message}</div>}
            <div style={{ fontSize: 11.5, color: '#94a3b8' }}>{rows.length} row{rows.length > 1 ? 's' : ''} total</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addRow} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 16px', borderRadius: 100, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: '#475569' }}>
              <Icon name="plus" size={12} /> Row
            </button>
            <button onClick={saveGuests} disabled={saving || validRows.length === 0} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 100, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${PINK},${RED})`, color: '#fff', fontWeight: 700, fontSize: 12.5, opacity: (saving || validRows.length === 0) ? 0.6 : 1 }}>
              <Icon name="userPlus" size={13} color="#fff" /> {saving ? 'Saving...' : 'Save guests'}
            </button>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Guest List ({guests.length})</div>
        {guests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8', fontSize: 13 }}>No guests added yet.</div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {guests.map(g => (
              <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 10, background: '#f8fafc', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{g.name} {g.heads > 1 && <span style={{ fontSize: 11, color: '#94a3b8' }}>× {g.heads}</span>}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{g.phone || 'No phone'} · {categoryLabel(g.category)} · {sideLabel(g.side)}</div>
                </div>
                <button onClick={() => removeGuest(g.id, g.name)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="trash" size={13} color="#dc2626" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════ GUEST LIST & LINKS ══════════════════════════════
function GuestLinksSection({ couple, guests, rsvps, onNavigate }: { couple: MyCouple; guests: GuestRow[]; rsvps: RsvpRow[]; onNavigate: (s: SectionKey) => void }) {
  const [copiedId, setCopiedId] = useState('')
  const [template, setTemplate] = useState((couple as any).whatsapp_invite_message || "You're invited! Join us for our wedding 💍")
  const [templateOpen, setTemplateOpen] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [search, setSearch] = useState('')
  const [rsvpFilter, setRsvpFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sideFilter, setSideFilter] = useState('all')

  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/invite/${couple.slug}` : `/invite/${couple.slug}`
  const linkFor = (name: string) => `${baseUrl}?name=${encodeURIComponent(name)}`
  const respondedNames = new Set(rsvps.map(r => r.guest_name.trim().toLowerCase()))
  const rsvpStatusOf = (name: string) => {
    const q = name.trim().toLowerCase()
    const match = rsvps.find(r => r.guest_name.trim().toLowerCase() === q || r.guest_name.trim().toLowerCase().includes(q) || q.includes(r.guest_name.trim().toLowerCase()))
    return match ? match.response : 'pending'
  }

  const copy = async (id: string, name: string) => {
    await navigator.clipboard.writeText(linkFor(name))
    setCopiedId(id)
    setTimeout(() => setCopiedId(''), 2000)
  }

  const saveTemplate = async () => {
    setSavingTemplate(true)
    await supabase.from('couples').update({ whatsapp_invite_message: template }).eq('id', couple.id)
    setSavingTemplate(false)
  }

  const filtered = guests.filter(g => {
    if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false
    if (categoryFilter !== 'all' && g.category !== categoryFilter) return false
    if (sideFilter !== 'all' && g.side !== sideFilter) return false
    if (rsvpFilter !== 'all' && rsvpStatusOf(g.name) !== rsvpFilter) return false
    return true
  })

  const totalHeads = guests.reduce((s, g) => s + (g.heads || 1), 0)
  const selectStyle: React.CSSProperties = { ...inputStyle, padding: '9px 12px', fontSize: 12.5 }

  return (
    <div>
      <GuestManagementTabs active="guest-links" onNavigate={onNavigate} />
      <div style={{ fontSize: 11, fontWeight: 700, color: PINK, letterSpacing: '0.05em', marginBottom: 4 }}>GUEST MANAGEMENT</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Guest list &amp; links</div>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>{guests.length} guests · {totalHeads} total head count</div>

      <div style={{ ...cardStyle, marginBottom: 14 }}>
        <button onClick={() => setTemplateOpen(!templateOpen)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
          <Icon name="sparkles" size={14} color={PINK} />
          <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>WhatsApp message template</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', background: '#f1f5f9', padding: '2px 10px', borderRadius: 100 }}>{(couple as any).whatsapp_invite_message ? 'Custom' : 'Default'}</span>
          <Icon name="chevron" size={14} color="#cbd5e1" />
        </button>
        {templateOpen && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
            <textarea value={template} onChange={e => setTemplate(e.target.value)} style={{ ...inputStyle, borderRadius: 14, minHeight: 70, resize: 'vertical' as const, marginBottom: 10 }} />
            <button onClick={saveTemplate} disabled={savingTemplate} style={{ padding: '9px 18px', borderRadius: 100, border: 'none', cursor: 'pointer', background: PINK, color: '#fff', fontWeight: 700, fontSize: 12.5, opacity: savingTemplate ? 0.6 : 1 }}>{savingTemplate ? 'Saving...' : 'Save template'}</button>
          </div>
        )}
      </div>

      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="grid2" size={12} color="#94a3b8" /> REFINE
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginBottom: 12 }}>
          <select value={rsvpFilter} onChange={e => setRsvpFilter(e.target.value)} style={selectStyle}>
            <option value="all">All RSVP</option><option value="yes">Attending</option><option value="no">Declined</option><option value="pending">Pending</option>
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={selectStyle}>
            <option value="all">All groups</option>{GUEST_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <select value={sideFilter} onChange={e => setSideFilter(e.target.value)} style={selectStyle}>
            <option value="all">All sides</option>{GUEST_SIDES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}><Icon name="search" size={15} color="#94a3b8" /></div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search guests..." style={{ ...inputStyle, paddingLeft: 38 }} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: 40 }}>
          <Icon name="users" size={28} color="#e2e8f0" />
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', marginTop: 10 }}>No guests match</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{guests.length === 0 ? 'Add guests from the Add Guests page to start sharing invitations.' : 'Try a different search or filter.'}</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.map(g => (
            <div key={g.id} style={{ ...cardStyle, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{g.name}</div>
                <div style={{ fontSize: 11.5, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320 }}>{linkFor(g.name).replace(/^https?:\/\//, '')}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => copy(g.id, g.name)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 100, border: 'none', cursor: 'pointer', background: copiedId === g.id ? '#16a34a' : PINK, color: '#fff', fontSize: 11.5, fontWeight: 600 }}>
                  <Icon name={copiedId === g.id ? 'check' : 'copy'} size={12} color="#fff" /> {copiedId === g.id ? 'Copied' : 'Copy'}
                </button>
                <a href={`https://wa.me/${g.phone ? g.phone.replace(/\D/g, '').replace(/^0/, '94') : ''}?text=${encodeURIComponent(`${template}\n${linkFor(g.name)}`)}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 100, border: 'none', cursor: 'pointer', background: '#25d366', color: '#fff', fontSize: 11.5, fontWeight: 600, textDecoration: 'none' }}>
                  <Icon name="whatsapp" size={12} color="#fff" /> Share
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════ RSVP MANAGEMENT ══════════════════════════════
function RsvpManagementSection({ couple, guests, rsvps, onChanged, onNavigate }: { couple: MyCouple; guests: GuestRow[]; rsvps: RsvpRow[]; onChanged: () => void; onNavigate: (s: SectionKey) => void }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'yes' | 'no' | 'pending'>('all')

  const respondedNames = new Set(rsvps.map(r => r.guest_name.trim().toLowerCase()))
  const pendingGuests = guests.filter(g => {
    const q = g.name.trim().toLowerCase()
    return !Array.from(respondedNames).some(n => n.includes(q) || q.includes(n))
  })
  const attending = rsvps.filter(r => r.response === 'yes')
  const declined = rsvps.filter(r => r.response === 'no')
  const totalInvited = Math.max(guests.length, rsvps.length)
  const responseRate = totalInvited > 0 ? Math.round((rsvps.length / totalInvited) * 100) : 0

  const removeRsvp = async (id: string, name: string) => {
    if (!confirm(`Remove ${name}'s RSVP?`)) return
    const { error } = await supabase.from('rsvps').delete().eq('id', id)
    if (!error) onChanged()
  }

  const filteredRsvps = rsvps.filter(r => {
    if (search && !r.guest_name.toLowerCase().includes(search.toLowerCase())) return false
    if (filter === 'yes' && r.response !== 'yes') return false
    if (filter === 'no' && r.response !== 'no') return false
    return true
  })
  const filteredPending = pendingGuests.filter(g => !search || g.name.toLowerCase().includes(search.toLowerCase()))

  const pill = (active: boolean): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: active ? 'none' : '1px solid #e2e8f0', background: active ? '#0f172a' : '#fff', color: active ? '#fff' : '#64748b' })
  const countBadge = (active: boolean, n: number): React.CSSProperties => ({ fontSize: 10.5, fontWeight: 700, padding: '1px 7px', borderRadius: 100, background: active ? 'rgba(255,255,255,0.2)' : '#f1f5f9', color: active ? '#fff' : '#64748b' })

  return (
    <div>
      <GuestManagementTabs active="rsvp" onNavigate={onNavigate} />
      <div style={{ fontSize: 11, fontWeight: 700, color: PINK, letterSpacing: '0.05em', marginBottom: 4 }}>GUEST MANAGEMENT</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>RSVP management</div>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Responses, head counts, and notes from your guests.</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 18 }}>
        <div style={{ ...cardStyle, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, fontWeight: 700, color: '#16a34a', marginBottom: 10 }}><Icon name="users" size={12} color="#16a34a" /> ATTENDING</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{attending.length}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>of {totalInvited} invited</div>
        </div>
        <div style={{ ...cardStyle, background: '#fef2f2', border: '1px solid #fecaca' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, fontWeight: 700, color: '#dc2626', marginBottom: 10 }}><Icon name="cross" size={12} color="#dc2626" /> DECLINED</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{declined.length}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>responses</div>
        </div>
        <div style={{ ...cardStyle, background: '#fffbeb', border: '1px solid #fde68a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, fontWeight: 700, color: '#b45309', marginBottom: 10 }}><Icon name="mail" size={12} color="#b45309" /> PENDING</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{pendingGuests.length}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{responseRate}% response rate</div>
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: 12 }}>
        <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}><Icon name="search" size={15} color="#94a3b8" /></div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name..." style={{ ...inputStyle, paddingLeft: 38 }} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <div onClick={() => setFilter('all')} style={pill(filter === 'all')}>All <span style={countBadge(filter === 'all', rsvps.length)}>{rsvps.length}</span></div>
        <div onClick={() => setFilter('yes')} style={pill(filter === 'yes')}>Accepted <span style={countBadge(filter === 'yes', attending.length)}>{attending.length}</span></div>
        <div onClick={() => setFilter('pending')} style={pill(filter === 'pending')}>Pending <span style={countBadge(filter === 'pending', pendingGuests.length)}>{pendingGuests.length}</span></div>
        <div onClick={() => setFilter('no')} style={pill(filter === 'no')}>Declined <span style={countBadge(filter === 'no', declined.length)}>{declined.length}</span></div>
      </div>

      {filter === 'pending' ? (
        filteredPending.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', padding: 40 }}>
            <Icon name="mail" size={28} color="#e2e8f0" />
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', marginTop: 10 }}>No responses match this view</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>No guests are pending for this event yet.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {filteredPending.map(g => (
              <div key={g.id} style={{ ...cardStyle, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{g.name}</div>
                <span style={{ padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600, background: '#fef3c7', color: '#b45309' }}>Pending</span>
              </div>
            ))}
          </div>
        )
      ) : filteredRsvps.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: 40 }}>
          <Icon name="mail" size={28} color="#e2e8f0" />
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', marginTop: 10 }}>No responses match this view</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>No guests are linked to this event yet.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {filteredRsvps.map(r => (
            <div key={r.id} style={{ ...cardStyle, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{r.guest_name}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}{r.response === 'yes' && r.guest_count > 1 ? ` · Party of ${r.guest_count}` : ''}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: r.response === 'yes' ? '#dcfce7' : '#fee2e2', color: r.response === 'yes' ? '#16a34a' : '#dc2626' }}>{r.response === 'yes' ? 'Attending' : 'Declined'}</span>
                <button onClick={() => removeRsvp(r.id, r.guest_name)} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="trash" size={12} color="#dc2626" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════ TABLE ARRANGEMENT ══════════════════════════════
function TableArrangementSection({ couple, guests, onChanged, onNavigate }: { couple: MyCouple; guests: GuestRow[]; onChanged: () => void; onNavigate: (s: SectionKey) => void }) {
  const [tables, setTables] = useState<SeatingTable[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sideFilter, setSideFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [newTableName, setNewTableName] = useState('')
  const [selectedGuestId, setSelectedGuestId] = useState('')

  const load = async () => {
    const { data } = await supabase.from('seating_tables').select('*').eq('couple_id', couple.id).order('created_at', { ascending: true })
    if (data) setTables(data as SeatingTable[])
    setLoading(false)
  }
  useEffect(() => { load() }, [couple.id])

  // Keep the public invitation's "Find Your Table" search in sync — it
  // reads couple.seats as a flat { guestNameLower: tableName } map.
  const syncSeatsMap = async (updatedGuests: GuestRow[], tableList: SeatingTable[]) => {
    const seatsObj: Record<string, string> = {}
    updatedGuests.forEach(g => {
      if (g.table_id) {
        const t = tableList.find(tb => tb.id === g.table_id)
        if (t) seatsObj[g.name.trim().toLowerCase()] = t.name
      }
    })
    await supabase.from('couples').update({ seats: seatsObj, show_seating: true }).eq('id', couple.id)
  }

  const addTable = async () => {
    const name = newTableName.trim() || `Table ${tables.length + 1}`
    const { data, error } = await supabase.from('seating_tables').insert([{ couple_id: couple.id, name }]).select().single()
    if (!error && data) { setTables(prev => [...prev, data as SeatingTable]); setNewTableName('') }
  }

  const removeTable = async (id: string) => {
    if (!confirm('Delete this table? Guests seated here will become unassigned.')) return
    await supabase.from('guests').update({ table_id: null }).eq('table_id', id)
    await supabase.from('seating_tables').delete().eq('id', id)
    load(); onChanged()
  }

  const assignGuest = async (guestId: string, tableId: string | null) => {
    await supabase.from('guests').update({ table_id: tableId }).eq('id', guestId)
    const updated = guests.map(g => g.id === guestId ? { ...g, table_id: tableId } : g)
    await syncSeatsMap(updated, tables)
    setSelectedGuestId('')
    onChanged()
  }

  const unassigned = guests.filter(g => !g.table_id).filter(g => {
    if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false
    if (sideFilter !== 'all' && g.side !== sideFilter) return false
    if (categoryFilter !== 'all' && g.category !== categoryFilter) return false
    return true
  })

  const totalHeadsSeated = guests.filter(g => g.table_id).reduce((s, g) => s + (g.heads || 1), 0)
  const totalHeads = guests.reduce((s, g) => s + (g.heads || 1), 0)

  const pillSm = (active: boolean): React.CSSProperties => ({ padding: '4px 10px', borderRadius: 100, fontSize: 10.5, fontWeight: 600, cursor: 'pointer', border: active ? 'none' : '1px solid #e2e8f0', background: active ? '#0f172a' : '#fff', color: active ? '#fff' : '#64748b' })

  return (
    <div>
      <GuestManagementTabs active="table" onNavigate={onNavigate} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: PINK, letterSpacing: '0.05em', marginBottom: 4 }}>GUEST MANAGEMENT</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Table arrangement</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>{tables.length} tables · {totalHeadsSeated}/{totalHeads} heads seated</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={newTableName} onChange={e => setNewTableName(e.target.value)} placeholder="New table name" style={{ ...inputStyle, width: 160 }} />
          <button onClick={addTable} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 100, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${PINK},${RED})`, color: '#fff', fontWeight: 700, fontSize: 12.5, whiteSpace: 'nowrap' }}>
            <Icon name="plus" size={13} color="#fff" /> Add table
          </button>
        </div>
      </div>

      {selectedGuestId && (
        <div style={{ background: `${PINK}14`, border: `1px solid ${PINK}44`, borderRadius: 12, padding: '10px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <span style={{ fontSize: 12.5, color: '#3d2530' }}><strong>{guests.find(g => g.id === selectedGuestId)?.name}</strong> selected — tap a table below to seat them.</span>
          <button onClick={() => setSelectedGuestId('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: PINK, fontSize: 12, fontWeight: 700 }}>Cancel</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }} className="ig-table-grid">
        <style>{`@media (max-width: 800px) { .ig-table-grid { grid-template-columns: 1fr !important; } }`}</style>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Unassigned guests ({unassigned.length})</div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search guests..." style={{ ...inputStyle, marginBottom: 10, fontSize: 12.5 }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
            <span onClick={() => setSideFilter('all')} style={pillSm(sideFilter === 'all')}>All sides</span>
            {GUEST_SIDES.map(s => <span key={s.key} onClick={() => setSideFilter(s.key)} style={pillSm(sideFilter === s.key)}>{s.label}</span>)}
          </div>
          <div style={{ display: 'grid', gap: 6, maxHeight: 420, overflowY: 'auto' }}>
            {unassigned.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 12 }}>No unassigned guests.</div>
            ) : unassigned.map(g => (
              <button key={g.id} onClick={() => setSelectedGuestId(g.id === selectedGuestId ? '' : g.id)} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 9,
                border: selectedGuestId === g.id ? `1.5px solid ${PINK}` : '1px solid #f1f5f9', background: selectedGuestId === g.id ? `${PINK}0d` : '#f8fafc', cursor: 'pointer',
              }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#1e293b' }}>{g.name}</span>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>× {g.heads}</span>
              </button>
            ))}
          </div>
        </div>

        {tables.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', padding: 50 }}>
            <Icon name="grid2" size={30} color="#e2e8f0" />
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginTop: 12 }}>No tables yet</div>
            <div style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 4, marginBottom: 18 }}>Create your first table to start seating guests.</div>
            <button onClick={addTable} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 22px', borderRadius: 100, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${PINK},${RED})`, color: '#fff', fontWeight: 700, fontSize: 13 }}>
              <Icon name="plus" size={14} color="#fff" /> Add your first table
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12, alignContent: 'start' }}>
            {tables.map(t => {
              const seated = guests.filter(g => g.table_id === t.id)
              return (
                <div key={t.id} onClick={() => selectedGuestId && assignGuest(selectedGuestId, t.id)} style={{
                  ...cardStyle, cursor: selectedGuestId ? 'pointer' : 'default',
                  border: selectedGuestId ? `1.5px dashed ${PINK}` : '1px solid #eef0f3',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{t.name}</div>
                    <button onClick={e => { e.stopPropagation(); removeTable(t.id) }} style={{ width: 24, height: 24, borderRadius: 7, border: 'none', background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="trash" size={11} color="#dc2626" /></button>
                  </div>
                  {seated.length === 0 ? (
                    <div style={{ fontSize: 11.5, color: '#cbd5e1', fontStyle: 'italic' }}>No guests seated</div>
                  ) : (
                    <div style={{ display: 'grid', gap: 5 }}>
                      {seated.map(g => (
                        <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderRadius: 8, padding: '5px 8px' }}>
                          <span style={{ fontSize: 11.5, color: '#334155' }}>{g.name}</span>
                          <button onClick={e => { e.stopPropagation(); assignGuest(g.id, null) }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#cbd5e1', fontSize: 12 }}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════ GUEST GALLERY ══════════════════════════════
function WishesWallSection({ couple, onNavigate }: { couple: MyCouple; onNavigate: (s: SectionKey) => void }) {
  const [wishes, setWishes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [filter, setFilter] = useState<'pending' | 'approved'>('pending')

  const load = async () => {
    const { data } = await supabase.from('wishes').select('*').eq('couple_id', couple.id).order('created_at', { ascending: false })
    if (data) setWishes(data)
    setLoading(false)
  }
  useEffect(() => { load() }, [couple.id])

  const setApproved = async (id: string, approved: boolean) => {
    setBusyId(id)
    const { error } = await supabase.from('wishes').update({ approved }).eq('id', id)
    setBusyId('')
    if (!error) setWishes(prev => prev.map(w => w.id === id ? { ...w, approved } : w))
  }

  const del = async (id: string) => {
    if (!confirm('Delete this wish?')) return
    setBusyId(id)
    const { error } = await supabase.from('wishes').delete().eq('id', id)
    setBusyId('')
    if (!error) setWishes(prev => prev.filter(w => w.id !== id))
  }

  const pending = wishes.filter(w => !w.approved)
  const approved = wishes.filter(w => w.approved)
  const shown = filter === 'pending' ? pending : approved
  const pill = (active: boolean): React.CSSProperties => ({ padding: '7px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: active ? 'none' : '1px solid #e2e8f0', background: active ? PINK : '#fff', color: active ? '#fff' : '#64748b' })

  return (
    <div>
      <GuestManagementTabs active="gallery" onNavigate={onNavigate} />
      <div style={{ fontSize: 11, fontWeight: 700, color: PINK, letterSpacing: '0.05em', marginBottom: 4 }}>GUEST MANAGEMENT</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Wishes wall</div>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Approve guest wishes, photos, and videos before they appear on your invitation.</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <div onClick={() => setFilter('pending')} style={pill(filter === 'pending')}>Pending ({pending.length})</div>
        <div onClick={() => setFilter('approved')} style={pill(filter === 'approved')}>Approved ({approved.length})</div>
      </div>

      {loading ? <div style={{ color: '#94a3b8', fontSize: 13 }}>Loading...</div> : shown.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: 40 }}>
          <Icon name="gallery" size={28} color="#e2e8f0" />
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', marginTop: 10 }}>{filter === 'pending' ? 'No wishes waiting for approval' : 'No approved wishes yet'}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Once your invitation is live and guests visit, their wishes will appear here.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {shown.map(w => {
            const media: { url: string; type: string }[] = w.media?.length ? w.media : (w.photo_url ? [{ url: w.photo_url, type: 'photo' }] : w.video_url ? [{ url: w.video_url, type: 'video' }] : [])
            return (
              <div key={w.id} style={{ ...cardStyle, padding: 16 }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  {media[0] && (
                    <div style={{ width: 60, height: 60, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#f1f5f9' }}>
                      {media[0].type === 'video' ? <video src={media[0].url} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={media[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{w.guest_name}</div>
                    <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 2 }}>{w.message}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  {w.approved ? (
                    <button onClick={() => setApproved(w.id, false)} disabled={busyId === w.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 100, border: '1px solid #fde68a', background: '#fffbeb', color: '#b45309', cursor: 'pointer', fontSize: 11.5, fontWeight: 600 }}>Unapprove</button>
                  ) : (
                    <button onClick={() => setApproved(w.id, true)} disabled={busyId === w.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 100, border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#16a34a', cursor: 'pointer', fontSize: 11.5, fontWeight: 600 }}>
                      <Icon name="check" size={11} color="#16a34a" /> Accept
                    </button>
                  )}
                  <button onClick={() => del(w.id)} disabled={busyId === w.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 100, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 11.5, fontWeight: 600 }}>
                    <Icon name="cross" size={11} color="#dc2626" /> Decline
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

// ══════════════════════════════ TASK CHECKLIST ══════════════════════════════
function ChecklistSection({ couple }: { couple: MyCouple }) {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [taskName, setTaskName] = useState('')
  const [dueDate, setDueDate] = useState('')

  const load = async () => {
    const { data } = await supabase.from('checklist_items').select('*').eq('couple_id', couple.id).order('created_at', { ascending: true })
    if (data) setItems(data as ChecklistItem[])
    setLoading(false)
  }
  useEffect(() => { load() }, [couple.id])

  const add = async () => {
    if (!taskName.trim()) return
    const { error } = await supabase.from('checklist_items').insert([{ couple_id: couple.id, task_name: taskName.trim(), due_date: dueDate || null }])
    if (!error) { setTaskName(''); setDueDate(''); load() }
  }
  const toggle = async (item: ChecklistItem) => {
    const { error } = await supabase.from('checklist_items').update({ done: !item.done }).eq('id', item.id)
    if (!error) setItems(prev => prev.map(i => i.id === item.id ? { ...i, done: !i.done } : i))
  }
  const remove = async (id: string) => {
    const { error } = await supabase.from('checklist_items').delete().eq('id', id)
    if (!error) setItems(prev => prev.filter(i => i.id !== id))
  }

  const doneCount = items.filter(i => i.done).length
  const pct = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Task Checklist</div>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Keep track of everything on your wedding to-do list.</div>

      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{doneCount} of {items.length} done</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>{pct}%</div>
        </div>
        <div style={{ height: 6, background: '#f1f5f9', borderRadius: 100, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${PINK},${RED})` }} />
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input value={taskName} onChange={e => setTaskName(e.target.value)} placeholder="Add a task, e.g. Book photographer" style={{ ...inputStyle, flex: 2, minWidth: 200 }} />
        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 140 }} />
        <button onClick={add} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', background: PINK, color: '#fff', fontWeight: 700, fontSize: 13 }}>Add</button>
      </div>

      {loading ? <div style={{ color: '#94a3b8', fontSize: 13 }}>Loading...</div> : items.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: 30, color: '#94a3b8', fontSize: 13 }}>No tasks yet — add your first above.</div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {items.map(item => (
            <div key={item.id} style={{ ...cardStyle, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => toggle(item)} style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${item.done ? '#16a34a' : '#e2e8f0'}`, background: item.done ? '#16a34a' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {item.done && <Icon name="check" size={12} color="#fff" />}
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: item.done ? '#94a3b8' : '#0f172a', textDecoration: item.done ? 'line-through' : 'none' }}>{item.task_name}</div>
                {item.due_date && <div style={{ fontSize: 11, color: '#94a3b8' }}>Due {new Date(item.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>}
              </div>
              <button onClick={() => remove(item.id)} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="trash" size={12} color="#dc2626" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════ BUDGET (reuses the couples-dashboard pattern) ══════════════════════════════
function BudgetSection({ couple }: { couple: MyCouple }) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ item_name: '', vendor: '', estimated_cost: '', paid_amount: '' })

  const load = async () => {
    const { data } = await supabase.from('budget_items').select('*').eq('couple_id', couple.id).order('created_at', { ascending: true })
    if (data) setItems(data)
    setLoading(false)
  }
  useEffect(() => { load() }, [couple.id])

  const add = async () => {
    if (!form.item_name.trim()) return
    const { error } = await supabase.from('budget_items').insert([{
      couple_id: couple.id, category: 'other', item_name: form.item_name.trim(), vendor: form.vendor.trim() || null,
      estimated_cost: parseFloat(form.estimated_cost) || 0, paid_amount: parseFloat(form.paid_amount) || 0, status: 'pending',
    }])
    if (!error) { setForm({ item_name: '', vendor: '', estimated_cost: '', paid_amount: '' }); setShowForm(false); load() }
  }
  const remove = async (id: string) => {
    const { error } = await supabase.from('budget_items').delete().eq('id', id)
    if (!error) setItems(prev => prev.filter(i => i.id !== id))
  }

  const totalEstimated = items.reduce((s, i) => s + (i.estimated_cost || 0), 0)
  const totalPaid = items.reduce((s, i) => s + (i.paid_amount || 0), 0)
  const fmt = (n: number) => `LKR ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Budget Management</div>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Track expenses, vendors, and how much you've paid so far.</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 20 }}>
        <StatCard label="Total Estimated" value={fmt(totalEstimated)} icon="wallet" iconBg="#eef2ff" iconColor="#4f46e5" />
        <StatCard label="Paid So Far" value={fmt(totalPaid)} icon="check" iconBg="#f0fdf4" iconColor="#16a34a" />
        <StatCard label="Balance Due" value={fmt(Math.max(0, totalEstimated - totalPaid))} icon="card" iconBg="#fef2f2" iconColor="#dc2626" />
      </div>

      {showForm ? (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <input value={form.item_name} onChange={e => setForm({ ...form, item_name: e.target.value })} placeholder="Item, e.g. Wedding Cake" style={inputStyle} />
            <input value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} placeholder="Vendor (optional)" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <input value={form.estimated_cost} onChange={e => setForm({ ...form, estimated_cost: e.target.value.replace(/[^\d.]/g, '') })} placeholder="Estimated (LKR)" style={inputStyle} />
            <input value={form.paid_amount} onChange={e => setForm({ ...form, paid_amount: e.target.value.replace(/[^\d.]/g, '') })} placeholder="Paid (LKR)" style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={add} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', background: PINK, color: '#fff', fontWeight: 700, fontSize: 13 }}>Add Expense</button>
            <button onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#64748b' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: 13, borderRadius: 12, border: `1.5px dashed ${PINK}`, cursor: 'pointer', background: `${PINK}0d`, color: PINK, fontWeight: 700, fontSize: 13, marginBottom: 16 }}>
          <Icon name="plus" size={14} color={PINK} /> Add Expense
        </button>
      )}

      {loading ? <div style={{ color: '#94a3b8', fontSize: 13 }}>Loading...</div> : items.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: 30, color: '#94a3b8', fontSize: 13 }}>No expenses tracked yet.</div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {items.map(item => (
            <div key={item.id} style={{ ...cardStyle, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{item.item_name}</div>
                <div style={{ fontSize: 11.5, color: '#94a3b8' }}>{item.vendor || 'No vendor set'} · Est {fmt(item.estimated_cost || 0)} · Paid {fmt(item.paid_amount || 0)}</div>
              </div>
              <button onClick={() => remove(item.id)} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="trash" size={12} color="#dc2626" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════ VENDOR LIST ══════════════════════════════
function VendorsSection({ couple }: { couple: MyCouple }) {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ vendor_name: '', category: 'photography', contact_name: '', phone: '', cost: '' })

  const load = async () => {
    const { data } = await supabase.from('vendors').select('*').eq('couple_id', couple.id).order('created_at', { ascending: true })
    if (data) setVendors(data as Vendor[])
    setLoading(false)
  }
  useEffect(() => { load() }, [couple.id])

  const add = async () => {
    if (!form.vendor_name.trim()) return
    const { error } = await supabase.from('vendors').insert([{
      couple_id: couple.id, vendor_name: form.vendor_name.trim(), category: form.category,
      contact_name: form.contact_name.trim() || null, phone: form.phone.trim() || null, cost: parseFloat(form.cost) || 0, status: 'contacted',
    }])
    if (!error) { setForm({ vendor_name: '', category: 'photography', contact_name: '', phone: '', cost: '' }); setShowForm(false); load() }
  }
  const setStatus = async (id: string, status: Vendor['status']) => {
    const { error } = await supabase.from('vendors').update({ status }).eq('id', id)
    if (!error) setVendors(prev => prev.map(v => v.id === id ? { ...v, status } : v))
  }
  const remove = async (id: string) => {
    const { error } = await supabase.from('vendors').delete().eq('id', id)
    if (!error) setVendors(prev => prev.filter(v => v.id !== id))
  }

  const statusMeta: Record<string, { label: string; bg: string; color: string }> = {
    contacted: { label: 'Contacted', bg: '#fef3c7', color: '#b45309' }, booked: { label: 'Booked', bg: '#dbeafe', color: '#1d4ed8' }, paid: { label: 'Paid', bg: '#dcfce7', color: '#16a34a' },
  }

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Vendor List</div>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Photographers, caterers, decorators, and everyone else helping bring your day together.</div>

      {showForm ? (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <input value={form.vendor_name} onChange={e => setForm({ ...form, vendor_name: e.target.value })} placeholder="Vendor name" style={inputStyle} />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>
              <option value="photography">Photography</option><option value="catering">Catering</option><option value="decor">Decor</option>
              <option value="music">Music/DJ</option><option value="transport">Transport</option><option value="attire">Attire</option><option value="other">Other</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} placeholder="Contact name (optional)" style={inputStyle} />
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone (optional)" style={inputStyle} />
          </div>
          <input value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value.replace(/[^\d.]/g, '') })} placeholder="Cost (LKR)" style={{ ...inputStyle, marginBottom: 14 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={add} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', background: PINK, color: '#fff', fontWeight: 700, fontSize: 13 }}>Add Vendor</button>
            <button onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#64748b' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: 13, borderRadius: 12, border: `1.5px dashed ${PINK}`, cursor: 'pointer', background: `${PINK}0d`, color: PINK, fontWeight: 700, fontSize: 13, marginBottom: 16 }}>
          <Icon name="plus" size={14} color={PINK} /> Add Vendor
        </button>
      )}

      {loading ? <div style={{ color: '#94a3b8', fontSize: 13 }}>Loading...</div> : vendors.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: 30, color: '#94a3b8', fontSize: 13 }}>No vendors added yet.</div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {vendors.map(v => {
            const sm = statusMeta[v.status] || statusMeta.contacted
            return (
              <div key={v.id} style={{ ...cardStyle, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{v.vendor_name}</div>
                    <div style={{ fontSize: 11.5, color: '#94a3b8' }}>{v.category}{v.contact_name ? ` · ${v.contact_name}` : ''}{v.phone ? ` · ${v.phone}` : ''}</div>
                  </div>
                  <button onClick={() => remove(v.id)} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="trash" size={12} color="#dc2626" /></button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 12.5, color: '#64748b' }}>LKR {(v.cost || 0).toLocaleString()}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(['contacted', 'booked', 'paid'] as const).map(s => (
                      <button key={s} onClick={() => setStatus(v.id, s)} style={{ padding: '4px 10px', borderRadius: 100, fontSize: 10.5, fontWeight: 700, cursor: 'pointer', border: v.status === s ? 'none' : '1px solid #e2e8f0', background: v.status === s ? statusMeta[s].bg : '#fff', color: v.status === s ? statusMeta[s].color : '#94a3b8' }}>{statusMeta[s].label}</button>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════ LIQUOR PLANNER ══════════════════════════════
function LiquorSection({ couple }: { couple: MyCouple }) {
  const [items, setItems] = useState<LiquorItem[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ item_name: '', category: 'hard-liquor', quantity: '', unit: 'bottles', cost_per_unit: '' })

  const load = async () => {
    const { data } = await supabase.from('liquor_items').select('*').eq('couple_id', couple.id).order('created_at', { ascending: true })
    if (data) setItems(data as LiquorItem[])
    setLoading(false)
  }
  useEffect(() => { load() }, [couple.id])

  const add = async () => {
    if (!form.item_name.trim()) return
    const { error } = await supabase.from('liquor_items').insert([{
      couple_id: couple.id, item_name: form.item_name.trim(), category: form.category,
      quantity: parseFloat(form.quantity) || 0, unit: form.unit, cost_per_unit: parseFloat(form.cost_per_unit) || 0,
    }])
    if (!error) { setForm({ item_name: '', category: 'hard-liquor', quantity: '', unit: 'bottles', cost_per_unit: '' }); load() }
  }
  const remove = async (id: string) => {
    const { error } = await supabase.from('liquor_items').delete().eq('id', id)
    if (!error) setItems(prev => prev.filter(i => i.id !== id))
  }

  const totalCost = items.reduce((s, i) => s + (i.quantity || 0) * (i.cost_per_unit || 0), 0)

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Liquor Planner</div>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Plan quantities and estimated cost for drinks at the reception.</div>

      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>ESTIMATED TOTAL COST</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>LKR {totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
      </div>

      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 10 }}>
          <input value={form.item_name} onChange={e => setForm({ ...form, item_name: e.target.value })} placeholder="e.g. Red Label Whiskey" style={inputStyle} />
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>
            <option value="hard-liquor">Hard Liquor</option><option value="wine">Wine</option><option value="beer">Beer</option><option value="non-alcoholic">Non-Alcoholic</option>
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
          <input value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value.replace(/[^\d.]/g, '') })} placeholder="Quantity" style={inputStyle} />
          <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} style={inputStyle}>
            <option value="bottles">Bottles</option><option value="cases">Cases</option><option value="crates">Crates</option>
          </select>
          <input value={form.cost_per_unit} onChange={e => setForm({ ...form, cost_per_unit: e.target.value.replace(/[^\d.]/g, '') })} placeholder="Cost/unit (LKR)" style={inputStyle} />
        </div>
        <button onClick={add} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', background: PINK, color: '#fff', fontWeight: 700, fontSize: 13 }}>Add Item</button>
      </div>

      {loading ? <div style={{ color: '#94a3b8', fontSize: 13 }}>Loading...</div> : items.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: 30, color: '#94a3b8', fontSize: 13 }}>No items planned yet.</div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {items.map(item => (
            <div key={item.id} style={{ ...cardStyle, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{item.item_name}</div>
                <div style={{ fontSize: 11.5, color: '#94a3b8' }}>{item.quantity} {item.unit} × LKR {item.cost_per_unit.toLocaleString()} = LKR {(item.quantity * item.cost_per_unit).toLocaleString()}</div>
              </div>
              <button onClick={() => remove(item.id)} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="trash" size={12} color="#dc2626" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════ SUPPORT / MEMBERS / BILLING ══════════════════════════════
function SupportSection({ couple }: { couple: MyCouple }) {
  const waUrl = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(`Hi! I need help with my InviteGlow invitation.\n\nCouple: ${couple.bride} & ${couple.groom}\nLink: /invite/${couple.slug}`)}`
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Support</div>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Need help with your invitation? We're here.</div>
      <div style={{ ...cardStyle, textAlign: 'center', padding: 40 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <Icon name="whatsapp" size={22} color="#25d366" />
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Chat with us on WhatsApp</div>
        <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 18 }}>Fastest way to get help — we usually reply within a few hours.</div>
        <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', padding: '11px 22px', borderRadius: 100, background: '#25d366', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>Message Support</a>
      </div>
    </div>
  )
}

function ProfileSection({ userEmail, avatarUrl, displayName, onChanged }: { userEmail: string; avatarUrl: string; displayName: string; onChanged: () => void }) {
  const [name, setName] = useState(displayName)
  const [photo, setPhoto] = useState(avatarUrl)
  const [uploading, setUploading] = useState(false)
  const [savingName, setSavingName] = useState(false)
  const [nameMessage, setNameMessage] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadAvatar = async (file: File) => {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `profile/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, { cacheControl: '3600', upsert: false })
    if (!error) {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
      setPhoto(data.publicUrl)
      await supabase.auth.updateUser({ data: { avatar_url: data.publicUrl } })
      onChanged()
    }
    setUploading(false)
  }

  const saveName = async () => {
    setSavingName(true); setNameMessage('')
    const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } })
    setSavingName(false)
    setNameMessage(error ? 'Could not save: ' + error.message : 'Saved!')
    if (!error) onChanged()
  }

  const changePassword = async () => {
    setPasswordMessage('')
    if (newPassword.length < 6) { setPasswordMessage('Password must be at least 6 characters.'); return }
    if (newPassword !== confirmPassword) { setPasswordMessage("Passwords don't match — please re-enter."); return }
    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPassword(false)
    if (error) setPasswordMessage('Could not update password: ' + error.message)
    else { setPasswordMessage('Password updated!'); setNewPassword(''); setConfirmPassword('') }
  }

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>My Profile</div>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Your personal account details — separate from your invitation's details.</div>

      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Profile Picture</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {photo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={photo} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${PINK}` }} />
          ) : (
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg,${PINK},${RED})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22 }}>{userEmail[0]?.toUpperCase()}</div>
          )}
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 12.5, color: '#475569', fontWeight: 500 }}>
            {uploading ? 'Uploading...' : photo ? 'Change Photo' : 'Upload Photo'}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f) }} />
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Account Details</div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Email</label>
          <input value={userEmail} disabled style={{ ...inputStyle, background: '#f8fafc', color: '#94a3b8' }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Display Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Erandi Perera" style={inputStyle} />
        </div>
        {nameMessage && <div style={{ fontSize: 12, marginBottom: 10, color: nameMessage.startsWith('Saved') ? '#16a34a' : '#dc2626' }}>{nameMessage}</div>}
        <button onClick={saveName} disabled={savingName} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', background: PINK, color: '#fff', fontWeight: 700, fontSize: 13, opacity: savingName ? 0.6 : 1 }}>{savingName ? 'Saving...' : 'Save Name'}</button>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Change Password</div>
        <div style={{ fontSize: 11.5, color: '#94a3b8', marginBottom: 14 }}>Use this to update the password you sign in with.</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div><label style={labelStyle}>New Password</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="At least 6 characters" style={inputStyle} /></div>
          <div><label style={labelStyle}>Confirm New Password</label><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password" style={inputStyle} /></div>
        </div>
        {passwordMessage && <div style={{ fontSize: 12, marginBottom: 10, color: passwordMessage.startsWith('Password updated') ? '#16a34a' : '#dc2626' }}>{passwordMessage}</div>}
        <button onClick={changePassword} disabled={savingPassword || newPassword.length < 6} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', background: PINK, color: '#fff', fontWeight: 700, fontSize: 13, opacity: (savingPassword || newPassword.length < 6) ? 0.6 : 1 }}>{savingPassword ? 'Updating...' : 'Update Password'}</button>
      </div>
    </div>
  )
}

function MembersSection({ userEmail }: { userEmail: string }) {
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Members</div>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>People with access to this invitation account.</div>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg,${PINK},${RED})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{userEmail[0]?.toUpperCase()}</div>
          <div><div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{userEmail}</div><div style={{ fontSize: 11.5, color: '#94a3b8' }}>Owner</div></div>
        </div>
        <div style={{ marginTop: 14, padding: 14, background: '#f8fafc', borderRadius: 10, fontSize: 12.5, color: '#94a3b8' }}>
          Inviting additional members (e.g. a partner or wedding planner) with shared access is coming soon.
        </div>
      </div>
    </div>
  )
}

function BillingSection({ couple }: { couple: MyCouple }) {
  const isPaid = couple.payment_slip_status === 'verified'
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Upgrade Plan</div>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Manage your plan and payment status.</div>
      <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>CURRENT PLAN</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{isPaid ? 'Live Plan' : 'Free Plan'}</div>
          <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 4 }}>{isPaid ? 'Your invitation is live and shareable.' : 'Upload your payment slip to publish and share your invitation.'}</div>
        </div>
        {!isPaid && (
          <a href="#" style={{ padding: '11px 24px', borderRadius: 100, background: `linear-gradient(135deg,${PINK},${RED})`, color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>Upgrade Now</a>
        )}
      </div>
    </div>
  )
}
