import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, CSSProperties } from "react";

export interface SkeletonProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  width?: number | string;
  height?: number | string;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { width, height, style, ...rest },
  ref,
) {
  const mergedStyle: CSSProperties = { ...style, width, height };
  return <div ref={ref} data-loading style={mergedStyle} {...rest} />;
});
