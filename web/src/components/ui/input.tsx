/* eslint-disable @repo/no-style-props */
import * as React from "react";

import { t } from "@/src/features/i18n";
import { cn } from "@/src/utils/tailwind";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  allowPasswordManager?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type, allowPasswordManager = false, placeholder, ...props },
    ref,
  ) => {
    return (
      <input
        {...(!allowPasswordManager && { "data-1p-ignore": true })}
        type={type}
        placeholder={
          typeof placeholder === "string" ? t(placeholder) : placeholder
        }
        className={cn(
          "border-input bg-background placeholder:text-foreground-tertiary disabled:bg-muted/50 flex h-8 w-full min-w-14 rounded-md border px-2 py-1 text-sm file:border-0 file:bg-transparent file:text-sm file:font-bold focus:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
