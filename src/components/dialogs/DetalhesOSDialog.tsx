import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { Loader2, Pencil } from "lucide-react"

import { AuthAlert } from "@/components/layout/AuthShell"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { OSStatusBadge } from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/useAuth"
import { ApiError } from "@/lib/api"
import { formatBRL, formatDataBR, maskMoeda, parseMoeda } from "@/lib/format"
import { numeroOS } from "@/lib/os"
import { definirValorTotalOrdem, listarItensOrdem } from "@/lib/os-api"
import type { ItemOs, OrdemServico } from "@/lib/os-api"

/**
 * Leitura da ordem de serviço: cliente, o que foi feito em cada equipamento,
 * situação e total. Os itens não vêm na listagem, então são buscados aqui. O
 * valor total é a única coisa editável, e só enquanto a OS está em andamento.
 */
export function DetalhesOSDialog({
  open,
  onOpenChange,
  ordem,
  onAtualizada,
}: {
  open: boolean
  onOpenChange: (aberto: boolean) => void
  ordem?: OrdemServico
  /** A OS voltou do servidor com o valor total novo. */
  onAtualizada: (ordem: OrdemServico) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* O conteúdo desmonta ao fechar: cada abertura busca os itens de novo. */}
        {ordem && <Detalhes ordem={ordem} onAtualizada={onAtualizada} />}
      </DialogContent>
    </Dialog>
  )
}

