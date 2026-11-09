import { useEffect, useState } from "react"
import { CheckCircle2, Info, Loader2, Plus, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardFlush } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataToolbar, EmptyState } from "@/components/DataToolbar"
import { Initials } from "@/components/Initials"
import { PageHeader } from "@/components/PageHeader"
import { Paginacao } from "@/components/Paginacao"
import { DetalhesOSDialog } from "@/components/dialogs/DetalhesOSDialog"
import { ExcluirDialog } from "@/components/dialogs/ExcluirDialog"
import { NovaOSDialog } from "@/components/dialogs/NovaOSDialog"
import { StatusOSSelect } from "@/components/StatusOSSelect"
import { useAuth } from "@/hooks/useAuth"
import { useFeedback } from "@/hooks/useFeedback"
import { useListagem } from "@/hooks/useListagem"
import { ApiError } from "@/lib/api"
import { formatBRL, formatDataBR } from "@/lib/format"
import { numeroOS } from "@/lib/os"
import {
  STATUS_EM_ABERTO,
  alterarStatusOrdem,
  excluirOrdem,
  listarOrdens,
} from "@/lib/os-api"
import type { OrdemServico, StatusOs } from "@/lib/os-api"
import { OS_LOOK } from "@/components/StatusBadge"
import { AJUDA } from "@/config/ajuda"

/** "Em aberto" junta dois status numa consulta só; "TODOS" não filtra. */
type FiltroStatus = "EM_ABERTO" | "TODOS" | StatusOs

function statusDoFiltro(filtro: FiltroStatus): StatusOs[] | undefined {
  if (filtro === "TODOS") return undefined
  return filtro === "EM_ABERTO" ? STATUS_EM_ABERTO : [filtro]
}

