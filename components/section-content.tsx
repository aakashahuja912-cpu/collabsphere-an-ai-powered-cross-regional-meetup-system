"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, CalendarDays, Check, Heart, MapPin, MessageSquare, Sparkles, Users, Vote } from "lucide-react"
import { AdminConsole } from "@/components/admin-console"
import { CollaborationNetwork } from "@/components/collaboration-network"
import { HouseLeaderboard } from "@/components/house-leaderboard"
import { MeetupActions } from "@/components/meetup-actions"
import { PeerDiscovery } from "@/components/peer-discovery"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RegionalMap } from "@/components/regional-map"
import { communitySignals, demoVenues, type EventSummary } from "@/lib/demo-data"

export type SectionKey = "home" | "map" | "discover" | "events" | "venuevote" | "copilot" | "network" | "leaderboard" | "notifications" | "profile" | "admin"
type SessionUser = { id: string; email: string; displayName: string; role: string } | null

const pageCopy: Record<Exclude<SectionKey, "home">, { label: string; title: string; description: string }> = {
  map: { label: "COMMUNITY PULSE", title: "A community without borders.", description: "Discover meetup ideas at a city level. Map markers show example events and broad regional signals, never individual student locations." },
  discover: { label: "FIND YOUR PEOPLE", title: "Start with what you love.", description: "Interest-based demo matches turn shared curiosity into a possible next step. Nothing here represents real availability." },
  events: { label: "GATHER AROUND SOMETHING", title: "Good things start somewhere.", description: "Explore published events and fictional examples. New proposals stay private until an authorized review." },
  venuevote: { label: "VENUEVOTE", title: "Pick the place, together.", description: "Compare candidate demo venues. Sample vote totals are fictional; organizers always confirm availability before announcing a venue." },
  copilot: { label: "COPILOT · TEMPLATE MODE", title: "A blank page, less blank.", description: "Turn a rough idea into an editable starting point with deterministic planning templates. Review every detail before proposing an event." },
  network: { label: "CROSS-HOUSE COLLABORATION", title: "Better things are built together.", description: "See how communities might collaborate on a shared idea. Invitations below are illustrative and do not contact real groups." },
  leaderboard: { label: "COMMUNITY IMPACT", title: "Every contribution counts.", description: "A transparent demo of how verified participation can be recognized. These sample points are not official IITM BS scoring rules." },
  notifications: { label: "YOUR UPDATES", title: "A little closer to the loop.", description: "A fictional feed shows the kinds of useful updates you can receive when you host, attend and collaborate." },
  profile: { label: "YOUR COMMUNITY PASSPORT", title: "Your profile, on your terms.", description: "Profile discovery is opt-in. Demo details are fictional; signed-in profiles are created only when you choose to register." },
  admin: { label: "ADMINISTRATION", title: "A safer community starts here.", description: "Review event proposals, assign verified house councils, and manage account roles with an auditable admin workflow." },
}

function PageHeading({ section, onCreate }: { section: Exclude<SectionKey, "home">; onCreate: (title?: string) => void }) {
  const copy = pageCopy[section]
  return (
    <header className="page-heading">
      <div><span className="eyebrow">{copy.label}</span><h1>{copy.title}</h1><p>{copy.description}</p></div>
      {(section === "events" || section === "copilot") && <Button onClick={() => onCreate()}><Sparkles size={15} /> New event proposal</Button>}
    </header>
  )
}

function MapPage({ events }: { events: EventSummary[] }) {
  return (
    <div className="map-page-layout">
      <Card className="section-panel"><div className="card-heading"><div><span className="eyebrow">ILLUSTRATIVE REGIONAL SIGNALS</span><h2>Possibility has a place</h2></div><span className="map-key map-key-cyan" /></div><div className="map-panel-tall"><RegionalMap events={events} tall /></div></Card>
      <Card className="section-panel"><div className="card-heading"><div><span className="eyebrow">BROAD, NOT PRECISE</span><h2>Regions in the demo</h2></div></div><div>{communitySignals.map((signal) => <div className="region-stat" key={signal.city}><MapPin size={14} color="#45e3ff" /><span>{signal.city}<small style={{ display: "block", marginTop: 3, color: "#77829b", fontSize: 8 }}>{signal.label}</small></span><strong>{String(signal.count).padStart(2, "0")}</strong></div>)}</div><p className="leaderboard-note">Illustrative city-level activity. No residential locations or individual positions are shown.</p><Link href="/events" className={buttonVariants({ variant: "outline" })}>Browse example events <ArrowRight size={14} /></Link></Card>
    </div>
  )
}

