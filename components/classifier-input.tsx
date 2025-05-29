"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react"
import { classifyNews } from "@/lib/classifier"

export default function ClassifierInput() {
  const [newsContent, setNewsContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<null | {
    isEmergency: boolean
    confidence: number
    categories: string[]
    summary: string
  }>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newsContent.trim()) return

    setIsLoading(true)
    try {
      const classificationResult = await classifyNews(newsContent)
      setResult(classificationResult)
    } catch (error) {
      console.error("Classification error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>News Content</CardTitle>
          <CardDescription>Enter news content to classify whether it's related to an emergency</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <Textarea
              placeholder="Paste news content here..."
              className="min-h-[200px]"
              value={newsContent}
              onChange={(e) => setNewsContent(e.target.value)}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading || !newsContent.trim()} className="w-full">
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
          <CardDescription>AI analysis of the provided news content</CardDescription>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="text-lg font-medium">Status:</div>
                {result.isEmergency ? (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Emergency
                  </Badge>
                ) : (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Non-Emergency
                  </Badge>
                )}
              </div>

              <div>
                <div className="text-lg font-medium mb-1">Confidence:</div>
                <div className="w-full bg-secondary rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${result.isEmergency ? "bg-red-500" : "bg-green-500"}`}
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
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-center text-muted-foreground">
              <p>No content analyzed yet</p>
              <p className="text-sm mt-2">Enter news content and click "Classify Content" to see results</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
