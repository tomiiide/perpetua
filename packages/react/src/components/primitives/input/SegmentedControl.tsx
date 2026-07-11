import { forwardRef, useRef } from "react";
import type { ComponentPropsWithoutRef, KeyboardEvent, ReactNode } from "react";

export interface SegmentedControlOption {
  value: string;
  label: ReactNode;
}

export interface SegmentedControlProps extends Omit<ComponentPropsWithoutRef<"div">, "children" | "onChange"> {
  options: SegmentedControlOption[];
  value: string;
  onValueChange: (v: string) => void;
}

export const SegmentedControl = forwardRef<HTMLDivElement, SegmentedControlProps>(function SegmentedControl(
  { options, value, onValueChange, ...rest },
  ref,
) {
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const focusAndSelect = (index: number) => {
    const option = options[index];
    if (!option) return;
    onValueChange(option.value);
    buttonRefs.current.get(option.value)?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      focusAndSelect((index + 1) % options.length);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      focusAndSelect((index - 1 + options.length) % options.length);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusAndSelect(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusAndSelect(options.length - 1);
    }
  };

  return (
    <div ref={ref} role="radiogroup" data-segmented-control {...rest}>
      {options.map((option, index) => {
        const checked = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              if (el) buttonRefs.current.set(option.value, el);
              else buttonRefs.current.delete(option.value);
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            data-value={option.value}
            data-state={checked ? "checked" : "unchecked"}
            onClick={() => onValueChange(option.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
});
