"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

// DESIGN.md: product-tab = rounded-none, transparent bg, underline active
const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center text-muted-foreground group-data-horizontal/tabs:h-10",
  {
    variants: {
      variant: {
        default: "bg-muted/50 rounded-md p-1",
        // product-tab: no bg, no rounding
        line: "gap-0 bg-transparent rounded-none border-b border-[var(--bubblepi-hairline)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-10 flex-1 items-center justify-center gap-1.5 px-3 py-1 font-[family-name:var(--font-cereal)] text-sm font-semibold whitespace-nowrap transition-all focus-visible:outline-2 focus-visible:outline-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[variant=line]/tabs-list:rounded-none data-[variant=line]/tabs-list:data-active:bg-transparent",
        // product-tab-inactive: muted text
        "text-[var(--bubblepi-muted)]",
        // product-tab-active: ink text with underline
        "data-active:text-[var(--bubblepi-ink)]",
        "group-data-[variant=line]/tabs-list:after:absolute after:bg-[var(--bubblepi-ink)] after:opacity-0 after:transition-opacity after:inset-x-0 after:bottom-0 after:h-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }