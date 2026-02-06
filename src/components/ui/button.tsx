import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary = #E8920B (laranja) para ações principais
        default: "bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:brightness-110",
        // Destructive
        destructive: "bg-danger text-danger-foreground hover:bg-danger/90 shadow-md",
        // Outline = borda verde escuro #1B4332
        outline: "border-2 border-accent bg-background hover:bg-accent/10 text-accent",
        // Secondary = borda #1B4332, texto #1B4332
        secondary: "bg-background border-2 border-accent text-accent hover:bg-accent/10",
        // Ghost - subtle hover
        ghost: "hover:bg-accent/10 hover:text-accent",
        // Link
        link: "text-primary underline-offset-4 hover:underline",
        // Success - verde claro #2D6A4F
        success: "bg-success text-success-foreground hover:bg-success/90 shadow-md",
        // Warning - laranja
        warning: "bg-warning text-warning-foreground hover:bg-warning/90 shadow-md",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
