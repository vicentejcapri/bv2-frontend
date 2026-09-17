import { useCallback, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { ContaContext } from "./conta-context"
import { useAuth } from "@/hooks/useAuth"
import { ApiError, definirContaAtiva } from "@/lib/api"
import { listarUsuarios } from "@/lib/usuario-api"
import type { Usuario } from "@/lib/usuario-api"

const STORAGE_KEY = "bv2:conta"

function lerContaSalva(): number | null {
  try {
    const bruto = sessionStorage.getItem(STORAGE_KEY)
    return bruto ? Number(bruto) : null
  } catch {
    return null
  }
}

/**
 * Em qual conta as telas operam. Cada usuário tem a própria base; o ADMIN só
 * enxerga a dele, e o MASTER escolhe uma das contas ativas.
 */
export function ContaProvider({ children }: { children: ReactNode }) {
  const { token, usuario, logout } = useAuth()
  const isMaster = usuario?.role === "MASTER"

  const [escolhida, setEscolhida] = useState<number | null>(lerContaSalva)
  // A lista fica marcada com o token que a buscou: uma lista de outra sessão não vale.
  const [resultado, setResultado] = useState<{ token: string; contas: Usuario[] } | null>(null)
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    if (!token || !isMaster) return
    let cancelado = false

    listarUsuarios(token, { ativo: true })
      .then((pagina) => {
        if (!cancelado) setResultado({ token, contas: pagina.conteudo })
      })
      .catch((error) => {
        if (cancelado) return
        if (error instanceof ApiError && error.status === 401) return logout()
        // Sem a lista o MASTER ainda opera a própria conta; o seletor só fica vazio.
        setResultado({ token, contas: [] })
      })

    return () => {
      cancelado = true
    }
  }, [token, isMaster, versao, logout])

  const contas = resultado?.token === token ? resultado.contas : null

  // Conta escolhida que foi desativada (ou de outra sessão) volta para a do próprio MASTER.
  let contaId: number | null = null
  if (usuario && isMaster && contas) {
    contaId =
      escolhida !== null && contas.some((conta) => conta.id === escolhida)
        ? escolhida
        : usuario.id
  }

  // Na renderização, e não num efeito: os efeitos das telas filhas rodam antes dos
  // do provider, e a primeira busca delas já precisa sair com o header certo.
  definirContaAtiva(contaId)

  // Sem contaId (ADMIN, ou MASTER ainda carregando) a conta é a do próprio usuário.
  const emailConta =
    (contaId !== null ? contas?.find((conta) => conta.id === contaId)?.email : usuario?.email) ??
    usuario?.email ??
    null

  const pronto = !token || (usuario !== null && (!isMaster || contas !== null))

  const trocarConta = useCallback((id: number) => {
    definirContaAtiva(id)
    setEscolhida(id)
    try {
      sessionStorage.setItem(STORAGE_KEY, String(id))
    } catch {
      // Sem storage a escolha só não sobrevive a um recarregamento.
    }
  }, [])

  const recarregarContas = useCallback(() => setVersao((n) => n + 1), [])

  const value = useMemo(
    () => ({
      isMaster,
      contaId,
      contas: contas ?? [],
      emailConta,
      pronto,
      trocarConta,
      recarregarContas,
    }),
    [isMaster, contaId, contas, emailConta, pronto, trocarConta, recarregarContas]
  )

  return <ContaContext.Provider value={value}>{children}</ContaContext.Provider>
}
