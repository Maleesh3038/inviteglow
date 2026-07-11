"use client"
import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { supabase, Couple, CoupleColors } from '@/lib/supabase'

/**
 * BlushBlossomTemplate v5 — precisely matches the reference:
 * https://wedding-invitation-senu.vercel.app/
 *
 * Key structural rule (this is what earlier versions got wrong): most
 * sections float directly on the pale gradient background with NO card
 * wrapper — Invitation, Save the Date, Countdown, Music, Thank You and the
 * RSVP prompt are all plain centered text. The ONLY sections that get a
 * white/cream card are: the couple photo, and each Event Details block
 * (map card + a time/contact info card). Everything else stays minimal.
 *
 * Animation only plays once when a section scrolls into view — nothing
 * loops. No emoji — plain SVG icons only.
 */

const DEFAULT_COVER_BG = '/images/blush-blossom-cover-bg.png'

const DEFAULT_COLORS: Required<CoupleColors> = {
  primary: '#c1876d',
  primaryLight: '#f4e6d9',
  dark: '#6b4f36',
  cream: '#fdf6f2',
}

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

// Relative luminance (0 = black, 1 = white) — used to reject colors that
// are hex-valid but wrong for their role (e.g. a pale lilac saved as
// "dark" text color, which would make every dark-opacity text block
// nearly invisible instead of throwing a format error).
function luminance(hex: string): number {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map(ch => ch + ch).join('') : clean
  const r = parseInt(full.substring(0, 2), 16) / 255
  const g = parseInt(full.substring(2, 4), 16) / 255
  const b = parseInt(full.substring(4, 6), 16) / 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function sanitizeColors(input?: CoupleColors | null): Required<CoupleColors> {
  const safe = { ...DEFAULT_COLORS }
  if (!input) return safe
  ;(Object.keys(safe) as (keyof CoupleColors)[]).forEach(key => {
    const v = input[key]
    if (!v || !HEX_RE.test(v)) return
    const lum = luminance(v)
    // "dark" is used as body/heading text at various opacities — if it's
    // not actually dark, text becomes unreadable. "cream" is the page
    // background — if it's not actually light, the whole page inverts.
    if (key === 'dark' && lum > 0.45) return
    if (key === 'cream' && lum < 0.7) return
    if (key === 'primary' && lum > 0.85) return
    safe[key] = v
  })
  return safe
}

function getInitials(bride?: string, groom?: string) {
  const b = bride?.trim()?.[0]?.toUpperCase() ?? ''
  const g = groom?.trim()?.[0]?.toUpperCase() ?? ''
  return `${b}${g}` || ''
}

function useCountdown(target?: string) {
  const [left, setLeft] = useState({ d: 0, h: 0, m: 0, s: 0 })
  useEffect(() => {
    if (!target) return
    const targetMs = new Date(target).getTime()
    const tick = () => {
      const diff = Math.max(0, targetMs - Date.now())
      setLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target])
  return left
}

// Google Maps place URLs (like the ones you get from "Share" on a place)
// embed the exact coordinates in the URL itself — e.g. "!3d6.0040545!4d80.2566833"
// for the precise pin, or "@6.004,80.254,1131m" for the map view. Pulling
// these out gives a far more reliable embed than searching by venue text,
// which can mismatch or fail to geocode.
function extractLatLng(url?: string): { lat: number; lng: number } | null {
  if (!url) return null
  let m = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) }
  m = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) }
  return null
}

const EVENT_LABELS: Record<'engagement' | 'wedding' | 'homecoming', { title: string }> = {
  engagement: { title: 'Engagement' },
  wedding: { title: 'Event Details' },
  homecoming: { title: 'Homecoming' },
}

