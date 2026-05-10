"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { classify, type ClassifyResponse } from "@/lib/api"
import { getSeverity, getSeverityBadgeClass, getSeverityBadgeVariant } from "@/lib/severity"

function ResultCard({ title, r }: { title: string; r: ClassifyResponse | null }) {
  const backendHint =
    title.toLowerCase().includes("keyword")
      ? "Deterministic rule-based matching — instant, but only catches known keywords."
      : "Transformer-based inference — slower, but understands meaning and context."

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{r?.model?.backend ? `Backend: ${r.model.backend}` : "—"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {r ? (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              {(() => {
                const sev = getSeverity(r.isEmergency, r.confidence)
                return (
                  <Badge variant={getSeverityBadgeVariant(sev)} className={getSeverityBadgeClass(sev)}>
                    {sev === "high" ? "Emergency" : sev === "medium" ? "Medium" : "Non-Emergency"}
                  </Badge>
                )
              })()}
              <Badge variant="secondary">{r.confidence.toFixed(0)}%</Badge>
              <Badge variant="secondary">{Math.round(r.latencyMs ?? 0)} ms</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {r.categories.map((c, idx) => (
                <Badge key={idx} variant="secondary">
                  {c}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">{r.summary}</p>
            <p className="text-xs text-muted-foreground">{backendHint}</p>
          </>
        ) : (
          <div className="text-sm text-muted-foreground">Run a comparison to see results.</div>
        )}
      </CardContent>
    </Card>
  )
}

export default function ModelCompare() {
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [keywords, setKeywords] = useState<ClassifyResponse | null>(null)
  const [zeroShot, setZeroShot] = useState<ClassifyResponse | null>(null)

  const run = async () => {
    if (!text.trim()) return
    setLoading(true)
    try {
      const [k, z] = await Promise.all([
        classify({ text, backend: "keywords" }),
        classify({ text, backend: "zero_shot" }),
      ])
      setKeywords(k)
      setZeroShot(z)
    } catch (error) {
      toast({
        title: "Model comparison failed",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>What this tab does</CardTitle>
          <CardDescription>
            Paste the same text and compare how two different classifiers handle it: a fast keyword-matching baseline vs. a Hugging
            Face zero-shot NLI model. This helps you see where the AI model outperforms simple rules and where it may struggle.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Model comparison</CardTitle>
          <CardDescription>Compare the deterministic keyword baseline vs the zero-shot model on the same text.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-[160px]" placeholder="Paste text to compare..." />
        </CardContent>
        <CardFooter>
          <Button type="button" onClick={run} disabled={loading || !text.trim()} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Comparing...
              </>
            ) : (
              "Run comparison"
            )}
          </Button>
        </CardFooter>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <ResultCard title="Keywords baseline" r={keywords} />
        <ResultCard title="Zero-shot (Hugging Face)" r={zeroShot} />
      </div>
    </div>
  )
}

