"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Calendar, Clock, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { getClassificationHistory } from "@/lib/classifier"

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
        const data = await getClassificationHistory()
        setHistory(data)
      } catch (error) {
        console.error("Failed to load history:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadHistory()
  }, [])

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

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search history by content or category..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
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
                      {record.isEmergency ? (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Emergency
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Non-Emergency
                        </Badge>
                      )}
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
