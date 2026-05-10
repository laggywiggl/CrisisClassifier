import { backendUrl } from "@/app/api/_proxy"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const days = url.searchParams.get("days") ?? "7"

  const res = await fetch(backendUrl(`/api/stats?days=${encodeURIComponent(days)}`), { method: "GET" })
  return new Response(await res.text(), {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") || "application/json" },
  })
}

