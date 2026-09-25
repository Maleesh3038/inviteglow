"use client"
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import FooterSocial from '@/components/shared/FooterSocial'

// ── First Holy Communion template ────────────────────────────────────
// Backed by the SAME `events` table as Corporate Event (see
// events_table_migration.sql) — a single family/religious milestone
// event, not a couple. `title` holds the child's name, `host` holds the
// parents (e.g. "Mr. & Mrs. Mathew"), `event_tagline` holds a short
// relational line ("Of Our Son" / "Of Our Daughter"). Powder-blue +
// gold + ivory palette with a gold cross motif and soft watercolor
// floral corners, built to match a reference card: an arched "Kindly
// Join Us For The" eyebrow, a radiant gold cross, "First Holy
// Communion" heading, the child's name in script, and a warm invite
// message — with the couple's own cover video (e.g. a priest's
// blessing) playing on open, exactly like Corporate Event's cover.
type EventInvite = {
  id: string
  slug: string
  template: string
  title: string
  host?: string | null
  event_tagline?: string | null
  cover_badge_text?: string | null
  event_date: string
  event_end_time?: string | null
  time_format?: '12h' | '24h' | null
  venue?: string | null
  venue_address?: string | null
  maps_url?: string | null
  cover_photo?: string | null
  cover_video_url?: string | null
  gallery?: string[] | null
  song_title?: string | null
  song_artist?: string | null
  song_url?: string | null
  timeline?: { time: string; event: string }[] | null
  contacts?: { name: string; phone: string }[] | null
  section_visibility?: { gallery?: boolean; countdown?: boolean; timeline?: boolean; music?: boolean; thank_you?: boolean } | null
  enable_guest_wishes?: boolean | null
  enable_footer_social?: boolean | null
  show_guest_intro?: boolean | null
  thank_you_text?: string | null
  custom_colors?: { primary?: string; primaryLight?: string; dark?: string; cream?: string } | null
}

const DEFAULT_PALETTE = {
  primary: "#7fa8c9",
  primaryLight: "#c9a15a",
  dark: "#2c4a63",
  cream: "#fbfaf7",
  muted: "#8496a8",
}
const BLUE_PALE = "#e5eef5"
const BLUE_MID = "#a9c8de"

// ── Gold cross with radiating rays — the reference card's central motif. ──
function GoldCross({ size = 58, color = "#c9a15a" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <g stroke={color} strokeWidth="1" opacity="0.45">
        {Array.from({ length: 20 }).map((_, i) => {
          const angle = (i / 20) * 360
          return <line key={i} x1="50" y1="50" x2="50" y2="4" transform={`rotate(${angle} 50 50)`} strokeLinecap="round" />
        })}
      </g>
      <circle cx="50" cy="50" r="30" fill="none" stroke={color} strokeWidth="0.6" opacity="0.35" />
      <g transform="translate(50 50)">
        <rect x="-3.5" y="-24" width="7" height="48" rx="2" fill={color} />
        <rect x="-14" y="-9" width="28" height="7" rx="2" fill={color} />
      </g>
    </svg>
  )
}

// ── Soft "watercolor" floral corner cluster — layered blurred blue
// blobs, faint concentric rose swirls and a couple of thin gold leaf
// accents. Procedural (no image asset), same generative-decoration
// approach used elsewhere in the app for mandalas/lotus dividers. ──
function FloralCorner({ flip = false, size = 190, opacity = 1 }: { flip?: boolean; size?: number; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ transform: flip ? 'scaleX(-1) scaleY(-1)' : undefined, opacity, display: 'block' }}>
      <defs>
        <filter id={`fc-soft-${flip ? 'b' : 'a'}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4.5" />
        </filter>
      </defs>
      <g filter={`url(#fc-soft-${flip ? 'b' : 'a'})`}>
        <circle cx="38" cy="36" r="32" fill="#bcd4e6" opacity="0.55" />
        <circle cx="72" cy="22" r="22" fill="#dcebf3" opacity="0.65" />
        <circle cx="18" cy="76" r="26" fill="#a9c8de" opacity="0.5" />
        <circle cx="62" cy="66" r="19" fill="#eef5fa" opacity="0.75" />
        <circle cx="94" cy="46" r="14" fill="#cfe1ee" opacity="0.55" />
      </g>
      {[[38, 36, 19], [72, 24, 12], [22, 74, 14]].map(([cx, cy, r], i) => (
        <g key={i} opacity="0.8">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#7fa8c9" strokeWidth="1" />
          <circle cx={cx} cy={cy} r={r * 0.62} fill="none" stroke="#7fa8c9" strokeWidth="1" />
          <circle cx={cx} cy={cy} r={r * 0.28} fill="none" stroke="#8fb3d1" strokeWidth="1" />
        </g>
      ))}
      <path d="M96 150 Q118 138 128 116" stroke="#c9a15a" strokeWidth="1.3" fill="none" opacity="0.65" />
      <ellipse cx="116" cy="128" rx="8" ry="3.6" fill="#c9a15a" opacity="0.45" transform="rotate(-32 116 128)" />
      <path d="M60 118 Q78 130 82 150" stroke="#c9a15a" strokeWidth="1.1" fill="none" opacity="0.5" />
    </svg>
  )
}

