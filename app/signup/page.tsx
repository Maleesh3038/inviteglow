"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const ACCENT = "#c4607a"
const ACCENT_LIGHT = "#e8a0b8"

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px', borderRadius: 12, border: '1px solid #e2e8f0',
    fontSize: 14, outline: 'none', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box', color: '#1e293b',
  }
  const labelStyle: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block' }

  const handleSignup = async () => {
    setError('')
    if (!fullName.trim() || !email.trim() || !password) { setError('Please fill in your name, email, and password.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirmPassword) { setError("Passwords don't match."); return }

    setLoading(true)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim(), phone: phone.trim() } },
    })
    setLoading(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }
    if (data.user) {
      router.push('/create')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fdf2f8', fontFamily: "'Inter',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Inter:wght@400;500;600;700&display=swap');`}</style>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: '2.2rem', color: ACCENT }}>InviteGlow</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Create your account to start designing your invitation</div>
        </div>

        <div style={{ background: '#fff', borderRadius: 24, padding: 32, boxShadow: '0 8px 32px rgba(196,96,122,0.12)' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Full Name</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Anusha Perera" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Phone Number (optional)</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="077 123 4567" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div>
              <label style={labelStyle}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Confirm</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
            </div>
          </div>

          {error && <div style={{ fontSize: 12.5, color: '#dc2626', marginBottom: 16 }}>{error}</div>}

          <button onClick={handleSignup} disabled={loading} style={{
            width: '100%', padding: 14, borderRadius: 100, border: 'none', cursor: 'pointer',
            background: `linear-gradient(135deg,${ACCENT},${ACCENT_LIGHT})`, color: '#fff', fontWeight: 700, fontSize: 14,
            opacity: loading ? 0.6 : 1,
          }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#64748b' }}>
            Already have an account? <a href="/login" style={{ color: ACCENT, fontWeight: 600, textDecoration: 'none' }}>Log in</a>
          </div>
        </div>
      </div>
    </div>
  )
}
