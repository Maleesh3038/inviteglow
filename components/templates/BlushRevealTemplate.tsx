"use client"
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, Couple, CoupleColors } from '@/lib/supabase'
import FooterSocial from '@/components/shared/FooterSocial'

/**
 * BlushRevealTemplate — a simple photo/video "tap to open" cover (no
 * envelope, no flap, no watch-the-video-then-it-auto-opens sequence — just
 * a full-bleed background, picked by the couple from the same
 * cover_video_url / couple_photo fields every other template already
 * uses, and a single "Open Invitation" button) in front of the Eternal
 * Bloom template's own interior structure: a blessing card, family names,
 * event detail cards with icon date/time/venue rows, a countdown band,
 * RSVP, timeline, guest wishes wall, seat finder, music player, gallery,
 * thank-you note, contact numbers and footer — reused here basically as
 * Eternal Bloom has them, just re-colored to this template's own
 * blush/terracotta palette.
 *
 * The couple's photo is deliberately NOT repeated anywhere in this
 * interior (Eternal Bloom's own big hero banner underneath its cover is
 * dropped) — it already appears once, on the cover, before "Open
 * Invitation" is tapped.
 */

const DEFAULT_COVER_BG = '/images/blush-blossom-cover-bg.png'
const DEFAULT_SONG_URL = '/audio/calm-wedding.mp3'
const DEFAULT_SONG_TITLE = 'Calm Wedding Theme'
const DEFAULT_SONG_ARTIST = 'InviteGlow'

const DEFAULT_COLORS: Required<CoupleColors> = {
  primary: '#c1876d',
  primaryLight: '#f4e6d9',
  dark: '#6b4f36',
  cream: '#fdf6f2',
}
// A muted, warm taupe for secondary text — independent of the couple's own
// color choices (the same approach Eternal Bloom uses for its muted tone).
const MUTED_TONE = '#a8927f'

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

// Relative luminance (0 = black, 1 = white) — used to reject colors that
// are hex-valid but wrong for their role (e.g. a pale color saved as
// "dark" text color, which would make dark-opacity text nearly invisible).
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
    if (key === 'dark' && lum > 0.45) return
    if (key === 'cream' && lum < 0.7) return
    if (key === 'primary' && lum > 0.85) return
    safe[key] = v
  })
  return safe
}

// ── Per-element text style overrides. Reads couple.text_styles (set from
// the "Customise Fonts" panel in the couple's dashboard) and merges a
// color/font/bold override on top of the template's own default styling. ──
type TextStyleEntry = { color?: string; font?: string; bold?: boolean }
function useTextStyles(couple: any) {
  const map: Record<string, TextStyleEntry> = couple?.text_styles || {}
  return (key: string, fallback: React.CSSProperties = {}): React.CSSProperties => {
    const s = map[key]
    if (!s) return fallback
    return {
      ...fallback,
      ...(s.color ? { color: s.color } : {}),
      ...(s.font && s.font !== 'inherit' ? { fontFamily: s.font } : {}),
      ...(s.bold ? { fontWeight: 700 } : {}),
    }
  }
}

