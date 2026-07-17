"use client"
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, Couple } from '@/lib/supabase'

const DEFAULT_PHOTO = "/images/hero-elegant.jpg"
const DEFAULT_SONG_URL = "/audio/calm-wedding.mp3"
const DEFAULT_SONG_TITLE = "Calm Wedding Theme"
const DEFAULT_SONG_ARTIST = "InviteGlow"

// ── Default palette for this template — overridden by couple.custom_colors ──
const DEFAULT_PALETTE = {
  primary: "#c9a06e",
  primaryLight: "#e8d5a0",
  dark: "#2d2424",
  cream: "#faf6f4",
  muted: "#a89888",
}

// ── Guest intro screen — "Dear [Name]," shown for ~5s before the cover,
// styled to match this template's warm frosted-glass aesthetic. Only
// appears when the invite link includes ?name=..., and can be turned off
// entirely from admin via couple.show_guest_intro (defaults to on). ──
function GuestIntroScreen({ guestName, onDone, primary, dark, cream }: {
  guestName: string; onDone: () => void; primary: string; dark: string; cream: string
}) {
  return (
    <motion.div
      key="intro"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: "easeInOut" }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: `radial-gradient(ellipse 80% 60% at 30% 20%, #2a1810 0%, #14100e 45%, #0a0807 100%)`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "2rem", overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${primary}33, transparent)`, top: "22%", left: "50%", transform: "translateX(-50%)" }} />

      <motion.div
        initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: [0.4, 1.1, 1], opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
        style={{
          width: 76, height: 76, borderRadius: "50%", marginBottom: "1.6rem", position: "relative", zIndex: 1,
          background: "rgba(255,255,255,0.08)", backdropFilter: "blur(6px)", border: `1.5px solid ${primary}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <span style={{ fontSize: 30 }}>💌</span>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.9 }}
        style={{ position: "relative", zIndex: 1, marginBottom: "1rem" }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontWeight: 300, fontSize: "clamp(1.8rem,6.5vw,2.6rem)", color: "#fff", lineHeight: 1.2 }}>
          Dear <span style={{ color: primary, fontWeight: 500 }}>{guestName}</span>,
        </div>
      </motion.div>

      <motion.div initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ duration: 0.6, delay: 1.3 }}
        style={{ width: 56, height: 1, background: `linear-gradient(to right, transparent, ${primary}, transparent)`, margin: "0 auto 1rem" }} />

      <motion.div initial={{ opacity: 0, letterSpacing: "0.1em" }} animate={{ opacity: 1, letterSpacing: "0.4em" }} transition={{ duration: 0.9, delay: 1.6 }}
        style={{ fontSize: 10, textTransform: "uppercase", color: "rgba(255,255,255,0.55)", fontFamily: "'Inter',sans-serif" }}>
        You're Invited
      </motion.div>

      <motion.div
        style={{ position: "absolute", bottom: 0, left: 0, height: 3, background: `linear-gradient(to right,#d4524a,#e0a23a)`, borderRadius: 100 }}
        initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 5, ease: "linear", delay: 0.4 }}
        onAnimationComplete={onDone}
      />

      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: 2 }}
        onClick={onDone}
        style={{ position: "absolute", bottom: 20, right: 20, background: "transparent", border: "none", cursor: "pointer", fontSize: 12, color: primary, fontFamily: "'Inter',sans-serif", letterSpacing: "0.1em" }}>
        Skip →
      </motion.button>
    </motion.div>
  )
}

