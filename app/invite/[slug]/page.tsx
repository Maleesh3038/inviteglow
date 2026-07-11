"use client"
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase, Couple } from '@/lib/supabase'
import FloralRomanceTemplate from '@/components/templates/FloralRomanceTemplate'
import ElegantPhotoTemplate from '@/components/templates/ElegantPhotoTemplate'
import CinematicGoldTemplate from '@/components/templates/CinematicGoldTemplate'
import KandyanHeritageTemplate from '@/components/templates/KandyanHeritageTemplate'
import TwilightPicnicTemplate from '@/components/templates/TwilightPicnicTemplate'
import GoldenGardenTemplate from '@/components/templates/GoldenGardenTemplate'
import OceanPearlTemplate from '@/components/templates/OceanPearlTemplate'
import SunsetShoresTemplate from '@/components/templates/SunsetShoresTemplate'
import SacredPoruwaTemplate from '@/components/templates/SacredPoruwaTemplate'
import TraditionalCeylonTemplate from '@/components/templates/TraditionalCeylonTemplate'
import BlushBlossomTemplate from '@/components/templates/BlushBlossomTemplate'
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
    case 'elegant-photo':
      return <ElegantPhotoTemplate couple={couple} />
    case 'cinematic-gold':
      return <CinematicGoldTemplate couple={couple} />
    case 'kandyan-heritage':
      return <KandyanHeritageTemplate couple={couple} />
    case 'twilight-picnic':
      return <TwilightPicnicTemplate couple={couple} />
    case 'golden-garden':
      return <GoldenGardenTemplate couple={couple} />
    case 'ocean-pearl':
      return <OceanPearlTemplate couple={couple} />
    case 'sunset-shores':
      return <SunsetShoresTemplate couple={couple} />
    case 'sacred-poruwa':
      return <SacredPoruwaTemplate couple={couple} />
    case 'traditional-ceylon':
      return <TraditionalCeylonTemplate couple={couple} />
    case 'blush-blossom':
      return <BlushBlossomTemplate couple={couple} />
    case 'garden-minimal':
    case 'floral-romance':
      return <FloralRomanceTemplate couple={couple} />
    default:
      return <FloralRomanceTemplate couple={couple} />
  }
}
