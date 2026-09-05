"use client"
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, Couple } from '@/lib/supabase'
import FooterSocial from '@/components/shared/FooterSocial'

const DEFAULT_PHOTO = "/images/hero-floral.png"
const DEFAULT_SONG_URL = "/audio/calm-wedding.mp3"
const DEFAULT_SONG_TITLE = "Calm Wedding Theme"
const DEFAULT_SONG_ARTIST = "InviteGlow"

// Lavender & white — a soft ceremonial palette. No hardcoded demo video for
// this template; only plays a video if the couple explicitly uploads one.
const DEFAULT_PALETTE = {
  primary: "#8B7BB8",
  primaryLight: "#D4C9E8",
  dark: "#3A2E4D",
  cream: "#FDFCFF",
  muted: "#9A8FB0",
}

function normalizeMapsUrl(url: string): string {
  if (!url) return '#'
  if (url.includes('maps.app.goo.gl') || url.includes('goo.gl/maps')) {
    return `https://www.google.com/maps?q=${encodeURIComponent(url)}`
  }
  return url
}

// ── Per-element text style overrides. Reads couple.text_styles (set from
// the "Customise Fonts" panel in the couple's dashboard) and merges a
// color/font/bold override on top of the template's own default styling.
type TextStyleEntry = { color?: string; font?: string; bold?: boolean }
function useTextStyles(couple: any) {
  const map: Record<string, TextStyleEntry> = couple?.text_styles || {}
  return (key: string, fallback: React.CSSProperties = {}): React.CSSProperties => {
    const s = map[key]
    if (!s) return fallback
    return {
      ...fallback,
      ...(s.color ? { color: s.color } : {}),
      ...(s.font && s.font !== 'inherit' ? { fontFamily: s.font } : {}),
      ...(s.bold ? { fontWeight: 700 } : {}),
    }
  }
}

// ── Signature motif: a ceremonial rank-star insignia, rendered in line
// art — a subtle nod to "military" without leaning on camo or literal
// uniform imagery, kept elegant enough to sit inside a wedding invite. ──
function Insignia({ color, size = 40, opacity = 0.9 }: { color: string; size?: number; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ opacity, display: "block" }}>
      <circle cx="50" cy="50" r="46" fill="none" stroke={color} strokeWidth="1.4" />
      <circle cx="50" cy="50" r="38" fill="none" stroke={color} strokeWidth="0.7" opacity="0.6" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => (
        <line key={i}
          x1={50 + 38 * Math.cos(a * Math.PI / 180)} y1={50 + 38 * Math.sin(a * Math.PI / 180)}
          x2={50 + 46 * Math.cos(a * Math.PI / 180)} y2={50 + 46 * Math.sin(a * Math.PI / 180)}
          stroke={color} strokeWidth="1" opacity="0.5" />
      ))}
      <path d="M50 20 L58 42 L82 42 L62 56 L70 78 L50 64 L30 78 L38 56 L18 42 L42 42 Z" fill={color} opacity="0.92" />
      <circle cx="50" cy="50" r="6" fill={color} />
    </svg>
  )
}

// ── Ribbon divider — a nod to a medal ribbon bar, doubling as the
// template's section divider. ──
function RibbonDivider({ color, primaryLight }: { color: string; primaryLight: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
      <div style={{ width: 34, height: 3, background: color, borderRadius: 2 }} />
      <div style={{ width: 5, height: 5, transform: "rotate(45deg)", background: primaryLight, border: `1px solid ${color}` }} />
      <div style={{ width: 34, height: 3, background: color, borderRadius: 2 }} />
    </div>
  )
}

// ── Guest intro screen — "Dear [Name]," shown for ~5s before the cover. ──
function GuestIntroScreen({ guestName, onDone, primary, primaryLight, dark, cream }: {
  guestName: string; onDone: () => void; primary: string; primaryLight: string; dark: string; cream: string
}) {
  return (
    <motion.div key="intro" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1, ease: "easeInOut" }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: `linear-gradient(160deg, ${cream} 0%, ${primaryLight}44 45%, ${cream} 100%)`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "2rem", overflow: "hidden",
      }}>
      <div style={{ position: "absolute", width: 320, height: 320, borderRadius: "50%", background: `radial-gradient(circle, ${primary}22, transparent)`, top: "20%", left: "50%", transform: "translateX(-50%)" }} />
      <motion.div initial={{ scale: 0.4, opacity: 0, rotate: -30 }} animate={{ scale: [0.4, 1.1, 1], opacity: 1, rotate: 0 }} transition={{ duration: 1.1, ease: "easeOut", delay: 0.2 }}
        style={{ position: "relative", zIndex: 1, marginBottom: "1.6rem" }}>
        <Insignia color={primary} size={64} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.9 }} style={{ position: "relative", zIndex: 1, marginBottom: "1rem" }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "clamp(1.9rem,6.5vw,2.7rem)", color: dark, lineHeight: 1.2 }}>
          Dear <span style={{ color: primary, fontWeight: 600 }}>{guestName}</span>,
        </div>
      </motion.div>
      <motion.div initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ duration: 0.6, delay: 1.3 }} style={{ marginBottom: 14 }}>
        <RibbonDivider color={primary} primaryLight={primaryLight} />
      </motion.div>
      <motion.div initial={{ opacity: 0, letterSpacing: "0.1em" }} animate={{ opacity: 1, letterSpacing: "0.42em" }} transition={{ duration: 0.9, delay: 1.6 }}
        style={{ fontSize: 10, textTransform: "uppercase", color: `${primary}cc`, fontFamily: "'Inter',sans-serif" }}>
        You're Invited
      </motion.div>
      <motion.div style={{ position: "absolute", bottom: 0, left: 0, height: 3, background: `linear-gradient(to right,${primary},${primaryLight})`, borderRadius: 100 }}
        initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 5, ease: "linear", delay: 0.4 }} onAnimationComplete={onDone} />
      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ delay: 2 }} onClick={onDone}
        style={{ position: "absolute", bottom: 20, right: 20, background: "transparent", border: "none", cursor: "pointer", fontSize: 12, color: primary, fontFamily: "'Inter',sans-serif", letterSpacing: "0.1em" }}>
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
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [targetDate])
  return (
    <div style={{ display: "flex", maxWidth: 380, margin: "0 auto", gap: 8 }}>
      {[["Days", t.d], ["Hours", t.h], ["Mins", t.m], ["Secs", t.s]].map(([l, v]) => (
        <div key={l} style={{ flex: 1, textAlign: "center" }}>
          <div style={{ borderRadius: 12, background: `linear-gradient(145deg,${primaryLight}55,${primary}22)`, border: `1.5px solid ${primary}55`, padding: "12px 4px" }}>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.6rem", color: dark, fontWeight: 700 }}>{v}</span>
          </div>
          <span style={{ fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: `${primary}bb`, display: "block", marginTop: 6 }}>{l}</span>
        </div>
      ))}
    </div>
  )
}

