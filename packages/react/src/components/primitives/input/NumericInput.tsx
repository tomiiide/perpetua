import { forwardRef } from "react";
import type { ChangeEvent, ComponentPropsWithoutRef, FocusEvent, KeyboardEvent } from "react";
import type { Dec, RoundMode } from "@perpetua/core";
import { ZERO, dec, decAdd, decGt, decLt, decRoundToStep, decSub, decToString } from "@perpetua/core";

function sanitize(raw: string, allowNegative: boolean): string {
  let result = "";
  let seenDot = false;
  for (const ch of raw) {
    if (ch >= "0" && ch <= "9") {
      result += ch;
    } else if (ch === "." && !seenDot) {
      seenDot = true;
      result += ch;
    } else if (ch === "-" && allowNegative && result === "") {
      result += ch;
    }
  }
  return result;
}

function tryParse(raw: string): Dec | null {
  if (raw === "" || raw === "-" || raw === "." || raw === "-.") return null;
  try {
    return dec(raw);
  } catch {
    return null;
  }
}

export interface NumericInputProps
  extends Omit<ComponentPropsWithoutRef<"input">, "value" | "onChange" | "min" | "max" | "step" | "type"> {
  value: string;
  onChange: (raw: string) => void;
  onValueChange?: (parsed: Dec | null) => void;
  min?: Dec;
  max?: Dec;
  step?: Dec;
  roundStep?: Dec;
  roundMode?: RoundMode;
  allowNegative?: boolean;
}

export const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(function NumericInput(
  {
    value,
    onChange,
    onValueChange,
    min,
    max,
    step,
    roundStep,
    roundMode = "nearest",
    allowNegative = false,
    onBlur,
    onKeyDown,
    ...rest
  },
  ref,
) {
  const clamp = (v: Dec): Dec => {
    let result = v;
    if (roundStep) result = decRoundToStep(result, roundStep, roundMode);
    if (min && decLt(result, min)) result = min;
    if (max && decGt(result, max)) result = max;
    return result;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitize(e.target.value, allowNegative);
    onChange(sanitized);
    onValueChange?.(tryParse(sanitized));
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const parsed = tryParse(value);
    if (parsed) {
      const clamped = clamp(parsed);
      onChange(decToString(clamped));
      onValueChange?.(clamped);
    }
    onBlur?.(e);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (step && !e.defaultPrevented && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
      const current = tryParse(value) ?? ZERO;
      const next = clamp(e.key === "ArrowUp" ? decAdd(current, step) : decSub(current, step));
      onChange(decToString(next));
      onValueChange?.(next);
    }
  };

  return (
    <input
      ref={ref}
      type="text"
      inputMode="decimal"
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      {...rest}
    />
  );
});
