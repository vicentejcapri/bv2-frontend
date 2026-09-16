import { useState } from "react"
import { Check, ChevronDown, Loader2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { OS_LOOK } from "@/components/StatusBadge"
import { TRANSICOES } from "@/lib/os-api"
import type { StatusOs } from "@/lib/os-api"
import { cn } from "@/lib/utils"

const ORDEM: StatusOs[] = ["EM_ANDAMENTO", "CONCLUIDA", "ENTREGUE", "CANCELADA"]

/** Por que o destino está fora de alcance — vira o title do item desabilitado. */
function motivo(atual: StatusOs, destino: StatusOs) {
  if (atual === "ENTREGUE") return "Ordem de serviço entregue não pode mudar de status."
  if (atual === "CANCELADA") return "Ordem de serviço cancelada não pode ser reaberta."
  if (destino === "EM_ANDAMENTO") return "Não é possível voltar para em andamento."
  if (destino === "ENTREGUE") return "A ordem de serviço precisa ser concluída antes de ser entregue."
  return "Transição não permitida."
}

/**
 * Badge de status que abre o menu "Alterar status". Só ficam clicáveis os
 * destinos que o backend aceita (ver TRANSICOES); o resto aparece desabilitado
 * com o motivo, em vez de sumir — assim a regra fica visível na tela.
 */
export function StatusOSSelect({
  status,
  rotulo,
  salvando = false,
  onSelecionar,
}: {
  status: StatusOs
  /** Identifica a ordem para o leitor de tela. */
  rotulo: string
  salvando?: boolean
  onSelecionar: (destino: Exclude<StatusOs, "EM_ANDAMENTO">) => void
}) {
  const [open, setOpen] = useState(false)
  const { label, variant, icon: Icon } = OS_LOOK[status]
  const permitidos = TRANSICOES[status]
  const travada = permitidos.length === 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={salvando || travada}
          aria-label={`Alterar status de ${rotulo} (atual: ${label})`}
          className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-default"
        >
          <Badge variant={variant} className="gap-1.5">
            {salvando ? <Loader2 className="animate-spin" aria-hidden /> : <Icon />}
            {label}
            {!travada && <ChevronDown className="-mr-0.5 size-3.5 opacity-70" aria-hidden />}
          </Badge>
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-52 gap-0.5 p-1">
        <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Alterar status
        </p>
        {ORDEM.map((destino) => {
          const look = OS_LOOK[destino]
          const atual = destino === status
          const liberado = atual || permitidos.includes(destino)
          const DestinoIcon = look.icon
          return (
            <button
              key={destino}
              type="button"
              disabled={!liberado}
              title={liberado ? undefined : motivo(status, destino)}
              onClick={() => {
                setOpen(false)
                if (!atual) onSelecionar(destino as Exclude<StatusOs, "EM_ANDAMENTO">)
              }}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                liberado
                  ? "hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                  : "cursor-not-allowed opacity-45",
                atual && "bg-muted/60 font-medium"
              )}
            >
              <DestinoIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              {look.label}
              {atual && <Check className="ml-auto size-3.5 shrink-0" aria-hidden />}
            </button>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}
