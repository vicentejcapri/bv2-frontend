import type { ReactNode } from "react"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

/**
 * Rótulo + controle + mensagem de erro, com o mesmo espaçamento em todos os
 * formulários. O `id` amarra o label ao controle e o erro ao aria-describedby.
 */
export function Field({
  id,
  label,
  hint,
  error,
  required,
  optional,
  className,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  required?: boolean
  /** Deixa explícito que o campo pode ficar em branco. */
  optional?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>
        {label}
        {required && (
          <span aria-hidden className="-ml-1 text-destructive">
            *
          </span>
        )}
        {optional && !required && (
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            (opcional)
          </span>
        )}
      </Label>

      {children}

      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
