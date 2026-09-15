import { useState } from "react"
import type { ComponentProps, KeyboardEvent } from "react"
import { Eye, EyeOff } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/**
 * Campo de senha com botão de mostrar/ocultar e aviso de Caps Lock ligado —
 * a causa mais comum de "senha incorreta" que não é senha incorreta.
 */
export function PasswordInput({
  id,
  className,
  onKeyUp,
  ...props
}: Omit<ComponentProps<typeof Input>, "type"> & { id: string }) {
  const [visivel, setVisivel] = useState(false)
  const [capsLock, setCapsLock] = useState(false)

  const verificarCapsLock = (event: KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(event.getModifierState("CapsLock"))
    onKeyUp?.(event)
  }

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Input
          id={id}
          type={visivel ? "text" : "password"}
          className={cn("h-11 pr-11", className)}
          onKeyUp={verificarCapsLock}
          onBlur={() => setCapsLock(false)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisivel((atual) => !atual)}
          aria-controls={id}
          aria-pressed={visivel}
          aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          {visivel ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {capsLock && (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Caps Lock está ativado.
        </p>
      )}
    </div>
  )
}
