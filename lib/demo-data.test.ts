import { describe, expect, it } from "vitest"
import { communitySignals, demoEvents, demoVenues } from "./demo-data"

describe("fictional demo data", () => {
  it("labels every sample event as demo content", () => {
    expect(demoEvents.length).toBeGreaterThan(0)
    expect(demoEvents.every((event) => event.isDemo)).toBe(true)
  })

  it("uses broad city-level signals instead of precise people locations", () => {
    expect(communitySignals.map(({ city }) => city)).toContain("Lucknow")
    expect(communitySignals.every(({ coordinates }) => coordinates.length === 2)).toBe(true)
  })

  it("keeps all catalog venue examples explicitly flagged", () => {
    expect(demoVenues.length).toBeGreaterThanOrEqual(3)
    expect(new Set(demoVenues.map(({ id }) => id)).size).toBe(demoVenues.length)
  })
})
