import { createContext } from "react"
import type { Usuario } from "@/lib/usuario-api"

export type ContaContextValue = {
  /** Só o MASTER vê o seletor de conta e o cadastro de usuários. */
  isMaster: boolean
  /**
   * Conta cujos dados as telas mostram e onde os cadastros são criados. Para o
   * ADMIN é sempre `null`: o backend usa a conta do token.
   */
  contaId: number | null
  /** Usuários ativos que o MASTER pode escolher (inclui ele mesmo). Vazio para o ADMIN. */
  contas: Usuario[]
  /** `false` enquanto ainda não se sabe em qual conta operar — as telas esperam. */
  pronto: boolean
  trocarConta: (id: number) => void
  /** Rebusca a lista depois de criar, ativar ou desativar um usuário. */
  recarregarContas: () => void
}

export const ContaContext = createContext<ContaContextValue | undefined>(undefined)
