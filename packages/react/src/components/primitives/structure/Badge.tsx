import { forwardRef } from "react";
import type { ComponentPropsWithoutRef } from "react";

export interface BadgeProps extends ComponentPropsWithoutRef<"span"> {
  variant?: string;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { variant, children, ...rest },
  ref,
) {
  return (
    <span ref={ref} data-badge data-variant={variant} {...rest}>
      {children}
    </span>
  );
});
