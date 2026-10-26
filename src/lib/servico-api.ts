import { apiFetch } from "@/lib/api"
import { montarQuery } from "@/lib/api"
import type { Pagina, ParamsListagem } from "@/lib/api"

export type Servico = {
  id: number
  nome: string
  descricao: string | null
  valor: number
  /** Mantido pelas ordens de serviço; não vem do formulário. */
  contadorUso: number
  ativo: boolean
  criadoEm: string
}

/** Corpo do POST e do PUT: a situação muda pelos PATCH /ativar e /desativar. */
export type ServicoInput = Pick<Servico, "nome" | "descricao" | "valor">

export type FiltrosServico = ParamsListagem & { ativo?: boolean }

/** `busca` casa com parte do nome ou da descrição. */
export function listarServicos(token: string, filtros: FiltrosServico = {}) {
  const query = montarQuery({ sort: "nome,asc", ...filtros })
  return apiFetch<Pagina<Servico>>(`/servicos?${query}`, { token })
}

/** 409 quando já existe serviço com o mesmo nome. */
export function criarServico(token: string, body: ServicoInput) {
  return apiFetch<Servico>("/servicos", { method: "POST", token, body })
}

export function atualizarServico(token: string, id: number, body: ServicoInput) {
  return apiFetch<Servico>(`/servicos/${id}`, { method: "PUT", token, body })
}

/** Idempotente nos dois sentidos. */
export function alterarSituacaoServico(token: string, id: number, ativo: boolean) {
  return apiFetch<Servico>(`/servicos/${id}/${ativo ? "ativar" : "desativar"}`, {
    method: "PATCH",
    token,
  })
}

/** 204; 409 quando o serviço já aparece em alguma OS. */
export function excluirServico(token: string, id: number) {
  return apiFetch(`/servicos/${id}`, { method: "DELETE", token })
}