function DiscoverPage({ onCreate }: { onCreate: (title?: string) => void }) {
  const opportunities = [
    { title: "AI & chai: a tiny build night", city: "Lucknow", tags: ["AI & ML", "Python", "Creative coding"], detail: "A relaxed 2-hour idea exchange with a short hands-on build." },
    { title: "Sunday study club", city: "Bengaluru", tags: ["Study group", "Co-working", "Accountability"], detail: "A low-pressure study session with both online and local options." },
    { title: "Designing for the real world", city: "Online", tags: ["Product design", "Accessibility", "Feedback"], detail: "A small critique circle for works in progress." },
  ]
  return <div className="matching-grid">{opportunities.map((idea, index) => <Card className="match-opportunity" key={idea.title}><span>MATCH {String(84 - index * 9).padStart(2, "0")} · DEMO RECOMMENDATION</span><h3>{idea.title}</h3><p>{idea.detail}</p><div className="interest-pills">{idea.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><button type="button" onClick={() => onCreate(idea.title)}>Start a proposal <ArrowRight size={13} /></button><p className="form-note">{idea.city} · possible group, not confirmed availability</p></Card>)}</div>
}

function EventsPage({ events, user, onCreate, onNotify }: { events: EventSummary[]; user: SessionUser; onCreate: (title?: string) => void; onNotify: (message: string) => void }) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("all")
  const filteredEvents = useMemo(() => events.filter((event) => {
    const matchesText = `${event.title} ${event.city ?? ""} ${event.category}`.toLowerCase().includes(query.toLowerCase())
    return matchesText && (category === "all" || event.category.toLowerCase().includes(category))
  }), [events, query, category])

  return <Card className="section-panel"><div className="card-heading"><div><span className="eyebrow">PUBLIC EVENTS + CLEARLY LABELLED EXAMPLES</span><h2>Find a reason to meet</h2></div><Button variant="outline" onClick={() => onCreate()}>Propose an event</Button></div><div className="content-toolbar"><Input aria-label="Search events" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by event, city or idea…" /><select aria-label="Filter events by category" value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option><option value="ai">AI &amp; ML</option><option value="study">Study group</option><option value="design">Design</option></select><span className="results-count">{filteredEvents.length} shown</span></div><div className="event-grid">{filteredEvents.map((event) => { const starts = new Date(event.starts_at); return <article className="event-tile" key={event.id}><div className="event-tile-top"><span className="event-category">{event.category}</span><span className={event.isDemo ? "event-kind" : "event-status"}>{event.isDemo ? "DEMO" : "PUBLISHED"}</span></div><h3>{event.title}</h3><p>{event.description ?? "Come meet, share ideas and make something together."}</p><div className="event-tile-meta"><span><CalendarDays size={12} />{starts.toLocaleDateString("en", { month: "short", day: "numeric" })}</span><span><MapPin size={12} />{event.city ?? "Online"}</span><span><Users size={12} />Up to {event.capacity}</span></div>{event.isDemo ? <Button variant="outline" onClick={() => onNotify("This is a fictional event example. Registration is not being recorded.")}>Explore example<ArrowRight size={13} /></Button> : <MeetupActions eventId={event.id} eventTitle={event.title} userId={user?.id ?? null} canVerify={!!user && (user.role === "admin" || user.role === "organizer" || user.role === "regional_coordinator" || event.creator_id === user.id)} />}</article>})}</div>{filteredEvents.length === 0 && <div className="inline-empty">No events match that search. Try a different city or category.</div>}</Card>
}

