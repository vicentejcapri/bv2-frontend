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
export async function buscarPossiveisDuplicados(
  token: string,
  body: ClienteInput,
  ignorarId?: number
) {
  // O backend compara o telefone exato. Cadastros antigos foram salvos sem o 55
  // (DDD + número) e os novos com ele: consulta as duas formas para o aviso não
  // falhar justo no cliente que já existia.
  const formas = new Set([body.telefone])
  if (body.telefone.length > 11 && body.telefone.startsWith("55")) formas.add(body.telefone.slice(2))

  const respostas = await Promise.all(
    [...formas].map((telefone) => {
      const query = new URLSearchParams({ nome: body.nome, telefone })
      if (ignorarId !== undefined) query.set("ignorarId", String(ignorarId))
      return apiFetch<Cliente[]>(`/clientes/possiveis-duplicados?${query}`, { token })
    })
  )
  const porId = new Map(respostas.flat().map((cliente) => [cliente.id, cliente]))
  return [...porId.values()].sort((a, b) => a.id - b.id)
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
