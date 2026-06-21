"use client"
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, Couple } from '@/lib/supabase'

const DEFAULT_PHOTO = "/images/hero-kandyan.png"
const DEFAULT_SONG_URL = "/audio/calm-wedding.mp3"
const DEFAULT_SONG_TITLE = "Calm Wedding Theme"
const DEFAULT_SONG_ARTIST = "InviteGlow"

const RED = "#7a1f1f"
const RED_DARK = "#4a1010"
const GOLD = "#d4a843"
const GOLD_LIGHT = "#f0d488"
const CREAM = "#fdf6e8"

// ── Decorative corner ornament (used throughout for the temple-art feel) ──
function CornerOrnament({ flip }: { flip?: boolean }) {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" style={{ transform: flip ? "scaleX(-1)" : undefined }}>
      <path d="M2 2 Q2 20 20 20 Q2 20 2 38" stroke={GOLD} strokeWidth="1" fill="none" opacity="0.6" />
      <circle cx="2" cy="2" r="2.5" fill={GOLD} opacity="0.8" />
      <path d="M8 8 Q8 16 16 16" stroke={GOLD} strokeWidth="1" fill="none" opacity="0.4" />
    </svg>
  )
}

// ── Lotus divider ──
function LotusDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, margin: "1rem 0" }}>
      <div style={{ height: 1, width: 36, background: `linear-gradient(to right, transparent, ${GOLD})` }} />
      <span style={{ fontSize: 14, color: GOLD }}>🪷</span>
      <div style={{ height: 1, width: 36, background: `linear-gradient(to left, transparent, ${GOLD})` }} />
    </div>
  )
}

