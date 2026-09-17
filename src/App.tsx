import { Navigate, Route, Routes } from "react-router-dom"
import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute } from "@/components/layout/ProtectedRoute"
import { SomenteMaster } from "@/components/layout/SomenteMaster"
import { LoginPage } from "@/pages/LoginPage"
import { EsqueciSenhaPage } from "@/pages/EsqueciSenhaPage"
import { RedefinirSenhaPage } from "@/pages/RedefinirSenhaPage"
import { ConfirmarEmailPage } from "@/pages/ConfirmarEmailPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { OrdensServicoPage } from "@/pages/OrdensServicoPage"
import { ClientesPage } from "@/pages/ClientesPage"
import { EquipamentosPage } from "@/pages/EquipamentosPage"
import { ServicosPage } from "@/pages/ServicosPage"
import { NotificacoesPage } from "@/pages/NotificacoesPage"
import { UsuariosPage } from "@/pages/UsuariosPage"

export default function App() {
  return (
    <Routes>
      {/* Rota pública */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/esqueci-senha" element={<EsqueciSenhaPage />} />
      {/* Caminho fixo: é para cá que aponta o link do e-mail enviado pelo backend */}
      <Route path="/redefinir-senha" element={<RedefinirSenhaPage />} />
      <Route path="/confirmar-email" element={<ConfirmarEmailPage />} />

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
          <Route element={<SomenteMaster />}>
            <Route path="/usuarios" element={<UsuariosPage />} />
          </Route>
        </Route>
      </Route>

      {/* Qualquer outra rota volta para o painel */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
