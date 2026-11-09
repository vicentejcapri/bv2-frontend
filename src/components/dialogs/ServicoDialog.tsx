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
import { Textarea } from "@/components/ui/textarea"
import { Field } from "./Field"
import { useAuth } from "@/hooks/useAuth"
import { ApiError } from "@/lib/api"
import { fieldProps } from "@/lib/form"
import { maskMoeda, parseMoeda } from "@/lib/format"
import { atualizarServico, criarServico } from "@/lib/servico-api"
import type { Servico } from "@/lib/servico-api"
import { ComAjuda } from "@/components/Ajuda"
import { AJUDA } from "@/config/ajuda"

type Erros = Partial<Record<"nome" | "descricao" | "valor" | "geral", string>>

/** NUMERIC(9, 2) no banco: até 7 dígitos inteiros. */
const VALOR_MAXIMO = 9_999_999.99

/**
 * Cadastro e edição do serviço no mesmo formulário: com `servico` edita (PUT),
 * sem ele cadastra (POST).
 */
export function ServicoDialog({
  open,
  onOpenChange,
  servico,
  onSalvo,
}: {
  open: boolean
  onOpenChange: (aberto: boolean) => void
  servico?: Servico
  onSalvo: (servico: Servico, criado: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* O conteúdo desmonta ao fechar, então cada abertura começa limpa. */}
        <ServicoForm
          servico={servico}
          onSalvo={(salvo) => {
            onSalvo(salvo, !servico)
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

function ServicoForm({
  servico,
  onSalvo,
}: {
  servico?: Servico
  onSalvo: (servico: Servico) => void
}) {
  const { token, logout } = useAuth()
  const [nome, setNome] = useState(servico?.nome ?? "")
  const [descricao, setDescricao] = useState(servico?.descricao ?? "")
  // maskMoeda lê os dígitos como centavos: 450 vira "45000" -> "450,00".
  const [valor, setValor] = useState(
    servico ? maskMoeda(String(Math.round(servico.valor * 100))) : ""
  )
  const [erros, setErros] = useState<Erros>({})
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (enviando || !token) return

    // Mesmas regras do ServicoRequest. Valor zero é aceito (serviço sem cobrança).
    const limpo = nome.trim()
    const descricaoLimpa = descricao.trim()
    const numero = parseMoeda(valor)
    const locais: Erros = {
      nome: !limpo
        ? "Informe o nome do serviço."
        : limpo.length > 50
          ? "O nome deve ter no máximo 50 caracteres."
          : undefined,
      descricao:
        descricaoLimpa.length > 500
          ? "A descrição deve ter no máximo 500 caracteres."
          : undefined,
      valor: !valor
        ? "Informe o valor do serviço."
        : numero > VALOR_MAXIMO
          ? "O valor máximo é R$ 9.999.999,99."
          : undefined,
    }
    setErros(locais)
    if (Object.values(locais).some(Boolean)) return

    setEnviando(true)
    try {
      const body = { nome: limpo, descricao: descricaoLimpa || null, valor: numero }
      onSalvo(
        servico
          ? await atualizarServico(token, servico.id, body)
          : await criarServico(token, body)
      )
    } catch (error) {
      setEnviando(false)
      if (error instanceof ApiError && error.status === 401) return logout()
      if (error instanceof ApiError && error.status === 400 && error.erros) {
        return setErros({ ...error.erros })
      }
      if (error instanceof ApiError && error.status === 409) {
        return setErros({
          nome: "Já existe um serviço com esse nome e esse valor. Mude o nome ou o valor.",
        })
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
        <ComAjuda conteudo={AJUDA.servico} className="pr-8">
          <DialogTitle>{servico ? "Editar serviço" : "Novo serviço"}</DialogTitle>
        </ComAjuda>
        <DialogDescription>
          Valor de referência para agilizar orçamentos — pode ser ajustado em
          cada ordem de serviço.
        </DialogDescription>
      </DialogHeader>

      <DialogBody className="space-y-4">
        <Field id="servico-nome" label="Nome do serviço" required error={erros.nome}>
          <Input
            {...fieldProps("servico-nome", erros.nome)}
            value={nome}
            maxLength={50}
            onChange={(event) => setNome(event.target.value)}
            placeholder="Troca de rolamento"
            autoFocus
          />
        </Field>

        <Field
          id="servico-descricao"
          label="Descrição"
          optional
          hint="O que está incluso na mão de obra."
          error={erros.descricao}
        >
          <Textarea
            {...fieldProps("servico-descricao", erros.descricao)}
            value={descricao}
            maxLength={500}
            onChange={(event) => setDescricao(event.target.value)}
            placeholder="Mão de obra para substituição de rolamentos padrão"
            rows={3}
          />
        </Field>

        <Field id="servico-valor" label="Valor" required error={erros.valor}>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              R$
            </span>
            <Input
              {...fieldProps("servico-valor", erros.valor)}
              value={valor}
              onChange={(event) => setValor(maskMoeda(event.target.value))}
              inputMode="numeric"
              placeholder="0,00"
              className="pl-10 text-right font-medium"
            />
          </div>
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
          {servico ? "Salvar alterações" : "Cadastrar serviço"}
        </Button>
      </DialogFooter>
    </DialogForm>
  )
}
