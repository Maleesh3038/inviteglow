"use client"
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, Couple } from '@/lib/supabase'
import FooterSocial from '@/components/shared/FooterSocial'

// ══════════════════════════════════════════════════════════════════
// Golden Poruwa — a brand-new wedding invitation template.
// Reference mood: a cinematic, AI-generated golden-hour poruwa
// ceremony — the couple at the traditional Kandyan poruwa platform,
// warm gold light, drifting flower petals, fine gold lotus line-art —
// on a deep maroon-and-cream stationery palette. Unlike the other
// templates in this codebase, the signature moment here is not an
// envelope opening but the cinematic hero video itself: it plays full
// -bleed on the cover the instant the page loads (muted, so no
// autoplay-gesture issue), and a single tap both starts the
// background song and reveals the rest of the invitation below.
// ══════════════════════════════════════════════════════════════════

const DEFAULT_PHOTO = "/images/hero-golden-poruwa.png"
const DEFAULT_COVER_VIDEO = "https://eqacrwhbrfqcnlgegvtl.supabase.co/storage/v1/object/public/wedding-photos/videos/golden-poruwa-cover.mp4"
const DEFAULT_SONG_URL = "/audio/calm-wedding.mp3"
const DEFAULT_SONG_TITLE = "Calm Wedding Theme"
const DEFAULT_SONG_ARTIST = "InviteGlow"

// Palette matches the reference video's look: a soft blush-cream
// backdrop, warm gold-brown headings, deep coffee-brown body text —
// no maroon/red anywhere, unlike this codebase's other Kandyan-themed
// templates.
const DEFAULT_PALETTE = {
  primary: "#b8863d",
  primaryLight: "#f1dfb8",
  dark: "#6b4423",
  cream: "#f8e9da",
  muted: "#a4886a",
}
// Foil gold + deep coffee-brown are fixed material colours, not
// couple-adjustable brand colours — gold leaf and dark shadow read as
// gold and brown whatever the couple's chosen accent colour is.
const GOLD = "#c9a15a"
const GOLD_LIGHT = "#eeda9f"
const MAROON = "#3d2712"

// ── Bilingual UI text — a Sinhala / English toggle for all the fixed
// template labels (headings, buttons, form prompts). Content the
// couple types themselves (names, venue, custom notes) is untouched —
// they can already type that in whichever language they like, since
// it's free text in the admin panel. ──
type Lang = 'en' | 'si'
const TXT: Record<Lang, Record<string, string>> = {
  en: {
    weddingInvitation: "Wedding Invitation",
    dear: "Dear",
    openInvitation: "Open Invitation",
    tapToBegin: "Tap to begin — with music",
    togetherWithFamilies: "Together with their families",
    rsvp: "RSVP",
    location: "Location",
    ourFamilies: "Our Families",
    togetherWith: "together with",
    saveTheDate: "Save the Date",
    dateLabel: "Date",
    timeLabel: "Time",
    venueLabel: "Venue",
    onwards: "Onwards",
    viewLocationMaps: "View Location on Maps",
    countingDown: "Counting Down to Our Big Day",
    days: "Days", hours: "Hours", mins: "Mins", secs: "Secs",
    kindlyRsvp: "Kindly RSVP",
    rsvpSub: "We'd be honoured to have you join our celebration",
    yourName: "Your Name",
    enterYourName: "Enter your name...",
    joyfullyAccept: "✓ Joyfully Accept",
    regretfullyDecline: "✗ Regretfully Decline",
    wonderful: "Wonderful",
    howManyGuests: "How many people will be coming, including yourself?",
    continueArrow: "Continue →",
    oneLastQuestion: "One last quick question",
    willHaveAlcohol: "Will you be having alcohol?",
    yesOpt: "🥃 Yes", noOpt: "🥤 No",
    seeYouThere: "See you there",
    willMissYou: "We'll miss you",
    partyOf: "Party of",
    confirmedExcl: "confirmed!",
    cantWait: "We can't wait to celebrate with you!",
    thanksForLettingKnow: "Thank you for letting us know.",
    ourCelebration: "Our Celebration",
    eventTimeline: "Event Timeline",
    withLove: "With Love",
    wishesForUs: "Wishes for Us",
    shareWishesWith: "Share your wishes and blessings with",
    leaveAWish: "Leave a Wish",
    yourNameShort: "Your name",
    writeWishes: "Write your wishes for the couple...",
    addPhotosVideo: "Add photos or a video (optional)",
    filesSelectedSuffix: "selected — add more",
    fileWord: "file", filesWord: "files",
    sendWish: "Send Wish",
    sending: "Sending...",
    thankYouForWish: "Thank you for your wish!",
    nowOnWall: "It's now on the wall below.",
    leaveAnotherWish: "Leave another wish",
    loadingWishes: "Loading wishes...",
    beFirstWish: "Be the first to leave a wish!",
    wishSingular: "Wish", wishPlural: "Wishes",
    previous: "← Previous", next: "Next →",
    beOurGuest: "Be Our Guest",
    findYourTable: "Find Your Table",
    searchNameTable: "Search your name to find your assigned table",
    search: "Search",
    seatedAt: "You are seated at",
    nameNotFound: "Name not found. Please contact the couple.",
    pleaseEnterName: "Please enter your name.",
    ourSong: "Our Song",
    momentsOfLove: "Moments of Love",
    getInTouch: "Get In Touch",
    contactNumbers: "Contact Numbers",
    aNoteForYou: "A Note For You",
    aSpecialNote: "A Special Note",
    toOurLovelyGuests: "To Our Lovely Guests",
    withAllOurLove: "With all our love,",
    footerTag: "inviteglow.com · Digital Wedding Invitations",
    navWishes: "Wishes", navSaveDate: "Save Date", navGallery: "Gallery", navContact: "Contact",
    eventEngagement: "Engagement", eventWedding: "Poruwa Ceremony", eventHomecoming: "Homecoming",
    defaultIntroText: "Two hearts, blessed at the poruwa — bound together with love, tradition and gratitude",
    defaultThankYou: "With hearts full of love and gratitude, we are so happy to celebrate this beautiful chapter of our lives with you. Your presence means more to us than words can truly express, and having you by our side makes this day even more meaningful.\n\nThank you for your love, your blessings, and for being part of our journey.",
    wishFormError: "Please add your name and a message.",
    wishSubmitError: "Something went wrong — please try again.",
  },
  si: {
    weddingInvitation: "විවාහ ආරාධනාව",
    dear: "ආදරණීය",
    openInvitation: "ආරාධනාව විවෘත කරන්න",
    tapToBegin: "ආරම්භ කිරීමට ටැප් කරන්න — සංගීතය සමඟ",
    togetherWithFamilies: "දෙපවුලේම සහභාගීත්වයෙන්",
    rsvp: "RSVP",
    location: "ස්ථානය",
    ourFamilies: "අපගේ පවුල්",
    togetherWith: "සමඟ",
    saveTheDate: "දිනය සටහන් කරගන්න",
    dateLabel: "දිනය",
    timeLabel: "වේලාව",
    venueLabel: "ස්ථානය",
    onwards: "සිට",
    viewLocationMaps: "සිතියමේ ස්ථානය බලන්න",
    countingDown: "අපගේ විශේෂ දිනය දක්වා ගණන් කිරීම",
    days: "දින", hours: "පැය", mins: "විනාඩි", secs: "තත්පර",
    kindlyRsvp: "කරුණාකර පැමිණීම තහවුරු කරන්න",
    rsvpSub: "ඔබගේ සහභාගීත්වය අපට මහත් ගෞරවයකි",
    yourName: "ඔබගේ නම",
    enterYourName: "ඔබගේ නම ඇතුළත් කරන්න...",
    joyfullyAccept: "✓ සතුටින් එකඟ වෙමි",
    regretfullyDecline: "✗ කණගාටුවෙන් ප්‍රතික්ෂේප කරමි",
    wonderful: "අපූරුයි",
    howManyGuests: "ඔබ ඇතුළුව කී දෙනෙක් පැමිණේද?",
    continueArrow: "ඉදිරියට →",
    oneLastQuestion: "අවසාන කුඩා ප්‍රශ්නයක්",
    willHaveAlcohol: "ඔබ මත්පැන් සේවනය කරනවාද?",
    yesOpt: "🥃 ඔව්", noOpt: "🥤 නැත",
    seeYouThere: "එහිදී හමුවෙමු",
    willMissYou: "ඔබ නොමැතිකම දැනෙනු ඇත",
    partyOf: "පිරිස",
    confirmedExcl: "තහවුරු විය!",
    cantWait: "ඔබ සමඟ සැමරීමට අපි බලාපොරොත්තුවෙන් සිටිමු!",
    thanksForLettingKnow: "අප දැනුවත් කිරීම ගැන ස්තුතියි.",
    ourCelebration: "අපගේ උත්සවය",
    eventTimeline: "උත්සව කාලසටහන",
    withLove: "ආදරයෙන්",
    wishesForUs: "අපට සුබ පැතුම්",
    shareWishesWith: "ඔබගේ සුබ පැතුම් සහ ආශිර්වාද පිරිනමන්න —",
    leaveAWish: "සුබ පැතුමක් තබන්න",
    yourNameShort: "ඔබගේ නම",
    writeWishes: "යුවළට ඔබගේ සුබ පැතුම් ලියන්න...",
    addPhotosVideo: "ඡායාරූප හෝ වීඩියෝවක් එක් කරන්න (අත්‍යවශ්‍ය නොවේ)",
    filesSelectedSuffix: "තෝරාගෙන ඇත — තවත් එක් කරන්න",
    fileWord: "ගොනුවක්", filesWord: "ගොනු",
    sendWish: "යවන්න",
    sending: "යවමින්...",
    thankYouForWish: "ඔබගේ සුබ පැතුමට ස්තුතියි!",
    nowOnWall: "එය පහත බිතුවේ දැන් දැක ගත හැක.",
    leaveAnotherWish: "තවත් සුබ පැතුමක් තබන්න",
    loadingWishes: "සුබ පැතුම් පූරණය වෙමින්...",
    beFirstWish: "පළමු සුබ පැතුම තබන්නා වන්න!",
    wishSingular: "සුබ පැතුමක්", wishPlural: "සුබ පැතුම්",
    previous: "← පෙර", next: "ඊළඟ →",
    beOurGuest: "අපගේ ආගන්තුකයා වන්න",
    findYourTable: "ඔබගේ මේසය සොයන්න",
    searchNameTable: "ඔබට වෙන් කළ මේසය සොයා ගැනීමට නම සොයන්න",
    search: "සොයන්න",
    seatedAt: "ඔබ වාඩි වී සිටින්නේ",
    nameNotFound: "නම හමු නොවීය. කරුණාකර යුවළ අමතන්න.",
    pleaseEnterName: "කරුණාකර ඔබගේ නම ඇතුළත් කරන්න.",
    ourSong: "අපගේ ගීතය",
    momentsOfLove: "ආදරයේ මොහොත්",
    getInTouch: "සම්බන්ධ වන්න",
    contactNumbers: "සම්බන්ධතා අංක",
    aNoteForYou: "ඔබ වෙනුවෙන් සටහනක්",
    aSpecialNote: "විශේෂ සටහනක්",
    toOurLovelyGuests: "අපගේ ආදරණීය ආගන්තුකයන් වෙත",
    withAllOurLove: "අපගේ සියලු ආදරයෙන්,",
    footerTag: "inviteglow.com · ඩිජිටල් විවාහ ආරාධනා",
    navWishes: "සුබ පැතුම්", navSaveDate: "දිනය", navGallery: "ගැලරිය", navContact: "සම්බන්ධතා",
    eventEngagement: "නිශ්චිතාර්ථය", eventWedding: "පොරුව මංගල්‍යය", eventHomecoming: "ගෙදර එළඹීම",
    defaultIntroText: "පොරුවේදී ආශිර්වාද ලත් හදවත් දෙකක් — ආදරය, සම්ප්‍රදාය සහ කෘතඥතාවයෙන් බැඳී",
    defaultThankYou: "ආදරයෙන් සහ කෘතඥතාවයෙන් පිරි හදවත් සමඟ, අපගේ ජීවිතයේ මෙම සුන්දර පරිච්ඡේදය ඔබ සමඟ සැමරීමට හැකි වීම ගැන අපි ඉතා සතුටු වෙමු. ඔබගේ පැමිණීම වචනවලින් විස්තර කළ නොහැකි තරම් අපට වටිනවා, ඔබ අප අබියස සිටීම මෙම දිනය තවත් අර්ථවත් කරයි.\n\nඔබගේ ආදරය, ආශිර්වාද, සහ අපගේ ගමනේ කොටසක් වීම ගැන ස්තුතියි.",
    wishFormError: "කරුණාකර ඔබගේ නම සහ පණිවිඩයක් එක් කරන්න.",
    wishSubmitError: "යම් දෝෂයක් සිදු විය — කරුණාකර නැවත උත්සාහ කරන්න.",
  },
}

