import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type StatusDotStatus = "connecting" | "live" | "stale" | "resyncing" | "error";

export interface StatusDotProps extends Omit<ComponentPropsWithoutRef<"span">, "children"> {
  status: StatusDotStatus;
  label?: ReactNode;
}

export const StatusDot = forwardRef<HTMLSpanElement, StatusDotProps>(function StatusDot(
  { status, label, ...rest },
  ref,
) {
  return (
    <span ref={ref} data-status={status} aria-label={label === undefined ? status : undefined} {...rest}>
      {label !== undefined && <span data-part="label">{label}</span>}
    </span>
  );
});
