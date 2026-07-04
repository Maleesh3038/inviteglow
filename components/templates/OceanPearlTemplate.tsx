"use client"
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, Couple } from '@/lib/supabase'

const DEFAULT_PHOTO = "/images/hero-ocean-pearl.png"
const DEFAULT_SONG_URL = "/audio/calm-wedding.mp3"
const DEFAULT_SONG_TITLE = "Calm Wedding Theme"
const DEFAULT_SONG_ARTIST = "InviteGlow"

const DEFAULT_PALETTE = {
  primary: "#d4a857",
  primaryLight: "#f0ead8",
  dark: "#0f3a47",
  cream: "#1d5666",
  muted: "rgba(240,234,216,0.65)",
}

function RisingBubbles({ count = 14, color }: { count?: number; color: string }) {
  const [items, setItems] = useState<{ id: number; left: number; size: number; duration: number; delay: number }[]>([])
  useEffect(() => {
    setItems(Array.from({ length: count }).map((_, i) => ({
      id: i, left: Math.random() * 100, size: 4 + Math.random() * 10,
      duration: 9 + Math.random() * 9, delay: Math.random() * 9,
    })))
  }, [count])
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 1 }}>
      {items.map(b => (
        <div key={b.id} style={{
          position: "absolute", bottom: -20, left: `${b.left}%`, width: b.size, height: b.size, borderRadius: "50%",
          background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.65), ${color}33)`,
          border: `1px solid rgba(255,255,255,0.3)`,
          animation: `bubble-rise ${b.duration}s linear ${b.delay}s infinite`,
        }} />
      ))}
    </div>
  )
}

function Bird({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size * 0.5} viewBox="0 0 40 20" style={{ display: "block" }}>
      <path d="M0 10 Q10 0 20 8 Q30 0 40 10 Q30 6 20 12 Q10 6 0 10 Z" fill={color} opacity="0.85" />
    </svg>
  )
}

function FlyingBirds({ count = 6, color }: { count?: number; color: string }) {
  const [items, setItems] = useState<{ id: number; top: number; size: number; duration: number; delay: number; flip: boolean }[]>([])
  useEffect(() => {
    setItems(Array.from({ length: count }).map((_, i) => ({
      id: i,
      top: 4 + Math.random() * 28,
      size: 18 + Math.random() * 16,
      duration: 14 + Math.random() * 10,
      delay: Math.random() * 6,
      flip: Math.random() > 0.5,
    })))
  }, [count])
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 3 }}>
      {items.map(b => (
        <div key={b.id} style={{
          position: "absolute", top: `${b.top}%`, left: b.flip ? "auto" : "-10%", right: b.flip ? "-10%" : "auto",
          animation: `bird-fly-${b.flip ? "rev" : "fwd"} ${b.duration}s linear ${b.delay}s infinite`,
          transform: b.flip ? "scaleX(-1)" : undefined,
        }}>
          <Bird size={b.size} color={color} />
        </div>
      ))}
    </div>
  )
}

function PearlOrnament({ color, flip }: { color: string; flip?: boolean }) {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" style={{ transform: flip ? "scaleX(-1)" : undefined }}>
      <path d="M4 30 Q4 12 17 8 Q30 12 30 30 Q24 24 17 24 Q10 24 4 30 Z" fill={color} opacity="0.45" />
      <path d="M17 8 L17 24" stroke={color} strokeWidth="0.8" opacity="0.5" />
      <path d="M11 11 L14 23" stroke={color} strokeWidth="0.6" opacity="0.4" />
      <path d="M23 11 L20 23" stroke={color} strokeWidth="0.6" opacity="0.4" />
      <circle cx="6" cy="6" r="2.6" fill={color} opacity="0.6" />
      <circle cx="12" cy="3" r="1.8" fill={color} opacity="0.5" />
    </svg>
  )
}

function Countdown({ targetDate, primary, primaryLight, dark }: { targetDate: string; primary: string; primaryLight: string; dark: string }) {
  const [t, setT] = useState({ d: "00", h: "00", m: "00", s: "00" })
  useEffect(() => {
    const tick = () => {
      const diff = new Date(targetDate).getTime() - Date.now()
      if (diff <= 0) return
      setT({
        d: String(Math.floor(diff / 86400000)).padStart(2, "0"),
        h: String(Math.floor(diff % 86400000 / 3600000)).padStart(2, "0"),
        m: String(Math.floor(diff % 3600000 / 60000)).padStart(2, "0"),
        s: String(Math.floor(diff % 60000 / 1000)).padStart(2, "0"),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  return (
    <div style={{ display: "flex", maxWidth: 360, margin: "0 auto" }}>
      {[["Days", t.d], ["Hours", t.h], ["Mins", t.m], ["Secs", t.s]].map(([l, v]) => (
        <div key={l} style={{ flex: 1, textAlign: "center", padding: "16px 6px" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%", margin: "0 auto 8px",
            background: `linear-gradient(135deg, ${dark}, ${dark}cc)`, border: `1.5px solid ${primary}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 16px ${primary}40`,
          }}>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.25rem", color: primaryLight, fontWeight: 600 }}>{v}</span>
          </div>
          <span style={{ fontSize: 8, letterSpacing: "0.25em", textTransform: "uppercase", color: `${primary}cc` }}>{l}</span>
        </div>
      ))}
    </div>
  )
}

// ── Normalize Maps URLs so they always open in the browser rather than
// trying to deep-link into the Maps app (which fails on some Android devices).
// maps.app.goo.gl short links are wrapped into a google.com redirect. ──
function normalizeMapsUrl(url: string): string {
  if (!url) return '#'
  if (url.includes('maps.app.goo.gl') || url.includes('goo.gl/maps')) {
    return `https://www.google.com/maps?q=${encodeURIComponent(url)}`
  }
  return url
}
function getYouTubeId(url: string): string | null {
  if (!url) return null
  const patterns = [
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

function MusicPlayerUI({ title, artist, songUrl, audioRef, primary, primaryLight, dark }: {
  title: string; artist: string; songUrl: string;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  primary: string; primaryLight: string; dark: string
}) {
  const youtubeId = getYouTubeId(songUrl)
  const [playing, setPlaying] = useState(false)
  const [prog, setProg] = useState(0)

  // ── Regular audio player ──
  useEffect(() => {
    if (youtubeId) return
    const audio = audioRef.current
    if (!audio) return
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onTime = () => { if (audio.duration) setProg((audio.currentTime / audio.duration) * 100) }
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('timeupdate', onTime)
    setPlaying(!audio.paused)
    return () => { audio.removeEventListener('play', onPlay); audio.removeEventListener('pause', onPause); audio.removeEventListener('timeupdate', onTime) }
  }, [audioRef, youtubeId])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) { audio.play().catch(() => {}) } else { audio.pause() }
  }

  // ── YouTube embed ──
  if (youtubeId) {
    return (
      <div style={{ background: `${dark}88`, borderRadius: 14, padding: 16, border: `1px solid ${primary}40` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: `linear-gradient(135deg,${primary},${primaryLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🎵</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{title}</div>
            <div style={{ fontSize: 11, color: `${primary}cc` }}>{artist}</div>
          </div>
        </div>
        <div style={{ borderRadius: 10, overflow: "hidden", aspectRatio: "16/9" }}>
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&rel=0&modestbranding=1&loop=1&playlist=${youtubeId}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
          />
        </div>
      </div>
    )
  }

  // ── Regular audio player ──
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, background: `${dark}88`, borderRadius: 14, padding: 16, border: `1px solid ${primary}40` }}>
      <div style={{ width: 44, height: 44, borderRadius: playing ? "50%" : 10, background: `linear-gradient(135deg,${primary},${primaryLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, animation: playing ? "spin 4s linear infinite" : "none" }}>🎵</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{title}</div>
        <div style={{ fontSize: 11, color: `${primary}cc`, marginTop: 2 }}>{artist}</div>
        <div style={{ height: 3, background: `${primary}26`, borderRadius: 100, marginTop: 8 }}>
          <div style={{ height: "100%", width: `${prog}%`, background: `linear-gradient(to right,${primary},${primaryLight})`, borderRadius: 100, transition: "width 0.3s" }} />
        </div>
      </div>
      <button onClick={toggle} style={{ width: 38, height: 38, borderRadius: "50%", background: primary, border: "none", color: dark, cursor: "pointer", fontSize: 13, flexShrink: 0, fontWeight: 700 }}>
        {playing ? "⏸" : "▶"}
      </button>
    </div>
  )
}

function RSVP({ coupleId, askDrinking, primary, primaryLight, dark }: { coupleId: string; askDrinking: boolean; primary: string; primaryLight: string; dark: string }) {
  const [name, setName] = useState("")
  const [guestCount, setGuestCount] = useState(1)
  const [step, setStep] = useState<"form" | "count" | "drinking" | "done">("form")
  const [finalResponse, setFinalResponse] = useState<"yes" | "no">("yes")
  const [saving, setSaving] = useState(false)

  const save = async (response: "yes" | "no", drinking: "yes" | "no" | null, count: number) => {
    setSaving(true)
    const { error } = await supabase.from('rsvps').insert([{ couple_id: coupleId, guest_name: name.trim(), response, drinking, guest_count: count }])
    setSaving(false)
    if (!error) { setFinalResponse(response); setStep("done") }
  }
  const handleAccept = () => { if (name.trim()) setStep("count") }
  const handleDecline = () => { if (name.trim()) save("no", null, 1) }
  const handleCountNext = () => { if (askDrinking) setStep("drinking"); else save("yes", null, guestCount) }

  const inputStyle: React.CSSProperties = { width: "100%", padding: "13px 16px", borderRadius: 10, border: `1px solid ${primary}40`, background: dark, color: "#fff", fontSize: 14, outline: "none", marginBottom: 12, fontFamily: "'Inter',sans-serif" }

  return (
    <div style={{ background: `${dark}cc`, borderRadius: 20, padding: 24, border: `1px solid ${primary}40` }}>
      {step === "form" && (
        <>
          <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: primary, marginBottom: 8, fontWeight: 600, textAlign: "center" }}>Kindly RSVP</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.6rem", color: "#fff", marginBottom: 16, textAlign: "center" }}>Will You Join Us?</div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" style={inputStyle} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button onClick={handleAccept} style={{ padding: 13, borderRadius: 10, background: `linear-gradient(135deg,${primary},${primaryLight})`, color: dark, border: "none", cursor: "pointer", fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>♥ Joyfully Accepts</button>
            <button onClick={handleDecline} disabled={saving} style={{ padding: 13, borderRadius: 10, background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", fontSize: 10, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", opacity: saving ? 0.6 : 1 }}>
              {saving ? "..." : "Regretfully Declines"}
            </button>
          </div>
        </>
      )}
      {step === "count" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ fontSize: 13, color: "#fff", fontWeight: 600, marginBottom: 16, textAlign: "center" }}>How many people, including you?</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 16 }}>
            <button onClick={() => setGuestCount(c => Math.max(1, c - 1))} style={{ width: 36, height: 36, borderRadius: "50%", background: `${primary}26`, color: primary, border: "none", cursor: "pointer", fontSize: 16 }}>−</button>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.8rem", color: "#fff", minWidth: 40, textAlign: "center" }}>{guestCount}</div>
            <button onClick={() => setGuestCount(c => Math.min(20, c + 1))} style={{ width: 36, height: 36, borderRadius: "50%", background: `${primary}26`, color: primary, border: "none", cursor: "pointer", fontSize: 16 }}>+</button>
          </div>
          <button onClick={handleCountNext} disabled={saving} style={{ width: "100%", padding: 13, borderRadius: 10, background: `linear-gradient(135deg,${primary},${primaryLight})`, color: dark, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, opacity: saving ? 0.6 : 1 }}>
            {saving ? "..." : "Continue →"}
          </button>
        </motion.div>
      )}
      {step === "drinking" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 14, textAlign: "center" }}>Will you be having alcohol?</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button onClick={() => save("yes", "yes", guestCount)} disabled={saving} style={{ padding: 13, borderRadius: 10, background: `${primary}1a`, color: primary, border: `1px solid ${primary}55`, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>🍷 Yes</button>
            <button onClick={() => save("yes", "no", guestCount)} disabled={saving} style={{ padding: 13, borderRadius: 10, background: `${primary}1a`, color: primary, border: `1px solid ${primary}55`, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>🥤 No</button>
          </div>
        </motion.div>
      )}
      {step === "done" && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>{finalResponse === "yes" ? "🎉" : "💙"}</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.3rem", color: primary, marginBottom: 4 }}>
            {finalResponse === "yes" ? `See you there, ${name}!` : `We'll miss you, ${name}.`}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
            {finalResponse === "yes"
              ? (guestCount > 1 ? `Party of ${guestCount} confirmed!` : "We can't wait to celebrate with you.")
              : "Thank you for letting us know."}
          </div>
        </motion.div>
      )}
    </div>
  )
}

