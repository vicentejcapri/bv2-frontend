import { apiFetch } from "@/lib/api"

export type Sessao = {
  token: string
  tipo: string
  /** ISO-8601 */
  expiraEm: string
}

export function entrar(email: string, senha: string) {
  return apiFetch<Sessao>("/auth/login", {
    method: "POST",
    body: { email, senha },
  })
}

/** Sempre 202, exista a conta ou não — a tela não deve diferenciar. */
export function solicitarRecuperacao(email: string) {
  return apiFetch("/auth/senha/esqueci", { method: "POST", body: { email } })
}

export function redefinirSenha(
  token: string,
  senhaNova: string,
  senhaNovaConfirmacao: string
) {
  return apiFetch("/auth/senha/redefinir", {
    method: "POST",
    body: { token, senhaNova, senhaNovaConfirmacao },
  })
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Mesmas regras do `@NotBlank @Email @Size(max = 50)` do backend. */
export function validarEmail(email: string): string | undefined {
  if (!email.trim()) return "Informe seu e-mail."
  if (!EMAIL_RE.test(email.trim())) return "E-mail em formato inválido."
  if (email.trim().length > 50) return "O e-mail deve ter no máximo 50 caracteres."
}
