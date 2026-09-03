import { useState } from "react"
import type { FormEvent } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogForm,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field } from "./Field"
import { fieldProps } from "@/lib/form"
import { useDados } from "@/hooks/useDados"
import type { Equipamento } from "@/data/mocks"

type Erros = Partial<Record<"tipo" | "marca" | "cliente", string>>

const VAZIO = {
  tipo: "",
  marca: "",
  modelo: "",
  serie: "",
  cliente: "",
}

export function NovoEquipamentoDialog({
  onCreated,
}: {
  onCreated?: (equipamento: Equipamento) => void
}) {
  const { addEquipamento, clientes } = useDados()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(VAZIO)
  const [erros, setErros] = useState<Erros>({})

  const fechar = (aberto: boolean) => {
    setOpen(aberto)
    if (!aberto) {
      setForm(VAZIO)
      setErros({})
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    const novosErros: Erros = {}
    if (!form.tipo.trim()) novosErros.tipo = "Informe o tipo do equipamento."
    if (!form.marca.trim()) novosErros.marca = "Informe a marca."
    if (!form.cliente) novosErros.cliente = "Selecione o proprietário."

    setErros(novosErros)
    if (Object.keys(novosErros).length > 0) return

    const equipamento = addEquipamento({
      tipo: form.tipo.trim(),
      marca: form.marca.trim(),
      modelo: form.modelo.trim() || "—",
      serie: form.serie.trim() || "—",
      cliente: form.cliente,
    })
    onCreated?.(equipamento)
    fechar(false)
  }

  return (
    <Dialog open={open} onOpenChange={fechar}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Novo equipamento
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogForm onSubmit={handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>Novo equipamento</DialogTitle>
            <DialogDescription>
              Cada equipamento fica vinculado a um cliente e pode ser usado em
              várias ordens de serviço.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="equip-tipo" label="Tipo" required error={erros.tipo}>
                <Input
                  {...fieldProps("equip-tipo", erros.tipo)}
                  value={form.tipo}
                  onChange={(event) =>
                    setForm({ ...form, tipo: event.target.value })
                  }
                  placeholder="Torno Mecânico"
                  autoFocus
                />
              </Field>

              <Field id="equip-marca" label="Marca" required error={erros.marca}>
                <Input
                  {...fieldProps("equip-marca", erros.marca)}
                  value={form.marca}
                  onChange={(event) =>
                    setForm({ ...form, marca: event.target.value })
                  }
                  placeholder="Romi"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="equip-modelo" label="Modelo">
                <Input
                  id="equip-modelo"
                  value={form.modelo}
                  onChange={(event) =>
                    setForm({ ...form, modelo: event.target.value })
                  }
                  placeholder="Centur 30D"
                />
              </Field>

              <Field id="equip-serie" label="Nº de série">
                <Input
                  id="equip-serie"
                  value={form.serie}
                  onChange={(event) =>
                    setForm({ ...form, serie: event.target.value })
                  }
                  placeholder="RM-30D-0871"
                  className="font-mono"
                />
              </Field>
            </div>

            <Field
              id="equip-cliente"
              label="Proprietário"
              required
              error={erros.cliente}
              hint="Só aparecem clientes já cadastrados."
            >
              <Select
                value={form.cliente}
                onValueChange={(cliente) => setForm({ ...form, cliente })}
              >
                <SelectTrigger
                  id="equip-cliente"
                  aria-invalid={erros.cliente ? true : undefined}
                >
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.nome}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </DialogBody>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit">Cadastrar equipamento</Button>
          </DialogFooter>
        </DialogForm>
      </DialogContent>
    </Dialog>
  )
}
