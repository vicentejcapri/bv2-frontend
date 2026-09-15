import { useCallback, useEffect, useState } from "react"
import { Loader2, Plus } from "lucide-react"

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
import { PageHeader } from "@/components/PageHeader"
import { ExcluirDialog } from "@/components/dialogs/ExcluirDialog"
import { ServicoDialog } from "@/components/dialogs/ServicoDialog"
import { useAuth } from "@/hooks/useAuth"
import { useFeedback } from "@/hooks/useFeedback"
import { ApiError } from "@/lib/api"
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
  const [servicos, setServicos] = useState<Servico[] | null>(null)
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

    listarServicos(token)
      .then((pagina) => {
        if (cancelado) return
        setServicos(pagina.conteudo)
        setErro(null)
      })
      .catch((error) => {
        if (cancelado) return
        if (error instanceof ApiError && error.status === 401) return logout()
        setErro(
          error instanceof ApiError
            ? error.message
            : "Não foi possível carregar os serviços."
        )
      })

    return () => {
      cancelado = true
    }
  }, [token, logout, tentativa])

  const substituir = useCallback((atualizado: Servico) => {
    setServicos((atuais) =>
      atuais?.map((s) => (s.id === atualizado.id ? atualizado : s)) ?? null
    )
  }, [])

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

  const aoSalvar = (salvo: Servico, criado: boolean) => {
    setServicos((atuais) => {
      const lista = criado
        ? [...(atuais ?? []), salvo]
        : (atuais ?? []).map((s) => (s.id === salvo.id ? salvo : s))
      return lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
    })
  }

  const ativos = servicos?.filter((s) => s.ativo).length ?? 0

  const botaoNovo = (
    <Button onClick={() => abrir({ tipo: "novo" })}>
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
        <DataToolbar placeholder="Buscar serviço…" />
        <CardFlush className="border-t-0">
          {erro && !servicos ? (
            <EmptyState
              title="Não foi possível carregar os serviços"
              description={erro}
              action={
                <Button variant="outline" onClick={() => setTentativa((n) => n + 1)}>
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
            <EmptyState
              title="Nenhum serviço cadastrado"
              description="Cadastre os serviços da oficina para montar os orçamentos das ordens de serviço."
              action={botaoNovo}
            />
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
        {servicos && servicos.length > 0 && (
          <CardFooter className="gap-1 text-xs text-muted-foreground">
            <strong className="text-foreground">{servicos.length}</strong>
            {servicos.length === 1 ? "serviço cadastrado" : "serviços cadastrados"}
            <span aria-hidden>·</span>
            <strong className="text-foreground">{ativos}</strong>
            {ativos === 1 ? "ativo" : "ativos"}
          </CardFooter>
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
        onExcluido={() => {
          if (modal?.tipo !== "excluir") return
          const { id } = modal.servico
          setServicos((atuais) => atuais?.filter((s) => s.id !== id) ?? null)
        }}
      />
    </>
  )
}
