"use client"
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, Couple } from '@/lib/supabase'

const DEFAULT_PHOTO = "/images/hero-cinematic.png"
const DEFAULT_SONG_URL = "/audio/calm-wedding.mp3"
const DEFAULT_SONG_TITLE = "Calm Wedding Theme"
const DEFAULT_SONG_ARTIST = "InviteGlow"

const DEFAULT_PALETTE = {
  primary: "#e8c468",
  primaryLight: "#f0d488",
  dark: "#1a1208",
  cream: "#241a0c",
  muted: "#a08858",
}

// ── Guest intro screen — cinematic gold shimmer, "Dear [Name]," shown for
// ~5s before the scratch card. Only appears with ?name=..., and can be
// turned off from admin via couple.show_guest_intro (defaults to on). ──
function GuestIntroScreen({ guestName, onDone, primary }: { guestName: string; onDone: () => void; primary: string }) {
  return (
    <motion.div
      key="intro"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: "easeInOut" }}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "radial-gradient(ellipse 70% 50% at 50% 30%, #2a2008 0%, #1a1208 55%, #0d0904 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "2rem", overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", width: 320, height: 320, borderRadius: "50%", background: `radial-gradient(circle, ${primary}22, transparent)`, top: "20%", left: "50%", transform: "translateX(-50%)" }} />

      <motion.div
        initial={{ scale: 0.4, opacity: 0, rotate: -8 }}
        animate={{ scale: [0.4, 1.15, 1], opacity: 1, rotate: [0, 0, 0] }}
        transition={{ duration: 1.1, ease: "easeOut", delay: 0.2 }}
        style={{
          width: 78, height: 78, borderRadius: "50%", marginBottom: "1.6rem", position: "relative", zIndex: 1,
          background: `radial-gradient(circle at 35% 30%, ${primary}, #8a6820)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 40px ${primary}55`,
        }}
      >
        <span style={{ fontSize: 30 }}>🎬</span>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.9 }}
        style={{ position: "relative", zIndex: 1, marginBottom: "1rem" }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(1.9rem,6.5vw,2.7rem)", color: "#fdf6e3", lineHeight: 1.2, fontStyle: "italic" }}>
          Dear <span style={{ color: primary, fontWeight: 600 }}>{guestName}</span>,
        </div>
      </motion.div>

      <motion.div initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ duration: 0.6, delay: 1.3 }}
        style={{ width: 56, height: 1, background: `linear-gradient(to right, transparent, ${primary}, transparent)`, margin: "0 auto 1rem" }} />

      <motion.div initial={{ opacity: 0, letterSpacing: "0.1em" }} animate={{ opacity: 1, letterSpacing: "0.4em" }} transition={{ duration: 0.9, delay: 1.6 }}
        style={{ fontSize: 10, textTransform: "uppercase", color: `${primary}bb`, fontFamily: "'Inter',sans-serif" }}>
        A Golden Invitation Awaits
      </motion.div>

      <motion.div
        style={{ position: "absolute", bottom: 0, left: 0, height: 3, background: `linear-gradient(to right,#8a6820,${primary})`, borderRadius: 100 }}
        initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 5, ease: "linear", delay: 0.4 }}
        onAnimationComplete={onDone}
      />

      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ delay: 2 }}
        onClick={onDone}
        style={{ position: "absolute", bottom: 20, right: 20, background: "transparent", border: "none", cursor: "pointer", fontSize: 12, color: primary, fontFamily: "'Inter',sans-serif", letterSpacing: "0.1em" }}>
        Skip →
      </motion.button>
    </motion.div>
  )
}

