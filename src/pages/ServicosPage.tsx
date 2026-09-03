import { MoreHorizontal } from "lucide-react"

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
import { DataToolbar } from "@/components/DataToolbar"
import { PageHeader } from "@/components/PageHeader"
import { NovoServicoDialog } from "@/components/dialogs/NovoServicoDialog"
import { useDados } from "@/hooks/useDados"

export function ServicosPage() {
  const { servicos } = useDados()

  return (
    <>
      <PageHeader
        title="Serviços Base"
        description="Tabela de preços padronizados para agilizar orçamentos."
        actions={<NovoServicoDialog />}
      />

      <Card className="overflow-hidden">
        <DataToolbar placeholder="Buscar serviço…" />
        <CardFlush className="border-t-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[110px]">Código</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead className="hidden md:table-cell">Descrição</TableHead>
                <TableHead className="text-right">Valor base</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicos.map((srv) => (
                <TableRow key={srv.id} className="group">
                  <TableCell className="font-mono text-[0.8125rem] text-muted-foreground">
                    {srv.id}
                  </TableCell>

                  <TableCell className="font-medium text-foreground">
                    {srv.nome}
                  </TableCell>

                  <TableCell className="hidden max-w-md whitespace-normal md:table-cell text-muted-foreground">
                    {srv.descricao}
                  </TableCell>

                  <TableCell className="text-right font-semibold">
                    {srv.valorBase}
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <MoreHorizontal />
                      <span className="sr-only">Ações de {srv.nome}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardFlush>
        <CardFooter className="text-xs text-muted-foreground">
          Valores de referência — podem ser ajustados por OS na hora do
          orçamento.
        </CardFooter>
      </Card>
    </>
  )
}