// Combined bride+groom length decides the font size so the "Bride & Groom"
// line never overflows the screen width on mobile.
function combinedNameFontSize(bride: string, groom: string): string {
  const len = (bride || '').length + (groom || '').length
  if (len > 22) return "clamp(1.1rem,4.5vw,1.5rem)"
  if (len > 17) return "clamp(1.4rem,5.2vw,1.8rem)"
  if (len > 13) return "clamp(1.6rem,6vw,2.2rem)"
  if (len > 10) return "clamp(1.9rem,6.8vw,2.7rem)"
  return "clamp(2.2rem,7.5vw,3.1rem)"
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ── Floating bottom nav bar — a narrow pill with quick jumps to key
// sections, plus a raised music toggle on the right. ──
function BottomNavBar({ primary, dark, mapsUrl, hasWishes, hasGallery, audioRef }: {
  primary: string; dark: string; mapsUrl: string; hasWishes: boolean; hasGallery: boolean; audioRef: React.RefObject<HTMLAudioElement | null>
}) {
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    a.addEventListener('play', onPlay)
    a.addEventListener('pause', onPause)
    setPlaying(!a.paused)
    return () => { a.removeEventListener('play', onPlay); a.removeEventListener('pause', onPause) }
  }, [audioRef])

  const toggleMusic = () => {
    const a = audioRef.current
    if (!a) return
    a.paused ? a.play().catch(() => {}) : a.pause()
  }

  const iconBtn = (onClick: () => void, label: string, path: React.ReactElement, key: string) => (
    <button key={key} onClick={onClick} aria-label={label} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'transparent',
      border: 'none', cursor: 'pointer', color: dark, opacity: 0.8, padding: '2px 4px',
    }}>
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">{path}</svg>
      <span style={{ fontSize: 8, letterSpacing: '0.02em' }}>{label}</span>
    </button>
  )

  return (
    <div style={{
      position: 'fixed', bottom: 18, left: '50%', transform: 'translateX(-50%)',
      width: 'calc(100% - 40px)', maxWidth: 400, zIndex: 100,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-evenly',
        background: 'rgba(255,255,255,0.98)', borderRadius: 100, border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.18)', padding: '10px 18px', paddingRight: 56, position: 'relative',
      }}>
        {hasWishes && iconBtn(() => scrollToId('wishes'), 'Wishes', <path d="M12 20.5s-7.5-4.9-9.8-9.3C.6 8 2 4.7 5.2 4a4.6 4.6 0 016.8 2.3A4.6 4.6 0 0118.8 4C22 4.7 23.4 8 21.8 11.2 19.5 15.6 12 20.5 12 20.5z" />, 'wishes')}
        {iconBtn(() => scrollToId('savethedate'), 'Save Date', <><rect x="3.5" y="5" width="17" height="16" rx="2.5" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /></>, 'savedate')}
        {hasGallery && iconBtn(() => scrollToId('gallery'), 'Gallery', <><rect x="3" y="4" width="18" height="16" rx="2.5" /><circle cx="8.5" cy="9.5" r="1.5" /><path d="M21 16l-5.2-5.2a2 2 0 00-2.8 0L4 19" /></>, 'gallery')}
        {iconBtn(() => scrollToId('contact'), 'Contact', <><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M3.5 6.5L12 13l8.5-6.5" /></>, 'contact')}
        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: dark, opacity: 0.8,
            textDecoration: 'none', padding: '2px 4px',
          }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s7-7.5 7-12.5A7 7 0 105 9.5C5 14.5 12 22 12 22z" /><circle cx="12" cy="9.5" r="2.5" />
            </svg>
            <span style={{ fontSize: 8 }}>Location</span>
          </a>
        )}

        {/* Raised music toggle, floating on the right edge of the pill */}
        <button onClick={toggleMusic} aria-label={playing ? 'Pause music' : 'Play music'} style={{
          position: 'absolute', right: 4, top: -16,
          width: 46, height: 46, borderRadius: '50%', border: '3px solid #fff',
          background: `linear-gradient(135deg,${primary},#d9b199)`, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
        }}>
          {playing ? (
            <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" />
              <path d="M16.5 9a3.5 3.5 0 010 6M19 6.5a7 7 0 010 11" />
            </svg>
          ) : (
            <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" />
              <path d="M16.5 9l5 6M21.5 9l-5 6" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

// ── Contact Numbers — click-to-call and WhatsApp buttons. Reads the
// flexible `contacts` list first; if that's empty, falls back to the
// classic bride_phone/groom_phone fields. ──
function ContactRow({ name, phone, primary }: { name: string; phone: string; primary: string }) {
  const digitsOnly = phone.replace(/\D/g, '')
  const waNumber = digitsOnly.startsWith('0') ? `94${digitsOnly.slice(1)}` : digitsOnly
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: '#fff', border: `1px solid ${primary}22`, borderRadius: 14, padding: '12px 16px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
      <div style={{ minWidth: 0 }}>
        {name ? (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#6b4f36', fontFamily: "'Inter',sans-serif" }}>{name}</div>
            <div style={{ fontSize: 12, color: '#a8927f', marginTop: 2 }}>{phone}</div>
          </>
        ) : (
          <div style={{ fontSize: 13, fontWeight: 700, color: '#6b4f36', fontFamily: "'Inter',sans-serif" }}>{phone}</div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <a href={`tel:${digitsOnly}`} aria-label={name ? `Call ${name}` : `Call ${phone}`} style={{
          width: 36, height: 36, borderRadius: '50%', background: `${primary}1a`, color: primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
        }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill={primary}>
            <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01z" />
          </svg>
        </a>
        <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer" aria-label={name ? `WhatsApp ${name}` : `WhatsApp ${phone}`} style={{
          width: 36, height: 36, borderRadius: '50%', background: '#25d366', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
        }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="#fff">
            <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3M12 2a10 10 0 00-8.5 15.3L2 22l4.8-1.3A10 10 0 1012 2z" />
          </svg>
        </a>
      </div>
    </div>
  )
}

// ── A four-petal blossom, this template's recurring decorative motif. ──
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

// Gentle falling petals across the whole site. Pure CSS keyframes (not
// framer-motion/JS state), so this costs nothing on re-render.
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

// ── Guest intro screen ──
function GuestIntroScreen({ guestName, onDone, primary, primaryLight, dark, cream }: {
  guestName: string; onDone: () => void; primary: string; primaryLight: string; dark: string; cream: string
}) {
  return (
    <motion.div key="intro" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1, ease: "easeInOut" }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: `linear-gradient(160deg, ${cream} 0%, #f4e6d9 45%, ${cream} 100%)`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "2rem", overflow: "hidden",
      }}>
      <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${primaryLight}44, transparent)`, top: "22%", left: "50%", transform: "translateX(-50%)" }} />
      <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: [0.4, 1.1, 1], opacity: 1 }} transition={{ duration: 1.1, ease: "easeOut", delay: 0.2 }}
        style={{ position: "relative", zIndex: 1, marginBottom: "1.6rem" }}>
        <Blossom size={36} color={primary} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.9 }} style={{ position: "relative", zIndex: 1, marginBottom: "1rem" }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "clamp(1.9rem,6.5vw,2.7rem)", color: dark, lineHeight: 1.2 }}>
          Dear <span style={{ color: primary, fontWeight: 600 }}>{guestName}</span>,
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, letterSpacing: "0.1em" }} animate={{ opacity: 1, letterSpacing: "0.4em" }} transition={{ duration: 0.9, delay: 1.6 }}
        style={{ fontSize: 10, textTransform: "uppercase", color: `${primary}cc`, fontFamily: "'Inter',sans-serif" }}>
        You're Invited
      </motion.div>
      <motion.div style={{ position: "absolute", bottom: 0, left: 0, height: 3, background: `linear-gradient(to right,${primary},${primaryLight})`, borderRadius: 100 }}
        initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 5, ease: "linear", delay: 0.4 }} onAnimationComplete={onDone} />
      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ delay: 2 }} onClick={onDone}
        style={{ position: "absolute", bottom: 20, right: 20, background: "transparent", border: "none", cursor: "pointer", fontSize: 12, color: primary, fontFamily: "'Inter',sans-serif", letterSpacing: "0.1em" }}>
        Skip →
      </motion.button>
    </motion.div>
  )
}

// ── Countdown ──
function Countdown({ targetDate, dark, tint }: { targetDate?: string; dark: string; tint: string }) {
  const [t, setT] = useState({ d: "00", h: "00", m: "00", s: "00" })
  useEffect(() => {
    if (!targetDate) return
    const tick = () => {
      const diff = new Date(targetDate).getTime() - Date.now(); if (diff <= 0) return
      setT({
        d: String(Math.floor(diff / 86400000)).padStart(2, "0"), h: String(Math.floor(diff % 86400000 / 3600000)).padStart(2, "0"),
        m: String(Math.floor(diff % 3600000 / 60000)).padStart(2, "0"), s: String(Math.floor(diff % 60000 / 1000)).padStart(2, "0"),
      })
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [targetDate])
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 8, maxWidth: 340, margin: "0 auto" }}>
      {[["Days", t.d], ["Hours", t.h], ["Minutes", t.m], ["Seconds", t.s]].map(([l, v]) => (
        <div key={l} style={{ flex: 1, textAlign: "center", background: tint, borderRadius: "50% 50% 40% 40% / 60% 60% 40% 40%", padding: "12px 3px" }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.5rem", color: dark, fontWeight: 700, lineHeight: 1 }}>{v}</div>
          <div style={{ fontSize: 7.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "#a8927f", marginTop: 5 }}>{l}</div>
        </div>
      ))}
    </div>
  )
}

// ── Music Player ──
function MusicPlayerUI({ title, artist, audioRef, primary, primaryLight, dark, muted }: { title: string; artist: string; audioRef: React.RefObject<HTMLAudioElement | null>; primary: string; primaryLight: string; dark: string; muted: string }) {
  const [playing, setPlaying] = useState(false); const [prog, setProg] = useState(0)
  useEffect(() => {
    const a = audioRef.current; if (!a) return
    const onPlay = () => setPlaying(true), onPause = () => setPlaying(false), onTime = () => { if (a.duration) setProg((a.currentTime / a.duration) * 100) }
    a.addEventListener('play', onPlay); a.addEventListener('pause', onPause); a.addEventListener('timeupdate', onTime)
    setPlaying(!a.paused)
    return () => { a.removeEventListener('play', onPlay); a.removeEventListener('pause', onPause); a.removeEventListener('timeupdate', onTime) }
  }, [audioRef])
  const toggle = () => { const a = audioRef.current; if (!a) return; a.paused ? a.play().catch(() => {}) : a.pause() }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#fff", borderRadius: 16, padding: 16, border: `1px solid ${primaryLight}` }}>
      <div style={{ width: 46, height: 46, borderRadius: "50% 50% 40% 40% / 60% 60% 40% 40%", background: `linear-gradient(135deg,${primaryLight},${primary})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0, animation: playing ? "spin 4s linear infinite" : "none" }}>🎵</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: dark }}>{title}</div>
        <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{artist}</div>
        <div style={{ height: 3, background: `${primary}26`, borderRadius: 100, marginTop: 8 }}>
          <div style={{ height: "100%", width: `${prog}%`, background: `linear-gradient(to right,${primary},${primaryLight})`, borderRadius: 100, transition: "width 0.3s" }} />
        </div>
      </div>
      <button onClick={toggle} style={{ width: 40, height: 40, borderRadius: "50%", background: dark, border: "none", color: "#fff", cursor: "pointer", fontSize: 14, flexShrink: 0 }}>{playing ? "⏸" : "▶"}</button>
    </div>
  )
}

