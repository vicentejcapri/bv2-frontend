import type { ReactNode } from "react"
import { ListFilter, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/**
 * Barra de busca/filtro usada no topo das listagens.
 * Visual apenas por enquanto — o estado real entra quando houver API.
 */
export function DataToolbar({
  placeholder,
  children,
  className,
}: {
  placeholder: string
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
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder={placeholder} className="pl-9" />
      </div>
      <div className="flex items-center gap-2 sm:ml-auto">
        {children}
        <Button variant="outline" size="sm">
          <ListFilter />
          Filtros
        </Button>
      </div>
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
