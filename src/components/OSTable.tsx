import { MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Initials } from "@/components/Initials"
import { OSStatusBadge } from "@/components/StatusBadge"
import { numeroOS, resumoEquipamentos } from "@/lib/os"
import type { OrdemServico } from "@/data/mocks"

export function OSTable({
  ordens,
  compact = false,
}: {
  ordens: OrdemServico[]
  /** Versão reduzida usada no painel resumo. */
  compact?: boolean
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[110px]">Número</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead className="hidden md:table-cell">Equipamento</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden sm:table-cell">Entrada</TableHead>
          <TableHead className="text-right">Valor</TableHead>
          {!compact && <TableHead className="w-12" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {ordens.map((os) => (
          <TableRow key={os.id} className="group">
            <TableCell className="font-mono text-[0.8125rem] font-medium text-muted-foreground">
              {numeroOS(os.id)}
            </TableCell>

            <TableCell>
              <div className="flex items-center gap-2.5">
                <Initials name={os.cliente} className="size-7" />
                <span className="font-medium text-foreground">{os.cliente}</span>
              </div>
            </TableCell>

            <TableCell className="hidden max-w-[220px] truncate md:table-cell text-muted-foreground">
              {resumoEquipamentos(os.itens)}
            </TableCell>

            <TableCell>
              <OSStatusBadge status={os.status} />
            </TableCell>

            <TableCell className="hidden text-muted-foreground sm:table-cell">
              {os.entrada}
            </TableCell>

            <TableCell className="text-right font-medium">{os.valor}</TableCell>

            {!compact && (
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <MoreHorizontal />
                  <span className="sr-only">
                    Ações da ordem de serviço {numeroOS(os.id)}
                  </span>
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