// ── YouTube detect / Music player ──
function getYouTubeId(url: string): string | null {
  if (!url) return null
  const patterns = [/youtu\.be\/([^?&]+)/, /youtube\.com\/watch\?v=([^&]+)/, /youtube\.com\/embed\/([^?&]+)/, /youtube\.com\/shorts\/([^?&]+)/]
  for (const p of patterns) { const m = url.match(p); if (m) return m[1] }
  return null
}

function MusicPlayerUI({ title, artist, audioRef, primary, primaryLight, dark, muted }: {
  title: string; artist: string; audioRef: React.RefObject<HTMLAudioElement | null>; primary: string; primaryLight: string; dark: string; muted: string
}) {
  const [playing, setPlaying] = useState(false); const [prog, setProg] = useState(0)
  useEffect(() => {
    const a = audioRef.current; if (!a) return
    const onPlay = () => setPlaying(true), onPause = () => setPlaying(false), onTime = () => { if (a.duration) setProg((a.currentTime / a.duration) * 100) }
    a.addEventListener('play', onPlay); a.addEventListener('pause', onPause); a.addEventListener('timeupdate', onTime)
    setPlaying(!a.paused)
    return () => { a.removeEventListener('play', onPlay); a.removeEventListener('pause', onPause); a.removeEventListener('timeupdate', onTime) }
  }, [audioRef])
  const toggle = () => { const a = audioRef.current; if (!a) return; a.paused ? a.play().catch(() => {}) : a.pause() }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#fff", borderRadius: 14, padding: 16, border: `1px solid ${primaryLight}` }}>
      <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg,${primaryLight},${primary})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, animation: playing ? "spin 4s linear infinite" : "none" }}>🎵</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: dark }}>{title}</div>
        <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{artist}</div>
        <div style={{ height: 3, background: `${primary}26`, borderRadius: 100, marginTop: 8 }}>
          <div style={{ height: "100%", width: `${prog}%`, background: `linear-gradient(to right,${primary},${primaryLight})`, borderRadius: 100, transition: "width 0.3s" }} />
        </div>
      </div>
      <button onClick={toggle} style={{ width: 38, height: 38, borderRadius: "50%", background: dark, border: "none", color: "#fff", cursor: "pointer", fontSize: 13, flexShrink: 0 }}>{playing ? "⏸" : "▶"}</button>
    </div>
  )
}

