import { createContext } from "react"

/** Conteúdo do aviso — o tom (sucesso/falha) vem do método chamado. */
export type FeedbackMensagem = {
  titulo: string
  descricao?: string
  botao?: string
}

export type FeedbackContextValue = {
  sucesso: (mensagem: FeedbackMensagem) => void
  falha: (mensagem: FeedbackMensagem) => void
}

export const FeedbackContext = createContext<FeedbackContextValue | undefined>(
  undefined
)
