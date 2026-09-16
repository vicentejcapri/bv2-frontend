import type { ReactNode } from "react"
import { CheckCircle2, TriangleAlert } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import bv2Logo from "@/assets/bv2_logo.jpeg"

/**
 * Moldura das telas públicas (login e recuperação de senha): logo, título e um
 * card centralizado. Mantém as três telas com a mesma cara e sem ruído.
 */
export function AuthShell({
  titulo,
  descricao,
  children,
}: {
  titulo: string
  descricao?: ReactNode
  children: ReactNode
}) {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-sm motion-safe:animate-fade-up">
        <div className="mb-6 flex flex-col items-center gap-4 text-center">
          <img
            src={bv2Logo}
            alt="BV2 Software"
            className="size-12 rounded-xl object-cover ring-1 ring-border"
          />
          <div className="space-y-1">
            <h1 className="font-heading text-xl font-semibold tracking-tight">
              {titulo}
            </h1>
            {descricao && (
              <p className="text-sm text-muted-foreground">{descricao}</p>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="p-6 [&:first-child]:pt-6">{children}</CardContent>
        </Card>
      </div>
    </main>
  )
}

/** Mensagem de desfecho dentro do card — erro do servidor ou aviso de sucesso. */
export function AuthAlert({
  tom,
  children,
}: {
  tom: "erro" | "sucesso"
  children: ReactNode
}) {
  const Icone = tom === "erro" ? TriangleAlert : CheckCircle2
  return (
    <div
      role={tom === "erro" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm",
        tom === "erro"
          ? "bg-destructive-soft text-destructive-soft-foreground"
          : "bg-success-soft text-success-soft-foreground"
      )}
    >
      <Icone className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  )
}
