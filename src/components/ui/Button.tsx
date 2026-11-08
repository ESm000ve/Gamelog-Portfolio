import React, { forwardRef } from "react";
import { Loader2 } from "../icons";

import "./Button.css";
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { children, variant, size = "md", loading, disabled, style, className, ...props },
  ref
) {
  const actualVariant = variant ?? "primary";

  return (
    <button
      ref={ref}
      type="button"
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={["btn", "btn-" + actualVariant, "btn-" + size, className]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      {loading && <Loader2 size={16} className="btn-spinner" />}
      {children}
    </button>
  );
});
