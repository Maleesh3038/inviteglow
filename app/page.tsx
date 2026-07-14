"use client"
import { useState, useEffect, useRef } from 'react'
import { supabase, Review } from '@/lib/supabase'

const ACCENT = "#c4607a"
const ACCENT_LIGHT = "#e8a0b8"

const TEMPLATES = [
  { id: 'floral-romance', name: 'Floral Romance', tag: 'Most Popular', photo: '/images/hero-floral.png', demoSlug: 'kavindi-malina', color: '#c4607a' },
  { id: 'blush-blossom', name: 'Blush Blossom', tag: 'New', photo: '/images/blush-blossom-cover-bg.png', demoSlug: '', color: '#c17d8a' },
  { id: 'elegant-photo', name: 'Elegant Photo Hero', tag: 'Classic', photo: '/images/hero-elegant.jpg', demoSlug: 'sheneli-kevin', color: '#c9a06e' },
  { id: 'cinematic-gold', name: 'Cinematic Gold', tag: 'Premium', photo: '/images/hero-cinematic.png', demoSlug: 'imesha-pasan', color: '#c9a96e' },
  { id: 'sacred-poruwa', name: 'Sacred Poruwa', tag: 'Kandyan Sunset', photo: '/images/hero-sacred-poruwa.png', demoSlug: 'sandunika-geeth', color: '#c4956a' },
  { id: 'kandyan-heritage', name: 'Kandyan Heritage', tag: 'Sri Lankan', photo: '/images/hero-kandyan.png', demoSlug: 'irudaka-sachini', color: '#d4923f' },
  { id: 'traditional-ceylon', name: 'Traditional Ceylon', tag: 'Kandyan Culture', photo: '/images/hero-traditional-ceylon.png', demoSlug: 'maheshi-dilip', color: '#2f4a35' },
  { id: 'golden-garden', name: 'Golden Garden', tag: 'Floral Arch', photo: '/images/hero-golden-garden.png', demoSlug: 'sanjeewani-lalith', color: '#d4a857' },
  { id: 'ocean-pearl', name: 'Ocean Pearl', tag: 'Beach Elegance', photo: '/images/hero-ocean-pearl.png', demoSlug: 'akila-nethmi', color: '#2f7d9e' },
  { id: 'sunset-shores', name: 'Sunset Shores', tag: 'Bali Sunset', photo: '/images/hero-sunset-shores.png', demoSlug: 'manisha-sachin', color: '#e0795a' },
  { id: 'twilight-picnic', name: 'Twilight Picnic', tag: 'After-Party', photo: '', demoSlug: '', color: '#f0a868' },
]

// Fallback defaults — used only if the pricing_plans table is empty or
// hasn't been seeded yet. Once admin edits pricing, the DB values take over.
const DEFAULT_PLANS = [
  { id: 'starter', name: 'Starter', price: 3000, tag: '', features: ['1 template of your choice', 'RSVP tracking & guest list', 'Couple dashboard', 'Countdown timer', 'Up to 100 guests'], color: '#94a3b8', display_order: 0 },
  { id: 'premium', name: 'Premium', price: 5000, tag: 'Most Popular', features: ['Everything in Starter', 'Guest personalised links ("Dear [Name]")', 'Photo gallery + background music', 'Link valid for 1 year', 'Unlimited guests'], color: ACCENT, display_order: 1 },
  { id: 'luxury', name: 'Luxury', price: 8000, tag: '', features: ['Everything in Premium', 'Lifetime link — never expires', 'Guest Wishes & Messages wall', 'Full custom design & colors', 'Priority support'], color: '#8a6a2a', display_order: 2 },
]

