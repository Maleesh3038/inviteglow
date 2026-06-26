"use client"
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, Couple } from '@/lib/supabase'

const DEFAULT_PHOTO = "/images/hero-twilight.png"
const DEFAULT_SONG_URL = "/audio/calm-wedding.mp3"
const DEFAULT_SONG_TITLE = "Twilight Playlist"
const DEFAULT_SONG_ARTIST = "InviteGlow"

// ── Default palette — overridden by couple.custom_colors ──
// primary: warm gold/amber lantern glow · primaryLight: lighter amber highlight
// dark: near-black base (the page's backbone) · cream: a lifted charcoal for cards
const DEFAULT_PALETTE = {
  primary: "#d4a857",
  primaryLight: "#e8c878",
  dark: "#0a0806",
  cream: "#1a1610",
  muted: "rgba(255,255,255,0.45)",
}

// Guest houses shown when a guest requests accommodation — real partner list.
const GUEST_HOUSES = [
  { name: "White Wall Hotel", distance: "~1.5–2 km away", contact: "077 661 3062" },
  { name: "PARADISE INN", distance: "~2.5–3.5 km away", contact: "Direct details on Booking Link" },
  { name: "PARADISE VILLA", distance: "~6–7 km away", contact: "Online listings via Agoda/Booking.com" },
  { name: "Sundale Hotel", distance: "~8.5 km away", contact: "031 224 6148" },
]

// Vendor logos — real partner artwork, supplied by the couple. Each tile is
// labelled with the partner's role (not their brand name) above the logo,
// and sits on a dark card so the logos read cleanly against the page's
// black background regardless of each logo's own background color.
const VENDOR_LOGOS = [
  { name: "Digital Eye", label: "Film Crew", src: "/images/vendors/digital-eye.jpg" },
  { name: "Gayan Disanayaka", label: "Lens Masters", src: "/images/vendors/gayan-dissanayaka.jpg" },
  { name: "Seven Say", label: "The Stage", src: "/images/vendors/seven-say.jpg" },
  { name: "Awesome Flora", label: "Space Designers", src: "/images/vendors/awesome-flora.jpg" },
  { name: "Saloon Shenu / Anjali", label: "Bridal Glow", src: "/images/vendors/saloon-shenu.jpg" },
  { name: "Nova Events", label: "Day Architects", src: "/images/vendors/nova-events.jpg" },
  { name: "Saaro", label: "The Sound", src: "/images/vendors/saaro.jpg" },
  { name: "Shots", label: "Liquid Chefs", src: "/images/vendors/shots.jpg" },
  { name: "LIYO", label: "Groom Styling", src: "/images/vendors/liyo.jpg" },
]

// ── Countdown ──
function Countdown({ targetDate, primary, cream }: { targetDate: string; primary: string; cream: string }) {
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
            width: 56, height: 56, borderRadius: 14, margin: "0 auto 8px",
            background: cream, border: `1px solid ${primary}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 18px ${primary}30`,
          }}>
            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "1.35rem", color: primary, fontWeight: 700 }}>{v}</span>
          </div>
          <span style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>{l}</span>
        </div>
      ))}
    </div>
  )
}

