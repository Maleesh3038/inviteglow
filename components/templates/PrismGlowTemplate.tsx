"use client"
import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { supabase, Couple, CoupleColors } from '@/lib/supabase'
import FooterSocial from '@/components/shared/FooterSocial'

/**
 * PrismGlowTemplate — a deliberately different visual language from every
 * other template in this set (Blush Blossom, Eternal Bloom, etc, which are
 * all soft/floral/pastel with cursive script names). This one is "Bold
 * Geometric": charcoal + coral-red + warm gold, bold sans-serif display
 * type (Syne) instead of cursive script, color-block cards with a solid
 * accent edge instead of soft rounded pastel cards, and a particle/glow
 * intro that gathers scattered light into a geometric monogram frame
 * instead of an envelope-opening animation.
 *
 * Data shape (Couple fields read) matches Blush Blossom exactly, so the
 * existing admin panel needs zero new fields to drive this template.
 */

const DEFAULT_COLORS: Required<CoupleColors> = {
  primary: '#e8432f',
  primaryLight: '#ffe3a8',
  dark: '#15151f',
  cream: '#f6f3ec',
}

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

function luminance(hex: string): number {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map(ch => ch + ch).join('') : clean
  const r = parseInt(full.substring(0, 2), 16) / 255
  const g = parseInt(full.substring(2, 4), 16) / 255
  const b = parseInt(full.substring(4, 6), 16) / 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function sanitizeColors(input?: CoupleColors | null): Required<CoupleColors> {
  const safe = { ...DEFAULT_COLORS }
  if (!input) return safe
  ;(Object.keys(safe) as (keyof CoupleColors)[]).forEach(key => {
    const v = input[key]
    if (!v || !HEX_RE.test(v)) return
    const lum = luminance(v)
    if (key === 'dark' && lum > 0.45) return
    if (key === 'cream' && lum < 0.7) return
    if (key === 'primary' && lum > 0.85) return
    safe[key] = v
  })
  return safe
}

function getInitials(bride?: string, groom?: string) {
  const b = bride?.trim()?.[0]?.toUpperCase() ?? ''
  const g = groom?.trim()?.[0]?.toUpperCase() ?? ''
  return `${b}${g}` || ''
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

function extractLatLng(url?: string): { lat: number; lng: number } | null {
  if (!url) return null
  let m = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) }
  m = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) }
  return null
}

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

type Lang = 'en' | 'si'
const TXT: Record<Lang, Record<string, string>> = {
  en: {
    youAreInvited: "You're Invited",
    skip: 'Skip →',
    dear: 'Dear',
    engagement: 'Engagement',
    eventDetails: 'Event Details',
    homecoming: 'Homecoming',
    wishes: 'Wishes',
    saveDate: 'Save Date',
    gallery: 'Gallery',
    rsvp: 'RSVP',
    contact: 'Contact',
    location: 'Location',
    days: 'DAYS',
    hours: 'HOURS',
    minutes: 'MINUTES',
    seconds: 'SECONDS',
    leaveWish: 'Leave a Wish',
    yourName: 'Your name',
    writeWishes: 'Write your wishes for the couple...',
    addPhotos: 'Add photos or a video (optional)',
    filesSelectedAddMore: 'files selected — add more',
    fileSelectedAddMore: 'file selected — add more',
    sendWish: 'Send Wish',
    sending: 'Sending...',
    thankYouWish: 'Thank you for your wish!',
    onWallBelow: "It's now on the wall below.",
    leaveAnother: 'Leave another wish',
    pleaseNameMessage: 'Please add your name and a message.',
    somethingWrong: 'Something went wrong — please try again.',
    loadingWishes: 'Loading wishes...',
    beFirstWish: 'Be the first to leave a wish!',
    wish: 'Wish',
    wishesPlural: 'Wishes',
    previous: '← Previous',
    next: 'Next →',
    thankYouExcl: 'Thank you!',
    responseRecorded: 'Your response has been recorded.',
    confirmAttendance: 'Confirm Attendance',
    accept: 'Accept',
    decline: 'Decline',
    numberOfGuests: 'Number of guests',
    drinkingQ: 'Will you be drinking alcohol?',
    yes: 'Yes',
    no: 'No',
    pleaseNameAttend: 'Please add your name and select attending or not.',
    submitting: 'Submitting...',
    weddingInvitation: 'WEDDING INVITATION',
    togetherWith: 'together with',
    openInvitation: 'Open Invitation',
    defaultHeading: 'Blesses with Love & Joy',
    invitationHeading: 'Invitation',
    lovingInvitation: 'A Loving Invitation From Our Family',
    defaultFamilyInvite: 'We warmly invite you to join us as we celebrate the beautiful beginning of our lifelong bond.',
    venueLocationTime: 'Venue, Location and Time Details',
    openInMaps: 'Open in Maps ↗',
    locationTBA: 'Location to be announced',
    venueTBA: 'Venue to be announced',
    dateLabel: 'DATE',
    timeLabel: 'TIME',
    venueLabel: 'VENUE',
    tba: 'To be announced',
    onwards: 'Onwards',
    ourMoments: 'Our Moments',
    dayEvents: "The Day's Events",
    wishesForUs: 'Wishes for Us',
    shareWishes: 'Share your wishes and blessings with',
    justAFewMore: 'Just a Few More',
    countingDays: 'We are counting the days until our beautiful celebration.',
    ourSong: 'Our Song',
    getInTouch: 'Get In Touch',
    inquiriesText: 'For inquiries, feel free to contact us at the below numbers.',
    noteForYou: 'A Note For You',
    thankYouHeading: 'Thank You',
    defaultThankYou: 'Thank you for being part of our journey. Your presence means the world to us.',
    loveBloomEternal: 'Here’s to forever, starting now',
  },
  si: {
    youAreInvited: 'ඔබට ආරාධනා කර සිටී',
    skip: 'මඟහරින්න →',
    dear: 'ආදරණීය',
    engagement: 'විවාහ නියම කිරීම',
    eventDetails: 'මංගල උත්සවය',
    homecoming: 'ගෙදර ආපසු ඊම',
    wishes: 'සුබ පැතුම්',
    saveDate: 'දිනය',
    gallery: 'ඡායාරූප',
    rsvp: 'පිළිතුර',
    contact: 'සම්බන්ධතා',
    location: 'ස්ථානය',
    days: 'දින',
    hours: 'පැය',
    minutes: 'මිනිත්තු',
    seconds: 'තත්පර',
    leaveWish: 'සුබ පැතුමක් තබන්න',
    yourName: 'ඔබේ නම',
    writeWishes: 'යුවළට ඔබේ සුබ පැතුම් ලියන්න...',
    addPhotos: 'ඡායාරූප හෝ වීඩියෝවක් එක් කරන්න (අත්‍යවශ්‍ය නොවේ)',
    filesSelectedAddMore: 'ගොනු තෝරා ඇත — තවත් එක් කරන්න',
    fileSelectedAddMore: 'ගොනුව තෝරා ඇත — තවත් එක් කරන්න',
    sendWish: 'සුබ පැතුම යවන්න',
    sending: 'යවමින්...',
    thankYouWish: 'ඔබේ සුබ පැතුමට ස්තූතියි!',
    onWallBelow: 'එය දැන් පහත බිත්තියේ දැක ගත හැක.',
    leaveAnother: 'තවත් සුබ පැතුමක් තබන්න',
    pleaseNameMessage: 'කරුණාකර ඔබේ නම සහ පණිවිඩයක් ඇතුළත් කරන්න.',
    somethingWrong: 'යමක් වැරදී ඇත — කරුණාකර නැවත උත්සාහ කරන්න.',
    loadingWishes: 'සුබ පැතුම් පූරණය වෙමින්...',
    beFirstWish: 'පළමු සුබ පැතුම තබන්නා වන්න!',
    wish: 'සුබ පැතුම',
    wishesPlural: 'සුබ පැතුම්',
    previous: '← පෙර',
    next: 'ඊළඟ →',
    thankYouExcl: 'ස්තූතියි!',
    responseRecorded: 'ඔබේ පිළිතුර සටහන් කර ඇත.',
    confirmAttendance: 'පැමිණීම තහවුරු කරන්න',
    accept: 'එකඟයි',
    decline: 'එකඟ නැත',
    numberOfGuests: 'ආගන්තුකයන් ගණන',
    drinkingQ: 'ඔබ මත්පැන් පානය කරනවාද?',
    yes: 'ඔව්',
    no: 'නැත',
    pleaseNameAttend: 'කරුණාකර ඔබේ නම ඇතුළත් කර පැමිණීම තෝරන්න.',
    submitting: 'යවමින්...',
    weddingInvitation: 'විවාහ ආරාධනා පත්‍රය',
    togetherWith: 'සමඟ',
    openInvitation: 'ආරාධනය විවෘත කරන්න',
    defaultHeading: 'ආදරයෙන් හා සතුටින් සමන්විතයි',
    invitationHeading: 'ආරාධනාව',
    lovingInvitation: 'අපගේ පවුලෙන් ආදරණීය ආරාධනාවක්',
    defaultFamilyInvite: 'අපගේ ජීවිත කාලය පුරාම පවතින බැඳීමේ අලංකාර ආරම්භය සමරන අවස්ථාවට එක් වන ලෙස අපි ඔබට හෘදයාංගමව ආරාධනා කරමු.',
    venueLocationTime: 'ස්ථානය, පිහිටීම සහ වේලා විස්තර',
    openInMaps: 'සිතියමේ විවෘත කරන්න ↗',
    locationTBA: 'ස්ථානය පසුව දැනුම් දෙනු ලැබේ',
    venueTBA: 'ස්ථානය පසුව දැනුම් දෙනු ලැබේ',
    dateLabel: 'දිනය',
    timeLabel: 'වේලාව',
    venueLabel: 'ස්ථානය',
    tba: 'පසුව දැනුම් දෙනු ලැබේ',
    onwards: 'සිට',
    ourMoments: 'අපගේ මොහොත්',
    dayEvents: 'දිනයේ සිදුවීම්',
    wishesForUs: 'අපට සුබ පැතුම්',
    shareWishes: 'ඔබේ සුබ පැතුම් සහ ආශිර්වාද බෙදා ගන්න',
    justAFewMore: 'තව ටිකයි',
    countingDays: 'අපගේ අලංකාර උත්සවය දක්වා දින ගණන් කරමින් සිටිමු.',
    ourSong: 'අපගේ ගීතය',
    getInTouch: 'සම්බන්ධ වන්න',
    inquiriesText: 'විමසීම් සඳහා, කරුණාකර පහත අංක ඔස්සේ අප හා සම්බන්ධ වන්න.',
    noteForYou: 'ඔබ වෙනුවෙන් සටහනක්',
    thankYouHeading: 'ස්තූතියි',
    defaultThankYou: 'අපගේ මෙම ගමනේ කොටසක් වූ ඔබට ස්තූතියි. ඔබේ පැමිණීම අපට ලොකු දෙයක්.',
    loveBloomEternal: 'සදහටම එකට — මෙතැන් සිට',
  },
}

