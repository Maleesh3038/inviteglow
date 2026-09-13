import EventDashboardClient from './EventDashboardClient'

// Route: app/event-dashboard/[slug]/page.tsx
// Deliberately a separate top-level route from /invite/[slug] (the guest
// invitation page) — same slug, two different audiences: guests open the
// invitation, staff open this on event day to check people in.
type Props = {
  params: Promise<{ slug: string }>
}

export default async function EventDashboardPage({ params }: Props) {
  const { slug } = await params
  return <EventDashboardClient slug={slug} />
}
