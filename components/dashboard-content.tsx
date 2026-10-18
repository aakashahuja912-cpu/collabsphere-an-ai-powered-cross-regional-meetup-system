import Link from "next/link"
import { ArrowRight, ArrowUpRight, Clock3, Compass, MapPin, Sparkles, Users, Vote } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RegionalMap } from "@/components/regional-map"
import type { EventSummary } from "@/lib/demo-data"

function CommunityOrb() {
  return (
    <div className="orb-stage" role="img" aria-label="Illustrative community connections, not individual locations">
      <svg viewBox="0 0 270 210" className="orb-svg" aria-hidden="true">
        <defs>
          <radialGradient id="orbGlow"><stop stopColor="#45e3ff" stopOpacity=".26" /><stop offset="1" stopColor="#45e3ff" stopOpacity="0" /></radialGradient>
          <linearGradient id="orbLine"><stop stopColor="#45e3ff" stopOpacity=".1" /><stop offset=".52" stopColor="#8b7cff" stopOpacity=".8" /><stop offset="1" stopColor="#45e3ff" stopOpacity=".16" /></linearGradient>
        </defs>
        <circle cx="135" cy="105" r="91" fill="url(#orbGlow)" className="orb-pulse" />
        <ellipse cx="135" cy="105" rx="82" ry="37" transform="rotate(-24 135 105)" fill="none" stroke="url(#orbLine)" strokeWidth="1" />
        <ellipse cx="135" cy="105" rx="70" ry="56" transform="rotate(46 135 105)" fill="none" stroke="#8b7cff" strokeOpacity=".34" strokeDasharray="3 8" />
        <path d="M69 71l37 17 28 17 38-24M79 141l38-36 42 25 35-30M106 88l11 17" fill="none" stroke="#8b7cff" strokeOpacity=".42" strokeWidth="1" />
        <circle cx="135" cy="105" r="26" fill="#111a30" stroke="#45e3ff" strokeOpacity=".65" />
        <circle cx="135" cy="105" r="19" fill="#45e3ff" fillOpacity=".08" />
        <circle cx="135" cy="105" r="5" fill="#45e3ff" />
        <circle cx="69" cy="71" r="4" fill="#45e3ff" /><circle cx="172" cy="81" r="4" fill="#9b8cff" />
        <circle cx="79" cy="141" r="3.5" fill="#43d9a3" /><circle cx="197" cy="100" r="4" fill="#45e3ff" />
        <circle cx="159" cy="130" r="3" fill="#ffbf69" /><circle cx="106" cy="88" r="3" fill="#9b8cff" />
      </svg>
      <span className="orb-label orb-label-one">ideas</span><span className="orb-label orb-label-two">people</span><span className="orb-label orb-label-three">places</span>
    </div>
  )
}

function EventRow({ event }: { event: EventSummary }) {
  const date = new Date(event.starts_at)
  return (
    <article className="event-row">
      <div className="event-date"><span>{date.toLocaleDateString("en", { month: "short" })}</span><strong>{date.toLocaleDateString("en", { day: "2-digit" })}</strong></div>
      <div className="event-row-copy"><strong>{event.title}</strong><span><MapPin size={12} /> {event.city ?? "Online"} <span className="dot-separator">·</span> {event.category}</span></div>
      {event.isDemo ? <span className="event-kind">DEMO</span> : <Badge variant="outline" className="event-status">LIVE</Badge>}
    </article>
  )
}

