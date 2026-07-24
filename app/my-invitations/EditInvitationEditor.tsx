"use client"
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

// Same imports/switch as app/invite/[slug]/page.tsx — the preview renders
// the REAL template component, not a mockup, so it always matches what
// guests will actually see.
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
import CeylonEleganceTemplate from '@/components/templates/CeylonEleganceTemplate'
import EternalBloomTemplate from '@/components/templates/EternalBloomTemplate'
import NobleSaluteTemplate from '@/components/templates/NobleSaluteTemplate'

function renderTemplate(couple: any) {
  switch (couple.template) {
    case 'elegant-photo': return <ElegantPhotoTemplate couple={couple} />
    case 'cinematic-gold': return <CinematicGoldTemplate couple={couple} />
    case 'kandyan-heritage': return <KandyanHeritageTemplate couple={couple} />
    case 'twilight-picnic': return <TwilightPicnicTemplate couple={couple} />
    case 'golden-garden': return <GoldenGardenTemplate couple={couple} />
    case 'ocean-pearl': return <OceanPearlTemplate couple={couple} />
    case 'sunset-shores': return <SunsetShoresTemplate couple={couple} />
    case 'sacred-poruwa': return <SacredPoruwaTemplate couple={couple} />
    case 'traditional-ceylon': return <TraditionalCeylonTemplate couple={couple} />
    case 'blush-blossom': return <BlushBlossomTemplate couple={couple} />
    case 'ceylon-elegance': return <CeylonEleganceTemplate couple={couple} />
    case 'eternal-bloom': return <EternalBloomTemplate couple={couple} />
    case 'noble-salute': return <NobleSaluteTemplate couple={couple} />
    case 'garden-minimal':
    case 'floral-romance':
    default: return <FloralRomanceTemplate couple={couple} />
  }
}

const PINK = "#c4607a"
const RED = "#e0355c"
const BUCKET = 'wedding-photos'

const TEMPLATE_OPTIONS = [
  { id: 'floral-romance', name: 'Floral Romance', color: '#c4607a' }, { id: 'elegant-photo', name: 'Elegant Photo Hero', color: '#a8895a' },
  { id: 'cinematic-gold', name: 'Cinematic Gold', color: '#c9a96e' }, { id: 'kandyan-heritage', name: 'Kandyan Heritage', color: '#e8a060' },
  { id: 'twilight-picnic', name: 'Twilight Picnic', color: '#f0a868' }, { id: 'golden-garden', name: 'Golden Garden', color: '#d4a857' },
  { id: 'ocean-pearl', name: 'Ocean Pearl', color: '#2f7d9e' }, { id: 'sunset-shores', name: 'Sunset Shores', color: '#e0795a' },
  { id: 'traditional-ceylon', name: 'Traditional Ceylon', color: '#2f4a35' }, { id: 'sacred-poruwa', name: 'Sacred Poruwa', color: '#c4956a' },
  { id: 'blush-blossom', name: 'Blush Blossom', color: '#c17d8a' }, { id: 'ceylon-elegance', name: 'Ceylon Elegance', color: '#c9a227' },
  { id: 'eternal-bloom', name: 'Eternal Bloom', color: '#5c7a52' }, { id: 'noble-salute', name: 'Noble Salute', color: '#3f5233' },
]

