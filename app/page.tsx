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

const PLANS = [
  { name: 'Starter', price: 3000, tag: '', features: ['1 template of your choice', 'RSVP tracking & guest list', 'Couple dashboard', 'Countdown timer', 'Up to 100 guests'], color: '#94a3b8' },
  { name: 'Premium', price: 5000, tag: 'Most Popular', features: ['Everything in Starter', 'Guest personalised links ("Dear [Name]")', 'Photo gallery + background music', 'Link valid for 1 year', 'Unlimited guests'], color: ACCENT },
  { name: 'Luxury', price: 8000, tag: '', features: ['Everything in Premium', 'Lifetime link — never expires', 'Guest Wishes & Messages wall', 'Full custom design & colors', 'Priority support'], color: '#8a6a2a' },
]

// ── Clean line-style SVG icons — no emoji on the homepage ──
type IconName = 'check' | 'star' | 'arrow' | 'template' | 'users' | 'chair' | 'music' | 'external' | 'whatsapp' | 'menu' | 'x' | 'heart'
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
    case 'whatsapp': return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3M12 2a10 10 0 00-8.5 15.3L2 22l4.8-1.3A10 10 0 1012 2z" /></svg>
    case 'menu': return <svg {...c}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
    case 'x': return <svg {...c}><path d="M6 6l12 12M18 6L6 18" /></svg>
    case 'heart': return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 20.5s-7-4.4-9.4-8.8C.8 8.1 2.4 4.5 6 4.5c2 0 3.4 1.2 4.2 2.3.8-1.1 2.2-2.3 4.2-2.3 3.6 0 5.2 3.6 3.4 7.2C19 16.1 12 20.5 12 20.5z" /></svg>
    default: return null
  }
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

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('reviews').select('*').eq('status', 'approved').order('created_at', { ascending: false }).limit(9)
      if (data) setReviews(data as Review[])
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
      `}</style>

      {/* ── NAV ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: scrolled ? 'rgba(255,255,255,0.9)' : 'transparent', backdropFilter: scrolled ? 'blur(10px)' : 'none', borderBottom: scrolled ? '1px solid #e2e8f0' : '1px solid transparent', transition: 'all 0.2s' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: '1.8rem', color: ACCENT }}>InviteGlow</div>
          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <button onClick={() => scrollTo('templates')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 500, color: '#475569' }}>Templates</button>
            <button onClick={() => scrollTo('pricing')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 500, color: '#475569' }}>Pricing</button>
            <button onClick={() => scrollTo('reviews')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 500, color: '#475569' }}>Reviews</button>
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

      {/* ── PRICING ── */}
      <div id="pricing" style={{ maxWidth: 1100, margin: '0 auto', padding: '70px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: ACCENT, fontWeight: 700, marginBottom: 8 }}>Simple Pricing</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '2rem', color: '#0f172a' }}>Choose Your Package</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20 }}>
          {PLANS.map(p => (
            <div key={p.name} style={{
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

      {/* ── FOOTER CTA ── */}
      <div style={{ background: `linear-gradient(135deg,${ACCENT},${ACCENT_LIGHT})`, padding: '60px 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '2rem', color: '#fff', marginBottom: 12 }}>Ready to Begin Your Story?</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 26 }}>Get your digital wedding invitation ready in as little as 24 hours.</p>
        <a href="https://wa.me/?text=Hi!%20I%27d%20like%20to%20create%20a%20wedding%20invitation" target="_blank" rel="noopener noreferrer" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 32px', borderRadius: 100,
          background: '#fff', color: ACCENT, textDecoration: 'none', fontSize: 14, fontWeight: 700,
        }}>
          <Icon name="whatsapp" size={16} color={ACCENT} /> Chat With Us on WhatsApp
        </a>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ padding: '32px 24px', textAlign: 'center', background: '#0f172a' }}>
        <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: '1.5rem', color: ACCENT_LIGHT, marginBottom: 6 }}>InviteGlow</div>
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
