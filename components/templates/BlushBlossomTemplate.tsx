"use client"
import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { supabase, Couple, CoupleColors } from '@/lib/supabase'

/**
 * BlushBlossomTemplate v2 — cherry blossom envelope cover + blush/gold interior.
 * Inspired by: https://wedding-invitation-senu.vercel.app/
 *
 * v2 changes:
 * - Color-safe: sanitises couple.custom_colors so a stray/invalid saved
 *   value (e.g. from testing another theme) can never turn the page purple
 *   or hide text — anything that isn't a valid hex falls back to the
 *   Blush Blossom defaults.
 * - Forces html/body background so no parent layout background can bleed
 *   through gaps between sections.
 * - Softer, larger rounded cards, floating blossom accents, staggered
 *   scroll-in animations, and a proper countdown "chip" layout (no more
 *   stray-looking old-style numerals).
 * - Venue / event cards always show sensible fallback text instead of
 *   rendering empty when a field hasn't been filled in yet.
 */

const DEFAULT_COLORS: Required<CoupleColors> = {
  primary: '#c17d8a',      // rose accent — buttons, dividers, "OPEN" button
  primaryLight: '#f6d9de', // blush pink — soft backgrounds, icon circles
  dark: '#5c4632',         // warm brown — headings & body text
  cream: '#fff5f2',        // page background
}

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

function sanitizeColors(input?: CoupleColors | null): Required<CoupleColors> {
  const safe = { ...DEFAULT_COLORS }
  if (!input) return safe
  ;(Object.keys(safe) as (keyof CoupleColors)[]).forEach(key => {
    const v = input[key]
    if (v && HEX_RE.test(v)) safe[key] = v
  })
  return safe
}

function getInitials(bride?: string, groom?: string) {
  const b = bride?.trim()?.[0]?.toUpperCase() ?? ''
  const g = groom?.trim()?.[0]?.toUpperCase() ?? ''
  return `${b}${g}` || '❤'
}

function formatDate(dateStr?: string) {
  if (!dateStr) return 'Date to be announced'
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function useCountdown(target?: string) {
  const [left, setLeft] = useState({ d: 0, h: 0, m: 0, s: 0 })
  useEffect(() => {
    if (!target) return
    const targetMs = new Date(target).getTime()
    const tick = () => {
      const diff = Math.max(0, targetMs - Date.now())
      setLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target])
  return left
}

const EVENT_LABELS: Record<'engagement' | 'wedding' | 'homecoming', { title: string; icon: string }> = {
  engagement: { title: 'Engagement', icon: '💍' },
  wedding: { title: 'Wedding Ceremony', icon: '👰' },
  homecoming: { title: 'Homecoming', icon: '🏡' },
}

// Small inline blossom used for floating accents & divider ornament — kept
// as a tiny embedded SVG so no external image/font is needed.
function Blossom({ size = 14, color }: { size?: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <g fill={color} opacity={0.9}>
        <ellipse cx="12" cy="6" rx="3.4" ry="5" />
        <ellipse cx="12" cy="18" rx="3.4" ry="5" />
        <ellipse cx="6" cy="12" rx="5" ry="3.4" />
        <ellipse cx="18" cy="12" rx="5" ry="3.4" />
        <ellipse cx="7.8" cy="7.8" rx="3.4" ry="5" transform="rotate(45 7.8 7.8)" />
        <ellipse cx="16.2" cy="16.2" rx="3.4" ry="5" transform="rotate(45 16.2 16.2)" />
        <ellipse cx="16.2" cy="7.8" rx="3.4" ry="5" transform="rotate(-45 16.2 7.8)" />
        <ellipse cx="7.8" cy="16.2" rx="3.4" ry="5" transform="rotate(-45 7.8 16.2)" />
      </g>
      <circle cx="12" cy="12" r="2.6" fill="#fff" opacity={0.85} />
    </svg>
  )
}

function FloatingBlossoms({ color }: { color: string }) {
  const items = [
    { left: '6%', size: 16, delay: 0, dur: 9 },
    { left: '85%', size: 12, delay: 1.5, dur: 11 },
    { left: '22%', size: 10, delay: 3, dur: 8 },
    { left: '70%', size: 14, delay: 2, dur: 10 },
  ]
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {items.map((it, i) => (
        <motion.div
          key={i}
          style={{ position: 'absolute', left: it.left, top: -20 }}
          initial={{ y: -20, opacity: 0, rotate: 0 }}
          animate={{ y: 900, opacity: [0, 0.7, 0.7, 0], rotate: 180 }}
          transition={{ duration: it.dur, delay: it.delay, repeat: Infinity, ease: 'linear' }}
        >
          <Blossom size={it.size} color={color} />
        </motion.div>
      ))}
    </div>
  )
}

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
}

export default function BlushBlossomTemplate({ couple }: { couple: Couple }) {
  const [opened, setOpened] = useState(false)
  const searchParams = useSearchParams()
  const guestName = searchParams?.get('name') || ''

  const colors = sanitizeColors(couple.custom_colors)
  const initials = getInitials(couple.bride, couple.groom)
  const badgeText = (couple as any).cover_badge_text || 'WEDDING INVITATION'
  const familyInvitationText = (couple as any).family_invitation_text
  const togetherWithText = (couple as any).together_with_text || 'together with'
  const thankYouText = (couple as any).thank_you_text
  const brideFamily = couple.bride_family
  const groomFamily = couple.groom_family
  const bridePhone = (couple as any).bride_phone
  const groomPhone = (couple as any).groom_phone
  const section = couple.section_visibility || {}
  const countdown = useCountdown(couple.wedding_date)

  const enabledEvents = useMemo(() => {
    const ev = (couple as any).events as Record<'engagement' | 'wedding' | 'homecoming', {
      enabled: boolean; venue: string; venue_address: string; date: string; maps_url: string
    }> | undefined
    if (!ev) return []
    return (['engagement', 'wedding', 'homecoming'] as const)
      .filter(k => ev[k]?.enabled)
      .map(k => ({ key: k, ...ev[k], ...EVENT_LABELS[k] }))
  }, [couple])

  // ── RSVP form state ──
  const [guestNameInput, setGuestNameInput] = useState(guestName)
  const [response, setResponse] = useState<'yes' | 'no' | null>(null)
  const [guestCount, setGuestCount] = useState(1)
  const [drinking, setDrinking] = useState<'yes' | 'no' | ''>('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [rsvpMessage, setRsvpMessage] = useState('')

  const scrollToId = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  const submitRsvp = async () => {
    if (!guestNameInput.trim() || !response) {
      setRsvpMessage('⚠️ Please add your name and select attending or not.')
      return
    }
    setSubmitting(true)
    setRsvpMessage('')
    const { error } = await supabase.from('rsvps').insert([{
      couple_id: couple.id,
      guest_name: guestNameInput.trim(),
      response,
      guest_count: response === 'yes' ? guestCount : 1,
      drinking: couple.ask_drinking && response === 'yes' ? drinking || null : null,
    }])
    setSubmitting(false)
    if (error) {
      setRsvpMessage('❌ Something went wrong — please try again.')
    } else {
      setSubmitted(true)
    }
  }

  // ── shared style helpers ──
  const sectionWrap: React.CSSProperties = { maxWidth: 460, margin: '0 auto', padding: '0 22px', position: 'relative', zIndex: 1 }
  const sectionHeading: React.CSSProperties = {
    fontFamily: "'Cormorant Garamond',serif", fontSize: '1.75rem', fontWeight: 600,
    color: colors.dark, textAlign: 'center', letterSpacing: '0.01em',
  }
  const divider = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, margin: '14px auto' }}>
      <span style={{ width: 24, height: 1, background: colors.primary, opacity: 0.5 }} />
      <Blossom size={13} color={colors.primary} />
      <span style={{ width: 24, height: 1, background: colors.primary, opacity: 0.5 }} />
    </div>
  )
  const eyebrow: React.CSSProperties = {
    fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', textAlign: 'center',
    color: colors.primary, fontWeight: 700, marginBottom: 8,
  }
  const cardStyle: React.CSSProperties = {
    background: '#fff', borderRadius: 22, boxShadow: `0 10px 34px ${colors.dark}1a`,
  }
  const Section = ({ id, children, mt = 60 }: { id?: string; children: React.ReactNode; mt?: number }) => (
    <motion.div
      id={id}
      variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{ ...sectionWrap, marginTop: mt, textAlign: 'center' }}>
      {children}
    </motion.div>
  )

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: colors.cream, minHeight: '100vh', overflowX: 'hidden', position: 'relative' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        html, body { background: ${colors.cream} !important; margin: 0; }
        .bb-num { font-variant-numeric: tabular-nums lining-nums; }
      `}</style>

      {/* ambient floating blossoms behind everything */}
      {opened && <FloatingBlossoms color={colors.primaryLight} />}

      {/* ───────── ENVELOPE COVER ───────── */}
      <AnimatePresence>
        {!opened && (
          <motion.div
            key="cover"
            exit={{ opacity: 0, transition: { duration: 0.6 } }}
            style={{
              position: 'fixed', inset: 0, zIndex: 50, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              backgroundImage: (couple as any).cover_background_image
                ? `url(${(couple as any).cover_background_image})`
                : `radial-gradient(circle at 50% 25%, ${colors.primaryLight} 0%, ${colors.primary} 60%, ${colors.dark} 135%)`,
              backgroundSize: 'cover', backgroundPosition: 'center',
            }}>
            <FloatingBlossoms color="#ffffff" />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.14)' }} />
            <motion.div
              initial={{ y: 50, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: 'relative', zIndex: 1, width: 300, borderRadius: 18, overflow: 'hidden', boxShadow: '0 24px 70px rgba(0,0,0,0.35)' }}>
              <div style={{
                height: 66, background: `linear-gradient(135deg,${colors.primaryLight},${colors.primary})`,
                clipPath: 'polygon(0 0, 50% 100%, 100% 0)',
              }} />
              <div style={{ background: 'rgba(255,255,255,0.98)', padding: '38px 30px 34px', textAlign: 'center' }}>
                <div style={{
                  width: 66, height: 66, borderRadius: '50%', border: `1.5px solid ${colors.primary}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px',
                  background: colors.primaryLight,
                }}>
                  <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 21, letterSpacing: 2, color: colors.dark }}>{initials}</span>
                </div>
                <div style={{ fontSize: 13, letterSpacing: '0.32em', fontWeight: 700, color: colors.primary, marginBottom: 8 }}>{badgeText}</div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 26 }}>
                  <Blossom size={16} color={colors.primary} />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  animate={{ boxShadow: [`0 0 0 0 ${colors.primary}55`, `0 0 0 14px ${colors.primary}00`] }}
                  transition={{ boxShadow: { duration: 1.8, repeat: Infinity } }}
                  onClick={() => setOpened(true)}
                  aria-label="Open invitation"
                  style={{
                    width: 68, height: 68, borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: colors.primary, color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
                  }}>
                  OPEN
                </motion.button>
              </div>
              <div style={{ height: 18, background: 'rgba(255,255,255,0.98)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.primary, display: 'inline-block' }} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ───────── MAIN CONTENT ───────── */}
      {opened && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }} style={{ paddingTop: 60, paddingBottom: 90, position: 'relative' }}>

          {/* Heading */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ duration: 0.6 }} style={sectionWrap}>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '2.1rem', color: colors.dark, marginBottom: 2, fontWeight: 600 }}>
                {(couple as any).invitation_heading || 'Together with Love'}
              </h1>
              {divider}
              <p style={{ fontSize: 13, color: colors.dark, opacity: 0.7 }}>
                {(couple as any).invitation_subheading || 'Together with love, joy and blessings'}
              </p>
              {guestName && (
                <p style={{ fontSize: 12, color: colors.primary, fontStyle: 'italic', marginTop: 10 }}>Dear {guestName},</p>
              )}
            </div>

            {/* Couple photo card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }} whileInView={{ opacity: 1, scale: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              style={{ ...cardStyle, marginTop: 30, overflow: 'hidden', position: 'relative' }}>
              {couple.couple_photo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={couple.couple_photo} alt={`${couple.bride} & ${couple.groom}`} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{
                  width: '100%', aspectRatio: '3/4',
                  background: `linear-gradient(160deg,${colors.primaryLight},${colors.primary}55)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44,
                }}>💐</div>
              )}
              <div style={{ background: 'rgba(255,255,255,0.96)', padding: '16px 12px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: '2.1rem', color: colors.dark, lineHeight: 1.1 }}>
                  {couple.bride} &amp; {couple.groom}
                </div>
                <div style={{ fontSize: 10, letterSpacing: '0.24em', fontWeight: 700, color: colors.primary, marginTop: 4 }}>{badgeText}</div>
              </div>
            </motion.div>

            <motion.button
              onClick={() => scrollToId('invitation')}
              animate={{ y: [0, 7, 0] }} transition={{ repeat: Infinity, duration: 1.7 }}
              aria-label="Scroll down"
              style={{
                display: 'block', margin: '18px auto 0', width: 38, height: 38, borderRadius: '50%',
                background: colors.primaryLight, color: colors.dark, border: 'none', cursor: 'pointer', fontSize: 15,
                boxShadow: `0 4px 14px ${colors.primary}33`,
              }}>
              ⌄
            </motion.button>
          </motion.div>

          {/* Invitation */}
          <Section id="invitation">
            <div style={sectionHeading}>Invitation</div>
            {divider}
            {(brideFamily || groomFamily) && (
              <p style={{ fontSize: 13, color: colors.dark, opacity: 0.9, marginBottom: 8, fontWeight: 600 }}>
                {groomFamily} {togetherWithText} {brideFamily}
              </p>
            )}
            <div style={eyebrow}>A Loving Invitation From Our Family</div>
            <p style={{ fontSize: 14.5, color: colors.dark, opacity: 0.85, lineHeight: 1.85 }}>
              {familyInvitationText || 'We warmly invite you to join us as we celebrate the beautiful beginning of our lifelong bond.'}
            </p>
          </Section>

          {/* Save the date */}
          <Section>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', color: colors.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span style={{ color: colors.primary }}>♥</span> SAVE THE DATE
            </div>
            <p style={{ fontSize: 12, color: colors.dark, opacity: 0.55, marginTop: 6 }}>Mark Your Calendar</p>
            <motion.div
              whileInView={{ rotate: [0, -8, 8, 0] }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }}
              style={{
                width: 56, height: 56, borderRadius: '50%', background: colors.primaryLight,
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '18px auto', fontSize: 22,
                boxShadow: `0 6px 18px ${colors.primary}33`,
              }}>📅</motion.div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.5rem', color: colors.dark, fontWeight: 700 }}>
              {formatDate(couple.wedding_date)}
            </div>
          </Section>

          {/* Events */}
          {enabledEvents.map(ev => {
            const mapsEmbed = ev.maps_url
              ? ev.maps_url.includes('output=embed') ? ev.maps_url : `${ev.maps_url}${ev.maps_url.includes('?') ? '&' : '?'}output=embed`
              : undefined
            const hasVenueInfo = !!(ev.venue || ev.venue_address)
            return (
              <Section key={ev.key}>
                <div style={sectionHeading}>{ev.icon} {ev.title}</div>
                {divider}
                <p style={{ fontSize: 12, color: colors.dark, opacity: 0.55, marginBottom: 18 }}>Venue, Location and Time Details</p>

                <div style={{ ...cardStyle, overflow: 'hidden', textAlign: 'left', marginBottom: 14 }}>
                  {mapsEmbed ? (
                    <div style={{ position: 'relative' }}>
                      <iframe src={mapsEmbed} style={{ width: '100%', height: 150, border: 0, display: 'block' }} loading="lazy" title={`${ev.venue || 'venue'}-map`} />
                      <a href={ev.maps_url} target="_blank" rel="noopener noreferrer"
                        style={{ position: 'absolute', top: 10, left: 10, fontSize: 10, background: 'rgba(255,255,255,0.94)', padding: '5px 12px', borderRadius: 100, color: colors.dark, textDecoration: 'none', fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                        Open in Maps ↗
                      </a>
                    </div>
                  ) : (
                    <div style={{
                      height: 110, background: `linear-gradient(135deg,${colors.primaryLight},${colors.primary}40)`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                      <span style={{ fontSize: 26 }}>📍</span>
                      {!hasVenueInfo && <span style={{ fontSize: 11, color: colors.dark, opacity: 0.6 }}>Location to be announced</span>}
                    </div>
                  )}
                  <div style={{ padding: '14px 18px' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: colors.dark }}>{ev.venue || 'Venue to be announced'}</div>
                    {ev.venue_address && <div style={{ fontSize: 12, color: colors.dark, opacity: 0.6, marginTop: 2 }}>{ev.venue_address}</div>}
                  </div>
                </div>

                <div style={{ ...cardStyle, padding: '18px 20px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: (bridePhone || groomPhone) ? 16 : 0 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: colors.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 15 }}>🕗</div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: colors.primary, letterSpacing: '0.04em' }}>EVENT TIME</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: colors.dark, marginTop: 2 }}>
                        {ev.date ? new Date(ev.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'To be announced'} onwards
                      </div>
                    </div>
                  </div>
                  {(bridePhone || groomPhone) && (
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: colors.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 15 }}>📞</div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: colors.primary, letterSpacing: '0.04em' }}>CONTACT</div>
                        {bridePhone && <a href={`tel:${bridePhone}`} style={{ display: 'block', fontSize: 13, color: colors.dark, textDecoration: 'none', marginTop: 2 }}>{bridePhone} ({couple.bride})</a>}
                        {groomPhone && <a href={`tel:${groomPhone}`} style={{ display: 'block', fontSize: 13, color: colors.dark, textDecoration: 'none' }}>{groomPhone} ({couple.groom})</a>}
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            )
          })}

          {/* Gallery */}
          {(section.gallery ?? true) && couple.gallery && couple.gallery.length > 0 && (
            <Section>
              <div style={sectionHeading}>Our Moments</div>
              {divider}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }}>
                {couple.gallery.map((url, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <motion.img key={i} src={url} alt=""
                    initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 16, boxShadow: `0 6px 18px ${colors.dark}22` }} />
                ))}
              </div>
            </Section>
          )}

          {/* Timeline */}
          {(section.timeline ?? true) && couple.timeline && couple.timeline.length > 0 && (
            <Section>
              <div style={sectionHeading}>Wedding Timeline</div>
              {divider}
              <div style={{ display: 'grid', gap: 10, marginTop: 18, textAlign: 'left' }}>
                {couple.timeline.map((t, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                    style={{ ...cardStyle, padding: '13px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13.5, color: colors.dark, fontWeight: 600 }}>{t.event}</span>
                    <span style={{ fontSize: 13, color: '#fff', fontWeight: 700, background: colors.primary, padding: '4px 12px', borderRadius: 100 }}>{t.time}</span>
                  </motion.div>
                ))}
              </div>
            </Section>
          )}

          {/* Monogram watermark */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '70px 0', position: 'relative' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
              style={{
                width: 210, height: 210, borderRadius: '50%', border: `1px solid ${colors.dark}`,
                opacity: 0.18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '4.2rem', color: colors.dark }}>{initials}</span>
            </motion.div>
          </div>

          {/* Countdown */}
          {(section.countdown ?? true) && (
            <Section mt={0}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                {[['DAYS', countdown.d], ['HOURS', countdown.h], ['MINS', countdown.m], ['SECS', countdown.s]].map(([label, value]) => (
                  <div key={label as string} style={{
                    ...cardStyle, width: 68, padding: '14px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  }}>
                    <div className="bb-num" style={{ fontFamily: "'Inter',sans-serif", fontSize: '1.5rem', fontWeight: 700, color: colors.dark }}>
                      {String(value).padStart(2, '0')}
                    </div>
                    <div style={{ fontSize: 9, letterSpacing: '0.14em', color: colors.primary, fontWeight: 700 }}>{label}</div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Music */}
          {(section.music ?? true) && couple.song_url && (
            <Section>
              <div style={sectionHeading}>🎵 {couple.song_title || 'Our Song'}</div>
              {couple.song_artist && <p style={{ fontSize: 12, color: colors.dark, opacity: 0.6, marginTop: 4 }}>{couple.song_artist}</p>}
              <div style={{ marginTop: 16 }}>
                {couple.song_url.includes('youtube.com') || couple.song_url.includes('youtu.be') ? (
                  <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: `0 8px 24px ${colors.dark}22` }}>
                    <iframe
                      width="100%" height="180"
                      src={`https://www.youtube.com/embed/${couple.song_url.split(/v=|youtu\.be\//)[1]?.split('&')[0]}?autoplay=0`}
                      title="song" allow="autoplay; encrypted-media" style={{ border: 0 }}
                    />
                  </div>
                ) : (
                  <div style={{ ...cardStyle, padding: 14 }}>
                    <audio controls src={couple.song_url} style={{ width: '100%' }} />
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Thank you */}
          {(section.thank_you ?? true) && (
            <Section>
              <div style={sectionHeading}>🤍 Thank You</div>
              {divider}
              <p style={{ fontSize: 14.5, color: colors.dark, opacity: 0.85, lineHeight: 1.85 }}>
                {thankYouText || 'Thank you for being part of our journey. Your presence means the world to us.'}
              </p>
            </Section>
          )}

          {/* RSVP */}
          <Section id="rsvp-form">
            <motion.div
              whileInView={{ scale: [0.85, 1.05, 1] }} viewport={{ once: true }} transition={{ duration: 0.6 }}
              style={{
                width: 52, height: 52, borderRadius: '50%', background: colors.primaryLight,
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: 22,
                boxShadow: `0 6px 18px ${colors.primary}33`,
              }}>🎁</motion.div>

            {submitted ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ ...cardStyle, padding: '28px 20px' }}>
                <div style={{ fontSize: 30, marginBottom: 8 }}>✅</div>
                <p style={{ fontSize: 14, color: colors.dark, fontWeight: 700 }}>Thank you!</p>
                <p style={{ fontSize: 13, color: colors.dark, opacity: 0.7, marginTop: 4 }}>Your response has been recorded.</p>
              </motion.div>
            ) : (
              <>
                <p style={{ fontSize: 13, color: colors.dark, opacity: 0.8, marginBottom: 18 }}>
                  Please confirm your attendance by filling in the form below.
                </p>
                <div style={{ ...cardStyle, padding: '22px 20px', textAlign: 'left' }}>
                  <input
                    value={guestNameInput} onChange={e => setGuestNameInput(e.target.value)}
                    placeholder="Your name"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${colors.primaryLight}`, fontSize: 14, outline: 'none', marginBottom: 14, fontFamily: "'Inter',sans-serif", boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                    <motion.button whileTap={{ scale: 0.96 }} type="button" onClick={() => setResponse('yes')} style={{
                      flex: 1, padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                      background: response === 'yes' ? colors.primary : colors.primaryLight,
                      color: response === 'yes' ? '#fff' : colors.dark, transition: 'background 0.2s',
                    }}>✓ Accept</motion.button>
                    <motion.button whileTap={{ scale: 0.96 }} type="button" onClick={() => setResponse('no')} style={{
                      flex: 1, padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                      background: response === 'no' ? colors.dark : colors.primaryLight,
                      color: response === 'no' ? '#fff' : colors.dark, transition: 'background 0.2s',
                    }}>✗ Decline</motion.button>
                  </div>
                  <AnimatePresence>
                    {response === 'yes' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                        <div style={{ marginBottom: 14 }}>
                          <label style={{ fontSize: 11, color: colors.dark, opacity: 0.7, display: 'block', marginBottom: 5, fontWeight: 600 }}>Number of guests</label>
                          <input
                            type="number" min={1} max={10} value={guestCount}
                            onChange={e => setGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
                            style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: `1.5px solid ${colors.primaryLight}`, fontSize: 14, outline: 'none', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box' }}
                          />
                        </div>
                        {couple.ask_drinking && (
                          <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: 11, color: colors.dark, opacity: 0.7, display: 'block', marginBottom: 5, fontWeight: 600 }}>Will you be drinking alcohol?</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button type="button" onClick={() => setDrinking('yes')} style={{
                                flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                                background: drinking === 'yes' ? colors.primary : colors.primaryLight, color: drinking === 'yes' ? '#fff' : colors.dark,
                              }}>🍷 Yes</button>
                              <button type="button" onClick={() => setDrinking('no')} style={{
                                flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                                background: drinking === 'no' ? colors.primary : colors.primaryLight, color: drinking === 'no' ? '#fff' : colors.dark,
                              }}>🥤 No</button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {rsvpMessage && <div style={{ fontSize: 12, color: rsvpMessage.startsWith('✅') ? '#16a34a' : '#dc2626', marginBottom: 10 }}>{rsvpMessage}</div>}
                  <motion.button whileTap={{ scale: 0.97 }} onClick={submitRsvp} disabled={submitting} style={{
                    width: '100%', padding: 14, borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: colors.dark, color: '#fff', fontWeight: 700, fontSize: 14.5, opacity: submitting ? 0.6 : 1,
                    boxShadow: `0 8px 20px ${colors.dark}44`,
                  }}>
                    {submitting ? 'Submitting...' : 'Confirm Attendance'}
                  </motion.button>
                </div>
              </>
            )}

            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              style={{
                marginTop: 18, padding: '11px 26px', borderRadius: 100, border: `1.5px solid ${colors.dark}`,
                background: 'transparent', color: colors.dark, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>
              Back to Top
            </button>
          </Section>
        </motion.div>
      )}
    </div>
  )
}
