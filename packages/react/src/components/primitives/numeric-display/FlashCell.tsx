import { forwardRef, useEffect, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export interface FlashCellProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  value: unknown;
  children: ReactNode;
  compare?: (prev: unknown, next: unknown) => number;
  isEqual?: (a: unknown, b: unknown) => boolean;
  duration?: number;
}

export const FlashCell = forwardRef<HTMLDivElement, FlashCellProps>(function FlashCell(
  { value, children, compare, isEqual = Object.is, duration = 300, ...rest },
  ref,
) {
  const prevValue = useRef(value);
  const [flash, setFlash] = useState<"up" | "down" | undefined>(undefined);

  useEffect(() => {
    const prev = prevValue.current;
    prevValue.current = value;
    if (isEqual(prev, value)) return;

    const direction: "up" | "down" = compare ? (compare(prev, value) <= 0 ? "up" : "down") : "up";
    setFlash(direction);
    const timer = setTimeout(() => setFlash(undefined), duration);
    return () => clearTimeout(timer);
  }, [value, compare, isEqual, duration]);

  return (
    <div ref={ref} data-flash={flash} {...rest}>
      {children}
    </div>
  );
});
