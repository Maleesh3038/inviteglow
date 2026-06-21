"use client"
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase, Couple } from '@/lib/supabase'
import FloralRomanceTemplate from '@/components/templates/FloralRomanceTemplate'
import ElegantPhotoTemplate from '@/components/templates/ElegantPhotoTemplate'

export default function InvitePage() {
  const params = useParams()
  const slug = params.slug as string

  const [couple, setCouple] = useState<Couple | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from('couples').select('*').eq('slug', slug).single()
      if (error || !data) { setNotFound(true) } else { setCouple(data as Couple) }
      setLoading(false)
    }
    load()
  }, [slug])

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fdf0f0", fontFamily: "'Inter',sans-serif", color: "#c4607a" }}>
        Loading invitation...
      </div>
    )
  }

  if (notFound || !couple) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fdf0f0", fontFamily: "'Inter',sans-serif", color: "#3d1a2a", textAlign: "center", padding: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💔</div>
        <div style={{ fontFamily: "'Great Vibes',cursive", fontSize: "2rem", color: "#c4607a", marginBottom: 8 }}>Invitation Not Found</div>
        <div style={{ fontSize: 14, color: "#9a7080" }}>This invitation link doesn't exist or may have been removed.</div>
      </div>
    )
  }

  // ── Pick the right template based on what was selected in the admin panel ──
  switch (couple.template) {
    case 'cinematic-gold':
      // Not built yet — falls back to floral for now
      return <FloralRomanceTemplate couple={couple} />
    case 'kandyan-heritage':
      // Not built yet — falls back to floral for now
      return <FloralRomanceTemplate couple={couple} />
    case 'garden-minimal':
    case 'floral-romance':
      return <FloralRomanceTemplate couple={couple} />
    case 'elegant-photo':
      return <ElegantPhotoTemplate couple={couple} />
    default:
      return <FloralRomanceTemplate couple={couple} />
  }
}