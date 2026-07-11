import { forwardRef } from "react";
import type { ComponentPropsWithoutRef } from "react";
import type { Side } from "@perpetua/core";

export interface SideToggleProps extends Omit<ComponentPropsWithoutRef<"div">, "children" | "onChange"> {
  value: Side;
  onValueChange: (v: Side) => void;
  labels?: Record<Side, string>;
}

const DEFAULT_LABELS: Record<Side, string> = { buy: "Buy", sell: "Sell" };

export const SideToggle = forwardRef<HTMLDivElement, SideToggleProps>(function SideToggle(
  { value, onValueChange, labels = DEFAULT_LABELS, ...rest },
  ref,
) {
  return (
    <div ref={ref} role="radiogroup" data-side={value} {...rest}>
      {(["buy", "sell"] as const).map((side) => (
        <button
          key={side}
          type="button"
          role="radio"
          aria-checked={value === side}
          data-value={side}
          onClick={() => onValueChange(side)}
        >
          {labels[side]}
        </button>
      ))}
    </div>
  );
});
