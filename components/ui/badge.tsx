import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// DESIGN.md: guest-favorite-badge = rounded-full, 11px/600, 4px 10px padding
// new-tag = uppercase 8px/700
const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden border border-transparent font-[family-name:var(--font-cereal)] whitespace-nowrap transition-all aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        // guest-favorite-badge: white pill, 11px/600
        default:
          "bg-white text-[var(--bubblepi-ink)] rounded-full px-2.5 py-1 text-[11px] font-semibold leading-[1.18]",
        secondary:
          "bg-secondary text-secondary-foreground rounded-full px-2.5 py-1 text-xs font-medium",
        destructive:
          "bg-destructive/10 text-destructive rounded-md px-2 py-0.5 text-xs font-medium",
        outline:
          "border-[var(--bubblepi-hairline)] text-foreground rounded-md px-2 py-0.5 text-xs font-medium",
        // new-tag: uppercase 8px/700
        ghost:
          "bg-white text-[var(--bubblepi-ink)] rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.32px] leading-[1.25]",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }