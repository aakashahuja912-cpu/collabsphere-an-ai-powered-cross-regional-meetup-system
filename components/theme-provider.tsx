"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"

type Theme = "light" | "dark"
type ThemeContextValue = { theme: Theme; toggleTheme: () => void }
const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ initialTheme, children }: { initialTheme: Theme; children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme)
  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark"
      document.cookie = `collabsphere-theme=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`
      return next
    })
  }, [])
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) throw new Error("useTheme must be used inside ThemeProvider")
  return value
}