// Small drifting petals — pure CSS keyframes, used sparingly on the cover.
function FloatingBlossoms({ color = "#c9a15a" }: { color?: string }) {
  const items = [
    { left: '8%', size: 8, delay: 0, dur: 14 },
    { left: '22%', size: 6, delay: 3, dur: 17 },
    { left: '48%', size: 9, delay: 6, dur: 13 },
    { left: '68%', size: 6, delay: 2, dur: 16 },
    { left: '84%', size: 8, delay: 5, dur: 15 },
  ]
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 2 }}>
      {items.map((p, i) => (
        <span key={i} className="fc-blossom" style={{ left: p.left, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s` }}>
          <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="5" fill={color} opacity="0.7" />
          </svg>
        </span>
      ))}
    </div>
  )
}

function GoldDivider({ color = "#c9a15a", width = 90 }: { color?: string; width?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, margin: '14px auto' }}>
      <div style={{ width: width / 2, height: 1, background: `linear-gradient(to left, ${color}, transparent)` }} />
      <svg width="10" height="10" viewBox="0 0 24 24"><path d="M12 2c2 4 4 6 8 8-4 2-6 4-8 8-2-4-4-6-8-8 4-2 6-4 8-8z" fill={color} opacity="0.75" /></svg>
      <div style={{ width: width / 2, height: 1, background: `linear-gradient(to right, ${color}, transparent)` }} />
    </div>
  )
}

// ── Guest intro screen — soft blue/ivory shimmer, "Dear [Name]," shown
// briefly before the cover. Toggle via show_guest_intro. ──
function GuestIntroScreen({ guestName, onDone, primary, primaryLight, cream, dark, muted }: {
  guestName: string; onDone: () => void; primary: string; primaryLight: string; cream: string; dark: string; muted: string
}) {
  return (
    <motion.div
      key="intro" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1, ease: "easeInOut" }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: `radial-gradient(ellipse 75% 60% at 50% 25%, #ffffff 0%, ${cream} 55%, ${BLUE_PALE} 100%)`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "2rem", overflow: "hidden",
      }}>
      <div style={{ position: "absolute", width: 320, height: 320, borderRadius: "50%", background: `radial-gradient(circle, ${primary}22, transparent)`, top: "20%", left: "50%", transform: "translateX(-50%)" }} />
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1, ease: "easeOut", delay: 0.15 }} style={{ position: "relative", zIndex: 1, marginBottom: 18 }}>
        <GoldCross size={54} color={primaryLight} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.9 }} style={{ position: "relative", zIndex: 1, marginBottom: "1rem" }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontStyle: 'italic', fontSize: "clamp(1.9rem,6.5vw,2.7rem)", color: dark, lineHeight: 1.2 }}>
          Dear <span style={{ color: primary, fontStyle: 'normal', fontWeight: 600 }}>{guestName}</span>,
        </div>
      </motion.div>
      <motion.div initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ duration: 0.6, delay: 1.3 }}
        style={{ width: 56, height: 1, background: `linear-gradient(to right, transparent, ${primaryLight}, transparent)`, margin: "0 auto 1rem" }} />
      <motion.div initial={{ opacity: 0, letterSpacing: "0.1em" }} animate={{ opacity: 1, letterSpacing: "0.4em" }} transition={{ duration: 0.9, delay: 1.6 }}
        style={{ fontSize: 10, textTransform: "uppercase", color: muted, fontFamily: "'Inter',sans-serif" }}>
        You Are Blessed to Be Invited
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

