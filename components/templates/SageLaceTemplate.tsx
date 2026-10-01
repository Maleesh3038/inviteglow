"use client"
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, Couple } from '@/lib/supabase'
import FooterSocial from '@/components/shared/FooterSocial'

const DEFAULT_PHOTO = "/images/hero-floral.png"
const COVER_VIDEO_POSTER = "data:image/jpeg;base64,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"
const DEFAULT_SONG_URL = "/audio/calm-wedding.mp3"
const DEFAULT_SONG_TITLE = "Calm Wedding Theme"
const DEFAULT_SONG_ARTIST = "InviteGlow"

// Botanical, lush-green palette — moss/sage tones on warm ivory.
const DEFAULT_PALETTE = {
  primary: "#5c7a52",
  primaryLight: "#b9cdae",
  dark: "#2d3d28",
  cream: "#f8f6ee",
  muted: "#8a9a80",
}

// ── Leaf divider — the signature organic motif for this template, used
// instead of geometric dots/diamonds anywhere Ceylon Elegance-style
// dividers would normally go. ──
// ── Floating bottom nav bar — modern narrow pill (not edge-to-edge),
// quick jump to key sections, plus a raised music toggle on the right. ──
// ── Auto-shrinks the couple-name script font for longer names so they
// never overflow the screen width on mobile — short names (e.g. "Amal")
// get the full large size, longer ones (e.g. "Nathasha") step down. ──
// ── Per-element text style overrides. Reads couple.text_styles (set from
// the "Customise Fonts" panel in the couple's dashboard) and merges a
// color/font/bold override on top of the template's own default styling.
// A missing key simply falls back to the template default — nothing
// breaks for invitations that never touch that panel. ──
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

function coupleNameFontSize(name: string): string {
  const len = (name || '').length
  if (len > 12) return "clamp(1.4rem,5.5vw,1.9rem)"
  if (len > 9) return "clamp(1.7rem,6.5vw,2.3rem)"
  if (len > 6) return "clamp(2.0rem,7.5vw,2.8rem)"
  return "clamp(2.4rem,8.5vw,3.4rem)"
}

