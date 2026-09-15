import { apiFetch } from "@/lib/api"

export type StatusOS = "EM_ANDAMENTO" | "CONCLUIDA" | "ENTREGUE" | "CANCELADA"

export type ItemRanking = { id: number; nome: string; quantidade: number }

export type Painel = {
  /** Janela efetivamente usada pelo servidor (inclusiva nas duas pontas). */
  periodo: { dataInicio: string; dataFim: string }
  /** Estado atual — não é recortado pelo período. */
  resumo: {
    ordensPorStatus: Record<StatusOS, number>
    clientesAtivos: number
    equipamentos: number
    servicosAtivos: number
  }
  faturamento: {
    faturamentoRealizado: number
    faturamentoEmAberto: number
    ticketMedio: number
    ordensEntregues: number
    ordensComValorManual: number
  }
  /** Um ponto por mês do período, inclusive meses zerados. `mes` = AAAA-MM. */
  serieMensal: { mes: string; ordensAbertas: number; faturamento: number }[]
  rankings: {
    servicosMaisExecutados: ItemRanking[]
    clientesPorFaturamento: {
      id: number
      nome: string
      faturamento: number
      ordensEntregues: number
    }[]
    marcasMaisAtendidas: ItemRanking[]
  }
}

export type Periodo = { dataInicio: string; dataFim: string }

export function buscarPainel(token: string, { dataInicio, dataFim }: Periodo) {
  const query = new URLSearchParams({ dataInicio, dataFim })
  return apiFetch<Painel>(`/painel?${query}`, { token })
}
