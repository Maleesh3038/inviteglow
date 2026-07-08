"use client"
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, Couple } from '@/lib/supabase'

const DEFAULT_PHOTO = "/images/hero-traditional-ceylon.png"
const DEFAULT_SONG_URL = "/audio/calm-wedding.mp3"
const DEFAULT_SONG_TITLE = "Calm Wedding Theme"
const DEFAULT_SONG_ARTIST = "InviteGlow"

// ── Normalize Maps URLs — maps.app.goo.gl short links open in browser ──
function normalizeMapsUrl(url: string): string {
  if (!url) return '#'
  if (url.includes('maps.app.goo.gl') || url.includes('goo.gl/maps')) {
    return `https://www.google.com/maps?q=${encodeURIComponent(url)}`
  }
  return url
}

// ── Default palette — overridden by couple.custom_colors ──
// primary: deep Kandyan green · primaryLight: warm gold accent
// dark: near-black green (text) · cream: ivory/parchment background
const DEFAULT_PALETTE = {
  primary: "#2f4a35",
  primaryLight: "#c9a227",
  dark: "#1f2e22",
  cream: "#fbf6e9",
  muted: "#8a8270",
}

// ── Floating areca-flower / leaf accents — the page's signature ambient
// element. Distinct from the other templates' birds/bubbles/petals: small
// gold botanical glyphs (puwakmal-style flower + leaf) drifting slowly,
// echoing traditional Kandyan motifs rather than tropical/beach imagery. ──
function FloatingMotifs({ count = 8 }: { count?: number }) {
  const motifs = ['❀', '🌿', '✦']
  const [items, setItems] = useState<{ id: number; left: number; emoji: string; duration: number; delay: number; size: number }[]>([])
  useEffect(() => {
    setItems(Array.from({ length: count }).map((_, i) => ({
      id: i, left: Math.random() * 100, emoji: motifs[Math.floor(Math.random() * motifs.length)],
      duration: 11 + Math.random() * 9, delay: Math.random() * 10, size: 12 + Math.random() * 10,
    })))
  }, [count])
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 1 }}>
      {items.map(p => (
        <div key={p.id} style={{ position: "absolute", top: -40, left: `${p.left}%`, fontSize: p.size, opacity: 0.45, color: "#c9a227", animation: `motif-drift ${p.duration}s linear ${p.delay}s infinite` }}>
          {p.emoji}
        </div>
      ))}
    </div>
  )
}

// ── Corner vine/leaf decorative frame — drawn as a thin gold SVG border
// flourish, used on cards. This template's signature motif, echoing
// traditional Kandyan border line-art rather than beach or garden imagery. ──
function VineCorner({ color, flip = false }: { color: string; flip?: boolean }) {
  return (
    <svg width="46" height="46" viewBox="0 0 46 46" style={{ position: "absolute", top: 6, [flip ? "right" : "left"]: 6, transform: flip ? "scaleX(-1)" : undefined, opacity: 0.6 }}>
      <path d="M2 2 Q2 20 14 24 Q26 28 24 42" stroke={color} strokeWidth="1.2" fill="none" />
      <circle cx="24" cy="42" r="2" fill={color} />
      <circle cx="14" cy="24" r="1.6" fill={color} />
      <path d="M2 2 Q20 2 24 14 Q28 26 42 24" stroke={color} strokeWidth="1.2" fill="none" />
      <circle cx="42" cy="24" r="2" fill={color} />
    </svg>
  )
}

