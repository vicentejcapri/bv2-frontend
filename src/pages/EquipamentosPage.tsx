import { MoreHorizontal, Wrench } from "lucide-react"

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
import { NovoEquipamentoDialog } from "@/components/dialogs/NovoEquipamentoDialog"
import { useDados } from "@/hooks/useDados"

export function EquipamentosPage() {
  const { equipamentos } = useDados()

  return (
    <>
      <PageHeader
        title="Equipamentos"
        description="Máquinas e dispositivos cadastrados para manutenção."
        actions={<NovoEquipamentoDialog />}
      />

      <Card className="overflow-hidden">
        <DataToolbar placeholder="Buscar por tipo, marca, modelo ou série…" />
        <CardFlush className="border-t-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Equipamento</TableHead>
                <TableHead className="hidden sm:table-cell">Modelo</TableHead>
                <TableHead className="hidden lg:table-cell">Nº de série</TableHead>
                <TableHead>Proprietário</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipamentos.map((eq) => (
                <TableRow key={eq.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground ring-1 ring-inset ring-border">
                        <Wrench className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{eq.tipo}</p>
                        <p className="text-xs text-muted-foreground">
                          {eq.marca}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {eq.modelo}
                  </TableCell>

                  <TableCell className="hidden lg:table-cell font-mono text-[0.8125rem] text-muted-foreground">
                    {eq.serie}
                  </TableCell>

                  <TableCell className="font-medium">{eq.cliente}</TableCell>

                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <MoreHorizontal />
                      <span className="sr-only">Ações de {eq.tipo}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardFlush>
        <CardFooter className="text-xs text-muted-foreground">
          <strong className="text-foreground">{equipamentos.length}</strong>
          <span className="-ml-1">equipamentos cadastrados</span>
        </CardFooter>
      </Card>
    </>
  )
}
