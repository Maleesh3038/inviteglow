"use client"
import { useState } from 'react'
import { motion } from 'framer-motion'

const templates = [
  {
    id: 1,
    name: "Floral Romance",
    desc: "Soft pink florals with elegant animations",
    tag: "Most Popular",
    bg: "linear-gradient(135deg,#fde8e8,#f9d0dc)",
    emoji: "🌸",
    color: "#c4607a",
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
    demoUrl: "https://www.inviteglow.com/invite/irudaka-sachini",
  },
  {
    id: 4,
    name: "Garden Minimal",
    desc: "Clean white with soft green touches",
    tag: "New",
    bg: "linear-gradient(135deg,#f0f7f0,#e0f0e0)",
    emoji: "🌿",
    color: "#4a8a5a",
    demoUrl: "https://www.inviteglow.com/invite/sheneli-kevin",
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
    price: "3,000",
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

export default function MarketingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: "#fffaf9", color: "#2d1515", overflowX: "hidden" }}>

      {/* ── NAV ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,250,249,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid #f0ddd8", padding: "14px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "1.8rem", color: "#c4607a" }}>InviteGlow</div>
          <div className="hidden md:flex" style={{ alignItems: "center", gap: 4 }}>
            {["Features", "Themes", "Pricing", "About"].map(item => (
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
            {["Features", "Themes", "Pricing", "About"].map(item => (
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
                <div style={{ height: 160, background: t.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  {t.tag && (
                    <div style={{ position: "absolute", top: 12, right: 12, background: t.color, color: "#fff", borderRadius: 100, padding: "3px 10px", fontSize: 10, fontWeight: 600 }}>{t.tag}</div>
                  )}
                  <div style={{ fontSize: 40, marginBottom: 8 }}>{t.emoji}</div>
                  <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "1.4rem", color: t.dark ? "#fff" : "#3d1a2a" }}>Live Demo</div>
                  <div style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: t.dark ? "rgba(255,255,255,0.5)" : "rgba(45,21,21,0.4)", marginTop: 4 }}>Tap to Open ↗</div>
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
                <a href={`https://wa.me/94763038555?text=Hi InviteGlow! I'm interested in the ${p.name} package for my wedding.`} target="_blank" rel="noopener noreferrer"
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
          <a href={`https://wa.me/94763038555?text=Hi InviteGlow! I want to create a digital wedding invitation.`} target="_blank" rel="noopener noreferrer"
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
            <div style={{ maxWidth: 260 }}>
              <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "2rem", color: "#f9d0dc", marginBottom: 12 }}>InviteGlow</div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.8 }}>Trusted digital invitations for weddings, birthdays, and celebrations across Sri Lanka. Beautiful, fast, and eco-friendly.</p>
            </div>
            {[
              { title: "Product", links: ["Features", "Themes", "Pricing", "How it Works"] },
              { title: "Support", links: ["WhatsApp Us", "FAQ", "Contact"] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 16, fontWeight: 600 }}>{col.title}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {col.links.map(l => (
                    <a key={l} href="#" style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#f9d0dc"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"}>{l}</a>
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

      {/* WhatsApp floating button */}
      <motion.a href="https://wa.me/94763038555?text=Hi InviteGlow! I'm interested in creating a digital wedding invitation." target="_blank" rel="noopener noreferrer"
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 2 }}
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
        style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999, display: "flex", alignItems: "center", gap: 10, background: "#25d366", color: "#fff", padding: "12px 20px", borderRadius: 100, textDecoration: "none", fontWeight: 600, fontSize: 14, boxShadow: "0 8px 32px rgba(37,211,102,0.4)", fontFamily: "'Inter',sans-serif" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
        Chat with us
      </motion.a>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        input::placeholder { color: #c4a0b0; }
      `}</style>
    </div>
  )
}