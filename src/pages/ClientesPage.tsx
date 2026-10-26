import { useCallback, useState } from "react"
import { Loader2, Phone, Plus } from "lucide-react"

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
import { Initials } from "@/components/Initials"
import { PageHeader } from "@/components/PageHeader"
import { Paginacao } from "@/components/Paginacao"
import { ClienteDialog } from "@/components/dialogs/ClienteDialog"
import { ExcluirDialog } from "@/components/dialogs/ExcluirDialog"
import { useAuth } from "@/hooks/useAuth"
import { useFeedback } from "@/hooks/useFeedback"
import { useListagem } from "@/hooks/useListagem"
import { ApiError, ativoDaSituacao } from "@/lib/api"
import type { Situacao } from "@/lib/api"
import {
  alterarSituacaoCliente,
  excluirCliente,
  listarClientes,
} from "@/lib/cliente-api"
import type { Cliente } from "@/lib/cliente-api"
import { maskTelefone } from "@/lib/format"

/** Diálogo aberto no momento: cadastro, edição ou confirmação de exclusão. */
type Modal =
  | { tipo: "novo" }
  | { tipo: "editar"; cliente: Cliente }
  | { tipo: "excluir"; cliente: Cliente }

export function ClientesPage() {
  const { token, logout } = useAuth()
  const { falha } = useFeedback()
  // O modal fica guardado depois de fechar para o conteúdo não mudar na animação de saída.
  const [modal, setModal] = useState<Modal | null>(null)
  const [aberto, setAberto] = useState(false)
  // Abre só com os ativos: a carteira inteira não precisa vir na primeira carga.
  const [filtroSituacao, setFiltroSituacao] = useState<Situacao>("ATIVOS")

  const lista = useListagem(
    listarClientes,
    { ativo: ativoDaSituacao(filtroSituacao) },
    { mensagemErro: "Não foi possível carregar os clientes." }
  )
  const clientes = lista.itens
  const { substituir: trocar } = lista
  const substituir = useCallback(
    (atualizado: Cliente) => trocar(atualizado, (a, b) => a.id === b.id),
    [trocar]
  )

  const abrir = (proximo: Modal) => {
    setModal(proximo)
    setAberto(true)
  }

  /** Otimista: o switch muda na hora e volta se a API recusar. */
  const alternarSituacao = async (cliente: Cliente, ativo: boolean) => {
    if (!token) return
    substituir({ ...cliente, ativo })
    try {
      substituir(await alterarSituacaoCliente(token, cliente.id, ativo))
    } catch (error) {
      substituir(cliente)
      if (error instanceof ApiError && error.status === 401) return logout()
      falha({
        titulo: `Não foi possível ${ativo ? "ativar" : "inativar"} o cliente`,
        descricao: error instanceof ApiError ? error.message : undefined,
      })
    }
  }

  // Cadastro novo pode cair em qualquer página da ordenação: recarrega do servidor.
  const aoSalvar = (salvo: Cliente, criado: boolean) =>
    criado ? lista.recarregar() : substituir(salvo)

  const filtrando = lista.buscando || filtroSituacao !== "TODOS"

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Gerencie a carteira de clientes da oficina."
        actions={
          <Button variant="accent" onClick={() => abrir({ tipo: "novo" })}>
            <Plus />
            Novo cliente
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <DataToolbar
          placeholder="Buscar por nome ou telefone…"
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
          {lista.erro && !clientes ? (
            <EmptyState
              title="Não foi possível carregar os clientes"
              description={lista.erro}
              action={
                <Button variant="outline" onClick={lista.recarregar}>
                  Tentar novamente
                </Button>
              }
            />
          ) : !clientes ? (
            <div
              className="flex items-center justify-center gap-2 px-5 py-14 text-sm text-muted-foreground"
              role="status"
            >
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Carregando clientes…
            </div>
          ) : clientes.length === 0 ? (
            !filtrando ? (
              <EmptyState
                title="Nenhum cliente cadastrado"
                description="Cadastre o primeiro cliente para abrir ordens de serviço."
                action={
                  <Button variant="accent" onClick={() => abrir({ tipo: "novo" })}>
                    <Plus />
                    Novo cliente
                  </Button>
                }
              />
            ) : (
              <EmptyState
                title="Nenhum cliente encontrado"
                description="Nenhum cliente corresponde à busca ou ao filtro. Experimente mudar a situação para “Todos”."
              />
            )
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Cliente</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead className="w-28">Ativo</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.map((cliente) => (
                  <TableRow key={cliente.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Initials name={cliente.nome} />
                        <span
                          className={
                            cliente.ativo
                              ? "font-medium text-foreground"
                              : "font-medium text-muted-foreground"
                          }
                        >
                          {cliente.nome}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <a
                        href={`tel:${cliente.telefone}`}
                        className="inline-flex items-center gap-1.5 whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <Phone className="size-3.5" />
                        {maskTelefone(cliente.telefone)}
                      </a>
                    </TableCell>

                    <TableCell>
                      <Switch
                        checked={cliente.ativo}
                        onCheckedChange={(ativo) => alternarSituacao(cliente, ativo)}
                        aria-label={`${cliente.ativo ? "Inativar" : "Ativar"} ${cliente.nome}`}
                      />
                    </TableCell>

                    <TableCell className="text-right">
                      <AcoesMenu
                        rotulo={cliente.nome}
                        onEditar={() => abrir({ tipo: "editar", cliente })}
                        onExcluir={() => abrir({ tipo: "excluir", cliente })}
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
            singular="cliente"
            plural="clientes"
          />
        )}
      </Card>

      <ClienteDialog
        open={aberto && modal?.tipo !== "excluir"}
        onOpenChange={setAberto}
        cliente={modal?.tipo === "editar" ? modal.cliente : undefined}
        onSalvo={aoSalvar}
      />

      <ExcluirDialog
        open={aberto && modal?.tipo === "excluir"}
        onOpenChange={setAberto}
        titulo="Excluir cliente"
        nome={modal?.tipo === "excluir" ? modal.cliente.nome : undefined}
        mensagemConflito="Este cliente já tem equipamentos, ordens de serviço ou notificações e não pode ser excluído. Inative-o para tirá-lo de uso sem perder o histórico."
        excluir={(token) =>
          modal?.tipo === "excluir"
            ? excluirCliente(token, modal.cliente.id)
            : Promise.resolve()
        }
        onExcluido={lista.recarregar}
      />
    </>
  )
}
