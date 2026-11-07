import { useCallback, useEffect, useState } from "react"

import { useAuth } from "@/hooks/useAuth"
import { ApiError } from "@/lib/api"
import type { Pagina, ParamsListagem } from "@/lib/api"

/** Espera entre a última tecla e a ida ao servidor. */
const ATRASO_BUSCA_MS = 300

const TAMANHO_PADRAO = 10

/**
 * Estado de uma listagem paginada no servidor: página atual, busca com debounce e
 * filtros da tela. Trocar a busca ou um filtro volta para a primeira página.
 *
 * `filtros` pode ser um objeto novo a cada render: o que conta é o conteúdo
 * (comparado serializado), não a identidade.
 */
export function useListagem<T, F extends object>(
  buscar: (token: string, params: F & ParamsListagem) => Promise<Pagina<T>>,
  filtros: F,
  { tamanho = TAMANHO_PADRAO, mensagemErro = "Não foi possível carregar a lista." } = {}
) {
  const { token, logout } = useAuth()
  const [busca, setBusca] = useState("")
  const [buscaAplicada, setBuscaAplicada] = useState("")
  const [page, setPage] = useState(0)
  const [tentativa, setTentativa] = useState(0)
  const [pagina, setPagina] = useState<Pagina<T> | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  // Chave da última resposta que chegou: enquanto difere da atual, está carregando.
  // Derivar em vez de guardar um booleano evita setState no corpo do efeito.
  const [chaveCarregada, setChaveCarregada] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setBuscaAplicada(busca.trim()), ATRASO_BUSCA_MS)
    return () => clearTimeout(timer)
  }, [busca])

  const chaveFiltros = JSON.stringify(filtros)
  const chaveConsulta = `${chaveFiltros}|${buscaAplicada}`

  // Filtro ou busca mudou: volta para a primeira página no mesmo render.
  const [consultaAnterior, setConsultaAnterior] = useState(chaveConsulta)
  if (consultaAnterior !== chaveConsulta) {
    setConsultaAnterior(chaveConsulta)
    setPage(0)
  }

  const chave = `${chaveConsulta}|${page}|${tentativa}`

  useEffect(() => {
    if (!token) return
    let cancelado = false
    const params = {
      ...(JSON.parse(chaveFiltros) as F),
      page,
      size: tamanho,
      busca: buscaAplicada || undefined,
    }

    buscar(token, params)
      .then((resultado) => {
        if (cancelado) return
        // Excluiu o último item da página: volta uma em vez de mostrar vazio.
        if (resultado.conteudo.length === 0 && page > 0) {
          setPage(page - 1)
          return
        }
        setPagina(resultado)
        setErro(null)
        setChaveCarregada(chave)
      })
      .catch((error) => {
        if (cancelado) return
        if (error instanceof ApiError && error.status === 401) return logout()
        setErro(error instanceof ApiError ? error.message : mensagemErro)
        setChaveCarregada(chave)
      })

    return () => {
      cancelado = true
    }
  }, [token, logout, buscar, chaveFiltros, buscaAplicada, page, tamanho, chave, mensagemErro])

  /** Troca um item da página atual (edição, ativar/inativar) sem recarregar. */
  const substituir = useCallback((atualizado: T, mesmo: (a: T, b: T) => boolean) => {
    setPagina((atual) =>
      atual
        ? { ...atual, conteudo: atual.conteudo.map((i) => (mesmo(i, atualizado) ? atualizado : i)) }
        : atual
    )
  }, [])

  const recarregar = useCallback(() => setTentativa((n) => n + 1), [])

  return {
    pagina,
    itens: pagina?.conteudo ?? null,
    erro,
    carregando: chaveCarregada !== chave,
    busca,
    setBusca,
    /** Há busca aplicada: junto com os filtros da tela, decide se o vazio é "nada encontrado". */
    buscando: buscaAplicada !== "",
    irPara: setPage,
    recarregar,
    substituir,
  }
}