function Countdown({ targetDate, primary, primaryLight, dark, muted }: { targetDate: string; primary: string; primaryLight: string; dark: string; muted: string }) {
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
    <div style={{ display: "flex", justifyContent: "center", gap: 12, maxWidth: 380, margin: "0 auto" }}>
      {[["Days", t.d], ["Hours", t.h], ["Mins", t.m], ["Secs", t.s]].map(([l, v]) => (
        <div key={l} style={{ flex: 1, textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "#fff", border: `1.5px solid ${primary}44`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", boxShadow: `0 4px 14px ${primary}1a` }}>
            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", color: dark, fontWeight: 700 }}>{v}</span>
          </div>
          <span style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: primaryLight, fontWeight: 700 }}>{l}</span>
        </div>
      ))}
    </div>
  )
}

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
    <div style={{ display: "flex", alignItems: "center", gap: 14, background: BLUE_PALE, borderRadius: 16, padding: 16 }}>
      <div style={{ width: 46, height: 46, borderRadius: "50%", background: `linear-gradient(135deg,${primaryLight},${primary})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <GoldCross size={20} color="#fff" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: dark }}>{title}</div>
        <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{artist}</div>
        <div style={{ height: 3, background: `${primary}22`, borderRadius: 100, marginTop: 8 }}>
          <div style={{ height: "100%", width: `${prog}%`, background: `linear-gradient(to right,${primary},${primaryLight})`, borderRadius: 100, transition: "width 0.3s" }} />
        </div>
      </div>
      <button onClick={toggle} style={{ width: 40, height: 40, borderRadius: "50%", background: primary, border: "none", color: "#fff", cursor: "pointer", fontSize: 14, flexShrink: 0 }}>{playing ? "⏸" : "▶"}</button>
    </div>
  )
}

// ── Simple RSVP — name + attending + guest count. No entry-pass/QR
// system here (that's a Corporate Event-specific check-in feature); a
// family milestone event just needs a headcount. ──
function RSVP({ coupleId, primary, primaryLight, dark, cream, muted, guestName }: {
  coupleId: string; primary: string; primaryLight: string; dark: string; cream: string; muted: string; guestName: string
}) {
  const [name, setName] = useState(guestName || "")
  const [guestCount, setGuestCount] = useState('1')
  const [step, setStep] = useState<"form" | "done">("form")
  const [finalResponse, setFinalResponse] = useState<"yes" | "no">("yes")
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const clampedGuestCount = () => Math.max(1, Math.min(10, parseInt(guestCount, 10) || 1))
  const save = async (response: "yes" | "no") => {
    if (!name.trim()) { setFormError('Please enter your name.'); return }
    setFormError(''); setSaving(true)
    await supabase.from('rsvps').insert([{ couple_id: coupleId, guest_name: name.trim(), response, guest_count: response === 'yes' ? clampedGuestCount() : 1 }])
    setSaving(false); setFinalResponse(response); setStep("done")
  }
  const inputStyle: React.CSSProperties = { width: "100%", padding: "13px 16px", borderRadius: 10, border: `1px solid ${primary}33`, background: cream, color: dark, fontSize: 14, outline: "none", marginBottom: 12, fontFamily: "'Inter',sans-serif", boxSizing: 'border-box' }
  return (
    <div style={{ background: `linear-gradient(135deg,${BLUE_PALE},${cream})`, padding: "40px 1.5rem", textAlign: "center" }}>
      <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: primary, marginBottom: 8, fontWeight: 700 }}>Kindly RSVP</div>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.8rem", color: dark, marginBottom: 24 }}>Will You Join Us?</div>
      <div style={{ background: "#fff", borderRadius: 18, padding: 26, maxWidth: 380, margin: "0 auto", boxShadow: `0 8px 28px ${dark}0f` }}>
        <AnimatePresence mode="wait">
          {step === "form" && (
            <motion.div key="form" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.25 }}>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" style={inputStyle} />
              <label style={{ fontSize: 10.5, color: muted, display: 'block', textAlign: 'left', marginBottom: 4, fontWeight: 600 }}>Number attending</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" value={guestCount}
                onChange={e => { const v = e.target.value; if (v === '' || /^[0-9]{1,2}$/.test(v)) setGuestCount(v) }}
                onBlur={() => setGuestCount(String(clampedGuestCount()))}
                style={inputStyle} />
              {formError && <div style={{ fontSize: 11.5, color: primary, marginBottom: 10, textAlign: "left" }}>{formError}</div>}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button onClick={() => save("yes")} disabled={saving} style={{ padding: 13, borderRadius: 10, background: primary, color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, opacity: saving ? 0.7 : 1 }}>{saving ? "..." : "✓ Attending"}</button>
                <button onClick={() => save("no")} disabled={saving} style={{ padding: 13, borderRadius: 10, background: "transparent", color: muted, border: `1px solid ${primary}33`, cursor: "pointer", fontSize: 12, opacity: saving ? 0.6 : 1 }}>{saving ? "..." : "✗ Can't Attend"}</button>
              </div>
            </motion.div>
          )}
          {step === "done" && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
              {finalResponse === "yes" ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><GoldCross size={30} color={primary} /></div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", color: primary, marginBottom: 4 }}>See you there, {name}!</div>
                  <div style={{ fontSize: 12, color: muted }}>We look forward to celebrating with you.</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 26, marginBottom: 8 }}>🙏</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", color: primary, marginBottom: 4 }}>We'll miss you, {name}.</div>
                  <div style={{ fontSize: 12, color: muted }}>Thank you for letting us know.</div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Blessings & Well Wishes wall (same `wishes` table/bucket used
// across every template — a guest message board). ──
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
function WishLightbox({ media, index, onIndex, onClose }: { media: WishMedia[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const current = media[index]
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,35,48,0.92)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
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
              <div style={{ position: "absolute", inset: 0, background: "rgba(20,35,48,0.55)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, fontWeight: 700, zIndex: 2 }}>+{media.length - 4}</div>
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
      <div style={{ background: "#fff", borderRadius: 16, padding: '18px 16px', textAlign: 'left', marginBottom: 18, boxShadow: `0 4px 20px ${dark}0d` }}>
        {done ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: dark }}>Thank you for your blessing!</div>
            <div style={{ fontSize: 12, color: muted, marginTop: 4 }}>It's now on the wall below.</div>
            <button onClick={() => setDone(false)} style={{ marginTop: 12, padding: '8px 18px', borderRadius: 100, border: 'none', cursor: 'pointer', background: `${primary}1a`, color: dark, fontSize: 12, fontWeight: 700 }}>Leave another message</button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: dark, marginBottom: 10 }}>Leave a Blessing</div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inputStyle} />
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Share your blessing or well wishes..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: muted, opacity: 0.9, padding: '9px 13px', borderRadius: 10, border: `1px dashed ${primary}`, cursor: 'pointer', marginBottom: files.length ? 6 : 10 }}>
              📷 {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} selected — add more` : 'Add photos or a video (optional)'}
              <input type="file" accept="image/*,video/*" multiple onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files || [])].slice(0, 6))} style={{ display: 'none' }} />
            </label>
            {files.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {files.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: dark, background: `${primary}1a`, borderRadius: 100, padding: '4px 9px' }}>
                    {f.name.length > 16 ? f.name.slice(0, 14) + '…' : f.name}
                    <span onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} style={{ cursor: 'pointer', fontWeight: 700 }}>×</span>
                  </div>
                ))}
              </div>
            )}
            {error && <div style={{ fontSize: 11.5, color: primary, marginBottom: 8 }}>{error}</div>}
            <button onClick={submit} disabled={submitting} style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', cursor: 'pointer', background: primary, color: '#fff', fontWeight: 700, fontSize: 13, fontFamily: "'Inter',sans-serif", opacity: submitting ? 0.6 : 1 }}>{submitting ? 'Sending...' : 'Send Blessing'}</button>
          </>
        )}
      </div>
      {loading ? (
        <div style={{ fontSize: 12, color: muted, textAlign: 'center' }}>Loading blessings...</div>
      ) : wishes.length === 0 ? (
        <div style={{ fontSize: 12, color: muted, textAlign: 'center' }}>Be the first to leave a blessing!</div>
      ) : (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: dark, textAlign: 'center', marginBottom: 14 }}>{wishes.length} {wishes.length === 1 ? 'Blessing' : 'Blessings'}</div>
          {wishes.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE).map((w, i, arr) => {
            const mediaList = getWishMedia(w)
            return (
              <div key={w.id} style={{ padding: '12px 0', borderBottom: i < arr.length - 1 ? `1px solid ${primary}1a` : 'none', textAlign: 'left' }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: primary, marginBottom: 4 }}>{w.guest_name}</div>
                <div style={{ fontSize: 13, color: dark, opacity: 0.85, lineHeight: 1.7, marginBottom: mediaList.length ? 10 : 6, whiteSpace: 'pre-wrap' }}>{w.message}</div>
                <WishMediaGrid media={mediaList} onOpen={idx => setLightbox({ media: mediaList, index: idx })} />
                <div style={{ fontSize: 10.5, color: muted }}>{new Date(w.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              </div>
            )
          })}
          {wishes.length > PER_PAGE && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${primary}1a`, flexWrap: 'wrap' }}>
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

function ContactRow({ name, phone, primary, dark, muted, cream }: { name: string; phone: string; primary: string; dark: string; muted: string; cream: string }) {
  const digitsOnly = phone.replace(/\D/g, '')
  const waNumber = digitsOnly.startsWith('0') ? `94${digitsOnly.slice(1)}` : digitsOnly
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: cream, borderRadius: 12, padding: '12px 16px' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: dark }}>{name}</div>
        <div style={{ fontSize: 12.5, color: muted, marginTop: 2 }}>{phone}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <a href={`tel:${digitsOnly}`} aria-label={`Call ${name}`} style={{ width: 36, height: 36, borderRadius: '50%', background: `${primary}1a`, color: primary, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill={primary}><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01z" /></svg>
        </a>
        <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${name}`} style={{ width: 36, height: 36, borderRadius: '50%', background: '#25d366', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="#fff"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3M12 2a10 10 0 00-8.5 15.3L2 22l4.8-1.3A10 10 0 1012 2z" /></svg>
        </a>
      </div>
    </div>
  )
}