// ── Floating language toggle — Sinhala / English, always visible. ──
function LangToggle({ lang, setLang }: { lang: Lang; setLang: React.Dispatch<React.SetStateAction<Lang>> }) {
  return (
    <button
      onClick={() => setLang(l => (l === 'en' ? 'si' : 'en'))}
      aria-label="Toggle language"
      style={{
        position: "fixed", top: 16, right: 16, zIndex: 200,
        display: "flex", alignItems: "center", gap: 6,
        background: "rgba(20,7,10,0.4)", backdropFilter: "blur(8px)",
        border: `1px solid ${GOLD_LIGHT}88`, borderRadius: 100,
        padding: "7px 14px", cursor: "pointer",
        fontFamily: "'Inter',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
        color: "#fff", boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
      }}
    >
      <span style={{ opacity: lang === 'en' ? 1 : 0.5 }}>EN</span>
      <span style={{ opacity: 0.5 }}>|</span>
      <span style={{ opacity: lang === 'si' ? 1 : 0.5 }}>සිං</span>
    </button>
  )
}

function normalizeMapsUrl(url: string): string {
  if (!url) return '#'
  if (url.includes('maps.app.goo.gl') || url.includes('goo.gl/maps')) {
    return `https://www.google.com/maps?q=${encodeURIComponent(url)}`
  }
  return url
}

// ── Lotus flower line-art — the template's signature motif. ──
function LotusIcon({ color = GOLD, size = 44, opacity = 0.9 }: { color?: string; size?: number; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ opacity, display: "block" }}>
      <path d="M32 54c0-14 0-26 0-38" fill="none" stroke={color} strokeWidth="1.1" strokeLinecap="round" opacity="0.6" />
      {[0, 1, 2, 3, 4].map(i => {
        const angle = (i - 2) * 26
        return (
          <path key={i}
            d="M32 40 C24 34 20 24 24 12 C28 20 32 28 32 40 C32 28 36 20 40 12 C44 24 40 34 32 40 Z"
            fill="none" stroke={color} strokeWidth="1.1"
            transform={`rotate(${angle} 32 40)`}
            opacity={0.55 + (2 - Math.abs(i - 2)) * 0.15}
          />
        )
      })}
      <circle cx="32" cy="40" r="3.2" fill={color} opacity="0.85" />
      <path d="M18 54c6-4 22-4 28 0" fill="none" stroke={color} strokeWidth="1.1" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}