// ── RSVP ──
function RSVP({ coupleId, askDrinking, primary, dark, cream, muted, guestName }: { coupleId: string; askDrinking: boolean; primary: string; dark: string; cream: string; muted: string; guestName: string }) {
  const [name, setName] = useState(guestName || ""); const [guestCount, setGuestCount] = useState(1)
  const [step, setStep] = useState<"form" | "count" | "drinking" | "done">("form")
  const [finalResponse, setFinalResponse] = useState<"yes" | "no">("yes"); const [saving, setSaving] = useState(false)
  const save = async (response: "yes" | "no", drinking: "yes" | "no" | null, count: number) => {
    setSaving(true)
    const { error } = await supabase.from('rsvps').insert([{ couple_id: coupleId, guest_name: name.trim(), response, drinking, guest_count: count }])
    setSaving(false); if (!error) { setFinalResponse(response); setStep("done") }
  }
  const inputStyle: React.CSSProperties = { width: "100%", padding: "13px 16px", borderRadius: 10, border: `1px solid ${primary}33`, background: cream, color: dark, fontSize: 14, outline: "none", marginBottom: 12, fontFamily: "'Inter',sans-serif" }
  return (
    <div style={{ padding: "0 1.5rem 2.4rem", textAlign: "center" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
        <div style={{ width: 34, height: 1, background: primary, opacity: 0.4 }} />
        <Blossom size={18} color={primary} />
        <div style={{ width: 34, height: 1, background: primary, opacity: 0.4 }} />
      </div>
      <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: primary, margin: "16px 0 8px", fontWeight: 700 }}>Be Our Guest</div>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.8rem", color: dark, marginBottom: 24 }}>Will You Join Us?</div>
      <div style={{ background: "#fff", borderRadius: 20, padding: 24, maxWidth: 380, margin: "0 auto", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
        {step === "form" && (
          <>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" style={inputStyle} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={() => name.trim() && setStep("count")} style={{ padding: 13, borderRadius: 10, background: primary, color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✓ Accept</button>
              <button onClick={() => name.trim() && save("no", null, 1)} disabled={saving} style={{ padding: 13, borderRadius: 10, background: "transparent", color: muted, border: `1px solid ${primary}33`, cursor: "pointer", fontSize: 12, opacity: saving ? 0.6 : 1 }}>{saving ? "..." : "✗ Decline"}</button>
            </div>
          </>
        )}
        {step === "count" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ fontSize: 13, color: dark, fontWeight: 600, marginBottom: 16 }}>How many people, including you?</div>
            <div style={{ position: "relative", marginBottom: 6 }}>
              <select value={guestCount} onChange={e => setGuestCount(Number(e.target.value))}
                style={{
                  width: "100%", textAlign: "center", textAlignLast: "center", fontFamily: "'Inter',sans-serif",
                  fontSize: "1.1rem", fontWeight: 700, color: dark, background: `${primary}0d`, border: `1px solid ${primary}33`,
                  borderRadius: 10, padding: "8px 0", outline: "none", cursor: "pointer",
                  WebkitAppearance: "none", MozAppearance: "none", appearance: "none",
                }}>
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <div style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: primary, fontSize: 13 }}>▾</div>
            </div>
            <div style={{ fontSize: 10, color: muted, letterSpacing: "0.08em", marginBottom: 16 }}>Swipe to choose</div>
            <button onClick={() => askDrinking ? setStep("drinking") : save("yes", null, guestCount)} disabled={saving} style={{ width: "100%", padding: 13, borderRadius: 10, background: primary, color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, opacity: saving ? 0.6 : 1 }}>{saving ? "..." : "Continue →"}</button>
          </motion.div>
        )}
        {step === "drinking" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ fontSize: 12, color: muted, marginBottom: 14 }}>Will you be having alcohol?</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={() => save("yes", "yes", guestCount)} disabled={saving} style={{ padding: 13, borderRadius: 10, background: `${primary}1a`, color: primary, border: `1px solid ${primary}44`, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>🍷 Yes</button>
              <button onClick={() => save("yes", "no", guestCount)} disabled={saving} style={{ padding: 13, borderRadius: 10, background: `${primary}1a`, color: primary, border: `1px solid ${primary}44`, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>🥤 No</button>
            </div>
          </motion.div>
        )}
        {step === "done" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{finalResponse === "yes" ? "🌸" : "🙏"}</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.3rem", color: primary, marginBottom: 4 }}>{finalResponse === "yes" ? `See you there, ${name}!` : `We'll miss you, ${name}.`}</div>
            <div style={{ fontSize: 12, color: muted }}>{finalResponse === "yes" ? (guestCount > 1 ? `Party of ${guestCount} confirmed!` : "We can't wait to celebrate with you.") : "Thank you for letting us know."}</div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

// ── Seat Finder ──
function SeatFinder({ seats, primary, dark, cream, muted }: { seats: Record<string, string>; primary: string; dark: string; cream: string; muted: string }) {
  const [q, setQ] = useState(""); const [res, setRes] = useState("")
  const search = () => {
    const query = q.trim().toLowerCase()
    if (!query) { setRes("Please enter your name."); return }
    const found = Object.keys(seats || {}).find(k => query.includes(k) || k.includes(query))
    setRes(found ? `You are seated at ${seats[found]}` : "Name not found. Please contact the couple.")
  }
  return (
    <div>
      <div style={{ display: "flex", gap: 10 }}>
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && search()} placeholder="Enter your name..." style={{ flex: 1, padding: "13px 16px", borderRadius: 10, border: `1px solid ${primary}33`, background: cream, color: dark, fontSize: 14, outline: "none", fontFamily: "'Inter',sans-serif" }} />
        <button onClick={search} style={{ padding: "13px 20px", borderRadius: 10, background: dark, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Search</button>
      </div>
      {res && <div style={{ marginTop: 12, fontSize: 14, color: res.startsWith("You") ? primary : muted, fontWeight: res.startsWith("You") ? 600 : 400 }}>{res}</div>}
    </div>
  )
}

// ── Guest Wishes Wall ──────────────────────────────────────────────
type WishMedia = { url: string; type: 'photo' | 'video' }
type Wish = {
  id: string; couple_id: string; guest_name: string; message: string
  photo_url: string | null; video_url: string | null; media: WishMedia[] | null; created_at: string
}

async function uploadWishMedia(file: File, coupleId: string): Promise<{ url: string; isVideo: boolean }> {
  const isVideo = file.type.startsWith('video/')
  const ext = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg')
  const path = `${coupleId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('wishes').upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from('wishes').getPublicUrl(path)
  return { url: data.publicUrl, isVideo }
}

function getWishMedia(w: Wish): WishMedia[] {
  if (w.media && w.media.length > 0) return w.media
  if (w.photo_url) return [{ url: w.photo_url, type: 'photo' }]
  if (w.video_url) return [{ url: w.video_url, type: 'video' }]
  return []
}

function WishLightbox({ media, index, onIndex, onClose }: { media: WishMedia[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const current = media[index]
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(30,20,15,0.92)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", maxWidth: "92vw", maxHeight: "86vh" }}>
        {current.type === 'video' ? (
          <video src={current.url} controls autoPlay style={{ maxWidth: "92vw", maxHeight: "86vh", display: "block", borderRadius: 10 }} />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={current.url} alt="" style={{ maxWidth: "92vw", maxHeight: "86vh", display: "block", borderRadius: 10, objectFit: "contain" }} />
        )}
        <button onClick={onClose} aria-label="Close" style={{ position: "absolute", top: -40, right: 0, background: "transparent", border: "none", color: "#fff", fontSize: 26, cursor: "pointer", lineHeight: 1 }}>×</button>
        {media.length > 1 && (
          <>
            <button onClick={() => onIndex((index - 1 + media.length) % media.length)} aria-label="Previous" style={{ position: "absolute", left: -18, top: "50%", transform: "translate(-100%,-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 20, cursor: "pointer" }}>‹</button>
            <button onClick={() => onIndex((index + 1) % media.length)} aria-label="Next" style={{ position: "absolute", right: -18, top: "50%", transform: "translate(100%,-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 20, cursor: "pointer" }}>›</button>
            <div style={{ position: "absolute", bottom: -30, left: "50%", transform: "translateX(-50%)", color: "#fff", fontSize: 12, opacity: 0.8 }}>{index + 1} / {media.length}</div>
          </>
        )}
      </div>
    </div>
  )
}

function WishMediaGrid({ media, onOpen }: { media: WishMedia[]; onOpen: (index: number) => void }) {
  if (media.length === 0) return null
  const shown = media.slice(0, 4)
  const isSingle = media.length === 1
  return (
    <div style={{ display: "grid", gridTemplateColumns: isSingle ? "1fr" : "repeat(2, 1fr)", gap: 4, marginBottom: 6, borderRadius: 10, overflow: "hidden" }}>
      {shown.map((m, idx) => {
        const isMoreTile = idx === 3 && media.length > 4
        return (
          <div key={idx} onClick={() => onOpen(idx)} style={{ position: "relative", cursor: "pointer", overflow: "hidden", height: isSingle ? 140 : undefined, aspectRatio: isSingle ? undefined : "1 / 1", background: "#000" }}>
            {isSingle && m.type === 'photo' && (
              <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${m.url})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(16px) brightness(0.7)", transform: "scale(1.15)" }} />
            )}
            {m.type === 'video' ? (
              <video src={m.url} muted style={{ position: isSingle ? "relative" : "static", zIndex: 1, width: "100%", height: "100%", objectFit: isSingle ? "contain" : "cover", display: "block" }} />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={m.url} alt="" style={{ position: isSingle ? "relative" : "static", zIndex: 1, width: "100%", height: "100%", objectFit: isSingle ? "contain" : "cover", display: "block" }} />
            )}
            {isMoreTile && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(30,20,15,0.55)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, fontWeight: 700, zIndex: 2 }}>+{media.length - 4}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function WishesWall({ coupleId, primary, primaryLight, dark, cream, muted }: { coupleId: string; primary: string; primaryLight: string; dark: string; cream: string; muted: string }) {
  const [wishes, setWishes] = useState<Wish[]>([])
  const [loading, setLoading] = useState(true)
  const [rsvpCounts, setRsvpCounts] = useState<{ yes: number; no: number }>({ yes: 0, no: 0 })
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [page, setPage] = useState(0)
  const PER_PAGE = 3
  const [lightbox, setLightbox] = useState<{ media: WishMedia[]; index: number } | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      const { data } = await supabase.from('wishes').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false })
      if (active && data) setWishes(data as Wish[])
      setLoading(false)
    }
    load()
    const channel = supabase.channel(`wishes-${coupleId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wishes', filter: `couple_id=eq.${coupleId}` }, () => load())
      .subscribe()
    return () => { active = false; supabase.removeChannel(channel) }
  }, [coupleId])

  useEffect(() => {
    let active = true
    const loadCounts = async () => {
      const { data } = await supabase.from('rsvps').select('response').eq('couple_id', coupleId)
      if (!active || !data) return
      const yes = data.filter((r: any) => r.response === 'yes').length
      const no = data.filter((r: any) => r.response === 'no').length
      setRsvpCounts({ yes, no })
    }
    loadCounts()
    return () => { active = false }
  }, [coupleId])

  const submit = async () => {
    if (!name.trim() || !message.trim()) { setError('Please add your name and a message.'); return }
    setSubmitting(true); setError('')
    try {
      const media: WishMedia[] = []
      for (const f of files) {
        const { url, isVideo } = await uploadWishMedia(f, coupleId)
        media.push({ url, type: isVideo ? 'video' : 'photo' })
      }
      const { error: insertError } = await supabase.from('wishes').insert([{ couple_id: coupleId, guest_name: name.trim(), message: message.trim(), media }])
      if (insertError) throw insertError
      setName(''); setMessage(''); setFiles([]); setDone(true)
    } catch { setError('Something went wrong — please try again.') } finally { setSubmitting(false) }
  }

  const underlineInput: React.CSSProperties = {
    width: '100%', padding: '10px 2px', border: 'none', borderBottom: `1.5px solid ${primaryLight}`,
    background: 'transparent', color: dark, fontSize: 13.5, outline: 'none', marginBottom: 16,
    boxSizing: 'border-box', fontFamily: "'Inter',sans-serif",
  }

  return (
    <div style={{ background: cream, borderRadius: 20, padding: '22px 18px', border: `1px solid ${primaryLight}` }}>
      <div style={{ textAlign: 'center', fontSize: 12, color: muted, marginBottom: 14 }}>
        {wishes.length} {wishes.length === 1 ? 'Comment' : 'Comments'}
      </div>
      {(rsvpCounts.yes > 0 || rsvpCounts.no > 0) && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ background: dark, color: '#fff', borderRadius: 12, padding: '10px 18px', textAlign: 'center', minWidth: 90 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{rsvpCounts.yes}</div>
            <div style={{ fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.8, marginTop: 2 }}>I'll Be There</div>
          </div>
          <div style={{ background: `${dark}bb`, color: '#fff', borderRadius: 12, padding: '10px 18px', textAlign: 'center', minWidth: 90 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{rsvpCounts.no}</div>
            <div style={{ fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.8, marginTop: 2 }}>Can't Come</div>
          </div>
        </div>
      )}

      {done ? (
        <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: dark }}>Thank you for your wish!</div>
          <div style={{ fontSize: 12, color: muted, marginTop: 4 }}>It's now on the wall below.</div>
          <button onClick={() => setDone(false)} style={{ marginTop: 12, padding: '8px 18px', borderRadius: 100, border: 'none', cursor: 'pointer', background: `${primary}1a`, color: dark, fontSize: 12, fontWeight: 700 }}>Leave another wish</button>
        </div>
      ) : (
        <div style={{ marginBottom: 20 }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" style={underlineInput} />
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Type your wishes" rows={3} style={{ ...underlineInput, resize: 'vertical' }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: muted, padding: '9px 2px', cursor: 'pointer', marginBottom: files.length ? 8 : 16, borderBottom: `1.5px dashed ${primaryLight}` }}>
            📷 {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} selected — add more` : 'Add photos or a video (optional)'}
            <input type="file" accept="image/*,video/*" multiple onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files || [])].slice(0, 6))} style={{ display: 'none' }} />
          </label>
          {files.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {files.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: dark, background: `${primary}1a`, borderRadius: 100, padding: '4px 9px' }}>
                  {f.name.length > 16 ? f.name.slice(0, 14) + '…' : f.name}
                  <span onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} style={{ cursor: 'pointer', fontWeight: 700 }}>×</span>
                </div>
              ))}
            </div>
          )}
          {error && <div style={{ fontSize: 11.5, color: primary, marginBottom: 10 }}>{error}</div>}
          <button onClick={submit} disabled={submitting} style={{ padding: '10px 26px', borderRadius: 10, border: 'none', cursor: 'pointer', background: dark, color: '#fff', fontWeight: 700, fontSize: 13, fontFamily: "'Inter',sans-serif", opacity: submitting ? 0.6 : 1 }}>{submitting ? 'Sending...' : 'Submit'}</button>
        </div>
      )}

      {loading ? (
        <div style={{ fontSize: 12, color: muted, textAlign: 'center' }}>Loading wishes...</div>
      ) : wishes.length === 0 ? (
        <div style={{ fontSize: 12, color: muted, textAlign: 'center' }}>Be the first to leave a wish!</div>
      ) : (
        <div style={{ borderTop: `1px solid ${primaryLight}`, paddingTop: 6 }}>
          {wishes.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE).map((w, i, arr) => {
            const mediaList = getWishMedia(w)
            return (
              <div key={w.id} style={{ padding: '16px 0', borderBottom: i < arr.length - 1 ? `1px solid ${primaryLight}` : 'none', textAlign: 'left' }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: dark, marginBottom: 5 }}>{w.guest_name}</div>
                <div style={{ fontSize: 13, color: dark, opacity: 0.8, lineHeight: 1.7, marginBottom: mediaList.length ? 10 : 6, whiteSpace: 'pre-wrap' }}>{w.message}</div>
                <WishMediaGrid media={mediaList} onOpen={idx => setLightbox({ media: mediaList, index: idx })} />
                <div style={{ fontSize: 10.5, color: muted, marginTop: 4 }}>{new Date(w.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              </div>
            )
          })}
          {wishes.length > PER_PAGE && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${primaryLight}`, flexWrap: 'wrap' }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ background: 'transparent', border: 'none', cursor: page === 0 ? 'default' : 'pointer', fontSize: 12, fontWeight: 700, color: primary, opacity: page === 0 ? 0.35 : 1 }}>← Previous</button>
              {Array.from({ length: Math.ceil(wishes.length / PER_PAGE) }).map((_, i) => (
                <button key={i} onClick={() => setPage(i)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: i === page ? 800 : 600, color: i === page ? dark : primary, textDecoration: i === page ? 'underline' : 'none', padding: '2px 4px' }}>{i + 1}</button>
              ))}
              <button onClick={() => setPage(p => (p + 1) * PER_PAGE < wishes.length ? p + 1 : p)} disabled={(page + 1) * PER_PAGE >= wishes.length} style={{ background: 'transparent', border: 'none', cursor: (page + 1) * PER_PAGE >= wishes.length ? 'default' : 'pointer', fontSize: 12, fontWeight: 700, color: primary, opacity: (page + 1) * PER_PAGE >= wishes.length ? 0.35 : 1 }}>Next →</button>
            </div>
          )}
        </div>
      )}
      {lightbox && <WishLightbox media={lightbox.media} index={lightbox.index} onIndex={i => setLightbox(l => l && { ...l, index: i })} onClose={() => setLightbox(null)} />}
    </div>
  )
}

