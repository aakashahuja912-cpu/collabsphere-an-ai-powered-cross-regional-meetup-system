import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const checkInSchema = z.object({ registrationId: z.uuid(), secret: z.string().min(32).max(256) })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Sign in with an authorized organizer account to verify attendance." }, { status: 401 })
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: "Invalid QR payload." }, { status: 400 }) }
  const parsed = checkInSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "This QR code is invalid." }, { status: 400 })
  const { data, error } = await supabase.rpc("check_in_event_registration", {
    p_registration_id: parsed.data.registrationId,
    p_qr_secret: parsed.data.secret,
  })
  if (error || !data) return NextResponse.json({ error: error?.message ?? "Attendance could not be verified." }, { status: 400 })
  return NextResponse.json({ verified: true })
}
