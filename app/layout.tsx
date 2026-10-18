import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import { cookies } from "next/headers"
import { ThemeProvider } from "@/components/theme-provider"
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

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const cookieStore = await cookies()
  const initialTheme = cookieStore.get("collabsphere-theme")?.value === "light" ? "light" : "dark"

  return (
    <html lang="en" data-theme={initialTheme} className={cn("font-sans", geist.variable)}>
      <body><ThemeProvider initialTheme={initialTheme}>{children}</ThemeProvider></body>
    </html>
  )
}
