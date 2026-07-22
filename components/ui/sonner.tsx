"use client"

import { Toaster as Sonner } from "sonner"

// DESIGN.md: sonner = white surface, rounded-md, no shadow tier per Airbnb style
const Toaster = ({ ...props }: React.ComponentProps<typeof Sonner>) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-white group-[.toaster]:text-[var(--bubblepi-ink)] group-[.toaster]:border-[var(--bubblepi-hairline)] group-[.toaster]:rounded-[var(--bubblepi-radius-md)] group-[.toaster]:shadow-[var(--bubblepi-shadow-card-hover)]",
          description: "group-[.toast]:text-[var(--bubblepi-muted)]",
          actionButton: "group-[.toast]:bg-[var(--bubblepi-primary)] group-[.toast]:text-white",
          cancelButton: "group-[.toast]:bg-[var(--bubblepi-surface-soft)] group-[.toast]:text-[var(--bubblepi-muted)]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
