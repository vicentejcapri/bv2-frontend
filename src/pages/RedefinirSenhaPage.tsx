import { useState } from "react"
import type { FormEvent } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Loader2 } from "lucide-react"

import { AuthAlert, AuthShell } from "@/components/layout/AuthShell"
import { Field } from "@/components/dialogs/Field"
import { PasswordInput } from "@/components/PasswordInput"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api"
import { redefinirSenha } from "@/lib/auth-api"
import { avisarCredenciaisAlteradas } from "@/lib/credenciais-canal"
import { fieldProps } from "@/lib/form"

type Erros = { senhaNova?: string; senhaNovaConfirmacao?: string; geral?: string }

const linkClasse =
  "text-sm font-medium text-accent-strong underline underline-offset-4"

export function RedefinirSenhaPage() {
  const [params] = useSearchParams()
  const token = params.get("token")
  const navigate = useNavigate()

  const [senhaNova, setSenhaNova] = useState("")
  const [confirmacao, setConfirmacao] = useState("")
  const [erros, setErros] = useState<Erros>({})
  const [enviando, setEnviando] = useState(false)

  if (!token) {
    return (
      <AuthShell titulo="Link inválido">
        <div className="space-y-4">
          <AuthAlert tom="erro">
            Este link de redefinição está incompleto. Abra novamente o link do
            e-mail ou solicite um novo.
          </AuthAlert>
          <div className="text-center">
            <Link to="/esqueci-senha" className={linkClasse}>
              Solicitar novo link
            </Link>
          </div>
        </div>
      </AuthShell>
    )
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (enviando) return

    // Mesmas regras do RedefinicaoSenhaRequest (8–72, confirmação igual).
    const locais: Erros = {
      senhaNova:
        senhaNova.length < 8 || senhaNova.length > 72
          ? "A senha deve ter entre 8 e 72 caracteres."
          : undefined,
      senhaNovaConfirmacao:
        confirmacao !== senhaNova ? "As senhas não conferem." : undefined,
    }
    setErros(locais)
    if (locais.senhaNova || locais.senhaNovaConfirmacao) return

    setEnviando(true)
    try {
      await redefinirSenha(token, senhaNova, confirmacao)
      // O link costuma abrir numa aba nova; a aba que estava logada nesta conta sai também.
      avisarCredenciaisAlteradas()
      navigate("/login", {
        replace: true,
        state: { aviso: "Senha redefinida. Entre com a nova senha." },
      })
    } catch (error) {
      // 400 = Bean Validation; 422 com erros = regra presa a um campo (nova senha
      // igual à atual). O 422 de link inválido não traz erros e cai no alerta geral.
      if (error instanceof ApiError && (error.status === 400 || error.status === 422) && error.erros) {
        setErros({
          senhaNova: error.erros.senhaNova,
          senhaNovaConfirmacao: error.erros.senhaNovaConfirmacao,
          geral: error.erros.token,
        })
      } else {
        setErros({
          geral:
            error instanceof ApiError ? error.message : "Algo deu errado. Tente novamente.",
        })
      }
      setEnviando(false)
    }
  }

  return (
    <AuthShell titulo="Criar nova senha" descricao="Escolha uma senha que você não usa em outro lugar.">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field
          id="senhaNova"
          label="Nova senha"
          hint="Mínimo de 8 caracteres."
          error={erros.senhaNova}
        >
          <PasswordInput
            {...fieldProps("senhaNova", erros.senhaNova)}
            aria-describedby={erros.senhaNova ? "senhaNova-error" : "senhaNova-hint"}
            autoComplete="new-password"
            autoFocus
            value={senhaNova}
            onChange={(event) => setSenhaNova(event.target.value)}
          />
        </Field>

        <Field
          id="senhaNovaConfirmacao"
          label="Confirme a nova senha"
          error={erros.senhaNovaConfirmacao}
        >
          <PasswordInput
            {...fieldProps("senhaNovaConfirmacao", erros.senhaNovaConfirmacao)}
            autoComplete="new-password"
            value={confirmacao}
            onChange={(event) => setConfirmacao(event.target.value)}
          />
        </Field>

        {erros.geral && (
          <AuthAlert tom="erro">
            {erros.geral}{" "}
            <Link to="/esqueci-senha" className="font-medium text-accent-strong underline underline-offset-4">
              Solicitar novo link
            </Link>
          </AuthAlert>
        )}

        <Button
          type="submit"
          size="lg"
          className="h-11 w-full"
          disabled={enviando}
          aria-busy={enviando}
        >
          {enviando && <Loader2 className="animate-spin" aria-hidden />}
          {enviando ? "Salvando…" : "Salvar nova senha"}
        </Button>

        <div className="text-center">
          <Link
            to="/login"
            className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-accent-strong hover:underline"
          >
            Voltar ao login
          </Link>
        </div>
      </form>
    </AuthShell>
  )
}
