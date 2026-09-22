"use client"
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, Couple } from '@/lib/supabase'
import FooterSocial from '@/components/shared/FooterSocial'

// ══════════════════════════════════════════════════════════════════
// Dried Bloom Romance — a brand-new wedding invitation template.
// Reference mood: a real flatlay wedding stationery suite — a blush
// envelope, a cream card banded with a thin gold ribbon and a wax
// seal, a sprig of dried pampas grass, all on a dusty-rose fabric.
// The signature moment is the cover: instead of a photo/video, an
// animated envelope opens, its wax seal cracks, and the invitation
// card slides up and out — a little piece of stationery coming to
// life — before the guest ever taps anything. Because that intro is
// pure CSS/SVG + framer-motion (no <video> or <img> in the critical
// path), it can never render blank the way a photo/video cover can
// on a flaky mobile connection — see the cover-video lessons learned
// on the sibling templates in this codebase.
// ══════════════════════════════════════════════════════════════════

const DEFAULT_PHOTO = "/images/hero-dried-bloom.png"
const DEFAULT_COVER_VIDEO = "https://eqacrwhbrfqcnlgegvtl.supabase.co/storage/v1/object/public/wedding-photos/videos/dried-bloom-romance-cover.mp4"
const DEFAULT_SONG_URL = "/audio/calm-wedding.mp3"
const DEFAULT_SONG_TITLE = "Calm Wedding Theme"
const DEFAULT_SONG_ARTIST = "InviteGlow"

const DEFAULT_PALETTE = {
  primary: "#c98a93",
  primaryLight: "#f3d9dc",
  dark: "#4a2f2e",
  cream: "#fdf8f4",
  muted: "#a98a86",
}
// Wax-seal / ribbon gold is a fixed material colour, not a couple-
// adjustable brand colour — a gold foil seal reads as gold whatever
// the couple's chosen accent colour is.
const GOLD = "#c9a15a"
const GOLD_LIGHT = "#e8cd94"

function normalizeMapsUrl(url: string): string {
  if (!url) return '#'
  if (url.includes('maps.app.goo.gl') || url.includes('goo.gl/maps')) {
    return `https://www.google.com/maps?q=${encodeURIComponent(url)}`
  }
  return url
}

// ── Dried pampas/wildflower sprig — the template's signature motif,
// standing in for the lotus/ribbon icons used on sibling templates. ──
function SprigIcon({ color = GOLD, size = 44, opacity = 0.9 }: { color?: string; size?: number; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 80" style={{ opacity, display: "block" }}>
      <path d="M30 78 C29 55 29 35 30 16" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M30 40 C24 34 18 30 10 28" fill="none" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      <path d="M30 52 C36 46 42 42 50 40" fill="none" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      <path d="M30 64 C25 60 20 57 14 56" fill="none" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.7" />
      {[
        [30, 16], [22, 20], [38, 20], [16, 26], [44, 26], [26, 12], [34, 12],
      ].map(([cx, cy], i) => (
        <ellipse key={i} cx={cx} cy={cy} rx="3.2" ry="6.5"
          transform={`rotate(${(i - 3) * 16} ${cx} ${cy})`}
          fill={color} opacity={0.35 + (i % 3) * 0.15} />
      ))}
      <ellipse cx="10" cy="27" rx="2.6" ry="5" transform="rotate(-30 10 27)" fill={color} opacity="0.6" />
      <ellipse cx="50" cy="39" rx="2.6" ry="5" transform="rotate(28 50 39)" fill={color} opacity="0.6" />
      <ellipse cx="14" cy="55" rx="2.4" ry="4.6" transform="rotate(-24 14 55)" fill={color} opacity="0.55" />
    </svg>
  )
}

// ── Wax seal — a small gold monogram medallion, used in the cover's
// envelope animation and as a recurring decorative badge. ──
function WaxSeal({ initials, size = 54 }: { initials: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `radial-gradient(circle at 32% 28%, ${GOLD_LIGHT}, ${GOLD} 70%, #a9803f 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 3px 10px rgba(74,47,46,0.35), inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 3px rgba(255,255,255,0.4)",
      border: "1px solid rgba(255,255,255,0.3)",
    }}>
      <span style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontWeight: 700, fontSize: size * 0.34, color: "#fff8e8", textShadow: "0 1px 2px rgba(0,0,0,0.35)" }}>{initials}</span>
    </div>
  )
}

// ── Ambient drifting dried petals — soft blush/gold ellipses rising
// slowly, echoing the scattered dried flowers on the reference fabric. ──
function FloatingPetals({ count = 14, color = GOLD_LIGHT }: { count?: number; color?: string }) {
  const [items, setItems] = useState<{ id: number; left: number; size: number; duration: number; delay: number; drift: number; rot: number }[]>([])
  useEffect(() => {
    setItems(Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: 4 + Math.random() * 92,
      size: 5 + Math.random() * 7,
      duration: 9 + Math.random() * 10,
      delay: Math.random() * 10,
      drift: (Math.random() - 0.5) * 60,
      rot: Math.random() * 360,
    })))
  }, [count])
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 3 }}>
      {items.map(p => (
        <div key={p.id} style={{
          position: "absolute", bottom: -14, left: `${p.left}%`,
          width: p.size, height: p.size * 1.7, borderRadius: "50%",
          background: `linear-gradient(160deg, #fff8ec, ${color})`,
          opacity: 0.75, transform: `rotate(${p.rot}deg)`,
          animation: `petal-rise-${p.id % 3} ${p.duration}s ease-in ${p.delay}s infinite`,
        }} />
      ))}
      <style>{`
        @keyframes petal-rise-0 { 0%{transform:translateY(0) translateX(0) rotate(0deg);opacity:0;} 15%{opacity:0.85;} 85%{opacity:0.5;} 100%{transform:translateY(-105vh) translateX(30px) rotate(200deg);opacity:0;} }
        @keyframes petal-rise-1 { 0%{transform:translateY(0) translateX(0) rotate(0deg);opacity:0;} 20%{opacity:0.75;} 80%{opacity:0.45;} 100%{transform:translateY(-105vh) translateX(-24px) rotate(-160deg);opacity:0;} }
        @keyframes petal-rise-2 { 0%{transform:translateY(0) translateX(0) rotate(0deg);opacity:0;} 10%{opacity:0.9;} 90%{opacity:0.4;} 100%{transform:translateY(-105vh) translateX(16px) rotate(120deg);opacity:0;} }
      `}</style>
    </div>
  )
}

