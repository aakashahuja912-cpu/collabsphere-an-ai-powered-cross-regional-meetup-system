import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, CircleDot } from "lucide-react"
import { AuthForm } from "@/components/auth-form"

export const metadata: Metadata = { title: "Sign in or create your account" }

export default async function AuthPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  return (
    <main className="auth-page">
      <div className="auth-brand"><Link href="/" className="brand-lockup"><span className="brand-mark"><CircleDot size={20} /></span><span>collab<span>verse</span></span></Link><Link href="/" className="auth-back"><ArrowLeft size={15} /> Back to the demo</Link></div>
      <div className="auth-main"><div className="auth-orbit" aria-hidden="true"><span /><span /><span /></div><p className="eyebrow">COLLABORATE ACROSS EVERY HOUSE</p><h1>Meet nearby.<br />Build <em>together.</em></h1><p className="auth-intro">Join Collabverse to discover student peers, vote on meetup venues, register for approved events and propose cross-house collaborations.</p><div className="auth-domain-tags" aria-label="Collabverse features"><span>Meetup discovery</span><span>Venue voting</span><span>House collaborations</span></div><AuthForm callbackError={error === "callback"} /><p className="auth-privacy">Your profile is private by default. You control whether people can discover it.</p></div>
      <div className="auth-footer"><span>DEMO MODE IS ALWAYS AVAILABLE</span><span>Use a real email to create an account.</span></div>
    </main>
  )
}
