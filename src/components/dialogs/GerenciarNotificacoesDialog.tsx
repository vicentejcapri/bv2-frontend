import { useState } from "react"
import type { FormEvent } from "react"
import { BellRing, ChevronDown } from "lucide-react"

import { Badge } from "@/components/ui/badge"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { OS_LOOK } from "@/components/StatusBadge"
import { useDados } from "@/hooks/useDados"
import { useFeedback } from "@/hooks/useFeedback"
import { GATILHO_NOTIFICACAO, renderizarPrevia } from "@/lib/notificacao"
import { cn } from "@/lib/utils"
import type { StatusNotificavel, TemplateNotificacao } from "@/data/mocks"

type Rascunho = Partial<Record<StatusNotificavel, boolean>>

function rascunhoDe(templates: TemplateNotificacao[]): Rascunho {
  return Object.fromEntries(templates.map((t) => [t.status, t.ativo]))
}

/**
 * Liga e desliga os avisos automáticos de WhatsApp por status da OS. Os toggles
 * ficam em rascunho até "Salvar" — ninguém começa a mandar mensagem para
 * cliente real com um clique acidental.
 *
 * O texto é só prévia: pela API oficial do WhatsApp, mensagem iniciada pela
 * empresa sai de um modelo pré-aprovado, então não é editável aqui.
 */
export function GerenciarNotificacoesDialog() {
  const { templatesNotificacao, atualizarTemplateNotificacao } = useDados()
  const { sucesso } = useFeedback()
  const [open, setOpen] = useState(false)
  const [rascunho, setRascunho] = useState<Rascunho>({})
  const [previaAberta, setPreviaAberta] = useState<StatusNotificavel | null>(
    null
  )

  const alterados = templatesNotificacao.filter(
    (template) => rascunho[template.status] !== template.ativo
  )

  const fechar = (aberto: boolean) => {
    setOpen(aberto)
    // Cada abertura parte do que está salvo; fechar descarta o rascunho.
    if (aberto) setRascunho(rascunhoDe(templatesNotificacao))
    else setPreviaAberta(null)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    alterados.forEach((template) =>
      atualizarTemplateNotificacao(template.status, !template.ativo)
    )
    fechar(false)
    sucesso({
      titulo: "Notificações atualizadas",
      descricao: "As mudanças valem para as próximas trocas de status das ordens de serviço.",
    })
  }

  return (
    <Dialog open={open} onOpenChange={fechar}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <BellRing />
          Gerenciar notificações
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogForm onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Gerenciar notificações</DialogTitle>
            <DialogDescription>
              Escolha quais avisos automáticos o cliente recebe no WhatsApp.
            </DialogDescription>
          </DialogHeader>

          <DialogBody>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {templatesNotificacao.map((template) => {
                const { titulo, quando } = GATILHO_NOTIFICACAO[template.status]
                const Icon = OS_LOOK[template.status].icon
                const ativo = rascunho[template.status] ?? template.ativo
                const aberta = previaAberta === template.status
                const id = `notificacao-${template.status.toLowerCase()}`

                return (
                  <li key={template.status} className="p-4">
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-md transition-colors",
                          ativo
                            ? "bg-success-soft text-success-soft-foreground"
                            : "bg-destructive-soft text-destructive-soft-foreground"
                        )}
                      >
                        <Icon className="size-4" />
                      </span>

                      <div className="min-w-0 flex-1 space-y-1">
                        <Label htmlFor={id}>
                          {titulo}
                          {!ativo && <Badge variant="destructive">Desativada</Badge>}
                        </Label>
                        <p
                          id={`${id}-hint`}
                          className="text-xs text-muted-foreground"
                        >
                          {quando}
                        </p>
                      </div>

                      <Switch
                        id={id}
                        checked={ativo}
                        onCheckedChange={(valor) =>
                          setRascunho((atual) => ({
                            ...atual,
                            [template.status]: valor,
                          }))
                        }
                        aria-describedby={`${id}-hint`}
                        className="mt-1.5"
                      />
                    </div>

                    <div className="mt-2 pl-11">
                      <button
                        type="button"
                        onClick={() =>
                          setPreviaAberta(aberta ? null : template.status)
                        }
                        aria-expanded={aberta}
                        aria-controls={`${id}-previa`}
                        className="-ml-1 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-xs font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40"
                      >
                        <ChevronDown
                          className={cn(
                            "size-3.5 transition-transform",
                            aberta && "rotate-180"
                          )}
                        />
                        {aberta ? "Ocultar mensagem" : "Ver mensagem"}
                      </button>

                      {aberta && (
                        <div id={`${id}-previa`} className="mt-2 space-y-1.5">
                          <p
                            className={cn(
                              "w-fit max-w-[95%] whitespace-pre-line rounded-lg rounded-tl-none bg-success-soft px-3 py-2 text-[0.8125rem] leading-relaxed text-foreground shadow-xs transition-opacity",
                              !ativo && "opacity-60"
                            )}
                          >
                            {renderizarPrevia(template.conteudo)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Exemplo com dados fictícios. O texto segue o modelo
                            aprovado no WhatsApp.
                          </p>
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </DialogBody>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={alterados.length === 0}>
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogForm>
      </DialogContent>
    </Dialog>
  )
}
