"use client"

import dynamic from "next/dynamic"
import type { EventSummary } from "@/lib/demo-data"
import { communitySignals } from "@/lib/demo-data"

const MapCanvas = dynamic(() => import("@/components/map-canvas"), {
  ssr: false,
  loading: () => <div className="map-loading" role="status">Loading the community map…</div>,
})

export function RegionalMap({ events, tall = false }: { events: EventSummary[]; tall?: boolean }) {
  return (
    <section className={`map-panel${tall ? " map-panel-tall" : ""}`} aria-label="Approximate regional event map">
      <MapCanvas events={events} signals={communitySignals} />
      <div className="map-attribution-note">Illustrative city-level activity. No student home locations.</div>
    </section>
  )
}
