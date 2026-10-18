import { createHash, randomBytes } from "node:crypto"
import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const registrationSchema = z.object({ eventId: z.uuid() })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Sign in to register for this meetup." }, { status: 401 })
  const { eventId } = await request.json().catch(() => ({}))
  const parsed = registrationSchema.safeParse({ eventId })
  if (!parsed.success) return NextResponse.json({ error: "This meetup could not be identified." }, { status: 400 })

  const token = randomBytes(32).toString("base64url")
  const tokenHash = createHash("sha256").update(token).digest("hex")
  const { data: registrationId, error } = await supabase.rpc("register_for_event", { p_event_id: parsed.data.eventId, p_qr_token_hash: tokenHash })
  if (error || !registrationId) return NextResponse.json({ error: error?.message ?? "Registration could not be completed." }, { status: 400 })
  return NextResponse.json({ registrationId, secret: token })
}
