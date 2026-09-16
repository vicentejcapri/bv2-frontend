import { useMemo, useState } from "react"
import type { ReactNode } from "react"
import {
  ClipboardList,
  DollarSign,
  Receipt,
  RotateCw,
  Wallet,
} from "lucide-react"

import { AuthAlert } from "@/components/layout/AuthShell"
import {
  BarraEmpilhada,
  BarrasRanking,
  ColunasMensais,
} from "@/components/dashboard/charts"
import { PageHeader } from "@/components/PageHeader"
import { StatCard } from "@/components/StatCard"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { usePainel } from "@/hooks/usePainel"
import { formatBRL, formatDataBR, mesPorExtenso } from "@/lib/format"
import type { Painel, Periodo, StatusOS } from "@/lib/painel-api"
import { cn } from "@/lib/utils"

type PresetId = "30d" | "90d" | "12m" | "ano"

const PRESETS: { id: PresetId; label: string }[] = [
  { id: "30d", label: "30 dias" },
  { id: "90d", label: "90 dias" },
  { id: "12m", label: "12 meses" },
  { id: "ano", label: "Este ano" },
]

function isoLocal(data: Date) {
  const mes = String(data.getMonth() + 1).padStart(2, "0")
  const dia = String(data.getDate()).padStart(2, "0")
  return `${data.getFullYear()}-${mes}-${dia}`
}

/** Janela de cada atalho, inclusiva nas duas pontas como o backend. */
function periodoDo(preset: PresetId): Periodo {
  const hoje = new Date()
  const inicio = new Date(hoje)
  if (preset === "30d") inicio.setDate(hoje.getDate() - 29)
  if (preset === "90d") inicio.setDate(hoje.getDate() - 89)
  if (preset === "12m") inicio.setMonth(hoje.getMonth() - 11, 1)
  if (preset === "ano") inicio.setMonth(0, 1)
  return { dataInicio: isoLocal(inicio), dataFim: isoLocal(hoje) }
}

const STATUS: { chave: StatusOS; label: string; cor: string }[] = [
  { chave: "EM_ANDAMENTO", label: "Em andamento", cor: "var(--chart-1)" },
  { chave: "CONCLUIDA", label: "Concluídas", cor: "var(--chart-2)" },
  { chave: "ENTREGUE", label: "Entregues", cor: "var(--chart-3)" },
  { chave: "CANCELADA", label: "Canceladas", cor: "var(--chart-4)" },
]

