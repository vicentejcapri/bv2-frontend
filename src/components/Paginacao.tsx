import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CardFooter } from "@/components/ui/card"
import type { Pagina } from "@/lib/api"

/**
 * Rodapé das listagens: quantos registros a consulta achou, qual faixa está na
 * tela e os botões de página. Os números vêm do envelope do backend.
 */
export function Paginacao({
  pagina,
  carregando,
  onIrPara,
  singular,
  plural,
}: {
  pagina: Pagina<unknown>
  carregando: boolean
  onIrPara: (page: number) => void
  singular: string
  plural: string
}) {
  const { pagina: atual, tamanho, totalElementos, totalPaginas } = pagina
  const inicio = totalElementos === 0 ? 0 : atual * tamanho + 1
  const fim = Math.min((atual + 1) * tamanho, totalElementos)

  return (
    <CardFooter className="flex-wrap justify-between gap-2 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        {totalPaginas > 1 && (
          <>
            <strong className="text-foreground">
              {inicio}–{fim}
            </strong>
            de
          </>
        )}
        <strong className="text-foreground">{totalElementos}</strong>
        {totalElementos === 1 ? singular : plural}
        {carregando && <Loader2 className="ml-1 size-3.5 animate-spin" aria-label="Carregando" />}
      </span>

      {totalPaginas > 1 && (
        <nav className="flex items-center gap-1" aria-label="Paginação">
          <Button
            variant="outline"
            size="sm"
            disabled={pagina.primeira || carregando}
            onClick={() => onIrPara(atual - 1)}
          >
            <ChevronLeft aria-hidden />
            Anterior
          </Button>
          <span className="px-2 tabular-nums">
            Página {atual + 1} de {totalPaginas}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagina.ultima || carregando}
            onClick={() => onIrPara(atual + 1)}
          >
            Próxima
            <ChevronRight aria-hidden />
          </Button>
        </nav>
      )}
    </CardFooter>
  )
}
