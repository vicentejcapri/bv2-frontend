import { useEffect, useRef, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Loader2 } from "lucide-react"

import { AuthAlert, AuthShell } from "@/components/layout/AuthShell"
import { useAuth } from "@/hooks/useAuth"
import { ApiError } from "@/lib/api"
import { confirmarTrocaEmail } from "@/lib/usuario-api"

type Estado =
  | { fase: "confirmando" }
  | { fase: "ok" }
  | { fase: "erro"; mensagem: string }

const linkClasse = "text-sm font-medium text-foreground underline underline-offset-4"

/** Destino do link enviado pelo backend em PUT /usuarios/eu/email. */
export function ConfirmarEmailPage() {
  const [params] = useSearchParams()
  const token = params.get("token")
  const { logout } = useAuth()
  const [estado, setEstado] = useState<Estado>(
    token
      ? { fase: "confirmando" }
      : { fase: "erro", mensagem: "Este link de confirmação está incompleto." }
  )
  // O token vale uma única vez: o StrictMode roda o efeito duas vezes em dev,
  // e a segunda chamada devolveria 422.
  const enviado = useRef(false)

  useEffect(() => {
    if (!token || enviado.current) return
    enviado.current = true
    confirmarTrocaEmail(token)
      .then(() => {
        // A troca derruba as sessões anteriores; a local também precisa sair.
        logout()
        setEstado({ fase: "ok" })
      })
      .catch((error) =>
        setEstado({
          fase: "erro",
          mensagem:
            error instanceof ApiError ? error.message : "Algo deu errado. Tente novamente.",
        })
      )
  }, [token, logout])

  if (estado.fase === "confirmando") {
    return (
      <AuthShell titulo="Confirmando e-mail">
        <p
          role="status"
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
        >
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Só um instante…
        </p>
      </AuthShell>
    )
  }

  if (estado.fase === "ok") {
    return (
      <AuthShell titulo="E-mail confirmado">
        <div className="space-y-4">
          <AuthAlert tom="sucesso">
            Seu e-mail foi alterado. Entre de novo usando o endereço novo.
          </AuthAlert>
          <div className="text-center">
            <Link to="/login" replace className={linkClasse}>
              Ir para o login
            </Link>
          </div>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell titulo="Não foi possível confirmar">
      <div className="space-y-4">
        <AuthAlert tom="erro">{estado.mensagem}</AuthAlert>
        <div className="text-center">
          <Link to="/login" replace className={linkClasse}>
            Voltar ao login
          </Link>
        </div>
      </div>
    </AuthShell>
  )
}
