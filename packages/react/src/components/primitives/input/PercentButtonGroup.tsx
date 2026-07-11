import { forwardRef } from "react";
import type { ComponentPropsWithoutRef } from "react";

export interface PercentButtonGroupProps extends Omit<ComponentPropsWithoutRef<"div">, "children" | "onSelect"> {
  presets?: number[];
  labels?: Record<number, string>;
  selected?: number;
  onSelect: (pct: number) => void;
}

const DEFAULT_PRESETS = [25, 50, 75, 100];

export const PercentButtonGroup = forwardRef<HTMLDivElement, PercentButtonGroupProps>(function PercentButtonGroup(
  { presets = DEFAULT_PRESETS, labels, selected, onSelect, ...rest },
  ref,
) {
  return (
    <div ref={ref} data-percent-button-group role="group" {...rest}>
      {presets.map((pct) => (
        <button
          key={pct}
          type="button"
          data-pct={pct}
          aria-pressed={selected !== undefined ? selected === pct : undefined}
          onClick={() => onSelect(pct)}
        >
          {labels?.[pct] ?? (pct === 100 ? "Max" : `${pct}%`)}
        </button>
      ))}
    </div>
  );
});
