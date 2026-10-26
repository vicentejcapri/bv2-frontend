import { useEffect, useRef, useState } from "react"
import type { KeyboardEvent } from "react"
import { Check, ChevronsUpDown, Loader2, Plus, Search } from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useAuth } from "@/hooks/useAuth"
import { ApiError } from "@/lib/api"
import { listarClientes } from "@/lib/cliente-api"
import type { Cliente } from "@/lib/cliente-api"
import { maskTelefone } from "@/lib/format"
import { cn } from "@/lib/utils"

/** Espera entre a última tecla e a ida ao servidor. */
const ATRASO_BUSCA_MS = 250

/** Quantas sugestões mostrar: o resto se acha digitando mais. */
const LIMITE = 10

type Resultado = { termo: string; clientes: Cliente[]; erro?: string }

/**
 * Seleção de cliente por digitação: busca no servidor (parte do nome ou do
 * telefone) só entre os ativos, em vez de carregar a carteira inteira num select.
 *
 * Cada opção e o próprio campo mostram nome **e telefone**: com dois "João da
 * Silva" na carteira, só o nome não deixa saber qual foi escolhido.
 */
export function ClienteCombobox({
  id,
  value,
  onChange,
  onCriar,
  invalido,
  descritoPor,
}: {
  id: string
  value: Cliente | null
  onChange: (cliente: Cliente) => void
  /** Mostra "Criar novo cliente" no fim da lista. */
  onCriar?: () => void
  invalido?: boolean
  descritoPor?: string
}) {
  const { token, logout } = useAuth()
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState("")
  const [termo, setTermo] = useState("")
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [ativo, setAtivo] = useState(0)
  const listaRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setTermo(busca.trim()), ATRASO_BUSCA_MS)
    return () => clearTimeout(timer)
  }, [busca])

  useEffect(() => {
    if (!token || !aberto) return
    let cancelado = false
    listarClientes(token, { busca: termo || undefined, ativo: true, size: LIMITE })
      .then((pagina) => {
        if (cancelado) return
        setResultado({ termo, clientes: pagina.conteudo })
        setAtivo(0)
      })
      .catch((error) => {
        if (cancelado) return
        if (error instanceof ApiError && error.status === 401) return logout()
        setResultado({
          termo,
          clientes: [],
          erro: error instanceof ApiError ? error.message : "Não foi possível buscar os clientes.",
        })
      })
    return () => {
      cancelado = true
    }
  }, [token, logout, termo, aberto])

  const carregando = resultado?.termo !== termo || busca.trim() !== termo
  const clientes = resultado?.clientes ?? []
  // A opção "Criar" é o último índice navegável pelo teclado.
  const total = clientes.length + (onCriar ? 1 : 0)

  const abrir = (proximo: boolean) => {
    setAberto(proximo)
    if (!proximo) setBusca("")
  }

  const escolher = (cliente: Cliente) => {
    onChange(cliente)
    abrir(false)
  }

  const criar = () => {
    abrir(false)
    onCriar?.()
  }

  const aoTeclar = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      if (total === 0) return
      const proximo = (ativo + (event.key === "ArrowDown" ? 1 : -1) + total) % total
      setAtivo(proximo)
      listaRef.current
        ?.querySelector(`[data-indice="${proximo}"]`)
        ?.scrollIntoView({ block: "nearest" })
    } else if (event.key === "Enter") {
      // Enter escolhe a opção destacada; nunca envia o formulário de fora.
      event.preventDefault()
      if (carregando) return
      if (ativo < clientes.length) escolher(clientes[ativo])
      else if (onCriar) criar()
    }
  }

  return (
    <Popover open={aberto} onOpenChange={abrir}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          role="combobox"
          aria-expanded={aberto}
          aria-haspopup="listbox"
          aria-invalid={invalido ? true : undefined}
          aria-describedby={descritoPor}
          className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-input bg-card px-3 py-1 text-left text-sm shadow-xs outline-none transition-[color,box-shadow,border-color] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-3 aria-[invalid=true]:ring-destructive/20"
        >
          {value ? (
            <span className="flex min-w-0 items-baseline gap-2">
              <span className="truncate font-medium">{value.nome}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {maskTelefone(value.telefone)}
              </span>
            </span>
          ) : (
            <span className="truncate text-muted-foreground">Buscar cliente…</span>
          )}
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-72 gap-0 p-0"
        // O foco vai para o campo de busca, não para o primeiro item.
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            autoFocus
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            onKeyDown={aoTeclar}
            placeholder="Nome ou telefone…"
            aria-label="Buscar cliente por nome ou telefone"
            aria-controls={`${id}-opcoes`}
            aria-activedescendant={total > 0 ? `${id}-opcao-${ativo}` : undefined}
            className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {carregando && (
            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
          )}
        </div>

        <ul
          ref={listaRef}
          id={`${id}-opcoes`}
          role="listbox"
          aria-label="Clientes"
          className="max-h-64 overflow-y-auto p-1"
        >
          {resultado?.erro ? (
            <li className="px-2 py-3 text-center text-sm text-destructive">{resultado.erro}</li>
          ) : !resultado ? null : clientes.length === 0 ? (
            <li className="px-2 py-3 text-center text-sm text-muted-foreground">
              {termo ? "Nenhum cliente ativo encontrado." : "Nenhum cliente ativo cadastrado."}
            </li>
          ) : (
            clientes.map((cliente, indice) => (
              <li
                key={cliente.id}
                id={`${id}-opcao-${indice}`}
                data-indice={indice}
                role="option"
                aria-selected={value?.id === cliente.id}
                onMouseEnter={() => setAtivo(indice)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => escolher(cliente)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5",
                  indice === ativo && "bg-muted"
                )}
              >
                <Check
                  className={cn(
                    "size-4 shrink-0",
                    value?.id === cliente.id ? "opacity-100" : "opacity-0"
                  )}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate">{cliente.nome}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {maskTelefone(cliente.telefone)}
                </span>
              </li>
            ))
          )}

          {onCriar && (
            <li
              id={`${id}-opcao-${clientes.length}`}
              data-indice={clientes.length}
              role="option"
              aria-selected={false}
              onMouseEnter={() => setAtivo(clientes.length)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={criar}
              className={cn(
                "mt-1 flex cursor-pointer items-center gap-2 rounded-md border-t border-border px-2 py-1.5",
                ativo === clientes.length && "bg-muted"
              )}
            >
              <Plus className="size-3.5 shrink-0" aria-hidden />
              Criar novo cliente
            </li>
          )}
        </ul>

        {!termo && clientes.length === LIMITE && (
          <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
            Mostrando os {LIMITE} primeiros. Digite para encontrar os outros.
          </p>
        )}
      </PopoverContent>
    </Popover>
  )
}