// ── Guest intro splash — "Dear [Name]" with an auto-progress bar,
// shown once before the cover if a personalized ?name= link is used. ──
function GuestIntroScreen({ guestName, onDone, primary, primaryLight, dark, cream }: {
  guestName: string; onDone: () => void; primary: string; primaryLight: string; dark: string; cream: string
}) {
  return (
    <motion.div
      key="intro"
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.6 }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", background: `radial-gradient(ellipse 90% 70% at 50% 30%, ${primaryLight} 0%, ${cream} 75%)`,
        padding: "0 2rem", textAlign: "center",
      }}
    >
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <SprigIcon color={GOLD} size={40} opacity={0.85} />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, letterSpacing: "0.1em" }}
        animate={{ opacity: 1, letterSpacing: "0.4em" }}
        transition={{ duration: 1, delay: 0.5 }}
        style={{ fontSize: 10, textTransform: "uppercase", color: `${primary}bb`, fontFamily: "'Inter',sans-serif", marginTop: 18 }}
      >
        Dear
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.7 }}
        style={{ fontFamily: "'Great Vibes',cursive", fontSize: "clamp(2.4rem,10vw,3.4rem)", color: dark, marginTop: 6 }}>
        {guestName}
      </motion.div>
      <div style={{ position: "relative", width: 160, height: 3, background: `${primary}22`, borderRadius: 100, marginTop: 28, overflow: "hidden" }}>
        <motion.div
          style={{ position: "absolute", inset: 0, background: `linear-gradient(to right,${primary},${GOLD})`, borderRadius: 100 }}
          initial={{ width: "0%" }} animate={{ width: "100%" }}
          transition={{ duration: 4.2, ease: "linear", delay: 0.4 }}
          onAnimationComplete={onDone}
        />
      </div>
      <motion.button
        initial={{ opacity: 0 }} animate={{ opacity: 0.55 }} transition={{ delay: 1.6 }}
        onClick={onDone}
        style={{ marginTop: 18, background: "transparent", border: "none", cursor: "pointer", fontSize: 11, color: primary, letterSpacing: "0.15em", fontFamily: "'Inter',sans-serif" }}
      >
        Skip →
      </motion.button>
    </motion.div>
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
            borderRadius: 14, background: `linear-gradient(145deg,${primaryLight}66,${GOLD_LIGHT}44)`,
            border: `1.5px solid ${GOLD}55`, padding: "12px 4px",
            boxShadow: `0 4px 16px ${primary}1f`,
          }}>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.6rem", color: dark, fontWeight: 600 }}>{v}</span>
          </div>
          <span style={{ fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: `${primary}bb`, display: "block", marginTop: 6 }}>{l}</span>
        </div>
      ))}
    </div>
  )
}

