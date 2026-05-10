"use client"

import { useEffect, useMemo, useState } from "react"
import { ExternalLink, RefreshCw } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { getLiveFeed, type LiveFeedItem } from "@/lib/api"
import { getSeverity, getSeverityBadgeClass, getSeverityBadgeVariant } from "@/lib/severity"

export default function LiveFeed() {
  const [isLoading, setIsLoading] = useState(true)
  const [items, setItems] = useState<LiveFeedItem[]>([])

  const emergencyItems = useMemo(() => items.filter((i) => i.isEmergency), [items])

  const load = async () => {
    setIsLoading(true)
    try {
      const res = await getLiveFeed(12)
      setItems(res.items)
    } catch (error) {
      toast({
        title: "Failed to load live feed",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          Showing {items.length} items ({emergencyItems.length} flagged as emergency)
        </div>
        <Button type="button" variant="outline" onClick={load} disabled={isLoading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading live feed...</div>
      ) : items.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <Card key={item.url} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <CardTitle className="text-base leading-snug">{item.title}</CardTitle>
                    <CardDescription className="text-xs">
                      {item.source ? `${item.source} • ` : ""}
                      {item.published ?? ""}
                    </CardDescription>
                  </div>
                  <a
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Open article"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {(() => {
                    const sev = getSeverity(item.isEmergency, item.confidence)
                    return (
                      <Badge variant={getSeverityBadgeVariant(sev)} className={getSeverityBadgeClass(sev)}>
                        {sev === "high" ? "Emergency" : sev === "medium" ? "Medium" : "Non-Emergency"}
                      </Badge>
                    )
                  })()}
                  <Badge variant="secondary">{item.confidence.toFixed(0)}%</Badge>
                  {item.categories.slice(0, 2).map((c) => (
                    <Badge key={c} variant="secondary">
                      {c}
                    </Badge>
                  ))}
                </div>
                {item.classificationSummary ? (
                  <p className="text-sm text-muted-foreground line-clamp-3">{item.classificationSummary}</p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No RSS feeds configured yet. Add `RSS_FEEDS` to `backend/.env` (comma-separated) then refresh.
        </div>
      )}
    </div>
  )
}

