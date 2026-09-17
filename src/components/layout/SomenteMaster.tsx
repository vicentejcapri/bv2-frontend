import { Navigate, Outlet } from "react-router-dom"
import { useConta } from "@/hooks/useConta"

/**
 * Rotas exclusivas do MASTER. O ADMIN que digitar a URL volta para o painel —
 * o backend recusaria as chamadas com 403 de qualquer forma.
 */
export function SomenteMaster() {
  const { isMaster } = useConta()

  if (!isMaster) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
