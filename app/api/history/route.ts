import { backendUrl } from "@/app/api/_proxy"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const limit = url.searchParams.get("limit") ?? "50"

  const res = await fetch(backendUrl(`/api/history?limit=${encodeURIComponent(limit)}`), { method: "GET" })
  return new Response(await res.text(), {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") || "application/json" },
  })
}

export async function DELETE(req: Request) {
  const url = new URL(req.url)
  const id = url.searchParams.get("id")
  const target = id ? `/api/history/${encodeURIComponent(id)}` : "/api/history"

  const res = await fetch(backendUrl(target), { method: "DELETE" })
  return new Response(await res.text(), {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") || "application/json" },
  })
}