function LangToggle({ lang, setLang, dark, primary }: { lang: Lang; setLang: React.Dispatch<React.SetStateAction<Lang>>; dark: string; primary: string }) {
  return (
    <div style={{
      position: 'fixed', top: 14, right: 14, zIndex: 150,
      display: 'flex', background: dark, borderRadius: 10,
      boxShadow: `0 6px 18px ${dark}55`, padding: 3, fontSize: 11, fontWeight: 800,
      fontFamily: "'Inter',sans-serif",
    }}>
      {(['en', 'si'] as Lang[]).map(l => (
        <button key={l} onClick={() => setLang(l)} style={{
          border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: 7,
          background: lang === l ? primary : 'transparent',
          color: '#fff', transition: 'background 0.2s',
        }}>{l === 'en' ? 'EN' : 'සිං'}</button>
      ))}
    </div>
  )
}

// ── Guest intro screen — dark, with a single coral shard of light sweeping
// past the guest's name. Toggle via couple.show_guest_intro. ──
function GuestIntroScreen({ guestName, onDone, primary, primaryLight, dark, cream, t }: {
  guestName: string; onDone: () => void; primary: string; primaryLight: string; dark: string; cream: string; t: (k: string) => string
}) {
  return (
    <motion.div
      key="intro" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8, ease: "easeInOut" }}
      style={{
        position: "fixed", inset: 0, zIndex: 200, background: dark,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "2rem", overflow: "hidden",
      }}>
      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.1, ease: "easeOut" }}
        style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${primary}, transparent)`, transformOrigin: "center" }} />

      <motion.div initial={{ scale: 0, rotate: -45, opacity: 0 }} animate={{ scale: 1, rotate: 45, opacity: 1 }} transition={{ duration: 0.9, ease: "easeOut", delay: 0.15 }}
        style={{ width: 60, height: 60, marginBottom: "1.8rem", position: "relative", zIndex: 1, background: `linear-gradient(135deg,${primary},${primaryLight})`, boxShadow: `0 10px 30px ${primary}66` }} />

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.6 }}
        style={{ position: "relative", zIndex: 1, marginBottom: "0.6rem" }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(1.7rem,6.5vw,2.5rem)", color: "#fff", lineHeight: 1.15 }}>
          {t('dear')} {guestName}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, letterSpacing: "0.1em" }} animate={{ opacity: 1, letterSpacing: "0.42em" }} transition={{ duration: 0.9, delay: 1 }}
        style={{ fontSize: 10, textTransform: "uppercase", color: primary, fontFamily: "'Inter',sans-serif", fontWeight: 700, marginTop: 10 }}>
        {t('youAreInvited')}
      </motion.div>

      <motion.div style={{ position: "absolute", bottom: 0, left: 0, height: 3, background: `linear-gradient(to right,${primary},${primaryLight})` }}
        initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 4.2, ease: "linear", delay: 0.3 }} onAnimationComplete={onDone} />

      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 0.75 }} transition={{ delay: 1.6 }} onClick={onDone}
        style={{ position: "absolute", bottom: 22, right: 22, background: "transparent", border: "none", cursor: "pointer", fontSize: 12, color: "#fff", fontFamily: "'Inter',sans-serif", letterSpacing: "0.1em", fontWeight: 700 }}>
        {t('skip')}
      </motion.button>
    </motion.div>
  )
}

function eventLabels(t: (k: string) => string): Record<'engagement' | 'wedding' | 'homecoming', { title: string }> {
  return {
    engagement: { title: t('engagement') },
    wedding: { title: t('eventDetails') },
    homecoming: { title: t('homecoming') },
  }
}

// ── Contact card — solid left accent bar, square call/WhatsApp buttons ──
function ContactRow({ name, phone, primary, dark }: { name: string; phone: string; primary: string; dark: string }) {
  const digitsOnly = phone.replace(/\D/g, '')
  const waNumber = digitsOnly.startsWith('0') ? `94${digitsOnly.slice(1)}` : digitsOnly
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: '#fff', borderLeft: `4px solid ${primary}`, borderRadius: 10, padding: '12px 16px', boxShadow: `0 3px 12px ${dark}0f` }}>
      <div style={{ minWidth: 0 }}>
        {name ? (
          <>
            <div style={{ fontSize: 13, fontWeight: 800, color: dark, fontFamily: "'Inter',sans-serif" }}>{name}</div>
            <div style={{ fontSize: 12, color: dark, opacity: 0.55, marginTop: 2 }}>{phone}</div>
          </>
        ) : (
          <div style={{ fontSize: 13, fontWeight: 800, color: dark, fontFamily: "'Inter',sans-serif" }}>{phone}</div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <a href={`tel:${digitsOnly}`} aria-label={name ? `Call ${name}` : `Call ${phone}`} style={{
          width: 36, height: 36, borderRadius: 9, background: dark, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
        }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="#fff">
            <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01z" />
          </svg>
        </a>
        <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer" aria-label={name ? `WhatsApp ${name}` : `WhatsApp ${phone}`} style={{
          width: 36, height: 36, borderRadius: 9, background: '#25d366', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
        }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="#fff">
            <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3M12 2a10 10 0 00-8.5 15.3L2 22l4.8-1.3A10 10 0 1012 2z" />
          </svg>
        </a>
      </div>
    </div>
  )
}

function pgScrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ── Floating bottom nav — solid dark bar, square (not circular) icon tiles ──
function BottomNavBar({ primary, primaryLight, dark, mapsUrl, hasWishes, hasGallery, hasContact, audioRef, t }: {
  primary: string; primaryLight: string; dark: string; mapsUrl: string; hasWishes: boolean; hasGallery: boolean; hasContact: boolean; audioRef: React.RefObject<HTMLAudioElement | null>; t: (k: string) => string
}) {
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    a.addEventListener('play', onPlay)
    a.addEventListener('pause', onPause)
    setPlaying(!a.paused)
    return () => { a.removeEventListener('play', onPlay); a.removeEventListener('pause', onPause) }
  }, [audioRef])

  const toggleMusic = () => {
    const a = audioRef.current
    if (!a) return
    a.paused ? a.play().catch(() => {}) : a.pause()
  }

  const iconBtn = (onClick: () => void, label: string, path: React.ReactElement, key: string) => (
    <button key={key} onClick={onClick} aria-label={label} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'transparent',
      border: 'none', cursor: 'pointer', color: '#fff', opacity: 0.85, padding: '2px 4px',
    }}>
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">{path}</svg>
      <span style={{ fontSize: 8, letterSpacing: '0.02em', fontWeight: 700 }}>{label}</span>
    </button>
  )

  return (
    <div style={{ position: 'fixed', bottom: 18, left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 40px)', maxWidth: 400, zIndex: 100 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-evenly',
        background: dark, borderRadius: 18,
        boxShadow: `0 10px 30px ${dark}55`, padding: '10px 18px', position: 'relative',
      }}>
        {hasWishes && iconBtn(() => pgScrollToId('wishes'), t('wishes'), <path d="M12 20.5s-7.5-4.9-9.8-9.3C.6 8 2 4.7 5.2 4a4.6 4.6 0 016.8 2.3A4.6 4.6 0 0118.8 4C22 4.7 23.4 8 21.8 11.2 19.5 15.6 12 20.5 12 20.5z" />, 'wishes')}
        {iconBtn(() => pgScrollToId('savethedate'), t('saveDate'), <><rect x="3.5" y="5" width="17" height="16" rx="2.5" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /></>, 'savedate')}
        {hasGallery && iconBtn(() => pgScrollToId('gallery'), t('gallery'), <><rect x="3" y="4" width="18" height="16" rx="2.5" /><circle cx="8.5" cy="9.5" r="1.5" /><path d="M21 16l-5.2-5.2a2 2 0 00-2.8 0L4 19" /></>, 'gallery')}
        {iconBtn(() => pgScrollToId('rsvp-form'), t('rsvp'), <><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01z" /></>, 'rsvp')}
        {hasContact && iconBtn(() => pgScrollToId('contact'), t('contact'), <><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M3.5 6.5L12 13l8.5-6.5" /></>, 'contact')}
        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: '#fff', opacity: 0.85, textDecoration: 'none', padding: '2px 4px' }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s7-7.5 7-12.5A7 7 0 105 9.5C5 14.5 12 22 12 22z" /><circle cx="12" cy="9.5" r="2.5" />
            </svg>
            <span style={{ fontSize: 8, fontWeight: 700 }}>{t('location')}</span>
          </a>
        )}

        <div style={{ width: 44, flexShrink: 0 }} />

        <button onClick={toggleMusic} aria-label={playing ? 'Pause music' : 'Play music'} style={{
          position: 'absolute', right: 4, top: -16,
          width: 46, height: 46, borderRadius: 13, border: `3px solid ${dark}`,
          background: `linear-gradient(135deg,${primary},${primaryLight})`, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          boxShadow: `0 6px 16px ${primary}55`,
        }}>
          {playing ? (
            <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" />
              <path d="M16.5 9a3.5 3.5 0 010 6M19 6.5a7 7 0 010 11" />
            </svg>
          ) : (
            <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" />
              <path d="M16.5 9l5 6M21.5 9l-5 6" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

type IconName = 'calendar' | 'clock' | 'pin' | 'phone' | 'gift' | 'heart' | 'music' | 'chevronDown' | 'check' | 'cross' | 'photo' | 'ring' | 'play' | 'pause'
function Icon({ name, size = 16, color }: { name: IconName; size?: number; color: string }) {
  const c = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (name) {
    case 'calendar': return <svg {...c}><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M16 3v4M8 3v4M3.5 9.5h17" /></svg>
    case 'clock': return <svg {...c}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
    case 'pin': return <svg {...c}><path d="M12 21s6.5-6.9 6.5-11.5a6.5 6.5 0 10-13 0C5.5 14.1 12 21 12 21z" /><circle cx="12" cy="9.3" r="2.3" /></svg>
    case 'phone': return <svg {...c}><path d="M21 16.5v2.7a1.8 1.8 0 01-2 1.8 17.8 17.8 0 01-7.8-2.8 17.5 17.5 0 01-5.4-5.4A17.8 17.8 0 013 5a1.8 1.8 0 011.8-2h2.7a1.8 1.8 0 011.8 1.6c.1.8.3 1.6.6 2.3a1.8 1.8 0 01-.4 1.9L8.4 9.9a14.4 14.4 0 005.7 5.7l1.1-1.1a1.8 1.8 0 011.9-.4c.7.3 1.5.5 2.3.6.9.1 1.6.9 1.6 1.8z" /></svg>
    case 'gift': return <svg {...c}><rect x="3.5" y="8.5" width="17" height="12" rx="1" /><path d="M12 8.5v12M3.5 12.5h17" /><path d="M7.8 8.5a2.3 2.3 0 010-4.6c2.3 0 4.2 4.6 4.2 4.6s1.9-4.6 4.2-4.6a2.3 2.3 0 010 4.6" /></svg>
    case 'heart': return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 20.5s-7-4.4-9.4-8.8C.8 8.1 2.4 4.5 6 4.5c2 0 3.4 1.2 4.2 2.3.8-1.1 2.2-2.3 4.2-2.3 3.6 0 5.2 3.6 3.4 7.2C19 16.1 12 20.5 12 20.5z" /></svg>
    case 'music': return <svg {...c}><path d="M9.5 18V5.3l11-2v12.7" /><circle cx="6.5" cy="18" r="2.8" /><circle cx="17.5" cy="16" r="2.8" /></svg>
    case 'chevronDown': return <svg {...c}><path d="M5.5 8.5L12 15l6.5-6.5" /></svg>
    case 'check': return <svg {...c}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
    case 'cross': return <svg {...c}><path d="M6 6l12 12M18 6L6 18" /></svg>
    case 'photo': return <svg {...c}><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><circle cx="9" cy="10" r="1.8" /><path d="M20.5 16l-4.7-4.7a2 2 0 00-2.8 0L5 19" /></svg>
    case 'ring': return <svg {...c}><circle cx="12" cy="14.5" r="6.5" /><path d="M9 8l3-5 3 5" /><path d="M9 8h6l-1.3 3H10.3z" fill={color} stroke="none" /></svg>
    case 'play': return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8 5v14l11-7z" /></svg>
    case 'pause': return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
    default: return null
  }
}

// ── Geometric motifs (replace the floral Blossom/Vine/Medallion set) ──
function GeoMark({ size = 14, color }: { size?: number; color: string }) {
  return <div style={{ width: size, height: size, background: color, transform: 'rotate(45deg)', flexShrink: 0 }} />
}

function GeoDivider({ primary, dark, primaryLight }: { primary: string; dark: string; primaryLight: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, margin: '12px auto' }}>
      <div style={{ width: 16, height: 5, background: primary }} />
      <div style={{ width: 5, height: 5, background: dark, transform: 'rotate(45deg)' }} />
      <div style={{ width: 16, height: 5, background: primaryLight }} />
    </div>
  )
}

// Large rotated-square (diamond) monogram frame — used both as the cover's
// centerpiece and as a faint fixed watermark once the invitation opens.
function GeoMonogram({ initials, primary, primaryLight, size = 190, textColor = '#fff' }: { initials: string; primary: string; primaryLight: string; size?: number; textColor?: string }) {
  return (
    <div style={{
      width: size, height: size, position: 'relative', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ position: 'absolute', inset: 0, border: `2px solid ${primary}`, transform: 'rotate(45deg)' }} />
      <div style={{ position: 'absolute', inset: size * 0.14, border: `1px dashed ${primaryLight}`, transform: 'rotate(45deg)', opacity: 0.7 }} />
      <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: size * 0.28, color: textColor, letterSpacing: 1, position: 'relative', zIndex: 1 }}>{initials}</span>
    </div>
  )
}

// Ambient background — slow-drifting geometric shapes (squares/triangles),
// low opacity, global. Replaces Blush Blossom's falling-petal layer with
// something that reads as modern/geometric rather than romantic/floral.
function FloatingGeo({ primary, primaryLight }: { primary: string; primaryLight: string }) {
  const shapes = [
    { left: '6%', size: 14, delay: 0, dur: 19, shape: 'square' as const, color: primary },
    { left: '18%', size: 9, delay: 4, dur: 23, shape: 'triangle' as const, color: primaryLight },
    { left: '34%', size: 16, delay: 8, dur: 17, shape: 'square' as const, color: primaryLight },
    { left: '50%', size: 10, delay: 2, dur: 21, shape: 'triangle' as const, color: primary },
    { left: '64%', size: 15, delay: 6, dur: 18, shape: 'square' as const, color: primary },
    { left: '78%', size: 9, delay: 10, dur: 22, shape: 'triangle' as const, color: primaryLight },
    { left: '90%', size: 13, delay: 3, dur: 20, shape: 'square' as const, color: primaryLight },
  ]
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 60, overflow: 'hidden' }}>
      {shapes.map((s, i) => (
        <span key={i} className="pg-shape" style={{ left: s.left, animationDelay: `${s.delay}s`, animationDuration: `${s.dur}s` }}>
          {s.shape === 'square' ? (
            <span style={{ display: 'block', width: s.size, height: s.size, background: s.color, opacity: 0.45, transform: 'rotate(20deg)' }} />
          ) : (
            <span style={{ display: 'block', width: 0, height: 0, borderLeft: `${s.size / 2}px solid transparent`, borderRight: `${s.size / 2}px solid transparent`, borderBottom: `${s.size}px solid ${s.color}`, opacity: 0.45 }} />
          )}
        </span>
      ))}
    </div>
  )
}

// ── The particle/glow intro — scattered glowing dots converge into a ring
// around the couple's monogram, which then locks into the geometric frame.
// Pure CSS/framer-motion (no <canvas>), computed once per mount so the
// layout never jitters on re-render. ──
function useGlowParticles(count: number) {
  return useMemo(() => {
    const arr: { angle: number; radius: number; startX: number; startY: number; size: number; delay: number; hue: 'primary' | 'light' }[] = []
    for (let i = 0; i < count; i++) {
      const angle = (360 / count) * i + (Math.random() * 10 - 5)
      arr.push({
        angle,
        radius: 108 + Math.random() * 14,
        startX: (Math.random() - 0.5) * 340,
        startY: (Math.random() - 0.5) * 340,
        size: 3 + Math.random() * 4,
        delay: Math.random() * 0.7,
        hue: Math.random() > 0.5 ? 'primary' : 'light',
      })
    }
    return arr
  }, [count])
}

function GlowParticles({ primary, primaryLight }: { primary: string; primaryLight: string }) {
  const particles = useGlowParticles(26)
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      {particles.map((p, i) => {
        const rad = (p.angle * Math.PI) / 180
        const targetX = Math.cos(rad) * p.radius
        const targetY = Math.sin(rad) * p.radius
        const color = p.hue === 'primary' ? primary : primaryLight
        return (
          <motion.span
            key={i}
            initial={{ x: p.startX, y: p.startY, opacity: 0, scale: 0.4 }}
            animate={{ x: targetX, y: targetY, opacity: [0, 1, 0.75], scale: [0.4, 1.3, 1] }}
            transition={{ duration: 1.6, delay: p.delay, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute', width: p.size, height: p.size, borderRadius: '50%',
              background: color, boxShadow: `0 0 ${p.size * 3}px ${color}`,
            }}
          />
        )
      })}
    </div>
  )
}

function pickTimelineIcon(eventName: string): IconName {
  const n = eventName.toLowerCase()
  if (n.includes('ceremony') || n.includes('poruwa') || n.includes('vow') || n.includes('bless')) return 'ring'
  if (n.includes('lunch') || n.includes('dinner') || n.includes('meal') || n.includes('reception')) return 'gift'
  if (n.includes('danc') || n.includes('music') || n.includes('party') || n.includes('floor')) return 'music'
  if (n.includes('away') || n.includes('depart') || n.includes('leav')) return 'pin'
  if (n.includes('photo')) return 'photo'
  return 'heart'
}

// ── Music player — square (not circular) play button, bold progress bar ──
function MusicPlayer({ audioRef, title, artist, primary, primaryLight, dark, boxBg }: {
  audioRef: React.RefObject<HTMLAudioElement | null>
  title?: string; artist?: string; primary: string; primaryLight: string; dark: string; boxBg: string
}) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onTime = () => { if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100) }
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('timeupdate', onTime)
    setPlaying(!audio.paused)
    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('timeupdate', onTime)
    }
  }, [audioRef])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) audio.play().catch(() => {})
    else audio.pause()
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, background: '#fff', borderLeft: `4px solid ${primary}`, borderRadius: 12,
      padding: '14px 18px', boxShadow: `0 4px 18px ${dark}12`, textAlign: 'left',
    }}>
      <button onClick={toggle} aria-label={playing ? 'Pause' : 'Play'} style={{
        width: 44, height: 44, borderRadius: 11, background: dark, border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon name={playing ? 'pause' : 'play'} size={17} color="#fff" />
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && <div style={{ fontSize: 13, fontWeight: 800, color: dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>}
        {artist && <div style={{ fontSize: 11, color: dark, opacity: 0.55, marginTop: 1 }}>{artist}</div>}
        <div style={{ height: 4, background: primaryLight, borderRadius: 3, marginTop: 7, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: primary, borderRadius: 3, transition: 'width 0.2s linear' }} />
        </div>
      </div>
    </div>
  )
}

// ── Countdown — bold alternating color-block tiles ──
function CountdownDisplay({ targetDate, dark, primary, primaryLight, t }: { targetDate?: string; dark: string; primary: string; primaryLight: string; t: (k: string) => string }) {
  const countdown = useCountdown(targetDate)
  const items: [string, number][] = [[t('days'), countdown.d], [t('hours'), countdown.h], [t('minutes'), countdown.m], [t('seconds'), countdown.s]]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {items.map(([label, value], i) => (
        <div key={label} style={{
          padding: '18px 14px', textAlign: 'center', borderRadius: 12,
          background: i % 2 === 0 ? dark : primary,
        }}>
          <div className="pg-num" style={{ fontFamily: "'Syne',sans-serif", fontSize: '2.4rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
            {String(value).padStart(2, '0')}
          </div>
          <div style={{ fontSize: 10.5, letterSpacing: '0.15em', color: '#fff', opacity: 0.8, fontWeight: 700, marginTop: 6 }}>{label}</div>
        </div>
      ))}
    </div>
  )
}

// ── Guest Wishes Wall (same data model/logic as the rest of the app) ──
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
      position: 'fixed', inset: 0, background: 'rgba(10,10,14,0.94)', zIndex: 500,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '92vw', maxHeight: '86vh' }}>
        {current.type === 'video' ? (
          <video src={current.url} controls autoPlay style={{ maxWidth: '92vw', maxHeight: '86vh', display: 'block', borderRadius: 6 }} />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={current.url} alt="" style={{ maxWidth: '92vw', maxHeight: '86vh', display: 'block', borderRadius: 6, objectFit: 'contain' }} />
        )}
        <button onClick={onClose} aria-label="Close" style={{
          position: 'absolute', top: -40, right: 0, background: 'transparent', border: 'none',
          color: '#fff', fontSize: 26, cursor: 'pointer', lineHeight: 1,
        }}>×</button>
        {media.length > 1 && (
          <>
            <button onClick={() => onIndex((index - 1 + media.length) % media.length)} aria-label="Previous" style={{
              position: 'absolute', left: -18, top: '50%', transform: 'translate(-100%,-50%)',
              width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.15)', border: 'none',
              color: '#fff', fontSize: 20, cursor: 'pointer',
            }}>‹</button>
            <button onClick={() => onIndex((index + 1) % media.length)} aria-label="Next" style={{
              position: 'absolute', right: -18, top: '50%', transform: 'translate(100%,-50%)',
              width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.15)', border: 'none',
              color: '#fff', fontSize: 20, cursor: 'pointer',
            }}>›</button>
            <div style={{ position: 'absolute', bottom: -30, left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: 12, opacity: 0.8 }}>
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
    <div style={{
      display: 'grid',
      gridTemplateColumns: isSingle ? '1fr' : 'repeat(2, 1fr)',
      gap: 4, marginBottom: 6, borderRadius: 8, overflow: 'hidden',
    }}>
      {shown.map((m, idx) => {
        const isMoreTile = idx === 3 && media.length > 4
        return (
          <div key={idx} onClick={() => onOpen(idx)} style={{
            position: 'relative', cursor: 'pointer', overflow: 'hidden',
            height: isSingle ? 140 : undefined,
            aspectRatio: isSingle ? undefined : '1 / 1',
            background: '#000',
          }}>
            {isSingle && m.type === 'photo' && (
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url(${m.url})`, backgroundSize: 'cover', backgroundPosition: 'center',
                filter: 'blur(16px) brightness(0.7)', transform: 'scale(1.15)',
              }} />
            )}
            {m.type === 'video' ? (
              <video src={m.url} muted style={{
                position: isSingle ? 'relative' : 'static', zIndex: 1,
                width: '100%', height: '100%', objectFit: isSingle ? 'contain' : 'cover', display: 'block',
              }} />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={m.url} alt="" style={{
                position: isSingle ? 'relative' : 'static', zIndex: 1,
                width: '100%', height: '100%', objectFit: isSingle ? 'contain' : 'cover', display: 'block',
              }} />
            )}
            {isMoreTile && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(10,10,14,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 18, fontWeight: 800, zIndex: 2,
              }}>+{media.length - 4}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function WishesWall({ coupleId, primary, primaryLight, dark, boxBg, t }: {
  coupleId: string; primary: string; primaryLight: string; dark: string; boxBg: string; t: (k: string) => string
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
      const { data } = await supabase
        .from('wishes')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false })
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
      setError(t('pleaseNameMessage'))
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
      setError(t('somethingWrong'))
    } finally {
      setSubmitting(false)
    }
  }

  const card: React.CSSProperties = { background: '#fff', borderLeft: `4px solid ${primary}`, borderRadius: 12, boxShadow: `0 4px 18px ${dark}12` }

  return (
    <div>
      <div style={{ ...card, padding: '18px 16px', textAlign: 'left', marginBottom: 22 }}>
        {done ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: dark }}>{t('thankYouWish')}</div>
            <div style={{ fontSize: 12, color: dark, opacity: 0.6, marginTop: 4 }}>{t('onWallBelow')}</div>
            <button onClick={() => setDone(false)} style={{
              marginTop: 12, padding: '8px 18px', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: dark, color: '#fff', fontSize: 12, fontWeight: 800,
            }}>{t('leaveAnother')}</button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 13, fontWeight: 800, color: dark, marginBottom: 10 }}>{t('leaveWish')}</div>
            <input
              value={name} onChange={e => setName(e.target.value)} placeholder={t('yourName')}
              style={{ width: '100%', padding: '10px 13px', borderRadius: 9, border: `1.5px solid ${primaryLight}`, fontSize: 13, outline: 'none', marginBottom: 10, boxSizing: 'border-box', fontFamily: "'Inter',sans-serif" }}
            />
            <textarea
              value={message} onChange={e => setMessage(e.target.value)} placeholder={t('writeWishes')} rows={3}
              style={{ width: '100%', padding: '10px 13px', borderRadius: 9, border: `1.5px solid ${primaryLight}`, fontSize: 13, outline: 'none', marginBottom: 10, boxSizing: 'border-box', fontFamily: "'Inter',sans-serif", resize: 'vertical' }}
            />
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: dark, opacity: 0.7,
              padding: '9px 13px', borderRadius: 9, border: `1.5px dashed ${primary}`, cursor: 'pointer', marginBottom: files.length ? 6 : 10,
            }}>
              <Icon name="photo" size={15} color={primary} />
              {files.length ? `${files.length} ${files.length > 1 ? t('filesSelectedAddMore') : t('fileSelectedAddMore')}` : t('addPhotos')}
              <input type="file" accept="image/*,video/*" multiple
                onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files || [])].slice(0, 6))}
                style={{ display: 'none' }} />
            </label>
            {files.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {files.map((f, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: dark,
                    background: primaryLight, borderRadius: 7, padding: '4px 9px',
                  }}>
                    {f.name.length > 16 ? f.name.slice(0, 14) + '…' : f.name}
                    <span onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} style={{ cursor: 'pointer', fontWeight: 700 }}>×</span>
                  </div>
                ))}
              </div>
            )}
            {error && <div style={{ fontSize: 11.5, color: primary, marginBottom: 8, fontWeight: 700 }}>{error}</div>}
            <button onClick={submit} disabled={submitting} style={{
              width: '100%', padding: 12, borderRadius: 9, border: 'none', cursor: 'pointer',
              background: dark, color: '#fff', fontWeight: 800, fontSize: 13, opacity: submitting ? 0.6 : 1,
            }}>{submitting ? t('sending') : t('sendWish')}</button>
          </>
        )}
      </div>

      {loading ? (
        <div style={{ fontSize: 12, color: dark, opacity: 0.5, textAlign: 'center' }}>{t('loadingWishes')}</div>
      ) : wishes.length === 0 ? (
        <div style={{ fontSize: 12, color: dark, opacity: 0.5, textAlign: 'center' }}>{t('beFirstWish')}</div>
      ) : (
        <div style={{ ...card, padding: '20px 18px', textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: dark, textAlign: 'center', marginBottom: 18 }}>
            {wishes.length} {wishes.length === 1 ? t('wish') : t('wishesPlural')}
          </div>
          <div>
            {wishes.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE).map((w, i, arr) => {
              const mediaList = getWishMedia(w)
              return (
                <div key={w.id} style={{
                  padding: '14px 0',
                  borderBottom: i < arr.length - 1 ? `1px solid ${primaryLight}` : 'none',
                }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: primary, marginBottom: 4 }}>{w.guest_name}</div>
                  <div style={{ fontSize: 13, color: dark, opacity: 0.85, lineHeight: 1.7, marginBottom: mediaList.length ? 10 : 6, whiteSpace: 'pre-wrap' }}>
                    {w.message}
                  </div>
                  <WishMediaGrid media={mediaList} onOpen={idx => setLightbox({ media: mediaList, index: idx })} />
                  <div style={{ fontSize: 10.5, color: dark, opacity: 0.45 }}>
                    {new Date(w.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              )
            })}
          </div>
          {wishes.length > PER_PAGE && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 18, paddingTop: 16, borderTop: `1px solid ${primaryLight}`, flexWrap: 'wrap' }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{
                background: 'transparent', border: 'none', cursor: page === 0 ? 'default' : 'pointer',
                fontSize: 12, fontWeight: 800, color: primary, opacity: page === 0 ? 0.35 : 1,
              }}>{t('previous')}</button>
              {Array.from({ length: Math.ceil(wishes.length / PER_PAGE) }).map((_, i) => (
                <button key={i} onClick={() => setPage(i)} style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: i === page ? 800 : 600,
                  color: i === page ? dark : primary,
                  textDecoration: i === page ? 'underline' : 'none',
                  padding: '2px 4px',
                }}>{i + 1}</button>
              ))}
              <button onClick={() => setPage(p => (p + 1) * PER_PAGE < wishes.length ? p + 1 : p)}
                disabled={(page + 1) * PER_PAGE >= wishes.length} style={{
                background: 'transparent', border: 'none', cursor: (page + 1) * PER_PAGE >= wishes.length ? 'default' : 'pointer',
                fontSize: 12, fontWeight: 800, color: primary, opacity: (page + 1) * PER_PAGE >= wishes.length ? 0.35 : 1,
              }}>{t('next')}</button>
            </div>
          )}
        </div>
      )}
      {lightbox && (
        <WishLightbox
          media={lightbox.media}
          index={lightbox.index}
          onIndex={i => setLightbox(l => l && { ...l, index: i })}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}

const PG_WRAP: React.CSSProperties = { maxWidth: 420, margin: '0 auto', padding: '0 24px' }

function Reveal({ id, mt = 56, wide = false, children }: { id?: string; mt?: number; wide?: boolean; children: React.ReactNode }) {
  return (
    <div id={id} className={wide ? 'pg-wrap-wide' : undefined}
      style={{ ...(wide ? {} : PG_WRAP), marginTop: mt, textAlign: 'center', position: 'relative', zIndex: 1 }}>
      {children}
    </div>
  )
}

// RSVP is its own component so typing in the form doesn't re-render the
// whole page. Single-step form (name + accept/decline shown together
// immediately) — no separate "confirm first" gate screen.
function RsvpBlock({ couple, colors, guestName, t }: {
  couple: Couple; colors: { primary: string; primaryLight: string; dark: string }; guestName: string; t: (k: string) => string
}) {
  const [guestNameInput, setGuestNameInput] = useState(guestName)
  const [response, setResponse] = useState<'yes' | 'no' | null>(null)
  const [guestCount, setGuestCount] = useState('1')
  const [drinking, setDrinking] = useState<'yes' | 'no' | ''>('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [rsvpMessage, setRsvpMessage] = useState('')

  const clampedGuestCount = () => Math.max(1, Math.min(10, parseInt(guestCount, 10) || 1))

  const submitRsvp = async () => {
    if (!guestNameInput.trim() || !response) {
      setRsvpMessage(t('pleaseNameAttend'))
      return
    }
    setSubmitting(true)
    setRsvpMessage('')
    const { error } = await supabase.from('rsvps').insert([{
      couple_id: couple.id,
      guest_name: guestNameInput.trim(),
      response,
      guest_count: response === 'yes' ? clampedGuestCount() : 1,
      drinking: couple.ask_drinking && response === 'yes' ? drinking || null : null,
    }])
    setSubmitting(false)
    if (error) setRsvpMessage(t('somethingWrong'))
    else setSubmitted(true)
  }

  const cardStyle: React.CSSProperties = {
    background: '#fff', borderLeft: `4px solid ${colors.primary}`, borderRadius: 14, boxShadow: `0 4px 18px ${colors.dark}12`,
  }
  const iconBadge: React.CSSProperties = {
    width: 34, height: 34, borderRadius: 9, background: colors.dark,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }

  return (
    <Reveal id="rsvp-form">
      <GeoDivider primary={colors.primary} dark={colors.dark} primaryLight={colors.primaryLight} />
      <div style={{ ...iconBadge, margin: '0 auto 16px' }}>
        <Icon name="gift" size={16} color="#fff" />
      </div>
      <GeoDivider primary={colors.primaryLight} dark={colors.dark} primaryLight={colors.primary} />

      {submitted ? (
        <div>
          <div style={{ fontSize: 13.5, color: colors.dark, fontWeight: 800 }}>{t('thankYouExcl')}</div>
          <div style={{ fontSize: 12.5, color: colors.dark, opacity: 0.6, marginTop: 4 }}>{t('responseRecorded')}</div>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ ...cardStyle, padding: '20px 18px', textAlign: 'left' }}>
          <input
            value={guestNameInput} onChange={e => setGuestNameInput(e.target.value)}
            placeholder={t('yourName')}
            style={{ width: '100%', padding: '11px 14px', borderRadius: 9, border: `1.5px solid ${colors.primaryLight}`, fontSize: 13.5, outline: 'none', marginBottom: 12, fontFamily: "'Inter',sans-serif", boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button type="button" onClick={() => setResponse('yes')} style={{
              flex: 1, padding: '11px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: response === 'yes' ? colors.primary : colors.primaryLight,
              color: response === 'yes' ? '#fff' : colors.dark,
            }}><Icon name="check" size={13} color={response === 'yes' ? '#fff' : colors.dark} />{t('accept')}</button>
            <button type="button" onClick={() => setResponse('no')} style={{
              flex: 1, padding: '11px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: response === 'no' ? colors.dark : colors.primaryLight,
              color: response === 'no' ? '#fff' : colors.dark,
            }}><Icon name="cross" size={13} color={response === 'no' ? '#fff' : colors.dark} />{t('decline')}</button>
          </div>
          {response === 'yes' && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10.5, color: colors.dark, opacity: 0.6, display: 'block', marginBottom: 4, fontWeight: 700 }}>{t('numberOfGuests')}</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" value={guestCount}
                onChange={e => {
                  const v = e.target.value
                  if (v === '' || /^[0-9]{1,2}$/.test(v)) setGuestCount(v)
                }}
                onBlur={() => setGuestCount(String(clampedGuestCount()))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: `1.5px solid ${colors.primaryLight}`, fontSize: 13.5, outline: 'none', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box' }} />
            </div>
          )}
          {response === 'yes' && couple.ask_drinking && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10.5, color: colors.dark, opacity: 0.6, display: 'block', marginBottom: 4, fontWeight: 700 }}>{t('drinkingQ')}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setDrinking('yes')} style={{
                  flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 800,
                  background: drinking === 'yes' ? colors.primary : colors.primaryLight, color: drinking === 'yes' ? '#fff' : colors.dark,
                }}>{t('yes')}</button>
                <button type="button" onClick={() => setDrinking('no')} style={{
                  flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 800,
                  background: drinking === 'no' ? colors.primary : colors.primaryLight, color: drinking === 'no' ? '#fff' : colors.dark,
                }}>{t('no')}</button>
              </div>
            </div>
          )}
          {rsvpMessage && <div style={{ fontSize: 11.5, color: colors.primary, marginBottom: 10, fontWeight: 700 }}>{rsvpMessage}</div>}
          <button onClick={submitRsvp} disabled={submitting} style={{
            width: '100%', padding: 13, borderRadius: 9, border: 'none', cursor: 'pointer',
            background: colors.dark, color: '#fff', fontWeight: 800, fontSize: 13.5, opacity: submitting ? 0.6 : 1,
          }}>{submitting ? t('submitting') : t('confirmAttendance')}</button>
        </motion.div>
      )}
    </Reveal>
  )
}

