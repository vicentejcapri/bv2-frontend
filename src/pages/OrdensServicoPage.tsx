import { Button } from "@/components/ui/button"
import { Card, CardFlush, CardFooter } from "@/components/ui/card"
import { DataToolbar } from "@/components/DataToolbar"
import { OSTable } from "@/components/OSTable"
import { PageHeader } from "@/components/PageHeader"
import { NovaOSDialog } from "@/components/dialogs/NovaOSDialog"
import { useDados } from "@/hooks/useDados"

export function OrdensServicoPage() {
  const { ordens } = useDados()

  return (
    <>
      <PageHeader
        title="Ordens de Serviço"
        description="Gerencie e acompanhe os serviços em andamento."
        actions={<NovaOSDialog />}
      />

      <Card className="overflow-hidden">
        <DataToolbar placeholder="Buscar por OS, cliente ou equipamento…" />
        <CardFlush className="border-t-0">
          <OSTable ordens={ordens} />
        </CardFlush>
        <CardFooter className="justify-between text-xs text-muted-foreground">
          <span>
            Exibindo <strong className="text-foreground">{ordens.length}</strong>{" "}
            de {ordens.length} ordens
          </span>
          <div className="flex gap-1.5">
            <Button variant="outline" size="xs" disabled>
              Anterior
            </Button>
            <Button variant="outline" size="xs" disabled>
              Próxima
            </Button>
          </div>
        </CardFooter>
      </Card>
    </>
  )
}
