import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const createSchema = z.object({ targetHouseId: z.uuid(), eventTitle: z.string().trim().min(3).max(120), message: z.string().trim().max(1000).default("") })
const reviewSchema = z.object({ id: z.uuid(), decision: z.enum(["approved", "rejected"]) })

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function GET() {
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ error: "Sign in to view house collaborations." }, { status: 401 })
  const [{ data: houses, error: housesError }, { data: memberships }, { data: collaborations, error: collaborationsError }] = await Promise.all([
    supabase.from("houses").select("id,name").order("name"),
    supabase.from("house_memberships").select("house_id,council_role").eq("user_id", user.id),
    supabase.from("house_collaborations").select("id,proposer_house_id,target_house_id,requested_by,event_title,message,status,created_at,reviewed_by").order("created_at", { ascending: false }).limit(50),
  ])
  if (housesError || collaborationsError) return NextResponse.json({ error: "Collaboration data is temporarily unavailable." }, { status: 503 })
  return NextResponse.json({ houses, memberships: memberships ?? [], collaborations: collaborations ?? [] })
}

export async function POST(request: Request) {
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ error: "Sign in to request a collaboration." }, { status: 401 })
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }) }
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Check the collaboration details." }, { status: 400 })

  const { data: memberships } = await supabase.from("house_memberships").select("house_id,council_role").eq("user_id", user.id).in("council_role", ["uhc", "lhc"])
  const proposerHouseId = memberships?.[0]?.house_id
  if (!proposerHouseId) return NextResponse.json({ error: "Only a UHC or LHC member can request a house collaboration." }, { status: 403 })
  if (proposerHouseId === parsed.data.targetHouseId) return NextResponse.json({ error: "Choose a different target house." }, { status: 400 })

  const { data, error } = await supabase.from("house_collaborations").insert({
    proposer_house_id: proposerHouseId,
    target_house_id: parsed.data.targetHouseId,
    requested_by: user.id,
    event_title: parsed.data.eventTitle,
    message: parsed.data.message,
  }).select("id,status").single()
  if (error) return NextResponse.json({ error: "The request could not be saved. Confirm your UHC/LHC house membership and try again." }, { status: 403 })
  return NextResponse.json({ collaboration: data }, { status: 201 })
}

export async function PATCH(request: Request) {
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ error: "Sign in to review this request." }, { status: 401 })
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }) }
  const parsed = reviewSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Check the collaboration decision." }, { status: 400 })
  const { data, error } = await supabase.from("house_collaborations").update({
    status: parsed.data.decision,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
  }).eq("id", parsed.data.id).eq("status", "pending").select("id,status").maybeSingle()
  if (error || !data) return NextResponse.json({ error: "Only a UHC or LHC member of the target house can review a pending request." }, { status: 403 })
  return NextResponse.json({ collaboration: data })
}
