import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold font-tech transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 shadow-primary/50 hover:shadow-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-accent/50 hover:shadow-accent/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 shadow-destructive/50 hover:shadow-destructive/80",
        outline: "text-foreground border-primary/50 hover:border-primary text-glow-primary",
        success: "border-transparent bg-success text-success-foreground hover:bg-success/80 shadow-success/50 hover:shadow-success/80",
        neon: "border-primary bg-primary/20 text-primary shadow-primary/30 hover:shadow-primary/60 animate-neon-pulse",
        cyber: "border-accent bg-accent/20 text-accent shadow-accent/30 hover:shadow-accent/60",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
