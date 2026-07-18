"use client"
import { SOCIAL_LINKS } from '@/lib/socialLinks'

// ── Shared footer social icon row — TikTok, WhatsApp, Instagram, Facebook.
// Used at the bottom of every invitation template. Import this component
// instead of hand-rolling icons per template, so a design tweak here
// applies everywhere automatically. ──
function BrandIcon({ name }: { name: 'tiktok' | 'whatsapp' | 'instagram' | 'facebook' }) {
  const common = { width: 17, height: 17, viewBox: '0 0 24 24' }
  switch (name) {
    case 'tiktok':
      return (
        <svg {...common} fill="currentColor">
          <path d="M16.6 5.82c-.9-.83-1.47-1.98-1.6-3.32h-3.13v13.44c0 1.53-1.24 2.77-2.77 2.77a2.77 2.77 0 01-2.77-2.77 2.77 2.77 0 013.31-2.72V9.9a6.06 6.06 0 00-.54-.02A6.03 6.03 0 003.06 15.9 6.03 6.03 0 009.09 21.9a6.03 6.03 0 006.03-6.03V9.15a9.15 9.15 0 005.32 1.7V7.75a5.87 5.87 0 01-3.84-1.93z" />
        </svg>
      )
    case 'whatsapp':
      return (
        <svg {...common} fill="currentColor">
          <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3M12 2a10 10 0 00-8.5 15.3L2 22l4.8-1.3A10 10 0 1012 2z" />
        </svg>
      )
    case 'instagram':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
          <circle cx="12" cy="12" r="4.2" />
          <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'facebook':
      return (
        <svg {...common} fill="currentColor">
          <path d="M14 21v-7.3h2.5l.4-2.9H14V9c0-.85.24-1.43 1.46-1.43H17V5.2C16.72 5.16 15.77 5 14.67 5c-2.3 0-3.87 1.4-3.87 3.98v2.82H8.3v2.9h2.5V21h3.2z" />
        </svg>
      )
  }
}

export default function FooterSocial({ color = "#8a7355", background = "rgba(0,0,0,0.05)" }: { color?: string; background?: string }) {
  const links: { name: 'tiktok' | 'whatsapp' | 'instagram' | 'facebook'; href: string; label: string }[] = [
    { name: 'instagram', href: SOCIAL_LINKS.instagram, label: 'Instagram' },
    { name: 'whatsapp', href: SOCIAL_LINKS.whatsapp, label: 'WhatsApp' },
    { name: 'tiktok', href: SOCIAL_LINKS.tiktok, label: 'TikTok' },
    { name: 'facebook', href: SOCIAL_LINKS.facebook, label: 'Facebook' },
  ]
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 14 }}>
      {links.map(l => (
        <a key={l.name} href={l.href} target="_blank" rel="noopener noreferrer" aria-label={l.label} style={{
          width: 36, height: 36, borderRadius: '50%', background, color,
          display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
        }}>
          <BrandIcon name={l.name} />
        </a>
      ))}
    </div>
  )
}
