import type { ReactNode } from "react"
import { Link, useLocation } from "react-router-dom"
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react"

import { menuGroups, type MenuItem } from "@/config/menu"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ProfileDialog } from "./ProfileDialog"
import m2Logo from "@/assets/m2_logo.jpeg"

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
  const expanded = forceExpanded || isOpen

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Marca */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border",
          expanded ? "px-4" : "justify-center px-2"
        )}
      >
        <img
          src={m2Logo}
          alt=""
          className="size-9 shrink-0 rounded-lg object-cover ring-1 ring-sidebar-border"
        />
        {expanded && (
          <div className="min-w-0 flex-1">
            <p className="truncate font-heading text-sm font-semibold text-white">
              M2 Equipamentos
            </p>
            <p className="truncate text-xs text-sidebar-muted">
              Gestão de Ordens de Serviço
            </p>
          </div>
        )}
        {!forceExpanded && expanded && (
          <button
            type="button"
            onClick={onToggle}
            title="Recolher menu"
            className="rounded-md p-1.5 text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent/40"
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
        {menuGroups.map((group) => (
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
          ? "bg-sidebar-accent text-accent"
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
      {expanded && item.badge ? (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[0.6875rem] font-semibold tabular-nums",
            isActive
              ? "bg-accent text-accent-foreground"
              : "bg-sidebar-accent text-sidebar-muted"
          )}
        >
          {item.badge}
        </span>
      ) : null}
      {!expanded && item.badge ? (
        <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-accent" />
      ) : null}
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