// ── Countdown — circular style ──
function Countdown({ targetDate, primary, primaryLight, dark, muted }: { targetDate: string; primary: string; primaryLight: string; dark: string; muted: string }) {
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
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fff", border: `1.5px solid ${primaryLight}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", boxShadow: `0 4px 16px ${primary}1a` }}>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.3rem", fontWeight: 500, color: dark }}>{v}</span>
          </div>
          <span style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: muted }}>{l}</span>
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
    <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#faf6f4", borderRadius: 16, padding: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: playing ? "50%" : 10, background: `linear-gradient(135deg,${primary},${dark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, animation: playing ? "spin 4s linear infinite" : "none" }}>🎵</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: dark }}>{title}</div>
        <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{artist}</div>
        <div style={{ height: 3, background: `${primary}26`, borderRadius: 100, marginTop: 8 }}>
          <div style={{ height: "100%", width: `${prog}%`, background: `linear-gradient(to right,${primary},${primaryLight})`, borderRadius: 100, transition: "width 0.3s" }} />
        </div>
      </div>
      <button onClick={toggle} style={{ width: 40, height: 40, borderRadius: "50%", background: dark, border: "none", color: "#fff", cursor: "pointer", fontSize: 14, flexShrink: 0 }}>
        {playing ? "⏸" : "▶"}
      </button>
    </div>
  )
}

