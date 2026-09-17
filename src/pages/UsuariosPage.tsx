import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardFlush, CardFooter } from "@/components/ui/card"
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
import { ExcluirDialog } from "@/components/dialogs/ExcluirDialog"
import { UsuarioDialog } from "@/components/dialogs/UsuarioDialog"
import { useAuth } from "@/hooks/useAuth"
import { useConta } from "@/hooks/useConta"
import { useFeedback } from "@/hooks/useFeedback"
import { ApiError } from "@/lib/api"
import { formatDataBR, normalizar } from "@/lib/format"
import {
  ROLE_LABEL,
  alterarSituacaoUsuario,
  excluirUsuario,
  listarUsuarios,
} from "@/lib/usuario-api"
import type { Usuario } from "@/lib/usuario-api"

/** Diálogo aberto no momento: cadastro, edição ou confirmação de exclusão. */
type Modal =
  | { tipo: "novo" }
  | { tipo: "editar"; usuario: Usuario }
  | { tipo: "excluir"; usuario: Usuario }

/** Cadastro de usuários do sistema. Só o MASTER chega aqui (rota SomenteMaster). */
export function UsuariosPage() {
  const { token, logout } = useAuth()
  const { recarregarContas } = useConta()
  const { falha } = useFeedback()
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [tentativa, setTentativa] = useState(0)
  // O modal fica guardado depois de fechar para o conteúdo não mudar na animação de saída.
  const [modal, setModal] = useState<Modal | null>(null)
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState("")
  const [filtroSituacao, setFiltroSituacao] = useState("TODOS")

  const abrir = (proximo: Modal) => {
    setModal(proximo)
    setAberto(true)
  }

  useEffect(() => {
    if (!token) return
    let cancelado = false

    listarUsuarios(token)
      .then((pagina) => {
        if (cancelado) return
        setUsuarios(pagina.conteudo)
        setErro(null)
      })
      .catch((error) => {
        if (cancelado) return
        if (error instanceof ApiError && error.status === 401) return logout()
        setErro(
          error instanceof ApiError
            ? error.message
            : "Não foi possível carregar os usuários."
        )
      })

    return () => {
      cancelado = true
    }
  }, [token, logout, tentativa])

  const substituir = useCallback((atualizado: Usuario) => {
    setUsuarios((atuais) =>
      atuais?.map((u) => (u.id === atualizado.id ? atualizado : u)) ?? null
    )
  }, [])

  /** Otimista: o switch muda na hora e volta se a API recusar. */
  const alternarSituacao = async (usuario: Usuario, ativo: boolean) => {
    if (!token) return
    substituir({ ...usuario, ativo })
    try {
      substituir(await alterarSituacaoUsuario(token, usuario.id, ativo))
      // Só usuários ativos aparecem no seletor de conta.
      recarregarContas()
    } catch (error) {
      substituir(usuario)
      if (error instanceof ApiError && error.status === 401) return logout()
      falha({
        titulo: `Não foi possível ${ativo ? "ativar" : "desativar"} o usuário`,
        descricao: error instanceof ApiError ? error.message : undefined,
      })
    }
  }

  const aoSalvar = (salvo: Usuario, criado: boolean) => {
    recarregarContas()
    if (!criado) return substituir(salvo)
    setUsuarios((atuais) =>
      [...(atuais ?? []), salvo].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
    )
  }

  const ativos = usuarios?.filter((u) => u.ativo).length ?? 0

  const visiveis = useMemo(() => {
    const termo = normalizar(busca.trim())
    return (usuarios ?? []).filter((usuario) => {
      if (filtroSituacao === "ATIVOS" && !usuario.ativo) return false
      if (filtroSituacao === "INATIVOS" && usuario.ativo) return false
      if (!termo) return true
      return (
        normalizar(usuario.nome).includes(termo) ||
        normalizar(usuario.email).includes(termo)
      )
    })
  }, [usuarios, busca, filtroSituacao])

  return (
    <>
      <PageHeader
        title="Usuários"
        description="Quem acessa o sistema. Cada usuário tem a própria base de clientes, serviços e ordens."
        actions={
          <Button variant="accent" onClick={() => abrir({ tipo: "novo" })}>
            <Plus />
            Novo usuário
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <DataToolbar
          placeholder="Buscar por nome ou e-mail…"
          busca={busca}
          onBuscaChange={setBusca}
        >
          <Select value={filtroSituacao} onValueChange={setFiltroSituacao}>
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
          {erro && !usuarios ? (
            <EmptyState
              title="Não foi possível carregar os usuários"
              description={erro}
              action={
                <Button variant="outline" onClick={() => setTentativa((n) => n + 1)}>
                  Tentar novamente
                </Button>
              }
            />
          ) : !usuarios ? (
            <div
              className="flex items-center justify-center gap-2 px-5 py-14 text-sm text-muted-foreground"
              role="status"
            >
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Carregando usuários…
            </div>
          ) : visiveis.length === 0 ? (
            <EmptyState
              title="Nenhum usuário encontrado"
              description="Nenhum usuário corresponde à busca ou ao filtro."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Usuário</TableHead>
                  <TableHead className="hidden md:table-cell">Papel</TableHead>
                  <TableHead className="hidden sm:table-cell">Criado em</TableHead>
                  <TableHead className="w-28">Ativo</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visiveis.map((usuario) => {
                  const master = usuario.role === "MASTER"
                  return (
                    <TableRow key={usuario.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Initials name={usuario.nome} />
                          <div className="min-w-0">
                            <p
                              className={
                                usuario.ativo
                                  ? "truncate font-medium text-foreground"
                                  : "truncate font-medium text-muted-foreground"
                              }
                            >
                              {usuario.nome}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {usuario.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {ROLE_LABEL[usuario.role]}
                      </TableCell>

                      <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">
                        {formatDataBR(usuario.criadoEm.slice(0, 10))}
                      </TableCell>

                      <TableCell>
                        {/* O MASTER é único: desativá-lo trancaria o cadastro de usuários. */}
                        <Switch
                          checked={usuario.ativo}
                          disabled={master}
                          onCheckedChange={(ativo) => alternarSituacao(usuario, ativo)}
                          aria-label={`${usuario.ativo ? "Desativar" : "Ativar"} ${usuario.nome}`}
                        />
                      </TableCell>

                      <TableCell className="text-right">
                        {/* O MASTER é único e não pode ser excluído: o menu só oferece Editar. */}
                        <AcoesMenu
                          rotulo={usuario.nome}
                          onEditar={() => abrir({ tipo: "editar", usuario })}
                          onExcluir={
                            master ? undefined : () => abrir({ tipo: "excluir", usuario })
                          }
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardFlush>
        {usuarios && usuarios.length > 0 && (
          <CardFooter className="gap-1 text-xs text-muted-foreground">
            <strong className="text-foreground">{visiveis.length}</strong>
            de {usuarios.length} {usuarios.length === 1 ? "usuário" : "usuários"}
            <span aria-hidden>·</span>
            <strong className="text-foreground">{ativos}</strong>
            {ativos === 1 ? "ativo" : "ativos"}
          </CardFooter>
        )}
      </Card>

      <UsuarioDialog
        open={aberto && modal?.tipo !== "excluir"}
        onOpenChange={setAberto}
        usuario={modal?.tipo === "editar" ? modal.usuario : undefined}
        onSalvo={aoSalvar}
      />

      <ExcluirDialog
        open={aberto && modal?.tipo === "excluir"}
        onOpenChange={setAberto}
        titulo="Excluir usuário"
        nome={modal?.tipo === "excluir" ? modal.usuario.nome : undefined}
        detalhe={
          <p className="rounded-lg bg-destructive-soft px-3 py-2.5 text-sm text-destructive-soft-foreground">
            A conta inteira vai junto: <strong className="font-medium">clientes, equipamentos,
            serviços, ordens de serviço, notificações e templates</strong>. Para só tirar o
            acesso e manter o histórico, desative o usuário.
          </p>
        }
        palavraConfirmacao="EXCLUIR"
        mensagemConflito="Não foi possível excluir o usuário por causa de dados vinculados. Tente novamente."
        excluir={(token) =>
          modal?.tipo === "excluir"
            ? excluirUsuario(token, modal.usuario.id)
            : Promise.resolve()
        }
        onExcluido={() => {
          if (modal?.tipo !== "excluir") return
          const { id } = modal.usuario
          setUsuarios((atuais) => atuais?.filter((u) => u.id !== id) ?? null)
          // Se o MASTER estava operando essa conta, o seletor volta para a dele.
          recarregarContas()
        }}
      />
    </>
  )
}
