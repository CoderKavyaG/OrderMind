import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-body-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brand-lime text-ink font-semibold",
        secondary:
          "border-border bg-surface text-ink",
        outline:
          "border-border text-ink bg-transparent",
        dark:
          "border-transparent bg-ink text-surface font-medium",
        muted:
          "border-transparent bg-surface-muted text-ink-muted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
