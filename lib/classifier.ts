// Backwards-compatible wrapper around the real API client.
// New code should prefer `lib/api.ts`.

import { classify, getHistory, getStats } from "@/lib/api"

export async function classifyNews(content: string) {
  return classify({ text: content })
}

export async function getClassificationHistory() {
  return getHistory(50)
}

export async function getDashboardStats() {
  return getStats(7)
}
