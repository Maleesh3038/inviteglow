"use client"
import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { supabase, Couple, CoupleColors } from '@/lib/supabase'

/**
 * BlushBlossomTemplate v3 — light, airy cherry-blossom invitation.
 * Matches https://wedding-invitation-senu.vercel.app/ closely:
 * pale cream/peach background, warm brown serif headings, subtle repeated
 * monogram watermark, plain-text countdown, quiet icon badges, and a
 * progressive RSVP (button reveals the form, matching the reference).
 *
 * v3 changes from v2:
 * - Much lighter default palette (no saturated pink/rose backgrounds).
 * - Removed the floating-blossom animation clutter — replaced with a
 *   quiet repeated monogram + laurel watermark, like the reference.
 * - Countdown is plain serif numerals over a label, not boxed "chips".
 * - Icon badges are soft cream circles, not bright colored ones.
 * - RSVP starts as a single button + "Back to Top", and reveals the
 *   name/accept-decline form on click — matching the reference exactly.
 * - Colors are still sanitised, so a stray saved value can never turn
 *   the page purple or oversaturated.
 */

const DEFAULT_COLORS: Required<CoupleColors> = {
  primary: '#c1876d',      // muted coral/rose — labels, dividers, accents
  primaryLight: '#f4e6d9', // soft cream — icon badge backgrounds
  dark: '#6b4f36',         // warm brown — headings & body text
  cream: '#fdf6f2',        // page background (top of gradient)
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

const EVENT_LABELS: Record<'engagement' | 'wedding' | 'homecoming', { title: string }> = {
  engagement: { title: 'Engagement' },
  wedding: { title: 'Event Details' },
  homecoming: { title: 'Homecoming' },
}

// Small leaf/vine flourish used to flank the monogram, matching the
// reference's laurel-style watermark.
function Vine({ color, flip = false }: { color: string; flip?: boolean }) {
  return (
    <svg width="46" height="90" viewBox="0 0 46 90" fill="none" style={{ transform: flip ? 'scaleX(-1)' : undefined }}>
      <path d="M4 4C20 20 8 40 24 50C10 58 20 76 4 86" stroke={color} strokeWidth="1.2" fill="none" opacity={0.6} />
      {[14, 30, 50, 66].map((y, i) => (
        <ellipse key={i} cx={i % 2 === 0 ? 12 : 30} cy={y} rx="6" ry="3" fill={color} opacity={0.5}
          transform={`rotate(${i % 2 === 0 ? -30 : 30} ${i % 2 === 0 ? 12 : 30} ${y})`} />
      ))}
    </svg>
  )
}

// A single quiet monogram medallion — circle border, initials, dotted ring,
// flanking vines. Used repeated (very low opacity) as a background watermark.
function Medallion({ initials, color, size = 190 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
      <Vine color={color} />
      <div style={{
        width: size, height: size, borderRadius: '50%', border: `1px solid ${color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0,
      }}>
        <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', border: `1px dashed ${color}`, opacity: 0.5 }} />
        <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: size * 0.34, color, letterSpacing: 1 }}>{initials}</span>
      </div>
      <Vine color={color} flip />
    </div>
  )
}

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
}

export default function BlushBlossomTemplate({ couple }: { couple: Couple }) {
  const [opened, setOpened] = useState(false)
  const [showRsvpForm, setShowRsvpForm] = useState(false)
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
  const sectionWrap: React.CSSProperties = { maxWidth: 440, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }
  const sectionHeading: React.CSSProperties = {
    fontFamily: "'Cormorant Garamond',serif", fontSize: '1.5rem', fontWeight: 700,
    color: colors.dark, textAlign: 'center', letterSpacing: '0.06em',
  }
  const divider = <div style={{ width: 30, height: 1, background: colors.primary, opacity: 0.5, margin: '10px auto 0' }} />
  const eyebrow: React.CSSProperties = {
    fontSize: 10.5, letterSpacing: '0.24em', textTransform: 'uppercase', textAlign: 'center',
    color: colors.primary, fontWeight: 700, marginBottom: 10,
  }
  const cardStyle: React.CSSProperties = {
    background: '#fff', borderRadius: 16, boxShadow: `0 4px 18px ${colors.dark}12`,
  }
  const iconBadge: React.CSSProperties = {
    width: 30, height: 30, borderRadius: '50%', background: colors.primaryLight,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13,
  }
  const Section = ({ id, children, mt = 64 }: { id?: string; children: React.ReactNode; mt?: number }) => (
    <motion.div
      id={id}
      variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      style={{ ...sectionWrap, marginTop: mt, textAlign: 'center' }}>
      {children}
    </motion.div>
  )

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: `linear-gradient(180deg, ${colors.cream} 0%, #fdeee6 55%, #fce0d2 100%)`, minHeight: '100vh', overflowX: 'hidden', position: 'relative' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        html, body { background: ${colors.cream} !important; margin: 0; }
        .bb-num { font-variant-numeric: tabular-nums lining-nums; }
      `}</style>

      {/* ───────── ENVELOPE COVER ───────── */}
      <AnimatePresence>
        {!opened && (
          <motion.div
            key="cover"
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            style={{
              position: 'fixed', inset: 0, zIndex: 50, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              backgroundImage: (couple as any).cover_background_image
                ? `url(${(couple as any).cover_background_image})`
                : `radial-gradient(circle at 50% 25%, ${colors.primaryLight} 0%, ${colors.primary}cc 65%, ${colors.dark} 140%)`,
              backgroundSize: 'cover', backgroundPosition: 'center',
            }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.1)' }} />
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              style={{ position: 'relative', zIndex: 1, width: 290, borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{
                height: 60, background: `linear-gradient(135deg,${colors.primaryLight},${colors.primary})`,
                clipPath: 'polygon(0 0, 50% 100%, 100% 0)',
              }} />
              <div style={{ background: '#fff', padding: '36px 28px 32px', textAlign: 'center' }}>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%', border: `1px solid ${colors.primary}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                }}>
                  <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 19, letterSpacing: 2, color: colors.dark }}>{initials}</span>
                </div>
                <div style={{ fontSize: 12, letterSpacing: '0.3em', fontWeight: 700, color: colors.primary, marginBottom: 22 }}>{badgeText}</div>
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setOpened(true)}
                  aria-label="Open invitation"
                  style={{
                    width: 60, height: 60, borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: colors.primary, color: '#fff', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em',
                  }}>
                  OPEN
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ───────── MAIN CONTENT ───────── */}
      {opened && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} style={{ paddingTop: 50, paddingBottom: 80, position: 'relative' }}>

          {/* Heading */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ duration: 0.55 }} style={sectionWrap}>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.7rem', color: colors.dark, marginBottom: 4, fontWeight: 700 }}>
                {(couple as any).invitation_heading || 'Together with Love'}
              </h1>
              {divider}
              <p style={{ fontSize: 12.5, color: colors.dark, opacity: 0.65, marginTop: 12 }}>
                {(couple as any).invitation_subheading || 'Together with love, joy and blessings'}
              </p>
              {guestName && (
                <p style={{ fontSize: 12, color: colors.primary, fontStyle: 'italic', marginTop: 8 }}>Dear {guestName},</p>
              )}
            </div>

            {/* Couple photo card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{ ...cardStyle, marginTop: 26, overflow: 'hidden', position: 'relative' }}>
              {couple.couple_photo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={couple.couple_photo} alt={`${couple.bride} & ${couple.groom}`} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{
                  width: '100%', aspectRatio: '3/4', background: colors.primaryLight,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40,
                }}>💐</div>
              )}
              <div style={{ background: 'rgba(255,255,255,0.95)', padding: '14px 12px 12px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: '1.9rem', color: colors.dark, lineHeight: 1.1 }}>
                  {couple.bride} &amp; {couple.groom}
                </div>
                <div style={{ fontSize: 10, letterSpacing: '0.22em', fontWeight: 700, color: colors.dark, opacity: 0.7, marginTop: 5 }}>{badgeText}</div>
              </div>
            </motion.div>

            <button
              onClick={() => scrollToId('invitation')}
              aria-label="Scroll down"
              style={{
                display: 'block', margin: '16px auto 0', width: 30, height: 30, borderRadius: '50%',
                background: colors.dark, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12,
              }}>
              ⌄
            </button>
          </motion.div>

          {/* Invitation */}
          <Section id="invitation">
            <div style={sectionHeading}>Invitation</div>
            {divider}
            {(brideFamily || groomFamily) && (
              <p style={{ fontSize: 12.5, color: colors.dark, opacity: 0.85, marginTop: 16, marginBottom: 2, fontWeight: 600 }}>
                {groomFamily} {togetherWithText} {brideFamily}
              </p>
            )}
            <div style={{ ...eyebrow, marginTop: 16 }}>A Loving Invitation From Our Family</div>
            <p style={{ fontSize: 13.5, color: colors.dark, opacity: 0.7, lineHeight: 1.9 }}>
              {familyInvitationText || 'We warmly invite you to join us as we celebrate the beautiful beginning of our lifelong bond.'}
            </p>
          </Section>

          {/* Save the date */}
          <Section>
            <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.14em', color: colors.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span style={{ color: colors.primary }}>♥</span> SAVE THE DATE
            </div>
            <p style={{ fontSize: 11.5, color: colors.dark, opacity: 0.5, marginTop: 6 }}>Mark Your Calendar</p>
            <div style={{
              width: 46, height: 46, borderRadius: '50%', background: colors.primaryLight,
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '18px auto', fontSize: 18,
            }}>📅</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.3rem', color: colors.dark, fontWeight: 700 }}>
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
                <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.14em', color: colors.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <span style={{ color: colors.primary }}>♥</span> {ev.title.toUpperCase()}
                </div>
                {divider}
                <p style={{ fontSize: 11.5, color: colors.dark, opacity: 0.5, margin: '10px 0 16px' }}>Venue, Location and Time Details</p>

                <div style={{ ...cardStyle, overflow: 'hidden', textAlign: 'left', marginBottom: 10 }}>
                  {mapsEmbed ? (
                    <div style={{ position: 'relative' }}>
                      <iframe src={mapsEmbed} style={{ width: '100%', height: 130, border: 0, display: 'block' }} loading="lazy" title={`${ev.venue || 'venue'}-map`} />
                      <a href={ev.maps_url} target="_blank" rel="noopener noreferrer"
                        style={{ position: 'absolute', top: 8, left: 8, fontSize: 10, background: 'rgba(255,255,255,0.95)', padding: '4px 10px', borderRadius: 100, color: colors.dark, textDecoration: 'none', fontWeight: 600 }}>
                        Open in Maps ↗
                      </a>
                    </div>
                  ) : (
                    <div style={{
                      height: 90, background: colors.primaryLight,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                    }}>
                      <span style={{ fontSize: 20 }}>📍</span>
                      {!hasVenueInfo && <span style={{ fontSize: 10.5, color: colors.dark, opacity: 0.55 }}>Location to be announced</span>}
                    </div>
                  )}
                  <div style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: colors.dark }}>{ev.venue || 'Venue to be announced'}</div>
                    {ev.venue_address && <div style={{ fontSize: 11.5, color: colors.dark, opacity: 0.55, marginTop: 2 }}>{ev.venue_address}</div>}
                  </div>
                </div>

                <div style={{ ...cardStyle, padding: '16px 18px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', gap: 12, paddingBottom: (bridePhone || groomPhone) ? 14 : 0, borderBottom: (bridePhone || groomPhone) ? `1px solid ${colors.primaryLight}` : 'none', marginBottom: (bridePhone || groomPhone) ? 14 : 0 }}>
                    <div style={iconBadge}>🕗</div>
                    <div>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: colors.primary, letterSpacing: '0.04em' }}>EVENT TIME</div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: colors.dark, marginTop: 2 }}>
                        {ev.date ? new Date(ev.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'To be announced'} onwards
                      </div>
                      <div style={{ fontSize: 11.5, color: colors.dark, opacity: 0.55, marginTop: 3, lineHeight: 1.5 }}>
                        Ceremony and celebration with family, friends and blessings
                      </div>
                    </div>
                  </div>
                  {(bridePhone || groomPhone) && (
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={iconBadge}>📞</div>
                      <div>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: colors.primary, letterSpacing: '0.04em' }}>CONTACT</div>
                        <div style={{ fontSize: 11.5, color: colors.dark, opacity: 0.55, marginTop: 2, marginBottom: 4 }}>
                          For inquiries, feel free to contact us at the below numbers.
                        </div>
                        {bridePhone && <a href={`tel:${bridePhone}`} style={{ display: 'block', fontSize: 12.5, color: colors.dark, textDecoration: 'none', fontWeight: 600 }}>{bridePhone} ({couple.bride})</a>}
                        {groomPhone && <a href={`tel:${groomPhone}`} style={{ display: 'block', fontSize: 12.5, color: colors.dark, textDecoration: 'none', fontWeight: 600 }}>{groomPhone} ({couple.groom})</a>}
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 18 }}>
                {couple.gallery.map((url, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img key={i} src={url} alt="" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 12 }} />
                ))}
              </div>
            </Section>
          )}

          {/* Timeline */}
          {(section.timeline ?? true) && couple.timeline && couple.timeline.length > 0 && (
            <Section>
              <div style={sectionHeading}>Wedding Timeline</div>
              {divider}
              <div style={{ display: 'grid', gap: 8, marginTop: 18, textAlign: 'left' }}>
                {couple.timeline.map((t, i) => (
                  <div key={i} style={{ ...cardStyle, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: colors.dark, fontWeight: 600 }}>{t.event}</span>
                    <span style={{ fontSize: 12.5, color: colors.primary, fontWeight: 700 }}>{t.time}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Repeated monogram watermark — sits quietly behind the countdown & RSVP */}
          <div style={{ position: 'relative', marginTop: 60 }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 60, opacity: 0.07, pointerEvents: 'none', zIndex: 0 }}>
              <Medallion initials={initials} color={colors.dark} size={210} />
              <Medallion initials={initials} color={colors.dark} size={170} />
              <Medallion initials={initials} color={colors.dark} size={190} />
            </div>

            {/* Countdown */}
            {(section.countdown ?? true) && (
              <Section mt={90}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 30 }}>
                  {[['DAYS', countdown.d], ['HOURS', countdown.h], ['MINUTES', countdown.m], ['SECONDS', countdown.s]].map(([label, value]) => (
                    <div key={label as string}>
                      <div className="bb-num" style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.9rem', fontWeight: 700, color: colors.dark }}>
                        {String(value).padStart(2, '0')}
                      </div>
                      <div style={{ fontSize: 9, letterSpacing: '0.12em', color: colors.primary, fontWeight: 700, marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Music */}
            {(section.music ?? true) && couple.song_url && (
              <Section>
                <div style={sectionHeading}>Our Song</div>
                {couple.song_artist && <p style={{ fontSize: 11.5, color: colors.dark, opacity: 0.55, marginTop: 4 }}>{couple.song_artist}</p>}
                <div style={{ marginTop: 16 }}>
                  {couple.song_url.includes('youtube.com') || couple.song_url.includes('youtu.be') ? (
                    <div style={{ borderRadius: 14, overflow: 'hidden' }}>
                      <iframe
                        width="100%" height="170"
                        src={`https://www.youtube.com/embed/${couple.song_url.split(/v=|youtu\.be\//)[1]?.split('&')[0]}?autoplay=0`}
                        title="song" allow="autoplay; encrypted-media" style={{ border: 0 }}
                      />
                    </div>
                  ) : (
                    <div style={{ ...cardStyle, padding: 12 }}>
                      <audio controls src={couple.song_url} style={{ width: '100%' }} />
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Thank you */}
            {(section.thank_you ?? true) && (
              <Section>
                <div style={sectionHeading}>Thank You</div>
                {divider}
                <p style={{ fontSize: 13.5, color: colors.dark, opacity: 0.7, lineHeight: 1.9, marginTop: 14 }}>
                  {thankYouText || 'Thank you for being part of our journey. Your presence means the world to us.'}
                </p>
              </Section>
            )}

            {/* RSVP — progressive: button first, form reveals on click, matching the reference */}
            <Section id="rsvp-form">
              <div style={{
                width: 42, height: 42, borderRadius: '50%', background: colors.primaryLight,
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 18,
              }}>🎁</div>

              {submitted ? (
                <div style={{ ...cardStyle, padding: '24px 20px' }}>
                  <div style={{ fontSize: 26, marginBottom: 6 }}>✅</div>
                  <p style={{ fontSize: 13.5, color: colors.dark, fontWeight: 700 }}>Thank you!</p>
                  <p style={{ fontSize: 12.5, color: colors.dark, opacity: 0.6, marginTop: 4 }}>Your response has been recorded.</p>
                </div>
              ) : !showRsvpForm ? (
                <>
                  <p style={{ fontSize: 13, color: colors.dark, opacity: 0.75, marginBottom: 20, fontWeight: 600 }}>
                    Please confirm your attendance by clicking the button below.
                  </p>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    <button onClick={() => setShowRsvpForm(true)} style={{
                      padding: '13px 28px', borderRadius: 100, border: 'none', cursor: 'pointer',
                      background: colors.dark, color: '#fff', fontWeight: 700, fontSize: 13.5,
                    }}>
                      Confirm Attendance
                    </button>
                    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{
                      padding: '13px 22px', borderRadius: 100, border: `1px solid ${colors.dark}`,
                      background: 'transparent', color: colors.dark, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    }}>
                      Back to Top Details
                    </button>
                  </div>
                </>
              ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ ...cardStyle, padding: '20px 18px', textAlign: 'left' }}>
                  <input
                    value={guestNameInput} onChange={e => setGuestNameInput(e.target.value)}
                    placeholder="Your name"
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `1px solid ${colors.primaryLight}`, fontSize: 13.5, outline: 'none', marginBottom: 12, fontFamily: "'Inter',sans-serif", boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <button type="button" onClick={() => setResponse('yes')} style={{
                      flex: 1, padding: '11px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
                      background: response === 'yes' ? colors.primary : colors.primaryLight,
                      color: response === 'yes' ? '#fff' : colors.dark,
                    }}>✓ Accept</button>
                    <button type="button" onClick={() => setResponse('no')} style={{
                      flex: 1, padding: '11px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
                      background: response === 'no' ? colors.dark : colors.primaryLight,
                      color: response === 'no' ? '#fff' : colors.dark,
                    }}>✗ Decline</button>
                  </div>
                  {response === 'yes' && (
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 10.5, color: colors.dark, opacity: 0.6, display: 'block', marginBottom: 4, fontWeight: 600 }}>Number of guests</label>
                      <input
                        type="number" min={1} max={10} value={guestCount}
                        onChange={e => setGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${colors.primaryLight}`, fontSize: 13.5, outline: 'none', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box' }}
                      />
                    </div>
                  )}
                  {response === 'yes' && couple.ask_drinking && (
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 10.5, color: colors.dark, opacity: 0.6, display: 'block', marginBottom: 4, fontWeight: 600 }}>Will you be drinking alcohol?</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" onClick={() => setDrinking('yes')} style={{
                          flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                          background: drinking === 'yes' ? colors.primary : colors.primaryLight, color: drinking === 'yes' ? '#fff' : colors.dark,
                        }}>Yes</button>
                        <button type="button" onClick={() => setDrinking('no')} style={{
                          flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                          background: drinking === 'no' ? colors.primary : colors.primaryLight, color: drinking === 'no' ? '#fff' : colors.dark,
                        }}>No</button>
                      </div>
                    </div>
                  )}
                  {rsvpMessage && <div style={{ fontSize: 11.5, color: rsvpMessage.startsWith('✅') ? '#16a34a' : '#dc2626', marginBottom: 10 }}>{rsvpMessage}</div>}
                  <button onClick={submitRsvp} disabled={submitting} style={{
                    width: '100%', padding: 13, borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: colors.dark, color: '#fff', fontWeight: 700, fontSize: 13.5, opacity: submitting ? 0.6 : 1,
                  }}>
                    {submitting ? 'Submitting...' : 'Confirm Attendance'}
                  </button>
                  <div style={{ textAlign: 'center', marginTop: 12 }}>
                    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{
                      padding: '9px 20px', borderRadius: 100, border: `1px solid ${colors.dark}`,
                      background: 'transparent', color: colors.dark, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                    }}>
                      Back to Top Details
                    </button>
                  </div>
                </motion.div>
              )}
            </Section>
          </div>
        </motion.div>
      )}
    </div>
  )
}