function SeatFinder({ seats, primary, primaryLight, dark }: { seats: Record<string, string>; primary: string; primaryLight: string; dark: string }) {
  const [q, setQ] = useState("")
  const [res, setRes] = useState("")
  const search = () => {
    const query = q.trim().toLowerCase()
    if (!query) { setRes("Please enter your name."); return }
    const found = Object.keys(seats || {}).find(k => query.includes(k) || k.includes(query))
    setRes(found ? `🦪 You are seated at ${seats[found]}` : "Name not found. Please contact the couple.")
  }
  return (
    <div>
      <div style={{ display: "flex", gap: 10 }}>
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && search()}
          placeholder="Enter your name..." style={{ flex: 1, padding: "13px 16px", borderRadius: 10, border: `1px solid ${primary}40`, background: dark, color: "#fff", fontSize: 14, outline: "none", fontFamily: "'Inter',sans-serif" }} />
        <button onClick={search} style={{ padding: "13px 20px", borderRadius: 10, background: `linear-gradient(135deg,${primary},${primaryLight})`, color: dark, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Search</button>
      </div>
      {res && <div style={{ marginTop: 12, fontSize: 14, color: res.startsWith("🦪") ? primary : "rgba(255,255,255,0.55)", fontWeight: res.startsWith("🦪") ? 600 : 400 }}>{res}</div>}
    </div>
  )
}

const sectionCard = (cream: string, primary: string): React.CSSProperties => ({
  background: `${cream}cc`, margin: "0 16px 16px", borderRadius: 22, padding: "1.8rem", border: `1px solid ${primary}33`, position: "relative",
})
const sectionEyebrow = (primary: string): React.CSSProperties => ({ fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color: primary, textAlign: "center", marginBottom: 6, fontWeight: 600 })
const sectionTitle = (): React.CSSProperties => ({ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.5rem", color: "#fff", textAlign: "center", marginBottom: 20 })

export default function OceanPearlTemplate({ couple }: { couple: Couple }) {
  const [opened, setOpened] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const PRIMARY = couple.custom_colors?.primary || DEFAULT_PALETTE.primary
  const PRIMARY_LIGHT = couple.custom_colors?.primaryLight || DEFAULT_PALETTE.primaryLight
  const DARK = couple.custom_colors?.dark || DEFAULT_PALETTE.dark
  const CREAM = couple.custom_colors?.cream || DEFAULT_PALETTE.cream
  const MUTED = DEFAULT_PALETTE.muted

  useEffect(() => {
    const songUrl = couple.song_url || DEFAULT_SONG_URL
    if (getYouTubeId(songUrl)) return
    const audio = new Audio()
    audio.crossOrigin = "anonymous"
    audio.src = songUrl
    audio.loop = true
    audio.volume = 0.6
    audio.preload = "auto"
    audioRef.current = audio
    return () => { audio.pause(); audio.src = "" }
  }, [couple])

  const handleOpenInvitation = () => {
    setOpened(true)
    const songUrl = couple.song_url || DEFAULT_SONG_URL
    if (!getYouTubeId(songUrl)) {
      const audio = audioRef.current
      if (!audio) return
      // Try play — if CORS blocks it, reload without crossOrigin and retry
      audio.play().catch(() => {
        const fallback = new Audio(songUrl)
        fallback.loop = true
        fallback.volume = 0.6
        audioRef.current = fallback
        fallback.play().catch(() => {})
      })
    }
  }

  const EVENT_META: Record<'engagement' | 'wedding' | 'homecoming', { label: string; icon: string }> = {
    engagement: { label: 'Engagement', icon: '💍' },
    wedding: { label: 'Wedding Ceremony', icon: '👰' },
    homecoming: { label: 'Homecoming', icon: '🏡' },
  }
  type RenderableEvent = { key: 'engagement' | 'wedding' | 'homecoming'; label: string; icon: string; enabled: boolean; venue: string; venue_address: string; date: string; maps_url: string }

  const hasNewEvents = couple.events && Object.keys(couple.events).length > 0
  const eventsList: RenderableEvent[] = hasNewEvents
    ? (['engagement', 'wedding', 'homecoming'] as const)
        .map((key): RenderableEvent => {
          const e = couple.events![key]
          return {
            key, ...EVENT_META[key],
            enabled: e?.enabled ?? false,
            venue: e?.venue ?? '',
            venue_address: e?.venue_address ?? '',
            date: e?.date ?? '',
            maps_url: e?.maps_url ?? '',
          }
        })
        .filter(e => e.enabled && e.date.length > 0)
    : (couple.wedding_date
        ? [{ key: 'wedding', ...EVENT_META.wedding, enabled: true, venue: couple.venue || '', venue_address: couple.venue_address || '', date: couple.wedding_date, maps_url: couple.maps_url || '' }]
        : [])

  const sv = {
    gallery: couple.section_visibility?.gallery ?? true,
    countdown: couple.section_visibility?.countdown ?? true,
    timeline: couple.section_visibility?.timeline ?? true,
    seat_finder: couple.section_visibility?.seat_finder ?? true,
    music: couple.section_visibility?.music ?? true,
    thank_you: couple.section_visibility?.thank_you ?? true,
  }

  const W = {
    bride: couple.bride,
    groom: couple.groom,
    brideFamilyName: couple.bride_family || '',
    groomFamilyName: couple.groom_family || '',
    date: couple.wedding_date,
    dateDisplay: new Date(couple.wedding_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    couplePhoto: couple.couple_photo || DEFAULT_PHOTO,
    song: couple.song_title || DEFAULT_SONG_TITLE,
    artist: couple.song_artist || DEFAULT_SONG_ARTIST,
    songUrl: couple.song_url || DEFAULT_SONG_URL,
    timeline: couple.timeline || [],
    seats: couple.seats || {},
    gallery: couple.gallery || [],
  }

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", minHeight: "100vh", background: DARK }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
        @keyframes spin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
        @keyframes bubble-rise {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          12% { opacity: 0.8; }
          88% { opacity: 0.8; }
          100% { transform: translateY(-105vh) translateX(12px); opacity: 0; }
        }
        @keyframes bird-fly-fwd { 0% { left: -10%; } 100% { left: 110%; } }
        @keyframes bird-fly-rev { 0% { right: -10%; } 100% { right: 110%; } }
        @keyframes pulse-pearl { 0%,100%{box-shadow:0 0 0 0 rgba(212,168,87,0.35);} 50%{box-shadow:0 0 0 14px rgba(212,168,87,0);} }
        input::placeholder { color: rgba(255,255,255,0.35); }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto", background: DARK, boxShadow: "0 0 100px rgba(0,0,0,0.5)", position: "relative", overflow: "hidden" }}>

        {/* ══ COVER ══ */}
        <AnimatePresence>
          {!opened && (
            <motion.div key="cover" exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.5 }}
              style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", background: DARK }}>

              {/* ── FIXED: use W.couplePhoto so uploaded photo shows on cover,
                  with DEFAULT_PHOTO as the fallback if no photo uploaded ── */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={W.couplePhoto} alt=""
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                onError={e => { (e.currentTarget as HTMLImageElement).src = DEFAULT_PHOTO }} />
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(10,25,30,0.4) 0%, rgba(10,25,30,0.15) 35%, rgba(10,25,30,0.3) 65%, rgba(10,25,30,0.65) 100%)` }} />

              <RisingBubbles count={14} color={PRIMARY_LIGHT} />
              <FlyingBirds count={6} color="rgba(255,255,255,0.8)" />

              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
                style={{ textAlign: "center", width: "84%", maxWidth: 340, position: "relative", zIndex: 10, padding: "0 1rem" }}>

                <div style={{
                  width: 76, height: 76, borderRadius: "50%", margin: "0 auto 1rem",
                  background: "rgba(255,255,255,0.12)", backdropFilter: "blur(6px)",
                  border: `1.5px solid ${PRIMARY_LIGHT}`, display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 4px 20px rgba(0,0,0,0.3)`,
                }}>
                  <span style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.6rem", color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
                    {W.bride.charAt(0)}<span style={{ color: PRIMARY_LIGHT, fontSize: "1rem" }}> / </span>{W.groom.charAt(0)}
                  </span>
                </div>

                <div style={{ fontSize: 9, letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", marginBottom: "0.5rem", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>Together with their families</div>

                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)", borderRadius: 100, padding: "6px 14px", fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "#fff", marginBottom: "1.2rem", border: "1px solid rgba(255,255,255,0.25)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: PRIMARY_LIGHT, display: "inline-block" }} />
                  Wedding Invitation
                </div>
                <div style={{ fontSize: 10, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(255,255,255,0.75)", marginBottom: "0.8rem", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>You Are Invited</div>
                <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "clamp(2.8rem,10vw,4rem)", color: "#fff", lineHeight: 1, textShadow: "0 4px 24px rgba(0,0,0,0.5)" }}>{W.bride}</div>
                <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "2.3rem", color: PRIMARY_LIGHT, margin: "0.1rem 0", textShadow: "0 2px 14px rgba(0,0,0,0.4)" }}>&amp;</div>
                <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "clamp(2.8rem,10vw,4rem)", color: "#fff", lineHeight: 1, textShadow: "0 4px 24px rgba(0,0,0,0.5)" }}>{W.groom}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", margin: "1.1rem 0" }}>
                  <div style={{ height: 1, width: 36, background: "rgba(255,255,255,0.4)" }} />
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: PRIMARY_LIGHT }} />
                  <div style={{ height: 1, width: 36, background: "rgba(255,255,255,0.4)" }} />
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.88)", lineHeight: 1.7, marginBottom: "1.6rem", textShadow: "0 2px 10px rgba(0,0,0,0.4)" }}>
                  {couple.intro_text || "Where the tide meets eternity, we begin our forever"}
                </div>
                <button onClick={handleOpenInvitation} style={{
                  display: "inline-flex", alignItems: "center", gap: 10,
                  background: `linear-gradient(135deg,${PRIMARY},${PRIMARY_LIGHT})`, color: DARK,
                  border: "none", borderRadius: 100, padding: "13px 28px",
                  fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase",
                  cursor: "pointer", fontFamily: "'Inter',sans-serif", fontWeight: 700,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                  animation: "pulse-pearl 2.5s ease infinite",
                }}>
                  You're Invited →
                </button>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", marginTop: 12, letterSpacing: "0.05em", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
                  🎵 Tap to begin — with music
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ INVITATION ══ */}
        {opened && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>

            <RisingBubbles count={10} color={PRIMARY_LIGHT} />

            {/* Hero */}
            <div style={{ position: "relative", height: 480, overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(160deg,${CREAM},${DARK})` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={W.couplePhoto} alt={`${W.bride} and ${W.groom}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }}
                  onError={e => { (e.currentTarget as HTMLImageElement).src = DEFAULT_PHOTO }} />
              </div>
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top,${DARK} 0%,rgba(15,58,71,0.15) 60%,rgba(15,58,71,0.4) 100%)` }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "2rem 1.5rem", textAlign: "center", zIndex: 5 }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <div style={{ fontSize: 9, letterSpacing: "0.5em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: "0.8rem" }}>Together with their families</div>
                  <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "clamp(2.6rem,9vw,4.2rem)", color: "#fff", lineHeight: 1, textShadow: "0 2px 20px rgba(0,0,0,0.4)" }}>
                    {W.bride}
                    <span style={{ display: "block", fontSize: "2rem", color: PRIMARY_LIGHT }}>&amp;</span>
                    {W.groom}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", margin: "4px 0", letterSpacing: "0.1em" }}>are getting married</div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
                    <a href="#rsvp" style={{ background: `linear-gradient(135deg,${PRIMARY},${PRIMARY_LIGHT})`, color: DARK, borderRadius: 100, padding: "10px 22px", fontSize: 11, letterSpacing: "0.15em", textDecoration: "none", fontFamily: "'Inter',sans-serif", fontWeight: 700 }}>RSVP</a>
                    <a href={normalizeMapsUrl(eventsList[0]?.maps_url || couple.maps_url || '')} target="_blank" rel="noopener noreferrer" onClick={e => {
                      const url = eventsList[0]?.maps_url || couple.maps_url
                      if (url) {
                        e.preventDefault()
                        window.open(normalizeMapsUrl(url), '_blank', 'noopener,noreferrer')
                      }
                    }} style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(8px)", color: PRIMARY_LIGHT, border: `1.5px solid ${PRIMARY_LIGHT}`, borderRadius: 100, padding: "10px 22px", fontSize: 11, letterSpacing: "0.15em", textDecoration: "none", fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>Location</a>
                  </div>
                </motion.div>
              </div>
            </div>

            {(W.brideFamilyName || W.groomFamilyName) && (
              <motion.div style={sectionCard(CREAM, PRIMARY)} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={sectionEyebrow(PRIMARY)}>With Love</div>
                <div style={{ textAlign: "center", padding: 12, background: "rgba(255,255,255,0.05)", borderRadius: 12, fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 2 }}>
                  {W.brideFamilyName && <><strong style={{ color: "#fff" }}>{W.brideFamilyName}</strong><br /></>}
                  {W.brideFamilyName && W.groomFamilyName && <>together with<br /></>}
                  {W.groomFamilyName && <><strong style={{ color: "#fff" }}>{W.groomFamilyName}</strong><br /></>}
                  <span style={{ color: MUTED }}>request the honour of your presence<br />to celebrate the marriage of their loving children</span>
                </div>
              </motion.div>
            )}

            {eventsList.map((ev, idx) => {
              const evDate = new Date(ev.date)
              const evDateDisplay = evDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
              const evTimeDisplay = evDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) + ' Onwards'
              return (
                <motion.div key={ev.key} id={idx === 0 ? "location" : undefined} style={sectionCard(CREAM, PRIMARY)} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <div style={{ position: "absolute", bottom: 10, right: 10, opacity: 0.4 }}><PearlOrnament color={PRIMARY} flip /></div>
                  <div style={sectionEyebrow(PRIMARY)}>{ev.icon} Save the Date</div>
                  <div style={sectionTitle()}>{ev.label}</div>
                  {[
                    { icon: "📅", label: "Date", val: evDateDisplay, gold: true },
                    { icon: "⏰", label: "Time", val: evTimeDisplay },
                    { icon: "📍", label: "Venue", val: ev.venue, sub: ev.venue_address },
                  ].map(d => d.val && (
                    <div key={d.label} style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "12px 0", borderBottom: `1px solid ${PRIMARY}26` }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${PRIMARY}26`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>{d.icon}</div>
                      <div>
                        <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>{d.label}</div>
                        <div style={{ fontSize: 14, color: "#fff", fontWeight: 700, marginTop: 2 }}>{d.val}</div>
                        {d.sub && <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{d.sub}</div>}
                      </div>
                    </div>
                  ))}
                  {ev.maps_url && (
                    <a href={normalizeMapsUrl(ev.maps_url)} target="_blank" rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: `${PRIMARY}26`, borderRadius: 100, padding: "10px 20px", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: PRIMARY_LIGHT, marginTop: 16, textDecoration: "none", fontWeight: 500 }}>
                      📍 View Location on Maps
                    </a>
                  )}
                </motion.div>
              )
            })}

            {sv.countdown && (
              <div style={{ background: `${CREAM}cc`, padding: "1.8rem 1rem 1.5rem", textAlign: "center", margin: "0 16px 16px", borderRadius: 22, border: `1px solid ${PRIMARY}33` }}>
                <div style={{ fontSize: 9, letterSpacing: "0.35em", textTransform: "uppercase", color: PRIMARY_LIGHT, marginBottom: 4 }}>Counting Down to</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontWeight: 600, fontSize: "1.4rem", color: "#fff", marginBottom: 18 }}>Our Big Day</div>
                <div style={{ position: "relative", width: 150, height: 150, margin: "0 auto 20px" }}>
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: "50%",
                    background: `conic-gradient(${PRIMARY_LIGHT}, ${PRIMARY}, ${PRIMARY_LIGHT})`,
                    padding: 4,
                  }}>
                    <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", border: `2px solid ${DARK}` }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={W.couplePhoto} alt={`${W.bride} and ${W.groom}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={e => { (e.currentTarget as HTMLImageElement).src = DEFAULT_PHOTO }} />
                    </div>
                  </div>
                  <div style={{ position: "absolute", bottom: -4, left: -8 }}><PearlOrnament color={PRIMARY_LIGHT} /></div>
                  <div style={{ position: "absolute", bottom: -4, right: -8 }}><PearlOrnament color={PRIMARY_LIGHT} flip /></div>
                </div>
                <Countdown targetDate={W.date} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} />
              </div>
            )}

            <div id="rsvp" style={{ margin: "0 16px 16px" }}>
              <RSVP coupleId={couple.id} askDrinking={couple.ask_drinking} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} />
            </div>

            {sv.timeline && W.timeline.length > 0 && (
              <motion.div style={sectionCard(CREAM, PRIMARY)} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={sectionEyebrow(PRIMARY)}>Our Celebration</div>
                <div style={sectionTitle()}>Event Timeline</div>
                <div style={{ display: "grid", gap: 12 }}>
                  {W.timeline.map((t, i) => {
                    const label = t.event.toLowerCase()
                    const icon = label.includes('ceremon') ? '🪷'
                      : label.includes('reception') || label.includes('cocktail') || label.includes('drink') ? '🥂'
                      : label.includes('dinner') || label.includes('lunch') ? '🍽️'
                      : label.includes('danc') ? '💃'
                      : label.includes('music') || label.includes('band') || label.includes('dj') ? '🎵'
                      : label.includes('party') || label.includes('after') ? '✨'
                      : label.includes('away') || label.includes('depart') ? '👋'
                      : '⏰'
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                        style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 0", borderBottom: i < W.timeline.length - 1 ? `1px solid ${PRIMARY}1f` : "none" }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                          background: `linear-gradient(135deg, ${PRIMARY_LIGHT}33, ${PRIMARY}26)`,
                          border: `1.5px solid ${PRIMARY}55`,
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                        }}>{icon}</div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: PRIMARY_LIGHT, letterSpacing: "0.08em" }}>{t.time}</div>
                          <div style={{ fontSize: 13, color: "#fff", fontWeight: 500, marginTop: 1 }}>{t.event}</div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {sv.seat_finder && couple.show_seating && Object.keys(W.seats).length > 0 && (
              <motion.div style={sectionCard(CREAM, PRIMARY)} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={sectionEyebrow(PRIMARY)}>Be Our Guest</div>
                <div style={sectionTitle()}>Find Your Table</div>
                <div style={{ fontSize: 13, color: MUTED, marginBottom: 12, textAlign: "center" }}>Search your name to find your assigned table</div>
                <SeatFinder seats={W.seats} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} />
              </motion.div>
            )}

            {sv.music && (
              <motion.div style={sectionCard(CREAM, PRIMARY)} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={sectionEyebrow(PRIMARY)}>Our Song</div>
                <MusicPlayerUI title={W.song} artist={W.artist} songUrl={W.songUrl} audioRef={audioRef} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} />
              </motion.div>
            )}

            {sv.gallery && W.gallery.length > 0 && (
              <motion.div style={sectionCard(CREAM, PRIMARY)} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={sectionEyebrow(PRIMARY)}>Our Story</div>
                <div style={sectionTitle()}>Moments Together</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {W.gallery.map((src, i) => (
                    <div key={i} style={{ gridRow: i === 0 ? "span 2" : undefined, borderRadius: 16, overflow: "hidden", background: `${PRIMARY}1a`, aspectRatio: i === 0 ? "1/2" : "1/1" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => (e.currentTarget.style.display = "none")} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {sv.thank_you && (
              <motion.div style={sectionCard(CREAM, PRIMARY)} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={sectionEyebrow(PRIMARY)}>A Special Note</div>
                <div style={sectionTitle()}>To Our Lovely Guests</div>
                <div style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 2 }}>
                  With hearts full of love and gratitude, we are so happy to celebrate this beautiful chapter of our lives with you. Your presence means more to us than words can truly express.
                  <br /><br />
                  Thank you for your love, your blessings, and for being part of our journey.
                </div>
                <div style={{ textAlign: "center", marginTop: 16 }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>With all our love,</div>
                  <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "1.7rem", color: PRIMARY_LIGHT, marginTop: 4 }}>{W.bride} &amp; {W.groom}</div>
                </div>
              </motion.div>
            )}

            <div style={{ padding: "2rem 1.5rem", textAlign: "center", background: DARK, borderTop: `1px solid ${PRIMARY}33` }}>
              <div style={{ fontSize: 18, marginBottom: 10, opacity: 0.5 }}>🦪 🫧 🦪</div>
              <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "1.5rem", color: PRIMARY_LIGHT, marginBottom: 4 }}>InviteGlow</div>
              <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>inviteglow.com · Digital Wedding Invitations</div>
            </div>

          </motion.div>
        )}
      </div>
    </div>
  )
}