type SectionKey = 'hero' | 'countdown' | 'love_story' | 'events' | 'gallery' | 'venue_map' | 'rsvp' | 'guest_gallery' | 'mobile_numbers'
const SECTION_DEFS: { key: SectionKey; label: string; icon: string; desc: string }[] = [
  { key: 'hero', label: 'Hero / Couple Intro', icon: '♥', desc: 'Names, subtitle, tagline and opening message.' },
  { key: 'countdown', label: 'Countdown Timer', icon: '⏱', desc: 'Live countdown to your wedding day.' },
  { key: 'love_story', label: 'Love Story', icon: '♥', desc: 'A short note about your journey together.' },
  { key: 'events', label: 'Wedding Events', icon: '⏰', desc: 'Engagement, wedding, and homecoming details.' },
  { key: 'gallery', label: 'Photo Gallery', icon: '🖼', desc: 'Photos shown on your invitation.' },
  { key: 'venue_map', label: 'Venue & Map', icon: '📍', desc: 'Main venue name, address, and map link.' },
  { key: 'rsvp', label: 'RSVP', icon: 'T', desc: 'Guest RSVP form and drink preference question.' },
  { key: 'guest_gallery', label: 'Guest Gallery', icon: '🖼', desc: 'Lets guests leave photos, videos, and wishes.' },
  { key: 'mobile_numbers', label: 'Mobile Numbers', icon: 'T', desc: 'Contact numbers shown to guests.' },
]
const DEFAULT_ORDER: SectionKey[] = ['hero', 'countdown', 'love_story', 'events', 'gallery', 'venue_map', 'rsvp', 'guest_gallery', 'mobile_numbers']

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 13px', borderRadius: 100, border: '1px solid #e2e8f0',
  fontSize: 13, outline: 'none', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box', color: '#1e293b', background: '#f8fafc',
}
const labelStyle: React.CSSProperties = { fontSize: 10.5, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em', marginBottom: 6, display: 'block' }

export default function EditInvitationEditor({ coupleId, onClose }: { coupleId: string; onClose?: () => void }) {
  const [loading, setLoading] = useState(true)
  const [full, setFull] = useState<any>(null)     // last-saved record from Supabase
  const [form, setForm] = useState<any>(null)      // in-progress edits (merged over `full` for preview)
  const [order, setOrder] = useState<SectionKey[]>(DEFAULT_ORDER)
  const [expandedKey, setExpandedKey] = useState<SectionKey | null>('hero')
  const [dragKey, setDragKey] = useState<SectionKey | null>(null)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('saved')
  const [savedAgo, setSavedAgo] = useState('just now')
  const [history, setHistory] = useState<any[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedAtRef = useRef(Date.now())
  const skipHistoryPush = useRef(false)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('couples').select('*').eq('id', coupleId).single()
      if (data) {
        setFull(data)
        setForm(data)
        setHistory([data])
        setHistoryIndex(0)
        const o = (data as any).section_order
        if (Array.isArray(o) && o.length) setOrder(o as SectionKey[])
      }
      setLoading(false)
    }
    load()
  }, [coupleId])

  // "Saved Xs ago" ticker
  useEffect(() => {
    const id = setInterval(() => {
      const secs = Math.round((Date.now() - savedAtRef.current) / 1000)
      setSavedAgo(secs < 5 ? 'just now' : secs < 60 ? `${secs}s ago` : `${Math.round(secs / 60)}m ago`)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const persist = useCallback(async (data: any, orderArr: SectionKey[]) => {
    setSaveStatus('saving')
    const { id, created_at, ...payload } = data
    await supabase.from('couples').update({ ...payload, section_order: orderArr }).eq('id', coupleId)
    savedAtRef.current = Date.now()
    setSaveStatus('saved')
    setSavedAgo('just now')
  }, [coupleId])

  // Debounced autosave — fires ~1.1s after the last change
  useEffect(() => {
    if (!form) return
    setSaveStatus('idle')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => persist(form, order), 1100)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [form, order, persist])

  const update = (patch: Record<string, any>) => {
    setForm((prev: any) => {
      const next = { ...prev, ...patch }
      if (!skipHistoryPush.current) {
        setHistory(h => [...h.slice(0, historyIndex + 1), next].slice(-50))
        setHistoryIndex(i => Math.min(i + 1, 49))
      }
      skipHistoryPush.current = false
      return next
    })
  }

  const undo = () => {
    if (historyIndex <= 0) return
    skipHistoryPush.current = true
    setHistoryIndex(i => i - 1)
    setForm(history[historyIndex - 1])
  }
  const redo = () => {
    if (historyIndex >= history.length - 1) return
    skipHistoryPush.current = true
    setHistoryIndex(i => i + 1)
    setForm(history[historyIndex + 1])
  }

  const sv = form?.section_visibility || {}
  const isOn = (key: SectionKey) => key === 'guest_gallery' ? !!form?.enable_guest_wishes : (sv[key] ?? true)
  const setOn = (key: SectionKey, val: boolean) => {
    if (key === 'guest_gallery') update({ enable_guest_wishes: val })
    else update({ section_visibility: { ...sv, [key]: val } })
  }

  const handleDrop = (targetKey: SectionKey) => {
    if (!dragKey || dragKey === targetKey) return
    setOrder(prev => {
      const next = [...prev]
      const from = next.indexOf(dragKey)
      const to = next.indexOf(targetKey)
      next.splice(from, 1)
      next.splice(to, 0, dragKey)
      return next
    })
    setDragKey(null)
  }

  if (loading || !form) {
    return <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading editor...</div>
  }

  const link = typeof window !== 'undefined' ? `${window.location.origin}/invite/${form.slug}` : `/invite/${form.slug}`
  const currentTemplateMeta = TEMPLATE_OPTIONS.find(t => t.id === form.template)

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Edit Invitation</div>
          <div style={{ fontSize: 12, color: saveStatus === 'saving' ? '#b45309' : '#16a34a', fontWeight: 600 }}>
            {saveStatus === 'saving' ? 'Saving…' : `Saved ${savedAgo}`} · autosave on
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <ToolbarBtn onClick={undo} disabled={historyIndex <= 0} label="Undo">↶</ToolbarBtn>
          <ToolbarBtn onClick={redo} disabled={historyIndex >= history.length - 1} label="Redo">↷</ToolbarBtn>
          <ToolbarBtn onClick={() => persist(form, order)} label="Save now">💾</ToolbarBtn>
          <a href={`/invite/${form.slug}`} target="_blank" rel="noopener noreferrer" style={{
            width: 36, height: 36, borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', display: 'flex',
            alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: 15,
          }} title="Preview live">👁</a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 20, alignItems: 'flex-start' }} className="ig-editor-grid">
        <style>{`@media (max-width: 900px) { .ig-editor-grid { grid-template-columns: 1fr !important; } }`}</style>

        {/* Left: template picker + section list */}
        <div>
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #eef0f3', padding: 18, marginBottom: 14 }}>
            <label style={labelStyle}>TEMPLATE</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #e2e8f0', borderRadius: 100, padding: '9px 14px' }}>
              <span style={{ width: 14, height: 14, borderRadius: '50%', background: currentTemplateMeta?.color || PINK, flexShrink: 0 }} />
              <select value={form.template} onChange={e => update({ template: e.target.value })} style={{ border: 'none', outline: 'none', fontSize: 13.5, fontWeight: 600, color: '#1e293b', background: 'transparent', flex: 1, cursor: 'pointer' }}>
                {TEMPLATE_OPTIONS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ fontSize: 11, color: '#94a3b8', margin: '0 4px 8px' }}>Drag ⠿ to reorder. Toggle to show/hide. Tap a section to edit its details.</div>

          {order.map(key => {
            const def = SECTION_DEFS.find(d => d.key === key)
            if (!def) return null
            const expanded = expandedKey === key
            const on = isOn(key)
            return (
              <div key={key} draggable onDragStart={() => setDragKey(key)} onDragOver={e => e.preventDefault()} onDrop={() => handleDrop(key)}
                style={{ background: '#fff', borderRadius: 14, border: `1px solid ${expanded ? PINK : '#eef0f3'}`, marginBottom: 8, overflow: 'hidden', opacity: dragKey === key ? 0.4 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', cursor: 'grab' }}>
                  <span style={{ color: '#cbd5e1', fontSize: 13, cursor: 'grab', userSelect: 'none' }}>⠿</span>
                  <span style={{ fontSize: 15, width: 20, textAlign: 'center', flexShrink: 0 }}>{def.icon}</span>
                  <button onClick={() => setExpandedKey(expanded ? null : key)} style={{ flex: 1, textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: on ? '#0f172a' : '#94a3b8' }}>{def.label}</div>
                  </button>
                  <span style={{ color: '#cbd5e1', fontSize: 11, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▾</span>
                  <Toggle on={on} onClick={() => setOn(key, !on)} />
                </div>
                {expanded && (
                  <div style={{ padding: '4px 16px 16px', borderTop: '1px solid #f1f5f9' }}>
                    <SectionFields sectionKey={key} form={form} update={update} coupleId={coupleId} />
                  </div>
                )}
              </div>
            )
          })}

          {/* Music & Style — always last, no drag/toggle, matching the reference's fixed utility rows */}
          <CollapsibleUtility label="Music" icon="♪" expanded={expandedKey === ('music' as any)} onToggle={() => setExpandedKey(expandedKey === ('music' as any) ? null : ('music' as any))}>
            <MusicFields form={form} update={update} />
          </CollapsibleUtility>
          <CollapsibleUtility label="Style & Colors" icon="🎨" expanded={expandedKey === ('style' as any)} onToggle={() => setExpandedKey(expandedKey === ('style' as any) ? null : ('style' as any))}>
            <StyleFields form={form} update={update} />
          </CollapsibleUtility>

          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #eef0f3', padding: 16, marginTop: 14 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em', marginBottom: 6 }}>YOUR INVITATION LINK</div>
            <div style={{ fontSize: 12.5, color: '#1e293b', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.replace(/^https?:\/\//, '')}</div>
          </div>
        </div>

        {/* Right: live phone preview */}
        <div style={{ position: 'sticky', top: 20 }} className="ig-preview-col">
          <style>{`@media (max-width: 900px) { .ig-preview-col { position: static !important; margin-top: 20px; } }`}</style>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 300, borderRadius: 40, border: '10px solid #1a1a1a', background: '#1a1a1a', boxShadow: '0 20px 50px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
              <div style={{ height: 640, overflowY: 'auto', background: '#fff', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 120, height: 22, background: '#1a1a1a', borderRadius: '0 0 14px 14px', zIndex: 50 }} />
                <div style={{ transform: 'scale(1)', transformOrigin: 'top' }}>
                  {renderTemplate(form)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ToolbarBtn({ children, onClick, disabled, label }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; label: string }) {
  return (
    <button onClick={onClick} disabled={disabled} title={label} style={{
      width: 36, height: 36, borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', cursor: disabled ? 'default' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, opacity: disabled ? 0.35 : 1,
    }}>{children}</button>
  )
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: 40, height: 23, borderRadius: 100, border: 'none', cursor: 'pointer', flexShrink: 0, position: 'relative',
      background: on ? `linear-gradient(135deg,${PINK},${RED})` : '#e2e8f0',
    }}>
      <div style={{ width: 17, height: 17, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: on ? 20 : 3, transition: 'left 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }} />
    </button>
  )
}

function CollapsibleUtility({ label, icon, expanded, onToggle, children }: { label: string; icon: string; expanded: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${expanded ? PINK : '#eef0f3'}`, marginBottom: 8, overflow: 'hidden' }}>
      <button onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{icon}</span>
        <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{label}</span>
        <span style={{ color: '#cbd5e1', fontSize: 11, transform: expanded ? 'rotate(180deg)' : 'none' }}>▾</span>
      </button>
      {expanded && <div style={{ padding: '4px 16px 16px', borderTop: '1px solid #f1f5f9' }}>{children}</div>}
    </div>
  )
}

// ── Per-section field editors ──
function SectionFields({ sectionKey, form, update, coupleId }: { sectionKey: SectionKey; form: any; update: (p: any) => void; coupleId: string }) {
  switch (sectionKey) {
    case 'hero': return <HeroFields form={form} update={update} />
    case 'countdown': return <div style={{ fontSize: 12, color: '#94a3b8', paddingTop: 8 }}>No extra settings — the countdown always targets your wedding date &amp; time above.</div>
    case 'love_story': return (
      <div style={{ paddingTop: 8 }}>
        <label style={labelStyle}>LOVE STORY / NOTE</label>
        <textarea value={form.love_story_text || ''} onChange={e => update({ love_story_text: e.target.value })} placeholder="A short note about how you met, or your journey together..." style={{ ...inputStyle, borderRadius: 14, minHeight: 80, resize: 'vertical' as const }} />
      </div>
    )
    case 'events': return <EventsFields form={form} update={update} />
    case 'gallery': return <GalleryFields form={form} update={update} />
    case 'venue_map': return <VenueMapFields form={form} update={update} />
    case 'rsvp': return <RsvpFields form={form} update={update} />
    case 'guest_gallery': return <div style={{ fontSize: 12, color: '#94a3b8', paddingTop: 8 }}>When on, guests can leave a wish with an optional photo or video, visible to everyone on your invitation.</div>
    case 'mobile_numbers': return <MobileFields form={form} update={update} />
    default: return null
  }
}

function HeroFields({ form, update }: { form: any; update: (p: any) => void }) {
  const dateVal = form.wedding_date ? form.wedding_date.slice(0, 10) : ''
  const timeVal = form.wedding_date ? form.wedding_date.slice(11, 16) : ''
  const setDateTime = (d: string, t: string) => { if (d && t) update({ wedding_date: `${d}T${t}` }) }
  return (
    <div style={{ display: 'grid', gap: 12, paddingTop: 10 }}>
      <div><label style={labelStyle}>GROOM NAME</label><input value={form.groom} onChange={e => update({ groom: e.target.value })} style={inputStyle} /></div>
      <div><label style={labelStyle}>BRIDE NAME</label><input value={form.bride} onChange={e => update({ bride: e.target.value })} style={inputStyle} /></div>
      <div><label style={labelStyle}>SUBTITLE</label><input value={form.cover_subtitle || ''} onChange={e => update({ cover_subtitle: e.target.value })} placeholder="The Homecoming Reception of" style={inputStyle} /></div>
      <div><label style={labelStyle}>TAGLINE</label><input value={form.intro_text || ''} onChange={e => update({ intro_text: e.target.value })} placeholder="A Cinematic Celebration of Love, Family, and New Beginnings" style={inputStyle} /></div>
      <div><label style={labelStyle}>MESSAGE</label><textarea value={form.family_invitation_text || ''} onChange={e => update({ family_invitation_text: e.target.value })} placeholder="With the blessings of our families, we joyfully invite you to celebrate..." style={{ ...inputStyle, borderRadius: 14, minHeight: 70, resize: 'vertical' as const }} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div><label style={labelStyle}>WEDDING DATE</label><input type="date" value={dateVal} onChange={e => setDateTime(e.target.value, timeVal || '00:00')} style={inputStyle} /></div>
        <div><label style={labelStyle}>WEDDING TIME</label><input type="time" value={timeVal} onChange={e => setDateTime(dateVal, e.target.value)} style={inputStyle} /></div>
      </div>
    </div>
  )
}

function EventsFields({ form, update }: { form: any; update: (p: any) => void }) {
  const events = form.events || {}
  const upd = (key: 'engagement' | 'wedding' | 'homecoming', field: string, val: any) => {
    update({ events: { ...events, [key]: { ...(events[key] || {}), [field]: val } } })
  }
  return (
    <div style={{ display: 'grid', gap: 12, paddingTop: 10 }}>
      {(['engagement', 'wedding', 'homecoming'] as const).map(key => {
        const e = events[key] || {}
        return (
          <div key={key} style={{ background: e.enabled ? `${PINK}0a` : '#f8fafc', border: `1px solid ${e.enabled ? `${PINK}33` : '#e2e8f0'}`, borderRadius: 14, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: e.enabled ? 10 : 0 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', textTransform: 'capitalize' }}>{key}</span>
              <Toggle on={!!e.enabled} onClick={() => upd(key, 'enabled', !e.enabled)} />
            </div>
            {e.enabled && (
              <div style={{ display: 'grid', gap: 8 }}>
                <input value={e.venue || ''} onChange={ev => upd(key, 'venue', ev.target.value)} placeholder="Venue name" style={inputStyle} />
                <input value={e.venue_address || ''} onChange={ev => upd(key, 'venue_address', ev.target.value)} placeholder="Venue address" style={inputStyle} />
                <input type="datetime-local" value={e.date ? e.date.slice(0, 16) : ''} onChange={ev => upd(key, 'date', ev.target.value)} style={inputStyle} />
                <input value={e.maps_url || ''} onChange={ev => upd(key, 'maps_url', ev.target.value)} placeholder="Google Maps URL" style={inputStyle} />
                <input value={e.dress_code || ''} onChange={ev => upd(key, 'dress_code', ev.target.value)} placeholder="Dress code (optional)" style={inputStyle} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function GalleryFields({ form, update }: { form: any; update: (p: any) => void }) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const gallery: string[] = form.gallery || []

  const handleFiles = async (files: FileList) => {
    setUploading(true)
    const uploaded: string[] = []
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()
      const fileName = `gallery/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, { cacheControl: '3600', upsert: false })
      if (!error) {
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
        uploaded.push(data.publicUrl)
      }
    }
    setUploading(false)
    update({ gallery: [...gallery, ...uploaded] })
  }

  return (
    <div style={{ paddingTop: 10 }}>
      {gallery.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(60px,1fr))', gap: 6, marginBottom: 10 }}>
          {gallery.map((url, i) => (
            <div key={i} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button onClick={() => update({ gallery: gallery.filter((_, j) => j !== i) })} style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: '50%', background: 'rgba(220,38,38,0.9)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 9 }}>×</button>
            </div>
          ))}
        </div>
      )}
      <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ width: '100%', padding: 10, borderRadius: 100, border: `1.5px dashed ${PINK}`, background: `${PINK}0a`, color: PINK, cursor: 'pointer', fontSize: 12.5, fontWeight: 600 }}>
        {uploading ? 'Uploading...' : '+ Add Photos'}
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => { const f = e.target.files; if (f && f.length) handleFiles(f) }} />
    </div>
  )
}

