import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center bg-clip-padding font-[family-name:var(--font-cereal)] whitespace-nowrap transition-all outline-none select-none focus-visible:outline-2 focus-visible:outline-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // button-primary: 48px height, 8px radius, 14px 24px padding, weight 500
        default:
          "bg-[var(--bubblepi-primary)] text-white hover:bg-[var(--bubblepi-primary-active)] h-12 px-6 rounded-sm text-base font-medium",
        // button-secondary: white bg, ink border, 48px height
        secondary:
          "bg-white text-[var(--bubblepi-ink)] border border-[var(--bubblepi-ink)] hover:bg-[var(--bubblepi-surface-soft)] h-12 px-[23px] rounded-sm text-base font-medium",
        // button-tertiary-text: transparent, ink text
        ghost:
          "bg-transparent text-[var(--bubblepi-ink)] hover:underline h-auto px-0 text-base font-medium",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 h-12 px-6 rounded-sm",
        // button-pill: pill-shaped pink CTA
        pill:
          "bg-[var(--bubblepi-primary)] text-white hover:bg-[var(--bubblepi-primary-active)] rounded-full px-5 py-2.5 text-sm font-medium",
        link: "text-primary underline-offset-4 hover:underline",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
      },
      size: {
        default: "h-12 px-6",
        sm: "h-10 px-4 text-sm",
        lg: "h-14 px-8 text-lg",
        icon: "size-12 rounded-full",
        "icon-sm": "size-8 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }