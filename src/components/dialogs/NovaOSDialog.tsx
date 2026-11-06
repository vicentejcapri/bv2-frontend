import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"

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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ClienteCombobox } from "@/components/ClienteCombobox"
import { ClienteDialog } from "./ClienteDialog"
import { CRIAR, CriarItem } from "./CriarItem"
import { EquipamentoDialog } from "./EquipamentoDialog"
import { Field } from "./Field"
import { ServicoDialog } from "./ServicoDialog"
import { useAuth } from "@/hooks/useAuth"
import { ApiError } from "@/lib/api"
import type { Cliente } from "@/lib/cliente-api"
import { listarEquipamentos } from "@/lib/equipamento-api"
import type { Equipamento } from "@/lib/equipamento-api"
import { fieldProps } from "@/lib/form"
import { formatBRL, hojeISO, maskMoeda, parseMoeda } from "@/lib/format"
import { criarOrdem } from "@/lib/os-api"
import type { OrdemServico } from "@/lib/os-api"
import { listarServicos } from "@/lib/servico-api"
import type { Servico } from "@/lib/servico-api"

type Item = { equipamentoId: string; servicoId: string }
type Erros = Partial<
  Record<"clienteId" | "dataEntrada" | "itens" | "valorTotal" | "geral", string>
>

/**
 * Cadastro aberto por cima da OS, sem perder o que já foi preenchido. O item
 * guarda a linha que pediu o cadastro para receber o registro novo já pronto.
 */
type Cadastro =
  | { tipo: "cliente" }
  | { tipo: "equipamento"; indice: number }
  | { tipo: "servico"; indice: number }

const ITEM_VAZIO: Item = { equipamentoId: "", servicoId: "" }

/** Valor máximo aceito pelo backend: 7 inteiros e 2 decimais. */
const VALOR_MAXIMO = 9_999_999.99

/** Mantém a lista na ordem que veio do backend (nome, asc) após um cadastro. */
function inserirOrdenado<T extends { nome: string }>(atuais: T[] | null, novo: T) {
  return [...(atuais ?? []), novo].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR")
  )
}