// ── Gold poruwa medallion — a small circular monogram badge, used on
// the cover and as a recurring decorative motif. ──
function GoldMedallion({ initials, size = 54 }: { initials: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `radial-gradient(circle at 32% 28%, ${GOLD_LIGHT}, ${GOLD} 70%, #93712f 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: `0 3px 10px rgba(61,39,18,0.4), inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 3px rgba(255,255,255,0.4)`,
      border: "1px solid rgba(255,255,255,0.3)",
    }}>
      <span style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontWeight: 700, fontSize: size * 0.34, color: "#fff8e8", textShadow: "0 1px 2px rgba(0,0,0,0.35)" }}>{initials}</span>
    </div>
  )
}

// ── Gold mandala medallion — a large ornate circular arch motif, the
// recurring decorative anchor at the top of each blush-background
// section (echoing the gold mandala arch seen in the reference). Only
// the top half is normally visible, peeking in from above the section. ──
function MandalaMedallion({ size = 200, color = GOLD }: { size?: number; color?: string }) {
  const rings = [0.98, 0.86, 0.74]
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ display: "block", opacity: 0.55 }}>
      {rings.map((r, i) => (
        <circle key={i} cx="100" cy="100" r={100 * r} fill="none" stroke={color} strokeWidth={i === 0 ? 1.4 : 0.8} opacity={0.7 - i * 0.15} />
      ))}
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i / 24) * Math.PI * 2
        const x1 = 100 + Math.cos(angle) * 74, y1 = 100 + Math.sin(angle) * 74
        const x2 = 100 + Math.cos(angle) * 98, y2 = 100 + Math.sin(angle) * 98
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1" opacity="0.5" />
      })}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2
        const x = 100 + Math.cos(angle) * 86, y = 100 + Math.sin(angle) * 86
        return <circle key={i} cx={x} cy={y} r="2.6" fill={color} opacity="0.65" />
      })}
      <circle cx="100" cy="100" r="46" fill="none" stroke={color} strokeWidth="1" opacity="0.5" />
      <svg x={68} y={68} width={64} height={64} viewBox="0 0 64 64">
        <path d="M32 54c0-14 0-26 0-38" fill="none" stroke={color} strokeWidth="1.1" strokeLinecap="round" opacity="0.6" />
        {[0, 1, 2, 3, 4].map(i => {
          const angle = (i - 2) * 26
          return (
            <path key={i}
              d="M32 40 C24 34 20 24 24 12 C28 20 32 28 32 40 C32 28 36 20 40 12 C44 24 40 34 32 40 Z"
              fill="none" stroke={color} strokeWidth="1.1"
              transform={`rotate(${angle} 32 40)`}
              opacity={0.6 + (2 - Math.abs(i - 2)) * 0.13}
            />
          )
        })}
        <circle cx="32" cy="40" r="3.2" fill={color} opacity="0.85" />
      </svg>
    </svg>
  )
}

// ── Lotus branch divider — a wide, hand-drawn-style line-art row of
// lotus flowers and leaves spanning the section width, echoing the
// botanical illustration bordering each section in the reference. ──
function LotusBranchDivider({ color = GOLD, flip = false }: { color?: string; flip?: boolean }) {
  const flowers = [
    { x: 20, s: 0.8 }, { x: 60, s: 1.1 }, { x: 110, s: 0.7 }, { x: 160, s: 1.2 },
    { x: 210, s: 0.75 }, { x: 260, s: 1 }, { x: 300, s: 0.65 },
  ]
  return (
    <svg width="100%" height="64" viewBox="0 0 320 64" preserveAspectRatio="xMidYMax slice"
      style={{ display: "block", transform: flip ? "scaleY(-1)" : undefined, opacity: 0.55 }}>
      <path d="M0 58 C 60 46, 120 54, 160 44 C 200 54, 260 46, 320 58" fill="none" stroke={color} strokeWidth="1" opacity="0.5" />
      {flowers.map((f, i) => (
        <g key={i} transform={`translate(${f.x} ${58 - f.s * 8}) scale(${f.s})`}>
          <path d="M0 20 C-5 12,-8 4,-4 -6 C0 2,0 10,0 20 C0 10,0 2,4 -6 C8 4,5 12,0 20 Z" fill="none" stroke={color} strokeWidth="1.1" opacity="0.75" />
          <path d="M-9 20 C-13 15,-14 9,-10 2 C-6 8,-7 15,-9 20 Z" fill="none" stroke={color} strokeWidth="0.9" opacity="0.6" />
          <path d="M9 20 C13 15,14 9,10 2 C6 8,7 15,9 20 Z" fill="none" stroke={color} strokeWidth="0.9" opacity="0.6" />
          <circle cx="0" cy="18" r="1.6" fill={color} opacity="0.7" />
        </g>
      ))}
    </svg>
  )
}

// ── Ambient drifting gold petals — soft gold ellipses rising slowly,
// echoing the falling flower petals in the cinematic reference video. ──
function FloatingPetals({ count = 14, color = GOLD_LIGHT }: { count?: number; color?: string }) {
  const [items, setItems] = useState<{ id: number; left: number; size: number; duration: number; delay: number; rot: number }[]>([])
  useEffect(() => {
    setItems(Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: 4 + Math.random() * 92,
      size: 5 + Math.random() * 7,
      duration: 9 + Math.random() * 10,
      delay: Math.random() * 10,
      rot: Math.random() * 360,
    })))
  }, [count])
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 3 }}>
      {items.map(p => (
        <div key={p.id} style={{
          position: "absolute", bottom: -14, left: `${p.left}%`,
          width: p.size, height: p.size * 1.7, borderRadius: "50%",
          background: `linear-gradient(160deg, #fff8ec, ${color})`,
          opacity: 0.75, transform: `rotate(${p.rot}deg)`,
          animation: `petal-rise-${p.id % 3} ${p.duration}s ease-in ${p.delay}s infinite`,
        }} />
      ))}
      <style>{`
        @keyframes petal-rise-0 { 0%{transform:translateY(0) translateX(0) rotate(0deg);opacity:0;} 15%{opacity:0.85;} 85%{opacity:0.5;} 100%{transform:translateY(-105vh) translateX(30px) rotate(200deg);opacity:0;} }
        @keyframes petal-rise-1 { 0%{transform:translateY(0) translateX(0) rotate(0deg);opacity:0;} 20%{opacity:0.75;} 80%{opacity:0.45;} 100%{transform:translateY(-105vh) translateX(-24px) rotate(-160deg);opacity:0;} }
        @keyframes petal-rise-2 { 0%{transform:translateY(0) translateX(0) rotate(0deg);opacity:0;} 10%{opacity:0.9;} 90%{opacity:0.4;} 100%{transform:translateY(-105vh) translateX(16px) rotate(120deg);opacity:0;} }
      `}</style>
    </div>
  )
}

// ── Guest intro splash — "Dear [Name]" with an auto-progress bar,
// shown once before the cover if a personalized ?name= link is used. ──
function GuestIntroScreen({ guestName, onDone, primary, primaryLight, dark, cream }: {
  guestName: string; onDone: () => void; primary: string; primaryLight: string; dark: string; cream: string
}) {
  return (
    <motion.div
      key="intro"
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.6 }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", background: `radial-gradient(ellipse 90% 70% at 50% 30%, ${primaryLight} 0%, ${cream} 75%)`,
        padding: "0 2rem", textAlign: "center",
      }}
    >
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <LotusIcon color={GOLD} size={40} opacity={0.85} />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, letterSpacing: "0.1em" }}
        animate={{ opacity: 1, letterSpacing: "0.4em" }}
        transition={{ duration: 1, delay: 0.5 }}
        style={{ fontSize: 10, textTransform: "uppercase", color: `${primary}bb`, fontFamily: "'Inter',sans-serif", marginTop: 18 }}
      >
        Dear
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.7 }}
        style={{ fontFamily: "'Great Vibes',cursive", fontSize: "clamp(2.4rem,10vw,3.4rem)", color: dark, marginTop: 6 }}>
        {guestName}
      </motion.div>
      <div style={{ position: "relative", width: 160, height: 3, background: `${primary}22`, borderRadius: 100, marginTop: 28, overflow: "hidden" }}>
        <motion.div
          style={{ position: "absolute", inset: 0, background: `linear-gradient(to right,${primary},${GOLD})`, borderRadius: 100 }}
          initial={{ width: "0%" }} animate={{ width: "100%" }}
          transition={{ duration: 4.2, ease: "linear", delay: 0.4 }}
          onAnimationComplete={onDone}
        />
      </div>
      <motion.button
        initial={{ opacity: 0 }} animate={{ opacity: 0.55 }} transition={{ delay: 1.6 }}
        onClick={onDone}
        style={{ marginTop: 18, background: "transparent", border: "none", cursor: "pointer", fontSize: 11, color: primary, letterSpacing: "0.15em", fontFamily: "'Inter',sans-serif" }}
      >
        Skip →
      </motion.button>
    </motion.div>
  )
}

