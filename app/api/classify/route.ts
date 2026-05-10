import { backendUrl } from "@/app/api/_proxy"

export async function POST(req: Request) {
  const url = new URL(req.url)
  const backend = url.searchParams.get("backend")
  const persist = url.searchParams.get("persist")
  const qs = new URLSearchParams()
  if (backend) qs.set("backend", backend)
  if (persist) qs.set("persist", persist)
  const query = qs.toString() ? `?${qs.toString()}` : ""
  const body = await req.text()

  const res = await fetch(backendUrl(`/api/classify${query}`), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  })
  return new Response(await res.text(), {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") || "application/json" },
  })
}

