import { CheckCircle2, Clock, RotateCw, TriangleAlert } from "lucide-react"

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
import { GerenciarNotificacoesDialog } from "@/components/dialogs/GerenciarNotificacoesDialog"
import { Initials } from "@/components/Initials"
import { PageHeader } from "@/components/PageHeader"
import { StatCard } from "@/components/StatCard"
import {
  NotificacaoStatusBadge,
  TipoNotificacaoBadge,
} from "@/components/StatusBadge"
import { useDados } from "@/hooks/useDados"
import { numeroOS } from "@/lib/os"
import type { Notificacao } from "@/data/mocks"

export function NotificacoesPage() {
  const { notificacoes } = useDados()

  const contar = (status: Notificacao["status"]) =>
    notificacoes.filter((notif) => notif.status === status).length

  return (
    <>
      <PageHeader
        title="Central de Notificações"
        description="Envios automáticos via WhatsApp."
        actions={<GerenciarNotificacoesDialog />}
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
        <DataToolbar placeholder="Buscar por ordem de serviço ou cliente…" />
        <CardFlush className="border-t-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[160px]">Ordem de serviço</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden md:table-cell">Gatilho</TableHead>
                <TableHead>Status</TableHead>
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
                    {numeroOS(notif.os)}
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
                        <span className="sr-only">
                          Reenviar notificação da ordem de serviço{" "}
                          {numeroOS(notif.os)}
                        </span>
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardFlush>
        <CardFooter className="text-xs text-muted-foreground">
          Disparos automáticos são acionados quando a ordem de
          serviço é concluída e/ou quando é entregue, a depender do que foi configurado.
        </CardFooter>
      </Card>
    </>
  )
}