function VenueMapFields({ form, update }: { form: any; update: (p: any) => void }) {
  return (
    <div style={{ display: 'grid', gap: 10, paddingTop: 10 }}>
      <div><label style={labelStyle}>VENUE NAME</label><input value={form.venue || ''} onChange={e => update({ venue: e.target.value })} style={inputStyle} /></div>
      <div><label style={labelStyle}>VENUE ADDRESS</label><input value={form.venue_address || ''} onChange={e => update({ venue_address: e.target.value })} style={inputStyle} /></div>
      <div><label style={labelStyle}>GOOGLE MAPS URL</label><input value={form.maps_url || ''} onChange={e => update({ maps_url: e.target.value })} placeholder="https://maps.google.com/?q=..." style={inputStyle} /></div>
    </div>
  )
}

function RsvpFields({ form, update }: { form: any; update: (p: any) => void }) {
  return (
    <div style={{ display: 'grid', gap: 12, paddingTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderRadius: 12, padding: '10px 12px' }}>
        <span style={{ fontSize: 12.5, color: '#334155' }}>Ask guests about alcohol</span>
        <Toggle on={!!form.ask_drinking} onClick={() => update({ ask_drinking: !form.ask_drinking })} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderRadius: 12, padding: '10px 12px' }}>
        <span style={{ fontSize: 12.5, color: '#334155' }}>Enable personalised guest links</span>
        <Toggle on={form.enable_guest_links !== false} onClick={() => update({ enable_guest_links: form.enable_guest_links === false })} />
      </div>
    </div>
  )
}

