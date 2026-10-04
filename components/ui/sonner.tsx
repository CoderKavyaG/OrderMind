"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-surface group-[.toaster]:text-ink group-[.toaster]:border-border group-[.toaster]:shadow-floating group-[.toaster]:rounded-card",
          description: "group-[.toast]:text-ink-muted",
          actionButton:
            "group-[.toast]:bg-brand-lime group-[.toast]:text-ink group-[.toast]:font-semibold group-[.toast]:rounded-full",
          cancelButton:
            "group-[.toast]:bg-surface-muted group-[.toast]:text-ink-muted group-[.toast]:rounded-full",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
