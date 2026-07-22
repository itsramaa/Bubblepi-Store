import * as React from "react"

import { cn } from "@/lib/utils"

// DESIGN.md: text-input adaptasi — h-14, rounded-sm, 1px hairline, no glow
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-[var(--bubblepi-radius-sm)] border border-[var(--bubblepi-hairline)] bg-white px-3 py-3.5 text-base font-[family-name:var(--font-cereal)] text-[var(--bubblepi-ink)] transition-colors outline-none placeholder:text-[var(--bubblepi-muted)] focus-visible:border-2 focus-visible:border-[var(--bubblepi-ink)] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:border-2",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