export function DashboardContent({
  events,
  proposals,
  displayName,
  onCreate,
  onNotify,
}: {
  events: EventSummary[]
  proposals: EventSummary[]
  displayName: string
  onCreate: (title?: string) => void
  onNotify: (message: string) => void
}) {
  const nextEvents = [...events].sort((a, b) => a.starts_at.localeCompare(b.starts_at)).slice(0, 3)
  return (
    <div className="dashboard-page float-in">
      <div className="welcome-row">
        <div><div className="eyebrow">WELCOME, {displayName.toUpperCase()} <span className="eyebrow-dot" /> COMMUNITY PULSE</div><h1>Find your people, <span>wherever you are.</span></h1><p>A smaller world starts with one shared interest.</p></div>
        <div className="welcome-actions"><Link href="/discover" className={buttonVariants({ variant: "outline" })}><Compass /> Explore community</Link><Button onClick={() => onCreate() }><Sparkles /> Plan a meetup</Button></div>
      </div>

      <div className="demo-ribbon"><span className="demo-dot" /> DEMO SPACE <span>Fictional events and regional signals · no live student data</span><Link href="/welcome">How the demo works <ArrowRight size={13} /></Link></div>

      <section className="hero-grid" aria-label="Community overview">
        <Card className="hero-card">
          <div className="hero-copy"><span className="eyebrow"><span className="live-pulse" /> YOUR COMMUNITY, IN ORBIT</span><h2>Good ideas grow<br /><em>better together.</em></h2><p>Explore nearby possibilities, find your people and give your next idea a place to start.</p><div className="hero-metrics"><span><b>04</b> regions in demo</span><span><b>03</b> sample meetups</span></div><Button variant="outline" onClick={() => onCreate("A shared-interest meetup")}>Turn a spark into a plan <ArrowRight /></Button></div>
          <CommunityOrb />
          <div className="hero-watermark">CS / 01</div>
        </Card>
        <Card className="match-card">
          <div className="section-kicker"><span className="sparkle-icon"><Sparkles size={16} /></span><span>COMMUNITY MATCHMAKER<small>DEMO · INTEREST-BASED</small></span><span className="match-score">84%</span></div>
          <h3>AI & chai: a tiny build night</h3>
          <p>People who selected AI and creative coding may enjoy a relaxed build session in Lucknow.</p>
          <div className="interest-pills"><span>AI & ML</span><span>Python</span><span>Build together</span></div>
          <div className="match-footer"><span><Users size={14} /> Suggested group · 8–12 people</span><button type="button" className="text-action" onClick={() => onCreate("AI & chai: a tiny build night")}>Make a proposal <ArrowUpRight size={14} /></button></div>
        </Card>
      </section>

      {proposals.length > 0 && <section className="saved-proposals"><div className="card-heading"><div><span className="eyebrow">YOUR PRIVATE EVENT STUDIO</span><h2>Your proposals</h2></div><span className="privacy-state">ONLY VISIBLE TO YOU</span></div>{proposals.map((proposal) => <div className="proposal-status-row" key={proposal.id}><span><strong>{proposal.title}</strong><small>{proposal.city ?? "Online"} · submitted for review</small></span><span className="proposal-status-pill">{proposal.status?.replaceAll("_", " ") ?? "submitted"}</span></div>)}</section>}

      <section className="overview-grid" aria-label="Upcoming community events and regional map">
        <Card className="content-card event-card">
          <div className="card-heading"><div><span className="eyebrow">A REASON TO GET TOGETHER</span><h2>Coming up</h2></div><Link href="/events" className={buttonVariants({ variant: "ghost", size: "sm" })}>All events <ArrowRight /></Link></div>
          <div className="event-list">{nextEvents.map((event) => <EventRow event={event} key={event.id} />)}</div>
          {nextEvents.length === 0 && <p className="empty-note">New events will show up here.</p>}
          <button type="button" className="online-session" onClick={() => onNotify("Online session suggestions use fictional demo information.")}><span className="online-icon"><Clock3 size={15} /></span><span><b>Good ideas have no postcode.</b><small>Browse an online session for this week</small></span><ArrowRight size={15} /></button>
        </Card>

        <Card className="content-card map-card">
          <div className="card-heading"><div><span className="eyebrow">FOUR REGIONS · ONE COMMUNITY</span><h2>Community, in view</h2></div><Link href="/map" aria-label="Open community map" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}><ArrowUpRight /></Link></div>
          <div className="mini-map-wrap"><RegionalMap events={events} /></div>
          <div className="map-caption"><span><span className="map-key map-key-cyan" /> Example regional signals</span><Link href="/map">Explore the map <ArrowRight size={13} /></Link></div>
        </Card>
      </section>

      <section className="bottom-grid" aria-label="Community impact">
        <Card className="content-card impact-card">
          <div className="card-heading"><div><span className="eyebrow">SMALL MOMENTS ADD UP</span><h2>Your community impact</h2></div><span className="impact-icon"><Sparkles size={16} /></span></div>
          <div className="impact-row"><div className="impact-ring"><strong>0</strong><span>pts</span></div><div><strong>Start with a hello.</strong><p>Attend an event to earn your first demo badge.</p></div></div>
          <div className="badge-track"><span className="badge-lock">01</span><span><b>Community explorer</b><small>Attend your first meetup · demo milestone</small></span><span className="locked-state">NOT EARNED</span></div>
        </Card>
        <Card className="venue-peek">
          <div className="venue-glow" aria-hidden="true" />
          <div className="section-kicker"><span className="venue-icon"><Vote size={17} /></span><span>VENUEVOTE<small>COMMUNITY CHOOSES TOGETHER</small></span></div>
          <h3>Where should we meet?</h3><p>Compare three fictional Lucknow spots for the AI & chai demo event.</p>
          <div className="venue-vote-bar"><span style={{ width: "46%" }} /><span style={{ width: "34%" }} /><span style={{ width: "20%" }} /></div>
          <div className="venue-vote-labels"><span>The Reading Room <b>46%</b></span><span className="vote-total">14 demo votes</span></div>
          <Link href="/venuevote" className={buttonVariants({ variant: "outline", size: "sm" })}>See the poll <ArrowRight /></Link>
        </Card>
      </section>
      <footer className="dashboard-footer">Made for the in-between moments. <span>Demo content is illustrative and not affiliated with or endorsed by IIT Madras.</span></footer>
    </div>
  )
}
