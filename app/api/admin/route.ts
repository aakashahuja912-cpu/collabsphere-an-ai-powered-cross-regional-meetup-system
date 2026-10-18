import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("review_event"), eventId: z.uuid(), decision: z.enum(["approved", "rejected", "changes_requested"]), note: z.string().trim().max(1000).optional() }),
  z.object({ action: z.literal("assign_house"), userId: z.uuid(), houseId: z.uuid(), councilRole: z.enum(["member", "uhc", "lhc"]) }),
  z.object({ action: z.literal("update_role"), userId: z.uuid(), role: z.enum(["student", "organizer", "regional_coordinator", "admin"]) }),
])

async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, authorized: false }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
  return { supabase, user, authorized: profile?.role === "admin" }
}

export async function GET() {
  const { authorized } = await getAdminUser()
  if (!authorized) return NextResponse.json({ error: "Admin access required." }, { status: 403 })
  const admin = createAdminClient()
  const [{ data: events, error: eventsError }, { data: users, error: usersError }, { data: houses, error: housesError }] = await Promise.all([
    admin.from("events").select("id,title,category,city,starts_at,status,creator_id").in("status", ["submitted", "pending_approval", "changes_requested"]).order("created_at", { ascending: true }),
    admin.from("profiles").select("id,display_name,city,role").order("display_name"),
    admin.from("houses").select("id,name").order("name"),
  ])
  if (eventsError || usersError || housesError) return NextResponse.json({ error: "Admin data is temporarily unavailable." }, { status: 503 })
  return NextResponse.json({ events, users, houses })
}

export async function POST(request: Request) {
  const { authorized, user } = await getAdminUser()
  if (!authorized || !user) return NextResponse.json({ error: "Admin access required." }, { status: 403 })

  let input: unknown
  try { input = await request.json() } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }) }
  const parsed = actionSchema.safeParse(input)
  if (!parsed.success) return NextResponse.json({ error: "Check the admin action details." }, { status: 400 })
  const admin = createAdminClient()
  const action = parsed.data

  if (action.action === "review_event") {
    const { error } = await (await createClient()).rpc("review_event", { p_event_id: action.eventId, p_decision: action.decision, p_note: action.note ?? null })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  } else if (action.action === "assign_house") {
    const { error } = await (await createClient()).rpc("admin_assign_house_membership", { p_user_id: action.userId, p_house_id: action.houseId, p_council_role: action.councilRole })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  } else {
    const { error } = await admin.from("profiles").update({ role: action.role }).eq("id", action.userId)
    if (error) return NextResponse.json({ error: "Could not update this account role." }, { status: 400 })
    const { error: auditError } = await admin.from("audit_logs").insert({ actor_id: user.id, action: "profile_role_updated", details: { user_id: action.userId, role: action.role } })
    if (auditError) return NextResponse.json({ error: "The role was updated, but its audit record could not be saved." }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
