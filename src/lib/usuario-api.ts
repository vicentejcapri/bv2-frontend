import { apiFetch } from "@/lib/api"
import type { Pagina } from "@/lib/api"

export type RoleUsuario = "MASTER" | "ADMIN"

export type Usuario = {
  id: number
  nome: string
  email: string
  role: RoleUsuario
  ativo: boolean
  criadoEm: string
}

export const ROLE_LABEL: Record<RoleUsuario, string> = {
  MASTER: "Equipe BV2",
  ADMIN: "Administrador",
}

export function buscarMeuUsuario(token: string) {
  return apiFetch<Usuario>("/usuarios/eu", { token })
}

/** Só o nome muda por aqui; e-mail e senha têm fluxo próprio, com prova de posse. */
export function atualizarMeuNome(token: string, nome: string) {
  return apiFetch<Usuario>("/usuarios/eu", {
    method: "PUT",
    token,
    body: { nome },
  })
}

/** 202. Nada muda até o clique no link enviado para o e-mail atual. */
export function solicitarTrocaSenha(
  token: string,
  body: { senhaAtual: string; senhaNova: string; senhaNovaConfirmacao: string }
) {
  return apiFetch("/usuarios/eu/senha", { method: "PUT", token, body })
}

/** Rota pública: o token do link é a credencial. Todos os JWT anteriores morrem. */
export function confirmarTrocaSenha(tokenLink: string) {
  return apiFetch("/auth/senha/confirmar", {
    method: "POST",
    body: { token: tokenLink },
  })
}

/** 202. Nada muda até o clique no link enviado para o endereço novo. */
export function solicitarTrocaEmail(
  token: string,
  body: { senhaAtual: string; novoEmail: string; novoEmailConfirmacao: string }
) {
  return apiFetch("/usuarios/eu/email", { method: "PUT", token, body })
}

/** Rota pública: o token do link é a credencial. */
export function confirmarTrocaEmail(tokenLink: string) {
  return apiFetch("/auth/email/confirmar", {
    method: "POST",
    body: { token: tokenLink },
  })
}

// ------------------------------------------------------------------
// Cadastro de usuários do sistema — só o MASTER (403 para o ADMIN)
// ------------------------------------------------------------------

/** Uma página grande basta: o sistema tem poucos usuários. */
export function listarUsuarios(token: string, filtro: { ativo?: boolean } = {}) {
  const query = new URLSearchParams({ size: "200", sort: "nome,asc" })
  if (filtro.ativo !== undefined) query.set("ativo", String(filtro.ativo))
  return apiFetch<Pagina<Usuario>>(`/usuarios?${query}`, { token })
}

/** Nasce sempre ADMIN, com os templates de notificação desligados. 409 se o e-mail já existe. */
export function criarUsuario(
  token: string,
  body: { nome: string; email: string; senha: string }
) {
  return apiFetch<Usuario>("/usuarios", { method: "POST", token, body })
}

/** Só o nome: e-mail e senha de outro usuário não mudam por aqui. */
export function atualizarUsuario(token: string, id: number, nome: string) {
  return apiFetch<Usuario>(`/usuarios/${id}`, { method: "PUT", token, body: { nome } })
}

/**
 * 204. Apaga o usuário e TODA a conta dele (clientes, equipamentos, serviços, OS,
 * notificações e templates). Irreversível; o MASTER não pode ser excluído (422).
 */
export function excluirUsuario(token: string, id: number) {
  return apiFetch(`/usuarios/${id}`, { method: "DELETE", token })
}

/** Idempotente. Desativar o MASTER responde 422. */
export function alterarSituacaoUsuario(token: string, id: number, ativo: boolean) {
  return apiFetch<Usuario>(`/usuarios/${id}/${ativo ? "ativar" : "desativar"}`, {
    method: "PATCH",
    token,
  })
}
