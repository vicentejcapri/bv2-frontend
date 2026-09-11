import { useCallback, useMemo, useState } from "react"
import type { ReactNode } from "react"

import {
  mockClientes,
  mockEquipamentos,
  mockNotificacoes,
  mockOS,
  mockServicos,
  mockTemplatesNotificacao,
} from "@/data/mocks"
import type {
  Cliente,
  Equipamento,
  OrdemServico,
  Servico,
  StatusNotificavel,
  TemplateNotificacao,
} from "@/data/mocks"
import {
  DadosContext,
  type NovaOSInput,
  type NovoClienteInput,
  type NovoEquipamentoInput,
  type NovoServicoInput,
} from "./dados-context"

/** Próximo número de uma sequência "PREFIXO-0000". */
function proximoCodigo(ids: string[], prefixo: string, digitos: number) {
  const maior = ids.reduce((maximo, id) => {
    const numero = Number(id.replace(`${prefixo}-`, ""))
    return Number.isFinite(numero) ? Math.max(maximo, numero) : maximo
  }, 0)
  return `${prefixo}-${String(maior + 1).padStart(digitos, "0")}`
}

/** Agora no formato "30/05/2026 09:15", o mesmo das datas dos mocks. */
function agoraBR() {
  return new Date().toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).replace(",", "")
}

/** Próximo id numérico simples (clientes e equipamentos). */
function proximoId(ids: string[]) {
  const maior = ids.reduce((maximo, id) => Math.max(maximo, Number(id) || 0), 0)
  return String(maior + 1)
}

/**
 * Guarda os cadastros em memória enquanto não existe API.
 * Fica acima das rotas para que um cliente criado na tela de Clientes já
 * apareça no seletor da Nova OS.
 */
export function DadosProvider({ children }: { children: ReactNode }) {
  const [clientes, setClientes] = useState<Cliente[]>(mockClientes)
  const [equipamentos, setEquipamentos] =
    useState<Equipamento[]>(mockEquipamentos)
  const [servicos, setServicos] = useState<Servico[]>(mockServicos)
  const [ordens, setOrdens] = useState<OrdemServico[]>(mockOS)
  const [templatesNotificacao, setTemplatesNotificacao] = useState<
    TemplateNotificacao[]
  >(mockTemplatesNotificacao)

  const addCliente = useCallback(
    (dados: NovoClienteInput) => {
      const novo: Cliente = {
        ...dados,
        id: proximoId(clientes.map((cliente) => cliente.id)),
        ordens: 0,
      }
      setClientes((atuais) => [novo, ...atuais])
      return novo
    },
    [clientes]
  )

  const addEquipamento = useCallback(
    (dados: NovoEquipamentoInput) => {
      const novo: Equipamento = {
        ...dados,
        id: proximoId(equipamentos.map((equipamento) => equipamento.id)),
      }
      setEquipamentos((atuais) => [novo, ...atuais])
      return novo
    },
    [equipamentos]
  )

  const addServico = useCallback(
    (dados: NovoServicoInput) => {
      const novo: Servico = {
        ...dados,
        id: proximoCodigo(servicos.map((servico) => servico.id), "SRV", 2),
      }
      setServicos((atuais) => [novo, ...atuais])
      return novo
    },
    [servicos]
  )

  const addOrdem = useCallback(
    (dados: NovaOSInput) => {
      const nova: OrdemServico = {
        ...dados,
        id: proximoCodigo(ordens.map((ordem) => ordem.id), "OS", 4),
      }
      setOrdens((atuais) => [nova, ...atuais])
      // Uma OS nova soma no contador do cliente.
      setClientes((atuais) =>
        atuais.map((cliente) =>
          cliente.nome === dados.cliente
            ? { ...cliente, ordens: cliente.ordens + 1 }
            : cliente
        )
      )
      return nova
    },
    [ordens]
  )

  const atualizarTemplateNotificacao = useCallback(
    (status: StatusNotificavel, ativo: boolean) => {
      setTemplatesNotificacao((atuais) =>
        atuais.map((template) =>
          template.status === status
            ? { ...template, ativo, atualizadoEm: agoraBR() }
            : template
        )
      )
    },
    []
  )

  const value = useMemo(
    () => ({
      clientes,
      equipamentos,
      servicos,
      ordens,
      notificacoes: mockNotificacoes,
      templatesNotificacao,
      addCliente,
      addEquipamento,
      addServico,
      addOrdem,
      atualizarTemplateNotificacao,
    }),
    [
      clientes,
      equipamentos,
      servicos,
      ordens,
      templatesNotificacao,
      addCliente,
      addEquipamento,
      addServico,
      addOrdem,
      atualizarTemplateNotificacao,
    ]
  )

  return <DadosContext.Provider value={value}>{children}</DadosContext.Provider>
}
