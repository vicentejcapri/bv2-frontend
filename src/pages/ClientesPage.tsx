import { useCallback, useEffect, useState } from "react"
import { Loader2, Phone, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardFlush, CardFooter } from "@/components/ui/card"
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
import { ClienteDialog } from "@/components/dialogs/ClienteDialog"
import { ExcluirDialog } from "@/components/dialogs/ExcluirDialog"
import { useAuth } from "@/hooks/useAuth"
import { useFeedback } from "@/hooks/useFeedback"
import { ApiError } from "@/lib/api"
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
  const [clientes, setClientes] = useState<Cliente[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [tentativa, setTentativa] = useState(0)
  // O modal fica guardado depois de fechar para o conteúdo não mudar na animação de saída.
  const [modal, setModal] = useState<Modal | null>(null)
  const [aberto, setAberto] = useState(false)

  const abrir = (proximo: Modal) => {
    setModal(proximo)
    setAberto(true)
  }

  useEffect(() => {
    if (!token) return
    let cancelado = false

    listarClientes(token)
      .then((pagina) => {
        if (cancelado) return
        setClientes(pagina.conteudo)
        setErro(null)
      })
      .catch((error) => {
        if (cancelado) return
        if (error instanceof ApiError && error.status === 401) return logout()
        setErro(
          error instanceof ApiError
            ? error.message
            : "Não foi possível carregar os clientes."
        )
      })

    return () => {
      cancelado = true
    }
  }, [token, logout, tentativa])

  const substituir = useCallback((atualizado: Cliente) => {
    setClientes((atuais) =>
      atuais?.map((c) => (c.id === atualizado.id ? atualizado : c)) ?? null
    )
  }, [])

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

  const aoSalvar = (salvo: Cliente, criado: boolean) => {
    if (!criado) return substituir(salvo)
    setClientes((atuais) =>
      [...(atuais ?? []), salvo].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
    )
  }

  const ativos = clientes?.filter((c) => c.ativo).length ?? 0

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Gerencie a carteira de clientes da oficina."
        actions={
          <Button onClick={() => abrir({ tipo: "novo" })}>
            <Plus />
            Novo cliente
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <DataToolbar placeholder="Buscar por nome ou telefone…" />
        <CardFlush className="border-t-0">
          {erro && !clientes ? (
            <EmptyState
              title="Não foi possível carregar os clientes"
              description={erro}
              action={
                <Button variant="outline" onClick={() => setTentativa((n) => n + 1)}>
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
            <EmptyState
              title="Nenhum cliente cadastrado"
              description="Cadastre o primeiro cliente para abrir ordens de serviço."
              action={
                <Button onClick={() => abrir({ tipo: "novo" })}>
                  <Plus />
                  Novo cliente
                </Button>
              }
            />
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
        {clientes && clientes.length > 0 && (
          <CardFooter className="gap-1 text-xs text-muted-foreground">
            <strong className="text-foreground">{clientes.length}</strong>
            {clientes.length === 1 ? "cliente cadastrado" : "clientes cadastrados"}
            <span aria-hidden>·</span>
            <strong className="text-foreground">{ativos}</strong>
            {ativos === 1 ? "ativo" : "ativos"}
          </CardFooter>
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
        onExcluido={() => {
          if (modal?.tipo !== "excluir") return
          const { id } = modal.cliente
          setClientes((atuais) => atuais?.filter((c) => c.id !== id) ?? null)
        }}
      />
    </>
  )
}
