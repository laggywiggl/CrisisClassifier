"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Calendar, Clock, Download, Search, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { clearHistory, deleteHistoryRecord, getHistory } from "@/lib/api"
import { getSeverity, getSeverityBadgeClass, getSeverityBadgeVariant } from "@/lib/severity"

type ClassificationRecord = {
  id: string
  timestamp: string
  content: string
  isEmergency: boolean
  confidence: number
  categories: string[]
}

export default function ClassifierHistory() {
  const [history, setHistory] = useState<ClassificationRecord[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await getHistory(100)
        setHistory(data)
      } catch (error) {
        toast({
          title: "Failed to load history",
          description: error instanceof Error ? error.message : "Unexpected error",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadHistory()
  }, [])

  const refresh = async () => {
    const data = await getHistory(100)
    setHistory(data)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteHistoryRecord(id)
      setHistory((h) => h.filter((x) => x.id !== id))
    } catch (error) {
      toast({
        title: "Failed to delete record",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      })
    }
  }

  const handleClearAll = async () => {
    try {
      const res = await clearHistory()
      toast({ title: "History cleared", description: `${res.deleted} records deleted.` })
      await refresh()
    } catch (error) {
      toast({
        title: "Failed to clear history",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      })
    }
  }

  const filteredHistory = history.filter(
    (record) =>
      record.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.categories.some((cat) => cat.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString()
  }

  const downloadCsv = () => {
    const rows = filteredHistory.map((r) => ({
      id: r.id,
      timestamp: r.timestamp,
      isEmergency: r.isEmergency,
      confidence: r.confidence,
      categories: r.categories.join("|"),
      content: r.content.replaceAll("\n", " ").slice(0, 2000),
    }))
    const header = Object.keys(rows[0] ?? {}).join(",")
    const lines = rows.map((obj) =>
      Object.values(obj)
        .map((v) => `"${String(v).replaceAll('"', '""')}"`)
        .join(","),
    )
    const csv = [header, ...lines].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "crisis-classifier-history.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative md:max-w-lg w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search history by content or category..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search history"
          />
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent"
          onClick={downloadCsv}
          disabled={!filteredHistory.length}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="flex items-center justify-end">
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent"
          onClick={handleClearAll}
          disabled={!history.length}
        >
          <Trash2 className="h-4 w-4" />
          Clear history
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading history...</div>
      ) : filteredHistory.length > 0 ? (
        <div className="space-y-4">
          {filteredHistory.map((record) => (
            <Card key={record.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {(() => {
                        const sev = getSeverity(record.isEmergency, record.confidence)
                        return (
                          <Badge
                            variant={getSeverityBadgeVariant(sev)}
                            className={`flex items-center gap-1 ${getSeverityBadgeClass(sev)}`}
                          >
                            {sev === "high" ? (
                              <AlertTriangle className="h-3 w-3" />
                            ) : (
                              <CheckCircle className="h-3 w-3" />
                            )}
                            {sev === "high" ? "Emergency" : sev === "medium" ? "Medium" : "Non-Emergency"}
                          </Badge>
                        )
                      })()}
                      <span className="text-sm font-medium">Confidence: {record.confidence.toFixed(1)}%</span>
                    </CardTitle>
                    <CardDescription className="mt-2 flex items-center gap-2 text-xs">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(record.timestamp)}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTime(record.timestamp)}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {record.categories.map((category, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                    <button
                      type="button"
                      className="ml-2 inline-flex items-center justify-center rounded-md border px-2 py-1 text-xs hover:bg-accent"
                      onClick={() => handleDelete(record.id)}
                      aria-label="Delete record"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm line-clamp-3">{record.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm ? "No matching records found" : "No classification history available"}
        </div>
      )}
    </div>
  )
}
