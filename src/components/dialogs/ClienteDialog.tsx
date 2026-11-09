import { useState } from "react"
import type { FormEvent } from "react"
import { Loader2, TriangleAlert } from "lucide-react"

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
import {
  atualizarCliente,
  buscarPossiveisDuplicados,
  criarCliente,
} from "@/lib/cliente-api"
import type { Cliente, ClienteInput } from "@/lib/cliente-api"
import { fieldProps } from "@/lib/form"
import { formatDataBR, maskTelefone } from "@/lib/format"
import { ComAjuda } from "@/components/Ajuda"
import { AJUDA } from "@/config/ajuda"

type Erros = Partial<Record<"nome" | "telefone" | "geral", string>>

/** Código do Brasil, fixo no campo: o WhatsApp do n8n precisa do número internacional. */
const DDI = "55"

/**
 * Parte local (DDD + número) de um telefone salvo. Os novos são gravados com o 55
 * na frente (12 ou 13 dígitos); os antigos, sem DDI, aparecem como estão.
 */
function telefoneLocal(salvo: string) {
  const digitos = salvo.replace(/\D/g, "")
  return digitos.length > 11 && digitos.startsWith(DDI) ? digitos.slice(DDI.length) : digitos
}

/** O que vai para a API: 55 + DDD + número, só dígitos. */
function telefoneCompleto(mascarado: string) {
  return DDI + mascarado.replace(/\D/g, "")
}

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
  const [telefone, setTelefone] = useState(maskTelefone(telefoneLocal(cliente?.telefone ?? "")))
  const [erros, setErros] = useState<Erros>({})
  const [enviando, setEnviando] = useState(false)
  // Cliente(s) com o mesmo nome e telefone: o formulário pausa e pede confirmação.
  const [duplicados, setDuplicados] = useState<Cliente[] | null>(null)

  const salvar = async (body: ClienteInput) => {
    if (!token) return
    setEnviando(true)
    try {
      onSalvo(
        cliente
          ? await atualizarCliente(token, cliente.id, body)
          : await criarCliente(token, body)
      )
    } catch (error) {
      setEnviando(false)
      setDuplicados(null)
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

    const body = { nome: limpo, telefone: telefoneCompleto(telefone) }

    // Na edição sem mudar nome nem telefone não há o que avisar de novo.
    const mudouIdentidade =
      !cliente ||
      cliente.nome.toLowerCase() !== limpo.toLowerCase() ||
      cliente.telefone !== body.telefone

    if (mudouIdentidade) {
      setEnviando(true)
      try {
        const parecidos = await buscarPossiveisDuplicados(token, body, cliente?.id)
        if (parecidos.length > 0) {
          setEnviando(false)
          return setDuplicados(parecidos)
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return logout()
        // O aviso é uma ajuda, não uma trava: se a checagem falhar, segue salvando.
      }
    }

    await salvar(body)
  }

  return (
    <DialogForm onSubmit={handleSubmit} noValidate>
      <DialogHeader>
        <ComAjuda conteudo={AJUDA.cliente} className="pr-8">
          <DialogTitle>{cliente ? "Editar cliente" : "Novo cliente"}</DialogTitle>
        </ComAjuda>
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
            onChange={(event) => {
              setNome(event.target.value)
              setDuplicados(null)
            }}
            placeholder="Oficina do Beto"
            autoFocus
          />
        </Field>

        <Field
          id="cliente-telefone"
          label="Telefone"
          required
          error={erros.telefone}
        >
          <div className="relative">
            {/* DDI fixo: o usuário digita só DDD + número. */}
            <span
              className="pointer-events-none absolute inset-y-0 left-0 flex items-center border-r border-input pl-3 pr-2.5 text-sm text-muted-foreground"
              aria-hidden
            >
              +55
            </span>
            <Input
              {...fieldProps("cliente-telefone", erros.telefone)}
              value={telefone}
              onChange={(event) => {
                // Só DDD + número: com o DDI no campo, um "55" colado seria duplicado.
                setTelefone(maskTelefone(telefoneLocal(event.target.value).slice(0, 11)))
                setDuplicados(null)
              }}
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="(42) 99999-1111"
              className="pl-[3.75rem]"
            />
          </div>
        </Field>

        {erros.geral && <AuthAlert tom="erro">{erros.geral}</AuthAlert>}

        {duplicados && (
          <div
            role="alert"
            className="space-y-2 rounded-lg bg-warning-soft px-3 py-2.5 text-sm text-warning-soft-foreground"
          >
            <p className="flex items-center gap-2 font-medium">
              <TriangleAlert className="size-4 shrink-0" aria-hidden />
              {duplicados.length === 1
                ? "Já existe um cliente com este nome e telefone:"
                : "Já existem clientes com este nome e telefone:"}
            </p>
            <ul className="space-y-0.5 pl-6">
              {duplicados.map((d) => (
                <li key={d.id}>
                  <strong className="font-medium">{d.nome}</strong> —{" "}
                  {maskTelefone(d.telefone)}, cadastrado em{" "}
                  {formatDataBR(d.criadoEm.slice(0, 10))}
                  {!d.ativo && " (inativo)"}
                </li>
              ))}
            </ul>
            <p>Confira se não é a mesma pessoa antes de continuar.</p>
          </div>
        )}
      </DialogBody>

      <DialogFooter>
        {duplicados ? (
          <>
            <Button type="button" variant="outline" onClick={() => setDuplicados(null)}>
              Voltar
            </Button>
            <Button
              type="button"
              disabled={enviando}
              aria-busy={enviando}
              onClick={() =>
                salvar({ nome: nome.trim(), telefone: telefoneCompleto(telefone) })
              }
            >
              {enviando && <Loader2 className="animate-spin" aria-hidden />}
              {cliente ? "Salvar mesmo assim" : "Cadastrar mesmo assim"}
            </Button>
          </>
        ) : (
          <>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={enviando} aria-busy={enviando}>
              {enviando && <Loader2 className="animate-spin" aria-hidden />}
              {cliente ? "Salvar alterações" : "Cadastrar cliente"}
            </Button>
          </>
        )}
      </DialogFooter>
    </DialogForm>
  )
}
