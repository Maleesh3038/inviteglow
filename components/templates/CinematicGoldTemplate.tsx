"use client"
import { useState, useEffect, useRef, useCallback, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, Couple } from '@/lib/supabase'

const DEFAULT_PHOTO = "/images/hero-cinematic.png"
const DEFAULT_SONG_URL = "/audio/calm-wedding.mp3"
const DEFAULT_SONG_TITLE = "Calm Wedding Theme"
const DEFAULT_SONG_ARTIST = "InviteGlow"

// ── Default palette for this template — overridden by couple.custom_colors ──
const DEFAULT_PALETTE = {
  primary: "#e8c468",
  primaryLight: "#9a6a1e",
  dark: "#1a1208",
  cream: "#241a0c",
  muted: "rgba(255,255,255,0.4)",
}

// ── Scratch-to-Reveal Canvas ──
// Lightens or darkens a hex color by a percentage (-100 to 100). Used to derive
// the gold foil gradient stops from the couple's chosen primary color.
function shadeColor(hex: string, percent: number): string {
  const clean = hex.replace('#', '')
  const num = parseInt(clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean, 16)
  let r = (num >> 16) + Math.round(255 * (percent / 100))
  let g = ((num >> 8) & 0x00FF) + Math.round(255 * (percent / 100))
  let b = (num & 0x0000FF) + Math.round(255 * (percent / 100))
  r = Math.max(0, Math.min(255, r))
  g = Math.max(0, Math.min(255, g))
  b = Math.max(0, Math.min(255, b))
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`
}

function ScratchReveal({
  photo, bride, groom, dateDisplay, venue, onComplete, primary,
}: { photo: string; bride: string; groom: string; dateDisplay: string; venue: string; onComplete: () => void; primary: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [percentScratched, setPercentScratched] = useState(0)
  const isDrawing = useRef(false)
  const checkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Draw the gold scratch overlay
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resize = () => {
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      // Foil texture — gradient stops derived from the couple's primary color
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      grad.addColorStop(0, shadeColor(primary, -8))
      grad.addColorStop(0.3, shadeColor(primary, -25))
      grad.addColorStop(0.5, shadeColor(primary, 10))
      grad.addColorStop(0.7, shadeColor(primary, -35))
      grad.addColorStop(1, shadeColor(primary, -8))
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Subtle noise texture lines for foil effect
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.lineWidth = 1
      for (let i = 0; i < canvas.width; i += 4) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i + 20, canvas.height)
        ctx.stroke()
      }
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [primary])

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top }
  }

  const scratch = (x: number, y: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(x, y, 38, 0, Math.PI * 2)
    ctx.fill()
  }

  const checkProgress = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    let transparent = 0
    const step = 16 // sample every 4th pixel for performance
    let total = 0
    for (let i = 3; i < data.length; i += step) {
      total++
      if (data[i] === 0) transparent++
    }
    const pct = (transparent / total) * 100
    setPercentScratched(pct)
    if (pct > 55 && !revealed) {
      setRevealed(true)
      setTimeout(onComplete, 900)
    }
  }, [revealed, onComplete])

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawing.current = true
    const { x, y } = getPos(e)
    scratch(x, y)
  }
  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return
    const { x, y } = getPos(e)
    scratch(x, y)
    if (checkTimeout.current) clearTimeout(checkTimeout.current)
    checkTimeout.current = setTimeout(checkProgress, 80)
  }
  const handleEnd = () => { isDrawing.current = false }

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", cursor: revealed ? "default" : "pointer" }}>
      {/* Photo underneath */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo} alt={`${bride} and ${groom}`}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 25%" }}
        onError={e => { (e.currentTarget as HTMLImageElement).src = DEFAULT_PHOTO }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(10,8,4,0.25) 0%, rgba(10,8,4,0.15) 40%, rgba(10,8,4,0.85) 100%)" }} />

      {/* Names overlay (always visible, beneath gold) */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 1.5rem 36px", textAlign: "center", zIndex: 2 }}>
        <div style={{ fontSize: 9, letterSpacing: "0.5em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", marginBottom: "0.6rem" }}>Together with their families</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontStyle: "italic", fontSize: "clamp(2.2rem,8vw,3.4rem)", color: "#fff", lineHeight: 1.05, textShadow: "0 4px 30px rgba(0,0,0,0.5)" }}>
          {bride}<span style={{ color: primary }}> &amp; </span>{groom}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>{dateDisplay} · {venue}</div>
      </div>

      {/* Gold scratch canvas on top */}
      <AnimatePresence>
        {!revealed && (
          <motion.canvas
            ref={canvasRef}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            style={{ position: "absolute", inset: 0, zIndex: 3, touchAction: "none" }}
          />
        )}
      </AnimatePresence>

      {/* Instruction hint */}
      {!revealed && percentScratched < 8 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          style={{ position: "absolute", inset: 0, zIndex: 4, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <motion.div animate={{ x: [-10, 10, -10] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }} style={{ fontSize: 36, marginBottom: 10 }}>
            ✦
          </motion.div>
          <div style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "#1a1208", fontWeight: 700, textShadow: "0 1px 2px rgba(255,255,255,0.3)" }}>
            Scratch to Reveal
          </div>
        </motion.div>
      )}

      {/* Progress hint once started */}
      {!revealed && percentScratched >= 8 && (
        <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", zIndex: 4, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(20,16,8,0.6)", fontWeight: 600, pointerEvents: "none" }}>
          Keep scratching... {Math.min(100, Math.round(percentScratched * 1.8))}%
        </div>
      )}
    </div>
  )
}

// ── Countdown ──
function Countdown({ targetDate, primary, dark }: { targetDate: string; primary: string; dark: string }) {
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
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg,${dark},${dark}cc)`, border: `1px solid ${primary}4d`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.3rem", color: primary, fontWeight: 600 }}>{v}</span>
          </div>
          <span style={{ fontSize: 8, letterSpacing: "0.25em", textTransform: "uppercase", color: `${primary}80` }}>{l}</span>
        </div>
      ))}
    </div>
  )
}

