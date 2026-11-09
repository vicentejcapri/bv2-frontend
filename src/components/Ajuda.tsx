import type { ReactNode } from "react"
import { Info } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { ConteudoAjuda } from "@/config/ajuda"
import { cn } from "@/lib/utils"

/**
 * O "izinho": botão redondo que abre, por clique, a explicação do que fazer na
 * tela. Popover em vez de tooltip para funcionar no toque e caber uma lista.
 * Os textos moram em config/ajuda.ts.
 */
export function Ajuda({
  conteudo,
  className,
}: {
  conteudo: ConteudoAjuda
  className?: string
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
            className
          )}
        >
          <Info className="size-4" aria-hidden />
          <span className="sr-only">Ajuda: {conteudo.titulo}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        collisionPadding={12}
        className="custom-scrollbar max-h-[min(28rem,var(--radix-popover-content-available-height))] w-80 overflow-y-auto"
      >
        <p className="font-heading text-sm font-semibold text-foreground">
          {conteudo.titulo}
        </p>
        <p className="text-sm text-muted-foreground">{conteudo.texto}</p>
        {conteudo.itens && conteudo.itens.length > 0 && (
          <ul className="list-disc space-y-1.5 pl-4 text-sm text-muted-foreground marker:text-accent">
            {conteudo.itens.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}

/** Título (de diálogo, de card) com o izinho ao lado, fora do elemento do título. */
export function ComAjuda({
  conteudo,
  className,
  children,
}: {
  conteudo: ConteudoAjuda
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {children}
      <Ajuda conteudo={conteudo} />
    </div>
  )
}
