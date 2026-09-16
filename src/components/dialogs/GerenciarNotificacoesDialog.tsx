import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { BellOff, BellRing, ChevronDown, Loader2 } from "lucide-react"

import { AuthAlert } from "@/components/layout/AuthShell"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogForm,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { OS_LOOK } from "@/components/StatusBadge"
import { useAuth } from "@/hooks/useAuth"
import { useFeedback } from "@/hooks/useFeedback"
import { ApiError } from "@/lib/api"
import { GATILHO_NOTIFICACAO, renderizarPrevia } from "@/lib/notificacao"
import {
  listarPlaceholders,
  listarTemplates,
  salvarTemplate,
} from "@/lib/notificacao-api"
import type { Placeholder, TemplateNotificacao } from "@/lib/notificacao-api"
import { cn } from "@/lib/utils"

/** Só a chave liga/desliga fica em rascunho: o texto não é editável aqui. */
type Rascunho = Record<string, boolean>

/**
 * Liga e desliga os avisos automáticos de WhatsApp por status da OS. Os toggles
 * ficam em rascunho até "Salvar" — ninguém começa a mandar mensagem para
 * cliente real com um clique acidental.
 *
 * O texto é só prévia: pela API oficial do WhatsApp, mensagem iniciada pela
 * empresa sai de um modelo pré-aprovado, então não é editável aqui. O PUT exige
 * o conteudo no corpo, então reenviamos o que já está salvo, sem tocar nele.
 */
export function GerenciarNotificacoesDialog({
  open,
  onOpenChange,
  onSalvo,
}: {
  open: boolean
  onOpenChange: (aberto: boolean) => void
  onSalvo?: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {/* O conteúdo desmonta ao fechar: cada abertura relê o que está salvo. */}
        <Conteudo
          onSalvo={() => {
            onSalvo?.()
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

function Conteudo({ onSalvo }: { onSalvo: () => void }) {
  const { token, logout } = useAuth()
  const { sucesso } = useFeedback()
  const [templates, setTemplates] = useState<TemplateNotificacao[] | null>(null)
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([])
  const [rascunho, setRascunho] = useState<Rascunho>({})
  const [previaAberta, setPreviaAberta] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!token) return
    let cancelado = false

    Promise.all([listarTemplates(token), listarPlaceholders(token)])
      .then(([lista, chaves]) => {
        if (cancelado) return
        setTemplates(lista)
        setPlaceholders(chaves)
        setRascunho(Object.fromEntries(lista.map((t) => [t.status, t.ativo])))
      })
      .catch((error) => {
        if (cancelado) return
        if (error instanceof ApiError && error.status === 401) return logout()
        setErro(
          error instanceof ApiError
            ? error.message
            : "Não foi possível carregar as notificações automáticas."
        )
      })

    return () => {
      cancelado = true
    }
  }, [token, logout])

  const alterados = (templates ?? []).filter(
    (t) => rascunho[t.status] !== undefined && rascunho[t.status] !== t.ativo
  )

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (enviando || !token || alterados.length === 0) return

    setEnviando(true)
    setErro(null)
    try {
      // Um PUT por status: o recurso é o template, não o conjunto. O conteudo
      // vai de volta como veio — aqui só a flag muda.
      for (const template of alterados) {
        await salvarTemplate(token, template.status, {
          ativo: rascunho[template.status],
          conteudo: template.conteudo,
        })
      }
      const ligados = alterados.filter((t) => rascunho[t.status]).length
      sucesso({
        titulo: "Notificações atualizadas",
        descricao:
          ligados > 0
            ? "As ordens de serviço passam a disparar as notificações ligadas."
            : "Nenhuma notificação automática ficou ligada.",
      })
      onSalvo()
    } catch (error) {
      setEnviando(false)
      if (error instanceof ApiError && error.status === 401) return logout()
      setErro(
        error instanceof ApiError
          ? error.message
          : "Não foi possível salvar. Tente novamente."
      )
    }
  }

  return (
    <DialogForm onSubmit={handleSubmit} noValidate>
      <DialogHeader>
        <DialogTitle>Gerenciar notificações</DialogTitle>
        <DialogDescription>
          Escolha em quais mudanças de status o cliente recebe WhatsApp.
        </DialogDescription>
      </DialogHeader>

      <DialogBody className="space-y-3">
        {erro && <AuthAlert tom="erro">{erro}</AuthAlert>}

        {!templates ? (
          <div className="flex items-center gap-2 px-1 py-8 text-sm text-muted-foreground" role="status">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Carregando notificações…
          </div>
        ) : (
          templates.map((template) => {
            const gatilho = GATILHO_NOTIFICACAO[template.status]
            const ligado = rascunho[template.status] ?? false
            const aberta = previaAberta === template.status
            // O ícone é o do próprio status da OS que dispara o aviso.
            const IconeGatilho = OS_LOOK[template.status].icon
            const IconeSino = ligado ? BellRing : BellOff
            return (
              <div
                key={template.status}
                className={cn(
                  "rounded-lg border p-3 transition-colors",
                  ligado
                    ? "border-success/40 bg-success-soft/40"
                    : "border-destructive/30 bg-destructive-soft/30"
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                      ligado
                        ? "bg-success-soft text-success-soft-foreground"
                        : "bg-destructive-soft text-destructive-soft-foreground"
                    )}
                  >
                    <IconeGatilho className="size-4.5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <Label htmlFor={`aviso-${template.status}`} className="font-medium">
                      {gatilho.titulo}
                    </Label>
                    <p className="text-xs text-muted-foreground">{gatilho.quando}</p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2.5">
                    <Badge variant={ligado ? "success" : "destructive"}>
                      <IconeSino />
                      {ligado ? "Ativo" : "Desligado"}
                    </Badge>
                    <Switch
                      id={`aviso-${template.status}`}
                      checked={ligado}
                      onCheckedChange={(ativo) =>
                        setRascunho((atuais) => ({ ...atuais, [template.status]: ativo }))
                      }
                      className="data-[state=checked]:bg-success data-[state=unchecked]:bg-destructive/30"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviaAberta(aberta ? null : template.status)}
                  className="mt-3 flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ChevronDown className={cn("size-3.5 transition-transform", aberta && "rotate-180")} aria-hidden />
                  {aberta ? "Ocultar mensagem" : "Ver a mensagem"}
                </button>

                {aberta && (
                  <p className="mt-2 whitespace-pre-line rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground">
                    {renderizarPrevia(template.conteudo, placeholders)}
                  </p>
                )}
              </div>
            )
          })
        )}
      </DialogBody>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </DialogClose>
        <Button
          type="submit"
          disabled={enviando || alterados.length === 0}
          aria-busy={enviando}
        >
          {enviando && <Loader2 className="animate-spin" aria-hidden />}
          {alterados.length === 0
            ? "Salvar"
            : `Salvar ${alterados.length} ${alterados.length === 1 ? "notificação" : "notificações"}`}
        </Button>
      </DialogFooter>
    </DialogForm>
  )
}
