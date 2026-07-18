"use client"
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, Couple } from '@/lib/supabase'
import FooterSocial from '@/components/shared/FooterSocial'

const DEFAULT_PHOTO = "/images/hero-floral.png"
const DEFAULT_COVER_VIDEO = "https://eqacrwhbrfqcnlgegvtl.supabase.co/storage/v1/object/public/wedding-photos/videos/eternal-bloom-cover.mp4"
const DEFAULT_SONG_URL = "/audio/calm-wedding.mp3"
const DEFAULT_SONG_TITLE = "Calm Wedding Theme"
const DEFAULT_SONG_ARTIST = "InviteGlow"

// Botanical, lush-green palette — moss/sage tones on warm ivory.
const DEFAULT_PALETTE = {
  primary: "#5c7a52",
  primaryLight: "#b9cdae",
  dark: "#2d3d28",
  cream: "#f8f6ee",
  muted: "#8a9a80",
}

// ── Leaf divider — the signature organic motif for this template, used
// instead of geometric dots/diamonds anywhere Ceylon Elegance-style
// dividers would normally go. ──
function LeafDivider({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
      <div style={{ width: 34, height: 1, background: color, opacity: 0.4 }} />
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 2C7 6 4 11 4 15a8 8 0 0016 0c0-4-3-9-8-13z" fill={color} opacity="0.8" />
        <path d="M12 4v16" stroke="#fff" strokeWidth="0.8" opacity="0.5" />
      </svg>
      <div style={{ width: 34, height: 1, background: color, opacity: 0.4 }} />
    </div>
  )
}

// ── Guest intro screen ──
function GuestIntroScreen({ guestName, onDone, primary, primaryLight, dark, cream }: {
  guestName: string; onDone: () => void; primary: string; primaryLight: string; dark: string; cream: string
}) {
  return (
    <motion.div key="intro" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1, ease: "easeInOut" }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: `linear-gradient(160deg, ${cream} 0%, #eef2e6 45%, ${cream} 100%)`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "2rem", overflow: "hidden",
      }}>
      <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${primaryLight}44, transparent)`, top: "22%", left: "50%", transform: "translateX(-50%)" }} />
      <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: [0.4, 1.1, 1], opacity: 1 }} transition={{ duration: 1.1, ease: "easeOut", delay: 0.2 }}
        style={{ position: "relative", zIndex: 1, marginBottom: "1.6rem" }}>
        <span style={{ fontSize: 40 }}>🌿</span>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.9 }} style={{ position: "relative", zIndex: 1, marginBottom: "1rem" }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "clamp(1.9rem,6.5vw,2.7rem)", color: dark, lineHeight: 1.2 }}>
          Dear <span style={{ color: primary, fontWeight: 600 }}>{guestName}</span>,
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, letterSpacing: "0.1em" }} animate={{ opacity: 1, letterSpacing: "0.4em" }} transition={{ duration: 0.9, delay: 1.6 }}
        style={{ fontSize: 10, textTransform: "uppercase", color: `${primary}cc`, fontFamily: "'Inter',sans-serif" }}>
        Where Love Blooms
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
function Countdown({ targetDate, dark, tint = "#eef2e6" }: { targetDate: string; dark: string; tint?: string }) {
  const [t, setT] = useState({ d: "00", h: "00", m: "00", s: "00" })
  useEffect(() => {
    const tick = () => {
      const diff = new Date(targetDate).getTime() - Date.now(); if (diff <= 0) return
      setT({
        d: String(Math.floor(diff / 86400000)).padStart(2, "0"), h: String(Math.floor(diff % 86400000 / 3600000)).padStart(2, "0"),
        m: String(Math.floor(diff % 3600000 / 60000)).padStart(2, "0"), s: String(Math.floor(diff % 60000 / 1000)).padStart(2, "0"),
      })
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [targetDate])
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 8, maxWidth: 340, margin: "0 auto" }}>
      {[["Days", t.d], ["Hours", t.h], ["Minutes", t.m], ["Seconds", t.s]].map(([l, v]) => (
        <div key={l} style={{ flex: 1, textAlign: "center", background: tint, borderRadius: "50% 50% 40% 40% / 60% 60% 40% 40%", padding: "12px 3px" }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.5rem", color: dark, fontWeight: 700, lineHeight: 1 }}>{v}</div>
          <div style={{ fontSize: 7.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7a8a70", marginTop: 5 }}>{l}</div>
        </div>
      ))}
    </div>
  )
}

// ── Music Player ──
function MusicPlayerUI({ title, artist, audioRef, primary, primaryLight, dark, muted }: { title: string; artist: string; audioRef: React.RefObject<HTMLAudioElement | null>; primary: string; primaryLight: string; dark: string; muted: string }) {
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
    <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#fff", borderRadius: 16, padding: 16, border: `1px solid ${primaryLight}` }}>
      <div style={{ width: 46, height: 46, borderRadius: "50% 50% 40% 40% / 60% 60% 40% 40%", background: `linear-gradient(135deg,${primaryLight},${primary})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0, animation: playing ? "spin 4s linear infinite" : "none" }}>🎵</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: dark }}>{title}</div>
        <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{artist}</div>
        <div style={{ height: 3, background: `${primary}26`, borderRadius: 100, marginTop: 8 }}>
          <div style={{ height: "100%", width: `${prog}%`, background: `linear-gradient(to right,${primary},${primaryLight})`, borderRadius: 100, transition: "width 0.3s" }} />
        </div>
      </div>
      <button onClick={toggle} style={{ width: 40, height: 40, borderRadius: "50%", background: dark, border: "none", color: "#fff", cursor: "pointer", fontSize: 14, flexShrink: 0 }}>{playing ? "⏸" : "▶"}</button>
    </div>
  )
}

