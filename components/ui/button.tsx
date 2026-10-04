import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-body-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-brand-lime text-ink font-semibold shadow-tactile hover:bg-brand-limeHover hover:shadow-tactile-hover border border-[#BDE82B]/60",
        secondary:
          "bg-surface text-ink border border-border hover:bg-surface-muted hover:border-[#D5D2C8] shadow-tactile",
        outline:
          "border border-border bg-transparent text-ink hover:bg-surface hover:border-[#D5D2C8]",
        ghost:
          "text-ink hover:bg-surface hover:text-ink",
        destructive:
          "bg-status-conflicting text-white hover:bg-[#C23B3B] shadow-tactile",
        dark:
          "bg-ink text-surface shadow-tactile-dark hover:bg-[#202219] border border-ink/40 font-semibold",
        link:
          "text-ink underline-offset-4 hover:underline p-0 h-auto font-medium",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3.5 text-body-xs",
        lg: "h-12 px-7 text-body-lg font-semibold",
        icon: "h-10 w-10 p-0 rounded-full",
        iconSm: "h-8 w-8 p-0 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
