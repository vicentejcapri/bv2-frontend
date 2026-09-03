import { MoreHorizontal, Phone } from "lucide-react"

import { Badge } from "@/components/ui/badge"
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
import { Initials } from "@/components/Initials"
import { PageHeader } from "@/components/PageHeader"
import { NovoClienteDialog } from "@/components/dialogs/NovoClienteDialog"
import { useDados } from "@/hooks/useDados"

export function ClientesPage() {
  const { clientes } = useDados()

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Gerencie sua carteira de pessoas físicas e jurídicas."
        actions={<NovoClienteDialog />}
      />

      <Card className="overflow-hidden">
        <DataToolbar placeholder="Buscar por nome, telefone ou cidade…" />
        <CardFlush className="border-t-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead className="hidden md:table-cell">Cidade</TableHead>
                <TableHead className="text-right">OS</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map((cliente) => (
                <TableRow key={cliente.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Initials name={cliente.nome} />
                      <span className="font-medium text-foreground">
                        {cliente.nome}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={cliente.tipo === "PJ" ? "info" : "neutral"}
                    >
                      {cliente.tipo === "PJ" ? "Jurídica" : "Física"}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <a
                      href={`tel:${cliente.telefone.replace(/\D/g, "")}`}
                      className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Phone className="size-3.5" />
                      {cliente.telefone}
                    </a>
                  </TableCell>

                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {cliente.cidade}
                  </TableCell>

                  <TableCell className="text-right font-medium">
                    {cliente.ordens}
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <MoreHorizontal />
                      <span className="sr-only">Ações de {cliente.nome}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardFlush>
        <CardFooter className="text-xs text-muted-foreground">
          <strong className="text-foreground">{clientes.length}</strong>
          <span className="-ml-1">clientes cadastrados</span>
        </CardFooter>
      </Card>
    </>
  )
}