// ── RSVP ──
function RSVP({ coupleId, askDrinking, primary, primaryLight, dark, cream, muted, guestName }: {
  coupleId: string; askDrinking: boolean; primary: string; primaryLight: string; dark: string; cream: string; muted: string; guestName: string
}) {
  const [name, setName] = useState(guestName || ""); const [guestCount, setGuestCount] = useState(1)
  const [step, setStep] = useState<"form" | "count" | "drinking" | "done">("form")
  const [finalResponse, setFinalResponse] = useState<"yes" | "no">("yes"); const [saving, setSaving] = useState(false)
  const save = async (response: "yes" | "no", drinking: "yes" | "no" | null, count: number) => {
    setSaving(true)
    const { error } = await supabase.from('rsvps').insert([{ couple_id: coupleId, guest_name: name.trim(), response, drinking, guest_count: count }])
    setSaving(false); if (!error) { setFinalResponse(response); setStep("done") }
  }
  const inp: React.CSSProperties = { width: "100%", padding: "13px 16px", borderRadius: 10, border: `1px solid ${primaryLight}`, background: cream, color: dark, fontSize: 14, outline: "none", fontFamily: "'Inter',sans-serif", marginBottom: 12 }
  return (
    <div style={{ background: `linear-gradient(135deg,${primaryLight}33,${cream})`, padding: "2.5rem 1.5rem", textAlign: "center" }}>
      <RibbonDivider color={primary} primaryLight={primaryLight} />
      <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: primary, margin: "16px 0 8px", fontWeight: 700 }}>Confirm Attendance</div>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.8rem", color: dark, marginBottom: 24 }}>Will You Join Us?</div>
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 380, margin: "0 auto", boxShadow: `0 8px 30px ${dark}14` }}>
        {step === "form" && (<>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" style={inp} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button onClick={() => name.trim() && setStep("count")} style={{ padding: 13, borderRadius: 10, background: primary, color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✓ Accept</button>
            <button onClick={() => name.trim() && save("no", null, 1)} disabled={saving} style={{ padding: 13, borderRadius: 10, background: "transparent", color: muted, border: `1px solid ${primaryLight}`, cursor: "pointer", fontSize: 12, opacity: saving ? 0.6 : 1 }}>{saving ? "..." : "✗ Decline"}</button>
          </div>
        </>)}
        {step === "count" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ fontSize: 13, color: dark, fontWeight: 600, marginBottom: 16 }}>How many people, including you?</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 16 }}>
              <button onClick={() => setGuestCount(c => Math.max(1, c - 1))} style={{ width: 36, height: 36, borderRadius: "50%", background: `${primary}1a`, color: primary, border: "none", cursor: "pointer", fontSize: 16 }}>−</button>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.8rem", color: dark, minWidth: 40 }}>{guestCount}</div>
              <button onClick={() => setGuestCount(c => Math.min(20, c + 1))} style={{ width: 36, height: 36, borderRadius: "50%", background: `${primary}1a`, color: primary, border: "none", cursor: "pointer", fontSize: 16 }}>+</button>
            </div>
            <button onClick={() => askDrinking ? setStep("drinking") : save("yes", null, guestCount)} disabled={saving} style={{ width: "100%", padding: 13, borderRadius: 10, background: primary, color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, opacity: saving ? 0.6 : 1 }}>{saving ? "..." : "Continue →"}</button>
          </motion.div>
        )}
        {step === "drinking" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ fontSize: 12, color: muted, marginBottom: 14 }}>Will you be having alcohol?</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={() => save("yes", "yes", guestCount)} disabled={saving} style={{ padding: 13, borderRadius: 10, background: `${primary}1a`, color: primary, border: `1px solid ${primary}44`, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>🥃 Yes</button>
              <button onClick={() => save("yes", "no", guestCount)} disabled={saving} style={{ padding: 13, borderRadius: 10, background: `${primary}1a`, color: primary, border: `1px solid ${primary}44`, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>🥤 No</button>
            </div>
          </motion.div>
        )}
        {step === "done" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{finalResponse === "yes" ? "🎉" : "💌"}</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.3rem", color: primary, marginBottom: 4 }}>{finalResponse === "yes" ? `See you there, ${name}!` : `We'll miss you, ${name}.`}</div>
            <div style={{ fontSize: 12, color: muted }}>{finalResponse === "yes" ? (guestCount > 1 ? `Party of ${guestCount} confirmed!` : "We can't wait to celebrate with you.") : "Thank you for letting us know."}</div>
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
    setRes(found ? `You are seated at ${seats[found]}` : "Name not found. Please contact the couple.")
  }
  return (
    <div>
      <div style={{ display: "flex", gap: 10 }}>
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && search()} placeholder="Enter your name..." style={{ flex: 1, padding: "13px 16px", borderRadius: 10, border: `1px solid ${primary}33`, background: cream, color: dark, fontSize: 14, outline: "none", fontFamily: "'Inter',sans-serif" }} />
        <button onClick={search} style={{ padding: "13px 20px", borderRadius: 10, background: dark, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Search</button>
      </div>
      {res && <div style={{ marginTop: 12, fontSize: 14, color: res.startsWith("You") ? primary : muted, fontWeight: res.startsWith("You") ? 600 : 400 }}>{res}</div>}
    </div>
  )
}

// ── Guest Wishes Wall ──────────────────────────────────────────────
type WishMedia = { url: string; type: 'photo' | 'video' }
type Wish = { id: string; couple_id: string; guest_name: string; message: string; photo_url: string | null; video_url: string | null; media: WishMedia[] | null; created_at: string }

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
function WishMediaGrid({ media, onOpen }: { media: WishMedia[]; onOpen: (index: number) => void }) {
  if (media.length === 0) return null
  const shown = media.slice(0, 4); const isSingle = media.length === 1
  return (
    <div style={{ display: "grid", gridTemplateColumns: isSingle ? "1fr" : "repeat(2, 1fr)", gap: 4, marginBottom: 6, borderRadius: 10, overflow: "hidden" }}>
      {shown.map((m, idx) => {
        const isMoreTile = idx === 3 && media.length > 4
        return (
          <div key={idx} onClick={() => onOpen(idx)} style={{ position: "relative", cursor: "pointer", overflow: "hidden", height: isSingle ? 140 : undefined, aspectRatio: isSingle ? undefined : "1 / 1", background: "#000" }}>
            {m.type === 'video' ? <video src={m.url} muted style={{ width: "100%", height: "100%", objectFit: isSingle ? "contain" : "cover", display: "block" }} /> : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={m.url} alt="" style={{ width: "100%", height: "100%", objectFit: isSingle ? "contain" : "cover", display: "block" }} />
            )}
            {isMoreTile && <div style={{ position: "absolute", inset: 0, background: "rgba(30,20,50,0.55)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, fontWeight: 700 }}>+{media.length - 4}</div>}
          </div>
        )
      })}
    </div>
  )
}
function WishLightbox({ media, index, onIndex, onClose }: { media: WishMedia[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const current = media[index]
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,14,30,0.92)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", maxWidth: "92vw", maxHeight: "86vh" }}>
        {current.type === 'video' ? <video src={current.url} controls autoPlay style={{ maxWidth: "92vw", maxHeight: "86vh", borderRadius: 10 }} /> : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={current.url} alt="" style={{ maxWidth: "92vw", maxHeight: "86vh", borderRadius: 10, objectFit: "contain" }} />
        )}
        <button onClick={onClose} style={{ position: "absolute", top: -40, right: 0, background: "transparent", border: "none", color: "#fff", fontSize: 26, cursor: "pointer" }}>×</button>
      </div>
    </div>
  )
}
function WishesWall({ coupleId, primary, primaryLight, dark, cream, muted }: { coupleId: string; primary: string; primaryLight: string; dark: string; cream: string; muted: string }) {
  const [wishes, setWishes] = useState<Wish[]>([]); const [loading, setLoading] = useState(true)
  const [name, setName] = useState(''); const [message, setMessage] = useState('')
  const [files, setFiles] = useState<File[]>([]); const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(''); const [done, setDone] = useState(false)
  const [lightbox, setLightbox] = useState<{ media: WishMedia[]; index: number } | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      const { data } = await supabase.from('wishes').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false })
      if (active && data) setWishes(data as Wish[])
      setLoading(false)
    }
    load()
    const channel = supabase.channel(`wishes-${coupleId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'wishes', filter: `couple_id=eq.${coupleId}` }, () => load()).subscribe()
    return () => { active = false; supabase.removeChannel(channel) }
  }, [coupleId])

  const submit = async () => {
    if (!name.trim() || !message.trim()) { setError('Please add your name and a message.'); return }
    setSubmitting(true); setError('')
    try {
      const media: WishMedia[] = []
      for (const f of files) { const { url, isVideo } = await uploadWishMedia(f, coupleId); media.push({ url, type: isVideo ? 'video' : 'photo' }) }
      const { error: insertError } = await supabase.from('wishes').insert([{ couple_id: coupleId, guest_name: name.trim(), message: message.trim(), media }])
      if (insertError) throw insertError
      setName(''); setMessage(''); setFiles([]); setDone(true)
    } catch { setError('Something went wrong — please try again.') } finally { setSubmitting(false) }
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '11px 14px', borderRadius: 10, border: `1px solid ${primary}33`, background: cream, color: dark, fontSize: 13, outline: 'none', marginBottom: 10, boxSizing: 'border-box', fontFamily: "'Inter',sans-serif" }

  return (
    <div>
      <div style={{ background: "#fff", borderRadius: 16, padding: '18px 16px', marginBottom: 18, boxShadow: `0 4px 20px ${dark}0d` }}>
        {done ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: dark }}>Thank you for your wish!</div>
            <div style={{ fontSize: 12, color: muted, marginTop: 4 }}>It's now on the wall below.</div>
            <button onClick={() => setDone(false)} style={{ marginTop: 12, padding: '8px 18px', borderRadius: 100, border: 'none', cursor: 'pointer', background: `${primaryLight}55`, color: dark, fontSize: 12, fontWeight: 700 }}>Leave another wish</button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: dark, marginBottom: 10 }}>Leave a Wish</div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inputStyle} />
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your wishes for the couple..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: muted, padding: '9px 13px', borderRadius: 10, border: `1px dashed ${primary}`, cursor: 'pointer', marginBottom: files.length ? 6 : 10 }}>
              📷 {files.length ? `${files.length} file(s) selected` : 'Add photos or a video (optional)'}
              <input type="file" accept="image/*,video/*" multiple onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files || [])].slice(0, 6))} style={{ display: 'none' }} />
            </label>
            {error && <div style={{ fontSize: 11.5, color: primary, marginBottom: 8 }}>{error}</div>}
            <button onClick={submit} disabled={submitting} style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${primary},${primaryLight})`, color: '#fff', fontWeight: 700, fontSize: 13, opacity: submitting ? 0.6 : 1 }}>{submitting ? 'Sending...' : 'Send Wish'}</button>
          </>
        )}
      </div>
      {loading ? <div style={{ fontSize: 12, color: muted, textAlign: 'center' }}>Loading wishes...</div> : wishes.length === 0 ? (
        <div style={{ fontSize: 12, color: muted, textAlign: 'center' }}>Be the first to leave a wish!</div>
      ) : (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: dark, textAlign: 'center', marginBottom: 14 }}>{wishes.length} {wishes.length === 1 ? 'Wish' : 'Wishes'}</div>
          {wishes.map((w, i, arr) => {
            const mediaList = getWishMedia(w)
            return (
              <div key={w.id} style={{ padding: '12px 0', borderBottom: i < arr.length - 1 ? `1px solid ${primary}22` : 'none', textAlign: 'left' }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: primary, marginBottom: 4 }}>{w.guest_name}</div>
                <div style={{ fontSize: 13, color: dark, opacity: 0.85, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{w.message}</div>
                <WishMediaGrid media={mediaList} onOpen={idx => setLightbox({ media: mediaList, index: idx })} />
              </div>
            )
          })}
        </div>
      )}
      {lightbox && <WishLightbox media={lightbox.media} index={lightbox.index} onIndex={i => setLightbox(l => l && { ...l, index: i })} onClose={() => setLightbox(null)} />}
    </div>
  )
}

