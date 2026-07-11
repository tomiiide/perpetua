import { forwardRef } from "react";
import type { ComponentPropsWithoutRef } from "react";

export interface MeterThresholds {
  warn: number;
  danger: number;
}

export interface MeterProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  value: number;
  thresholds?: MeterThresholds;
}

const DEFAULT_THRESHOLDS: MeterThresholds = { warn: 70, danger: 90 };

// value is treated as "how far toward danger" (e.g. margin usage %), so higher = worse.
function healthFor(value: number, thresholds: MeterThresholds): "safe" | "warn" | "danger" {
  if (value >= thresholds.danger) return "danger";
  if (value >= thresholds.warn) return "warn";
  return "safe";
}

export const Meter = forwardRef<HTMLDivElement, MeterProps>(function Meter(
  { value, thresholds = DEFAULT_THRESHOLDS, ...rest },
  ref,
) {
  const clamped = Math.min(100, Math.max(0, value));
  const health = healthFor(clamped, thresholds);
  return (
    <div
      ref={ref}
      data-meter
      data-health={health}
      role="meter"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      {...rest}
    >
      <div data-part="fill" style={{ width: `${clamped}%` }} />
    </div>
  );
});
