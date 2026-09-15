import { createContext } from "react"
import type { Usuario } from "@/lib/usuario-api"

export type AuthContextValue = {
  isLoggedIn: boolean
  /** JWT da sessão atual, para o `Authorization` das chamadas à API. */
  token: string | null
  /** Quem está logado (GET /usuarios/eu). `null` enquanto carrega. */
  usuario: Usuario | null
  /** Lança `ApiError` quando o backend recusa as credenciais. */
  login: (email: string, senha: string) => Promise<void>
  logout: () => void
  /** Troca o usuário em memória depois de uma edição bem-sucedida. */
  setUsuario: (usuario: Usuario) => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
