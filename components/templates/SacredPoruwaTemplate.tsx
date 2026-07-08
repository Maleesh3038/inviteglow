"use client"
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, Couple } from '@/lib/supabase'

const DEFAULT_PHOTO = "/images/hero-sacred-poruwa.png"
const DEFAULT_COVER_VIDEO = "https://eqacrwhbrfqcnlgegvtl.supabase.co/storage/v1/object/public/wedding-photos/videos/sacred-poruwa-cover.mp4"
const DEFAULT_SONG_URL = "/audio/calm-wedding.mp3"
const DEFAULT_SONG_TITLE = "Calm Wedding Theme"
const DEFAULT_SONG_ARTIST = "InviteGlow"

const DEFAULT_PALETTE = {
  primary: "#c4956a",
  primaryLight: "#e8c99a",
  dark: "#3d2510",
  cream: "#fdf6e9",
  muted: "#9a7a5a",
}

function normalizeMapsUrl(url: string): string {
  if (!url) return '#'
  if (url.includes('maps.app.goo.gl') || url.includes('goo.gl/maps')) {
    return `https://www.google.com/maps?q=${encodeURIComponent(url)}`
  }
  return url
}

// ── Animated golden firefly/light-orb particles — the signature ambient
// element of this template. Warm golden orbs drifting slowly upward,
// mimicking the candlelight and firefly atmosphere of the reference image. ──
function GoldenParticles({ count = 18, color }: { count?: number; color: string }) {
  const [items, setItems] = useState<{ id: number; left: number; size: number; duration: number; delay: number; drift: number }[]>([])
  useEffect(() => {
    setItems(Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: 5 + Math.random() * 90,
      size: 3 + Math.random() * 5,
      duration: 6 + Math.random() * 8,
      delay: Math.random() * 8,
      drift: (Math.random() - 0.5) * 40,
    })))
  }, [count])
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 3 }}>
      {items.map(p => (
        <div key={p.id} style={{
          position: "absolute", bottom: -10, left: `${p.left}%`,
          width: p.size, height: p.size, borderRadius: "50%",
          background: `radial-gradient(circle at 35% 35%, #fff8e0, ${color})`,
          boxShadow: `0 0 ${p.size * 2}px ${p.size}px ${color}88`,
          animation: `orb-rise-${p.id % 3} ${p.duration}s ease-in ${p.delay}s infinite`,
        }} />
      ))}
      <style>{`
        @keyframes orb-rise-0 {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          15% { opacity: 0.9; }
          85% { opacity: 0.7; }
          100% { transform: translateY(-105vh) translateX(${Math.random() > 0.5 ? 30 : -30}px); opacity: 0; }
        }
        @keyframes orb-rise-1 {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          20% { opacity: 0.8; }
          80% { opacity: 0.6; }
          100% { transform: translateY(-105vh) translateX(-20px); opacity: 0; }
        }
        @keyframes orb-rise-2 {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 0.5; }
          100% { transform: translateY(-105vh) translateX(15px); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

// ── Lotus SVG — white lotus with layered petals + golden center ──
function LotusIcon({ color, size = 60, opacity = 0.8 }: { color: string; size?: number; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{ opacity, display: "block" }}>
      <path d="M60 95 C38 82 18 64 14 42 C28 62 44 80 58 92 Z" fill={color} stroke={color} strokeWidth="0.6" opacity="0.55"/>
      <path d="M60 95 C82 82 102 64 106 42 C92 62 76 80 62 92 Z" fill={color} stroke={color} strokeWidth="0.6" opacity="0.55"/>
      <path d="M60 95 C42 78 36 55 40 34 C46 54 52 76 60 95 Z" fill={color} stroke={color} strokeWidth="0.6" opacity="0.62"/>
      <path d="M60 95 C78 78 84 55 80 34 C74 54 68 76 60 95 Z" fill={color} stroke={color} strokeWidth="0.6" opacity="0.62"/>
      <path d="M60 95 C52 72 52 48 60 28 C68 48 68 72 60 95 Z" fill={color} stroke={color} strokeWidth="0.7" opacity="0.68"/>
      <path d="M60 93 C46 78 40 58 44 38 C49 57 54 77 60 93 Z" fill={color} stroke={color} strokeWidth="0.7" opacity="0.78"/>
      <path d="M60 93 C74 78 80 58 76 38 C71 57 66 77 60 93 Z" fill={color} stroke={color} strokeWidth="0.7" opacity="0.78"/>
      <path d="M60 91 C50 76 48 58 52 40 C55 57 57 76 60 91 Z" fill={color} opacity="0.9"/>
      <path d="M60 91 C70 76 72 58 68 40 C65 57 63 76 60 91 Z" fill={color} opacity="0.9"/>
      <path d="M60 96 C44 88 30 78 22 66 C36 78 48 88 60 97 Z" fill="#88c860" opacity="0.5"/>
      <path d="M60 96 C76 88 90 78 98 66 C84 78 72 88 60 97 Z" fill="#88c860" opacity="0.5"/>
      <ellipse cx="60" cy="92" rx="12" ry="7" fill="#f0c840" opacity="0.9"/>
      <circle cx="56" cy="90" r="2" fill="#c89020" opacity="0.8"/>
      <circle cx="60" cy="88" r="2" fill="#c89020" opacity="0.8"/>
      <circle cx="64" cy="90" r="2" fill="#c89020" opacity="0.8"/>
      <line x1="56" y1="90" x2="54" y2="83" stroke="#e8c038" strokeWidth="0.7" opacity="0.8"/>
      <circle cx="54" cy="82" r="1.2" fill="#f0d050"/>
      <line x1="60" y1="88" x2="60" y2="80" stroke="#e8c038" strokeWidth="0.7" opacity="0.8"/>
      <circle cx="60" cy="79" r="1.2" fill="#f0d050"/>
      <line x1="64" y1="90" x2="66" y2="83" stroke="#e8c038" strokeWidth="0.7" opacity="0.8"/>
      <circle cx="66" cy="82" r="1.2" fill="#f0d050"/>
    </svg>
  )
}

// ── Mandala corner ornament ──
function MandalaCorner({ color, size = 80, flip = false, flipY = false }: { color: string; size?: number; flip?: boolean; flipY?: boolean }) {
  const tx = flip ? "scaleX(-1)" : ""
  const ty = flipY ? "scaleY(-1)" : ""
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ opacity: 0.28, transform: `${tx} ${ty}`, display: "block" }}>
      <circle cx="10" cy="10" r="28" fill="none" stroke={color} strokeWidth="0.8"/>
      <circle cx="10" cy="10" r="20" fill="none" stroke={color} strokeWidth="0.6"/>
      <circle cx="10" cy="10" r="14" fill="none" stroke={color} strokeWidth="0.5"/>
      {[0,30,60,90,120,150,180,210,240,270,300,330].map((a, i) => (
        <line key={i}
          x1={10 + 14 * Math.cos(a * Math.PI/180)}
          y1={10 + 14 * Math.sin(a * Math.PI/180)}
          x2={10 + 28 * Math.cos(a * Math.PI/180)}
          y2={10 + 28 * Math.sin(a * Math.PI/180)}
          stroke={color} strokeWidth="0.5" />
      ))}
      {[0,45,90,135,180,225,270,315].map((a, i) => (
        <circle key={i} cx={10 + 24 * Math.cos(a * Math.PI/180)} cy={10 + 24 * Math.sin(a * Math.PI/180)} r="1.5" fill={color} opacity="0.7"/>
      ))}
      <path d="M10 10 Q30 5 45 25 Q35 40 20 38 Q8 35 10 10 Z" fill={color} opacity="0.08"/>
      <path d="M10 10 Q5 30 25 45 Q40 35 38 20 Q35 8 10 10 Z" fill={color} opacity="0.08"/>
    </svg>
  )
}

// ── Countdown ──
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
    <div style={{ display: "flex", maxWidth: 380, margin: "0 auto", gap: 8 }}>
      {[["Days", t.d], ["Hours", t.h], ["Mins", t.m], ["Secs", t.s]].map(([l, v]) => (
        <div key={l} style={{ flex: 1, textAlign: "center" }}>
          <div style={{
            borderRadius: 14, background: `linear-gradient(145deg,${primaryLight}44,${primary}22)`,
            border: `1.5px solid ${primary}66`, padding: "12px 4px",
            boxShadow: `0 4px 16px ${primary}22`,
          }}>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.6rem", color: dark, fontWeight: 600 }}>{v}</span>
          </div>
          <span style={{ fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: `${primary}bb`, display: "block", marginTop: 6 }}>{l}</span>
        </div>
      ))}
    </div>
  )
}

// ── YouTube detect ──
function getYouTubeId(url: string): string | null {
  if (!url) return null
  const patterns = [/youtu\.be\/([^?&]+)/, /youtube\.com\/watch\?v=([^&]+)/, /youtube\.com\/embed\/([^?&]+)/, /youtube\.com\/shorts\/([^?&]+)/]
  for (const p of patterns) { const m = url.match(p); if (m) return m[1] }
  return null
}

// ── Music Player ──
function MusicPlayerUI({ title, artist, songUrl, audioRef, primary, primaryLight, dark, muted }: {
  title: string; artist: string; songUrl: string;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  primary: string; primaryLight: string; dark: string; muted: string
}) {
  const youtubeId = getYouTubeId(songUrl)
  const [playing, setPlaying] = useState(false)
  const [prog, setProg] = useState(0)
  useEffect(() => {
    if (youtubeId) return
    const audio = audioRef.current
    if (!audio) return
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onTime = () => { if (audio.duration) setProg((audio.currentTime / audio.duration) * 100) }
    audio.addEventListener('play', onPlay); audio.addEventListener('pause', onPause); audio.addEventListener('timeupdate', onTime)
    setPlaying(!audio.paused)
    return () => { audio.removeEventListener('play', onPlay); audio.removeEventListener('pause', onPause); audio.removeEventListener('timeupdate', onTime) }
  }, [audioRef, youtubeId])
  const toggle = () => { const a = audioRef.current; if (!a) return; a.paused ? a.play().catch(() => {}) : a.pause() }

  if (youtubeId) return (
    <div style={{ background: `${primary}1a`, borderRadius: 14, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: `linear-gradient(135deg,${primary},${primaryLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎵</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: dark }}>{title}</div>
          <div style={{ fontSize: 11, color: muted }}>{artist}</div>
        </div>
      </div>
      <div style={{ borderRadius: 10, overflow: "hidden", aspectRatio: "16/9" }}>
        <iframe src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&rel=0&modestbranding=1&loop=1&playlist=${youtubeId}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
          style={{ width: "100%", height: "100%", border: "none", display: "block" }} />
      </div>
    </div>
  )

  return (
    <div style={{ background: `${primaryLight}26`, borderRadius: 14, padding: "14px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg,${primary},${primaryLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, animation: playing ? "spin 3s linear infinite" : "none" }}>🎵</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: dark }}>{title}</div>
            <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{artist}</div>
          </div>
        </div>
        <button onClick={toggle} style={{ width: 38, height: 38, borderRadius: "50%", background: primary, border: "none", cursor: "pointer", color: "#fff", fontSize: 14 }}>{playing ? "⏸" : "▶"}</button>
      </div>
      <div style={{ height: 3, background: `${primary}26`, borderRadius: 100 }}>
        <div style={{ height: "100%", width: `${prog}%`, background: `linear-gradient(to right,${primary},${primaryLight})`, borderRadius: 100, transition: "width 0.3s" }} />
      </div>
    </div>
  )
}

// ── RSVP ──
function RSVP({ coupleId, askDrinking, primary, primaryLight, dark, cream, muted }: { coupleId: string; askDrinking: boolean; primary: string; primaryLight: string; dark: string; cream: string; muted: string }) {
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
  const inp: React.CSSProperties = { width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${primaryLight}`, background: cream, color: dark, fontSize: 14, outline: "none", fontFamily: "'Inter',sans-serif", marginBottom: 10, display: "block" }
  return (
    <div style={{ background: `linear-gradient(135deg,${primaryLight}33,${cream})`, padding: "2.5rem 1.5rem", textAlign: "center" }}>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "2rem", color: dark, marginBottom: 6 }}>Kindly RSVP</div>
      <div style={{ fontSize: 12, color: muted, marginBottom: 20 }}>We'd be honoured to have you join our celebration</div>
      <div style={{ background: "#fff", borderRadius: 16, padding: "1.5rem", maxWidth: 380, margin: "0 auto", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
        {step === "form" && (<>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: `${primary}99`, marginBottom: 8, textAlign: "left" }}>Your Name</div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name..." style={inp} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button onClick={handleAccept} disabled={saving} style={{ padding: 13, borderRadius: 10, background: `linear-gradient(135deg,${primary},${primaryLight})`, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, opacity: saving ? 0.6 : 1 }}>{saving ? "..." : "✓ Joyfully Accept"}</button>
            <button onClick={handleDecline} disabled={saving} style={{ padding: 13, borderRadius: 10, background: `${primaryLight}33`, color: primary, border: "none", cursor: "pointer", fontSize: 13, opacity: saving ? 0.6 : 1 }}>{saving ? "..." : "✗ Regretfully Decline"}</button>
          </div>
        </>)}
        {step === "count" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ fontSize: 14, color: dark, fontWeight: 600, marginBottom: 4 }}>Wonderful, {name}! 🎉</div>
            <div style={{ fontSize: 12, color: muted, marginBottom: 16 }}>How many people will be coming, including yourself?</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 18 }}>
              <button onClick={() => setGuestCount(c => Math.max(1, c - 1))} style={{ width: 38, height: 38, borderRadius: "50%", background: `${primaryLight}33`, color: primary, border: "none", cursor: "pointer", fontSize: 18, fontWeight: 600 }}>−</button>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "2rem", color: dark, fontWeight: 600, minWidth: 50, textAlign: "center" }}>{guestCount}</div>
              <button onClick={() => setGuestCount(c => Math.min(20, c + 1))} style={{ width: 38, height: 38, borderRadius: "50%", background: `${primaryLight}33`, color: primary, border: "none", cursor: "pointer", fontSize: 18, fontWeight: 600 }}>+</button>
            </div>
            <button onClick={handleCountNext} disabled={saving} style={{ width: "100%", padding: 13, borderRadius: 10, background: `linear-gradient(135deg,${primary},${primaryLight})`, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, opacity: saving ? 0.6 : 1 }}>{saving ? "..." : "Continue →"}</button>
          </motion.div>
        )}
        {step === "drinking" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ fontSize: 12, color: muted, marginBottom: 16 }}>One last quick question</div>
            <div style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: `${primary}99`, marginBottom: 10, textAlign: "left" }}>Will you be having alcohol?</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={() => save("yes", "yes", guestCount)} disabled={saving} style={{ padding: 13, borderRadius: 10, background: `${primaryLight}33`, color: primary, border: `1.5px solid ${primaryLight}`, cursor: "pointer", fontSize: 13, fontWeight: 500, opacity: saving ? 0.6 : 1 }}>🥃 Yes</button>
              <button onClick={() => save("yes", "no", guestCount)} disabled={saving} style={{ padding: 13, borderRadius: 10, background: `${primaryLight}33`, color: primary, border: `1.5px solid ${primaryLight}`, cursor: "pointer", fontSize: 13, fontWeight: 500, opacity: saving ? 0.6 : 1 }}>🥤 No</button>
            </div>
          </motion.div>
        )}
        {step === "done" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: "1rem 0", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{finalResponse === "yes" ? "🎉" : "🙏"}</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.3rem", color: primary, marginBottom: 4 }}>
              {finalResponse === "yes" ? `See you there, ${name}!` : `We'll miss you, ${name}.`}
            </div>
            <div style={{ fontSize: 12, color: muted }}>
              {finalResponse === "yes" ? (guestCount > 1 ? `Party of ${guestCount} confirmed!` : "We can't wait to celebrate with you!") : "Thank you for letting us know."}
            </div>
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
    setRes(found ? `🪷 You are seated at ${seats[found]}` : "Name not found. Please contact the couple.")
  }
  return (
    <>
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && search()} placeholder="Enter your name..."
          style={{ flex: 1, padding: "12px 16px", borderRadius: 10, border: `1px solid ${primary}33`, background: cream, color: dark, fontSize: 14, outline: "none", fontFamily: "'Inter',sans-serif" }} />
        <button onClick={search} style={{ padding: "12px 18px", borderRadius: 10, background: primary, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>Search</button>
      </div>
      {res && <div style={{ marginTop: 12, fontSize: 14, color: res.startsWith("🪷") ? primary : muted, fontWeight: res.startsWith("🪷") ? 500 : 400 }}>{res}</div>}
    </>
  )
}

// ── Card + section styles ──
const cardStyle = (): React.CSSProperties => ({ background: "#fff", margin: "0 16px 16px", borderRadius: 22, padding: "1.8rem", boxShadow: "0 2px 20px rgba(0,0,0,0.07)", position: "relative", overflow: "hidden" })
const eyebrow = (color: string): React.CSSProperties => ({ fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color, textAlign: "center", marginBottom: 6, fontWeight: 600 })
const heading = (dark: string): React.CSSProperties => ({ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.7rem", color: dark, textAlign: "center", marginBottom: "1.4rem" })

// ── Card corner lotus accent ──
function CornerLotus({ flip = false }: { flip?: boolean }) {
  return (
    <div style={{ position: "absolute", top: 6, [flip ? "left" : "right"]: 6, opacity: 0.22, transform: flip ? "scaleX(-1)" : undefined, pointerEvents: "none" }}>
      <LotusIcon color="#c4956a" size={56} opacity={1} />
    </div>
  )
}

export default function SacredPoruwaTemplate({ couple }: { couple: Couple }) {
  const [opened, setOpened] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const PRIMARY = couple.custom_colors?.primary || DEFAULT_PALETTE.primary
  const PRIMARY_LIGHT = couple.custom_colors?.primaryLight || DEFAULT_PALETTE.primaryLight
  const DARK = couple.custom_colors?.dark || DEFAULT_PALETTE.dark
  const CREAM = couple.custom_colors?.cream || DEFAULT_PALETTE.cream
  const MUTED = DEFAULT_PALETTE.muted

  const songUrl = couple.song_url || DEFAULT_SONG_URL

  useEffect(() => {
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
    if (!getYouTubeId(songUrl)) {
      const audio = audioRef.current
      if (audio) audio.play().catch(() => {
        const fb = new Audio(songUrl); fb.loop = true; fb.volume = 0.6
        audioRef.current = fb; fb.play().catch(() => {})
      })
    }
  }

  const EVENT_META: Record<'engagement' | 'wedding' | 'homecoming', { label: string; icon: string }> = {
    engagement: { label: 'Engagement', icon: '💍' },
    wedding: { label: 'Wedding Ceremony', icon: '🪷' },
    homecoming: { label: 'Homecoming', icon: '🏡' },
  }
  type RenderableEvent = { key: 'engagement' | 'wedding' | 'homecoming'; label: string; icon: string; enabled: boolean; venue: string; venue_address: string; date: string; maps_url: string }

  const hasNewEvents = couple.events && Object.keys(couple.events).length > 0
  const eventsList: RenderableEvent[] = hasNewEvents
    ? (['engagement', 'wedding', 'homecoming'] as const).map((key): RenderableEvent => {
        const e = couple.events![key]
        return { key, ...EVENT_META[key], enabled: e?.enabled ?? false, venue: e?.venue ?? '', venue_address: e?.venue_address ?? '', date: e?.date ?? '', maps_url: e?.maps_url ?? '' }
      }).filter(e => e.enabled && e.date.length > 0)
    : (couple.wedding_date ? [{ key: 'wedding', ...EVENT_META.wedding, enabled: true, venue: couple.venue || '', venue_address: couple.venue_address || '', date: couple.wedding_date, maps_url: couple.maps_url || '' }] : [])

  const sv = {
    gallery: couple.section_visibility?.gallery ?? true,
    countdown: couple.section_visibility?.countdown ?? true,
    timeline: couple.section_visibility?.timeline ?? true,
    seat_finder: couple.section_visibility?.seat_finder ?? true,
    music: couple.section_visibility?.music ?? true,
    thank_you: couple.section_visibility?.thank_you ?? true,
  }

  const W = {
    bride: couple.bride, groom: couple.groom,
    brideFamilyName: couple.bride_family || '', groomFamilyName: couple.groom_family || '',
    date: couple.wedding_date,
    couplePhoto: couple.couple_photo || DEFAULT_PHOTO,
    introText: couple.intro_text || "Two souls united beneath the sacred poruwa, bound by love and blessings",
    song: couple.song_title || DEFAULT_SONG_TITLE, artist: couple.song_artist || DEFAULT_SONG_ARTIST,
    timeline: couple.timeline || [], seats: couple.seats || {}, gallery: couple.gallery || [],
  }

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", minHeight: "100vh", background: "#f7f0e4" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Great+Vibes&family=Inter:wght@300;400;500;600&display=swap');
        @keyframes spin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
        @keyframes pulse-gold { 0%,100%{box-shadow:0 0 0 0 rgba(196,149,106,0.4);} 50%{box-shadow:0 0 0 16px rgba(196,149,106,0);} }
        @keyframes float-slow { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-10px);} }
        input::placeholder { color: #b5a08a; }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto", background: CREAM, boxShadow: "0 0 80px rgba(0,0,0,0.1)", position: "relative" }}>

        {/* ══ COVER ══ */}
        <AnimatePresence>
          {!opened && (
            <motion.div key="cover" exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.6 }}
              style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", background: DARK }}>

              {/* Video background — plays when /videos/sacred-poruwa-cover.mp4 exists,
                  couple photo shows as poster while video loads (and as permanent
                  fallback on devices that can't autoplay) */}
              <video autoPlay loop muted playsInline preload="auto"
                poster={W.couplePhoto}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 1 }}>
                <source src={DEFAULT_COVER_VIDEO} type="video/mp4" />
              </video>

              {/* Warm dark overlay */}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(30,14,4,0.45) 0%, rgba(30,14,4,0.12) 35%, rgba(30,14,4,0.28) 65%, rgba(30,14,4,0.72) 100%)", zIndex: 2 }} />

              {/* Golden particles */}
              <GoldenParticles count={18} color={PRIMARY_LIGHT} />

              {/* Mandala corners */}
              <div style={{ position: "absolute", top: 0, left: 0, zIndex: 2 }}><MandalaCorner color={PRIMARY_LIGHT} size={110} /></div>
              <div style={{ position: "absolute", top: 0, right: 0, zIndex: 2 }}><MandalaCorner color={PRIMARY_LIGHT} size={110} flip /></div>
              <div style={{ position: "absolute", bottom: 0, left: 0, zIndex: 2 }}><MandalaCorner color={PRIMARY_LIGHT} size={110} flipY /></div>
              <div style={{ position: "absolute", bottom: 0, right: 0, zIndex: 2 }}><MandalaCorner color={PRIMARY_LIGHT} size={110} flip flipY /></div>

              {/* Content */}
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}
                style={{ textAlign: "center", width: "84%", maxWidth: 340, position: "relative", zIndex: 10, padding: "0 1rem" }}>

                {/* Lotus above names */}
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                  style={{ display: "flex", justifyContent: "center", marginBottom: "0.8rem" }}>
                  <LotusIcon color={PRIMARY_LIGHT} size={62} opacity={0.9} />
                </motion.div>

                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.14)", backdropFilter: "blur(6px)", borderRadius: 100, padding: "6px 16px", fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: "#fff", marginBottom: "1.1rem", border: `1px solid ${PRIMARY_LIGHT}55` }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: PRIMARY_LIGHT, display: "inline-block" }} />
                  Wedding Invitation
                </div>

                <div style={{ fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(255,255,255,0.75)", marginBottom: "0.8rem" }}>You Are Invited</div>
                <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "clamp(2.8rem,10vw,4rem)", color: "#fff", lineHeight: 1, textShadow: "0 4px 24px rgba(0,0,0,0.5)" }}>{W.bride}</div>
                <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "2.3rem", color: PRIMARY_LIGHT, margin: "0.1rem 0", textShadow: "0 2px 14px rgba(0,0,0,0.4)" }}>&amp;</div>
                <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "clamp(2.8rem,10vw,4rem)", color: "#fff", lineHeight: 1, textShadow: "0 4px 24px rgba(0,0,0,0.5)" }}>{W.groom}</div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", margin: "1.1rem 0" }}>
                  <div style={{ height: 1, width: 36, background: `${PRIMARY_LIGHT}88` }} />
                  <span style={{ fontSize: 12, color: PRIMARY_LIGHT }}>🪷</span>
                  <div style={{ height: 1, width: 36, background: `${PRIMARY_LIGHT}88` }} />
                </div>

                <div style={{ color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "1.8rem", textShadow: "0 2px 10px rgba(0,0,0,0.4)", fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1rem" }}>
                  {W.introText}
                </div>

                <button onClick={handleOpenInvitation} style={{
                  display: "inline-flex", alignItems: "center", gap: 10,
                  background: `linear-gradient(135deg,${PRIMARY},${PRIMARY_LIGHT})`, color: DARK,
                  border: "none", borderRadius: 100, padding: "14px 30px",
                  fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase",
                  cursor: "pointer", fontFamily: "'Inter',sans-serif", fontWeight: 700,
                  boxShadow: "0 8px 28px rgba(0,0,0,0.4)", animation: "pulse-gold 2.5s ease infinite",
                }}>
                  You're Invited →
                </button>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.65)", marginTop: 12 }}>🎵 Tap to begin — with music</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ INVITATION ══ */}
        {opened && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>

            {/* Hero */}
            <div style={{ position: "relative", height: 490, overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(160deg,${PRIMARY_LIGHT},${PRIMARY})` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={W.couplePhoto} alt={`${W.bride} and ${W.groom}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }}
                  onError={e => { (e.currentTarget as HTMLImageElement).src = DEFAULT_PHOTO }} />
              </div>
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top,${CREAM} 0%,rgba(40,20,8,0.12) 60%,rgba(40,20,8,0.38) 100%)` }} />

              {/* Floating particles on hero too */}
              <GoldenParticles count={8} color={PRIMARY_LIGHT} />

              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "2rem 1.5rem", textAlign: "center", zIndex: 5 }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <div style={{ fontSize: 9, letterSpacing: "0.5em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)", marginBottom: "0.8rem" }}>Together with their families</div>
                  <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "clamp(2.6rem,9vw,4.2rem)", color: "#fff", lineHeight: 1, textShadow: "0 2px 20px rgba(0,0,0,0.4)" }}>
                    {W.bride}
                    <span style={{ display: "block", fontSize: "2rem", color: PRIMARY_LIGHT }}>&amp;</span>
                    {W.groom}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", margin: "4px 0", letterSpacing: "0.1em" }}>are getting married</div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
                    <a href="#rsvp" style={{ background: `linear-gradient(135deg,${PRIMARY},${PRIMARY_LIGHT})`, color: DARK, borderRadius: 100, padding: "10px 22px", fontSize: 11, letterSpacing: "0.15em", textDecoration: "none", fontWeight: 700 }}>RSVP</a>
                    <a href={normalizeMapsUrl(eventsList[0]?.maps_url || couple.maps_url || '')} target="_blank" rel="noopener noreferrer"
                      style={{ background: "rgba(0,0,0,0.2)", backdropFilter: "blur(8px)", color: PRIMARY_LIGHT, border: `1.5px solid ${PRIMARY_LIGHT}`, borderRadius: 100, padding: "10px 22px", fontSize: 11, letterSpacing: "0.15em", textDecoration: "none", fontWeight: 600 }}>Location</a>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Family card */}
            {(W.brideFamilyName || W.groomFamilyName) && (
              <motion.div style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <CornerLotus /><CornerLotus flip />
                <div style={eyebrow(`${PRIMARY}aa`)}>With Love</div>
                <div style={{ textAlign: "center", padding: "12px 10px", background: `${PRIMARY_LIGHT}1a`, borderRadius: 12, fontSize: 13, color: DARK, lineHeight: 2 }}>
                  {W.groomFamilyName && <><strong>{W.groomFamilyName}</strong><br /></>}
                  {W.brideFamilyName && W.groomFamilyName && <>together with<br /></>}
                  {W.brideFamilyName && <><strong>{W.brideFamilyName}</strong><br /></>}
                  <span style={{ color: MUTED }}>request the honour of your presence<br />to celebrate the marriage of their loving children</span>
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
                  <CornerLotus /><CornerLotus flip />
                  <div style={eyebrow(`${PRIMARY}aa`)}>{ev.icon} Save the Date</div>
                  <div style={heading(DARK)}>{ev.label}</div>
                  {[
                    { icon: "📅", label: "Date", val: evDateDisplay },
                    { icon: "⏰", label: "Time", val: evTimeDisplay },
                    { icon: "📍", label: "Venue", val: ev.venue || couple.venue || "", sub: ev.venue_address || couple.venue_address || "" },
                  ].map(d => (
                    <div key={d.label} style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "12px 0", borderBottom: `1px solid ${PRIMARY_LIGHT}44` }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${PRIMARY_LIGHT}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>{d.icon}</div>
                      <div>
                        <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: `${PRIMARY}88` }}>{d.label}</div>
                        <div style={{ fontSize: 15, color: DARK, fontWeight: 700, marginTop: 2 }}>{d.val}</div>
                        {d.sub && <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{d.sub}</div>}
                      </div>
                    </div>
                  ))}
                  {ev.maps_url && (
                    <a href={normalizeMapsUrl(ev.maps_url)} target="_blank" rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: `${PRIMARY_LIGHT}33`, borderRadius: 100, padding: "10px 20px", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: PRIMARY, marginTop: 16, textDecoration: "none", fontWeight: 600 }}>
                      📍 View Location on Maps
                    </a>
                  )}
                </motion.div>
              )
            })}

            {/* Countdown */}
            {sv.countdown && (
              <motion.div style={{ ...cardStyle(), textAlign: "center" }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <CornerLotus /><CornerLotus flip />
                <div style={eyebrow(`${PRIMARY}aa`)}>Counting Down to Our Big Day</div>
                <Countdown targetDate={W.date} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} />
              </motion.div>
            )}

            {/* RSVP */}
            <div id="rsvp">
              <RSVP coupleId={couple.id} askDrinking={couple.ask_drinking} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} cream={CREAM} muted={MUTED} />
            </div>

            {/* Timeline */}
            {sv.timeline && W.timeline.length > 0 && (
              <motion.div style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <CornerLotus /><CornerLotus flip />
                <div style={eyebrow(`${PRIMARY}aa`)}>Our Celebration</div>
                <div style={heading(DARK)}>Event Timeline</div>
                <div style={{ position: "relative", paddingLeft: 20 }}>
                  <div style={{ position: "absolute", left: 6, top: 0, bottom: 0, width: 1, background: `${PRIMARY_LIGHT}88` }} />
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

            {/* Seat Finder */}
            {sv.seat_finder && couple.show_seating && Object.keys(W.seats).length > 0 && (
              <motion.div style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <CornerLotus /><CornerLotus flip />
                <div style={eyebrow(`${PRIMARY}aa`)}>Be Our Guest</div>
                <div style={heading(DARK)}>Find Your Table</div>
                <div style={{ fontSize: 13, color: MUTED, marginBottom: 4 }}>Search your name to find your assigned table</div>
                <SeatFinder seats={W.seats} primary={PRIMARY} dark={DARK} cream={CREAM} muted={MUTED} />
              </motion.div>
            )}

            {/* Music */}
            {sv.music && (
              <motion.div style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <CornerLotus /><CornerLotus flip />
                <div style={eyebrow(`${PRIMARY}aa`)}>Our Song</div>
                <MusicPlayerUI title={W.song} artist={W.artist} songUrl={songUrl} audioRef={audioRef} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} muted={MUTED} />
              </motion.div>
            )}

            {/* Gallery */}
            {sv.gallery && W.gallery.length > 0 && (
              <motion.div style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <CornerLotus /><CornerLotus flip />
                <div style={eyebrow(`${PRIMARY}aa`)}>Our Celebration</div>
                <div style={heading(DARK)}>Moments of Love</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {W.gallery.map((src, i) => (
                    <div key={i} style={{ gridRow: i === 0 ? "span 2" : undefined, borderRadius: 16, overflow: "hidden", background: `${PRIMARY_LIGHT}33`, aspectRatio: i === 0 ? "1/2" : "1/1", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => (e.currentTarget.style.display = "none")} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Thank You */}
            {sv.thank_you && (
              <motion.div style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <CornerLotus /><CornerLotus flip />
                <div style={eyebrow(`${PRIMARY}aa`)}>A Special Note</div>
                <div style={heading(DARK)}>To Our Lovely Guests</div>
                <div style={{ textAlign: "center", fontSize: 13, color: DARK, lineHeight: 2 }}>
                  With hearts full of love and gratitude, we are so happy to celebrate this beautiful chapter of our lives with you. Your presence means more to us than words can truly express, and having you by our side makes this day even more meaningful.
                  <br /><br />
                  Thank you for your love, your blessings, and for being part of our journey.
                </div>
                <div style={{ textAlign: "center", marginTop: 18 }}>
                  <div style={{ fontSize: 11, color: MUTED, letterSpacing: "0.1em" }}>With all our love,</div>
                  <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "1.8rem", color: PRIMARY, marginTop: 4 }}>{W.bride} &amp; {W.groom}</div>
                </div>
              </motion.div>
            )}

            {/* Footer */}
            <div style={{ padding: "2rem 1.5rem", textAlign: "center", background: "#fff", borderTop: `1px solid ${PRIMARY_LIGHT}66`, borderRadius: "22px 22px 0 0" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                <LotusIcon color={PRIMARY} size={40} opacity={0.5} />
              </div>
              <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "1.5rem", color: PRIMARY, marginBottom: 4 }}>InviteGlow</div>
              <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: MUTED }}>inviteglow.com · Digital Wedding Invitations</div>
            </div>

          </motion.div>
        )}
      </div>
    </div>
  )
}
