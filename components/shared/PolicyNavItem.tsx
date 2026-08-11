"use client"
import { useState, useRef, useEffect } from 'react'

// ── Drop-in "Legal" nav item — links to Return Policy, Privacy Policy,
// and Terms & Conditions. Designed to sit inline with your existing
// navbar links (Templates / Why Us / Pricing / Reviews / Contact).
//
// Usage: import PolicyNavItem from '@/components/shared/PolicyNavItem'
// then add <PolicyNavItem /> next to your other nav links, e.g.:
//   <a href="/templates">Templates</a>
//   ...
//   <PolicyNavItem />
//   <a href="/signin">Sign In</a>
export default function PolicyNavItem() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const links = [
    { label: 'Return & Refund Policy', href: '/return-policy' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms & Conditions', href: '/terms' },
  ]

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: 'none',
          cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, color: '#334155', padding: '8px 4px',
        }}
      >
        Legal
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 8, background: '#fff', borderRadius: 12,
          border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(15,23,42,0.12)', minWidth: 200, overflow: 'hidden', zIndex: 100,
        }}>
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} style={{
              display: 'block', padding: '12px 16px', fontSize: 13.5, color: '#334155', textDecoration: 'none',
              borderBottom: '1px solid #f1f5f9',
            }}>
              {l.label}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