function MobileFields({ form, update }: { form: any; update: (p: any) => void }) {
  return (
    <div style={{ display: 'grid', gap: 10, paddingTop: 10 }}>
      <div><label style={labelStyle}>GROOM'S PHONE</label><input value={form.groom_phone || ''} onChange={e => update({ groom_phone: e.target.value })} placeholder="0778509638" style={inputStyle} /></div>
      <div><label style={labelStyle}>BRIDE'S PHONE</label><input value={form.bride_phone || ''} onChange={e => update({ bride_phone: e.target.value })} placeholder="0766128546" style={inputStyle} /></div>
    </div>
  )
}

function MusicFields({ form, update }: { form: any; update: (p: any) => void }) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const handleFile = async (file: File) => {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `music/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, { cacheControl: '3600', upsert: false })
    if (!error) {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
      update({ song_url: data.publicUrl })
    }
    setUploading(false)
  }
  return (
    <div style={{ display: 'grid', gap: 10, paddingTop: 10 }}>
      <div><label style={labelStyle}>SONG TITLE</label><input value={form.song_title || ''} onChange={e => update({ song_title: e.target.value })} placeholder="Leave empty for default" style={inputStyle} /></div>
      <div><label style={labelStyle}>ARTIST</label><input value={form.song_artist || ''} onChange={e => update({ song_artist: e.target.value })} placeholder="Leave empty for default" style={inputStyle} /></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ padding: '8px 16px', borderRadius: 100, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 12, color: '#475569', fontWeight: 600 }}>
          {uploading ? 'Uploading...' : form.song_url ? 'Change Song' : 'Upload Song'}
        </button>
        {form.song_url && <button onClick={() => update({ song_url: '' })} style={{ fontSize: 11.5, color: '#dc2626', background: 'transparent', border: 'none', cursor: 'pointer' }}>Remove</button>}
        <input ref={fileInputRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      </div>
    </div>
  )
}

function StyleFields({ form, update }: { form: any; update: (p: any) => void }) {
  const colors = form.custom_colors || {}
  const set = (key: string, val: string) => update({ custom_colors: { ...colors, [key]: val } })
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 10 }}>
      {[
        { key: 'primary', label: 'PRIMARY' }, { key: 'primaryLight', label: 'LIGHT ACCENT' },
        { key: 'dark', label: 'DARK / TEXT' }, { key: 'cream', label: 'BACKGROUND' },
      ].map(c => (
        <div key={c.key}>
          <label style={labelStyle}>{c.label}</label>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="color" value={colors[c.key] || '#c4607a'} onChange={e => set(c.key, e.target.value)} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e2e8f0', padding: 0, cursor: 'pointer' }} />
            <input value={colors[c.key] || ''} onChange={e => set(c.key, e.target.value)} placeholder="#c4607a" style={{ ...inputStyle, fontSize: 11.5, padding: '7px 10px' }} />
          </div>
        </div>
      ))}
    </div>
  )
}