// ── Card + section styles: each section is its own white rounded card in
// a vertical stack (Eternal Bloom's layout pattern). ──
const cardStyle = (): React.CSSProperties => ({ background: "#fff", margin: "0 16px 16px", borderRadius: 22, padding: "1.8rem", boxShadow: "0 2px 20px rgba(0,0,0,0.06)", position: "relative", overflow: "hidden" })
const pretitleStyle = (color: string): React.CSSProperties => ({ fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color, textAlign: "center", marginBottom: 6, fontWeight: 700 })
const titleStyle = (dark: string): React.CSSProperties => ({ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.5rem", color: dark, textAlign: "center", marginBottom: 20 })

export default function BlushRevealTemplate({ couple }: { couple: Couple }) {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#fdf6f2" }} />}>
      <BlushRevealInner couple={couple} />
    </Suspense>
  )
}

// ── Calendar-link helpers for the "Save Our Date" accordion (imesha-madusanka
// one-off below). Google Calendar gets a deep link; Apple Calendar/Outlook
// get a downloadable .ics built on the fly — no server round-trip either way. ──
function fmtCalDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}
function buildGoogleCalendarUrl(title: string, start: Date, venue: string, address: string): string {
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000)
  const params = new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${fmtCalDate(start)}/${fmtCalDate(end)}`, location: [venue, address].filter(Boolean).join(', ') })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
function buildIcsDataUrl(title: string, start: Date, venue: string, address: string): string {
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000)
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', `DTSTART:${fmtCalDate(start)}`, `DTEND:${fmtCalDate(end)}`, `SUMMARY:${title}`, `LOCATION:${[venue, address].filter(Boolean).join(', ')}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n')
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`
}

// ── One-off tabbed interior for imesha-madusanka-, modeled on a reference
// design the couple sent (sticky translucent header, DETAILS / LOCATION /
// PHOTOS / RSVP tabs). Deliberately reuses this template's own PRIMARY /
// PRIMARY_LIGHT / DARK / CREAM colors throughout — only the layout changes,
// per "colors change karanna epa". Every other invitation on this template
// keeps the original continuous-scroll layout untouched. ──
// ── Auto-advancing, swipeable photo slideshow for the imesha-madusanka
// redesign's Photos section — one picture at a time with dot indicators,
// arrow buttons, and a touch-swipe handler for mobile. ──
function PhotoSlideshow({ images, primary }: { images: string[]; primary: string }) {
  const [index, setIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    if (images.length <= 1) return
    const t = setInterval(() => setIndex(i => (i + 1) % images.length), 4000)
    return () => clearInterval(t)
  }, [images.length])

  if (images.length === 0) return null
  const go = (dir: 1 | -1) => setIndex(i => (i + dir + images.length) % images.length)
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx > 40) go(-1)
    else if (dx < -40) go(1)
    touchStartX.current = null
  }

  return (
    <div>
      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', boxShadow: '0 8px 26px rgba(0,0,0,0.14)', aspectRatio: '4 / 5', background: `${primary}11` }}>
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={src} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: i === index ? 1 : 0, transition: 'opacity 0.6s ease' }} />
        ))}
        {images.length > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="Previous photo" style={{ position: 'absolute', top: '50%', left: 10, transform: 'translateY(-50%)', width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
            </button>
            <button onClick={() => go(1)} aria-label="Next photo" style={{ position: 'absolute', top: '50%', right: 10, transform: 'translateY(-50%)', width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
          {images.map((_, i) => (
            <button key={i} onClick={() => setIndex(i)} aria-label={`Go to photo ${i + 1}`} style={{ width: i === index ? 18 : 6, height: 6, borderRadius: 100, border: 'none', cursor: 'pointer', background: i === index ? primary : `${primary}44`, transition: 'width 0.3s' }} />
          ))}
        </div>
      )}
    </div>
  )
}

function RedesignedInterior({ couple, PRIMARY, PRIMARY_LIGHT, DARK, CREAM, MUTED, W, eventsList, guestName, showCountdown, showThankYou, contactList }: {
  couple: Couple
  PRIMARY: string; PRIMARY_LIGHT: string; DARK: string; CREAM: string; MUTED: string
  W: { bride: string; groom: string; brideFamilyName: string; groomFamilyName: string; date?: string; gallery: string[] }
  eventsList: { key: string; label: string; icon: string; venue: string; venue_address: string; date: string; maps_url: string }[]
  guestName: string
  showCountdown: boolean
  showThankYou: boolean
  contactList: { name: string; phone: string }[]
}) {
  const [dateOpen, setDateOpen] = useState(false)
  const primaryEvent = eventsList[0]
  const evDate = primaryEvent && primaryEvent.date ? new Date(primaryEvent.date) : null
  const evTimeDisplay = evDate ? evDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''
  const mapQuery = primaryEvent ? encodeURIComponent([primaryEvent.venue, primaryEvent.venue_address].filter(Boolean).join(', ')) : ''

  return (
    <div style={{ position: 'relative' }}>
      {/* Photo header — the same cover photo shown on the intro screen,
          now used as a hero banner that scrolls away with the rest of the
          page (no sticky bar, no tab clicks — everything below just flows
          in one scroll, same as every other invitation on this template). */}
      <div style={{ position: 'relative', height: 300, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${couple.couple_photo || (couple as any).cover_background_image || DEFAULT_COVER_BG})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.08) 45%, rgba(0,0,0,0.55) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 20px 22px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: '2.2rem', color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.35)' }}>
            <span style={{ color: PRIMARY_LIGHT }}>{W.bride}</span> &amp; <span style={{ color: PRIMARY_LIGHT }}>{W.groom}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '22px 18px 110px' }}>
        {/* Personal Invitation card */}
        <div style={{ background: CREAM, border: `1px solid ${PRIMARY_LIGHT}`, borderRadius: 24, padding: '28px 22px', textAlign: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase', color: MUTED, marginBottom: 18 }}>A Personal Invitation</div>
          {W.brideFamilyName && (
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, color: DARK, lineHeight: 1.7 }}>{W.brideFamilyName}</div>
          )}
          {W.brideFamilyName && W.groomFamilyName && (
            <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: MUTED, margin: '14px 0' }}>Together With</div>
          )}
          {W.groomFamilyName && (
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, color: DARK, lineHeight: 1.7 }}>{W.groomFamilyName}</div>
          )}
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: 16, color: DARK, margin: '18px 0' }}>joyfully invite</div>
          {guestName && (
            <div style={{ display: 'inline-block', border: `1.5px dashed ${PRIMARY}77`, borderRadius: 100, padding: '14px 26px', margin: '4px 0 18px', background: `${PRIMARY}0a` }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, color: DARK, lineHeight: 1.5 }}>{guestName}</div>
            </div>
          )}
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 14, color: DARK, lineHeight: 1.8 }}>
            to join in celebrating the wedding of their beloved children.
          </div>
        </div>

        {primaryEvent && (
          <>
            {/* Arch-topped ceremony card */}
            <div style={{ background: '#fff', borderRadius: '120px 120px 20px 20px', padding: '36px 24px 24px', textAlign: 'center', boxShadow: `0 8px 26px ${DARK}14`, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                <Blossom size={22} color={PRIMARY} />
              </div>
              <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: MUTED, marginBottom: 6 }}>{primaryEvent.label}</div>
              {evDate && <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: DARK, fontWeight: 700 }}>{evTimeDisplay}</div>}
              <div style={{ width: 36, height: 1, background: PRIMARY, opacity: 0.4, margin: '12px auto' }} />
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: 15, color: DARK }}>{primaryEvent.venue}</div>
            </div>

            {/* Countdown band — same id the bottom nav's "Save Date" button
                scrolls to, restyled as a card to match the rest of this
                page. */}
            {showCountdown && (
              <div id="savethedate" style={{ background: '#fff', borderRadius: 20, padding: '1.4rem 1rem', textAlign: 'center', boxShadow: `0 8px 26px ${DARK}14`, marginBottom: 16 }}>
                <div style={{ fontSize: 9, letterSpacing: '0.4em', textTransform: 'uppercase', color: PRIMARY, marginBottom: 10, fontWeight: 700 }}>Counting Down to Our Big Day</div>
                <Countdown targetDate={W.date} dark={DARK} tint={PRIMARY_LIGHT} />
              </div>
            )}

            {/* Add-to-calendar accordion */}
            <div style={{ background: CREAM, border: `1px solid ${PRIMARY_LIGHT}`, borderRadius: 18, overflow: 'hidden', marginBottom: 16 }}>
              <button onClick={() => setDateOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: DARK, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="5" width="17" height="16" rx="2.5" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, color: DARK, fontWeight: 700 }}>Add to Calendar</div>
                  <div style={{ fontSize: 11.5, color: MUTED, marginTop: 2 }}>Save the wedding to your calendar</div>
                </div>
                <div style={{ color: MUTED, transform: dateOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</div>
              </button>
              {dateOpen && evDate && (
                <div style={{ padding: '0 18px 18px', display: 'grid', gap: 8 }}>
                  <a href={buildGoogleCalendarUrl(`${W.bride} & ${W.groom}'s Wedding`, evDate, primaryEvent.venue, primaryEvent.venue_address)} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'block', textAlign: 'center', padding: '12px 16px', borderRadius: 12, border: `1px solid ${PRIMARY_LIGHT}`, background: '#fff', color: DARK, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                    Google Calendar
                  </a>
                  <a href={buildIcsDataUrl(`${W.bride} & ${W.groom}'s Wedding`, evDate, primaryEvent.venue, primaryEvent.venue_address)} download={`${W.bride}-${W.groom}-wedding.ics`}
                    style={{ display: 'block', textAlign: 'center', padding: '12px 16px', borderRadius: 12, border: `1px solid ${PRIMARY_LIGHT}`, background: '#fff', color: DARK, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                    Apple Calendar / Outlook
                  </a>
                </div>
              )}
            </div>

            {/* Location */}
            <div style={{ textAlign: 'center', margin: '30px 0 20px' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase', color: MUTED, marginBottom: 8 }}>How To Find Us</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, color: DARK }}>The <span style={{ color: PRIMARY, fontStyle: 'italic' }}>Location</span></div>
            </div>
            <div style={{ background: '#fff', borderRadius: 22, padding: '26px 20px', textAlign: 'center', boxShadow: `0 8px 26px ${DARK}14`, marginBottom: 16 }}>
              <div style={{ width: 46, height: 46, borderRadius: '50%', border: `1px solid ${PRIMARY}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s7-7.5 7-12.5A7 7 0 105 9.5C5 14.5 12 22 12 22z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
              </div>
              <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: MUTED, marginBottom: 6 }}>Venue</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, fontWeight: 700, color: DARK, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{primaryEvent.venue}</div>
              {primaryEvent.venue_address && <div style={{ fontSize: 12.5, color: MUTED, marginTop: 8, lineHeight: 1.6 }}>{primaryEvent.venue_address}</div>}
            </div>
            <div style={{ borderRadius: 18, overflow: 'hidden', boxShadow: `0 8px 26px ${DARK}14`, position: 'relative', marginBottom: 16 }}>
              <iframe title="Venue map" src={`https://maps.google.com/maps?q=${mapQuery}&output=embed`} width="100%" height="230" style={{ border: 0, display: 'block' }} loading="lazy" />
              <a href={primaryEvent.maps_url || `https://maps.google.com/?q=${mapQuery}`} target="_blank" rel="noopener noreferrer"
                style={{ position: 'absolute', top: 12, left: 12, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: DARK, borderRadius: 100, padding: '8px 14px', fontSize: 11.5, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.18)' }}>
                Open in Maps ↗
              </a>
            </div>
          </>
        )}

        {/* Photos */}
        {W.gallery.length > 0 && (
          <>
            <div id="gallery" style={{ textAlign: 'center', margin: '30px 0 20px' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase', color: MUTED, marginBottom: 8 }}>Our Moments</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, color: DARK }}>The <span style={{ color: PRIMARY, fontStyle: 'italic' }}>Photos</span></div>
            </div>
            <PhotoSlideshow images={W.gallery} primary={PRIMARY} />
          </>
        )}

        {/* RSVP */}
        <div id="rsvp" style={{ background: '#fff', borderRadius: 22, padding: '8px 4px 20px', boxShadow: `0 8px 26px ${DARK}14`, marginTop: 30 }}>
          <RSVP coupleId={couple.id} askDrinking={couple.ask_drinking} primary={PRIMARY} dark={DARK} cream={CREAM} muted={MUTED} guestName={guestName} />
        </div>

        {/* Thank you */}
        {showThankYou && (
          <div style={{ background: '#fff', borderRadius: 24, padding: '1.8rem', boxShadow: `0 8px 26px ${DARK}14`, marginTop: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 9, letterSpacing: '0.4em', textTransform: 'uppercase', color: PRIMARY, textAlign: 'center', marginBottom: 6, fontWeight: 700 }}>A Special Note</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '1.5rem', color: DARK, textAlign: 'center', marginBottom: 20 }}>To Our Lovely Guests</div>
            <div style={{ fontSize: 13, color: DARK, lineHeight: 2 }}>
              {(couple as any).thank_you_text || "With hearts full of love and gratitude, we are so happy to celebrate this beautiful chapter of our lives with you. Thank you for your love, your blessings, and for being part of our journey."}
            </div>
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 11, color: MUTED, letterSpacing: '0.1em' }}>With all our love,</div>
              <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: '1.8rem', color: PRIMARY, marginTop: 4 }}>{W.bride} &amp; {W.groom}</div>
            </div>
          </div>
        )}

        {/* Contact Numbers */}
        {contactList.length > 0 && (
          <div id="contact" style={{ background: '#fff', borderRadius: 22, padding: '1.8rem', boxShadow: `0 8px 26px ${DARK}14`, marginTop: 16 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.4em', textTransform: 'uppercase', color: PRIMARY, textAlign: 'center', marginBottom: 6, fontWeight: 700 }}>Get In Touch</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '1.5rem', color: DARK, textAlign: 'center', marginBottom: 20 }}>Contact Numbers</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {contactList.map((c, i) => <ContactRow key={i} name={c.name} phone={c.phone} primary={PRIMARY} />)}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '2rem 1.5rem 6rem', textAlign: 'center', background: '#fff', borderTop: `1px solid ${PRIMARY_LIGHT}`, borderRadius: '24px 24px 0 0' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <Blossom size={34} color={PRIMARY} />
        </div>
        <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: '1.5rem', color: PRIMARY, marginBottom: 4 }}>InviteGlow</div>
        <div style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: MUTED }}>inviteglow.com · Digital Wedding Invitations</div>
        {((couple as any).enable_footer_social ?? true) && <FooterSocial color={PRIMARY} background={`${PRIMARY}14`} />}
      </div>
    </div>
  )
}