// ── Scratch-to-reveal canvas: guest drags/taps to wipe away a gold foil
// layer, revealing the couple's names underneath. Auto-completes once
// enough of the canvas has been cleared, with a fallback tap button. ──
function ScratchCard({ bride, groom, primary, onRevealed }: { bride: string; groom: string; primary: string; onRevealed: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [revealPct, setRevealPct] = useState(0)
  const isDrawing = useRef(false)
  const doneRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const resize = () => {
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      grad.addColorStop(0, '#d4a840')
      grad.addColorStop(0.5, '#f0d488')
      grad.addColorStop(1, '#b8901a')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = 'rgba(26,18,8,0.85)'
      ctx.font = '600 13px Inter, sans-serif'
      ctx.textAlign = 'center'
      for (let y = 30; y < canvas.height; y += 46) {
        ctx.fillText('SCRATCH TO REVEAL  ✦  SCRATCH TO REVEAL', canvas.width / 2, y)
      }
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const point = 'touches' in e ? e.touches[0] : e
    return { x: point.clientX - rect.left, y: point.clientY - rect.top }
  }

  const scratch = (e: React.MouseEvent | React.TouchEvent) => {
    if (doneRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(x, y, 32, 0, Math.PI * 2)
    ctx.fill()

    // Sample transparency to estimate % revealed (cheap, throttled visually by CSS)
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    let clear = 0
    for (let i = 3; i < data.length; i += 4 * 40) { if (data[i] === 0) clear++ }
    const pct = Math.min(100, Math.round((clear / (data.length / (4 * 40))) * 100))
    setRevealPct(pct)
    if (pct > 55 && !doneRef.current) {
      doneRef.current = true
      onRevealed()
    }
  }

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Names underneath, revealed as the foil is scratched away */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "clamp(2.6rem,9vw,3.8rem)", color: "#fdf6e3", lineHeight: 1 }}>{bride}</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.8rem", color: primary, margin: "2px 0" }}>&amp;</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "clamp(2.6rem,9vw,3.8rem)", color: "#fdf6e3", lineHeight: 1 }}>{groom}</div>
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={e => { isDrawing.current = true; scratch(e) }}
        onMouseMove={e => { if (isDrawing.current) scratch(e) }}
        onMouseUp={() => (isDrawing.current = false)}
        onMouseLeave={() => (isDrawing.current = false)}
        onTouchStart={e => { isDrawing.current = true; scratch(e) }}
        onTouchMove={e => { if (isDrawing.current) scratch(e) }}
        onTouchEnd={() => (isDrawing.current = false)}
        style={{ position: "absolute", inset: 0, zIndex: 2, cursor: "pointer", touchAction: "none", borderRadius: 20 }}
      />
      {revealPct < 8 && (
        <motion.div
          animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 1.8, repeat: Infinity }}
          style={{ position: "absolute", bottom: 18, left: 0, right: 0, textAlign: "center", zIndex: 3, pointerEvents: "none", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#1a1208", fontWeight: 700 }}>
          ✦ Scratch the gold to reveal ✦
        </motion.div>
      )}
    </div>
  )
}

// ── Countdown ──
function Countdown({ targetDate, primary, muted }: { targetDate: string; primary: string; muted: string }) {
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
    <div style={{ display: "flex", justifyContent: "center", gap: 12, maxWidth: 380, margin: "0 auto" }}>
      {[["Days", t.d], ["Hours", t.h], ["Mins", t.m], ["Secs", t.s]].map(([l, v]) => (
        <div key={l} style={{ flex: 1, textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 12, background: "linear-gradient(160deg,#2a2008,#1a1208)", border: `1px solid ${primary}44`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.3rem", color: primary, fontWeight: 600 }}>{v}</span>
          </div>
          <span style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: muted }}>{l}</span>
        </div>
      ))}
    </div>
  )
}

