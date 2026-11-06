import { apiFetch } from "@/lib/api"
import { montarQuery } from "@/lib/api"
import type { Pagina, ParamsListagem } from "@/lib/api"

export type StatusOs = "EM_ANDAMENTO" | "CONCLUIDA" | "ENTREGUE" | "CANCELADA"

export type OrdemServico = {
  id: number
  observacao: string | null
  status: StatusOs
  /** "2026-05-30" — o dia em que o equipamento entrou na oficina. */
  dataEntrada: string
  dataConcluida: string | null
  dataEntregue: string | null
  valorTotal: number
  /** true quando o valor foi fixado à mão em vez de somar os itens. */
  valorTotalManual: boolean
  criadoEm: string
  cliente: { id: number; nome: string }
}

/** Uma linha da OS: um serviço executado sobre um equipamento. */
export type ItemOs = {
  id: number
  observacao: string | null
  criadoEm: string
  equipamento: { id: number; nome: string }
  servico: { id: number; nome: string; valor: number }
}

export type OrdemServicoCriacao = {
  clienteId: number
  dataEntrada: string
  observacao: string | null
  itens: { equipamentoId: number; servicoId: number; observacao?: string | null }[]
  /**
   * Enviado, o total nasce fixado à mão e para de acompanhar os itens. Omitido,
   * nasce automático: a soma dos serviços lançados.
   */
  valorTotal?: number
}

/**
 * 422 para cliente inativo, serviço inativo ou equipamento de outro cliente;
 * 409 quando o mesmo serviço é lançado duas vezes para o mesmo equipamento.
 */
export function criarOrdem(token: string, body: OrdemServicoCriacao) {
  return apiFetch<OrdemServico>("/ordens-servico", { method: "POST", token, body })
}

/** OS que ainda estão na oficina: o filtro padrão da tela. */
export const STATUS_EM_ABERTO: StatusOs[] = ["EM_ANDAMENTO", "CONCLUIDA"]

export type FiltrosOrdem = ParamsListagem & { status?: StatusOs[] }

/** `busca` casa com parte do nome do cliente ou com o número da OS. */
export function listarOrdens(token: string, filtros: FiltrosOrdem = {}) {
  const query = montarQuery({ sort: "dataEntrada,desc", ...filtros })
  return apiFetch<Pagina<OrdemServico>>(`/ordens-servico?${query}`, { token })
}

/** Sem paginação no backend: a OS tem poucos itens. */
export function listarItensOrdem(token: string, id: number) {
  return apiFetch<ItemOs[]>(`/ordens-servico/${id}/itens`, { token })
}

/**
 * Máquina de estados da OS, espelhando o `transicionar` do backend. EM_ANDAMENTO
 * não é destino: não existe endpoint para reabrir, e ENTREGUE e CANCELADA são
 * pontos finais. Tentar um caminho fora daqui responde 422.
 */
export const TRANSICOES: Record<StatusOs, StatusOs[]> = {
  EM_ANDAMENTO: ["CONCLUIDA", "CANCELADA"],
  CONCLUIDA: ["ENTREGUE", "CANCELADA"],
  ENTREGUE: [],
  CANCELADA: [],
}

const ROTA: Record<Exclude<StatusOs, "EM_ANDAMENTO">, string> = {
  CONCLUIDA: "concluir",
  ENTREGUE: "entregar",
  CANCELADA: "cancelar",
}

/** Idempotente: repetir o status atual devolve a OS sem mudar nada. */
export function alterarStatusOrdem(
  token: string,
  id: number,
  destino: Exclude<StatusOs, "EM_ANDAMENTO">
) {
  return apiFetch<OrdemServico>(`/ordens-servico/${id}/${ROTA[destino]}`, {
    method: "PATCH",
    token,
  })
}

/**
 * 204. Exclusão definitiva: leva junto os itens e o log de notificações da ordem.
 * Só EM_ANDAMENTO ou CANCELADA — concluída e entregue respondem 422, porque
 * entram no faturamento.
 */
export function excluirOrdem(token: string, id: number) {
  return apiFetch(`/ordens-servico/${id}`, { method: "DELETE", token })
}

/**
 * Um valor fixa o total à mão e o congela: adicionar ou remover itens deixa de
 * recalculá-lo. `null` volta ao automático (soma dos serviços). Só enquanto
 * EM_ANDAMENTO — depois disso responde 422.
 */
export function definirValorTotalOrdem(token: string, id: number, valorTotal: number | null) {
  return apiFetch<OrdemServico>(`/ordens-servico/${id}/valor-total`, {
    method: "PATCH",
    token,
    body: { valorTotal },
  })
}
