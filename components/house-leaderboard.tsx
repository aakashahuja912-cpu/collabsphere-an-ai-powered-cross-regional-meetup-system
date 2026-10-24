"use client"

import { useState } from "react"
import useSWR from "swr"
import { AdminConsole } from "@/components/admin-console"
import { ShieldCheck, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"

type House = { id: string; name: string; points: number }
const fetcher = async (url: string) => {
  const response = await fetch(url)
  const data = await response.json()
  if (!response.ok) throw new Error(data.error ?? "Leaderboard could not be loaded.")
  return data as { houses: House[] }
}

export function HouseLeaderboard({ isAdmin, onNotify }: { isAdmin: boolean; onNotify: (message: string) => void }) {
  const { data, error, isLoading, mutate } = useSWR("/api/leaderboard", fetcher, { revalidateOnFocus: false })
  const [showAdmin, setShowAdmin] = useState(false)
  return <div className="house-leaderboard-layout">
    <section className="section-panel" aria-labelledby="house-leaderboard-title">
      <div className="card-heading"><div><span className="eyebrow">VERIFIED COMMUNITY IMPACT</span><h2 id="house-leaderboard-title">House leaderboard</h2></div><Button variant="outline" onClick={() => void mutate()}><Trophy size={14} /> Refresh</Button></div>
      <p className="leaderboard-note">All 12 houses start at zero. Points are awarded only for server-verified attendance; this is a community feature, not official IITM BS scoring.</p>
      {isLoading ? <p className="inline-empty" role="status">Loading live house scores…</p> : error ? <p className="form-error" role="alert">{error.message}</p> : <div className="leaderboard-list">{(data?.houses ?? []).map((house, index) => <div className="leaderboard-row" key={house.id}><span className="leaderboard-rank">{String(index + 1).padStart(2, "0")}</span><span><strong>{house.name}</strong><small>House community</small></span><span className="leaderboard-score">{house.points} pts</span></div>)}</div>}
      {!data?.houses?.length && !isLoading && !error && <p className="inline-empty">No house records are available yet.</p>}
      {isAdmin && <div className="admin-entry"><Button variant="outline" onClick={() => setShowAdmin((visible) => !visible)}><ShieldCheck size={14} />{showAdmin ? "Hide admin controls" : "Open admin controls"}</Button>{showAdmin && <AdminMount onNotify={onNotify} />}</div>}
    </section>
  </div>
}

function AdminMount({ onNotify }: { onNotify: (message: string) => void }) {
  return <AdminConsole onNotify={onNotify} />
}
