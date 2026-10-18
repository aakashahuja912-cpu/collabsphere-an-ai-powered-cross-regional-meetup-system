"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, Bell, CalendarDays, ChevronRight, CircleDot, Compass, Layers3, Map, Moon, Search, Sparkles, Sun, Trophy, UserRound, Users, Vote } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { DashboardContent } from "@/components/dashboard-content"
import { EventProposalDialog } from "@/components/event-proposal-dialog"
import { SectionContent, type SectionKey } from "@/components/section-content"
import type { EventSummary } from "@/lib/demo-data"

type SessionUser = { id: string; email: string; displayName: string; role: string } | null

const navigation = [
  { title: "OVERVIEW", links: [{ href: "/", name: "Home", icon: Activity, key: "home" }] },
  { title: "DISCOVER", links: [{ href: "/map", name: "Community map", icon: Map, key: "map" }, { href: "/discover", name: "Discover people", icon: Compass, key: "discover" }, { href: "/events", name: "Events", icon: CalendarDays, key: "events" }] },
  { title: "BUILD TOGETHER", links: [{ href: "/venuevote", name: "VenueVote", icon: Vote, key: "venuevote" }, { href: "/copilot", name: "AI Copilot", icon: Sparkles, key: "copilot" }, { href: "/network", name: "Collaboration network", icon: Users, key: "network" }] },
  { title: "YOUR COMMUNITY", links: [{ href: "/leaderboard", name: "Leaderboard", icon: Trophy, key: "leaderboard" }, { href: "/notifications", name: "Notifications", icon: Bell, key: "notifications" }, { href: "/profile", name: "My profile", icon: UserRound, key: "profile" }] },
]
const mobileLinks = [{ href: "/", name: "Home", icon: Activity }, { href: "/map", name: "Map", icon: Map }, { href: "/discover", name: "Discover", icon: Compass }, { href: "/events", name: "Events", icon: CalendarDays }, { href: "/profile", name: "Profile", icon: UserRound }]
const sectionNames: Record<SectionKey, string> = { home: "Home", map: "Community map", discover: "Discover people", events: "Events", venuevote: "VenueVote", copilot: "AI Copilot", network: "Collaboration network", leaderboard: "Leaderboard", notifications: "Notifications", profile: "My profile", admin: "Administration" }

function Brand() {
  return <Link href="/" className="sidebar-brand" aria-label="Collabverse home"><span className="brand-mark"><CircleDot size={18} /></span><span className="brand-wordmark">collab<span>verse</span></span></Link>
}

function Sidebar({ section, user }: { section: SectionKey; user: SessionUser }) {
  const initials = user?.displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() ?? "G"
  return <aside className="sidebar"><Brand /><nav aria-label="Main navigation">{navigation.map((group) => <div className="sidebar-section" key={group.title}><p className="sidebar-nav-label">{group.title}</p>{group.links.map((item) => { const Icon = item.icon; return <Link className="nav-link" data-active={section === item.key} aria-current={section === item.key ? "page" : undefined} href={item.href} key={item.key} title={item.name}><span className="nav-icon"><Icon size={16} strokeWidth={1.8} /></span><span className="sidebar-label">{item.name}</span>{item.key === "notifications" && <span className="nav-count">03</span>}</Link>})}</div>)}</nav><div className="sidebar-footer"><div className="sidebar-note"><strong>Bring an idea to life</strong><p>A great meetup can start with one thing in common.</p><Link href="/copilot">Open the Copilot →</Link></div><div className="sidebar-account"><span className="avatar-chip">{initials}</span><span className="sidebar-account-copy"><strong>{user?.displayName ?? "Exploring demo"}</strong><span>{user ? "Community member" : "Demo space · no sign in"}</span></span><span className="sidebar-label"><Layers3 size={15} color="#72809a" /></span></div></div></aside>
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const nextTheme = theme === "dark" ? "light" : "dark"
  const Icon = theme === "dark" ? Sun : Moon

  return <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${nextTheme} mode`} title={`Switch to ${nextTheme} mode`} aria-pressed={theme === "light"}><Icon size={16} aria-hidden="true" /><span className="sr-only">Switch to {nextTheme} mode</span></button>
}

function TopBar({ section, user, search, onSearch }: { section: SectionKey; user: SessionUser; search: string; onSearch: (value: string) => void }) {
  const pathname = usePathname()
  return <><header className="topbar"><div className="topbar-crumb"><span>COLLABVERSE</span><ChevronRight size={13} /><strong>{sectionNames[section]}</strong></div><div className="topbar-right"><label className="search-wrap"><Search size={14} /><input value={search} onChange={(event) => onSearch(event.target.value)} aria-label="Search events and places" placeholder="Search events, places…" /><kbd className="search-shortcut">/</kbd></label><ThemeToggle /><Link href="/notifications" className="topbar-bell" aria-label="Notifications"><Bell size={16} /><span className="bell-dot" /></Link><span className="topbar-divider" /><Link href="/profile" className="avatar-chip" aria-label={user ? `Your profile: ${user.displayName}` : "Demo profile"}>{user?.displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() ?? "G"}</Link><Link href={user ? "/profile" : "/auth"} className="topbar-account">{user ? user.displayName : "Sign in"}</Link></div></header><div className="mobile-header"><Brand /><div className="mobile-actions"><ThemeToggle /><Link href="/notifications" aria-label="Notifications"><Bell size={17} /></Link>{user ? <Link href="/profile" className="avatar-chip" aria-label="Your profile">{user.displayName.slice(0, 1).toUpperCase()}</Link> : <Link href="/auth" aria-label="Sign in"><UserRound size={17} /></Link>}</div></div><nav className="mobile-dock" aria-label="Mobile navigation">{mobileLinks.map((item) => { const Icon = item.icon; const active = (pathname === "/" && item.href === "/") || (item.href !== "/" && pathname.startsWith(item.href)); return <Link href={item.href} key={item.href} aria-current={active ? "page" : undefined}><Icon size={17} /><span>{item.name}</span></Link>})}</nav></>
}

export function PlatformShell({ section, user, events, proposals }: { section: SectionKey; user: SessionUser; events: EventSummary[]; proposals: EventSummary[] }) {
  const [proposalOpen, setProposalOpen] = useState(false)
  const [proposalTitle, setProposalTitle] = useState("")
  const [toast, setToast] = useState("")
  const [search, setSearch] = useState("")
  const pathname = usePathname()
  const displayName = user?.displayName ?? "there"
  const filteredEvents = useMemo(() => {
    if (!search.trim()) return events
    return events.filter((event) => `${event.title} ${event.city ?? ""} ${event.category}`.toLowerCase().includes(search.toLowerCase()))
  }, [events, search])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(""), 4200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  function openProposal(title = "") {
    setProposalTitle(title)
    setProposalOpen(true)
  }

  return <div className="platform-shell"><Sidebar section={section} user={user} /><div className="main-frame"><TopBar section={section} user={user} search={search} onSearch={setSearch} /><main className="content-wrap" id="main-content">{section === "home" ? <DashboardContent events={filteredEvents} proposals={proposals} displayName={displayName} onCreate={openProposal} onNotify={setToast} /> : <SectionContent section={section} events={filteredEvents} user={user} displayName={displayName} onCreate={openProposal} onNotify={setToast} />}</main></div><EventProposalDialog key={`${pathname}-${proposalTitle}`} user={user} open={proposalOpen} onOpenChange={setProposalOpen} onNotify={setToast} initialTitle={proposalTitle} />{toast && <div className="toast-region" role="status" aria-live="polite">{toast}</div>}</div>
}
