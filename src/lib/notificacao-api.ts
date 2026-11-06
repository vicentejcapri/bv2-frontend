import { apiFetch } from "@/lib/api"
import { montarQuery } from "@/lib/api"
import type { Pagina, ParamsListagem } from "@/lib/api"
import type { StatusOs } from "@/lib/os-api"

/** Resultado do envio ao cliente — diferente do status da OS que disparou. */
export type StatusNotificacao = "PENDENTE" | "ENVIADO" | "FALHOU"

/** Só estes status de OS disparam aviso (templates semeados na V18). */
export type StatusNotificavel = Exclude<StatusOs, "EM_ANDAMENTO">

export type Notificacao = {
  id: number
  ordemServicoId: number
  cliente: { id: number; nome: string }
  statusOs: StatusOs
  /** Texto exato que saiu para o cliente, com os placeholders já trocados. */
  conteudo: string
  status: StatusNotificacao
  tentativas: number
  dataEnvio: string | null
  criadoEm: string
}

export type TemplateNotificacao = {
  status: StatusNotificavel
  conteudo: string
  ativo: boolean
  atualizadoEm: string | null
}

export type Placeholder = {
  chave: string
  marcador: string
  descricao: string
  exemplo: string
}

export type FiltrosNotificacao = ParamsListagem & {
  status?: StatusNotificacao
  /** "AAAA-MM-DD", inclusivas, sobre a data do envio. */
  dataInicio?: string
  dataFim?: string
}

/** `busca` casa com parte do nome do cliente ou do texto, ou com o número da OS. */
export function listarNotificacoes(token: string, filtros: FiltrosNotificacao = {}) {
  const query = montarQuery({ sort: "criadoEm,desc", ...filtros })
  return apiFetch<Pagina<Notificacao>>(`/notificacoes?${query}`, { token })
}

export function listarTemplates(token: string) {
  return apiFetch<TemplateNotificacao[]>("/notificacoes/templates", { token })
}

/** A lista mora no backend (enum Placeholder) para não sair de sincronia. */
export function listarPlaceholders(token: string) {
  return apiFetch<Placeholder[]>("/notificacoes/placeholders", { token })
}

/** O status é a chave do recurso e vai no caminho; texto e liga/desliga no corpo. */
export function salvarTemplate(
  token: string,
  status: StatusNotificavel,
  body: { ativo: boolean; conteudo: string }
) {
  return apiFetch<TemplateNotificacao>(`/notificacoes/templates/${status}`, {
    method: "PUT",
    token,
    body,
  })
}
