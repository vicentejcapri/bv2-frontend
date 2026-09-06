import { useMemo, useState } from "react"
import type { FormEvent, ReactNode } from "react"
import { Plus, Trash2, TriangleAlert } from "lucide-react"

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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field } from "./Field"
import { NovoServicoDialog } from "./NovoServicoDialog"
import { fieldProps } from "@/lib/form"
import { OS_LOOK } from "@/components/StatusBadge"
import { useDados } from "@/hooks/useDados"
import { useFeedback } from "@/hooks/useFeedback"
import {
  formatBRL,
  formatDataBR,
  hojeISO,
  maskMoeda,
  parseMoeda,
} from "@/lib/format"
import type { OrdemServico, Servico } from "@/data/mocks"

/** Valor sentinela do seletor: abre o cadastro de serviço sem sair da OS. */
const CRIAR_SERVICO = "__criar-servico__"

type ItemForm = { equipamento: string; servico: string; valor: string }
type ErroItem = Partial<Record<"equipamento" | "valor", string>>
type Erros = {
  cliente?: string
  entrada?: string
  itens: ErroItem[]
}

const ITEM_VAZIO: ItemForm = { equipamento: "", servico: "", valor: "" }

/** Estado inicial — função porque a data de entrada é sempre o dia de hoje. */
const vazio = () => ({
  cliente: "",
  status: "EM_ANDAMENTO" as OrdemServico["status"],
  entrada: hojeISO(),
  observacoes: "",
  itens: [{ ...ITEM_VAZIO }],
})

