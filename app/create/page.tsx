"use client"
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const ACCENT = "#c4607a"
const ACCENT_LIGHT = "#e8a0b8"
const BUCKET = 'wedding-photos'

const TEMPLATE_OPTIONS = [
  { id: 'floral-romance', name: 'Floral Romance' },
  { id: 'elegant-photo', name: 'Elegant Photo Hero' },
  { id: 'cinematic-gold', name: 'Cinematic Gold' },
  { id: 'kandyan-heritage', name: 'Kandyan Heritage' },
  { id: 'twilight-picnic', name: 'Twilight Picnic' },
  { id: 'golden-garden', name: 'Golden Garden' },
  { id: 'ocean-pearl', name: 'Ocean Pearl' },
  { id: 'sunset-shores', name: 'Sunset Shores' },
  { id: 'traditional-ceylon', name: 'Traditional Ceylon' },
  { id: 'sacred-poruwa', name: 'Sacred Poruwa' },
  { id: 'blush-blossom', name: 'Blush Blossom' },
  { id: 'ceylon-elegance', name: 'Ceylon Elegance' },
  { id: 'eternal-bloom', name: 'Eternal Bloom' },
]

const DEFAULT_PACKAGES = [
  { id: 'basic', name: 'Basic', price: 2500 },
  { id: 'standard', name: 'Standard', price: 5000 },
  { id: 'premium', name: 'Premium', price: 10000 },
]

const BANK_ACCOUNTS = [
  { bank: 'Sampath Bank', accountName: 'InviteGlow (Pvt) Ltd', accountNumber: '1234 5678 9012' },
  { bank: 'HNB', accountName: 'InviteGlow (Pvt) Ltd', accountNumber: '9876 5432 1098' },
]

