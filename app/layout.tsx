import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import "leaflet/dist/leaflet.css"
import "./globals.css"
import "./platform.css"
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: {
    default: "CollabSphere — your community is closer than you think",
    template: "%s · CollabSphere",
  },
  description:
    "Meet people nearby, plan better gatherings, and build connections across the IIT Madras BS community.",
  applicationName: "CollabSphere",
  keywords: ["community", "student meetups", "IIT Madras BS", "events"],
}

export const viewport: Viewport = {
  themeColor: "#080b14",
  colorScheme: "dark",
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>{children}</body>
    </html>
  )
}
