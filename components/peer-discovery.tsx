"use client"

import { useState } from "react"
import useSWR from "swr"
import { LocateFixed, MapPin, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

type PeerData = { peers: { id: string; displayName: string; city: string | null; distance: string }[]; sharing: boolean }
const fetcher = async (url: string) => {
  const response = await fetch(url)
  const data = await response.json()
  if (!response.ok) throw new Error(data.error ?? "Nearby peers could not be loaded.")
  return data as PeerData
}

export function PeerDiscovery({ userId, onNotify }: { userId: string | null; onNotify: (message: string) => void }) {
  const { data, error, isLoading, mutate } = useSWR(userId ? "/api/peer-locations" : null, fetcher)
  const [pending, setPending] = useState(false)
  async function setSharing(enabled: boolean) {
    if (enabled && !navigator.geolocation) { onNotify("Location access is not available in this browser."); return }
    setPending(true)
    const save = async (coords?: { latitude: number; longitude: number }) => {
      try {
        const response = await fetch("/api/peer-locations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled, ...coords }) })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error ?? "Location sharing could not be updated.")
        onNotify(enabled ? "Your approximate area is shared for 15 minutes. Turn it off any time." : "Location sharing is off and your saved location was removed.")
        await mutate()
      } catch (saveError) { onNotify(saveError instanceof Error ? saveError.message : "Location sharing could not be updated.") }
      finally { setPending(false) }
    }
    if (!enabled) { await save(); return }
    navigator.geolocation.getCurrentPosition(
      (position) => { void save({ latitude: position.coords.latitude, longitude: position.coords.longitude }) },
      () => { setPending(false); onNotify("Location permission was not granted. You can continue using Discover without sharing it.") },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 12_000 },
    )
  }

  if (!userId) return <section className="section-panel"><h2>Find nearby peers</h2><p className="form-note">Sign in to opt in to location-based discovery. Your location stays off by default.</p></section>
  return <div className="discover-layout"><section className="section-panel"><div className="card-heading"><div><span className="eyebrow">LOCATION OPT-IN · 15 MINUTES</span><h2>Peers near your area</h2></div><LocateFixed size={17} color="var(--cyan)" /></div><p className="leaderboard-note">Sharing is optional. Your exact coordinates are used only to find peers and are never shown to them. Other students see a distance band, not a pin. Your location expires after 15 minutes.</p>{error && <p className="form-error" role="alert">{error.message}</p>}{isLoading ? <p className="inline-empty" role="status">Checking your location-sharing status…</p> : data?.sharing ? <><div className="sharing-state"><ShieldCheck size={15} /><span>Location sharing is on until it expires</span></div><Button variant="outline" onClick={() => void setSharing(false)} disabled={pending}>Turn off and remove location</Button></> : <Button onClick={() => void setSharing(true)} disabled={pending}><MapPin size={14} />{pending ? "Requesting location…" : "Enable location access"}</Button>}</section><section className="section-panel"><div className="eyebrow">OPTED-IN PEERS</div><h2 className="side-panel-title">Meet around shared interests</h2>{data?.peers.length ? data.peers.map((peer) => <div className="peer-row" key={peer.id}><span className="network-avatar">{peer.displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span><span><strong>{peer.displayName}</strong><small>{peer.distance}{peer.city ? ` · ${peer.city}` : ""}</small></span></div>) : <p className="form-note">{data?.sharing ? "No discoverable peers have shared a nearby location yet." : "Nearby peers appear here only after you opt in and allow location access."}</p>}</section></div>
}