function Detalhes({
  ordem,
  onAtualizada,
}: {
  ordem: OrdemServico
  onAtualizada: (ordem: OrdemServico) => void
}) {
  const { token, logout } = useAuth()
  const [itens, setItens] = useState<ItemOs[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelado = false

    listarItensOrdem(token, ordem.id)
      .then((lista) => !cancelado && setItens(lista))
      .catch((error) => {
        if (cancelado) return
        if (error instanceof ApiError && error.status === 401) return logout()
        setErro(
          error instanceof ApiError
            ? error.message
            : "Não foi possível carregar os itens da ordem de serviço."
        )
      })

    return () => {
      cancelado = true
    }
  }, [token, logout, ordem.id])

  return (
    <>
      <DialogHeader>
        <DialogTitle>Ordem de serviço {numeroOS(ordem.id)}</DialogTitle>
        <DialogDescription>
          Aberta em {formatDataBR(ordem.dataEntrada)} para {ordem.cliente.nome}.
        </DialogDescription>
      </DialogHeader>

      <DialogBody className="space-y-4">
        <dl className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/40 p-3 text-sm sm:grid-cols-3">
          <Dado rotulo="Cliente" className="col-span-2 sm:col-span-1">
            <span className="font-medium text-foreground">{ordem.cliente.nome}</span>
          </Dado>
          <Dado rotulo="Status">
            <OSStatusBadge status={ordem.status} />
          </Dado>
          <Dado rotulo="Entrada">
            <span className="text-foreground">{formatDataBR(ordem.dataEntrada)}</span>
          </Dado>
        </dl>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Equipamentos e serviços
          </p>

          {erro ? (
            <AuthAlert tom="erro">{erro}</AuthAlert>
          ) : !itens ? (
            <div
              className="flex items-center gap-2 px-1 py-6 text-sm text-muted-foreground"
              role="status"
            >
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Carregando itens…
            </div>
          ) : itens.length === 0 ? (
            <p className="px-1 py-6 text-sm text-muted-foreground">
              Esta ordem de serviço ainda não tem itens.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {itens.map((item) => (
                <li key={item.id} className="flex items-start gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      {item.equipamento.nome}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {item.servico.nome}
                    </p>
                    {item.observacao && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.observacao}
                      </p>
                    )}
                  </div>
                  <span className="whitespace-nowrap text-sm font-medium tabular-nums">
                    {formatBRL(item.servico.valor)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <ValorTotal ordem={ordem} onAtualizada={onAtualizada} />

        {ordem.observacao && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Observação
            </p>
            <p className="whitespace-pre-line text-sm text-muted-foreground">
              {ordem.observacao}
            </p>
          </div>
        )}
      </DialogBody>
    </>
  )
}

/** Valor máximo aceito pelo backend: 7 inteiros e 2 decimais. */
const VALOR_MAXIMO = 9_999_999.99

/**
 * Total da OS com edição no lugar. Fixar um valor congela o total (desconto,
 * preço fechado); "voltar ao automático" devolve o total à soma dos serviços.
 */
function ValorTotal({
  ordem,
  onAtualizada,
}: {
  ordem: OrdemServico
  onAtualizada: (ordem: OrdemServico) => void
}) {
  const { token, logout } = useAuth()
  const [editando, setEditando] = useState(false)
  const [valor, setValor] = useState("")
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const editavel = ordem.status === "EM_ANDAMENTO"

  const abrirEdicao = () => {
    setValor(maskMoeda(String(Math.round(ordem.valorTotal * 100))))
    setErro(null)
    setEditando(true)
  }

  const salvar = async (valorTotal: number | null) => {
    if (enviando || !token) return
    setEnviando(true)
    setErro(null)
    try {
      onAtualizada(await definirValorTotalOrdem(token, ordem.id, valorTotal))
      setEditando(false)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return logout()
      setErro(
        error instanceof ApiError
          ? (error.erros?.valorTotal ?? error.message)
          : "Não foi possível alterar o valor total."
      )
    } finally {
      setEnviando(false)
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!valor) return setErro("Informe o valor total.")
    const numero = parseMoeda(valor)
    if (numero > VALOR_MAXIMO) return setErro("O valor máximo é R$ 9.999.999,99.")
    salvar(numero)
  }

  if (editando) {
    return (
      <form onSubmit={handleSubmit} noValidate className="space-y-2 border-t border-border pt-3">
        <label htmlFor="os-valor-total" className="text-sm text-muted-foreground">
          Valor total
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              R$
            </span>
            <Input
              id="os-valor-total"
              value={valor}
              onChange={(event) => setValor(maskMoeda(event.target.value))}
              inputMode="numeric"
              placeholder="0,00"
              aria-invalid={erro ? true : undefined}
              className="pl-10 text-right font-medium"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditando(false)}
              disabled={enviando}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={enviando} aria-busy={enviando}>
              {enviando && <Loader2 className="animate-spin" aria-hidden />}
              Salvar
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Um valor fixado não muda mais ao adicionar ou remover itens.
        </p>
        {erro && <AuthAlert tom="erro">{erro}</AuthAlert>}
      </form>
    )
  }

  return (
    <div className="space-y-2 border-t border-border pt-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          Valor total
          {ordem.valorTotalManual && (
            <span className="ml-1 text-xs">(fixado à mão)</span>
          )}
        </span>
        <div className="flex items-center gap-1">
          <strong className="text-lg font-semibold tabular-nums text-foreground">
            {formatBRL(ordem.valorTotal)}
          </strong>
          {editavel && (
            <Button variant="ghost" size="icon-xs" onClick={abrirEdicao}>
              <Pencil />
              <span className="sr-only">Editar valor total</span>
            </Button>
          )}
        </div>
      </div>
      {editavel && ordem.valorTotalManual && (
        <div className="flex justify-end">
          <Button
            variant="link"
            size="xs"
            className="h-auto px-0"
            disabled={enviando}
            onClick={() => salvar(null)}
          >
            {enviando && <Loader2 className="animate-spin" aria-hidden />}
            Voltar ao valor automático (soma dos serviços)
          </Button>
        </div>
      )}
      {erro && <AuthAlert tom="erro">{erro}</AuthAlert>}
    </div>
  )
}

function Dado({
  rotulo,
  className,
  children,
}: {
  rotulo: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      <dt className="text-xs text-muted-foreground">{rotulo}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  )
}