// ── Countdown — tombstone-arched boxes, echoing the reference video ──
function Countdown({ targetDate, primary, primaryLight, dark, t }: { targetDate: string; primary: string; primaryLight: string; dark: string; t: (k: string) => string }) {
  const [tt, setTt] = useState({ d: "00", h: "00", m: "00", s: "00" })
  useEffect(() => {
    const tick = () => {
      const diff = new Date(targetDate).getTime() - Date.now()
      if (diff <= 0) return
      setTt({
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
    <div style={{ display: "flex", maxWidth: 380, margin: "0 auto", gap: 8 }}>
      {[[t('days'), tt.d], [t('hours'), tt.h], [t('mins'), tt.m], [t('secs'), tt.s]].map(([l, v]) => (
        <div key={l} style={{ flex: 1, textAlign: "center" }}>
          <div style={{
            borderRadius: "40px 40px 10px 10px", background: `linear-gradient(145deg,${primaryLight}66,${GOLD_LIGHT}44)`,
            border: `1.5px solid ${GOLD}66`, padding: "18px 4px 12px",
            boxShadow: `0 4px 16px ${primary}1f`,
          }}>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.6rem", color: dark, fontWeight: 600 }}>{v}</span>
          </div>
          <span style={{ fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: `${primary}bb`, display: "block", marginTop: 6 }}>{l}</span>
        </div>
      ))}
    </div>
  )
}

// ── YouTube detect + Music Player ──
function getYouTubeId(url: string): string | null {
  if (!url) return null
  const patterns = [/youtu\.be\/([^?&]+)/, /youtube\.com\/watch\?v=([^&]+)/, /youtube\.com\/embed\/([^?&]+)/, /youtube\.com\/shorts\/([^?&]+)/]
  for (const p of patterns) { const m = url.match(p); if (m) return m[1] }
  return null
}

function MusicPlayerUI({ title, artist, songUrl, audioRef, primary, primaryLight, dark, muted }: {
  title: string; artist: string; songUrl: string;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  primary: string; primaryLight: string; dark: string; muted: string
}) {
  const youtubeId = getYouTubeId(songUrl)
  const [playing, setPlaying] = useState(false)
  const [prog, setProg] = useState(0)
  useEffect(() => {
    if (youtubeId) return
    const audio = audioRef.current
    if (!audio) return
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onTime = () => { if (audio.duration) setProg((audio.currentTime / audio.duration) * 100) }
    audio.addEventListener('play', onPlay); audio.addEventListener('pause', onPause); audio.addEventListener('timeupdate', onTime)
    setPlaying(!audio.paused)
    return () => { audio.removeEventListener('play', onPlay); audio.removeEventListener('pause', onPause); audio.removeEventListener('timeupdate', onTime) }
  }, [audioRef, youtubeId])
  const toggle = () => { const a = audioRef.current; if (!a) return; a.paused ? a.play().catch(() => {}) : a.pause() }

  if (youtubeId) return (
    <div style={{ background: `${primary}14`, borderRadius: 14, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: `linear-gradient(135deg,${primary},${GOLD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎵</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: dark }}>{title}</div>
          <div style={{ fontSize: 11, color: muted }}>{artist}</div>
        </div>
      </div>
      <div style={{ borderRadius: 10, overflow: "hidden", aspectRatio: "16/9" }}>
        <iframe src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&rel=0&modestbranding=1&loop=1&playlist=${youtubeId}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
          style={{ width: "100%", height: "100%", border: "none", display: "block" }} />
      </div>
    </div>
  )

  return (
    <div style={{ background: `${primaryLight}44`, borderRadius: 14, padding: "14px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg,${primary},${GOLD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, animation: playing ? "spin 3s linear infinite" : "none" }}>🎵</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: dark }}>{title}</div>
            <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{artist}</div>
          </div>
        </div>
        <button onClick={toggle} style={{ width: 38, height: 38, borderRadius: "50%", background: primary, border: "none", cursor: "pointer", color: "#fff", fontSize: 14 }}>{playing ? "⏸" : "▶"}</button>
      </div>
      <div style={{ height: 3, background: `${primary}22`, borderRadius: 100 }}>
        <div style={{ height: "100%", width: `${prog}%`, background: `linear-gradient(to right,${primary},${GOLD})`, borderRadius: 100, transition: "width 0.3s" }} />
      </div>
    </div>
  )
}

// ── RSVP ──
function RSVP({ coupleId, askDrinking, primary, primaryLight, dark, cream, muted, guestName, t }: { coupleId: string; askDrinking: boolean; primary: string; primaryLight: string; dark: string; cream: string; muted: string; guestName: string; t: (k: string) => string }) {
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
  const inp: React.CSSProperties = { width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${primaryLight}`, background: cream, color: dark, fontSize: 14, outline: "none", fontFamily: "'Inter',sans-serif", marginBottom: 10, display: "block" }
  return (
    <div style={{ background: `linear-gradient(135deg,${primaryLight}55,${cream})`, padding: "2.5rem 1.5rem", textAlign: "center" }}>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "2rem", color: dark, marginBottom: 6 }}>{t('kindlyRsvp')}</div>
      <div style={{ fontSize: 12, color: muted, marginBottom: 20 }}>{t('rsvpSub')}</div>
      <div style={{ background: "#fff", borderRadius: 16, padding: "1.5rem", maxWidth: 380, margin: "0 auto", boxShadow: "0 4px 20px rgba(61,39,18,0.08)" }}>
        {step === "form" && (<>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: `${primary}99`, marginBottom: 8, textAlign: "left" }}>{t('yourName')}</div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder={t('enterYourName')} style={inp} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={handleAccept} disabled={saving} style={{ width: "100%", padding: 14, borderRadius: 12, background: `linear-gradient(135deg,${primary},${GOLD})`, color: "#fff", border: "none", cursor: "pointer", fontSize: 13.5, fontWeight: 600, opacity: saving ? 0.6 : 1 }}>{saving ? "..." : t('joyfullyAccept')}</button>
            <button onClick={handleDecline} disabled={saving} style={{ width: "100%", padding: 14, borderRadius: 12, background: "#fff", color: primary, border: `1.5px solid ${primaryLight}`, cursor: "pointer", fontSize: 13.5, fontWeight: 600, opacity: saving ? 0.6 : 1 }}>{saving ? "..." : t('regretfullyDecline')}</button>
          </div>
        </>)}
        {step === "count" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ fontSize: 14, color: dark, fontWeight: 600, marginBottom: 4 }}>{t('wonderful')}, {name}! 🌸</div>
            <div style={{ fontSize: 12, color: muted, marginBottom: 16 }}>{t('howManyGuests')}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 18 }}>
              <button onClick={() => setGuestCount(c => Math.max(1, c - 1))} style={{ width: 38, height: 38, borderRadius: "50%", background: `${primaryLight}55`, color: primary, border: "none", cursor: "pointer", fontSize: 18, fontWeight: 600 }}>−</button>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "2rem", color: dark, fontWeight: 600, minWidth: 50, textAlign: "center" }}>{guestCount}</div>
              <button onClick={() => setGuestCount(c => Math.min(20, c + 1))} style={{ width: 38, height: 38, borderRadius: "50%", background: `${primaryLight}55`, color: primary, border: "none", cursor: "pointer", fontSize: 18, fontWeight: 600 }}>+</button>
            </div>
            <button onClick={handleCountNext} disabled={saving} style={{ width: "100%", padding: 13, borderRadius: 10, background: `linear-gradient(135deg,${primary},${GOLD})`, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, opacity: saving ? 0.6 : 1 }}>{saving ? "..." : t('continueArrow')}</button>
          </motion.div>
        )}
        {step === "drinking" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ fontSize: 12, color: muted, marginBottom: 16 }}>{t('oneLastQuestion')}</div>
            <div style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: `${primary}99`, marginBottom: 10, textAlign: "left" }}>{t('willHaveAlcohol')}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={() => save("yes", "yes", guestCount)} disabled={saving} style={{ padding: 13, borderRadius: 10, background: `${primaryLight}55`, color: primary, border: `1.5px solid ${primaryLight}`, cursor: "pointer", fontSize: 13, fontWeight: 500, opacity: saving ? 0.6 : 1 }}>{t('yesOpt')}</button>
              <button onClick={() => save("yes", "no", guestCount)} disabled={saving} style={{ padding: 13, borderRadius: 10, background: `${primaryLight}55`, color: primary, border: `1.5px solid ${primaryLight}`, cursor: "pointer", fontSize: 13, fontWeight: 500, opacity: saving ? 0.6 : 1 }}>{t('noOpt')}</button>
            </div>
          </motion.div>
        )}
        {step === "done" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: "1rem 0", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{finalResponse === "yes" ? "🌸" : "🙏"}</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.3rem", color: primary, marginBottom: 4 }}>
              {finalResponse === "yes" ? `${t('seeYouThere')}, ${name}!` : `${t('willMissYou')}, ${name}.`}
            </div>
            <div style={{ fontSize: 12, color: muted }}>
              {finalResponse === "yes" ? (guestCount > 1 ? `${t('partyOf')} ${guestCount} ${t('confirmedExcl')}` : t('cantWait')) : t('thanksForLettingKnow')}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

// ── Seat Finder ──
function SeatFinder({ seats, primary, dark, cream, muted, t }: { seats: Record<string, string>; primary: string; dark: string; cream: string; muted: string; t: (k: string) => string }) {
  const [q, setQ] = useState(""); const [res, setRes] = useState("")
  const [found, setFound] = useState(false)
  const search = () => {
    const query = q.trim().toLowerCase()
    if (!query) { setRes(t('pleaseEnterName')); setFound(false); return }
    const match = Object.keys(seats || {}).find(k => query.includes(k) || k.includes(query))
    if (match) { setRes(`🌸 ${t('seatedAt')} ${seats[match]}`); setFound(true) }
    else { setRes(t('nameNotFound')); setFound(false) }
  }
  return (
    <>
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && search()} placeholder={t('enterYourName')}
          style={{ flex: 1, padding: "12px 16px", borderRadius: 10, border: `1px solid ${primary}33`, background: cream, color: dark, fontSize: 14, outline: "none", fontFamily: "'Inter',sans-serif" }} />
        <button onClick={search} style={{ padding: "12px 18px", borderRadius: 10, background: primary, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>{t('search')}</button>
      </div>
      {res && <div style={{ marginTop: 12, fontSize: 14, color: found ? primary : muted, fontWeight: found ? 500 : 400 }}>{res}</div>}
    </>
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
      position: "fixed", inset: 0, background: "rgba(26,10,14,0.92)", zIndex: 500,
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
              <div style={{ position: "absolute", inset: 0, background: "rgba(26,10,14,0.55)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, fontWeight: 700, zIndex: 2 }}>
                +{media.length - 4}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function WishesWall({ coupleId, primary, primaryLight, dark, cream, muted, t }: {
  coupleId: string; primary: string; primaryLight: string; dark: string; cream: string; muted: string; t: (k: string) => string
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
      setError(t('wishFormError'))
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
      setError(t('wishSubmitError'))
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '11px 14px', borderRadius: 10, border: `1px solid ${primary}33`, background: cream, color: dark, fontSize: 13, outline: 'none', marginBottom: 10, boxSizing: 'border-box', fontFamily: "'Inter',sans-serif" }

  return (
    <div>
      <div style={{ background: "#fff", borderRadius: 16, padding: '18px 16px', textAlign: 'left', marginBottom: 18, boxShadow: "0 4px 20px rgba(61,39,18,0.06)" }}>
        {done ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: dark }}>{t('thankYouForWish')}</div>
            <div style={{ fontSize: 12, color: muted, marginTop: 4 }}>{t('nowOnWall')}</div>
            <button onClick={() => setDone(false)} style={{
              marginTop: 12, padding: '8px 18px', borderRadius: 100, border: 'none', cursor: 'pointer',
              background: `${primaryLight}55`, color: dark, fontSize: 12, fontWeight: 700,
            }}>{t('leaveAnotherWish')}</button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: dark, marginBottom: 10 }}>{t('leaveAWish')}</div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder={t('yourNameShort')} style={inputStyle} />
            <textarea
              value={message} onChange={e => setMessage(e.target.value)} placeholder={t('writeWishes')} rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: muted, opacity: 0.9,
              padding: '9px 13px', borderRadius: 10, border: `1px dashed ${primary}`, cursor: 'pointer', marginBottom: files.length ? 6 : 10,
            }}>
              📷 {files.length ? `${files.length} ${files.length > 1 ? t('filesWord') : t('fileWord')} ${t('filesSelectedSuffix')}` : t('addPhotosVideo')}
              <input type="file" accept="image/*,video/*" multiple
                onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files || [])].slice(0, 6))}
                style={{ display: 'none' }} />
            </label>
            {files.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {files.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: dark, background: `${primaryLight}55`, borderRadius: 100, padding: '4px 9px' }}>
                    {f.name.length > 16 ? f.name.slice(0, 14) + '…' : f.name}
                    <span onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} style={{ cursor: 'pointer', fontWeight: 700 }}>×</span>
                  </div>
                ))}
              </div>
            )}
            {error && <div style={{ fontSize: 11.5, color: primary, marginBottom: 8 }}>{error}</div>}
            <button onClick={submit} disabled={submitting} style={{
              width: '100%', padding: 12, borderRadius: 10, border: 'none', cursor: 'pointer',
              background: `linear-gradient(135deg,${primary},${GOLD})`, color: '#fff', fontWeight: 700, fontSize: 13, fontFamily: "'Inter',sans-serif", opacity: submitting ? 0.6 : 1,
            }}>{submitting ? t('sending') : t('sendWish')}</button>
          </>
        )}
      </div>

      {loading ? (
        <div style={{ fontSize: 12, color: muted, textAlign: 'center' }}>{t('loadingWishes')}</div>
      ) : wishes.length === 0 ? (
        <div style={{ fontSize: 12, color: muted, textAlign: 'center' }}>{t('beFirstWish')}</div>
      ) : (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: dark, textAlign: 'center', marginBottom: 14 }}>
            {wishes.length} {wishes.length === 1 ? t('wishSingular') : t('wishPlural')}
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
              }}>{t('previous')}</button>
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
              }}>{t('next')}</button>
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

