import { backendUrl } from "@/app/api/_proxy"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const limit = url.searchParams.get("limit") ?? ""
  const qs = limit ? `?limit=${encodeURIComponent(limit)}` : ""
  const res = await fetch(backendUrl(`/api/live-feed${qs}`), { method: "GET" })
  return new Response(await res.text(), {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") || "application/json" },
  })
}

