"use client"
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, Review } from '@/lib/supabase'

const templates = [
  {
    id: 1,
    name: "Floral Romance",
    desc: "Soft pink florals with elegant animations",
    tag: "Most Popular",
    bg: "linear-gradient(135deg,#fde8e8,#f9d0dc)",
    emoji: "🌸",
    color: "#c4607a",
    photo: "/images/hero-floral.png",
    demoUrl: "https://www.inviteglow.com/invite/kavindi-malina",
  },
  {
    id: 2,
    name: "Cinematic Gold",
    desc: "Dark luxury with gold accents",
    tag: "Premium",
    bg: "linear-gradient(135deg,#1a1208,#3d2d0a)",
    emoji: "✨",
    color: "#c9a96e",
    dark: true,
    photo: "/images/hero-cinematic.png",
    demoUrl: "https://www.inviteglow.com/invite/imesha-pasan",
  },
  {
    id: 3,
    name: "Kandyan Heritage",
    desc: "Traditional Sri Lankan royal elegance",
    tag: "Sri Lankan",
    bg: "linear-gradient(135deg,#2d0a0a,#6b1a1a)",
    emoji: "🪷",
    color: "#e8a060",
    dark: true,
    photo: "/images/hero-kandyan.png",
    demoUrl: "https://www.inviteglow.com/invite/irudaka-sachini",
  },
  {
    id: 4,
    name: "Elegant Photo",
    desc: "Full-bleed photo hero with refined typography",
    tag: "New",
    bg: "linear-gradient(135deg,#f4ece0,#e8d5b8)",
    emoji: "🤍",
    color: "#a8895a",
    photo: "/images/hero-elegant.png",
    demoUrl: "https://www.inviteglow.com/invite/sheneli-kevin",
  },
  {
    id: 5,
    name: "Golden Garden",
    desc: "Sunset floral arch with flying birds",
    tag: "New",
    bg: "linear-gradient(135deg,#fde8c8,#e8a888)",
    emoji: "🌼",
    color: "#d4a857",
    photo: "/images/hero-golden-garden.png",
    demoUrl: "https://www.inviteglow.com/invite/sanjeewani-lalith",
  },
  {
    id: 6,
    name: "Ocean Pearl",
    desc: "Deep ocean elegance with pearls and bubbles",
    tag: "New",
    bg: "linear-gradient(135deg,#0f3a47,#1d5666)",
    emoji: "🦪",
    color: "#d4a857",
    dark: true,
    photo: "/images/hero-ocean-pearl.png",
    demoUrl: "https://www.inviteglow.com/invite/akila-nethmi",
  },
  {
    id: 7,
    name: "Sunset Shores",
    desc: "Bali sunset romance with hibiscus and ocean waves",
    tag: "New",
    bg: "linear-gradient(135deg,#fbd4ae,#e0795a)",
    emoji: "🌺",
    color: "#e0795a",
    photo: "/images/hero-sunset-shores.png",
    demoUrl: "https://www.inviteglow.com/invite/manisha-sachin",
  },
  {
    id: 8,
    name: "Traditional Ceylon",
    desc: "Kandyan culture and royal gold elegance",
    tag: "Sri Lankan",
    bg: "linear-gradient(135deg,#1f2e22,#2f4a35)",
    emoji: "🪔",
    color: "#c9a227",
    dark: true,
    photo: "/images/hero-traditional-ceylon.png",
    demoUrl: "https://www.inviteglow.com/invite/maheshi-dilip",
  },
]

const features = [
  { icon: "💰", title: "Save Money", desc: "No printing, no postage. Save up to 80% compared to traditional paper invitations." },
  { icon: "📱", title: "Easy Sharing", desc: "Share your invitation with a simple link. Works on any device, no app required." },
  { icon: "✅", title: "RSVP Tracking", desc: "Track responses in real time via your personal dashboard. Know exactly who is coming." },
  { icon: "⏱️", title: "Live Countdown", desc: "Add excitement with a beautiful live countdown timer to your big day." },
  { icon: "🌿", title: "Eco Friendly", desc: "Go green with zero paper waste. Celebrate sustainably with digital invitations." },
  { icon: "🪑", title: "Seat Finder", desc: "Let guests find their table by searching their name — no printed seating charts needed." },
]