function VenueVotePage({ onNotify }: { onNotify: (message: string) => void }) {
  const [vote, setVote] = useState<string | null>(null)
  return <Card className="section-panel"><div className="card-heading"><div><span className="eyebrow">3 OPTIONS · SAMPLE POLL</span><h2>AI &amp; chai: where should we meet?</h2></div><span className="privacy-state">DEMO RESULTS</span></div><div className="venue-grid">{demoVenues.map((venue, index) => { const counts = [14, 9, 6]; return <article className="venue-card" key={venue.id} data-selected={vote === venue.id}><div className="venue-art"><span>FICTIONAL VENUE</span></div><h3>{venue.name}</h3><p><MapPin size={11} /> {venue.city}, approximate meetup area</p><div className="venue-detail">₹{venue.cost} / person · {venue.capacity} capacity</div><div className="venue-detail">{venue.detail}</div><div className="venue-vote-results"><span>{vote === venue.id ? "Your demo selection" : "Example votes"}</span><strong>{counts[index]} votes</strong></div><Button variant={vote === venue.id ? "default" : "outline"} onClick={() => { setVote(venue.id); onNotify("Demo vote selected for this view only. No real vote was submitted.") }}>{vote === venue.id ? <><Check size={13} /> Selected for demo</> : <><Vote size={13} /> Try a demo vote</>}</Button></article>})}</div><p className="leaderboard-note">Demo interactions are temporary and will reset when the page refreshes. Real voting requires an approved event, registration eligibility, a valid poll and a server-verified deadline.</p></Card>
}

function CopilotPage({ onCreate }: { onCreate: (title?: string) => void }) {
  const [prompt, setPrompt] = useState("")
  const [planTitle, setPlanTitle] = useState("")
  const quickStarts = ["Plan a coding meetup", "Organize a sports session", "Create a study group", "Plan an online workshop"]
  function generatePlan(source: string) {
    setPrompt(source)
    const lower = source.toLowerCase()
    const title = lower.includes("sport") ? "A friendly community sports session" : lower.includes("study") ? "A focused community study club" : lower.includes("online") ? "A cross-region online workshop" : lower.includes("design") ? "Designing for the real world" : "AI & chai: a tiny build night"
    setPlanTitle(title)
  }
  return <div className="ai-studio"><div className="section-kicker"><span className="sparkle-icon"><Sparkles size={15} /></span><span>COLLABVERSE COPILOT<small>DETERMINISTIC DEMO MODE · NO AI API CONNECTED</small></span></div><p className="form-note">Describe the kind of gathering you have in mind. The starter plan is a deterministic template, not a claim about real people or availability.</p><div className="ai-prompt-row"><Textarea aria-label="Describe a meetup idea" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="e.g. An AI workshop for 25 students in Lucknow with a ₹400 budget…" /><Button onClick={() => generatePlan(prompt || "Plan an AI meetup") }><Sparkles size={14} /> Build a starter plan</Button></div><div className="quick-prompts">{quickStarts.map((idea) => <button key={idea} type="button" onClick={() => generatePlan(idea)}>{idea}</button>)}</div>{planTitle && <article className="copilot-result"><span className="eyebrow">EDITABLE STARTER · DEMO TEMPLATE</span><Input aria-label="Edit generated event title" value={planTitle} onChange={(event) => setPlanTitle(event.target.value)} /><p>Two-hour gathering · 20–25 suggested attendees · estimate ₹300 per person. Start with a quick hello, share ideas in small groups and leave time for one next step. Confirm the date, venue, budget and co-hosts before submitting.</p><ul className="agenda-list"><li>Welcome &amp; context · 15 min</li><li>Build or work together · 60 min</li><li>Show &amp; share · 30 min</li><li>Next steps · 15 min</li></ul><Button variant="outline" onClick={() => onCreate(planTitle)}>Review and submit proposal <ArrowRight size={13} /></Button></article>}</div>
}

function CollaborationPage({ user, onNotify }: { user: SessionUser; onNotify: (message: string) => void }) {
  return <CollaborationNetwork userId={user?.id ?? null} onNotify={onNotify} />
}

function LeaderboardPage({ user, onNotify }: { user: SessionUser; onNotify: (message: string) => void }) {
  return <HouseLeaderboard isAdmin={user?.role === "admin"} onNotify={onNotify} />
}

