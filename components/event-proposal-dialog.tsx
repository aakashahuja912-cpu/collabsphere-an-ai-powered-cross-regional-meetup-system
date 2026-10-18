"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type SessionUser = { id: string; email: string; displayName: string } | null

export function EventProposalDialog({
  user,
  open,
  onOpenChange,
  onNotify,
  initialTitle = "",
}: {
  user: SessionUser
  open: boolean
  onOpenChange: (open: boolean) => void
  onNotify: (message: string) => void
  initialTitle?: string
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")

  async function submitProposal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return

    const formData = new FormData(event.currentTarget)
    setPending(true)
    setError("")

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          description: formData.get("description"),
          category: formData.get("category"),
          format: formData.get("format"),
          city: formData.get("city") || null,
          starts_at: new Date(String(formData.get("startsAt"))).toISOString(),
          capacity: Number(formData.get("capacity")),
          budget_per_person: Number(formData.get("budget")),
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? "Your proposal could not be saved.")

      onOpenChange(false)
      onNotify("Proposal submitted. It will not appear publicly until approved.")
      router.refresh()
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Please try again.")
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="proposal-dialog">
        <DialogHeader className="proposal-dialog-header">
          <span className="eyebrow"><Sparkles size={13} /> EVENT STUDIO</span>
          <DialogTitle>Start with a shared idea</DialogTitle>
          <DialogDescription>Shape the essentials now. Organizers can add hosts, venues and a fuller agenda after approval.</DialogDescription>
        </DialogHeader>
        {user ? (
          <form className="proposal-form" onSubmit={submitProposal}>
            <label htmlFor="proposal-title">Event title</label>
            <Input id="proposal-title" name="title" defaultValue={initialTitle} minLength={3} maxLength={120} placeholder="A meetup worth showing up for" required />
            <div className="form-grid">
              <div><label htmlFor="proposal-category">Category</label><select id="proposal-category" name="category" defaultValue="AI & ML"><option>AI & ML</option><option>Study group</option><option>Co-working</option><option>Sports</option><option>Design</option><option>Networking</option><option>Online workshop</option></select></div>
              <div><label htmlFor="proposal-format">Format</label><select id="proposal-format" name="format" defaultValue="in_person"><option value="in_person">In person</option><option value="online">Online</option><option value="hybrid">Hybrid</option></select></div>
            </div>
            <div className="form-grid">
              <div><label htmlFor="proposal-city">City or region</label><Input id="proposal-city" name="city" maxLength={100} placeholder="e.g. Lucknow" /></div>
              <div><label htmlFor="proposal-date">Date and time</label><Input id="proposal-date" name="startsAt" type="datetime-local" defaultValue="2026-11-15T18:30" required /></div>
            </div>
            <div className="form-grid">
              <div><label htmlFor="proposal-capacity">People</label><Input id="proposal-capacity" name="capacity" type="number" min="2" max="1000" defaultValue="24" required /></div>
              <div><label htmlFor="proposal-budget">Budget per person (₹)</label><Input id="proposal-budget" name="budget" type="number" min="0" step="50" defaultValue="300" required /></div>
            </div>
            <label htmlFor="proposal-description">What should people expect?</label>
            <Textarea id="proposal-description" name="description" rows={3} maxLength={4000} placeholder="A few sentences about the session, who it is for, and what to bring." />
            <p className="form-note">Your proposal is private to you until an authorized reviewer approves it.</p>
            {error && <p className="form-error" role="alert">{error}</p>}
            <Button type="submit" className="proposal-submit" disabled={pending}>{pending ? "Submitting…" : "Submit for approval"}<ArrowRight size={15} /></Button>
          </form>
        ) : (
          <div className="auth-gate">
            <p>Sign in to submit a proposal that is saved to your CollabSphere account.</p>
            <Button render={<Link href="/auth" />}>Sign in to continue <ArrowRight size={15} /></Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
