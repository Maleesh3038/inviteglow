"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const ACCENT = "#c4607a"
const ACCENT_LIGHT = "#e8a0b8"

// New self-service signups get every template unlocked in their own
// dashboard's "Change Template" picker (already built) — they choose
// their design after creating the account, not during this wizard.
const ALL_TEMPLATE_IDS = [
  'floral-romance', 'elegant-photo', 'cinematic-gold', 'kandyan-heritage', 'twilight-picnic',
  'golden-garden', 'ocean-pearl', 'sunset-shores', 'traditional-ceylon', 'sacred-poruwa',
  'blush-blossom', 'ceylon-elegance', 'eternal-bloom',
]

function slugify(bride: string, groom: string): string {
  const base = `${bride}-${groom}`.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base}-${suffix}`
}

function generatePin(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
}

const STEPS = [
  { n: 1, label: "Couple's Names" },
  { n: 2, label: 'Wedding Details' },
  { n: 3, label: 'Your Account' },
]

export default function CreateInvitationWizard() {
  const router = useRouter()
  const [step, setStep] = useState(1)

  const [bride, setBride] = useState('')
  const [groom, setGroom] = useState('')
  const [weddingDate, setWeddingDate] = useState('')
  const [venue, setVenue] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px 13px 40px', borderRadius: 12, border: '1.5px solid #e2e8f0',
    fontSize: 14, outline: 'none', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box', color: '#1e293b',
  }
  const labelStyle: React.CSSProperties = { fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 6, display: 'block' }
  const fieldWrap: React.CSSProperties = { position: 'relative', marginBottom: 16 }

  const FieldIcon = ({ name }: { name: 'user' | 'calendar' | 'pin' | 'mail' | 'phone' | 'lock' }) => {
    const common = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: '#94a3b8', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
    const icons: Record<string, React.ReactElement> = {
      user: <svg {...common}><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0116 0" /></svg>,
      calendar: <svg {...common}><rect x="3.5" y="5" width="17" height="16" rx="2.5" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /></svg>,
      pin: <svg {...common}><path d="M12 22s7-7.5 7-12.5A7 7 0 105 9.5C5 14.5 12 22 12 22z" /><circle cx="12" cy="9.5" r="2.5" /></svg>,
      mail: <svg {...common}><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M3.5 6.5L12 13l8.5-6.5" /></svg>,
      phone: <svg {...common}><path d="M15 2H9a2 2 0 00-2 2v16a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2z" /><path d="M11 18h2" /></svg>,
      lock: <svg {...common}><rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M7.5 10.5V7a4.5 4.5 0 019 0v3.5" /></svg>,
    }
    return <div style={{ position: 'absolute', left: 13, top: 13 }}>{icons[name]}</div>
  }

  const validateStep1 = () => { if (!bride.trim() || !groom.trim()) { setError('Please enter both names.'); return false }; setError(''); return true }
  const validateStep2 = () => { if (!weddingDate) { setError('Please pick your wedding date.'); return false }; setError(''); return true }

  const handleCreateAccount = async () => {
    setError('')
    if (!email.trim()) { setError('Please enter your email address.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }

    setSubmitting(true)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: `${bride.trim()} & ${groom.trim()}`, phone: mobile.trim() } },
    })
    if (signUpError || !data.user) {
      setSubmitting(false)
      setError(signUpError?.message || 'Could not create your account. Please try again.')
      return
    }

    const slug = slugify(bride, groom)
    const { error: insertError } = await supabase.from('couples').insert([{
      slug,
      template: 'floral-romance',
      bride: bride.trim(),
      groom: groom.trim(),
      wedding_date: weddingDate,
      venue: venue.trim() || null,
      pin: generatePin(),
      user_id: data.user.id,
      customer_name: `${bride.trim()} & ${groom.trim()}`,
      customer_email: email.trim(),
      customer_phone: mobile.trim() || null,
      project_status: 'lead',
      payment_slip_status: 'pending',
      enable_template_switch: true,
      allowed_templates: ALL_TEMPLATE_IDS,
    }])
    setSubmitting(false)

    if (insertError) {
      setError('Account created, but we could not save your invitation: ' + insertError.message)
      return
    }
    router.push('/my-invitations')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#fdf2f8,#fffaf5)', fontFamily: "'Inter',sans-serif", padding: '48px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        input:focus, select:focus { border-color: ${ACCENT} !important; box-shadow: 0 0 0 3px ${ACCENT}22; }
      `}</style>

      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 23, fontWeight: 800, color: '#0f172a' }}>
          <span style={{ color: ACCENT, fontSize: 20 }}>♥</span> Invite<span style={{ color: ACCENT }}>Glow</span>
        </div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Let's create your wedding invitation</div>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '20px 0 8px', width: '100%', maxWidth: 380 }}>
        {STEPS.map((s, i) => (
          <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : undefined }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff',
              background: step > s.n ? '#16a34a' : step === s.n ? ACCENT : '#e2e8f0',
            }}>
              {step > s.n ? '✓' : s.n}
            </div>
            {i < STEPS.length - 1 && <div style={{ height: 2, flex: 1, background: step > s.n ? '#16a34a' : '#e2e8f0', marginLeft: 4 }} />}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: 380, marginBottom: 24 }}>
        {STEPS.map(s => (
          <span key={s.n} style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: step === s.n ? ACCENT : '#cbd5e1', width: 90, textAlign: s.n === 1 ? 'left' : s.n === 3 ? 'right' : 'center' }}>
            {s.label}
          </span>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 24, padding: '32px 28px', boxShadow: '0 8px 32px rgba(196,96,122,0.12)', width: '100%', maxWidth: 380 }}>

        {error && (
          <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: 12.5, padding: '10px 14px', borderRadius: 10, marginBottom: 18, lineHeight: 1.5 }}>
            {error}
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: '#fdf2f8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 22, color: ACCENT }}>♥</div>
          {step === 1 && <>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Introduce the happy couple</div>
            <div style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 4 }}>Tell us the bride and groom's names</div>
          </>}
          {step === 2 && <>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>When and where?</div>
            <div style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 4 }}>Wedding date and venue</div>
          </>}
          {step === 3 && <>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Create your account</div>
            <div style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 4 }}>Almost done — just a few more details.</div>
          </>}
        </div>

        {step === 1 && (
          <div>
            <label style={labelStyle}>Bride's Name</label>
            <div style={fieldWrap}>
              <FieldIcon name="user" />
              <input value={bride} onChange={e => setBride(e.target.value)} placeholder="Enter bride's name" style={inputStyle} />
            </div>
            <label style={labelStyle}>Groom's Name</label>
            <div style={fieldWrap}>
              <FieldIcon name="user" />
              <input value={groom} onChange={e => setGroom(e.target.value)} placeholder="Enter groom's name" style={inputStyle} />
            </div>
            <button onClick={() => validateStep1() && setStep(2)} style={{
              width: '100%', padding: 14, borderRadius: 100, border: 'none', cursor: 'pointer', marginTop: 8,
              background: bride.trim() && groom.trim() ? `linear-gradient(135deg,${ACCENT},${ACCENT_LIGHT})` : '#f3c9d5',
              color: '#fff', fontWeight: 700, fontSize: 14,
            }}>Continue →</button>
          </div>
        )}

        {step === 2 && (
          <div>
            <label style={labelStyle}>Wedding Date</label>
            <div style={fieldWrap}>
              <FieldIcon name="calendar" />
              <input type="date" value={weddingDate} onChange={e => setWeddingDate(e.target.value)} style={inputStyle} />
            </div>
            <label style={labelStyle}>Venue</label>
            <div style={fieldWrap}>
              <FieldIcon name="pin" />
              <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="e.g. Cinnamon Grand, Colombo" style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: 13, borderRadius: 100, border: '1.5px solid #e2e8f0', cursor: 'pointer', background: '#fff', color: '#475569', fontWeight: 600, fontSize: 13.5 }}>← Back</button>
              <button onClick={() => validateStep2() && setStep(3)} style={{
                flex: 2, padding: 13, borderRadius: 100, border: 'none', cursor: 'pointer',
                background: weddingDate ? `linear-gradient(135deg,${ACCENT},${ACCENT_LIGHT})` : '#f3c9d5',
                color: '#fff', fontWeight: 700, fontSize: 13.5,
              }}>Continue →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <label style={labelStyle}>Email Address</label>
            <div style={fieldWrap}>
              <FieldIcon name="mail" />
              <input type="email" autoComplete="email" name="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} />
            </div>
            <label style={labelStyle}>Mobile Number</label>
            <div style={fieldWrap}>
              <FieldIcon name="phone" />
              <input type="tel" autoComplete="tel" name="mobile-number" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="077 123 4567" style={inputStyle} />
            </div>
            <label style={labelStyle}>Password</label>
            <div style={fieldWrap}>
              <FieldIcon name="lock" />
              <input type="password" autoComplete="new-password" name="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={() => setStep(2)} disabled={submitting} style={{ flex: 1, padding: 13, borderRadius: 100, border: '1.5px solid #e2e8f0', cursor: 'pointer', background: '#fff', color: '#475569', fontWeight: 600, fontSize: 13.5 }}>← Back</button>
              <button onClick={handleCreateAccount} disabled={submitting} style={{
                flex: 2, padding: 13, borderRadius: 100, border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg,${ACCENT},${ACCENT_LIGHT})`, color: '#fff', fontWeight: 700, fontSize: 13.5,
                opacity: submitting ? 0.6 : 1,
              }}>{submitting ? 'Creating...' : '✨ Create my account'}</button>
            </div>
          </div>
        )}

      </div>

      <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12.5, color: '#94a3b8' }}>
        Already have an account? <a href="/login" style={{ color: ACCENT, fontWeight: 600, textDecoration: 'none' }}>Sign in</a>
      </div>
    </div>
  )
}