export function NovaOSDialog({
  onCreated,
  trigger,
}: {
  onCreated?: (ordem: OrdemServico) => void
  /** Permite trocar o botão que abre o diálogo (ex.: no painel resumo). */
  trigger?: ReactNode
}) {
  const { addOrdem, clientes, equipamentos, servicos } = useDados()
  const { sucesso, falha } = useFeedback()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(vazio)
  const [erros, setErros] = useState<Erros>({ itens: [] })
  // Item que pediu o cadastro de um serviço novo — recebe o serviço criado.
  const [itemDoNovoServico, setItemDoNovoServico] = useState<number | null>(null)

  // O equipamento depende do cliente escolhido.
  const equipamentosDoCliente = useMemo(
    () => equipamentos.filter((eq) => eq.cliente === form.cliente),
    [equipamentos, form.cliente]
  )

  const total = form.itens.reduce((soma, item) => soma + parseMoeda(item.valor), 0)
  const varios = form.itens.length > 1

  const fechar = (aberto: boolean) => {
    setOpen(aberto)
    if (!aberto) {
      setForm(vazio())
      setErros({ itens: [] })
      setItemDoNovoServico(null)
    }
  }

  // Trocar de cliente invalida os equipamentos já selecionados.
  const handleClienteChange = (cliente: string) => {
    setForm((atual) => ({
      ...atual,
      cliente,
      itens: atual.itens.map((item) => ({ ...item, equipamento: "" })),
    }))
  }

  const atualizarItem = (indice: number, mudanca: Partial<ItemForm>) => {
    setForm((atual) => ({
      ...atual,
      itens: atual.itens.map((item, i) =>
        i === indice ? { ...item, ...mudanca } : item
      ),
    }))
  }

  const adicionarItem = () => {
    setForm((atual) => ({ ...atual, itens: [...atual.itens, { ...ITEM_VAZIO }] }))
  }

  const removerItem = (indice: number) => {
    setForm((atual) => ({
      ...atual,
      itens: atual.itens.filter((_, i) => i !== indice),
    }))
    setErros((atuais) => ({
      ...atuais,
      itens: atuais.itens.filter((_, i) => i !== indice),
    }))
  }

  /** Valor do serviço em centavos, no formato que a máscara espera. */
  const valorDoServico = (servico: Servico) =>
    maskMoeda(String(Math.round(parseMoeda(servico.valorBase) * 100)))

  // Escolher um serviço sugere o valor, mas o usuário pode sobrescrever.
  const handleServicoChange = (indice: number, nome: string) => {
    if (nome === CRIAR_SERVICO) {
      // Espera o seletor fechar antes de abrir o diálogo por cima.
      setTimeout(() => setItemDoNovoServico(indice), 0)
      return
    }
    // O seletor devolve "" ao se reabilitar depois do cadastro rápido; ignorar
    // evita apagar o serviço que acabou de ser criado.
    if (!nome) return
    const servico = servicos.find((item) => item.nome === nome)
    atualizarItem(indice, {
      servico: nome,
      ...(servico ? { valor: valorDoServico(servico) } : {}),
    })
  }

  // Serviço recém-cadastrado já entra no item que abriu o diálogo.
  const handleServicoCriado = (servico: Servico) => {
    if (itemDoNovoServico === null) return
    atualizarItem(itemDoNovoServico, {
      servico: servico.nome,
      valor: valorDoServico(servico),
    })
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    const errosItens: ErroItem[] = form.itens.map((item) => {
      const erro: ErroItem = {}
      if (!item.equipamento) erro.equipamento = "Selecione o equipamento."
      if (parseMoeda(item.valor) <= 0)
        erro.valor = "Informe um valor maior que zero."
      return erro
    })

    const novosErros: Erros = { itens: errosItens }
    if (!form.cliente) novosErros.cliente = "Selecione o cliente."
    if (!form.entrada) novosErros.entrada = "Informe a data de entrada."

    setErros(novosErros)
    const temErroDeItem = errosItens.some(
      (erro) => Object.keys(erro).length > 0
    )
    if (novosErros.cliente || novosErros.entrada || temErroDeItem) return

    try {
      const ordem = addOrdem({
        cliente: form.cliente,
        itens: form.itens.map((item) => ({
          equipamento: item.equipamento,
          servico: item.servico || "—",
          valor: formatBRL(parseMoeda(item.valor)),
        })),
        status: form.status,
        entrada: formatDataBR(form.entrada),
        valor: formatBRL(total),
      })
      onCreated?.(ordem)
      fechar(false)
      sucesso({ titulo: "Ordem de Serviço criada com sucesso!" })
    } catch (error) {
      // O formulário continua aberto para o usuário tentar de novo.
      falha({
        titulo: "Não foi possível abrir a OS",
        descricao:
          error instanceof Error
            ? error.message
            : "Confira os dados e tente novamente.",
        botao: "Voltar ao formulário",
      })
    }
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
              Ao salvar, o cliente recebe o aviso de abertura pelo WhatsApp.
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

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="os-entrada"
                label="Data de entrada"
                required
                error={erros.entrada}
                hint="Ajuste se a OS for de outro dia."
              >
                <Input
                  {...fieldProps("os-entrada", erros.entrada)}
                  type="date"
                  value={form.entrada}
                  onChange={(event) =>
                    setForm({ ...form, entrada: event.target.value })
                  }
                />
              </Field>

              <Field id="os-status" label="Status inicial">
                <Select
                  value={form.status}
                  onValueChange={(status) =>
                    setForm({
                      ...form,
                      status: status as OrdemServico["status"],
                    })
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
            </div>

            {form.cliente && equipamentosDoCliente.length === 0 && (
              <p className="flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning-soft-foreground">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                Este cliente ainda não tem equipamentos. Cadastre um em
                Equipamentos antes de abrir a OS.
              </p>
            )}

            {/* Itens da OS: um serviço por linha, cada um com seu equipamento. */}
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label asChild>
                    <p>Serviços</p>
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {form.itens.length} {varios ? "itens" : "item"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Um serviço por linha — o mesmo equipamento pode se repetir.
                </p>
              </div>

              {form.itens.map((item, indice) => {
                const erroItem = erros.itens[indice] ?? {}
                const idEquipamento = `os-item-${indice}-equipamento`
                const idServico = `os-item-${indice}-servico`
                const idValor = `os-item-${indice}-valor`

                return (
                  <div
                    key={indice}
                    className="space-y-3 rounded-lg border border-border bg-muted/40 p-3"
                  >
                    {varios && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Item {indice + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removerItem(indice)}
                        >
                          <Trash2 />
                          <span className="sr-only">
                            Remover item {indice + 1}
                          </span>
                        </Button>
                      </div>
                    )}

                    <Field
                      id={idEquipamento}
                      label="Equipamento"
                      required
                      error={erroItem.equipamento}
                      hint={
                        !form.cliente && indice === 0
                          ? "Escolha um cliente para ver os equipamentos dele."
                          : undefined
                      }
                    >
                      <Select
                        value={item.equipamento}
                        onValueChange={(equipamento) =>
                          atualizarItem(indice, { equipamento })
                        }
                        disabled={
                          !form.cliente || equipamentosDoCliente.length === 0
                        }
                      >
                        <SelectTrigger
                          id={idEquipamento}
                          className="bg-card"
                          aria-invalid={erroItem.equipamento ? true : undefined}
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

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field id={idServico} label="Serviço" optional>
                        <Select
                          value={item.servico}
                          onValueChange={(nome) =>
                            handleServicoChange(indice, nome)
                          }
                        >
                          <SelectTrigger id={idServico} className="bg-card">
                            {/* Na lista o valor base ajuda; no gatilho, só o nome. */}
                            <SelectValue placeholder="Nenhum">
                              {item.servico}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {servicos.map((servico) => (
                              <SelectItem key={servico.id} value={servico.nome}>
                                {servico.nome} — {servico.valorBase}
                              </SelectItem>
                            ))}
                            <SelectSeparator />
                            <SelectItem
                              value={CRIAR_SERVICO}
                              className="font-medium"
                            >
                              <span className="flex items-center gap-2">
                                <Plus className="size-3.5" />
                                Cadastrar novo serviço
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field
                        id={idValor}
                        label="Valor"
                        required
                        error={erroItem.valor}
                      >
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            R$
                          </span>
                          <Input
                            {...fieldProps(idValor, erroItem.valor)}
                            value={item.valor}
                            onChange={(event) =>
                              atualizarItem(indice, {
                                valor: maskMoeda(event.target.value),
                              })
                            }
                            inputMode="numeric"
                            placeholder="0,00"
                            className="bg-card pl-10 text-right font-medium"
                          />
                        </div>
                      </Field>
                    </div>
                  </div>
                )
              })}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={adicionarItem}
              >
                <Plus />
                Adicionar serviço
              </Button>
            </div>

            {/* Fecha o orçamento: soma dos itens. */}
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
              <span className="text-sm font-medium">
                {varios ? "Valor total" : "Valor"}
              </span>
              <span className="font-heading text-base font-semibold tabular-nums">
                {formatBRL(total)}
              </span>
            </div>

            <Field
              id="os-observacoes"
              label="Defeito relatado"
              optional
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

      {/* Cadastro rápido de serviço, aberto pelo próprio seletor do item. */}
      <NovoServicoDialog
        trigger={null}
        open={itemDoNovoServico !== null}
        onOpenChange={(aberto) => {
          if (!aberto) setItemDoNovoServico(null)
        }}
        onCreated={handleServicoCriado}
      />
    </Dialog>
  )
}
