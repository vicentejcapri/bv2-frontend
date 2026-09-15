import { useState } from "react"
import type { FormEvent } from "react"
import { Loader2 } from "lucide-react"

import { AuthAlert } from "@/components/layout/AuthShell"
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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Field } from "./Field"
import { useAuth } from "@/hooks/useAuth"
import { ApiError } from "@/lib/api"
import { atualizarCliente, criarCliente } from "@/lib/cliente-api"
import type { Cliente } from "@/lib/cliente-api"
import { fieldProps } from "@/lib/form"
import { maskTelefone } from "@/lib/format"

type Erros = Partial<Record<"nome" | "telefone" | "geral", string>>

/**
 * Cadastro e edição do cliente no mesmo formulário: com `cliente` edita (PUT),
 * sem ele cadastra (POST). Quem abre é a página, que decide o modo.
 */
export function ClienteDialog({
  open,
  onOpenChange,
  cliente,
  onSalvo,
}: {
  open: boolean
  onOpenChange: (aberto: boolean) => void
  cliente?: Cliente
  onSalvo: (cliente: Cliente, criado: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* O conteúdo desmonta ao fechar, então cada abertura começa limpa. */}
        <ClienteForm
          cliente={cliente}
          onSalvo={(salvo) => {
            onSalvo(salvo, !cliente)
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

function ClienteForm({
  cliente,
  onSalvo,
}: {
  cliente?: Cliente
  onSalvo: (cliente: Cliente) => void
}) {
  const { token, logout } = useAuth()
  const [nome, setNome] = useState(cliente?.nome ?? "")
  const [telefone, setTelefone] = useState(maskTelefone(cliente?.telefone ?? ""))
  const [erros, setErros] = useState<Erros>({})
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (enviando || !token) return

    // Mesmas regras do ClienteCriacaoRequest / ClienteAtualizacaoRequest.
    const limpo = nome.trim()
    const digitos = telefone.replace(/\D/g, "")
    const locais: Erros = {
      nome: !limpo
        ? "Informe o nome do cliente."
        : limpo.length > 50
          ? "O nome deve ter no máximo 50 caracteres."
          : undefined,
      telefone:
        digitos.length < 10 ? "Telefone incompleto — inclua o DDD." : undefined,
    }
    setErros(locais)
    if (Object.values(locais).some(Boolean)) return

    setEnviando(true)
    try {
      const body = { nome: limpo, telefone: digitos }
      onSalvo(
        cliente
          ? await atualizarCliente(token, cliente.id, body)
          : await criarCliente(token, body)
      )
    } catch (error) {
      setEnviando(false)
      if (error instanceof ApiError && error.status === 401) return logout()
      if (error instanceof ApiError && error.status === 400 && error.erros) {
        return setErros({ ...error.erros })
      }
      setErros({
        geral:
          error instanceof ApiError
            ? error.message
            : "Algo deu errado. Tente novamente.",
      })
    }
  }

  return (
    <DialogForm onSubmit={handleSubmit} noValidate>
      <DialogHeader>
        <DialogTitle>{cliente ? "Editar cliente" : "Novo cliente"}</DialogTitle>
        <DialogDescription>
          O telefone é usado para os avisos automáticos de WhatsApp.
        </DialogDescription>
      </DialogHeader>

      <DialogBody className="space-y-4">
        <Field id="cliente-nome" label="Nome" required error={erros.nome}>
          <Input
            {...fieldProps("cliente-nome", erros.nome)}
            value={nome}
            maxLength={50}
            onChange={(event) => setNome(event.target.value)}
            placeholder="João Silva ou Oficina do Beto"
            autoFocus
          />
        </Field>

        <Field
          id="cliente-telefone"
          label="Telefone"
          required
          error={erros.telefone}
        >
          <Input
            {...fieldProps("cliente-telefone", erros.telefone)}
            value={telefone}
            onChange={(event) => setTelefone(maskTelefone(event.target.value))}
            inputMode="tel"
            placeholder="(42) 99999-1111"
          />
        </Field>

        {erros.geral && <AuthAlert tom="erro">{erros.geral}</AuthAlert>}
      </DialogBody>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={enviando} aria-busy={enviando}>
          {enviando && <Loader2 className="animate-spin" aria-hidden />}
          {cliente ? "Salvar alterações" : "Cadastrar cliente"}
        </Button>
      </DialogFooter>
    </DialogForm>
  )
}
