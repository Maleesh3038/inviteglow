"use client"
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, Couple } from '@/lib/supabase'

const DEFAULT_PHOTO = "/images/hero-twilight.png"
const DEFAULT_SONG_URL = "/audio/calm-wedding.mp3"
const DEFAULT_SONG_TITLE = "Twilight Playlist"
const DEFAULT_SONG_ARTIST = "InviteGlow"

// ── Default palette — overridden by couple.custom_colors ──
// primary: warm amber fairy-light glow · primaryLight: dusty rose ember
// dark: deep twilight indigo (the page's base) · cream: a lifted indigo for cards
const DEFAULT_PALETTE = {
  primary: "#f0a868",
  primaryLight: "#e0849a",
  dark: "#171c33",
  cream: "#232a4d",
  muted: "rgba(255,255,255,0.45)",
}

// Guest houses shown when a guest requests accommodation. Static for now —
// swap for real partner data whenever the couple provides it.
const GUEST_HOUSES = [
  { name: "Seven Say Boutique Stay", distance: "0.4 km from venue", phone: "077 123 4567" },
  { name: "Veyangoda Garden Rooms", distance: "1.1 km from venue", phone: "077 234 5678" },
  { name: "The Nightjar Homestay", distance: "1.8 km from venue", phone: "077 345 6789" },
]

