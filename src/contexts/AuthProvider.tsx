import { useCallback, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { AuthContext } from "./auth-context"
import { ApiError } from "@/lib/api"
import { entrar } from "@/lib/auth-api"
import type { Sessao } from "@/lib/auth-api"
import { buscarMeuUsuario } from "@/lib/usuario-api"
import type { Usuario } from "@/lib/usuario-api"

const STORAGE_KEY = "bv2:sessao"

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

  // Carrega quem está logado sempre que o token muda (login ou recarga da página).
  // Um 401 aqui significa sessão derrubada — troca de senha/e-mail ou usuário desativado.
  const token = sessao?.token ?? null
  useEffect(() => {
    if (!token) return
    let cancelado = false
    buscarMeuUsuario(token)
      .then((dados) => {
        if (!cancelado) setUsuario(dados)
      })
      .catch((error) => {
        if (!cancelado && error instanceof ApiError && error.status === 401) logout()
      })
    return () => {
      cancelado = true
    }
  }, [token, logout])

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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
