"use client"

const PINK = "#c4607a"
const RED = "#e0355c"

export default function CheckoutCancelPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',sans-serif", padding: 24, background: '#fdf7f8' }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '48px 36px', textAlign: 'center', maxWidth: 420, boxShadow: '0 8px 32px rgba(196,96,122,0.12)' }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </div>
        <div style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Payment cancelled</div>
        <div style={{ fontSize: 13.5, color: '#64748b', marginBottom: 24, lineHeight: 1.6 }}>
          No worries — nothing was charged. You can try again anytime from your dashboard, or pay by bank transfer instead.
        </div>
        <a href="/my-invitations" style={{
          display: 'inline-flex', padding: '12px 28px', borderRadius: 100, textDecoration: 'none',
          background: `linear-gradient(135deg,${PINK},${RED})`, color: '#fff', fontWeight: 700, fontSize: 13.5,
        }}>Back to my dashboard</a>
      </div>
    </div>
  )
}