export function NovaOSDialog({
  open,
  onOpenChange,
  onCriada,
}: {
  open: boolean
  onOpenChange: (aberto: boolean) => void
  onCriada: (ordem: OrdemServico) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {/* O conteúdo desmonta ao fechar, então cada abertura começa limpa. */}
        <NovaOSForm
          onCriada={(ordem) => {
            onCriada(ordem)
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

function NovaOSForm({ onCriada }: { onCriada: (ordem: OrdemServico) => void }) {
  const { token, logout } = useAuth()

  // Equipamentos vêm por cliente, depois da escolha: guardar o id junto evita
  // mostrar os do cliente anterior enquanto os novos não chegam.
  const [equipamentos, setEquipamentos] = useState<{
    clienteId: number
    itens: Equipamento[]
  } | null>(null)
  const [servicos, setServicos] = useState<Servico[] | null>(null)
  const [erroCarga, setErroCarga] = useState<string | null>(null)

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [dataEntrada, setDataEntrada] = useState(hojeISO())
  const [observacao, setObservacao] = useState("")
  const [itens, setItens] = useState<Item[]>([ITEM_VAZIO])
  const [erros, setErros] = useState<Erros>({})
  const [enviando, setEnviando] = useState(false)
  const [cadastro, setCadastro] = useState<Cadastro | null>(null)

  // Só o catálogo de serviços vem de uma vez (é pequeno e não depende do cliente).
  // O backend recusa serviço inativo (422), então a lista já vem filtrada.
  useEffect(() => {
    if (!token) return
    let cancelado = false

    listarServicos(token, { ativo: true, size: 100 })
      .then((pagina) => {
        if (!cancelado) setServicos(pagina.conteudo)
      })
      .catch((error) => {
        if (cancelado) return
        if (error instanceof ApiError && error.status === 401) return logout()
        setErroCarga(
          error instanceof ApiError ? error.message : "Não foi possível carregar os serviços."
        )
      })

    return () => {
      cancelado = true
    }
  }, [token, logout])

  // O item só aceita equipamento do mesmo cliente da OS (regra do backend): busca
  // só os dele, em vez de trazer os de todos e filtrar aqui.
  const clienteId = cliente?.id ?? null
  useEffect(() => {
    if (!token || clienteId === null) return
    let cancelado = false

    listarEquipamentos(token, { clienteId, size: 100 })
      .then((pagina) => {
        if (!cancelado) setEquipamentos({ clienteId, itens: pagina.conteudo })
      })
      .catch((error) => {
        if (cancelado) return
        if (error instanceof ApiError && error.status === 401) return logout()
        setErroCarga(
          error instanceof ApiError
            ? error.message
            : "Não foi possível carregar os equipamentos do cliente."
        )
      })

    return () => {
      cancelado = true
    }
  }, [token, logout, clienteId])

  const equipamentosDoCliente =
    equipamentos && equipamentos.clienteId === clienteId ? equipamentos.itens : null

  const total = useMemo(
    () =>
      itens.reduce((soma, item) => {
        const servico = servicos?.find((s) => String(s.id) === item.servicoId)
        return soma + (servico?.valor ?? 0)
      }, 0),
    [itens, servicos]
  )

  /** Null = automático (soma dos itens). Texto = total fixado à mão, já mascarado. */
  const [valorManual, setValorManual] = useState<string | null>(null)

  const fixarValor = () => {
    setValorManual(maskMoeda(String(Math.round(total * 100))))
    setErros((atuais) => ({ ...atuais, valorTotal: undefined }))
  }

  const voltarAoAutomatico = () => {
    setValorManual(null)
    setErros((atuais) => ({ ...atuais, valorTotal: undefined }))
  }

  const alterarItem = (indice: number, mudanca: Partial<Item>) => {
    setItens((atuais) =>
      atuais.map((item, i) => (i === indice ? { ...item, ...mudanca } : item))
    )
    setErros((atuais) => ({ ...atuais, itens: undefined }))
  }

  const trocarCliente = (novo: Cliente) => {
    setCliente(novo)
    // Equipamento de outro cliente não vale mais: recomeça os itens.
    setItens([ITEM_VAZIO])
    setErros((atuais) => ({ ...atuais, clienteId: undefined, itens: undefined }))
  }

  const fecharCadastro = (aberto: boolean) => {
    if (!aberto) setCadastro(null)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (enviando || !token) return

    const preenchidos = itens.filter((i) => i.equipamentoId && i.servicoId)
    const pares = new Set(preenchidos.map((i) => `${i.equipamentoId}-${i.servicoId}`))
    const locais: Erros = {
      clienteId: !cliente ? "Selecione o cliente." : undefined,
      dataEntrada: !dataEntrada
        ? "Informe a data de entrada."
        : dataEntrada > hojeISO()
          ? "A data de entrada não pode ser futura."
          : undefined,
      valorTotal:
        valorManual === null
          ? undefined
          : !valorManual
            ? "Informe o valor total ou volte ao automático."
            : parseMoeda(valorManual) > VALOR_MAXIMO
              ? "O valor máximo é R$ 9.999.999,99."
              : undefined,
      itens:
        preenchidos.length === 0
          ? "Lance ao menos um serviço para um equipamento."
          : preenchidos.length !== itens.length
            ? "Complete ou remova os itens sem equipamento ou serviço."
            : pares.size !== preenchidos.length
              ? "Há itens repetidos: o mesmo serviço já foi lançado para esse equipamento."
              : undefined,
    }
    setErros(locais)
    // O !cliente já virou erro acima; repetir aqui só estreita o tipo.
    if (Object.values(locais).some(Boolean) || !cliente) return

    setEnviando(true)
    try {
      onCriada(
        await criarOrdem(token, {
          clienteId: cliente.id,
          dataEntrada,
          observacao: observacao.trim() || null,
          itens: preenchidos.map((i) => ({
            equipamentoId: Number(i.equipamentoId),
            servicoId: Number(i.servicoId),
          })),
          // Omitido, o backend soma os serviços dos itens.
          ...(valorManual !== null ? { valorTotal: parseMoeda(valorManual) } : {}),
        })
      )
    } catch (error) {
      setEnviando(false)
      if (error instanceof ApiError && error.status === 401) return logout()
      if (error instanceof ApiError && error.status === 400 && error.erros) {
        return setErros({ ...error.erros })
      }
      // 422 (cliente inativo, serviço inativo, equipamento de outro cliente) e
      // 409 (item repetido) vêm com mensagem pronta do backend.
      setErros({
        geral:
          error instanceof ApiError
            ? error.message
            : "Algo deu errado. Tente novamente.",
      })
    }
  }

  const carregando = !servicos

  return (
    <>
      <DialogForm onSubmit={handleSubmit} noValidate>
        <DialogHeader>
          <DialogTitle>Nova ordem de serviço</DialogTitle>
          <DialogDescription>
            A ordem nasce em andamento e precisa de ao menos um serviço lançado.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {erroCarga && <AuthAlert tom="erro">{erroCarga}</AuthAlert>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="os-cliente"
              label="Cliente"
              required
              error={erros.clienteId}
              hint="Digite parte do nome ou do telefone. Só aparecem clientes ativos."
            >
              <ClienteCombobox
                id="os-cliente"
                value={cliente}
                onChange={trocarCliente}
                onCriar={() => setCadastro({ tipo: "cliente" })}
                invalido={!!erros.clienteId}
                descritoPor={erros.clienteId ? "os-cliente-error" : "os-cliente-hint"}
              />
            </Field>

            <Field
              id="os-data"
              label="Data de entrada"
              required
              error={erros.dataEntrada}
              hint="Quando o equipamento chegou na oficina."
            >
              <Input
                {...fieldProps("os-data", erros.dataEntrada)}
                type="date"
                value={dataEntrada}
                max={hojeISO()}
                onChange={(event) => setDataEntrada(event.target.value)}
              />
            </Field>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Equipamentos e serviços
                <span aria-hidden className="-ml-0.5 text-destructive">
                  *
                </span>
              </span>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => setItens((atuais) => [...atuais, ITEM_VAZIO])}
                disabled={!clienteId}
              >
                <Plus />
                Adicionar item
              </Button>
            </div>

            {!clienteId ? (
              <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                Selecione o cliente para lançar os serviços.
              </p>
            ) : !equipamentosDoCliente ? (
              <p
                role="status"
                className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-6 text-sm text-muted-foreground"
              >
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Carregando equipamentos do cliente…
              </p>
            ) : equipamentosDoCliente.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-3 py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Este cliente ainda não tem equipamentos cadastrados.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCadastro({ tipo: "equipamento", indice: 0 })}
                >
                  <Plus />
                  Cadastrar equipamento
                </Button>
              </div>
            ) : (
              <ul className="space-y-2">
                {itens.map((item, indice) => (
                  <li key={indice} className="flex items-end gap-2">
                    <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                      <Select
                        value={item.equipamentoId}
                        onValueChange={(valor) =>
                          valor === CRIAR
                            ? setCadastro({ tipo: "equipamento", indice })
                            : alterarItem(indice, { equipamentoId: valor })
                        }
                      >
                        <SelectTrigger aria-label={`Equipamento do item ${indice + 1}`}>
                          <SelectValue placeholder="Equipamento" />
                        </SelectTrigger>
                        <SelectContent>
                          {equipamentosDoCliente.map((equipamento) => (
                            <SelectItem key={equipamento.id} value={String(equipamento.id)}>
                              {equipamento.nome} · {equipamento.marca.nome}
                            </SelectItem>
                          ))}
                          <CriarItem>Criar novo equipamento</CriarItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={item.servicoId}
                        onValueChange={(valor) =>
                          valor === CRIAR
                            ? setCadastro({ tipo: "servico", indice })
                            : alterarItem(indice, { servicoId: valor })
                        }
                      >
                        <SelectTrigger aria-label={`Serviço do item ${indice + 1}`}>
                          <SelectValue placeholder="Serviço" />
                        </SelectTrigger>
                        <SelectContent>
                          {servicos?.map((servico) => (
                            <SelectItem key={servico.id} value={String(servico.id)}>
                              {servico.nome} — {formatBRL(servico.valor)}
                            </SelectItem>
                          ))}
                          <CriarItem separador={(servicos?.length ?? 0) > 0}>
                            Criar novo serviço
                          </CriarItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setItens((atuais) => atuais.filter((_, i) => i !== indice))}
                      disabled={itens.length === 1}
                    >
                      <Trash2 />
                      <span className="sr-only">Remover item {indice + 1}</span>
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {erros.itens && (
              <p className="text-xs font-medium text-destructive">{erros.itens}</p>
            )}

            <div className="space-y-1.5 border-t border-border pt-2 text-sm">
              {valorManual === null ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Valor total</span>
                  <div className="flex items-center gap-1">
                    <strong className="tabular-nums">{formatBRL(total)}</strong>
                    <Button type="button" variant="ghost" size="icon-xs" onClick={fixarValor}>
                      <Pencil />
                      <span className="sr-only">Definir o valor total à mão</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor="os-valor-total" className="text-muted-foreground">
                      Valor total <span className="text-xs">(fixado à mão)</span>
                    </label>
                    <div className="relative w-40">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        R$
                      </span>
                      <Input
                        id="os-valor-total"
                        value={valorManual}
                        onChange={(event) => {
                          setValorManual(maskMoeda(event.target.value))
                          setErros((atuais) => ({ ...atuais, valorTotal: undefined }))
                        }}
                        inputMode="numeric"
                        placeholder="0,00"
                        aria-invalid={erros.valorTotal ? true : undefined}
                        className="pl-10 text-right font-medium"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">
                      Soma dos serviços: {formatBRL(total)} — o valor fixado não muda ao
                      adicionar ou remover itens.
                    </span>
                    <Button
                      type="button"
                      variant="link"
                      size="xs"
                      className="h-auto shrink-0 px-0"
                      onClick={voltarAoAutomatico}
                    >
                      Voltar ao automático
                    </Button>
                  </div>
                </>
              )}
              {erros.valorTotal && (
                <p className="text-xs font-medium text-destructive">{erros.valorTotal}</p>
              )}
            </div>
          </div>

          <Field id="os-observacao" label="Observação" optional>
            <Textarea
              id="os-observacao"
              value={observacao}
              maxLength={500}
              onChange={(event) => setObservacao(event.target.value)}
              placeholder="Combinações com o cliente, prazo, estado do equipamento…"
              rows={2}
            />
          </Field>

          {erros.geral && <AuthAlert tom="erro">{erros.geral}</AuthAlert>}
        </DialogBody>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit" disabled={enviando || carregando} aria-busy={enviando}>
            {enviando && <Loader2 className="animate-spin" aria-hidden />}
            Abrir ordem de serviço
          </Button>
        </DialogFooter>
      </DialogForm>

      {/*
        Fora do <DialogForm> de propósito: o submit desses formulários subiria
        pela árvore do React — mesmo saindo por um portal — e dispararia a
        abertura da OS junto com o cadastro.
      */}
      <ClienteDialog
        open={cadastro?.tipo === "cliente"}
        onOpenChange={fecharCadastro}
        onSalvo={trocarCliente}
      />

      {cliente && (
        <EquipamentoDialog
          open={cadastro?.tipo === "equipamento"}
          onOpenChange={fecharCadastro}
          clienteFixo={cliente}
          onSalvo={(novo) => {
            setEquipamentos((atuais) =>
              atuais && atuais.clienteId === cliente.id
                ? { ...atuais, itens: inserirOrdenado(atuais.itens, novo) }
                : atuais
            )
            if (cadastro?.tipo === "equipamento") {
              alterarItem(cadastro.indice, { equipamentoId: String(novo.id) })
            }
          }}
        />
      )}

      <ServicoDialog
        open={cadastro?.tipo === "servico"}
        onOpenChange={fecharCadastro}
        onSalvo={(novo) => {
          setServicos((atuais) => inserirOrdenado(atuais, novo))
          if (cadastro?.tipo === "servico") {
            alterarItem(cadastro.indice, { servicoId: String(novo.id) })
          }
        }}
      />
    </>
  )
}
