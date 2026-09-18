import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Info, Loader2, Plus, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardFlush, CardFooter } from "@/components/ui/card"
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
import { DetalhesOSDialog } from "@/components/dialogs/DetalhesOSDialog"
import { ExcluirDialog } from "@/components/dialogs/ExcluirDialog"
import { NovaOSDialog } from "@/components/dialogs/NovaOSDialog"
import { StatusOSSelect } from "@/components/StatusOSSelect"
import { useAuth } from "@/hooks/useAuth"
import { useFeedback } from "@/hooks/useFeedback"
import { ApiError } from "@/lib/api"
import { formatBRL, formatDataBR, normalizar } from "@/lib/format"
import { numeroOS } from "@/lib/os"
import { alterarStatusOrdem, excluirOrdem, listarOrdens } from "@/lib/os-api"
import type { OrdemServico, StatusOs } from "@/lib/os-api"
import { OS_LOOK } from "@/components/StatusBadge"

export function OrdensServicoPage() {
  const { token, logout } = useAuth()
  const { falha } = useFeedback()
  const [ordens, setOrdens] = useState<OrdemServico[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [tentativa, setTentativa] = useState(0)
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
  const [busca, setBusca] = useState("")
  const [filtroStatus, setFiltroStatus] = useState<string>("TODOS")

  const verDetalhes = (ordem: OrdemServico) => {
    setDetalhe(ordem)
    setDetalheAberto(true)
  }

  useEffect(() => {
    if (!token) return
    let cancelado = false

    listarOrdens(token)
      .then((pagina) => {
        if (cancelado) return
        setOrdens(pagina.conteudo)
        setErro(null)
      })
      .catch((error) => {
        if (cancelado) return
        if (error instanceof ApiError && error.status === 401) return logout()
        setErro(
          error instanceof ApiError
            ? error.message
            : "Não foi possível carregar as ordens de serviço."
        )
      })

    return () => {
      cancelado = true
    }
  }, [token, logout, tentativa])

  const alterarStatus = async (
    ordem: OrdemServico,
    destino: Exclude<StatusOs, "EM_ANDAMENTO">
  ) => {
    if (!token || salvando) return
    setSalvando(ordem.id)
    try {
      const atualizada = await alterarStatusOrdem(token, ordem.id, destino)
      setOrdens((atuais) =>
        atuais?.map((o) => (o.id === atualizada.id ? atualizada : o)) ?? null
      )
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

  const visiveis = useMemo(() => {
    const termo = normalizar(busca.trim())
    return (ordens ?? []).filter((os) => {
      if (filtroStatus !== "TODOS" && os.status !== filtroStatus) return false
      if (!termo) return true
      return normalizar(os.cliente.nome).includes(termo) || String(os.id).includes(termo)
    })
  }, [ordens, busca, filtroStatus])

  return (
    <>
      <PageHeader
        title="Ordens de Serviço"
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
          busca={busca}
          onBuscaChange={setBusca}
        >
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-44" aria-label="Filtrar por status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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
          {erro && !ordens ? (
            <EmptyState
              title="Não foi possível carregar as ordens de serviço"
              description={erro}
              action={
                <Button variant="outline" onClick={() => setTentativa((n) => n + 1)}>
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
          ) : ordens.length === 0 ? (
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
          ) : visiveis.length === 0 ? (
            <EmptyState
              title="Nenhuma ordem encontrada"
              description="Nenhuma ordem de serviço corresponde à busca ou ao filtro."
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
                {visiveis.map((os) => (
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
        {ordens && ordens.length > 0 && (
          <CardFooter className="text-xs text-muted-foreground">
            Exibindo <strong className="text-foreground">{visiveis.length}</strong>{" "}
            de {ordens.length} {ordens.length === 1 ? "ordem" : "ordens"}
          </CardFooter>
        )}
      </Card>

      <NovaOSDialog
        open={criando}
        onOpenChange={setCriando}
        onCriada={(nova) => {
          setOrdens((atuais) => [nova, ...(atuais ?? [])])
          setAviso(`Ordem ${numeroOS(nova.id)} · aberta`)
        }}
      />

      <DetalhesOSDialog
        open={detalheAberto}
        onOpenChange={setDetalheAberto}
        ordem={detalhe ?? undefined}
        onAtualizada={(atualizada) => {
          setDetalhe(atualizada)
          setOrdens((atuais) =>
            atuais?.map((os) => (os.id === atualizada.id ? atualizada : os)) ?? null
          )
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
          setOrdens((atuais) => atuais?.filter((os) => os.id !== id) ?? null)
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