// Same idea, for the "Bride & Groom" combined single-line treatment used
// in the hero band further down — combined length matters here, not
// either name individually, since both sit on one line together.
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
        background: 'rgba(255,255,255,0.98)', borderRadius: 100, border: '1px solid rgba(45,61,40,0.08)',
        boxShadow: '0 10px 30px rgba(45,61,40,0.18)', padding: '10px 18px', paddingRight: 56, position: 'relative',
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
          background: `linear-gradient(135deg,${primary},#8aa87e)`, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          boxShadow: '0 6px 16px rgba(45,61,40,0.35)',
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
// classic bride_phone/groom_phone fields so older invitations keep
// showing their existing numbers with no data lost. ──
function ContactRow({ name, phone, primary }: { name: string; phone: string; primary: string }) {
  const digitsOnly = phone.replace(/\D/g, '')
  const waNumber = digitsOnly.startsWith('0') ? `94${digitsOnly.slice(1)}` : digitsOnly
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: '#fff', border: `1px solid ${primary}22`, borderRadius: 14, padding: '12px 16px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
      <div style={{ minWidth: 0 }}>
        {name ? (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#2d3d28', fontFamily: "'Inter',sans-serif" }}>{name}</div>
            <div style={{ fontSize: 12, color: '#8a9a80', marginTop: 2 }}>{phone}</div>
          </>
        ) : (
          <div style={{ fontSize: 13, fontWeight: 700, color: '#2d3d28', fontFamily: "'Inter',sans-serif" }}>{phone}</div>
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

function LeafDivider({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
      <div style={{ width: 34, height: 1, background: color, opacity: 0.4 }} />
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 2C7 6 4 11 4 15a8 8 0 0016 0c0-4-3-9-8-13z" fill={color} opacity="0.8" />
        <path d="M12 4v16" stroke="#fff" strokeWidth="0.8" opacity="0.5" />
      </svg>
      <div style={{ width: 34, height: 1, background: color, opacity: 0.4 }} />
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
        background: `linear-gradient(160deg, ${cream} 0%, #eef2e6 45%, ${cream} 100%)`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "2rem", overflow: "hidden",
      }}>
      <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${primaryLight}44, transparent)`, top: "22%", left: "50%", transform: "translateX(-50%)" }} />
      <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: [0.4, 1.1, 1], opacity: 1 }} transition={{ duration: 1.1, ease: "easeOut", delay: 0.2 }}
        style={{ position: "relative", zIndex: 1, marginBottom: "1.6rem" }}>
        <LeafDivider color={primary} size={22} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.9 }} style={{ position: "relative", zIndex: 1, marginBottom: "1rem" }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "clamp(1.9rem,6.5vw,2.7rem)", color: dark, lineHeight: 1.2 }}>
          Dear <span style={{ color: primary, fontWeight: 600 }}>{guestName}</span>,
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, letterSpacing: "0.1em" }} animate={{ opacity: 1, letterSpacing: "0.4em" }} transition={{ duration: 0.9, delay: 1.6 }}
        style={{ fontSize: 10, textTransform: "uppercase", color: `${primary}cc`, fontFamily: "'Inter',sans-serif" }}>
        Woven With Love
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
function Countdown({ targetDate, dark, tint = "#eef2e6" }: { targetDate: string; dark: string; tint?: string }) {
  const [t, setT] = useState({ d: "00", h: "00", m: "00", s: "00" })
  useEffect(() => {
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
          <div style={{ fontSize: 7.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7a8a70", marginTop: 5 }}>{l}</div>
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
      <LeafDivider color={primary} />
      <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: primary, margin: "16px 0 8px", fontWeight: 700 }}>Be Our Guest</div>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.8rem", color: dark, marginBottom: 24 }}>Will You Join Us?</div>
      <div style={{ background: "#fff", borderRadius: 20, padding: 24, maxWidth: 380, margin: "0 auto", boxShadow: "0 4px 20px rgba(45,61,40,0.08)" }}>
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
            {/* Swipe-friendly picker — a native select renders as the
                phone's own scroll/swipe wheel on tap (iOS and Android both
                do this automatically), which is far easier on a small
                screen than tapping tiny +/- buttons one at a time. */}
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
            <div style={{ fontSize: 28, marginBottom: 8 }}>{finalResponse === "yes" ? "🌿" : "🙏"}</div>
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
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(24,32,20,0.92)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
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
              <div style={{ position: "absolute", inset: 0, background: "rgba(24,32,20,0.55)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, fontWeight: 700, zIndex: 2 }}>+{media.length - 4}</div>
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

// ── Lace motif — a tiny seamless SVG tile (a soft four-petal flower with
// corner dots) used as a faint all-over texture on every card and, at full
// strength, as the thick decorative frame around the cover and the formal
// invitation card below — standing in for the doily/lace-paper texture on
// the reference design, in the couple's own accent color. ──
const lacePattern = (color: string, opacity = 0.5) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'%3E%3Cg fill='none' stroke='${encodeURIComponent(color)}' stroke-width='0.75' opacity='${opacity}'%3E%3Ccircle cx='22' cy='22' r='3'/%3E%3Ccircle cx='0' cy='0' r='2.2'/%3E%3Ccircle cx='44' cy='0' r='2.2'/%3E%3Ccircle cx='0' cy='44' r='2.2'/%3E%3Ccircle cx='44' cy='44' r='2.2'/%3E%3Cpath d='M22 10 L26 18 L34 22 L26 26 L22 34 L18 26 L10 22 L18 18 Z'/%3E%3C/g%3E%3C/svg%3E")`

// A raised, white-on-white embossed floral border — like paper that's been
// blind-stamped with a lace pattern, exactly the full-page side border in
// the invitation.lk reference video. Built as one tileable SVG with a dual
// feDropShadow filter (a soft white highlight + a soft grey shadow on each
// petal) to fake the carved/raised paper look purely in a background-image,
// so it works as a continuous border running the whole length of the page.
const EMBOSSED_LACE_BORDER =
  `#fdfcf7 url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2722%27%20height%3D%2730%27%20viewBox%3D%270%200%2022%2030%27%3E%3Ccircle%20cx%3D%272.69%27%20cy%3D%272.38%27%20r%3D%273.86%27%20fill%3D%27%23bcc6ab%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%277.38%27%20cy%3D%273.61%27%20r%3D%273.37%27%20fill%3D%27%23bcc6ab%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%2712.84%27%20cy%3D%273.52%27%20r%3D%272.81%27%20fill%3D%27%23bcc6ab%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%2719.54%27%20cy%3D%272.12%27%20r%3D%272.9%27%20fill%3D%27%23bcc6ab%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%275.76%27%20cy%3D%2710.55%27%20r%3D%272.96%27%20fill%3D%27%23bcc6ab%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%2710.61%27%20cy%3D%279.91%27%20r%3D%274.36%27%20fill%3D%27%23bcc6ab%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%2717.25%27%20cy%3D%279.17%27%20r%3D%274.41%27%20fill%3D%27%23bcc6ab%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%2721.05%27%20cy%3D%2710.65%27%20r%3D%273.24%27%20fill%3D%27%23bcc6ab%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%272.11%27%20cy%3D%2714.28%27%20r%3D%273.27%27%20fill%3D%27%23bcc6ab%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%279.76%27%20cy%3D%2714.48%27%20r%3D%273.74%27%20fill%3D%27%23bcc6ab%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%2714.69%27%20cy%3D%2715.09%27%20r%3D%273.68%27%20fill%3D%27%23bcc6ab%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%2718.35%27%20cy%3D%2714.09%27%20r%3D%273.1%27%20fill%3D%27%23bcc6ab%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%276.58%27%20cy%3D%2721.27%27%20r%3D%273.28%27%20fill%3D%27%23bcc6ab%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%2711.77%27%20cy%3D%2721.35%27%20r%3D%273.26%27%20fill%3D%27%23bcc6ab%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%2717.94%27%20cy%3D%2722.14%27%20r%3D%273.16%27%20fill%3D%27%23bcc6ab%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%2722.74%27%20cy%3D%2721.58%27%20r%3D%274.24%27%20fill%3D%27%23bcc6ab%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%273.98%27%20cy%3D%2726.82%27%20r%3D%274.42%27%20fill%3D%27%23bcc6ab%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%277.53%27%20cy%3D%2727.24%27%20r%3D%274.04%27%20fill%3D%27%23bcc6ab%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%2713.14%27%20cy%3D%2727.46%27%20r%3D%272.82%27%20fill%3D%27%23bcc6ab%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%2720.29%27%20cy%3D%2728.35%27%20r%3D%273.72%27%20fill%3D%27%23bcc6ab%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%272.69%27%20cy%3D%2732.38%27%20r%3D%273.86%27%20fill%3D%27%23bcc6ab%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%2724.69%27%20cy%3D%272.38%27%20r%3D%273.86%27%20fill%3D%27%23bcc6ab%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%2724.69%27%20cy%3D%2732.38%27%20r%3D%273.86%27%20fill%3D%27%23bcc6ab%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%277.38%27%20cy%3D%2733.61%27%20r%3D%273.37%27%20fill%3D%27%23bcc6ab%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%2719.54%27%20cy%3D%2732.12%27%20r%3D%272.9%27%20fill%3D%27%23bcc6ab%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%27-0.95%27%20cy%3D%2710.65%27%20r%3D%273.24%27%20fill%3D%27%23bcc6ab%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%2724.11%27%20cy%3D%2714.28%27%20r%3D%273.27%27%20fill%3D%27%23bcc6ab%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%270.74%27%20cy%3D%2721.58%27%20r%3D%274.24%27%20fill%3D%27%23bcc6ab%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%273.98%27%20cy%3D%27-3.18%27%20r%3D%274.42%27%20fill%3D%27%23bcc6ab%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%2725.98%27%20cy%3D%2726.82%27%20r%3D%274.42%27%20fill%3D%27%23bcc6ab%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%2725.98%27%20cy%3D%27-3.18%27%20r%3D%274.42%27%20fill%3D%27%23bcc6ab%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%277.53%27%20cy%3D%27-2.76%27%20r%3D%274.04%27%20fill%3D%27%23bcc6ab%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%2720.29%27%20cy%3D%27-1.65%27%20r%3D%273.72%27%20fill%3D%27%23bcc6ab%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%27-1.71%27%20cy%3D%2728.35%27%20r%3D%273.72%27%20fill%3D%27%23bcc6ab%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%27-1.71%27%20cy%3D%27-1.65%27%20r%3D%273.72%27%20fill%3D%27%23bcc6ab%27%20opacity%3D%270.4%27%2F%3E%3Ccircle%20cx%3D%271.79%27%20cy%3D%271.48%27%20r%3D%273.71%27%20fill%3D%27%23ffffff%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%276.48%27%20cy%3D%272.71%27%20r%3D%273.22%27%20fill%3D%27%23ffffff%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%2711.94%27%20cy%3D%272.62%27%20r%3D%272.66%27%20fill%3D%27%23ffffff%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%2718.64%27%20cy%3D%271.22%27%20r%3D%272.75%27%20fill%3D%27%23ffffff%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%274.86%27%20cy%3D%279.65%27%20r%3D%272.81%27%20fill%3D%27%23ffffff%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%279.71%27%20cy%3D%279.01%27%20r%3D%274.21%27%20fill%3D%27%23ffffff%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%2716.35%27%20cy%3D%278.27%27%20r%3D%274.26%27%20fill%3D%27%23ffffff%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%2720.15%27%20cy%3D%279.75%27%20r%3D%273.09%27%20fill%3D%27%23ffffff%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%271.21%27%20cy%3D%2713.38%27%20r%3D%273.12%27%20fill%3D%27%23ffffff%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%278.86%27%20cy%3D%2713.58%27%20r%3D%273.59%27%20fill%3D%27%23ffffff%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%2713.79%27%20cy%3D%2714.19%27%20r%3D%273.53%27%20fill%3D%27%23ffffff%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%2717.45%27%20cy%3D%2713.19%27%20r%3D%272.95%27%20fill%3D%27%23ffffff%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%275.68%27%20cy%3D%2720.37%27%20r%3D%273.13%27%20fill%3D%27%23ffffff%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%2710.87%27%20cy%3D%2720.45%27%20r%3D%273.11%27%20fill%3D%27%23ffffff%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%2717.04%27%20cy%3D%2721.24%27%20r%3D%273.01%27%20fill%3D%27%23ffffff%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%2721.84%27%20cy%3D%2720.68%27%20r%3D%274.09%27%20fill%3D%27%23ffffff%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%273.08%27%20cy%3D%2725.92%27%20r%3D%274.27%27%20fill%3D%27%23ffffff%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%276.63%27%20cy%3D%2726.34%27%20r%3D%273.89%27%20fill%3D%27%23ffffff%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%2712.24%27%20cy%3D%2726.56%27%20r%3D%272.67%27%20fill%3D%27%23ffffff%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%2719.39%27%20cy%3D%2727.45%27%20r%3D%273.57%27%20fill%3D%27%23ffffff%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%271.79%27%20cy%3D%2731.48%27%20r%3D%273.71%27%20fill%3D%27%23ffffff%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%2723.79%27%20cy%3D%271.48%27%20r%3D%273.71%27%20fill%3D%27%23ffffff%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%2723.79%27%20cy%3D%2731.48%27%20r%3D%273.71%27%20fill%3D%27%23ffffff%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%276.48%27%20cy%3D%2732.71%27%20r%3D%273.22%27%20fill%3D%27%23ffffff%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%2718.64%27%20cy%3D%2731.22%27%20r%3D%272.75%27%20fill%3D%27%23ffffff%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%27-1.85%27%20cy%3D%279.75%27%20r%3D%273.09%27%20fill%3D%27%23ffffff%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%2723.21%27%20cy%3D%2713.38%27%20r%3D%273.12%27%20fill%3D%27%23ffffff%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%27-0.16%27%20cy%3D%2720.68%27%20r%3D%274.09%27%20fill%3D%27%23ffffff%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%273.08%27%20cy%3D%27-4.08%27%20r%3D%274.27%27%20fill%3D%27%23ffffff%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%2725.08%27%20cy%3D%2725.92%27%20r%3D%274.27%27%20fill%3D%27%23ffffff%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%2725.08%27%20cy%3D%27-4.08%27%20r%3D%274.27%27%20fill%3D%27%23ffffff%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%276.63%27%20cy%3D%27-3.66%27%20r%3D%273.89%27%20fill%3D%27%23ffffff%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%2719.39%27%20cy%3D%27-2.55%27%20r%3D%273.57%27%20fill%3D%27%23ffffff%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%27-2.61%27%20cy%3D%2727.45%27%20r%3D%273.57%27%20fill%3D%27%23ffffff%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%27-2.61%27%20cy%3D%27-2.55%27%20r%3D%273.57%27%20fill%3D%27%23ffffff%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%272.19%27%20cy%3D%271.88%27%20r%3D%272.97%27%20fill%3D%27%23f1efe1%27%20opacity%3D%270.95%27%2F%3E%3Ccircle%20cx%3D%276.88%27%20cy%3D%273.11%27%20r%3D%272.58%27%20fill%3D%27%23f1efe1%27%20opacity%3D%270.95%27%2F%3E%3Ccircle%20cx%3D%2712.34%27%20cy%3D%273.02%27%20r%3D%272.13%27%20fill%3D%27%23f1efe1%27%20opacity%3D%270.95%27%2F%3E%3Ccircle%20cx%3D%2719.04%27%20cy%3D%271.62%27%20r%3D%272.2%27%20fill%3D%27%23f1efe1%27%20opacity%3D%270.95%27%2F%3E%3Ccircle%20cx%3D%275.26%27%20cy%3D%2710.05%27%20r%3D%272.25%27%20fill%3D%27%23f1efe1%27%20opacity%3D%270.95%27%2F%3E%3Ccircle%20cx%3D%2710.11%27%20cy%3D%279.41%27%20r%3D%273.37%27%20fill%3D%27%23f1efe1%27%20opacity%3D%270.95%27%2F%3E%3Ccircle%20cx%3D%2716.75%27%20cy%3D%278.67%27%20r%3D%273.41%27%20fill%3D%27%23f1efe1%27%20opacity%3D%270.95%27%2F%3E%3Ccircle%20cx%3D%2720.55%27%20cy%3D%2710.15%27%20r%3D%272.47%27%20fill%3D%27%23f1efe1%27%20opacity%3D%270.95%27%2F%3E%3Ccircle%20cx%3D%271.61%27%20cy%3D%2713.78%27%20r%3D%272.5%27%20fill%3D%27%23f1efe1%27%20opacity%3D%270.95%27%2F%3E%3Ccircle%20cx%3D%279.26%27%20cy%3D%2713.98%27%20r%3D%272.87%27%20fill%3D%27%23f1efe1%27%20opacity%3D%270.95%27%2F%3E%3Ccircle%20cx%3D%2714.19%27%20cy%3D%2714.59%27%20r%3D%272.82%27%20fill%3D%27%23f1efe1%27%20opacity%3D%270.95%27%2F%3E%3Ccircle%20cx%3D%2717.85%27%20cy%3D%2713.59%27%20r%3D%272.36%27%20fill%3D%27%23f1efe1%27%20opacity%3D%270.95%27%2F%3E%3Ccircle%20cx%3D%276.08%27%20cy%3D%2720.77%27%20r%3D%272.51%27%20fill%3D%27%23f1efe1%27%20opacity%3D%270.95%27%2F%3E%3Ccircle%20cx%3D%2711.27%27%20cy%3D%2720.85%27%20r%3D%272.49%27%20fill%3D%27%23f1efe1%27%20opacity%3D%270.95%27%2F%3E%3Ccircle%20cx%3D%2717.44%27%20cy%3D%2721.64%27%20r%3D%272.41%27%20fill%3D%27%23f1efe1%27%20opacity%3D%270.95%27%2F%3E%3Ccircle%20cx%3D%2722.24%27%20cy%3D%2721.08%27%20r%3D%273.27%27%20fill%3D%27%23f1efe1%27%20opacity%3D%270.95%27%2F%3E%3Ccircle%20cx%3D%273.48%27%20cy%3D%2726.32%27%20r%3D%273.41%27%20fill%3D%27%23f1efe1%27%20opacity%3D%270.95%27%2F%3E%3Ccircle%20cx%3D%277.03%27%20cy%3D%2726.74%27%20r%3D%273.11%27%20fill%3D%27%23f1efe1%27%20opacity%3D%270.95%27%2F%3E%3Ccircle%20cx%3D%2712.64%27%20cy%3D%2726.96%27%20r%3D%272.13%27%20fill%3D%27%23f1efe1%27%20opacity%3D%270.95%27%2F%3E%3Ccircle%20cx%3D%2719.79%27%20cy%3D%2727.85%27%20r%3D%272.86%27%20fill%3D%27%23f1efe1%27%20opacity%3D%270.95%27%2F%3E%3Ccircle%20cx%3D%272.19%27%20cy%3D%2731.88%27%20r%3D%272.97%27%20fill%3D%27%23f1efe1%27%20opacity%3D%270.95%27%2F%3E%3Ccircle%20cx%3D%2724.19%27%20cy%3D%271.88%27%20r%3D%272.97%27%20fill%3D%27%23f1efe1%27%20opacity%3D%270.95%27%2F%3E%3Ccircle%20cx%3D%2724.19%27%20cy%3D%2731.88%27%20r%3D%272.97%27%20fill%3D%27%23f1efe1%27%20opacity%3D%270.95%27%2F%3E%3Ccircle%20cx%3D%276.88%27%20cy%3D%2733.11%27%20r%3D%272.58%27%20fill%3D%27%23f1efe1%27%20opacity%3D%270.95%27%2F%3E%3Ccircle%20cx%3D%2719.04%27%20cy%3D%2731.62%27%20r%3D%272.2%27%20fill%3D%27%23f1efe1%27%20opacity%3D%270.95%27%2F%3E%3Ccircle%20cx%3D%27-1.45%27%20cy%3D%2710.15%27%20r%3D%272.47%27%20fill%3D%27%23f1efe1%27%20opacity%3D%270.95%27%2F%3E%3Ccircle%20cx%3D%2723.61%27%20cy%3D%2713.78%27%20r%3D%272.5%27%20fill%3D%27%23f1efe1%27%20opacity%3D%270.95%27%2F%3E%3Ccircle%20cx%3D%270.24%27%20cy%3D%2721.08%27%20r%3D%273.27%27%20fill%3D%27%23f1efe1%27%20opacity%3D%270.95%27%2F%3E%3Ccircle%20cx%3D%273.48%27%20cy%3D%27-3.68%27%20r%3D%273.41%27%20fill%3D%27%23f1efe1%27%20opacity%3D%270.95%27%2F%3E%3Ccircle%20cx%3D%2725.48%27%20cy%3D%2726.32%27%20r%3D%273.41%27%20fill%3D%27%23f1efe1%27%20opacity%3D%270.95%27%2F%3E%3Ccircle%20cx%3D%2725.48%27%20cy%3D%27-3.68%27%20r%3D%273.41%27%20fill%3D%27%23f1efe1%27%20opacity%3D%270.95%27%2F%3E%3Ccircle%20cx%3D%277.03%27%20cy%3D%27-3.26%27%20r%3D%273.11%27%20fill%3D%27%23f1efe1%27%20opacity%3D%270.95%27%2F%3E%3Ccircle%20cx%3D%2719.79%27%20cy%3D%27-2.15%27%20r%3D%272.86%27%20fill%3D%27%23f1efe1%27%20opacity%3D%270.95%27%2F%3E%3Ccircle%20cx%3D%27-2.21%27%20cy%3D%2727.85%27%20r%3D%272.86%27%20fill%3D%27%23f1efe1%27%20opacity%3D%270.95%27%2F%3E%3Ccircle%20cx%3D%27-2.21%27%20cy%3D%27-2.15%27%20r%3D%272.86%27%20fill%3D%27%23f1efe1%27%20opacity%3D%270.95%27%2F%3E%3C%2Fsvg%3E") repeat`

// A thick patterned "lace" border wrapping a clean white inset panel —
// used for the cover and the formal invitation card. Forwards motion
// props so it can drop straight into the existing whileInView animation
// call sites.
function LaceFrame({ primary, primaryLight, children, frame = 10, radius = 22, style, ...motionProps }: {
  primary: string; primaryLight: string; children: React.ReactNode; frame?: number; radius?: number; style?: React.CSSProperties
} & Record<string, any>) {
  return (
    <motion.div {...motionProps} style={{
      background: `${primaryLight}40 ${lacePattern(primary, 0.8)} repeat`, backgroundSize: "34px 34px",
      borderRadius: radius, padding: frame, boxShadow: "0 4px 22px rgba(45,61,40,0.1)", ...style,
    }}>
      <div style={{ background: "#fff", borderRadius: radius - frame * 0.45, height: "100%" }}>
        {children}
      </div>
    </motion.div>
  )
}

// ── Card + section styles, matching the Floral Romance layout pattern:
// each section is its own white rounded card in a vertical stack, now with
// a faint lace-texture wash (instead of Floral Romance's lotus) and a thin
// sage hairline border framing it. ──
const cardStyle = (primary: string): React.CSSProperties => ({
  background: `#fff ${lacePattern(primary, 0.07)} repeat`, backgroundSize: "40px 40px",
  margin: "0 16px 16px", borderRadius: 22, padding: "1.8rem", border: `1px solid ${primary}22`,
  boxShadow: "0 2px 20px rgba(45,61,40,0.06)", position: "relative", overflow: "hidden",
})
const pretitleStyle = (color: string): React.CSSProperties => ({ fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color, textAlign: "center", marginBottom: 6, fontWeight: 700 })
const titleStyle = (dark: string): React.CSSProperties => ({ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.5rem", color: dark, textAlign: "center", marginBottom: 20 })

// Splits an ISO date into the formal pieces used on the invitation
// card's date block — big month, weekday, day-with-ordinal, year, time.
function formatFormalDate(iso?: string) {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  const day = d.getDate()
  const ordinal = day % 10 === 1 && day !== 11 ? 'st' : day % 10 === 2 && day !== 12 ? 'nd' : day % 10 === 3 && day !== 13 ? 'rd' : 'th'
  return {
    month: d.toLocaleDateString('en-US', { month: 'long' }),
    weekday: d.toLocaleDateString('en-US', { weekday: 'long' }),
    day: String(day), ordinal, year: String(d.getFullYear()),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  }
}

export default function SageLaceTemplate({ couple }: { couple: Couple }) {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#f8f6ee" }} />}>
      <SageLaceInner couple={couple} />
    </Suspense>
  )
}

function SageLaceInner({ couple }: { couple: Couple }) {
  const searchParams = useSearchParams()
  const guestName = searchParams?.get('name') || ''
  const introEnabled = (couple as any).show_guest_intro !== false
  const [showIntro, setShowIntro] = useState(!!guestName && introEnabled)
  const [opened, setOpened] = useState(false)
  const [flapOpen, setFlapOpen] = useState(false)
  const [letterOut, setLetterOut] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const ts = useTextStyles(couple)

  // Real envelope-opening video cover — set per couple from the admin's
  // "Cover Video" uploader (same `cover_video_url` field every other
  // video-intro template already uses). When a couple has one, the video
  // itself IS the open animation: tapping the (unbuttoned) envelope plays
  // it, and the invitation is revealed the instant it finishes. Couples
  // without a video fall back to the plain kraft-envelope cover below.
  const coverVideoUrl = (couple as any).cover_video_url || ''
  const [videoPlaying, setVideoPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const videoEndedRef = useRef(false)

  const PRIMARY = couple.custom_colors?.primary || DEFAULT_PALETTE.primary
  const PRIMARY_LIGHT = couple.custom_colors?.primaryLight || DEFAULT_PALETTE.primaryLight
  const DARK = couple.custom_colors?.dark || DEFAULT_PALETTE.dark
  const CREAM = couple.custom_colors?.cream || DEFAULT_PALETTE.cream
  const MUTED = DEFAULT_PALETTE.muted

  const songUrl = couple.song_url || DEFAULT_SONG_URL

  useEffect(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; audioRef.current = null }
    const audio = new Audio(songUrl)
    audio.loop = true; audio.volume = 0.6; audioRef.current = audio
    return () => { audio.pause(); audio.src = "" }
  }, [songUrl])

  // Tapping the closed envelope swings its four flaps out to the edges,
  // slowly and gently (see the cover below) — and the invitation is
  // mounted right as the flaps finish clearing, so it's sitting there
  // "inside" the moment the paper is gone, with no blank gap in between.
  // Music starts immediately inside this click handler — a real user
  // gesture — so mobile browsers allow it.
  const handleOpen = () => {
    audioRef.current?.play().catch(() => {})
    setFlapOpen(true)
    setTimeout(() => setLetterOut(true), 900)
    setTimeout(() => setOpened(true), 1300)
  }

  // Video-cover open flow: no button anywhere — tapping the envelope
  // itself starts the clip (background music starts at the very same
  // moment, right alongside it), and the invitation opens the moment the
  // video finishes. A generous safety timeout covers the rare case where
  // the `ended` event never fires, so a guest is never left staring at a
  // frozen frame.
  const handleVideoEnded = () => {
    if (videoEndedRef.current) return
    videoEndedRef.current = true
    setOpened(true)
  }
  const handleVideoTap = () => {
    if (videoPlaying) return
    setVideoPlaying(true)
    audioRef.current?.play().catch(() => {})
    videoRef.current?.play().catch(() => handleVideoEnded())
    setTimeout(handleVideoEnded, 15000)
  }

  const EVENT_META: Record<'engagement' | 'wedding' | 'homecoming', { label: string; icon: string }> = {
    engagement: { label: 'Engagement', icon: '💍' }, wedding: { label: 'Wedding Ceremony', icon: '👰' }, homecoming: { label: 'Homecoming', icon: '🏡' },
  }
  type RenderableEvent = { key: 'engagement' | 'wedding' | 'homecoming'; label: string; icon: string; enabled: boolean; venue: string; venue_address: string; date: string; maps_url: string }
  const hasNewEvents = couple.events && Object.keys(couple.events).length > 0
  // Respects the admin's chosen display order (couple.events_order) when
  // set — e.g. showing Wedding before Engagement — falling back to the
  // default engagement → wedding → homecoming order otherwise.
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
    date: couple.wedding_date, couplePhoto: couple.couple_photo || DEFAULT_PHOTO,
    bridePhoto: (couple as any).bride_photo || couple.couple_photo || DEFAULT_PHOTO,
    groomPhoto: (couple as any).groom_photo || couple.couple_photo || DEFAULT_PHOTO,
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

  // The event shown on the cover's formal date/venue block — prefers the
  // "wedding" event itself, falling back to whichever event is enabled.
  const coverEvent = eventsList.find(e => e.key === 'wedding') || eventsList[0]
  const coverFormalDate = formatFormalDate(coverEvent?.date || couple.wedding_date)

  const TINT_SAGE = "#eef2e6"

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", minHeight: "100vh", background: CREAM }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Great+Vibes&family=Inter:wght@300;400;500;600&display=swap');
        @keyframes spin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
        input::placeholder { color: #b5c2ac; }
      `}</style>

      <AnimatePresence>
        {showIntro && guestName && (
          <GuestIntroScreen guestName={guestName} onDone={() => setShowIntro(false)} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} cream={CREAM} />
        )}
      </AnimatePresence>

      <div style={{ maxWidth: 480, margin: "0 auto", background: CREAM, boxShadow: "0 0 80px rgba(0,0,0,0.06)", position: "relative" }}>

        {/* ══ COVER — when this couple has a cover video set, the video
            itself is the whole open animation: no button anywhere, tap
            the envelope and the clip plays, finishing the video reveals
            the invitation. Without one, a plain kraft-paper envelope with
            a gold wax seal (no text at all) is the fallback — tapping it
            opens the flap the same way. ══ */}
        <AnimatePresence>
          {!opened && coverVideoUrl && (
            <motion.div key="cover-video" onClick={handleVideoTap}
              exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } }}
              style={{ minHeight: "100vh", position: "relative", overflow: "hidden", background: "#15200f", cursor: videoPlaying ? "default" : "pointer" }}>
              <video
                ref={videoRef}
                playsInline
                preload="auto"
                poster={COVER_VIDEO_POSTER}
                onEnded={handleVideoEnded}
                style={{
                  position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
                  backgroundImage: `url(${COVER_VIDEO_POSTER})`, backgroundSize: "cover", backgroundPosition: "center",
                }}
              >
                <source src={coverVideoUrl} type="video/mp4" />
              </video>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!opened && !coverVideoUrl && (
            <motion.div key="cover"
              exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } }}
              style={{
                minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative", overflow: "hidden", padding: "10vw",
                background: `radial-gradient(ellipse 80% 55% at 28% 18%, ${PRIMARY}4d, transparent 65%), linear-gradient(155deg, ${DARK}, #1c2518)`,
              }}>

              {/* Soft dappled light, echoing the leaf-shadow in the reference photo */}
              <div style={{
                position: "absolute", inset: 0, opacity: 0.35, mixBlendMode: "multiply", pointerEvents: "none",
                backgroundImage: `linear-gradient(112deg, transparent 22%, #000 24%, transparent 27%), linear-gradient(112deg, transparent 38%, #000 40%, transparent 44%), linear-gradient(112deg, transparent 55%, #000 57%, transparent 62%)`,
              }} />

              <motion.div
                onClick={handleOpen}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: letterOut ? -50 : 0, opacity: letterOut ? 0 : 1, scale: flapOpen ? (letterOut ? 0.93 : 1.03) : 1 }}
                transition={{ duration: letterOut ? 0.6 : 0.7, ease: "easeInOut" }}
                style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 360, perspective: 1100, cursor: flapOpen ? "default" : "pointer" }}>

                {/* Envelope body — kraft/ivory paper with a faint grain,
                    and the two lower corner flaps peeking out underneath,
                    just like the closed envelope in the photo. */}
                <div style={{ position: "relative", aspectRatio: "3 / 2", borderRadius: 4, overflow: "hidden", boxShadow: "0 30px 70px rgba(0,0,0,0.5)" }}>
                  <div style={{ position: "absolute", inset: 0, background: `linear-gradient(170deg, #fdfcf5, ${CREAM})`, backgroundImage: lacePattern(PRIMARY, 0.05), backgroundSize: "46px 46px" }} />
                  <div style={{ position: "absolute", left: 0, bottom: 0, width: "58%", height: "58%", clipPath: "polygon(0 100%, 0 0, 100% 100%)", background: `linear-gradient(135deg, #fdfcf5, #efe8d6)`, boxShadow: `inset 1px 0 0 ${DARK}14` }} />
                  <div style={{ position: "absolute", right: 0, bottom: 0, width: "58%", height: "58%", clipPath: "polygon(100% 100%, 100% 0, 0 100%)", background: `linear-gradient(225deg, #fdfcf5, #efe8d6)`, boxShadow: `inset -1px 0 0 ${DARK}14` }} />
                </div>

                {/* Top flap — hinges open from the envelope's top edge */}
                <motion.div
                  animate={{ rotateX: flapOpen ? -170 : 0 }}
                  transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
                  style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: "64%", zIndex: 2,
                    clipPath: "polygon(0 0, 100% 0, 50% 100%)", transformOrigin: "top center", transformStyle: "preserve-3d",
                    background: `linear-gradient(175deg, #fefdf8, #f7f3e7)`,
                    backgroundImage: lacePattern(PRIMARY, 0.05), backgroundSize: "46px 46px, 100% 100%",
                    boxShadow: "0 8px 18px rgba(0,0,0,0.14)",
                  }}
                />

                {/* Gold wax seal with an embossed leaf sprig, sitting where
                    the flap's point meets the envelope — tap it to open. */}
                <motion.div
                  animate={{ opacity: flapOpen ? 0 : 1, scale: flapOpen ? 0.55 : 1 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 3,
                    width: 54, height: 54, borderRadius: "50%",
                    background: "radial-gradient(circle at 34% 28%, #ecc873, #b5872f)",
                    boxShadow: "0 5px 12px rgba(0,0,0,0.38), inset 0 1px 1px rgba(255,255,255,0.5)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                  <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                    <path d="M12 4c-1.3 2.6-3.6 3.4-3.6 6.6a3.6 3.6 0 007.2 0c0-3.2-2.3-4-3.6-6.6z" fill="#6e4f16" opacity={0.85} />
                    <path d="M12 10.6V19" stroke="#6e4f16" strokeWidth="0.9" opacity={0.7} strokeLinecap="round" />
                    <path d="M12 14l-2.4 1.6M12 16.2l2.4 1.6" stroke="#6e4f16" strokeWidth="0.7" opacity={0.6} strokeLinecap="round" />
                  </svg>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ INVITATION ══ */}
        {opened && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
            style={{ position: "relative" }}>

            <div style={{ background: CREAM, position: "relative", padding: "0 26px" }}>

            {/* Formal invitation card — lace-framed, matching the reference
                design: monogram, "with hearts full of love", parents'
                names, the formal wording, the couple's names in script,
                and the formal date block, all inside one lace-bordered
                panel instead of a separate photo hero + two plain cards. */}
            {/* Horizontal padding here is 16px minus the LaceFrame's own
                11px frame width, so the card's visible white edge lands
                at the same 16px inset as every other section's cardStyle()
                card below it — otherwise the lace frame's border made this
                one card sit narrower than the rest, out of line. */}
            <div style={{ padding: "24px 5px 20px" }}>
              <LaceFrame primary={PRIMARY} primaryLight={PRIMARY_LIGHT} frame={11} radius={24}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={{ padding: "34px 24px 38px", textAlign: "center" }}>
                  <div style={{
                    width: 54, height: 54, borderRadius: "50%", margin: "0 auto 16px", border: `1.4px solid ${PRIMARY}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'Great Vibes',cursive", fontSize: 22, color: PRIMARY,
                  }}>{`${W.bride?.[0] || ''}${W.groom?.[0] || ''}`}</div>

                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.1rem", color: DARK, lineHeight: 1.8, marginBottom: 18 }}>
                    {(couple as any).family_invitation_text || "With hearts full of love and warmth"}
                  </div>

                  {(W.brideFamilyName || W.groomFamilyName) && (
                    <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.9, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {W.groomFamilyName && <><strong style={{ color: DARK }}>{W.groomFamilyName}</strong><br /></>}
                      {W.brideFamilyName && W.groomFamilyName && <span style={{ fontStyle: "italic", textTransform: "none" }}>together with<br /></span>}
                      {W.brideFamilyName && <strong style={{ color: DARK }}>{W.brideFamilyName}</strong>}
                    </div>
                  )}

                  <div style={{ fontSize: 11.5, color: DARK, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 18 }}>
                    invite you to celebrate the marriage of
                  </div>

                  <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: coupleNameFontSize(W.bride), color: PRIMARY, lineHeight: 1.2 }}>{W.bride}</div>
                  <div style={{ margin: "6px auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, maxWidth: 160 }}>
                    <div style={{ flex: 1, height: 1, background: PRIMARY, opacity: 0.4 }} />
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: PRIMARY }} />
                    <div style={{ flex: 1, height: 1, background: PRIMARY, opacity: 0.4 }} />
                  </div>
                  <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: coupleNameFontSize(W.groom), color: PRIMARY, lineHeight: 1.2, marginBottom: 20 }}>{W.groom}</div>

                  {/* A short closing flourish only — no date/time/venue
                      facts here any more, since those are shown fully in
                      the "Save the Date" Events card just below on the
                      page (date, time, venue + maps link); repeating them
                      on this card too just duplicated the same details
                      twice back to back. */}
                  {coverFormalDate && (
                    <div>
                      <div style={{ margin: "0 auto 18px", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, maxWidth: 100 }}>
                        <div style={{ flex: 1, height: 1, background: PRIMARY, opacity: 0.3 }} />
                        <div style={{ width: 4, height: 4, borderRadius: "50%", background: PRIMARY, opacity: 0.6 }} />
                        <div style={{ flex: 1, height: 1, background: PRIMARY, opacity: 0.3 }} />
                      </div>

                      <div style={{ fontSize: 9.5, letterSpacing: "0.3em", textTransform: "uppercase", color: MUTED, marginBottom: 8 }}>
                        {(couple as any).cover_flourish_eyebrow || "With Joy & Love"}
                      </div>
                      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: "1.3rem", letterSpacing: "0.06em", textTransform: "uppercase", color: DARK }}>
                        {(couple as any).cover_flourish_text || "Just Married"}
                      </div>
                      <div style={{ margin: "14px auto 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, maxWidth: 90 }}>
                        <div style={{ flex: 1, height: 1, background: PRIMARY, opacity: 0.3 }} />
                        <div style={{ width: 4, height: 4, borderRadius: "50%", background: PRIMARY, opacity: 0.6 }} />
                        <div style={{ flex: 1, height: 1, background: PRIMARY, opacity: 0.3 }} />
                      </div>
                      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.05rem", color: DARK }}>
                        {(couple as any).cover_flourish_subtext || "Today is the day!"}
                      </div>
                    </div>
                  )}
                </div>
              </LaceFrame>
            </div>

            {/* Events */}
            {eventsList.map(ev => {
              const evDate = new Date(ev.date)
              const evDateDisplay = evDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
              const evTimeDisplay = evDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) + ' Onwards'
              return (
                <motion.div key={ev.key} style={cardStyle(PRIMARY)} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <div style={pretitleStyle(PRIMARY)}>{ev.icon} Save the Date</div>
                  <div style={titleStyle(DARK)}>{ev.label}</div>
                  {[
                    { icon: "📅", label: "Date", val: evDateDisplay, tsKey: '' },
                    { icon: "⏰", label: "Time", val: evTimeDisplay, tsKey: '' },
                    { icon: "📍", label: "Venue", val: ev.venue, sub: ev.venue_address, tsKey: 'venue_name', subTsKey: 'venue_address' },
                  ].map(d => (
                    <div key={d.label} style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "12px 0", borderBottom: `1px solid ${PRIMARY_LIGHT}55` }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${PRIMARY_LIGHT}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>{d.icon}</div>
                      <div>
                        <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#a8b89e" }}>{d.label}</div>
                        <div style={{ ...(d.tsKey ? ts(d.tsKey) : {}), fontSize: 15, color: DARK, fontWeight: 700, marginTop: 2 }}>{d.val}</div>
                        {d.sub && <div style={{ ...((d as any).subTsKey ? ts((d as any).subTsKey) : {}), fontSize: 12, color: MUTED, marginTop: 2 }}>{d.sub}</div>}
                      </div>
                    </div>
                  ))}
                  {ev.maps_url && (
                    <a href={ev.maps_url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: `${PRIMARY_LIGHT}44`, borderRadius: 100, padding: "10px 20px", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: PRIMARY, marginTop: 16, textDecoration: "none", fontWeight: 700 }}>
                      📍 View Location on Maps
                    </a>
                  )}
                </motion.div>
              )
            })}

            {/* Countdown — full-width bordered band, matching Floral Romance */}
            {sv.countdown && (
              <div id="savethedate" style={{ background: "#fff", padding: "1.5rem 1rem", textAlign: "center", borderTop: `1px solid ${PRIMARY_LIGHT}`, borderBottom: `1px solid ${PRIMARY_LIGHT}`, marginBottom: 16 }}>
                <div style={{ ...pretitleStyle(PRIMARY), ...ts('countdown_label') }}>Counting Down to Our Big Day</div>
                <Countdown targetDate={W.date} dark={DARK} tint={TINT_SAGE} />
              </div>
            )}

            {/* RSVP */}
            <div id="rsvp"><RSVP coupleId={couple.id} askDrinking={couple.ask_drinking} primary={PRIMARY} dark={DARK} cream={CREAM} muted={MUTED} guestName={guestName} /></div>

            {/* Timeline */}
            {sv.timeline && W.timeline.length > 0 && (
              <motion.div style={cardStyle(PRIMARY)} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={pretitleStyle(PRIMARY)}>Our Celebration</div>
                <div style={titleStyle(DARK)}>The Wedding Lineup</div>
                <div style={{ position: "relative", paddingLeft: 20 }}>
                  <div style={{ position: "absolute", left: 6, top: 0, bottom: 0, width: 1, background: `${PRIMARY_LIGHT}` }} />
                  {W.timeline.map((t, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                      style={{ position: "relative", padding: "10px 0 10px 20px" }}>
                      <div style={{ position: "absolute", left: -14, top: 14, width: 10, height: 10, borderRadius: "50%", background: PRIMARY, border: "2px solid #fff", boxShadow: `0 0 0 2px ${PRIMARY_LIGHT}` }} />
                      <div style={{ fontSize: 11, fontWeight: 600, color: PRIMARY, letterSpacing: "0.1em" }}>{t.time}</div>
                      <div style={{ fontSize: 13, color: DARK, fontWeight: 500, marginTop: 2 }}>{t.event}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Guest Wishes Wall */}
            {((couple as any).enable_guest_wishes ?? false) && (
              <motion.div id="wishes" style={cardStyle(PRIMARY)} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
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
              <motion.div style={cardStyle(PRIMARY)} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={pretitleStyle(PRIMARY)}>Be Our Guest</div>
                <div style={titleStyle(DARK)}>Find Your Table</div>
                <div style={{ fontSize: 13, color: MUTED, marginBottom: 12, textAlign: "center" }}>Search your name to find your assigned table</div>
                <SeatFinder seats={W.seats} primary={PRIMARY} dark={DARK} cream={CREAM} muted={MUTED} />
              </motion.div>
            )}

            {/* Music */}
            {sv.music && (
              <motion.div style={cardStyle(PRIMARY)} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={pretitleStyle(PRIMARY)}>Our Song</div>
                <MusicPlayerUI title={W.song} artist={W.artist} audioRef={audioRef} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} muted={MUTED} />
              </motion.div>
            )}

            {/* Gallery */}
            {sv.gallery && W.gallery.length > 0 && (
              <motion.div id="gallery" style={cardStyle(PRIMARY)} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={pretitleStyle(PRIMARY)}>Our Story</div>
                <div style={titleStyle(DARK)}>Our Moments</div>
                <div style={{ columnCount: 2, columnGap: 10 }}>
                  {W.gallery.map((src, i) => (
                    <div key={i} style={{ breakInside: "avoid", marginBottom: 10, borderRadius: 16, overflow: "hidden", background: `${PRIMARY_LIGHT}33`, boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" style={{ width: "100%", height: "auto", display: "block" }} onError={e => { (e.currentTarget.closest('div') as HTMLElement).style.display = "none" }} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Thank you */}
            {sv.thank_you && (
              <motion.div style={{ ...cardStyle(PRIMARY), borderRadius: 24 }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={pretitleStyle(PRIMARY)}>A Special Note</div>
                <div style={titleStyle(DARK)}>To Our Lovely Guests</div>
                <div style={{ textAlign: "center", fontSize: 13, color: DARK, lineHeight: 2 }}>
                  {(couple as any).thank_you_text || "With hearts full of love and gratitude, we are so happy to celebrate this beautiful chapter of our lives with you. Thank you for your love, your blessings, and for being part of our journey."}
                </div>
                <div style={{ textAlign: "center", marginTop: 18 }}>
                  <div style={{ fontSize: 11, color: "#a8b89e", letterSpacing: "0.1em" }}>With all our love,</div>
                  <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "1.8rem", color: PRIMARY, marginTop: 4 }}>{W.bride} &amp; {W.groom}</div>
                </div>
              </motion.div>
            )}

            {/* Contact Numbers */}
            {contactList.length > 0 && (
              <motion.div id="contact" style={cardStyle(PRIMARY)} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={pretitleStyle(PRIMARY)}>Get In Touch</div>
                <div style={titleStyle(DARK)}>Contact Numbers</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {contactList.map((c, i) => <ContactRow key={i} name={c.name} phone={c.phone} primary={PRIMARY} />)}
                </div>
              </motion.div>
            )}

            <div style={{ padding: "2rem 1.5rem 6rem", textAlign: "center", background: "#fff", borderTop: `1px solid ${PRIMARY_LIGHT}`, borderRadius: "24px 24px 0 0" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 10, opacity: 0.6 }}>
                <svg width={40} height={40} viewBox="0 0 24 24" fill="none"><path d="M12 2C7 6 4 11 4 15a8 8 0 0016 0c0-4-3-9-8-13z" fill={PRIMARY} /></svg>
              </div>
              <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "1.5rem", color: PRIMARY, marginBottom: 4 }}>InviteGlow</div>
              <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "#a8b89e" }}>inviteglow.com · Digital Wedding Invitations</div>
              {((couple as any).enable_footer_social ?? true) && <FooterSocial color={PRIMARY} background={`${PRIMARY}14`} />}
            </div>
            </div>
          </motion.div>
        )}
      </div>
      {opened && (
        <BottomNavBar
          primary={PRIMARY} dark={DARK}
          mapsUrl={eventsList[0]?.maps_url || couple.maps_url || ''}
          hasWishes={(couple as any).enable_guest_wishes ?? false}
          hasGallery={sv.gallery && W.gallery.length > 0}
          audioRef={audioRef}
        />
      )}

      {/* Fixed embossed lace frame — a plain top-level fixed element, same
          nesting pattern as BottomNavBar above, so it is pinned to the
          screen and never scrolls; only the invitation content underneath
          moves, matching the reference video's border. */}
      {opened && (
        <div aria-hidden style={{
          position: "fixed", top: 0, bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "min(480px, 100%)", display: "flex", justifyContent: "space-between",
          pointerEvents: "none", zIndex: 40,
        }}>
          <div style={{ width: 26, height: "100%", background: EMBOSSED_LACE_BORDER, backgroundSize: "22px 30px" }} />
          <div style={{ width: 26, height: "100%", background: EMBOSSED_LACE_BORDER, backgroundSize: "22px 30px" }} />
        </div>
      )}
    </div>
  )
}
