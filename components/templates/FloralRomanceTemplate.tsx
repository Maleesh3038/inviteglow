"use client"
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, Couple } from '@/lib/supabase'

const DEFAULT_PHOTO = "/images/hero-floral.png"
const DEFAULT_SONG_URL = "/audio/calm-wedding.mp3"
const DEFAULT_SONG_TITLE = "Calm Wedding Theme"
const DEFAULT_SONG_ARTIST = "InviteGlow"

const DEFAULT_PALETTE = {
  primary: "#c4607a",
  primaryLight: "#e8a0b8",
  dark: "#3d1a2a",
  cream: "#fdf0f0",
  muted: "#9a7080",
}

// ── Lotus flower SVG decoration — cover screen signature motif ──
function LotusDecoration({ color, size = 90, opacity = 0.75 }: { color: string; size?: number; opacity?: number }) {
  return (
    <svg width={size} height={size * 0.72} viewBox="0 0 120 86" style={{ opacity, display: "block" }}>
      {/* Center tall petal */}
      <path d="M60 82 Q52 52 54 14 Q58 46 60 82 Z" fill={color} opacity="0.3" />
      <path d="M60 82 Q68 52 66 14 Q62 46 60 82 Z" fill={color} opacity="0.3" />
      <path d="M54 14 Q60 4 66 14 Q62 46 60 82 Q58 46 54 14 Z" fill={color} opacity="0.15" />
      <path d="M54 14 Q60 4 66 14" fill="none" stroke={color} strokeWidth="1.2" />
      {/* Inner left petal */}
      <path d="M60 74 Q44 56 30 44 Q46 60 60 74 Z" fill={color} opacity="0.25" />
      <path d="M60 74 Q44 56 30 44" fill="none" stroke={color} strokeWidth="1.1" />
      {/* Inner right petal */}
      <path d="M60 74 Q76 56 90 44 Q74 60 60 74 Z" fill={color} opacity="0.25" />
      <path d="M60 74 Q76 56 90 44" fill="none" stroke={color} strokeWidth="1.1" />
      {/* Outer left petal */}
      <path d="M60 76 Q38 64 14 60 Q40 68 60 76 Z" fill={color} opacity="0.18" />
      <path d="M60 76 Q38 64 14 60" fill="none" stroke={color} strokeWidth="0.9" />
      {/* Outer right petal */}
      <path d="M60 76 Q82 64 106 60 Q80 68 60 76 Z" fill={color} opacity="0.18" />
      <path d="M60 76 Q82 64 106 60" fill="none" stroke={color} strokeWidth="0.9" />
      {/* Water ripple base */}
      <ellipse cx="60" cy="82" rx="22" ry="3" fill="none" stroke={color} strokeWidth="0.8" opacity="0.4" />
      <ellipse cx="60" cy="82" rx="34" ry="4.5" fill="none" stroke={color} strokeWidth="0.6" opacity="0.25" />
      {/* Center stamen */}
      <circle cx="60" cy="78" r="3.5" fill={color} opacity="0.7" />
      <circle cx="60" cy="78" r="6" fill="none" stroke={color} strokeWidth="0.9" opacity="0.5" />
    </svg>
  )
}

// ── Countdown ──
function Countdown({ targetDate, primary, primaryLight }: { targetDate: string; primary: string; primaryLight: string }) {
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
        <div key={l} style={{ flex: 1, textAlign: "center", padding: "16px 8px" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg,${primaryLight}33,${primaryLight}1a)`, border: `2px solid ${primaryLight}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.3rem", color: primary, fontWeight: 600 }}>{v}</span>
          </div>
          <span style={{ fontSize: 8, letterSpacing: "0.25em", textTransform: "uppercase", color: `${primary}99` }}>{l}</span>
        </div>
      ))}
    </div>
  )
}

// ── Falling Petals ──
function FallingPetals({ count = 12 }: { count?: number }) {
  const petals = ['🌸', '🌷', '✿', '🌺']
  const [items, setItems] = useState<{ id: number; left: number; emoji: string; duration: number; delay: number; size: number }[]>([])
  useEffect(() => {
    setItems(Array.from({ length: count }).map((_, i) => ({
      id: i, left: Math.random() * 100,
      emoji: petals[Math.floor(Math.random() * petals.length)],
      duration: 8 + Math.random() * 8, delay: Math.random() * 10, size: 14 + Math.random() * 14,
    })))
  }, [count])
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 1 }}>
      {items.map(p => (
        <div key={p.id} style={{ position: "absolute", top: -40, left: `${p.left}%`, fontSize: p.size, opacity: 0.6, animation: `petal-fall ${p.duration}s linear ${p.delay}s infinite` }}>
          {p.emoji}
        </div>
      ))}
    </div>
  )
}

