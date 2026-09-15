import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import type { Location } from "react-router-dom"
import { Loader2 } from "lucide-react"

import { AuthAlert, AuthShell } from "@/components/layout/AuthShell"
import { Field } from "@/components/dialogs/Field"
import { PasswordInput } from "@/components/PasswordInput"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/useAuth"
import { ApiError } from "@/lib/api"
import { validarEmail } from "@/lib/auth-api"
import { fieldProps } from "@/lib/form"

type Erros = { email?: string; senha?: string; geral?: string }

type EstadoLogin = { from?: Location; aviso?: string; email?: string } | null

export function LoginPage() {
  const { isLoggedIn, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const estado = location.state as EstadoLogin

  const [email, setEmail] = useState(estado?.email ?? "")
  const [senha, setSenha] = useState("")
  const [erros, setErros] = useState<Erros>({})
  const [enviando, setEnviando] = useState(false)

  // Único ponto de redirecionamento: cobre quem já chega logado e o login bem-sucedido.
  useEffect(() => {
    if (isLoggedIn) {
      navigate(estado?.from?.pathname ?? "/dashboard", { replace: true })
    }
  }, [isLoggedIn, navigate, estado])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (enviando) return

    const locais: Erros = {
      email: validarEmail(email),
      senha: senha ? undefined : "Informe sua senha.",
    }
    setErros(locais)
    if (locais.email || locais.senha) return

    setEnviando(true)
    try {
      await login(email.trim(), senha)
    } catch (error) {
      if (error instanceof ApiError && error.status === 400 && error.erros) {
        setErros({ email: error.erros.email, senha: error.erros.senha })
      } else if (error instanceof ApiError && error.status === 401) {
        setErros({ geral: "E-mail ou senha incorretos." })
      } else {
        setErros({
          geral:
            error instanceof ApiError
              ? error.message
              : "Algo deu errado. Tente novamente.",
        })
      }
      setEnviando(false)
    }
  }

  return (
    <AuthShell titulo="Entrar no M2" descricao="Acesse o painel de ordens de serviço.">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {estado?.aviso && !erros.geral && (
          <AuthAlert tom="sucesso">{estado.aviso}</AuthAlert>
        )}

        <Field id="email" label="E-mail" error={erros.email}>
          <Input
            {...fieldProps("email", erros.email)}
            type="email"
            inputMode="email"
            autoComplete="username"
            autoFocus
            placeholder="voce@empresa.com"
            className="h-11"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>

        <Field id="senha" label="Senha" error={erros.senha}>
          <PasswordInput
            {...fieldProps("senha", erros.senha)}
            autoComplete="current-password"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
          />
        </Field>

        {erros.geral && <AuthAlert tom="erro">{erros.geral}</AuthAlert>}

        <Button
          type="submit"
          size="lg"
          className="h-11 w-full"
          disabled={enviando}
          aria-busy={enviando}
        >
          {enviando && <Loader2 className="animate-spin" aria-hidden />}
          {enviando ? "Entrando…" : "Entrar"}
        </Button>

        <div className="text-center">
          <Link
            to="/esqueci-senha"
            state={{ email }}
            className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Esqueci minha senha
          </Link>
        </div>
      </form>
    </AuthShell>
  )
}
