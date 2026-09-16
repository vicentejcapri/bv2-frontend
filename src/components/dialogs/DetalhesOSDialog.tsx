import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

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
import { useAuth } from "@/hooks/useAuth"
import { ApiError } from "@/lib/api"
import { formatBRL, formatDataBR } from "@/lib/format"
import { numeroOS } from "@/lib/os"
import { listarItensOrdem } from "@/lib/os-api"
import type { ItemOs, OrdemServico } from "@/lib/os-api"

/**
 * Leitura da ordem de serviço: cliente, o que foi feito em cada equipamento,
 * situação e total. Os itens não vêm na listagem, então são buscados aqui.
 */
export function DetalhesOSDialog({
  open,
  onOpenChange,
  ordem,
}: {
  open: boolean
  onOpenChange: (aberto: boolean) => void
  ordem?: OrdemServico
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* O conteúdo desmonta ao fechar: cada abertura busca os itens de novo. */}
        {ordem && <Detalhes ordem={ordem} />}
      </DialogContent>
    </Dialog>
  )
}

function Detalhes({ ordem }: { ordem: OrdemServico }) {
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

        <div className="flex items-baseline justify-between border-t border-border pt-3">
          <span className="text-sm text-muted-foreground">
            Valor total
            {ordem.valorTotalManual && (
              <span className="ml-1 text-xs">(fixado à mão)</span>
            )}
          </span>
          <strong className="text-lg font-semibold tabular-nums text-foreground">
            {formatBRL(ordem.valorTotal)}
          </strong>
        </div>

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
