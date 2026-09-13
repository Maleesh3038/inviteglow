import { supabase } from '@/lib/supabase'

// Route: app/pass/[id]/page.tsx
// Public, read-only "what does this QR mean" page. Anyone scanning a
// guest's entry-pass QR with an ordinary camera app lands here and sees
// just the guest's name + EPF number nicely — no attendance is marked by
// visiting this page. Only the event's own check-in dashboard
// (/event-dashboard/[slug]) actually marks someone checked in, by
// scanning the same QR through its own camera flow.
export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ id: string }>
}

const ACCENT = '#1c3d5a'
const ACCENT_LIGHT = '#c9a227'

export default async function PassPage({ params }: Props) {
  const { id } = await params
  const { data: guest } = await supabase.from('event_guests').select('*').eq('id', id).single()

  if (!guest) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f5ef', fontFamily: "'Inter',sans-serif", color: '#94a3b8', textAlign: 'center', padding: 24 }}>
        <div>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🎫</div>
          <div>This pass could not be found.</div>
        </div>
      </div>
    )
  }

  const g = guest as any
  const { data: event } = await supabase.from('events').select('title,host,event_date,venue').eq('id', g.event_id).single()
  const e = event as any
  const eventDate = e?.event_date
    ? new Date(e.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <div style={{
      minHeight: '100vh', background: `radial-gradient(ellipse 90% 70% at 50% 0%, ${ACCENT} 0%, #0f2438 70%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Inter',sans-serif",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');`}</style>
      <div style={{ background: '#fff', borderRadius: 22, padding: '34px 28px', maxWidth: 360, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: ACCENT_LIGHT, fontWeight: 700, marginBottom: 10 }}>Entry Pass</div>
        {e?.title && <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.35rem', color: ACCENT, marginBottom: 4 }}>{e.title}</div>}
        {(eventDate || e?.venue) && (
          <div style={{ fontSize: 12, color: '#7c8a99', marginBottom: 22 }}>{[eventDate, e?.venue].filter(Boolean).join(' · ')}</div>
        )}
        <div style={{ background: '#f7f5ef', borderRadius: 16, padding: '20px 18px' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7c8a99', marginBottom: 6 }}>Guest</div>
          <div style={{ fontSize: 21, fontWeight: 700, color: '#0f2438', marginBottom: 16 }}>{g.guest_name}</div>
          <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7c8a99', marginBottom: 6 }}>EPF No.</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: ACCENT }}>{g.epf_no || '—'}</div>
        </div>
        <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 20, lineHeight: 1.7 }}>
          This pass is checked in only through the event's official check-in desk.
        </div>
      </div>
    </div>
  )
}
