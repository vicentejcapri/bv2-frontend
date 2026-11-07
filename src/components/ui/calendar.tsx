import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { ptBR } from "react-day-picker/locale"

import { cn } from "@/lib/utils"

/**
 * Calendário (react-day-picker) com o visual do tema. Sem o CSS da lib: as
 * classes abaixo cobrem grade, navegação e os estados de seleção de intervalo.
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      locale={ptBR}
      showOutsideDays={showOutsideDays}
      className={cn("p-1", className)}
      classNames={{
        root: "relative",
        months: "flex flex-col gap-4 sm:flex-row",
        month: "flex flex-col gap-3",
        month_caption: "flex h-8 items-center justify-center",
        caption_label: "text-sm font-medium capitalize",
        nav: "absolute inset-x-0 top-1 z-10 flex items-center justify-between px-1",
        button_previous:
          "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-40",
        button_next:
          "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-40",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-10 text-[0.7rem] font-medium uppercase text-muted-foreground sm:w-9",
        week: "mt-1 flex w-full",
        // O fundo do intervalo fica na célula (range_*), para a faixa ser contínua entre os dias.
        day: "relative size-10 p-0 text-center text-sm sm:size-9",
        day_button:
          "inline-flex size-10 items-center justify-center rounded-md font-normal tabular-nums transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 sm:size-9",
        range_start:
          "rounded-l-md bg-accent/15 [&>button]:bg-accent [&>button]:text-accent-foreground [&>button]:hover:bg-accent",
        range_end:
          "rounded-r-md bg-accent/15 [&>button]:bg-accent [&>button]:text-accent-foreground [&>button]:hover:bg-accent",
        range_middle: "bg-accent/15 [&>button]:rounded-none [&>button]:hover:bg-accent/25",
        selected: "",
        today: "[&>button]:font-semibold [&>button]:underline [&>button]:underline-offset-4",
        outside: "text-muted-foreground/50",
        disabled: "pointer-events-none text-muted-foreground/40",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="size-4" aria-hidden />
          ) : (
            <ChevronRight className="size-4" aria-hidden />
          ),
      }}
      {...props}
    />
  )
}

export { Calendar }
