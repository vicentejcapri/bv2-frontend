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
import { maskTelefone } from "@/lib/format"
import type { Cliente } from "@/data/mocks"

type Erros = Partial<Record<"nome" | "telefone", string>>

const VAZIO = {
  nome: "",
  tipo: "PF" as Cliente["tipo"],
  telefone: "",
  cidade: "",
}

export function NovoClienteDialog({
  onCreated,
}: {
  onCreated?: (cliente: Cliente) => void
}) {
  const { addCliente } = useDados()
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
    if (!form.nome.trim()) novosErros.nome = "Informe o nome do cliente."
    if (form.telefone.replace(/\D/g, "").length < 10)
      novosErros.telefone = "Telefone incompleto — inclua o DDD."

    setErros(novosErros)
    if (Object.keys(novosErros).length > 0) return

    const cliente = addCliente({
      nome: form.nome.trim(),
      tipo: form.tipo,
      telefone: form.telefone,
      cidade: form.cidade.trim() || "—",
    })
    onCreated?.(cliente)
    fechar(false)
  }

  return (
    <Dialog open={open} onOpenChange={fechar}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Novo cliente
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogForm onSubmit={handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>Novo cliente</DialogTitle>
            <DialogDescription>
              O telefone é usado para os avisos automáticos de WhatsApp.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <Field id="cliente-nome" label="Nome" required error={erros.nome}>
              <Input
                {...fieldProps("cliente-nome", erros.nome)}
                value={form.nome}
                onChange={(event) =>
                  setForm({ ...form, nome: event.target.value })
                }
                placeholder="João Silva ou Oficina do Beto"
                autoFocus
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="cliente-tipo" label="Tipo">
                <Select
                  value={form.tipo}
                  onValueChange={(tipo) =>
                    setForm({ ...form, tipo: tipo as Cliente["tipo"] })
                  }
                >
                  <SelectTrigger id="cliente-tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PF">Pessoa física</SelectItem>
                    <SelectItem value="PJ">Pessoa jurídica</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field
                id="cliente-telefone"
                label="Telefone"
                required
                error={erros.telefone}
              >
                <Input
                  {...fieldProps("cliente-telefone", erros.telefone)}
                  value={form.telefone}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      telefone: maskTelefone(event.target.value),
                    })
                  }
                  inputMode="tel"
                  placeholder="(42) 99999-1111"
                />
              </Field>
            </div>

            <Field id="cliente-cidade" label="Cidade">
              <Input
                id="cliente-cidade"
                value={form.cidade}
                onChange={(event) =>
                  setForm({ ...form, cidade: event.target.value })
                }
                placeholder="Ponta Grossa/PR"
              />
            </Field>
          </DialogBody>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit">Cadastrar cliente</Button>
          </DialogFooter>
        </DialogForm>
      </DialogContent>
    </Dialog>
  )
}
