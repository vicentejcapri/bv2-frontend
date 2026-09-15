import { initialsOf } from "@/lib/format"
import { cn } from "@/lib/utils"

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
