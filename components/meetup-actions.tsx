"use client"

import { useEffect, useRef, useState } from "react"
import { QrCode, ScanLine } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"

type DetectorWindow = Window & { BarcodeDetector?: new (options?: { formats?: string[] }) => { detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }
type Props = { eventId: string; eventTitle: string; canVerify: boolean; userId: string | null }

export function MeetupActions({ eventId, eventTitle, canVerify, userId }: Props) {
  const [registration, setRegistration] = useState<{ registrationId: string; secret: string } | null>(null)
  const [payload, setPayload] = useState("")
  const [status, setStatus] = useState("")
  const [busy, setBusy] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef<number | null>(null)

  useEffect(() => () => stopCamera(), [])

  function stopCamera() {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCameraOpen(false)
  }

  async function register() {
    setBusy(true)
    setStatus("")
    try {
      const response = await fetch(`/api/events/${eventId}/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? "Registration could not be completed.")
      setRegistration({ registrationId: result.registrationId, secret: result.secret })
      setStatus("Registration confirmed. Show this private QR code to an event organizer during check-in.")
    } catch (error) { setStatus(error instanceof Error ? error.message : "Registration could not be completed.") }
    finally { setBusy(false) }
  }

  async function verifyAttendance(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    let parsed: { registrationId?: string; secret?: string }
    try { parsed = JSON.parse(payload) as { registrationId?: string; secret?: string } }
    catch { setStatus("The scanned QR value is not valid. Scan the attendee registration QR or paste its contents."); return }
    if (!parsed.registrationId || !parsed.secret) { setStatus("This QR value is missing its registration details."); return }
    setBusy(true)
    try {
      const response = await fetch("/api/events/check-in", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ registrationId: parsed.registrationId, secret: parsed.secret }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? "Attendance could not be verified.")
      setPayload("")
      setStatus("Attendance verified. This check-in confirms attendance at one point in time.")
    } catch (error) { setStatus(error instanceof Error ? error.message : "Attendance could not be verified.") }
    finally { setBusy(false) }
  }

  async function openCamera() {
    const Detector = (window as DetectorWindow).BarcodeDetector
    if (!Detector) { setStatus("Camera QR scanning is not supported here. Use your device camera to scan, then paste the QR text below."); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      streamRef.current = stream
      setCameraOpen(true)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      const detector = new Detector({ formats: ["qr_code"] })
      const scanFrame = async () => {
        const video = videoRef.current
        if (!video || !streamRef.current) return
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          try {
            const [code] = await detector.detect(video)
            if (code?.rawValue) {
              setPayload(code.rawValue)
              stopCamera()
              setStatus("QR captured. Verify it to record attendance.")
              return
            }
          } catch { setStatus("Could not read that QR frame. Hold the code steady and try again.") }
        }
        frameRef.current = requestAnimationFrame(() => { void scanFrame() })
      }
      frameRef.current = requestAnimationFrame(() => { void scanFrame() })
    } catch { stopCamera(); setStatus("Camera access was not available. You can paste the scanned QR text instead.") }
  }

  const qrValue = registration ? JSON.stringify({ eventId, registrationId: registration.registrationId, secret: registration.secret }) : ""
  return <div className="meetup-actions">
    {userId ? <Button variant="outline" size="sm" onClick={() => void register()} disabled={busy}><QrCode size={13} />{registration ? "Refresh my QR" : "Register"}</Button> : <a className="meetup-signin" href="/auth">Sign in to register</a>}
    {registration && <div className="registration-ticket"><QRCodeSVG value={qrValue} size={144} level="Q" includeMargin aria-label={`Private attendance QR for ${eventTitle}`} /><p><strong>{eventTitle}</strong><span>Keep this QR private. An organizer scans it to verify your attendance.</span></p></div>}
    {canVerify && <details className="checkin-panel"><summary><ScanLine size={14} /> Organizer check-in</summary><form onSubmit={verifyAttendance}><label htmlFor={`qr-scan-${eventId}`}>Scan attendee code or paste its QR contents</label>{cameraOpen && <div className="camera-preview"><video ref={videoRef} muted playsInline aria-label="Camera scanning an attendee QR code" /><Button type="button" variant="outline" size="sm" onClick={stopCamera}>Stop camera</Button></div>}<textarea id={`qr-scan-${eventId}`} value={payload} onChange={(event) => setPayload(event.target.value)} rows={2} placeholder='{"eventId":"…","registrationId":"…","secret":"…"}' required /><div className="checkin-actions"><Button type="button" variant="outline" size="sm" onClick={() => void openCamera()}>Open camera</Button><Button type="submit" size="sm" disabled={busy}>{busy ? "Verifying…" : "Verify attendance"}</Button></div></form></details>}
    {status && <p className="form-note" role="status">{status}</p>}
  </div>
}
