import type { ReactNode } from "react"

import { Ajuda } from "@/components/Ajuda"
import type { ConteudoAjuda } from "@/config/ajuda"
import { cn } from "@/lib/utils"

/**
 * Cabeçalho padrão de página: título, apoio e ações.
 * Garante que todas as telas tenham o mesmo ritmo vertical.
 */
export function PageHeader({
  title,
  description,
  actions,
  ajuda,
  className,
}: {
  title: string
  description?: string
  /** Conteúdo do botão de ajuda ao lado do título. */
  ajuda?: ConteudoAjuda
  actions?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {ajuda && <Ajuda conteudo={ajuda} />}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  )
}
