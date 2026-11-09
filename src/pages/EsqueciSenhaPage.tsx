import { useState } from "react"
import type { FormEvent } from "react"
import { Link, useLocation } from "react-router-dom"
import { ArrowLeft, Loader2 } from "lucide-react"

import { AuthAlert, AuthShell } from "@/components/layout/AuthShell"
import { Field } from "@/components/dialogs/Field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api"
import { solicitarRecuperacao, validarEmail } from "@/lib/auth-api"
import { fieldProps } from "@/lib/form"
import { AJUDA } from "@/config/ajuda"

export function EsqueciSenhaPage() {
  const location = useLocation()
  const [email, setEmail] = useState(
    (location.state as { email?: string } | null)?.email ?? ""
  )
  const [erroCampo, setErroCampo] = useState<string>()
  const [erroGeral, setErroGeral] = useState<string>()
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (enviando) return

    const erro = validarEmail(email)
    setErroCampo(erro)
    setErroGeral(undefined)
    if (erro) return

    setEnviando(true)
    try {
      await solicitarRecuperacao(email.trim())
      setEnviado(true)
    } catch (error) {
      if (error instanceof ApiError && error.status === 400 && error.erros?.email) {
        setErroCampo(error.erros.email)
      } else {
        setErroGeral(
          error instanceof ApiError ? error.message : "Algo deu errado. Tente novamente."
        )
      }
    } finally {
      setEnviando(false)
    }
  }

  const voltar = (
    <div className="text-center">
      <Link
        to="/login"
        state={{ email }}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-accent-strong hover:underline"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Voltar ao login
      </Link>
    </div>
  )

  if (enviado) {
    // Mesma mensagem exista a conta ou não: a tela não pode revelar quem tem cadastro.
    return (
      <AuthShell titulo="Verifique seu e-mail">
        <div className="space-y-4">
          <AuthAlert tom="sucesso">
            Se <strong className="font-medium">{email.trim()}</strong> estiver
            cadastrado, você receberá um link para redefinir a senha em instantes.
          </AuthAlert>
          <p className="text-sm text-muted-foreground">
            Não chegou? Confira a caixa de spam ou tente de novo em alguns minutos.
          </p>
          {voltar}
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      titulo="Esqueci minha senha"
      ajuda={AJUDA.esqueciSenha}
      descricao="Informe seu e-mail e enviaremos um link para criar uma nova senha."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field id="email" label="E-mail" error={erroCampo}>
          <Input
            {...fieldProps("email", erroCampo)}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            placeholder="voce@empresa.com"
            className="h-11"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>

        {erroGeral && <AuthAlert tom="erro">{erroGeral}</AuthAlert>}

        <Button
          type="submit"
          size="lg"
          className="h-11 w-full"
          disabled={enviando}
          aria-busy={enviando}
        >
          {enviando && <Loader2 className="animate-spin" aria-hidden />}
          {enviando ? "Enviando…" : "Enviar link"}
        </Button>

        {voltar}
      </form>
    </AuthShell>
  )
}
