import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import type { DateRange } from "react-day-picker"
import {
  CalendarDays,
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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
import { AJUDA } from "@/config/ajuda"

type PresetId = "30d" | "90d" | "12m" | "ano"

const PRESETS: { id: PresetId; label: string }[] = [
  { id: "30d", label: "30 dias" },
  { id: "90d", label: "90 dias" },
  { id: "12m", label: "12 meses" },
  { id: "ano", label: "Este ano" },
]

/** "2026-11-07" -> Date à meia-noite local (new Date("2026-11-07") seria UTC). */
function dataLocal(iso: string) {
  const [ano, mes, dia] = iso.split("-").map(Number)
  return new Date(ano, mes - 1, dia)
}

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
  // Estado guarda o período pronto (strings): a identidade só muda quando o
  // usuário aplica outro intervalo, então o usePainel não refaz a busca à toa.
  const [periodo, setPeriodo] = useState<Periodo>(() => periodoDo("30d"))
  const { painel, erro, carregando, recarregar } = usePainel(periodo)

  return (
    <>
      <PageHeader
        title="Dashboard"
        ajuda={AJUDA.dashboard}
        description={
          painel
            ? `Período de ${formatDataBR(painel.periodo.dataInicio)} a ${formatDataBR(painel.periodo.dataFim)}.`
            : "Visão geral da operação da oficina."
        }
        actions={<SeletorPeriodo valor={periodo} onChange={setPeriodo} />}
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

/** Acompanha um media query (ex.: 2 meses no calendário só a partir do sm). */
function useMidia(query: string) {
  const [casa, setCasa] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mql = window.matchMedia(query)
    const aoMudar = () => setCasa(mql.matches)
    mql.addEventListener("change", aoMudar)
    return () => mql.removeEventListener("change", aoMudar)
  }, [query])
  return casa
}

/**
 * Período do dashboard: calendário de intervalo (dia inicial → dia final) com os
 * atalhos de sempre embaixo. Só aplica com o intervalo completo, para não ir ao
 * servidor no primeiro clique.
 */
function SeletorPeriodo({
  valor,
  onChange,
}: {
  valor: Periodo
  onChange: (periodo: Periodo) => void
}) {
  const [aberto, setAberto] = useState(false)
  const [rascunho, setRascunho] = useState<DateRange | undefined>()
  const doisMeses = useMidia("(min-width: 640px)")
  // Estável entre renders: endMonth/disabled novos a cada render fariam o calendário recalcular.
  const [hoje] = useState(() => new Date())

  const abrir = (proximo: boolean) => {
    setAberto(proximo)
    // Cada abertura começa do período aplicado.
    if (proximo) setRascunho({ from: dataLocal(valor.dataInicio), to: dataLocal(valor.dataFim) })
  }

  const aplicar = (periodo: Periodo) => {
    onChange(periodo)
    setAberto(false)
  }

  const presetAtivo = PRESETS.find((p) => {
    const periodo = periodoDo(p.id)
    return periodo.dataInicio === valor.dataInicio && periodo.dataFim === valor.dataFim
  })?.id

  return (
    <Popover open={aberto} onOpenChange={abrir}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 bg-card font-normal tabular-nums sm:w-auto"
          aria-label={`Período: ${formatDataBR(valor.dataInicio)} a ${formatDataBR(valor.dataFim)}. Alterar período`}
        >
          <CalendarDays className="text-accent" aria-hidden />
          {formatDataBR(valor.dataInicio)}
          <span className="text-muted-foreground" aria-hidden>
            –
          </span>
          {formatDataBR(valor.dataFim)}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto max-w-[calc(100vw-1.5rem)] gap-3 p-3">
        <Calendar
          mode="range"
          selected={rascunho}
          onSelect={(intervalo) => {
            setRascunho(intervalo)
            // Com resetOnSelect o 1º clique vira {from, to: undefined}; o 2º fecha o
            // intervalo (invertendo se for anterior ao início) e já aplica.
            if (intervalo?.from && intervalo.to && rascunho?.from && rascunho.to === undefined) {
              aplicar({ dataInicio: isoLocal(intervalo.from), dataFim: isoLocal(intervalo.to) })
            }
          }}
          resetOnSelect
          numberOfMonths={doisMeses ? 2 : 1}
          defaultMonth={
            rascunho?.from && doisMeses
              ? new Date(rascunho.from.getFullYear(), rascunho.from.getMonth())
              : dataLocal(valor.dataFim)
          }
          disabled={{ after: hoje }}
          endMonth={hoje}
        />

        <p className="text-xs text-muted-foreground" aria-live="polite">
          {rascunho?.from && !rascunho.to
            ? `Início em ${formatDataBR(isoLocal(rascunho.from))}. Escolha o dia final.`
            : "Toque no dia inicial e depois no final."}
        </p>

        <div
          role="group"
          aria-label="Atalhos de período"
          className="grid grid-cols-2 gap-1.5 border-t border-border pt-3 sm:grid-cols-4"
        >
          {PRESETS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={presetAtivo === item.id}
              onClick={() => aplicar(periodoDo(item.id))}
              className={cn(
                "h-9 rounded-md px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                presetAtivo === item.id
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function Conteudo({ painel }: { painel: Painel }) {
  const { faturamento, resumo, serieMensal, rankings } = painel
  const ordensNoPeriodo = serieMensal.reduce((soma, p) => soma + p.ordensAbertas, 0)

  return (
    <>
      {/* Indicadores do período */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
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
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={cn(bloco, "h-[108px] sm:h-[124px]")} />
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
