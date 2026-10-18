export type EventSummary = {
  id: string
  title: string
  category: string
  format: "in_person" | "online" | "hybrid"
  city: string | null
  starts_at: string
  capacity: number
  registration_deadline?: string | null
  description?: string
  status?: string
  isDemo?: boolean
}

export const demoEvents: EventSummary[] = [
  {
    id: "demo-lucknow-ai",
    title: "AI & chai: a tiny build night",
    category: "AI & ML",
    format: "in_person",
    city: "Lucknow",
    starts_at: "2026-11-07T11:30:00.000Z",
    capacity: 28,
    description: "A relaxed, fictional demo meetup to exchange ideas and build together.",
    isDemo: true,
  },
  {
    id: "demo-chennai-studio",
    title: "Designing for the real world",
    category: "Design",
    format: "online",
    city: "Online",
    starts_at: "2026-11-08T13:00:00.000Z",
    capacity: 40,
    description: "An illustrative online session exploring human-centered product design.",
    isDemo: true,
  },
  {
    id: "demo-bengaluru-study",
    title: "Sunday study club",
    category: "Study group",
    format: "hybrid",
    city: "Bengaluru",
    starts_at: "2026-11-09T06:30:00.000Z",
    capacity: 24,
    description: "A fictional co-study session with a low-pressure hybrid format.",
    isDemo: true,
  },
]

export const demoVenues = [
  { id: "venue-a", name: "The Reading Room", city: "Lucknow", cost: 250, capacity: 32, detail: "Quiet corners · step-free access" },
  { id: "venue-b", name: "Mosaic Commons", city: "Lucknow", cost: 320, capacity: 40, detail: "Workshop tables · transit nearby" },
  { id: "venue-c", name: "The Garden Table", city: "Lucknow", cost: 180, capacity: 24, detail: "Outdoor seating · weather dependent" },
]

export const communitySignals = [
  { city: "Chennai", label: "Tamil Nadu", coordinates: [13.0827, 80.2707] as [number, number], count: 14 },
  { city: "Bengaluru", label: "Karnataka", coordinates: [12.9716, 77.5946] as [number, number], count: 9 },
  { city: "Lucknow", label: "Uttar Pradesh", coordinates: [26.8467, 80.9462] as [number, number], count: 6 },
  { city: "Pune", label: "Maharashtra", coordinates: [18.5204, 73.8567] as [number, number], count: 8 },
]