type IconName = 'calendar' | 'clock' | 'pin' | 'phone' | 'gift' | 'heart' | 'music' | 'chevronDown' | 'check' | 'cross' | 'photo' | 'ring' | 'play' | 'pause'
function Icon({ name, size = 16, color }: { name: IconName; size?: number; color: string }) {
  const c = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (name) {
    case 'calendar': return <svg {...c}><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M16 3v4M8 3v4M3.5 9.5h17" /></svg>
    case 'clock': return <svg {...c}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
    case 'pin': return <svg {...c}><path d="M12 21s6.5-6.9 6.5-11.5a6.5 6.5 0 10-13 0C5.5 14.1 12 21 12 21z" /><circle cx="12" cy="9.3" r="2.3" /></svg>
    case 'phone': return <svg {...c}><path d="M21 16.5v2.7a1.8 1.8 0 01-2 1.8 17.8 17.8 0 01-7.8-2.8 17.5 17.5 0 01-5.4-5.4A17.8 17.8 0 013 5a1.8 1.8 0 011.8-2h2.7a1.8 1.8 0 011.8 1.6c.1.8.3 1.6.6 2.3a1.8 1.8 0 01-.4 1.9L8.4 9.9a14.4 14.4 0 005.7 5.7l1.1-1.1a1.8 1.8 0 011.9-.4c.7.3 1.5.5 2.3.6.9.1 1.6.9 1.6 1.8z" /></svg>
    case 'gift': return <svg {...c}><rect x="3.5" y="8.5" width="17" height="12" rx="1" /><path d="M12 8.5v12M3.5 12.5h17" /><path d="M7.8 8.5a2.3 2.3 0 010-4.6c2.3 0 4.2 4.6 4.2 4.6s1.9-4.6 4.2-4.6a2.3 2.3 0 010 4.6" /></svg>
    case 'heart': return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 20.5s-7-4.4-9.4-8.8C.8 8.1 2.4 4.5 6 4.5c2 0 3.4 1.2 4.2 2.3.8-1.1 2.2-2.3 4.2-2.3 3.6 0 5.2 3.6 3.4 7.2C19 16.1 12 20.5 12 20.5z" /></svg>
    case 'music': return <svg {...c}><path d="M9.5 18V5.3l11-2v12.7" /><circle cx="6.5" cy="18" r="2.8" /><circle cx="17.5" cy="16" r="2.8" /></svg>
    case 'chevronDown': return <svg {...c}><path d="M5.5 8.5L12 15l6.5-6.5" /></svg>
    case 'check': return <svg {...c}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
    case 'cross': return <svg {...c}><path d="M6 6l12 12M18 6L6 18" /></svg>
    case 'photo': return <svg {...c}><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><circle cx="9" cy="10" r="1.8" /><path d="M20.5 16l-4.7-4.7a2 2 0 00-2.8 0L5 19" /></svg>
    case 'ring': return <svg {...c}><circle cx="12" cy="14.5" r="6.5" /><path d="M9 8l3-5 3 5" /><path d="M9 8h6l-1.3 3H10.3z" fill={color} stroke="none" /></svg>
    case 'play': return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8 5v14l11-7z" /></svg>
    case 'pause': return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
    default: return null
  }
}

function Blossom({ size = 14, color }: { size?: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <g fill={color}>
        <ellipse cx="12" cy="6" rx="3.2" ry="4.6" />
        <ellipse cx="12" cy="18" rx="3.2" ry="4.6" />
        <ellipse cx="6" cy="12" rx="4.6" ry="3.2" />
        <ellipse cx="18" cy="12" rx="4.6" ry="3.2" />
      </g>
      <circle cx="12" cy="12" r="2.4" fill="#fff" opacity={0.8} />
    </svg>
  )
}

function Vine({ color, flip = false }: { color: string; flip?: boolean }) {
  return (
    <svg width="40" height="80" viewBox="0 0 46 90" fill="none" style={{ transform: flip ? 'scaleX(-1)' : undefined }}>
      <path d="M4 4C20 20 8 40 24 50C10 58 20 76 4 86" stroke={color} strokeWidth="1.2" fill="none" opacity={0.6} />
      {[14, 30, 50, 66].map((y, i) => (
        <ellipse key={i} cx={i % 2 === 0 ? 12 : 30} cy={y} rx="6" ry="3" fill={color} opacity={0.5}
          transform={`rotate(${i % 2 === 0 ? -30 : 30} ${i % 2 === 0 ? 12 : 30} ${y})`} />
      ))}
    </svg>
  )
}

function Medallion({ initials, color, size = 190 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
      <Vine color={color} />
      <div style={{
        width: size, height: size, borderRadius: '50%', border: `1px solid ${color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0,
      }}>
        <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', border: `1px dashed ${color}`, opacity: 0.5 }} />
        <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: size * 0.32, color, letterSpacing: 1 }}>{initials}</span>
      </div>
      <Vine color={color} flip />
    </div>
  )
}

// Gentle falling petals across the whole site. Pure CSS keyframes (not
// framer-motion/JS state), so this costs nothing on re-render and never
// interferes with the countdown-isolation fix — it just runs on its own.
function FallingPetals({ color }: { color: string }) {
  const petals = [
    { left: '4%', size: 11, delay: 0, dur: 13 },
    { left: '16%', size: 8, delay: 3.2, dur: 16 },
    { left: '30%', size: 13, delay: 6.5, dur: 12 },
    { left: '46%', size: 9, delay: 1.5, dur: 15 },
    { left: '60%', size: 12, delay: 5, dur: 14 },
    { left: '74%', size: 8, delay: 2.2, dur: 17 },
    { left: '86%', size: 12, delay: 8, dur: 13 },
    { left: '94%', size: 9, delay: 4.5, dur: 15 },
  ]
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 60, overflow: 'hidden' }}>
      {petals.map((p, i) => (
        <span key={i} className="bb-petal" style={{ left: p.left, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s` }}>
          <Blossom size={p.size} color={color} />
        </span>
      ))}
    </div>
  )
}

// Isolated so its per-second tick only re-renders this small subtree —
// not the whole page (which was previously causing the map iframe and
// everything else to visibly flicker/reload every second).
function pickTimelineIcon(eventName: string): IconName {
  const n = eventName.toLowerCase()
  if (n.includes('ceremony') || n.includes('poruwa') || n.includes('vow') || n.includes('bless')) return 'ring'
  if (n.includes('lunch') || n.includes('dinner') || n.includes('meal') || n.includes('reception')) return 'gift'
  if (n.includes('danc') || n.includes('music') || n.includes('party') || n.includes('floor')) return 'music'
  if (n.includes('away') || n.includes('depart') || n.includes('leav')) return 'pin'
  if (n.includes('photo')) return 'photo'
  return 'heart'
}

