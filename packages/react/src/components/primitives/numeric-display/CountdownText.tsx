import { forwardRef, useEffect, useState } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { formatCountdown } from "@perpetua/core";

export interface CountdownTextProps extends Omit<ComponentPropsWithoutRef<"span">, "children"> {
  target: number;
}

export const CountdownText = forwardRef<HTMLSpanElement, CountdownTextProps>(function CountdownText(
  { target, ...rest },
  ref,
) {
  const [now, setNow] = useState(() => Date.now());
  const expired = now >= target;

  useEffect(() => {
    if (Date.now() >= target) return;
    const interval = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= target) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [target]);

  return (
    <span ref={ref} data-expired={expired ? "" : undefined} {...rest}>
      {formatCountdown(target, now)}
    </span>
  );
});
