import { useContext } from "react"
import { DadosContext } from "@/contexts/dados-context"

export function useDados() {
  const context = useContext(DadosContext)
  if (!context) {
    throw new Error("useDados precisa ser usado dentro de um <DadosProvider>")
  }
  return context
}
