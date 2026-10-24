"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, LoaderCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

export function AuthForm({ callbackError = false }: { callbackError?: boolean }) {
  const router = useRouter()
  const [mode, setMode] = useState<"signin" | "signup">("signup")
  const [forgotPassword, setForgotPassword] = useState(false)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState(callbackError ? "The sign-in link expired. Please try again." : "")
  const [success, setSuccess] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const email = String(data.get("email"))
    const password = String(data.get("password"))
    setMessage("")
    setSuccess(false)
    setPending(true)
    const supabase = createClient()
    const callbackOrigin = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? window.location.origin

    try {
      if (forgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${callbackOrigin}/auth/callback?next=/auth/reset-password`,
        })
        if (error) throw error
        setSuccess(true)
        setMessage("Check your inbox for a password reset link.")
      } else if (mode === "signup") {
        const displayName = String(data.get("displayName")).trim()
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
            emailRedirectTo: `${callbackOrigin}/auth/callback?next=/`,
          },
        })
        if (error) throw error
        setSuccess(true)
        setMessage("Check your inbox to confirm your email, then come back to sign in.")
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.replace("/")
        router.refresh()
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please check your details and try again.")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="auth-form-wrap">
      {!forgotPassword && <div className="auth-switch" role="tablist" aria-label="Account action">
        <button type="button" role="tab" aria-selected={mode === "signup"} onClick={() => { setMode("signup"); setMessage(""); setSuccess(false) }}>Create account</button>
        <button type="button" role="tab" aria-selected={mode === "signin"} onClick={() => { setMode("signin"); setMessage(""); setSuccess(false) }}>Sign in</button>
      </div>}
      <form onSubmit={handleSubmit} className="auth-form">
        {forgotPassword && <div><h2>Reset your password</h2><p>Enter your email and we&apos;ll send you a secure reset link.</p></div>}
        {!forgotPassword && mode === "signup" && <div><label htmlFor="display-name">Name</label><Input id="display-name" name="displayName" autoComplete="name" placeholder="How should we call you?" minLength={2} maxLength={80} required /></div>}
        <div><label htmlFor="auth-email">Email</label><Input id="auth-email" type="email" name="email" autoComplete="email" placeholder="you@example.com" required /></div>
        {!forgotPassword && <div><label htmlFor="auth-password">Password</label><Input id="auth-password" type="password" name="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder="At least 8 characters" minLength={8} required /></div>}
        {!forgotPassword && mode === "signin" && <button type="button" className="auth-link" onClick={() => { setForgotPassword(true); setMessage(""); setSuccess(false) }}>Forgot password?</button>}
        {message && <p className={`auth-feedback${success ? " auth-feedback-success" : ""}`} role={success ? "status" : "alert"}>{message}</p>}
        <Button type="submit" className="auth-submit" disabled={pending || success}>{pending && <LoaderCircle className="spin" size={16} />}{success ? "Check your email" : forgotPassword ? "Send reset link" : mode === "signup" ? "Create account" : "Sign in"}{!pending && !success && <ArrowRight size={16} />}</Button>
        {forgotPassword && <button type="button" className="auth-link" onClick={() => { setForgotPassword(false); setMessage(""); setSuccess(false) }}>Back to sign in</button>}
      </form>
      <p className="auth-terms">By continuing, you agree to keep your account secure and respect other community members.</p>
    </div>
  )
}
