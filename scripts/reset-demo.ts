import { loadEnvConfig } from "@next/env"
import { createClient } from "@supabase/supabase-js"

loadEnvConfig(process.cwd())

if (!process.argv.includes("--confirm-demo-reset")) {
  console.info("Dry run. To remove rows where venues.is_demo is true, run the demo reset with --confirm-demo-reset.")
  process.exit(0)
}

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceKey) {
  throw new Error("Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY before resetting demo data.")
}

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
const { data: removed, error } = await supabase
  .from("venues")
  .delete()
  .eq("is_demo", true)
  .select("id")

if (error) throw error
console.info(`Removed ${removed?.length ?? 0} demo venue records. No profiles, events or non-demo venues were targeted.`)
