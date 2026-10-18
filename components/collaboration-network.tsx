"use client"

import { useState } from "react"
import useSWR from "swr"
import { ArrowRight, Check, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type NetworkData = {
  houses: { id: string; name: string }[]
  memberships: { house_id: string; council_role: string }[]
  collaborations: { id: string; proposer_house_id: string; target_house_id: string; requested_by: string; event_title: string; message: string; status: string; created_at: string; reviewed_by: string | null }[]
}
const fetcher = async (url: string) => {
  const response = await fetch(url)
  const data = await response.json()
  if (!response.ok) throw new Error(data.error ?? "Collaboration data could not be loaded.")
  return data as NetworkData
}

export function CollaborationNetwork({ userId, onNotify }: { userId: string | null; onNotify: (message: string) => void }) {
  const { data, error, isLoading, mutate } = useSWR(userId ? "/api/collaborations" : null, fetcher)
  const [targetHouseId, setTargetHouseId] = useState("")
  const [eventTitle, setEventTitle] = useState("")
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)
  const proposerHouse = data?.memberships.find((membership) => membership.council_role === "uhc" || membership.council_role === "lhc")?.house_id
  const houseName = (id: string) => data?.houses.find((house) => house.id === id)?.name ?? "House"

  async function requestCollaboration(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    try {
      const response = await fetch("/api/collaborations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetHouseId, eventTitle, message }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? "The collaboration request could not be sent.")
      setEventTitle("")
      setMessage("")
      onNotify("Collaboration request sent to the target house for approval.")
      await mutate()
    } catch (submitError) { onNotify(submitError instanceof Error ? submitError.message : "The request could not be saved.") }
    finally { setPending(false) }
  }

  async function review(id: string, decision: "approved" | "rejected") {
    setPending(true)
    try {
      const response = await fetch("/api/collaborations", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, decision }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? "This request could not be reviewed.")
      onNotify(`House collaboration ${decision}.`)
      await mutate()
    } catch (reviewError) { onNotify(reviewError instanceof Error ? reviewError.message : "The request could not be reviewed.") }
    finally { setPending(false) }
  }

  return <div className="network-layout">
    <section className="section-panel"><div className="card-heading"><div><span className="eyebrow">HOUSE-TO-HOUSE NETWORK</span><h2>Build a shared meetup</h2></div><Users size={16} color="var(--violet)" /></div>
      {!userId ? <p className="form-note">Sign in to see your house memberships and collaboration requests.</p> : isLoading ? <p className="inline-empty" role="status">Loading house network…</p> : error ? <p className="form-error" role="alert">{error.message}</p> : <>
        {proposerHouse ? <form className="network-request-form" onSubmit={requestCollaboration}><p className="form-note">You can request on behalf of {houseName(proposerHouse)} as a house council member. The target house&apos;s UHC or LHC must approve before collaboration is confirmed.</p><label htmlFor="collab-target">Invite a house</label><select id="collab-target" value={targetHouseId} onChange={(event) => setTargetHouseId(event.target.value)} required><option value="">Choose a target house</option>{data?.houses.filter((house) => house.id !== proposerHouse).map((house) => <option key={house.id} value={house.id}>{house.name}</option>)}</select><label htmlFor="collab-title">Meetup idea</label><Input id="collab-title" value={eventTitle} onChange={(event) => setEventTitle(event.target.value)} minLength={3} maxLength={120} required placeholder="What should the houses build together?" /><label htmlFor="collab-message">Details</label><Textarea id="collab-message" value={message} onChange={(event) => setMessage(event.target.value)} rows={3} maxLength={1000} placeholder="Share the purpose and proposed roles." /><Button type="submit" disabled={pending || !targetHouseId}>{pending ? "Sending…" : "Request collaboration"}<ArrowRight size={14} /></Button></form> : <p className="leaderboard-note">Collaboration requests are limited to UHC or LHC members. Ask an admin to assign your council membership.</p>}
        <div className="admin-subsection"><h3>Requests</h3>{data?.collaborations.length ? data.collaborations.map((collaboration) => { const isTargetCouncil = data.memberships.some((membership) => membership.house_id === collaboration.target_house_id && (membership.council_role === "uhc" || membership.council_role === "lhc")); return <article className="network-request" key={collaboration.id}><div className="network-request-heading"><strong>{collaboration.event_title}</strong><span className={`network-status-pill network-${collaboration.status}`}>{collaboration.status}</span></div><p>{houseName(collaboration.proposer_house_id)} → {houseName(collaboration.target_house_id)}</p>{collaboration.message && <p>{collaboration.message}</p>}{collaboration.status === "pending" && isTargetCouncil && <div className="network-actions"><Button size="sm" onClick={() => void review(collaboration.id, "approved")} disabled={pending}><Check size={13} />Approve</Button><Button size="sm" variant="outline" onClick={() => void review(collaboration.id, "rejected")} disabled={pending}>Decline</Button></div>}</article>}) : <p className="form-note">No collaboration requests yet.</p>}</div>
      </>}
    </section>
    <aside className="section-panel"><span className="eyebrow">APPROVAL FIRST</span><h2 className="side-panel-title">A useful connection has two sides</h2>{["A UHC or LHC starts a request", "The other house council reviews it", "Only approved collaborations are confirmed"].map((step, index) => <div className="region-stat" key={step}><span className="network-avatar">0{index + 1}</span><span>{step}</span></div>)}<p className="leaderboard-note">Every request and review is stored with its status. Pending or rejected requests do not count as collaborations.</p></aside>
  </div>
}
