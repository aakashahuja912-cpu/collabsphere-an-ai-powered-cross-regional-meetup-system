"use client"

import { useState } from "react"
import useSWR from "swr"
import { Check, ShieldCheck, UserCog, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type AdminData = {
  events: { id: string; title: string; category: string; city: string | null; starts_at: string; status: string; creator_id: string }[]
  users: { id: string; display_name: string; city: string | null; role: string }[]
  houses: { id: string; name: string }[]
}
const fetcher = async (url: string) => {
  const response = await fetch(url)
  const data = await response.json()
  if (!response.ok) throw new Error(data.error ?? "Admin controls could not be loaded.")
  return data as AdminData
}

export function AdminConsole({ onNotify }: { onNotify: (message: string) => void }) {
  const { data, error, isLoading, mutate } = useSWR("/api/admin", fetcher)
  const [pending, setPending] = useState("")
  const [houseByUser, setHouseByUser] = useState<Record<string, string>>({})
  const [roleByUser, setRoleByUser] = useState<Record<string, string>>({})

  async function submitAction(payload: Record<string, string>) {
    setPending(payload.eventId ?? payload.userId ?? "admin")
    try {
      const response = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? "The action could not be completed.")
      onNotify("Admin action saved and recorded.")
      await mutate()
    } catch (actionError) {
      onNotify(actionError instanceof Error ? actionError.message : "The admin action could not be completed.")
    } finally { setPending("") }
  }

  if (isLoading) return <p className="inline-empty" role="status">Loading admin workspace…</p>
  if (error) return <p className="form-error" role="alert">{error.message}</p>
  if (!data) return null

  return <div className="admin-console">
    <div className="card-heading"><div><span className="eyebrow">ROLE-VERIFIED WORKSPACE</span><h2>Admin controls</h2></div><ShieldCheck size={17} color="var(--green)" /></div>
    <p className="leaderboard-note">Approvals, role changes, and house assignments are checked by the server and recorded in the audit log.</p>
    <section className="admin-subsection"><h3>Event proposals awaiting review</h3>{data.events.length ? data.events.map((event) => <div className="admin-row" key={event.id}><span><strong>{event.title}</strong><small>{event.category} · {event.city ?? "Online"} · {event.status.replaceAll("_", " ")}</small></span><Button size="sm" disabled={!!pending} onClick={() => void submitAction({ action: "review_event", eventId: event.id, decision: "approved" })}><Check size={13} />Approve</Button><Button size="sm" variant="outline" disabled={!!pending} onClick={() => void submitAction({ action: "review_event", eventId: event.id, decision: "rejected" })}><X size={13} />Reject</Button></div>) : <p className="form-note">No proposals need review.</p>}</section>
    <section className="admin-subsection"><h3>People, roles &amp; house councils</h3><div className="admin-table">{data.users.map((person) => <div className="admin-row admin-person" key={person.id}><span><strong>{person.display_name}</strong><small>{person.city ?? "No city set"} · {person.role.replaceAll("_", " ")}</small></span><label className="sr-only" htmlFor={`role-${person.id}`}>Role for {person.display_name}</label><select id={`role-${person.id}`} value={roleByUser[person.id] ?? person.role} onChange={(event) => setRoleByUser((current) => ({ ...current, [person.id]: event.target.value }))}><option value="student">Student</option><option value="organizer">Organizer</option><option value="regional_coordinator">Regional coordinator</option><option value="admin">Admin</option></select><Button size="sm" variant="outline" disabled={!!pending || (roleByUser[person.id] ?? person.role) === person.role} onClick={() => void submitAction({ action: "update_role", userId: person.id, role: roleByUser[person.id] ?? person.role })}><UserCog size={13} />Save role</Button><label className="sr-only" htmlFor={`house-${person.id}`}>House for {person.display_name}</label><select id={`house-${person.id}`} value={houseByUser[person.id] ?? ""} onChange={(event) => setHouseByUser((current) => ({ ...current, [person.id]: event.target.value }))}><option value="">Choose house</option>{data.houses.map((house) => <option key={house.id} value={house.id}>{house.name}</option>)}</select><Button size="sm" variant="outline" disabled={!!pending || !houseByUser[person.id]} onClick={() => void submitAction({ action: "assign_house", userId: person.id, houseId: houseByUser[person.id], councilRole: "member" })}>Assign house</Button></div>)}</div></section>
  </div>
}
