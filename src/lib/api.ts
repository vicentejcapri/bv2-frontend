/**
 * Erro de uma chamada à API. O backend responde no formato ProblemDetail
 * (RFC 7807): `detail` traz a mensagem e `erros` o mapa campo → mensagem dos 400.
 * `status` 0 indica que o servidor nem respondeu.
 */
export class ApiError extends Error {
  status: number
  erros?: Record<string, string>

  constructor(status: number, mensagem: string, erros?: Record<string, string>) {
    super(mensagem)
    this.name = "ApiError"
    this.status = status
    this.erros = erros
  }
}

/** Envelope PaginaResponse do backend, comum a todas as listagens. */
export type Pagina<T> = {
  conteudo: T[]
  pagina: number
  tamanho: number
  totalElementos: number
  totalPaginas: number
  primeira: boolean
  ultima: boolean
}

type Opcoes = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  token?: string | null
}

export async function apiFetch<T = void>(
  caminho: string,
  { method = "GET", body, token }: Opcoes = {}
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" }
  if (body !== undefined) headers["Content-Type"] = "application/json"
  if (token) headers.Authorization = `Bearer ${token}`

  let resposta: Response
  try {
    resposta = await fetch(`/api${caminho}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, "Não foi possível conectar ao servidor.")
  }

  const texto = await resposta.text()
  const dados = texto ? safeJson(texto) : undefined

  if (!resposta.ok) {
    const problema = (dados ?? {}) as { detail?: string; erros?: Record<string, string> }
    throw new ApiError(
      resposta.status,
      problema.detail ?? "Algo deu errado. Tente novamente.",
      problema.erros
    )
  }

  return dados as T
}

function safeJson(texto: string): unknown {
  try {
    return JSON.parse(texto)
  } catch {
    return undefined
  }
}
