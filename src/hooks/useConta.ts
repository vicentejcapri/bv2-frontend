import { useContext } from "react"
import { ContaContext } from "@/contexts/conta-context"

export function useConta() {
  const context = useContext(ContaContext)
  if (!context) {
    throw new Error("useConta precisa ser usado dentro de um <ContaProvider>")
  }
  return context
}