// ── Music Player ──
function MusicPlayerUI({ title, artist, audioRef, primary, primaryLight, dark, muted }: { title: string; artist: string; audioRef: React.RefObject<HTMLAudioElement | null>; primary: string; primaryLight: string; dark: string; muted: string }) {
  const [playing, setPlaying] = useState(false)
  const [prog, setProg] = useState(0)
  useEffect(() => {
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
  }, [audioRef])
  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) { audio.play().catch(() => {}) } else { audio.pause() }
  }
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
        <button onClick={toggle} style={{ width: 38, height: 38, borderRadius: "50%", background: primary, border: "none", cursor: "pointer", color: "#fff", fontSize: 14 }}>
          {playing ? "⏸" : "▶"}
        </button>
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
  const handleAccept = () => { if (!name.trim()) return; setStep("count") }
  const handleDecline = () => { if (!name.trim()) return; save("no", null, 1) }
  const handleCountNext = () => { if (askDrinking) setStep("drinking"); else save("yes", null, guestCount) }
  return (
    <div style={{ background: `linear-gradient(135deg,${primaryLight}33,${cream})`, padding: "2.5rem 1.5rem", textAlign: "center" }}>
      <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "2.2rem", color: dark, marginBottom: 6 }}>We are so happy to invite you</div>
      <div style={{ fontSize: 12, color: muted, marginBottom: 20 }}>Please enter your name and RSVP — it only takes a few seconds!</div>
      <div style={{ background: "#fff", borderRadius: 16, padding: "1.5rem", maxWidth: 380, margin: "0 auto", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
        {step === "form" && (
          <>
            <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: `${primary}99`, marginBottom: 8, textAlign: "left" }}>Your Name</div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name..."
              style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${primaryLight}`, background: cream, color: dark, fontSize: 14, outline: "none", fontFamily: "'Inter',sans-serif", marginBottom: 10, display: "block" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={handleAccept} disabled={saving} style={{ padding: 13, borderRadius: 10, background: `linear-gradient(135deg,${primary},${primaryLight})`, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "'Inter',sans-serif", opacity: saving ? 0.6 : 1 }}>
                {saving ? "..." : "✓ Joyfully Accept"}
              </button>
              <button onClick={handleDecline} disabled={saving} style={{ padding: 13, borderRadius: 10, background: `${primaryLight}33`, color: primary, border: "none", cursor: "pointer", fontSize: 13, fontFamily: "'Inter',sans-serif", opacity: saving ? 0.6 : 1 }}>
                {saving ? "..." : "✗ Regretfully Decline"}
              </button>
            </div>
          </>
        )}
        {step === "count" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ fontSize: 14, color: dark, fontWeight: 600, marginBottom: 4 }}>Wonderful, {name}! 🎉</div>
            <div style={{ fontSize: 12, color: muted, marginBottom: 16 }}>How many people will be coming, including yourself?</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 18 }}>
              <button onClick={() => setGuestCount(c => Math.max(1, c - 1))} style={{ width: 38, height: 38, borderRadius: "50%", background: `${primaryLight}33`, color: primary, border: "none", cursor: "pointer", fontSize: 18, fontWeight: 600 }}>−</button>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "2rem", color: dark, fontWeight: 600, minWidth: 50, textAlign: "center" }}>{guestCount}</div>
              <button onClick={() => setGuestCount(c => Math.min(20, c + 1))} style={{ width: 38, height: 38, borderRadius: "50%", background: `${primaryLight}33`, color: primary, border: "none", cursor: "pointer", fontSize: 18, fontWeight: 600 }}>+</button>
            </div>
            <div style={{ fontSize: 11, color: `${primary}99`, marginBottom: 16 }}>{guestCount === 1 ? "Just yourself" : `Yourself + ${guestCount - 1} ${guestCount - 1 === 1 ? "guest" : "guests"}`}</div>
            <button onClick={handleCountNext} disabled={saving} style={{ width: "100%", padding: 13, borderRadius: 10, background: `linear-gradient(135deg,${primary},${primaryLight})`, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "'Inter',sans-serif", opacity: saving ? 0.6 : 1 }}>
              {saving ? "..." : "Continue →"}
            </button>
          </motion.div>
        )}
        {step === "drinking" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ fontSize: 12, color: muted, marginBottom: 16 }}>One last quick question before you're confirmed</div>
            <div style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: `${primary}99`, marginBottom: 10, textAlign: "left" }}>Will you be having alcohol?</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={() => save("yes", "yes", guestCount)} disabled={saving} style={{ padding: 13, borderRadius: 10, background: `${primaryLight}33`, color: primary, border: `1.5px solid ${primaryLight}`, cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "'Inter',sans-serif", opacity: saving ? 0.6 : 1 }}>🍷 Yes, please</button>
              <button onClick={() => save("yes", "no", guestCount)} disabled={saving} style={{ padding: 13, borderRadius: 10, background: `${primaryLight}33`, color: primary, border: `1.5px solid ${primaryLight}`, cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "'Inter',sans-serif", opacity: saving ? 0.6 : 1 }}>🥤 No, thanks</button>
            </div>
          </motion.div>
        )}
        {step === "done" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: "1rem 0", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{finalResponse === "yes" ? "🎉" : "💙"}</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.3rem", fontStyle: "italic", color: primary, marginBottom: 4 }}>
              {finalResponse === "yes" ? `See you there, ${name}!` : `We'll miss you, ${name}.`}
            </div>
            <div style={{ fontSize: 12, color: muted }}>
              {finalResponse === "yes" ? (guestCount > 1 ? `We've noted your party of ${guestCount} — we can't wait to celebrate with you all!` : "We can't wait to celebrate with you!") : "Thank you for letting us know."}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

// ── Seat Finder ──
function SeatFinder({ seats, primary, dark, cream, muted }: { seats: Record<string, string>; primary: string; dark: string; cream: string; muted: string }) {
  const [q, setQ] = useState("")
  const [res, setRes] = useState("")
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
        <button onClick={search} style={{ padding: "12px 18px", borderRadius: 10, background: primary, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "'Inter',sans-serif" }}>Search</button>
      </div>
      {res && <div style={{ marginTop: 12, fontSize: 14, color: res.startsWith("🌸") ? primary : muted, fontWeight: res.startsWith("🌸") ? 500 : 400 }}>{res}</div>}
    </>
  )
}

const cardStyle = (): React.CSSProperties => ({ background: "#fff", margin: "0 16px 16px", borderRadius: 24, padding: "1.8rem", boxShadow: "0 2px 20px rgba(0,0,0,0.07)" })
const pretitleStyle = (primaryLight: string): React.CSSProperties => ({ fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color: primaryLight, textAlign: "center", marginBottom: 6 })
const titleStyle = (dark: string): React.CSSProperties => ({ fontFamily: "'Great Vibes',cursive", fontSize: "2rem", color: dark, textAlign: "center", marginBottom: "1.5rem" })

export default function FloralRomanceTemplate({ couple }: { couple: Couple }) {
  const [opened, setOpened] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const PRIMARY = couple.custom_colors?.primary || DEFAULT_PALETTE.primary
  const PRIMARY_LIGHT = couple.custom_colors?.primaryLight || DEFAULT_PALETTE.primaryLight
  const DARK = couple.custom_colors?.dark || DEFAULT_PALETTE.dark
  const CREAM = couple.custom_colors?.cream || DEFAULT_PALETTE.cream
  const MUTED = DEFAULT_PALETTE.muted

  useEffect(() => {
    const songUrl = couple.song_url || DEFAULT_SONG_URL
    const audio = new Audio(songUrl)
    audio.loop = true
    audio.volume = 0.6
    audioRef.current = audio
    return () => { audio.pause(); audio.src = "" }
  }, [couple])

  const handleOpenInvitation = () => {
    setOpened(true)
    audioRef.current?.play().catch(() => {})
  }

  const EVENT_META: Record<'engagement' | 'wedding' | 'homecoming', { label: string; icon: string }> = {
    engagement: { label: 'Engagement', icon: '💍' },
    wedding: { label: 'Wedding Ceremony', icon: '👰' },
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
    dateDisplay: new Date(couple.wedding_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    venue: couple.venue || '',
    couplePhoto: couple.couple_photo || DEFAULT_PHOTO,
    song: couple.song_title || DEFAULT_SONG_TITLE, artist: couple.song_artist || DEFAULT_SONG_ARTIST,
    timeline: couple.timeline || [], seats: couple.seats || {}, gallery: couple.gallery || [],
  }

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", minHeight: "100vh", background: "#f3e8e8" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Inter:wght@300;400;500;600&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0) rotate(0deg);} 50%{transform:translateY(-18px) rotate(8deg);} }
        @keyframes spin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
        @keyframes pulse-pink { 0%,100%{box-shadow:0 0 0 0 rgba(196,96,122,0.3);} 50%{box-shadow:0 0 0 14px rgba(196,96,122,0);} }
        @keyframes petal-fall {
          0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.6; }
          50% { transform: translateY(50vh) translateX(20px) rotate(180deg); }
          90% { opacity: 0.6; }
          100% { transform: translateY(105vh) translateX(-15px) rotate(360deg); opacity: 0; }
        }
        input::placeholder { color: #c4a0b0; }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto", background: CREAM, boxShadow: "0 0 80px rgba(0,0,0,0.06)", position: "relative" }}>

        {/* ══ COVER — couple photo background + lotus decoration ══ */}
        <AnimatePresence>
          {!opened && (
            <motion.div key="cover" exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.5 }}
              style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", background: DARK }}>

              {/* Couple photo as full-bleed background */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={W.couplePhoto} alt=""
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }}
                onError={e => { (e.currentTarget as HTMLImageElement).src = DEFAULT_PHOTO }} />

              {/* Soft gradient overlay so text is readable */}
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(30,8,18,0.35) 0%, rgba(30,8,18,0.12) 35%, rgba(30,8,18,0.25) 65%, rgba(30,8,18,0.65) 100%)` }} />

              {/* Lotus corner decorations */}
              <div style={{ position: "absolute", bottom: 16, left: 16, transform: "rotate(-30deg)" }}>
                <LotusDecoration color={PRIMARY_LIGHT} size={70} opacity={0.55} />
              </div>
              <div style={{ position: "absolute", bottom: 16, right: 16, transform: "rotate(30deg) scaleX(-1)" }}>
                <LotusDecoration color={PRIMARY_LIGHT} size={70} opacity={0.55} />
              </div>

              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
                style={{ textAlign: "center", width: "84%", maxWidth: 340, position: "relative", zIndex: 10, padding: "0 1rem" }}>

                {/* Lotus above names */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.6rem" }}>
                  <LotusDecoration color={PRIMARY_LIGHT} size={64} opacity={0.85} />
                </div>

                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)", borderRadius: 100, padding: "6px 14px", fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "#fff", marginBottom: "1rem", border: "1px solid rgba(255,255,255,0.25)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: PRIMARY_LIGHT, display: "inline-block" }} />
                  Wedding Invitation
                </div>

                <div style={{ fontSize: 10, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(255,255,255,0.75)", marginBottom: "0.8rem", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>You Are Invited</div>
                <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "clamp(2.8rem,10vw,4rem)", color: "#fff", lineHeight: 1, textShadow: "0 4px 24px rgba(0,0,0,0.45)" }}>{W.bride}</div>
                <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "2.3rem", color: PRIMARY_LIGHT, margin: "0.1rem 0", textShadow: "0 2px 14px rgba(0,0,0,0.4)" }}>&amp;</div>
                <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "clamp(2.8rem,10vw,4rem)", color: "#fff", lineHeight: 1, textShadow: "0 4px 24px rgba(0,0,0,0.45)" }}>{W.groom}</div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", margin: "1.1rem 0" }}>
                  <div style={{ height: 1, width: 36, background: "rgba(255,255,255,0.4)" }} />
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: PRIMARY_LIGHT }} />
                  <div style={{ height: 1, width: 36, background: "rgba(255,255,255,0.4)" }} />
                </div>

                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.7, marginBottom: "1.6rem", textShadow: "0 2px 10px rgba(0,0,0,0.4)" }}>
                  Join us as we celebrate love, joy, and<br />unforgettable moments together
                </div>

                <button onClick={handleOpenInvitation} style={{
                  display: "inline-flex", alignItems: "center", gap: 10,
                  background: `linear-gradient(135deg,${PRIMARY},${PRIMARY_LIGHT})`, color: "#fff",
                  border: "none", borderRadius: 100, padding: "13px 26px",
                  fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase",
                  cursor: "pointer", fontFamily: "'Inter',sans-serif", fontWeight: 500,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.35)", animation: "pulse-pink 2.5s ease infinite",
                }}>
                  Open Invitation →
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
            <FallingPetals count={10} />

            {/* Hero */}
            <div style={{ position: "relative", height: 500, overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg,#d4a8bc,#9b6080)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={W.couplePhoto} alt={`${W.bride} and ${W.groom}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }}
                  onError={e => { (e.currentTarget as HTMLImageElement).src = DEFAULT_PHOTO }} />
              </div>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(253,240,240,1) 0%,rgba(60,20,30,0.15) 60%,rgba(60,20,30,0.4) 100%)" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "2rem 1.5rem", textAlign: "center", zIndex: 5 }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <div style={{ fontSize: 9, letterSpacing: "0.5em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", marginBottom: "0.8rem" }}>Together with their families</div>
                  <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "clamp(2.8rem,9vw,4.5rem)", color: "#fff", lineHeight: 1, textShadow: "0 2px 20px rgba(60,20,30,0.3)" }}>
                    {W.bride}
                    <span style={{ display: "block", fontSize: "2.2rem", color: PRIMARY_LIGHT }}>&amp;</span>
                    {W.groom}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", margin: "4px 0", letterSpacing: "0.1em" }}>are getting married</div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1rem", color: "rgba(255,255,255,0.65)", fontStyle: "italic", marginTop: 4 }}>
                    {W.dateDisplay} · {W.venue}
                  </div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
                    <a href="#rsvp" style={{ background: `linear-gradient(135deg,${PRIMARY},${PRIMARY_LIGHT})`, color: "#fff", borderRadius: 100, padding: "10px 22px", fontSize: 11, letterSpacing: "0.15em", textDecoration: "none", fontFamily: "'Inter',sans-serif" }}>RSVP</a>
                    <a href="#seat" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 100, padding: "10px 22px", fontSize: 11, letterSpacing: "0.15em", textDecoration: "none", fontFamily: "'Inter',sans-serif" }}>Find My Seat</a>
                  </div>
                </motion.div>
              </div>
            </div>

            <div style={{ background: "#fff", padding: 10, display: "flex", justifyContent: "center", gap: 8, borderBottom: `1px solid ${PRIMARY_LIGHT}` }}>
              {[1, 2, 3].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: PRIMARY_LIGHT }} />)}
            </div>

            {(W.brideFamilyName || W.groomFamilyName) && (
              <motion.div style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={pretitleStyle(PRIMARY_LIGHT)}>With Love</div>
                <div style={{ textAlign: "center", padding: 12, background: "#fdf5f7", borderRadius: 12, fontSize: 13, color: "#6a3040", lineHeight: 2 }}>
                  {W.brideFamilyName && <><strong>{W.brideFamilyName}</strong><br /></>}
                  {W.brideFamilyName && W.groomFamilyName && <>together with<br /></>}
                  {W.groomFamilyName && <><strong>{W.groomFamilyName}</strong><br /></>}
                  <span style={{ color: MUTED }}>request the honour of your presence<br />to celebrate the marriage of their loving children</span>
                </div>
              </motion.div>
            )}

            {eventsList.map(ev => {
              const evDate = new Date(ev.date)
              const evDateDisplay = evDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
              const evTimeDisplay = evDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) + ' Onwards'
              return (
                <motion.div key={ev.key} style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <div style={pretitleStyle(PRIMARY_LIGHT)}>{ev.icon} Save the Date</div>
                  <div style={titleStyle(DARK)}>{ev.label}</div>
                  {[
                    { icon: "📅", label: "Date", val: evDateDisplay, pink: true },
                    { icon: "⏰", label: "Time", val: evTimeDisplay },
                    { icon: "📍", label: "Venue", val: ev.venue || couple.venue || "", sub: ev.venue_address || couple.venue_address || "" },
                  ].map(d => (
                    <div key={d.label} style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "12px 0", borderBottom: `1px solid ${PRIMARY_LIGHT}33` }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${PRIMARY_LIGHT}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>{d.icon}</div>
                      <div>
                        <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#c4a0b0" }}>{d.label}</div>
                        <div style={{ fontSize: (d as any).pink ? 18 : 15, color: (d as any).pink ? PRIMARY : DARK, fontWeight: 500, marginTop: 2, fontFamily: (d as any).pink ? "'Cormorant Garamond',serif" : "inherit", fontStyle: (d as any).pink ? "italic" : "normal" }}>{d.val}</div>
                        {d.sub && <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{d.sub}</div>}
                      </div>
                    </div>
                  ))}
                  {ev.maps_url && (
                    <a href={ev.maps_url} target="_blank" rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: `${PRIMARY_LIGHT}33`, borderRadius: 100, padding: "10px 20px", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: PRIMARY, marginTop: 16, textDecoration: "none", fontWeight: 500 }}>
                      📍 View Location on Maps
                    </a>
                  )}
                </motion.div>
              )
            })}

            {sv.countdown && (
              <div style={{ background: "#fff", padding: "1.5rem 1rem", textAlign: "center", borderTop: `1px solid ${PRIMARY_LIGHT}`, borderBottom: `1px solid ${PRIMARY_LIGHT}`, marginBottom: 16 }}>
                <div style={pretitleStyle(PRIMARY_LIGHT)}>Counting Down to Our Big Day</div>
                <Countdown targetDate={W.date} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} />
              </div>
            )}

            <div id="rsvp"><RSVP coupleId={couple.id} askDrinking={couple.ask_drinking} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} cream={CREAM} muted={MUTED} /></div>

            {sv.timeline && W.timeline.length > 0 && (
              <motion.div style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={pretitleStyle(PRIMARY_LIGHT)}>Our Celebration</div>
                <div style={titleStyle(DARK)}>The Wedding Lineup</div>
                <div style={{ position: "relative", paddingLeft: 20 }}>
                  <div style={{ position: "absolute", left: 6, top: 0, bottom: 0, width: 1, background: "#f5d0dc" }} />
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

            {sv.seat_finder && couple.show_seating && Object.keys(W.seats).length > 0 && (
              <motion.div style={cardStyle()} id="seat" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={pretitleStyle(PRIMARY_LIGHT)}>Be Our Guest</div>
                <div style={titleStyle(DARK)}>Find Your Table</div>
                <div style={{ fontSize: 13, color: MUTED, marginBottom: 4 }}>Search your name to find your assigned table</div>
                <SeatFinder seats={W.seats} primary={PRIMARY} dark={DARK} cream={CREAM} muted={MUTED} />
              </motion.div>
            )}

            {sv.music && (
              <motion.div style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={pretitleStyle(PRIMARY_LIGHT)}>Our Song</div>
                <MusicPlayerUI title={W.song} artist={W.artist} audioRef={audioRef} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} muted={MUTED} />
              </motion.div>
            )}

            {sv.gallery && W.gallery.length > 0 && (
              <motion.div style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={pretitleStyle(PRIMARY_LIGHT)}>Our Celebration</div>
                <div style={titleStyle(DARK)}>Moments of Love</div>
                <div style={{ fontSize: 12, color: MUTED, textAlign: "center", marginBottom: 16, lineHeight: 1.7 }}>
                  Holding onto the laughter, the quiet moments, and the little sparks of magic that brought us here.
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {W.gallery.map((src, i) => (
                    <div key={i} style={{ gridRow: i === 0 ? "span 2" : undefined, borderRadius: 18, overflow: "hidden", background: `${PRIMARY_LIGHT}33`, aspectRatio: i === 0 ? "1/2" : "1/1", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => (e.currentTarget.style.display = "none")} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {sv.thank_you && (
              <motion.div style={{ ...cardStyle(), borderRadius: 24 }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={pretitleStyle(PRIMARY_LIGHT)}>A Special Note</div>
                <div style={titleStyle(DARK)}>To Our Lovely Guests</div>
                <div style={{ textAlign: "center", fontSize: 13, color: "#6a3040", lineHeight: 2 }}>
                  With hearts full of love and gratitude, we are so happy to celebrate this beautiful chapter of our lives with you. Your presence means more to us than words can truly express, and having you by our side makes this day even more meaningful.
                  <br /><br />
                  Thank you for your love, your blessings, and for being part of our journey. We cannot wait to share laughter, joy, and unforgettable memories with the people who mean so much to us.
                </div>
                <div style={{ textAlign: "center", marginTop: 18 }}>
                  <div style={{ fontSize: 11, color: "#c4a0b0", letterSpacing: "0.1em" }}>With all our love,</div>
                  <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "1.8rem", color: PRIMARY, marginTop: 4 }}>{W.bride} &amp; {W.groom}</div>
                </div>
              </motion.div>
            )}

            <div style={{ padding: "2rem 1.5rem", textAlign: "center", background: "#fff", borderTop: `1px solid ${PRIMARY_LIGHT}`, borderRadius: "24px 24px 0 0" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 10, opacity: 0.5 }}>
                <LotusDecoration color={PRIMARY} size={44} opacity={0.6} />
              </div>
              <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "1.5rem", color: PRIMARY, marginBottom: 4 }}>InviteGlow</div>
              <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "#c4a0b0" }}>inviteglow.com · Digital Wedding Invitations</div>
            </div>

          </motion.div>
        )}
      </div>
    </div>
  )
}