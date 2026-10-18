import { loadEnvConfig } from "@next/env"
import { createClient } from "@supabase/supabase-js"

loadEnvConfig(process.cwd())

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  throw new Error("Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY before seeding.")
}

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
const venues = [
  { name: "The Reading Room", city: "Lucknow", public_location: "Central Lucknow · approximate", cost_per_person: 250, capacity: 32, accessibility: "Step-free access · fictional demo venue", is_demo: true },
  { name: "Mosaic Commons", city: "Lucknow", public_location: "Central Lucknow · approximate", cost_per_person: 320, capacity: 40, accessibility: "Workshop tables · fictional demo venue", is_demo: true },
  { name: "The Garden Table", city: "Lucknow", public_location: "Central Lucknow · approximate", cost_per_person: 180, capacity: 24, accessibility: "Outdoor seating · fictional demo venue", is_demo: true },
]

for (const venue of venues) {
  const { data: existing, error: lookupError } = await supabase
    .from("venues")
    .select("id")
    .eq("name", venue.name)
    .eq("city", venue.city)
    .eq("is_demo", true)
    .maybeSingle()

  if (lookupError) throw lookupError
  const result = existing
    ? await supabase.from("venues").update(venue).eq("id", existing.id).eq("is_demo", true)
    : await supabase.from("venues").insert(venue)
  if (result.error) throw result.error
  console.log(`${existing ? "Updated" : "Added"} demo venue: ${venue.name}`)
}

console.log("Demo venues are labelled fictional and contain no real student data.")