// ── Sky Lanterns: the page's signature element. Paper lanterns with a warm
// glow inside, drifting slowly upward and swaying side to side — like the
// reference photo's floating lanterns rising into a black sky. ──
function SkyLantern({ size, primary, primaryLight, dark }: { size: number; primary: string; primaryLight: string; dark: string }) {
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 60 78" style={{ display: "block" }}>
      {/* Top cap */}
      <ellipse cx="30" cy="10" rx="14" ry="4" fill={primary} opacity="0.9" />
      {/* Body */}
      <path d="M16 10 Q12 40 22 64 L38 64 Q48 40 44 10 Z" fill={`url(#lantern-grad-${size})`} stroke={primary} strokeWidth="1" opacity="0.95" />
      <defs>
        <linearGradient id={`lantern-grad-${size}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={primaryLight} />
          <stop offset="60%" stopColor={primary} />
          <stop offset="100%" stopColor={dark} />
        </linearGradient>
      </defs>
      {/* Inner glow */}
      <ellipse cx="30" cy="38" rx="9" ry="14" fill={primaryLight} opacity="0.55" />
      {/* Bottom flame */}
      <ellipse cx="30" cy="62" rx="5" ry="7" fill="#fff6d8" opacity="0.85" />
      <ellipse cx="30" cy="64" rx="3" ry="4" fill="#ffd87a" />
    </svg>
  )
}

function SkyLanterns({ count = 9, primary, primaryLight, dark }: { count?: number; primary: string; primaryLight: string; dark: string }) {
  const [items, setItems] = useState<{ id: number; left: number; size: number; duration: number; delay: number; sway: number }[]>([])
  useEffect(() => {
    setItems(Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: 4 + Math.random() * 92,
      size: 22 + Math.random() * 20,
      duration: 14 + Math.random() * 10,
      delay: Math.random() * 12,
      sway: 12 + Math.random() * 16,
    })))
  }, [count])
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 1 }}>
      {items.map(p => (
        <div key={p.id} style={{
          position: "absolute", bottom: -120, left: `${p.left}%`,
          animation: `lantern-rise ${p.duration}s linear ${p.delay}s infinite, lantern-sway ${p.duration / 3}s ease-in-out ${p.delay}s infinite alternate`,
          opacity: 0.85, filter: `drop-shadow(0 0 10px ${primary}80)`,
          ['--sway' as any]: `${p.sway}px`,
        }}>
          <SkyLantern size={p.size} primary={primary} primaryLight={primaryLight} dark={dark} />
        </div>
      ))}
    </div>
  )
}

// ── A fixed decorative row of lanterns strung across the top of the cover,
// echoing the reference image's lantern cluster near the hero text. ──
function LanternCluster({ primary, primaryLight, dark }: { primary: string; primaryLight: string; dark: string }) {
  const cluster = [
    { size: 30, top: 8, side: "right" as const, offset: 4 },
    { size: 22, top: 30, side: "right" as const, offset: 14 },
    { size: 34, top: 4, side: "left" as const, offset: 2 },
    { size: 20, top: 38, side: "left" as const, offset: 0 },
  ]
  return (
    <>
      {cluster.map((l, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
          style={{
            position: "absolute", top: `${l.top}%`,
            [l.side]: `${l.offset}%`,
            filter: `drop-shadow(0 0 12px ${primary}99)`,
            zIndex: 3,
          }}>
          <SkyLantern size={l.size} primary={primary} primaryLight={primaryLight} dark={dark} />
        </motion.div>
      ))}
    </>
  )
}

// ── Ambient floating embers (small warm particles drifting up, like a fire pit) ──
function EmberField({ count = 16, primary, primaryLight }: { count?: number; primary: string; primaryLight: string }) {
  const [items, setItems] = useState<{ id: number; left: number; duration: number; delay: number; size: number; color: string }[]>([])
  useEffect(() => {
    setItems(Array.from({ length: count }).map((_, i) => ({
      id: i, left: Math.random() * 100, duration: 7 + Math.random() * 8, delay: Math.random() * 8,
      size: 2 + Math.random() * 3, color: i % 3 === 0 ? primaryLight : primary,
    })))
  }, [count, primary, primaryLight])
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 1 }}>
      {items.map(p => (
        <div key={p.id} style={{
          position: "absolute", bottom: -10, left: `${p.left}%`, width: p.size, height: p.size, borderRadius: "50%",
          background: p.color, opacity: 0.6, boxShadow: `0 0 6px ${p.color}`,
          animation: `ember-rise ${p.duration}s linear ${p.delay}s infinite`,
        }} />
      ))}
    </div>
  )
}

// ── Music Player ──
function MusicPlayerUI({ title, artist, audioRef, primary, primaryLight, cream }: { title: string; artist: string; audioRef: React.RefObject<HTMLAudioElement | null>; primary: string; primaryLight: string; cream: string }) {
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
    <div style={{ display: "flex", alignItems: "center", gap: 14, background: cream, borderRadius: 14, padding: 16, border: `1px solid ${primary}26` }}>
      <div style={{ width: 44, height: 44, borderRadius: playing ? "50%" : 10, background: `linear-gradient(135deg,${primary},${primaryLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, animation: playing ? "spin 4s linear infinite" : "none" }}>🎶</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{title}</div>
        <div style={{ fontSize: 11, color: `${primary}99`, marginTop: 2 }}>{artist}</div>
        <div style={{ height: 3, background: `${primary}1a`, borderRadius: 100, marginTop: 8 }}>
          <div style={{ height: "100%", width: `${prog}%`, background: `linear-gradient(to right,${primary},${primaryLight})`, borderRadius: 100, transition: "width 0.3s" }} />
        </div>
      </div>
      <button onClick={toggle} style={{ width: 38, height: 38, borderRadius: "50%", background: primary, border: "none", color: "#171c33", cursor: "pointer", fontSize: 13, flexShrink: 0, fontWeight: 700 }}>
        {playing ? "⏸" : "▶"}
      </button>
    </div>
  )
}

