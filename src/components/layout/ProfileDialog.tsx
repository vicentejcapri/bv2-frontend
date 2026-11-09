import { useState } from "react"
import type { FormEvent, ReactNode } from "react"
import { ChevronRight, Loader2 } from "lucide-react"

import { AuthAlert } from "@/components/layout/AuthShell"
import { Field } from "@/components/dialogs/Field"
import { PasswordInput } from "@/components/PasswordInput"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAuth } from "@/hooks/useAuth"
import { ApiError } from "@/lib/api"
import { validarEmail } from "@/lib/auth-api"
import { initialsOf } from "@/lib/format"
import { fieldProps } from "@/lib/form"
import {
  ROLE_LABEL,
  atualizarMeuNome,
  solicitarTrocaEmail,
  solicitarTrocaSenha,
} from "@/lib/usuario-api"
import type { Usuario } from "@/lib/usuario-api"
import { cn } from "@/lib/utils"
import { ComAjuda } from "@/components/Ajuda"
import { AJUDA } from "@/config/ajuda"

type Aba = "dados" | "email" | "senha"

const ABAS: { id: Aba; label: string }[] = [
  { id: "dados", label: "Dados" },
  { id: "email", label: "E-mail" },
  { id: "senha", label: "Senha" },
]

type Erros = Record<string, string | undefined>

