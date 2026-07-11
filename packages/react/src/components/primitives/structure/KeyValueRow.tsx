import { forwardRef, useId } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export interface KeyValueRowProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  label: ReactNode;
  value: ReactNode;
  tooltip?: ReactNode;
}

// Tooltip lives in the sibling overlay/ folder (built concurrently, not importable yet);
// fall back to a native title attr + aria-describedby until real Tooltip wiring lands.
export const KeyValueRow = forwardRef<HTMLDivElement, KeyValueRowProps>(function KeyValueRow(
  { label, value, tooltip, ...rest },
  ref,
) {
  const tooltipId = useId();
  const hasTooltip = tooltip !== undefined;
  return (
    <div
      ref={ref}
      data-kv-row
      title={typeof tooltip === "string" ? tooltip : undefined}
      aria-describedby={hasTooltip ? tooltipId : undefined}
      {...rest}
    >
      <span data-part="label">{label}</span>
      <span data-part="value">{value}</span>
      {hasTooltip && (
        <span data-part="tooltip" id={tooltipId}>
          {tooltip}
        </span>
      )}
    </div>
  );
});
