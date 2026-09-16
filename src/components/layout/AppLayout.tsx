import { useEffect, useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { Menu, Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TooltipProvider } from "@/components/ui/tooltip"
import { findMenuItem } from "@/config/menu"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"
import { Sidebar } from "./Sidebar"

const SIDEBAR_KEY = "bv2:sidebar-open"

export function AppLayout() {
  // Estado desktop (recolhida/expandida) persiste entre sessões.
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => localStorage.getItem(SIDEBAR_KEY) !== "false"
  )
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  const currentPage = findMenuItem(pathname)

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(isSidebarOpen))
  }, [isSidebarOpen])

  // O drawer fecha ao navegar (via onNavigate da Sidebar) e ao pressionar Esc.
  useEffect(() => {
    if (!isMobileNavOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileNavOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isMobileNavOpen])

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        {/* Barra lateral — desktop */}
        <aside
          className={cn(
            "z-20 hidden shrink-0 border-r border-sidebar-border transition-[width] duration-300 ease-out md:block",
            isSidebarOpen ? "w-64" : "w-[4.5rem]"
          )}
        >
          <Sidebar
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen((open) => !open)}
            onLogout={handleLogout}
          />
        </aside>

        {/* Barra lateral — drawer mobile */}
        <div
          className={cn(
            "fixed inset-0 z-40 md:hidden",
            isMobileNavOpen ? "pointer-events-auto" : "pointer-events-none"
          )}
        >
          <div
            onClick={() => setIsMobileNavOpen(false)}
            className={cn(
              "absolute inset-0 bg-foreground/50 backdrop-blur-[2px] transition-opacity duration-300",
              isMobileNavOpen ? "opacity-100" : "opacity-0"
            )}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            className={cn(
              "absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-overlay transition-transform duration-300 ease-out",
              isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(false)}
              className="absolute right-3 top-4 z-10 rounded-md p-1.5 text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-white"
            >
              <X className="size-4" />
              <span className="sr-only">Fechar menu</span>
            </button>
            <Sidebar
              forceExpanded
              isOpen
              onToggle={() => setIsMobileNavOpen(false)}
              onNavigate={() => setIsMobileNavOpen(false)}
              onLogout={handleLogout}
            />
          </div>
        </div>

        {/* Área principal */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-md sm:px-6">
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              onClick={() => setIsMobileNavOpen(true)}
            >
              <Menu />
              <span className="sr-only">Abrir menu</span>
            </Button>

            <div className="min-w-0 flex-1">
              <h2 className="truncate font-heading text-[0.9375rem] font-semibold tracking-tight text-foreground">
                {currentPage?.label ?? "Dashboard"}
              </h2>
              <p className="hidden truncate text-xs text-muted-foreground sm:block">
                {currentPage?.description}
              </p>
            </div>

            <div className="relative hidden lg:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar ordem de serviço, cliente ou equipamento…"
                className="w-96 bg-background pl-9"
              />
            </div>
          </header>

          {/* Conteúdo — key na rota reinicia a animação de entrada */}
          <main className="custom-scrollbar flex-1 overflow-y-auto">
            <div
              key={pathname}
              className="mx-auto w-full max-w-7xl animate-fade-up space-y-6 px-4 py-6 sm:px-6 lg:py-8"
            >
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
