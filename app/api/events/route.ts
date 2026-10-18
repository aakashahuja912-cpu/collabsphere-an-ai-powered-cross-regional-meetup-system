import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const eventProposalSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(4000).default(""),
  category: z.string().trim().min(2).max(64),
  format: z.enum(["in_person", "online", "hybrid"]),
  city: z.string().trim().max(100).nullable(),
  starts_at: z.iso.datetime(),
  capacity: z.number().int().min(2).max(1000),
  budget_per_person: z.number().min(0).max(100000),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Sign in to submit an event proposal." }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "The event details were not valid JSON." }, { status: 400 })
  }

  const parsed = eventProposalSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the event details and try again." }, { status: 400 })
  }

  if (new Date(parsed.data.starts_at).getTime() <= Date.now()) {
    return NextResponse.json({ error: "Choose a date in the future." }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("events")
    .insert({ ...parsed.data, creator_id: user.id, status: "submitted" })
    .select("id, title, category, format, city, starts_at, capacity, description, status")
    .single()

  if (error) {
    return NextResponse.json({ error: "Your proposal could not be saved. Please try again." }, { status: 400 })
  }

  return NextResponse.json({ event: data }, { status: 201 })
}
