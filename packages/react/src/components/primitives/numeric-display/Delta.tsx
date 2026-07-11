import { forwardRef } from "react";
import type { ComponentPropsWithoutRef } from "react";
import type { Dec, FormattedParts } from "@perpetua/core";
import { decIsNegative, decIsPositive, formatDelta } from "@perpetua/core";

export interface DeltaProps extends Omit<ComponentPropsWithoutRef<"span">, "children"> {
  value: Dec;
  locale?: string;
}

export const Delta = forwardRef<HTMLSpanElement, DeltaProps>(function Delta(
  { value, locale, ...rest },
  ref,
) {
  const parts: FormattedParts = formatDelta(value, locale);
  const state: "up" | "down" | "flat" = decIsPositive(value)
    ? "up"
    : decIsNegative(value)
      ? "down"
      : "flat";
  return (
    <span ref={ref} data-num data-delta={state} {...rest}>
      <span data-part="sign">{parts.sign}</span>
      <span data-part="int">{parts.int}</span>
      {parts.frac && <span data-part="frac">.{parts.frac}</span>}
      {parts.unit && <span data-part="unit">{parts.unit}</span>}
    </span>
  );
});