// ── Clean line-style SVG icons — no emoji on the homepage ──
type IconName = 'check' | 'star' | 'arrow' | 'template' | 'users' | 'chair' | 'music' | 'external' | 'whatsapp' | 'menu' | 'x' | 'heart' | 'facebook' | 'tiktok' | 'mail' | 'sparkles' | 'shield' | 'clock' | 'palette'
function Icon({ name, size = 16, color = 'currentColor', strokeWidth = 1.8 }: { name: IconName; size?: number; color?: string; strokeWidth?: number }) {
  const c = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (name) {
    case 'check': return <svg {...c}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
    case 'star': return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 2.5l3 6.3 6.7.9-4.9 4.7 1.2 6.9-6-3.2-6 3.2 1.2-6.9-4.9-4.7 6.7-.9z" /></svg>
    case 'arrow': return <svg {...c}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
    case 'template': return <svg {...c}><rect x="3.5" y="3.5" width="17" height="17" rx="2.5" /><path d="M3.5 9h17" /><path d="M9 9v11.5" /></svg>
    case 'users': return <svg {...c}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0111 0" /><path d="M15.5 8.2a3 3 0 010 5.8" /><path d="M15 20a5 5 0 016.5-4.8" /></svg>
    case 'chair': return <svg {...c}><path d="M6 4v9a2 2 0 002 2h8a2 2 0 002-2V4" /><path d="M6 15v5M18 15v5M8 4h8" /></svg>
    case 'music': return <svg {...c}><path d="M9.5 18V5.3l11-2v12.7" /><circle cx="6.5" cy="18" r="2.8" /><circle cx="17.5" cy="16" r="2.8" /></svg>
    case 'external': return <svg {...c}><path d="M9 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-3" /><path d="M14 4h6v6" /><path d="M20 4L10 14" /></svg>
    case 'whatsapp': return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.36.101 11.943c0 2.105.549 4.16 1.595 5.97L0 24l6.335-1.652a11.882 11.882 0 005.71 1.447h.005c6.582 0 11.94-5.363 11.943-11.946 0-3.19-1.24-6.19-3.473-8.4" /></svg>
    case 'menu': return <svg {...c}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
    case 'x': return <svg {...c}><path d="M6 6l12 12M18 6L6 18" /></svg>
    case 'heart': return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 20.5s-7-4.4-9.4-8.8C.8 8.1 2.4 4.5 6 4.5c2 0 3.4 1.2 4.2 2.3.8-1.1 2.2-2.3 4.2-2.3 3.6 0 5.2 3.6 3.4 7.2C19 16.1 12 20.5 12 20.5z" /></svg>
    case 'facebook': return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.91h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94z" /></svg>
    case 'tiktok': return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M16.6 5.82c-1.03-.9-1.65-2.16-1.72-3.57h-3.15v13.4c0 1.53-1.24 2.77-2.77 2.77a2.77 2.77 0 01-2.77-2.77 2.77 2.77 0 012.77-2.77c.28 0 .55.04.8.12V9.6a6.09 6.09 0 00-.8-.05c-3.32 0-6 2.68-6 6s2.68 6 6 6 6-2.68 6-6V9.4a9.14 9.14 0 005.36 1.72V8a5.5 5.5 0 01-3.72-2.18z" /></svg>
    case 'mail': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
    case 'sparkles': return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" /></svg>
    case 'shield': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>
    case 'clock': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>
    case 'palette': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a9 9 0 100 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.2 0-.8.7-1.5 1.5-1.5H16a4 4 0 004-4c0-4.4-3.6-8-8-8z" /><circle cx="7.5" cy="10.5" r="1" fill={color} /><circle cx="12" cy="7.5" r="1" fill={color} /><circle cx="16.5" cy="10.5" r="1" fill={color} /></svg>
    default: return null
  }
}

function Blossom({ size = 14, color }: { size?: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <g fill={color}>
        <ellipse cx="12" cy="6" rx="3.2" ry="4.6" />
        <ellipse cx="12" cy="18" rx="3.2" ry="4.6" />
        <ellipse cx="6" cy="12" rx="4.6" ry="3.2" />
        <ellipse cx="18" cy="12" rx="4.6" ry="3.2" />
      </g>
      <circle cx="12" cy="12" r="2.4" fill="#fff" opacity={0.8} />
    </svg>
  )
}

