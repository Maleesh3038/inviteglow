"use client"
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, Couple } from '@/lib/supabase'

const DEFAULT_PHOTO = "/images/hero-floral.png"
const DEFAULT_SONG_URL = "/audio/calm-wedding.mp3"
const DEFAULT_SONG_TITLE = "Calm Wedding Theme"
const DEFAULT_SONG_ARTIST = "InviteGlow"

// ── Countdown ──
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
        <div key={l} style={{ flex: 1, textAlign: "center", padding: "16px 8px" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#f9e0e8,#fdf0f3)", border: "2px solid #e8b0c0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.3rem", color: "#c4607a", fontWeight: 600 }}>{v}</span>
          </div>
          <span style={{ fontSize: 8, letterSpacing: "0.25em", textTransform: "uppercase", color: "#c4a0b0" }}>{l}</span>
        </div>
      ))}
    </div>
  )
}

// ── Falling Petals — continuous ambient animation ──
function FallingPetals({ count = 12 }: { count?: number }) {
  const petals = ['🌸', '🌷', '✿', '🌺']
  const [items, setItems] = useState<{ id: number; left: number; emoji: string; duration: number; delay: number; size: number }[]>([])

  useEffect(() => {
    setItems(Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      emoji: petals[Math.floor(Math.random() * petals.length)],
      duration: 8 + Math.random() * 8,
      delay: Math.random() * 10,
      size: 14 + Math.random() * 14,
    })))
  }, [count])

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 1 }}>
      {items.map(p => (
        <div key={p.id} style={{
          position: "absolute", top: -40, left: `${p.left}%`, fontSize: p.size,
          opacity: 0.6, animation: `petal-fall ${p.duration}s linear ${p.delay}s infinite`,
        }}>
          {p.emoji}
        </div>
      ))}
    </div>
  )
}

