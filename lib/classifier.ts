// This file simulates the connection to a Python/FastAPI backend
// In a real implementation, this would make API calls to your Python backend

// Mock function to classify news content
export async function classifyNews(content: string) {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Simple keyword-based classification for demo purposes
  // In a real app, this would call your Python/FastAPI backend
  const emergencyKeywords = [
    "earthquake",
    "tsunami",
    "hurricane",
    "tornado",
    "flood",
    "fire",
    "explosion",
    "shooting",
    "attack",
    "disaster",
    "emergency",
    "crisis",
    "accident",
    "casualty",
    "death",
    "killed",
    "injured",
    "evacuation",
  ]

  const contentLower = content.toLowerCase()

  // Count emergency keywords
  const keywordMatches = emergencyKeywords.filter((keyword) => contentLower.includes(keyword))

  // Determine if it's an emergency based on keyword count
  const isEmergency = keywordMatches.length >= 2

  // Calculate confidence (simplified)
  const confidence = Math.min(
    Math.max(keywordMatches.length > 0 ? 50 + keywordMatches.length * 10 : 30 + Math.random() * 40, 30),
    98,
  )

  // Determine categories
  const categories = []

  if (contentLower.match(/earthquake|tsunami|landslide/)) {
    categories.push("Natural Disaster")
  }

  if (contentLower.match(/shooting|attack|terrorism|bomb/)) {
    categories.push("Violence")
  }

  if (contentLower.match(/flood|hurricane|tornado|storm/)) {
    categories.push("Weather")
  }

  if (contentLower.match(/fire|explosion|collapse/)) {
    categories.push("Accident")
  }

  if (contentLower.match(/virus|disease|outbreak|pandemic/)) {
    categories.push("Health")
  }

  // Add a generic category if none were found
  if (categories.length === 0) {
    categories.push(isEmergency ? "Other Emergency" : "Non-Emergency")
  }

  // Generate a simple summary
  let summary = ""
  if (isEmergency) {
    summary = `This content appears to be related to an emergency situation involving ${categories.join(" and ")}. Keywords detected: ${keywordMatches.join(", ")}.`
  } else {
    summary = "This content does not appear to be related to an emergency situation based on analysis."
  }

  return {
    isEmergency,
    confidence,
    categories,
    summary,
  }
}

// Mock function to get classification history
export async function getClassificationHistory() {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  // Mock data
  return [
    {
      id: "1",
      timestamp: "2025-05-28T14:32:00Z",
      content:
        "A magnitude 6.2 earthquake struck the coastal region early this morning, causing significant damage to infrastructure. Local authorities have issued evacuation orders for low-lying areas due to tsunami concerns.",
      isEmergency: true,
      confidence: 95.5,
      categories: ["Natural Disaster", "Earthquake"],
    },
    {
      id: "2",
      timestamp: "2025-05-28T10:15:00Z",
      content:
        "The annual tech conference will be held virtually this year due to ongoing renovations at the convention center. Speakers from major tech companies will present the latest innovations.",
      isEmergency: false,
      confidence: 87.2,
      categories: ["Non-Emergency", "Event"],
    },
    {
      id: "3",
      timestamp: "2025-05-27T18:45:00Z",
      content:
        "A major fire broke out in the downtown commercial district, affecting several buildings. Fire departments from neighboring cities have been called to assist. No casualties reported yet.",
      isEmergency: true,
      confidence: 92.8,
      categories: ["Accident", "Fire"],
    },
    {
      id: "4",
      timestamp: "2025-05-27T09:20:00Z",
      content:
        "The city council approved the new budget for the upcoming fiscal year, with increased funding for public transportation and infrastructure improvements.",
      isEmergency: false,
      confidence: 94.1,
      categories: ["Non-Emergency", "Politics"],
    },
    {
      id: "5",
      timestamp: "2025-05-26T22:10:00Z",
      content:
        "Hurricane Maria is approaching the eastern coastline with winds exceeding 120 mph. Authorities have issued mandatory evacuation orders for coastal communities.",
      isEmergency: true,
      confidence: 97.3,
      categories: ["Natural Disaster", "Weather"],
    },
    {
      id: "6",
      timestamp: "2025-05-26T15:30:00Z",
      content:
        "Local high school basketball team wins state championship for the third consecutive year. The celebration parade is scheduled for this weekend.",
      isEmergency: false,
      confidence: 89.5,
      categories: ["Non-Emergency", "Sports"],
    },
    {
      id: "7",
      timestamp: "2025-05-25T11:05:00Z",
      content:
        "A chemical spill on Highway 101 has caused road closures and prompted evacuation of nearby residential areas. Hazmat teams are on site assessing the situation.",
      isEmergency: true,
      confidence: 91.7,
      categories: ["Accident", "Hazardous Materials"],
    },
  ]
}

// Mock function to get dashboard statistics
export async function getDashboardStats() {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Mock data
  return {
    totalClassified: 1247,
    emergencyCount: 382,
    nonEmergencyCount: 865,
    categoryDistribution: [
      { name: "Natural Disaster", value: 142 },
      { name: "Violence", value: 87 },
      { name: "Weather", value: 103 },
      { name: "Accident", value: 95 },
      { name: "Health", value: 68 },
      { name: "Other", value: 752 },
    ],
    weeklyTrends: [
      { date: "May 22", emergency: 42, nonEmergency: 118 },
      { date: "May 23", emergency: 38, nonEmergency: 125 },
      { date: "May 24", emergency: 51, nonEmergency: 132 },
      { date: "May 25", emergency: 65, nonEmergency: 127 },
      { date: "May 26", emergency: 59, nonEmergency: 121 },
      { date: "May 27", emergency: 72, nonEmergency: 119 },
      { date: "May 28", emergency: 55, nonEmergency: 123 },
    ],
    confidenceDistribution: [
      { range: "30-40%", count: 42 },
      { range: "41-50%", count: 87 },
      { range: "51-60%", count: 156 },
      { range: "61-70%", count: 218 },
      { range: "71-80%", count: 295 },
      { range: "81-90%", count: 267 },
      { range: "91-100%", count: 182 },
    ],
  }
}
