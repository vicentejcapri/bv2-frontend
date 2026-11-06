import { useCallback, useState } from "react"
import { Loader2, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardFlush } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AcoesMenu } from "@/components/AcoesMenu"
import { DataToolbar, EmptyState } from "@/components/DataToolbar"
import { PageHeader } from "@/components/PageHeader"
import { Paginacao } from "@/components/Paginacao"
import { ExcluirDialog } from "@/components/dialogs/ExcluirDialog"
import { ServicoDialog } from "@/components/dialogs/ServicoDialog"
import { useAuth } from "@/hooks/useAuth"
import { useFeedback } from "@/hooks/useFeedback"
import { useListagem } from "@/hooks/useListagem"
import { ApiError, ativoDaSituacao } from "@/lib/api"
import type { Situacao } from "@/lib/api"
import { formatBRL } from "@/lib/format"
import {
  alterarSituacaoServico,
  excluirServico,
  listarServicos,
} from "@/lib/servico-api"
import type { Servico } from "@/lib/servico-api"

/** Diálogo aberto no momento: cadastro, edição ou confirmação de exclusão. */
type Modal =
  | { tipo: "novo" }
  | { tipo: "editar"; servico: Servico }
  | { tipo: "excluir"; servico: Servico }

export function ServicosPage() {
  const { token, logout } = useAuth()
  const { falha } = useFeedback()
  // O modal fica guardado depois de fechar para o conteúdo não mudar na animação de saída.
  const [modal, setModal] = useState<Modal | null>(null)
  const [aberto, setAberto] = useState(false)
  // Abre só com os ativos: a lista inteira não precisa vir na primeira carga.
  const [filtroSituacao, setFiltroSituacao] = useState<Situacao>("ATIVOS")

  const lista = useListagem(
    listarServicos,
    { ativo: ativoDaSituacao(filtroSituacao) },
    { mensagemErro: "Não foi possível carregar os serviços." }
  )
  const servicos = lista.itens
  const filtrando = lista.buscando || filtroSituacao !== "TODOS"

  const abrir = (proximo: Modal) => {
    setModal(proximo)
    setAberto(true)
  }

  const { substituir: trocar } = lista
  const substituir = useCallback(
    (atualizado: Servico) => trocar(atualizado, (a, b) => a.id === b.id),
    [trocar]
  )

  /** Otimista: o switch muda na hora e volta se a API recusar. */
  const alternarSituacao = async (servico: Servico, ativo: boolean) => {
    if (!token) return
    substituir({ ...servico, ativo })
    try {
      substituir(await alterarSituacaoServico(token, servico.id, ativo))
    } catch (error) {
      substituir(servico)
      if (error instanceof ApiError && error.status === 401) return logout()
      falha({
        titulo: `Não foi possível ${ativo ? "ativar" : "inativar"} o serviço`,
        descricao: error instanceof ApiError ? error.message : undefined,
      })
    }
  }

  // Cadastro novo pode cair em qualquer página da ordenação: recarrega do servidor.
  const aoSalvar = (salvo: Servico, criado: boolean) =>
    criado ? lista.recarregar() : substituir(salvo)


  const botaoNovo = (
    <Button variant="accent" onClick={() => abrir({ tipo: "novo" })}>
      <Plus />
      Novo serviço
    </Button>
  )

  return (
    <>
      <PageHeader
        title="Serviços"
        description="Tabela de preços padronizados para agilizar orçamentos."
        actions={botaoNovo}
      />

      <Card className="overflow-hidden">
        <DataToolbar
          placeholder="Buscar por nome ou descrição…"
          busca={lista.busca}
          onBuscaChange={lista.setBusca}
        >
          <Select
            value={filtroSituacao}
            onValueChange={(valor) => setFiltroSituacao(valor as Situacao)}
          >
            <SelectTrigger className="w-40" aria-label="Filtrar por situação">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              <SelectItem value="ATIVOS">Só ativos</SelectItem>
              <SelectItem value="INATIVOS">Só inativos</SelectItem>
            </SelectContent>
          </Select>
        </DataToolbar>
        <CardFlush className="border-t-0">
          {lista.erro && !servicos ? (
            <EmptyState
              title="Não foi possível carregar os serviços"
              description={lista.erro}
              action={
                <Button variant="outline" onClick={lista.recarregar}>
                  Tentar novamente
                </Button>
              }
            />
          ) : !servicos ? (
            <div
              className="flex items-center justify-center gap-2 px-5 py-14 text-sm text-muted-foreground"
              role="status"
            >
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Carregando serviços…
            </div>
          ) : servicos.length === 0 ? (
            !filtrando ? (
              <EmptyState
                title="Nenhum serviço cadastrado"
                description="Cadastre os serviços da oficina para montar os orçamentos das ordens de serviço."
                action={botaoNovo}
              />
            ) : (
              <EmptyState
                title="Nenhum serviço encontrado"
                description="Nenhum serviço corresponde à busca ou ao filtro."
              />
            )
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Serviço</TableHead>
                  <TableHead className="hidden md:table-cell">Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-28">Ativo</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {servicos.map((srv) => (
                  <TableRow key={srv.id} className="group">
                    <TableCell
                      className={
                        srv.ativo
                          ? "font-medium text-foreground"
                          : "font-medium text-muted-foreground"
                      }
                    >
                      {srv.nome}
                    </TableCell>

                    <TableCell className="hidden max-w-md whitespace-normal text-muted-foreground md:table-cell">
                      {srv.descricao || "—"}
                    </TableCell>

                    <TableCell className="whitespace-nowrap text-right font-semibold">
                      {formatBRL(srv.valor)}
                    </TableCell>

                    <TableCell>
                      <Switch
                        checked={srv.ativo}
                        onCheckedChange={(ativo) => alternarSituacao(srv, ativo)}
                        aria-label={`${srv.ativo ? "Inativar" : "Ativar"} ${srv.nome}`}
                      />
                    </TableCell>

                    <TableCell className="text-right">
                      <AcoesMenu
                        rotulo={srv.nome}
                        onEditar={() => abrir({ tipo: "editar", servico: srv })}
                        onExcluir={() => abrir({ tipo: "excluir", servico: srv })}
                      />
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
            singular="serviço"
            plural="serviços"
          />
        )}
      </Card>

      <ServicoDialog
        open={aberto && modal?.tipo !== "excluir"}
        onOpenChange={setAberto}
        servico={modal?.tipo === "editar" ? modal.servico : undefined}
        onSalvo={aoSalvar}
      />

      <ExcluirDialog
        open={aberto && modal?.tipo === "excluir"}
        onOpenChange={setAberto}
        titulo="Excluir serviço"
        nome={modal?.tipo === "excluir" ? modal.servico.nome : undefined}
        mensagemConflito="Este serviço já aparece em ordens de serviço e não pode ser excluído. Inative-o para tirá-lo de uso sem perder o histórico."
        excluir={(token) =>
          modal?.tipo === "excluir"
            ? excluirServico(token, modal.servico.id)
            : Promise.resolve()
        }
        onExcluido={lista.recarregar}
      />
    </>
  )
}