export function ProfileDialog({ expanded }: { expanded: boolean }) {
  const { usuario } = useAuth()
  const [open, setOpen] = useState(false)

  const trigger = (
    <button
      type="button"
      disabled={!usuario}
      className={cn(
        "flex h-12 w-full items-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent/40",
        expanded
          ? "gap-3 px-2 hover:bg-sidebar-accent"
          : "justify-center px-0 hover:bg-sidebar-accent"
      )}
    >
      {usuario ? (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
          {initialsOf(usuario.nome)}
        </span>
      ) : (
        <span className="size-8 shrink-0 animate-pulse rounded-full bg-sidebar-accent" />
      )}
      {expanded && (
        <>
          <span className="min-w-0 flex-1 text-left">
            {usuario ? (
              <>
                <span className="block truncate text-sm font-medium text-white">
                  {usuario.nome}
                </span>
                <span className="block truncate text-xs text-sidebar-muted">
                  {ROLE_LABEL[usuario.role]}
                </span>
              </>
            ) : (
              <span className="block space-y-1.5" aria-label="Carregando usuário">
                <span className="block h-3 w-24 animate-pulse rounded bg-sidebar-accent" />
                <span className="block h-2.5 w-16 animate-pulse rounded bg-sidebar-accent" />
              </span>
            )}
          </span>
          <ChevronRight className="size-4 shrink-0 text-sidebar-muted" />
        </>
      )}
    </button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {expanded ? (
          trigger
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>{trigger}</TooltipTrigger>
            <TooltipContent side="right">Meu perfil</TooltipContent>
          </Tooltip>
        )}
      </DialogTrigger>

      <DialogContent>
        {/* O conteúdo desmonta ao fechar, então cada abertura começa limpa. */}
        {usuario && <PerfilConteudo usuario={usuario} onFechar={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function PerfilConteudo({
  usuario,
  onFechar,
}: {
  usuario: Usuario
  onFechar: () => void
}) {
  const [aba, setAba] = useState<Aba>("dados")

  return (
    <>
      <DialogHeader>
        <ComAjuda conteudo={AJUDA.perfil[aba]} className="pr-8">
          <DialogTitle>Meu perfil</DialogTitle>
        </ComAjuda>
        <DialogDescription>
          {aba === "dados" && "Seu nome aparece no painel e nas ações registradas."}
          {aba === "email" && "O e-mail é o seu login. A troca só vale depois de confirmada."}
          {aba === "senha" &&
            "A troca só vale depois de confirmada no seu e-mail. Aí você sai de todas as sessões."}
        </DialogDescription>
      </DialogHeader>

      {/* Cabeçalho fixo; só o formulário da aba rola em telas baixas. */}
      <DialogBody className="flex-none space-y-4 overflow-visible pb-4">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {initialsOf(usuario.nome)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{usuario.nome}</p>
            <p className="truncate text-xs text-muted-foreground">
              {usuario.email} · {ROLE_LABEL[usuario.role]}
            </p>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Seções do perfil"
          className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1"
        >
          {ABAS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`perfil-aba-${item.id}`}
              aria-selected={aba === item.id}
              aria-controls="perfil-painel"
              onClick={() => setAba(item.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                aba === item.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </DialogBody>

      <div
        id="perfil-painel"
        role="tabpanel"
        aria-labelledby={`perfil-aba-${aba}`}
        className="flex min-h-0 flex-1 flex-col"
      >
        {aba === "dados" && <FormNome usuario={usuario} onFechar={onFechar} />}
        {aba === "email" && <FormEmail usuario={usuario} />}
        {aba === "senha" && <FormSenha usuario={usuario} />}
      </div>
    </>
  )
}

/** Corpo + rodapé de cada aba, com o botão de envio no mesmo lugar. */
function AbaForm({
  onSubmit,
  enviando,
  rotulo,
  children,
}: {
  onSubmit: (event: FormEvent) => void
  enviando: boolean
  rotulo: string
  children: ReactNode
}) {
  return (
    <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
      <DialogBody className="space-y-4 pt-1">{children}</DialogBody>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={enviando} aria-busy={enviando}>
          {enviando && <Loader2 className="animate-spin" aria-hidden />}
          {rotulo}
        </Button>
      </DialogFooter>
    </form>
  )
}

/**
 * Trata o erro comum às três abas: 401 mostra o alerta de sessão expirada; 400 vira
 * erro por campo; o resto (409, 422, rede) vira alerta geral com a mensagem do backend.
 */
function useTratarErro() {
  const { expirarSessao } = useAuth()
  return (error: unknown): Erros => {
    if (error instanceof ApiError && error.status === 401) {
      expirarSessao()
      return {}
    }
    if (error instanceof ApiError && error.status === 400 && error.erros) {
      return { ...error.erros }
    }
    return {
      geral: error instanceof ApiError ? error.message : "Algo deu errado. Tente novamente.",
    }
  }
}

function FormNome({ usuario, onFechar }: { usuario: Usuario; onFechar: () => void }) {
  const { token, setUsuario } = useAuth()
  const tratarErro = useTratarErro()
  const [nome, setNome] = useState(usuario.nome)
  const [erros, setErros] = useState<Erros>({})
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (enviando || !token) return

    const limpo = nome.trim()
    const local = !limpo
      ? "Informe seu nome."
      : limpo.length > 50
        ? "O nome deve ter no máximo 50 caracteres."
        : undefined
    setErros({ nome: local })
    if (local) return
    if (limpo === usuario.nome) return onFechar()

    setEnviando(true)
    try {
      setUsuario(await atualizarMeuNome(token, limpo))
      onFechar()
    } catch (error) {
      setErros(tratarErro(error))
      setEnviando(false)
    }
  }

  return (
    <AbaForm onSubmit={handleSubmit} enviando={enviando} rotulo="Salvar nome">
      <Field id="perfil-nome" label="Nome" error={erros.nome}>
        <Input
          {...fieldProps("perfil-nome", erros.nome)}
          autoComplete="name"
          maxLength={50}
          value={nome}
          onChange={(event) => setNome(event.target.value)}
        />
      </Field>
      {erros.geral && <AuthAlert tom="erro">{erros.geral}</AuthAlert>}
    </AbaForm>
  )
}

function FormEmail({ usuario }: { usuario: Usuario }) {
  const { token } = useAuth()
  const tratarErro = useTratarErro()
  const [novoEmail, setNovoEmail] = useState("")
  const [confirmacao, setConfirmacao] = useState("")
  const [senhaAtual, setSenhaAtual] = useState("")
  const [erros, setErros] = useState<Erros>({})
  const [enviando, setEnviando] = useState(false)
  const [enviadoPara, setEnviadoPara] = useState<string>()

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (enviando || !token) return

    const email = novoEmail.trim()
    const locais: Erros = {
      novoEmail:
        validarEmail(email) ??
        (email.toLowerCase() === usuario.email.toLowerCase()
          ? "O novo e-mail é igual ao atual."
          : undefined),
      novoEmailConfirmacao:
        confirmacao.trim() !== email ? "Os e-mails não conferem." : undefined,
      senhaAtual: senhaAtual ? undefined : "Informe sua senha atual.",
    }
    setErros(locais)
    if (Object.values(locais).some(Boolean)) return

    setEnviando(true)
    try {
      await solicitarTrocaEmail(token, {
        senhaAtual,
        novoEmail: email,
        novoEmailConfirmacao: confirmacao.trim(),
      })
      setEnviadoPara(email)
      setNovoEmail("")
      setConfirmacao("")
      setSenhaAtual("")
    } catch (error) {
      setErros(tratarErro(error))
    } finally {
      setEnviando(false)
    }
  }

  if (enviadoPara) {
    return (
      <>
        <DialogBody className="space-y-3 pt-0">
          <AuthAlert tom="sucesso">
            Enviamos um link para <strong className="font-medium">{enviadoPara}</strong>.
            Abra-o em até 30 minutos para concluir a troca.
          </AuthAlert>
          <p className="text-sm text-muted-foreground">
            Até lá, continue entrando com {usuario.email}. Depois da confirmação
            você precisará entrar de novo com o e-mail novo.
          </p>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button">Entendi</Button>
          </DialogClose>
        </DialogFooter>
      </>
    )
  }

  return (
    <AbaForm onSubmit={handleSubmit} enviando={enviando} rotulo="Enviar confirmação">
      <Field id="perfil-novo-email" label="Novo e-mail" error={erros.novoEmail}>
        <Input
          {...fieldProps("perfil-novo-email", erros.novoEmail)}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={novoEmail}
          onChange={(event) => setNovoEmail(event.target.value)}
        />
      </Field>
      <Field
        id="perfil-novo-email-confirmacao"
        label="Confirme o novo e-mail"
        error={erros.novoEmailConfirmacao}
      >
        <Input
          {...fieldProps("perfil-novo-email-confirmacao", erros.novoEmailConfirmacao)}
          type="email"
          inputMode="email"
          autoComplete="off"
          value={confirmacao}
          onChange={(event) => setConfirmacao(event.target.value)}
        />
      </Field>
      <Field id="perfil-email-senha" label="Senha atual" error={erros.senhaAtual}>
        <PasswordInput
          {...fieldProps("perfil-email-senha", erros.senhaAtual)}
          autoComplete="current-password"
          value={senhaAtual}
          onChange={(event) => setSenhaAtual(event.target.value)}
        />
      </Field>
      {erros.geral && <AuthAlert tom="erro">{erros.geral}</AuthAlert>}
    </AbaForm>
  )
}

function FormSenha({ usuario }: { usuario: Usuario }) {
  const { token } = useAuth()
  const tratarErro = useTratarErro()
  const [senhaAtual, setSenhaAtual] = useState("")
  const [senhaNova, setSenhaNova] = useState("")
  const [confirmacao, setConfirmacao] = useState("")
  const [erros, setErros] = useState<Erros>({})
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (enviando || !token) return

    // Mesmas regras do AlteracaoSenhaRequest.
    const locais: Erros = {
      senhaAtual: senhaAtual ? undefined : "Informe sua senha atual.",
      senhaNova:
        senhaNova.length < 8 || senhaNova.length > 72
          ? "A senha deve ter entre 8 e 72 caracteres."
          : senhaNova === senhaAtual
            ? "A nova senha precisa ser diferente da atual."
            : undefined,
      senhaNovaConfirmacao:
        confirmacao !== senhaNova ? "As senhas não conferem." : undefined,
    }
    setErros(locais)
    if (Object.values(locais).some(Boolean)) return

    setEnviando(true)
    try {
      // Nada muda ainda: a sessão continua até o clique no link. Quando ele acontecer,
      // esta aba recebe o alerta de sessão expirada (pelo canal ou ao voltar o foco).
      await solicitarTrocaSenha(token, {
        senhaAtual,
        senhaNova,
        senhaNovaConfirmacao: confirmacao,
      })
      setEnviado(true)
      setSenhaAtual("")
      setSenhaNova("")
      setConfirmacao("")
    } catch (error) {
      setErros(tratarErro(error))
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    return (
      <>
        <DialogBody className="space-y-3 pt-0">
          <AuthAlert tom="sucesso">
            Enviamos um link para <strong className="font-medium">{usuario.email}</strong>.
            Abra-o em até 30 minutos para confirmar a nova senha.
          </AuthAlert>
          <p className="text-sm text-muted-foreground">
            Até lá, sua senha atual continua valendo. Depois da confirmação, todas as
            sessões são encerradas e você entra de novo com a nova senha.
          </p>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button">Entendi</Button>
          </DialogClose>
        </DialogFooter>
      </>
    )
  }

  return (
    <AbaForm onSubmit={handleSubmit} enviando={enviando} rotulo="Enviar confirmação">
      <Field id="perfil-senha-atual" label="Senha atual" error={erros.senhaAtual}>
        <PasswordInput
          {...fieldProps("perfil-senha-atual", erros.senhaAtual)}
          autoComplete="current-password"
          value={senhaAtual}
          onChange={(event) => setSenhaAtual(event.target.value)}
        />
      </Field>
      <Field
        id="perfil-senha-nova"
        label="Nova senha"
        hint="Mínimo de 8 caracteres."
        error={erros.senhaNova}
      >
        <PasswordInput
          {...fieldProps("perfil-senha-nova", erros.senhaNova)}
          aria-describedby={
            erros.senhaNova ? "perfil-senha-nova-error" : "perfil-senha-nova-hint"
          }
          autoComplete="new-password"
          value={senhaNova}
          onChange={(event) => setSenhaNova(event.target.value)}
        />
      </Field>
      <Field
        id="perfil-senha-confirmacao"
        label="Confirme a nova senha"
        error={erros.senhaNovaConfirmacao}
      >
        <PasswordInput
          {...fieldProps("perfil-senha-confirmacao", erros.senhaNovaConfirmacao)}
          autoComplete="new-password"
          value={confirmacao}
          onChange={(event) => setConfirmacao(event.target.value)}
        />
      </Field>
      {erros.geral && <AuthAlert tom="erro">{erros.geral}</AuthAlert>}
    </AbaForm>
  )
}
