"use client"

import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet"
import type { EventSummary, communitySignals } from "@/lib/demo-data"

type Signals = typeof communitySignals

export default function MapCanvas({ events, signals }: { events: EventSummary[]; signals: Signals }) {
  return (
    <MapContainer center={[20.6, 78.9]} zoom={4} scrollWheelZoom={false} zoomControl className="regional-leaflet-map">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {signals.map((signal) => {
        const event = events.find((item) => item.city?.toLowerCase() === signal.city.toLowerCase())
        return (
          <CircleMarker
            key={signal.city}
            center={signal.coordinates}
            radius={event ? 9 : 6}
            pathOptions={{ color: event ? "#8b7cff" : "#45e3ff", fillColor: event ? "#8b7cff" : "#45e3ff", fillOpacity: 0.78, weight: 2 }}
          >
            <Popup><strong>{signal.city}</strong><br />{event?.title ?? `${signal.count} fictional community signals`}<br />Approximate region · demo</Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