// Custom player UI wrapping a shared <audio> ref — replaces the plain
// native browser controls with something that matches the theme.
function MusicPlayer({ audioRef, title, artist, primary, primaryLight, dark }: {
  audioRef: React.RefObject<HTMLAudioElement | null>
  title?: string; artist?: string; primary: string; primaryLight: string; dark: string
}) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onTime = () => { if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100) }
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('timeupdate', onTime)
    setPlaying(!audio.paused)
    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('timeupdate', onTime)
    }
  }, [audioRef])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) audio.play().catch(() => {})
    else audio.pause()
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, background: '#fff', borderRadius: 16,
      padding: '14px 18px', boxShadow: `0 4px 18px ${dark}14`, textAlign: 'left',
    }}>
      <button onClick={toggle} aria-label={playing ? 'Pause' : 'Play'} style={{
        width: 44, height: 44, borderRadius: '50%', background: primary, border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon name={playing ? 'pause' : 'play'} size={17} color="#fff" />
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && <div style={{ fontSize: 13, fontWeight: 700, color: dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>}
        {artist && <div style={{ fontSize: 11, color: dark, opacity: 0.55, marginTop: 1 }}>{artist}</div>}
        <div style={{ height: 3, background: primaryLight, borderRadius: 100, marginTop: 7, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: primary, borderRadius: 100, transition: 'width 0.2s linear' }} />
        </div>
      </div>
    </div>
  )
}

function CountdownDisplay({ targetDate, dark, primary, primaryLight }: { targetDate?: string; dark: string; primary: string; primaryLight: string }) {
  const countdown = useCountdown(targetDate)
  const items: [string, number][] = [['DAYS', countdown.d], ['HOURS', countdown.h], ['MINUTES', countdown.m], ['SECONDS', countdown.s]]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {items.map(([label, value], i) => (
        <div key={label} style={{
          padding: '18px 20px', textAlign: i % 2 === 0 ? 'left' : 'right',
          borderRight: i % 2 === 0 ? `1px solid ${primary}55` : 'none',
          borderBottom: i < 2 ? `1px solid ${primary}30` : 'none',
        }}>
          <div className="bb-num" style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '2.6rem', fontWeight: 800, color: dark, lineHeight: 1 }}>
            {String(value).padStart(2, '0')}
          </div>
          <div style={{ fontSize: 10.5, letterSpacing: '0.15em', color: dark, opacity: 0.6, fontWeight: 700, marginTop: 6 }}>{label}</div>
        </div>
      ))}
    </div>
  )
}

