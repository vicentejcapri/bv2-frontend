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
import { Initials } from "@/components/Initials"
import { PageHeader } from "@/components/PageHeader"
import { Paginacao } from "@/components/Paginacao"
import { ExcluirDialog } from "@/components/dialogs/ExcluirDialog"
import { UsuarioDialog } from "@/components/dialogs/UsuarioDialog"
import { useAuth } from "@/hooks/useAuth"
import { useConta } from "@/hooks/useConta"
import { useFeedback } from "@/hooks/useFeedback"
import { useListagem } from "@/hooks/useListagem"
import { ApiError, ativoDaSituacao } from "@/lib/api"
import type { Situacao } from "@/lib/api"
import { formatDataBR } from "@/lib/format"
import {
  ROLE_LABEL,
  alterarSituacaoUsuario,
  excluirUsuario,
  listarUsuarios,
} from "@/lib/usuario-api"
import type { Usuario } from "@/lib/usuario-api"
import { AJUDA } from "@/config/ajuda"

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
  // O modal fica guardado depois de fechar para o conteúdo não mudar na animação de saída.
  const [modal, setModal] = useState<Modal | null>(null)
  const [aberto, setAberto] = useState(false)
  // Abre só com os ativos: a lista inteira não precisa vir na primeira carga.
  const [filtroSituacao, setFiltroSituacao] = useState<Situacao>("ATIVOS")

  const lista = useListagem(
    listarUsuarios,
    { ativo: ativoDaSituacao(filtroSituacao) },
    { mensagemErro: "Não foi possível carregar os usuários." }
  )
  const usuarios = lista.itens

  const abrir = (proximo: Modal) => {
    setModal(proximo)
    setAberto(true)
  }

  const { substituir: trocar } = lista
  const substituir = useCallback(
    (atualizado: Usuario) => trocar(atualizado, (a, b) => a.id === b.id),
    [trocar]
  )

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
    // Cadastro novo pode cair em qualquer página da ordenação: recarrega do servidor.
    return criado ? lista.recarregar() : substituir(salvo)
  }

  return (
    <>
      <PageHeader
        title="Usuários"
        ajuda={AJUDA.usuarios}
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
          {lista.erro && !usuarios ? (
            <EmptyState
              title="Não foi possível carregar os usuários"
              description={lista.erro}
              action={
                <Button variant="outline" onClick={lista.recarregar}>
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
          ) : usuarios.length === 0 ? (
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
                {usuarios.map((usuario) => {
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
        {lista.pagina && lista.pagina.totalElementos > 0 && (
          <Paginacao
            pagina={lista.pagina}
            carregando={lista.carregando}
            onIrPara={lista.irPara}
            singular="usuário"
            plural="usuários"
          />
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
          lista.recarregar()
          recarregarContas()
        }}
      />
    </>
  )
}
