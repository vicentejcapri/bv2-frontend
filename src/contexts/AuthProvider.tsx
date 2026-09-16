import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"
import { AuthContext } from "./auth-context"
import { FeedbackDialog } from "@/components/FeedbackDialog"
import { ApiError } from "@/lib/api"
import { entrar } from "@/lib/auth-api"
import type { Sessao } from "@/lib/auth-api"
import { ouvirCredenciaisAlteradas } from "@/lib/credenciais-canal"
import { buscarMeuUsuario } from "@/lib/usuario-api"
import type { Usuario } from "@/lib/usuario-api"

const STORAGE_KEY = "bv2:sessao"

const SESSAO_EXPIRADA = "As credenciais da conta foram alteradas. Entre novamente para continuar."

/** Intervalo mínimo entre conferências ao voltar para a aba (focus e visibilitychange disparam juntos). */
const INTERVALO_CONFERENCIA_MS = 5_000

/** Lê a sessão salva, descartando a que já expirou. */
function lerSessao(): Sessao | null {
  try {
    const bruto = sessionStorage.getItem(STORAGE_KEY)
    if (!bruto) return null
    const sessao = JSON.parse(bruto) as Sessao
    if (new Date(sessao.expiraEm).getTime() <= Date.now()) {
      sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    return sessao
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(lerSessao)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  // Sessão derrubada por fora (troca de senha/e-mail): o alerta aparece por cima da tela
  // atual e a saída só acontece quando ele fecha, em vez de jogar direto no login.
  const [sessaoExpirada, setSessaoExpirada] = useState(false)

  const login = useCallback(async (email: string, senha: string) => {
    const nova = await entrar(email, senha)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nova))
    setSessao(nova)
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY)
    setSessao(null)
    setUsuario(null)
  }, [])

  const token = sessao?.token ?? null
  const tokenRef = useRef(token)
  useEffect(() => {
    tokenRef.current = token
  }, [token])

  // Carrega quem está logado sempre que o token muda (login ou recarga da página).
  // Um 401 aqui significa sessão derrubada — troca de senha/e-mail ou usuário desativado.
  useEffect(() => {
    if (!token) return
    let cancelado = false
    buscarMeuUsuario(token)
      .then((dados) => {
        if (!cancelado) setUsuario(dados)
      })
      .catch((error) => {
        if (!cancelado && error instanceof ApiError && error.status === 401) {
          setSessaoExpirada(true)
        }
      })
    return () => {
      cancelado = true
    }
  }, [token])

  // Confere se o token da aba ainda vale. Só sai com 401: erro de rede não derruba ninguém.
  // A comparação com tokenRef descarta a resposta se a sessão mudou enquanto ela voltava.
  const conferirSessao = useCallback(() => {
    const atual = tokenRef.current
    if (!atual) return
    buscarMeuUsuario(atual)
      .then((dados) => {
        if (tokenRef.current === atual) setUsuario(dados)
      })
      .catch((error) => {
        if (tokenRef.current === atual && error instanceof ApiError && error.status === 401) {
          setSessaoExpirada(true)
        }
      })
  }, [])

  // Troca de senha ou e-mail derruba a sessão em todo lugar, não só na aba que fez a troca:
  // outra aba deste navegador fica sabendo pelo canal; outro navegador ou aparelho, ao
  // voltar a ter foco.
  useEffect(() => {
    if (!token) return
    let ultimaConferencia = 0
    const aoVoltar = () => {
      if (document.visibilityState !== "visible") return
      if (Date.now() - ultimaConferencia < INTERVALO_CONFERENCIA_MS) return
      ultimaConferencia = Date.now()
      conferirSessao()
    }
    const pararDeOuvir = ouvirCredenciaisAlteradas(conferirSessao)
    window.addEventListener("focus", aoVoltar)
    document.addEventListener("visibilitychange", aoVoltar)
    return () => {
      pararDeOuvir()
      window.removeEventListener("focus", aoVoltar)
      document.removeEventListener("visibilitychange", aoVoltar)
    }
  }, [token, conferirSessao])

  const value = useMemo(
    () => ({
      isLoggedIn: sessao !== null,
      token,
      usuario,
      login,
      logout,
      setUsuario,
    }),
    [sessao, token, usuario, login, logout]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
      <FeedbackDialog
        tom="aviso"
        titulo="Sessão expirada"
        descricao={SESSAO_EXPIRADA}
        botao="Entrar novamente"
        open={sessaoExpirada}
        onOpenChange={(aberto) => {
          if (aberto) return
          setSessaoExpirada(false)
          logout()
        }}
      />
    </AuthContext.Provider>
  )
}
