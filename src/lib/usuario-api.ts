import { apiFetch } from "@/lib/api"

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

/** 204. Todos os JWT anteriores morrem: é preciso entrar de novo. */
export function alterarMinhaSenha(
  token: string,
  body: { senhaAtual: string; senhaNova: string; senhaNovaConfirmacao: string }
) {
  return apiFetch("/usuarios/eu/senha", { method: "PUT", token, body })
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