// ── Gold particles ambient effect ──
function GoldParticles({ count = 14, primary }: { count?: number; primary: string }) {
  const [items, setItems] = useState<{ id: number; left: number; duration: number; delay: number; size: number }[]>([])
  useEffect(() => {
    setItems(Array.from({ length: count }).map((_, i) => ({
      id: i, left: Math.random() * 100, duration: 6 + Math.random() * 8, delay: Math.random() * 8, size: 2 + Math.random() * 3,
    })))
  }, [count])
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 1 }}>
      {items.map(p => (
        <div key={p.id} style={{
          position: "absolute", bottom: -10, left: `${p.left}%`, width: p.size, height: p.size, borderRadius: "50%",
          background: `radial-gradient(circle, ${primary}, transparent)`, opacity: 0.7,
          animation: `gold-rise ${p.duration}s linear ${p.delay}s infinite`,
        }} />
      ))}
    </div>
  )
}

// ── Music Player ──
function MusicPlayerUI({ title, artist, audioRef, primary, primaryLight, dark }: { title: string; artist: string; audioRef: React.RefObject<HTMLAudioElement | null>; primary: string; primaryLight: string; dark: string }) {
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
    <div style={{ display: "flex", alignItems: "center", gap: 14, background: dark, borderRadius: 14, padding: 16, border: `1px solid ${primary}26` }}>
      <div style={{ width: 44, height: 44, borderRadius: playing ? "50%" : 10, background: `linear-gradient(135deg,${primary},${primaryLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, animation: playing ? "spin 4s linear infinite" : "none" }}>🎵</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{title}</div>
        <div style={{ fontSize: 11, color: `${primary}80`, marginTop: 2 }}>{artist}</div>
        <div style={{ height: 3, background: `${primary}1a`, borderRadius: 100, marginTop: 8 }}>
          <div style={{ height: "100%", width: `${prog}%`, background: `linear-gradient(to right,${primary},${primaryLight})`, borderRadius: 100, transition: "width 0.3s" }} />
        </div>
      </div>
      <button onClick={toggle} style={{ width: 38, height: 38, borderRadius: "50%", background: primary, border: "none", color: dark, cursor: "pointer", fontSize: 13, flexShrink: 0, fontWeight: 700 }}>
        {playing ? "⏸" : "▶"}
      </button>
    </div>
  )
}

// ── RSVP ──
function RSVP({ coupleId, askDrinking, primary, primaryLight, dark, cream }: { coupleId: string; askDrinking: boolean; primary: string; primaryLight: string; dark: string; cream: string }) {
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

  const inputStyle: React.CSSProperties = { width: "100%", padding: "13px 16px", borderRadius: 10, border: `1px solid ${primary}33`, background: cream, color: "#fff", fontSize: 14, outline: "none", marginBottom: 12, fontFamily: "'Inter',sans-serif" }

  return (
    <div style={{ background: dark, padding: "40px 1.5rem", textAlign: "center" }}>
      <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: primary, marginBottom: 8, fontWeight: 600 }}>Be Our Guest</div>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.8rem", color: "#fff", marginBottom: 8 }}>Will You Join Us?</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>It only takes a few seconds to RSVP</div>
      <div style={{ background: cream, borderRadius: 16, padding: 24, maxWidth: 380, margin: "0 auto", border: `1px solid ${primary}1a` }}>

        {step === "form" && (
          <>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" style={inputStyle} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={handleAccept} style={{ padding: 13, borderRadius: 10, background: `linear-gradient(135deg,${primary},${primaryLight})`, color: dark, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✓ Accept</button>
              <button onClick={handleDecline} disabled={saving} style={{ padding: 13, borderRadius: 10, background: "transparent", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer", fontSize: 12, opacity: saving ? 0.6 : 1 }}>
                {saving ? "..." : "✗ Decline"}
              </button>
            </div>
          </>
        )}

        {step === "count" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 600, marginBottom: 16 }}>How many people, including you?</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 16 }}>
              <button onClick={() => setGuestCount(c => Math.max(1, c - 1))} style={{ width: 36, height: 36, borderRadius: "50%", background: `${primary}1a`, color: primary, border: "none", cursor: "pointer", fontSize: 16 }}>−</button>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.8rem", color: "#fff", minWidth: 40 }}>{guestCount}</div>
              <button onClick={() => setGuestCount(c => Math.min(20, c + 1))} style={{ width: 36, height: 36, borderRadius: "50%", background: `${primary}1a`, color: primary, border: "none", cursor: "pointer", fontSize: 16 }}>+</button>
            </div>
            <button onClick={handleCountNext} disabled={saving} style={{ width: "100%", padding: 13, borderRadius: 10, background: `linear-gradient(135deg,${primary},${primaryLight})`, color: dark, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, opacity: saving ? 0.6 : 1 }}>
              {saving ? "..." : "Continue →"}
            </button>
          </motion.div>
        )}

        {step === "drinking" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 14 }}>Will you be having alcohol?</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={() => save("yes", "yes", guestCount)} disabled={saving} style={{ padding: 13, borderRadius: 10, background: `${primary}1a`, color: primary, border: `1px solid ${primary}4d`, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>🍷 Yes</button>
              <button onClick={() => save("yes", "no", guestCount)} disabled={saving} style={{ padding: 13, borderRadius: 10, background: `${primary}1a`, color: primary, border: `1px solid ${primary}4d`, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>🥤 No</button>
            </div>
          </motion.div>
        )}

        {step === "done" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{finalResponse === "yes" ? "🎉" : "💙"}</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.3rem", color: primary, marginBottom: 4 }}>
              {finalResponse === "yes" ? `See you there, ${name}!` : `We'll miss you, ${name}.`}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              {finalResponse === "yes"
                ? (guestCount > 1 ? `Party of ${guestCount} confirmed!` : "We can't wait to celebrate with you.")
                : "Thank you for letting us know."}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

// ── Seat Finder ──
function SeatFinder({ seats, primary, primaryLight, dark }: { seats: Record<string, string>; primary: string; primaryLight: string; dark: string }) {
  const [q, setQ] = useState("")
  const [res, setRes] = useState("")
  const search = () => {
    const query = q.trim().toLowerCase()
    if (!query) { setRes("Please enter your name."); return }
    const found = Object.keys(seats || {}).find(k => query.includes(k) || k.includes(query))
    setRes(found ? `You are seated at ${seats[found]}` : "Name not found. Please contact the couple.")
  }
  return (
    <div>
      <div style={{ display: "flex", gap: 10 }}>
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && search()}
          placeholder="Enter your name..." style={{ flex: 1, padding: "13px 16px", borderRadius: 10, border: `1px solid ${primary}26`, background: dark, color: "#fff", fontSize: 14, outline: "none", fontFamily: "'Inter',sans-serif" }} />
        <button onClick={search} style={{ padding: "13px 20px", borderRadius: 10, background: `linear-gradient(135deg,${primary},${primaryLight})`, color: dark, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Search</button>
      </div>
      {res && <div style={{ marginTop: 12, fontSize: 14, color: res.startsWith("You") ? primary : "rgba(255,255,255,0.5)", fontWeight: res.startsWith("You") ? 600 : 400 }}>{res}</div>}
    </div>
  )
}

// ── Timeline Node: a single stop on the connected vertical golden spine ──
// Alternates content slightly left/right of the centre line, each anchored
// by a small glowing node where it touches the spine. Side is derived from
// a stable per-instance id (via useId) rather than a module-level counter,
// so it works correctly across multiple mounts/StrictMode re-renders.
function TimelineNode({
  icon, children, id, noPadding, isLast, primary, primaryLight, dark,
}: { icon: string; children: React.ReactNode; id?: string; noPadding?: boolean; isLast?: boolean; primary: string; primaryLight: string; dark: string }) {
  const reactId = useId()
  // Derive a stable 0/1 from the id's char codes so alternating sides stay consistent
  const hash = reactId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  const isRight = hash % 2 === 0

  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      style={{ position: "relative", marginBottom: isLast ? 0 : 28, paddingBottom: isLast ? 32 : 0 }}
    >
      {/* Node marker on the central spine */}
      <div style={{
        position: "absolute", left: "50%", top: 4, transform: "translate(-50%,-50%)",
        width: 34, height: 34, borderRadius: "50%",
        background: `radial-gradient(circle at 35% 35%, ${primaryLight}, ${primary})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, zIndex: 2, boxShadow: `0 0 0 5px ${dark}, 0 0 16px ${primary}66`,
      }}>
        {icon}
      </div>

      {/* Short connector from spine to card */}
      <div style={{
        position: "absolute", top: 4, height: 1,
        left: isRight ? "50%" : undefined, right: isRight ? undefined : "50%",
        width: 18, background: `${primary}4d`,
      }} />

      {/* Content card, offset to alternating side, indented to clear the spine + connector */}
      <div style={{
        marginTop: 26,
        paddingLeft: isRight ? 34 : 16,
        paddingRight: isRight ? 16 : 34,
      }}>
        <div style={{
          background: dark, borderRadius: 20, border: `1px solid ${primary}1f`,
          padding: noPadding ? 0 : "1.6rem 1.4rem", overflow: noPadding ? "hidden" : "visible",
          boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
        }}>
          {children}
        </div>
      </div>
    </motion.div>
  )
}

const sectionCardStyle = (dark: string, primary: string): React.CSSProperties => ({ background: dark, margin: "0 16px 16px", borderRadius: 22, padding: "1.8rem", border: `1px solid ${primary}1a` })
const sectionEyebrowStyle = (primary: string): React.CSSProperties => ({ fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color: primary, textAlign: "center", marginBottom: 6, fontWeight: 600 })
const sectionTitleStyle = (): React.CSSProperties => ({ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.5rem", color: "#fff", textAlign: "center", marginBottom: 20 })

export default function CinematicGoldTemplate({ couple }: { couple: Couple }) {
  const [scratchComplete, setScratchComplete] = useState(false)
  const [opened, setOpened] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // ── Resolve this couple's colors: their custom_colors override the default palette ──
  const PRIMARY = couple.custom_colors?.primary || DEFAULT_PALETTE.primary
  const PRIMARY_LIGHT = couple.custom_colors?.primaryLight || DEFAULT_PALETTE.primaryLight
  const DARK = couple.custom_colors?.dark || DEFAULT_PALETTE.dark
  const CREAM = couple.custom_colors?.cream || DEFAULT_PALETTE.cream

  useEffect(() => {
    const songUrl = couple.song_url || DEFAULT_SONG_URL
    const audio = new Audio(songUrl)
    audio.loop = true
    audio.volume = 0.6
    audioRef.current = audio
    return () => { audio.pause(); audio.src = "" }
  }, [couple])

  const handleScratchComplete = () => {
    setScratchComplete(true)
  }

  const handleEnterFull = () => {
    setOpened(true)
    audioRef.current?.play().catch(() => {})
  }

  // ── Derive the events list to render: prefer the new couple.events object,
  // fall back to the legacy single wedding_date/venue columns if a couple
  // hasn't been re-saved through the updated admin form yet. ──
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

  // Section visibility — defaults to showing everything for couples saved
  // before this feature existed.
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
    timeDisplay: new Date(couple.wedding_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    venue: couple.venue || '',
    venueAddress: couple.venue_address || '',
    couplePhoto: couple.couple_photo || DEFAULT_PHOTO,
    song: couple.song_title || DEFAULT_SONG_TITLE,
    artist: couple.song_artist || DEFAULT_SONG_ARTIST,
    timeline: couple.timeline || [],
    seats: couple.seats || {},
    gallery: couple.gallery || [],
  }

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", minHeight: "100vh", background: DARK }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Inter:wght@300;400;500;600&display=swap');
        @keyframes spin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
        @keyframes gold-rise {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          15% { opacity: 0.7; }
          85% { opacity: 0.7; }
          100% { transform: translateY(-100vh) scale(1); opacity: 0; }
        }
        input::placeholder { color: rgba(232,196,104,0.3); }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto", background: DARK, boxShadow: "0 0 100px rgba(0,0,0,0.5)", position: "relative", overflow: "hidden" }}>

        {/* ── SCRATCH-TO-REVEAL COVER ── */}
        {!opened && (
          <div style={{ position: "relative", height: "100vh", minHeight: 600, maxHeight: 780 }}>
            <ScratchReveal
              photo={W.couplePhoto}
              bride={W.bride}
              groom={W.groom}
              dateDisplay={W.dateDisplay}
              venue={W.venue}
              onComplete={handleScratchComplete}
              primary={PRIMARY}
            />

            <AnimatePresence>
              {scratchComplete && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.6 }}
                  style={{ position: "absolute", bottom: 36, left: 0, right: 0, textAlign: "center", zIndex: 10 }}>
                  <motion.button
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    onClick={handleEnterFull}
                    style={{
                      padding: "14px 34px", borderRadius: 100, border: "none",
                      background: `linear-gradient(135deg,${PRIMARY},${PRIMARY_LIGHT})`, color: DARK,
                      fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer",
                      fontFamily: "'Inter',sans-serif", fontWeight: 700,
                      boxShadow: `0 8px 30px ${PRIMARY}66`,
                    }}>
                    Enter Invitation →
                  </motion.button>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 10, letterSpacing: "0.05em" }}>🎵 with music</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── FULL INVITATION — Connected Vertical Timeline Architecture ── */}
        {opened && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} style={{ position: "relative" }}>
            <GoldParticles count={12} primary={PRIMARY} />

            {/* Hero */}
            <div style={{ position: "relative", height: 380, overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={W.couplePhoto} alt={`${W.bride} and ${W.groom}`}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 25%" }}
                onError={e => { (e.currentTarget as HTMLImageElement).src = DEFAULT_PHOTO }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(13,9,5,0.2) 0%, rgba(13,9,5,1) 100%)" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 1.5rem 28px", textAlign: "center", zIndex: 4 }}>
                <div style={{ fontSize: 9, letterSpacing: "0.5em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: "0.6rem" }}>Together with their families</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontStyle: "italic", fontSize: "clamp(2rem,7vw,3rem)", color: "#fff", lineHeight: 1, textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>
                  {W.bride}<span style={{ color: PRIMARY }}> &amp; </span>{W.groom}
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
                  <a href="#rsvp" style={{ background: `linear-gradient(135deg,${PRIMARY},${PRIMARY_LIGHT})`, color: DARK, borderRadius: 100, padding: "10px 20px", fontSize: 11, letterSpacing: "0.1em", textDecoration: "none", fontWeight: 700 }}>RSVP</a>
                  <a href="#location" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(232,196,104,0.3)", color: "#fff", borderRadius: 100, padding: "10px 20px", fontSize: 11, letterSpacing: "0.1em", textDecoration: "none", fontWeight: 500 }}>Location</a>
                </div>
              </div>
            </div>

            {/* ── The connected golden spine begins here ── */}
            <div style={{ position: "relative", padding: "32px 0 0" }}>
              {/* Continuous vertical line running through all nodes */}
              <div style={{
                position: "absolute", top: 0, bottom: 0, left: "50%", width: 1,
                background: "linear-gradient(to bottom, transparent, rgba(232,196,104,0.35) 4%, rgba(232,196,104,0.35) 96%, transparent)",
                zIndex: 0,
              }} />

              {/* Node: Formal invite */}
              {(W.brideFamilyName || W.groomFamilyName) && (
                <TimelineNode icon="💍" primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK}>
                  <div style={sectionEyebrowStyle(PRIMARY)}>With Love</div>
                  <div style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 2 }}>
                    {W.brideFamilyName && <><strong style={{ color: "#fff" }}>{W.brideFamilyName}</strong><br /></>}
                    {W.brideFamilyName && W.groomFamilyName && <>&amp;<br /></>}
                    {W.groomFamilyName && <><strong style={{ color: "#fff" }}>{W.groomFamilyName}</strong><br /></>}
                    request the honour of your presence<br />to celebrate the marriage of their loving children
                  </div>
                </TimelineNode>
              )}

              {/* Node: Events — one details node + one location node per enabled event */}
              {eventsList.map(ev => {
                const evDate = new Date(ev.date)
                const evDateDisplay = evDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                const evTimeDisplay = evDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                return (
                  <div key={ev.key}>
                    <TimelineNode icon={ev.icon} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK}>
                      <div style={sectionEyebrowStyle(PRIMARY)}>Save the Date</div>
                      <div style={sectionTitleStyle()}>{ev.label}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "rgba(232,196,104,0.08)", borderRadius: 14, overflow: "hidden" }}>
                        {[
                          { icon: "📅", label: "Date", val: evDateDisplay, gold: true },
                          { icon: "⏰", label: "Time", val: `${evTimeDisplay} Onwards` },
                          { icon: "📍", label: "Venue", val: ev.venue },
                          { icon: "👗", label: "Dress", val: "Formal Attire" },
                        ].map(d => (
                          <div key={d.label} style={{ background: CREAM, padding: 16, textAlign: "center" }}>
                            <div style={{ fontSize: 15, marginBottom: 5 }}>{d.icon}</div>
                            <div style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>{d.label}</div>
                            <div style={{
                              fontSize: d.gold ? 14 : 12, color: d.gold ? PRIMARY : "#fff", fontWeight: 500, marginTop: 3,
                              fontFamily: d.gold ? "'Cormorant Garamond',serif" : "inherit", fontStyle: d.gold ? "italic" : "normal",
                            }}>{d.val}</div>
                          </div>
                        ))}
                      </div>
                    </TimelineNode>

                    {ev.maps_url && (
                      <TimelineNode icon="📍" id={ev.key === eventsList[0]?.key ? "location" : undefined} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK}>
                        <div style={sectionEyebrowStyle(PRIMARY)}>Find Us</div>
                        <div style={sectionTitleStyle()}>{ev.label} Venue</div>
                        <a href={ev.maps_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block" }}>
                          <div style={{ background: CREAM, borderRadius: 16, padding: 22, textAlign: "center" }}>
                            <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg,${PRIMARY},${PRIMARY_LIGHT})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 16 }}>🗺️</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 4 }}>{ev.venue}</div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>{ev.venue_address}</div>
                            <div style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: PRIMARY, fontWeight: 600 }}>Tap to View on Maps →</div>
                          </div>
                        </a>
                      </TimelineNode>
                    )}
                  </div>
                )
              })}

              {/* Node: Countdown */}
              {sv.countdown && (
                <TimelineNode icon="⏳" primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK}>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.2rem", color: "#fff", marginBottom: 16, textAlign: "center" }}>Counting down to our big day</div>
                  <Countdown targetDate={W.date} primary={PRIMARY} dark={DARK} />
                </TimelineNode>
              )}

              {/* Node: Day schedule (the timeline events themselves become sub-nodes on the spine) */}
              {sv.timeline && W.timeline.length > 0 && (
                <TimelineNode icon="🗓️" primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK}>
                  <div style={sectionEyebrowStyle(PRIMARY)}>The Celebration</div>
                  <div style={sectionTitleStyle()}>Wedding Day Schedule</div>
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: 5, top: 6, bottom: 6, width: 1, background: "rgba(232,196,104,0.2)" }} />
                    {W.timeline.map((t, i) => (
                      <div key={i} style={{ position: "relative", display: "flex", alignItems: "baseline", gap: 16, padding: "10px 0 10px 22px" }}>
                        <div style={{ position: "absolute", left: 1, top: 16, width: 9, height: 9, borderRadius: "50%", background: PRIMARY, border: `2px solid ${DARK}` }} />
                        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "0.95rem", color: PRIMARY, minWidth: 64 }}>{t.time}</div>
                        <div style={{ fontSize: 13, color: "#fff", fontWeight: 500, flex: 1 }}>{t.event}</div>
                      </div>
                    ))}
                  </div>
                </TimelineNode>
              )}

              {/* Node: RSVP */}
              <TimelineNode icon="✉️" id="rsvp" noPadding primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK}>
                <RSVP coupleId={couple.id} askDrinking={couple.ask_drinking} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} cream={CREAM} />
              </TimelineNode>

              {/* Node: Seat finder */}
              {sv.seat_finder && couple.show_seating && Object.keys(W.seats).length > 0 && (
                <TimelineNode icon="🪑" primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK}>
                  <div style={sectionEyebrowStyle(PRIMARY)}>Be Our Guest</div>
                  <div style={sectionTitleStyle()}>Find Your Table</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 12, textAlign: "center" }}>Search your name to find your assigned table</div>
                  <SeatFinder seats={W.seats} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} />
                </TimelineNode>
              )}

              {/* Node: Music */}
              {sv.music && (
                <TimelineNode icon="🎵" primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK}>
                  <div style={sectionEyebrowStyle(PRIMARY)}>Our Song</div>
                  <MusicPlayerUI title={W.song} artist={W.artist} audioRef={audioRef} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} />
                </TimelineNode>
              )}

              {/* Node: Gallery */}
              {sv.gallery && W.gallery.length > 0 && (
                <TimelineNode icon="📷" primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK}>
                  <div style={sectionEyebrowStyle(PRIMARY)}>Our Story</div>
                  <div style={sectionTitleStyle()}>Moments Together</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {W.gallery.map((src, i) => (
                      <div key={i} style={{ gridRow: i === 0 ? "span 2" : undefined, borderRadius: 16, overflow: "hidden", background: CREAM, aspectRatio: i === 0 ? "1/2" : "1/1" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => (e.currentTarget.style.display = "none")} />
                      </div>
                    ))}
                  </div>
                </TimelineNode>
              )}

              {/* Node: Thank you (final node on the spine, if shown) */}
              {sv.thank_you && (
                <TimelineNode icon="🤍" isLast primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK}>
                  <div style={sectionEyebrowStyle(PRIMARY)}>A Special Note</div>
                  <div style={sectionTitleStyle()}>To Our Lovely Guests</div>
                  <div style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 2 }}>
                    With hearts full of love and gratitude, we are so happy to celebrate this beautiful chapter of our lives with you. Your presence means more to us than words can truly express.
                    <br /><br />
                    Thank you for your love, your blessings, and for being part of our journey.
                  </div>
                  <div style={{ textAlign: "center", marginTop: 16 }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>With all our love,</div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.5rem", color: PRIMARY, marginTop: 4 }}>{W.bride} &amp; {W.groom}</div>
                  </div>
                </TimelineNode>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "2rem 1.5rem", textAlign: "center", background: DARK }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.3rem", color: PRIMARY, marginBottom: 4 }}>InviteGlow</div>
              <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(232,196,104,0.3)" }}>inviteglow.com · Digital Wedding Invitations</div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}