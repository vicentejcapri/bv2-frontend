import { apiFetch } from "@/lib/api"
import type { Pagina } from "@/lib/api"

export type Marca = {
  id: number
  nome: string
  criadoEm: string
}

/** O catálogo é pequeno: uma página grande traz todas as marcas para o select. */
export function listarMarcas(token: string) {
  const query = new URLSearchParams({ size: "1000", sort: "nome,asc" })
  return apiFetch<Pagina<Marca>>(`/marcas?${query}`, { token })
}

/** 409 quando já existe marca com o mesmo nome (sem diferenciar maiúsculas). */
export function criarMarca(token: string, nome: string) {
  return apiFetch<Marca>("/marcas", { method: "POST", token, body: { nome } })
}
