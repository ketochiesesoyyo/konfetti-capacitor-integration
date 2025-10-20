import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[120px] w-full rounded-2xl border-2 border-border/50 bg-card px-4 py-3 text-sm ring-offset-background shadow-xs transition-all duration-300 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary/50 focus-visible:shadow-soft focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
