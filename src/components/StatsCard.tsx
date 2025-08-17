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
  // Special handling for PNL % and PNL $ to determine color based on actual value
  const isFinancialMetric = title === "PNL %" || title === "PNL $";
  
  // For financial metrics, determine positivity based on the actual value
  let isPositive = positive;
  let isNegative = false;
  
  if (isFinancialMetric) {
    const valueStr = typeof value === 'string' ? value : value.toString();
    // Extract numeric value, handling cases like "+$100.00" or "-$50.00"
    const numericValue = parseFloat(valueStr.replace(/[^\d.-]/g, "")) || 0;
    isPositive = numericValue >= 0;
    isNegative = numericValue < 0;
  } else {
    // For other cards, use the passed positive prop or determine from value
    isPositive = typeof value === 'string' 
      ? (value.startsWith('+') || (parseFloat(value) || 0) > 0)
      : value > 0;
    
    isNegative = typeof value === 'string' 
      ? (value.startsWith('-') || (parseFloat(value) || 0) < 0)
      : value < 0;
  }

  return (
    <Card className={cn("bg-card border-border hover:bg-card/80 transition-all duration-200", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wide">{title}</p>
            <p className={cn(
              "text-2xl font-bold",
              isFinancialMetric 
                ? (isPositive ? "text-success" : "text-destructive")
                : (isPositive ? "text-success" : isNegative ? "text-destructive" : "text-foreground")
            )}>
              {value}
            </p>
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
              isFinancialMetric 
                ? (isPositive ? "text-success" : "text-destructive")
                : (isPositive ? "text-success" : isNegative ? "text-destructive" : "text-muted-foreground")
            )}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}