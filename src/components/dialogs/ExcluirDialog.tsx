import { useState } from "react"
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/hooks/useAuth"
import { ApiError } from "@/lib/api"

/**
 * Confirmação de remoção definitiva. O 409 (registro com vínculos, FK
 * ON DELETE RESTRICT) ganha uma mensagem própria de cada tela.
 */
export function ExcluirDialog({
  open,
  onOpenChange,
  titulo,
  nome,
  mensagemConflito,
  excluir,
  onExcluido,
}: {
  open: boolean
  onOpenChange: (aberto: boolean) => void
  titulo: string
  nome?: string
  mensagemConflito: string
  excluir: (token: string) => Promise<unknown>
  onExcluido: () => void
}) {
  const { token, logout } = useAuth()
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const fechar = (aberto: boolean) => {
    if (enviando) return
    if (!aberto) setErro(null)
    onOpenChange(aberto)
  }

  const confirmar = async () => {
    if (!token || enviando) return
    setEnviando(true)
    setErro(null)
    try {
      await excluir(token)
      onExcluido()
      onOpenChange(false)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return logout()
      setErro(
        error instanceof ApiError && error.status === 409
          ? mensagemConflito
          : error instanceof ApiError
            ? error.message
            : "Algo deu errado. Tente novamente."
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={fechar}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>
            {nome && (
              <>
                <strong className="font-medium text-foreground">{nome}</strong>{" "}
                será removido definitivamente. Essa ação não pode ser desfeita.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {erro && (
          <DialogBody>
            <AuthAlert tom="erro">{erro}</AuthAlert>
          </DialogBody>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={enviando}>
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={confirmar}
            disabled={enviando}
            aria-busy={enviando}
          >
            {enviando && <Loader2 className="animate-spin" aria-hidden />}
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
