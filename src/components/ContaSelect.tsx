import { Building2 } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/hooks/useAuth"
import { useConta } from "@/hooks/useConta"

/**
 * Seletor do MASTER: em qual conta as telas estão operando. Trocar a conta
 * remonta a página (ver AppLayout), então os dados recarregam sozinhos.
 */
export function ContaSelect() {
  const { usuario } = useAuth()
  const { contaId, contas, trocarConta } = useConta()

  if (contaId === null) return null

  return (
    <Select value={String(contaId)} onValueChange={(valor) => trocarConta(Number(valor))}>
      <SelectTrigger
        aria-label="Conta em que você está operando"
        className="w-44 bg-background sm:w-60"
      >
        <Building2 className="size-4 shrink-0 text-accent" aria-hidden />
        <SelectValue placeholder="Selecione a conta" />
      </SelectTrigger>
      <SelectContent align="end">
        {contas.map((conta) => (
          <SelectItem key={conta.id} value={String(conta.id)}>
            {conta.id === usuario?.id ? `${conta.nome} (você)` : conta.nome}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
