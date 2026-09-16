import type { ReactNode } from "react"
import { Search, X } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/**
 * Barra de busca das listagens. O filtro é feito na própria página, sobre a
 * lista já carregada — nenhuma das listagens é paginada na tela, então não vale
 * uma ida ao servidor a cada tecla.
 */
export function DataToolbar({
  placeholder,
  busca,
  onBuscaChange,
  children,
  className,
}: {
  placeholder: string
  busca: string
  onBuscaChange: (valor: string) => void
  /** Filtros extras da página (situação, status…). */
  children?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-b border-border bg-muted/30 px-5 py-3 sm:flex-row sm:items-center",
        className
      )}
    >
      <div className="relative flex-1 sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={placeholder}
          aria-label={placeholder}
          value={busca}
          onChange={(event) => onBuscaChange(event.target.value)}
          className="pl-9 pr-9"
        />
        {busca && (
          <button
            type="button"
            onClick={() => onBuscaChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-3.5" aria-hidden />
            <span className="sr-only">Limpar busca</span>
          </button>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 sm:ml-auto">{children}</div>
      )}
    </div>
  )
}

/** Estado vazio consistente para quando uma listagem não tem registros. */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-5 py-14 text-center">
      <p className="font-medium text-foreground">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
