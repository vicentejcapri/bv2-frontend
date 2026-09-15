import { apiFetch } from "@/lib/api"
import type { Pagina } from "@/lib/api"

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

/** Sem paginação na tela por enquanto: uma página grande traz a carteira toda. */
export function listarClientes(token: string) {
  const query = new URLSearchParams({ size: "1000", sort: "nome,asc" })
  return apiFetch<Pagina<Cliente>>(`/clientes?${query}`, { token })
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
