import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Clock, Loader2, Settings, TriangleAlert } from "lucide-react"

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
import { StatCard } from "@/components/StatCard"
import { NotificacaoStatusBadge } from "@/components/StatusBadge"
import { GerenciarNotificacoesDialog } from "@/components/dialogs/GerenciarNotificacoesDialog"
import { useAuth } from "@/hooks/useAuth"
import { ApiError } from "@/lib/api"
import { normalizar } from "@/lib/format"
import { listarNotificacoes } from "@/lib/notificacao-api"
import type { Notificacao, StatusNotificacao } from "@/lib/notificacao-api"
import { numeroOS } from "@/lib/os"

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
  const [notificacoes, setNotificacoes] = useState<Notificacao[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [tentativa, setTentativa] = useState(0)
  const [busca, setBusca] = useState("")
  const [filtro, setFiltro] = useState("TODOS")
  const [gerenciando, setGerenciando] = useState(false)

  useEffect(() => {
    if (!token) return
    let cancelado = false

    listarNotificacoes(token)
      .then((pagina) => {
        if (cancelado) return
        setNotificacoes(pagina.conteudo)
        setErro(null)
      })
      .catch((error) => {
        if (cancelado) return
        if (error instanceof ApiError && error.status === 401) return logout()
        setErro(
          error instanceof ApiError
            ? error.message
            : "Não foi possível carregar as notificações."
        )
      })

    return () => {
      cancelado = true
    }
  }, [token, logout, tentativa])

  const contar = (status: StatusNotificacao) =>
    notificacoes?.filter((n) => n.status === status).length ?? 0

  const visiveis = useMemo(() => {
    const termo = normalizar(busca.trim())
    return (notificacoes ?? []).filter((n) => {
      if (filtro !== "TODOS" && n.status !== filtro) return false
      if (!termo) return true
      return (
        normalizar(n.cliente.nome).includes(termo) ||
        String(n.ordemServicoId).includes(termo) ||
        normalizar(n.conteudo).includes(termo)
      )
    })
  }, [notificacoes, busca, filtro])

  return (
    <>
      <PageHeader
        title="Notificações"
        description="Envios automáticos via WhatsApp."
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
          value={String(contar("ENVIADO"))}
          hint="Confirmadas pelo WhatsApp"
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Pendentes"
          value={String(contar("PENDENTE"))}
          hint="Na fila de disparo"
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="Com falha"
          value={String(contar("FALHOU"))}
          hint="Requerem reenvio manual"
          icon={TriangleAlert}
          tone="destructive"
        />
      </div>

      <Card className="overflow-hidden">
        <DataToolbar
          placeholder="Buscar por cliente, ordem de serviço ou mensagem…"
          busca={busca}
          onBuscaChange={setBusca}
        >
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
          {erro && !notificacoes ? (
            <EmptyState
              title="Não foi possível carregar as notificações"
              description={erro}
              action={
                <Button variant="outline" onClick={() => setTentativa((n) => n + 1)}>
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
          ) : notificacoes.length === 0 ? (
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
          ) : visiveis.length === 0 ? (
            <EmptyState
              title="Nenhum envio encontrado"
              description="Nenhum envio corresponde à busca ou ao filtro."
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
                {visiveis.map((notif) => (
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
        <CardFooter className="text-xs text-muted-foreground">
          As notificações saem sozinhas quando a ordem de serviço muda para um
          status com notificação ligada.
        </CardFooter>
      </Card>

      <GerenciarNotificacoesDialog
        open={gerenciando}
        onOpenChange={setGerenciando}
        onSalvo={() => setTentativa((n) => n + 1)}
      />
    </>
  )
}