// ── YouTube detect + Music Player ──
function getYouTubeId(url: string): string | null {
  if (!url) return null
  const patterns = [/youtu\.be\/([^?&]+)/, /youtube\.com\/watch\?v=([^&]+)/, /youtube\.com\/embed\/([^?&]+)/, /youtube\.com\/shorts\/([^?&]+)/]
  for (const p of patterns) { const m = url.match(p); if (m) return m[1] }
  return null
}

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
    <div style={{ background: `${primary}14`, borderRadius: 14, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: `linear-gradient(135deg,${primary},${GOLD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎵</div>
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
    <div style={{ background: `${primaryLight}44`, borderRadius: 14, padding: "14px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg,${primary},${GOLD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, animation: playing ? "spin 3s linear infinite" : "none" }}>🎵</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: dark }}>{title}</div>
            <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{artist}</div>
          </div>
        </div>
        <button onClick={toggle} style={{ width: 38, height: 38, borderRadius: "50%", background: primary, border: "none", cursor: "pointer", color: "#fff", fontSize: 14 }}>{playing ? "⏸" : "▶"}</button>
      </div>
      <div style={{ height: 3, background: `${primary}22`, borderRadius: 100 }}>
        <div style={{ height: "100%", width: `${prog}%`, background: `linear-gradient(to right,${primary},${GOLD})`, borderRadius: 100, transition: "width 0.3s" }} />
      </div>
    </div>
  )
}

// ── RSVP ──
function RSVP({ coupleId, askDrinking, primary, primaryLight, dark, cream, muted, guestName }: { coupleId: string; askDrinking: boolean; primary: string; primaryLight: string; dark: string; cream: string; muted: string; guestName: string }) {
  const [name, setName] = useState(guestName || "")
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
    <div style={{ background: `linear-gradient(135deg,${primaryLight}55,${cream})`, padding: "2.5rem 1.5rem", textAlign: "center" }}>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "2rem", color: dark, marginBottom: 6 }}>Kindly RSVP</div>
      <div style={{ fontSize: 12, color: muted, marginBottom: 20 }}>We'd be honoured to have you join our celebration</div>
      <div style={{ background: "#fff", borderRadius: 16, padding: "1.5rem", maxWidth: 380, margin: "0 auto", boxShadow: "0 4px 20px rgba(74,47,46,0.08)" }}>
        {step === "form" && (<>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: `${primary}99`, marginBottom: 8, textAlign: "left" }}>Your Name</div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name..." style={inp} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button onClick={handleAccept} disabled={saving} style={{ padding: 13, borderRadius: 10, background: `linear-gradient(135deg,${primary},${GOLD})`, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, opacity: saving ? 0.6 : 1 }}>{saving ? "..." : "✓ Joyfully Accept"}</button>
            <button onClick={handleDecline} disabled={saving} style={{ padding: 13, borderRadius: 10, background: `${primaryLight}55`, color: primary, border: "none", cursor: "pointer", fontSize: 13, opacity: saving ? 0.6 : 1 }}>{saving ? "..." : "✗ Regretfully Decline"}</button>
          </div>
        </>)}
        {step === "count" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ fontSize: 14, color: dark, fontWeight: 600, marginBottom: 4 }}>Wonderful, {name}! 🌸</div>
            <div style={{ fontSize: 12, color: muted, marginBottom: 16 }}>How many people will be coming, including yourself?</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 18 }}>
              <button onClick={() => setGuestCount(c => Math.max(1, c - 1))} style={{ width: 38, height: 38, borderRadius: "50%", background: `${primaryLight}55`, color: primary, border: "none", cursor: "pointer", fontSize: 18, fontWeight: 600 }}>−</button>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "2rem", color: dark, fontWeight: 600, minWidth: 50, textAlign: "center" }}>{guestCount}</div>
              <button onClick={() => setGuestCount(c => Math.min(20, c + 1))} style={{ width: 38, height: 38, borderRadius: "50%", background: `${primaryLight}55`, color: primary, border: "none", cursor: "pointer", fontSize: 18, fontWeight: 600 }}>+</button>
            </div>
            <button onClick={handleCountNext} disabled={saving} style={{ width: "100%", padding: 13, borderRadius: 10, background: `linear-gradient(135deg,${primary},${GOLD})`, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, opacity: saving ? 0.6 : 1 }}>{saving ? "..." : "Continue →"}</button>
          </motion.div>
        )}
        {step === "drinking" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ fontSize: 12, color: muted, marginBottom: 16 }}>One last quick question</div>
            <div style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: `${primary}99`, marginBottom: 10, textAlign: "left" }}>Will you be having alcohol?</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={() => save("yes", "yes", guestCount)} disabled={saving} style={{ padding: 13, borderRadius: 10, background: `${primaryLight}55`, color: primary, border: `1.5px solid ${primaryLight}`, cursor: "pointer", fontSize: 13, fontWeight: 500, opacity: saving ? 0.6 : 1 }}>🥃 Yes</button>
              <button onClick={() => save("yes", "no", guestCount)} disabled={saving} style={{ padding: 13, borderRadius: 10, background: `${primaryLight}55`, color: primary, border: `1.5px solid ${primaryLight}`, cursor: "pointer", fontSize: 13, fontWeight: 500, opacity: saving ? 0.6 : 1 }}>🥤 No</button>
            </div>
          </motion.div>
        )}
        {step === "done" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: "1rem 0", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{finalResponse === "yes" ? "🌸" : "🙏"}</div>
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
    setRes(found ? `🌸 You are seated at ${seats[found]}` : "Name not found. Please contact the couple.")
  }
  return (
    <>
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && search()} placeholder="Enter your name..."
          style={{ flex: 1, padding: "12px 16px", borderRadius: 10, border: `1px solid ${primary}33`, background: cream, color: dark, fontSize: 14, outline: "none", fontFamily: "'Inter',sans-serif" }} />
        <button onClick={search} style={{ padding: "12px 18px", borderRadius: 10, background: primary, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>Search</button>
      </div>
      {res && <div style={{ marginTop: 12, fontSize: 14, color: res.startsWith("🌸") ? primary : muted, fontWeight: res.startsWith("🌸") ? 500 : 400 }}>{res}</div>}
    </>
  )
}

// ── Guest Wishes Wall ──────────────────────────────────────────────
type WishMedia = { url: string; type: 'photo' | 'video' }
type Wish = {
  id: string
  couple_id: string
  guest_name: string
  message: string
  photo_url: string | null
  video_url: string | null
  media: WishMedia[] | null
  created_at: string
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

function WishLightbox({ media, index, onIndex, onClose }: {
  media: WishMedia[]; index: number; onIndex: (i: number) => void; onClose: () => void
}) {
  const current = media[index]
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(45,26,25,0.92)", zIndex: 500,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", maxWidth: "92vw", maxHeight: "86vh" }}>
        {current.type === 'video' ? (
          <video src={current.url} controls autoPlay style={{ maxWidth: "92vw", maxHeight: "86vh", display: "block", borderRadius: 10 }} />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={current.url} alt="" style={{ maxWidth: "92vw", maxHeight: "86vh", display: "block", borderRadius: 10, objectFit: "contain" }} />
        )}
        <button onClick={onClose} aria-label="Close" style={{
          position: "absolute", top: -40, right: 0, background: "transparent", border: "none",
          color: "#fff", fontSize: 26, cursor: "pointer", lineHeight: 1,
        }}>×</button>
        {media.length > 1 && (
          <>
            <button onClick={() => onIndex((index - 1 + media.length) % media.length)} aria-label="Previous" style={{
              position: "absolute", left: -18, top: "50%", transform: "translate(-100%,-50%)",
              width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none",
              color: "#fff", fontSize: 20, cursor: "pointer",
            }}>‹</button>
            <button onClick={() => onIndex((index + 1) % media.length)} aria-label="Next" style={{
              position: "absolute", right: -18, top: "50%", transform: "translate(100%,-50%)",
              width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none",
              color: "#fff", fontSize: 20, cursor: "pointer",
            }}>›</button>
            <div style={{ position: "absolute", bottom: -30, left: "50%", transform: "translateX(-50%)", color: "#fff", fontSize: 12, opacity: 0.8 }}>
              {index + 1} / {media.length}
            </div>
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
          <div key={idx} onClick={() => onOpen(idx)} style={{
            position: "relative", cursor: "pointer", overflow: "hidden",
            height: isSingle ? 140 : undefined, aspectRatio: isSingle ? undefined : "1 / 1", background: "#000",
          }}>
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
              <div style={{ position: "absolute", inset: 0, background: "rgba(45,26,25,0.55)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, fontWeight: 700, zIndex: 2 }}>
                +{media.length - 4}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function WishesWall({ coupleId, primary, primaryLight, dark, cream, muted }: {
  coupleId: string; primary: string; primaryLight: string; dark: string; cream: string; muted: string
}) {
  const [wishes, setWishes] = useState<Wish[]>([])
  const [loading, setLoading] = useState(true)
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
    const channel = supabase
      .channel(`wishes-${coupleId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wishes', filter: `couple_id=eq.${coupleId}` }, () => load())
      .subscribe()
    return () => { active = false; supabase.removeChannel(channel) }
  }, [coupleId])

  const submit = async () => {
    if (!name.trim() || !message.trim()) {
      setError('Please add your name and a message.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const media: WishMedia[] = []
      for (const f of files) {
        const { url, isVideo } = await uploadWishMedia(f, coupleId)
        media.push({ url, type: isVideo ? 'video' : 'photo' })
      }
      const { error: insertError } = await supabase.from('wishes').insert([{
        couple_id: coupleId, guest_name: name.trim(), message: message.trim(), media,
      }])
      if (insertError) throw insertError
      setName('')
      setMessage('')
      setFiles([])
      setDone(true)
    } catch {
      setError('Something went wrong — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '11px 14px', borderRadius: 10, border: `1px solid ${primary}33`, background: cream, color: dark, fontSize: 13, outline: 'none', marginBottom: 10, boxSizing: 'border-box', fontFamily: "'Inter',sans-serif" }

  return (
    <div>
      <div style={{ background: "#fff", borderRadius: 16, padding: '18px 16px', textAlign: 'left', marginBottom: 18, boxShadow: "0 4px 20px rgba(74,47,46,0.06)" }}>
        {done ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: dark }}>Thank you for your wish!</div>
            <div style={{ fontSize: 12, color: muted, marginTop: 4 }}>It's now on the wall below.</div>
            <button onClick={() => setDone(false)} style={{
              marginTop: 12, padding: '8px 18px', borderRadius: 100, border: 'none', cursor: 'pointer',
              background: `${primaryLight}55`, color: dark, fontSize: 12, fontWeight: 700,
            }}>Leave another wish</button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: dark, marginBottom: 10 }}>Leave a Wish</div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inputStyle} />
            <textarea
              value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your wishes for the couple..." rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: muted, opacity: 0.9,
              padding: '9px 13px', borderRadius: 10, border: `1px dashed ${primary}`, cursor: 'pointer', marginBottom: files.length ? 6 : 10,
            }}>
              📷 {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} selected — add more` : 'Add photos or a video (optional)'}
              <input type="file" accept="image/*,video/*" multiple
                onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files || [])].slice(0, 6))}
                style={{ display: 'none' }} />
            </label>
            {files.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {files.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: dark, background: `${primaryLight}55`, borderRadius: 100, padding: '4px 9px' }}>
                    {f.name.length > 16 ? f.name.slice(0, 14) + '…' : f.name}
                    <span onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} style={{ cursor: 'pointer', fontWeight: 700 }}>×</span>
                  </div>
                ))}
              </div>
            )}
            {error && <div style={{ fontSize: 11.5, color: primary, marginBottom: 8 }}>{error}</div>}
            <button onClick={submit} disabled={submitting} style={{
              width: '100%', padding: 12, borderRadius: 10, border: 'none', cursor: 'pointer',
              background: `linear-gradient(135deg,${primary},${GOLD})`, color: '#fff', fontWeight: 700, fontSize: 13, fontFamily: "'Inter',sans-serif", opacity: submitting ? 0.6 : 1,
            }}>{submitting ? 'Sending...' : 'Send Wish'}</button>
          </>
        )}
      </div>

      {loading ? (
        <div style={{ fontSize: 12, color: muted, textAlign: 'center' }}>Loading wishes...</div>
      ) : wishes.length === 0 ? (
        <div style={{ fontSize: 12, color: muted, textAlign: 'center' }}>Be the first to leave a wish!</div>
      ) : (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: dark, textAlign: 'center', marginBottom: 14 }}>
            {wishes.length} {wishes.length === 1 ? 'Wish' : 'Wishes'}
          </div>
          {wishes.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE).map((w, i, arr) => {
            const mediaList = getWishMedia(w)
            return (
              <div key={w.id} style={{ padding: '12px 0', borderBottom: i < arr.length - 1 ? `1px solid ${primary}22` : 'none', textAlign: 'left' }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: primary, marginBottom: 4 }}>{w.guest_name}</div>
                <div style={{ fontSize: 13, color: dark, opacity: 0.85, lineHeight: 1.7, marginBottom: mediaList.length ? 10 : 6, whiteSpace: 'pre-wrap' }}>{w.message}</div>
                <WishMediaGrid media={mediaList} onOpen={idx => setLightbox({ media: mediaList, index: idx })} />
                <div style={{ fontSize: 10.5, color: muted }}>
                  {new Date(w.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            )
          })}
          {wishes.length > PER_PAGE && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${primary}22`, flexWrap: 'wrap' }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{
                background: 'transparent', border: 'none', cursor: page === 0 ? 'default' : 'pointer',
                fontSize: 12, fontWeight: 700, color: primary, opacity: page === 0 ? 0.35 : 1,
              }}>← Previous</button>
              {Array.from({ length: Math.ceil(wishes.length / PER_PAGE) }).map((_, i) => (
                <button key={i} onClick={() => setPage(i)} style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: i === page ? 800 : 600, color: i === page ? dark : primary,
                  textDecoration: i === page ? 'underline' : 'none', padding: '2px 4px',
                }}>{i + 1}</button>
              ))}
              <button onClick={() => setPage(p => (p + 1) * PER_PAGE < wishes.length ? p + 1 : p)}
                disabled={(page + 1) * PER_PAGE >= wishes.length} style={{
                background: 'transparent', border: 'none', cursor: (page + 1) * PER_PAGE >= wishes.length ? 'default' : 'pointer',
                fontSize: 12, fontWeight: 700, color: primary, opacity: (page + 1) * PER_PAGE >= wishes.length ? 0.35 : 1,
              }}>Next →</button>
            </div>
          )}
        </div>
      )}
      {lightbox && (
        <WishLightbox media={lightbox.media} index={lightbox.index} onIndex={i => setLightbox(l => l && { ...l, index: i })} onClose={() => setLightbox(null)} />
      )}
    </div>
  )
}

