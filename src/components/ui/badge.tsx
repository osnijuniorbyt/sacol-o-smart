import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-danger-muted text-red-700",
        success: "border-transparent bg-success-muted text-green-700",
        warning: "border-transparent bg-warning-muted text-amber-700",
        info: "border-transparent bg-info-muted text-blue-700",
        outline: "text-foreground border-border",
        // Pastel variants for MD3
        "success-pastel": "border-transparent bg-green-50 text-green-700",
        "warning-pastel": "border-transparent bg-amber-50 text-amber-700",
        "danger-pastel": "border-transparent bg-red-50 text-red-700",
        "info-pastel": "border-transparent bg-blue-50 text-blue-700",
        "neutral-pastel": "border-transparent bg-gray-100 text-gray-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />;
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
