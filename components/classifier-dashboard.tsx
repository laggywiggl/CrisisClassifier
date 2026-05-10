"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { getStats } from "@/lib/api"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

type DashboardStats = {
  totalClassified: number
  emergencyCount: number
  nonEmergencyCount: number
  avgLatencyMs?: number
  categoryDistribution: { name: string; value: number }[]
  weeklyTrends: { date: string; emergency: number; nonEmergency: number }[]
  confidenceDistribution: { range: string; count: number }[]
}

export default function ClassifierDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getStats(7)
        setStats(data)
      } catch (error) {
        toast({
          title: "Failed to load dashboard stats",
          description: error instanceof Error ? error.message : "Unexpected error",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [])

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

  if (isLoading) {
    return <div className="text-center py-8">Loading dashboard data...</div>
  }

  if (!stats) {
    return <div className="text-center py-8 text-muted-foreground">Failed to load dashboard data</div>
  }

  const emergencyPercentage =
    stats.totalClassified > 0 ? ((stats.emergencyCount / stats.totalClassified) * 100).toFixed(1) : "0"

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Classified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClassified}</div>
            <p className="text-xs text-muted-foreground">News items analyzed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Emergency Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.emergencyCount}</div>
            <p className="text-xs text-muted-foreground">{emergencyPercentage}% of total content</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Non-Emergency Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.nonEmergencyCount}</div>
            <p className="text-xs text-muted-foreground">
              {(100 - Number.parseFloat(emergencyPercentage)).toFixed(1)}% of total content
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Model latency (avg)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.avgLatencyMs ?? 0)} ms</div>
            <p className="text-xs text-muted-foreground">Average inference time (server-side)</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends">Weekly Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="confidence">Confidence</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Classification Trends</CardTitle>
              <CardDescription>Number of emergency vs. non-emergency classifications over time</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.weeklyTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="emergency" name="Emergency" fill="#ef4444" />
                    <Bar dataKey="nonEmergency" name="Non-Emergency" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="sr-only" aria-label="Weekly trend data table">
                {stats.weeklyTrends.map((p) => (
                  <div key={p.date}>
                    {p.date}: emergency {p.emergency}, non-emergency {p.nonEmergency}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Category Distribution</CardTitle>
              <CardDescription>Distribution of emergency categories in classified content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.categoryDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="sr-only" aria-label="Category distribution data table">
                {stats.categoryDistribution.map((c) => (
                  <div key={c.name}>
                    {c.name}: {c.value}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="confidence">
          <Card>
            <CardHeader>
              <CardTitle>Confidence Distribution</CardTitle>
              <CardDescription>Distribution of confidence scores in classifications</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.confidenceDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" name="Classifications" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="sr-only" aria-label="Confidence distribution data table">
                {stats.confidenceDistribution.map((b) => (
                  <div key={b.range}>
                    {b.range}: {b.count}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
