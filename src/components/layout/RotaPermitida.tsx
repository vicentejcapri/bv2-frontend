import { Navigate, Outlet, useLocation } from "react-router-dom"
import { findMenuItem, podeVerItem } from "@/config/menu"
import { useConta } from "@/hooks/useConta"

/**
 * Guarda das rotas restritas, usando a mesma regra que esconde o item no menu
 * (`podeVerItem`): quem não pode ver, ao digitar a URL, volta para o painel.
 * Também cobre a troca de conta com a tela aberta — o MASTER que sai da conta
 * dona de uma tela restrita cai no painel da conta nova.
 *
 * É só interface. As restrições de dados moram no backend, que atende cada
 * requisição dentro da conta do header X-Conta-Id.
 */
export function RotaPermitida() {
  const { pathname } = useLocation()
  const { isMaster, emailConta } = useConta()

  const item = findMenuItem(pathname)
  if (item && !podeVerItem(item, { isMaster, emailConta })) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
