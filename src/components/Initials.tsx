import { cn } from "@/lib/utils"

/** Duas primeiras iniciais de um nome ("Oficina do Beto" -> "OB"). */
function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter((word) => word.length > 2 || /^[A-ZÀ-Ú]/.test(word))
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
}

export function Initials({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground ring-1 ring-inset ring-border",
        className
      )}
    >
      {initialsOf(name)}
    </span>
  )
}
