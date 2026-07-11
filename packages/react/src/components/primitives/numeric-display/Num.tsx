import { forwardRef } from "react";
import type { ComponentPropsWithoutRef } from "react";
import type { Dec, FormattedParts } from "@perpetua/core";

export interface NumProps extends Omit<ComponentPropsWithoutRef<"span">, "children"> {
  parts?: FormattedParts;
  value?: Dec;
  format?: (v: Dec) => FormattedParts;
}

export const Num = forwardRef<HTMLSpanElement, NumProps>(function Num(
  { parts, value, format, ...rest },
  ref,
) {
  const resolved = parts ?? (value !== undefined && format ? format(value) : undefined);
  if (!resolved) {
    throw new Error("Num requires either `parts` or both `value` and `format`");
  }
  return (
    <span ref={ref} data-num {...rest}>
      <span data-part="sign">{resolved.sign}</span>
      <span data-part="int">{resolved.int}</span>
      {resolved.frac && <span data-part="frac">.{resolved.frac}</span>}
      {resolved.unit && <span data-part="unit">{resolved.unit}</span>}
    </span>
  );
});