const steps = [
  { num: "01", title: "Choose a Theme", desc: "Browse our collection of stunning themes designed for weddings and special events." },
  { num: "02", title: "Customise", desc: "Add your event details, photos, and personal touches via WhatsApp — done in minutes." },
  { num: "03", title: "Share & Track", desc: "Send your invitation link and watch RSVPs come in through your live dashboard." },
]

const pricing = [
  {
    name: "Starter",
    price: "4,000",
    tag: null,
    features: [
      "1 invitation template",
      "RSVP tracking",
      "Live countdown timer",
      "Google Maps integration",
      "WhatsApp support",
    ],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Premium",
    price: "6,000",
    tag: "Most Popular",
    features: [
      "All Starter features",
      "Photo gallery (up to 20 photos)",
      "Background music",
      "Guest seat finder",
      "Wedding timeline",
      "Unlimited guest RSVP",
      "WhatsApp & call support",
    ],
    cta: "Get Premium",
    highlight: true,
  },
  {
    name: "Luxury",
    price: "14,000",
    tag: "Best Value",
    features: [
      "All Premium features",
      "Custom AI video intro",
      "Personalised theme design",
      "Priority 24/7 support",
      "3 revision rounds",
    ],
    cta: "Go Luxury",
    highlight: false,
  },
]

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }

const REVIEWS_BUCKET = 'wedding-photos'

// ── Star rating display (read-only) ──
function StarRow({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24" fill={n <= rating ? "#f0a868" : "#f0ddd8"}>
          <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </div>
  )
}

// ── Interactive star picker (for the submission form) ──
function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} stars`}
          style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2 }}>
          <svg width={28} height={28} viewBox="0 0 24 24" fill={n <= value ? "#f0a868" : "#f0ddd8"}>
            <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        </button>
      ))}
    </div>
  )
}

// ── Review submission form ──
function ReviewForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [name, setName] = useState("")
  const [rating, setRating] = useState(0)
  const [text, setText] = useState("")
  const [photo, setPhoto] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoUpload = async (file: File) => {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `reviews/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from(REVIEWS_BUCKET).upload(fileName, file, { cacheControl: '3600', upsert: false })
    if (!error) {
      const { data } = supabase.storage.from(REVIEWS_BUCKET).getPublicUrl(fileName)
      setPhoto(data.publicUrl)
    }
    setUploading(false)
  }

  const handleSubmit = async () => {
    if (!name.trim() || !rating || !text.trim()) {
      setMessage('⚠️ Please add your name, a star rating, and a short review.')
      return
    }
    setSaving(true)
    setMessage("")
    const { error } = await supabase.from('reviews').insert([{
      name: name.trim(),
      rating,
      review_text: text.trim(),
      photo_url: photo || null,
      status: 'pending',
    }])
    setSaving(false)
    if (error) {
      setMessage('❌ Something went wrong — please try again.')
    } else {
      setMessage('✅ Thank you! Your review has been submitted and will appear once approved.')
      setName(""); setRating(0); setText(""); setPhoto("")
      onSubmitted()
    }
  }

  return (
    <div style={{ background: "#fff", borderRadius: 20, padding: "28px 24px", border: "1px solid #f0ddd8", boxShadow: "0 4px 20px rgba(196,96,122,0.07)", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#2d1515", marginBottom: 4, textAlign: "center" }}>Share Your Experience</div>
      <div style={{ fontSize: 13, color: "#9a7080", marginBottom: 20, textAlign: "center" }}>Loved your invitation? Tell other couples about it.</div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#7a4040", marginBottom: 6, display: "block" }}>Your Name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Amara Perera"
          style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #f0ddd8", fontSize: 14, outline: "none", fontFamily: "'Inter',sans-serif" }} />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#7a4040", marginBottom: 6, display: "block" }}>Your Rating</label>
        <StarPicker value={rating} onChange={setRating} />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#7a4040", marginBottom: 6, display: "block" }}>Your Review</label>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Tell us about your experience with InviteGlow..."
          style={{ width: "100%", minHeight: 90, padding: "11px 14px", borderRadius: 10, border: "1px solid #f0ddd8", fontSize: 14, outline: "none", fontFamily: "'Inter',sans-serif", resize: "vertical" }} />
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#7a4040", marginBottom: 6, display: "block" }}>Add a Photo (optional)</label>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {photo && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={photo} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", border: "1px solid #f0ddd8" }} />
          )}
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
            style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid #f0ddd8", background: uploading ? "#fdf0f3" : "#fff", cursor: uploading ? "default" : "pointer", fontSize: 13, color: "#7a4040", fontWeight: 500 }}>
            {uploading ? "Uploading..." : photo ? "Change Photo" : "📷 Upload Photo"}
          </button>
          {photo && (
            <button type="button" onClick={() => setPhoto("")} style={{ fontSize: 12, color: "#c4607a", background: "transparent", border: "none", cursor: "pointer" }}>Remove</button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f) }} />
        </div>
      </div>

      {message && <div style={{ marginBottom: 14, fontSize: 13, color: message.startsWith('✅') ? '#16a34a' : '#dc2626' }}>{message}</div>}

      <button onClick={handleSubmit} disabled={saving} style={{
        width: "100%", padding: 14, borderRadius: 12, border: "none", cursor: "pointer",
        background: "linear-gradient(135deg,#c4607a,#e08090)", color: "#fff", fontWeight: 700, fontSize: 14,
        opacity: saving ? 0.6 : 1,
      }}>
        {saving ? "Submitting..." : "Submit Review"}
      </button>
    </div>
  )
}