// ── Temple Doors — the cover interaction ──
function TempleDoors({
  photo, bride, groom, dateDisplay, venue, onOpen,
}: { photo: string; bride: string; groom: string; dateDisplay: string; venue: string; onOpen: () => void }) {
  const [opening, setOpening] = useState(false)

  const handleClick = () => {
    if (opening) return
    setOpening(true)
    setTimeout(onOpen, 1400)
  }

  return (
    <div style={{ position: "relative", height: "100vh", minHeight: 600, maxHeight: 780, overflow: "hidden", background: `linear-gradient(160deg, ${RED_DARK}, #1a0808)`, cursor: opening ? "default" : "pointer" }}
      onClick={handleClick}>

      {/* Photo revealed behind the doors */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo} alt={`${bride} and ${groom}`}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 25%" }}
        onError={e => { (e.currentTarget as HTMLImageElement).src = DEFAULT_PHOTO }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(20,8,8,0.3) 0%, rgba(20,8,8,0.85) 100%)" }} />

      {/* Names visible once doors part */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 1.5rem 80px", textAlign: "center", zIndex: 2 }}>
        <div style={{ fontSize: 9, letterSpacing: "0.5em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", marginBottom: "0.6rem" }}>Together with their families</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontStyle: "italic", fontSize: "clamp(2.2rem,8vw,3.4rem)", color: "#fff", lineHeight: 1.05, textShadow: "0 4px 30px rgba(0,0,0,0.5)" }}>
          {bride}<span style={{ color: GOLD_LIGHT }}> &amp; </span>{groom}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 8 }}>{dateDisplay} · {venue}</div>
      </div>

      {/* LEFT DOOR */}
      <motion.div
        initial={{ rotateY: 0 }}
        animate={{ rotateY: opening ? -110 : 0 }}
        transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1] }}
        style={{
          position: "absolute", top: 0, left: 0, width: "50%", height: "100%",
          background: `linear-gradient(135deg, ${RED} 0%, ${RED_DARK} 60%, #2a0a0a 100%)`,
          transformOrigin: "left center", transformStyle: "preserve-3d",
          zIndex: 5, borderRight: `2px solid ${GOLD}`,
          boxShadow: "8px 0 30px rgba(0,0,0,0.5)",
        }}>
        <DoorPanel side="left" />
      </motion.div>

      {/* RIGHT DOOR */}
      <motion.div
        initial={{ rotateY: 0 }}
        animate={{ rotateY: opening ? 110 : 0 }}
        transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1] }}
        style={{
          position: "absolute", top: 0, right: 0, width: "50%", height: "100%",
          background: `linear-gradient(225deg, ${RED} 0%, ${RED_DARK} 60%, #2a0a0a 100%)`,
          transformOrigin: "right center", transformStyle: "preserve-3d",
          zIndex: 5, borderLeft: `2px solid ${GOLD}`,
          boxShadow: "-8px 0 30px rgba(0,0,0,0.5)",
        }}>
        <DoorPanel side="right" />
      </motion.div>

      {/* Center seal / handle, fades when opening */}
      <AnimatePresence>
        {!opening && (
          <motion.div
            exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.4 }}
            style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 6, textAlign: "center" }}>
            <motion.div
              animate={{ scale: [1, 1.06, 1] }} transition={{ repeat: Infinity, duration: 2.4 }}
              style={{
                width: 70, height: 70, borderRadius: "50%",
                background: `radial-gradient(circle at 35% 35%, ${GOLD_LIGHT}, ${GOLD} 60%, #8a6420)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 0 30px rgba(212,168,67,0.6), 0 4px 16px rgba(0,0,0,0.4)`,
                border: "2px solid rgba(255,255,255,0.3)",
              }}>
              <span style={{ fontSize: 26 }}>🪷</span>
            </motion.div>
            <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: GOLD_LIGHT, marginTop: 14, fontWeight: 600 }}>
              Tap to Open
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Carved door panel decoration ──
function DoorPanel({ side }: { side: "left" | "right" }) {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: side === "left" ? "flex-end" : "flex-start", justifyContent: "space-between", padding: "32px 18px" }}>
      <CornerOrnament flip={side === "right"} />
      <svg width="60" height="160" viewBox="0 0 60 160" style={{ opacity: 0.35 }}>
        <rect x="10" y="10" width="40" height="140" rx="6" stroke={GOLD} strokeWidth="1.5" fill="none" />
        <rect x="18" y="20" width="24" height="120" rx="4" stroke={GOLD} strokeWidth="1" fill="none" />
        <circle cx="30" cy="80" r="8" stroke={GOLD} strokeWidth="1" fill="none" />
        <path d="M30 60 L30 100 M20 80 L40 80" stroke={GOLD} strokeWidth="1" />
      </svg>
      <CornerOrnament flip={side === "left"} />
    </div>
  )
}

// ── Countdown — circular mandala numerals ──
function Countdown({ targetDate }: { targetDate: string }) {
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
            width: 58, height: 58, borderRadius: "50%", margin: "0 auto 8px",
            background: `conic-gradient(${GOLD} 0deg, ${GOLD} 270deg, rgba(212,168,67,0.15) 270deg)`,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 3,
          }}>
            <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: RED_DARK, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.2rem", color: GOLD_LIGHT, fontWeight: 600 }}>{v}</span>
            </div>
          </div>
          <span style={{ fontSize: 8, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(212,168,67,0.6)" }}>{l}</span>
        </div>
      ))}
    </div>
  )
}

// ── Floating lotus petals ambient ──
function LotusPetals({ count = 10 }: { count?: number }) {
  const petals = ['🪷', '✿']
  const [items, setItems] = useState<{ id: number; left: number; emoji: string; duration: number; delay: number; size: number }[]>([])
  useEffect(() => {
    setItems(Array.from({ length: count }).map((_, i) => ({
      id: i, left: Math.random() * 100, emoji: petals[Math.floor(Math.random() * petals.length)],
      duration: 9 + Math.random() * 8, delay: Math.random() * 10, size: 14 + Math.random() * 12,
    })))
  }, [count])
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 1 }}>
      {items.map(p => (
        <div key={p.id} style={{ position: "absolute", top: -40, left: `${p.left}%`, fontSize: p.size, opacity: 0.45, animation: `lotus-fall ${p.duration}s linear ${p.delay}s infinite` }}>
          {p.emoji}
        </div>
      ))}
    </div>
  )
}

