import { useState } from "react"
import type { ReactNode } from "react"
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
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/useAuth"
import { ApiError } from "@/lib/api"

/**
 * Confirmação de remoção definitiva. O 409 (registro com vínculos, FK
 * ON DELETE RESTRICT) ganha uma mensagem própria de cada tela.
 *
 * Com `palavraConfirmacao`, o botão só libera depois que a palavra é digitada
 * exatamente — para exclusões que levam muita coisa junto.
 */
export function ExcluirDialog({
  open,
  onOpenChange,
  titulo,
  nome,
  detalhe,
  palavraConfirmacao,
  mensagemConflito,
  excluir,
  onExcluido,
}: {
  open: boolean
  onOpenChange: (aberto: boolean) => void
  titulo: string
  nome?: string
  /** Aviso extra abaixo da descrição: o que mais vai embora junto. */
  detalhe?: ReactNode
  palavraConfirmacao?: string
  mensagemConflito: string
  excluir: (token: string) => Promise<unknown>
  onExcluido: () => void
}) {
  const { token, logout } = useAuth()
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [digitado, setDigitado] = useState("")

  const confirmado = !palavraConfirmacao || digitado === palavraConfirmacao

  const fechar = (aberto: boolean) => {
    if (enviando) return
    if (!aberto) {
      setErro(null)
      setDigitado("")
    }
    onOpenChange(aberto)
  }

  const confirmar = async () => {
    if (!token || enviando || !confirmado) return
    setEnviando(true)
    setErro(null)
    try {
      await excluir(token)
      onExcluido()
      setDigitado("")
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

        {(detalhe || palavraConfirmacao || erro) && (
          <DialogBody className="space-y-4">
            {detalhe}
            {palavraConfirmacao && (
              <div className="space-y-1.5">
                <label htmlFor="excluir-confirmacao" className="text-sm text-muted-foreground">
                  Para confirmar, digite{" "}
                  <strong className="font-semibold text-foreground">{palavraConfirmacao}</strong>
                </label>
                <Input
                  id="excluir-confirmacao"
                  value={digitado}
                  onChange={(event) => setDigitado(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") confirmar()
                  }}
                  autoComplete="off"
                  autoFocus
                  disabled={enviando}
                />
              </div>
            )}
            {erro && <AuthAlert tom="erro">{erro}</AuthAlert>}
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
            disabled={enviando || !confirmado}
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