// ── RSVP — the brief's exact 4-step flow:
// Participation → Guest Count (dropdown, 1 or 2) → Drinks (multi-select) → Accommodation
// Accommodation "Needed" routes to a guest-house popup instead of the thank-you card. ──
type Drink = 'Hard Liquor' | 'Wine' | 'Beer' | 'Non-Alcoholic'

function RSVP({
  coupleId, primary, primaryLight, dark, cream,
}: { coupleId: string; primary: string; primaryLight: string; dark: string; cream: string }) {
  const [name, setName] = useState("")
  const [guestCount, setGuestCount] = useState<1 | 2>(2)
  const [drinks, setDrinks] = useState<Drink[]>([])
  const [accommodation, setAccommodation] = useState<'needed' | 'not_needed'>('not_needed')
  const [step, setStep] = useState<"form" | "count" | "drinks" | "accommodation" | "guesthouses" | "done">("form")
  const [finalResponse, setFinalResponse] = useState<"yes" | "no">("yes")
  const [saving, setSaving] = useState(false)

  const toggleDrink = (d: Drink) => {
    setDrinks(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  const save = async (response: "yes" | "no") => {
    setSaving(true)
    const { error } = await supabase.from('rsvps').insert([{
      couple_id: coupleId,
      guest_name: name.trim(),
      response,
      drinking: response === 'yes' ? drinks.join(',') : null,
      guest_count: response === 'yes' ? guestCount : 1,
      accommodation: response === 'yes' ? accommodation : null,
    }])
    setSaving(false)
    if (!error) {
      setFinalResponse(response)
      setStep(response === 'yes' && accommodation === 'needed' ? 'guesthouses' : 'done')
    }
  }

  const handleParticipationYes = () => { if (name.trim()) setStep("count") }
  const handleParticipationNo = () => { if (name.trim()) save("no") }
  const handleAccommodationChoice = (choice: 'needed' | 'not_needed') => {
    setAccommodation(choice)
    // Save immediately with the chosen value — avoids a stale-state save
    // if we relied on the state setter above completing first.
    setSaving(true)
    supabase.from('rsvps').insert([{
      couple_id: coupleId,
      guest_name: name.trim(),
      response: 'yes',
      drinking: drinks.join(','),
      guest_count: guestCount,
      accommodation: choice,
    }]).then(({ error }) => {
      setSaving(false)
      if (!error) {
        setFinalResponse('yes')
        setStep(choice === 'needed' ? 'guesthouses' : 'done')
      }
    })
  }

  const radioRow = (label: string, selected: boolean, onClick: () => void) => (
    <button type="button" onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "14px 16px",
      borderRadius: 12, border: `1.5px solid ${selected ? primary : "rgba(255,255,255,0.12)"}`,
      background: selected ? `${primary}1a` : "transparent", cursor: "pointer", textAlign: "left",
      fontFamily: "'Inter',sans-serif", marginBottom: 10,
    }}>
      <span style={{
        width: 20, height: 20, borderRadius: "50%", border: `2px solid ${selected ? primary : "rgba(255,255,255,0.3)"}`,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {selected && <span style={{ width: 10, height: 10, borderRadius: "50%", background: primary }} />}
      </span>
      <span style={{ fontSize: 14, color: "#fff", fontWeight: selected ? 600 : 400 }}>{label}</span>
    </button>
  )

  const checkboxRow = (label: string, drink: Drink) => {
    const selected = drinks.includes(drink)
    return (
      <button type="button" onClick={() => toggleDrink(drink)} style={{
        display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "14px 16px",
        borderRadius: 12, border: `1.5px solid ${selected ? primaryLight : "rgba(255,255,255,0.12)"}`,
        background: selected ? `${primaryLight}1a` : "transparent", cursor: "pointer", textAlign: "left",
        fontFamily: "'Inter',sans-serif", marginBottom: 10,
      }}>
        <span style={{
          width: 20, height: 20, borderRadius: 6, border: `2px solid ${selected ? primaryLight : "rgba(255,255,255,0.3)"}`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: selected ? primaryLight : "transparent",
        }}>
          {selected && <span style={{ color: dark, fontSize: 12, fontWeight: 700 }}>✓</span>}
        </span>
        <span style={{ fontSize: 14, color: "#fff", fontWeight: selected ? 600 : 400 }}>{label}</span>
      </button>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "13px 16px", borderRadius: 10, border: `1px solid ${primary}33`,
    background: dark, color: "#fff", fontSize: 14, outline: "none", marginBottom: 12, fontFamily: "'Inter',sans-serif",
  }

  return (
    <div style={{ background: cream, borderRadius: 20, padding: 24, border: `1px solid ${primary}26` }}>

      {step === "form" && (
        <>
          <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: primary, marginBottom: 8, fontWeight: 700, textAlign: "center" }}>RSVP</div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "1.5rem", color: "#fff", marginBottom: 16, textAlign: "center", fontWeight: 700 }}>
            Will you share the magic under the stars?
          </div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" style={inputStyle} />
          <div style={{ display: "grid", gap: 10 }}>
            {radioRow("Count Me In!", false, handleParticipationYes)}
            {radioRow("Toasting From Afar", false, handleParticipationNo)}
          </div>
        </>
      )}

      {step === "count" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ fontSize: 13, color: "#fff", fontWeight: 600, marginBottom: 14, textAlign: "center" }}>How many cushions should we reserve?</div>
          <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
            {radioRow("2 — bringing a plus one", guestCount === 2, () => setGuestCount(2))}
            {radioRow("1 — flying solo", guestCount === 1, () => setGuestCount(1))}
          </div>
          <button onClick={() => setStep("drinks")} style={{
            width: "100%", padding: 13, borderRadius: 10, background: `linear-gradient(135deg,${primary},${primaryLight})`,
            color: dark, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
          }}>
            Continue →
          </button>
        </motion.div>
      )}

      {step === "drinks" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ fontSize: 13, color: "#fff", fontWeight: 600, marginBottom: 14, textAlign: "center" }}>What's your evening pour?</div>
          <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
            {checkboxRow("Hard Liquor", "Hard Liquor")}
            {checkboxRow("Wine", "Wine")}
            {checkboxRow("Beer", "Beer")}
            {checkboxRow("Non-Alcoholic", "Non-Alcoholic")}
          </div>
          <button onClick={() => setStep("accommodation")} style={{
            width: "100%", padding: 13, borderRadius: 10, background: `linear-gradient(135deg,${primary},${primaryLight})`,
            color: dark, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
          }}>
            Continue →
          </button>
        </motion.div>
      )}

      {step === "accommodation" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ fontSize: 13, color: "#fff", fontWeight: 600, marginBottom: 14, textAlign: "center" }}>Accommodation for the night?</div>
          <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
            {radioRow("Accommodation needed", accommodation === 'needed', () => setAccommodation('needed'))}
            {radioRow("Accommodation NOT needed", accommodation === 'not_needed', () => setAccommodation('not_needed'))}
          </div>
          <button onClick={() => handleAccommodationChoice(accommodation)} disabled={saving} style={{
            width: "100%", padding: 13, borderRadius: 10, background: `linear-gradient(135deg,${primary},${primaryLight})`,
            color: dark, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, opacity: saving ? 0.6 : 1,
          }}>
            {saving ? "..." : "Confirm My Spot"}
          </button>
        </motion.div>
      )}

      {step === "guesthouses" && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
          <div style={{ fontSize: 28, marginBottom: 8, textAlign: "center" }}>🏡</div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "1.2rem", color: primary, marginBottom: 6, textAlign: "center", fontWeight: 700 }}>
            Nearby Guest Houses
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 16, textAlign: "center" }}>
            We've got you covered — here's where to crash after the party.
          </div>
          <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
            {GUEST_HOUSES.map(g => (
              <div key={g.name} style={{ padding: "12px 14px", borderRadius: 10, background: `${primary}14`, border: `1px solid ${primary}33` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{g.name}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{g.distance} · {g.contact}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: primaryLight, textAlign: "center", fontWeight: 600 }}>See you there, {name}! 🎉</div>
        </motion.div>
      )}

      {step === "done" && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center" }}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>{finalResponse === "yes" ? "🎉" : "🥂"}</div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "1.2rem", color: primary, marginBottom: 4, fontWeight: 700 }}>
            {finalResponse === "yes" ? `Spot confirmed, ${name}!` : `We'll toast to you, ${name}.`}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
            {finalResponse === "yes" ? "Bring your dancing shoes. We'll see you under the lights." : "Thanks for letting us know — you'll be missed."}
          </div>
        </motion.div>
      )}
    </div>
  )
}