// ── Card + section styles ──
const cardStyle = (): React.CSSProperties => ({ background: "#fff", margin: "0 16px 16px", borderRadius: 22, padding: "1.8rem", boxShadow: "0 2px 20px rgba(61,39,18,0.08)", position: "relative", overflow: "hidden" })
const eyebrow = (color: string): React.CSSProperties => ({ fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color, textAlign: "center", marginBottom: 6, fontWeight: 600 })
const heading = (dark: string): React.CSSProperties => ({ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1.7rem", color: dark, textAlign: "center", marginBottom: "1.4rem" })

// ── Contact Numbers ──
function ContactRow({ name, phone, primary }: { name: string; phone: string; primary: string }) {
  const digitsOnly = phone.replace(/\D/g, '')
  const waNumber = digitsOnly.startsWith('0') ? `94${digitsOnly.slice(1)}` : digitsOnly
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: '#fff', border: `1px solid ${primary}22`, borderRadius: 14, padding: '12px 16px', boxShadow: '0 2px 10px rgba(61,39,18,0.05)' }}>
      <div style={{ minWidth: 0 }}>
        {name ? (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#3a1e26', fontFamily: "'Inter',sans-serif" }}>{name}</div>
            <div style={{ fontSize: 12, color: '#a68a6a', marginTop: 2 }}>{phone}</div>
          </>
        ) : (
          <div style={{ fontSize: 13, fontWeight: 700, color: '#3a1e26', fontFamily: "'Inter',sans-serif" }}>{phone}</div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <a href={`tel:${digitsOnly}`} aria-label={name ? `Call ${name}` : `Call ${phone}`} style={{
          width: 36, height: 36, borderRadius: '50%', background: `${primary}1a`, color: primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
        }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill={primary}>
            <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01z" />
          </svg>
        </a>
        <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer" aria-label={name ? `WhatsApp ${name}` : `WhatsApp ${phone}`} style={{
          width: 36, height: 36, borderRadius: '50%', background: '#25d366', color: '#fff',
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

// ── Floating bottom nav bar ──
function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function BottomNavBar({ primary, dark, mapsUrl, hasWishes, hasGallery, hasContact, audioRef, t }: {
  primary: string; dark: string; mapsUrl: string; hasWishes: boolean; hasGallery: boolean; hasContact: boolean; audioRef: React.RefObject<HTMLAudioElement | null>; t: (k: string) => string
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
      border: 'none', cursor: 'pointer', color: dark, opacity: 0.8, padding: '2px 4px',
    }}>
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">{path}</svg>
      <span style={{ fontSize: 8, letterSpacing: '0.02em' }}>{label}</span>
    </button>
  )

  return (
    <div style={{ position: 'fixed', bottom: 18, left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 40px)', maxWidth: 400, zIndex: 100 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-evenly',
        background: 'rgba(255,255,255,0.98)', borderRadius: 100, border: '1px solid rgba(61,39,18,0.08)',
        boxShadow: '0 10px 30px rgba(61,39,18,0.18)', padding: '10px 18px', paddingRight: 56, position: 'relative',
      }}>
        {hasWishes && iconBtn(() => scrollToId('wishes'), t('navWishes'), <path d="M12 20.5s-7.5-4.9-9.8-9.3C.6 8 2 4.7 5.2 4a4.6 4.6 0 016.8 2.3A4.6 4.6 0 0118.8 4C22 4.7 23.4 8 21.8 11.2 19.5 15.6 12 20.5 12 20.5z" />, 'wishes')}
        {iconBtn(() => scrollToId('savethedate'), t('navSaveDate'), <><rect x="3.5" y="5" width="17" height="16" rx="2.5" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /></>, 'savedate')}
        {hasGallery && iconBtn(() => scrollToId('gallery'), t('navGallery'), <><rect x="3" y="4" width="18" height="16" rx="2.5" /><circle cx="8.5" cy="9.5" r="1.5" /><path d="M21 16l-5.2-5.2a2 2 0 00-2.8 0L4 19" /></>, 'gallery')}
        {iconBtn(() => scrollToId('rsvp'), t('rsvp'), <><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01z" /></>, 'rsvp')}
        {hasContact && iconBtn(() => scrollToId('contact'), t('navContact'), <><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M3.5 6.5L12 13l8.5-6.5" /></>, 'contact')}
        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: dark, opacity: 0.8, textDecoration: 'none', padding: '2px 4px' }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s7-7.5 7-12.5A7 7 0 105 9.5C5 14.5 12 22 12 22z" /><circle cx="12" cy="9.5" r="2.5" />
            </svg>
            <span style={{ fontSize: 8 }}>{t('location')}</span>
          </a>
        )}

        <button onClick={toggleMusic} aria-label={playing ? 'Pause music' : 'Play music'} style={{
          position: 'absolute', right: 4, top: -16,
          width: 46, height: 46, borderRadius: '50%', border: '3px solid #fff',
          background: `linear-gradient(135deg,${primary},${GOLD})`, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          boxShadow: '0 6px 16px rgba(61,39,18,0.35)',
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

// ══════════════════════════════════════════════════════════════════
// Main component
// ══════════════════════════════════════════════════════════════════
export default function GoldenPoruwaTemplate({ couple }: { couple: Couple }) {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#5c1f2e" }} />}>
      <GoldenPoruwaInner couple={couple} />
    </Suspense>
  )
}

function GoldenPoruwaInner({ couple }: { couple: Couple }) {
  const searchParams = useSearchParams()
  const guestName = searchParams.get('name') || ''
  const introEnabled = (couple as any).show_guest_intro !== false
  const [showIntro, setShowIntro] = useState(!!guestName && introEnabled)
  const [opened, setOpened] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [lang, setLang] = useState<Lang>('en')
  const t = (key: string) => TXT[lang][key] || TXT.en[key] || key

  const PRIMARY = couple.custom_colors?.primary || DEFAULT_PALETTE.primary
  const PRIMARY_LIGHT = couple.custom_colors?.primaryLight || DEFAULT_PALETTE.primaryLight
  const DARK = couple.custom_colors?.dark || DEFAULT_PALETTE.dark
  const CREAM = couple.custom_colors?.cream || DEFAULT_PALETTE.cream
  const MUTED = DEFAULT_PALETTE.muted

  // The cinematic hero video is the template's signature moment — it
  // plays muted on the cover from the moment the page loads (muted
  // autoplay needs no user gesture), and keeps playing behind the
  // rest of the invitation once opened. "Explicit video wins, else
  // fall back only when no custom photo" — same rule as the sibling
  // video-hero templates in this codebase.
  const hasCustomPhoto = !!couple.couple_photo
  const explicitCoverVideo = (couple as any).cover_video_url || ''
  const coverVideoUrl = explicitCoverVideo || (hasCustomPhoto ? '' : DEFAULT_COVER_VIDEO)
  const songUrl = couple.song_url || DEFAULT_SONG_URL

  // Hero photo/video fallback state — mirrors the fix applied to
  // sibling templates: if neither the couple's own media nor the
  // bundled default loads, fall back to a decorative gradient instead
  // of leaving a flat, empty block.
  const [heroPhotoOk, setHeroPhotoOk] = useState(true)
  const [heroVideoOk, setHeroVideoOk] = useState(true)

  useEffect(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; audioRef.current = null }
    const audio = new Audio(songUrl)
    audio.loop = true; audio.volume = 0.6; audioRef.current = audio
    return () => { audio.pause(); audio.src = "" }
  }, [songUrl])

  const handleOpen = () => {
    setOpened(true)
    audioRef.current?.play().catch(() => {})
  }

  const EVENT_META: Record<'engagement' | 'wedding' | 'homecoming', { label: string; icon: string }> = {
    engagement: { label: t('eventEngagement'), icon: '💍' },
    wedding: { label: t('eventWedding'), icon: '🌸' },
    homecoming: { label: t('eventHomecoming'), icon: '🏡' },
  }
  type RenderableEvent = { key: 'engagement' | 'wedding' | 'homecoming'; label: string; icon: string; enabled: boolean; venue: string; venue_address: string; date: string; maps_url: string }
  const hasNewEvents = couple.events && Object.keys(couple.events).length > 0
  const eventKeyOrder: ('engagement' | 'wedding' | 'homecoming')[] =
    Array.isArray((couple as any).events_order) && (couple as any).events_order.length === 3
      ? (couple as any).events_order
      : ['engagement', 'wedding', 'homecoming']
  const eventsList: RenderableEvent[] = hasNewEvents
    ? eventKeyOrder.map((key): RenderableEvent => {
        const e = couple.events![key]
        const customLabel = (e as any)?.label
        return { key, ...EVENT_META[key], label: (customLabel && customLabel.trim()) || EVENT_META[key].label, enabled: e?.enabled ?? false, venue: e?.venue ?? '', venue_address: e?.venue_address ?? '', date: e?.date ?? '', maps_url: e?.maps_url ?? '' }
      }).filter(e => e.enabled && e.date.length > 0)
    : (couple.wedding_date ? [{ key: 'wedding', ...EVENT_META.wedding, enabled: true, venue: couple.venue || '', venue_address: couple.venue_address || '', date: couple.wedding_date, maps_url: couple.maps_url || '' }] : [])

  const sv = {
    gallery: couple.section_visibility?.gallery ?? true,
    countdown: couple.section_visibility?.countdown ?? true,
    timeline: couple.section_visibility?.timeline ?? true,
    seat_finder: couple.section_visibility?.seat_finder ?? true,
    music: couple.section_visibility?.music ?? true,
    thank_you: couple.section_visibility?.thank_you ?? true,
  }

  const W = {
    bride: couple.bride, groom: couple.groom,
    brideFamilyName: couple.bride_family || '', groomFamilyName: couple.groom_family || '',
    date: couple.wedding_date,
    couplePhoto: couple.couple_photo || DEFAULT_PHOTO,
    introText: (couple as any).intro_text || t('defaultIntroText'),
    song: couple.song_title || DEFAULT_SONG_TITLE, artist: couple.song_artist || DEFAULT_SONG_ARTIST,
    timeline: couple.timeline || [], seats: couple.seats || {}, gallery: couple.gallery || [],
  }

  const flexContacts: { name: string; phone: string }[] = Array.isArray((couple as any).contacts) ? (couple as any).contacts.filter((c: any) => c?.phone).map((c: any) => ({ name: c.name || '', phone: c.phone })) : []
  const contactList: { name: string; phone: string }[] = flexContacts.length > 0
    ? flexContacts
    : [
        ...(couple.groom && (couple as any).groom_phone ? [{ name: couple.groom, phone: (couple as any).groom_phone }] : []),
        ...(couple.bride && (couple as any).bride_phone ? [{ name: couple.bride, phone: (couple as any).bride_phone }] : []),
      ]

  const monogram = `${(W.bride || 'A')[0]}${(W.groom || 'B')[0]}`.toUpperCase()

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", minHeight: "100vh", background: CREAM }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Great+Vibes&family=Inter:wght@300;400;500;600&display=swap');
        @keyframes spin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
        input::placeholder, textarea::placeholder { color: #c9ac96; }
      `}</style>

      <LangToggle lang={lang} setLang={setLang} />

      <AnimatePresence>
        {showIntro && guestName && (
          <GuestIntroScreen guestName={guestName} onDone={() => setShowIntro(false)} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} cream={CREAM} />
        )}
      </AnimatePresence>

      <div style={{ maxWidth: 480, margin: "0 auto", background: CREAM, boxShadow: "0 0 80px rgba(61,39,18,0.12)", position: "relative" }}>

        {/* ══ COVER — cinematic golden poruwa hero video, plays from load ══ */}
        <AnimatePresence>
          {!opened && (
            <motion.div key="cover" exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.6 }}
              style={{
                minHeight: "100vh", display: "flex", flexDirection: "column",
                position: "relative", overflow: "hidden", background: MAROON,
              }}>

              {/* Cinematic hero video — fills the whole screen, exactly like the
                  reference: the poruwa arch, couple and dancers ARE the frame,
                  so no extra decorative borders are layered on top of it. */}
              {coverVideoUrl && heroVideoOk ? (
                <video autoPlay loop muted playsInline preload="auto" poster={W.couplePhoto}
                  onError={() => setHeroVideoOk(false)}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}>
                  <source src={coverVideoUrl} type="video/mp4" />
                </video>
              ) : heroPhotoOk ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={W.couplePhoto} alt={`${W.bride} and ${W.groom}`}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }}
                  onError={e => {
                    const img = e.currentTarget as HTMLImageElement
                    if (img.src.endsWith(DEFAULT_PHOTO)) { setHeroPhotoOk(false); return }
                    img.src = DEFAULT_PHOTO
                  }} />
              ) : (
                <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 90% 70% at 50% 30%, ${PRIMARY} 0%, ${MAROON} 75%)` }} />
              )}

              {/* Gentle top+bottom darkening only — just enough for the text
                  and button to read clearly, without flattening the video. */}
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(20,7,10,0.5) 0%, rgba(20,7,10,0.05) 22%, rgba(20,7,10,0.05) 70%, rgba(20,7,10,0.6) 100%)` }} />
              <FloatingPetals count={8} color={GOLD_LIGHT} />

              {/* Text sits near the top, under the poruwa arch — matching the
                  reference's layout — with the button pinned to the bottom. */}
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                style={{ textAlign: "center", width: "90%", maxWidth: 360, position: "relative", zIndex: 10, padding: "3rem 1rem 0", margin: "0 auto" }}
              >
                <div style={{ fontSize: 15, letterSpacing: "0.08em", color: "#fff", marginBottom: "0.5rem", fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>
                  {t('weddingInvitation')}
                </div>

                {guestName && (
                  <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD_LIGHT, marginBottom: "0.4rem", fontWeight: 700 }}>{t('dear')} {guestName}</div>
                )}

                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, fontSize: "clamp(1.5rem,6vw,2.1rem)", color: GOLD_LIGHT, lineHeight: 1.3, textShadow: "0 2px 14px rgba(0,0,0,0.5)" }}>
                  {W.bride} <span style={{ color: "#fff", fontWeight: 400 }}>&amp;</span> {W.groom}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.8 }}
                style={{ position: "relative", zIndex: 10, marginTop: "auto", textAlign: "center", padding: "0 1.5rem 2.6rem" }}
              >
                <button onClick={handleOpen} style={{
                  width: "100%", maxWidth: 300,
                  background: "rgba(255,251,244,0.92)", color: MAROON,
                  border: "none", borderRadius: 14, padding: "15px 24px",
                  fontSize: 12.5, letterSpacing: "0.1em",
                  cursor: "pointer", fontFamily: "'Inter',sans-serif", fontWeight: 700,
                  boxShadow: "0 10px 26px rgba(0,0,0,0.35)",
                }}>
                  {t('openInvitation')}
                </button>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.8)", marginTop: 10 }}>🎵 {t('tapToBegin')}</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ INVITATION ══ */}
        {opened && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>

            {/* Names + Family — a plain blush section (no white card), a
                gold mandala peeking from the top and a lotus branch
                closing the bottom, exactly the layout the reference
                video cuts to right after the cover video is tapped
                open — no second video repeat, no button row here. */}
            <div style={{ position: "relative", padding: "0 1.5rem", overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "center", marginTop: -36, marginBottom: -18 }}>
                <MandalaMedallion size={190} color={PRIMARY} />
              </div>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }}
                style={{ textAlign: "center", paddingTop: 8 }}>
                {guestName && (
                  <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: `${PRIMARY}cc`, marginBottom: 10, fontWeight: 700 }}>{t('dear')} {guestName}</div>
                )}
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, fontSize: "2.1rem", color: PRIMARY, lineHeight: 1.35 }}>
                  {W.bride}
                  <div style={{ fontSize: "1rem", color: DARK, opacity: 0.6, fontStyle: "italic", margin: "2px 0" }}>{(couple as any).together_with_text || t('togetherWith')}</div>
                  {W.groom}
                </div>
                <div style={{ color: DARK, opacity: 0.8, lineHeight: 1.85, fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "0.95rem", marginTop: 18, maxWidth: 320, marginLeft: "auto", marginRight: "auto" }}>
                  {W.introText}
                </div>
              </motion.div>

              {(W.brideFamilyName || W.groomFamilyName) && (
                <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  style={{ textAlign: "center", marginTop: 30 }}>
                  <div style={eyebrow(`${PRIMARY}aa`)}>💐 {t('ourFamilies')}</div>
                  <div style={{ fontSize: 14, color: DARK, lineHeight: 2 }}>
                    {W.groomFamilyName && <div style={{ fontWeight: 700 }}>{W.groomFamilyName}</div>}
                    {W.groomFamilyName && W.brideFamilyName && (
                      <div style={{ fontSize: 11, color: MUTED, margin: "2px 0" }}>{t('togetherWith')}</div>
                    )}
                    {W.brideFamilyName && <div style={{ fontWeight: 700 }}>{W.brideFamilyName}</div>}
                    {(() => {
                      const txt = (couple as any).family_invitation_text
                      const trimmed = (txt || '').trim()
                      if (!trimmed) return null
                      const lines = trimmed.split('\n')
                      return <div style={{ color: MUTED, marginTop: 8, fontSize: 12.5 }}>{lines.map((l: string, i: number) => <span key={i}>{l}{i < lines.length - 1 && <br />}</span>)}</div>
                    })()}
                  </div>
                </motion.div>
              )}

              <div style={{ marginTop: 22, marginLeft: -24, marginRight: -24 }}>
                <LotusBranchDivider color={PRIMARY} />
              </div>
            </div>

            {/* Events */}
            {eventsList.map(ev => {
              const evDate = new Date(ev.date)
              const evDateDisplay = evDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
              const evTimeDisplay = evDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) + ' ' + t('onwards')
              return (
                <motion.div key={ev.key} style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <div style={eyebrow(`${PRIMARY}aa`)}>{ev.icon} {t('saveTheDate')}</div>
                  <div style={heading(DARK)}>{ev.label}</div>
                  {[
                    { icon: "📅", label: t('dateLabel'), val: evDateDisplay },
                    { icon: "⏰", label: t('timeLabel'), val: evTimeDisplay },
                    { icon: "📍", label: t('venueLabel'), val: ev.venue || couple.venue || "", sub: ev.venue_address || couple.venue_address || "" },
                  ].map(d => (
                    <div key={d.label} style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "12px 0", borderBottom: `1px solid ${PRIMARY_LIGHT}66` }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${PRIMARY_LIGHT}55`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>{d.icon}</div>
                      <div>
                        <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: `${PRIMARY}88` }}>{d.label}</div>
                        <div style={{ fontSize: 15, color: DARK, fontWeight: 700, marginTop: 2 }}>{d.val}</div>
                        {d.sub && <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{d.sub}</div>}
                      </div>
                    </div>
                  ))}
                  {ev.maps_url && (
                    <a href={normalizeMapsUrl(ev.maps_url)} target="_blank" rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: `${PRIMARY_LIGHT}55`, borderRadius: 100, padding: "10px 20px", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: PRIMARY, marginTop: 16, textDecoration: "none", fontWeight: 600 }}>
                      📍 {t('viewLocationMaps')}
                    </a>
                  )}
                </motion.div>
              )
            })}

            {/* Countdown */}
            {sv.countdown && (
              <motion.div id="savethedate" style={{ ...cardStyle(), textAlign: "center" }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={eyebrow(`${PRIMARY}aa`)}>{t('countingDown')}</div>
                <Countdown targetDate={W.date} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} t={t} />
              </motion.div>
            )}

            {/* RSVP */}
            <div id="rsvp">
              <RSVP coupleId={couple.id} askDrinking={couple.ask_drinking} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} cream={CREAM} muted={MUTED} guestName={guestName} t={t} />
            </div>

            {/* Timeline */}
            {sv.timeline && W.timeline.length > 0 && (
              <motion.div style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={eyebrow(`${PRIMARY}aa`)}>{t('ourCelebration')}</div>
                <div style={heading(DARK)}>{t('eventTimeline')}</div>
                <div style={{ position: "relative", paddingLeft: 20 }}>
                  <div style={{ position: "absolute", left: 6, top: 0, bottom: 0, width: 1, background: `${PRIMARY_LIGHT}aa` }} />
                  {W.timeline.map((t, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                      style={{ position: "relative", padding: "10px 0 10px 20px" }}>
                      <div style={{ position: "absolute", left: -14, top: 14, width: 10, height: 10, borderRadius: "50%", background: PRIMARY, border: "2px solid #fff", boxShadow: `0 0 0 2px ${GOLD_LIGHT}` }} />
                      <div style={{ fontSize: 11, fontWeight: 600, color: PRIMARY, letterSpacing: "0.1em" }}>{t.time}</div>
                      <div style={{ fontSize: 13, color: DARK, fontWeight: 500, marginTop: 2 }}>{t.event}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Guest Wishes Wall */}
            {((couple as any).enable_guest_wishes ?? false) && (
              <motion.div id="wishes" style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={eyebrow(`${PRIMARY}aa`)}>{t('withLove')}</div>
                <div style={heading(DARK)}>{t('wishesForUs')}</div>
                <div style={{ fontSize: 12.5, color: MUTED, textAlign: "center", marginBottom: 16, marginTop: -8 }}>
                  {t('shareWishesWith')} {W.bride} &amp; {W.groom}.
                </div>
                <WishesWall coupleId={couple.id} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} cream={CREAM} muted={MUTED} t={t} />
              </motion.div>
            )}

            {/* Seat Finder */}
            {sv.seat_finder && couple.show_seating && Object.keys(W.seats).length > 0 && (
              <motion.div style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={eyebrow(`${PRIMARY}aa`)}>{t('beOurGuest')}</div>
                <div style={heading(DARK)}>{t('findYourTable')}</div>
                <div style={{ fontSize: 13, color: MUTED, marginBottom: 4 }}>{t('searchNameTable')}</div>
                <SeatFinder seats={W.seats} primary={PRIMARY} dark={DARK} cream={CREAM} muted={MUTED} t={t} />
              </motion.div>
            )}

            {/* Music */}
            {sv.music && (
              <motion.div style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={eyebrow(`${PRIMARY}aa`)}>{t('ourSong')}</div>
                <MusicPlayerUI title={W.song} artist={W.artist} songUrl={songUrl} audioRef={audioRef} primary={PRIMARY} primaryLight={PRIMARY_LIGHT} dark={DARK} muted={MUTED} />
              </motion.div>
            )}

            {/* Gallery */}
            {sv.gallery && W.gallery.length > 0 && (
              <motion.div id="gallery" style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={eyebrow(`${PRIMARY}aa`)}>{t('ourCelebration')}</div>
                <div style={heading(DARK)}>{t('momentsOfLove')}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {W.gallery.map((src, i) => (
                    <div key={i} style={{ gridRow: i === 0 ? "span 2" : undefined, borderRadius: 16, overflow: "hidden", background: `${PRIMARY_LIGHT}55`, aspectRatio: i === 0 ? "1/2" : "1/1", boxShadow: "0 4px 16px rgba(61,39,18,0.12)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => (e.currentTarget.style.display = "none")} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Contact Numbers */}
            {contactList.length > 0 && (
              <motion.div id="contact" style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={eyebrow(`${PRIMARY}aa`)}>{t('getInTouch')}</div>
                <div style={heading(DARK)}>{t('contactNumbers')}</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {contactList.map((c, i) => <ContactRow key={i} name={c.name} phone={c.phone} primary={PRIMARY} />)}
                </div>
              </motion.div>
            )}

            {/* Wedding Note */}
            {((couple as any).show_wedding_note ?? true) && (couple as any).wedding_note_text && (couple as any).wedding_note_text.trim() && (
              <motion.div
                style={{
                  ...cardStyle(), textAlign: "center",
                  background: `linear-gradient(180deg, ${PRIMARY_LIGHT}44 0%, #fff 58%)`,
                  border: `1px solid ${GOLD}55`,
                  boxShadow: `0 12px 36px ${PRIMARY}26, 0 2px 20px rgba(61,39,18,0.06)`,
                }}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              >
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, transparent, ${PRIMARY}, ${GOLD}, ${PRIMARY}, transparent)` }} />
                <div style={{ display: "flex", justifyContent: "center", margin: "4px auto 12px" }}><GoldMedallion initials={monogram} size={44} /></div>
                <div style={eyebrow(`${PRIMARY}aa`)}>{t('aNoteForYou')}</div>
                {guestName && (
                  <div style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: PRIMARY, marginBottom: 8, fontWeight: 600 }}>
                    {t('dear')} {guestName}
                  </div>
                )}
                <div style={{ maxWidth: 340, margin: "0 auto 16px" }}>
                  {(couple as any).wedding_note_text.split('\n').map((raw: string, i: number) => {
                    const line = raw.trim()
                    if (!line) return null
                    const isEmphasis = line === line.toUpperCase() && /[A-Z]/.test(line)
                    if (isEmphasis) {
                      return (
                        <div key={i} style={{
                          display: "inline-block", margin: "10px 4px 2px", padding: "8px 16px",
                          borderRadius: 100, border: `1px solid ${PRIMARY}55`, background: `${PRIMARY_LIGHT}44`,
                          fontSize: 11, letterSpacing: "0.15em", fontWeight: 700, color: PRIMARY,
                        }}>{line}</div>
                      )
                    }
                    return (
                      <div key={i} style={{ fontSize: "0.95rem", color: DARK, opacity: 0.85, lineHeight: 1.9, fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", marginBottom: 4 }}>
                        {line}
                      </div>
                    )
                  })}
                </div>
                <div style={{ display: "flex", justifyContent: "center" }}><LotusIcon color={PRIMARY} size={30} opacity={0.9} /></div>
                <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "1.8rem", color: PRIMARY, marginTop: 14 }}>
                  {W.bride}<span style={{ margin: "0 8px" }}>&amp;</span>{W.groom}
                </div>
              </motion.div>
            )}

            {/* Thank You */}
            {sv.thank_you && (
              <motion.div style={cardStyle()} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={eyebrow(`${PRIMARY}aa`)}>{t('aSpecialNote')}</div>
                <div style={heading(DARK)}>{t('toOurLovelyGuests')}</div>
                <div style={{ textAlign: "center", fontSize: 13, color: DARK, lineHeight: 2 }}>
                  {(couple as any).thank_you_text || t('defaultThankYou')}
                </div>
                <div style={{ textAlign: "center", marginTop: 18 }}>
                  <div style={{ fontSize: 11, color: MUTED, letterSpacing: "0.1em" }}>{t('withAllOurLove')}</div>
                  <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "1.8rem", color: PRIMARY, marginTop: 4 }}>{W.bride} &amp; {W.groom}</div>
                </div>
              </motion.div>
            )}

            {/* Footer */}
            <div style={{ padding: "2rem 1.5rem 6rem", textAlign: "center", background: "#fff", borderTop: `1px solid ${PRIMARY_LIGHT}88`, borderRadius: "22px 22px 0 0" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                <LotusIcon color={PRIMARY} size={40} opacity={0.55} />
              </div>
              <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "1.5rem", color: PRIMARY, marginBottom: 4 }}>InviteGlow</div>
              <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: MUTED }}>{t('footerTag')}</div>
              {((couple as any).enable_footer_social ?? true) && <FooterSocial color={PRIMARY} background={`${PRIMARY}14`} />}
            </div>

          </motion.div>
        )}
      </div>
      {opened && (
        <BottomNavBar
          primary={PRIMARY} dark={DARK}
          mapsUrl={couple.maps_url || ''}
          hasWishes={(couple as any).enable_guest_wishes ?? false}
          hasGallery={sv.gallery && W.gallery.length > 0}
          hasContact={contactList.length > 0}
          audioRef={audioRef}
          t={t}
        />
      )}
    </div>
  )
}
