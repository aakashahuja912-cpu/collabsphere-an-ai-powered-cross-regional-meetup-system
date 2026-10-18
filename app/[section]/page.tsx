import { notFound } from "next/navigation"
import { PlatformShell } from "@/components/platform-shell"
import { demoEvents, type EventSummary } from "@/lib/demo-data"
import { createClient } from "@/lib/supabase/server"

const sections = ["map", "discover", "events", "venuevote", "copilot", "network", "leaderboard", "notifications", "profile", "admin"] as const

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  if (!sections.includes(section as typeof sections[number])) notFound()
  const activeSection = section as typeof sections[number]

  const supabase = await createClient()
  const [{ data: { user } }, { data: events }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("events")
      .select("id, title, category, format, city, starts_at, capacity, description, creator_id")
      .eq("status", "published")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(8),
  ])
  const [{ data: profile }, { data: proposals }] = await Promise.all([
    user ? supabase.from("profiles").select("display_name, role").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    user ? supabase.from("events").select("id, title, category, format, city, starts_at, capacity, status, description").eq("creator_id", user.id).order("created_at", { ascending: false }).limit(5) : Promise.resolve({ data: null }),
  ])
  const currentUser = user
    ? { id: user.id, email: user.email ?? "", displayName: profile?.display_name ?? user.user_metadata?.display_name ?? "Student", role: profile?.role ?? "student" }
    : null
  const eventSummaries = [...(events ?? []).map((event) => ({ ...event, isDemo: false } as EventSummary)), ...demoEvents]

  const proposalSummaries = (proposals ?? []).map((event) => ({ ...event, isDemo: false } as EventSummary))
  return <PlatformShell section={activeSection} user={currentUser} events={eventSummaries} proposals={proposalSummaries} />
}
