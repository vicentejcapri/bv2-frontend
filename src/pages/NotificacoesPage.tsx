import { useEffect, useState } from "react"
import { CheckCircle2, Clock, Loader2, Settings, TriangleAlert } from "lucide-react"

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
import { StatCard } from "@/components/StatCard"
import { NotificacaoStatusBadge } from "@/components/StatusBadge"
import { GerenciarNotificacoesDialog } from "@/components/dialogs/GerenciarNotificacoesDialog"
import { useAuth } from "@/hooks/useAuth"
import { useListagem } from "@/hooks/useListagem"
import { ApiError } from "@/lib/api"
import { diasAtrasISO } from "@/lib/format"
import { listarNotificacoes } from "@/lib/notificacao-api"
import type { StatusNotificacao } from "@/lib/notificacao-api"
import { numeroOS } from "@/lib/os"

/** Janela padrão da tela: o log cresce para sempre, a primeira carga não. */
const PERIODOS: { valor: string; label: string; dias: number | null }[] = [
  { valor: "7", label: "Últimos 7 dias", dias: 7 },
  { valor: "30", label: "Últimos 30 dias", dias: 30 },
  { valor: "90", label: "Últimos 90 dias", dias: 90 },
  { valor: "TODOS", label: "Todo o período", dias: null },
]

const FILTROS: { valor: string; label: string }[] = [
  { valor: "TODOS", label: "Todos os envios" },
  { valor: "ENVIADO", label: "Enviados" },
  { valor: "PENDENTE", label: "Pendentes" },
  { valor: "FALHOU", label: "Com falha" },
]

/** "2026-09-15T14:32:00" -> "15/09/2026 14:32" */
function formatarMomento(iso: string | null) {
  if (!iso) return "—"
  const data = new Date(iso)
  return data
    .toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
    .replace(",", "")
}

export function NotificacoesPage() {
  const { token, logout } = useAuth()
  const [filtro, setFiltro] = useState("TODOS")
  const [periodo, setPeriodo] = useState("30")
  const [gerenciando, setGerenciando] = useState(false)

  const dias = PERIODOS.find((p) => p.valor === periodo)?.dias ?? null
  const recorte = { dataInicio: dias === null ? undefined : diasAtrasISO(dias) }

  const lista = useListagem(
    listarNotificacoes,
    {
      ...recorte,
      status: filtro === "TODOS" ? undefined : (filtro as StatusNotificacao),
    },
    { mensagemErro: "Não foi possível carregar as notificações." }
  )
  const notificacoes = lista.itens
  const filtrando = lista.buscando || filtro !== "TODOS" || dias !== null

  // Os cartões contam no servidor (size=1, só o totalElementos importa), no mesmo
  // período da tabela: a página carregada não serve, ela tem só 20 envios.
  const [contagem, setContagem] = useState<Record<StatusNotificacao, number> | null>(null)
  const { recarregar } = lista
  const [versaoContagem, setVersaoContagem] = useState(0)
  const dataInicio = recorte.dataInicio
  useEffect(() => {
    if (!token) return
    let cancelado = false
    const status: StatusNotificacao[] = ["ENVIADO", "PENDENTE", "FALHOU"]
    Promise.all(
      status.map((s) => listarNotificacoes(token, { status: s, dataInicio, size: 1 }))
    )
      .then(([enviados, pendentes, falhas]) => {
        if (cancelado) return
        setContagem({
          ENVIADO: enviados.totalElementos,
          PENDENTE: pendentes.totalElementos,
          FALHOU: falhas.totalElementos,
        })
      })
      .catch((error) => {
        if (cancelado) return
        if (error instanceof ApiError && error.status === 401) return logout()
      })
    return () => {
      cancelado = true
    }
  }, [token, logout, dataInicio, versaoContagem])

  const contar = (status: StatusNotificacao) =>
    contagem ? String(contagem[status]) : "—"

  const recarregarTudo = () => {
    recarregar()
    setVersaoContagem((n) => n + 1)
  }

  return (
    <>
      <PageHeader
        title="Notificações"
        description="Envios automáticos via WhatsApp, disparados quando a ordem de serviço muda para um status com notificação ligada."
        actions={
          <Button onClick={() => setGerenciando(true)}>
            <Settings />
            Gerenciar notificações
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Enviadas"
          value={contar("ENVIADO")}
          hint={dias === null ? "Confirmadas pelo WhatsApp" : `Nos últimos ${dias} dias`}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Pendentes"
          value={contar("PENDENTE")}
          hint={dias === null ? "Na fila de disparo" : `Nos últimos ${dias} dias`}
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="Com falha"
          value={contar("FALHOU")}
          hint={dias === null ? "Requerem reenvio manual" : `Nos últimos ${dias} dias`}
          icon={TriangleAlert}
          tone="destructive"
        />
      </div>

      <Card className="overflow-hidden">
        <DataToolbar
          placeholder="Buscar por cliente, ordem de serviço ou mensagem…"
          busca={lista.busca}
          onBuscaChange={lista.setBusca}
        >
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-40" aria-label="Filtrar por período">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODOS.map((opcao) => (
                <SelectItem key={opcao.valor} value={opcao.valor}>
                  {opcao.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtro} onValueChange={setFiltro}>
            <SelectTrigger className="w-44" aria-label="Filtrar por resultado do envio">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FILTROS.map((opcao) => (
                <SelectItem key={opcao.valor} value={opcao.valor}>
                  {opcao.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DataToolbar>

        <CardFlush className="border-t-0">
          {lista.erro && !notificacoes ? (
            <EmptyState
              title="Não foi possível carregar as notificações"
              description={lista.erro}
              action={
                <Button variant="outline" onClick={recarregarTudo}>
                  Tentar novamente
                </Button>
              }
            />
          ) : !notificacoes ? (
            <div
              className="flex items-center justify-center gap-2 px-5 py-14 text-sm text-muted-foreground"
              role="status"
            >
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Carregando notificações…
            </div>
          ) : notificacoes.length === 0 && !filtrando ? (
            <EmptyState
              title="Nenhuma notificação enviada"
              description="Os envios aparecem aqui quando uma ordem de serviço muda para um status com notificação ligada."
              action={
                <Button variant="outline" onClick={() => setGerenciando(true)}>
                  <Settings />
                  Gerenciar notificações
                </Button>
              }
            />
          ) : notificacoes.length === 0 ? (
            <EmptyState
              title="Nenhum envio encontrado"
              description="Nenhum envio corresponde à busca ou aos filtros. Experimente ampliar o período."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[110px]">Ordem de serviço</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Envio</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">
                    Horário de envio
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notificacoes.map((notif) => (
                  <TableRow key={notif.id} className="group">
                    <TableCell className="font-mono text-[0.8125rem] font-medium text-muted-foreground">
                      {numeroOS(notif.ordemServicoId)}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Initials name={notif.cliente.nome} className="size-7" />
                        <span className="font-medium text-foreground">
                          {notif.cliente.nome}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <NotificacaoStatusBadge status={notif.status} />
                        {notif.tentativas > 1 && (
                          <span className="text-xs text-muted-foreground">
                            {notif.tentativas} tentativas
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="hidden whitespace-nowrap text-right text-muted-foreground sm:table-cell">
                      {formatarMomento(notif.dataEnvio ?? notif.criadoEm)}
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
            singular="envio"
            plural="envios"
          />
        )}
      </Card>

      <GerenciarNotificacoesDialog
        open={gerenciando}
        onOpenChange={setGerenciando}
        onSalvo={recarregarTudo}
      />
    </>
  )
}
