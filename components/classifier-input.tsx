"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { classify, type ClassifyResponse } from "@/lib/api"
import BatchClassifier from "@/components/batch-classifier"
import { getSeverity, getSeverityBadgeClass, getSeverityBadgeVariant, getSeverityBarClass } from "@/lib/severity"

export default function ClassifierInput() {
  const [newsContent, setNewsContent] = useState("")
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ClassifyResponse | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newsContent.trim() && !url.trim()) return

    setIsLoading(true)
    try {
      const classificationResult = await classify({
        text: newsContent,
        url: url.trim() ? url.trim() : undefined,
      })
      setResult(classificationResult)
    } catch (error) {
      toast({
        title: "Classification failed",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
            <CardDescription>Paste text or provide a URL to classify emergency relevance</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="url">
                    Article URL (optional)
                  </label>
                  <Input
                    id="url"
                    placeholder="https://example.com/news/article"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="text">
                    Text (optional)
                  </label>
                  <Textarea
                    id="text"
                    placeholder="Paste news content here..."
                    className="min-h-[200px]"
                    value={newsContent}
                    onChange={(e) => setNewsContent(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading || (!newsContent.trim() && !url.trim())} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Classify Content"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Classification Result</CardTitle>
            <CardDescription>AI analysis of the provided content</CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="text-lg font-medium">Status:</div>
                  {(() => {
                    const sev = getSeverity(result.isEmergency, result.confidence)
                    return (
                      <Badge
                        variant={getSeverityBadgeVariant(sev)}
                        className={`flex items-center gap-1 ${getSeverityBadgeClass(sev)}`}
                      >
                        {sev === "high" ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        {sev === "high" ? "Emergency" : sev === "medium" ? "Medium" : "Non-Emergency"}
                      </Badge>
                    )
                  })()}
                </div>

                <div>
                  <div className="text-lg font-medium mb-1">Confidence:</div>
                  <div
                    className="w-full bg-secondary rounded-full h-2.5"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(result.confidence)}
                    aria-label="Classification confidence"
                  >
                    <div
                      className={`h-2.5 rounded-full ${getSeverityBarClass(getSeverity(result.isEmergency, result.confidence))}`}
                      style={{ width: `${result.confidence}%` }}
                    ></div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground mt-1">{result.confidence.toFixed(1)}%</div>
                </div>

                <div>
                  <div className="text-lg font-medium mb-2">Categories:</div>
                  <div className="flex flex-wrap gap-2">
                    {result.categories.map((category, index) => (
                      <Badge key={index} variant="secondary">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-lg font-medium mb-2">Summary:</div>
                  <p className="text-sm text-muted-foreground">{result.summary}</p>
                </div>

                {result.model?.id ? (
                  <div className="text-xs text-muted-foreground">
                    Model: <span className="font-medium">{result.model.id}</span> ({result.model.backend}) •{" "}
                    {Math.round(result.latencyMs ?? 0)} ms
                  </div>
                ) : null}

                {result.explanation?.length ? (
                  <div>
                    <div className="text-lg font-medium mb-2">Top signals:</div>
                    <div className="flex flex-wrap gap-2">
                      {result.explanation.slice(0, 8).map((t, idx) => (
                        <Badge key={idx} variant="secondary">
                          {t.token} ({Math.round(t.score * 100)}%)
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-center text-muted-foreground">
                <p>No content analyzed yet</p>
                <p className="text-sm mt-2">Paste text or add a URL, then click "Classify Content"</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BatchClassifier />
    </div>
  )
}