function BlushRevealInner({ couple }: { couple: Couple }) {
  const searchParams = useSearchParams()
  const guestName = searchParams?.get('name') || ''
  const introEnabled = (couple as any).show_guest_intro !== false
  const [showIntro, setShowIntro] = useState(!!guestName && introEnabled)
  // Cover only renders once the intro screen has fully finished exiting
  // (not just started), so the intro's "Dear [Name]" text and the cover's
  // content never overlap.
  const [introGone, setIntroGone] = useState(!(guestName && introEnabled))
  const [opened, setOpened] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const ts = useTextStyles(couple)

  // One-off: imesha-madusanka- gets a redesigned interior (photo header,
  // arch-topped ceremony card, dashed-border guest badge, embedded map,
  // add-to-calendar accordion) per a reference design the couple liked —
  // still one continuous scroll, same as every other invitation. Same
  // colors as every other invite — only the layout differs — and every
  // other link on this template is completely unaffected.
  const isImeshaMadusanka = String((couple as any).slug || '').trim().toLowerCase().replace(/-+$/, '') === 'imesha-madusanka'

  const colors = sanitizeColors(couple.custom_colors)
  const PRIMARY = colors.primary
  const PRIMARY_LIGHT = colors.primaryLight
  const DARK = colors.dark
  const CREAM = colors.cream
  const MUTED = MUTED_TONE

  const songUrl = couple.song_url || DEFAULT_SONG_URL

  useEffect(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; audioRef.current = null }
    const audio = new Audio(songUrl)
    audio.loop = true; audio.volume = 0.6; audioRef.current = audio
    return () => { audio.pause(); audio.src = "" }
  }, [songUrl])

  // No flap/card animation, no "watch the video then it auto-opens"
  // sequence — tapping the button starts the music (inside this real user
  // gesture, so mobile browsers allow it) and opens the invitation right
  // away.
  const handleOpenClick = () => {
    audioRef.current?.play().catch(() => {})
    setOpened(true)
  }

  const EVENT_META: Record<'engagement' | 'wedding' | 'homecoming', { label: string; icon: string }> = {
    engagement: { label: 'Engagement', icon: '💍' }, wedding: { label: 'Wedding Ceremony', icon: '👰' }, homecoming: { label: 'Homecoming', icon: '🏡' },
  }
  type RenderableEvent = { key: 'engagement' | 'wedding' | 'homecoming'; label: string; icon: string; enabled: boolean; venue: string; venue_address: string; date: string; maps_url: string }
  const hasNewEvents = couple.events && Object.keys(couple.events).length > 0
  // Respects the admin's chosen display order (couple.events_order) when
  // set — falling back to the default engagement → wedding → homecoming
  // order otherwise.
  const eventKeyOrder: ('engagement' | 'wedding' | 'homecoming')[] =
    Array.isArray((couple as any).events_order) && (couple as any).events_order.length === 3
      ? (couple as any).events_order
      : ['engagement', 'wedding', 'homecoming']
  const eventsList: RenderableEvent[] = hasNewEvents
    ? eventKeyOrder.map((key): RenderableEvent => {
        const e = couple.events![key]
        const customLabel = (e as any)?.label
        return { key, ...EVENT_META[key], label: (customLabel && customLabel.trim()) || EVENT_META[key].label, enabled: e?.enabled ?? false, venue: e?.venue ?? '', venue_address: e?.venue_address ?? '', date: e?.date ?? '', maps_url: e?.maps_url ?? '' }
      }).filter(e => e.enabled && e.date.length > 0)
    : (couple.wedding_date ? [{ key: 'wedding', ...EVENT_META.wedding, enabled: true, venue: couple.venue || '', venue_address: couple.venue_address || '', date: couple.wedding_date, maps_url: couple.maps_url || '' }] : [])

  const sv = {
    gallery: couple.section_visibility?.gallery ?? true, countdown: couple.section_visibility?.countdown ?? true,
    timeline: couple.section_visibility?.timeline ?? true, seat_finder: couple.section_visibility?.seat_finder ?? true,
    music: couple.section_visibility?.music ?? true, thank_you: couple.section_visibility?.thank_you ?? true,
  }

  const W = {
    bride: couple.bride, groom: couple.groom, brideFamilyName: couple.bride_family || '', groomFamilyName: couple.groom_family || '',
    date: couple.wedding_date,
    song: couple.song_title || DEFAULT_SONG_TITLE, artist: couple.song_artist || DEFAULT_SONG_ARTIST,
    timeline: couple.timeline || [], seats: couple.seats || {}, gallery: couple.gallery || [],
  }

  const flexContacts: { name: string; phone: string }[] = Array.isArray((couple as any).contacts) ? (couple as any).contacts.filter((c: any) => c?.phone).map((c: any) => ({ name: c.name || '', phone: c.phone })) : []
  const contactList: { name: string; phone: string }[] = flexContacts.length > 0
    ? flexContacts
    : [
        ...(couple.groom && (couple as any).groom_phone ? [{ name: couple.groom, phone: (couple as any).groom_phone }] : []),
        ...(couple.bride && (couple as any).bride_phone ? [{ name: couple.bride, phone: (couple as any).bride_phone }] : []),
      ]

  const TINT = PRIMARY_LIGHT

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", minHeight: '100vh', background: `linear-gradient(180deg, ${CREAM} 0%, #fdeee6 55%, #fce0d2 100%)`, position: 'relative', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Great+Vibes&family=Inter:wght@300;400;500;600&display=swap');
        html, body { background: ${CREAM} !important; margin: 0; overflow-x: hidden; }
        @keyframes spin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
        input::placeholder { color: #cbb6a6; }
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
      `}</style>

      <FallingPetals color={PRIMARY} />

      <AnimatePresence onExitComplete={() => setIntroGone(true)}>
        {showIntro && guestName && (
          <GuestIntroScreen guestName={guestName} onDone={() => setShowIntro(false)} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} cream={CREAM} />
        )}
      </AnimatePresence>

      {/* ───────── SIMPLE REVEAL COVER ─────────
          No envelope, no flap, no "watch the video then it auto-opens"
          sequence — just a full-bleed photo or video behind a single
          "Open Invitation" button. The couple picks either one in their
          dashboard (same cover_video_url / couple_photo fields every other
          template already uses): a video plays muted and on loop purely
          as a moving backdrop, a photo just sits still. Either way,
          tapping the button opens the invitation immediately. Left
          completely untouched by the Eternal Bloom interior swap below —
          except for imesha-madusanka-, which also gets cover text (see
          the isImeshaMadusanka block further down). */}
      <AnimatePresence>
        {!opened && introGone && (
          <motion.div key="cover"
            exit={{ opacity: 0, transition: { duration: 0.5, delay: 0.1 } }}
            style={{ position: 'fixed', inset: 0, zIndex: 50, overflow: 'hidden', background: DARK }}>

            {/* Photo priority: the standard "Couple Photo (Hero Image)"
                field (couple_photo) is what the admin's "Cover / Intro
                Media" uploader — and its hint text — actually points
                couples to for exactly this ("that photo becomes the intro
                directly"), so it's checked first. cover_background_image
                (BlushBlossom's own older, separate field) is still
                honoured as a fallback, before finally falling back to the
                stock default. */}
            {(couple as any).cover_video_url ? (
              <video
                autoPlay loop muted playsInline preload="auto"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}>
                <source src={(couple as any).cover_video_url} type="video/mp4" />
              </video>
            ) : (
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url(${couple.couple_photo || (couple as any).cover_background_image || DEFAULT_COVER_BG})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
              }} />
            )}
            <div style={{
              position: 'absolute', inset: 0,
              background: isImeshaMadusanka
                ? 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.32) 30%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.12) 65%, rgba(0,0,0,0.55) 100%)'
                : 'linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.1) 45%, rgba(0,0,0,0.45) 100%)',
            }} />

            {/* One-off: imesha-madusanka- gets "Wedding Invitation" +
                couple names over the top of the photo, and the guest's
                name worked into the cover itself (not just the separate
                "Dear [Name]" intro screen before it). Every other
                invitation on this template keeps the original text-free
                cover untouched. A dark translucent "glass" plate sits
                behind the text so it stays readable no matter how bright
                the couple's own photo is (their reference photo has a
                pale, overcast sky right where this text sits — plain
                white text with just a shadow washed out against it). */}
            {isImeshaMadusanka && (
              <div style={{ position: 'absolute', top: '16%', left: 0, right: 0, zIndex: 1, textAlign: 'center', padding: '0 24px' }}>
                <div style={{ display: 'inline-block', background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(6px)', borderRadius: 20, padding: '18px 28px' }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.45em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.92)', marginBottom: 14 }}>
                    Wedding Invitation
                  </div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontWeight: 600, fontSize: '2.1rem', lineHeight: 1.3, color: '#fff' }}>
                    <span style={{ color: PRIMARY_LIGHT }}>{W.bride}</span> &amp; <span style={{ color: PRIMARY_LIGHT }}>{W.groom}</span>
                  </div>
                </div>
              </div>
            )}

            <div style={{ position: 'relative', zIndex: 1, minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '0 24px 64px', textAlign: 'center' }}>
              {isImeshaMadusanka && guestName && (
                <p style={{
                  margin: '0 0 18px', fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontWeight: 600,
                  fontSize: 17, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.45)',
                }}>
                  Dear <span style={{ color: PRIMARY_LIGHT }}>{guestName}</span>,
                </p>
              )}
              <motion.button
                onClick={handleOpenClick}
                aria-label="Open invitation"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 9,
                  padding: '13px 28px', borderRadius: 100, border: 'none',
                  background: `linear-gradient(135deg,${PRIMARY},${PRIMARY_LIGHT})`,
                  color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
                  cursor: 'pointer', boxShadow: `0 10px 26px rgba(0,0,0,0.4)`,
                  fontFamily: "'Inter',sans-serif",
                }}>
                Open Invitation
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ───────── MAIN CONTENT — Eternal Bloom's interior structure ───────── */}
      <div style={{ maxWidth: 480, margin: "0 auto", background: CREAM, boxShadow: "0 0 80px rgba(0,0,0,0.06)", position: "relative" }}>
        {opened && isImeshaMadusanka && (
          <RedesignedInterior
            couple={couple} PRIMARY={PRIMARY} PRIMARY_LIGHT={PRIMARY_LIGHT} DARK={DARK} CREAM={CREAM} MUTED={MUTED}
            W={W} eventsList={eventsList} guestName={guestName}
            showCountdown={sv.countdown} showThankYou={sv.thank_you} contactList={contactList}
          />
        )}
        {opened && !isImeshaMadusanka && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>

            {/* Heading — Eternal Bloom's hero text, minus the repeated
                cover photo (that photo is already shown on the intro
                cover before "Open Invitation" is tapped, so showing it a
                second time right after opening just repeats the same
                picture back to back). */}
            <div style={{ padding: "2.6rem 1.5rem 1.2rem", textAlign: "center" }}>
              <div style={{ fontSize: 9, letterSpacing: "0.5em", textTransform: "uppercase", color: MUTED, marginBottom: "0.8rem" }}>
                {(couple as any).together_with_text || "Together with their families"}
              </div>
              <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: combinedNameFontSize(W.bride, W.groom), color: DARK, lineHeight: 1 }}>
                <span style={ts('bride_name')}>{W.bride}</span><span style={{ color: PRIMARY }}> &amp; </span><span style={ts('groom_name')}>{W.groom}</span>
              </div>
              {guestName && (
                <p style={{ marginTop: 14, fontSize: 15, fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", color: PRIMARY, fontWeight: 600 }}>
                  Dear {guestName},
                </p>
              )}
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 18 }}>
                <a href="#rsvp" style={{ background: `linear-gradient(135deg,${PRIMARY},${PRIMARY_LIGHT})`, color: "#fff", borderRadius: 100, padding: "10px 22px", fontSize: 11, letterSpacing: "0.15em", textDecoration: "none" }}>RSVP</a>
                <a href={eventsList[0]?.maps_url || couple.maps_url || '#'} target="_blank" rel="noopener noreferrer" style={{ background: `${PRIMARY}14`, color: DARK, border: `1.5px solid ${PRIMARY}55`, borderRadius: 100, padding: "10px 22px", fontSize: 11, letterSpacing: "0.15em", textDecoration: "none", fontWeight: 600 }}>Location</a>
              </div>
            </div>

            <div style={{ background: "#fff", padding: 10, display: "flex", justifyContent: "center", gap: 8, borderBottom: `1px solid ${PRIMARY_LIGHT}` }}>
              {[1, 2, 3].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: PRIMARY_LIGHT }} />)}
            </div>

            {/* Blessing card */}
            <motion.div style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div style={pretitleStyle(PRIMARY)}>With Love</div>
              <div style={{ textAlign: "center", fontSize: 13, color: DARK, lineHeight: 2, fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic" }}>
                {(couple as any).family_invitation_text ||
                  "Like a flower that blooms in its season, our love has grown into something beautiful. Join us as we begin this new chapter together."}
              </div>
            </motion.div>

            {/* Family names */}
            {(W.brideFamilyName || W.groomFamilyName) && (
              <motion.div style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={pretitleStyle(PRIMARY)}>Our Families</div>
                <div style={{ textAlign: "center", padding: 12, background: TINT, borderRadius: 12, fontSize: 13, color: DARK, lineHeight: 2 }}>
                  {W.brideFamilyName && <><strong>{W.brideFamilyName}</strong><br /></>}
                  {W.brideFamilyName && W.groomFamilyName && <>together with<br /></>}
                  {W.groomFamilyName && <><strong>{W.groomFamilyName}</strong><br /></>}
                  <span style={{ color: MUTED }}>
                    {((couple as any).family_invitation_text || "request the honour of your presence\nto celebrate the marriage of their loving children")
                      .split('\n').map((line: string, i: number, arr: string[]) => <span key={i}>{line}{i < arr.length - 1 && <br />}</span>)}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Events */}
            {eventsList.map(ev => {
              const evDate = new Date(ev.date)
              const evDateDisplay = evDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
              const evTimeDisplay = evDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) + ' Onwards'
              return (
                <motion.div key={ev.key} style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <div style={pretitleStyle(PRIMARY)}>{ev.icon} Save the Date</div>
                  <div style={titleStyle(DARK)}>{ev.label}</div>
                  {[
                    { icon: "📅", label: "Date", val: evDateDisplay, tsKey: '' },
                    { icon: "⏰", label: "Time", val: evTimeDisplay, tsKey: '' },
                    { icon: "📍", label: "Venue", val: ev.venue, sub: ev.venue_address, tsKey: 'venue_name', subTsKey: 'venue_address' },
                  ].map(d => (
                    <div key={d.label} style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "12px 0", borderBottom: `1px solid ${PRIMARY_LIGHT}55` }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${PRIMARY_LIGHT}66`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>{d.icon}</div>
                      <div>
                        <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: MUTED }}>{d.label}</div>
                        <div style={{ ...(d.tsKey ? ts(d.tsKey) : {}), fontSize: 15, color: DARK, fontWeight: 700, marginTop: 2 }}>{d.val}</div>
                        {d.sub && <div style={{ ...((d as any).subTsKey ? ts((d as any).subTsKey) : {}), fontSize: 12, color: MUTED, marginTop: 2 }}>{d.sub}</div>}
                      </div>
                    </div>
                  ))}
                  {ev.maps_url && (
                    <a href={ev.maps_url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: `${PRIMARY_LIGHT}66`, borderRadius: 100, padding: "10px 20px", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: PRIMARY, marginTop: 16, textDecoration: "none", fontWeight: 700 }}>
                      📍 View Location on Maps
                    </a>
                  )}
                </motion.div>
              )
            })}

            {/* Countdown — full-width bordered band */}
            {sv.countdown && (
              <div id="savethedate" style={{ background: "#fff", padding: "1.5rem 1rem", textAlign: "center", borderTop: `1px solid ${PRIMARY_LIGHT}`, borderBottom: `1px solid ${PRIMARY_LIGHT}`, marginBottom: 16 }}>
                <div style={{ ...pretitleStyle(PRIMARY), ...ts('countdown_label') }}>Counting Down to Our Big Day</div>
                <Countdown targetDate={W.date} dark={DARK} tint={TINT} />
              </div>
            )}

            {/* RSVP */}
            <div id="rsvp"><RSVP coupleId={couple.id} askDrinking={couple.ask_drinking} primary={PRIMARY} dark={DARK} cream={CREAM} muted={MUTED} guestName={guestName} /></div>

            {/* Timeline */}
            {sv.timeline && W.timeline.length > 0 && (
              <motion.div style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={pretitleStyle(PRIMARY)}>Our Celebration</div>
                <div style={titleStyle(DARK)}>The Wedding Lineup</div>
                <div style={{ position: "relative", paddingLeft: 20 }}>
                  <div style={{ position: "absolute", left: 6, top: 0, bottom: 0, width: 1, background: `${PRIMARY_LIGHT}` }} />
                  {W.timeline.map((tl, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                      style={{ position: "relative", padding: "10px 0 10px 20px" }}>
                      <div style={{ position: "absolute", left: -14, top: 14, width: 10, height: 10, borderRadius: "50%", background: PRIMARY, border: "2px solid #fff", boxShadow: `0 0 0 2px ${PRIMARY_LIGHT}` }} />
                      <div style={{ fontSize: 11, fontWeight: 600, color: PRIMARY, letterSpacing: "0.1em" }}>{tl.time}</div>
                      <div style={{ fontSize: 13, color: DARK, fontWeight: 500, marginTop: 2 }}>{tl.event}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Guest Wishes Wall */}
            {((couple as any).enable_guest_wishes ?? false) && (
              <motion.div id="wishes" style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={pretitleStyle(PRIMARY)}>With Love</div>
                <div style={titleStyle(DARK)}>Wishes for Us</div>
                <div style={{ fontSize: 12.5, color: MUTED, textAlign: 'center', marginBottom: 16 }}>
                  Share your wishes and blessings with {W.bride} &amp; {W.groom}.
                </div>
                <WishesWall coupleId={couple.id} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} cream={CREAM} muted={MUTED} />
              </motion.div>
            )}

            {/* Seat finder */}
            {sv.seat_finder && couple.show_seating && Object.keys(W.seats).length > 0 && (
              <motion.div style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={pretitleStyle(PRIMARY)}>Be Our Guest</div>
                <div style={titleStyle(DARK)}>Find Your Table</div>
                <div style={{ fontSize: 13, color: MUTED, marginBottom: 12, textAlign: "center" }}>Search your name to find your assigned table</div>
                <SeatFinder seats={W.seats} primary={PRIMARY} dark={DARK} cream={CREAM} muted={MUTED} />
              </motion.div>
            )}

            {/* Music */}
            {sv.music && (
              <motion.div style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={pretitleStyle(PRIMARY)}>Our Song</div>
                <MusicPlayerUI title={W.song} artist={W.artist} audioRef={audioRef} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} muted={MUTED} />
              </motion.div>
            )}

            {/* Gallery */}
            {sv.gallery && W.gallery.length > 0 && (
              <motion.div id="gallery" style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={pretitleStyle(PRIMARY)}>Our Story</div>
                <div style={titleStyle(DARK)}>Our Moments</div>
                <div style={{ columnCount: 2, columnGap: 10 }}>
                  {W.gallery.map((src, i) => (
                    <div key={i} style={{ breakInside: "avoid", marginBottom: 10, borderRadius: 16, overflow: "hidden", background: `${PRIMARY_LIGHT}55`, boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" style={{ width: "100%", height: "auto", display: "block" }} onError={e => { (e.currentTarget.closest('div') as HTMLElement).style.display = "none" }} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Thank you */}
            {sv.thank_you && (
              <motion.div style={{ ...cardStyle(), borderRadius: 24 }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={pretitleStyle(PRIMARY)}>A Special Note</div>
                <div style={titleStyle(DARK)}>To Our Lovely Guests</div>
                <div style={{ textAlign: "center", fontSize: 13, color: DARK, lineHeight: 2 }}>
                  {(couple as any).thank_you_text || "With hearts full of love and gratitude, we are so happy to celebrate this beautiful chapter of our lives with you. Thank you for your love, your blessings, and for being part of our journey."}
                </div>
                <div style={{ textAlign: "center", marginTop: 18 }}>
                  <div style={{ fontSize: 11, color: MUTED, letterSpacing: "0.1em" }}>With all our love,</div>
                  <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "1.8rem", color: PRIMARY, marginTop: 4 }}>{W.bride} &amp; {W.groom}</div>
                </div>
              </motion.div>
            )}

            {/* Contact Numbers */}
            {contactList.length > 0 && (
              <motion.div id="contact" style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={pretitleStyle(PRIMARY)}>Get In Touch</div>
                <div style={titleStyle(DARK)}>Contact Numbers</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {contactList.map((c, i) => <ContactRow key={i} name={c.name} phone={c.phone} primary={PRIMARY} />)}
                </div>
              </motion.div>
            )}

            <div style={{ padding: "2rem 1.5rem 6rem", textAlign: "center", background: "#fff", borderTop: `1px solid ${PRIMARY_LIGHT}`, borderRadius: "24px 24px 0 0" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                <Blossom size={34} color={PRIMARY} />
              </div>
              <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "1.5rem", color: PRIMARY, marginBottom: 4 }}>InviteGlow</div>
              <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: MUTED }}>inviteglow.com · Digital Wedding Invitations</div>
              {((couple as any).enable_footer_social ?? true) && <FooterSocial color={PRIMARY} background={`${PRIMARY}14`} />}
            </div>
          </motion.div>
        )}
      </div>
      {opened && (
        <BottomNavBar
          primary={PRIMARY} dark={DARK}
          mapsUrl={eventsList[0]?.maps_url || couple.maps_url || ''}
          hasWishes={isImeshaMadusanka ? false : ((couple as any).enable_guest_wishes ?? false)}
          hasGallery={sv.gallery && W.gallery.length > 0}
          audioRef={audioRef}
        />
      )}
    </div>
  )
}