export function OrdensServicoPage() {
  const { token, logout } = useAuth()
  const { falha } = useFeedback()
  /** Id da OS com PATCH em voo — trava só aquele seletor. */
  const [salvando, setSalvando] = useState<number | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  // A OS fica guardada depois de fechar para o modal não esvaziar na animação de saída.
  const [detalhe, setDetalhe] = useState<OrdemServico | null>(null)
  const [detalheAberto, setDetalheAberto] = useState(false)
  // A OS em exclusão fica guardada depois de fechar, para o texto não sumir na animação.
  const [excluindo, setExcluindo] = useState<OrdemServico | null>(null)
  const [excluirAberto, setExcluirAberto] = useState(false)

  const [criando, setCriando] = useState(false)
  // Abre só com o que ainda está na oficina: entregues e canceladas só sob pedido.
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("EM_ABERTO")

  const lista = useListagem(
    listarOrdens,
    { status: statusDoFiltro(filtroStatus) },
    { mensagemErro: "Não foi possível carregar as ordens de serviço." }
  )
  const ordens = lista.itens
  const filtrando = lista.buscando || filtroStatus !== "TODOS"
  const substituir = (atualizada: OrdemServico) =>
    lista.substituir(atualizada, (a, b) => a.id === b.id)

  const verDetalhes = (ordem: OrdemServico) => {
    setDetalhe(ordem)
    setDetalheAberto(true)
  }

  const alterarStatus = async (
    ordem: OrdemServico,
    destino: Exclude<StatusOs, "EM_ANDAMENTO">
  ) => {
    if (!token || salvando) return
    setSalvando(ordem.id)
    try {
      const atualizada = await alterarStatusOrdem(token, ordem.id, destino)
      substituir(atualizada)
      setAviso(`Ordem ${numeroOS(ordem.id)} · ${OS_LOOK[destino].label.toLowerCase()}`)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return logout()
      falha({
        // 422 = transição barrada pela máquina de estados do backend.
        titulo: "Não foi possível alterar o status",
        descricao:
          error instanceof ApiError
            ? error.message
            : "Algo deu errado. Tente novamente.",
      })
    } finally {
      setSalvando(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Ordens de Serviço"
        ajuda={AJUDA.ordensServico}
        description="Gerencie e acompanhe os serviços em andamento."
        actions={
          <Button variant="accent" onClick={() => setCriando(true)}>
            <Plus />
            Nova ordem de serviço
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <DataToolbar
          placeholder="Buscar por número da ordem ou cliente…"
          busca={lista.busca}
          onBuscaChange={lista.setBusca}
        >
          <Select
            value={filtroStatus}
            onValueChange={(valor) => setFiltroStatus(valor as FiltroStatus)}
          >
            <SelectTrigger className="w-44" aria-label="Filtrar por status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EM_ABERTO">Em aberto</SelectItem>
              <SelectItem value="TODOS">Todos os status</SelectItem>
              {Object.entries(OS_LOOK).map(([valor, look]) => (
                <SelectItem key={valor} value={valor}>
                  {look.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DataToolbar>
        <CardFlush className="border-t-0">
          {lista.erro && !ordens ? (
            <EmptyState
              title="Não foi possível carregar as ordens de serviço"
              description={lista.erro}
              action={
                <Button variant="outline" onClick={lista.recarregar}>
                  Tentar novamente
                </Button>
              }
            />
          ) : !ordens ? (
            <div
              className="flex items-center justify-center gap-2 px-5 py-14 text-sm text-muted-foreground"
              role="status"
            >
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Carregando ordens de serviço…
            </div>
          ) : ordens.length === 0 && !filtrando ? (
            <EmptyState
              title="Nenhuma ordem de serviço"
              description="As ordens abertas para os clientes aparecem aqui."
              action={
                <Button variant="accent" onClick={() => setCriando(true)}>
                  <Plus />
                  Nova ordem de serviço
                </Button>
              }
            />
          ) : ordens.length === 0 ? (
            <EmptyState
              title="Nenhuma ordem encontrada"
              description={
                filtroStatus === "EM_ABERTO" && !lista.buscando
                  ? "Nenhuma ordem em aberto. Para ver entregues e canceladas, mude o filtro de status."
                  : "Nenhuma ordem de serviço corresponde à busca ou ao filtro."
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[110px]">Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Entrada</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordens.map((os) => (
                  <TableRow key={os.id} className="group">
                    <TableCell className="font-mono text-[0.8125rem] font-medium text-muted-foreground">
                      {numeroOS(os.id)}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Initials name={os.cliente.nome} className="size-7" />
                        <span className="font-medium text-foreground">
                          {os.cliente.nome}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <StatusOSSelect
                        status={os.status}
                        rotulo={`ordem ${numeroOS(os.id)} de ${os.cliente.nome}`}
                        salvando={salvando === os.id}
                        onSelecionar={(destino) => alterarStatus(os, destino)}
                      />
                    </TableCell>

                    <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">
                      {formatDataBR(os.dataEntrada)}
                    </TableCell>

                    <TableCell className="whitespace-nowrap text-right font-medium">
                      {formatBRL(os.valorTotal)}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => verDetalhes(os)}
                          className="transition-opacity focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <Info />
                          <span className="sr-only">
                            Ver detalhes da ordem {numeroOS(os.id)}
                          </span>
                        </Button>
                        {/* Concluída e entregue entram no faturamento: só o backend
                            recusaria, mas o botão nem aparece para elas. */}
                        {(os.status === "EM_ANDAMENTO" || os.status === "CANCELADA") && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => {
                              setExcluindo(os)
                              setExcluirAberto(true)
                            }}
                            className="text-destructive transition-opacity hover:bg-destructive-soft focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                          >
                            <Trash2 />
                            <span className="sr-only">
                              Excluir a ordem {numeroOS(os.id)}
                            </span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardFlush>
        {lista.pagina && lista.pagina.totalElementos > 0 && (
          <Paginacao
            pagina={lista.pagina}
            carregando={lista.carregando}
            onIrPara={lista.irPara}
            singular="ordem"
            plural="ordens"
          />
        )}
      </Card>

      <NovaOSDialog
        open={criando}
        onOpenChange={setCriando}
        onCriada={(nova) => {
          lista.recarregar()
          setAviso(`Ordem ${numeroOS(nova.id)} · aberta`)
        }}
      />

      <DetalhesOSDialog
        open={detalheAberto}
        onOpenChange={setDetalheAberto}
        ordem={detalhe ?? undefined}
        onAtualizada={(atualizada) => {
          setDetalhe(atualizada)
          substituir(atualizada)
        }}
      />

      <ExcluirDialog
        open={excluirAberto}
        onOpenChange={setExcluirAberto}
        titulo="Excluir ordem de serviço"
        nome={excluindo ? `Ordem ${numeroOS(excluindo.id)} de ${excluindo.cliente.nome}` : undefined}
        detalhe={
          <p className="rounded-lg bg-destructive-soft px-3 py-2.5 text-sm text-destructive-soft-foreground">
            Os <strong className="font-medium">itens lançados</strong> e o{" "}
            <strong className="font-medium">histórico de notificações</strong> desta ordem
            vão junto. Para tirar a ordem de circulação sem perder o histórico, cancele-a.
          </p>
        }
        mensagemConflito="Esta ordem de serviço tem vínculos que impedem a exclusão."
        excluir={(token) =>
          excluindo ? excluirOrdem(token, excluindo.id) : Promise.resolve()
        }
        onExcluido={() => {
          if (!excluindo) return
          const { id } = excluindo
          lista.recarregar()
          setAviso(`Ordem ${numeroOS(id)} · excluída`)
        }}
      />

      <AvisoRapido mensagem={aviso} onFechar={() => setAviso(null)} />
    </>
  )
}

/** Confirmação discreta da última ação, no canto inferior direito. */
function AvisoRapido({
  mensagem,
  onFechar,
}: {
  mensagem: string | null
  onFechar: () => void
}) {
  useEffect(() => {
    if (!mensagem) return
    const id = setTimeout(onFechar, 3500)
    return () => clearTimeout(id)
  }, [mensagem, onFechar])

  if (!mensagem) return null

  return (
    <div
      role="status"
      className="fixed bottom-5 right-5 z-50 flex animate-fade-up items-center gap-2.5 rounded-lg bg-success-soft px-4 py-3 text-sm text-success-soft-foreground shadow-overlay"
    >
      <CheckCircle2 className="size-4 shrink-0" aria-hidden />
      <strong className="font-medium">{mensagem}</strong>
      <button
        type="button"
        onClick={onFechar}
        className="-mr-1 ml-1 rounded p-1 opacity-70 transition-opacity hover:opacity-100"
      >
        <X className="size-3.5" aria-hidden />
        <span className="sr-only">Fechar aviso</span>
      </button>
    </div>
  )
}
