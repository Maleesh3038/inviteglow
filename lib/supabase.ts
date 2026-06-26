import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── Types ──
export type CoupleColors = {
  primary?: string
  primaryLight?: string
  dark?: string
  cream?: string
}

export type Couple = {
  id: string
  slug: string
  template: string
  bride: string
  groom: string
  bride_family: string | null
  groom_family: string | null
  wedding_date: string
  venue: string | null
  venue_address: string | null
  maps_url: string | null
  couple_photo: string | null
  song_title: string | null
  song_artist: string | null
  song_url: string | null
  gallery: string[]
  timeline: { time: string; event: string }[]
  seats: Record<string, string>
  pin: string
  ask_drinking: boolean
  show_seating: boolean
  custom_colors: CoupleColors
  created_at: string
}

export type RSVP = {
  id: string
  couple_id: string
  guest_name: string
  response: 'yes' | 'no'
  drinking: 'yes' | 'no' | null
  guest_count: number
  accommodation: 'needed' | 'not_needed' | null
  created_at: string
}

export type Review = {
  id: string
  name: string
  rating: number
  review_text: string
  photo_url: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}