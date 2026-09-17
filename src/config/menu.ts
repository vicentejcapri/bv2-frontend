import {
  ClipboardList,
  UserCog,
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
  /** Só aparece e só abre para o MASTER. */
  somenteMaster?: boolean
  /**
   * Restringe o item à conta de um e-mail, para manter uma tela fora do ar
   * enquanto ela não está pronta para as demais. Vale para a conta em que se
   * está operando, e não para quem está logado: o MASTER vê a tela ao escolher
   * essa conta no seletor e a perde ao trocar para outra. É só interface — a API
   * responde a quem chamar direto.
   */
  restritoAoEmail?: string
}

/** Enquanto as notificações não abrem para todas as contas, só esta as vê. */
export const EMAIL_NOTIFICACOES = "brunoh.montagna@gmail.com"

/** Quem pode ver o item de menu e abrir a rota dele. Fonte única das duas regras. */
export function podeVerItem(
  item: MenuItem,
  { isMaster, emailConta }: { isMaster: boolean; emailConta: string | null }
) {
  // O cadastro de usuários é do sistema, não de uma conta: vale o papel de quem loga.
  if (item.somenteMaster && !isMaster) return false
  if (item.restritoAoEmail && emailConta !== item.restritoAoEmail) return false
  return true
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
      },
      {
        path: "/notificacoes",
        label: "Notificações",
        description:
          "Envios automáticos via WhatsApp e mensagens personalizadas.",
        icon: MessageSquare,
        restritoAoEmail: EMAIL_NOTIFICACOES,
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
  {
    label: "Administração",
    items: [
      {
        path: "/usuarios",
        label: "Usuários",
        description: "Contas com acesso ao sistema, cada uma com sua própria base.",
        icon: UserCog,
        somenteMaster: true,
      },
    ],
  },
]

/** Lista achatada — usada para casar a rota atual com o item de menu. */
export const menuItems: MenuItem[] = menuGroups.flatMap((group) => group.items)

export function findMenuItem(pathname: string) {
  return menuItems.find((item) => pathname.startsWith(item.path))
}
