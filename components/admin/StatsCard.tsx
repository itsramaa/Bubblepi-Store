import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface Props {
  title: string
  value: string
  subtitle?: string
  icon?: LucideIcon
  variant?: "default" | "destructive" | "success"
}

export default function StatsCard({ title, value, subtitle, icon: Icon, variant = "default" }: Props) {
  const colors = {
    default: "text-primary bg-primary/10",
    destructive: "text-destructive bg-destructive/10",
    success: "text-green-600 bg-green-100",
  }

  return (
    <Card className="border border-hairline hover:shadow-card-hover transition-shadow rounded-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-body-sm text-muted">{title}</p>
            <p className={cn(
              "text-display-sm font-bold mt-1",
              variant === "destructive" && "text-destructive",
              variant === "success" && "text-green-600"
            )}>
              {value}
            </p>
            {subtitle && <p className="text-caption-sm text-muted mt-1">{subtitle}</p>}
          </div>
          {Icon && (
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", colors[variant])}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}