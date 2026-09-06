import { CheckCircle2, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export type FeedbackTom = "sucesso" | "falha"

/** Ícone e cor de cada desfecho — mesmos tokens dos badges de status. */
const TOM_LOOK = {
  sucesso: {
    icon: CheckCircle2,
    chip: "bg-success-soft text-success-soft-foreground",
  },
  falha: {
    icon: TriangleAlert,
    chip: "bg-destructive-soft text-destructive-soft-foreground",
  },
} as const

/**
 * Aviso central de desfecho ("deu certo" / "deu errado"), no formato de um
 * alerta modal. Quem dispara é o `useFeedback()`.
 */
export function FeedbackDialog({
  tom,
  titulo,
  descricao,
  open,
  onOpenChange,
  botao = "Entendi",
}: {
  tom: FeedbackTom
  titulo: string
  descricao?: string
  open: boolean
  onOpenChange: (aberto: boolean) => void
  botao?: string
}) {
  const { icon: Icon, chip } = TOM_LOOK[tom]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-sm"
        showCloseButton={false}
        // Sem descrição não há o que apontar — evita o aviso do Radix.
        {...(descricao ? {} : { "aria-describedby": undefined })}
      >
        <DialogHeader className="items-center gap-3 pb-5 text-center">
          <span
            className={cn(
              "flex size-12 items-center justify-center rounded-full",
              chip
            )}
          >
            <Icon className="size-6" />
          </span>
          <DialogTitle>{titulo}</DialogTitle>
          {descricao && <DialogDescription>{descricao}</DialogDescription>}
        </DialogHeader>

        <DialogFooter className="sm:justify-center">
          <DialogClose asChild>
            <Button className="min-w-32" autoFocus>
              {botao}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
