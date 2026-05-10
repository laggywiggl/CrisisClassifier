export type Severity = "high" | "medium" | "safe"

export function getSeverity(isEmergency: boolean, confidence: number): Severity {
  if (isEmergency) return confidence >= 70 ? "high" : "medium"
  return confidence >= 60 ? "safe" : "medium"
}

export function getSeverityLabel(s: Severity) {
  if (s === "high") return "Emergency"
  if (s === "medium") return "Medium"
  return "Non-Emergency"
}

export function getSeverityBadgeVariant(s: Severity): "destructive" | "outline" | "secondary" {
  if (s === "high") return "destructive"
  if (s === "safe") return "secondary"
  return "outline"
}

export function getSeverityBadgeClass(s: Severity) {
  if (s === "medium") return "border-orange-500/40 text-orange-600 dark:text-orange-400"
  if (s === "safe") return "bg-green-500/15 text-green-700 dark:text-green-300"
  return ""
}

export function getSeverityBarClass(s: Severity) {
  if (s === "high") return "bg-red-500"
  if (s === "medium") return "bg-orange-500"
  return "bg-green-500"
}