function scrollToId(id: string) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
function BottomNavBar({ primary, primaryLight, dark, mapsUrl, hasWishes, hasGallery, hasContact, hasMusic, audioRef }: {
  primary: string; primaryLight: string; dark: string; mapsUrl: string; hasWishes: boolean; hasGallery: boolean; hasContact: boolean; hasMusic: boolean; audioRef: React.RefObject<HTMLAudioElement | null>
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
      <span style={{ fontSize: 8, letterSpacing: '0.02em' }}>{label}</span>
    </button>
  )
  return (
    <div style={{ position: 'fixed', bottom: 18, left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 40px)', maxWidth: 400, zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-evenly', background: 'rgba(255,255,255,0.98)', borderRadius: 100, border: `1px solid ${dark}14`, boxShadow: `0 10px 30px ${dark}30`, padding: '10px 18px', position: 'relative' }}>
        {hasWishes && iconBtn(() => scrollToId('wishes'), 'Blessings', <path d="M12 20.5s-7.5-4.9-9.8-9.3C.6 8 2 4.7 5.2 4a4.6 4.6 0 016.8 2.3A4.6 4.6 0 0118.8 4C22 4.7 23.4 8 21.8 11.2 19.5 15.6 12 20.5 12 20.5z" />, 'wishes')}
        {iconBtn(() => scrollToId('savethedate'), 'The Day', <><rect x="3.5" y="5" width="17" height="16" rx="2.5" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /></>, 'savedate')}
        {hasGallery && iconBtn(() => scrollToId('gallery'), 'Gallery', <><rect x="3" y="4" width="18" height="16" rx="2.5" /><circle cx="8.5" cy="9.5" r="1.5" /><path d="M21 16l-5.2-5.2a2 2 0 00-2.8 0L4 19" /></>, 'gallery')}
        {hasContact && iconBtn(() => scrollToId('contact'), 'RSVP To', <><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M3.5 6.5L12 13l8.5-6.5" /></>, 'contact')}
        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: dark, opacity: 0.8, textDecoration: 'none', padding: '2px 4px' }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s7-7.5 7-12.5A7 7 0 105 9.5C5 14.5 12 22 12 22z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
            <span style={{ fontSize: 8 }}>Location</span>
          </a>
        )}
        {hasMusic && <div style={{ width: 44, flexShrink: 0 }} />}
        {hasMusic && (
          <button onClick={toggleMusic} aria-label={playing ? 'Pause music' : 'Play music'} style={{ position: 'absolute', right: 4, top: -16, width: 46, height: 46, borderRadius: '50%', border: '3px solid #fff', background: `linear-gradient(135deg,${primary},${primaryLight})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: `0 6px 16px ${dark}40` }}>
            {playing ? (
              <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" /><path d="M16.5 9a3.5 3.5 0 010 6M19 6.5a7 7 0 010 11" /></svg>
            ) : (
              <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" /><path d="M16.5 9l5 6M21.5 9l-5 6" /></svg>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

const sectionCard: React.CSSProperties = { background: "#fff", margin: "0 16px 16px", borderRadius: 22, padding: "1.8rem", boxShadow: "0 2px 20px rgba(44,74,99,0.07)", position: 'relative', overflow: 'hidden' }
const sectionEyebrow = (primary: string): React.CSSProperties => ({ fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color: primary, textAlign: "center", marginBottom: 6, fontWeight: 700 })

export default function FirstCommunionTemplate({ couple }: { couple: EventInvite }) {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#fbfaf7" }} />}>
      <FirstCommunionInner couple={couple} />
    </Suspense>
  )
}

function FirstCommunionInner({ couple }: { couple: EventInvite }) {
  const searchParams = useSearchParams()
  const guestName = searchParams?.get('name') || ''
  const introEnabled = (couple as any).show_guest_intro !== false
  const [showIntro, setShowIntro] = useState(!!guestName && introEnabled)
  const [opened, setOpened] = useState(false)
  const [videoPlaying, setVideoPlaying] = useState(false)
  const [coverVideoReady, setCoverVideoReady] = useState(false)
  const [heroVideoReady, setHeroVideoReady] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const coverVideoRef = useRef<HTMLVideoElement | null>(null)
  const coverVideoUrl = couple.cover_video_url || ''
  const videoDurationRef = useRef(0)
  const videoEndedHandledRef = useRef(false)
  const videoSafetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => { return () => { if (videoSafetyTimerRef.current) clearTimeout(videoSafetyTimerRef.current) } }, [])

  const PRIMARY = couple.custom_colors?.primary || DEFAULT_PALETTE.primary
  const PRIMARY_LIGHT = couple.custom_colors?.primaryLight || DEFAULT_PALETTE.primaryLight
  const DARK = couple.custom_colors?.dark || DEFAULT_PALETTE.dark
  const CREAM = couple.custom_colors?.cream || DEFAULT_PALETTE.cream
  const MUTED = DEFAULT_PALETTE.muted

  const hasMusic = !!couple.song_url
  useEffect(() => {
    if (!couple.song_url) { audioRef.current = null; return }
    const audio = new Audio(couple.song_url)
    audio.loop = true; audio.volume = 0.6; audioRef.current = audio
    return () => { audio.pause(); audio.src = "" }
  }, [couple])

  const handleOpen = () => {
    if (coverVideoUrl) {
      setVideoPlaying(true)
      videoEndedHandledRef.current = false
      // Intro video plays muted (silent) — the uploaded background music,
      // not the video's own sound, is what guests hear, starting the
      // instant they tap "Open Invitation" (a genuine user gesture, so
      // autoplay-with-sound isn't blocked).
      audioRef.current?.play().catch(() => {})
      coverVideoRef.current?.play().catch(() => { handleVideoEnded() })
      const dur = videoDurationRef.current
      const fallbackMs = (dur && isFinite(dur) && dur > 0 ? dur + 2.5 : 20) * 1000
      if (videoSafetyTimerRef.current) clearTimeout(videoSafetyTimerRef.current)
      videoSafetyTimerRef.current = setTimeout(() => handleVideoEnded(), fallbackMs)
    } else {
      setOpened(true)
      audioRef.current?.play().catch(() => {})
    }
  }
  const handleVideoEnded = () => {
    if (videoEndedHandledRef.current) return
    videoEndedHandledRef.current = true
    if (videoSafetyTimerRef.current) { clearTimeout(videoSafetyTimerRef.current); videoSafetyTimerRef.current = null }
    setVideoPlaying(false)
    setOpened(true)
    audioRef.current?.play().catch(() => {})
  }

  const sv = {
    gallery: couple.section_visibility?.gallery ?? true, countdown: couple.section_visibility?.countdown ?? true,
    timeline: couple.section_visibility?.timeline ?? true, music: couple.section_visibility?.music ?? true,
    thank_you: couple.section_visibility?.thank_you ?? true,
  }
  const W = {
    childName: couple.title, host: couple.host || '',
    relationLine: (couple as any).event_tagline || 'Of Our Son',
    date: couple.event_date, coverPhoto: couple.cover_photo || '',
    song: couple.song_title || 'Hymn', artist: couple.song_artist || 'InviteGlow',
    timeline: couple.timeline || [], gallery: couple.gallery || [],
  }
  const firstName = W.childName.split(' ')[0] || W.childName

  const contactList: { name: string; phone: string }[] = Array.isArray(couple.contacts)
    ? couple.contacts.filter(c => c?.phone).map(c => ({ name: c.name || '', phone: c.phone }))
    : []
  const hasWishes = couple.enable_guest_wishes ?? false
  const hasVisualCover = !!(coverVideoUrl || W.coverPhoto)

  const evDate = couple.event_date ? new Date(couple.event_date) : null
  const evDateDisplay = evDate ? evDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'To be announced'
  const evStartTime = evDate ? evDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''
  const evTimeDisplay = evDate ? ((couple as any).event_end_time ? `${evStartTime} – ${(couple as any).event_end_time}` : `${evStartTime} Onwards`) : 'To be announced'

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", minHeight: "100vh", background: CREAM }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500;1,600;1,700&family=Inter:wght@300;400;500;600;700&display=swap');
        input::placeholder, textarea::placeholder { color: #a8bccf; }
        .fc-blossom { position: absolute; top: -20px; opacity: 0; display: block; animation-name: fc-fall; animation-timing-function: linear; animation-iteration-count: infinite; }
        @keyframes fc-fall {
          0% { transform: translateY(-20px) translateX(0) rotate(0deg); opacity: 0; }
          8% { opacity: 0.6; }
          92% { opacity: 0.4; }
          100% { transform: translateY(110vh) translateX(26px) rotate(200deg); opacity: 0; }
        }
      `}</style>

      <AnimatePresence>
        {showIntro && guestName && (
          <GuestIntroScreen guestName={guestName} onDone={() => setShowIntro(false)} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} cream={CREAM} dark={DARK} muted={MUTED} />
        )}
      </AnimatePresence>

      <div style={{ maxWidth: 480, margin: "0 auto", background: CREAM, boxShadow: "0 0 80px rgba(44,74,99,0.08)", position: "relative" }}>

        <AnimatePresence>
          {!opened && (
            <motion.div key="cover" exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", background: DARK }}>

              {(coverVideoUrl || W.coverPhoto) ? (
                <>
                  {W.coverPhoto && (
                    <img src={W.coverPhoto} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none" }} />
                  )}
                  {coverVideoUrl && (
                    <video ref={coverVideoRef} playsInline muted preload="auto" poster={W.coverPhoto || undefined}
                      onLoadedMetadata={e => { try { e.currentTarget.currentTime = 0.1 } catch {} ; videoDurationRef.current = e.currentTarget.duration }}
                      onLoadedData={() => setCoverVideoReady(true)}
                      onCanPlay={() => setCoverVideoReady(true)}
                      onPlaying={() => setCoverVideoReady(true)}
                      onEnded={handleVideoEnded}
                      onPause={e => { if (e.currentTarget.ended) handleVideoEnded() }}
                      onTimeUpdate={e => {
                        const v = e.currentTarget
                        if (!coverVideoReady) setCoverVideoReady(true)
                        if (videoPlaying && isFinite(v.duration) && v.duration > 0 && v.currentTime >= v.duration - 0.2) handleVideoEnded()
                      }}
                      onError={() => handleVideoEnded()}
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: coverVideoReady ? 1 : 0, transition: "opacity 0.5s ease" }}>
                      <source src={coverVideoUrl} type="video/mp4" />
                    </video>
                  )}
                  {!videoPlaying && (
                    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(20,35,48,0.55) 0%, rgba(20,35,48,0.22) 35%, rgba(20,35,48,0.38) 65%, rgba(20,35,48,0.8) 100%)` }} />
                  )}
                </>
              ) : (
                <>
                  <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 90% 70% at 50% 20%, ${PRIMARY} 0%, ${DARK} 70%)` }} />
                  <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)`, backgroundSize: "28px 28px" }} />
                </>
              )}

              {!videoPlaying && <FloatingBlossoms color={PRIMARY_LIGHT} />}

              {!videoPlaying && (
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
                  style={{ textAlign: "center", width: "84%", maxWidth: 340, position: "relative", zIndex: 10, padding: "0 1rem" }}>

                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)", borderRadius: 100, padding: "6px 14px", fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "#fff", marginBottom: "1.2rem", border: "1px solid rgba(255,255,255,0.28)" }}>
                    {(couple as any).cover_badge_text || 'Sacred Celebration'}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                    <GoldCross size={44} color={PRIMARY_LIGHT} />
                  </div>

                  <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "#ffffff", marginBottom: "0.8rem", textShadow: "0 2px 10px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.9)" }}>
                    {guestName ? `Dear ${guestName}` : 'First Holy Communion'}
                  </div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontStyle: "italic", fontSize: "clamp(2.2rem,8.5vw,3.1rem)", color: "#fff", lineHeight: 1.2, textShadow: "0 4px 24px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.7)" }}>{W.childName}</div>
                  <div style={{ fontSize: 11.5, letterSpacing: "0.2em", textTransform: "uppercase", color: PRIMARY_LIGHT, margin: "0.5rem 0 0" }}>{W.relationLine}</div>
                  {W.host && (
                    <div style={{ fontSize: 11, letterSpacing: "0.08em", color: "rgba(255,255,255,0.8)", margin: "0.4rem 0 0" }}>With the Blessing of {W.host}</div>
                  )}

                  <button onClick={handleOpen} style={{
                    display: "inline-flex", alignItems: "center", gap: 10, marginTop: "1.6rem",
                    background: `linear-gradient(135deg,${DARK},${PRIMARY})`, color: "#fff",
                    border: `1px solid ${PRIMARY_LIGHT}99`, borderRadius: 100, padding: "13px 26px", fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase",
                    cursor: "pointer", fontFamily: "'Inter',sans-serif", fontWeight: 700,
                    boxShadow: `0 10px 28px rgba(0,0,0,0.4), inset 0 0 0 1px ${PRIMARY_LIGHT}22`,
                  }}>
                    Open Invitation <span style={{ color: PRIMARY_LIGHT }}>→</span>
                  </button>
                  {hasMusic && <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", marginTop: 12, letterSpacing: "0.05em", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>🎵 Tap to begin — with music</div>}
                </motion.div>
              )}
              {videoPlaying && (
                <button onClick={handleVideoEnded} style={{ position: "absolute", bottom: 24, right: 24, zIndex: 10, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)", color: "#fff", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 100, padding: "8px 18px", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>
                  Skip →
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {opened && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>

            {/* Hero band — looping muted video/photo once opened */}
            <div style={{ position: "relative", height: hasVisualCover ? 460 : 220, overflow: "hidden" }}>
              {(coverVideoUrl || W.coverPhoto) ? (
                <>
                  {W.coverPhoto && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={W.coverPhoto} alt={W.childName} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none" }} />
                  )}
                  {coverVideoUrl && (
                    <video autoPlay muted playsInline preload="auto" poster={W.coverPhoto || undefined}
                      onLoadedMetadata={e => { try { e.currentTarget.currentTime = 0.1 } catch {} }}
                      onLoadedData={() => setHeroVideoReady(true)}
                      onCanPlay={() => setHeroVideoReady(true)}
                      onPlaying={() => setHeroVideoReady(true)}
                      loop
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: heroVideoReady ? 1 : 0, transition: "opacity 0.5s ease" }}>
                      <source src={coverVideoUrl} type="video/mp4" />
                    </video>
                  )}
                  <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(20,35,48,0.15) 0%, transparent 40%, ${CREAM}00 60%, ${CREAM} 96%)` }} />
                </>
              ) : (
                <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 90% 70% at 50% 0%, ${PRIMARY}33 0%, ${CREAM} 75%)` }} />
              )}
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 20, textAlign: "center", zIndex: 2 }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontStyle: "italic", fontSize: "1.7rem", color: hasVisualCover ? "#fff" : DARK, textShadow: hasVisualCover ? "0 3px 14px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.7)" : "none" }}>{W.childName}</div>
                {W.host && (
                  <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: hasVisualCover ? "rgba(255,255,255,0.85)" : MUTED, marginTop: 4 }}>With the Blessing of {W.host}</div>
                )}
              </div>
            </div>

            {/* Blessing / Invitation card — the reference layout: gold
                cross, eyebrow, heading, relation line, script name,
                divider, warm message. */}
            <motion.div style={sectionCard} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
              <div style={{ position: 'absolute', top: -30, right: -30 }}><FloralCorner size={170} /></div>
              <div style={{ position: 'absolute', bottom: -34, left: -34 }}><FloralCorner size={170} flip /></div>
              <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: MUTED, marginBottom: 14 }}>Kindly Join Us For The</div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}><GoldCross size={54} color={PRIMARY_LIGHT} /></div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontStyle: 'italic', fontSize: "1.5rem", color: DARK, lineHeight: 1.1 }}>First Holy</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "2.1rem", color: PRIMARY, letterSpacing: '0.04em', marginTop: 2 }}>COMMUNION</div>
                <div style={{ fontSize: 11.5, letterSpacing: "0.22em", textTransform: "uppercase", color: MUTED, marginTop: 8 }}>{W.relationLine}</div>
                <GoldDivider color={PRIMARY_LIGHT} />
                <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontStyle: "italic", fontSize: "2.3rem", color: DARK }}>{W.childName}</div>
                <p style={{ fontSize: 13.5, color: DARK, opacity: 0.75, lineHeight: 1.9, marginTop: 20, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
                  We joyfully invite you to witness {firstName} receive the Holy Eucharist for the first time — a blessed milestone in faith and love.
                </p>
                {contactList.length > 0 && (
                  <>
                    <GoldDivider color={PRIMARY_LIGHT} width={56} />
                    <div style={{ fontSize: 10.5, letterSpacing: "0.28em", textTransform: "uppercase", color: MUTED }}>RSVP To {contactList[0].name}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 6, fontSize: 15, fontWeight: 700, color: PRIMARY }}>
                      <span aria-hidden="true">📞</span> {contactList[0].phone}
                    </div>
                  </>
                )}
              </div>
            </motion.div>

            {/* Event details */}
            <motion.div style={sectionCard} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
              <div style={sectionEyebrow(PRIMARY)}>✝ The Celebration</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.5rem", color: DARK, textAlign: "center", marginBottom: 20 }}>Ceremony Details</div>
              {[
                { icon: "📅", label: "Date", val: evDateDisplay },
                { icon: "⏰", label: "Time", val: evTimeDisplay },
                { icon: "📍", label: "Venue", val: couple.venue || 'Venue to be announced', sub: couple.venue_address },
              ].map(d => (
                <div key={d.label} style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "12px 0", borderBottom: `1px solid ${PRIMARY}1a` }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${PRIMARY_LIGHT}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>{d.icon}</div>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: MUTED }}>{d.label}</div>
                    <div style={{ fontSize: 15, color: DARK, fontWeight: 700, marginTop: 2 }}>{d.val}</div>
                    {d.sub && <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{d.sub}</div>}
                  </div>
                </div>
              ))}
              {couple.maps_url && (
                <a href={couple.maps_url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: `${PRIMARY_LIGHT}30`, borderRadius: 100, padding: "10px 20px", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: PRIMARY, marginTop: 16, textDecoration: "none", fontWeight: 700 }}>
                  📍 View Location on Maps
                </a>
              )}
            </motion.div>

            {sv.countdown && couple.event_date && (
              <div id="savethedate" style={{ ...sectionCard, textAlign: "center" }}>
                <div style={sectionEyebrow(PRIMARY)}>Counting Down to This Blessed Day</div>
                <Countdown targetDate={W.date} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} muted={MUTED} />
              </div>
            )}

            <RSVP coupleId={couple.id} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} cream={CREAM} muted={MUTED} guestName={guestName} />

            {sv.timeline && W.timeline.length > 0 && (
              <motion.div style={sectionCard} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
                <div style={sectionEyebrow(PRIMARY)}>Programme</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.5rem", color: DARK, textAlign: "center", marginBottom: 20 }}>Order of the Day</div>
                <div style={{ position: "relative", paddingLeft: 20 }}>
                  <div style={{ position: "absolute", left: 6, top: 0, bottom: 0, width: 1, background: `${PRIMARY_LIGHT}77` }} />
                  {W.timeline.map((t, i) => (
                    <div key={i} style={{ position: "relative", padding: "10px 0 10px 20px" }}>
                      <div style={{ position: "absolute", left: -14, top: 14, width: 10, height: 10, borderRadius: "50%", background: PRIMARY, border: "2px solid #fff", boxShadow: `0 0 0 2px ${PRIMARY_LIGHT}` }} />
                      <div style={{ fontSize: 11, fontWeight: 700, color: PRIMARY, letterSpacing: "0.1em" }}>{t.time}</div>
                      <div style={{ fontSize: 13, color: DARK, fontWeight: 500, marginTop: 2 }}>{t.event}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {hasWishes && (
              <div id="wishes" style={sectionCard}>
                <div style={sectionEyebrow(PRIMARY)}>Share Your Thoughts</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.5rem", color: DARK, textAlign: "center", marginBottom: 20 }}>Blessings & Well Wishes</div>
                <WishesWall coupleId={couple.id} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} cream={CREAM} muted={MUTED} />
              </div>
            )}

            {sv.music && hasMusic && (
              <motion.div style={sectionCard} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
                <div style={sectionEyebrow(PRIMARY)}>Now Playing</div>
                <MusicPlayerUI title={W.song} artist={W.artist} audioRef={audioRef} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} muted={MUTED} />
              </motion.div>
            )}

            {sv.gallery && W.gallery.length > 0 && (
              <motion.div id="gallery" style={sectionCard} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
                <div style={sectionEyebrow(PRIMARY)}>Highlights</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.5rem", color: DARK, textAlign: "center", marginBottom: 20 }}>Cherished Moments</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {W.gallery.map((src, i) => (
                    <div key={i} style={{ gridRow: i === 0 ? "span 2" : undefined, borderRadius: 18, overflow: "hidden", background: `${PRIMARY_LIGHT}30`, aspectRatio: i === 0 ? "1/2" : "1/1" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => (e.currentTarget.style.display = "none")} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {contactList.length > 0 && (
              <div id="contact" style={sectionCard}>
                <div style={sectionEyebrow(PRIMARY)}>Kindly Confirm</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.5rem", color: DARK, textAlign: "center", marginBottom: 20 }}>RSVP To</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {contactList.map((c, i) => (
                    <ContactRow key={i} name={c.name} phone={c.phone} primary={PRIMARY} dark={DARK} muted={MUTED} cream={CREAM} />
                  ))}
                </div>
              </div>
            )}

            {sv.thank_you && (
              <motion.div style={sectionCard} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
                <div style={sectionEyebrow(PRIMARY)}>A Note of Thanks</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.5rem", color: DARK, textAlign: "center", marginBottom: 20 }}>We're Grateful to Have You</div>
                <div style={{ textAlign: "center", fontSize: 13, color: DARK, lineHeight: 2 }}>
                  {(couple as any).thank_you_text || `We're delighted to have you join us as ${firstName} celebrates this blessed milestone. Thank you for being part of this special day.`}
                </div>
                <div style={{ textAlign: "center", marginTop: 16 }}>
                  <div style={{ fontSize: 11, color: MUTED }}>With love and gratitude,</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontStyle: "italic", fontSize: "1.5rem", color: PRIMARY, marginTop: 4 }}>{W.childName}</div>
                </div>
              </motion.div>
            )}

            <div id={contactList.length > 0 ? undefined : "contact"} style={{ padding: "2rem 1.5rem 6.5rem", textAlign: "center", background: "#fff" }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.4rem", color: PRIMARY, marginBottom: 4 }}>InviteGlow</div>
              <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "#a8b0ba" }}>inviteglow.com · Digital Invitations</div>
              {((couple as any).enable_footer_social ?? true) && <FooterSocial color={PRIMARY} background={`${PRIMARY}14`} />}
            </div>
          </motion.div>
        )}
      </div>
      {opened && (
        <BottomNavBar
          primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK}
          mapsUrl={couple.maps_url || ''}
          hasWishes={hasWishes}
          hasGallery={sv.gallery && W.gallery.length > 0}
          hasContact={contactList.length > 0}
          hasMusic={sv.music && hasMusic}
          audioRef={audioRef}
        />
      )}
    </div>
  )
}