// ── RSVP — name → guest count → drinking (optional) → done ──
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
  const handleAccept = () => { if (name.trim()) setStep("count") }
  const handleDecline = () => { if (name.trim()) save("no", null, 1) }
  const handleCountNext = () => { if (askDrinking) setStep("drinking"); else save("yes", null, guestCount) }

  const inputStyle: React.CSSProperties = { width: "100%", padding: "13px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "#3a302f", color: "#fff", fontSize: 14, outline: "none", marginBottom: 12, fontFamily: "'Inter',sans-serif" }

  return (
    <div style={{ background: "#2d2424", padding: "40px 1.5rem", textAlign: "center" }}>
      <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: primary, marginBottom: 8, fontWeight: 600 }}>Be Our Guest</div>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.8rem", color: "#fff", marginBottom: 8 }}>Will You Join Us?</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>It only takes a few seconds to RSVP</div>
      <div style={{ background: "#3a302f", borderRadius: 16, padding: 24, maxWidth: 380, margin: "0 auto" }}>

        {step === "form" && (
          <>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" style={inputStyle} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={handleAccept} style={{ padding: 13, borderRadius: 10, background: primary, color: "#2d2424", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✓ Accept</button>
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
              <button onClick={() => setGuestCount(c => Math.max(1, c - 1))} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.08)", color: primary, border: "none", cursor: "pointer", fontSize: 16 }}>−</button>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.8rem", color: "#fff", minWidth: 40 }}>{guestCount}</div>
              <button onClick={() => setGuestCount(c => Math.min(20, c + 1))} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.08)", color: primary, border: "none", cursor: "pointer", fontSize: 16 }}>+</button>
            </div>
            <button onClick={handleCountNext} disabled={saving} style={{ width: "100%", padding: 13, borderRadius: 10, background: primary, color: "#2d2424", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, opacity: saving ? 0.6 : 1 }}>
              {saving ? "..." : "Continue →"}
            </button>
          </motion.div>
        )}

        {step === "drinking" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 14 }}>Will you be having alcohol?</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={() => save("yes", "yes", guestCount)} disabled={saving} style={{ padding: 13, borderRadius: 10, background: `${primary}26`, color: primary, border: `1px solid ${primary}4d`, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>🍷 Yes</button>
              <button onClick={() => save("yes", "no", guestCount)} disabled={saving} style={{ padding: 13, borderRadius: 10, background: `${primary}26`, color: primary, border: `1px solid ${primary}4d`, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>🥤 No</button>
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
function SeatFinder({ seats, primary, dark, cream, muted }: { seats: Record<string, string>; primary: string; dark: string; cream: string; muted: string }) {
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
          placeholder="Enter your name..." style={{ flex: 1, padding: "13px 16px", borderRadius: 10, border: `1px solid ${primary}33`, background: cream, color: dark, fontSize: 14, outline: "none", fontFamily: "'Inter',sans-serif" }} />
        <button onClick={search} style={{ padding: "13px 20px", borderRadius: 10, background: dark, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Search</button>
      </div>
      {res && <div style={{ marginTop: 12, fontSize: 14, color: res.startsWith("You") ? primary : muted, fontWeight: res.startsWith("You") ? 600 : 400 }}>{res}</div>}
    </div>
  )
}

// ── Guest Wishes Wall ──────────────────────────────────────────────
type WishMedia = { url: string; type: 'photo' | 'video' }
type Wish = {
  id: string
  couple_id: string
  guest_name: string
  message: string
  photo_url: string | null
  video_url: string | null
  media: WishMedia[] | null
  created_at: string
}

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

function WishLightbox({ media, index, onIndex, onClose }: {
  media: WishMedia[]; index: number; onIndex: (i: number) => void; onClose: () => void
}) {
  const current = media[index]
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(10,8,6,0.92)", zIndex: 500,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", maxWidth: "92vw", maxHeight: "86vh" }}>
        {current.type === 'video' ? (
          <video src={current.url} controls autoPlay style={{ maxWidth: "92vw", maxHeight: "86vh", display: "block", borderRadius: 10 }} />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={current.url} alt="" style={{ maxWidth: "92vw", maxHeight: "86vh", display: "block", borderRadius: 10, objectFit: "contain" }} />
        )}
        <button onClick={onClose} aria-label="Close" style={{
          position: "absolute", top: -40, right: 0, background: "transparent", border: "none",
          color: "#fff", fontSize: 26, cursor: "pointer", lineHeight: 1,
        }}>×</button>
        {media.length > 1 && (
          <>
            <button onClick={() => onIndex((index - 1 + media.length) % media.length)} aria-label="Previous" style={{
              position: "absolute", left: -18, top: "50%", transform: "translate(-100%,-50%)",
              width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none",
              color: "#fff", fontSize: 20, cursor: "pointer",
            }}>‹</button>
            <button onClick={() => onIndex((index + 1) % media.length)} aria-label="Next" style={{
              position: "absolute", right: -18, top: "50%", transform: "translate(100%,-50%)",
              width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none",
              color: "#fff", fontSize: 20, cursor: "pointer",
            }}>›</button>
            <div style={{ position: "absolute", bottom: -30, left: "50%", transform: "translateX(-50%)", color: "#fff", fontSize: 12, opacity: 0.8 }}>
              {index + 1} / {media.length}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function WishMediaGrid({ media, onOpen }: { media: WishMedia[]; onOpen: (index: number) => void }) {
  if (media.length === 0) return null
  const shown = media.slice(0, 4)
  const isSingle = media.length === 1
  return (
    <div style={{ display: "grid", gridTemplateColumns: isSingle ? "1fr" : "repeat(2, 1fr)", gap: 4, marginBottom: 6, borderRadius: 10, overflow: "hidden" }}>
      {shown.map((m, idx) => {
        const isMoreTile = idx === 3 && media.length > 4
        return (
          <div key={idx} onClick={() => onOpen(idx)} style={{
            position: "relative", cursor: "pointer", overflow: "hidden",
            height: isSingle ? 140 : undefined, aspectRatio: isSingle ? undefined : "1 / 1", background: "#000",
          }}>
            {isSingle && m.type === 'photo' && (
              <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${m.url})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(16px) brightness(0.7)", transform: "scale(1.15)" }} />
            )}
            {m.type === 'video' ? (
              <video src={m.url} muted style={{ position: isSingle ? "relative" : "static", zIndex: 1, width: "100%", height: "100%", objectFit: isSingle ? "contain" : "cover", display: "block" }} />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={m.url} alt="" style={{ position: isSingle ? "relative" : "static", zIndex: 1, width: "100%", height: "100%", objectFit: isSingle ? "contain" : "cover", display: "block" }} />
            )}
            {isMoreTile && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(10,8,6,0.55)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, fontWeight: 700, zIndex: 2 }}>
                +{media.length - 4}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function WishesWall({ coupleId, primary, primaryLight, dark, cream, muted }: {
  coupleId: string; primary: string; primaryLight: string; dark: string; cream: string; muted: string
}) {
  const [wishes, setWishes] = useState<Wish[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [page, setPage] = useState(0)
  const PER_PAGE = 3
  const [lightbox, setLightbox] = useState<{ media: WishMedia[]; index: number } | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      const { data } = await supabase.from('wishes').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false })
      if (active && data) setWishes(data as Wish[])
      setLoading(false)
    }
    load()
    const channel = supabase
      .channel(`wishes-${coupleId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wishes', filter: `couple_id=eq.${coupleId}` }, () => load())
      .subscribe()
    return () => { active = false; supabase.removeChannel(channel) }
  }, [coupleId])

  const submit = async () => {
    if (!name.trim() || !message.trim()) {
      setError('Please add your name and a message.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const media: WishMedia[] = []
      for (const f of files) {
        const { url, isVideo } = await uploadWishMedia(f, coupleId)
        media.push({ url, type: isVideo ? 'video' : 'photo' })
      }
      const { error: insertError } = await supabase.from('wishes').insert([{
        couple_id: coupleId, guest_name: name.trim(), message: message.trim(), media,
      }])
      if (insertError) throw insertError
      setName('')
      setMessage('')
      setFiles([])
      setDone(true)
    } catch {
      setError('Something went wrong — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '11px 14px', borderRadius: 10, border: `1px solid ${primary}33`, background: cream, color: dark, fontSize: 13, outline: 'none', marginBottom: 10, boxSizing: 'border-box', fontFamily: "'Inter',sans-serif" }

  return (
    <div>
      <div style={{ background: cream, borderRadius: 16, padding: '18px 16px', textAlign: 'left', marginBottom: 18 }}>
        {done ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: dark }}>Thank you for your wish!</div>
            <div style={{ fontSize: 12, color: muted, marginTop: 4 }}>It's now on the wall below.</div>
            <button onClick={() => setDone(false)} style={{
              marginTop: 12, padding: '8px 18px', borderRadius: 100, border: 'none', cursor: 'pointer',
              background: `${primary}22`, color: dark, fontSize: 12, fontWeight: 700,
            }}>Leave another wish</button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: dark, marginBottom: 10 }}>Leave a Wish</div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inputStyle} />
            <textarea
              value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your wishes for the couple..." rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: dark, opacity: 0.7,
              padding: '9px 13px', borderRadius: 10, border: `1px dashed ${primary}`, cursor: 'pointer', marginBottom: files.length ? 6 : 10,
            }}>
              📷 {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} selected — add more` : 'Add photos or a video (optional)'}
              <input type="file" accept="image/*,video/*" multiple
                onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files || [])].slice(0, 6))}
                style={{ display: 'none' }} />
            </label>
            {files.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {files.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: dark, background: `${primary}22`, borderRadius: 100, padding: '4px 9px' }}>
                    {f.name.length > 16 ? f.name.slice(0, 14) + '…' : f.name}
                    <span onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} style={{ cursor: 'pointer', fontWeight: 700 }}>×</span>
                  </div>
                ))}
              </div>
            )}
            {error && <div style={{ fontSize: 11.5, color: primary, marginBottom: 8 }}>{error}</div>}
            <button onClick={submit} disabled={submitting} style={{
              width: '100%', padding: 12, borderRadius: 10, border: 'none', cursor: 'pointer',
              background: dark, color: '#fff', fontWeight: 700, fontSize: 13, fontFamily: "'Inter',sans-serif", opacity: submitting ? 0.6 : 1,
            }}>{submitting ? 'Sending...' : 'Send Wish'}</button>
          </>
        )}
      </div>

      {loading ? (
        <div style={{ fontSize: 12, color: muted, textAlign: 'center' }}>Loading wishes...</div>
      ) : wishes.length === 0 ? (
        <div style={{ fontSize: 12, color: muted, textAlign: 'center' }}>Be the first to leave a wish!</div>
      ) : (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: dark, textAlign: 'center', marginBottom: 14 }}>
            {wishes.length} {wishes.length === 1 ? 'Wish' : 'Wishes'}
          </div>
          {wishes.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE).map((w, i, arr) => {
            const mediaList = getWishMedia(w)
            return (
              <div key={w.id} style={{ padding: '12px 0', borderBottom: i < arr.length - 1 ? `1px solid ${primary}22` : 'none', textAlign: 'left' }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: primary, marginBottom: 4 }}>{w.guest_name}</div>
                <div style={{ fontSize: 13, color: dark, opacity: 0.85, lineHeight: 1.7, marginBottom: mediaList.length ? 10 : 6, whiteSpace: 'pre-wrap' }}>{w.message}</div>
                <WishMediaGrid media={mediaList} onOpen={idx => setLightbox({ media: mediaList, index: idx })} />
                <div style={{ fontSize: 10.5, color: muted }}>
                  {new Date(w.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            )
          })}
          {wishes.length > PER_PAGE && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${primary}22`, flexWrap: 'wrap' }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{
                background: 'transparent', border: 'none', cursor: page === 0 ? 'default' : 'pointer',
                fontSize: 12, fontWeight: 700, color: primary, opacity: page === 0 ? 0.35 : 1,
              }}>← Previous</button>
              {Array.from({ length: Math.ceil(wishes.length / PER_PAGE) }).map((_, i) => (
                <button key={i} onClick={() => setPage(i)} style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: i === page ? 800 : 600, color: i === page ? dark : primary,
                  textDecoration: i === page ? 'underline' : 'none', padding: '2px 4px',
                }}>{i + 1}</button>
              ))}
              <button onClick={() => setPage(p => (p + 1) * PER_PAGE < wishes.length ? p + 1 : p)}
                disabled={(page + 1) * PER_PAGE >= wishes.length} style={{
                background: 'transparent', border: 'none', cursor: (page + 1) * PER_PAGE >= wishes.length ? 'default' : 'pointer',
                fontSize: 12, fontWeight: 700, color: primary, opacity: (page + 1) * PER_PAGE >= wishes.length ? 0.35 : 1,
              }}>Next →</button>
            </div>
          )}
        </div>
      )}
      {lightbox && (
        <WishLightbox media={lightbox.media} index={lightbox.index} onIndex={i => setLightbox(l => l && { ...l, index: i })} onClose={() => setLightbox(null)} />
      )}
    </div>
  )
}

const sectionCard: React.CSSProperties = { background: "#fff", margin: "0 16px 16px", borderRadius: 22, padding: "1.8rem", boxShadow: "0 2px 24px rgba(0,0,0,0.05)" }
const sectionEyebrowStyle = (primary: string): React.CSSProperties => ({ fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color: primary, textAlign: "center", marginBottom: 6, fontWeight: 600 })
const sectionTitleStyle = (dark: string): React.CSSProperties => ({ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.5rem", color: dark, textAlign: "center", marginBottom: 20 })

export default function ElegantPhotoTemplate({ couple }: { couple: Couple }) {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#e8ddd4" }} />}>
      <ElegantPhotoInner couple={couple} />
    </Suspense>
  )
}

function ElegantPhotoInner({ couple }: { couple: Couple }) {
  const searchParams = useSearchParams()
  const guestName = searchParams?.get('name') || ''
  const introEnabled = (couple as any).show_guest_intro !== false
  const [showIntro, setShowIntro] = useState(!!guestName && introEnabled)
  const [opened, setOpened] = useState(false)
  const audioRef = useState<{ current: HTMLAudioElement | null }>({ current: null })[0]

  // ── Resolve this couple's colors: their custom_colors override the default palette ──
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

  const handleEnter = () => {
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

      {/* ══ GUEST INTRO SCREEN ══ */}
      <AnimatePresence>
        {showIntro && guestName && (
          <GuestIntroScreen guestName={guestName} onDone={() => setShowIntro(false)} primary={PRIMARY} dark={DARK} cream={CREAM} />
        )}
      </AnimatePresence>

      <div style={{ maxWidth: 480, margin: "0 auto", background: CREAM, boxShadow: "0 0 100px rgba(0,0,0,0.12)", position: "relative", borderRadius: 0, overflow: "hidden" }}>

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
                {guestName ? `Dear ${guestName}` : 'You Are Invited'}
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
                  <a href="#rsvp" style={{ background: DARK, color: "#fff", borderRadius: 100, padding: "10px 20px", fontSize: 11, letterSpacing: "0.1em", textDecoration: "none", fontWeight: 500 }}>RSVP</a>
                  <a href="#location" style={{ background: "rgba(255,255,255,0.9)", color: DARK, borderRadius: 100, padding: "10px 20px", fontSize: 11, letterSpacing: "0.1em", textDecoration: "none", fontWeight: 500 }}>Location</a>
                </div>
              </div>
            </div>

            {/* Formal invite */}
            {(W.brideFamilyName || W.groomFamilyName) && (
              <motion.div style={sectionCard} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={sectionEyebrowStyle(PRIMARY)}>With Love</div>
                <div style={{ textAlign: "center", fontSize: 13, color: "#6a5a4a", lineHeight: 2 }}>
                  {W.brideFamilyName && <><strong style={{ color: DARK }}>{W.brideFamilyName}</strong><br /></>}
                  {W.brideFamilyName && W.groomFamilyName && <>&amp;<br /></>}
                  {W.groomFamilyName && <><strong style={{ color: DARK }}>{W.groomFamilyName}</strong><br /></>}
                  request the honour of your presence<br />to celebrate the marriage of their loving children
                </div>
              </motion.div>
            )}

            {eventsList.map(ev => {
              const evDate = new Date(ev.date)
              const evDateDisplay = evDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
              const evTimeDisplay = evDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
              return (
                <div key={ev.key}>
                  {/* Event details strip (dark) */}
                  <div style={{ background: "#2d2424", margin: "0 16px 16px", borderRadius: 22, overflow: "hidden" }}>
                    <div style={{ padding: "14px 20px 0", textAlign: "center", fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "#f0d4a8" }}>{ev.icon} {ev.label}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "rgba(255,255,255,0.06)", marginTop: 12 }}>
                      {[
                        { icon: "📅", label: "Date", val: evDateDisplay, gold: true },
                        { icon: "⏰", label: "Time", val: `${evTimeDisplay} Onwards` },
                        { icon: "📍", label: "Venue", val: ev.venue },
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

                  {/* Event location */}
                  {ev.maps_url && (
                    <motion.div style={sectionCard} id={ev.key === eventsList[0]?.key ? "location" : undefined} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                      <div style={sectionEyebrowStyle(PRIMARY)}>Find Us</div>
                      <div style={sectionTitleStyle(DARK)}>{ev.label} Venue</div>
                      <a href={ev.maps_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block" }}>
                        <div style={{ background: CREAM, borderRadius: 16, padding: 24, textAlign: "center" }}>
                          <div style={{ width: 48, height: 48, borderRadius: "50%", background: DARK, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 18 }}>🗺️</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: DARK, marginBottom: 4 }}>{ev.venue}</div>
                          <div style={{ fontSize: 11, color: MUTED, marginBottom: 14 }}>{ev.venue_address}</div>
                          <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: PRIMARY, fontWeight: 600 }}>Tap to View on Maps →</div>
                        </div>
                      </a>
                    </motion.div>
                  )}
                </div>
              )
            })}

            {/* Countdown */}
            {sv.countdown && (
              <div style={{ background: "#fff", padding: "1.5rem 1rem", textAlign: "center", margin: "0 16px 16px", borderRadius: 22, boxShadow: "0 2px 24px rgba(45,36,36,0.05)" }}>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.2rem", color: DARK, marginBottom: 16 }}>Counting down to our big day</div>
                <Countdown targetDate={W.date} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} muted={MUTED} />
              </div>
            )}

            {/* Timeline */}
            {sv.timeline && W.timeline.length > 0 && (
              <motion.div style={sectionCard} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={sectionEyebrowStyle(PRIMARY)}>The Celebration</div>
                <div style={sectionTitleStyle(DARK)}>Wedding Day Schedule</div>
                {W.timeline.map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 0", borderBottom: i < W.timeline.length - 1 ? "1px solid #f3e9e3" : "none" }}>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1rem", color: PRIMARY, minWidth: 70 }}>{t.time}</div>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: DARK, flexShrink: 0 }} />
                    <div style={{ fontSize: 13, color: DARK, fontWeight: 500, flex: 1 }}>{t.event}</div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* RSVP */}
            <div id="rsvp" style={{ margin: "0 16px 16px", borderRadius: 22, overflow: "hidden" }}>
              <RSVP coupleId={couple.id} askDrinking={couple.ask_drinking} primary={PRIMARY} guestName={guestName} />
            </div>

            {/* Guest Wishes Wall */}
            {((couple as any).enable_guest_wishes ?? false) && (
              <motion.div style={sectionCard} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={sectionEyebrowStyle(PRIMARY)}>With Love</div>
                <div style={sectionTitleStyle(DARK)}>Wishes for Us</div>
                <div style={{ fontSize: 12.5, color: MUTED, textAlign: "center", marginBottom: 16, marginTop: -8 }}>
                  Share your wishes and blessings with {W.bride} &amp; {W.groom}.
                </div>
                <WishesWall coupleId={couple.id} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} cream={CREAM} muted={MUTED} />
              </motion.div>
            )}

            {/* Seat finder */}
            {sv.seat_finder && couple.show_seating && Object.keys(W.seats).length > 0 && (
              <motion.div style={sectionCard} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={sectionEyebrowStyle(PRIMARY)}>Be Our Guest</div>
                <div style={sectionTitleStyle(DARK)}>Find Your Table</div>
                <div style={{ fontSize: 13, color: MUTED, marginBottom: 12, textAlign: "center" }}>Search your name to find your assigned table</div>
                <SeatFinder seats={W.seats} primary={PRIMARY} dark={DARK} cream={CREAM} muted={MUTED} />
              </motion.div>
            )}

            {/* Music */}
            {sv.music && (
              <motion.div style={sectionCard} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={sectionEyebrowStyle(PRIMARY)}>Our Song</div>
                <MusicPlayerUI title={W.song} artist={W.artist} audioRef={audioRef} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} muted={MUTED} />
              </motion.div>
            )}

            {/* Gallery */}
            {sv.gallery && W.gallery.length > 0 && (
              <motion.div style={sectionCard} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={sectionEyebrowStyle(PRIMARY)}>Our Story</div>
                <div style={sectionTitleStyle(DARK)}>Moments Together</div>
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
            {sv.thank_you && (
              <motion.div style={sectionCard} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={sectionEyebrowStyle(PRIMARY)}>A Special Note</div>
                <div style={sectionTitleStyle(DARK)}>To Our Lovely Guests</div>
                <div style={{ textAlign: "center", fontSize: 13, color: "#6a5a4a", lineHeight: 2 }}>
                  With hearts full of love and gratitude, we are so happy to celebrate this beautiful chapter of our lives with you. Your presence means more to us than words can truly express.
                  <br /><br />
                  Thank you for your love, your blessings, and for being part of our journey.
                </div>
                <div style={{ textAlign: "center", marginTop: 16 }}>
                  <div style={{ fontSize: 11, color: MUTED }}>With all our love,</div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.5rem", color: PRIMARY, marginTop: 4 }}>{W.bride} &amp; {W.groom}</div>
                </div>
              </motion.div>
            )}

            {/* Footer */}
            <div style={{ padding: "2rem 1.5rem", textAlign: "center", background: CREAM }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.3rem", color: PRIMARY, marginBottom: 4 }}>InviteGlow</div>
              <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "#c4b5a8" }}>inviteglow.com · Digital Wedding Invitations</div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