// ── Music Player UI — controlled externally via the shared audio ref ──
function MusicPlayerUI({
  title, artist, audioRef,
}: { title: string; artist: string; audioRef: React.RefObject<HTMLAudioElement | null> }) {
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
    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('timeupdate', onTime)
    }
  }, [audioRef])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) { audio.play().catch(() => {}) } else { audio.pause() }
  }

  return (
    <div style={{ background: "#fde8ed", borderRadius: 14, padding: "14px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#c4607a,#e8a0b8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, animation: playing ? "spin 3s linear infinite" : "none" }}>🎵</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#3d1a2a" }}>{title}</div>
            <div style={{ fontSize: 11, color: "#9a7080", marginTop: 2 }}>{artist}</div>
          </div>
        </div>
        <button onClick={toggle} style={{ width: 38, height: 38, borderRadius: "50%", background: "#c4607a", border: "none", cursor: "pointer", color: "#fff", fontSize: 14 }}>
          {playing ? "⏸" : "▶"}
        </button>
      </div>
      <div style={{ height: 3, background: "rgba(196,96,122,0.15)", borderRadius: 100 }}>
        <div style={{ height: "100%", width: `${prog}%`, background: "linear-gradient(to right,#c4607a,#e8a0b8)", borderRadius: 100, transition: "width 0.3s" }} />
      </div>
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
    const { error } = await supabase.from('rsvps').insert([{
      couple_id: coupleId,
      guest_name: name.trim(),
      response,
      drinking,
      guest_count: count,
    }])
    setSaving(false)
    if (!error) {
      setFinalResponse(response)
      setStep("done")
    }
  }

  const handleAccept = () => {
    if (!name.trim()) return
    setStep("count")
  }

  const handleDecline = () => {
    if (!name.trim()) return
    save("no", null, 1)
  }

  const handleCountNext = () => {
    if (askDrinking) {
      setStep("drinking")
    } else {
      save("yes", null, guestCount)
    }
  }

  return (
    <div style={{ background: "linear-gradient(135deg,#fde8ee,#fdf0f3)", padding: "2.5rem 1.5rem", textAlign: "center" }}>
      <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "2.2rem", color: "#3d1a2a", marginBottom: 6 }}>We are so happy to invite you</div>
      <div style={{ fontSize: 12, color: "#9a7080", marginBottom: 20 }}>Please enter your name and RSVP — it only takes a few seconds!</div>
      <div style={{ background: "#fff", borderRadius: 16, padding: "1.5rem", maxWidth: 380, margin: "0 auto", boxShadow: "0 4px 20px rgba(200,120,140,0.1)" }}>

        {step === "form" && (
          <>
            <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#c4a0b0", marginBottom: 8, textAlign: "left" }}>Your Name</div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name..."
              style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #f0d0d8", background: "#fdf8f8", color: "#3d1a2a", fontSize: 14, outline: "none", fontFamily: "'Inter',sans-serif", marginBottom: 10, display: "block" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={handleAccept} disabled={saving} style={{ padding: 13, borderRadius: 10, background: "linear-gradient(135deg,#c4607a,#e08090)", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "'Inter',sans-serif", opacity: saving ? 0.6 : 1 }}>
                {saving ? "..." : "✓ Joyfully Accept"}
              </button>
              <button onClick={handleDecline} disabled={saving} style={{ padding: 13, borderRadius: 10, background: "#fde8ed", color: "#c4607a", border: "none", cursor: "pointer", fontSize: 13, fontFamily: "'Inter',sans-serif", opacity: saving ? 0.6 : 1 }}>
                {saving ? "..." : "✗ Regretfully Decline"}
              </button>
            </div>
          </>
        )}

        {step === "count" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ fontSize: 14, color: "#3d1a2a", fontWeight: 600, marginBottom: 4 }}>Wonderful, {name}! 🎉</div>
            <div style={{ fontSize: 12, color: "#9a7080", marginBottom: 16 }}>How many people will be coming, including yourself?</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 18 }}>
              <button onClick={() => setGuestCount(c => Math.max(1, c - 1))}
                style={{ width: 38, height: 38, borderRadius: "50%", background: "#fde8ed", color: "#c4607a", border: "none", cursor: "pointer", fontSize: 18, fontWeight: 600 }}>
                −
              </button>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "2rem", color: "#3d1a2a", fontWeight: 600, minWidth: 50, textAlign: "center" }}>
                {guestCount}
              </div>
              <button onClick={() => setGuestCount(c => Math.min(20, c + 1))}
                style={{ width: 38, height: 38, borderRadius: "50%", background: "#fde8ed", color: "#c4607a", border: "none", cursor: "pointer", fontSize: 18, fontWeight: 600 }}>
                +
              </button>
            </div>
            <div style={{ fontSize: 11, color: "#c4a0b0", marginBottom: 16 }}>
              {guestCount === 1 ? "Just yourself" : `Yourself + ${guestCount - 1} ${guestCount - 1 === 1 ? "guest" : "guests"}`}
            </div>
            <button onClick={handleCountNext} disabled={saving} style={{
              width: "100%", padding: 13, borderRadius: 10, background: "linear-gradient(135deg,#c4607a,#e08090)",
              color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "'Inter',sans-serif", opacity: saving ? 0.6 : 1,
            }}>
              {saving ? "..." : "Continue →"}
            </button>
          </motion.div>
        )}

        {step === "drinking" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ fontSize: 12, color: "#9a7080", marginBottom: 16 }}>One last quick question before you're confirmed</div>
            <div style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "#c4a0b0", marginBottom: 10, textAlign: "left" }}>Will you be having alcohol?</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={() => save("yes", "yes", guestCount)} disabled={saving}
                style={{ padding: 13, borderRadius: 10, background: "#fde8ed", color: "#c4607a", border: "1.5px solid #f0c0cc", cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "'Inter',sans-serif", opacity: saving ? 0.6 : 1 }}>
                🍷 Yes, please
              </button>
              <button onClick={() => save("yes", "no", guestCount)} disabled={saving}
                style={{ padding: 13, borderRadius: 10, background: "#fde8ed", color: "#c4607a", border: "1.5px solid #f0c0cc", cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "'Inter',sans-serif", opacity: saving ? 0.6 : 1 }}>
                🥤 No, thanks
              </button>
            </div>
          </motion.div>
        )}

        {step === "done" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: "1rem 0", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{finalResponse === "yes" ? "🎉" : "💙"}</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.3rem", fontStyle: "italic", color: "#c4607a", marginBottom: 4 }}>
              {finalResponse === "yes" ? `See you there, ${name}!` : `We'll miss you, ${name}.`}
            </div>
            <div style={{ fontSize: 12, color: "#9a7080" }}>
              {finalResponse === "yes"
                ? (guestCount > 1 ? `We've noted your party of ${guestCount} — we can't wait to celebrate with you all!` : "We can't wait to celebrate with you!")
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
    setRes(found ? `🌸 You are seated at ${seats[found]}` : "Name not found. Please contact the couple.")
  }
  return (
    <>
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && search()}
          placeholder="Enter your name..."
          style={{ flex: 1, padding: "12px 16px", borderRadius: 10, border: "1px solid #f0d0d8", background: "#fdf8f8", color: "#3d1a2a", fontSize: 14, outline: "none", fontFamily: "'Inter',sans-serif" }} />
        <button onClick={search} style={{ padding: "12px 18px", borderRadius: 10, background: "#c4607a", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "'Inter',sans-serif" }}>Search</button>
      </div>
      {res && <div style={{ marginTop: 12, fontSize: 14, color: res.startsWith("🌸") ? "#c4607a" : "#9a7080", fontWeight: res.startsWith("🌸") ? 500 : 400 }}>{res}</div>}
    </>
  )
}

