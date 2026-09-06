import { useCallback, useMemo, useState } from "react"
import type { ReactNode } from "react"

import { FeedbackDialog } from "@/components/FeedbackDialog"
import type { FeedbackTom } from "@/components/FeedbackDialog"
import { FeedbackContext, type FeedbackMensagem } from "./feedback-context"

type Aviso = FeedbackMensagem & { tom: FeedbackTom }

/**
 * Centraliza os avisos de desfecho: qualquer tela chama `sucesso()` ou
 * `falha()` e o alerta aparece por cima, sem cada uma montar o seu.
 */
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const [open, setOpen] = useState(false)

  const mostrar = useCallback((tom: FeedbackTom, mensagem: FeedbackMensagem) => {
    setAviso({ ...mensagem, tom })
    setOpen(true)
  }, [])

  const value = useMemo(
    () => ({
      sucesso: (mensagem: FeedbackMensagem) => mostrar("sucesso", mensagem),
      falha: (mensagem: FeedbackMensagem) => mostrar("falha", mensagem),
    }),
    [mostrar]
  )

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      {aviso && (
        <FeedbackDialog
          tom={aviso.tom}
          titulo={aviso.titulo}
          descricao={aviso.descricao}
          botao={aviso.botao}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </FeedbackContext.Provider>
  )
}