// Vendor logos — placeholder tiles until real artwork is supplied. No text
// labels render on the live page per the brief; the name only shows in the
// dashed placeholder state so whoever wires in real logos knows what goes where.
const VENDOR_PLACEHOLDERS = [
  "Seven Say", "Nova Events", "Gayan Disanayaka", "Digital Eye",
  "Saloon Shenu / Anjali", "Saaro", "Awesome Flora",
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

// ── Fairy-light string: the page's signature element. A loose hand-drawn
// curve with glowing bulbs along it, gently twinkling — strung across the
// hero like real string lights at a backyard party. ──
function FairyLightString({ primary, primaryLight }: { primary: string; primaryLight: string }) {
  const bulbs = [
    { x: 20, y: 38 }, { x: 75, y: 18 }, { x: 135, y: 44 }, { x: 195, y: 14 },
    { x: 250, y: 40 }, { x: 305, y: 16 }, { x: 360, y: 42 },
  ]
  const path = `M 0 30 Q 40 70 75 18 T 195 14 Q 230 60 250 40 T 360 42 Q 380 50 400 30`

  return (
    <svg viewBox="0 0 400 80" style={{ width: "100%", display: "block", overflow: "visible" }} preserveAspectRatio="none">
      <path d={path} stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" fill="none" />
      {bulbs.map((b, i) => (
        <g key={i}>
          <motion.circle
            cx={b.x} cy={b.y} r="9"
            fill={i % 2 === 0 ? primary : primaryLight}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.4 + (i % 3) * 0.4, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
            style={{ filter: `drop-shadow(0 0 6px ${i % 2 === 0 ? primary : primaryLight})` }}
          />
          <circle cx={b.x} cy={b.y - 9} r="2" fill="rgba(255,255,255,0.5)" />
        </g>
      ))}
    </svg>
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
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{g.distance} · {g.phone}</div>
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

// ── Disclaimers strip ──
function Disclaimers({ primary, cream }: { primary: string; cream: string }) {
  return (
    <div style={{ background: cream, borderRadius: 16, padding: "18px 20px", border: `1px dashed ${primary}40` }}>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.8, textAlign: "center" }}>
        ✦ To allow guests to fully unwind, this remains an <strong style={{ color: "#fff" }}>adults-only sanctuary</strong>. No children allowed.
      </div>
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
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@300;400;500;600&display=swap');
        @keyframes spin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
        @keyframes ember-rise {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          15% { opacity: 0.6; }
          85% { opacity: 0.6; }
          100% { transform: translateY(-100vh) translateX(20px); opacity: 0; }
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
                position: "relative", overflow: "hidden",
                background: `radial-gradient(ellipse 90% 70% at 50% 0%, ${CREAM} 0%, ${DARK} 70%)`,
              }}>

              <EmberField count={14} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} />

              <div style={{ position: "absolute", top: 28, left: 0, right: 0, padding: "0 24px" }}>
                <FairyLightString primary={PRIMARY} primaryLight={PRIMARY_LIGHT} />
              </div>

              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
                style={{ position: "relative", zIndex: 4, textAlign: "center", padding: "0 1.8rem", maxWidth: 400 }}>

                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 100, background: `${PRIMARY}1f`, border: `1px solid ${PRIMARY}4d`, marginBottom: "1.4rem" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: PRIMARY }} />
                  <span style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: PRIMARY, fontWeight: 700 }}>After-Wedding Twilight Picnic</span>
                </div>

                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "clamp(2.6rem,9vw,3.6rem)", color: "#fff", fontWeight: 700, lineHeight: 1.05 }}>
                  {W.bride}
                </div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "1.6rem", color: PRIMARY, margin: "2px 0", fontWeight: 700 }}>&amp;</div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "clamp(2.6rem,9vw,3.6rem)", color: "#fff", fontWeight: 700, lineHeight: 1.05, marginBottom: "1.2rem" }}>
                  {W.groom}
                </div>

                <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "rgba(255,255,255,0.5)", marginBottom: "1.6rem" }}>
                  {W.dateDisplay}
                </div>

                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={handleEnter}
                  style={{
                    padding: "15px 34px", borderRadius: 100, border: "none",
                    background: `linear-gradient(135deg,${PRIMARY},${PRIMARY_LIGHT})`, color: DARK,
                    fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer",
                    fontFamily: "'Inter',sans-serif", fontWeight: 700, boxShadow: `0 8px 30px ${PRIMARY}55`,
                  }}>
                  Light the Lanterns →
                </motion.button>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 14, letterSpacing: "0.05em" }}>🎵 with music</div>
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
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.9) brightness(0.85)" }}
                onError={e => { (e.currentTarget as HTMLImageElement).src = DEFAULT_PHOTO }} />
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, rgba(23,28,51,0.2) 0%, ${DARK} 100%)` }} />
              <div style={{ position: "absolute", top: 16, left: 0, right: 0, padding: "0 20px", zIndex: 3 }}>
                <FairyLightString primary={PRIMARY} primaryLight={PRIMARY_LIGHT} />
              </div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 1.5rem 28px", textAlign: "center", zIndex: 4 }}>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "clamp(1.8rem,6.5vw,2.6rem)", color: "#fff", fontWeight: 700, textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>
                  {W.bride}<span style={{ color: PRIMARY }}> &amp; </span>{W.groom}
                </div>
                <div style={{ fontSize: 10, letterSpacing: "0.25em", color: "rgba(255,255,255,0.6)", marginTop: 6 }}>
                  AFTER-WEDDING TWILIGHT PICNIC · {W.dateDisplay}
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

            {/* Disclaimers */}
            <div style={{ margin: "0 16px 16px" }}>
              <Disclaimers primary={PRIMARY} cream={CREAM} />
            </div>

            {/* Countdown */}
            <motion.div style={sectionCard(CREAM, PRIMARY)} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "1rem", color: "#fff", fontWeight: 700, marginBottom: 14, textAlign: "center" }}>Countdown to the Picnic</div>
              <Countdown targetDate={W.date} primary={PRIMARY} cream={DARK} />
            </motion.div>

            {/* Music */}
            <div style={{ margin: "0 16px 16px" }}>
              <MusicPlayerUI title={W.song} artist={W.artist} audioRef={audioRef} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} cream={CREAM} />
            </div>

            {/* Vendor logos footer — logos only, no text labels on the live page.
                Placeholder tiles show the partner name in dashed boxes until
                real artwork replaces them. */}
            <div style={{ padding: "1.5rem 1.2rem 2.5rem", textAlign: "center" }}>
              <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 16 }}>With thanks to our partners</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                {VENDOR_PLACEHOLDERS.map(name => (
                  <div key={name} title={name} style={{
                    aspectRatio: "1/1", borderRadius: 12, border: `1px dashed ${PRIMARY}40`,
                    display: "flex", alignItems: "center", justifyContent: "center", padding: 6,
                  }}>
                    <span style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", textAlign: "center", lineHeight: 1.3 }}>{name}</span>
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