import { backendUrl } from "@/app/api/_proxy"

export async function GET() {
  const res = await fetch(backendUrl("/api/health"), { method: "GET" })
  return new Response(await res.text(), {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") || "application/json" },
  })
}

