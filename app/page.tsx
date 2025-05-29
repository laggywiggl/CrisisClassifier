import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ClassifierInput from "@/components/classifier-input"
import ClassifierHistory from "@/components/classifier-history"
import ClassifierDashboard from "@/components/classifier-dashboard"
import { AlertTriangle } from "lucide-react"

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <h1 className="text-3xl font-bold">CrisisClassifier</h1>
      </div>

      <p className="text-muted-foreground mb-8">
        AI-powered news classification tool that analyzes content and determines whether it's related to emergencies.
      </p>

      <Tabs defaultValue="classify" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="classify">Classify News</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="classify">
          <ClassifierInput />
        </TabsContent>

        <TabsContent value="history">
          <ClassifierHistory />
        </TabsContent>

        <TabsContent value="dashboard">
          <ClassifierDashboard />
        </TabsContent>
      </Tabs>
    </main>
  )
}
