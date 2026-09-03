import { MoreHorizontal, TriangleAlert } from "lucide-react"

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
import { cn } from "@/lib/utils"
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
          <TableHead className="w-[110px]">OS</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead className="hidden md:table-cell">Equipamento</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden sm:table-cell">Prazo</TableHead>
          <TableHead className="text-right">Valor</TableHead>
          {!compact && <TableHead className="w-12" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {ordens.map((os) => (
          <TableRow key={os.id} className="group">
            <TableCell className="font-mono text-[0.8125rem] font-medium text-muted-foreground">
              {os.id}
            </TableCell>

            <TableCell>
              <div className="flex items-center gap-2.5">
                <Initials name={os.cliente} className="size-7" />
                <span className="font-medium text-foreground">{os.cliente}</span>
              </div>
            </TableCell>

            <TableCell className="hidden max-w-[220px] truncate md:table-cell text-muted-foreground">
              {os.equipamento}
            </TableCell>

            <TableCell>
              <OSStatusBadge status={os.status} />
            </TableCell>

            <TableCell className="hidden sm:table-cell">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5",
                  os.atrasada ? "font-medium text-destructive" : "text-muted-foreground"
                )}
              >
                {os.atrasada && <TriangleAlert className="size-3.5" />}
                {os.prazo}
              </span>
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
                  <span className="sr-only">Ações da {os.id}</span>
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
