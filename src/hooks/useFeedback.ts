import { useContext } from "react"
import { FeedbackContext } from "@/contexts/feedback-context"

export function useFeedback() {
  const context = useContext(FeedbackContext)
  if (!context) {
    throw new Error("useFeedback precisa ser usado dentro de um <FeedbackProvider>")
  }
  return context
}