// ── Card + section styles ──
const cardStyle = (): React.CSSProperties => ({ background: "#fff", margin: "0 16px 16px", borderRadius: 22, padding: "1.8rem", boxShadow: "0 2px 20px rgba(74,47,46,0.08)", position: "relative", overflow: "hidden" })
const eyebrow = (color: string): React.CSSProperties => ({ fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color, textAlign: "center", marginBottom: 6, fontWeight: 600 })
const heading = (dark: string): React.CSSProperties => ({ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.7rem", color: dark, textAlign: "center", marginBottom: "1.4rem" })

// ── Contact Numbers ──
function ContactRow({ name, phone, primary }: { name: string; phone: string; primary: string }) {
  const digitsOnly = phone.replace(/\D/g, '')
  const waNumber = digitsOnly.startsWith('0') ? `94${digitsOnly.slice(1)}` : digitsOnly
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: '#fff', border: `1px solid ${primary}22`, borderRadius: 14, padding: '12px 16px', boxShadow: '0 2px 10px rgba(74,47,46,0.05)' }}>
      <div style={{ minWidth: 0 }}>
        {name ? (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#3a2423', fontFamily: "'Inter',sans-serif" }}>{name}</div>
            <div style={{ fontSize: 12, color: '#a98a86', marginTop: 2 }}>{phone}</div>
          </>
        ) : (
          <div style={{ fontSize: 13, fontWeight: 700, color: '#3a2423', fontFamily: "'Inter',sans-serif" }}>{phone}</div>
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

// ── Floating bottom nav bar ──
function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function BottomNavBar({ primary, dark, mapsUrl, hasWishes, hasGallery, hasContact, audioRef }: {
  primary: string; dark: string; mapsUrl: string; hasWishes: boolean; hasGallery: boolean; hasContact: boolean; audioRef: React.RefObject<HTMLAudioElement | null>
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
    <div style={{ position: 'fixed', bottom: 18, left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 40px)', maxWidth: 400, zIndex: 100 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-evenly',
        background: 'rgba(255,255,255,0.98)', borderRadius: 100, border: '1px solid rgba(74,47,46,0.08)',
        boxShadow: '0 10px 30px rgba(74,47,46,0.18)', padding: '10px 18px', paddingRight: 56, position: 'relative',
      }}>
        {hasWishes && iconBtn(() => scrollToId('wishes'), 'Wishes', <path d="M12 20.5s-7.5-4.9-9.8-9.3C.6 8 2 4.7 5.2 4a4.6 4.6 0 016.8 2.3A4.6 4.6 0 0118.8 4C22 4.7 23.4 8 21.8 11.2 19.5 15.6 12 20.5 12 20.5z" />, 'wishes')}
        {iconBtn(() => scrollToId('savethedate'), 'Save Date', <><rect x="3.5" y="5" width="17" height="16" rx="2.5" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /></>, 'savedate')}
        {hasGallery && iconBtn(() => scrollToId('gallery'), 'Gallery', <><rect x="3" y="4" width="18" height="16" rx="2.5" /><circle cx="8.5" cy="9.5" r="1.5" /><path d="M21 16l-5.2-5.2a2 2 0 00-2.8 0L4 19" /></>, 'gallery')}
        {iconBtn(() => scrollToId('rsvp'), 'RSVP', <><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01z" /></>, 'rsvp')}
        {hasContact && iconBtn(() => scrollToId('contact'), 'Contact', <><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M3.5 6.5L12 13l8.5-6.5" /></>, 'contact')}
        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: dark, opacity: 0.8, textDecoration: 'none', padding: '2px 4px' }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s7-7.5 7-12.5A7 7 0 105 9.5C5 14.5 12 22 12 22z" /><circle cx="12" cy="9.5" r="2.5" />
            </svg>
            <span style={{ fontSize: 8 }}>Location</span>
          </a>
        )}

        <button onClick={toggleMusic} aria-label={playing ? 'Pause music' : 'Play music'} style={{
          position: 'absolute', right: 4, top: -16,
          width: 46, height: 46, borderRadius: '50%', border: '3px solid #fff',
          background: `linear-gradient(135deg,${primary},${GOLD})`, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          boxShadow: '0 6px 16px rgba(74,47,46,0.35)',
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

// ══════════════════════════════════════════════════════════════════
// Main component
// ══════════════════════════════════════════════════════════════════
export default function DriedBloomRomanceTemplate({ couple }: { couple: Couple }) {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#f3d9dc" }} />}>
      <DriedBloomRomanceInner couple={couple} />
    </Suspense>
  )
}

function DriedBloomRomanceInner({ couple }: { couple: Couple }) {
  const searchParams = useSearchParams()
  const guestName = searchParams.get('name') || ''
  const introEnabled = (couple as any).show_guest_intro !== false
  const [showIntro, setShowIntro] = useState(!!guestName && introEnabled)
  const [opened, setOpened] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const PRIMARY = couple.custom_colors?.primary || DEFAULT_PALETTE.primary
  const PRIMARY_LIGHT = couple.custom_colors?.primaryLight || DEFAULT_PALETTE.primaryLight
  const DARK = couple.custom_colors?.dark || DEFAULT_PALETTE.dark
  const CREAM = couple.custom_colors?.cream || DEFAULT_PALETTE.cream
  const MUTED = DEFAULT_PALETTE.muted

  // A cover video is optional and only ever plays in the opened hero
  // below (never on the pre-open cover, which is the envelope
  // animation) — same "explicit video wins, else fall back only when
  // no custom photo" rule used on the sibling video-hero templates.
  const hasCustomPhoto = !!couple.couple_photo
  const explicitCoverVideo = (couple as any).cover_video_url || ''
  const coverVideoUrl = explicitCoverVideo || (hasCustomPhoto ? '' : DEFAULT_COVER_VIDEO)
  const songUrl = couple.song_url || DEFAULT_SONG_URL

  // Hero photo fallback state — mirrors the fix applied to sibling
  // templates: if neither the couple's own photo nor the bundled
  // default photo loads, fall back to a decorative gradient instead
  // of leaving a flat, empty block.
  const [heroPhotoOk, setHeroPhotoOk] = useState(true)

  useEffect(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; audioRef.current = null }
    const audio = new Audio(songUrl)
    audio.loop = true; audio.volume = 0.6; audioRef.current = audio
    return () => { audio.pause(); audio.src = "" }
  }, [songUrl])

  const handleOpen = () => {
    setOpened(true)
    audioRef.current?.play().catch(() => {})
  }

  const EVENT_META: Record<'engagement' | 'wedding' | 'homecoming', { label: string; icon: string }> = {
    engagement: { label: 'Engagement', icon: '💍' },
    wedding: { label: 'Wedding Ceremony', icon: '🌸' },
    homecoming: { label: 'Homecoming', icon: '🏡' },
  }
  type RenderableEvent = { key: 'engagement' | 'wedding' | 'homecoming'; label: string; icon: string; enabled: boolean; venue: string; venue_address: string; date: string; maps_url: string }
  const hasNewEvents = couple.events && Object.keys(couple.events).length > 0
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
    introText: (couple as any).intro_text || "Two hearts, one beautiful beginning — bound together with love and gratitude",
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

  const monogram = `${(W.bride || 'A')[0]}${(W.groom || 'B')[0]}`.toUpperCase()

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", minHeight: "100vh", background: CREAM }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Great+Vibes&family=Inter:wght@300;400;500;600&display=swap');
        @keyframes spin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
        input::placeholder, textarea::placeholder { color: #c7aeab; }
      `}</style>

      <AnimatePresence>
        {showIntro && guestName && (
          <GuestIntroScreen guestName={guestName} onDone={() => setShowIntro(false)} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} cream={CREAM} />
        )}
      </AnimatePresence>

      <div style={{ maxWidth: 480, margin: "0 auto", background: CREAM, boxShadow: "0 0 80px rgba(74,47,46,0.1)", position: "relative" }}>

        {/* ══ COVER — animated envelope + wax seal + sliding card ══ */}
        <AnimatePresence>
          {!opened && (
            <motion.div key="cover" exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.6 }}
              style={{
                minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                position: "relative", overflow: "hidden",
                background: `radial-gradient(ellipse 100% 80% at 50% 0%, ${PRIMARY_LIGHT} 0%, ${PRIMARY}66 60%, ${DARK}22 100%), linear-gradient(180deg, ${PRIMARY_LIGHT} 0%, #e8c3c5 100%)`,
              }}>

              {/* Subtle fabric-like texture */}
              <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(rgba(74,47,46,0.05) 1px, transparent 1px)`, backgroundSize: "22px 22px", zIndex: 1 }} />
              <FloatingPetals count={16} color={GOLD_LIGHT} />

              {/* Envelope + card stage */}
              <div style={{ position: "relative", width: 250, height: 250, marginTop: -10, marginBottom: 6, zIndex: 5 }}>

                {/* Card — slides up out of the envelope */}
                <motion.div
                  initial={{ y: 78, opacity: 0, rotate: -2 }}
                  animate={{ y: -18, opacity: 1, rotate: 0 }}
                  transition={{ delay: 1.15, duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    position: "absolute", left: "50%", bottom: 30, transform: "translateX(-50%)",
                    width: 205, minHeight: 230, background: CREAM, borderRadius: 6, zIndex: 4,
                    boxShadow: "0 18px 44px rgba(74,47,46,0.32), 0 2px 8px rgba(74,47,46,0.18)",
                    padding: "22px 16px", textAlign: "center", border: `1px solid ${PRIMARY_LIGHT}88`,
                  }}
                >
                  <SprigIcon color={GOLD} size={32} opacity={0.85} />
                  <div style={{ fontSize: 8.5, letterSpacing: "0.35em", textTransform: "uppercase", color: `${PRIMARY}cc`, marginTop: 10 }}>Wedding Invitation</div>
                  <div style={{ height: 1, width: 44, background: `${GOLD}88`, margin: "10px auto" }} />
                  <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "1.7rem", color: DARK, lineHeight: 1.15 }}>{W.bride}</div>
                  <div style={{ fontSize: "1rem", color: GOLD, margin: "1px 0" }}>&amp;</div>
                  <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "1.7rem", color: DARK, lineHeight: 1.15 }}>{W.groom}</div>
                  {/* Ribbon + seal detail on the card face, echoing the reference stationery */}
                  <div style={{ position: "absolute", left: 0, right: 0, top: "58%", height: 16, background: `linear-gradient(90deg, transparent, ${GOLD}bb 15%, ${GOLD}bb 85%, transparent)`, opacity: 0.8 }} />
                  <div style={{ position: "absolute", left: "50%", top: "58%", transform: "translate(-50%,-50%)" }}>
                    <WaxSeal initials={monogram} size={30} />
                  </div>
                </motion.div>

                {/* Envelope body */}
                <div style={{
                  position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)",
                  width: 250, height: 155, borderRadius: 8, zIndex: 3,
                  background: `linear-gradient(160deg, ${PRIMARY_LIGHT} 0%, ${PRIMARY} 100%)`,
                  boxShadow: "0 14px 30px rgba(74,47,46,0.3)",
                }} />

                {/* Envelope flap — tilts, lifts and fades away to "open" */}
                <motion.div
                  initial={{ opacity: 1, y: 0, rotate: 0 }}
                  animate={{ opacity: 0, y: -58, rotate: -7 }}
                  transition={{ delay: 0.55, duration: 0.85, ease: "easeInOut" }}
                  style={{ position: "absolute", left: "50%", bottom: 82, transform: "translateX(-50%)", zIndex: 6 }}
                >
                  <svg width={250} height={90} viewBox="0 0 250 90" style={{ display: "block" }}>
                    <polygon points="4,4 125,78 246,4" fill={PRIMARY} stroke={`${DARK}22`} strokeWidth="1" />
                  </svg>
                  {/* Wax seal — cracks and fades slightly before the flap lifts */}
                  <motion.div
                    initial={{ opacity: 1, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.2 }}
                    transition={{ delay: 0.35, duration: 0.4 }}
                    style={{ position: "absolute", left: "50%", top: 46, transform: "translate(-50%,-50%)" }}
                  >
                    <WaxSeal initials={monogram} size={46} />
                  </motion.div>
                </motion.div>
              </div>

              {/* Text content — fades in once the card has settled */}
              <motion.div
                initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.35, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                style={{ textAlign: "center", width: "84%", maxWidth: 340, position: "relative", zIndex: 10, padding: "0 1rem" }}
              >
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.5)", backdropFilter: "blur(6px)", borderRadius: 100, padding: "6px 16px", fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: DARK, marginBottom: "1rem", border: `1px solid ${GOLD}55` }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: GOLD, display: "inline-block" }} />
                  {(couple as any).cover_badge_text || `${eventsList[0]?.label || "Wedding"} Invitation`}
                </div>

                {guestName && (
                  <div style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: `${PRIMARY}dd`, marginBottom: "0.6rem", fontWeight: 700 }}>Dear {guestName}</div>
                )}

                <div style={{ color: DARK, opacity: 0.75, lineHeight: 1.8, marginBottom: "1.4rem", fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "0.95rem" }}>
                  {W.introText}
                </div>

                <button onClick={handleOpen} style={{
                  display: "inline-flex", alignItems: "center", gap: 10,
                  background: `linear-gradient(135deg,${DARK},${PRIMARY})`, color: "#fff",
                  border: `1px solid ${GOLD}99`, borderRadius: 100, padding: "13px 28px",
                  fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase",
                  cursor: "pointer", fontFamily: "'Inter',sans-serif", fontWeight: 700,
                  boxShadow: `0 10px 26px rgba(74,47,46,0.35), inset 0 0 0 1px ${GOLD_LIGHT}22`,
                }}>
                  Open Invitation <span style={{ color: GOLD_LIGHT }}>→</span>
                </button>
                <div style={{ fontSize: 9, color: `${DARK}99`, marginTop: 12 }}>🎵 Tap to begin — with music</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ INVITATION ══ */}
        {opened && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>

            {/* Hero */}
            <div style={{ position: "relative", height: 480, overflow: "hidden" }}>
              {coverVideoUrl ? (
                <video autoPlay loop muted playsInline preload="auto" poster={W.couplePhoto} style={{ width: "100%", height: "100%", objectFit: "cover" }}>
                  <source src={coverVideoUrl} type="video/mp4" />
                </video>
              ) : heroPhotoOk ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={W.couplePhoto} alt={`${W.bride} and ${W.groom}`} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 25%" }}
                  onError={e => {
                    const img = e.currentTarget as HTMLImageElement
                    if (img.src.endsWith(DEFAULT_PHOTO)) { setHeroPhotoOk(false); return }
                    img.src = DEFAULT_PHOTO
                  }} />
              ) : (
                <>
                  <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 90% 70% at 50% 20%, ${PRIMARY} 0%, ${DARK} 70%)` }} />
                  <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)`, backgroundSize: "28px 28px" }} />
                </>
              )}
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top,${CREAM} 0%,rgba(74,47,46,0.1) 55%,rgba(74,47,46,0.32) 100%)` }} />

              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "2rem 1.5rem", textAlign: "center", zIndex: 5 }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <div style={{ fontSize: 9, letterSpacing: "0.5em", textTransform: "uppercase", color: "rgba(255,255,255,0.85)", marginBottom: "0.8rem" }}>{(couple as any).together_with_text || "Together with their families"}</div>
                  <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "clamp(2.6rem,9vw,4.2rem)", color: "#fff", lineHeight: 1, textShadow: "0 2px 20px rgba(0,0,0,0.35)" }}>
                    {W.bride}
                    <span style={{ display: "block", fontSize: "2rem", color: GOLD_LIGHT, margin: "0.2rem 0" }}>&amp;</span>
                    {W.groom}
                  </div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
                    <a href="#rsvp" style={{ background: `linear-gradient(135deg,${PRIMARY},${GOLD})`, color: "#fff", borderRadius: 100, padding: "10px 22px", fontSize: 11, letterSpacing: "0.15em", textDecoration: "none", fontWeight: 700 }}>RSVP</a>
                    <a href={normalizeMapsUrl(eventsList[0]?.maps_url || couple.maps_url || '')} target="_blank" rel="noopener noreferrer"
                      style={{ background: "rgba(0,0,0,0.2)", backdropFilter: "blur(8px)", color: "#fff", border: `1.5px solid ${GOLD_LIGHT}`, borderRadius: 100, padding: "10px 22px", fontSize: 11, letterSpacing: "0.15em", textDecoration: "none", fontWeight: 600 }}>Location</a>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Family card */}
            {(W.brideFamilyName || W.groomFamilyName) && (
              <motion.div style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={eyebrow(`${PRIMARY}aa`)}>💐 Our Families</div>
                <div style={{ textAlign: "center", padding: "16px 14px", background: `${PRIMARY_LIGHT}33`, borderRadius: 12, fontSize: 13, color: DARK, lineHeight: 1.9 }}>
                  {W.groomFamilyName && <div style={{ fontWeight: 700 }}>{W.groomFamilyName}</div>}
                  {W.groomFamilyName && W.brideFamilyName && (
                    <div style={{ fontSize: 11, color: MUTED, margin: "2px 0" }}>{(couple as any).together_with_text || "together with"}</div>
                  )}
                  {W.brideFamilyName && <div style={{ fontWeight: 700 }}>{W.brideFamilyName}</div>}
                  {(() => {
                    const txt = (couple as any).family_invitation_text
                    const trimmed = (txt || '').trim()
                    if (!trimmed) return null
                    const lines = trimmed.split('\n')
                    return <div style={{ color: MUTED, marginTop: 8 }}>{lines.map((l: string, i: number) => <span key={i}>{l}{i < lines.length - 1 && <br />}</span>)}</div>
                  })()}
                </div>
              </motion.div>
            )}

            {/* Events */}
            {eventsList.map(ev => {
              const evDate = new Date(ev.date)
              const evDateDisplay = evDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
              const evTimeDisplay = evDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) + ' Onwards'
              return (
                <motion.div key={ev.key} style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <div style={eyebrow(`${PRIMARY}aa`)}>{ev.icon} Save the Date</div>
                  <div style={heading(DARK)}>{ev.label}</div>
                  {[
                    { icon: "📅", label: "Date", val: evDateDisplay },
                    { icon: "⏰", label: "Time", val: evTimeDisplay },
                    { icon: "📍", label: "Venue", val: ev.venue || couple.venue || "", sub: ev.venue_address || couple.venue_address || "" },
                  ].map(d => (
                    <div key={d.label} style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "12px 0", borderBottom: `1px solid ${PRIMARY_LIGHT}66` }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${PRIMARY_LIGHT}55`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>{d.icon}</div>
                      <div>
                        <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: `${PRIMARY}88` }}>{d.label}</div>
                        <div style={{ fontSize: 15, color: DARK, fontWeight: 700, marginTop: 2 }}>{d.val}</div>
                        {d.sub && <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{d.sub}</div>}
                      </div>
                    </div>
                  ))}
                  {ev.maps_url && (
                    <a href={normalizeMapsUrl(ev.maps_url)} target="_blank" rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: `${PRIMARY_LIGHT}55`, borderRadius: 100, padding: "10px 20px", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: PRIMARY, marginTop: 16, textDecoration: "none", fontWeight: 600 }}>
                      📍 View Location on Maps
                    </a>
                  )}
                </motion.div>
              )
            })}

            {/* Countdown */}
            {sv.countdown && (
              <motion.div id="savethedate" style={{ ...cardStyle(), textAlign: "center" }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={eyebrow(`${PRIMARY}aa`)}>Counting Down to Our Big Day</div>
                <Countdown targetDate={W.date} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} />
              </motion.div>
            )}

            {/* RSVP */}
            <div id="rsvp">
              <RSVP coupleId={couple.id} askDrinking={couple.ask_drinking} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} cream={CREAM} muted={MUTED} guestName={guestName} />
            </div>

            {/* Timeline */}
            {sv.timeline && W.timeline.length > 0 && (
              <motion.div style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={eyebrow(`${PRIMARY}aa`)}>Our Celebration</div>
                <div style={heading(DARK)}>Event Timeline</div>
                <div style={{ position: "relative", paddingLeft: 20 }}>
                  <div style={{ position: "absolute", left: 6, top: 0, bottom: 0, width: 1, background: `${PRIMARY_LIGHT}aa` }} />
                  {W.timeline.map((t, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                      style={{ position: "relative", padding: "10px 0 10px 20px" }}>
                      <div style={{ position: "absolute", left: -14, top: 14, width: 10, height: 10, borderRadius: "50%", background: PRIMARY, border: "2px solid #fff", boxShadow: `0 0 0 2px ${GOLD_LIGHT}` }} />
                      <div style={{ fontSize: 11, fontWeight: 600, color: PRIMARY, letterSpacing: "0.1em" }}>{t.time}</div>
                      <div style={{ fontSize: 13, color: DARK, fontWeight: 500, marginTop: 2 }}>{t.event}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Guest Wishes Wall */}
            {((couple as any).enable_guest_wishes ?? false) && (
              <motion.div id="wishes" style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={eyebrow(`${PRIMARY}aa`)}>With Love</div>
                <div style={heading(DARK)}>Wishes for Us</div>
                <div style={{ fontSize: 12.5, color: MUTED, textAlign: "center", marginBottom: 16, marginTop: -8 }}>
                  Share your wishes and blessings with {W.bride} &amp; {W.groom}.
                </div>
                <WishesWall coupleId={couple.id} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} cream={CREAM} muted={MUTED} />
              </motion.div>
            )}

            {/* Seat Finder */}
            {sv.seat_finder && couple.show_seating && Object.keys(W.seats).length > 0 && (
              <motion.div style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={eyebrow(`${PRIMARY}aa`)}>Be Our Guest</div>
                <div style={heading(DARK)}>Find Your Table</div>
                <div style={{ fontSize: 13, color: MUTED, marginBottom: 4 }}>Search your name to find your assigned table</div>
                <SeatFinder seats={W.seats} primary={PRIMARY} dark={DARK} cream={CREAM} muted={MUTED} />
              </motion.div>
            )}

            {/* Music */}
            {sv.music && (
              <motion.div style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={eyebrow(`${PRIMARY}aa`)}>Our Song</div>
                <MusicPlayerUI title={W.song} artist={W.artist} songUrl={songUrl} audioRef={audioRef} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} muted={MUTED} />
              </motion.div>
            )}

            {/* Gallery */}
            {sv.gallery && W.gallery.length > 0 && (
              <motion.div id="gallery" style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={eyebrow(`${PRIMARY}aa`)}>Our Celebration</div>
                <div style={heading(DARK)}>Moments of Love</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {W.gallery.map((src, i) => (
                    <div key={i} style={{ gridRow: i === 0 ? "span 2" : undefined, borderRadius: 16, overflow: "hidden", background: `${PRIMARY_LIGHT}55`, aspectRatio: i === 0 ? "1/2" : "1/1", boxShadow: "0 4px 16px rgba(74,47,46,0.12)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => (e.currentTarget.style.display = "none")} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Contact Numbers */}
            {contactList.length > 0 && (
              <motion.div id="contact" style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={eyebrow(`${PRIMARY}aa`)}>Get In Touch</div>
                <div style={heading(DARK)}>Contact Numbers</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {contactList.map((c, i) => <ContactRow key={i} name={c.name} phone={c.phone} primary={PRIMARY} />)}
                </div>
              </motion.div>
            )}

            {/* Wedding Note */}
            {((couple as any).show_wedding_note ?? true) && (couple as any).wedding_note_text && (couple as any).wedding_note_text.trim() && (
              <motion.div
                style={{
                  ...cardStyle(), textAlign: "center",
                  background: `linear-gradient(180deg, ${PRIMARY_LIGHT}44 0%, #fff 58%)`,
                  border: `1px solid ${GOLD}55`,
                  boxShadow: `0 12px 36px ${PRIMARY}26, 0 2px 20px rgba(74,47,46,0.06)`,
                }}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              >
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, transparent, ${PRIMARY}, ${GOLD}, ${PRIMARY}, transparent)` }} />
                <div style={{ display: "flex", justifyContent: "center", margin: "4px auto 12px" }}><WaxSeal initials={monogram} size={44} /></div>
                <div style={eyebrow(`${PRIMARY}aa`)}>A Note For You</div>
                {guestName && (
                  <div style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: PRIMARY, marginBottom: 8, fontWeight: 600 }}>
                    Dear {guestName}
                  </div>
                )}
                <div style={{ maxWidth: 340, margin: "0 auto 16px" }}>
                  {(couple as any).wedding_note_text.split('\n').map((raw: string, i: number) => {
                    const line = raw.trim()
                    if (!line) return null
                    const isEmphasis = line === line.toUpperCase() && /[A-Z]/.test(line)
                    if (isEmphasis) {
                      return (
                        <div key={i} style={{
                          display: "inline-block", margin: "10px 4px 2px", padding: "8px 16px",
                          borderRadius: 100, border: `1px solid ${PRIMARY}55`, background: `${PRIMARY_LIGHT}44`,
                          fontSize: 11, letterSpacing: "0.15em", fontWeight: 700, color: PRIMARY,
                        }}>{line}</div>
                      )
                    }
                    return (
                      <div key={i} style={{ fontSize: "0.95rem", color: DARK, opacity: 0.85, lineHeight: 1.9, fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", marginBottom: 4 }}>
                        {line}
                      </div>
                    )
                  })}
                </div>
                <div style={{ display: "flex", justifyContent: "center" }}><SprigIcon color={PRIMARY} size={30} opacity={0.9} /></div>
                <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "1.8rem", color: PRIMARY, marginTop: 14 }}>
                  {W.bride}<span style={{ margin: "0 8px" }}>&amp;</span>{W.groom}
                </div>
              </motion.div>
            )}

            {/* Thank You */}
            {sv.thank_you && (
              <motion.div style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={eyebrow(`${PRIMARY}aa`)}>A Special Note</div>
                <div style={heading(DARK)}>To Our Lovely Guests</div>
                <div style={{ textAlign: "center", fontSize: 13, color: DARK, lineHeight: 2 }}>
                  {(couple as any).thank_you_text || "With hearts full of love and gratitude, we are so happy to celebrate this beautiful chapter of our lives with you. Your presence means more to us than words can truly express, and having you by our side makes this day even more meaningful.\n\nThank you for your love, your blessings, and for being part of our journey."}
                </div>
                <div style={{ textAlign: "center", marginTop: 18 }}>
                  <div style={{ fontSize: 11, color: MUTED, letterSpacing: "0.1em" }}>With all our love,</div>
                  <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "1.8rem", color: PRIMARY, marginTop: 4 }}>{W.bride} &amp; {W.groom}</div>
                </div>
              </motion.div>
            )}

            {/* Footer */}
            <div style={{ padding: "2rem 1.5rem 6rem", textAlign: "center", background: "#fff", borderTop: `1px solid ${PRIMARY_LIGHT}88`, borderRadius: "22px 22px 0 0" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                <SprigIcon color={PRIMARY} size={40} opacity={0.55} />
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
          mapsUrl={couple.maps_url || ''}
          hasWishes={(couple as any).enable_guest_wishes ?? false}
          hasGallery={sv.gallery && W.gallery.length > 0}
          hasContact={contactList.length > 0}
          audioRef={audioRef}
        />
      )}
    </div>
  )
}