// ── RSVP ──
function RSVP({ coupleId, askDrinking, primary, dark, cream, muted, guestName }: { coupleId: string; askDrinking: boolean; primary: string; dark: string; cream: string; muted: string; guestName: string }) {
  const [name, setName] = useState(guestName || ""); const [guestCount, setGuestCount] = useState(1)
  const [step, setStep] = useState<"form" | "count" | "drinking" | "done">("form")
  const [finalResponse, setFinalResponse] = useState<"yes" | "no">("yes"); const [saving, setSaving] = useState(false)
  const save = async (response: "yes" | "no", drinking: "yes" | "no" | null, count: number) => {
    setSaving(true)
    const { error } = await supabase.from('rsvps').insert([{ couple_id: coupleId, guest_name: name.trim(), response, drinking, guest_count: count }])
    setSaving(false); if (!error) { setFinalResponse(response); setStep("done") }
  }
  const inputStyle: React.CSSProperties = { width: "100%", padding: "13px 16px", borderRadius: 10, border: `1px solid ${primary}33`, background: cream, color: dark, fontSize: 14, outline: "none", marginBottom: 12, fontFamily: "'Inter',sans-serif" }
  return (
    <div style={{ padding: "0 1.5rem", textAlign: "center" }}>
      <LeafDivider color={primary} />
      <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: primary, margin: "16px 0 8px", fontWeight: 700 }}>Be Our Guest</div>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.8rem", color: dark, marginBottom: 24 }}>Will You Join Us?</div>
      <div style={{ background: "#fff", borderRadius: 20, padding: 24, maxWidth: 380, margin: "0 auto", boxShadow: "0 4px 20px rgba(45,61,40,0.08)" }}>
        {step === "form" && (
          <>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" style={inputStyle} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={() => name.trim() && setStep("count")} style={{ padding: 13, borderRadius: 10, background: primary, color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✓ Accept</button>
              <button onClick={() => name.trim() && save("no", null, 1)} disabled={saving} style={{ padding: 13, borderRadius: 10, background: "transparent", color: muted, border: `1px solid ${primary}33`, cursor: "pointer", fontSize: 12, opacity: saving ? 0.6 : 1 }}>{saving ? "..." : "✗ Decline"}</button>
            </div>
          </>
        )}
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
              <button onClick={() => save("yes", "yes", guestCount)} disabled={saving} style={{ padding: 13, borderRadius: 10, background: `${primary}1a`, color: primary, border: `1px solid ${primary}44`, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>🍷 Yes</button>
              <button onClick={() => save("yes", "no", guestCount)} disabled={saving} style={{ padding: 13, borderRadius: 10, background: `${primary}1a`, color: primary, border: `1px solid ${primary}44`, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>🥤 No</button>
            </div>
          </motion.div>
        )}
        {step === "done" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{finalResponse === "yes" ? "🌿" : "🙏"}</div>
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
type Wish = {
  id: string; couple_id: string; guest_name: string; message: string
  photo_url: string | null; video_url: string | null; media: WishMedia[] | null; created_at: string
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

function WishLightbox({ media, index, onIndex, onClose }: { media: WishMedia[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const current = media[index]
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(24,32,20,0.92)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", maxWidth: "92vw", maxHeight: "86vh" }}>
        {current.type === 'video' ? (
          <video src={current.url} controls autoPlay style={{ maxWidth: "92vw", maxHeight: "86vh", display: "block", borderRadius: 10 }} />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={current.url} alt="" style={{ maxWidth: "92vw", maxHeight: "86vh", display: "block", borderRadius: 10, objectFit: "contain" }} />
        )}
        <button onClick={onClose} aria-label="Close" style={{ position: "absolute", top: -40, right: 0, background: "transparent", border: "none", color: "#fff", fontSize: 26, cursor: "pointer", lineHeight: 1 }}>×</button>
        {media.length > 1 && (
          <>
            <button onClick={() => onIndex((index - 1 + media.length) % media.length)} aria-label="Previous" style={{ position: "absolute", left: -18, top: "50%", transform: "translate(-100%,-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 20, cursor: "pointer" }}>‹</button>
            <button onClick={() => onIndex((index + 1) % media.length)} aria-label="Next" style={{ position: "absolute", right: -18, top: "50%", transform: "translate(100%,-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 20, cursor: "pointer" }}>›</button>
            <div style={{ position: "absolute", bottom: -30, left: "50%", transform: "translateX(-50%)", color: "#fff", fontSize: 12, opacity: 0.8 }}>{index + 1} / {media.length}</div>
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
          <div key={idx} onClick={() => onOpen(idx)} style={{ position: "relative", cursor: "pointer", overflow: "hidden", height: isSingle ? 140 : undefined, aspectRatio: isSingle ? undefined : "1 / 1", background: "#000" }}>
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
              <div style={{ position: "absolute", inset: 0, background: "rgba(24,32,20,0.55)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, fontWeight: 700, zIndex: 2 }}>+{media.length - 4}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function WishesWall({ coupleId, primary, primaryLight, dark, cream, muted }: { coupleId: string; primary: string; primaryLight: string; dark: string; cream: string; muted: string }) {
  const [wishes, setWishes] = useState<Wish[]>([])
  const [loading, setLoading] = useState(true)
  const [rsvpCounts, setRsvpCounts] = useState<{ yes: number; no: number }>({ yes: 0, no: 0 })
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
    const channel = supabase.channel(`wishes-${coupleId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wishes', filter: `couple_id=eq.${coupleId}` }, () => load())
      .subscribe()
    return () => { active = false; supabase.removeChannel(channel) }
  }, [coupleId])

  useEffect(() => {
    let active = true
    const loadCounts = async () => {
      const { data } = await supabase.from('rsvps').select('response').eq('couple_id', coupleId)
      if (!active || !data) return
      const yes = data.filter((r: any) => r.response === 'yes').length
      const no = data.filter((r: any) => r.response === 'no').length
      setRsvpCounts({ yes, no })
    }
    loadCounts()
    return () => { active = false }
  }, [coupleId])

  const submit = async () => {
    if (!name.trim() || !message.trim()) { setError('Please add your name and a message.'); return }
    setSubmitting(true); setError('')
    try {
      const media: WishMedia[] = []
      for (const f of files) {
        const { url, isVideo } = await uploadWishMedia(f, coupleId)
        media.push({ url, type: isVideo ? 'video' : 'photo' })
      }
      const { error: insertError } = await supabase.from('wishes').insert([{ couple_id: coupleId, guest_name: name.trim(), message: message.trim(), media }])
      if (insertError) throw insertError
      setName(''); setMessage(''); setFiles([]); setDone(true)
    } catch { setError('Something went wrong — please try again.') } finally { setSubmitting(false) }
  }

  const underlineInput: React.CSSProperties = {
    width: '100%', padding: '10px 2px', border: 'none', borderBottom: `1.5px solid ${primaryLight}`,
    background: 'transparent', color: dark, fontSize: 13.5, outline: 'none', marginBottom: 16,
    boxSizing: 'border-box', fontFamily: "'Inter',sans-serif",
  }

  return (
    <div style={{ background: cream, borderRadius: 20, padding: '22px 18px', border: `1px solid ${primaryLight}` }}>
      <div style={{ textAlign: 'center', fontSize: 12, color: muted, marginBottom: 14 }}>
        {wishes.length} {wishes.length === 1 ? 'Comment' : 'Comments'}
      </div>
      {(rsvpCounts.yes > 0 || rsvpCounts.no > 0) && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ background: dark, color: '#fff', borderRadius: 12, padding: '10px 18px', textAlign: 'center', minWidth: 90 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{rsvpCounts.yes}</div>
            <div style={{ fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.8, marginTop: 2 }}>I'll Be There</div>
          </div>
          <div style={{ background: `${dark}bb`, color: '#fff', borderRadius: 12, padding: '10px 18px', textAlign: 'center', minWidth: 90 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{rsvpCounts.no}</div>
            <div style={{ fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.8, marginTop: 2 }}>Can't Come</div>
          </div>
        </div>
      )}

      {done ? (
        <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: dark }}>Thank you for your wish!</div>
          <div style={{ fontSize: 12, color: muted, marginTop: 4 }}>It's now on the wall below.</div>
          <button onClick={() => setDone(false)} style={{ marginTop: 12, padding: '8px 18px', borderRadius: 100, border: 'none', cursor: 'pointer', background: `${primary}1a`, color: dark, fontSize: 12, fontWeight: 700 }}>Leave another wish</button>
        </div>
      ) : (
        <div style={{ marginBottom: 20 }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" style={underlineInput} />
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Type your wishes" rows={3} style={{ ...underlineInput, resize: 'vertical' }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: muted, padding: '9px 2px', cursor: 'pointer', marginBottom: files.length ? 8 : 16, borderBottom: `1.5px dashed ${primaryLight}` }}>
            📷 {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} selected — add more` : 'Add photos or a video (optional)'}
            <input type="file" accept="image/*,video/*" multiple onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files || [])].slice(0, 6))} style={{ display: 'none' }} />
          </label>
          {files.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {files.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: dark, background: `${primary}1a`, borderRadius: 100, padding: '4px 9px' }}>
                  {f.name.length > 16 ? f.name.slice(0, 14) + '…' : f.name}
                  <span onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} style={{ cursor: 'pointer', fontWeight: 700 }}>×</span>
                </div>
              ))}
            </div>
          )}
          {error && <div style={{ fontSize: 11.5, color: primary, marginBottom: 10 }}>{error}</div>}
          <button onClick={submit} disabled={submitting} style={{ padding: '10px 26px', borderRadius: 10, border: 'none', cursor: 'pointer', background: dark, color: '#fff', fontWeight: 700, fontSize: 13, fontFamily: "'Inter',sans-serif", opacity: submitting ? 0.6 : 1 }}>{submitting ? 'Sending...' : 'Submit'}</button>
        </div>
      )}

      {loading ? (
        <div style={{ fontSize: 12, color: muted, textAlign: 'center' }}>Loading wishes...</div>
      ) : wishes.length === 0 ? (
        <div style={{ fontSize: 12, color: muted, textAlign: 'center' }}>Be the first to leave a wish!</div>
      ) : (
        <div style={{ borderTop: `1px solid ${primaryLight}`, paddingTop: 6 }}>
          {wishes.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE).map((w, i, arr) => {
            const mediaList = getWishMedia(w)
            return (
              <div key={w.id} style={{ padding: '16px 0', borderBottom: i < arr.length - 1 ? `1px solid ${primaryLight}` : 'none', textAlign: 'left' }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: dark, marginBottom: 5 }}>{w.guest_name}</div>
                <div style={{ fontSize: 13, color: dark, opacity: 0.8, lineHeight: 1.7, marginBottom: mediaList.length ? 10 : 6, whiteSpace: 'pre-wrap' }}>{w.message}</div>
                <WishMediaGrid media={mediaList} onOpen={idx => setLightbox({ media: mediaList, index: idx })} />
                <div style={{ fontSize: 10.5, color: muted, marginTop: 4 }}>{new Date(w.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              </div>
            )
          })}
          {wishes.length > PER_PAGE && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${primaryLight}`, flexWrap: 'wrap' }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ background: 'transparent', border: 'none', cursor: page === 0 ? 'default' : 'pointer', fontSize: 12, fontWeight: 700, color: primary, opacity: page === 0 ? 0.35 : 1 }}>← Previous</button>
              {Array.from({ length: Math.ceil(wishes.length / PER_PAGE) }).map((_, i) => (
                <button key={i} onClick={() => setPage(i)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: i === page ? 800 : 600, color: i === page ? dark : primary, textDecoration: i === page ? 'underline' : 'none', padding: '2px 4px' }}>{i + 1}</button>
              ))}
              <button onClick={() => setPage(p => (p + 1) * PER_PAGE < wishes.length ? p + 1 : p)} disabled={(page + 1) * PER_PAGE >= wishes.length} style={{ background: 'transparent', border: 'none', cursor: (page + 1) * PER_PAGE >= wishes.length ? 'default' : 'pointer', fontSize: 12, fontWeight: 700, color: primary, opacity: (page + 1) * PER_PAGE >= wishes.length ? 0.35 : 1 }}>Next →</button>
            </div>
          )}
        </div>
      )}
      {lightbox && <WishLightbox media={lightbox.media} index={lightbox.index} onIndex={i => setLightbox(l => l && { ...l, index: i })} onClose={() => setLightbox(null)} />}
    </div>
  )
}

// ── Card + section styles, matching the Floral Romance layout pattern:
// each section is its own white rounded card in a vertical stack, with a
// small corner leaf accent (instead of Floral Romance's lotus). ──
const cardStyle = (): React.CSSProperties => ({ background: "#fff", margin: "0 16px 16px", borderRadius: 22, padding: "1.8rem", boxShadow: "0 2px 20px rgba(45,61,40,0.06)", position: "relative", overflow: "hidden" })
const pretitleStyle = (color: string): React.CSSProperties => ({ fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color, textAlign: "center", marginBottom: 6, fontWeight: 700 })
const titleStyle = (dark: string): React.CSSProperties => ({ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.5rem", color: dark, textAlign: "center", marginBottom: 20 })

function LeafCornerAccent({ flip = false }: { flip?: boolean }) {
  return (
    <div style={{ position: "absolute", top: 10, [flip ? "left" : "right"]: 10, opacity: 0.18, transform: flip ? "scaleX(-1) rotate(-15deg)" : "rotate(15deg)", pointerEvents: "none" }}>
      <svg width={44} height={44} viewBox="0 0 24 24" fill="none">
        <path d="M12 2C7 6 4 11 4 15a8 8 0 0016 0c0-4-3-9-8-13z" fill="#5c7a52" />
      </svg>
    </div>
  )
}

export default function EternalBloomTemplate({ couple }: { couple: Couple }) {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#f8f6ee" }} />}>
      <EternalBloomInner couple={couple} />
    </Suspense>
  )
}

function EternalBloomInner({ couple }: { couple: Couple }) {
  const searchParams = useSearchParams()
  const guestName = searchParams?.get('name') || ''
  const introEnabled = (couple as any).show_guest_intro !== false
  const [showIntro, setShowIntro] = useState(!!guestName && introEnabled)
  const [opened, setOpened] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const PRIMARY = couple.custom_colors?.primary || DEFAULT_PALETTE.primary
  const PRIMARY_LIGHT = couple.custom_colors?.primaryLight || DEFAULT_PALETTE.primaryLight
  const DARK = couple.custom_colors?.dark || DEFAULT_PALETTE.dark
  const CREAM = couple.custom_colors?.cream || DEFAULT_PALETTE.cream
  const MUTED = DEFAULT_PALETTE.muted

  const coverVideoUrl = (couple as any).cover_video_url || DEFAULT_COVER_VIDEO
  const songUrl = couple.song_url || DEFAULT_SONG_URL

  useEffect(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; audioRef.current = null }
    const audio = new Audio(songUrl)
    audio.loop = true; audio.volume = 0.6; audioRef.current = audio
    return () => { audio.pause(); audio.src = "" }
  }, [songUrl])

  const [videoPlaying, setVideoPlaying] = useState(false)
  const videoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleOpen = () => {
    if (coverVideoUrl) {
      // Play the cover video for a short ~5s preview; the invitation opens
      // once that preview finishes (or the clip itself ends, if shorter).
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
    gallery: couple.section_visibility?.gallery ?? true, countdown: couple.section_visibility?.countdown ?? true,
    timeline: couple.section_visibility?.timeline ?? true, seat_finder: couple.section_visibility?.seat_finder ?? true,
    music: couple.section_visibility?.music ?? true, thank_you: couple.section_visibility?.thank_you ?? true,
  }

  const W = {
    bride: couple.bride, groom: couple.groom, brideFamilyName: couple.bride_family || '', groomFamilyName: couple.groom_family || '',
    date: couple.wedding_date, couplePhoto: couple.couple_photo || DEFAULT_PHOTO,
    bridePhoto: (couple as any).bride_photo || couple.couple_photo || DEFAULT_PHOTO,
    groomPhoto: (couple as any).groom_photo || couple.couple_photo || DEFAULT_PHOTO,
    song: couple.song_title || DEFAULT_SONG_TITLE, artist: couple.song_artist || DEFAULT_SONG_ARTIST,
    timeline: couple.timeline || [], seats: couple.seats || {}, gallery: couple.gallery || [],
  }

  const TINT_SAGE = "#eef2e6"

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", minHeight: "100vh", background: CREAM }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Great+Vibes&family=Inter:wght@300;400;500;600&display=swap');
        @keyframes spin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
        input::placeholder { color: #b5c2ac; }
      `}</style>

      <AnimatePresence>
        {showIntro && guestName && (
          <GuestIntroScreen guestName={guestName} onDone={() => setShowIntro(false)} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} cream={CREAM} />
        )}
      </AnimatePresence>

      <div style={{ maxWidth: 480, margin: "0 auto", background: CREAM, boxShadow: "0 0 80px rgba(0,0,0,0.06)", position: "relative" }}>

        {/* ══ COVER ══ */}
        <AnimatePresence>
          {!opened && (
            <motion.div key="cover" exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.5 }}
              style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", background: DARK }}>

              {coverVideoUrl ? (
                <video ref={videoRef} muted playsInline preload="auto" onEnded={handleVideoEnded}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}>
                  <source src={coverVideoUrl} type="video/mp4" />
                </video>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={W.couplePhoto} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }}
                  onError={e => { (e.currentTarget as HTMLImageElement).src = DEFAULT_PHOTO }} />
              )}
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(45,61,40,0.45) 0%, rgba(45,61,40,0.15) 35%, rgba(45,61,40,0.3) 65%, rgba(45,61,40,0.72) 100%)` }} />

              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
                style={{ textAlign: "center", width: "84%", maxWidth: 340, position: "relative", zIndex: 10, padding: "0 1rem" }}>

                <div style={{ fontSize: 26, marginBottom: 8 }}>🌿</div>
                <div style={{ fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", marginBottom: "0.8rem" }}>Wedding Invitation</div>
                <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "clamp(2.8rem,10vw,4rem)", color: "#fff", lineHeight: 1, textShadow: "0 4px 24px rgba(0,0,0,0.45)" }}>{W.bride}</div>
                <div style={{ margin: "6px 0" }}><LeafDivider color={PRIMARY_LIGHT} size={18} /></div>
                <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "clamp(2.8rem,10vw,4rem)", color: "#fff", lineHeight: 1, textShadow: "0 4px 24px rgba(0,0,0,0.45)" }}>{W.groom}</div>

                {guestName && (
                  <>
                    <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: PRIMARY_LIGHT, margin: "1.2rem 0 0.3rem" }}>Dear</div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.3rem", color: "#fff", marginBottom: "1.2rem", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>{guestName}</div>
                  </>
                )}

                <button onClick={handleOpen} disabled={videoPlaying} style={{
                  display: "inline-flex", alignItems: "center", gap: 10, background: `linear-gradient(135deg,${PRIMARY},${PRIMARY_LIGHT})`, color: "#fff",
                  border: "none", borderRadius: 100, padding: "13px 26px", fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase",
                  cursor: videoPlaying ? "default" : "pointer", fontFamily: "'Inter',sans-serif", fontWeight: 700, boxShadow: "0 8px 24px rgba(0,0,0,0.35)", marginTop: guestName ? 0 : "1.4rem",
                  opacity: videoPlaying ? 0.7 : 1,
                }}>
                  {videoPlaying ? "Playing..." : "Open Invitation →"}
                </button>
                {!videoPlaying && (
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", marginTop: 12, letterSpacing: "0.05em", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>🎵 Tap to begin — with music</div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ INVITATION ══ */}
        {opened && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>

            {/* Hero */}
            <div style={{ position: "relative", height: 560, overflow: "hidden" }}>
              {coverVideoUrl ? (
                <video ref={videoRef} autoPlay loop muted playsInline preload="auto" poster={W.couplePhoto} style={{ width: "100%", height: "100%", objectFit: "cover" }}>
                  <source src={coverVideoUrl} type="video/mp4" />
                </video>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={W.couplePhoto} alt={`${W.bride} and ${W.groom}`} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }}
                  onError={e => { (e.currentTarget as HTMLImageElement).src = DEFAULT_PHOTO }} />
              )}
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top,${CREAM} 0%,rgba(45,61,40,0.15) 60%,rgba(45,61,40,0.4) 100%)` }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "2rem 1.5rem", textAlign: "center", zIndex: 5 }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <div style={{ fontSize: 9, letterSpacing: "0.5em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", marginBottom: "0.8rem" }}>Together with their families</div>
                  <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "clamp(2.4rem,8vw,3.6rem)", color: "#fff", lineHeight: 1, textShadow: "0 2px 20px rgba(45,61,40,0.3)" }}>
                    {W.bride}<span style={{ color: PRIMARY_LIGHT }}> &amp; </span>{W.groom}
                  </div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
                    <a href="#rsvp" style={{ background: `linear-gradient(135deg,${PRIMARY},${PRIMARY_LIGHT})`, color: "#fff", borderRadius: 100, padding: "10px 22px", fontSize: 11, letterSpacing: "0.15em", textDecoration: "none" }}>RSVP</a>
                    <a href={eventsList[0]?.maps_url || couple.maps_url || '#'} target="_blank" rel="noopener noreferrer" style={{ background: "rgba(0,0,0,0.15)", backdropFilter: "blur(8px)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.8)", borderRadius: 100, padding: "10px 22px", fontSize: 11, letterSpacing: "0.15em", textDecoration: "none", fontWeight: 600 }}>Location</a>
                  </div>
                </motion.div>
              </div>
            </div>

            <div style={{ background: "#fff", padding: 10, display: "flex", justifyContent: "center", gap: 8, borderBottom: `1px solid ${PRIMARY_LIGHT}` }}>
              {[1, 2, 3].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: PRIMARY_LIGHT }} />)}
            </div>

            {/* Blessing card */}
            <motion.div style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <LeafCornerAccent />
              <LeafCornerAccent flip />
              <div style={pretitleStyle(PRIMARY)}>With Love</div>
              <div style={{ textAlign: "center", fontSize: 13, color: DARK, lineHeight: 2, fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic" }}>
                {(couple as any).family_invitation_text ||
                  "Like a garden that blooms in its season, our love has grown into something beautiful. Join us as we begin this new chapter together."}
              </div>
            </motion.div>

            {/* Family names */}
            {(W.brideFamilyName || W.groomFamilyName) && (
              <motion.div style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <LeafCornerAccent />
                <LeafCornerAccent flip />
                <div style={pretitleStyle(PRIMARY)}>Our Families</div>
                <div style={{ textAlign: "center", padding: 12, background: TINT_SAGE, borderRadius: 12, fontSize: 13, color: DARK, lineHeight: 2 }}>
                  {W.brideFamilyName && <><strong>{W.brideFamilyName}</strong><br /></>}
                  {W.brideFamilyName && W.groomFamilyName && <>together with<br /></>}
                  {W.groomFamilyName && <><strong>{W.groomFamilyName}</strong><br /></>}
                  <span style={{ color: MUTED }}>request the honour of your presence<br />to celebrate the marriage of their loving children</span>
                </div>
              </motion.div>
            )}

            {/* Events */}
            {eventsList.map(ev => {
              const evDate = new Date(ev.date)
              const evDateDisplay = evDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
              const evTimeDisplay = evDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) + ' Onwards'
              return (
                <motion.div key={ev.key} style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <LeafCornerAccent />
                  <LeafCornerAccent flip />
                  <div style={pretitleStyle(PRIMARY)}>{ev.icon} Save the Date</div>
                  <div style={titleStyle(DARK)}>{ev.label}</div>
                  {[
                    { icon: "📅", label: "Date", val: evDateDisplay },
                    { icon: "⏰", label: "Time", val: evTimeDisplay },
                    { icon: "📍", label: "Venue", val: ev.venue, sub: ev.venue_address },
                  ].map(d => (
                    <div key={d.label} style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "12px 0", borderBottom: `1px solid ${PRIMARY_LIGHT}55` }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${PRIMARY_LIGHT}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>{d.icon}</div>
                      <div>
                        <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#a8b89e" }}>{d.label}</div>
                        <div style={{ fontSize: 15, color: DARK, fontWeight: 700, marginTop: 2 }}>{d.val}</div>
                        {d.sub && <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{d.sub}</div>}
                      </div>
                    </div>
                  ))}
                  {ev.maps_url && (
                    <a href={ev.maps_url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: `${PRIMARY_LIGHT}44`, borderRadius: 100, padding: "10px 20px", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: PRIMARY, marginTop: 16, textDecoration: "none", fontWeight: 700 }}>
                      📍 View Location on Maps
                    </a>
                  )}
                </motion.div>
              )
            })}

            {/* Countdown — full-width bordered band, matching Floral Romance */}
            {sv.countdown && (
              <div style={{ background: "#fff", padding: "1.5rem 1rem", textAlign: "center", borderTop: `1px solid ${PRIMARY_LIGHT}`, borderBottom: `1px solid ${PRIMARY_LIGHT}`, marginBottom: 16 }}>
                <div style={pretitleStyle(PRIMARY)}>Counting Down to Our Big Day</div>
                <Countdown targetDate={W.date} dark={DARK} tint={TINT_SAGE} />
              </div>
            )}

            {/* RSVP */}
            <div id="rsvp"><RSVP coupleId={couple.id} askDrinking={couple.ask_drinking} primary={PRIMARY} dark={DARK} cream={CREAM} muted={MUTED} guestName={guestName} /></div>

            {/* Timeline */}
            {sv.timeline && W.timeline.length > 0 && (
              <motion.div style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <LeafCornerAccent />
                <LeafCornerAccent flip />
                <div style={pretitleStyle(PRIMARY)}>Our Celebration</div>
                <div style={titleStyle(DARK)}>The Wedding Lineup</div>
                <div style={{ position: "relative", paddingLeft: 20 }}>
                  <div style={{ position: "absolute", left: 6, top: 0, bottom: 0, width: 1, background: `${PRIMARY_LIGHT}` }} />
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

            {/* Guest Wishes Wall */}
            {((couple as any).enable_guest_wishes ?? false) && (
              <motion.div style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <LeafCornerAccent />
                <LeafCornerAccent flip />
                <div style={pretitleStyle(PRIMARY)}>With Love</div>
                <div style={titleStyle(DARK)}>Wishes for Us</div>
                <div style={{ fontSize: 12.5, color: MUTED, textAlign: 'center', marginBottom: 16 }}>
                  Share your wishes and blessings with {W.bride} &amp; {W.groom}.
                </div>
                <WishesWall coupleId={couple.id} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} cream={CREAM} muted={MUTED} />
              </motion.div>
            )}

            {/* Seat finder */}
            {sv.seat_finder && couple.show_seating && Object.keys(W.seats).length > 0 && (
              <motion.div style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <LeafCornerAccent />
                <LeafCornerAccent flip />
                <div style={pretitleStyle(PRIMARY)}>Be Our Guest</div>
                <div style={titleStyle(DARK)}>Find Your Table</div>
                <div style={{ fontSize: 13, color: MUTED, marginBottom: 12, textAlign: "center" }}>Search your name to find your assigned table</div>
                <SeatFinder seats={W.seats} primary={PRIMARY} dark={DARK} cream={CREAM} muted={MUTED} />
              </motion.div>
            )}

            {/* Music */}
            {sv.music && (
              <motion.div style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <LeafCornerAccent />
                <LeafCornerAccent flip />
                <div style={pretitleStyle(PRIMARY)}>Our Song</div>
                <MusicPlayerUI title={W.song} artist={W.artist} audioRef={audioRef} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} muted={MUTED} />
              </motion.div>
            )}

            {/* Gallery */}
            {sv.gallery && W.gallery.length > 0 && (
              <motion.div style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <LeafCornerAccent />
                <LeafCornerAccent flip />
                <div style={pretitleStyle(PRIMARY)}>Our Story</div>
                <div style={titleStyle(DARK)}>Our Moments</div>
                <div style={{ columnCount: 2, columnGap: 10 }}>
                  {W.gallery.map((src, i) => (
                    <div key={i} style={{ breakInside: "avoid", marginBottom: 10, borderRadius: 16, overflow: "hidden", background: `${PRIMARY_LIGHT}33`, boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" style={{ width: "100%", height: "auto", display: "block" }} onError={e => { (e.currentTarget.closest('div') as HTMLElement).style.display = "none" }} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Thank you */}
            {sv.thank_you && (
              <motion.div style={{ ...cardStyle(), borderRadius: 24 }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <LeafCornerAccent />
                <LeafCornerAccent flip />
                <div style={pretitleStyle(PRIMARY)}>A Special Note</div>
                <div style={titleStyle(DARK)}>To Our Lovely Guests</div>
                <div style={{ textAlign: "center", fontSize: 13, color: DARK, lineHeight: 2 }}>
                  {(couple as any).thank_you_text || "With hearts full of love and gratitude, we are so happy to celebrate this beautiful chapter of our lives with you. Thank you for your love, your blessings, and for being part of our journey."}
                </div>
                <div style={{ textAlign: "center", marginTop: 18 }}>
                  <div style={{ fontSize: 11, color: "#a8b89e", letterSpacing: "0.1em" }}>With all our love,</div>
                  <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "1.8rem", color: PRIMARY, marginTop: 4 }}>{W.bride} &amp; {W.groom}</div>
                </div>
              </motion.div>
            )}

            <div style={{ padding: "2rem 1.5rem", textAlign: "center", background: "#fff", borderTop: `1px solid ${PRIMARY_LIGHT}`, borderRadius: "24px 24px 0 0" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 10, opacity: 0.6 }}>
                <svg width={40} height={40} viewBox="0 0 24 24" fill="none"><path d="M12 2C7 6 4 11 4 15a8 8 0 0016 0c0-4-3-9-8-13z" fill={PRIMARY} /></svg>
              </div>
              <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "1.5rem", color: PRIMARY, marginBottom: 4 }}>InviteGlow</div>
              <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "#a8b89e" }}>inviteglow.com · Digital Wedding Invitations</div>
              {((couple as any).enable_footer_social ?? true) && <FooterSocial color={PRIMARY} background={`${PRIMARY}14`} />}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
