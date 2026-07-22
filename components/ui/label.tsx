"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

// DESIGN.md: caption typography (14px/500)
function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 font-[family-name:var(--font-cereal)] text-sm font-medium leading-[1.29] text-[var(--bubblepi-muted)] select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