// ── Music Player ──
function MusicPlayerUI({ title, artist, audioRef }: { title: string; artist: string; audioRef: React.RefObject<HTMLAudioElement | null> }) {
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
    <div style={{ display: "flex", alignItems: "center", gap: 14, background: RED_DARK, borderRadius: 14, padding: 16, border: `1px solid ${GOLD}33` }}>
      <div style={{ width: 44, height: 44, borderRadius: playing ? "50%" : 10, background: `linear-gradient(135deg,${GOLD_LIGHT},${GOLD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, animation: playing ? "spin 4s linear infinite" : "none" }}>🪷</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{title}</div>
        <div style={{ fontSize: 11, color: `${GOLD}99`, marginTop: 2 }}>{artist}</div>
        <div style={{ height: 3, background: `${GOLD}22`, borderRadius: 100, marginTop: 8 }}>
          <div style={{ height: "100%", width: `${prog}%`, background: `linear-gradient(to right,${GOLD},${GOLD_LIGHT})`, borderRadius: 100, transition: "width 0.3s" }} />
        </div>
      </div>
      <button onClick={toggle} style={{ width: 38, height: 38, borderRadius: "50%", background: GOLD, border: "none", color: RED_DARK, cursor: "pointer", fontSize: 13, flexShrink: 0, fontWeight: 700 }}>
        {playing ? "⏸" : "▶"}
      </button>
    </div>
  )
}

// ── RSVP ──
function RSVP({ coupleId, askDrinking }: { coupleId: string; askDrinking: boolean }) {
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

  const inputStyle: React.CSSProperties = { width: "100%", padding: "13px 16px", borderRadius: 12, border: `1px solid ${GOLD}33`, background: "#2a0d0d", color: "#fff", fontSize: 14, outline: "none", marginBottom: 12, fontFamily: "'Inter',sans-serif" }

  return (
    <div style={{ padding: "0.4rem" }}>
      <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: GOLD, marginBottom: 8, fontWeight: 600, textAlign: "center" }}>Be Our Guest</div>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.6rem", color: "#fff", marginBottom: 16, textAlign: "center" }}>Will You Join Us?</div>

      {step === "form" && (
        <>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" style={inputStyle} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleAccept} style={{ padding: 13, borderRadius: 12, background: `linear-gradient(135deg,${GOLD_LIGHT},${GOLD})`, color: RED_DARK, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, boxShadow: "0 4px 14px rgba(212,168,67,0.35)" }}>✓ Accept</motion.button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleDecline} disabled={saving} style={{ padding: 13, borderRadius: 12, background: "transparent", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer", fontSize: 12, opacity: saving ? 0.6 : 1 }}>
              {saving ? "..." : "✗ Decline"}
            </motion.button>
          </div>
        </>
      )}

      {step === "count" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ fontSize: 13, color: "#fff", fontWeight: 600, marginBottom: 16, textAlign: "center" }}>How many people, including you?</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 16 }}>
            <button onClick={() => setGuestCount(c => Math.max(1, c - 1))} style={{ width: 36, height: 36, borderRadius: "50%", background: `${GOLD}22`, color: GOLD_LIGHT, border: "none", cursor: "pointer", fontSize: 16 }}>−</button>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.8rem", color: "#fff", minWidth: 40, textAlign: "center" }}>{guestCount}</div>
            <button onClick={() => setGuestCount(c => Math.min(20, c + 1))} style={{ width: 36, height: 36, borderRadius: "50%", background: `${GOLD}22`, color: GOLD_LIGHT, border: "none", cursor: "pointer", fontSize: 16 }}>+</button>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleCountNext} disabled={saving} style={{ width: "100%", padding: 13, borderRadius: 12, background: `linear-gradient(135deg,${GOLD_LIGHT},${GOLD})`, color: RED_DARK, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, opacity: saving ? 0.6 : 1, boxShadow: "0 4px 14px rgba(212,168,67,0.35)" }}>
            {saving ? "..." : "Continue →"}
          </motion.button>
        </motion.div>
      )}

      {step === "drinking" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 14, textAlign: "center" }}>Will you be having alcohol?</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => save("yes", "yes", guestCount)} disabled={saving} style={{ padding: 13, borderRadius: 12, background: `${GOLD}1a`, color: GOLD_LIGHT, border: `1px solid ${GOLD}55`, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>🍷 Yes</motion.button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => save("yes", "no", guestCount)} disabled={saving} style={{ padding: 13, borderRadius: 12, background: `${GOLD}1a`, color: GOLD_LIGHT, border: `1px solid ${GOLD}55`, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>🥤 No</motion.button>
          </div>
        </motion.div>
      )}

      {step === "done" && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>{finalResponse === "yes" ? "🎉" : "💙"}</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.3rem", color: GOLD_LIGHT, marginBottom: 4 }}>
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
  )
}

// ── Seat Finder ──
// ── Photo Book — click arrows to "turn pages" through the gallery ──
function PhotoBook({ photos }: { photos: string[] }) {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)

  const goNext = () => { setDirection(1); setIndex(i => (i + 1) % photos.length) }
  const goPrev = () => { setDirection(-1); setIndex(i => (i - 1 + photos.length) % photos.length) }

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        position: "relative", width: "100%", aspectRatio: "4/5", borderRadius: 18, overflow: "hidden",
        background: RED_DARK, boxShadow: "0 12px 36px rgba(74,16,16,0.3), inset 0 0 0 1px rgba(212,168,67,0.25)",
        perspective: 1200,
      }}>
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={index}
            custom={direction}
            initial={{ rotateY: direction === 1 ? 90 : -90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: direction === 1 ? -90 : 90, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[index]} alt={`Memory ${index + 1}`}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={e => (e.currentTarget.style.display = "none")} />
          </motion.div>
        </AnimatePresence>

        {/* Page-edge shadow lines for a "book" feel */}
        <div style={{ position: "absolute", inset: 0, boxShadow: "inset 8px 0 16px -8px rgba(0,0,0,0.35), inset -8px 0 16px -8px rgba(0,0,0,0.35)", pointerEvents: "none" }} />

        {/* Nav arrows */}
        <button onClick={goPrev} aria-label="Previous photo" style={{
          position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
          width: 38, height: 38, borderRadius: "50%", border: "none", cursor: "pointer",
          background: "rgba(0,0,0,0.4)", color: GOLD_LIGHT, fontSize: 16, backdropFilter: "blur(4px)",
        }}>‹</button>
        <button onClick={goNext} aria-label="Next photo" style={{
          position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
          width: 38, height: 38, borderRadius: "50%", border: "none", cursor: "pointer",
          background: "rgba(0,0,0,0.4)", color: GOLD_LIGHT, fontSize: 16, backdropFilter: "blur(4px)",
        }}>›</button>

        {/* Page counter */}
        <div style={{
          position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)",
          fontSize: 10, letterSpacing: "0.15em", color: GOLD_LIGHT, background: "rgba(0,0,0,0.4)",
          padding: "4px 12px", borderRadius: 100, backdropFilter: "blur(4px)",
        }}>
          {index + 1} / {photos.length}
        </div>
      </div>

      {/* Thumbnail dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 14 }}>
        {photos.map((_, i) => (
          <button
            key={i}
            onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i) }}
            aria-label={`Go to photo ${i + 1}`}
            style={{
              width: i === index ? 18 : 6, height: 6, borderRadius: 100, border: "none", cursor: "pointer",
              background: i === index ? GOLD : `${GOLD}44`, transition: "all 0.3s",
            }}
          />
        ))}
      </div>
    </div>
  )
}

function SeatFinder({ seats }: { seats: Record<string, string> }) {
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
          placeholder="Enter your name..." style={{ flex: 1, padding: "13px 16px", borderRadius: 12, border: `1px solid ${GOLD}33`, background: "#2a0d0d", color: "#fff", fontSize: 14, outline: "none", fontFamily: "'Inter',sans-serif" }} />
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={search} style={{ padding: "13px 20px", borderRadius: 12, background: `linear-gradient(135deg,${GOLD_LIGHT},${GOLD})`, color: RED_DARK, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, boxShadow: "0 4px 14px rgba(212,168,67,0.3)" }}>Search</motion.button>
      </div>
      {res && <div style={{ marginTop: 12, fontSize: 14, color: res.startsWith("You") ? GOLD_LIGHT : "rgba(255,255,255,0.5)", fontWeight: res.startsWith("You") ? 600 : 400 }}>{res}</div>}
    </div>
  )
}

// ── Mandala Section: a framed, arch-topped panel used throughout ──
function MandalaSection({
  eyebrow, title, children, id, dark,
}: { eyebrow: string; title?: string; children: React.ReactNode; id?: string; dark?: boolean }) {
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }}
      style={{ margin: "0 16px 18px", position: "relative" }}>

      {/* Arch-top frame */}
      <div style={{
        background: dark ? RED_DARK : CREAM,
        borderRadius: 26,
        border: `1px solid ${GOLD}44`,
        padding: "1.8rem 1.4rem",
        position: "relative",
        boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
      }}>
        {/* Top arch ornament */}
        <div style={{ position: "absolute", top: -1, left: "50%", transform: "translate(-50%,-50%)", width: 36, height: 36, borderRadius: "50%", background: dark ? RED_DARK : CREAM, border: `1px solid ${GOLD}66`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
          🪷
        </div>

        <div style={{ fontSize: 9, letterSpacing: "0.35em", textTransform: "uppercase", color: GOLD, textAlign: "center", marginTop: 14, marginBottom: title ? 4 : 14, fontWeight: 700 }}>
          {eyebrow}
        </div>
        {title && (
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.5rem", color: dark ? "#fff" : "#3a1010", textAlign: "center", marginBottom: 18 }}>
            {title}
          </div>
        )}

        {children}

        {/* Corner ornaments */}
        <div style={{ position: "absolute", bottom: 8, left: 8, opacity: 0.5 }}><CornerOrnament /></div>
        <div style={{ position: "absolute", bottom: 8, right: 8, opacity: 0.5 }}><CornerOrnament flip /></div>
      </div>
    </motion.div>
  )
}

export default function KandyanHeritageTemplate({ couple }: { couple: Couple }) {
  const [opened, setOpened] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const songUrl = couple.song_url || DEFAULT_SONG_URL
    const audio = new Audio(songUrl)
    audio.loop = true
    audio.volume = 0.6
    audioRef.current = audio
    return () => { audio.pause(); audio.src = "" }
  }, [couple])

  const handleDoorsOpen = () => {
    setOpened(true)
    audioRef.current?.play().catch(() => {})
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
    <div style={{ fontFamily: "'Inter',sans-serif", minHeight: "100vh", background: RED_DARK }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Inter:wght@300;400;500;600&display=swap');
        @keyframes spin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
        @keyframes lotus-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.45; }
          50% { transform: translateY(50vh) translateX(15px) rotate(180deg); }
          90% { opacity: 0.45; }
          100% { transform: translateY(105vh) translateX(-10px) rotate(360deg); opacity: 0; }
        }
        input::placeholder { color: rgba(212,168,67,0.35); }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto", background: CREAM, boxShadow: "0 0 100px rgba(0,0,0,0.55)", position: "relative", overflow: "hidden", borderRadius: 0 }}>

        {/* ── TEMPLE DOORS COVER ── */}
        {!opened && (
          <TempleDoors
            photo={W.couplePhoto}
            bride={W.bride}
            groom={W.groom}
            dateDisplay={W.dateDisplay}
            venue={W.venue}
            onOpen={handleDoorsOpen}
          />
        )}

        {/* ── FULL INVITATION ── */}
        {opened && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} style={{ background: CREAM }}>
            <LotusPetals count={8} />

            {/* Hero */}
            <div style={{ position: "relative", height: 420, overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={W.couplePhoto} alt={`${W.bride} and ${W.groom}`}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 25%" }}
                onError={e => { (e.currentTarget as HTMLImageElement).src = DEFAULT_PHOTO }} />
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, rgba(74,16,16,0.15) 0%, ${CREAM} 100%)` }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 1.5rem 24px", textAlign: "center", zIndex: 4 }}>
                <div style={{ fontSize: 9, letterSpacing: "0.5em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", marginBottom: "0.6rem" }}>Together with their families</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontStyle: "italic", fontSize: "clamp(2rem,7vw,3rem)", color: "#fff", lineHeight: 1, textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>
                  {W.bride}<span style={{ color: GOLD_LIGHT }}> &amp; </span>{W.groom}
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
                  <a href="#rsvp" style={{ background: `linear-gradient(135deg,${GOLD_LIGHT},${GOLD})`, color: RED_DARK, borderRadius: 100, padding: "10px 20px", fontSize: 11, letterSpacing: "0.1em", textDecoration: "none", fontWeight: 700 }}>RSVP</a>
                  <a href="#location" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 100, padding: "10px 20px", fontSize: 11, letterSpacing: "0.1em", textDecoration: "none", fontWeight: 500, backdropFilter: "blur(6px)" }}>Location</a>
                </div>
              </div>
            </div>

            {/* Lotus strip divider */}
            <div style={{ background: CREAM, padding: "14px 0", textAlign: "center" }}>
              <LotusDivider />
            </div>

            {/* Formal invite */}
            {(W.brideFamilyName || W.groomFamilyName) && (
              <MandalaSection eyebrow="With Love">
                <div style={{ textAlign: "center", fontSize: 13, color: "#6a3030", lineHeight: 2 }}>
                  {W.brideFamilyName && <><strong style={{ color: "#3a1010" }}>{W.brideFamilyName}</strong><br /></>}
                  {W.brideFamilyName && W.groomFamilyName && <>&amp;<br /></>}
                  {W.groomFamilyName && <><strong style={{ color: "#3a1010" }}>{W.groomFamilyName}</strong><br /></>}
                  request the honour of your presence<br />to celebrate the marriage of their loving children
                </div>
              </MandalaSection>
            )}

            {/* Wedding details — circular badges in a ring layout */}
            <MandalaSection eyebrow="Save the Date" title="Wedding Details">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[
                  { icon: "📅", label: "Date", val: W.dateDisplay },
                  { icon: "⏰", label: "Time", val: `${W.timeDisplay}` },
                  { icon: "📍", label: "Venue", val: W.venue },
                  { icon: "👗", label: "Dress", val: "Traditional" },
                ].map(d => (
                  <div key={d.label} style={{ textAlign: "center" }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: "50%", margin: "0 auto 8px",
                      background: `radial-gradient(circle at 35% 35%, ${GOLD_LIGHT}, ${GOLD})`,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                      boxShadow: "0 4px 14px rgba(212,168,67,0.3)",
                    }}>{d.icon}</div>
                    <div style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "#9a7050" }}>{d.label}</div>
                    <div style={{ fontSize: 12, color: "#3a1010", fontWeight: 600, marginTop: 2 }}>{d.val}</div>
                  </div>
                ))}
              </div>
            </MandalaSection>

            {/* Countdown */}
            <MandalaSection eyebrow="Counting Down" dark>
              <Countdown targetDate={W.date} />
            </MandalaSection>

            {/* Location */}
            {couple.maps_url && (
              <MandalaSection eyebrow="Find Us" title="The Venue" id="location">
                <a href={couple.maps_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block" }}>
                  <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }} style={{ background: "#fff", borderRadius: 18, padding: 22, textAlign: "center", border: `1px solid ${GOLD}33`, boxShadow: "0 6px 20px rgba(74,16,16,0.08)" }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: `linear-gradient(135deg,${GOLD_LIGHT},${GOLD})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 18 }}>🗺️</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#3a1010", marginBottom: 4 }}>{W.venue}</div>
                    <div style={{ fontSize: 11, color: "#9a7050", marginBottom: 14 }}>{W.venueAddress}</div>
                    <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: RED, fontWeight: 700 }}>Tap to View on Maps →</div>
                  </motion.div>
                </a>
              </MandalaSection>
            )}

            {/* Schedule */}
            {W.timeline.length > 0 && (
              <MandalaSection eyebrow="The Celebration" title="Wedding Day Schedule">
                {W.timeline.map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: i < W.timeline.length - 1 ? `1px solid ${GOLD}22` : "none" }}>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "0.95rem", color: RED, minWidth: 64 }}>{t.time}</div>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: GOLD, flexShrink: 0 }} />
                    <div style={{ fontSize: 13, color: "#3a1010", fontWeight: 500, flex: 1 }}>{t.event}</div>
                  </div>
                ))}
              </MandalaSection>
            )}

            {/* RSVP — dark mandala panel */}
            <div id="rsvp">
              <MandalaSection eyebrow="" dark>
                <RSVP coupleId={couple.id} askDrinking={couple.ask_drinking} />
              </MandalaSection>
            </div>

            {/* Seat finder */}
            {Object.keys(W.seats).length > 0 && (
              <MandalaSection eyebrow="Be Our Guest" title="Find Your Table">
                <div style={{ fontSize: 13, color: "#9a7050", marginBottom: 12, textAlign: "center" }}>Search your name to find your assigned table</div>
                <SeatFinder seats={W.seats} />
              </MandalaSection>
            )}

            {/* Music */}
            <MandalaSection eyebrow="Our Song" dark>
              <MusicPlayerUI title={W.song} artist={W.artist} audioRef={audioRef} />
            </MandalaSection>

            {/* Gallery — photo book viewer */}
            {W.gallery.length > 0 && (
              <MandalaSection eyebrow="Our Story" title="Moments Together">
                <PhotoBook photos={W.gallery} />
              </MandalaSection>
            )}

            {/* Thank You Note */}
            <MandalaSection eyebrow="A Special Note" title="To Our Lovely Guests">
              <div style={{ textAlign: "center", fontSize: 13, color: "#6a3030", lineHeight: 2 }}>
                With hearts full of love and gratitude, we are so happy to celebrate this beautiful chapter of our lives with you. Your presence means more to us than words can truly express.
                <br /><br />
                Thank you for your love, your blessings, and for being part of our journey.
              </div>
              <div style={{ textAlign: "center", marginTop: 16 }}>
                <div style={{ fontSize: 11, color: "#9a7050" }}>With all our love,</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.5rem", color: RED, marginTop: 4 }}>{W.bride} &amp; {W.groom}</div>
              </div>
            </MandalaSection>

            {/* Footer */}
            <div style={{ padding: "2rem 1.5rem", textAlign: "center", background: RED_DARK }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.3rem", color: GOLD_LIGHT, marginBottom: 4 }}>InviteGlow</div>
              <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: `${GOLD}66` }}>inviteglow.com · Digital Wedding Invitations</div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}