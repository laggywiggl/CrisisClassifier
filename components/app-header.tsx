"use client"

import { AlertTriangle } from "lucide-react"

import ThemeToggle from "@/components/theme-toggle"

export default function AppHeader() {
  return (
    <header className="flex items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <div>
          <div className="text-3xl font-bold leading-none">CrisisClassifier</div>
          <div className="text-sm text-muted-foreground mt-2">
            Classify text or URLs, track history, and monitor trends.
          </div>
        </div>
      </div>
      <ThemeToggle />
    </header>
  )
}

