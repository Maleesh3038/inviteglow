"use client"
import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { supabase, Couple, CoupleColors } from '@/lib/supabase'

/**
 * BlushBlossomTemplate v4 — cherry blossom envelope cover + blush/gold interior.
 * Inspired by: https://wedding-invitation-senu.vercel.app/
 * Structure/polish borrowed from SacredPoruwaTemplate's proven pattern:
 * white rounded cards per section, eyebrow + heading system, and animation
 * that only plays once when a section scrolls into view — nothing loops
 * forever. Icons are plain SVG (no emoji) for a more premium look.
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
  return `${b}${g}` || ''
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
  wedding: { title: 'Wedding Ceremony' },
  homecoming: { title: 'Homecoming' },
}

// ── Clean line-style SVG icons — no emoji anywhere in this template ──
type IconName = 'calendar' | 'clock' | 'pin' | 'phone' | 'gift' | 'heart' | 'music' | 'chevronDown' | 'check' | 'cross' | 'photo' | 'sparkle'
function Icon({ name, size = 16, color }: { name: IconName; size?: number; color: string }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (name) {
    case 'calendar': return <svg {...common}><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M16 3v4M8 3v4M3.5 9.5h17" /></svg>
    case 'clock': return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
    case 'pin': return <svg {...common}><path d="M12 21s6.5-6.9 6.5-11.5a6.5 6.5 0 10-13 0C5.5 14.1 12 21 12 21z" /><circle cx="12" cy="9.3" r="2.3" /></svg>
    case 'phone': return <svg {...common}><path d="M21 16.5v2.7a1.8 1.8 0 01-2 1.8 17.8 17.8 0 01-7.8-2.8 17.5 17.5 0 01-5.4-5.4A17.8 17.8 0 013 5a1.8 1.8 0 011.8-2h2.7a1.8 1.8 0 011.8 1.6c.1.8.3 1.6.6 2.3a1.8 1.8 0 01-.4 1.9L8.4 9.9a14.4 14.4 0 005.7 5.7l1.1-1.1a1.8 1.8 0 011.9-.4c.7.3 1.5.5 2.3.6.9.1 1.6.9 1.6 1.8z" /></svg>
    case 'gift': return <svg {...common}><rect x="3.5" y="8.5" width="17" height="12" rx="1" /><path d="M12 8.5v12M3.5 12.5h17" /><path d="M7.8 8.5a2.3 2.3 0 010-4.6c2.3 0 4.2 4.6 4.2 4.6s1.9-4.6 4.2-4.6a2.3 2.3 0 010 4.6" /></svg>
    case 'heart': return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 20.5s-7-4.4-9.4-8.8C.8 8.1 2.4 4.5 6 4.5c2 0 3.4 1.2 4.2 2.3.8-1.1 2.2-2.3 4.2-2.3 3.6 0 5.2 3.6 3.4 7.2C19 16.1 12 20.5 12 20.5z" /></svg>
    case 'music': return <svg {...common}><path d="M9.5 18V5.3l11-2v12.7" /><circle cx="6.5" cy="18" r="2.8" /><circle cx="17.5" cy="16" r="2.8" /></svg>
    case 'chevronDown': return <svg {...common}><path d="M5.5 8.5L12 15l6.5-6.5" /></svg>
    case 'check': return <svg {...common}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
    case 'cross': return <svg {...common}><path d="M6 6l12 12M18 6L6 18" /></svg>
    case 'photo': return <svg {...common}><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><circle cx="9" cy="10" r="1.8" /><path d="M20.5 16l-4.7-4.7a2 2 0 00-2.8 0L5 19" /></svg>
    case 'sparkle': return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" /></svg>
    default: return null
  }
}

// Small leaf/vine flourish flanking the monogram watermark
function Vine({ color, flip = false }: { color: string; flip?: boolean }) {
  return (
    <svg width="40" height="80" viewBox="0 0 46 90" fill="none" style={{ transform: flip ? 'scaleX(-1)' : undefined }}>
      <path d="M4 4C20 20 8 40 24 50C10 58 20 76 4 86" stroke={color} strokeWidth="1.2" fill="none" opacity={0.6} />
      {[14, 30, 50, 66].map((y, i) => (
        <ellipse key={i} cx={i % 2 === 0 ? 12 : 30} cy={y} rx="6" ry="3" fill={color} opacity={0.5}
          transform={`rotate(${i % 2 === 0 ? -30 : 30} ${i % 2 === 0 ? 12 : 30} ${y})`} />
      ))}
    </svg>
  )
}

function Medallion({ initials, color, size = 170 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
      <Vine color={color} />
      <div style={{
        width: size, height: size, borderRadius: '50%', border: `1px solid ${color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0,
      }}>
        <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', border: `1px dashed ${color}`, opacity: 0.5 }} />
        <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: size * 0.32, color, letterSpacing: 1 }}>{initials}</span>
      </div>
      <Vine color={color} flip />
    </div>
  )
}

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }

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
      setRsvpMessage('Please add your name and select attending or not.')
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
      setRsvpMessage('Something went wrong — please try again.')
    } else {
      setSubmitted(true)
    }
  }

  // ── shared style system, matching the SacredPoruwa card pattern ──
  const cardStyle: React.CSSProperties = {
    background: '#fff', margin: '0 16px 16px', borderRadius: 22, padding: '1.8rem',
    boxShadow: `0 2px 20px ${colors.dark}12`, position: 'relative', overflow: 'hidden',
  }
  const eyebrow: React.CSSProperties = {
    fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', textAlign: 'center',
    color: colors.primary, marginBottom: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  }
  const heading: React.CSSProperties = {
    fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '1.5rem',
    color: colors.dark, textAlign: 'center', marginBottom: '1.1rem',
  }
  const iconBadge: React.CSSProperties = {
    width: 34, height: 34, borderRadius: '50%', background: colors.primaryLight,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }
  // Every section fades/slides up exactly once, the first time it enters the
  // viewport — nothing here loops or plays while idle.
  const Reveal = ({ id, style, children }: { id?: string; style?: React.CSSProperties; children: React.ReactNode }) => (
    <motion.div id={id} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, ease: 'easeOut' }} style={style}>
      {children}
    </motion.div>
  )

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", minHeight: '100vh', background: `linear-gradient(180deg, ${colors.cream} 0%, #fdeee6 55%, #fce0d2 100%)` }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Inter:wght@400;500;600;700&display=swap');
        html, body { background: ${colors.cream} !important; margin: 0; }
        .bb-num { font-variant-numeric: tabular-nums lining-nums; }
      `}</style>

      <div style={{ maxWidth: 480, margin: '0 auto', position: 'relative' }}>

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
                initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={{ position: 'relative', zIndex: 1, width: 280, borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                <div style={{
                  height: 58, background: `linear-gradient(135deg,${colors.primaryLight},${colors.primary})`,
                  clipPath: 'polygon(0 0, 50% 100%, 100% 0)',
                }} />
                <div style={{ background: '#fff', padding: '34px 26px 30px', textAlign: 'center' }}>
                  <div style={{
                    width: 58, height: 58, borderRadius: '50%', border: `1px solid ${colors.primary}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                  }}>
                    <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, letterSpacing: 2, color: colors.dark }}>{initials}</span>
                  </div>
                  <div style={{ fontSize: 11, letterSpacing: '0.28em', fontWeight: 700, color: colors.primary, marginBottom: 20 }}>{badgeText}</div>
                  <button
                    onClick={() => setOpened(true)}
                    aria-label="Open invitation"
                    style={{
                      width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer',
                      background: colors.primary, color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                    }}>
                    OPEN
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ───────── MAIN CONTENT ───────── */}
        {opened && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} style={{ paddingTop: 44, paddingBottom: 60 }}>

            {/* Heading + couple photo */}
            <div style={{ padding: '0 16px', textAlign: 'center' }}>
              <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '1.6rem', color: colors.dark, marginBottom: 4 }}>
                {(couple as any).invitation_heading || 'Together with Love'}
              </h1>
              <div style={{ width: 28, height: 1, background: colors.primary, opacity: 0.5, margin: '8px auto' }} />
              <p style={{ fontSize: 12.5, color: colors.dark, opacity: 0.6 }}>
                {(couple as any).invitation_subheading || 'Together with love, joy and blessings'}
              </p>
              {guestName && (
                <p style={{ fontSize: 12, color: colors.primary, fontStyle: 'italic', marginTop: 8 }}>Dear {guestName},</p>
              )}
            </div>

            <div style={{ ...cardStyle, marginTop: 24, padding: 0, overflow: 'hidden' }}>
              {couple.couple_photo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={couple.couple_photo} alt={`${couple.bride} & ${couple.groom}`} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', aspectRatio: '3/4', background: colors.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="photo" size={38} color={colors.primary} />
                </div>
              )}
              <div style={{ background: '#fff', padding: '16px 12px 14px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: '1.9rem', color: colors.dark, lineHeight: 1.1 }}>
                  {couple.bride} &amp; {couple.groom}
                </div>
                <div style={{ fontSize: 10, letterSpacing: '0.22em', fontWeight: 700, color: colors.dark, opacity: 0.65, marginTop: 5 }}>{badgeText}</div>
              </div>
            </div>

            <button
              onClick={() => scrollToId('invitation')}
              aria-label="Scroll down"
              style={{
                display: 'block', margin: '14px auto 0', width: 30, height: 30, borderRadius: '50%',
                background: colors.dark, border: 'none', cursor: 'pointer',
              }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="chevronDown" size={14} color="#fff" />
              </span>
            </button>

            {/* Invitation */}
            <Reveal id="invitation" style={{ marginTop: 28 }}>
              <div style={cardStyle}>
                <div style={eyebrow}><Icon name="sparkle" size={11} color={colors.primary} />Invitation</div>
                <div style={heading}>A Loving Invitation From Our Family</div>
                {(brideFamily || groomFamily) && (
                  <p style={{ fontSize: 13, color: colors.dark, opacity: 0.9, textAlign: 'center', marginBottom: 10, fontWeight: 600 }}>
                    {groomFamily} {togetherWithText} {brideFamily}
                  </p>
                )}
                <p style={{ fontSize: 13.5, color: colors.dark, opacity: 0.7, lineHeight: 1.9, textAlign: 'center' }}>
                  {familyInvitationText || 'We warmly invite you to join us as we celebrate the beautiful beginning of our lifelong bond.'}
                </p>
              </div>
            </Reveal>

            {/* Save the date */}
            <Reveal>
              <div style={{ ...cardStyle, textAlign: 'center' }}>
                <div style={eyebrow}><Icon name="heart" size={10} color={colors.primary} />Save the Date</div>
                <div style={heading}>Mark Your Calendar</div>
                <div style={{ ...iconBadge, margin: '0 auto 14px' }}>
                  <Icon name="calendar" size={16} color={colors.primary} />
                </div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.3rem', fontWeight: 700, color: colors.dark }}>
                  {formatDate(couple.wedding_date)}
                </div>
              </div>
            </Reveal>

            {/* Events */}
            {enabledEvents.map(ev => {
              const mapsEmbed = ev.maps_url
                ? ev.maps_url.includes('output=embed') ? ev.maps_url : `${ev.maps_url}${ev.maps_url.includes('?') ? '&' : '?'}output=embed`
                : undefined
              const hasVenueInfo = !!(ev.venue || ev.venue_address)
              return (
                <Reveal key={ev.key}>
                  <div style={cardStyle}>
                    <div style={eyebrow}><Icon name="pin" size={10} color={colors.primary} />Venue &amp; Time</div>
                    <div style={heading}>{ev.title}</div>

                    <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 14, border: `1px solid ${colors.primaryLight}` }}>
                      {mapsEmbed ? (
                        <div style={{ position: 'relative' }}>
                          <iframe src={mapsEmbed} style={{ width: '100%', height: 130, border: 0, display: 'block' }} loading="lazy" title={`${ev.venue || 'venue'}-map`} />
                          <a href={ev.maps_url} target="_blank" rel="noopener noreferrer"
                            style={{ position: 'absolute', top: 8, left: 8, fontSize: 10, background: 'rgba(255,255,255,0.95)', padding: '4px 10px', borderRadius: 100, color: colors.dark, textDecoration: 'none', fontWeight: 600 }}>
                            Open in Maps
                          </a>
                        </div>
                      ) : (
                        <div style={{
                          height: 90, background: colors.primaryLight,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}>
                          <Icon name="pin" size={22} color={colors.primary} />
                          {!hasVenueInfo && <span style={{ fontSize: 10.5, color: colors.dark, opacity: 0.55 }}>Location to be announced</span>}
                        </div>
                      )}
                      <div style={{ padding: '12px 16px', background: '#fff' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: colors.dark }}>{ev.venue || 'Venue to be announced'}</div>
                        {ev.venue_address && <div style={{ fontSize: 11.5, color: colors.dark, opacity: 0.55, marginTop: 2 }}>{ev.venue_address}</div>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px 0', borderBottom: (bridePhone || groomPhone) ? `1px solid ${colors.primaryLight}` : 'none', textAlign: 'left' }}>
                      <div style={iconBadge}><Icon name="clock" size={15} color={colors.primary} /></div>
                      <div>
                        <div style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: colors.primary, fontWeight: 700 }}>Event Time</div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: colors.dark, marginTop: 3 }}>
                          {ev.date ? new Date(ev.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'To be announced'} onwards
                        </div>
                        <div style={{ fontSize: 11.5, color: colors.dark, opacity: 0.55, marginTop: 3, lineHeight: 1.5 }}>
                          Ceremony and celebration with family, friends and blessings
                        </div>
                      </div>
                    </div>

                    {(bridePhone || groomPhone) && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px 0 0', textAlign: 'left' }}>
                        <div style={iconBadge}><Icon name="phone" size={15} color={colors.primary} /></div>
                        <div>
                          <div style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: colors.primary, fontWeight: 700 }}>Contact</div>
                          <div style={{ fontSize: 11.5, color: colors.dark, opacity: 0.55, marginTop: 3, marginBottom: 4 }}>
                            For inquiries, feel free to contact us at the below numbers.
                          </div>
                          {bridePhone && <a href={`tel:${bridePhone}`} style={{ display: 'block', fontSize: 12.5, color: colors.dark, textDecoration: 'none', fontWeight: 600 }}>{bridePhone} ({couple.bride})</a>}
                          {groomPhone && <a href={`tel:${groomPhone}`} style={{ display: 'block', fontSize: 12.5, color: colors.dark, textDecoration: 'none', fontWeight: 600 }}>{groomPhone} ({couple.groom})</a>}
                        </div>
                      </div>
                    )}
                  </div>
                </Reveal>
              )
            })}

            {/* Gallery */}
            {(section.gallery ?? true) && couple.gallery && couple.gallery.length > 0 && (
              <Reveal>
                <div style={cardStyle}>
                  <div style={eyebrow}><Icon name="photo" size={10} color={colors.primary} />Our Celebration</div>
                  <div style={heading}>Moments of Love</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {couple.gallery.map((url, i) => (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img key={i} src={url} alt="" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 12 }} />
                    ))}
                  </div>
                </div>
              </Reveal>
            )}

            {/* Timeline */}
            {(section.timeline ?? true) && couple.timeline && couple.timeline.length > 0 && (
              <Reveal>
                <div style={cardStyle}>
                  <div style={eyebrow}><Icon name="clock" size={10} color={colors.primary} />Our Celebration</div>
                  <div style={heading}>Event Timeline</div>
                  <div style={{ position: 'relative', paddingLeft: 20 }}>
                    <div style={{ position: 'absolute', left: 6, top: 0, bottom: 0, width: 1, background: colors.primaryLight }} />
                    {couple.timeline.map((t, i) => (
                      <div key={i} style={{ position: 'relative', padding: '10px 0 10px 20px', textAlign: 'left' }}>
                        <div style={{ position: 'absolute', left: -14, top: 14, width: 10, height: 10, borderRadius: '50%', background: colors.primary, border: '2px solid #fff', boxShadow: `0 0 0 2px ${colors.primaryLight}` }} />
                        <div style={{ fontSize: 11, fontWeight: 700, color: colors.primary, letterSpacing: '0.06em' }}>{t.time}</div>
                        <div style={{ fontSize: 13, color: colors.dark, fontWeight: 600, marginTop: 2 }}>{t.event}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            )}

            {/* Monogram watermark — static, appears once, no looping motion */}
            <Reveal style={{ display: 'flex', justifyContent: 'center', margin: '36px 0', opacity: 0.09 }}>
              <Medallion initials={initials} color={colors.dark} size={190} />
            </Reveal>

            {/* Countdown */}
            {(section.countdown ?? true) && (
              <Reveal>
                <div style={{ ...cardStyle, textAlign: 'center' }}>
                  <div style={eyebrow}><Icon name="sparkle" size={10} color={colors.primary} />Counting Down</div>
                  <div style={heading}>To Our Big Day</div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                    {[['Days', countdown.d], ['Hours', countdown.h], ['Mins', countdown.m], ['Secs', countdown.s]].map(([label, value]) => (
                      <div key={label as string} style={{ flex: 1 }}>
                        <div style={{
                          borderRadius: 14, background: colors.primaryLight, padding: '12px 4px',
                        }}>
                          <span className="bb-num" style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.5rem', fontWeight: 700, color: colors.dark }}>
                            {String(value).padStart(2, '0')}
                          </span>
                        </div>
                        <span style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: colors.primary, display: 'block', marginTop: 6, fontWeight: 700 }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            )}

            {/* Music */}
            {(section.music ?? true) && couple.song_url && (
              <Reveal>
                <div style={cardStyle}>
                  <div style={eyebrow}><Icon name="music" size={10} color={colors.primary} />Our Song</div>
                  <div style={heading}>{couple.song_title || 'A Song for Us'}</div>
                  {couple.song_artist && <p style={{ fontSize: 11.5, color: colors.dark, opacity: 0.55, textAlign: 'center', marginTop: -8, marginBottom: 14 }}>{couple.song_artist}</p>}
                  {couple.song_url.includes('youtube.com') || couple.song_url.includes('youtu.be') ? (
                    <div style={{ borderRadius: 14, overflow: 'hidden' }}>
                      <iframe
                        width="100%" height="170"
                        src={`https://www.youtube.com/embed/${couple.song_url.split(/v=|youtu\.be\//)[1]?.split('&')[0]}?autoplay=0`}
                        title="song" allow="autoplay; encrypted-media" style={{ border: 0 }}
                      />
                    </div>
                  ) : (
                    <audio controls src={couple.song_url} style={{ width: '100%' }} />
                  )}
                </div>
              </Reveal>
            )}

            {/* Thank you */}
            {(section.thank_you ?? true) && (
              <Reveal>
                <div style={cardStyle}>
                  <div style={eyebrow}><Icon name="heart" size={10} color={colors.primary} />A Special Note</div>
                  <div style={heading}>To Our Lovely Guests</div>
                  <p style={{ fontSize: 13.5, color: colors.dark, opacity: 0.7, lineHeight: 1.9, textAlign: 'center' }}>
                    {thankYouText || 'Thank you for being part of our journey. Your presence means the world to us.'}
                  </p>
                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <div style={{ fontSize: 10, color: colors.dark, opacity: 0.5, letterSpacing: '0.1em' }}>With all our love,</div>
                    <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: '1.7rem', color: colors.primary, marginTop: 4 }}>
                      {couple.bride}<span style={{ margin: '0 6px' }}>&amp;</span>{couple.groom}
                    </div>
                  </div>
                </div>
              </Reveal>
            )}

            {/* RSVP — progressive: button first, form reveals on click */}
            <Reveal id="rsvp-form">
              <div style={{ ...cardStyle, textAlign: 'center' }}>
                <div style={eyebrow}><Icon name="gift" size={10} color={colors.primary} />Kindly RSVP</div>
                <div style={heading}>Confirm Your Attendance</div>

                {submitted ? (
                  <div>
                    <div style={{ ...iconBadge, margin: '0 auto 12px', width: 44, height: 44 }}>
                      <Icon name="check" size={20} color={colors.primary} />
                    </div>
                    <p style={{ fontSize: 13.5, color: colors.dark, fontWeight: 700 }}>Thank you!</p>
                    <p style={{ fontSize: 12.5, color: colors.dark, opacity: 0.6, marginTop: 4 }}>Your response has been recorded.</p>
                  </div>
                ) : !showRsvpForm ? (
                  <>
                    <p style={{ fontSize: 13, color: colors.dark, opacity: 0.65, marginBottom: 20 }}>
                      Please let us know if you'll be joining us.
                    </p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button onClick={() => setShowRsvpForm(true)} style={{
                        padding: '13px 28px', borderRadius: 100, border: 'none', cursor: 'pointer',
                        background: colors.dark, color: '#fff', fontWeight: 700, fontSize: 13,
                      }}>
                        Confirm Attendance
                      </button>
                      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{
                        padding: '13px 22px', borderRadius: 100, border: `1px solid ${colors.dark}`,
                        background: 'transparent', color: colors.dark, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      }}>
                        Back to Top
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'left' }}>
                    <input
                      value={guestNameInput} onChange={e => setGuestNameInput(e.target.value)}
                      placeholder="Your name"
                      style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `1px solid ${colors.primaryLight}`, fontSize: 13.5, outline: 'none', marginBottom: 12, fontFamily: "'Inter',sans-serif", boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      <button type="button" onClick={() => setResponse('yes')} style={{
                        flex: 1, padding: '11px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        background: response === 'yes' ? colors.primary : colors.primaryLight,
                        color: response === 'yes' ? '#fff' : colors.dark,
                      }}><Icon name="check" size={13} color={response === 'yes' ? '#fff' : colors.dark} />Accept</button>
                      <button type="button" onClick={() => setResponse('no')} style={{
                        flex: 1, padding: '11px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        background: response === 'no' ? colors.dark : colors.primaryLight,
                        color: response === 'no' ? '#fff' : colors.dark,
                      }}><Icon name="cross" size={13} color={response === 'no' ? '#fff' : colors.dark} />Decline</button>
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
                    {rsvpMessage && <div style={{ fontSize: 11.5, color: colors.primary, marginBottom: 10 }}>{rsvpMessage}</div>}
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
                        Back to Top
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Reveal>

            {/* Footer */}
            <div style={{ padding: '1.6rem 1.5rem 0.4rem', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: '1.4rem', color: colors.primary, marginBottom: 4 }}>InviteGlow</div>
              <div style={{ fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: colors.dark, opacity: 0.4 }}>inviteglow.com · Digital Wedding Invitations</div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
