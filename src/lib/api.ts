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

/** Paginação e busca livre, comuns a todas as listagens. */
export type ParamsListagem = {
  /** Base 0, como o Spring. */
  page?: number
  size?: number
  busca?: string
}

/** Opções do select "Situação" das listagens. */
export type Situacao = "TODOS" | "ATIVOS" | "INATIVOS"

/** "TODOS" não filtra: vira `undefined`, que o `montarQuery` pula. */
export function ativoDaSituacao(situacao: Situacao): boolean | undefined {
  return situacao === "TODOS" ? undefined : situacao === "ATIVOS"
}

type ValorQuery = string | number | boolean | readonly string[] | null | undefined

/**
 * Monta a query string pulando o que veio vazio: filtro "Todos" é `undefined`, e
 * mandar `?ativo=` faria o Spring tentar converter string vazia. Lista vira o
 * param repetido (`status=A&status=B`), que é como o Spring lê `List<>`.
 */
export function montarQuery(params: Record<string, ValorQuery>) {
  const query = new URLSearchParams()
  for (const [chave, valor] of Object.entries(params)) {
    if (valor === undefined || valor === null || valor === "") continue
    if (Array.isArray(valor)) {
      valor.forEach((v) => query.append(chave, v))
    } else {
      query.set(chave, String(valor))
    }
  }
  return query.toString()
}

/**
 * Conta em que o MASTER está operando. Vai no header `X-Conta-Id` de toda chamada;
 * `null` (ADMIN, ou MASTER na própria conta) omite o header e o backend usa a conta
 * do token. Estado de módulo, e não parâmetro, para nenhuma função `*-api.ts`
 * precisar mudar de assinatura — quem define é o ContaProvider.
 */
let contaAtiva: number | null = null

export function definirContaAtiva(id: number | null) {
  contaAtiva = id
}

/**
 * Base da API. Em produção (Vercel) vem de VITE_API_URL, definido em
 * `.env.production` (https://api.bv2.tech): o navegador chama a API direto, liberado
 * pelo CORS do backend. Sem a variável (dev), cai no `/api` que o proxy do Vite
 * repassa para o Spring em localhost:8080.
 */
const API_URL = (import.meta.env.VITE_API_URL ?? "/api").replace(/\/$/, "")

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
  if (token && contaAtiva !== null) headers["X-Conta-Id"] = String(contaAtiva)

  let resposta: Response
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
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
