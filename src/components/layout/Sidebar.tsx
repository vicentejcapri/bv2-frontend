import type { ReactNode } from "react"
import { Link, useLocation } from "react-router-dom"
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react"

import { menuGroups, podeVerItem, type MenuItem } from "@/config/menu"
import { useConta } from "@/hooks/useConta"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ProfileDialog } from "./ProfileDialog"
import bv2Logo from "@/assets/bv2_logo_sem_fundo.png"

type SidebarProps = {
  isOpen: boolean
  onToggle: () => void
  onNavigate?: () => void
  onLogout: () => void
  /** No drawer mobile a barra fica sempre expandida. */
  forceExpanded?: boolean
}

export function Sidebar({
  isOpen,
  onToggle,
  onNavigate,
  onLogout,
  forceExpanded = false,
}: SidebarProps) {
  const { pathname } = useLocation()
  const { isMaster, emailConta } = useConta()
  const expanded = forceExpanded || isOpen

  const grupos = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => podeVerItem(item, { isMaster, emailConta })),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Marca */}
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center border-b border-sidebar-border",
          expanded ? "px-4 py-4" : "h-16 px-2"
        )}
      >
        <img
          src={bv2Logo}
          alt="BV2 Software"
          className={cn("shrink-0 object-contain", expanded ? "size-24" : "size-12")}
        />
        {!forceExpanded && expanded && (
          <button
            type="button"
            onClick={onToggle}
            title="Recolher menu"
            className="absolute right-2 top-2 rounded-md p-1.5 text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent/40"
          >
            <PanelLeftClose className="size-4" />
            <span className="sr-only">Recolher menu</span>
          </button>
        )}
      </div>

      {/* Botão de expandir quando recolhida */}
      {!forceExpanded && !expanded && (
        <div className="flex justify-center px-2 pt-3">
          <button
            type="button"
            onClick={onToggle}
            title="Expandir menu"
            className="rounded-md p-2 text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent/40"
          >
            <PanelLeftOpen className="size-4" />
            <span className="sr-only">Expandir menu</span>
          </button>
        </div>
      )}

      {/* Navegação */}
      <nav
        className={cn(
          "custom-scrollbar flex-1 space-y-6 overflow-y-auto py-4",
          expanded ? "px-3" : "px-2"
        )}
      >
        {grupos.map((group) => (
          <div key={group.label} className="space-y-1">
            {expanded ? (
              <p className="px-3 pb-1 text-[0.6875rem] font-semibold uppercase tracking-wider text-sidebar-muted">
                {group.label}
              </p>
            ) : (
              <div className="mx-auto mb-2 h-px w-6 bg-sidebar-border" />
            )}
            {group.items.map((item) => (
              <NavLinkItem
                key={item.path}
                item={item}
                expanded={expanded}
                isActive={pathname.startsWith(item.path)}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Rodapé: perfil e sair */}
      <div
        className={cn(
          "shrink-0 space-y-1 border-t border-sidebar-border py-3",
          expanded ? "px-3" : "px-2"
        )}
      >
        <ProfileDialog expanded={expanded} />

        <SidebarAction
          expanded={expanded}
          label="Sair do sistema"
          onClick={onLogout}
          className="text-destructive-soft-foreground hover:bg-destructive/15 hover:text-red-300"
        >
          <LogOut className="size-[18px] shrink-0" />
        </SidebarAction>
      </div>
    </div>
  )
}

function NavLinkItem({
  item,
  expanded,
  isActive,
  onNavigate,
}: {
  item: MenuItem
  expanded: boolean
  isActive: boolean
  onNavigate?: () => void
}) {
  const link = (
    <Link
      to={item.path}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative flex h-10 items-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent/40",
        expanded ? "gap-3 px-3" : "justify-center px-0",
        isActive
          ? "bg-sidebar-accent text-white"
          : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white"
      )}
    >
      {/* Indicador lateral do item ativo */}
      <span
        className={cn(
          "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-accent transition-opacity",
          isActive ? "opacity-100" : "opacity-0"
        )}
      />
      <item.icon
        className={cn(
          "size-[18px] shrink-0 transition-colors",
          isActive ? "text-accent" : "text-sidebar-muted group-hover:text-white"
        )}
      />
      {expanded && <span className="flex-1 truncate">{item.label}</span>}
    </Link>
  )

  if (expanded) return link

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  )
}

/** Botão da barra lateral que também vira tooltip quando recolhida. */
export function SidebarAction({
  expanded,
  label,
  onClick,
  className,
  children,
}: {
  expanded: boolean
  label: string
  onClick?: () => void
  className?: string
  children: ReactNode
}) {
  const button = (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-10 w-full items-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent/40",
        expanded ? "gap-3 px-3" : "justify-center px-0",
        className ?? "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
      )}
    >
      {children}
      {expanded && <span className="truncate">{label}</span>}
    </button>
  )

  if (expanded) return button

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}
