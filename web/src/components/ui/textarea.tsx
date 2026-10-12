/* eslint-disable @repo/no-style-props */
import * as React from "react";

import { t } from "@/src/features/i18n";
import { cn } from "@/src/utils/tailwind";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, placeholder, ...props }, ref) => {
    return (
      <textarea
        placeholder={
          typeof placeholder === "string" ? t(placeholder) : placeholder
        }
        className={cn(
          "border-input bg-background ring-offset-background placeholder:text-foreground-tertiary focus-visible:ring-ring disabled:bg-muted/50 flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
