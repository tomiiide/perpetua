import { forwardRef } from "react";
import type { ComponentPropsWithoutRef } from "react";

export interface SparklineProps
  extends Omit<ComponentPropsWithoutRef<"svg">, "children" | "width" | "height" | "values"> {
  values: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
}

export const Sparkline = forwardRef<SVGSVGElement, SparklineProps>(function Sparkline(
  { values, width = 64, height = 20, strokeWidth = 1.5, ...rest },
  ref,
) {
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const range = max - min || 1;
  const step = values.length > 1 ? width / (values.length - 1) : 0;

  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });

  return (
    <svg
      ref={ref}
      data-sparkline
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      {...rest}
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
});