// ── Ornate gold arch frame — a single connected border (not just corner
// flourishes) used on the family invitation card, echoing the carved
// floral-arch motif from Kandyan wedding cards. Drawn as a full rounded
// rectangle outline with small leaf/scroll flourishes at each corner and
// top-center, so the card reads as "framed" rather than just bordered. ──
function OrnateFrame({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
      {/* Main border */}
      <rect x="8" y="8" width="384" height="284" rx="16" fill="none" stroke={color} strokeWidth="1.4" opacity="0.85" />
      <rect x="14" y="14" width="372" height="272" rx="13" fill="none" stroke={color} strokeWidth="0.6" opacity="0.5" />

      {/* Top-center crest flourish */}
      <g opacity="0.9">
        <path d="M178 8 Q188 0 200 8 Q212 0 222 8" stroke={color} strokeWidth="1.3" fill="none" />
        <circle cx="200" cy="4" r="2.4" fill={color} />
        <path d="M192 8 Q196 14 200 8 Q204 14 208 8" stroke={color} strokeWidth="1" fill="none" />
      </g>

      {/* Corner scroll flourishes (leaf curls) */}
      {[[8, 8, 1, 1], [392, 8, -1, 1], [8, 292, 1, -1], [392, 292, -1, -1]].map(([cx, cy, sx, sy], i) => (
        <g key={i} transform={`translate(${cx},${cy}) scale(${sx},${sy})`} opacity="0.85">
          <path d="M0 18 Q0 4 14 2 Q26 0 28 14" stroke={color} strokeWidth="1.2" fill="none" />
          <circle cx="28" cy="14" r="1.8" fill={color} />
          <circle cx="14" cy="2" r="1.4" fill={color} />
        </g>
      ))}
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
    <div style={{ display: "flex", gap: 8, maxWidth: 380, margin: "0 auto" }}>
      {[["Days", t.d], ["Hours", t.h], ["Mins", t.m], ["Secs", t.s]].map(([l, v]) => (
        <div key={l} style={{ flex: 1, textAlign: "center", padding: "4px 2px" }}>
          <div style={{ borderRadius: 10, background: `linear-gradient(145deg,${primaryLight}33,${primary}1a)`, border: `1.5px solid ${primaryLight}88`, padding: "10px 4px" }}>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.5rem", color: dark, fontWeight: 600 }}>{v}</span>
          </div>
          <span style={{ fontSize: 10, color: `${dark}99`, display: "block", marginTop: 6 }}>{l}</span>
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
    <div style={{ background: `${primaryLight}1f`, borderRadius: 14, padding: "14px 18px" }}>
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

// ── RSVP (standard flow, English form fields per the requested mix) ──
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

  return (
    <div style={{ background: `linear-gradient(135deg,${primaryLight}22,${cream})`, padding: "2.5rem 1.5rem", textAlign: "center" }}>
      <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: primary, marginBottom: 6 }}>Kindly Confirm Your Attendance</div>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.6rem", color: dark, marginBottom: 6 }}>Kindly RSVP</div>
      <div style={{ fontSize: 12, color: muted, marginBottom: 20 }}>Please enter your name and let us know — we'd love to celebrate with you!</div>
      <div style={{ background: "#fff", borderRadius: 16, padding: "1.5rem", maxWidth: 380, margin: "0 auto", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>

        {step === "form" && (
          <>
            <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: `${primary}99`, marginBottom: 8, textAlign: "left" }}>Your Name</div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name..."
              style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${primaryLight}66`, background: cream, color: dark, fontSize: 14, outline: "none", fontFamily: "'Inter',sans-serif", marginBottom: 10, display: "block" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={handleAccept} disabled={saving} style={{ padding: 13, borderRadius: 10, background: `linear-gradient(135deg,${primary},${primary}cc)`, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "'Inter',sans-serif", opacity: saving ? 0.6 : 1 }}>
                {saving ? "..." : "✓ Joyfully Accept"}
              </button>
              <button onClick={handleDecline} disabled={saving} style={{ padding: 13, borderRadius: 10, background: `${primaryLight}22`, color: primary, border: "none", cursor: "pointer", fontSize: 13, fontFamily: "'Inter',sans-serif", opacity: saving ? 0.6 : 1 }}>
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
              <button onClick={() => setGuestCount(c => Math.max(1, c - 1))}
                style={{ width: 38, height: 38, borderRadius: "50%", background: `${primaryLight}22`, color: primary, border: "none", cursor: "pointer", fontSize: 18, fontWeight: 600 }}>
                −
              </button>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "2rem", color: dark, fontWeight: 600, minWidth: 50, textAlign: "center" }}>
                {guestCount}
              </div>
              <button onClick={() => setGuestCount(c => Math.min(20, c + 1))}
                style={{ width: 38, height: 38, borderRadius: "50%", background: `${primaryLight}22`, color: primary, border: "none", cursor: "pointer", fontSize: 18, fontWeight: 600 }}>
                +
              </button>
            </div>
            <button onClick={handleCountNext} disabled={saving} style={{
              width: "100%", padding: 13, borderRadius: 10, background: `linear-gradient(135deg,${primary},${primary}cc)`,
              color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "'Inter',sans-serif", opacity: saving ? 0.6 : 1,
            }}>
              {saving ? "..." : "Continue →"}
            </button>
          </motion.div>
        )}

        {step === "drinking" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ fontSize: 12, color: muted, marginBottom: 16 }}>One last quick question before you're confirmed</div>
            <div style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: `${primary}99`, marginBottom: 10, textAlign: "left" }}>Will you be having alcohol?</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={() => save("yes", "yes", guestCount)} disabled={saving}
                style={{ padding: 13, borderRadius: 10, background: `${primaryLight}22`, color: primary, border: `1.5px solid ${primaryLight}88`, cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "'Inter',sans-serif", opacity: saving ? 0.6 : 1 }}>
                🥃 Yes, please
              </button>
              <button onClick={() => save("yes", "no", guestCount)} disabled={saving}
                style={{ padding: 13, borderRadius: 10, background: `${primaryLight}22`, color: primary, border: `1.5px solid ${primaryLight}88`, cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "'Inter',sans-serif", opacity: saving ? 0.6 : 1 }}>
                🥤 No, thanks
              </button>
            </div>
          </motion.div>
        )}

        {step === "done" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: "1rem 0", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{finalResponse === "yes" ? "🎉" : "🙏"}</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.3rem", fontStyle: "italic", color: primary, marginBottom: 4 }}>
              {finalResponse === "yes" ? `See you there, ${name}!` : `We'll miss you, ${name}.`}
            </div>
            <div style={{ fontSize: 12, color: muted }}>
              {finalResponse === "yes"
                ? (guestCount > 1 ? `We've noted your party of ${guestCount} — can't wait to celebrate with you all!` : "We can't wait to celebrate with you!")
                : "Thank you for letting us know."}
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
    setRes(found ? `❀ You are seated at ${seats[found]}` : "Name not found. Please contact the couple.")
  }
  return (
    <>
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && search()}
          placeholder="Enter your name..."
          style={{ flex: 1, padding: "12px 16px", borderRadius: 10, border: `1px solid ${primary}33`, background: cream, color: dark, fontSize: 14, outline: "none", fontFamily: "'Inter',sans-serif" }} />
        <button onClick={search} style={{ padding: "12px 18px", borderRadius: 10, background: primary, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "'Inter',sans-serif" }}>Search</button>
      </div>
      {res && <div style={{ marginTop: 12, fontSize: 14, color: res.startsWith("❀") ? primary : muted, fontWeight: res.startsWith("❀") ? 500 : 400 }}>{res}</div>}
    </>
  )
}

const cardStyle = (): React.CSSProperties => ({ background: "#fff", margin: "0 16px 16px", borderRadius: 18, padding: "1.8rem", boxShadow: "0 2px 20px rgba(0,0,0,0.07)", position: "relative", overflow: "hidden" })
const pretitleSinhala = (primary: string): React.CSSProperties => ({ fontSize: 13, color: primary, textAlign: "center", marginBottom: 4, fontWeight: 600 })
const pretitleStyle = (primary: string): React.CSSProperties => ({ fontSize: 9, letterSpacing: "0.35em", textTransform: "uppercase", color: `${primary}aa`, textAlign: "center", marginBottom: 8 })
const titleStyle = (dark: string): React.CSSProperties => ({ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.7rem", color: dark, textAlign: "center", marginBottom: "1.5rem" })

export default function TraditionalCeylonTemplate({ couple }: { couple: Couple }) {
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

  // ── Derive the events list to render: prefer the new couple.events object,
  // fall back to the legacy single wedding_date/venue columns if a couple
  // hasn't been re-saved through the updated admin form yet. ──
  const EVENT_META: Record<'engagement' | 'wedding' | 'homecoming', { label: string; sinhala: string; icon: string }> = {
    engagement: { label: 'Engagement', sinhala: 'සරප්පු දිනය', icon: '💍' },
    wedding: { label: 'Wedding Ceremony', sinhala: 'විවාහ මංගල්‍යය', icon: '👰' },
    homecoming: { label: 'Homecoming', sinhala: 'ගෙදර ගිය මංගල්‍යය', icon: '🏡' },
  }
  type RenderableEvent = { key: 'engagement' | 'wedding' | 'homecoming'; label: string; sinhala: string; icon: string; enabled: boolean; venue: string; venue_address: string; date: string; maps_url: string }

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
    venue: couple.venue || '',
    couplePhoto: couple.couple_photo || DEFAULT_PHOTO,
    introText: couple.intro_text || "දෙදෙනෙකුගේ හදවත් එක්වන, ආශීර්වාද හා ආලෝකයෙන් පිරි මොහොතක්",
    song: couple.song_title || DEFAULT_SONG_TITLE,
    artist: couple.song_artist || DEFAULT_SONG_ARTIST,
    timeline: couple.timeline || [],
    seats: couple.seats || {},
    gallery: couple.gallery || [],
  }

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", minHeight: "100vh", background: "#f4eedd" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Noto+Sans+Sinhala:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');
        @keyframes spin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
        @keyframes pulse-gold { 0%,100%{box-shadow:0 0 0 0 rgba(201,162,39,0.35);} 50%{box-shadow:0 0 0 14px rgba(201,162,39,0);} }
        @keyframes motif-drift {
          0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.45; }
          50% { transform: translateY(50vh) translateX(-14px) rotate(120deg); }
          90% { opacity: 0.45; }
          100% { transform: translateY(105vh) translateX(16px) rotate(260deg); opacity: 0; }
        }
        .sinhala-text { font-family: 'Noto Sans Sinhala','Inter',sans-serif; }
        input::placeholder { color: #b5ab8c; }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto", background: CREAM, boxShadow: "0 0 80px rgba(0,0,0,0.06)", position: "relative" }}>

        {/* ══ COVER ══ */}
        <AnimatePresence>
          {!opened && (
            <motion.div key="cover" exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.5 }}
              style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", background: DARK }}>

              {/* Couple illustration as the cover background */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={DEFAULT_PHOTO} alt=""
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none" }} />
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(20,30,22,0.30) 0%, rgba(20,30,22,0.10) 35%, rgba(20,30,22,0.3) 65%, rgba(20,30,22,0.68) 100%)` }} />

              <FloatingMotifs count={8} />

              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
                style={{ textAlign: "center", width: "84%", maxWidth: 340, position: "relative", zIndex: 10, padding: "0 1rem" }}>
                <div className="sinhala-text" style={{
                  display: "inline-block", fontSize: 13, color: "#fff", letterSpacing: "0.05em",
                  marginBottom: "0.6rem", padding: "4px 14px", borderRadius: 100,
                  background: "rgba(20,16,8,0.45)", backdropFilter: "blur(4px)",
                  textShadow: "0 2px 8px rgba(0,0,0,0.6)",
                }}>
                  ශ්‍රී සුභ මංගලම්
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(6px)", borderRadius: 100, padding: "6px 14px", fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "#fff", marginBottom: "1.2rem", border: `1px solid ${PRIMARY_LIGHT}55` }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: PRIMARY_LIGHT, display: "inline-block" }} />
                  Wedding Invitation
                </div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "clamp(2.4rem,9vw,3.4rem)", color: "#fff", lineHeight: 1, textShadow: "0 4px 24px rgba(0,0,0,0.5)" }}>{W.bride}</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.6rem", color: PRIMARY_LIGHT, margin: "0.2rem 0", textShadow: "0 2px 14px rgba(0,0,0,0.4)" }}>&amp;</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "clamp(2.4rem,9vw,3.4rem)", color: "#fff", lineHeight: 1, textShadow: "0 4px 24px rgba(0,0,0,0.5)" }}>{W.groom}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", margin: "1.1rem 0" }}>
                  <div style={{ height: 1, width: 36, background: "rgba(255,255,255,0.4)" }} />
                  <span style={{ fontSize: 11, color: PRIMARY_LIGHT }}>❀</span>
                  <div style={{ height: 1, width: 36, background: "rgba(255,255,255,0.4)" }} />
                </div>
                <div className="sinhala-text" style={{ fontSize: 12, color: "rgba(255,255,255,0.88)", lineHeight: 1.8, marginBottom: "1.6rem", textShadow: "0 2px 10px rgba(0,0,0,0.4)" }}>
                  {W.introText}
                </div>
                <button onClick={handleOpenInvitation} style={{
                  display: "inline-flex", alignItems: "center", gap: 10,
                  background: `linear-gradient(135deg,${PRIMARY_LIGHT},${PRIMARY_LIGHT}cc)`, color: DARK,
                  border: "none", borderRadius: 100, padding: "13px 26px",
                  fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase",
                  cursor: "pointer", fontFamily: "'Inter',sans-serif", fontWeight: 600,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                  animation: "pulse-gold 2.5s ease infinite",
                }}>
                  You're Invited →
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

            <FloatingMotifs count={8} />

            {/* Hero */}
            <div style={{ position: "relative", height: 480, overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(160deg,${PRIMARY_LIGHT},${PRIMARY})` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={W.couplePhoto} alt={`${W.bride} and ${W.groom}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }}
                  onError={e => { (e.currentTarget as HTMLImageElement).src = DEFAULT_PHOTO }} />
              </div>
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top,${CREAM} 0%,rgba(31,46,34,0.1) 60%,rgba(31,46,34,0.4) 100%)` }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "2rem 1.5rem", textAlign: "center", zIndex: 5 }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <div style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: PRIMARY_LIGHT, marginBottom: "0.6rem" }}>Together with their families</div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "clamp(2.3rem,8.5vw,3.6rem)", color: "#fff", lineHeight: 1, textShadow: "0 2px 20px rgba(31,46,34,0.4)" }}>
                    {W.bride}
                    <span style={{ display: "block", fontSize: "1.7rem", color: PRIMARY_LIGHT, fontStyle: "normal" }}>&amp;</span>
                    {W.groom}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", margin: "4px 0", letterSpacing: "0.1em" }}>are getting married</div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
                    <a href="#rsvp" style={{ background: `linear-gradient(135deg,${PRIMARY_LIGHT},${PRIMARY_LIGHT}cc)`, color: DARK, borderRadius: 100, padding: "10px 22px", fontSize: 11, letterSpacing: "0.15em", textDecoration: "none", fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>RSVP</a>
                    <a href={normalizeMapsUrl(eventsList[0]?.maps_url || couple.maps_url || '')} target="_blank" rel="noopener noreferrer" style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(8px)", color: PRIMARY_LIGHT, border: `1.5px solid ${PRIMARY_LIGHT}`, borderRadius: 100, padding: "10px 22px", fontSize: 11, letterSpacing: "0.15em", textDecoration: "none", fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>Location</a>
                  </div>
                </motion.div>
              </div>
            </div>

            {(W.brideFamilyName || W.groomFamilyName) && (
              <motion.div style={{ ...cardStyle(), padding: "2.2rem 1.6rem 1.8rem" }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <OrnateFrame color={PRIMARY_LIGHT} />
                <div className="sinhala-text" style={{ ...pretitleSinhala(PRIMARY), marginBottom: 10, position: "relative" }}>ශ්‍රී සුභ මංගලම්</div>
                <div style={{ textAlign: "center", padding: "14px 10px", background: `${PRIMARY_LIGHT}14`, borderRadius: 12, fontSize: 13, color: DARK, lineHeight: 2, position: "relative" }}>
                  {W.groomFamilyName && <><strong>{W.groomFamilyName}</strong> ගේ පුත් <strong>{W.groom}</strong><br /></>}
                  {W.brideFamilyName && W.groomFamilyName && <>සහ<br /></>}
                  {W.brideFamilyName && <><strong>{W.brideFamilyName}</strong> ගේ දියණිය <strong>{W.bride}</strong><br /></>}
                  <span style={{ color: MUTED }}>ඔබගේ පැමිණීම අපගේ විවාහ මංගල්‍යයට ශෝභාවක් වනු ඇත</span>
                </div>
              </motion.div>
            )}

            {/* Events — one card per enabled event (Engagement / Wedding / Homecoming) */}
            {eventsList.map((ev, idx) => {
              const evDate = new Date(ev.date)
              const evDateDisplay = evDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
              const evTimeDisplay = evDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) + ' Onwards'
              return (
                <motion.div key={ev.key} id={idx === 0 ? "location" : undefined} style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <VineCorner color={PRIMARY_LIGHT} />
                  <VineCorner color={PRIMARY_LIGHT} flip />
                  <div style={pretitleStyle(PRIMARY)}>{ev.icon} Save the Date</div>
                  <div style={titleStyle(DARK)}>{ev.label}</div>
                  {[
                    { icon: "📅", label: "Date", val: evDateDisplay },
                    { icon: "⏰", label: "Time", val: evTimeDisplay },
                    { icon: "📍", label: "Venue", val: ev.venue || couple.venue || "", sub: ev.venue_address || couple.venue_address || "" },
                  ].map(d => (
                    <div key={d.label} style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "12px 0", borderBottom: `1px solid ${PRIMARY_LIGHT}33` }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${PRIMARY_LIGHT}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>{d.icon}</div>
                      <div>
                        <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#b5ab8c" }}>{d.label}</div>
                        <div style={{ fontSize: 15, color: DARK, fontWeight: 700, marginTop: 2 }}>{d.val}</div>
                        {d.sub && <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{d.sub}</div>}
                      </div>
                    </div>
                  ))}
                  {ev.maps_url && (
                    <a href={normalizeMapsUrl(ev.maps_url)} target="_blank" rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: `${PRIMARY_LIGHT}22`, borderRadius: 100, padding: "10px 20px", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: PRIMARY, marginTop: 16, textDecoration: "none", fontWeight: 500 }}>
                      📍 View Location on Maps
                    </a>
                  )}
                </motion.div>
              )
            })}

            {sv.countdown && (
              <motion.div style={{ ...cardStyle(), padding: "1.4rem 1rem 1.2rem" }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={{ ...pretitleStyle(PRIMARY), marginBottom: 10 }}>Counting Down to Our Big Day</div>
                <Countdown targetDate={W.date} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} />
              </motion.div>
            )}

            <div id="rsvp"><RSVP coupleId={couple.id} askDrinking={couple.ask_drinking} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} cream={CREAM} muted={MUTED} /></div>

            {sv.timeline && W.timeline.length > 0 && (
              <motion.div style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <VineCorner color={PRIMARY_LIGHT} />
                <VineCorner color={PRIMARY_LIGHT} flip />
                <div style={pretitleStyle(PRIMARY)}>Our Celebration</div>
                <div style={titleStyle(DARK)}>Event Timeline</div>
                <div style={{ position: "relative", paddingLeft: 20 }}>
                  <div style={{ position: "absolute", left: 6, top: 0, bottom: 0, width: 1, background: `${PRIMARY_LIGHT}55` }} />
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
                <VineCorner color={PRIMARY_LIGHT} />
                <VineCorner color={PRIMARY_LIGHT} flip />
                <div style={pretitleStyle(PRIMARY)}>Be Our Guest</div>
                <div style={titleStyle(DARK)}>Find Your Table</div>
                <div style={{ fontSize: 13, color: MUTED, marginBottom: 4 }}>Search your name to find your assigned table</div>
                <SeatFinder seats={W.seats} primary={PRIMARY} dark={DARK} cream={CREAM} muted={MUTED} />
              </motion.div>
            )}

            {sv.music && (
              <motion.div style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <VineCorner color={PRIMARY_LIGHT} />
                <VineCorner color={PRIMARY_LIGHT} flip />
                <div style={pretitleStyle(PRIMARY)}>Our Song</div>
                <MusicPlayerUI title={W.song} artist={W.artist} audioRef={audioRef} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} muted={MUTED} />
              </motion.div>
            )}

            {sv.gallery && W.gallery.length > 0 && (
              <motion.div style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <VineCorner color={PRIMARY_LIGHT} />
                <VineCorner color={PRIMARY_LIGHT} flip />
                <div style={pretitleStyle(PRIMARY)}>Our Celebration</div>
                <div style={titleStyle(DARK)}>Moments of Love</div>
                <div style={{ fontSize: 12, color: MUTED, textAlign: "center", marginBottom: 16, lineHeight: 1.7 }}>
                  Holding onto the laughter, the quiet moments, and the little sparks of magic that brought us here.
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {W.gallery.map((src, i) => (
                    <div key={i} style={{ gridRow: i === 0 ? "span 2" : undefined, borderRadius: 14, overflow: "hidden", background: `${PRIMARY_LIGHT}22`, aspectRatio: i === 0 ? "1/2" : "1/1", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => (e.currentTarget.style.display = "none")} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {sv.thank_you && (
              <motion.div style={{ ...cardStyle(), borderRadius: 18 }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <VineCorner color={PRIMARY_LIGHT} />
                <VineCorner color={PRIMARY_LIGHT} flip />
                <div style={pretitleStyle(PRIMARY)}>A Special Note</div>
                <div style={titleStyle(DARK)}>To Our Lovely Guests</div>
                <div style={{ textAlign: "center", fontSize: 13, color: DARK, lineHeight: 2 }}>
                  With hearts full of love and gratitude, we are so happy to celebrate this beautiful chapter of our lives with you. Your presence means more to us than words can truly express, and having you by our side makes this day even more meaningful.
                  <br /><br />
                  <span className="sinhala-text">ඔබගේ ආශීර්වාද හා පැමිණීම සඳහා අපගේ හදවතාංගම ස්තූතිය පුද කරමු.</span>
                </div>
                <div style={{ textAlign: "center", marginTop: 18 }}>
                  <div style={{ fontSize: 11, color: "#b5ab8c", letterSpacing: "0.1em" }}>With all our love,</div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.6rem", color: PRIMARY, marginTop: 4 }}>
                    {W.bride} &amp; {W.groom}
                  </div>
                </div>
              </motion.div>
            )}

            <div style={{ padding: "2rem 1.5rem", textAlign: "center", background: "#fff", borderTop: `1px solid ${PRIMARY_LIGHT}55`, borderRadius: "18px 18px 0 0" }}>
              <div style={{ fontSize: 16, marginBottom: 10, opacity: 0.55, color: PRIMARY_LIGHT }}>❀ 🌿 ❀</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.4rem", color: PRIMARY, marginBottom: 4 }}>InviteGlow</div>
              <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "#b5ab8c" }}>inviteglow.com · Digital Wedding Invitations</div>
            </div>

          </motion.div>
        )}
      </div>
    </div>
  )
}