// Gentle falling petals across the whole site — pure CSS keyframes (not
// React state/JS animation loops), so this costs nothing on re-render.
function FallingPetals() {
  const petals = [
    { left: '4%', size: 13, delay: 0, dur: 13 },
    { left: '16%', size: 9, delay: 3.2, dur: 16 },
    { left: '30%', size: 15, delay: 6.5, dur: 12 },
    { left: '46%', size: 10, delay: 1.5, dur: 15 },
    { left: '60%', size: 14, delay: 5, dur: 14 },
    { left: '74%', size: 9, delay: 2.2, dur: 17 },
    { left: '86%', size: 13, delay: 8, dur: 13 },
    { left: '94%', size: 10, delay: 4.5, dur: 15 },
  ]
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 40, overflow: 'hidden' }}>
      {petals.map((p, i) => (
        <span key={i} className="hp-petal" style={{ left: p.left, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s` }}>
          <Blossom size={p.size} color={ACCENT_LIGHT} />
        </span>
      ))}
    </div>
  )
}

function StarRating({ value, onChange, size = 22 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button" onClick={() => onChange?.(i)}
          style={{ background: 'transparent', border: 'none', cursor: onChange ? 'pointer' : 'default', padding: 0 }}>
          <Icon name="star" size={size} color={i <= value ? '#f59e0b' : '#e2e8f0'} />
        </button>
      ))}
    </div>
  )
}

// ── Review submission form ──
function ReviewForm() {
  const [name, setName] = useState('')
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async () => {
    if (!name.trim() || !rating || !text.trim()) return
    setSubmitting(true)
    const { error } = await supabase.from('reviews').insert([{
      name: name.trim(), rating, review_text: text.trim(), status: 'pending',
    }])
    setSubmitting(false)
    if (!error) setDone(true)
  }

  if (done) {
    return (
      <div style={{ background: '#fff', borderRadius: 20, padding: 32, textAlign: 'center', boxShadow: '0 4px 24px rgba(15,23,42,0.06)' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <Icon name="check" size={22} color="#16a34a" />
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Thank you!</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>Your review has been submitted and will appear once approved.</div>
      </div>
    )
  }

  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 4px 24px rgba(15,23,42,0.06)' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Share Your Experience</div>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 18 }}>Loved your invitation? Let other couples know.</div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block' }}>Your Name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Amara & Roshan"
          style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box' }} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block' }}>Your Rating</label>
        <StarRating value={rating} onChange={setRating} />
      </div>
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block' }}>Your Review</label>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Tell us about your experience..."
          style={{ width: '100%', minHeight: 90, padding: '11px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', fontFamily: "'Inter',sans-serif", resize: 'vertical', boxSizing: 'border-box' }} />
      </div>
      <button onClick={submit} disabled={submitting || !name.trim() || !rating || !text.trim()} style={{
        width: '100%', padding: 13, borderRadius: 10, border: 'none', cursor: 'pointer',
        background: `linear-gradient(135deg,${ACCENT},${ACCENT_LIGHT})`, color: '#fff', fontWeight: 600, fontSize: 14,
        opacity: (submitting || !name.trim() || !rating || !text.trim()) ? 0.5 : 1,
      }}>
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </div>
  )
}

function TemplateCardImage({ photo, name, color }: { photo: string; name: string; color: string }) {
  const [failed, setFailed] = useState(false)
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: `linear-gradient(135deg,${color}33,${color}77)` }}>
      {(!photo || failed) && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="template" size={32} color={color} />
        </div>
      )}
      {photo && !failed && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={photo} alt={name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setFailed(true)} />
      )}
    </div>
  )
}

export default function HomePage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [plans, setPlans] = useState(DEFAULT_PLANS)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('reviews').select('*').eq('status', 'approved').order('created_at', { ascending: false }).limit(9)
      if (data) setReviews(data as Review[])

      // Pricing is admin-editable — pull from the DB, but keep the
      // hardcoded defaults above as a safe fallback if the table is
      // empty or the fetch fails for any reason.
      const { data: planData, error: planError } = await supabase.from('pricing_plans').select('*').order('display_order', { ascending: true })
      if (!planError && planData && planData.length > 0) {
        setPlans(planData.map((p: any) => ({
          id: p.id, name: p.name, price: p.price, tag: p.tag || '',
          features: Array.isArray(p.features) ? p.features : [],
          color: p.color || ACCENT, display_order: p.display_order ?? 0,
        })))
      }
    }
    load()
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id: string) => {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '5.0'

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: '#fff', color: '#1e293b', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Inter:wght@300;400;500;600;700;800&display=swap');
        html { scroll-behavior: smooth; }
        @media (max-width: 680px) { .nav-links { display: none; } }
        .hp-petal {
          position: absolute; top: -20px; opacity: 0; display: block;
          animation-name: hp-fall; animation-timing-function: linear; animation-iteration-count: infinite;
        }
        @keyframes hp-fall {
          0% { transform: translateY(-20px) translateX(0) rotate(0deg); opacity: 0; }
          8% { opacity: 0.6; }
          92% { opacity: 0.5; }
          100% { transform: translateY(110vh) translateX(34px) rotate(260deg); opacity: 0; }
        }
      `}</style>

      <FallingPetals />

      {/* ── NAV ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: scrolled ? 'rgba(255,255,255,0.9)' : 'transparent', backdropFilter: scrolled ? 'blur(10px)' : 'none', borderBottom: scrolled ? '1px solid #e2e8f0' : '1px solid transparent', transition: 'all 0.2s' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: '1.8rem', color: ACCENT }}>InviteGlow</div>
          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <button onClick={() => scrollTo('templates')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 500, color: '#475569' }}>Templates</button>
            <button onClick={() => scrollTo('why-us')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 500, color: '#475569' }}>Why Us</button>
            <button onClick={() => scrollTo('pricing')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 500, color: '#475569' }}>Pricing</button>
            <button onClick={() => scrollTo('reviews')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 500, color: '#475569' }}>Reviews</button>
            <button onClick={() => scrollTo('contact')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 500, color: '#475569' }}>Contact</button>
            <a href="https://wa.me/?text=Hi!%20I%27d%20like%20to%20create%20a%20wedding%20invitation" target="_blank" rel="noopener noreferrer" style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 100,
              background: `linear-gradient(135deg,${ACCENT},${ACCENT_LIGHT})`, color: '#fff', textDecoration: 'none', fontSize: 13.5, fontWeight: 600,
            }}>Get Started</a>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer' }} className="nav-links-mobile-toggle">
            <Icon name={menuOpen ? 'x' : 'menu'} size={22} color="#1e293b" />
          </button>
        </div>
      </div>

      {/* ── HERO ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px 40px', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 40, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 100, background: '#fdf2f8', border: `1px solid ${ACCENT_LIGHT}`, fontSize: 12, fontWeight: 600, color: ACCENT, marginBottom: 20 }}>
            <Icon name="heart" size={12} color={ACCENT} /> Digital Wedding Invitations, Made Beautiful
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: 'clamp(2.2rem,5vw,3.4rem)', fontWeight: 700, color: '#0f172a', lineHeight: 1.15, marginBottom: 20 }}>
            Your Love Story,<br />Beautifully Told <span style={{ color: ACCENT }}>Online</span>
          </h1>
          <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, marginBottom: 30, maxWidth: 480 }}>
            Create a stunning digital wedding invitation in minutes. Choose from {TEMPLATES.length} elegant templates, track RSVPs in real time, and share a link your guests will love.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => scrollTo('templates')} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 100, border: 'none', cursor: 'pointer',
              background: `linear-gradient(135deg,${ACCENT},${ACCENT_LIGHT})`, color: '#fff', fontSize: 14, fontWeight: 700,
              boxShadow: `0 8px 24px ${ACCENT}44`,
            }}>
              Browse Templates <Icon name="arrow" size={15} color="#fff" />
            </button>
            <button onClick={() => scrollTo('pricing')} style={{
              padding: '14px 28px', borderRadius: 100, border: '1.5px solid #e2e8f0', cursor: 'pointer',
              background: '#fff', color: '#1e293b', fontSize: 14, fontWeight: 600,
            }}>
              See Pricing
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <StarRating value={5} size={16} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{avgRating}</span>
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>{reviews.length > 0 ? `${reviews.length}+ happy couples` : 'Loved by couples across Sri Lanka'}</div>
          </div>
        </div>

        {/* Hero collage */}
        <div style={{ position: 'relative', height: 420 }}>
          {TEMPLATES.filter(t => t.photo).slice(0, 3).map((t, i) => (
            <div key={t.id} style={{
              position: 'absolute', width: 200, borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 50px rgba(15,23,42,0.18)',
              top: i === 0 ? 0 : i === 1 ? 60 : 140, left: i === 0 ? '10%' : i === 1 ? '46%' : '4%',
              zIndex: i === 1 ? 2 : 1, transform: `rotate(${i === 0 ? -6 : i === 1 ? 4 : -3}deg)`,
              border: '6px solid #fff',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.photo} alt={t.name} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }} onError={e => (e.currentTarget.parentElement!.style.display = 'none')} />
            </div>
          ))}
        </div>
      </div>

      {/* ── TEMPLATES ── */}
      <div id="templates" style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: ACCENT, fontWeight: 700, marginBottom: 8 }}>Choose Your Style</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '2rem', color: '#0f172a', marginBottom: 10 }}>{TEMPLATES.length} Beautiful Templates</h2>
          <p style={{ fontSize: 14, color: '#64748b', maxWidth: 480, margin: '0 auto' }}>Every template is fully customisable — your colors, your photos, your story.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 20 }}>
          {TEMPLATES.map(t => (
            <div key={t.id} style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(15,23,42,0.06)', border: '1px solid #f1f5f9' }}>
              <div style={{ height: 200, position: 'relative' }}>
                <TemplateCardImage photo={t.photo} name={t.name} color={t.color} />
                <div style={{ position: 'absolute', top: 10, right: 10, background: t.color, color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 100, zIndex: 2 }}>{t.tag}</div>
              </div>
              <div style={{ padding: '16px 18px' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>{t.name}</div>
                {t.demoSlug ? (
                  <a href={`/invite/${t.demoSlug}`} target="_blank" rel="noopener noreferrer" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 10,
                    border: `1.5px solid ${t.color}`, color: t.color, textDecoration: 'none', fontSize: 12.5, fontWeight: 700,
                  }}>
                    View Demo <Icon name="external" size={12} color={t.color} />
                  </a>
                ) : (
                  <div style={{ padding: '10px', borderRadius: 10, background: '#f8fafc', textAlign: 'center', fontSize: 12.5, color: '#94a3b8' }}>Demo coming soon</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES STRIP ── */}
      <div style={{ background: '#fdf2f8', padding: '50px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 24 }}>
          {[
            { icon: 'users' as const, title: 'Real-Time RSVPs', desc: 'Track who\'s coming, guest counts, and preferences — all in one dashboard.' },
            { icon: 'chair' as const, title: 'Seat Finder', desc: 'Guests can search their name to instantly find their assigned table.' },
            { icon: 'music' as const, title: 'Background Music', desc: 'Add your favourite song to play the moment guests open your invite.' },
          ].map(f => (
            <div key={f.title} style={{ textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 4px 16px rgba(196,96,122,0.15)' }}>
                <Icon name={f.icon} size={22} color={ACCENT} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── WHY CHOOSE US ── */}
      <div id="why-us" style={{ maxWidth: 1100, margin: '0 auto', padding: '70px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: ACCENT, fontWeight: 700, marginBottom: 8 }}>Why InviteGlow</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '2rem', color: '#0f172a', marginBottom: 10 }}>What Sets Us Apart</h2>
          <p style={{ fontSize: 14, color: '#64748b', maxWidth: 500, margin: '0 auto' }}>We're not just another template site — here's what makes InviteGlow different.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 20 }}>
          {[
            { icon: 'users' as const, title: 'Live RSVP Dashboard', desc: 'See who\'s attending in real time, with guest counts, seating, and preferences — no spreadsheets needed.' },
            { icon: 'clock' as const, title: 'Fast Turnaround', desc: 'Most invitations are ready within 24–48 hours, so you\'re never rushing before the big day.' },
            { icon: 'sparkles' as const, title: 'Sri Lankan-Made Designs', desc: 'Templates built with local weddings in mind — Poruwa ceremonies, homecomings, and Kandyan traditions included.' },
            { icon: 'shield' as const, title: 'Affordable, No Hidden Fees', desc: 'Transparent pricing from LKR 3,000 — what you see is what you pay, with real support included.' },
            { icon: 'whatsapp' as const, title: 'Real Human Support', desc: 'Message us directly on WhatsApp anytime — no ticket systems, no bots, just a real conversation.' },
          ].map(f => (
            <div key={f.title} style={{ background: '#fff', borderRadius: 18, padding: 24, boxShadow: '0 4px 20px rgba(15,23,42,0.05)', border: '1px solid #f1f5f9' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fdf2f8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Icon name={f.icon} size={20} color={ACCENT} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PRICING ── */}
      <div id="pricing" style={{ maxWidth: 1100, margin: '0 auto', padding: '70px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: ACCENT, fontWeight: 700, marginBottom: 8 }}>Simple Pricing</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '2rem', color: '#0f172a' }}>Choose Your Package</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20 }}>
          {plans.map(p => (
            <div key={p.id} style={{
              background: '#fff', borderRadius: 24, padding: 28, position: 'relative',
              border: p.tag ? `2px solid ${ACCENT}` : '1px solid #f1f5f9',
              boxShadow: p.tag ? `0 12px 40px ${ACCENT}22` : '0 4px 20px rgba(15,23,42,0.05)',
              transform: p.tag ? 'scale(1.03)' : 'none',
            }}>
              {p.tag && (
                <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(135deg,${ACCENT},${ACCENT_LIGHT})`, color: '#fff', fontSize: 11, fontWeight: 700, padding: '5px 16px', borderRadius: 100 }}>{p.tag}</div>
              )}
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{p.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 22 }}>
                <span style={{ fontSize: 30, fontWeight: 800, color: p.color }}>LKR {p.price.toLocaleString()}</span>
              </div>
              <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
                {p.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <Icon name="check" size={15} color={p.color} />
                    <span style={{ fontSize: 13, color: '#475569', lineHeight: 1.4 }}>{f}</span>
                  </div>
                ))}
              </div>
              <a href={`https://wa.me/?text=${encodeURIComponent(`Hi! I'd like to order the ${p.name} package.`)}`} target="_blank" rel="noopener noreferrer" style={{
                display: 'block', textAlign: 'center', padding: 13, borderRadius: 100, textDecoration: 'none', fontSize: 13.5, fontWeight: 700,
                background: p.tag ? `linear-gradient(135deg,${ACCENT},${ACCENT_LIGHT})` : '#f8fafc',
                color: p.tag ? '#fff' : '#1e293b',
              }}>
                Get Started
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* ── REVIEWS ── */}
      <div id="reviews" style={{ background: '#f8fafc', padding: '70px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: ACCENT, fontWeight: 700, marginBottom: 8 }}>Testimonials</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '2rem', color: '#0f172a' }}>Loved by Couples</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, alignItems: 'start' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
              {reviews.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>Be the first to leave a review!</div>
              ) : reviews.map(r => (
                <div key={r.id} style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(15,23,42,0.05)' }}>
                  <StarRating value={r.rating} size={13} />
                  <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, margin: '10px 0' }}>{r.review_text}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{r.name}</div>
                </div>
              ))}
            </div>
            <ReviewForm />
          </div>
        </div>
      </div>

      {/* ── CONTACT US ── */}
      <div id="contact" style={{ background: `linear-gradient(135deg,${ACCENT},${ACCENT_LIGHT})`, padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)', fontWeight: 700, marginBottom: 10 }}>Contact Us</div>
        <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '2rem', color: '#fff', marginBottom: 12 }}>Ready to Begin Your Story?</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 26 }}>Get your digital wedding invitation ready in as little as 24 hours. Reach out any time — we'd love to hear from you.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="https://wa.me/?text=Hi!%20I%27d%20like%20to%20create%20a%20wedding%20invitation" target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 32px', borderRadius: 100,
            background: '#fff', color: ACCENT, textDecoration: 'none', fontSize: 14, fontWeight: 700,
          }}>
            <Icon name="whatsapp" size={16} color={ACCENT} /> Chat With Us on WhatsApp
          </a>
          <a href="https://www.facebook.com/share/19xAgQX1c4/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 26px', borderRadius: 100,
            background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.5)', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600,
          }}>
            <Icon name="facebook" size={16} color="#fff" /> Follow on Facebook
          </a>
          <a href="https://www.tiktok.com/@invitvei1w8?_r=1&_t=ZS-981V9Ar9c3w" target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 26px', borderRadius: 100,
            background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.5)', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600,
          }}>
            <Icon name="tiktok" size={16} color="#fff" /> Follow on TikTok
          </a>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ padding: '40px 24px 32px', textAlign: 'center', background: '#0f172a' }}>
        <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: '1.6rem', color: ACCENT_LIGHT, marginBottom: 14 }}>InviteGlow</div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 18 }}>
          <a href="https://www.facebook.com/share/19xAgQX1c4/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" aria-label="Facebook" style={{
            width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
          }}>
            <Icon name="facebook" size={17} color="rgba(255,255,255,0.7)" />
          </a>
          <a href="https://www.tiktok.com/@invitvei1w8?_r=1&_t=ZS-981V9Ar9c3w" target="_blank" rel="noopener noreferrer" aria-label="TikTok" style={{
            width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
          }}>
            <Icon name="tiktok" size={17} color="rgba(255,255,255,0.7)" />
          </a>
          <a href="https://wa.me/?text=Hi!%20I%27d%20like%20to%20create%20a%20wedding%20invitation" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" style={{
            width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
          }}>
            <Icon name="whatsapp" size={17} color="rgba(255,255,255,0.7)" />
          </a>
        </div>
        <div style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Digital Wedding Invitations, Made in Sri Lanka</div>
      </div>

      {/* ── FLOATING WHATSAPP BUTTON ── */}
      <a
        href="https://wa.me/?text=Hi!%20I%27d%20like%20to%20create%20a%20wedding%20invitation"
        target="_blank" rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 100,
          width: 58, height: 58, borderRadius: '50%', background: '#25d366',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(37,211,102,0.5)', textDecoration: 'none',
          animation: 'wa-pulse 2.4s ease infinite',
        }}
      >
        <Icon name="whatsapp" size={28} color="#fff" />
      </a>
      <style>{`
        @keyframes wa-pulse {
          0%, 100% { box-shadow: 0 8px 24px rgba(37,211,102,0.5); }
          50% { box-shadow: 0 8px 24px rgba(37,211,102,0.5), 0 0 0 10px rgba(37,211,102,0.15); }
        }
        @media (max-width: 640px) {
          a[aria-label="Chat on WhatsApp"] { bottom: 18px; right: 18px; width: 52px; height: 52px; }
        }
      `}</style>
    </div>
  )
}
