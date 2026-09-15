import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { mesPorExtenso } from "@/lib/format"
import { cn } from "@/lib/utils"

/** "2026-08" -> "ago" (ou "ago/26" quando o período atravessa anos). */
function rotuloMes(mes: string, comAno: boolean) {
  const [ano, m] = mes.split("-").map(Number)
  const nome = new Date(ano, m - 1, 1)
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "")
  return comAno ? `${nome}/${String(ano).slice(2)}` : nome
}

/** Teto "redondo" do eixo: 1, 2, 2.5 ou 5 × 10ⁿ, sempre ≥ o maior valor. */
function tetoDoEixo(maximo: number) {
  if (maximo <= 0) return 1
  const base = 10 ** Math.floor(Math.log10(maximo))
  const passo = [1, 2, 2.5, 5, 10].find((f) => f * base >= maximo) ?? 10
  return passo * base
}

/**
 * Colunas mensais de uma única série: eixo com três marcas, grade em hairline,
 * colunas finas com ponta arredondada e tooltip por coluna no hover.
 * Os valores completos ficam na tabela que acompanha cada gráfico.
 */
export function ColunasMensais({
  pontos,
  formatarEixo,
  formatarValor,
}: {
  pontos: { mes: string; valor: number }[]
  formatarEixo: (valor: number) => string
  formatarValor: (valor: number) => string
}) {
  const teto = tetoDoEixo(Math.max(...pontos.map((p) => p.valor), 0))
  const marcas = [teto, teto / 2, 0]
  const comAno = new Set(pontos.map((p) => p.mes.slice(0, 4))).size > 1
  const vazio = pontos.every((p) => p.valor === 0)
  // Rótulo de mês em todas as colunas só quando cabe; senão, alterna.
  const saltoRotulo = pontos.length > 8 ? 2 : 1

  return (
    <div className="flex gap-3" aria-hidden>
      {/* Eixo Y */}
      <div className="flex h-44 flex-col justify-between text-right text-[11px] leading-none tabular-nums text-muted-foreground">
        {marcas.map((marca) => (
          <span key={marca}>{formatarEixo(marca)}</span>
        ))}
      </div>

      <div className="min-w-0 flex-1">
        {/* Área de plotagem */}
        <div className="relative h-44">
          {marcas.map((marca, i) => (
            <div
              key={marca}
              className="absolute inset-x-0 border-t border-border"
              style={{ top: `${(i / (marcas.length - 1)) * 100}%` }}
            />
          ))}

          {vazio && (
            <p className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
              Sem movimento no período
            </p>
          )}

          <div className="absolute inset-0 flex items-end gap-0.5">
            {pontos.map((ponto) => (
              <Tooltip key={ponto.mes}>
                <TooltipTrigger asChild>
                  {/* Alvo de hover ocupa a faixa inteira, não só a coluna. Sem foco
                      de teclado de propósito: os mesmos valores estão na tabela. */}
                  <div className="group flex h-full min-w-0 flex-1 items-end justify-center rounded-sm hover:bg-muted/60">
                    <span
                      className="w-full max-w-6 rounded-t-[4px] bg-[var(--chart-1)] transition-opacity group-hover:opacity-80"
                      style={{
                        height: `${(ponto.valor / teto) * 100}%`,
                        minHeight: ponto.valor > 0 ? 2 : 0,
                      }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <span className="capitalize">{mesPorExtenso(ponto.mes)}</span>
                  {" · "}
                  <strong className="font-semibold">{formatarValor(ponto.valor)}</strong>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* Eixo X */}
        <div className="mt-2 flex gap-0.5">
          {pontos.map((ponto, i) => (
            <span
              key={ponto.mes}
              className="min-w-0 flex-1 truncate text-center text-[11px] text-muted-foreground"
            >
              {i % saltoRotulo === 0 ? rotuloMes(ponto.mes, comAno) : ""}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Parte-do-todo em uma barra empilhada horizontal. A identidade de cada fatia
 * nunca depende só da cor: a legenda abaixo repete rótulo e número.
 */
export function BarraEmpilhada({
  fatias,
}: {
  fatias: { chave: string; label: string; valor: number; cor: string }[]
}) {
  const total = fatias.reduce((soma, f) => soma + f.valor, 0)

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "flex h-3 w-full gap-0.5 overflow-hidden rounded-full",
          total === 0 && "bg-muted"
        )}
        aria-hidden
      >
        {fatias
          .filter((f) => f.valor > 0)
          .map((fatia) => (
            <div
              key={fatia.chave}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{
                width: `${(fatia.valor / total) * 100}%`,
                background: fatia.cor,
              }}
            />
          ))}
      </div>

      <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
        {fatias.map((fatia) => (
          <li key={fatia.chave} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: fatia.cor }}
            />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">
              {fatia.label}
            </span>
            <span className="font-medium tabular-nums">{fatia.valor}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Ranking em barras horizontais de uma cor só (a posição já diz a ordem).
 * Nome e valor ficam em texto; a barra só dá a proporção.
 */
export function BarrasRanking({
  itens,
  formatarValor,
}: {
  itens: { id: number; nome: string; valor: number; detalhe?: string }[]
  formatarValor: (valor: number) => string
}) {
  if (itens.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Sem movimento no período.
      </p>
    )
  }

  const maximo = Math.max(...itens.map((item) => item.valor), 1)

  return (
    <ol className="space-y-3.5">
      {itens.map((item) => (
        <li key={item.id} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">
              {item.nome}
              {item.detalhe && (
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {item.detalhe}
                </span>
              )}
            </span>
            <span className="shrink-0 font-medium tabular-nums">
              {formatarValor(item.valor)}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted" aria-hidden>
            <div
              className="h-full rounded-full bg-[var(--chart-1)]"
              style={{ width: `${(item.valor / maximo) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  )
}
