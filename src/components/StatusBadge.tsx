import type { ComponentProps } from "react"
import { CheckCircle2, Clock, PackageCheck, Send, TriangleAlert } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Notificacao, OrdemServico } from "@/data/mocks"

type BadgeVariant = ComponentProps<typeof Badge>["variant"]
type Look = { label: string; variant: BadgeVariant; icon: typeof Clock }

/**
 * Fonte única de verdade para status. Antes cada página repetia strings de
 * classe (`bg-green-100 text-green-700 ...`) — agora rótulo, cor e ícone
 * moram aqui e todas as telas ficam consistentes.
 */
const OS_LOOK: Record<OrdemServico["status"], Look> = {
  EM_ANDAMENTO: { label: "Em andamento", variant: "info", icon: Clock },
  CONCLUIDO: { label: "Concluído", variant: "success", icon: CheckCircle2 },
  ENTREGUE: { label: "Entregue", variant: "neutral", icon: PackageCheck },
}

const NOTIF_LOOK: Record<Notificacao["status"], Look> = {
  ENVIADO: { label: "Enviado", variant: "success", icon: CheckCircle2 },
  FALHOU: { label: "Falhou", variant: "destructive", icon: TriangleAlert },
  PENDENTE: { label: "Pendente", variant: "warning", icon: Clock },
}

const TIPO_LABEL: Record<Notificacao["tipo"], string> = {
  PRAZO_INICIADO: "Prazo iniciado",
  PRAZO_ENCERRADO: "Prazo encerrado",
  PERSONALIZADO: "Personalizado",
}

export function OSStatusBadge({
  status,
  className,
}: {
  status: OrdemServico["status"]
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
  status: Notificacao["status"]
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

export function TipoNotificacaoBadge({
  tipo,
  className,
}: {
  tipo: Notificacao["tipo"]
  className?: string
}) {
  return (
    <Badge variant="outline" className={cn("font-normal", className)}>
      <Send />
      {TIPO_LABEL[tipo]}
    </Badge>
  )
}

export { OS_LOOK, NOTIF_LOOK, TIPO_LABEL }
