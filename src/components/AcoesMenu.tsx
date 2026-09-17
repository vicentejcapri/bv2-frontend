import { useState } from "react"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

/**
 * Os "3 pontinhos" de uma linha de listagem, com Editar e Excluir. Some até o
 * hover da linha (`group`) em telas largas; no celular fica sempre visível.
 */
export function AcoesMenu({
  rotulo,
  onEditar,
  onExcluir,
}: {
  /** Nome do registro, para o leitor de tela: "Ações de {rotulo}". */
  rotulo: string
  onEditar: () => void
  /** Sem ele, o menu só oferece Editar. */
  onExcluir?: () => void
}) {
  const [open, setOpen] = useState(false)

  const escolher = (acao: () => void) => () => {
    setOpen(false)
    acao()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          className="transition-opacity focus-visible:opacity-100 data-[state=open]:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <MoreHorizontal />
          <span className="sr-only">Ações de {rotulo}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-40 gap-0.5 p-1">
        <button
          type="button"
          onClick={escolher(onEditar)}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
        >
          <Pencil className="size-3.5 text-muted-foreground" aria-hidden />
          Editar
        </button>
        {onExcluir && (
          <button
            type="button"
            onClick={escolher(onExcluir)}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-destructive transition-colors hover:bg-destructive-soft focus-visible:bg-destructive-soft focus-visible:outline-none"
          >
            <Trash2 className="size-3.5" aria-hidden />
            Excluir
          </button>
        )}
      </PopoverContent>
    </Popover>
  )
}
