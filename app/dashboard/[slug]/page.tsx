"use client"
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase, Couple, RSVP } from '@/lib/supabase'

export default function CoupleDashboard() {
  const params = useParams()
  const slug = params.slug as string

  const [couple, setCouple] = useState<Couple | null>(null)
  const [rsvps, setRsvps] = useState<RSVP[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [search, setSearch] = useState("")

  // PIN gate
  const [unlocked, setUnlocked] = useState(false)
  const [pinInput, setPinInput] = useState("")
  const [pinError, setPinError] = useState(false)

  const loadData = async () => {
    const { data: coupleData, error: coupleError } = await supabase
      .from('couples').select('*').eq('slug', slug).single()

    if (coupleError || !coupleData) {
      setNotFound(true)
      setLoading(false)
      return
    }
    setCouple(coupleData as Couple)

    const { data: rsvpData } = await supabase
      .from('rsvps').select('*').eq('couple_id', coupleData.id).order('created_at', { ascending: false })

    setRsvps((rsvpData as RSVP[]) || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [slug])

  useEffect(() => {
    if (!unlocked) return
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [unlocked, slug])

  const checkPin = () => {
    if (couple && pinInput === couple.pin) {
      setUnlocked(true)
      setPinError(false)
    } else {
      setPinError(true)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fdf0f0", fontFamily: "'Inter',sans-serif", color: "#c4607a" }}>
        Loading...
      </div>
    )
  }

  if (notFound || !couple) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fdf0f0", fontFamily: "'Inter',sans-serif", color: "#3d1a2a", textAlign: "center", padding: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💔</div>
        <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "2rem", color: "#c4607a", marginBottom: 8 }}>Dashboard Not Found</div>
        <div style={{ fontSize: 14, color: "#9a7080" }}>This invitation doesn't exist.</div>
      </div>
    )
  }

  // ── PIN LOCK SCREEN ──
  if (!unlocked) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fdf0f0", fontFamily: "'Inter',sans-serif", padding: 24 }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Inter:wght@400;500;600&display=swap');`}</style>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: "#fff", borderRadius: 20, padding: "2.5rem 2rem", maxWidth: 360, width: "100%", textAlign: "center", boxShadow: "0 8px 40px rgba(200,120,140,0.15)" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
          <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "1.8rem", color: "#3d1a2a", marginBottom: 4 }}>
            {couple.bride} &amp; {couple.groom}
          </div>
          <div style={{ fontSize: 12, color: "#9a7080", marginBottom: 24 }}>Enter your PIN to view your dashboard</div>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={4}
            value={pinInput}
            onChange={e => { setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinError(false) }}
            onKeyDown={e => e.key === 'Enter' && checkPin()}
            placeholder="••••"
            style={{
              width: "100%", padding: "16px", borderRadius: 12, textAlign: "center",
              fontSize: 28, letterSpacing: "0.5em", border: `2px solid ${pinError ? '#dc2626' : '#f0d0d8'}`,
              outline: "none", marginBottom: 12, fontFamily: "'Inter',sans-serif", color: "#3d1a2a",
            }}
          />
          {pinError && <div style={{ color: "#dc2626", fontSize: 12, marginBottom: 12 }}>Incorrect PIN. Please try again.</div>}
          <button onClick={checkPin} style={{
            width: "100%", padding: "14px", borderRadius: 12, border: "none", cursor: "pointer",
            background: "linear-gradient(135deg,#c4607a,#e08090)", color: "#fff", fontWeight: 600, fontSize: 14,
          }}>
            Unlock Dashboard
          </button>
        </motion.div>
      </div>
    )
  }

  // ── DASHBOARD ──
  const accepted = rsvps.filter(r => r.response === 'yes')
  const declined = rsvps.filter(r => r.response === 'no')
  const drinkingYes = accepted.filter(r => r.drinking === 'yes').length
  const drinkingNo = accepted.filter(r => r.drinking === 'no').length
  const totalGuests = accepted.reduce((sum, r) => sum + (r.guest_count || 1), 0)

  const filteredRsvps = rsvps.filter(r =>
    r.guest_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ minHeight: "100vh", background: "#fdf0f0", fontFamily: "'Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Inter:wght@300;400;500;600&display=swap');`}</style>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "2.5rem", color: "#3d1a2a" }}>
            {couple.bride} <span style={{ color: "#c4607a" }}>&amp;</span> {couple.groom}
          </div>
          <div style={{ fontSize: 12, color: "#9a7080", letterSpacing: "0.1em", marginTop: 4 }}>
            Your Wedding Dashboard
          </div>
        </div>

        {/* Stats cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginBottom: 12 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 16px", textAlign: "center", boxShadow: "0 2px 16px rgba(200,120,140,0.08)" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#16a34a" }}>{accepted.length}</div>
            <div style={{ fontSize: 11, color: "#9a7080", marginTop: 4 }}>✓ RSVPs Accepted</div>
          </div>
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 16px", textAlign: "center", boxShadow: "0 2px 16px rgba(200,120,140,0.08)" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#dc2626" }}>{declined.length}</div>
            <div style={{ fontSize: 11, color: "#9a7080", marginTop: 4 }}>✗ Declined</div>
          </div>
        </div>

        {/* Total guests highlight */}
        <div style={{ background: "linear-gradient(135deg,#c4607a,#e08090)", borderRadius: 16, padding: "20px 16px", textAlign: "center", marginBottom: 16, boxShadow: "0 4px 20px rgba(196,96,122,0.25)" }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#fff" }}>{totalGuests}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 4, fontWeight: 500 }}>Total Guests Attending (including families)</div>
        </div>

        {/* Liquor count cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "16px", textAlign: "center", boxShadow: "0 2px 16px rgba(200,120,140,0.08)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🍷</span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#3d1a2a" }}>{drinkingYes}</div>
              <div style={{ fontSize: 10, color: "#9a7080" }}>Drinking Alcohol</div>
            </div>
          </div>
          <div style={{ background: "#fff", borderRadius: 16, padding: "16px", textAlign: "center", boxShadow: "0 2px 16px rgba(200,120,140,0.08)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🥤</span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#3d1a2a" }}>{drinkingNo}</div>
              <div style={{ fontSize: 10, color: "#9a7080" }}>Non-Alcoholic</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 20 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search guest by name..."
            style={{
              width: "100%", padding: "12px 18px", borderRadius: 12,
              border: "1px solid #f0d0d8", background: "#fff", color: "#3d1a2a",
              fontSize: 14, outline: "none", fontFamily: "'Inter',sans-serif",
            }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button onClick={loadData} style={{
            fontSize: 12, color: "#c4607a", background: "transparent", border: "none",
            cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: 6,
          }}>
            ↻ Refresh
          </button>
        </div>

        {/* RSVP List */}
        {filteredRsvps.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, background: "#fff", borderRadius: 16, color: "#9a7080" }}>
            {rsvps.length === 0 ? "No RSVP responses yet. Share your invitation link with guests!" : "No guests match your search."}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {filteredRsvps.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                style={{
                  background: "#fff", borderRadius: 12, padding: "14px 18px",
                  display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10,
                  boxShadow: "0 2px 10px rgba(200,120,140,0.06)",
                }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#3d1a2a" }}>{r.guest_name}</div>
                    {r.response === 'yes' && r.guest_count > 1 && (
                      <div style={{
                        padding: "2px 9px", borderRadius: 100, fontSize: 11, fontWeight: 600,
                        background: "#f3e8ff", color: "#7c3aed",
                      }}>
                        👥 {r.guest_count}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "#c4a0b0", marginTop: 2 }}>
                    {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} at{' '}
                    {new Date(r.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {r.response === 'yes' && r.drinking && (
                    <div style={{
                      padding: "6px 12px", borderRadius: 100, fontSize: 11, fontWeight: 600,
                      background: r.drinking === 'yes' ? '#fef3c7' : '#e0f2fe',
                      color: r.drinking === 'yes' ? '#b45309' : '#0369a1',
                    }}>
                      {r.drinking === 'yes' ? '🍷 Drinks' : '🥤 No Drinks'}
                    </div>
                  )}
                  <div style={{
                    padding: "6px 14px", borderRadius: 100, fontSize: 12, fontWeight: 600,
                    background: r.response === 'yes' ? '#dcfce7' : '#fee2e2',
                    color: r.response === 'yes' ? '#16a34a' : '#dc2626',
                  }}>
                    {r.response === 'yes' ? '✓ Attending' : '✗ Not Attending'}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 40, fontSize: 11, color: "#c4a0b0" }}>
          Auto-refreshes every 30 seconds · InviteGlow Dashboard
        </div>
      </div>
    </div>
  )
}