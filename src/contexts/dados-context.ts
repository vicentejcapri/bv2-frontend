import { createContext } from "react"

import type {
  Cliente,
  Equipamento,
  Notificacao,
  OrdemServico,
  Servico,
  StatusNotificavel,
  TemplateNotificacao,
} from "@/data/mocks"

/** Campos preenchidos no formulário — o id e derivados saem do provider. */
export type NovoClienteInput = Omit<Cliente, "id" | "ordens">
export type NovoEquipamentoInput = Omit<Equipamento, "id">
export type NovoServicoInput = Omit<Servico, "id">
export type NovaOSInput = Omit<OrdemServico, "id" | "atrasada">

export type DadosContextValue = {
  clientes: Cliente[]
  equipamentos: Equipamento[]
  servicos: Servico[]
  ordens: OrdemServico[]
  notificacoes: Notificacao[]
  templatesNotificacao: TemplateNotificacao[]
  addCliente: (dados: NovoClienteInput) => Cliente
  addEquipamento: (dados: NovoEquipamentoInput) => Equipamento
  addServico: (dados: NovoServicoInput) => Servico
  addOrdem: (dados: NovaOSInput) => OrdemServico
  /** Liga ou desliga o aviso automático de um status (PUT por status na API). */
  atualizarTemplateNotificacao: (status: StatusNotificavel, ativo: boolean) => void
}

export const DadosContext = createContext<DadosContextValue | undefined>(
  undefined
)
