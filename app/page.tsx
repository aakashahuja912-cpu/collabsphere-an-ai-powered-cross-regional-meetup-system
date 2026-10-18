import { PlatformShell } from "@/components/platform-shell"
import { demoEvents, type EventSummary } from "@/lib/demo-data"
import { createClient } from "@/lib/supabase/server"

async function getDashboardData() {
  const supabase = await createClient()
  const [{ data: { user } }, { data: events }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("events")
      .select("id, title, category, format, city, starts_at, capacity, description")
      .eq("status", "published")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(8),
  ])

  const [{ data: profile }, { data: proposals }] = await Promise.all([
    user ? supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    user ? supabase.from("events").select("id, title, category, format, city, starts_at, capacity, status, description").eq("creator_id", user.id).order("created_at", { ascending: false }).limit(5) : Promise.resolve({ data: null }),
  ])

  return {
    user: user ? { id: user.id, email: user.email ?? "", displayName: profile?.display_name ?? user.user_metadata?.display_name ?? "Student" } : null,
    events: [...(events ?? []).map((event) => ({ ...event, isDemo: false } as EventSummary)), ...demoEvents],
    proposals: (proposals ?? []).map((event) => ({ ...event, isDemo: false } as EventSummary)),
  }
}

export default async function HomePage() {
  const { user, events, proposals } = await getDashboardData()
  return <PlatformShell section="home" user={user} events={events} proposals={proposals} />
}
