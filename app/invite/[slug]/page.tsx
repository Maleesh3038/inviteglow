import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import InviteClient from './InviteClient'

// Always fetch fresh couple data for the metadata (og:image) on every
// request — this page must reflect whatever photo/GIF the couple most
// recently uploaded as their "WhatsApp Share Preview", not a cached build.
export const dynamic = 'force-dynamic'

type Props = {
  // Next.js 15+ (this project is on Next 16) passes `params` to server
  // pages as a Promise — it must be awaited, not read synchronously.
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { data: couple } = await supabase.from('couples').select('*').eq('slug', slug).single()

  if (!couple) {
    // Not a wedding — check the separate `events` table before giving up.
    const { data: eventRow } = await supabase.from('events').select('*').eq('slug', slug).single()
    if (eventRow) {
      const e = eventRow as any
      const title = e.title ? `${e.title} | InviteGlow` : "You're Invited! | InviteGlow"
      const description = e.event_tagline || 'Tap to view your invitation and confirm your attendance.'
      const previewImage: string = e.cover_photo || 'https://www.inviteglow.com/og-default.jpg'
      return {
        title,
        description,
        openGraph: { title, description, type: 'website', images: [{ url: previewImage, width: 1200, height: 1200 }] },
        twitter: { card: 'summary_large_image', title, description, images: [previewImage] },
      }
    }
    return {
      title: 'Invitation Not Found | InviteGlow',
      description: "This invitation link doesn't exist or may have been removed.",
    }
  }

  const c = couple as any
  const brideName = c.bride_name || c.bride || ''
  const groomName = c.groom_name || c.groom || ''
  const title = brideName && groomName
    ? `${brideName} & ${groomName}'s Wedding Invitation`
    : "You're Invited! | InviteGlow"
  const description = "Tap to view our wedding invitation and let us know if you can celebrate with us."

  // This is the thumbnail shown when the invitation link is shared on
  // WhatsApp / Facebook / etc — the "og:image" the messaging app fetches.
  // If the couple uploaded an actual animated .gif file as their "Share
  // Preview" (in their dashboard), WhatsApp plays it right in the chat
  // bubble — that's the whole trick, since WhatsApp does not autoplay
  // real video files in link previews, only animated .gif images.
  // Falls back to their couple photo, then to a generic default.
  const previewImage: string =
    c.share_preview_url || c.couple_photo || 'https://www.inviteglow.com/og-default.jpg'
  const isGif = typeof previewImage === 'string' && previewImage.toLowerCase().endsWith('.gif')

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [
        {
          url: previewImage,
          width: 1200,
          height: 1200,
          type: isGif ? 'image/gif' : undefined,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [previewImage],
    },
  }
}

export default async function InvitePage({ params }: Props) {
  const { slug } = await params
  return <InviteClient slug={slug} />
}