function slugify(bride: string, groom: string): string {
  const base = `${bride}-${groom}`.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base}-${suffix}`
}

function generatePin(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
}

export default function CreateInvitationWizard() {
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userPhone, setUserPhone] = useState('')

  const [step, setStep] = useState(1)
  const [bride, setBride] = useState('')
  const [groom, setGroom] = useState('')
  const [weddingDate, setWeddingDate] = useState('')
  const [template, setTemplate] = useState('floral-romance')
  const [packages, setPackages] = useState(DEFAULT_PACKAGES)
  const [selectedPackage, setSelectedPackage] = useState('standard')
  const [slipFile, setSlipFile] = useState<File | null>(null)
  const [slipUploading, setSlipUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) { router.push('/login'); return }
      setUserId(data.user.id)
      setUserEmail(data.user.email || '')
      setUserName((data.user.user_metadata as any)?.full_name || '')
      setUserPhone((data.user.user_metadata as any)?.phone || '')
      setCheckingAuth(false)
    }
    check()
  }, [router])

  useEffect(() => {
    const loadPlans = async () => {
      const { data } = await supabase.from('pricing_plans').select('*').order('display_order', { ascending: true })
      if (data && data.length > 0) {
        setPackages(data.map((p: any) => ({ id: p.id, name: p.name, price: p.price })))
        setSelectedPackage(data[Math.min(1, data.length - 1)]?.id || data[0].id)
      }
    }
    loadPlans()
  }, [])

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px', borderRadius: 12, border: '1px solid #e2e8f0',
    fontSize: 14, outline: 'none', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box', color: '#1e293b',
  }
  const labelStyle: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block' }

  const handleSubmit = async () => {
    setError('')
    if (!bride.trim() || !groom.trim() || !weddingDate) { setError('Please fill in the bride, groom, and wedding date.'); return }
    if (!slipFile) { setError('Please upload your bank transfer slip to continue.'); return }
    if (!userId) return

    setSubmitting(true)

    setSlipUploading(true)
    const ext = slipFile.name.split('.').pop()
    const fileName = `payment-slips/${userId}-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(fileName, slipFile, { cacheControl: '3600', upsert: false })
    setSlipUploading(false)
    if (uploadError) {
      setSubmitting(false)
      setError('Could not upload your slip: ' + uploadError.message)
      return
    }
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName)

    const slug = slugify(bride, groom)
    const { error: insertError } = await supabase.from('couples').insert([{
      slug,
      template,
      bride: bride.trim(),
      groom: groom.trim(),
      wedding_date: weddingDate,
      pin: generatePin(),
      user_id: userId,
      customer_name: userName || null,
      customer_email: userEmail || null,
      customer_phone: userPhone || null,
      package_tier: selectedPackage,
      payment_slip_url: urlData.publicUrl,
      payment_slip_status: 'pending',
      project_status: 'lead',
      payment_status: 'unpaid',
    }])

    setSubmitting(false)
    if (insertError) {
      setError('Could not create your invitation: ' + insertError.message)
      return
    }
    router.push('/my-invitations')
  }

  if (checkingAuth) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',sans-serif", color: '#94a3b8' }}>Loading...</div>
  }

  const steps = [
    { n: 1, label: 'Your details' },
    { n: 2, label: 'Pick a template' },
    { n: 3, label: 'Package and payment' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#fdf2f8', fontFamily: "'Inter',sans-serif", padding: '40px 20px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Inter:wght@400;500;600;700&display=swap');`}</style>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: '2rem', color: ACCENT }}>InviteGlow</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Let's build your wedding invitation</div>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
          {steps.map((s, i) => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: i < steps.length - 1 ? 1 : undefined }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: step >= s.n ? ACCENT : '#fff', color: step >= s.n ? '#fff' : '#94a3b8',
                border: step >= s.n ? 'none' : '1.5px solid #e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 700,
              }}>{s.n}</div>
              <span style={{ fontSize: 12, fontWeight: step === s.n ? 700 : 500, color: step >= s.n ? '#1e293b' : '#94a3b8', whiteSpace: 'nowrap' }}>{s.label}</span>
              {i < steps.length - 1 && <div style={{ height: 1.5, background: step > s.n ? ACCENT : '#e2e8f0', flex: 1, marginLeft: 6 }} />}
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 24, padding: 28, boxShadow: '0 8px 32px rgba(196,96,122,0.12)' }}>

          {step === 1 && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 18 }}>Tell us about your wedding</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Bride's Name</label>
                  <input value={bride} onChange={e => setBride(e.target.value)} placeholder="Anusha" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Groom's Name</label>
                  <input value={groom} onChange={e => setGroom(e.target.value)} placeholder="Sadun" style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Wedding Date</label>
                <input type="date" value={weddingDate} onChange={e => setWeddingDate(e.target.value)} style={inputStyle} />
              </div>
              <button onClick={() => { setError(''); if (!bride.trim() || !groom.trim() || !weddingDate) { setError('Please fill in all fields.'); return } setStep(2) }} style={{
                width: '100%', padding: 14, borderRadius: 100, border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg,${ACCENT},${ACCENT_LIGHT})`, color: '#fff', fontWeight: 700, fontSize: 14,
              }}>Continue</button>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>Choose your template</div>
              <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 18 }}>You can preview and even switch templates later from your dashboard.</div>
              <label style={labelStyle}>Template</label>
              <select value={template} onChange={e => setTemplate(e.target.value)} style={{ ...inputStyle, marginBottom: 20 }}>
                {TEMPLATE_OPTIONS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: 13, borderRadius: 100, border: '1.5px solid #e2e8f0', cursor: 'pointer', background: '#fff', color: '#475569', fontWeight: 600, fontSize: 13.5 }}>Back</button>
                <button onClick={() => setStep(3)} style={{
                  flex: 2, padding: 13, borderRadius: 100, border: 'none', cursor: 'pointer',
                  background: `linear-gradient(135deg,${ACCENT},${ACCENT_LIGHT})`, color: '#fff', fontWeight: 700, fontSize: 13.5,
                }}>Continue</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>Choose your package</div>
              <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 14 }}>Transfer to one of our accounts below and upload your slip — we'll confirm and activate your invitation shortly.</div>

              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${packages.length},1fr)`, gap: 8, marginBottom: 20 }}>
                {packages.map(p => (
                  <button key={p.id} type="button" onClick={() => setSelectedPackage(p.id)} style={{
                    padding: '12px 8px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                    border: selectedPackage === p.id ? `2px solid ${ACCENT}` : '1px solid #e2e8f0',
                    background: selectedPackage === p.id ? '#fdf2f8' : '#fff',
                  }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1e293b' }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: ACCENT, fontWeight: 600, marginTop: 2 }}>Rs. {p.price.toLocaleString()}</div>
                  </button>
                ))}
              </div>

              <div style={{ background: '#f8fafc', borderRadius: 14, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 10 }}>Bank Transfer Details</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {BANK_ACCOUNTS.map(b => (
                    <div key={b.bank} style={{ background: '#fff', borderRadius: 10, padding: 12, border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1e293b' }}>{b.bank}</div>
                      <div style={{ fontSize: 11.5, color: '#64748b' }}>{b.accountName}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: ACCENT, marginTop: 2 }}>{b.accountNumber}</div>
                    </div>
                  ))}
                </div>
              </div>

              <label style={labelStyle}>Upload Payment Slip</label>
              <div onClick={() => fileInputRef.current?.click()} style={{
                border: `1.5px dashed ${ACCENT}`, borderRadius: 12, padding: '18px 14px', textAlign: 'center', cursor: 'pointer',
                background: '#fdf2f8', marginBottom: 16,
              }}>
                {slipFile ? (
                  <div style={{ fontSize: 12.5, color: '#1e293b', fontWeight: 600 }}>{slipFile.name}</div>
                ) : (
                  <div style={{ fontSize: 12.5, color: '#64748b' }}>Tap to select an image of your bank slip</div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setSlipFile(e.target.files?.[0] || null)} />
              </div>

              {error && <div style={{ fontSize: 12.5, color: '#dc2626', marginBottom: 14 }}>{error}</div>}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(2)} style={{ flex: 1, padding: 13, borderRadius: 100, border: '1.5px solid #e2e8f0', cursor: 'pointer', background: '#fff', color: '#475569', fontWeight: 600, fontSize: 13.5 }}>Back</button>
                <button onClick={handleSubmit} disabled={submitting} style={{
                  flex: 2, padding: 13, borderRadius: 100, border: 'none', cursor: 'pointer',
                  background: `linear-gradient(135deg,${ACCENT},${ACCENT_LIGHT})`, color: '#fff', fontWeight: 700, fontSize: 13.5,
                  opacity: submitting ? 0.6 : 1,
                }}>
                  {submitting ? (slipUploading ? 'Uploading slip...' : 'Creating...') : 'Submit Invitation'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