// ── Reviews section: approved reviews grid + toggleable submission form ──
function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const loadReviews = async () => {
    const { data, error } = await supabase
      .from('reviews').select('*').eq('status', 'approved').order('created_at', { ascending: false })
    if (!error && data) setReviews(data as Review[])
    setLoading(false)
  }

  useEffect(() => { loadReviews() }, [])

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0

  return (
    <section id="reviews" style={{ background: "#fffaf9", padding: "80px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: "#e8a0b8", marginBottom: 12, fontWeight: 600 }}>💌 Couples Love Us</div>
          <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 800, color: "#2d1515", marginBottom: 12, letterSpacing: "-0.03em" }}>What Our Couples Say</h2>
          {reviews.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
              <StarRow rating={Math.round(avgRating)} size={20} />
              <span style={{ fontSize: 15, fontWeight: 700, color: "#2d1515" }}>{avgRating.toFixed(1)}</span>
              <span style={{ fontSize: 13, color: "#9a7080" }}>· {reviews.length} review{reviews.length === 1 ? "" : "s"}</span>
            </div>
          )}
          <p style={{ color: "#9a7080", fontSize: 15, marginTop: 8 }}>Real feedback from couples who created their invitation with us.</p>
        </motion.div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#9a7080" }}>Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#9a7080", background: "#fff", borderRadius: 16, border: "1px solid #f0ddd8", maxWidth: 480, margin: "0 auto 32px" }}>
            No reviews yet — be the first to share your experience!
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 20, marginBottom: 40 }}>
            {reviews.map((r, i) => (
              <motion.div key={r.id} variants={fadeUp} initial="hidden" whileInView="visible" transition={{ delay: i * 0.06 }} viewport={{ once: true }}
                style={{ background: "#fff", borderRadius: 18, padding: "22px 20px", border: "1px solid #f0ddd8", boxShadow: "0 4px 20px rgba(196,96,122,0.07)" }}>
                <StarRow rating={r.rating} />
                <p style={{ fontSize: 14, color: "#6a4040", lineHeight: 1.7, margin: "12px 0 16px" }}>"{r.review_text}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {r.photo_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={r.photo_url} alt={r.name} style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#fde8ed,#f9d0dc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#c4607a" }}>
                      {r.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#2d1515" }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: "#c4a0b0" }}>
                      {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div style={{ textAlign: "center" }}>
          {!showForm ? (
            <button onClick={() => setShowForm(true)} style={{
              padding: "14px 32px", borderRadius: 100, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg,#c4607a,#e08090)", color: "#fff", fontWeight: 600, fontSize: 14,
              boxShadow: "0 8px 24px rgba(196,96,122,0.3)",
            }}>
              ✍️ Leave a Review
            </button>
          ) : (
            <AnimatePresence>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <ReviewForm onSubmitted={() => { setShowForm(false); loadReviews() }} />
                <button onClick={() => setShowForm(false)} style={{ marginTop: 14, fontSize: 13, color: "#9a7080", background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                  Cancel
                </button>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </section>
  )
}

export default function MarketingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: "#fffaf9", color: "#2d1515", overflowX: "hidden" }}>

      {/* ── NAV ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,250,249,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid #f0ddd8", padding: "14px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "1.8rem", color: "#c4607a" }}>InviteGlow</div>
          <div className="hidden md:flex" style={{ alignItems: "center", gap: 4 }}>
            {["Features", "Themes", "Reviews", "Pricing", "About"].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`}
                style={{ padding: "8px 16px", borderRadius: 10, fontSize: 14, color: "#7a4040", textDecoration: "none", transition: "all 0.2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#fde8ed"; (e.currentTarget as HTMLElement).style.color = "#c4607a" }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#7a4040" }}>
                {item}
              </a>
            ))}
            <a href="#pricing"
              style={{ marginLeft: 8, padding: "10px 22px", borderRadius: 100, fontSize: 14, fontWeight: 600, color: "#fff", textDecoration: "none", background: "linear-gradient(135deg,#c4607a,#e08090)", boxShadow: "0 4px 14px rgba(196,96,122,0.3)" }}>
              Create Invitation
            </a>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden"
            style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 20, color: "#c4607a" }}>
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
        {menuOpen && (
          <div style={{ padding: "1rem 24px", borderTop: "1px solid #f0ddd8", display: "flex", flexDirection: "column", gap: 8 }}>
            {["Features", "Themes", "Reviews", "Pricing", "About"].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMenuOpen(false)}
                style={{ fontSize: 15, color: "#7a4040", textDecoration: "none", padding: "8px 0" }}>{item}</a>
            ))}
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section style={{ background: "linear-gradient(160deg,#fff5f5 0%,#fde8f0 50%,#fff0f5 100%)", padding: "80px 24px 60px", textAlign: "center", position: "relative", overflow: "hidden" }}>

        {/* BG decorations */}
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(196,96,122,0.08),transparent)", top: -150, left: -150, pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(196,96,122,0.06),transparent)", bottom: -100, right: -100, pointerEvents: "none" }} />

        <div style={{ maxWidth: 800, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fde8ed", borderRadius: 100, padding: "6px 16px", fontSize: 12, color: "#c4607a", fontWeight: 500, marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block", animation: "pulse 2s infinite" }} />
            100% Digital · Zero Paper Waste
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }}
            style={{ fontSize: "clamp(2.2rem,6vw,4rem)", fontWeight: 800, color: "#2d1515", lineHeight: 1.15, marginBottom: 20, letterSpacing: "-0.03em" }}>
            Beautiful Digital<br />
            <span style={{ background: "linear-gradient(135deg,#c4607a,#e08090)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Wedding Invitations
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            style={{ fontSize: "clamp(1rem,2vw,1.15rem)", color: "#9a7080", maxWidth: 520, margin: "0 auto 36px", lineHeight: 1.8 }}>
            Create stunning digital invitations with RSVP, smooth motion, and instant sharing. Perfect for weddings, birthdays, and every celebration in between.
          </motion.p>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
            <a href="#pricing" style={{ padding: "16px 36px", borderRadius: 100, fontSize: 15, fontWeight: 600, color: "#fff", textDecoration: "none", background: "linear-gradient(135deg,#c4607a,#e08090)", boxShadow: "0 8px 24px rgba(196,96,122,0.35)" }}>
              Create Invitation →
            </a>
            <a href="#themes" style={{ padding: "16px 36px", borderRadius: 100, fontSize: 15, fontWeight: 500, color: "#c4607a", textDecoration: "none", background: "#fff", border: "1px solid #f0c0cc" }}>
              View Themes
            </a>
          </motion.div>

          {/* Hero preview mockup */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.8 }}
            style={{ marginTop: 60, display: "flex", justifyContent: "center" }}>
            <div style={{ background: "#fff", borderRadius: 20, padding: 6, boxShadow: "0 20px 60px rgba(196,96,122,0.15)", maxWidth: 340, width: "100%" }}>
              {/* Browser bar */}
              <div style={{ background: "#f8f4f4", borderRadius: "14px 14px 0 0", padding: "8px 12px", display: "flex", alignItems: "center", gap: 6, marginBottom: 0 }}>
                <div style={{ display: "flex", gap: 4 }}>
                  {["#f87171", "#fbbf24", "#4ade80"].map(c => <div key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />)}
                </div>
                <div style={{ flex: 1, background: "#fff", borderRadius: 6, padding: "3px 10px", fontSize: 10, color: "#c4a0b0" }}>inviteglow.com/amara-roshan</div>
              </div>
              {/* Preview card */}
              <div style={{ background: "linear-gradient(135deg,#fde8e8,#fdf0f3)", borderRadius: "0 0 14px 14px", padding: "24px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "#c4a0b0", marginBottom: 8 }}>You Are Invited</div>
                <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "2.5rem", color: "#3d1a2a", lineHeight: 1 }}>Amara</div>
                <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "1.6rem", color: "#c4607a" }}>&amp;</div>
                <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "2.5rem", color: "#3d1a2a", lineHeight: 1 }}>Roshan</div>
                <div style={{ fontSize: 11, color: "#9a7080", margin: "12px 0 16px", lineHeight: 1.6 }}>Join us as we celebrate love, joy,<br />and unforgettable moments together</div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  <div style={{ background: "#c4607a", color: "#fff", borderRadius: 100, padding: "8px 14px", fontSize: 10, fontWeight: 500 }}>✓ Accept</div>
                  <div style={{ background: "#fde8ed", color: "#c4607a", borderRadius: 100, padding: "8px 14px", fontSize: 10 }}>✗ Decline</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── WHY CHOOSE ── */}
      <section style={{ background: "#fff", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div style={{ fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: "#e8a0b8", marginBottom: 12, fontWeight: 600 }}>Why Go Digital</div>
            <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 800, color: "#2d1515", marginBottom: 16, letterSpacing: "-0.03em" }}>Why Choose Digital Invitations?</h2>
            <p style={{ color: "#9a7080", fontSize: 16, lineHeight: 1.8, maxWidth: 600, margin: "0 auto" }}>
              Digital invitations meet guests where they already are — use their phones with one tap, see responses, and update when plans change. You save time and printing costs while delivering a beautiful first impression.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── THEMES ── */}
      <section id="themes" style={{ background: "#fffaf9", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: "#e8a0b8", marginBottom: 12, fontWeight: 600 }}>🌸 Wedding Themes</div>
            <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 800, color: "#2d1515", marginBottom: 12, letterSpacing: "-0.03em" }}>Themes for Every Occasion</h2>
            <p style={{ color: "#9a7080", fontSize: 15 }}>Choose from our curated collection of professionally designed templates.</p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20 }}>
            {templates.map((t, i) => (
              <motion.div key={t.id} variants={fadeUp} initial="hidden" whileInView="visible" transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                whileHover={{ y: -6, boxShadow: "0 20px 50px rgba(196,96,122,0.15)" }}
                onClick={() => window.open(t.demoUrl, '_blank')}
                style={{ background: "#fff", borderRadius: 20, overflow: "hidden", border: "1px solid #f0ddd8", boxShadow: "0 4px 20px rgba(196,96,122,0.07)", cursor: "pointer", transition: "all 0.3s" }}>
                <div style={{ height: 160, position: "relative", overflow: "hidden" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.photo} alt={t.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.65) 100%)" }} />
                  {t.tag && (
                    <div style={{ position: "absolute", top: 12, right: 12, background: t.color, color: "#fff", borderRadius: 100, padding: "3px 10px", fontSize: 10, fontWeight: 600, zIndex: 2 }}>{t.tag}</div>
                  )}
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 16px", zIndex: 2, textAlign: "center" }}>
                    <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "1.3rem", color: "#fff" }}>Live Demo</div>
                    <div style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", marginTop: 2 }}>Tap to Open ↗</div>
                  </div>
                </div>
                <div style={{ padding: "16px 20px 20px" }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#2d1515", marginBottom: 6 }}>{t.name}</h3>
                  <p style={{ fontSize: 13, color: "#9a7080", lineHeight: 1.6, marginBottom: 14 }}>{t.desc}</p>
                  <a href={t.demoUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                    style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600, color: t.color, textDecoration: "none" }}>
                    View Live Demo
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ background: "#fff", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: "#e8a0b8", marginBottom: 12, fontWeight: 600 }}>Everything You Need</div>
            <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 800, color: "#2d1515", marginBottom: 12, letterSpacing: "-0.03em" }}>Features</h2>
            <p style={{ color: "#9a7080", fontSize: 15 }}>Everything you need for memorable digital invitations — sharing, RSVP, countdowns, and more.</p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
            {features.map((f, i) => (
              <motion.div key={f.title} variants={fadeUp} initial="hidden" whileInView="visible" transition={{ delay: i * 0.08 }} viewport={{ once: true }}
                whileHover={{ y: -4 }}
                style={{ background: "#fffaf9", borderRadius: 16, padding: "24px", border: "1px solid #f0ddd8", transition: "all 0.3s" }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#2d1515", marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: "#9a7080", lineHeight: 1.7 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background: "linear-gradient(135deg,#fff5f5,#fde8f0)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: "#e8a0b8", marginBottom: 12, fontWeight: 600 }}>Simple Process</div>
            <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 800, color: "#2d1515", marginBottom: 12, letterSpacing: "-0.03em" }}>How It Works</h2>
            <p style={{ color: "#9a7080", fontSize: 15 }}>Three simple steps to create digital invitations you can share in minutes.</p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 24 }}>
            {steps.map((s, i) => (
              <motion.div key={s.num} variants={fadeUp} initial="hidden" whileInView="visible" transition={{ delay: i * 0.15 }} viewport={{ once: true }}
                style={{ textAlign: "center", padding: "32px 24px", background: "#fff", borderRadius: 20, border: "1px solid #f0ddd8", boxShadow: "0 4px 20px rgba(196,96,122,0.07)" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#fde8ed,#f9d0dc)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontFamily: "'Cormorant Garamond',serif", fontSize: "1.4rem", fontWeight: 600, color: "#c4607a" }}>{s.num}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#2d1515", marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: "#9a7080", lineHeight: 1.7 }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <ReviewsSection />

      {/* ── PRICING ── */}
      <section id="pricing" style={{ background: "#fff", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: "#e8a0b8", marginBottom: 12, fontWeight: 600 }}>🌸 Wedding Packages</div>
            <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 800, color: "#2d1515", marginBottom: 12, letterSpacing: "-0.03em" }}>Pricing That Fits Your Celebration</h2>
            <p style={{ color: "#9a7080", fontSize: 15 }}>Choose a package and get a beautiful, hassle-free invitation you can share instantly.</p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
            {pricing.map((p, i) => (
              <motion.div key={p.name} variants={fadeUp} initial="hidden" whileInView="visible" transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                style={{
                  borderRadius: 20, padding: "32px 28px",
                  background: p.highlight ? "linear-gradient(160deg,#3d1a1a,#6b2d2d)" : "#fffaf9",
                  border: p.highlight ? "none" : "1px solid #f0ddd8",
                  boxShadow: p.highlight ? "0 20px 60px rgba(196,96,122,0.25)" : "0 4px 20px rgba(196,96,122,0.07)",
                  position: "relative",
                }}>
                {p.tag && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#c4607a", color: "#fff", borderRadius: 100, padding: "4px 16px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>{p.tag}</div>
                )}
                <div style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: p.highlight ? "rgba(255,255,255,0.5)" : "#c4a0b0", marginBottom: 8 }}>PACKAGE</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: p.highlight ? "#fff" : "#2d1515", marginBottom: 4 }}>{p.name}</div>
                <div style={{ marginBottom: 24 }}>
                  <span style={{ fontSize: 11, color: p.highlight ? "rgba(255,255,255,0.5)" : "#9a7080" }}>LKR </span>
                  <span style={{ fontSize: 36, fontWeight: 800, color: p.highlight ? "#f9d0dc" : "#c4607a", letterSpacing: "-0.03em" }}>{p.price}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: p.highlight ? "rgba(255,255,255,0.75)" : "#6a4040" }}>
                      <span style={{ color: p.highlight ? "#f9a0b8" : "#c4607a", flexShrink: 0, marginTop: 1 }}>✓</span>
                      {f}
                    </div>
                  ))}
                </div>
                <a href={`https://wa.me/94770024484?text=Hi InviteGlow! I'm interested in the ${p.name} package for my wedding.`} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: "block", textAlign: "center", padding: "14px", borderRadius: 12,
                    fontSize: 14, fontWeight: 600, textDecoration: "none", transition: "all 0.2s",
                    background: p.highlight ? "#c4607a" : "linear-gradient(135deg,#c4607a,#e08090)",
                    color: "#fff",
                    boxShadow: p.highlight ? "none" : "0 4px 14px rgba(196,96,122,0.3)",
                  }}>
                  {p.cta} via WhatsApp
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ background: "linear-gradient(135deg,#3d1a1a,#6b2d2d)", padding: "80px 24px", textAlign: "center" }}>
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 800, color: "#fff", marginBottom: 16, letterSpacing: "-0.03em" }}>Ready to Create Your Perfect Invitation?</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, marginBottom: 32, lineHeight: 1.8 }}>Start your invitation in minutes. No credit card required to get started.</p>
          <a href={`https://wa.me/94770024484?text=Hi InviteGlow! I want to create a digital wedding invitation.`} target="_blank" rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "16px 36px", borderRadius: 100, fontSize: 15, fontWeight: 600, color: "#fff", textDecoration: "none", background: "#25d366", boxShadow: "0 8px 24px rgba(37,211,102,0.4)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
            Start Creating Now
          </a>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#1a0808", padding: "48px 24px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 32, justifyContent: "space-between", marginBottom: 40 }}>
            <div style={{ maxWidth: 280 }}>
              <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "2rem", color: "#f9d0dc", marginBottom: 12 }}>InviteGlow</div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.8, marginBottom: 20 }}>Trusted digital invitations for weddings, birthdays, and celebrations across Sri Lanka. Beautiful, fast, and eco-friendly.</p>

              {/* Social icons */}
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  {
                    name: "TikTok", url: "https://www.tiktok.com/@invitvei1w8?_r=1&_t=ZS-97Pna3Wpoqi",
                    svg: <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.49 1.52V7.47s-1.99.1-3.43-1.65z"/>,
                  },
                  {
                    name: "Facebook", url: "https://www.facebook.com/share/1BRY9WDrey/?mibextid=wwXIfr",
                    svg: <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.87h2.78l-.45 2.91h-2.33V22c4.78-.79 8.44-4.94 8.44-9.94z"/>,
                  },
                  {
                    name: "Instagram", url: "https://www.instagram.com/invite__glow?igsh=ZjB1bGFqbHJ3NjR1&utm_source=qr",
                    svg: <path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.15-3.23 1.66-4.77 4.92-4.92 1.27-.06 1.65-.07 4.85-.07M12 0C8.74 0 8.33.01 7.05.07c-4.35.2-6.78 2.62-6.98 6.98C.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zm0 10.16A4 4 0 1 1 16 12a4 4 0 0 1-4 4zm6.41-10.85a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44z"/>,
                  },
                  {
                    name: "WhatsApp", url: "https://wa.me/94770024484",
                    svg: <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413"/>,
                  },
                  {
                    name: "Email", url: "mailto:inviteglow.info@gmail.com",
                    svg: <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>,
                  },
                ].map(s => (
                  <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.name}
                    style={{
                      width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      background: "rgba(255,255,255,0.06)", transition: "background 0.2s",
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(249,208,220,0.18)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,0.6)">{s.svg}</svg>
                  </a>
                ))}
              </div>
            </div>

            {[
              { title: "Product", links: [{ label: "Features", href: "#features" }, { label: "Themes", href: "#themes" }, { label: "Reviews", href: "#reviews" }, { label: "Pricing", href: "#pricing" }, { label: "How it Works", href: "#" }] },
              {
                title: "Support", links: [
                  { label: "WhatsApp Us", href: "https://wa.me/94770024484?text=Hi InviteGlow! I have a question." },
                  { label: "Email Us", href: "mailto:inviteglow.info@gmail.com" },
                  { label: "Contact", href: "#contact" },
                ]
              },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 16, fontWeight: 600 }}>{col.title}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {col.links.map(l => (
                    <a key={l.label} href={l.href} target={l.href.startsWith("http") || l.href.startsWith("mailto") ? "_blank" : undefined} rel="noopener noreferrer"
                      style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#f9d0dc"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"}>{l.label}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 24, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>© 2026 InviteGlow. All rights reserved.</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>Terms · Privacy</div>
          </div>
        </div>
      </footer>

      {/* WhatsApp quick-chat widget */}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              style={{
                width: 290, background: "#fff", borderRadius: 18, overflow: "hidden",
                boxShadow: "0 20px 60px rgba(0,0,0,0.25)", fontFamily: "'Inter',sans-serif",
              }}>
              {/* Header */}
              <div style={{ background: "#25d366", padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💬</div>
                <div>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>InviteGlow</div>
                  <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 11 }}>Typically replies within minutes</div>
                </div>
                <button onClick={() => setChatOpen(false)} aria-label="Close chat"
                  style={{ marginLeft: "auto", background: "transparent", border: "none", color: "rgba(255,255,255,0.8)", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>
                  ✕
                </button>
              </div>

              {/* Quick replies */}
              <div style={{ padding: "16px 16px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Hi there! 👋 What can we help you with?</div>
                {[
                  { label: "💰 Pricing & Packages", text: "Hi InviteGlow! I'd like to know more about your pricing and packages." },
                  { label: "🎨 Choose a Template", text: "Hi InviteGlow! I'd like help choosing a wedding invitation template." },
                  { label: "📝 Start My Order", text: "Hi InviteGlow! I'm ready to start creating my digital wedding invitation." },
                  { label: "🛟 General Support", text: "Hi InviteGlow! I have a question about my invitation." },
                ].map(opt => (
                  <a key={opt.label} href={`https://wa.me/94770024484?text=${encodeURIComponent(opt.text)}`} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: "block", padding: "11px 14px", borderRadius: 10, border: "1px solid #e2e8f0",
                      fontSize: 13, color: "#1e293b", textDecoration: "none", fontWeight: 500, transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#f0fdf4"; (e.currentTarget as HTMLElement).style.borderColor = "#25d366" }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0" }}>
                    {opt.label}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle bubble */}
        <motion.button
          onClick={() => setChatOpen(!chatOpen)}
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 2 }}
          whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}
          style={{
            display: "flex", alignItems: "center", gap: 10, background: "#25d366", color: "#fff",
            padding: "12px 20px", borderRadius: 100, border: "none", cursor: "pointer",
            fontWeight: 600, fontSize: 14, boxShadow: "0 8px 32px rgba(37,211,102,0.4)", fontFamily: "'Inter',sans-serif",
          }}>
          {chatOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
          )}
          {chatOpen ? "Close" : "Chat with us"}
        </motion.button>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        input::placeholder { color: #c4a0b0; }
        textarea::placeholder { color: #c4a0b0; }
      `}</style>
    </div>
  )
}