const sectionCard = (cream: string, primary: string): React.CSSProperties => ({
  background: cream, margin: "0 16px 16px", borderRadius: 20, padding: "1.6rem", border: `1px solid ${primary}1f`,
})

export default function TwilightPicnicTemplate({ couple }: { couple: Couple }) {
  const [opened, setOpened] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const PRIMARY = couple.custom_colors?.primary || DEFAULT_PALETTE.primary
  const PRIMARY_LIGHT = couple.custom_colors?.primaryLight || DEFAULT_PALETTE.primaryLight
  const DARK = couple.custom_colors?.dark || DEFAULT_PALETTE.dark
  const CREAM = couple.custom_colors?.cream || DEFAULT_PALETTE.cream

  useEffect(() => {
    const songUrl = couple.song_url || DEFAULT_SONG_URL
    const audio = new Audio(songUrl)
    audio.loop = true
    audio.volume = 0.5
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
    date: couple.wedding_date,
    dateDisplay: new Date(couple.wedding_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase(),
    venue: couple.venue || '',
    couplePhoto: couple.couple_photo || DEFAULT_PHOTO,
    song: couple.song_title || DEFAULT_SONG_TITLE,
    artist: couple.song_artist || DEFAULT_SONG_ARTIST,
  }

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", minHeight: "100vh", background: DARK }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:ital,wght@1,500;1,600;1,700&family=Cormorant+Garamond:wght@500;600&family=Space+Grotesk:wght@500;700&family=Inter:wght@300;400;500;600&display=swap');
        @keyframes spin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
        @keyframes ember-rise {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          15% { opacity: 0.6; }
          85% { opacity: 0.6; }
          100% { transform: translateY(-100vh) translateX(20px); opacity: 0; }
        }
        @keyframes lantern-rise {
          0% { transform: translateY(0); opacity: 0; }
          8% { opacity: 0.85; }
          92% { opacity: 0.85; }
          100% { transform: translateY(-115vh); opacity: 0; }
        }
        @keyframes lantern-sway {
          0% { margin-left: calc(var(--sway) * -1); }
          100% { margin-left: var(--sway); }
        }
        input::placeholder { color: rgba(255,255,255,0.3); }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto", background: DARK, boxShadow: "0 0 100px rgba(0,0,0,0.5)", position: "relative", overflow: "hidden" }}>

        {/* ══ COVER ══ */}
        <AnimatePresence>
          {!opened && (
            <motion.div key="cover" exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
              style={{
                minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                position: "relative", overflow: "hidden", background: DARK,
              }}>

              {/* Couple photo, dimmed and blended into the black so it reads as
                  texture behind the text rather than a competing focal point */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={W.couplePhoto} alt=""
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 15%", opacity: 0.35, filter: "saturate(0.6) brightness(0.55)" }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none" }} />
              <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 80% 60% at 50% 30%, transparent 0%, ${DARK} 75%)` }} />
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, ${DARK} 0%, transparent 25%, transparent 70%, ${DARK} 100%)` }} />

              <SkyLanterns count={9} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} />
              <LanternCluster primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} />

              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
                style={{ position: "relative", zIndex: 4, textAlign: "center", padding: "0 1.8rem", maxWidth: 420 }}>

                <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "1.9rem", color: PRIMARY_LIGHT, marginBottom: "0.4rem", textShadow: `0 0 20px ${PRIMARY}66` }}>
                  You are invited
                </div>

                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(1.9rem,7vw,2.6rem)", color: PRIMARY_LIGHT, letterSpacing: "0.08em", fontWeight: 600, lineHeight: 1.15, textTransform: "uppercase" }}>
                  A Magical Night
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", letterSpacing: "0.05em", marginTop: 8, marginBottom: "1.8rem" }}>
                  With fairy lights and low seating
                </div>

                <div style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontWeight: 600, fontSize: "clamp(2.8rem,10vw,4rem)", color: "#fff", lineHeight: 1, textShadow: `0 0 30px ${PRIMARY}40` }}>
                  {W.bride}
                </div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: "1.9rem", color: PRIMARY, margin: "0.1rem 0" }}>&amp;</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontWeight: 600, fontSize: "clamp(2.8rem,10vw,4rem)", color: "#fff", lineHeight: 1, marginBottom: "1.6rem", textShadow: `0 0 30px ${PRIMARY}40` }}>
                  {W.groom}
                </div>

                <div style={{ fontSize: 12, letterSpacing: "0.1em", color: "rgba(255,255,255,0.6)", marginBottom: "2rem" }}>
                  {W.dateDisplay}
                </div>

                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={handleEnter}
                  style={{
                    padding: "15px 36px", borderRadius: 100, border: `1px solid ${PRIMARY}80`,
                    background: `linear-gradient(135deg,${PRIMARY}33,${PRIMARY_LIGHT}1f)`, color: PRIMARY_LIGHT,
                    fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer",
                    fontFamily: "'Inter',sans-serif", fontWeight: 600, boxShadow: `0 8px 30px ${PRIMARY}33`,
                  }}>
                  RSVP &amp; Light a Lantern
                </motion.button>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 14, letterSpacing: "0.05em" }}>♪ with music</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ FULL INVITATION ══ */}
        {opened && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
            <EmberField count={10} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} />

            {/* Hero banner */}
            <div style={{ position: "relative", height: 420, overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={W.couplePhoto} alt={`${W.bride} and ${W.groom}`}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 15%", filter: "saturate(0.7) brightness(0.65)" }}
                onError={e => { (e.currentTarget as HTMLImageElement).src = DEFAULT_PHOTO }} />
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, rgba(10,8,6,0.25) 0%, ${DARK} 100%)` }} />
              <LanternCluster primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 1.5rem 28px", textAlign: "center", zIndex: 4 }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontWeight: 600, fontSize: "clamp(2.1rem,7vw,2.9rem)", color: "#fff", textShadow: `0 0 24px ${PRIMARY}55, 0 2px 20px rgba(0,0,0,0.6)` }}>
                  {W.bride}<span style={{ color: PRIMARY_LIGHT }}> &amp; </span>{W.groom}
                </div>
                <div style={{ fontSize: 10, letterSpacing: "0.25em", color: "rgba(255,255,255,0.6)", marginTop: 6 }}>
                  A MAGICAL NIGHT · {W.dateDisplay}
                </div>
              </div>
            </div>

            {/* Energetic description */}
            <motion.div style={sectionCard(CREAM, PRIMARY)} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.9, textAlign: "center", fontStyle: "italic" }}>
                "Tradition out, energy up. Kick back under the fairy lights with cozy low seating, flowing drinks, and loud music. No formalities—just pure celebration. Come ready to chill, dance, and party until dawn!"
              </div>
            </motion.div>

            {/* Venue */}
            {couple.maps_url && (
              <motion.div style={sectionCard(CREAM, PRIMARY)} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: PRIMARY, fontWeight: 700, textAlign: "center", marginBottom: 14 }}>
                  Where the magic happens
                </div>
                <a href={couple.maps_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 46, height: 46, borderRadius: "50%", background: `linear-gradient(135deg,${PRIMARY},${PRIMARY_LIGHT})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📍</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{W.venue}</div>
                      <div style={{ fontSize: 11, color: PRIMARY, fontWeight: 600, marginTop: 2 }}>Tap to view on Google Maps →</div>
                    </div>
                  </div>
                </a>
              </motion.div>
            )}

            {/* RSVP */}
            <div style={{ margin: "0 16px 16px" }}>
              <RSVP coupleId={couple.id} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} cream={CREAM} />
            </div>

            {/* Countdown */}
            <motion.div style={sectionCard(CREAM, PRIMARY)} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "1rem", color: "#fff", fontWeight: 700, marginBottom: 14, textAlign: "center" }}>Countdown to the Magical Moment</div>
              <Countdown targetDate={W.date} primary={PRIMARY} cream={DARK} />
            </motion.div>

            {/* Music */}
            <div style={{ margin: "0 16px 16px" }}>
              <MusicPlayerUI title={W.song} artist={W.artist} audioRef={audioRef} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} cream={CREAM} />
            </div>

            {/* Vendor logos footer — real partner artwork, each labelled with
                the partner name above the logo. The white card behind each
                logo is kept minimal (no visible white border) so the tiles
                sit quietly against the page's black background. */}
            <div style={{ padding: "1.5rem 1.2rem 2.5rem", textAlign: "center" }}>
              <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 16 }}>Our Wedding Partners</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                {VENDOR_LOGOS.map(v => (
                  <div key={v.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase", color: PRIMARY_LIGHT, fontWeight: 700, lineHeight: 1.3, minHeight: 20 }}>
                      {v.label}
                    </div>
                    <div title={v.name} style={{
                      width: "100%", aspectRatio: "1/1", borderRadius: 12, background: CREAM,
                      overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: 10,
                      boxShadow: `0 4px 14px ${PRIMARY}1a`, border: `1px solid ${PRIMARY}1f`,
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={v.src} alt={v.name}
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                        onError={e => (e.currentTarget.style.display = "none")} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </motion.div>
        )}
      </div>
    </div>
  )
}