import { Navigate, Route, Routes } from "react-router-dom"
import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute } from "@/components/layout/ProtectedRoute"
import { LoginPage } from "@/pages/LoginPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { OrdensServicoPage } from "@/pages/OrdensServicoPage"
import { ClientesPage } from "@/pages/ClientesPage"
import { EquipamentosPage } from "@/pages/EquipamentosPage"
import { ServicosPage } from "@/pages/ServicosPage"
import { NotificacoesPage } from "@/pages/NotificacoesPage"

export default function App() {
  return (
    <Routes>
      {/* Rota pública */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rotas privadas: só entram quem está logado */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/os" element={<OrdensServicoPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/equipamentos" element={<EquipamentosPage />} />
          <Route path="/servicos" element={<ServicosPage />} />
          <Route path="/notificacoes" element={<NotificacoesPage />} />
        </Route>
      </Route>

      {/* Qualquer outra rota volta para o painel */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
