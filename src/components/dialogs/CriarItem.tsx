import type { ReactNode } from "react"
import { Plus } from "lucide-react"

import { SelectItem, SelectSeparator } from "@/components/ui/select"

/** Valor do item "Criar…" nos selects — nunca é um id real. */
export const CRIAR = "__criar__"

/**
 * Último item do select: abre o cadastro em vez de escolher um registro.
 *
 * O ícone e o texto ficam dentro de um mesmo span flex porque o ItemText do
 * Radix é um span comum — solto ali, o svg (display:block pelo preflight do
 * Tailwind) cairia para a linha de baixo.
 */
export function CriarItem({
  separador = true,
  children,
}: {
  /** Some quando não há nenhum registro acima para separar. */
  separador?: boolean
  children: ReactNode
}) {
  return (
    <>
      {separador && <SelectSeparator />}
      <SelectItem value={CRIAR}>
        <span className="flex items-center gap-2">
          <Plus className="size-3.5 shrink-0" aria-hidden />
          {children}
        </span>
      </SelectItem>
    </>
  )
}
