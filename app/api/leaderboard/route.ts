import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Sign in to view the community leaderboard." }, { status: 401 })

  const admin = createAdminClient()
  const [{ data: houses, error: housesError }, { data: points, error: pointsError }] = await Promise.all([
    admin.from("houses").select("id,name").order("name"),
    admin.from("participation_points").select("house_id,points").not("house_id", "is", null),
  ])
  if (housesError || pointsError) return NextResponse.json({ error: "Leaderboard data is temporarily unavailable." }, { status: 503 })

  const totals = new Map<string, number>()
  for (const entry of points ?? []) {
    if (entry.house_id) totals.set(entry.house_id, (totals.get(entry.house_id) ?? 0) + entry.points)
  }
  const leaderboard = (houses ?? []).map((house) => ({
    id: house.id,
    name: house.name,
    points: totals.get(house.id) ?? 0,
  })).sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))

  return NextResponse.json({ houses: leaderboard })
}