const BRL_COMPACTO = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
})

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`

export function DashboardPage() {
  const [preset, setPreset] = useState<PresetId>("30d")
  // Recalcula só ao trocar de atalho, para não refazer a busca a cada render.
  const periodo = useMemo(() => periodoDo(preset), [preset])
  const { painel, erro, carregando, recarregar } = usePainel(periodo)

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={
          painel
            ? `Período de ${formatDataBR(painel.periodo.dataInicio)} a ${formatDataBR(painel.periodo.dataFim)}.`
            : "Visão geral da operação da oficina."
        }
        actions={<SeletorPeriodo valor={preset} onChange={setPreset} />}
      />

      {erro && (
        <AuthAlert tom="erro">
          <span className="mr-2">{erro}</span>
          <Button variant="outline" size="xs" onClick={recarregar}>
            <RotateCw />
            Tentar novamente
          </Button>
        </AuthAlert>
      )}

      {!painel ? (
        !erro && <DashboardSkeleton />
      ) : (
        <div
          aria-busy={carregando}
          className={cn(
            "space-y-6 transition-opacity",
            carregando && "pointer-events-none opacity-60"
          )}
        >
          <Conteudo painel={painel} />
        </div>
      )}
    </>
  )
}

function SeletorPeriodo({
  valor,
  onChange,
}: {
  valor: PresetId
  onChange: (preset: PresetId) => void
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Período"
      className="inline-flex rounded-lg border border-border bg-card p-0.5"
    >
      {PRESETS.map((item) => (
        <button
          key={item.id}
          type="button"
          role="radio"
          aria-checked={valor === item.id}
          onClick={() => onChange(item.id)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
            valor === item.id
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

function Conteudo({ painel }: { painel: Painel }) {
  const { faturamento, resumo, serieMensal, rankings } = painel
  const ordensNoPeriodo = serieMensal.reduce((soma, p) => soma + p.ordensAbertas, 0)

  return (
    <>
      {/* Indicadores do período */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Faturamento realizado"
          value={formatBRL(faturamento.faturamentoRealizado)}
          hint={
            plural(faturamento.ordensEntregues, "OS entregue", "OS entregues") +
            (faturamento.ordensComValorManual > 0
              ? ` · ${faturamento.ordensComValorManual} com valor manual`
              : "")
          }
          icon={DollarSign}
          tone="success"
        />
        <StatCard
          label="Faturamento em aberto"
          value={formatBRL(faturamento.faturamentoEmAberto)}
          hint="OS em andamento e concluídas, ainda não entregues"
          icon={Wallet}
          tone="warning"
        />
        <StatCard
          label="Ticket médio"
          value={formatBRL(faturamento.ticketMedio)}
          hint="Por OS entregue no período"
          icon={Receipt}
          tone="accent"
        />
        <StatCard
          label="Ordens abertas"
          value={String(ordensNoPeriodo)}
          hint="Entradas registradas no período"
          icon={ClipboardList}
          tone="info"
        />
      </div>

      {/* Séries mensais: duas escalas diferentes, então dois gráficos (nunca eixo duplo). */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GraficoMensal
          titulo="Faturamento por mês"
          descricao="Valor das OS entregues em cada mês."
          pontos={serieMensal.map((p) => ({ mes: p.mes, valor: p.faturamento }))}
          formatarEixo={(v) => (v === 0 ? "0" : BRL_COMPACTO.format(v))}
          formatarValor={formatBRL}
        />
        <GraficoMensal
          titulo="Ordens abertas por mês"
          descricao="Quantidade de OS que deram entrada em cada mês."
          pontos={serieMensal.map((p) => ({ mes: p.mes, valor: p.ordensAbertas }))}
          formatarEixo={(v) => (Number.isInteger(v) ? String(v) : v.toLocaleString("pt-BR"))}
          formatarValor={(v) => plural(v, "ordem", "ordens")}
        />
      </div>

      {/* Situação atual + rankings do período */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Situação atual</CardTitle>
            <CardDescription>Todas as OS, independente do período.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <BarraEmpilhada
              fatias={STATUS.map((s) => ({
                ...s,
                valor: resumo.ordensPorStatus[s.chave] ?? 0,
              }))}
            />
            <dl className="grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
              <Contagem rotulo="Clientes ativos" valor={resumo.clientesAtivos} />
              <Contagem rotulo="Equipamentos" valor={resumo.equipamentos} />
              <Contagem rotulo="Serviços ativos" valor={resumo.servicosAtivos} />
            </dl>
          </CardContent>
        </Card>

        <CardRanking titulo="Serviços mais executados">
          <BarrasRanking
            itens={rankings.servicosMaisExecutados.map((s) => ({
              id: s.id,
              nome: s.nome,
              valor: s.quantidade,
            }))}
            formatarValor={(v) => `${v}×`}
          />
        </CardRanking>

        <CardRanking titulo="Clientes por faturamento">
          <BarrasRanking
            itens={rankings.clientesPorFaturamento.map((c) => ({
              id: c.id,
              nome: c.nome,
              valor: c.faturamento,
              detalhe: plural(c.ordensEntregues, "OS", "OS"),
            }))}
            formatarValor={formatBRL}
          />
        </CardRanking>

        <CardRanking titulo="Marcas mais atendidas">
          <BarrasRanking
            itens={rankings.marcasMaisAtendidas.map((m) => ({
              id: m.id,
              nome: m.nome,
              valor: m.quantidade,
            }))}
            formatarValor={(v) => plural(v, "atendimento", "atendimentos")}
          />
        </CardRanking>
      </div>
    </>
  )
}

function GraficoMensal({
  titulo,
  descricao,
  pontos,
  formatarEixo,
  formatarValor,
}: {
  titulo: string
  descricao: string
  pontos: { mes: string; valor: number }[]
  formatarEixo: (valor: number) => string
  formatarValor: (valor: number) => string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
        <CardDescription>{descricao}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ColunasMensais
          pontos={pontos}
          formatarEixo={formatarEixo}
          formatarValor={formatarValor}
        />

        {/* Equivalente em tabela: o tooltip nunca é o único jeito de ler um valor. */}
        <details className="group text-sm">
          <summary className="cursor-pointer select-none text-xs font-medium text-muted-foreground hover:text-foreground">
            Ver dados em tabela
          </summary>
          <table className="mt-3 w-full">
            <caption className="sr-only">{titulo}</caption>
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th scope="col" className="pb-2 font-medium">Mês</th>
                <th scope="col" className="pb-2 text-right font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              {pontos.map((p) => (
                <tr key={p.mes} className="border-b border-border last:border-0">
                  <td className="py-1.5 capitalize">{mesPorExtenso(p.mes)}</td>
                  <td className="py-1.5 text-right tabular-nums">{formatarValor(p.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </CardContent>
    </Card>
  )
}

function CardRanking({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
        <CardDescription>Top 5 do período.</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function Contagem({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    // dt antes do dd no DOM (ordem semântica); o número aparece em cima visualmente.
    <div className="flex flex-col-reverse gap-0.5">
      <dt className="text-[11px] leading-tight text-muted-foreground">{rotulo}</dt>
      <dd className="font-heading text-lg font-semibold">{valor}</dd>
    </div>
  )
}

function DashboardSkeleton() {
  const bloco = "animate-pulse rounded-xl border border-border bg-card"
  return (
    <div className="space-y-6" aria-busy aria-label="Carregando dashboard">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={cn(bloco, "h-[124px]")} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className={cn(bloco, "h-80")} />
        <div className={cn(bloco, "h-80")} />
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={cn(bloco, "h-64")} />
        ))}
      </div>
    </div>
  )
}
