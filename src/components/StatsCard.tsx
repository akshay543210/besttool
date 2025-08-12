import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string | number
  change?: string
  positive?: boolean
  icon?: React.ReactNode
  className?: string
}

export function StatsCard({ title, value, change, positive, icon, className }: StatsCardProps) {
  return (
    <Card className={cn("bg-card border-border hover:bg-card/80 transition-all duration-200", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {change && (
              <p className={cn(
                "text-sm font-medium",
                positive ? "text-success" : "text-destructive"
              )}>
                {change}
              </p>
            )}
          </div>
          {icon && (
            <div className={cn(
              "transition-colors duration-200",
              positive ? "text-success" : change ? "text-destructive" : "text-muted-foreground"
            )}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}