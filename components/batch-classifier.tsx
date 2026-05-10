"use client"

import { useMemo, useState } from "react"
import { Upload } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { classify, type ClassifyResponse } from "@/lib/api"
import { getSeverity, getSeverityBadgeClass, getSeverityBadgeVariant } from "@/lib/severity"

type BatchResult = { row: number; text: string; result: ClassifyResponse }

function splitCsvRow(line: string): string[] {
  const out: string[] = []
  let cur = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      const next = line[i + 1]
      if (inQuotes && next === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (ch === "," && !inQuotes) {
      out.push(cur.trim())
      cur = ""
      continue
    }
    cur += ch
  }
  out.push(cur.trim())
  return out
}

function parseFileLines(raw: string): string[] {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (!lines.length) return []

  // If it doesn't look like CSV, treat as one-text-per-line.
  const looksCsv = lines[0].includes(",") || lines[0].includes('"')
  if (!looksCsv) return lines

  const header = splitCsvRow(lines[0]).map((h) => h.replace(/^"|"$/g, "").toLowerCase())
  const candidateNames = ["text", "content", "tweet_text", "tweet", "message", "body"]
  const textIdx = header.findIndex((h) => candidateNames.includes(h))
  const start = textIdx >= 0 ? 1 : 0

  return lines
    .slice(start)
    .map((line) => {
      const cols = splitCsvRow(line).map((c) => c.replace(/^"|"$/g, ""))
      if (textIdx >= 0 && cols[textIdx]) return cols[textIdx].trim()
      // fallback: if 2+ columns and first looks like an id, use second column
      if (cols.length >= 2 && /^[a-z0-9_-]{1,10}$/i.test(cols[0]) && cols[1]) return cols[1].trim()
      return cols[0]?.trim() ?? ""
    })
    .filter(Boolean)
}

export default function BatchClassifier() {
  const [fileName, setFileName] = useState<string>("")
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<BatchResult[]>([])
  const [isDragOver, setIsDragOver] = useState(false)

  const run = async (file: File) => {
    setIsRunning(true)
    setResults([])
    try {
      const raw = await file.text()
      const texts = parseFileLines(raw).slice(0, 25)
      if (!texts.length) {
        toast({
          title: "No rows found",
          description: "Upload a .txt (one text per line) or a .csv with a text/content column.",
          variant: "destructive",
        })
        return
      }

      const out: BatchResult[] = []
      for (let i = 0; i < texts.length; i++) {
        const t = texts[i]
        // eslint-disable-next-line no-await-in-loop
        const r = await classify({ text: t, persist: false })
        out.push({ row: i + 1, text: t, result: r })
        setResults([...out])
      }
    } catch (error) {
      toast({
        title: "Batch classification failed",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  const emergencyCount = results.filter((r) => r.result.isEmergency).length
  const overall = useMemo(() => {
    if (!results.length) return null
    const maxConfEmergency = Math.max(
      ...results.filter((r) => r.result.isEmergency).map((r) => r.result.confidence),
      0,
    )
    const overallIsEmergency = emergencyCount > 0
    const overallConfidence = overallIsEmergency ? maxConfEmergency : Math.max(...results.map((r) => r.result.confidence))
    const sev = getSeverity(overallIsEmergency, overallConfidence)
    return { overallIsEmergency, overallConfidence, sev }
  }, [results, emergencyCount])

  const sample = [
    "Earthquake hits coastal region, evacuation orders issued",
    "City council approves new park renovation budget",
    "Hurricane approaching eastern coast with 120mph winds",
  ]

  const downloadSample = () => {
    const csv = ["text", ...sample].map((l) => `"${l.replaceAll('"', '""')}"`).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "crisis-classifier-sample.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch classify from a file</CardTitle>
        <CardDescription>
          Upload a simple <span className="font-medium">.csv</span> or <span className="font-medium">.txt</span> file with one piece
          of text per line. We’ll classify up to 25 lines and show results below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm font-medium">Example format</div>
          <pre className="rounded-md border bg-muted p-3 text-xs overflow-auto">
{sample.join("\n")}
          </pre>
          <button type="button" className="text-sm underline underline-offset-4" onClick={downloadSample}>
            Download sample CSV
          </button>
        </div>

        <div
          className={`rounded-md border p-4 ${isDragOver ? "bg-accent" : "bg-background"}`}
          onDragEnter={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragOver(true)
          }}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragOver(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragOver(false)
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragOver(false)
            const f = e.dataTransfer.files?.[0]
            if (!f) return
            setFileName(f.name)
            void run(f)
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-medium">Choose a file or drag and drop</div>
              <div className="text-xs text-muted-foreground">
                Accepted: .csv, .txt • {fileName ? `Selected: ${fileName}` : "No file selected"}
              </div>
            </div>
            <div className="shrink-0">
              <Input
                type="file"
                accept=".csv,.txt,text/csv,text/plain"
                disabled={isRunning}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  setFileName(f.name)
                  void run(f)
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">
            {results.length ? `${results.length} processed • ${emergencyCount} emergency` : isRunning ? "Processing..." : ""}
          </div>
        </div>

        {results.length ? (
          <div className="space-y-2">
            {overall ? (
              <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div>
                  <div className="text-sm font-medium">Overall result (file)</div>
                  <div className="text-xs text-muted-foreground">
                    {emergencyCount} emergency signals across {results.length} lines
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getSeverityBadgeVariant(overall.sev)} className={getSeverityBadgeClass(overall.sev)}>
                    {overall.sev === "high" ? "Emergency" : overall.sev === "medium" ? "Medium" : "Non-Emergency"}
                  </Badge>
                  <Badge variant="secondary">{overall.overallConfidence.toFixed(0)}%</Badge>
                </div>
              </div>
            ) : null}

            {results.map((r) => (
              <div key={r.row} className="flex items-start justify-between gap-3 border rounded-md p-3">
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground mb-1">Row {r.row}</div>
                  <div className="text-sm line-clamp-2">{r.text}</div>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  {(() => {
                    const sev = getSeverity(r.result.isEmergency, r.result.confidence)
                    return (
                      <Badge variant={getSeverityBadgeVariant(sev)} className={getSeverityBadgeClass(sev)}>
                        {sev === "high" ? "Emergency" : sev === "medium" ? "Medium" : "Non-Emergency"}
                      </Badge>
                    )
                  })()}
                  <div className="text-xs text-muted-foreground">{r.result.confidence.toFixed(0)}%</div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

