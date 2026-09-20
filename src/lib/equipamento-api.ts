import { apiFetch } from "@/lib/api"
import type { Pagina } from "@/lib/api"
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

export function listarEquipamentos(token: string) {
  const query = new URLSearchParams({ size: "1000", sort: "nome,asc" })
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
