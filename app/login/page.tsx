"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const ACCENT = "#c4607a"
const ACCENT_LIGHT = "#e8a0b8"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px', borderRadius: 12, border: '1px solid #e2e8f0',
    fontSize: 14, outline: 'none', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box', color: '#1e293b',
  }
  const labelStyle: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block' }

  const handleLogin = async () => {
    setError('')
    if (!email.trim() || !password) { setError('Please enter your email and password.'); return }
    setLoading(true)
    const { error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (loginError) { setError('Incorrect email or password.'); return }
    router.push('/my-invitations')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fdf2f8', fontFamily: "'Inter',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Inter:wght@400;500;600;700&display=swap');`}</style>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: '2.2rem', color: ACCENT }}>InviteGlow</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Log in to manage your invitation</div>
        </div>

        <div style={{ background: '#fff', borderRadius: 24, padding: 32, boxShadow: '0 8px 32px rgba(196,96,122,0.12)' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>

          {error && <div style={{ fontSize: 12.5, color: '#dc2626', marginBottom: 16 }}>{error}</div>}

          <button onClick={handleLogin} disabled={loading} style={{
            width: '100%', padding: 14, borderRadius: 100, border: 'none', cursor: 'pointer',
            background: `linear-gradient(135deg,${ACCENT},${ACCENT_LIGHT})`, color: '#fff', fontWeight: 700, fontSize: 14,
            opacity: loading ? 0.6 : 1,
          }}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#64748b' }}>
            Don't have an account? <a href="/signup" style={{ color: ACCENT, fontWeight: 600, textDecoration: 'none' }}>Sign up</a>
          </div>
        </div>
      </div>
    </div>
  )
}
