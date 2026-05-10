export type ExplainToken = { token: string; score: number }

export type ClassifyRequest = {
  text: string
  url?: string
  backend?: "keywords" | "zero_shot"
  persist?: boolean
}

export type ClassifyResponse = {
  isEmergency: boolean
  confidence: number
  categories: string[]
  summary: string
  explanation?: ExplainToken[]
  model?: Record<string, string>
}

export type HistoryRecord = {
  id: string
  timestamp: string
  content: string
  isEmergency: boolean
  confidence: number
  categories: string[]
}

export type DashboardStats = {
  totalClassified: number
  emergencyCount: number
  nonEmergencyCount: number
  avgLatencyMs?: number
  categoryDistribution: { name: string; value: number }[]
  weeklyTrends: { date: string; emergency: number; nonEmergency: number }[]
  confidenceDistribution: { range: string; count: number }[]
}

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Request failed (${res.status}): ${text || res.statusText}`)
  }
  return (await res.json()) as T
}

export async function classify(payload: ClassifyRequest): Promise<ClassifyResponse> {
  const qs = new URLSearchParams()
  if (payload.backend) qs.set("backend", payload.backend)
  if (payload.persist === false) qs.set("persist", "false")
  const query = qs.toString() ? `?${qs.toString()}` : ""
  const { backend, persist, ...body } = payload
  return jsonFetch<ClassifyResponse>(`/api/classify${query}`, {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export async function getHistory(limit = 50): Promise<HistoryRecord[]> {
  return jsonFetch<HistoryRecord[]>(`/api/history?limit=${encodeURIComponent(String(limit))}`)
}

export async function deleteHistoryRecord(id: string): Promise<{ ok: boolean }> {
  return jsonFetch<{ ok: boolean }>(`/api/history?id=${encodeURIComponent(id)}`, { method: "DELETE" })
}

export async function clearHistory(): Promise<{ ok: boolean; deleted: number }> {
  return jsonFetch<{ ok: boolean; deleted: number }>(`/api/history`, { method: "DELETE" })
}

export async function getStats(days = 7): Promise<DashboardStats> {
  return jsonFetch<DashboardStats>(`/api/stats?days=${encodeURIComponent(String(days))}`)
}

export type LiveFeedItem = {
  title: string
  url: string
  summary: string
  published?: string | null
  source?: string | null
  isEmergency: boolean
  confidence: number
  categories: string[]
  classificationSummary: string
}

export async function getLiveFeed(limit = 12): Promise<{ items: LiveFeedItem[] }> {
  return jsonFetch<{ items: LiveFeedItem[] }>(`/api/live-feed?limit=${encodeURIComponent(String(limit))}`)
}

