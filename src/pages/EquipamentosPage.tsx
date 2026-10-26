import { useCallback, useState } from "react"
import { Loader2, Plus, Wrench } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardFlush } from "@/components/ui/card"
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
import { EquipamentoDialog } from "@/components/dialogs/EquipamentoDialog"
import { ExcluirDialog } from "@/components/dialogs/ExcluirDialog"
import { useListagem } from "@/hooks/useListagem"
import { excluirEquipamento, listarEquipamentos } from "@/lib/equipamento-api"
import type { Equipamento } from "@/lib/equipamento-api"

/** Diálogo aberto no momento: cadastro, edição ou confirmação de exclusão. */
type Modal =
  | { tipo: "novo" }
  | { tipo: "editar"; equipamento: Equipamento }
  | { tipo: "excluir"; equipamento: Equipamento }

export function EquipamentosPage() {
  // O modal fica guardado depois de fechar para o conteúdo não mudar na animação de saída.
  const [modal, setModal] = useState<Modal | null>(null)
  const [aberto, setAberto] = useState(false)

  const lista = useListagem(
    listarEquipamentos,
    {},
    { mensagemErro: "Não foi possível carregar os equipamentos." }
  )
  const equipamentos = lista.itens
  const { recarregar, substituir } = lista

  const abrir = (proximo: Modal) => {
    setModal(proximo)
    setAberto(true)
  }

  // Cadastro novo pode cair em qualquer página da ordenação: recarrega do servidor.
  const aoSalvar = useCallback(
    (salvo: Equipamento, criado: boolean) =>
      criado ? recarregar() : substituir(salvo, (a, b) => a.id === b.id),
    [recarregar, substituir]
  )

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
          busca={lista.busca}
          onBuscaChange={lista.setBusca}
        />
        <CardFlush className="border-t-0">
          {lista.erro && !equipamentos ? (
            <EmptyState
              title="Não foi possível carregar os equipamentos"
              description={lista.erro}
              action={
                <Button variant="outline" onClick={lista.recarregar}>
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
          ) : equipamentos.length === 0 ? (
            !lista.buscando ? (
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
                {equipamentos.map((eq) => (
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
        {lista.pagina && lista.pagina.totalElementos > 0 && (
          <Paginacao
            pagina={lista.pagina}
            carregando={lista.carregando}
            onIrPara={lista.irPara}
            singular="equipamento"
            plural="equipamentos"
          />
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
        onExcluido={lista.recarregar}
      />
    </>
  )
}
