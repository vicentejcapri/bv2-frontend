import { Link } from "react-router-dom"
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFlush,
  CardHeader,
  CardTitle,
  CardToolbar,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { OSTable } from "@/components/OSTable"
import { PageHeader } from "@/components/PageHeader"
import { StatCard } from "@/components/StatCard"
import { NotificacaoStatusBadge } from "@/components/StatusBadge"
import { NovaOSDialog } from "@/components/dialogs/NovaOSDialog"
import { useDados } from "@/hooks/useDados"
import { formatBRL, parseMoeda } from "@/lib/format"
import { numeroOS } from "@/lib/os"

export function DashboardPage() {
  const { ordens, notificacoes } = useDados()

  // Indicadores derivados das ordens, para refletirem cada OS nova.
  const emAndamento = ordens.filter((os) => os.status === "EM_ANDAMENTO")
  const concluidas = ordens.filter((os) => os.status === "CONCLUIDO")
  const entregues = ordens.filter((os) => os.status === "ENTREGUE")
  const atrasadas = ordens.filter((os) => os.atrasada)

  const faturamentoPrevisto = emAndamento.reduce(
    (soma, os) => soma + parseMoeda(os.valor),
    0
  )

  const distribuicao = [
    { label: "Em andamento", valor: emAndamento.length, className: "bg-info" },
    { label: "Concluídas", valor: concluidas.length, className: "bg-success" },
    { label: "Entregues", valor: entregues.length, className: "bg-primary" },
    { label: "Em atraso", valor: atrasadas.length, className: "bg-destructive" },
  ].filter((item) => item.valor > 0)

  const total = distribuicao.reduce((soma, item) => soma + item.valor, 0)

  return (
    <>
      <PageHeader
        title="Painel Resumo"
        description="Acompanhe a operação da oficina de um só lugar."
        actions={<NovaOSDialog />}
      />

      {/* Indicadores */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ordens de serviço em aberto"
          value={String(emAndamento.length)}
          hint="Serviços ainda na bancada"
          icon={Clock}
          tone="info"
        />
        <StatCard
          label="Em atraso"
          value={String(atrasadas.length)}
          hint="Notificações já enviadas ao cliente"
          icon={AlertCircle}
          tone="destructive"
        />
        <StatCard
          label="Concluídas no mês"
          value={String(concluidas.length)}
          hint="Comparado a maio"
          icon={CheckCircle2}
          tone="success"
          trend={{ direction: "up", value: "18%" }}
        />
        <StatCard
          label="Faturamento previsto"
          value={formatBRL(faturamentoPrevisto)}
          hint="Baseado nas ordens de serviço em andamento"
          icon={DollarSign}
          tone="accent"
        />
      </div>

      {/* Ordens recentes + painéis laterais */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardToolbar>
              <div className="space-y-1">
                <CardTitle>Ordens recentes</CardTitle>
                <CardDescription>
                  Últimos atendimentos atualizados.
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/os">
                  Ver todas
                  <ArrowRight />
                </Link>
              </Button>
            </CardToolbar>
          </CardHeader>
          <CardFlush>
            <OSTable ordens={ordens.slice(0, 5)} compact />
          </CardFlush>
        </Card>

        <div className="space-y-6">
          {/* Distribuição por status */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por status</CardTitle>
              <CardDescription>
                Total de {total}{" "}
                {total === 1 ? "ordem de serviço" : "ordens de serviço"} no
                período.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                {distribuicao.map((item) => (
                  <div
                    key={item.label}
                    className={item.className}
                    style={{ width: `${(item.valor / total) * 100}%` }}
                  />
                ))}
              </div>
              <ul className="space-y-2.5">
                {distribuicao.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center gap-2.5 text-sm"
                  >
                    <span
                      className={`size-2.5 shrink-0 rounded-full ${item.className}`}
                    />
                    <span className="flex-1 text-muted-foreground">
                      {item.label}
                    </span>
                    <span className="font-medium tabular-nums">
                      {item.valor}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Últimas notificações */}
          <Card>
            <CardHeader>
              <CardToolbar>
                <CardTitle>Últimas notificações</CardTitle>
                <Button asChild variant="ghost" size="xs">
                  <Link to="/notificacoes">
                    Ver todas
                    <ArrowRight />
                  </Link>
                </Button>
              </CardToolbar>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {notificacoes.slice(0, 4).map((notif) => (
                  <li
                    key={notif.id}
                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {notif.cliente}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        <span className="font-mono">{numeroOS(notif.os)}</span> ·{" "}
                        {notif.data}
                      </p>
                    </div>
                    <NotificacaoStatusBadge status={notif.status} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
