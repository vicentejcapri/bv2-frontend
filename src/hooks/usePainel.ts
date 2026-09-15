import { useCallback, useEffect, useState } from "react"

import { useAuth } from "@/hooks/useAuth"
import { ApiError } from "@/lib/api"
import { buscarPainel } from "@/lib/painel-api"
import type { Painel, Periodo } from "@/lib/painel-api"

type Resultado =
  | { chave: string; painel: Painel; erro?: undefined }
  | { chave: string; painel?: undefined; erro: string }

/**
 * Carrega o GET /painel do período. Ao trocar de período mantém o último painel
 * na tela (`carregando` = true) em vez de piscar skeleton.
 */
export function usePainel({ dataInicio, dataFim }: Periodo) {
  const { token, logout } = useAuth()
  const [tentativa, setTentativa] = useState(0)
  const [painel, setPainel] = useState<Painel | null>(null)
  const [ultimo, setUltimo] = useState<Resultado | null>(null)

  // Cada combinação de período + tentativa é um pedido; `carregando` é derivado
  // de o último resultado ainda não corresponder ao pedido atual.
  const chave = `${dataInicio}|${dataFim}|${tentativa}`

  useEffect(() => {
    if (!token) return
    let cancelado = false

    buscarPainel(token, { dataInicio, dataFim })
      .then((dados) => {
        if (cancelado) return
        setPainel(dados)
        setUltimo({ chave, painel: dados })
      })
      .catch((error) => {
        if (cancelado) return
        if (error instanceof ApiError && error.status === 401) return logout()
        setUltimo({
          chave,
          erro:
            error instanceof ApiError
              ? error.message
              : "Não foi possível carregar o dashboard.",
        })
      })

    return () => {
      cancelado = true
    }
  }, [token, logout, dataInicio, dataFim, chave])

  const recarregar = useCallback(() => setTentativa((n) => n + 1), [])

  const atual = ultimo?.chave === chave ? ultimo : null
  return {
    painel,
    erro: atual?.erro ?? null,
    carregando: atual === null,
    recarregar,
  }
}
