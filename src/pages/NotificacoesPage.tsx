import { CheckCircle2, Clock, MessageSquarePlus, RotateCw, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardFlush, CardFooter } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataToolbar } from "@/components/DataToolbar"
import { Initials } from "@/components/Initials"
import { PageHeader } from "@/components/PageHeader"
import { StatCard } from "@/components/StatCard"
import {
  NotificacaoStatusBadge,
  TipoNotificacaoBadge,
} from "@/components/StatusBadge"
import { useDados } from "@/hooks/useDados"
import type { Notificacao } from "@/data/mocks"

export function NotificacoesPage() {
  const { notificacoes } = useDados()

  const contar = (status: Notificacao["status"]) =>
    notificacoes.filter((notif) => notif.status === status).length

  return (
    <>
      <PageHeader
        title="Central de Notificações"
        description="Envios automáticos via WhatsApp (n8n) e mensagens personalizadas."
        actions={
          <Button>
            <MessageSquarePlus />
            Nova mensagem
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Enviadas"
          value={String(contar("ENVIADO"))}
          hint="Confirmadas pelo n8n"
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
        <DataToolbar placeholder="Buscar por OS ou cliente…" />
        <CardFlush className="border-t-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[110px]">OS</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden md:table-cell">Gatilho</TableHead>
                <TableHead>Status n8n</TableHead>
                <TableHead className="hidden sm:table-cell text-right">
                  Data / hora
                </TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {notificacoes.map((notif) => (
                <TableRow key={notif.id} className="group">
                  <TableCell className="font-mono text-[0.8125rem] font-medium text-muted-foreground">
                    {notif.os}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Initials name={notif.cliente} className="size-7" />
                      <span className="font-medium text-foreground">
                        {notif.cliente}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="hidden md:table-cell">
                    <TipoNotificacaoBadge tipo={notif.tipo} />
                  </TableCell>

                  <TableCell>
                    <NotificacaoStatusBadge status={notif.status} />
                  </TableCell>

                  <TableCell className="hidden sm:table-cell text-right text-muted-foreground">
                    {notif.data}
                  </TableCell>

                  <TableCell className="text-right">
                    {notif.status === "FALHOU" ? (
                      <Button variant="ghost" size="icon-xs" title="Reenviar">
                        <RotateCw />
                        <span className="sr-only">Reenviar {notif.os}</span>
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardFlush>
        <CardFooter className="text-xs text-muted-foreground">
          Disparos automáticos são acionados pelo fluxo n8n na abertura e no
          encerramento do prazo da OS.
        </CardFooter>
      </Card>
    </>
  )
}
