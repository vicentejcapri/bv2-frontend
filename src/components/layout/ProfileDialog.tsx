import { useState } from "react"
import { ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const USER = {
  nome: "Proprietário M2",
  email: "admin@m2equipamentos.com.br",
  cargo: "Administrador",
  iniciais: "M2",
}

export function ProfileDialog({ expanded }: { expanded: boolean }) {
  const [open, setOpen] = useState(false)

  const trigger = (
    <button
      type="button"
      className={cn(
        "flex h-12 w-full items-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent/40",
        expanded
          ? "gap-3 px-2 hover:bg-sidebar-accent"
          : "justify-center px-0 hover:bg-sidebar-accent"
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
        {USER.iniciais}
      </span>
      {expanded && (
        <>
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-sm font-medium text-white">
              {USER.nome}
            </span>
            <span className="block truncate text-xs text-sidebar-muted">
              {USER.cargo}
            </span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-sidebar-muted" />
        </>
      )}
    </button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {expanded ? (
          trigger
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>{trigger}</TooltipTrigger>
            <TooltipContent side="right">Meu perfil</TooltipContent>
          </Tooltip>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar perfil</DialogTitle>
          <DialogDescription>
            Altere seus dados de acesso. As mudanças valem no próximo login.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {USER.iniciais}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{USER.nome}</p>
              <p className="truncate text-xs text-muted-foreground">
                {USER.cargo}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="perfil-nome">Nome</Label>
            <Input id="perfil-nome" defaultValue={USER.nome} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="perfil-email">E-mail</Label>
            <Input id="perfil-email" type="email" defaultValue={USER.email} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="perfil-senha">Nova senha</Label>
            <Input
              id="perfil-senha"
              type="password"
              placeholder="Deixe em branco para manter a atual"
            />
          </div>
        </DialogBody>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={() => setOpen(false)}>Salvar alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
