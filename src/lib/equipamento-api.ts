import { apiFetch } from "@/lib/api"
import { montarQuery } from "@/lib/api"
import type { Pagina, ParamsListagem } from "@/lib/api"
import type { Marca } from "@/lib/marca-api"

export type Equipamento = {
  id: number
  nome: string
  criadoEm: string
  cliente: { id: number; nome: string }
  marca: Marca
}

/** O cliente não muda depois de criado: o PUT só aceita marca e nome. */
export type EquipamentoAtualizacao = { marcaId: number; nome: string }
export type EquipamentoCriacao = EquipamentoAtualizacao & { clienteId: number }

export type FiltrosEquipamento = ParamsListagem & { clienteId?: number }

/** `busca` casa com parte do nome do equipamento, da marca ou do cliente. */
export function listarEquipamentos(token: string, filtros: FiltrosEquipamento = {}) {
  const query = montarQuery({ sort: "nome,asc", ...filtros })
  return apiFetch<Pagina<Equipamento>>(`/equipamentos?${query}`, { token })
}

/**
 * 422 para cliente inativo; 409 quando o cliente já tem um equipamento com o
 * mesmo nome e a mesma marca.
 */
export function criarEquipamento(token: string, body: EquipamentoCriacao) {
  return apiFetch<Equipamento>("/equipamentos", { method: "POST", token, body })
}

export function atualizarEquipamento(
  token: string,
  id: number,
  body: EquipamentoAtualizacao
) {
  return apiFetch<Equipamento>(`/equipamentos/${id}`, { method: "PUT", token, body })
}

/** 204; 409 quando o equipamento já aparece em alguma OS. */
export function excluirEquipamento(token: string, id: number) {
  return apiFetch(`/equipamentos/${id}`, { method: "DELETE", token })
}
