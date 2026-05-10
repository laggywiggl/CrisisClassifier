import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ClassifierInput from "@/components/classifier-input"
import ClassifierHistory from "@/components/classifier-history"
import ClassifierDashboard from "@/components/classifier-dashboard"
import AppHeader from "@/components/app-header"
import LiveFeed from "@/components/live-feed"
import ModelCompare from "@/components/model-compare"

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <AppHeader />

      <Tabs defaultValue="classify" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-8">
          <TabsTrigger value="classify">Classify News</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="live">Live Feed</TabsTrigger>
          <TabsTrigger value="compare">Compare</TabsTrigger>
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

        <TabsContent value="live">
          <LiveFeed />
        </TabsContent>

        <TabsContent value="compare">
          <ModelCompare />
        </TabsContent>
      </Tabs>
    </main>
  )
}
