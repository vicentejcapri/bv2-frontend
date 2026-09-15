import type { LucideIcon } from "lucide-react"
import { TrendingDown, TrendingUp } from "lucide-react"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Tone = "neutral" | "info" | "success" | "warning" | "destructive" | "accent"

const TONE_CHIP: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-info-soft text-info-soft-foreground",
  success: "bg-success-soft text-success-soft-foreground",
  warning: "bg-warning-soft text-warning-soft-foreground",
  destructive: "bg-destructive-soft text-destructive-soft-foreground",
  accent: "bg-accent/20 text-foreground",
}

const TONE_VALUE: Record<Tone, string> = {
  neutral: "text-foreground",
  info: "text-foreground",
  success: "text-foreground",
  warning: "text-foreground",
  destructive: "text-destructive",
  accent: "text-foreground",
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  trend,
}: {
  label: string
  value: string
  hint?: string
  icon: LucideIcon
  tone?: Tone
  trend?: { direction: "up" | "down"; value: string }
}) {
  const TrendIcon = trend?.direction === "down" ? TrendingDown : TrendingUp

  return (
    <Card className="p-5 transition-shadow duration-200 hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            TONE_CHIP[tone]
          )}
        >
          <Icon className="size-[18px]" />
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span
          className={cn(
            "font-heading text-3xl font-semibold tracking-tight",
            TONE_VALUE[tone]
          )}
        >
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium",
              trend.direction === "up"
                ? "text-success-soft-foreground"
                : "text-destructive"
            )}
          >
            <TrendIcon className="size-3.5" />
            {trend.value}
          </span>
        )}
      </div>

      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  )
}
