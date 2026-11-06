import { apiFetch } from "@/lib/api"
import { montarQuery } from "@/lib/api"
import type { Pagina, ParamsListagem } from "@/lib/api"

export type Cliente = {
  id: number
  nome: string
  /** Só dígitos (10 a 13), como o backend guarda. */
  telefone: string
  ativo: boolean
  criadoEm: string
}

/** Corpo do POST e do PUT: a situação muda pelos PATCH /ativar e /desativar. */
export type ClienteInput = Pick<Cliente, "nome" | "telefone">

export type FiltrosCliente = ParamsListagem & { ativo?: boolean }

/** `busca` casa com parte do nome ou do telefone. */
export function listarClientes(token: string, filtros: FiltrosCliente = {}) {
  const query = montarQuery({ sort: "nome,asc", ...filtros })
  return apiFetch<Pagina<Cliente>>(`/clientes?${query}`, { token })
}

/**
 * Clientes com o mesmo nome (sem caixa) e o mesmo telefone. Só serve para avisar:
 * o backend aceita o cadastro de qualquer jeito.
 */
export function buscarPossiveisDuplicados(
  token: string,
  body: ClienteInput,
  ignorarId?: number
) {
  const query = new URLSearchParams({ nome: body.nome, telefone: body.telefone })
  if (ignorarId !== undefined) query.set("ignorarId", String(ignorarId))
  return apiFetch<Cliente[]>(`/clientes/possiveis-duplicados?${query}`, { token })
}

export function criarCliente(token: string, body: ClienteInput) {
  return apiFetch<Cliente>("/clientes", { method: "POST", token, body })
}

export function atualizarCliente(token: string, id: number, body: ClienteInput) {
  return apiFetch<Cliente>(`/clientes/${id}`, { method: "PUT", token, body })
}

/** Idempotente nos dois sentidos. */
export function alterarSituacaoCliente(token: string, id: number, ativo: boolean) {
  return apiFetch<Cliente>(`/clientes/${id}/${ativo ? "ativar" : "desativar"}`, {
    method: "PATCH",
    token,
  })
}

/** 204; 409 quando o cliente já tem equipamentos, OS ou notificações. */
export function excluirCliente(token: string, id: number) {
  return apiFetch(`/clientes/${id}`, { method: "DELETE", token })
}
