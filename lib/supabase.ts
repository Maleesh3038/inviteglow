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

// Which optional sections show on the public invitation. RSVP is intentionally
// not included here — it's a core feature and always renders.
export type SectionVisibility = {
  gallery?: boolean
  countdown?: boolean
  timeline?: boolean
  seat_finder?: boolean
  music?: boolean
  thank_you?: boolean
}

// A single event slot (Engagement / Wedding / Homecoming). `enabled` controls
// whether this event's card renders on the invitation at all.
export type EventDetails = {
  enabled: boolean
  venue: string
  venue_address: string
  date: string // ISO datetime string, same format as wedding_date
  maps_url: string
}

export type CoupleEvents = {
  engagement?: EventDetails
  wedding?: EventDetails
  homecoming?: EventDetails
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
  section_visibility: SectionVisibility
  events: CoupleEvents
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