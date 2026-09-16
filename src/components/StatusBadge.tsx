import type { ComponentProps } from "react"
import { Ban, CheckCircle2, Clock, PackageCheck, TriangleAlert } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { StatusNotificacao } from "@/lib/notificacao-api"
import type { StatusOs } from "@/lib/os-api"

type BadgeVariant = ComponentProps<typeof Badge>["variant"]
type Look = { label: string; variant: BadgeVariant; icon: typeof Clock }

/**
 * Fonte única de verdade para status. Antes cada página repetia strings de
 * classe (`bg-green-100 text-green-700 ...`) — agora rótulo, cor e ícone
 * moram aqui e todas as telas ficam consistentes.
 */
const OS_LOOK: Record<StatusOs, Look> = {
  EM_ANDAMENTO: { label: "Em andamento", variant: "info", icon: Clock },
  CONCLUIDA: { label: "Concluído", variant: "success", icon: CheckCircle2 },
  ENTREGUE: { label: "Entregue", variant: "neutral", icon: PackageCheck },
  CANCELADA: { label: "Cancelado", variant: "destructive", icon: Ban },
}

const NOTIF_LOOK: Record<StatusNotificacao, Look> = {
  ENVIADO: { label: "Enviado", variant: "success", icon: CheckCircle2 },
  FALHOU: { label: "Falhou", variant: "destructive", icon: TriangleAlert },
  PENDENTE: { label: "Pendente", variant: "warning", icon: Clock },
}

export function OSStatusBadge({
  status,
  className,
}: {
  status: StatusOs
  className?: string
}) {
  const { label, variant, icon: Icon } = OS_LOOK[status]
  return (
    <Badge variant={variant} className={className}>
      <Icon />
      {label}
    </Badge>
  )
}

export function NotificacaoStatusBadge({
  status,
  className,
}: {
  status: StatusNotificacao
  className?: string
}) {
  const { label, variant, icon: Icon } = NOTIF_LOOK[status]
  return (
    <Badge variant={variant} className={className}>
      <Icon />
      {label}
    </Badge>
  )
}

export { OS_LOOK, NOTIF_LOOK }
