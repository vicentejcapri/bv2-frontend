import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/useAuth"
import m2Logo from "@/assets/m2_logo.jpeg"

const DESTAQUES = [
  "Ordens de serviço com prazo e status em tempo real",
  "Avisos automáticos ao cliente pelo WhatsApp",
  "Tabela de preços base para orçar em segundos",
]

export function LoginPage() {
  const { isLoggedIn, login } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (isLoggedIn) navigate("/dashboard", { replace: true })
  }, [isLoggedIn, navigate])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    login()
    navigate("/dashboard", { replace: true })
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Coluna da marca — some no mobile para o formulário respirar */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-12 lg:flex">
        <div className="brand-grid absolute inset-0 opacity-40" />
        <div
          aria-hidden
          className="absolute -left-24 -top-24 size-72 rounded-full bg-accent/20 blur-3xl"
        />

        <div className="relative flex items-center gap-3">
          <img
            src={m2Logo}
            alt=""
            className="size-11 rounded-xl object-cover ring-1 ring-sidebar-border"
          />
          <div>
            <p className="font-heading text-base font-semibold text-white">
              M2 Equipamentos
            </p>
            <p className="text-xs text-sidebar-muted">
              Manutenção industrial e mecânica
            </p>
          </div>
        </div>

        <div className="relative max-w-md space-y-6">
          <h2 className="font-heading text-3xl font-semibold leading-tight tracking-tight text-white">
            Sua oficina inteira em{" "}
            <span className="text-accent">uma única tela.</span>
          </h2>
          <ul className="space-y-3">
            {DESTAQUES.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm text-sidebar-foreground"
              >
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-sidebar-muted">
          © {new Date().getFullYear()} M2 Equipamentos · Gestão de Ordens de
          Serviço
        </p>
      </div>

      {/* Coluna do formulário */}
      <div className="flex items-center justify-center bg-background px-5 py-12">
        <div className="w-full max-w-sm animate-fade-up">
          {/* Marca compacta, só no mobile */}
          <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
            <img
              src={m2Logo}
              alt="M2 Equipamentos"
              className="size-20 rounded-2xl object-cover shadow-card ring-1 ring-border"
            />
            <p className="font-heading text-lg font-semibold">M2 Equipamentos</p>
          </div>

          <div className="mb-8 space-y-1.5">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Bem-vindo de volta
            </h1>
            <p className="text-sm text-muted-foreground">
              Entre com suas credenciais para acessar o painel.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="usuario">Usuário</Label>
              <Input
                id="usuario"
                type="text"
                autoComplete="username"
                placeholder="Digite seu usuário"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="senha">Senha</Label>
                <a
                  href="#"
                  className="text-xs font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
                >
                  Esqueceu a senha?
                </a>
              </div>
              <div className="relative">
                <Input
                  id="senha"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                  <span className="sr-only">
                    {showPassword ? "Ocultar senha" : "Mostrar senha"}
                  </span>
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full">
              Entrar
              <ArrowRight />
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground lg:hidden">
            © {new Date().getFullYear()} M2 Equipamentos
          </p>
        </div>
      </div>
    </div>
  )
}
