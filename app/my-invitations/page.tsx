"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const ACCENT = "#c4607a"
const ACCENT_LIGHT = "#e8a0b8"

type MyCouple = {
  id: string; slug: string; bride: string; groom: string; wedding_date: string; template: string
  project_status: string; payment_slip_status: string
}

export default function MyInvitationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [couples, setCouples] = useState<MyCouple[]>([])
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }
      setUserEmail(userData.user.email || '')
      const { data } = await supabase.from('couples').select('id, slug, bride, groom, wedding_date, template, project_status, payment_slip_status').eq('user_id', userData.user.id).order('created_at', { ascending: false })
      if (data) setCouples(data as MyCouple[])
      setLoading(false)
    }
    load()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const statusMeta: Record<string, { label: string; bg: string; color: string }> = {
    lead: { label: 'Under Review', bg: '#fef3c7', color: '#b45309' },
    ongoing: { label: 'In Progress', bg: '#dbeafe', color: '#1d4ed8' },
    complete: { label: 'Live', bg: '#dcfce7', color: '#16a34a' },
    sample: { label: 'Sample', bg: '#ede9fe', color: '#6d28d9' },
  }
  const slipMeta: Record<string, { label: string; bg: string; color: string }> = {
    pending: { label: 'Payment slip pending review', bg: '#fef3c7', color: '#b45309' },
    verified: { label: 'Payment verified', bg: '#dcfce7', color: '#16a34a' },
    rejected: { label: 'Payment slip rejected — contact us', bg: '#fee2e2', color: '#dc2626' },
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',sans-serif", color: '#94a3b8' }}>Loading...</div>
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: '1.7rem', color: ACCENT }}>InviteGlow</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 12.5, color: '#64748b' }}>{userEmail}</span>
          <button onClick={handleLogout} style={{ fontSize: 12.5, color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Log out</button>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Your Invitations</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Manage and preview your wedding invitations here.</div>
          </div>
          {couples.length === 0 && (
            <a href="/create" style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '11px 20px', borderRadius: 100, textDecoration: 'none',
              background: `linear-gradient(135deg,${ACCENT},${ACCENT_LIGHT})`, color: '#fff', fontWeight: 700, fontSize: 13,
            }}>+ New Invitation</a>
          )}
        </div>

        {couples.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 20, padding: 48, textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>Start your first invitation</div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Design your wedding invitation in a few simple steps.</div>
            <a href="/create" style={{
              display: 'inline-flex', padding: '12px 24px', borderRadius: 100, textDecoration: 'none',
              background: `linear-gradient(135deg,${ACCENT},${ACCENT_LIGHT})`, color: '#fff', fontWeight: 700, fontSize: 13.5,
            }}>Create Invitation</a>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {couples.map(c => {
              const pMeta = statusMeta[c.project_status] || statusMeta.lead
              const sMeta = c.payment_slip_status ? slipMeta[c.payment_slip_status] : null
              return (
                <div key={c.id} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{c.bride} &amp; {c.groom}</div>
                      <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 2 }}>
                        {new Date(c.wedding_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · {c.template.replace(/-/g, ' ')}
                      </div>
                    </div>
                    <div style={{ padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: pMeta.bg, color: pMeta.color, whiteSpace: 'nowrap' }}>{pMeta.label}</div>
                  </div>
                  {sMeta && (
                    <div style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: sMeta.color, background: sMeta.bg, display: 'inline-block', padding: '4px 12px', borderRadius: 100 }}>{sMeta.label}</div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                    <a href={`/invite/${c.slug}`} target="_blank" rel="noopener noreferrer" style={{
                      padding: '8px 16px', borderRadius: 100, fontSize: 12.5, fontWeight: 600, textDecoration: 'none',
                      border: `1.5px solid ${ACCENT}`, color: ACCENT,
                    }}>Preview Invitation</a>
                    <a href={`/dashboard/${c.slug}`} target="_blank" rel="noopener noreferrer" style={{
                      padding: '8px 16px', borderRadius: 100, fontSize: 12.5, fontWeight: 600, textDecoration: 'none',
                      background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0',
                    }}>Open Dashboard</a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
