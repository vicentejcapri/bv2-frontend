import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Plus, Wrench } from "lucide-react"

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
import { AcoesMenu } from "@/components/AcoesMenu"
import { DataToolbar, EmptyState } from "@/components/DataToolbar"
import { Initials } from "@/components/Initials"
import { PageHeader } from "@/components/PageHeader"
import { EquipamentoDialog } from "@/components/dialogs/EquipamentoDialog"
import { ExcluirDialog } from "@/components/dialogs/ExcluirDialog"
import { useAuth } from "@/hooks/useAuth"
import { ApiError } from "@/lib/api"
import { normalizar } from "@/lib/format"
import { excluirEquipamento, listarEquipamentos } from "@/lib/equipamento-api"
import type { Equipamento } from "@/lib/equipamento-api"

/** Diálogo aberto no momento: cadastro, edição ou confirmação de exclusão. */
type Modal =
  | { tipo: "novo" }
  | { tipo: "editar"; equipamento: Equipamento }
  | { tipo: "excluir"; equipamento: Equipamento }

export function EquipamentosPage() {
  const { token, logout } = useAuth()
  const [equipamentos, setEquipamentos] = useState<Equipamento[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [tentativa, setTentativa] = useState(0)
  // O modal fica guardado depois de fechar para o conteúdo não mudar na animação de saída.
  const [modal, setModal] = useState<Modal | null>(null)
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState("")

  const abrir = (proximo: Modal) => {
    setModal(proximo)
    setAberto(true)
  }

  useEffect(() => {
    if (!token) return
    let cancelado = false

    listarEquipamentos(token)
      .then((pagina) => {
        if (cancelado) return
        setEquipamentos(pagina.conteudo)
        setErro(null)
      })
      .catch((error) => {
        if (cancelado) return
        if (error instanceof ApiError && error.status === 401) return logout()
        setErro(
          error instanceof ApiError
            ? error.message
            : "Não foi possível carregar os equipamentos."
        )
      })

    return () => {
      cancelado = true
    }
  }, [token, logout, tentativa])

  const aoSalvar = useCallback((salvo: Equipamento, criado: boolean) => {
    setEquipamentos((atuais) => {
      const lista = criado
        ? [...(atuais ?? []), salvo]
        : (atuais ?? []).map((e) => (e.id === salvo.id ? salvo : e))
      return lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
    })
  }, [])

  const visiveis = useMemo(() => {
    const termo = normalizar(busca.trim())
    if (!termo) return equipamentos ?? []
    return (equipamentos ?? []).filter(
      (eq) =>
        normalizar(eq.nome).includes(termo) ||
        normalizar(eq.marca.nome).includes(termo) ||
        normalizar(eq.cliente.nome).includes(termo)
    )
  }, [equipamentos, busca])

  const botaoNovo = (
    <Button variant="accent" onClick={() => abrir({ tipo: "novo" })}>
      <Plus />
      Novo equipamento
    </Button>
  )

  return (
    <>
      <PageHeader
        title="Equipamentos"
        description="Máquinas e dispositivos dos clientes cadastrados para manutenção."
        actions={botaoNovo}
      />

      <Card className="overflow-hidden">
        <DataToolbar
          placeholder="Buscar por equipamento, marca ou cliente…"
          busca={busca}
          onBuscaChange={setBusca}
        />
        <CardFlush className="border-t-0">
          {erro && !equipamentos ? (
            <EmptyState
              title="Não foi possível carregar os equipamentos"
              description={erro}
              action={
                <Button variant="outline" onClick={() => setTentativa((n) => n + 1)}>
                  Tentar novamente
                </Button>
              }
            />
          ) : !equipamentos ? (
            <div
              className="flex items-center justify-center gap-2 px-5 py-14 text-sm text-muted-foreground"
              role="status"
            >
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Carregando equipamentos…
            </div>
          ) : visiveis.length === 0 ? (
            equipamentos.length === 0 ? (
              <EmptyState
                title="Nenhum equipamento cadastrado"
                description="Cadastre o equipamento de um cliente para usá-lo nas ordens de serviço."
                action={botaoNovo}
              />
            ) : (
              <EmptyState
                title="Nenhum equipamento encontrado"
                description="Nenhum equipamento corresponde à busca."
              />
            )
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visiveis.map((eq) => (
                  <TableRow key={eq.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground ring-1 ring-inset ring-border">
                          <Wrench className="size-4" aria-hidden />
                        </span>
                        <span className="font-medium text-foreground">{eq.nome}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-muted-foreground">{eq.marca.nome}</TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Initials name={eq.cliente.nome} className="size-7" />
                        <span className="whitespace-nowrap">{eq.cliente.nome}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <AcoesMenu
                        rotulo={`${eq.nome} ${eq.marca.nome} de ${eq.cliente.nome}`}
                        onEditar={() => abrir({ tipo: "editar", equipamento: eq })}
                        onExcluir={() => abrir({ tipo: "excluir", equipamento: eq })}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardFlush>
        {equipamentos && equipamentos.length > 0 && (
          <CardFooter className="gap-1 text-xs text-muted-foreground">
            <strong className="text-foreground">{visiveis.length}</strong>
            de {equipamentos.length}
            {equipamentos.length === 1 ? "equipamento" : "equipamentos"}
          </CardFooter>
        )}
      </Card>

      <EquipamentoDialog
        open={aberto && modal?.tipo !== "excluir"}
        onOpenChange={setAberto}
        equipamento={modal?.tipo === "editar" ? modal.equipamento : undefined}
        onSalvo={aoSalvar}
      />

      <ExcluirDialog
        open={aberto && modal?.tipo === "excluir"}
        onOpenChange={setAberto}
        titulo="Excluir equipamento"
        nome={
          modal?.tipo === "excluir"
            ? `${modal.equipamento.nome} (${modal.equipamento.marca.nome}) de ${modal.equipamento.cliente.nome}`
            : undefined
        }
        mensagemConflito="Este equipamento já aparece em ordens de serviço e não pode ser excluído."
        excluir={(token) =>
          modal?.tipo === "excluir"
            ? excluirEquipamento(token, modal.equipamento.id)
            : Promise.resolve()
        }
        onExcluido={() => {
          if (modal?.tipo !== "excluir") return
          const { id } = modal.equipamento
          setEquipamentos((atuais) => atuais?.filter((e) => e.id !== id) ?? null)
        }}
      />
    </>
  )
}