const card: React.CSSProperties = { background: "#fff", margin: "0 16px 16px", borderRadius: 24, padding: "1.8rem", boxShadow: "0 2px 20px rgba(200,120,140,0.07)" }
const pretitle: React.CSSProperties = { fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color: "#e8a0b8", textAlign: "center", marginBottom: 6 }
const title: React.CSSProperties = { fontFamily: "'Great Vibes',cursive", fontSize: "2rem", color: "#3d1a2a", textAlign: "center", marginBottom: "1.5rem" }

export default function InvitePage() {
  const params = useParams()
  const slug = params.slug as string

  const [couple, setCouple] = useState<Couple | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [opened, setOpened] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from('couples').select('*').eq('slug', slug).single()
      if (error || !data) { setNotFound(true) } else { setCouple(data as Couple) }
      setLoading(false)
    }
    load()
  }, [slug])

  // Create the audio element once we know the song URL
  useEffect(() => {
    if (!couple) return
    const songUrl = couple.song_url || DEFAULT_SONG_URL
    const audio = new Audio(songUrl)
    audio.loop = true
    audio.volume = 0.6
    audioRef.current = audio
    return () => { audio.pause(); audio.src = "" }
  }, [couple])

  // ── Open Invitation: this click is the "user interaction" that lets us autoplay sound ──
  const handleOpenInvitation = () => {
    setOpened(true)
    const audio = audioRef.current
    if (audio) {
      audio.play().catch(() => {
        // Some browsers may still block it; the music card's play button works as fallback
      })
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fdf0f0", fontFamily: "'Inter',sans-serif", color: "#c4607a" }}>
        Loading invitation...
      </div>
    )
  }

  if (notFound || !couple) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fdf0f0", fontFamily: "'Inter',sans-serif", color: "#3d1a2a", textAlign: "center", padding: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💔</div>
        <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "2rem", color: "#c4607a", marginBottom: 8 }}>Invitation Not Found</div>
        <div style={{ fontSize: 14, color: "#9a7080" }}>This invitation link doesn't exist or may have been removed.</div>
      </div>
    )
  }

  const W = {
    bride: couple.bride,
    groom: couple.groom,
    brideFamilyName: couple.bride_family || '',
    groomFamilyName: couple.groom_family || '',
    date: couple.wedding_date,
    dateDisplay: new Date(couple.wedding_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    timeDisplay: new Date(couple.wedding_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) + ' Onwards',
    venue: couple.venue || '',
    venueAddress: couple.venue_address || '',
    mapsUrl: couple.maps_url || '#',
    couplePhoto: couple.couple_photo || DEFAULT_PHOTO,
    song: couple.song_title || DEFAULT_SONG_TITLE,
    artist: couple.song_artist || DEFAULT_SONG_ARTIST,
    timeline: couple.timeline || [],
    seats: couple.seats || {},
    gallery: couple.gallery || [],
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

      <div style={{ maxWidth: 480, margin: "0 auto", background: "#fdf0f0", boxShadow: "0 0 80px rgba(0,0,0,0.06)", position: "relative" }}>

        {/* ══ COVER ══ */}
        <AnimatePresence>
          {!opened && (
            <motion.div key="cover" exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.5 }}
              style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", background: "linear-gradient(135deg,#fde8e8 0%,#fdf0f3 40%,#f9e8f0 100%)" }}>

              <div style={{ position: "absolute", width: 400, height: 400, top: -100, left: -150, borderRadius: "50%", border: "1px solid rgba(210,140,160,0.15)" }} />
              <div style={{ position: "absolute", width: 300, height: 300, bottom: -80, right: -100, borderRadius: "50%", border: "1px solid rgba(210,140,160,0.15)" }} />

              {[
                { s: 70, t: "8%", l: "8%", d: "4s" },
                { s: 50, t: "12%", r: "10%", d: "5s", dl: "1s" },
                { s: 40, b: "12%", l: "6%", d: "6s", dl: "0.5s" },
                { s: 60, b: "10%", r: "8%", d: "4.5s", dl: "1.5s" },
                { s: 30, t: "45%", l: "3%", d: "5.5s", dl: "0.8s" },
                { s: 35, t: "40%", r: "4%", d: "4.8s", dl: "2s" },
              ].map((b, i) => (
                <div key={i} style={{
                  position: "absolute", borderRadius: "50%", opacity: 0.7,
                  width: b.s, height: b.s,
                  top: (b as any).t, left: (b as any).l, bottom: (b as any).b, right: (b as any).r,
                  background: "radial-gradient(circle at 35% 35%,#f9d0dc,#e8a0b8)",
                  animation: `float ${b.d} ease-in-out ${(b as any).dl || "0s"} infinite`,
                }} />
              ))}

              {[
                { t: "20%", l: "20%", d: "3s", e: "🌸" },
                { t: "30%", r: "18%", d: "4s", dl: "1s", e: "🌷" },
                { b: "25%", l: "25%", d: "3.5s", dl: "0.5s", e: "✿" },
              ].map((p, i) => (
                <div key={i} style={{ position: "absolute", top: (p as any).t, left: (p as any).l, right: (p as any).r, bottom: (p as any).b, fontSize: 18, opacity: 0.5, animation: `float ${p.d} ease-in-out ${(p as any).dl || "0s"} infinite` }}>{p.e}</div>
              ))}

              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
                style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(10px)", borderRadius: 24, padding: "3rem 2.5rem", textAlign: "center", width: "88%", maxWidth: 380, position: "relative", zIndex: 10, boxShadow: "0 20px 60px rgba(200,120,140,0.12)" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#f5e0e5", borderRadius: 100, padding: "6px 14px", fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "#c4607a", marginBottom: "1.2rem" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#c4607a", display: "inline-block" }} />
                  Wedding Invitation
                </div>
                <div style={{ fontSize: 10, letterSpacing: "0.4em", textTransform: "uppercase", color: "#c4a0b0", marginBottom: "0.8rem" }}>You Are Invited</div>
                <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "clamp(3rem,10vw,4.5rem)", color: "#3d1a2a", lineHeight: 1 }}>{W.bride}</div>
                <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "2.5rem", color: "#c4607a", margin: "0.1rem 0" }}>&amp;</div>
                <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "clamp(3rem,10vw,4.5rem)", color: "#3d1a2a", lineHeight: 1 }}>{W.groom}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", margin: "1.2rem 0" }}>
                  <div style={{ height: 1, width: 40, background: "#e8c0cc" }} />
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#e8b0c0" }} />
                  <div style={{ height: 1, width: 40, background: "#e8c0cc" }} />
                </div>
                <div style={{ fontSize: 13, color: "#9a7080", lineHeight: 1.7, marginBottom: "1.8rem" }}>
                  Join us as we celebrate love, joy, and<br />unforgettable moments together
                </div>
                <button onClick={handleOpenInvitation} style={{
                  display: "inline-flex", alignItems: "center", gap: 10,
                  background: "linear-gradient(135deg,#c4607a,#e08090)", color: "#fff",
                  border: "none", borderRadius: 100, padding: "14px 28px",
                  fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase",
                  cursor: "pointer", fontFamily: "'Inter',sans-serif", fontWeight: 500,
                  boxShadow: "0 8px 24px rgba(196,96,122,0.3)",
                  animation: "pulse-pink 2.5s ease infinite",
                }}>
                  Open Invitation →
                </button>
                <div style={{ fontSize: 9, color: "#c4a0b0", marginTop: 12, letterSpacing: "0.05em" }}>
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
                    <span style={{ display: "block", fontSize: "2.2rem", color: "#f9d0dc" }}>&amp;</span>
                    {W.groom}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", margin: "4px 0", letterSpacing: "0.1em" }}>are getting married</div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1rem", color: "rgba(255,255,255,0.65)", fontStyle: "italic", marginTop: 4 }}>
                    {W.dateDisplay} · {W.venue}
                  </div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
                    <a href="#rsvp" style={{ background: "linear-gradient(135deg,#c4607a,#e08090)", color: "#fff", borderRadius: 100, padding: "10px 22px", fontSize: 11, letterSpacing: "0.15em", textDecoration: "none", fontFamily: "'Inter',sans-serif" }}>RSVP</a>
                    <a href="#seat" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 100, padding: "10px 22px", fontSize: 11, letterSpacing: "0.15em", textDecoration: "none", fontFamily: "'Inter',sans-serif" }}>Find My Seat</a>
                  </div>
                </motion.div>
              </div>
            </div>

            <div style={{ background: "#fff", padding: 10, display: "flex", justifyContent: "center", gap: 8, borderBottom: "1px solid #f5e0e5" }}>
              {[1, 2, 3].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "#e8b0c0" }} />)}
            </div>

            {(W.brideFamilyName || W.groomFamilyName) && (
              <motion.div style={card} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={pretitle}>With Love</div>
                <div style={{ textAlign: "center", padding: 12, background: "#fdf5f7", borderRadius: 12, fontSize: 13, color: "#6a3040", lineHeight: 2 }}>
                  {W.brideFamilyName && <><strong>{W.brideFamilyName}</strong><br /></>}
                  {W.brideFamilyName && W.groomFamilyName && <>together with<br /></>}
                  {W.groomFamilyName && <><strong>{W.groomFamilyName}</strong><br /></>}
                  <span style={{ color: "#9a7080" }}>request the honour of your presence<br />to celebrate the marriage of their loving children</span>
                </div>
              </motion.div>
            )}

            <motion.div style={card} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div style={pretitle}>Save the Date</div>
              <div style={title}>Wedding Details</div>
              {[
                { icon: "📅", label: "Date", val: W.dateDisplay, pink: true },
                { icon: "⏰", label: "Time", val: W.timeDisplay },
                { icon: "📍", label: "Venue", val: W.venue, sub: W.venueAddress },
              ].map(d => d.val && (
                <div key={d.label} style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "12px 0", borderBottom: "1px solid #fde8ed" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#fde8ed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>{d.icon}</div>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#c4a0b0" }}>{d.label}</div>
                    <div style={{ fontSize: d.pink ? 18 : 15, color: d.pink ? "#c4607a" : "#3d1a2a", fontWeight: 500, marginTop: 2, fontFamily: d.pink ? "'Cormorant Garamond',serif" : "inherit", fontStyle: d.pink ? "italic" : "normal" }}>{d.val}</div>
                    {d.sub && <div style={{ fontSize: 12, color: "#9a7080", marginTop: 2 }}>{d.sub}</div>}
                  </div>
                </div>
              ))}
              {couple.maps_url && (
                <a href={couple.maps_url} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "#fde8ed", borderRadius: 100, padding: "10px 20px", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#c4607a", marginTop: 16, textDecoration: "none", fontWeight: 500 }}>
                  📍 View Location on Maps
                </a>
              )}
            </motion.div>

            <div style={{ background: "#fff", padding: "1.5rem 1rem", textAlign: "center", borderTop: "1px solid #f5e0e5", borderBottom: "1px solid #f5e0e5", marginBottom: 16 }}>
              <div style={pretitle}>Counting Down to Our Big Day</div>
              <Countdown targetDate={W.date} />
            </div>

            <div id="rsvp"><RSVP coupleId={couple.id} askDrinking={couple.ask_drinking} /></div>

            {W.timeline.length > 0 && (
              <motion.div style={card} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={pretitle}>Our Celebration</div>
                <div style={title}>The Wedding Lineup</div>
                <div style={{ position: "relative", paddingLeft: 20 }}>
                  <div style={{ position: "absolute", left: 6, top: 0, bottom: 0, width: 1, background: "#f5d0dc" }} />
                  {W.timeline.map((t, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                      style={{ position: "relative", padding: "10px 0 10px 20px" }}>
                      <div style={{ position: "absolute", left: -14, top: 14, width: 10, height: 10, borderRadius: "50%", background: "#c4607a", border: "2px solid #fff", boxShadow: "0 0 0 2px #e8b0c0" }} />
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#c4607a", letterSpacing: "0.1em" }}>{t.time}</div>
                      <div style={{ fontSize: 13, color: "#3d1a2a", fontWeight: 500, marginTop: 2 }}>{t.event}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {Object.keys(W.seats).length > 0 && (
              <motion.div style={card} id="seat" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={pretitle}>Be Our Guest</div>
                <div style={title}>Find Your Table</div>
                <div style={{ fontSize: 13, color: "#9a7080", marginBottom: 4 }}>Search your name to find your assigned table</div>
                <SeatFinder seats={W.seats} />
              </motion.div>
            )}

            {/* Music — auto-played on Open Invitation, controls here too */}
            <motion.div style={card} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div style={pretitle}>Our Song</div>
              <MusicPlayerUI title={W.song} artist={W.artist} audioRef={audioRef} />
            </motion.div>

            {W.gallery.length > 0 && (
              <motion.div style={card} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={pretitle}>Our Celebration</div>
                <div style={title}>Moments of Love</div>
                <div style={{ fontSize: 12, color: "#9a7080", textAlign: "center", marginBottom: 16, lineHeight: 1.7 }}>
                  Holding onto the laughter, the quiet moments, and the little sparks of magic that brought us here.
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {W.gallery.map((src, i) => (
                    <div key={i} style={{ gridRow: i === 0 ? "span 2" : undefined, borderRadius: 18, overflow: "hidden", background: "#f5e0e5", aspectRatio: i === 0 ? "1/2" : "1/1", boxShadow: "0 4px 16px rgba(200,120,140,0.1)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => (e.currentTarget.style.display = "none")} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Thank You Note */}
            <motion.div style={{ ...card, borderRadius: 24 }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div style={pretitle}>A Special Note</div>
              <div style={title}>To Our Lovely Guests</div>
              <div style={{ textAlign: "center", fontSize: 13, color: "#6a3040", lineHeight: 2 }}>
                With hearts full of love and gratitude, we are so happy to celebrate this beautiful chapter of our lives with you. Your presence means more to us than words can truly express, and having you by our side makes this day even more meaningful.
                <br /><br />
                Thank you for your love, your blessings, and for being part of our journey. We cannot wait to share laughter, joy, and unforgettable memories with the people who mean so much to us.
              </div>
              <div style={{ textAlign: "center", marginTop: 18 }}>
                <div style={{ fontSize: 11, color: "#c4a0b0", letterSpacing: "0.1em" }}>With all our love,</div>
                <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "1.8rem", color: "#c4607a", marginTop: 4 }}>
                  {W.bride} &amp; {W.groom}
                </div>
              </div>
            </motion.div>

            <div style={{ padding: "2rem 1.5rem", textAlign: "center", background: "#fff", borderTop: "1px solid #f5e0e5", borderRadius: "24px 24px 0 0" }}>
              <div style={{ fontSize: 18, marginBottom: 10, opacity: 0.5 }}>🌸 🌷 🌸</div>
              <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "1.5rem", color: "#c4607a", marginBottom: 4 }}>InviteGlow</div>
              <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "#c4a0b0" }}>inviteglow.com · Digital Wedding Invitations</div>
            </div>

          </motion.div>
        )}
      </div>
    </div>
  )
}