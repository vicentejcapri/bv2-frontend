import { useState } from "react"
import type { FormEvent, ReactNode } from "react"
import { Plus } from "lucide-react"

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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field } from "./Field"
import { fieldProps } from "@/lib/form"
import { useDados } from "@/hooks/useDados"
import { formatBRL, maskMoeda, parseMoeda } from "@/lib/format"
import type { Servico } from "@/data/mocks"

type Erros = Partial<Record<"nome" | "valorBase", string>>

const VAZIO = { nome: "", descricao: "", valorBase: "" }

export function NovoServicoDialog({
  onCreated,
  trigger,
  open: openControlado,
  onOpenChange,
}: {
  onCreated?: (servico: Servico) => void
  /**
   * Botão que abre o diálogo. Passe `null` quando ele for aberto por fora
   * (ex.: pelo seletor de serviço da Nova OS).
   */
  trigger?: ReactNode
  /** Modo controlado — usado quando não há gatilho próprio. */
  open?: boolean
  onOpenChange?: (aberto: boolean) => void
}) {
  const { addServico } = useDados()
  const [openInterno, setOpenInterno] = useState(false)
  const [form, setForm] = useState(VAZIO)
  const [erros, setErros] = useState<Erros>({})

  const controlado = openControlado !== undefined
  const open = controlado ? openControlado : openInterno

  const fechar = (aberto: boolean) => {
    if (!controlado) setOpenInterno(aberto)
    onOpenChange?.(aberto)
    if (!aberto) {
      setForm(VAZIO)
      setErros({})
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    const valor = parseMoeda(form.valorBase)
    const novosErros: Erros = {}
    if (!form.nome.trim()) novosErros.nome = "Informe o nome do serviço."
    if (valor <= 0) novosErros.valorBase = "Informe um valor maior que zero."

    setErros(novosErros)
    if (Object.keys(novosErros).length > 0) return

    const servico = addServico({
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || "—",
      valorBase: formatBRL(valor),
    })
    onCreated?.(servico)
    fechar(false)
  }

  return (
    <Dialog open={open} onOpenChange={fechar}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button>
              <Plus />
              Novo serviço
            </Button>
          )}
        </DialogTrigger>
      )}

      <DialogContent>
        <DialogForm onSubmit={handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>Novo serviço base</DialogTitle>
            <DialogDescription>
              Valor de referência para agilizar orçamentos — pode ser ajustado
              em cada OS.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <Field id="servico-nome" label="Nome do serviço" required error={erros.nome}>
              <Input
                {...fieldProps("servico-nome", erros.nome)}
                value={form.nome}
                onChange={(event) =>
                  setForm({ ...form, nome: event.target.value })
                }
                placeholder="Troca de rolamento"
                autoFocus
              />
            </Field>

            <Field
              id="servico-descricao"
              label="Descrição"
              hint="O que está incluso na mão de obra."
            >
              <Textarea
                id="servico-descricao"
                value={form.descricao}
                onChange={(event) =>
                  setForm({ ...form, descricao: event.target.value })
                }
                placeholder="Mão de obra para substituição de rolamentos padrão"
                rows={3}
              />
            </Field>

            <Field
              id="servico-valor"
              label="Valor base"
              required
              error={erros.valorBase}
            >
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  R$
                </span>
                <Input
                  {...fieldProps("servico-valor", erros.valorBase)}
                  value={form.valorBase}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      valorBase: maskMoeda(event.target.value),
                    })
                  }
                  inputMode="numeric"
                  placeholder="0,00"
                  className="pl-10 text-right font-medium"
                />
              </div>
            </Field>
          </DialogBody>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit">Cadastrar serviço</Button>
          </DialogFooter>
        </DialogForm>
      </DialogContent>
    </Dialog>
  )
}