export default function PrismGlowTemplate({ couple }: { couple: Couple }) {
  const [opened, setOpened] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const handleOpenClick = () => { setOpened(true) }
  useEffect(() => {
    if (!opened) return
    const id = setTimeout(() => { audioRef.current?.play().catch(() => {}) }, 60)
    return () => clearTimeout(id)
  }, [opened])
  const searchParams = useSearchParams()
  const guestName = searchParams?.get('name') || ''
  const introEnabled = (couple as any).show_guest_intro !== false
  const [showIntro, setShowIntro] = useState(!!guestName && introEnabled)
  const [introGone, setIntroGone] = useState(!(guestName && introEnabled))

  const [lang, setLang] = useState<Lang>('en')
  const t = (key: string) => TXT[lang][key] || TXT.en[key] || key
  const colors = sanitizeColors(couple.custom_colors)
  const hasCustomPrimaryLight = !!(couple.custom_colors?.primaryLight && HEX_RE.test(couple.custom_colors.primaryLight))
  const boxBg = hasCustomPrimaryLight ? colors.primaryLight : DEFAULT_COLORS.primaryLight
  const ts = useTextStyles(couple)
  const initials = getInitials(couple.bride, couple.groom)
  const badgeText = (couple as any).cover_badge_text || t('weddingInvitation')
  const familyInvitationText = (couple as any).family_invitation_text
  const togetherWithText = (couple as any).together_with_text || t('togetherWith')
  const thankYouText = (couple as any).thank_you_text
  const brideFamily = couple.bride_family
  const groomFamily = couple.groom_family
  const bridePhone = (couple as any).bride_phone
  const groomPhone = (couple as any).groom_phone
  const section = couple.section_visibility || {}

  const flexContacts: { name: string; phone: string }[] = Array.isArray((couple as any).contacts) ? (couple as any).contacts.filter((c: any) => c?.phone).map((c: any) => ({ name: c.name || '', phone: c.phone })) : []
  const contactList: { name: string; phone: string }[] = flexContacts.length > 0
    ? flexContacts
    : [
        ...(couple.groom && groomPhone ? [{ name: couple.groom, phone: groomPhone }] : []),
        ...(couple.bride && bridePhone ? [{ name: couple.bride, phone: bridePhone }] : []),
      ]

  const enabledEvents = useMemo(() => {
    const ev = (couple as any).events as Record<'engagement' | 'wedding' | 'homecoming', {
      enabled: boolean; venue: string; venue_address: string; date: string; maps_url: string; label?: string
    }> | undefined
    if (!ev) return []
    const order: ('engagement' | 'wedding' | 'homecoming')[] =
      Array.isArray((couple as any).events_order) && (couple as any).events_order.length === 3
        ? (couple as any).events_order
        : ['engagement', 'wedding', 'homecoming']
    const labels = eventLabels(t)
    return order
      .filter(k => ev[k]?.enabled)
      .map(k => ({ key: k, ...ev[k], title: (ev[k]?.label && ev[k]!.label!.trim()) || labels[k].title }))
  }, [couple, lang])

  const scrollToId = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  const capsHeading: React.CSSProperties = {
    fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, letterSpacing: '0.03em',
    color: colors.dark, textAlign: 'center',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textTransform: 'uppercase',
  }
  const eyebrow: React.CSSProperties = {
    fontSize: 10.5, letterSpacing: '0.26em', textTransform: 'uppercase', textAlign: 'center',
    color: colors.primary, fontWeight: 800,
  }
  const cardStyle: React.CSSProperties = {
    background: '#fff', borderLeft: `4px solid ${colors.primary}`, borderRadius: 14, boxShadow: `0 4px 18px ${colors.dark}12`,
  }
  const iconBadge: React.CSSProperties = {
    width: 34, height: 34, borderRadius: 9, background: colors.dark,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", minHeight: '100vh', background: colors.cream, position: 'relative', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');
        html, body { background: ${colors.cream} !important; margin: 0; overflow-x: hidden; }
        .pg-shape {
          position: absolute; top: -24px; opacity: 0; display: block;
          animation-name: pg-drift; animation-timing-function: linear; animation-iteration-count: infinite;
        }
        @keyframes pg-drift {
          0% { transform: translateY(-24px) translateX(0) rotate(0deg); opacity: 0; }
          8% { opacity: 1; }
          92% { opacity: 1; }
          100% { transform: translateY(112vh) translateX(-28px) rotate(200deg); opacity: 0; }
        }
        .pg-num { font-variant-numeric: tabular-nums lining-nums; }
        .pg-wrap-wide { max-width: 420px; margin: 0 auto; padding: 0 24px; box-sizing: border-box; width: 100%; }
        @media (min-width: 640px) {
          .pg-wrap-wide { max-width: 760px; }
        }
        .pg-event-row { display: flex; flex-direction: column; min-width: 0; }
        @media (min-width: 640px) {
          .pg-event-row { flex-direction: row; align-items: flex-start; gap: 16px; }
          .pg-event-row > div { flex: 1 1 0; min-width: 0; margin-bottom: 0 !important; }
        }
      `}</style>

      <FloatingGeo primary={colors.primary} primaryLight={colors.primaryLight} />

      <LangToggle lang={lang} setLang={setLang} dark={colors.dark} primary={colors.primary} />

      <AnimatePresence onExitComplete={() => setIntroGone(true)}>
        {showIntro && guestName && (
          <GuestIntroScreen guestName={guestName} onDone={() => setShowIntro(false)} primary={colors.primary} primaryLight={colors.primaryLight} dark={colors.dark} cream={colors.cream} t={t} />
        )}
      </AnimatePresence>

      {/* ───────── COVER — particle/glow reveal ───────── */}
      <AnimatePresence>
        {!opened && introGone && (
          <motion.div key="cover"
            exit={{ opacity: 0, scale: 3.2, transition: { duration: 0.7, ease: [0.7, 0, 0.9, 0.2] } }}
            style={{
              position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `radial-gradient(circle at 50% 38%, ${colors.dark}f2 0%, ${colors.dark} 60%)`,
              overflow: 'hidden',
            }}>
            {(couple as any).cover_background_image && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={(couple as any).cover_background_image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.16, mixBlendMode: 'luminosity' }} />
            )}

            <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}
              style={{ position: 'relative', zIndex: 1, width: '86%', maxWidth: 320, textAlign: 'center' }}>

              <div style={{ position: 'relative', width: 190, height: 190, margin: '0 auto 20px' }}>
                <GlowParticles primary={colors.primary} primaryLight={colors.primaryLight} />
                <motion.div initial={{ scale: 0.5, opacity: 0, rotate: -20 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ duration: 0.8, delay: 1.3, ease: [0.16, 1, 0.3, 1] }}>
                  <GeoMonogram initials={initials} primary={colors.primary} primaryLight={colors.primaryLight} size={190} />
                </motion.div>
              </div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.9 }}>
                <div style={{ fontSize: 10.5, letterSpacing: '0.32em', fontWeight: 800, color: colors.primary, marginBottom: 10, textTransform: 'uppercase' }}>{badgeText}</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.6rem,7vw,2.1rem)', color: '#fff', lineHeight: 1.15 }}>
                  {couple.bride} <span style={{ color: colors.primary }}>&amp;</span> {couple.groom}
                </div>
              </motion.div>

              <motion.button
                onClick={handleOpenClick}
                aria-label="Open invitation"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 2.3 }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 9, marginTop: 28,
                  padding: '14px 30px', borderRadius: 11, border: 'none',
                  background: colors.primary,
                  color: '#fff', fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase',
                  cursor: 'pointer', boxShadow: `0 12px 30px ${colors.primary}55`,
                  fontFamily: "'Inter',sans-serif",
                }}>
                {t('openInvitation')}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ───────── MAIN CONTENT ───────── */}
      {opened && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} style={{ paddingTop: 44, paddingBottom: 70, position: 'relative' }}>

          <div style={{ ...PG_WRAP, textAlign: 'center' }}>
            <h1 style={{ ...ts('subtitle'), fontFamily: "'Syne',sans-serif", fontSize: '1.5rem', fontWeight: 800, color: colors.dark, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.01em' }}>
              {(couple as any).invitation_heading || t('defaultHeading')}
            </h1>
            {guestName && (
              <p style={{ marginTop: 14, fontSize: 17, fontFamily: "'Inter',sans-serif", fontWeight: 800, color: colors.primary }}>
                {t('dear')} {guestName},
              </p>
            )}
          </div>

          <div style={{ ...PG_WRAP, marginTop: 22 }}>
            <div style={{ ...cardStyle, overflow: 'hidden' }}>
              {couple.couple_photo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={couple.couple_photo} alt={`${couple.bride} & ${couple.groom}`} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', aspectRatio: '3/4', background: colors.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="photo" size={38} color={colors.primary} />
                </div>
              )}
              <div style={{ background: colors.dark, padding: '15px 12px 13px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.5rem', color: '#fff', lineHeight: 1.15 }}>
                  <span style={ts('bride_name')}>{couple.bride}</span> <span style={{ color: colors.primary }}>&amp;</span> <span style={ts('groom_name')}>{couple.groom}</span>
                </div>
                <div style={{ fontSize: 10, letterSpacing: '0.24em', fontWeight: 800, color: colors.primary, marginTop: 6, textTransform: 'uppercase' }}>{badgeText}</div>
              </div>
            </div>
            <button onClick={() => scrollToId('invitation')} aria-label="Scroll down" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '14px auto 0', width: 30, height: 30, borderRadius: 9,
              background: colors.dark, border: 'none', cursor: 'pointer',
            }}>
              <Icon name="chevronDown" size={14} color="#fff" />
            </button>
          </div>

          <Reveal id="invitation">
            <div style={capsHeading}>{t('invitationHeading')}</div>
            <GeoDivider primary={colors.primary} dark={colors.dark} primaryLight={colors.primaryLight} />
            {(brideFamily || groomFamily) && (
              <p style={{ fontSize: 12.5, color: colors.dark, opacity: 0.9, marginBottom: 8, fontWeight: 700 }}>
                {groomFamily} {togetherWithText} {brideFamily}
              </p>
            )}
            <div style={{ ...eyebrow, marginBottom: 10 }}>{t('lovingInvitation')}</div>
            <p style={{ ...ts('message'), fontSize: 13.5, color: colors.dark, opacity: 0.7, lineHeight: 1.9 }}>
              {familyInvitationText || t('defaultFamilyInvite')}
            </p>
          </Reveal>

          {enabledEvents.map(ev => {
            const mapQuery = [ev.venue, ev.venue_address].filter(Boolean).join(', ')
            const manualLat = parseFloat((ev as any).venue_latitude ?? (couple as any).venue_latitude)
            const manualLng = parseFloat((ev as any).venue_longitude ?? (couple as any).venue_longitude)
            const manualCoords = !isNaN(manualLat) && !isNaN(manualLng) ? { lat: manualLat, lng: manualLng } : null
            const coords = manualCoords || extractLatLng(ev.maps_url)
            const mapsEmbed = coords
              ? `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=16&output=embed`
              : mapQuery ? `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed` : undefined
            const mapsLinkHref = ev.maps_url || (mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}` : undefined)
            return (
              <Reveal key={ev.key} wide>
                <div style={capsHeading}><Icon name="heart" size={12} color={colors.primary} />{ev.title}</div>
                <p style={{ fontSize: 11.5, color: colors.dark, opacity: 0.55, margin: '6px 0 18px' }}>{t('venueLocationTime')}</p>

                <div className="pg-event-row">
                <div style={{ ...cardStyle, overflow: 'hidden', textAlign: 'left', marginBottom: 10 }}>
                  {mapsEmbed ? (
                    <div style={{ position: 'relative', background: colors.primaryLight }}>
                      <iframe
                        src={mapsEmbed}
                        style={{ width: '100%', height: 140, border: 0, display: 'block' }}
                        referrerPolicy="no-referrer-when-downgrade"
                        title={`${ev.venue || 'venue'}-map`}
                      />
                      {mapsLinkHref && (
                        <a href={mapsLinkHref} target="_blank" rel="noopener noreferrer" style={{
                          position: 'absolute', top: 8, left: 8, fontSize: 10, fontWeight: 800,
                          background: colors.dark, padding: '5px 12px', borderRadius: 8,
                          color: '#fff', textDecoration: 'none', boxShadow: `0 2px 8px ${colors.dark}44`,
                        }}>
                          {t('openInMaps')}
                        </a>
                      )}
                    </div>
                  ) : (
                    <div style={{ height: 100, background: colors.primaryLight, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Icon name="pin" size={22} color={colors.primary} />
                      <span style={{ fontSize: 10.5, color: colors.dark, opacity: 0.55 }}>{t('locationTBA')}</span>
                    </div>
                  )}
                  <div style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: colors.dark }}>{ev.venue || t('venueTBA')}</div>
                    {ev.venue_address && <div style={{ fontSize: 11.5, color: colors.dark, opacity: 0.55, marginTop: 2 }}>{ev.venue_address}</div>}
                  </div>
                </div>

                <div style={{ ...cardStyle, padding: '16px 18px', textAlign: 'left' }}>
                  {[
                    { icon: 'calendar' as const, label: t('dateLabel'), value: ev.date ? new Date(ev.date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : t('tba'), tsKey: '' },
                    { icon: 'clock' as const, label: t('timeLabel'), value: (ev.date ? new Date(ev.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : t('tba')) + ' ' + t('onwards'), tsKey: '' },
                    { icon: 'pin' as const, label: t('venueLabel'), value: ev.venue || t('venueTBA'), sub: ev.venue_address, tsKey: 'venue_name', subTsKey: 'venue_address' },
                  ].map((row, i, arr) => (
                    <div key={row.label} style={{
                      display: 'flex', gap: 12, paddingBottom: i < arr.length - 1 ? 14 : 0, marginBottom: i < arr.length - 1 ? 14 : 0,
                      borderBottom: i < arr.length - 1 ? `1px solid ${colors.primaryLight}` : 'none',
                    }}>
                      <div style={iconBadge}><Icon name={row.icon} size={15} color="#fff" /></div>
                      <div>
                        <div style={{ fontSize: 10.5, fontWeight: 800, color: colors.primary, letterSpacing: '0.04em' }}>{row.label}</div>
                        <div style={{ ...(row.tsKey ? ts(row.tsKey) : {}), fontSize: 13.5, fontWeight: 800, color: colors.dark, marginTop: 2 }}>{row.value}</div>
                        {row.sub && <div style={{ ...((row as any).subTsKey ? ts((row as any).subTsKey) : {}), fontSize: 11.5, color: colors.dark, opacity: 0.55, marginTop: 3, lineHeight: 1.5 }}>{row.sub}</div>}
                      </div>
                    </div>
                  ))}
                </div>
                </div>
              </Reveal>
            )
          })}

          {(section.gallery ?? true) && couple.gallery && couple.gallery.length > 0 && (
            <Reveal id="gallery">
              <div style={capsHeading}>{t('ourMoments')}</div>
              <GeoDivider primary={colors.primary} dark={colors.dark} primaryLight={colors.primaryLight} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                {couple.gallery.map((url, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img key={i} src={url} alt="" style={{ width: '100%', display: 'block', borderRadius: 10 }} />
                ))}
              </div>
            </Reveal>
          )}

          {(section.timeline ?? true) && couple.timeline && couple.timeline.length > 0 && (
            <Reveal>
              <div style={capsHeading}><Icon name="heart" size={12} color={colors.primary} />{t('dayEvents')}</div>
              <GeoDivider primary={colors.primary} dark={colors.dark} primaryLight={colors.primaryLight} />
              <div style={{ position: 'relative', textAlign: 'left', marginTop: 20, paddingLeft: 10 }}>
                <div style={{ position: 'absolute', left: 41, top: 34, bottom: 34, width: 2, background: colors.primaryLight }} />
                {couple.timeline.map((tl, i) => (
                  <div key={i} style={{ display: 'flex', gap: 18, marginBottom: i < couple.timeline.length - 1 ? 30 : 0, position: 'relative' }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: 15, background: colors.dark,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 14px ${colors.dark}30`,
                      position: 'relative', zIndex: 1,
                    }}>
                      <Icon name={pickTimelineIcon(tl.event)} size={22} color={colors.primary} />
                    </div>
                    <div style={{ paddingTop: 10 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: colors.primary, letterSpacing: '0.01em' }}>{tl.time}</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: colors.dark, marginTop: 3 }}>{tl.event}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          )}

          {((couple as any).enable_guest_wishes ?? false) && (
            <Reveal wide id="wishes">
              <div style={capsHeading}><Icon name="heart" size={12} color={colors.primary} />{t('wishesForUs')}</div>
              <GeoDivider primary={colors.primary} dark={colors.dark} primaryLight={colors.primaryLight} />
              <p style={{ fontSize: 13, color: colors.dark, opacity: 0.6, marginTop: 6, marginBottom: 20 }}>
                {t('shareWishes')} {couple.bride} &amp; {couple.groom}.
              </p>
              <WishesWall coupleId={couple.id} primary={colors.primary} primaryLight={colors.primaryLight} dark={colors.dark} boxBg={boxBg} t={t} />
            </Reveal>
          )}

          {/* Fixed watermark — large faint rotated-square monogram */}
          <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
              width: 500, height: 500,
              background: `radial-gradient(circle, ${colors.primary}0d 0%, transparent 70%)`,
            }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', opacity: 0.05 }}>
              <GeoMonogram initials={initials} primary={colors.dark} primaryLight={colors.dark} size={560} textColor={colors.dark} />
            </div>
          </div>

          <div style={{ marginTop: 60 }}>

            {(section.countdown ?? true) && (
              <Reveal mt={80} id="savethedate">
                <div style={{ ...capsHeading, ...ts('countdown_label') }}><Icon name="heart" size={12} color={colors.primary} />{t('justAFewMore')}</div>
                <GeoDivider primary={colors.primary} dark={colors.dark} primaryLight={colors.primaryLight} />
                <p style={{ fontSize: 13, color: colors.dark, opacity: 0.6, marginTop: 16, marginBottom: 20 }}>
                  {t('countingDays')}
                </p>
                <CountdownDisplay targetDate={couple.wedding_date} dark={colors.dark} primary={colors.primary} primaryLight={colors.primaryLight} t={t} />
              </Reveal>
            )}

            {(section.music ?? true) && couple.song_url && (
              <Reveal>
                <div style={capsHeading}><Icon name="music" size={12} color={colors.primary} />{t('ourSong')}</div>
                <div style={{ marginTop: 16 }}>
                  {couple.song_url.includes('youtube.com') || couple.song_url.includes('youtu.be') ? (
                    <div style={{ borderRadius: 12, overflow: 'hidden' }}>
                      <iframe width="100%" height="170"
                        src={`https://www.youtube.com/embed/${couple.song_url.split(/v=|youtu\.be\//)[1]?.split('&')[0]}?autoplay=1&mute=1&loop=1`}
                        title="song" allow="autoplay; encrypted-media" style={{ border: 0 }} />
                    </div>
                  ) : (
                    <>
                      <audio ref={audioRef} loop src={couple.song_url} style={{ display: 'none' }} />
                      <MusicPlayer
                        audioRef={audioRef}
                        title={couple.song_title ?? undefined}
                        artist={couple.song_artist ?? undefined}
                        primary={colors.primary}
                        primaryLight={colors.primaryLight}
                        dark={colors.dark}
                        boxBg={boxBg}
                      />
                    </>
                  )}
                </div>
              </Reveal>
            )}

            {contactList.length > 0 && (
              <Reveal id="contact">
                <div style={capsHeading}><Icon name="phone" size={12} color={colors.primary} />{t('getInTouch')}</div>
                <GeoDivider primary={colors.primary} dark={colors.dark} primaryLight={colors.primaryLight} />
                <p style={{ fontSize: 11.5, color: colors.dark, opacity: 0.55, marginBottom: 16 }}>{t('inquiriesText')}</p>
                <div style={{ display: 'grid', gap: 10, textAlign: 'left' }}>
                  {contactList.map((c, i) => <ContactRow key={i} name={c.name} phone={c.phone} primary={colors.primary} dark={colors.dark} />)}
                </div>
              </Reveal>
            )}

            {((couple as any).show_wedding_note ?? true) && (couple as any).wedding_note_text && (couple as any).wedding_note_text.trim() && (
              <Reveal>
                <div style={capsHeading}><Icon name="heart" size={12} color={colors.primary} />{t('noteForYou')}</div>
                <GeoDivider primary={colors.primary} dark={colors.dark} primaryLight={colors.primaryLight} />
                {guestName && (
                  <p style={{ fontSize: 11.5, color: colors.primary, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{t('dear')} {guestName}</p>
                )}
                <p style={{ fontSize: 13.5, color: colors.dark, opacity: 0.7, lineHeight: 1.9 }}>
                  {(couple as any).wedding_note_text.split('\n').map((l: string, i: number, arr: string[]) => <span key={i}>{l}{i < arr.length - 1 && <br />}</span>)}
                </p>
              </Reveal>
            )}

            {(section.thank_you ?? true) && (
              <Reveal>
                <div style={capsHeading}><Icon name="heart" size={12} color={colors.primary} />{t('thankYouHeading')}</div>
                <GeoDivider primary={colors.primary} dark={colors.dark} primaryLight={colors.primaryLight} />
                <p style={{ fontSize: 13.5, color: colors.dark, opacity: 0.7, lineHeight: 1.9 }}>
                  {thankYouText || t('defaultThankYou')}
                </p>
              </Reveal>
            )}

            <RsvpBlock couple={couple} colors={colors} guestName={guestName} t={t} />

            <div style={{ ...PG_WRAP, marginTop: 50, textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <GeoDivider primary={colors.primary} dark={colors.dark} primaryLight={colors.primaryLight} />
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.2rem', color: colors.dark, marginTop: 10, textTransform: 'uppercase' }}>
                {couple.bride} &amp; {couple.groom}
              </div>
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: colors.dark, opacity: 0.55, marginTop: 12, fontWeight: 600 }}>
                {t('loveBloomEternal')}
              </p>
              {((couple as any).enable_footer_social ?? true) && <FooterSocial color={colors.primary} background={`${colors.primary}14`} />}
            </div>
            <div style={{ height: 70 }} />
          </div>
        </motion.div>
      )}
      {opened && (
        <BottomNavBar
          primary={colors.primary} primaryLight={colors.primaryLight} dark={colors.dark}
          mapsUrl={enabledEvents[0]?.maps_url || ''}
          hasWishes={(couple as any).enable_guest_wishes ?? false}
          hasGallery={(section.gallery ?? true) && !!(couple.gallery && couple.gallery.length > 0)}
          hasContact={contactList.length > 0}
          audioRef={audioRef}
          t={t}
        />
      )}
    </div>
  )
}
