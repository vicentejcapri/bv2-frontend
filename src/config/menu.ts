import {
  ClipboardList,
  LayoutDashboard,
  MessageSquare,
  Tags,
  Users,
  Wrench,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type MenuItem = {
  path: string
  label: string
  /** Texto de apoio exibido no cabeçalho da página. */
  description: string
  icon: LucideIcon
  /** Contador opcional exibido ao lado do item na barra lateral. */
  badge?: number
}

export type MenuGroup = {
  label: string
  items: MenuItem[]
}

export const menuGroups: MenuGroup[] = [
  {
    label: "Operação",
    items: [
      {
        path: "/dashboard",
        label: "Dashboard",
        description: "Indicadores de faturamento e da operação da oficina.",
        icon: LayoutDashboard,
      },
      {
        path: "/os",
        label: "Ordens de Serviço",
        description: "Gerencie e acompanhe os serviços em andamento.",
        icon: ClipboardList,
        badge: 12,
      },
      {
        path: "/notificacoes",
        label: "Notificações",
        description:
          "Envios automáticos via WhatsApp e mensagens personalizadas.",
        icon: MessageSquare,
        badge: 1,
      },
    ],
  },
  {
    label: "Cadastros",
    items: [
      {
        path: "/clientes",
        label: "Clientes",
        description: "Carteira de pessoas físicas e jurídicas.",
        icon: Users,
      },
      {
        path: "/equipamentos",
        label: "Equipamentos",
        description: "Máquinas e dispositivos cadastrados para manutenção.",
        icon: Wrench,
      },
      {
        path: "/servicos",
        label: "Serviços",
        description: "Tabela de preços padronizados para agilizar orçamentos.",
        icon: Tags,
      },
    ],
  },
]

/** Lista achatada — usada para casar a rota atual com o item de menu. */
export const menuItems: MenuItem[] = menuGroups.flatMap((group) => group.items)

export function findMenuItem(pathname: string) {
  return menuItems.find((item) => pathname.startsWith(item.path))
}
