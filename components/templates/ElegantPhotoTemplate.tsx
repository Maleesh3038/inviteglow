"use client"
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, Couple } from '@/lib/supabase'

const DEFAULT_PHOTO = "/images/hero-elegant.jpg"
const DEFAULT_SONG_URL = "/audio/calm-wedding.mp3"
const DEFAULT_SONG_TITLE = "Calm Wedding Theme"
const DEFAULT_SONG_ARTIST = "InviteGlow"

// ── Countdown — circular style ──
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
    <div style={{ display: "flex", justifyContent: "center", gap: 14, maxWidth: 380, margin: "0 auto" }}>
      {[["Days", t.d], ["Hours", t.h], ["Mins", t.m], ["Secs", t.s]].map(([l, v]) => (
        <div key={l} style={{ flex: 1, textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fff", border: "1.5px solid #e8d4c0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", boxShadow: "0 4px 16px rgba(201,160,110,0.1)" }}>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.3rem", fontWeight: 500, color: "#2d2424" }}>{v}</span>
          </div>
          <span style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "#a89888" }}>{l}</span>
        </div>
      ))}
    </div>
  )
}

// ── Falling Petals — ambient ──
function FallingPetals({ count = 10 }: { count?: number }) {
  const petals = ['🌸', '🌷', '✿']
  const [items, setItems] = useState<{ id: number; left: number; emoji: string; duration: number; delay: number; size: number }[]>([])
  useEffect(() => {
    setItems(Array.from({ length: count }).map((_, i) => ({
      id: i, left: Math.random() * 100, emoji: petals[Math.floor(Math.random() * petals.length)],
      duration: 8 + Math.random() * 8, delay: Math.random() * 10, size: 14 + Math.random() * 14,
    })))
  }, [count])
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 1 }}>
      {items.map(p => (
        <div key={p.id} style={{ position: "absolute", top: -40, left: `${p.left}%`, fontSize: p.size, opacity: 0.5, animation: `petal-fall ${p.duration}s linear ${p.delay}s infinite` }}>
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
    <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#faf6f4", borderRadius: 16, padding: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: playing ? "50%" : 10, background: "linear-gradient(135deg,#c9a06e,#8a6a3e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, animation: playing ? "spin 4s linear infinite" : "none" }}>🎵</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#2d2424" }}>{title}</div>
        <div style={{ fontSize: 11, color: "#a89888", marginTop: 2 }}>{artist}</div>
        <div style={{ height: 3, background: "rgba(201,160,110,0.15)", borderRadius: 100, marginTop: 8 }}>
          <div style={{ height: "100%", width: `${prog}%`, background: "linear-gradient(to right,#c9a06e,#e8d5a0)", borderRadius: 100, transition: "width 0.3s" }} />
        </div>
      </div>
      <button onClick={toggle} style={{ width: 40, height: 40, borderRadius: "50%", background: "#2d2424", border: "none", color: "#fff", cursor: "pointer", fontSize: 14, flexShrink: 0 }}>
        {playing ? "⏸" : "▶"}
      </button>
    </div>
  )
}

// ── RSVP — name → guest count → drinking (optional) → done ──
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

  const inputStyle: React.CSSProperties = { width: "100%", padding: "13px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "#3a302f", color: "#fff", fontSize: 14, outline: "none", marginBottom: 12, fontFamily: "'Inter',sans-serif" }

  return (
    <div style={{ background: "#2d2424", padding: "40px 1.5rem", textAlign: "center" }}>
      <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "#c9a06e", marginBottom: 8, fontWeight: 600 }}>Be Our Guest</div>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.8rem", color: "#fff", marginBottom: 8 }}>Will You Join Us?</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>It only takes a few seconds to RSVP</div>
      <div style={{ background: "#3a302f", borderRadius: 16, padding: 24, maxWidth: 380, margin: "0 auto" }}>

        {step === "form" && (
          <>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" style={inputStyle} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={handleAccept} style={{ padding: 13, borderRadius: 10, background: "#c9a06e", color: "#2d2424", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✓ Accept</button>
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
              <button onClick={() => setGuestCount(c => Math.max(1, c - 1))} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.08)", color: "#c9a06e", border: "none", cursor: "pointer", fontSize: 16 }}>−</button>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.8rem", color: "#fff", minWidth: 40 }}>{guestCount}</div>
              <button onClick={() => setGuestCount(c => Math.min(20, c + 1))} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.08)", color: "#c9a06e", border: "none", cursor: "pointer", fontSize: 16 }}>+</button>
            </div>
            <button onClick={handleCountNext} disabled={saving} style={{ width: "100%", padding: 13, borderRadius: 10, background: "#c9a06e", color: "#2d2424", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, opacity: saving ? 0.6 : 1 }}>
              {saving ? "..." : "Continue →"}
            </button>
          </motion.div>
        )}

        {step === "drinking" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 14 }}>Will you be having alcohol?</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={() => save("yes", "yes", guestCount)} disabled={saving} style={{ padding: 13, borderRadius: 10, background: "rgba(201,160,110,0.15)", color: "#c9a06e", border: "1px solid rgba(201,160,110,0.3)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>🍷 Yes</button>
              <button onClick={() => save("yes", "no", guestCount)} disabled={saving} style={{ padding: 13, borderRadius: 10, background: "rgba(201,160,110,0.15)", color: "#c9a06e", border: "1px solid rgba(201,160,110,0.3)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>🥤 No</button>
            </div>
          </motion.div>
        )}

        {step === "done" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{finalResponse === "yes" ? "🎉" : "💙"}</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.3rem", color: "#c9a06e", marginBottom: 4 }}>
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
          placeholder="Enter your name..." style={{ flex: 1, padding: "13px 16px", borderRadius: 10, border: "1px solid #e8e0d8", background: "#faf6f4", color: "#2d2424", fontSize: 14, outline: "none", fontFamily: "'Inter',sans-serif" }} />
        <button onClick={search} style={{ padding: "13px 20px", borderRadius: 10, background: "#2d2424", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Search</button>
      </div>
      {res && <div style={{ marginTop: 12, fontSize: 14, color: res.startsWith("You") ? "#c9a06e" : "#a89888", fontWeight: res.startsWith("You") ? 600 : 400 }}>{res}</div>}
    </div>
  )
}

const sectionCard: React.CSSProperties = { background: "#fff", margin: "0 16px 16px", borderRadius: 22, padding: "1.8rem", boxShadow: "0 2px 24px rgba(45,36,36,0.05)" }
const sectionEyebrow: React.CSSProperties = { fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color: "#c9a06e", textAlign: "center", marginBottom: 6, fontWeight: 600 }
const sectionTitle: React.CSSProperties = { fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.5rem", color: "#2d2424", textAlign: "center", marginBottom: 20 }

export default function ElegantPhotoTemplate({ couple }: { couple: Couple }) {
  const [opened, setOpened] = useState(false)
  const audioRef = useState<{ current: HTMLAudioElement | null }>({ current: null })[0]

  useEffect(() => {
    const songUrl = couple.song_url || DEFAULT_SONG_URL
    const audio = new Audio(songUrl)
    audio.loop = true
    audio.volume = 0.6
    audioRef.current = audio
    return () => { audio.pause(); audio.src = "" }
  }, [couple])

  const handleEnter = () => {
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
    <div style={{ fontFamily: "'Inter',sans-serif", minHeight: "100vh", background: "#e8ddd4" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Inter:wght@300;400;500;600&display=swap');
        @keyframes spin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
        @keyframes pulse-ring { 0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,0.15);} 50%{box-shadow:0 0 0 10px rgba(255,255,255,0);} }
        @keyframes float-orb { 0%,100%{transform:translateY(0) rotate(0deg);} 50%{transform:translateY(-16px) rotate(6deg);} }
        @keyframes petal-fall {
          0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.5; }
          50% { transform: translateY(50vh) translateX(20px) rotate(180deg); }
          90% { opacity: 0.5; }
          100% { transform: translateY(105vh) translateX(-15px) rotate(360deg); opacity: 0; }
        }
        input::placeholder { color: #a89888; }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto", background: "#faf6f4", boxShadow: "0 0 100px rgba(0,0,0,0.12)", position: "relative", borderRadius: 0, overflow: "hidden" }}>

        {!opened && (
          <div style={{ position: "relative", minHeight: 600, height: "100vh", maxHeight: 760, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(ellipse 80% 60% at 30% 20%, #2a1810 0%, #14100e 45%, #0a0807 100%)" }}>

            {/* Orbiting decorative rings */}
            <div style={{ position: "absolute", width: 480, height: 480, top: "38%", left: "45%", transform: "translate(-50%,-50%)", borderRadius: "50%", border: "1px solid rgba(212,140,80,0.12)" }} />
            <div style={{ position: "absolute", width: 620, height: 620, top: "38%", left: "45%", transform: "translate(-50%,-50%)", borderRadius: "50%", border: "1px solid rgba(212,140,80,0.07)" }} />

            {/* Floating gradient orbs */}
            {[
              { s: 70, t: "10%", l: "10%", d: "7s" },
              { s: 50, t: "14%", r: "8%", d: "8s", dl: "1s" },
              { s: 36, b: "16%", l: "8%", d: "9s", dl: "0.5s" },
              { s: 58, b: "12%", r: "10%", d: "7.5s", dl: "1.5s" },
              { s: 30, t: "48%", l: "4%", d: "8.5s", dl: "0.8s" },
              { s: 34, t: "44%", r: "5%", d: "7.8s", dl: "2s" },
            ].map((o, i) => (
              <div key={i} style={{
                position: "absolute", borderRadius: "50%", opacity: 0.5,
                width: o.s, height: o.s,
                top: (o as any).t, left: (o as any).l, bottom: (o as any).b, right: (o as any).r,
                background: "radial-gradient(circle at 35% 35%, rgba(60,55,52,0.9), rgba(20,16,14,0.95))",
                boxShadow: "inset -4px -4px 10px rgba(0,0,0,0.4), inset 3px 3px 8px rgba(255,255,255,0.04)",
                animation: `float-orb ${o.d} ease-in-out ${(o as any).dl || "0s"} infinite`,
              }} />
            ))}

            {/* Subtle drifting petals */}
            <FallingPetals count={5} />

            {/* Frosted glass card */}
            <motion.div initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.9, ease: "easeOut" }}
              style={{
                position: "relative", zIndex: 4, textAlign: "center", padding: "2.6rem 2.2rem", width: "86%", maxWidth: 360,
                background: "rgba(255,255,255,0.045)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 26,
                boxShadow: "0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
              }}>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 100,
                  background: "rgba(212,90,60,0.15)", border: "1px solid rgba(212,90,60,0.3)", marginBottom: "1.2rem",
                }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#e0734a" }} />
                <span style={{ fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "#e8a888", fontWeight: 600 }}>Wedding Invitation</span>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                style={{ fontSize: 10, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "0.8rem" }}>
                You Are Invited
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.7 }}
                style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontSize: "clamp(2.4rem,8vw,3.6rem)", color: "#fff", fontStyle: "italic", lineHeight: 1.05 }}>
                {W.bride}
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.6rem", color: "#e0734a", margin: "2px 0", fontStyle: "italic" }}>
                &amp;
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65, duration: 0.7 }}
                style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontSize: "clamp(2.4rem,8vw,3.6rem)", color: "#fff", fontStyle: "italic", lineHeight: 1.05 }}>
                {W.groom}
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, margin: "1rem 0" }}>
                <div style={{ height: 1, width: 36, background: "rgba(255,255,255,0.15)" }} />
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#e0734a" }} />
                <div style={{ height: 1, width: 36, background: "rgba(255,255,255,0.15)" }} />
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
                style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, marginBottom: "1.6rem" }}>
                Join us as we celebrate love, joy, and<br />unforgettable moments together
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05 }}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={handleEnter}
                style={{
                  padding: "14px 32px", borderRadius: 100, border: "none",
                  background: "linear-gradient(135deg, #d4524a 0%, #e0a23a 100%)", color: "#1a0f08",
                  fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer",
                  fontFamily: "'Inter',sans-serif", fontWeight: 700,
                  boxShadow: "0 8px 30px rgba(212,82,74,0.4)",
                }}>
                Open Invitation →
              </motion.button>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
                style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 14, letterSpacing: "0.05em" }}>
                🎵 Tap to begin — with music
              </motion.div>
            </motion.div>
          </div>
        )}

        {opened && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
            <FallingPetals count={8} />

            {/* Hero (smaller, persists after opening) */}
            <div style={{ position: "relative", height: 420, overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={W.couplePhoto} alt={`${W.bride} and ${W.groom}`}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }}
                onError={e => { (e.currentTarget as HTMLImageElement).src = DEFAULT_PHOTO }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(10,8,6,0.3) 0%, rgba(10,8,6,0.15) 45%, rgba(250,246,244,1) 100%)" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 1.5rem 24px", textAlign: "center", zIndex: 4 }}>
                <div style={{ fontSize: 9, letterSpacing: "0.5em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", marginBottom: "0.6rem" }}>Together with their families</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontSize: "clamp(2rem,7vw,3rem)", color: "#fff", fontStyle: "italic", lineHeight: 1, textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}>
                  {W.bride}<span style={{ color: "#f0d4a8" }}> &amp; </span>{W.groom}
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
                  <a href="#rsvp" style={{ background: "#2d2424", color: "#fff", borderRadius: 100, padding: "10px 20px", fontSize: 11, letterSpacing: "0.1em", textDecoration: "none", fontWeight: 500 }}>RSVP</a>
                  <a href="#location" style={{ background: "rgba(255,255,255,0.9)", color: "#2d2424", borderRadius: 100, padding: "10px 20px", fontSize: 11, letterSpacing: "0.1em", textDecoration: "none", fontWeight: 500 }}>Location</a>
                </div>
              </div>
            </div>

            {/* Formal invite */}
            {(W.brideFamilyName || W.groomFamilyName) && (
              <motion.div style={sectionCard} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={sectionEyebrow}>With Love</div>
                <div style={{ textAlign: "center", fontSize: 13, color: "#6a5a4a", lineHeight: 2 }}>
                  {W.brideFamilyName && <><strong style={{ color: "#2d2424" }}>{W.brideFamilyName}</strong><br /></>}
                  {W.brideFamilyName && W.groomFamilyName && <>&amp;<br /></>}
                  {W.groomFamilyName && <><strong style={{ color: "#2d2424" }}>{W.groomFamilyName}</strong><br /></>}
                  request the honour of your presence<br />to celebrate the marriage of their loving children
                </div>
              </motion.div>
            )}

            {/* Wedding details strip (dark) */}
            <div style={{ background: "#2d2424", margin: "0 16px 16px", borderRadius: 22, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "rgba(255,255,255,0.06)" }}>
                {[
                  { icon: "📅", label: "Date", val: W.dateDisplay, gold: true },
                  { icon: "⏰", label: "Time", val: `${W.timeDisplay} Onwards` },
                  { icon: "📍", label: "Venue", val: W.venue },
                  { icon: "👗", label: "Dress", val: "Formal Attire" },
                ].map(d => (
                  <div key={d.label} style={{ background: "#2d2424", padding: 20, textAlign: "center" }}>
                    <div style={{ fontSize: 16, marginBottom: 6 }}>{d.icon}</div>
                    <div style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>{d.label}</div>
                    <div style={{
                      fontSize: d.gold ? 15 : 13, color: d.gold ? "#f0d4a8" : "#fff", fontWeight: 500, marginTop: 4,
                      fontFamily: d.gold ? "'Cormorant Garamond',serif" : "inherit", fontStyle: d.gold ? "italic" : "normal",
                    }}>{d.val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Countdown */}
            <div style={{ background: "#fff", padding: "1.5rem 1rem", textAlign: "center", margin: "0 16px 16px", borderRadius: 22, boxShadow: "0 2px 24px rgba(45,36,36,0.05)" }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.2rem", color: "#2d2424", marginBottom: 16 }}>Counting down to our big day</div>
              <Countdown targetDate={W.date} />
            </div>

            {/* Location */}
            {couple.maps_url && (
              <motion.div style={sectionCard} id="location" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={sectionEyebrow}>Find Us</div>
                <div style={sectionTitle}>The Venue</div>
                <a href={couple.maps_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block" }}>
                  <div style={{ background: "#faf6f4", borderRadius: 16, padding: 24, textAlign: "center" }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#2d2424", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 18 }}>🗺️</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#2d2424", marginBottom: 4 }}>{W.venue}</div>
                    <div style={{ fontSize: 11, color: "#a89888", marginBottom: 14 }}>{W.venueAddress}</div>
                    <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#c9a06e", fontWeight: 600 }}>Tap to View on Maps →</div>
                  </div>
                </a>
              </motion.div>
            )}

            {/* Timeline */}
            {W.timeline.length > 0 && (
              <motion.div style={sectionCard} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={sectionEyebrow}>The Celebration</div>
                <div style={sectionTitle}>Wedding Day Schedule</div>
                {W.timeline.map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 0", borderBottom: i < W.timeline.length - 1 ? "1px solid #f3e9e3" : "none" }}>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1rem", color: "#c9a06e", minWidth: 70 }}>{t.time}</div>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d2424", flexShrink: 0 }} />
                    <div style={{ fontSize: 13, color: "#2d2424", fontWeight: 500, flex: 1 }}>{t.event}</div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* RSVP */}
            <div id="rsvp" style={{ margin: "0 16px 16px", borderRadius: 22, overflow: "hidden" }}>
              <RSVP coupleId={couple.id} askDrinking={couple.ask_drinking} />
            </div>

            {/* Seat finder */}
            {Object.keys(W.seats).length > 0 && (
              <motion.div style={sectionCard} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={sectionEyebrow}>Be Our Guest</div>
                <div style={sectionTitle}>Find Your Table</div>
                <div style={{ fontSize: 13, color: "#a89888", marginBottom: 12, textAlign: "center" }}>Search your name to find your assigned table</div>
                <SeatFinder seats={W.seats} />
              </motion.div>
            )}

            {/* Music */}
            <motion.div style={sectionCard} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div style={sectionEyebrow}>Our Song</div>
              <MusicPlayerUI title={W.song} artist={W.artist} audioRef={audioRef} />
            </motion.div>

            {/* Gallery */}
            {W.gallery.length > 0 && (
              <motion.div style={sectionCard} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={sectionEyebrow}>Our Story</div>
                <div style={sectionTitle}>Moments Together</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {W.gallery.map((src, i) => (
                    <div key={i} style={{ gridRow: i === 0 ? "span 2" : undefined, borderRadius: 16, overflow: "hidden", background: "#e8ddd4", aspectRatio: i === 0 ? "1/2" : "1/1" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => (e.currentTarget.style.display = "none")} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Thank You Note */}
            <motion.div style={sectionCard} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div style={sectionEyebrow}>A Special Note</div>
              <div style={sectionTitle}>To Our Lovely Guests</div>
              <div style={{ textAlign: "center", fontSize: 13, color: "#6a5a4a", lineHeight: 2 }}>
                With hearts full of love and gratitude, we are so happy to celebrate this beautiful chapter of our lives with you. Your presence means more to us than words can truly express.
                <br /><br />
                Thank you for your love, your blessings, and for being part of our journey.
              </div>
              <div style={{ textAlign: "center", marginTop: 16 }}>
                <div style={{ fontSize: 11, color: "#a89888" }}>With all our love,</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.5rem", color: "#c9a06e", marginTop: 4 }}>{W.bride} &amp; {W.groom}</div>
              </div>
            </motion.div>

            {/* Footer */}
            <div style={{ padding: "2rem 1.5rem", textAlign: "center", background: "#faf6f4" }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.3rem", color: "#c9a06e", marginBottom: 4 }}>InviteGlow</div>
              <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "#c4b5a8" }}>inviteglow.com · Digital Wedding Invitations</div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}