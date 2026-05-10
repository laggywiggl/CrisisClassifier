const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

export function backendUrl(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`
  return `${BACKEND_URL}${p}`
}