export default function BlushBlossomTemplate({ couple }: { couple: Couple }) {
  const [opened, setOpened] = useState(false)
  const [flapOpen, setFlapOpen] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const handleOpenClick = () => {
    setFlapOpen(true)
    setTimeout(() => setOpened(true), 550)
  }
  // The <audio> element only mounts once `opened` is true, so we wait for
  // that render (a same-tick .play() call would hit a still-null ref).
  useEffect(() => {
    if (!opened) return
    const id = setTimeout(() => { audioRef.current?.play().catch(() => {}) }, 60)
    return () => clearTimeout(id)
  }, [opened])
  const [showRsvpForm, setShowRsvpForm] = useState(false)
  const searchParams = useSearchParams()
  const guestName = searchParams?.get('name') || ''

  const colors = sanitizeColors(couple.custom_colors)
  const initials = getInitials(couple.bride, couple.groom)
  const badgeText = (couple as any).cover_badge_text || 'WEDDING INVITATION'
  const familyInvitationText = (couple as any).family_invitation_text
  const togetherWithText = (couple as any).together_with_text || 'together with'
  const thankYouText = (couple as any).thank_you_text
  const brideFamily = couple.bride_family
  const groomFamily = couple.groom_family
  const bridePhone = (couple as any).bride_phone
  const groomPhone = (couple as any).groom_phone
  const section = couple.section_visibility || {}

  const enabledEvents = useMemo(() => {
    const ev = (couple as any).events as Record<'engagement' | 'wedding' | 'homecoming', {
      enabled: boolean; venue: string; venue_address: string; date: string; maps_url: string
    }> | undefined
    if (!ev) return []
    return (['engagement', 'wedding', 'homecoming'] as const)
      .filter(k => ev[k]?.enabled)
      .map(k => ({ key: k, ...ev[k], ...EVENT_LABELS[k] }))
  }, [couple])

  const [guestNameInput, setGuestNameInput] = useState(guestName)
  const [response, setResponse] = useState<'yes' | 'no' | null>(null)
  const [guestCount, setGuestCount] = useState(1)
  const [drinking, setDrinking] = useState<'yes' | 'no' | ''>('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [rsvpMessage, setRsvpMessage] = useState('')

  const scrollToId = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  const submitRsvp = async () => {
    if (!guestNameInput.trim() || !response) {
      setRsvpMessage('Please add your name and select attending or not.')
      return
    }
    setSubmitting(true)
    setRsvpMessage('')
    const { error } = await supabase.from('rsvps').insert([{
      couple_id: couple.id,
      guest_name: guestNameInput.trim(),
      response,
      guest_count: response === 'yes' ? guestCount : 1,
      drinking: couple.ask_drinking && response === 'yes' ? drinking || null : null,
    }])
    setSubmitting(false)
    if (error) setRsvpMessage('Something went wrong — please try again.')
    else setSubmitted(true)
  }

  // ── style tokens ──
  const wrap: React.CSSProperties = { maxWidth: 420, margin: '0 auto', padding: '0 24px' }
  const capsHeading: React.CSSProperties = {
    fontSize: 15, fontWeight: 700, letterSpacing: '0.14em', color: colors.dark, textAlign: 'center',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textTransform: 'uppercase',
  }
  const divider = <div style={{ width: 1, height: 24, background: colors.primary, opacity: 0.4, margin: '10px auto' }} />
  const eyebrow: React.CSSProperties = {
    fontSize: 10.5, letterSpacing: '0.24em', textTransform: 'uppercase', textAlign: 'center',
    color: colors.primary, fontWeight: 700,
  }
  const cardStyle: React.CSSProperties = {
    background: '#fff', borderRadius: 16, boxShadow: `0 4px 18px ${colors.dark}12`,
  }
  const iconBadge: React.CSSProperties = {
    width: 34, height: 34, borderRadius: '50%', background: colors.primaryLight,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }
  const Reveal = ({ id, mt = 56, wide = false, children }: { id?: string; mt?: number; wide?: boolean; children: React.ReactNode }) => (
    <div id={id} className={wide ? 'bb-wrap-wide' : undefined}
      style={{ ...(wide ? {} : wrap), marginTop: mt, textAlign: 'center', position: 'relative', zIndex: 1 }}>
      {children}
    </div>
  )

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", minHeight: '100vh', background: `linear-gradient(180deg, ${colors.cream} 0%, #fdeee6 55%, #fce0d2 100%)`, position: 'relative', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Garamond:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
        html, body { background: ${colors.cream} !important; margin: 0; overflow-x: hidden; }
        .bb-petal {
          position: absolute; top: -20px; opacity: 0; display: block;
          animation-name: bb-fall; animation-timing-function: linear; animation-iteration-count: infinite;
        }
        @keyframes bb-fall {
          0% { transform: translateY(-20px) translateX(0) rotate(0deg); opacity: 0; }
          8% { opacity: 0.55; }
          92% { opacity: 0.45; }
          100% { transform: translateY(110vh) translateX(34px) rotate(260deg); opacity: 0; }
        }
        .bb-cover-bg { background-size: cover; }
        @media (min-aspect-ratio: 3/4) {
          .bb-cover-bg { background-size: auto 100%; }
        }
        .bb-num { font-variant-numeric: tabular-nums lining-nums; }
        .bb-wrap-wide { max-width: 420px; margin: 0 auto; padding: 0 24px; box-sizing: border-box; width: 100%; }
        @media (min-width: 640px) {
          .bb-wrap-wide { max-width: 760px; }
        }
        .bb-event-row { display: flex; flex-direction: column; min-width: 0; }
        @media (min-width: 640px) {
          .bb-event-row { flex-direction: row; align-items: flex-start; gap: 16px; }
          .bb-event-row > div { flex: 1 1 0; min-width: 0; margin-bottom: 0 !important; }
        }
      `}</style>

      <FallingPetals color={colors.primary} />

      {/* ───────── ENVELOPE COVER ───────── */}
      <AnimatePresence>
        {!opened && (
          <motion.div key="cover" className="bb-cover-bg"
            exit={{ opacity: 0, transition: { duration: 0.5, delay: 0.15 } }}
            style={{
              position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundImage: `url(${(couple as any).cover_background_image || DEFAULT_COVER_BG})`,
              backgroundColor: colors.dark,
              backgroundPosition: 'center',
            }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(90,50,110,0.16) 0%, rgba(0,0,0,0.08) 50%, rgba(90,50,110,0.2) 100%)' }} />
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1, scale: flapOpen ? 0.93 : 1 }}
              transition={{ y: { duration: 0.6, ease: 'easeOut' }, opacity: { duration: 0.6, ease: 'easeOut' }, scale: { duration: 0.5, delay: 0.35, ease: 'easeIn' } }}
              style={{ position: 'relative', zIndex: 1, width: '86%', maxWidth: 300, perspective: 900 }}>

              {/* White card body — glass-like finish with corner flourishes for more detail */}
              <div style={{ borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', position: 'relative', background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(6px)', border: `1px solid ${colors.primaryLight}` }}>
                <div style={{ position: 'absolute', top: 66, left: 10, opacity: 0.5, pointerEvents: 'none' }}><Blossom size={16} color={colors.primaryLight} /></div>
                <div style={{ position: 'absolute', top: 66, right: 10, opacity: 0.5, pointerEvents: 'none' }}><Blossom size={16} color={colors.primaryLight} /></div>
                <div style={{ position: 'absolute', bottom: 10, left: 14, opacity: 0.4, pointerEvents: 'none' }}><Blossom size={13} color={colors.primaryLight} /></div>
                <div style={{ position: 'absolute', bottom: 10, right: 14, opacity: 0.4, pointerEvents: 'none' }}><Blossom size={13} color={colors.primaryLight} /></div>
                <div style={{ height: 58 }} />
                <div style={{ padding: '36px 26px 32px', textAlign: 'center', position: 'relative' }}>
                  <div style={{ width: 58, height: 58, borderRadius: '50%', border: `1px solid ${colors.primary}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                    <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, letterSpacing: 2, color: colors.dark }}>{initials}</span>
                  </div>
                  <div style={{ fontSize: 11, letterSpacing: '0.28em', fontWeight: 700, color: colors.primary, marginBottom: 8 }}>{badgeText}</div>
                  <div style={{ fontSize: 12, color: colors.primary, opacity: 0.5, marginBottom: 22 }}>~ &#42; ~</div>
                  <motion.button
                    onClick={handleOpenClick}
                    aria-label="Open invitation"
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.92 }}
                    disabled={flapOpen}
                    style={{
                      position: 'relative', width: 68, height: 62, background: 'transparent', border: 'none', cursor: flapOpen ? 'default' : 'pointer',
                      margin: '0 auto', display: 'block',
                    }}>
                    <svg width="68" height="62" viewBox="0 0 100 90" style={{ position: 'absolute', inset: 0 }}>
                      <path
                        d="M50 88 C 20 66, 0 46, 0 26 C 0 8, 16 -2, 32 6 C 42 11, 48 19, 50 27 C 52 19, 58 11, 68 6 C 84 -2, 100 8, 100 26 C 100 46, 80 66, 50 88 Z"
                        fill={colors.primary}
                      />
                    </svg>
                    <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', paddingTop: 6, color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' }}>OPEN</span>
                  </motion.button>
                </div>
              </div>

              {/* Flap — positioned on top, outside any clipped container, so its
                  3D open animation is never cut off */}
              <motion.div
                animate={{ rotateX: flapOpen ? -160 : 0 }}
                transition={{ duration: 0.55, ease: [0.45, 0, 0.55, 1] }}
                style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 58, zIndex: 2,
                  background: `linear-gradient(135deg,${colors.primaryLight},${colors.primary},#8c6aa8)`,
                  clipPath: 'polygon(0 0, 50% 100%, 100% 0)', transformOrigin: 'top center', transformStyle: 'preserve-3d',
                  borderTopLeftRadius: 14, borderTopRightRadius: 14,
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ───────── MAIN CONTENT ───────── */}
      {opened && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} style={{ paddingTop: 44, paddingBottom: 70, position: 'relative' }}>

          {/* Heading */}
          <div style={{ ...wrap, textAlign: 'center' }}>
            <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.7rem', fontWeight: 700, color: colors.dark, marginBottom: 6 }}>
              {(couple as any).invitation_heading || 'Together with Love'}
            </h1>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: colors.primary, margin: '0 auto 10px' }} />
            <p style={{ fontSize: 12.5, color: colors.dark, opacity: 0.6 }}>
              {(couple as any).invitation_subheading || 'Together with love, joy and blessings'}
            </p>
            {guestName && <p style={{ fontSize: 12, color: colors.primary, fontStyle: 'italic', marginTop: 8 }}>Dear {guestName},</p>}
          </div>

          {/* Couple photo card */}
          <div style={{ ...wrap, marginTop: 22 }}>
            <div style={{ ...cardStyle, overflow: 'hidden' }}>
              {couple.couple_photo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={couple.couple_photo} alt={`${couple.bride} & ${couple.groom}`} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', aspectRatio: '3/4', background: colors.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="photo" size={38} color={colors.primary} />
                </div>
              )}
              <div style={{ background: '#fff', padding: '15px 12px 13px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: '1.9rem', color: colors.dark, lineHeight: 1.1 }}>
                  {couple.bride} &amp; {couple.groom}
                </div>
                <div style={{ fontSize: 10, letterSpacing: '0.22em', fontWeight: 700, color: colors.dark, opacity: 0.6, marginTop: 5 }}>{badgeText}</div>
              </div>
            </div>
            <button onClick={() => scrollToId('invitation')} aria-label="Scroll down" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '14px auto 0', width: 30, height: 30, borderRadius: '50%',
              background: colors.dark, border: 'none', cursor: 'pointer',
            }}>
              <Icon name="chevronDown" size={14} color="#fff" />
            </button>
          </div>

          {/* Invitation — no card, floats on the page */}
          <Reveal id="invitation">
            <div style={capsHeading}>Invitation</div>
            {divider}
            {(brideFamily || groomFamily) && (
              <p style={{ fontSize: 12.5, color: colors.dark, opacity: 0.9, marginBottom: 8, fontWeight: 600 }}>
                {groomFamily} {togetherWithText} {brideFamily}
              </p>
            )}
            <div style={{ ...eyebrow, marginBottom: 10 }}>A Loving Invitation From Our Family</div>
            <p style={{ fontSize: 13.5, color: colors.dark, opacity: 0.7, lineHeight: 1.9 }}>
              {familyInvitationText || 'We warmly invite you to join us as we celebrate the beautiful beginning of our lifelong bond.'}
            </p>
          </Reveal>

          {/* Events — the ONLY sections with cards, besides the couple photo */}
          {enabledEvents.map(ev => {
            const mapQuery = [ev.venue, ev.venue_address].filter(Boolean).join(', ')
            // Explicit lat/lng fields (if the admin form saved them, either
            // per-event or on the couple record) are the most reliable
            // source — they win over anything guessed from a pasted URL.
            const manualLat = parseFloat((ev as any).venue_latitude ?? (couple as any).venue_latitude)
            const manualLng = parseFloat((ev as any).venue_longitude ?? (couple as any).venue_longitude)
            const manualCoords = !isNaN(manualLat) && !isNaN(manualLng) ? { lat: manualLat, lng: manualLng } : null
            const coords = manualCoords || extractLatLng(ev.maps_url)
            // maps.google.com (not www.google.com/maps) is the classic
            // no-API-key embeddable endpoint. Coordinates (when we can pull
            // them from the pasted link) geocode far more reliably than
            // searching by venue text.
            const mapsEmbed = coords
              ? `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=16&output=embed`
              : mapQuery ? `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed` : undefined
            const mapsLinkHref = ev.maps_url || (mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}` : undefined)
            return (
              <Reveal key={ev.key} wide>
                <div style={capsHeading}><Icon name="heart" size={12} color={colors.primary} />{ev.title}</div>
                <p style={{ fontSize: 11.5, color: colors.dark, opacity: 0.55, margin: '6px 0 18px' }}>Venue, Location and Time Details</p>

                <div className="bb-event-row">
                <div style={{ ...cardStyle, overflow: 'hidden', textAlign: 'left', marginBottom: 10 }}>
                  {mapsEmbed ? (
                    <div style={{ position: 'relative', background: colors.primaryLight }}>
                      <iframe
                        src={mapsEmbed}
                        style={{ width: '100%', height: 140, border: 0, display: 'block' }}
                        referrerPolicy="no-referrer-when-downgrade"
                        title={`${ev.venue || 'venue'}-map`}
                      />
                      {mapsLinkHref && (
                        <a href={mapsLinkHref} target="_blank" rel="noopener noreferrer" style={{
                          position: 'absolute', top: 8, left: 8, fontSize: 10, fontWeight: 700,
                          background: 'rgba(255,255,255,0.95)', padding: '5px 12px', borderRadius: 100,
                          color: colors.dark, textDecoration: 'none', boxShadow: `0 2px 8px ${colors.dark}22`,
                        }}>
                          Open in Maps ↗
                        </a>
                      )}
                    </div>
                  ) : (
                    <div style={{ height: 100, background: colors.primaryLight, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Icon name="pin" size={22} color={colors.primary} />
                      <span style={{ fontSize: 10.5, color: colors.dark, opacity: 0.55 }}>Location to be announced</span>
                    </div>
                  )}
                  <div style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: colors.dark }}>{ev.venue || 'Venue to be announced'}</div>
                    {ev.venue_address && <div style={{ fontSize: 11.5, color: colors.dark, opacity: 0.55, marginTop: 2 }}>{ev.venue_address}</div>}
                  </div>
                </div>

                <div style={{ ...cardStyle, padding: '16px 18px', textAlign: 'left' }}>
                  {[
                    { icon: 'calendar' as const, label: 'DATE', value: ev.date ? new Date(ev.date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'To be announced' },
                    { icon: 'clock' as const, label: 'TIME', value: (ev.date ? new Date(ev.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'To be announced') + ' Onwards' },
                    { icon: 'pin' as const, label: 'VENUE', value: ev.venue || 'Venue to be announced', sub: ev.venue_address },
                  ].map((row, i, arr) => (
                    <div key={row.label} style={{
                      display: 'flex', gap: 12, paddingBottom: 14, marginBottom: 14,
                      borderBottom: (i < arr.length - 1 || bridePhone || groomPhone) ? `1px solid ${colors.primaryLight}` : 'none',
                    }}>
                      <div style={iconBadge}><Icon name={row.icon} size={15} color={colors.primary} /></div>
                      <div>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: colors.primary, letterSpacing: '0.04em' }}>{row.label}</div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: colors.dark, marginTop: 2 }}>{row.value}</div>
                        {row.sub && <div style={{ fontSize: 11.5, color: colors.dark, opacity: 0.55, marginTop: 3, lineHeight: 1.5 }}>{row.sub}</div>}
                      </div>
                    </div>
                  ))}
                  {(bridePhone || groomPhone) && (
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={iconBadge}><Icon name="phone" size={15} color={colors.primary} /></div>
                      <div>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: colors.primary, letterSpacing: '0.04em' }}>CONTACT</div>
                        <div style={{ fontSize: 11.5, color: colors.dark, opacity: 0.55, marginTop: 2, marginBottom: 4 }}>
                          For inquiries, feel free to contact us at the below numbers.
                        </div>
                        {bridePhone && <a href={`tel:${bridePhone}`} style={{ display: 'block', fontSize: 12.5, color: colors.dark, textDecoration: 'none', fontWeight: 600 }}>{bridePhone} ({couple.bride})</a>}
                        {groomPhone && <a href={`tel:${groomPhone}`} style={{ display: 'block', fontSize: 12.5, color: colors.dark, textDecoration: 'none', fontWeight: 600 }}>{groomPhone} ({couple.groom})</a>}
                      </div>
                    </div>

                  )}
                </div>
                </div>
              </Reveal>
            )
          })}

          {/* Gallery — card, since it's an image grid */}
          {(section.gallery ?? true) && couple.gallery && couple.gallery.length > 0 && (
            <Reveal>
              <div style={capsHeading}>Our Moments</div>
              {divider}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                {couple.gallery.map((url, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img key={i} src={url} alt="" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 12 }} />
                ))}
              </div>
            </Reveal>
          )}

          {/* Timeline — big vertical timeline with connecting line + icon circles */}
          {(section.timeline ?? true) && couple.timeline && couple.timeline.length > 0 && (
            <Reveal>
              <div style={capsHeading}><Icon name="heart" size={12} color={colors.primary} />The Day's Events</div>
              {divider}
              <div style={{ position: 'relative', textAlign: 'left', marginTop: 20, paddingLeft: 10 }}>
                <div style={{ position: 'absolute', left: 41, top: 34, bottom: 34, width: 2, background: colors.primaryLight }} />
                {couple.timeline.map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 18, marginBottom: i < couple.timeline.length - 1 ? 30 : 0, position: 'relative' }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%', background: '#fff', border: `2px solid ${colors.primaryLight}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 14px ${colors.dark}12`,
                      position: 'relative', zIndex: 1,
                    }}>
                      <Icon name={pickTimelineIcon(t.event)} size={22} color={colors.primary} />
                    </div>
                    <div style={{ paddingTop: 10 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: colors.primary, letterSpacing: '0.01em' }}>{t.time}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginTop: 3 }}>{t.event}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          )}

          {/* Large monogram watermark — fixed to the viewport so it stays put
              while the page scrolls, rather than moving with the content */}
          <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
              width: 500, height: 500, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(139,106,168,0.10) 0%, transparent 70%)',
            }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', opacity: 0.08 }}>
              <Medallion initials={initials} color={colors.dark} size={560} />
            </div>
            {[
              { top: '18%', right: '6%', size: 9 },
              { top: '48%', right: '4%', size: 7 },
              { top: '76%', right: '7%', size: 6 },
            ].map((d, i) => (
              <div key={i} style={{ position: 'absolute', top: d.top, right: d.right, width: d.size, height: d.size, borderRadius: '50%', background: colors.primary, opacity: 0.35 }} />
            ))}
          </div>

          <div style={{ marginTop: 60 }}>

            {/* Countdown — big 2x2 grid */}
            {(section.countdown ?? true) && (
              <Reveal mt={80}>
                <div style={capsHeading}><Icon name="heart" size={12} color={colors.primary} />Just a Few More</div>
                {divider}
                <p style={{ fontSize: 13, color: colors.dark, opacity: 0.6, marginTop: 16, marginBottom: 20 }}>
                  We are counting the days until our beautiful celebration.
                </p>
                <CountdownDisplay targetDate={couple.wedding_date} dark={colors.dark} primary={colors.primary} primaryLight={colors.primaryLight} />
              </Reveal>
            )}

            {/* Music — no card wrapper, but the player itself has one */}
            {(section.music ?? true) && couple.song_url && (
              <Reveal>
                <div style={capsHeading}><Icon name="music" size={12} color={colors.primary} />Our Song</div>
                <div style={{ marginTop: 16 }}>
                  {couple.song_url.includes('youtube.com') || couple.song_url.includes('youtu.be') ? (
                    <div style={{ borderRadius: 14, overflow: 'hidden' }}>
                      <iframe width="100%" height="170"
                        src={`https://www.youtube.com/embed/${couple.song_url.split(/v=|youtu\.be\//)[1]?.split('&')[0]}?autoplay=1&mute=1&loop=1`}
                        title="song" allow="autoplay; encrypted-media" style={{ border: 0 }} />
                    </div>
                  ) : (
                    <>
                      <audio ref={audioRef} loop src={couple.song_url} style={{ display: 'none' }} />
                      <MusicPlayer
                        audioRef={audioRef}
                        title={couple.song_title}
                        artist={couple.song_artist}
                        primary={colors.primary}
                        primaryLight={colors.primaryLight}
                        dark={colors.dark}
                      />
                    </>
                  )}
                </div>
              </Reveal>
            )}

            {/* Thank you — no card */}
            {(section.thank_you ?? true) && (
              <Reveal>
                <div style={capsHeading}><Icon name="heart" size={12} color={colors.primary} />Thank You</div>
                {divider}
                <p style={{ fontSize: 13.5, color: colors.dark, opacity: 0.7, lineHeight: 1.9 }}>
                  {thankYouText || 'Thank you for being part of our journey. Your presence means the world to us.'}
                </p>
              </Reveal>
            )}

            {/* RSVP — no card for the prompt; a light card only appears once the form is revealed */}
            <Reveal id="rsvp-form">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, maxWidth: 220, margin: '0 auto 22px' }}>
                <div style={{ flex: 1, height: 1, background: colors.primary, opacity: 0.25 }} />
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: colors.primary }} />
                <div style={{ flex: 1, height: 1, background: colors.primary, opacity: 0.25 }} />
              </div>
              <div style={{ ...iconBadge, margin: '0 auto 16px' }}>
                <Icon name="gift" size={16} color={colors.primary} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, maxWidth: 220, margin: '0 auto 18px' }}>
                <div style={{ flex: 1, height: 1, background: colors.primary, opacity: 0.25 }} />
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: colors.primary }} />
                <div style={{ flex: 1, height: 1, background: colors.primary, opacity: 0.25 }} />
              </div>

              {submitted ? (
                <div>
                  <div style={{ fontSize: 13.5, color: colors.dark, fontWeight: 700 }}>Thank you!</div>
                  <div style={{ fontSize: 12.5, color: colors.dark, opacity: 0.6, marginTop: 4 }}>Your response has been recorded.</div>
                </div>
              ) : !showRsvpForm ? (
                <>
                  <p style={{ fontSize: 13, color: colors.dark, opacity: 0.75, marginBottom: 20, fontWeight: 600 }}>
                    Please confirm your attendance by clicking the button below.
                  </p>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => setShowRsvpForm(true)} style={{
                      padding: '13px 28px', borderRadius: 100, border: 'none', cursor: 'pointer',
                      background: colors.dark, color: '#fff', fontWeight: 700, fontSize: 13.5,
                    }}>Confirm Attendance</button>
                    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{
                      padding: '13px 22px', borderRadius: 100, border: `1px solid ${colors.dark}`,
                      background: 'transparent', color: colors.dark, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    }}>Back to Top Details</button>
                  </div>
                </>
              ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ ...cardStyle, padding: '20px 18px', textAlign: 'left' }}>
                  <input
                    value={guestNameInput} onChange={e => setGuestNameInput(e.target.value)}
                    placeholder="Your name"
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `1px solid ${colors.primaryLight}`, fontSize: 13.5, outline: 'none', marginBottom: 12, fontFamily: "'Inter',sans-serif", boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <button type="button" onClick={() => setResponse('yes')} style={{
                      flex: 1, padding: '11px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      background: response === 'yes' ? colors.primary : colors.primaryLight,
                      color: response === 'yes' ? '#fff' : colors.dark,
                    }}><Icon name="check" size={13} color={response === 'yes' ? '#fff' : colors.dark} />Accept</button>
                    <button type="button" onClick={() => setResponse('no')} style={{
                      flex: 1, padding: '11px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      background: response === 'no' ? colors.dark : colors.primaryLight,
                      color: response === 'no' ? '#fff' : colors.dark,
                    }}><Icon name="cross" size={13} color={response === 'no' ? '#fff' : colors.dark} />Decline</button>
                  </div>
                  {response === 'yes' && (
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 10.5, color: colors.dark, opacity: 0.6, display: 'block', marginBottom: 4, fontWeight: 600 }}>Number of guests</label>
                      <input type="number" min={1} max={10} value={guestCount}
                        onChange={e => setGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${colors.primaryLight}`, fontSize: 13.5, outline: 'none', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box' }} />
                    </div>
                  )}
                  {response === 'yes' && couple.ask_drinking && (
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 10.5, color: colors.dark, opacity: 0.6, display: 'block', marginBottom: 4, fontWeight: 600 }}>Will you be drinking alcohol?</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" onClick={() => setDrinking('yes')} style={{
                          flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                          background: drinking === 'yes' ? colors.primary : colors.primaryLight, color: drinking === 'yes' ? '#fff' : colors.dark,
                        }}>Yes</button>
                        <button type="button" onClick={() => setDrinking('no')} style={{
                          flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                          background: drinking === 'no' ? colors.primary : colors.primaryLight, color: drinking === 'no' ? '#fff' : colors.dark,
                        }}>No</button>
                      </div>
                    </div>
                  )}
                  {rsvpMessage && <div style={{ fontSize: 11.5, color: colors.primary, marginBottom: 10 }}>{rsvpMessage}</div>}
                  <button onClick={submitRsvp} disabled={submitting} style={{
                    width: '100%', padding: 13, borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: colors.dark, color: '#fff', fontWeight: 700, fontSize: 13.5, opacity: submitting ? 0.6 : 1,
                  }}>{submitting ? 'Submitting...' : 'Confirm Attendance'}</button>
                  <div style={{ textAlign: 'center', marginTop: 12 }}>
                    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{
                      padding: '9px 20px', borderRadius: 100, border: `1px solid ${colors.dark}`,
                      background: 'transparent', color: colors.dark, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                    }}>Back to Top Details</button>
                  </div>
                </motion.div>
              )}
            </Reveal>

            {/* Footer flourish — matches the reference's closing monogram section */}
            <div style={{ ...wrap, marginTop: 50, textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, maxWidth: 260, margin: '0 auto 18px' }}>
                <div style={{ flex: 1, height: 1, background: colors.primary, opacity: 0.25 }} />
              </div>
              <Icon name="ring" size={20} color={colors.primary} />
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontWeight: 700, fontSize: '1.3rem', color: colors.dark, marginTop: 10 }}>
                {couple.bride} &amp; {couple.groom}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 10 }}>
                <Icon name="heart" size={9} color={colors.primary} />
                <Icon name="heart" size={9} color={colors.primary} />
                <Icon name="heart" size={9} color={colors.primary} />
              </div>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: 13, color: colors.dark, opacity: 0.6, marginTop: 12 }}>
                May our love bloom eternal
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