// ── Music Player ──
function MusicPlayerUI({ title, artist, audioRef, primary, dark }: { title: string; artist: string; audioRef: React.RefObject<HTMLAudioElement | null>; primary: string; dark: string }) {
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
  const toggle = () => { const a = audioRef.current; if (!a) return; a.paused ? a.play().catch(() => {}) : a.pause() }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(232,196,104,0.06)", borderRadius: 16, padding: 16, border: `1px solid ${primary}22` }}>
      <div style={{ width: 46, height: 46, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%,${primary},#8a6820)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0, animation: playing ? "spin 4s linear infinite" : "none" }}>🎵</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#fdf6e3" }}>{title}</div>
        <div style={{ fontSize: 11, color: "#a08858", marginTop: 2 }}>{artist}</div>
        <div style={{ height: 3, background: `${primary}22`, borderRadius: 100, marginTop: 8 }}>
          <div style={{ height: "100%", width: `${prog}%`, background: primary, borderRadius: 100, transition: "width 0.3s" }} />
        </div>
      </div>
      <button onClick={toggle} style={{ width: 40, height: 40, borderRadius: "50%", background: primary, border: "none", color: dark, cursor: "pointer", fontSize: 14, flexShrink: 0, fontWeight: 700 }}>
        {playing ? "⏸" : "▶"}
      </button>
    </div>
  )
}

// ── RSVP ──
function RSVP({ coupleId, askDrinking, primary, guestName }: { coupleId: string; askDrinking: boolean; primary: string; guestName: string }) {
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
  const inputStyle: React.CSSProperties = { width: "100%", padding: "13px 16px", borderRadius: 10, border: `1px solid ${primary}33`, background: "#2a2008", color: "#fdf6e3", fontSize: 14, outline: "none", marginBottom: 12, fontFamily: "'Inter',sans-serif" }
  return (
    <div style={{ background: "#1a1208", padding: "40px 1.5rem", textAlign: "center" }}>
      <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: primary, marginBottom: 8, fontWeight: 600 }}>Be Our Guest</div>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.8rem", color: "#fdf6e3", marginBottom: 24 }}>Will You Join Us?</div>
      <div style={{ background: "#241a0c", borderRadius: 16, padding: 24, maxWidth: 380, margin: "0 auto", border: `1px solid ${primary}22` }}>
        {step === "form" && (
          <>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" style={inputStyle} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={() => name.trim() && setStep("count")} style={{ padding: 13, borderRadius: 10, background: primary, color: "#1a1208", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✓ Accept</button>
              <button onClick={() => name.trim() && save("no", null, 1)} disabled={saving} style={{ padding: 13, borderRadius: 10, background: "transparent", color: "#a08858", border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer", fontSize: 12, opacity: saving ? 0.6 : 1 }}>
                {saving ? "..." : "✗ Decline"}
              </button>
            </div>
          </>
        )}
        {step === "count" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ fontSize: 13, color: "#fdf6e3", fontWeight: 600, marginBottom: 16 }}>How many people, including you?</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 16 }}>
              <button onClick={() => setGuestCount(c => Math.max(1, c - 1))} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.06)", color: primary, border: "none", cursor: "pointer", fontSize: 16 }}>−</button>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.8rem", color: "#fdf6e3", minWidth: 40 }}>{guestCount}</div>
              <button onClick={() => setGuestCount(c => Math.min(20, c + 1))} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.06)", color: primary, border: "none", cursor: "pointer", fontSize: 16 }}>+</button>
            </div>
            <button onClick={() => askDrinking ? setStep("drinking") : save("yes", null, guestCount)} disabled={saving} style={{ width: "100%", padding: 13, borderRadius: 10, background: primary, color: "#1a1208", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, opacity: saving ? 0.6 : 1 }}>
              {saving ? "..." : "Continue →"}
            </button>
          </motion.div>
        )}
        {step === "drinking" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ fontSize: 12, color: "#a08858", marginBottom: 14 }}>Will you be having alcohol?</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={() => save("yes", "yes", guestCount)} disabled={saving} style={{ padding: 13, borderRadius: 10, background: `${primary}22`, color: primary, border: `1px solid ${primary}44`, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>🍷 Yes</button>
              <button onClick={() => save("yes", "no", guestCount)} disabled={saving} style={{ padding: 13, borderRadius: 10, background: `${primary}22`, color: primary, border: `1px solid ${primary}44`, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>🥤 No</button>
            </div>
          </motion.div>
        )}
        {step === "done" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{finalResponse === "yes" ? "🎉" : "💙"}</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.3rem", color: primary, marginBottom: 4 }}>
              {finalResponse === "yes" ? `See you there, ${name}!` : `We'll miss you, ${name}.`}
            </div>
            <div style={{ fontSize: 12, color: "#a08858" }}>
              {finalResponse === "yes" ? (guestCount > 1 ? `Party of ${guestCount} confirmed!` : "We can't wait to celebrate with you.") : "Thank you for letting us know."}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

// ── Seat Finder ──
function SeatFinder({ seats, primary }: { seats: Record<string, string>; primary: string }) {
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
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && search()} placeholder="Enter your name..."
          style={{ flex: 1, padding: "13px 16px", borderRadius: 10, border: `1px solid ${primary}33`, background: "#2a2008", color: "#fdf6e3", fontSize: 14, outline: "none", fontFamily: "'Inter',sans-serif" }} />
        <button onClick={search} style={{ padding: "13px 20px", borderRadius: 10, background: primary, color: "#1a1208", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Search</button>
      </div>
      {res && <div style={{ marginTop: 12, fontSize: 14, color: res.startsWith("You") ? primary : "#a08858", fontWeight: res.startsWith("You") ? 600 : 400 }}>{res}</div>}
    </div>
  )
}

const sectionCard = (primary: string): React.CSSProperties => ({ background: "#241a0c", margin: "0 16px 16px", borderRadius: 22, padding: "1.8rem", border: `1px solid ${primary}1a` })
const sectionEyebrow = (primary: string): React.CSSProperties => ({ fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color: primary, textAlign: "center", marginBottom: 6, fontWeight: 600 })
const sectionTitle = (): React.CSSProperties => ({ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.5rem", color: "#fdf6e3", textAlign: "center", marginBottom: 20 })

export default function CinematicGoldTemplate({ couple }: { couple: Couple }) {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#1a1208" }} />}>
      <CinematicGoldInner couple={couple} />
    </Suspense>
  )
}

function CinematicGoldInner({ couple }: { couple: Couple }) {
  const searchParams = useSearchParams()
  const guestName = searchParams?.get('name') || ''
  const introEnabled = (couple as any).show_guest_intro !== false
  const [showIntro, setShowIntro] = useState(!!guestName && introEnabled)
  const [scratched, setScratched] = useState(false)
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

  const handleRevealed = () => {
    setScratched(true)
    audioRef.current?.play().catch(() => {})
  }

  const EVENT_META: Record<'engagement' | 'wedding' | 'homecoming', { label: string; icon: string }> = {
    engagement: { label: 'Engagement', icon: '💍' }, wedding: { label: 'Wedding Ceremony', icon: '👰' }, homecoming: { label: 'Homecoming', icon: '🏡' },
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
    song: couple.song_title || DEFAULT_SONG_TITLE, artist: couple.song_artist || DEFAULT_SONG_ARTIST,
    timeline: couple.timeline || [], seats: couple.seats || {}, gallery: couple.gallery || [],
  }

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", minHeight: "100vh", background: "#1a1208" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Inter:wght@300;400;500;600&display=swap');
        @keyframes spin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
        @keyframes shimmer { 0%{background-position:-200% 0;} 100%{background-position:200% 0;} }
        input::placeholder { color: #6a5a3a; }
      `}</style>

      <AnimatePresence>
        {showIntro && guestName && (
          <GuestIntroScreen guestName={guestName} onDone={() => setShowIntro(false)} primary={PRIMARY} />
        )}
      </AnimatePresence>

      <div style={{ maxWidth: 480, margin: "0 auto", background: DARK, position: "relative", overflow: "hidden" }}>

        {/* ══ SCRATCH-TO-REVEAL COVER ══ */}
        <AnimatePresence>
          {!opened && (
            <motion.div key="cover" exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.6 }}
              style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", padding: "2rem 1.2rem", background: "radial-gradient(ellipse 70% 50% at 50% 25%, #2a2008 0%, #1a1208 55%, #0d0904 100%)" }}>

              <div style={{
                fontSize: 10, letterSpacing: "0.4em", textTransform: "uppercase", color: `${PRIMARY}bb`,
                marginBottom: "1.4rem", background: "linear-gradient(90deg,transparent,rgba(232,196,104,0.15),transparent)",
                backgroundSize: "200% 100%", animation: "shimmer 3s linear infinite", padding: "6px 18px", borderRadius: 100, border: `1px solid ${PRIMARY}33`,
              }}>
                {(couple as any).cover_badge_text || 'A Cinematic Love Story'}
              </div>

              <div style={{ width: "100%", maxWidth: 340, aspectRatio: "1/1", borderRadius: 20, overflow: "hidden", boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px ${PRIMARY}33`, position: "relative" }}>
                <ScratchCard bride={W.bride} groom={W.groom} primary={PRIMARY} onRevealed={handleRevealed} />
              </div>

              <AnimatePresence>
                {scratched && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
                    style={{ textAlign: "center", marginTop: "1.6rem" }}>
                    <div style={{ fontSize: 11, color: "#a08858", marginBottom: 14, letterSpacing: "0.05em" }}>
                      {new Date(W.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setOpened(true)}
                      style={{
                        padding: "14px 32px", borderRadius: 100, border: "none",
                        background: `linear-gradient(135deg,${PRIMARY_LIGHT},${PRIMARY})`, color: "#1a1208",
                        fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer",
                        fontFamily: "'Inter',sans-serif", fontWeight: 700, boxShadow: `0 8px 30px ${PRIMARY}55`,
                      }}>
                      Open Invitation →
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ INVITATION ══ */}
        {opened && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>

            <div style={{ position: "relative", height: 460, overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={W.couplePhoto} alt={`${W.bride} and ${W.groom}`} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }}
                onError={e => { (e.currentTarget as HTMLImageElement).src = DEFAULT_PHOTO }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(26,18,8,1) 0%, rgba(26,18,8,0.1) 55%, rgba(26,18,8,0.5) 100%)" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 1.5rem 24px", textAlign: "center" }}>
                <div style={{ fontSize: 9, letterSpacing: "0.5em", textTransform: "uppercase", color: "rgba(253,246,227,0.6)", marginBottom: "0.8rem" }}>Together with their families</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "clamp(2.4rem,8vw,3.6rem)", color: "#fdf6e3", lineHeight: 1 }}>
                  {W.bride}<span style={{ color: PRIMARY }}> &amp; </span>{W.groom}
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16 }}>
                  <a href="#rsvp" style={{ background: PRIMARY, color: "#1a1208", borderRadius: 100, padding: "10px 22px", fontSize: 11, letterSpacing: "0.15em", textDecoration: "none", fontWeight: 700 }}>RSVP</a>
                  <a href={eventsList[0]?.maps_url || couple.maps_url || '#'} target="_blank" rel="noopener noreferrer" style={{ background: "rgba(255,255,255,0.08)", border: `1px solid ${PRIMARY}55`, color: "#fdf6e3", borderRadius: 100, padding: "10px 22px", fontSize: 11, letterSpacing: "0.15em", textDecoration: "none", fontWeight: 500 }}>Location</a>
                </div>
              </div>
            </div>

            {(W.brideFamilyName || W.groomFamilyName) && (
              <motion.div style={sectionCard(PRIMARY)} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={sectionEyebrow(PRIMARY)}>With Love</div>
                <div style={{ textAlign: "center", fontSize: 13, color: "#c4b088", lineHeight: 2 }}>
                  {W.brideFamilyName && <><strong style={{ color: "#fdf6e3" }}>{W.brideFamilyName}</strong><br /></>}
                  {W.brideFamilyName && W.groomFamilyName && <>together with<br /></>}
                  {W.groomFamilyName && <><strong style={{ color: "#fdf6e3" }}>{W.groomFamilyName}</strong><br /></>}
                  request the honour of your presence<br />to celebrate the marriage of their loving children
                </div>
              </motion.div>
            )}

            {eventsList.map(ev => {
              const evDate = new Date(ev.date)
              const evDateDisplay = evDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
              const evTimeDisplay = evDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) + ' Onwards'
              return (
                <motion.div key={ev.key} style={sectionCard(PRIMARY)} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <div style={sectionEyebrow(PRIMARY)}>{ev.icon} Save the Date</div>
                  <div style={sectionTitle()}>{ev.label}</div>
                  {[
                    { icon: "📅", label: "Date", val: evDateDisplay, gold: true },
                    { icon: "⏰", label: "Time", val: evTimeDisplay },
                    { icon: "📍", label: "Venue", val: ev.venue, sub: ev.venue_address },
                  ].map(d => (
                    <div key={d.label} style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "12px 0", borderBottom: `1px solid ${PRIMARY}1a` }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${PRIMARY}1a`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>{d.icon}</div>
                      <div>
                        <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6a5a3a" }}>{d.label}</div>
                        <div style={{ fontSize: (d as any).gold ? 18 : 15, color: (d as any).gold ? PRIMARY : "#fdf6e3", fontWeight: 600, marginTop: 2, fontFamily: (d as any).gold ? "'Cormorant Garamond',serif" : "inherit", fontStyle: (d as any).gold ? "italic" : "normal" }}>{d.val}</div>
                        {d.sub && <div style={{ fontSize: 12, color: "#a08858", marginTop: 2 }}>{d.sub}</div>}
                      </div>
                    </div>
                  ))}
                  {ev.maps_url && (
                    <a href={ev.maps_url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: `${PRIMARY}1a`, borderRadius: 100, padding: "10px 20px", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: PRIMARY, marginTop: 16, textDecoration: "none", fontWeight: 600 }}>
                      📍 View Location on Maps
                    </a>
                  )}
                </motion.div>
              )
            })}

            {sv.countdown && (
              <div style={{ ...sectionCard(PRIMARY), textAlign: "center" }}>
                <div style={sectionEyebrow(PRIMARY)}>Counting Down to Our Big Day</div>
                <Countdown targetDate={W.date} primary={PRIMARY} muted={MUTED} />
              </div>
            )}

            <div id="rsvp"><RSVP coupleId={couple.id} askDrinking={couple.ask_drinking} primary={PRIMARY} guestName={guestName} /></div>

            {sv.timeline && W.timeline.length > 0 && (
              <motion.div style={sectionCard(PRIMARY)} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={sectionEyebrow(PRIMARY)}>Our Celebration</div>
                <div style={sectionTitle()}>The Wedding Lineup</div>
                <div style={{ position: "relative", paddingLeft: 20 }}>
                  <div style={{ position: "absolute", left: 6, top: 0, bottom: 0, width: 1, background: `${PRIMARY}33` }} />
                  {W.timeline.map((t, i) => (
                    <div key={i} style={{ position: "relative", padding: "10px 0 10px 20px" }}>
                      <div style={{ position: "absolute", left: -14, top: 14, width: 10, height: 10, borderRadius: "50%", background: PRIMARY, border: "2px solid #241a0c" }} />
                      <div style={{ fontSize: 11, fontWeight: 600, color: PRIMARY, letterSpacing: "0.1em" }}>{t.time}</div>
                      <div style={{ fontSize: 13, color: "#fdf6e3", fontWeight: 500, marginTop: 2 }}>{t.event}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {sv.seat_finder && couple.show_seating && Object.keys(W.seats).length > 0 && (
              <motion.div style={sectionCard(PRIMARY)} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={sectionEyebrow(PRIMARY)}>Be Our Guest</div>
                <div style={sectionTitle()}>Find Your Table</div>
                <div style={{ fontSize: 13, color: "#a08858", marginBottom: 12, textAlign: "center" }}>Search your name to find your assigned table</div>
                <SeatFinder seats={W.seats} primary={PRIMARY} />
              </motion.div>
            )}

            {sv.music && (
              <motion.div style={sectionCard(PRIMARY)} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={sectionEyebrow(PRIMARY)}>Our Song</div>
                <MusicPlayerUI title={W.song} artist={W.artist} audioRef={audioRef} primary={PRIMARY} dark={DARK} />
              </motion.div>
            )}

            {sv.gallery && W.gallery.length > 0 && (
              <motion.div style={sectionCard(PRIMARY)} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={sectionEyebrow(PRIMARY)}>Our Story</div>
                <div style={sectionTitle()}>Moments of Love</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
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
              <motion.div style={sectionCard(PRIMARY)} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={sectionEyebrow(PRIMARY)}>A Special Note</div>
                <div style={sectionTitle()}>To Our Lovely Guests</div>
                <div style={{ textAlign: "center", fontSize: 13, color: "#c4b088", lineHeight: 2 }}>
                  {(couple as any).thank_you_text || "With hearts full of love and gratitude, we are so happy to celebrate this beautiful chapter of our lives with you. Thank you for your love, your blessings, and for being part of our journey."}
                </div>
                <div style={{ textAlign: "center", marginTop: 16 }}>
                  <div style={{ fontSize: 11, color: "#6a5a3a" }}>With all our love,</div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.5rem", color: PRIMARY, marginTop: 4 }}>{W.bride} &amp; {W.groom}</div>
                </div>
              </motion.div>
            )}

            <div style={{ padding: "2rem 1.5rem", textAlign: "center", background: DARK }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.4rem", color: PRIMARY, marginBottom: 4 }}>InviteGlow</div>
              <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "#6a5a3a" }}>inviteglow.com · Digital Wedding Invitations</div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
