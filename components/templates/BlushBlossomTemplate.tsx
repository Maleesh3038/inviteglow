"use client"
import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { supabase, Couple, CoupleColors } from '@/lib/supabase'

/**
 * BlushBlossomTemplate — cherry blossom envelope cover + blush/gold interior.
 * Inspired by: https://wedding-invitation-senu.vercel.app/
 *
 * Follows the same conventions as the other templates: plain inline styles
 * (no Tailwind), framer-motion for animation, CoupleColors { primary,
 * primaryLight, dark, cream }, and reads/writes the same `couples` +
 * `rsvps` tables as every other template.
 */

const DEFAULT_COLORS: Required<CoupleColors> = {
  primary: '#c17d8a',      // rose accent — buttons, dividers, "OPEN" button
  primaryLight: '#f3d6d6', // blush pink — soft backgrounds, icon circles
  dark: '#5c4632',         // warm brown — headings & body text
  cream: '#fff6f1',        // page background
}

function getInitials(bride?: string, groom?: string) {
  const b = bride?.trim()?.[0]?.toUpperCase() ?? ''
  const g = groom?.trim()?.[0]?.toUpperCase() ?? ''
  return `${b}${g}` || '❤'
}

function formatDate(dateStr?: string) {
  if (!dateStr) return ''
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

export default function BlushBlossomTemplate({ couple }: { couple: Couple }) {
  const [opened, setOpened] = useState(false)
  const searchParams = useSearchParams()
  const guestName = searchParams?.get('name') || ''

  const colors: Required<CoupleColors> = { ...DEFAULT_COLORS, ...(couple.custom_colors || {}) }
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
  const sectionWrap: React.CSSProperties = { maxWidth: 440, margin: '0 auto', padding: '0 24px' }
  const sectionHeading: React.CSSProperties = {
    fontFamily: "'Cormorant Garamond',serif", fontSize: '1.6rem', fontWeight: 600,
    color: colors.dark, textAlign: 'center', letterSpacing: '0.02em',
  }
  const divider: React.CSSProperties = { width: 34, height: 2, background: colors.primary, margin: '12px auto' }
  const eyebrow: React.CSSProperties = {
    fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', textAlign: 'center',
    color: colors.primary, fontWeight: 600, marginBottom: 6,
  }
  const cardStyle: React.CSSProperties = {
    background: '#fff', borderRadius: 16, boxShadow: '0 6px 24px rgba(92,70,50,0.08)',
  }

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: colors.cream, minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
      `}</style>

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
                : `radial-gradient(circle at 50% 30%, ${colors.primaryLight} 0%, ${colors.primary} 55%, ${colors.dark} 130%)`,
              backgroundSize: 'cover', backgroundPosition: 'center',
            }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.12)' }} />
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }}
              style={{ position: 'relative', zIndex: 1, width: 300, borderRadius: 10, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{
                height: 64, background: `linear-gradient(135deg,${colors.primaryLight},${colors.primary})`,
                clipPath: 'polygon(0 0, 50% 100%, 100% 0)',
              }} />
              <div style={{ background: 'rgba(255,255,255,0.97)', padding: '40px 32px', textAlign: 'center' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', border: `1px solid ${colors.primary}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                }}>
                  <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, letterSpacing: 2, color: colors.dark }}>{initials}</span>
                </div>
                <div style={{ fontSize: 13, letterSpacing: '0.3em', fontWeight: 600, color: colors.primary, marginBottom: 6 }}>{badgeText}</div>
                <div style={{ fontSize: 12, color: colors.dark, opacity: 0.5, marginBottom: 24 }}>~ * ~</div>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setOpened(true)}
                  aria-label="Open invitation"
                  style={{
                    width: 64, height: 64, borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: colors.primary, color: '#fff', fontSize: 11, fontWeight: 700,
                    boxShadow: `0 8px 24px ${colors.primary}66`,
                  }}>
                  OPEN
                </motion.button>
              </div>
              <div style={{ height: 16, background: 'rgba(255,255,255,0.97)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.primary, display: 'inline-block' }} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ───────── MAIN CONTENT ───────── */}
      {opened && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} style={{ paddingTop: 56, paddingBottom: 80 }}>

          {/* Heading */}
          <div style={sectionWrap}>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '2rem', color: colors.dark, marginBottom: 4 }}>
                {(couple as any).invitation_heading || 'Together with Love'}
              </h1>
              <div style={divider} />
              <p style={{ fontSize: 13, color: colors.dark, opacity: 0.75 }}>
                {(couple as any).invitation_subheading || 'Together with love, joy and blessings'}
              </p>
              {guestName && (
                <p style={{ fontSize: 12, color: colors.primary, fontStyle: 'italic', marginTop: 10 }}>Dear {guestName},</p>
              )}
            </div>

            {/* Couple photo card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
              style={{ ...cardStyle, marginTop: 32, overflow: 'hidden', position: 'relative' }}>
              {couple.couple_photo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={couple.couple_photo} alt={`${couple.bride} & ${couple.groom}`} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', aspectRatio: '3/4', background: colors.primaryLight }} />
              )}
              <div style={{ background: 'rgba(255,255,255,0.94)', padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: '1.9rem', color: colors.dark }}>
                  {couple.bride} &amp; {couple.groom}
                </div>
                <div style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 600, color: colors.primary, marginTop: 2 }}>{badgeText}</div>
              </div>
            </motion.div>

            <motion.button
              onClick={() => scrollToId('invitation')}
              animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}
              aria-label="Scroll down"
              style={{
                display: 'block', margin: '16px auto 0', width: 36, height: 36, borderRadius: '50%',
                background: colors.primaryLight, color: colors.dark, border: 'none', cursor: 'pointer', fontSize: 14,
              }}>
              ⌄
            </motion.button>
          </div>

          {/* Invitation */}
          <div id="invitation" style={{ ...sectionWrap, marginTop: 56, textAlign: 'center' }}>
            <div style={sectionHeading}>Invitation</div>
            <div style={divider} />
            {(brideFamily || groomFamily) && (
              <p style={{ fontSize: 13, color: colors.dark, opacity: 0.85, marginBottom: 6 }}>
                {groomFamily} {togetherWithText} {brideFamily}
              </p>
            )}
            <div style={eyebrow}>A Loving Invitation From Our Family</div>
            <p style={{ fontSize: 14, color: colors.dark, opacity: 0.85, lineHeight: 1.8 }}>
              {familyInvitationText || 'We warmly invite you to join us as we celebrate the beautiful beginning of our lifelong bond.'}
            </p>
          </div>

          {/* Save the date */}
          <div style={{ ...sectionWrap, marginTop: 56, textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', color: colors.dark }}>♥ SAVE THE DATE</div>
            <p style={{ fontSize: 12, color: colors.dark, opacity: 0.6, marginTop: 6 }}>Mark Your Calendar</p>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', background: colors.primaryLight,
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '16px auto', fontSize: 20,
            }}>📅</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.4rem', color: colors.dark, fontWeight: 600 }}>
              {formatDate(couple.wedding_date)}
            </div>
          </div>

          {/* Events */}
          {enabledEvents.map(ev => {
            const mapsEmbed = ev.maps_url
              ? ev.maps_url.includes('output=embed') ? ev.maps_url : `${ev.maps_url}${ev.maps_url.includes('?') ? '&' : '?'}output=embed`
              : undefined
            return (
              <div key={ev.key} style={{ ...sectionWrap, marginTop: 56, textAlign: 'center' }}>
                <div style={sectionHeading}>{ev.icon} {ev.title}</div>
                <div style={divider} />
                <p style={{ fontSize: 12, color: colors.dark, opacity: 0.6, marginBottom: 16 }}>Venue, Location and Time Details</p>

                <div style={{ ...cardStyle, overflow: 'hidden', textAlign: 'left', marginBottom: 12 }}>
                  {mapsEmbed ? (
                    <div style={{ position: 'relative' }}>
                      <iframe src={mapsEmbed} style={{ width: '100%', height: 140, border: 0, display: 'block' }} loading="lazy" title={`${ev.venue}-map`} />
                      <a href={ev.maps_url} target="_blank" rel="noopener noreferrer"
                        style={{ position: 'absolute', top: 8, left: 8, fontSize: 10, background: 'rgba(255,255,255,0.92)', padding: '4px 10px', borderRadius: 100, color: colors.dark, textDecoration: 'none', fontWeight: 600 }}>
                        Open in Maps ↗
                      </a>
                    </div>
                  ) : (
                    <div style={{ height: 100, background: colors.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📍</div>
                  )}
                  <div style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: colors.dark }}>{ev.venue}</div>
                    <div style={{ fontSize: 12, color: colors.dark, opacity: 0.6 }}>{ev.venue_address}</div>
                  </div>
                </div>

                <div style={{ ...cardStyle, padding: '16px 18px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', gap: 10, marginBottom: (bridePhone || groomPhone) ? 14 : 0 }}>
                    <span style={{ fontSize: 16 }}>🕗</span>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: colors.primary }}>Event Time</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>
                        {ev.date ? new Date(ev.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''} onwards
                      </div>
                    </div>
                  </div>
                  {(bridePhone || groomPhone) && (
                    <div style={{ display: 'flex', gap: 10 }}>
                      <span style={{ fontSize: 16 }}>📞</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: colors.primary }}>Contact</div>
                        {bridePhone && <a href={`tel:${bridePhone}`} style={{ display: 'block', fontSize: 12, color: colors.dark, textDecoration: 'none' }}>{bridePhone} ({couple.bride})</a>}
                        {groomPhone && <a href={`tel:${groomPhone}`} style={{ display: 'block', fontSize: 12, color: colors.dark, textDecoration: 'none' }}>{groomPhone} ({couple.groom})</a>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Gallery */}
          {(section.gallery ?? true) && couple.gallery && couple.gallery.length > 0 && (
            <div style={{ ...sectionWrap, marginTop: 56, textAlign: 'center' }}>
              <div style={sectionHeading}>Our Moments</div>
              <div style={divider} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
                {couple.gallery.map((url, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img key={i} src={url} alt="" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 12 }} />
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          {(section.timeline ?? true) && couple.timeline && couple.timeline.length > 0 && (
            <div style={{ ...sectionWrap, marginTop: 56, textAlign: 'center' }}>
              <div style={sectionHeading}>Wedding Timeline</div>
              <div style={divider} />
              <div style={{ display: 'grid', gap: 10, marginTop: 16, textAlign: 'left' }}>
                {couple.timeline.map((t, i) => (
                  <div key={i} style={{ ...cardStyle, padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: colors.dark, fontWeight: 600 }}>{t.event}</span>
                    <span style={{ fontSize: 13, color: colors.primary, fontWeight: 600 }}>{t.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monogram watermark */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '64px 0' }}>
            <div style={{
              width: 200, height: 200, borderRadius: '50%', border: `1px solid ${colors.dark}`,
              opacity: 0.15, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '4rem', color: colors.dark }}>{initials}</span>
            </div>
          </div>

          {/* Countdown */}
          {(section.countdown ?? true) && (
            <div style={{ ...sectionWrap, textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 28 }}>
                {[['DAYS', countdown.d], ['HOURS', countdown.h], ['MINUTES', countdown.m], ['SECONDS', countdown.s]].map(([label, value]) => (
                  <div key={label as string}>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '2rem', fontWeight: 700, color: colors.dark }}>
                      {String(value).padStart(2, '0')}
                    </div>
                    <div style={{ fontSize: 9, letterSpacing: '0.15em', color: colors.primary, marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Music */}
          {(section.music ?? true) && couple.song_url && (
            <div style={{ ...sectionWrap, marginTop: 56, textAlign: 'center' }}>
              <div style={sectionHeading}>🎵 {couple.song_title || 'Our Song'}</div>
              {couple.song_artist && <p style={{ fontSize: 12, color: colors.dark, opacity: 0.6 }}>{couple.song_artist}</p>}
              <div style={{ marginTop: 12 }}>
                {couple.song_url.includes('youtube.com') || couple.song_url.includes('youtu.be') ? (
                  <div style={{ borderRadius: 12, overflow: 'hidden' }}>
                    <iframe
                      width="100%" height="180"
                      src={`https://www.youtube.com/embed/${couple.song_url.split(/v=|youtu\.be\//)[1]?.split('&')[0]}?autoplay=0`}
                      title="song" allow="autoplay; encrypted-media" style={{ border: 0 }}
                    />
                  </div>
                ) : (
                  <audio controls src={couple.song_url} style={{ width: '100%' }} />
                )}
              </div>
            </div>
          )}

          {/* Thank you */}
          {(section.thank_you ?? true) && (
            <div style={{ ...sectionWrap, marginTop: 56, textAlign: 'center' }}>
              <div style={sectionHeading}>🤍 Thank You</div>
              <div style={divider} />
              <p style={{ fontSize: 14, color: colors.dark, opacity: 0.85, lineHeight: 1.8 }}>
                {thankYouText || 'Thank you for being part of our journey. Your presence means the world to us.'}
              </p>
            </div>
          )}

          {/* RSVP */}
          <div id="rsvp-form" style={{ ...sectionWrap, marginTop: 56, textAlign: 'center' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', background: colors.primaryLight,
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 20,
            }}>🎁</div>

            {submitted ? (
              <p style={{ fontSize: 14, color: colors.dark, fontWeight: 600 }}>✅ Thank you! Your response has been recorded.</p>
            ) : (
              <>
                <p style={{ fontSize: 13, color: colors.dark, opacity: 0.8, marginBottom: 16 }}>
                  Please confirm your attendance by filling in the form below.
                </p>
                <div style={{ ...cardStyle, padding: '20px 18px', textAlign: 'left' }}>
                  <input
                    value={guestNameInput} onChange={e => setGuestNameInput(e.target.value)}
                    placeholder="Your name"
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `1px solid ${colors.primaryLight}`, fontSize: 14, outline: 'none', marginBottom: 12, fontFamily: "'Inter',sans-serif", boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <button type="button" onClick={() => setResponse('yes')} style={{
                      flex: 1, padding: '11px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      background: response === 'yes' ? colors.primary : colors.primaryLight,
                      color: response === 'yes' ? '#fff' : colors.dark,
                    }}>✓ Accept</button>
                    <button type="button" onClick={() => setResponse('no')} style={{
                      flex: 1, padding: '11px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      background: response === 'no' ? colors.dark : colors.primaryLight,
                      color: response === 'no' ? '#fff' : colors.dark,
                    }}>✗ Decline</button>
                  </div>
                  {response === 'yes' && (
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 11, color: colors.dark, opacity: 0.7, display: 'block', marginBottom: 4 }}>Number of guests</label>
                      <input
                        type="number" min={1} max={10} value={guestCount}
                        onChange={e => setGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${colors.primaryLight}`, fontSize: 14, outline: 'none', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box' }}
                      />
                    </div>
                  )}
                  {response === 'yes' && couple.ask_drinking && (
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 11, color: colors.dark, opacity: 0.7, display: 'block', marginBottom: 4 }}>Will you be drinking alcohol?</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" onClick={() => setDrinking('yes')} style={{
                          flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                          background: drinking === 'yes' ? colors.primary : colors.primaryLight, color: drinking === 'yes' ? '#fff' : colors.dark,
                        }}>🍷 Yes</button>
                        <button type="button" onClick={() => setDrinking('no')} style={{
                          flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                          background: drinking === 'no' ? colors.primary : colors.primaryLight, color: drinking === 'no' ? '#fff' : colors.dark,
                        }}>🥤 No</button>
                      </div>
                    </div>
                  )}
                  {rsvpMessage && <div style={{ fontSize: 12, color: rsvpMessage.startsWith('✅') ? '#16a34a' : '#dc2626', marginBottom: 10 }}>{rsvpMessage}</div>}
                  <button onClick={submitRsvp} disabled={submitting} style={{
                    width: '100%', padding: 13, borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: colors.dark, color: '#fff', fontWeight: 700, fontSize: 14, opacity: submitting ? 0.6 : 1,
                  }}>
                    {submitting ? 'Submitting...' : 'Confirm Attendance'}
                  </button>
                </div>
              </>
            )}

            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              style={{
                marginTop: 14, padding: '10px 22px', borderRadius: 100, border: `1px solid ${colors.dark}`,
                background: 'transparent', color: colors.dark, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>
              Back to Top
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
