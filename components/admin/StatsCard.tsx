import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Props {
  title: string
  value: string
  variant?: "default" | "destructive"
}

export default function StatsCard({ title, value, variant = "default" }: Props) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className={cn("text-3xl font-bold mt-1", variant === "destructive" && "text-destructive")}>
          {value}
        </p>
      </CardContent>
    </Card>
  )
}
