import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

const locationSchema = z.object({ enabled: z.boolean(), latitude: z.number().min(-90).max(90).optional(), longitude: z.number().min(-180).max(180).optional() })

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Sign in to discover nearby peers." }, { status: 401 })

  const [{ data: ownLocation }, { data: ownProfile }] = await Promise.all([
    supabase.from("peer_locations").select("latitude,longitude,expires_at").eq("user_id", user.id).gt("expires_at", new Date().toISOString()).maybeSingle(),
    supabase.from("profiles").select("discoverable").eq("id", user.id).maybeSingle(),
  ])
  if (!ownLocation || !ownProfile?.discoverable) return NextResponse.json({ peers: [], sharing: false })

  const now = new Date().toISOString()
  const admin = createAdminClient()
  await admin.from("peer_locations").delete().lt("expires_at", now)
  const { data: locations, error } = await supabase.from("peer_locations")
    .select("user_id,latitude,longitude")
    .neq("user_id", user.id)
    .gt("expires_at", now)
    .limit(100)
  if (error || !locations?.length) return NextResponse.json({ peers: [], sharing: true })

  const { data: profiles } = await supabase.from("profiles").select("id,display_name,city").in("id", locations.map((location) => location.user_id)).eq("discoverable", true)
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
  const toRadians = (value: number) => value * Math.PI / 180
  const distanceKm = (lat: number, lng: number, otherLat: number, otherLng: number) => {
    const dLat = toRadians(otherLat - lat)
    const dLng = toRadians(otherLng - lng)
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat)) * Math.cos(toRadians(otherLat)) * Math.sin(dLng / 2) ** 2
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }
  const peers = locations.flatMap((location) => {
    const profile = profileMap.get(location.user_id)
    if (!profile) return []
    const km = distanceKm(Number(ownLocation.latitude), Number(ownLocation.longitude), Number(location.latitude), Number(location.longitude))
    if (km > 50) return []
    const distance = km < 1 ? "Within 1 km" : km < 5 ? "Within 5 km" : km < 15 ? "Within 15 km" : "Within 50 km"
    return [{ id: profile.id, displayName: profile.display_name, city: profile.city, distance }]
  })
  return NextResponse.json({ peers, sharing: true })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Sign in to manage location sharing." }, { status: 401 })
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }) }
  const parsed = locationSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid location-sharing setting." }, { status: 400 })

  if (!parsed.data.enabled) {
    const [{ error: deleteError }, { error: profileError }] = await Promise.all([
      supabase.from("peer_locations").delete().eq("user_id", user.id),
      supabase.from("profiles").update({ discoverable: false }).eq("id", user.id),
    ])
    if (deleteError || profileError) return NextResponse.json({ error: "Location sharing could not be turned off." }, { status: 400 })
    return NextResponse.json({ sharing: false })
  }
  if (parsed.data.latitude === undefined || parsed.data.longitude === undefined) return NextResponse.json({ error: "Allow location access to share your approximate area." }, { status: 400 })

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
  const { error: profileError } = await supabase.from("profiles").update({ discoverable: true }).eq("id", user.id)
  if (profileError) return NextResponse.json({ error: "Your discovery preference could not be saved." }, { status: 400 })
  const { error } = await supabase.from("peer_locations").upsert({
    user_id: user.id,
    latitude: parsed.data.latitude,
    longitude: parsed.data.longitude,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" })
  if (error) return NextResponse.json({ error: "Your location could not be shared." }, { status: 400 })
  return NextResponse.json({ sharing: true, expiresAt })
}
