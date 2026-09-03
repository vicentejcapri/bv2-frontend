import { useMemo, useState } from "react"
import type { FormEvent, ReactNode } from "react"
import { Plus, TriangleAlert } from "lucide-react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field } from "./Field"
import { fieldProps } from "@/lib/form"
import { OS_LOOK } from "@/components/StatusBadge"
import { useDados } from "@/hooks/useDados"
import {
  formatBRL,
  formatDataBR,
  hojeISO,
  maskMoeda,
  parseMoeda,
} from "@/lib/format"
import type { OrdemServico } from "@/data/mocks"

type Erros = Partial<
  Record<"cliente" | "equipamento" | "prazo" | "valor", string>
>

const VAZIO = {
  cliente: "",
  equipamento: "",
  servico: "",
  status: "EM_ANDAMENTO" as OrdemServico["status"],
  prazo: "",
  valor: "",
  observacoes: "",
}

export function NovaOSDialog({
  onCreated,
  trigger,
}: {
  onCreated?: (ordem: OrdemServico) => void
  /** Permite trocar o botão que abre o diálogo (ex.: no painel resumo). */
  trigger?: ReactNode
}) {
  const { addOrdem, clientes, equipamentos, servicos } = useDados()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(VAZIO)
  const [erros, setErros] = useState<Erros>({})

  // O equipamento depende do cliente escolhido.
  const equipamentosDoCliente = useMemo(
    () => equipamentos.filter((eq) => eq.cliente === form.cliente),
    [equipamentos, form.cliente]
  )

  const fechar = (aberto: boolean) => {
    setOpen(aberto)
    if (!aberto) {
      setForm(VAZIO)
      setErros({})
    }
  }

  // Trocar de cliente invalida o equipamento já selecionado.
  const handleClienteChange = (cliente: string) => {
    setForm((atual) => ({ ...atual, cliente, equipamento: "" }))
  }

  // Escolher um serviço base sugere o valor, mas o usuário pode sobrescrever.
  const handleServicoChange = (nome: string) => {
    const servico = servicos.find((item) => item.nome === nome)
    setForm((atual) => ({
      ...atual,
      servico: nome,
      valor: servico
        ? maskMoeda(String(Math.round(parseMoeda(servico.valorBase) * 100)))
        : atual.valor,
    }))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    const valor = parseMoeda(form.valor)
    const novosErros: Erros = {}
    if (!form.cliente) novosErros.cliente = "Selecione o cliente."
    if (!form.equipamento) novosErros.equipamento = "Selecione o equipamento."
    if (!form.prazo) novosErros.prazo = "Informe a data de entrega."
    if (valor <= 0) novosErros.valor = "Informe um valor maior que zero."

    setErros(novosErros)
    if (Object.keys(novosErros).length > 0) return

    const ordem = addOrdem({
      cliente: form.cliente,
      equipamento: form.equipamento,
      status: form.status,
      prazo: formatDataBR(form.prazo),
      valor: formatBRL(valor),
    })
    onCreated?.(ordem)
    fechar(false)
  }

  return (
    <Dialog open={open} onOpenChange={fechar}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus />
            Nova OS
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogForm onSubmit={handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>Nova ordem de serviço</DialogTitle>
            <DialogDescription>
              Ao salvar, o cliente recebe o aviso de prazo iniciado pelo
              WhatsApp.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <Field
              id="os-cliente"
              label="Cliente"
              required
              error={erros.cliente}
            >
              <Select value={form.cliente} onValueChange={handleClienteChange}>
                <SelectTrigger
                  id="os-cliente"
                  aria-invalid={erros.cliente ? true : undefined}
                >
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.nome}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              id="os-equipamento"
              label="Equipamento"
              required
              error={erros.equipamento}
              hint={
                form.cliente
                  ? undefined
                  : "Escolha um cliente para ver os equipamentos dele."
              }
            >
              <Select
                value={form.equipamento}
                onValueChange={(equipamento) =>
                  setForm({ ...form, equipamento })
                }
                disabled={!form.cliente || equipamentosDoCliente.length === 0}
              >
                <SelectTrigger
                  id="os-equipamento"
                  aria-invalid={erros.equipamento ? true : undefined}
                >
                  <SelectValue placeholder="Selecione o equipamento" />
                </SelectTrigger>
                <SelectContent>
                  {equipamentosDoCliente.map((eq) => (
                    <SelectItem
                      key={eq.id}
                      value={`${eq.tipo} ${eq.marca} ${eq.modelo}`.trim()}
                    >
                      {eq.tipo} · {eq.marca} {eq.modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {form.cliente && equipamentosDoCliente.length === 0 && (
              <p className="flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning-soft-foreground">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                Este cliente ainda não tem equipamentos. Cadastre um em
                Equipamentos antes de abrir a OS.
              </p>
            )}

            <Field
              id="os-servico"
              label="Serviço base"
              hint="Opcional — preenche o valor automaticamente."
            >
              <Select
                value={form.servico}
                onValueChange={handleServicoChange}
              >
                <SelectTrigger id="os-servico">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  {servicos.map((servico) => (
                    <SelectItem key={servico.id} value={servico.nome}>
                      {servico.nome} — {servico.valorBase}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="os-prazo"
                label="Prazo de entrega"
                required
                error={erros.prazo}
              >
                <Input
                  {...fieldProps("os-prazo", erros.prazo)}
                  type="date"
                  min={hojeISO()}
                  value={form.prazo}
                  onChange={(event) =>
                    setForm({ ...form, prazo: event.target.value })
                  }
                />
              </Field>

              <Field id="os-valor" label="Valor" required error={erros.valor}>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    R$
                  </span>
                  <Input
                    {...fieldProps("os-valor", erros.valor)}
                    value={form.valor}
                    onChange={(event) =>
                      setForm({ ...form, valor: maskMoeda(event.target.value) })
                    }
                    inputMode="numeric"
                    placeholder="0,00"
                    className="pl-10 text-right font-medium"
                  />
                </div>
              </Field>
            </div>

            <Field id="os-status" label="Status inicial">
              <Select
                value={form.status}
                onValueChange={(status) =>
                  setForm({ ...form, status: status as OrdemServico["status"] })
                }
              >
                <SelectTrigger id="os-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(OS_LOOK).map(([valor, { label }]) => (
                    <SelectItem key={valor} value={valor}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              id="os-observacoes"
              label="Defeito relatado"
              hint="Aparece na impressão da OS."
            >
              <Textarea
                id="os-observacoes"
                value={form.observacoes}
                onChange={(event) =>
                  setForm({ ...form, observacoes: event.target.value })
                }
                placeholder="Cliente relata ruído no eixo e superaquecimento…"
                rows={3}
              />
            </Field>
          </DialogBody>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit">Abrir OS</Button>
          </DialogFooter>
        </DialogForm>
      </DialogContent>
    </Dialog>
  )
}
