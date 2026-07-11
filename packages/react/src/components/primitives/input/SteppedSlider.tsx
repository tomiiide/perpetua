import { forwardRef, useEffect, useState } from "react";
import type { ChangeEvent, ComponentPropsWithoutRef, KeyboardEvent } from "react";
import * as Slider from "@radix-ui/react-slider";

export interface SteppedSliderProps extends Omit<ComponentPropsWithoutRef<"div">, "children" | "onChange"> {
  value: number;
  onValueChange: (v: number) => void;
  min: number;
  max: number;
  steps?: number[];
  disabled?: boolean;
}

function nearestStep(value: number, steps: number[]): number {
  return steps.reduce((closest, s) => (Math.abs(s - value) < Math.abs(closest - value) ? s : closest), steps[0] as number);
}

export const SteppedSlider = forwardRef<HTMLDivElement, SteppedSliderProps>(function SteppedSlider(
  { value, onValueChange, min, max, steps, disabled = false, ...rest },
  ref,
) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(value));
  }, [value]);

  const commit = (next: number) => {
    const clamped = Math.min(max, Math.max(min, next));
    const snapped = steps && steps.length > 0 ? nearestStep(clamped, steps) : clamped;
    onValueChange(snapped);
  };

  const handleInputCommit = () => {
    const parsed = Number(text);
    if (Number.isFinite(parsed)) {
      commit(parsed);
    } else {
      setText(String(value));
    }
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") e.currentTarget.blur();
  };

  return (
    <div ref={ref} data-stepped-slider {...rest}>
      <Slider.Root
        data-slider-root
        min={min}
        max={max}
        disabled={disabled}
        value={[value]}
        onValueChange={(v) => {
          const next = v[0];
          if (next !== undefined) commit(next);
        }}
      >
        <Slider.Track data-slider-track>
          <Slider.Range data-slider-range />
        </Slider.Track>
        {steps?.map((s) => <span key={s} data-slider-detent style={{ left: `${((s - min) / (max - min)) * 100}%` }} />)}
        <Slider.Thumb data-slider-thumb />
      </Slider.Root>
      <input
        type="text"
        inputMode="decimal"
        data-slider-readout
        disabled={disabled}
        value={text}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
        onBlur={handleInputCommit}
        onKeyDown={handleInputKeyDown}
      />
    </div>
  );
});
