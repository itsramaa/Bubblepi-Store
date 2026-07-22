import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

// DESIGN.md text-input: 56px height, 14px 12px padding, rounded-sm (8px)
// 1px hairline border, no glow on focus — border thickens to 2px ink
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-14 w-full min-w-0 rounded-[var(--bubblepi-radius-sm)] border border-[var(--bubblepi-hairline)] bg-white px-3 py-3.5 text-base font-[family-name:var(--font-cereal)] text-[var(--bubblepi-ink)] transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-[var(--bubblepi-muted)] focus-visible:border-2 focus-visible:border-[var(--bubblepi-ink)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:border-2",
        className
      )}
      {...props}
    />
  )
}

export { Input }