function NotificationsPage() {
  const [read, setRead] = useState<number[]>([])
  const notices = [{ icon: <CalendarDays size={14} />, title: "A new idea is brewing nearby", message: "AI & chai: a tiny build night · Lucknow · fictional sample", time: "Just now" }, { icon: <Vote size={14} />, title: "The community is picking a place", message: "Three sample venue options · fictional poll", time: "1 hour ago" }, { icon: <MessageSquare size={14} />, title: "A collaboration could be next", message: "House of Design · fictional example invitation", time: "Yesterday" }]
  return <Card className="section-panel"><div className="card-heading"><div><span className="eyebrow">A QUIETER INBOX</span><h2>Community updates</h2></div><Button variant="ghost" size="sm" onClick={() => setRead([0, 1, 2])}>Mark all read</Button></div><div className="notification-list">{notices.map((notice, index) => <button className="notification-row" data-read={read.includes(index)} type="button" key={notice.title} onClick={() => setRead((items) => items.includes(index) ? items.filter((item) => item !== index) : [...items, index])}><span className="notification-mark" /><span>{notice.icon}</span><span><strong>{notice.title}</strong><p>{notice.message}</p><small>{read.includes(index) ? "Read" : notice.time} · click to mark read</small></span></button>)}</div><p className="leaderboard-note">Sample notifications are local to this demo view. A live account receives updates tied to real event actions.</p></Card>
}

function ProfilePage({ user, displayName, onNotify }: { user: SessionUser; displayName: string; onNotify: (message: string) => void }) {
  const initials = displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()
  return <div className="page-layout"><Card className="section-panel"><div className="profile-summary"><span className="profile-avatar-large">{initials || "CS"}</span><span><h3>{displayName}</h3><p>{user ? user.email : "Demo profile · no account required"}</p></span></div><div className="privacy-setting"><span><strong>Discoverable by other students</strong><p>Profiles are private by default. Discovery only happens after explicit opt-in.</p></span><span className="privacy-state">{user ? "PRIVATE BY DEFAULT" : "DEMO PROFILE"}</span></div><div className="privacy-setting"><span><strong>Your interests</strong><p>AI &amp; ML · Study groups · Building things together</p></span><span className="privacy-state">EXAMPLE</span></div><Button variant="outline" onClick={() => onNotify(user ? "Your profile is private by default. Discovery settings are not changed by this demo action." : "Create an account to manage your own private profile.")}>{user ? "Review privacy options" : "Create your profile"}<ArrowRight size={13} /></Button></Card><Card className="section-panel"><div className="eyebrow">YOUR COMMUNITY PASSPORT</div><h2 style={{ marginTop: 9, fontSize: 16 }}>Recognition, earned not guessed.</h2><div className="impact-row"><div className="impact-ring"><strong>0</strong><span>pts</span></div><div><strong>{user ? "Your account is ready" : "Your demo starts here"}</strong><p>Verified participation can be recognized after you attend.</p></div></div><p className="leaderboard-note">A QR check-in verifies successful check-in only, not continuous physical presence.</p><Button variant="ghost" onClick={() => onNotify("Attendance verification is shown as a demo workflow in this build.")}><Heart size={13} /> Learn about attendance</Button></Card></div>
}

export function SectionContent({ section, events, user, displayName, onCreate, onNotify }: { section: Exclude<SectionKey, "home">; events: EventSummary[]; user: SessionUser; displayName: string; onCreate: (title?: string) => void; onNotify: (message: string) => void }) {
  const content = section === "map" ? <MapPage events={events} /> : section === "discover" ? <PeerDiscovery userId={user?.id ?? null} onNotify={onNotify} /> : section === "events" ? <EventsPage events={events} user={user} onCreate={onCreate} onNotify={onNotify} /> : section === "venuevote" ? <VenueVotePage onNotify={onNotify} /> : section === "copilot" ? <CopilotPage onCreate={onCreate} /> : section === "network" ? <CollaborationPage user={user} onNotify={onNotify} /> : section === "leaderboard" ? <LeaderboardPage user={user} onNotify={onNotify} /> : section === "notifications" ? <NotificationsPage /> : section === "profile" ? <ProfilePage user={user} displayName={displayName} onNotify={onNotify} /> : user?.role === "admin" ? <AdminConsole onNotify={onNotify} /> : <Card className="section-panel"><h2>Admin access required</h2><p className="form-note">Sign in with an administrator account to manage proposals, roles, and council assignments.</p></Card>
  return <div className="section-page float-in"><PageHeading section={section} onCreate={onCreate} />{content}</div>
}
