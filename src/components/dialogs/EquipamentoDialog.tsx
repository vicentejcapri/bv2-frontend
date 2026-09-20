import { useEffect, useState } from "react"
import type { FormEvent, KeyboardEvent } from "react"
import { Loader2, X } from "lucide-react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CRIAR, CriarItem } from "./CriarItem"
import { Field } from "./Field"
import { useAuth } from "@/hooks/useAuth"
import { ApiError } from "@/lib/api"
import { listarClientes } from "@/lib/cliente-api"
import type { Cliente } from "@/lib/cliente-api"
import { atualizarEquipamento, criarEquipamento } from "@/lib/equipamento-api"
import type { Equipamento } from "@/lib/equipamento-api"
import { fieldProps } from "@/lib/form"
import { criarMarca, listarMarcas } from "@/lib/marca-api"
import type { Marca } from "@/lib/marca-api"

type Erros = Partial<Record<"clienteId" | "marcaId" | "nome" | "geral", string>>

/** Dono já decidido por quem abriu o modal (o cliente da OS, por exemplo). */
type ClienteFixo = { id: number; nome: string }

/**
 * Cadastro e edição do equipamento: com `equipamento` edita (PUT, só marca e
 * nome — o dono é imutável), sem ele cadastra (POST).
 */
export function EquipamentoDialog({
  open,
  onOpenChange,
  equipamento,
  clienteFixo,
  onSalvo,
}: {
  open: boolean
  onOpenChange: (aberto: boolean) => void
  equipamento?: Equipamento
  /** No cadastro, fixa o dono em vez de perguntar por ele. */
  clienteFixo?: ClienteFixo
  onSalvo: (equipamento: Equipamento, criado: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* O conteúdo desmonta ao fechar, então cada abertura começa limpa. */}
        <EquipamentoForm
          equipamento={equipamento}
          clienteFixo={clienteFixo}
          onSalvo={(salvo) => {
            onSalvo(salvo, !equipamento)
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

function EquipamentoForm({
  equipamento,
  clienteFixo,
  onSalvo,
}: {
  equipamento?: Equipamento
  clienteFixo?: ClienteFixo
  onSalvo: (equipamento: Equipamento) => void
}) {
  const { token, logout } = useAuth()
  const editando = !!equipamento
  /** Dono imutável: o da edição ou o que veio pronto de quem abriu o modal. */
  const dono = equipamento?.cliente ?? clienteFixo
  const temDono = !!dono

  const [clientes, setClientes] = useState<Cliente[] | null>(null)
  const [marcas, setMarcas] = useState<Marca[] | null>(null)
  const [erroCarga, setErroCarga] = useState<string | null>(null)

  const [clienteId, setClienteId] = useState(dono ? String(dono.id) : "")
  const [marcaId, setMarcaId] = useState(equipamento ? String(equipamento.marca.id) : "")
  const [nome, setNome] = useState(equipamento?.nome ?? "")
  const [erros, setErros] = useState<Erros>({})
  const [enviando, setEnviando] = useState(false)

  const [criandoMarca, setCriandoMarca] = useState(false)
  const [novaMarca, setNovaMarca] = useState("")
  const [erroNovaMarca, setErroNovaMarca] = useState<string>()
  const [salvandoMarca, setSalvandoMarca] = useState(false)

  useEffect(() => {
    if (!token) return
    let cancelado = false

    // Com o dono decidido não há o que escolher: só as marcas interessam.
    Promise.all([
      temDono ? Promise.resolve(null) : listarClientes(token),
      listarMarcas(token),
    ])
      .then(([paginaClientes, paginaMarcas]) => {
        if (cancelado) return
        // Só cliente ativo pode receber equipamento novo (o backend responde 422).
        setClientes(paginaClientes?.conteudo.filter((c) => c.ativo) ?? [])
        setMarcas(paginaMarcas.conteudo)
      })
      .catch((error) => {
        if (cancelado) return
        if (error instanceof ApiError && error.status === 401) return logout()
        setErroCarga(
          error instanceof ApiError
            ? error.message
            : "Não foi possível carregar clientes e marcas."
        )
      })

    return () => {
      cancelado = true
    }
  }, [token, logout, temDono])

  const tratarErro = (error: unknown, campo: keyof Erros = "geral"): Erros => {
    if (error instanceof ApiError && error.status === 401) {
      logout()
      return {}
    }
    if (error instanceof ApiError && error.status === 400 && error.erros) {
      return { ...error.erros }
    }
    return {
      [campo]: error instanceof ApiError ? error.message : "Algo deu errado. Tente novamente.",
    }
  }

  const cancelarNovaMarca = () => {
    setCriandoMarca(false)
    setNovaMarca("")
    setErroNovaMarca(undefined)
  }

  const salvarNovaMarca = async () => {
    if (salvandoMarca || !token) return
    const limpo = novaMarca.trim()
    const local = !limpo
      ? "Informe o nome da marca."
      : limpo.length > 50
        ? "O nome deve ter no máximo 50 caracteres."
        : undefined
    setErroNovaMarca(local)
    if (local) return

    setSalvandoMarca(true)
    try {
      const criada = await criarMarca(token, limpo)
      setMarcas((atuais) =>
        [...(atuais ?? []), criada].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
      )
      setMarcaId(String(criada.id))
      setErros((atuais) => ({ ...atuais, marcaId: undefined }))
      cancelarNovaMarca()
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        // A marca já existe: em vez de só reclamar, seleciona a existente.
        const existente = marcas?.find(
          (m) => m.nome.toLowerCase() === limpo.toLowerCase()
        )
        if (existente) {
          setMarcaId(String(existente.id))
          cancelarNovaMarca()
          return
        }
      }
      const tratado = tratarErro(error)
      setErroNovaMarca(tratado.nome ?? tratado.geral)
    } finally {
      setSalvandoMarca(false)
    }
  }

  // Enter no campo da nova marca cria a marca, não envia o equipamento.
  const aoTeclarNovaMarca = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return
    event.preventDefault()
    salvarNovaMarca()
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (enviando || !token) return

    // Mesmas regras do EquipamentoCriacaoRequest / EquipamentoAtualizacaoRequest.
    const limpo = nome.trim()
    const locais: Erros = {
      clienteId: !clienteId ? "Selecione o dono do equipamento." : undefined,
      marcaId: criandoMarca
        ? "Crie a marca ou cancele antes de continuar."
        : !marcaId
          ? "Selecione a marca."
          : undefined,
      nome: !limpo
        ? "Informe o nome do equipamento."
        : limpo.length > 50
          ? "O nome deve ter no máximo 50 caracteres."
          : undefined,
    }
    setErros(locais)
    if (Object.values(locais).some(Boolean)) return

    setEnviando(true)
    try {
      const body = { marcaId: Number(marcaId), nome: limpo }
      onSalvo(
        equipamento
          ? await atualizarEquipamento(token, equipamento.id, body)
          : await criarEquipamento(token, { ...body, clienteId: Number(clienteId) })
      )
    } catch (error) {
      setEnviando(false)
      // 409 = mesmo cliente, mesma marca, mesmo nome: o conflito é do nome.
      if (error instanceof ApiError && error.status === 409) {
        return setErros({
          nome: "Este cliente já tem um equipamento com esse nome dessa marca. Mude o nome ou a marca.",
        })
      }
      // 422 = o cliente foi inativado enquanto o modal estava aberto.
      setErros(
        tratarErro(error, error instanceof ApiError && error.status === 422 ? "clienteId" : "geral")
      )
    }
  }

  const carregando = !marcas && !erroCarga

  return (
    <DialogForm onSubmit={handleSubmit} noValidate>
      <DialogHeader>
        <DialogTitle>{editando ? "Editar equipamento" : "Novo equipamento"}</DialogTitle>
        <DialogDescription>
          {editando
            ? "O dono não pode ser trocado: o histórico de ordens de serviço é do equipamento."
            : clienteFixo
              ? `O equipamento nasce vinculado a ${clienteFixo.nome} e já fica disponível para a ordem de serviço.`
              : "Cada equipamento fica vinculado a um cliente e pode ser usado em várias ordens de serviço."}
        </DialogDescription>
      </DialogHeader>

      <DialogBody className="space-y-4">
        {erroCarga && <AuthAlert tom="erro">{erroCarga}</AuthAlert>}

        <Field id="equip-nome" label="Nome" required error={erros.nome}>
          <Input
            {...fieldProps("equip-nome", erros.nome)}
            value={nome}
            maxLength={50}
            onChange={(event) => setNome(event.target.value)}
            placeholder="Furadeira de impacto"
            autoFocus
          />
        </Field>

        <Field id="equip-marca" label="Marca" required error={erros.marcaId ?? erroNovaMarca}>
          {criandoMarca ? (
            <div className="flex gap-2">
              <Input
                {...fieldProps("equip-marca", erros.marcaId ?? erroNovaMarca)}
                value={novaMarca}
                maxLength={50}
                onChange={(event) => setNovaMarca(event.target.value)}
                onKeyDown={aoTeclarNovaMarca}
                placeholder="Nome da nova marca"
                autoFocus
              />
              <Button
                type="button"
                variant="outline"
                onClick={salvarNovaMarca}
                disabled={salvandoMarca}
                aria-busy={salvandoMarca}
              >
                {salvandoMarca && <Loader2 className="animate-spin" aria-hidden />}
                Criar
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={cancelarNovaMarca}
                disabled={salvandoMarca}
              >
                <X />
                <span className="sr-only">Cancelar nova marca</span>
              </Button>
            </div>
          ) : (
            <Select
              value={marcaId}
              onValueChange={(valor) => {
                if (valor === CRIAR) return setCriandoMarca(true)
                setMarcaId(valor)
                setErros((atuais) => ({ ...atuais, marcaId: undefined }))
              }}
              disabled={!marcas}
            >
              <SelectTrigger
                id="equip-marca"
                aria-invalid={erros.marcaId ? true : undefined}
                aria-describedby={erros.marcaId ? "equip-marca-error" : undefined}
              >
                <SelectValue placeholder={carregando ? "Carregando…" : "Selecione a marca"} />
              </SelectTrigger>
              <SelectContent>
                {marcas?.map((marca) => (
                  <SelectItem key={marca.id} value={String(marca.id)}>
                    {marca.nome}
                  </SelectItem>
                ))}
                <CriarItem separador={(marcas?.length ?? 0) > 0}>
                  Criar nova marca
                </CriarItem>
              </SelectContent>
            </Select>
          )}
        </Field>

        <Field
          id="equip-cliente"
          label="Dono"
          required={!dono}
          error={erros.clienteId}
          hint={
            dono
              ? undefined
              : clientes?.length === 0
                ? "Nenhum cliente ativo. Cadastre ou ative um cliente primeiro."
                : "Só aparecem clientes ativos."
          }
        >
          {dono ? (
            <Input id="equip-cliente" value={dono.nome} disabled />
          ) : (
            <Select
              value={clienteId}
              onValueChange={(valor) => {
                setClienteId(valor)
                setErros((atuais) => ({ ...atuais, clienteId: undefined }))
              }}
              disabled={!clientes || clientes.length === 0}
            >
              <SelectTrigger
                id="equip-cliente"
                aria-invalid={erros.clienteId ? true : undefined}
                aria-describedby={erros.clienteId ? "equip-cliente-error" : undefined}
              >
                <SelectValue placeholder={carregando ? "Carregando…" : "Selecione o cliente"} />
              </SelectTrigger>
              <SelectContent>
                {clientes?.map((cliente) => (
                  <SelectItem key={cliente.id} value={String(cliente.id)}>
                    {cliente.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>

        {erros.geral && <AuthAlert tom="erro">{erros.geral}</AuthAlert>}
      </DialogBody>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={enviando || !marcas} aria-busy={enviando}>
          {enviando && <Loader2 className="animate-spin" aria-hidden />}
          {editando ? "Salvar alterações" : "Cadastrar equipamento"}
        </Button>
      </DialogFooter>
    </DialogForm>
  )
}