// ── Gift / bank account card ──
function GiftAccountCard({ label, bankName, accountName, accountNumber, primary, muted, dark }: {
  label: string; bankName?: string; accountName?: string; accountNumber?: string; primary: string; muted: string; dark: string
}) {
  const [copied, setCopied] = useState(false)
  const copy = () => { if (!accountNumber) return; navigator.clipboard?.writeText(accountNumber).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800) }).catch(() => {}) }
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 16, textAlign: "center", border: `1px solid ${primary}33` }}>
      <div style={{ fontSize: 9.5, letterSpacing: "0.18em", textTransform: "uppercase", color: muted, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: dark, marginBottom: 3 }}>{bankName}</div>
      <div style={{ fontSize: 11.5, color: muted, marginBottom: 2 }}>{accountName}</div>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.1rem", color: primary, marginBottom: 10 }}>{accountNumber}</div>
      <button onClick={copy} style={{ padding: "7px 16px", borderRadius: 100, border: "none", cursor: "pointer", background: copied ? "#16a34a" : primary, color: "#fff", fontSize: 10.5, fontWeight: 700 }}>{copied ? "✓ Copied!" : "Copy Account Number"}</button>
    </div>
  )
}

// ── Contact Numbers — click-to-call and WhatsApp ──
function ContactRow({ name, phone, primary, dark }: { name: string; phone: string; primary: string; dark: string }) {
  const digitsOnly = phone.replace(/\D/g, '')
  const waNumber = digitsOnly.startsWith('0') ? `94${digitsOnly.slice(1)}` : digitsOnly
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: '#fff', border: `1px solid ${primary}22`, borderRadius: 14, padding: '12px 16px' }}>
      <div style={{ minWidth: 0 }}>
        {name ? (<><div style={{ fontSize: 13, fontWeight: 700, color: dark }}>{name}</div><div style={{ fontSize: 12, color: dark, opacity: 0.55, marginTop: 2 }}>{phone}</div></>) : (
          <div style={{ fontSize: 13, fontWeight: 700, color: dark }}>{phone}</div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <a href={`tel:${digitsOnly}`} style={{ width: 36, height: 36, borderRadius: '50%', background: `${primary}1a`, color: primary, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill={primary}><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01z" /></svg>
        </a>
        <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer" style={{ width: 36, height: 36, borderRadius: '50%', background: '#25d366', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="#fff"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3M12 2a10 10 0 00-8.5 15.3L2 22l4.8-1.3A10 10 0 1012 2z" /></svg>
        </a>
      </div>
    </div>
  )
}

// ── Floating bottom nav bar ──
function crScrollToId(id: string) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }

function BottomNavBar({ primary, primaryLight, dark, mapsUrl, hasWishes, hasGallery, hasContact, audioRef }: {
  primary: string; primaryLight: string; dark: string; mapsUrl: string; hasWishes: boolean; hasGallery: boolean; hasContact: boolean; audioRef: React.RefObject<HTMLAudioElement | null>
}) {
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    const a = audioRef.current; if (!a) return
    const onPlay = () => setPlaying(true), onPause = () => setPlaying(false)
    a.addEventListener('play', onPlay); a.addEventListener('pause', onPause); setPlaying(!a.paused)
    return () => { a.removeEventListener('play', onPlay); a.removeEventListener('pause', onPause) }
  }, [audioRef])
  const toggleMusic = () => { const a = audioRef.current; if (!a) return; a.paused ? a.play().catch(() => {}) : a.pause() }
  const iconBtn = (onClick: () => void, label: string, path: React.ReactElement, key: string) => (
    <button key={key} onClick={onClick} aria-label={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'transparent', border: 'none', cursor: 'pointer', color: dark, opacity: 0.8, padding: '2px 4px' }}>
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">{path}</svg>
      <span style={{ fontSize: 8 }}>{label}</span>
    </button>
  )
  return (
    <div style={{ position: 'fixed', bottom: 18, left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 40px)', maxWidth: 400, zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-evenly', background: 'rgba(255,255,255,0.98)', borderRadius: 100, border: `1px solid ${dark}14`, boxShadow: `0 10px 30px ${dark}30`, padding: '10px 18px', paddingRight: 56, position: 'relative' }}>
        {hasWishes && iconBtn(() => crScrollToId('wishes'), 'Wishes', <path d="M12 20.5s-7.5-4.9-9.8-9.3C.6 8 2 4.7 5.2 4a4.6 4.6 0 016.8 2.3A4.6 4.6 0 0118.8 4C22 4.7 23.4 8 21.8 11.2 19.5 15.6 12 20.5 12 20.5z" />, 'wishes')}
        {iconBtn(() => crScrollToId('savethedate'), 'Save Date', <><rect x="3.5" y="5" width="17" height="16" rx="2.5" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /></>, 'savedate')}
        {hasGallery && iconBtn(() => crScrollToId('gallery'), 'Gallery', <><rect x="3" y="4" width="18" height="16" rx="2.5" /><circle cx="8.5" cy="9.5" r="1.5" /><path d="M21 16l-5.2-5.2a2 2 0 00-2.8 0L4 19" /></>, 'gallery')}
        {iconBtn(() => crScrollToId('rsvp'), 'RSVP', <><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01z" /></>, 'rsvp')}
        {hasContact && iconBtn(() => crScrollToId('contact'), 'Contact', <><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M3.5 6.5L12 13l8.5-6.5" /></>, 'contact')}
        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: dark, opacity: 0.8, textDecoration: 'none', padding: '2px 4px' }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s7-7.5 7-12.5A7 7 0 105 9.5C5 14.5 12 22 12 22z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
            <span style={{ fontSize: 8 }}>Location</span>
          </a>
        )}
        <button onClick={toggleMusic} style={{ position: 'absolute', right: 4, top: -16, width: 46, height: 46, borderRadius: '50%', border: '3px solid #fff', background: `linear-gradient(135deg,${primary},${primaryLight})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: `0 6px 16px ${dark}40` }}>
          {playing ? (
            <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" /><path d="M16.5 9a3.5 3.5 0 010 6M19 6.5a7 7 0 010 11" /></svg>
          ) : (
            <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" /><path d="M16.5 9l5 6M21.5 9l-5 6" /></svg>
          )}
        </button>
      </div>
    </div>
  )
}

// ── Card + section styles ──
const cardStyle = (): React.CSSProperties => ({ background: "#fff", margin: "0 16px 16px", borderRadius: 20, padding: "1.8rem", boxShadow: "0 14px 40px rgba(58,46,77,0.09), 0 2px 8px rgba(58,46,77,0.05)", position: "relative", overflow: "hidden" })
const eyebrow = (color: string): React.CSSProperties => ({ fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color, textAlign: "center", marginBottom: 6, fontWeight: 700 })
const heading = (dark: string): React.CSSProperties => ({ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.6rem", color: dark, textAlign: "center", marginBottom: "1.2rem" })

export default function CeremonialGuardTemplate({ couple }: { couple: Couple }) {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#FDFCFF" }} />}>
      <CeremonialGuardInner couple={couple} />
    </Suspense>
  )
}

function CeremonialGuardInner({ couple }: { couple: Couple }) {
  const searchParams = useSearchParams()
  const guestName = searchParams?.get('name') || ''
  const introEnabled = (couple as any).show_guest_intro !== false
  const [showIntro, setShowIntro] = useState(!!guestName && introEnabled)
  const [introGone, setIntroGone] = useState(!(guestName && introEnabled))
  const [opened, setOpened] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const ts = useTextStyles(couple)

  const PRIMARY = couple.custom_colors?.primary || DEFAULT_PALETTE.primary
  const PRIMARY_LIGHT = couple.custom_colors?.primaryLight || DEFAULT_PALETTE.primaryLight
  const DARK = couple.custom_colors?.dark || DEFAULT_PALETTE.dark
  const CREAM = couple.custom_colors?.cream || DEFAULT_PALETTE.cream
  const MUTED = DEFAULT_PALETTE.muted

  // No baked-in demo video for this template — only plays a video if the
  // couple explicitly uploads a "Hero Background Video" in the dashboard.
  const coverVideoUrl = (couple as any).cover_video_url || ''
  const songUrl = couple.song_url || DEFAULT_SONG_URL
  const youtubeId = getYouTubeId(songUrl)

  useEffect(() => {
    if (youtubeId) return
    const audio = new Audio(songUrl)
    audio.loop = true; audio.volume = 0.6; audioRef.current = audio
    return () => { audio.pause(); audio.src = "" }
  }, [songUrl])

  // Matches the Eternal Bloom flow: tapping "Open Invitation" plays a
  // short video preview (if one is set) before the main invitation reveals.
  const [videoPlaying, setVideoPlaying] = useState(false)
  const videoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleOpen = () => {
    audioRef.current?.play().catch(() => {})
    if (coverVideoUrl) {
      setVideoPlaying(true)
      videoRef.current?.play().catch(() => { setVideoPlaying(false); handleVideoEnded() })
      videoTimerRef.current = setTimeout(handleVideoEnded, 5000)
    } else {
      handleVideoEnded()
    }
  }
  const handleVideoEnded = () => {
    if (videoTimerRef.current) { clearTimeout(videoTimerRef.current); videoTimerRef.current = null }
    setOpened(true)
    audioRef.current?.play().catch(() => {})
  }

  const EVENT_META: Record<'engagement' | 'wedding' | 'homecoming', { label: string; icon: string }> = {
    engagement: { label: 'Engagement', icon: '💍' }, wedding: { label: 'Wedding Ceremony', icon: '🎖️' }, homecoming: { label: 'Homecoming', icon: '🏡' },
  }
  type RenderableEvent = { key: 'engagement' | 'wedding' | 'homecoming'; label: string; icon: string; enabled: boolean; venue: string; venue_address: string; date: string; maps_url: string; dress_code?: string }
  const hasNewEvents = couple.events && Object.keys(couple.events).length > 0
  const eventKeyOrder: ('engagement' | 'wedding' | 'homecoming')[] =
    Array.isArray((couple as any).events_order) && (couple as any).events_order.length === 3
      ? (couple as any).events_order
      : ['engagement', 'wedding', 'homecoming']
  const eventsList: RenderableEvent[] = hasNewEvents
    ? eventKeyOrder.map((key): RenderableEvent => {
        const e = couple.events![key]
        const customLabel = (e as any)?.label
        return { key, ...EVENT_META[key], label: (customLabel || '').trim() || EVENT_META[key].label, enabled: e?.enabled ?? false, venue: e?.venue ?? '', venue_address: e?.venue_address ?? '', date: e?.date ?? '', maps_url: e?.maps_url ?? '', dress_code: (e as any)?.dress_code ?? '' }
      }).filter(e => e.enabled && e.date.length > 0)
    : (couple.wedding_date ? [{ key: 'wedding', ...EVENT_META.wedding, enabled: true, venue: couple.venue || '', venue_address: couple.venue_address || '', date: couple.wedding_date, maps_url: couple.maps_url || '' }] : [])

  const sv = {
    gallery: couple.section_visibility?.gallery ?? true, countdown: couple.section_visibility?.countdown ?? true,
    timeline: couple.section_visibility?.timeline ?? true, seat_finder: couple.section_visibility?.seat_finder ?? true,
    music: couple.section_visibility?.music ?? true, thank_you: couple.section_visibility?.thank_you ?? true,
  }

  const W = {
    bride: couple.bride, groom: couple.groom, brideFamilyName: couple.bride_family || '', groomFamilyName: couple.groom_family || '',
    date: couple.wedding_date, couplePhoto: couple.couple_photo || DEFAULT_PHOTO,
    song: couple.song_title || DEFAULT_SONG_TITLE, artist: couple.song_artist || DEFAULT_SONG_ARTIST,
    timeline: couple.timeline || [], seats: couple.seats || {}, gallery: couple.gallery || [],
  }

  const giftEnabled = (couple as any).enable_gift_section ?? true
  const brideBank = { bank: (couple as any).bride_bank_name || '', accountName: (couple as any).bride_bank_account_name || '', accountNumber: (couple as any).bride_bank_account_number || '' }
  const groomBank = { bank: (couple as any).groom_bank_name || '', accountName: (couple as any).groom_bank_account_name || '', accountNumber: (couple as any).groom_bank_account_number || '' }
  const hasGiftDetails = !!(brideBank.accountNumber || groomBank.accountNumber)

  const flexContacts: { name: string; phone: string }[] = Array.isArray((couple as any).contacts) ? (couple as any).contacts.filter((c: any) => c?.phone).map((c: any) => ({ name: c.name || '', phone: c.phone })) : []
  const contactList: { name: string; phone: string }[] = flexContacts.length > 0
    ? flexContacts
    : [
        ...(couple.groom && (couple as any).groom_phone ? [{ name: couple.groom, phone: (couple as any).groom_phone }] : []),
        ...(couple.bride && (couple as any).bride_phone ? [{ name: couple.bride, phone: (couple as any).bride_phone }] : []),
      ]

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", minHeight: "100vh", background: CREAM }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Great+Vibes&family=Playfair+Display:wght@500;600;700&family=Dancing+Script:wght@600;700&family=Montserrat:wght@400;500;600;700&family=Lora:wght@500;600&family=EB+Garamond:wght@500;600&family=Inter:wght@300;400;500;600;700&display=swap');
        @keyframes spin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
        input::placeholder { color: #b7a9d1; }
      `}</style>

      <AnimatePresence onExitComplete={() => setIntroGone(true)}>
        {showIntro && guestName && (
          <GuestIntroScreen guestName={guestName} onDone={() => setShowIntro(false)} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} cream={CREAM} />
        )}
      </AnimatePresence>

      <div style={{ maxWidth: 480, margin: "0 auto", background: CREAM, boxShadow: "0 0 80px rgba(0,0,0,0.08)", position: "relative" }}>

        {/* ══ COVER ══ */}
        <AnimatePresence>
          {!opened && introGone && (
            <motion.div key="cover" exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.6 }}
              style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", background: DARK }}>

              {/* If a video is set, its own poster frame (falling back to
                  the couple photo, or the template default) is always
                  visible before play — no separate photo layer needed, so
                  nothing goes invisible if only a video was uploaded. */}
              {coverVideoUrl ? (
                <video ref={videoRef} muted playsInline preload="auto" poster={couple.couple_photo || undefined} onEnded={handleVideoEnded}
                  onLoadedData={e => { try { if (e.currentTarget.currentTime === 0) e.currentTarget.currentTime = 0.05 } catch {} }}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 1 }}>
                  <source src={coverVideoUrl} type="video/mp4" />
                </video>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={W.couplePhoto} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 18%", zIndex: 1 }}
                  onError={e => { (e.currentTarget as HTMLImageElement).src = DEFAULT_PHOTO }} />
              )}
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${DARK}80 0%, ${DARK}26 30%, ${DARK}59 60%, ${DARK}d9 100%)`, zIndex: 3 }} />

              {/* Corner insignia flourishes */}
              <div style={{ position: "absolute", top: 16, left: 16, zIndex: 4, opacity: 0.35 }}><Insignia color="#fff" size={40} /></div>
              <div style={{ position: "absolute", top: 16, right: 16, zIndex: 4, opacity: 0.35 }}><Insignia color="#fff" size={40} /></div>

              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}
                style={{ textAlign: "center", width: "86%", maxWidth: 350, position: "relative", zIndex: 10, padding: "0 1rem" }}>

                <div style={{
                  ...ts('subtitle'), fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontWeight: 500,
                  fontSize: 15, letterSpacing: "0.12em", color: "#fff", marginBottom: "1.1rem", textShadow: "0 2px 10px rgba(0,0,0,0.5)",
                }}>
                  {(couple as any).cover_badge_text || 'Wedding Invitation'}
                </div>

                <div style={{ ...ts('bride_name'), fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "clamp(2.7rem,9.5vw,3.9rem)", color: "#fff", lineHeight: 1.05, textShadow: "0 4px 22px rgba(0,0,0,0.5)" }}>{W.bride}</div>
                <div style={{ margin: "10px 0" }}><RibbonDivider color={PRIMARY_LIGHT} primaryLight="rgba(255,255,255,0.5)" /></div>
                <div style={{ ...ts('groom_name'), fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "clamp(2.7rem,9.5vw,3.9rem)", color: "#fff", lineHeight: 1.05, textShadow: "0 4px 22px rgba(0,0,0,0.5)" }}>{W.groom}</div>

                <div style={{ ...ts('tagline'), fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.7, margin: "1.3rem 0 1.6rem", textShadow: "0 2px 10px rgba(0,0,0,0.4)" }}>
                  With honour and devotion,<br />we stand together as one
                </div>

                {guestName && (
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.2rem", color: "#fff", marginBottom: "1.2rem", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>Dear {guestName},</div>
                )}

                <button onClick={handleOpen} disabled={videoPlaying} style={{
                  display: "inline-flex", alignItems: "center", gap: 9, background: `linear-gradient(135deg,${PRIMARY},${PRIMARY_LIGHT})`, color: "#fff",
                  border: "none", borderRadius: 100, padding: "13px 30px", fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase",
                  cursor: videoPlaying ? "default" : "pointer", fontFamily: "'Inter',sans-serif", fontWeight: 600,
                  boxShadow: `0 8px 20px ${DARK}40`, opacity: videoPlaying ? 0.7 : 1, transition: "opacity 0.2s, transform 0.2s",
                }}>
                  {videoPlaying ? "Playing..." : "Open Invitation →"}
                </button>
                {!videoPlaying && <div style={{ fontSize: 9, color: "rgba(255,255,255,0.75)", marginTop: 13 }}>🎵 Tap to begin — with music</div>}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ INVITATION ══ */}
        {opened && (
          <motion.div initial={false} animate={{ opacity: 1 }}>

            {/* Hero */}
            <div style={{ position: "relative", height: 560, overflow: "hidden" }}>
              {coverVideoUrl ? (
                <video autoPlay loop muted playsInline preload="auto" poster={W.couplePhoto} style={{ width: "100%", height: "100%", objectFit: "cover" }}>
                  <source src={coverVideoUrl} type="video/mp4" />
                </video>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={W.couplePhoto} alt={`${W.bride} and ${W.groom}`} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 18%" }}
                  onError={e => { (e.currentTarget as HTMLImageElement).src = DEFAULT_PHOTO }} />
              )}
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top,${CREAM} 0%,${DARK}26 60%,${DARK}59 100%)` }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "2rem 1.5rem", textAlign: "center", zIndex: 5 }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <div style={{ fontSize: 9, letterSpacing: "0.5em", textTransform: "uppercase", color: "rgba(255,255,255,0.75)", marginBottom: "0.8rem" }}>{(couple as any).together_with_text || "Together with their families"}</div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "clamp(2.4rem,8vw,3.6rem)", color: "#fff", lineHeight: 1, textShadow: "0 2px 20px rgba(0,0,0,0.4)" }}>
                    <span style={ts('bride_name')}>{W.bride}</span><span style={{ color: PRIMARY_LIGHT }}> &amp; </span><span style={ts('groom_name')}>{W.groom}</span>
                  </div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
                    <a href="#rsvp" style={{ background: `linear-gradient(135deg,${PRIMARY},${PRIMARY_LIGHT})`, color: "#fff", borderRadius: 2, padding: "10px 22px", fontSize: 11, letterSpacing: "0.15em", textDecoration: "none", fontWeight: 700 }}>RSVP</a>
                    <a href={normalizeMapsUrl(eventsList[0]?.maps_url || couple.maps_url || '')} target="_blank" rel="noopener noreferrer" style={{ background: "rgba(0,0,0,0.2)", backdropFilter: "blur(8px)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.8)", borderRadius: 2, padding: "10px 22px", fontSize: 11, letterSpacing: "0.15em", textDecoration: "none", fontWeight: 600 }}>Location</a>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Family / blessing card */}
            {(W.brideFamilyName || W.groomFamilyName) && (
              <motion.div style={{ ...cardStyle() }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={eyebrow(PRIMARY)}>🎖️ Our Families</div>
                <div style={{ ...ts('message'), textAlign: "center", padding: "14px 12px", background: `${PRIMARY_LIGHT}22`, borderRadius: 4, fontSize: 13, color: DARK, lineHeight: 2 }}>
                  {W.groomFamilyName && <><strong>{W.groomFamilyName}</strong><br /></>}
                  {W.groomFamilyName && W.brideFamilyName && <div style={{ fontSize: 11, color: MUTED, margin: "2px 0" }}>together with</div>}
                  {W.brideFamilyName && <><strong>{W.brideFamilyName}</strong><br /></>}
                  <span style={{ color: MUTED }}>
                    {((couple as any).family_invitation_text || "request the honour of your presence\nto celebrate the marriage of their loving children")
                      .split('\n').map((l: string, i: number, arr: string[]) => <span key={i}>{l}{i < arr.length - 1 && <br />}</span>)}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Events */}
            {eventsList.map(ev => {
              const evDate = new Date(ev.date)
              const evDateDisplay = evDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
              const evTimeDisplay = evDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) + ' Onwards'
              return (
                <motion.div key={ev.key} style={{ ...cardStyle() }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <div style={eyebrow(PRIMARY)}>{ev.icon} Save the Date</div>
                  <div style={heading(DARK)}>{ev.label}</div>
                  {[
                    { icon: "📅", label: "Date", val: evDateDisplay, tsKey: '' },
                    { icon: "⏰", label: "Time", val: evTimeDisplay, tsKey: '' },
                    { icon: "📍", label: "Venue", val: ev.venue, sub: ev.venue_address, tsKey: 'venue_name', subTsKey: 'venue_address' },
                    ...(ev.dress_code ? [{ icon: "🎽", label: "Dress Code", val: ev.dress_code, tsKey: 'dress_code' }] : []),
                  ].map((d: any) => (
                    <div key={d.label} style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "12px 0", borderBottom: `1px solid ${PRIMARY_LIGHT}55` }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${PRIMARY_LIGHT}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>{d.icon}</div>
                      <div>
                        <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: `${PRIMARY}99` }}>{d.label}</div>
                        <div style={{ ...(d.tsKey ? ts(d.tsKey) : {}), fontSize: 15, color: DARK, fontWeight: 700, marginTop: 2 }}>{d.val}</div>
                        {d.sub && <div style={{ ...(d.subTsKey ? ts(d.subTsKey) : {}), fontSize: 12, color: MUTED, marginTop: 2 }}>{d.sub}</div>}
                      </div>
                    </div>
                  ))}
                  {ev.maps_url && (
                    <a href={normalizeMapsUrl(ev.maps_url)} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: `${PRIMARY_LIGHT}33`, borderRadius: 2, padding: "10px 20px", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: PRIMARY, marginTop: 16, textDecoration: "none", fontWeight: 700 }}>
                      📍 View Location on Maps
                    </a>
                  )}
                </motion.div>
              )
            })}

            {/* Countdown */}
            {sv.countdown && (
              <motion.div id="savethedate" style={{ ...cardStyle(), textAlign: "center" }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={{ ...eyebrow(PRIMARY), ...ts('countdown_label') }}>Counting Down to Our Big Day</div>
                <Countdown targetDate={W.date} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} />
              </motion.div>
            )}

            {/* RSVP */}
            <div id="rsvp"><RSVP coupleId={couple.id} askDrinking={couple.ask_drinking} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} cream={CREAM} muted={MUTED} guestName={guestName} /></div>

            {/* Timeline */}
            {sv.timeline && W.timeline.length > 0 && (
              <motion.div style={{ ...cardStyle() }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={eyebrow(PRIMARY)}>Our Celebration</div>
                <div style={heading(DARK)}>Order of the Day</div>
                <div style={{ position: "relative", paddingLeft: 20 }}>
                  <div style={{ position: "absolute", left: 6, top: 0, bottom: 0, width: 1, background: PRIMARY_LIGHT }} />
                  {W.timeline.map((t, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} style={{ position: "relative", padding: "10px 0 10px 20px" }}>
                      <div style={{ position: "absolute", left: -14, top: 14, width: 10, height: 10, borderRadius: "50%", background: PRIMARY, border: "2px solid #fff", boxShadow: `0 0 0 2px ${PRIMARY_LIGHT}` }} />
                      <div style={{ fontSize: 11, fontWeight: 600, color: PRIMARY, letterSpacing: "0.1em" }}>{t.time}</div>
                      <div style={{ fontSize: 13, color: DARK, fontWeight: 500, marginTop: 2 }}>{t.event}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Gift */}
            {giftEnabled && hasGiftDetails && (
              <motion.div style={{ ...cardStyle() }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={eyebrow(PRIMARY)}>With Gratitude</div>
                <div style={heading(DARK)}>Send a Gift</div>
                <div style={{ fontSize: 12, color: MUTED, textAlign: "center", marginBottom: 18 }}>With all due respect, you may share your gifts through the following accounts.</div>
                <div style={{ display: "grid", gap: 12 }}>
                  {brideBank.accountNumber && <GiftAccountCard label={W.bride} bankName={brideBank.bank} accountName={brideBank.accountName} accountNumber={brideBank.accountNumber} primary={PRIMARY} muted={MUTED} dark={DARK} />}
                  {groomBank.accountNumber && <GiftAccountCard label={W.groom} bankName={groomBank.bank} accountName={groomBank.accountName} accountNumber={groomBank.accountNumber} primary={PRIMARY} muted={MUTED} dark={DARK} />}
                </div>
              </motion.div>
            )}

            {/* Gallery */}
            {sv.gallery && W.gallery.length > 0 && (
              <motion.div id="gallery" style={{ ...cardStyle() }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={eyebrow(PRIMARY)}>Our Story</div>
                <div style={heading(DARK)}>Moments of Love</div>
                <div style={{ columnCount: 2, columnGap: 8 }}>
                  {W.gallery.map((src, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: (i % 6) * 0.06 }}
                      style={{ breakInside: "avoid", marginBottom: 8, borderRadius: 4, overflow: "hidden", background: `${PRIMARY_LIGHT}33` }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" style={{ width: "100%", height: "auto", display: "block" }} onError={e => (e.currentTarget.closest('div') as HTMLElement).style.display = "none"} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Guest Wishes Wall */}
            {((couple as any).enable_guest_wishes ?? false) && (
              <motion.div id="wishes" style={{ ...cardStyle() }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={eyebrow(PRIMARY)}>With Love</div>
                <div style={heading(DARK)}>Wishes for Us</div>
                <div style={{ fontSize: 12.5, color: MUTED, textAlign: "center", marginBottom: 16, marginTop: -8 }}>Share your wishes and blessings with {W.bride} &amp; {W.groom}.</div>
                <WishesWall coupleId={couple.id} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} cream={CREAM} muted={MUTED} />
              </motion.div>
            )}

            {/* Seat finder */}
            {sv.seat_finder && couple.show_seating && Object.keys(W.seats).length > 0 && (
              <motion.div style={{ ...cardStyle() }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={eyebrow(PRIMARY)}>Be Our Guest</div>
                <div style={heading(DARK)}>Find Your Table</div>
                <SeatFinder seats={W.seats} primary={PRIMARY} dark={DARK} cream={CREAM} muted={MUTED} />
              </motion.div>
            )}

            {/* Music */}
            {sv.music && (
              <motion.div style={{ ...cardStyle() }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={eyebrow(PRIMARY)}>Our Song</div>
                {youtubeId ? (
                  <div style={{ borderRadius: 12, overflow: "hidden", aspectRatio: "16/9" }}>
                    <iframe src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ width: "100%", height: "100%", border: "none", display: "block" }} />
                  </div>
                ) : (
                  <MusicPlayerUI title={W.song} artist={W.artist} audioRef={audioRef} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} muted={MUTED} />
                )}
              </motion.div>
            )}

            {/* Wedding Note */}
            {((couple as any).show_wedding_note ?? true) && (couple as any).wedding_note_text && (couple as any).wedding_note_text.trim() && (
              <motion.div style={{ ...cardStyle(), textAlign: "center" }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={eyebrow(PRIMARY)}>💌 A Note For You</div>
                {guestName && <div style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: PRIMARY, marginBottom: 8, fontWeight: 700 }}>Dear {guestName}</div>}
                <div style={{ fontSize: "0.95rem", color: DARK, opacity: 0.85, lineHeight: 1.9, fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", maxWidth: 340, margin: "0 auto 16px" }}>
                  {(couple as any).wedding_note_text.split('\n').map((l: string, i: number, arr: string[]) => <span key={i}>{l}{i < arr.length - 1 && <br />}</span>)}
                </div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.6rem", color: PRIMARY }}>{W.bride}<span style={{ margin: "0 8px" }}>&amp;</span>{W.groom}</div>
              </motion.div>
            )}

            {/* Contact Numbers */}
            {contactList.length > 0 && (
              <motion.div id="contact" style={{ ...cardStyle() }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={eyebrow(PRIMARY)}>Get In Touch</div>
                <div style={heading(DARK)}>Contact Numbers</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {contactList.map((c, i) => <ContactRow key={i} name={c.name} phone={c.phone} primary={PRIMARY} dark={DARK} />)}
                </div>
              </motion.div>
            )}

            {/* Thank you */}
            {sv.thank_you && (
              <motion.div style={{ ...cardStyle() }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={eyebrow(PRIMARY)}>A Special Note</div>
                <div style={heading(DARK)}>To Our Lovely Guests</div>
                <div style={{ textAlign: "center", fontSize: 13, color: DARK, lineHeight: 2 }}>
                  {(couple as any).thank_you_text || "With hearts full of love and gratitude, we are so happy to celebrate this beautiful chapter of our lives with you. Thank you for your love, your blessings, and for being part of our journey."}
                </div>
                <div style={{ textAlign: "center", marginTop: 18 }}>
                  <div style={{ fontSize: 11, color: MUTED, letterSpacing: "0.1em" }}>With all our love,</div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.8rem", color: PRIMARY, marginTop: 4 }}>{W.bride} &amp; {W.groom}</div>
                </div>
              </motion.div>
            )}

            <div style={{ padding: "2rem 1.5rem 6rem", textAlign: "center", background: "#fff", borderTop: `1px solid ${PRIMARY_LIGHT}` }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}><Insignia color={PRIMARY} size={36} opacity={0.6} /></div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.4rem", color: PRIMARY, marginBottom: 4 }}>InviteGlow</div>
              <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: MUTED }}>inviteglow.com · Digital Wedding Invitations</div>
              {((couple as any).enable_footer_social ?? true) && <FooterSocial color={PRIMARY} background={`${PRIMARY}14`} />}
            </div>
          </motion.div>
        )}
      </div>
      {opened && (
        <BottomNavBar
          primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK}
          mapsUrl={eventsList[0]?.maps_url || couple.maps_url || ''}
          hasWishes={(couple as any).enable_guest_wishes ?? false}
          hasGallery={sv.gallery && W.gallery.length > 0}
          hasContact={contactList.length > 0}
          audioRef={audioRef}
        />
      )}
    </div>
  )
}
